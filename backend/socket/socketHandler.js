import Message from '../models/message.model.js';

export const socketHandler = (io) => {
    io.on('connection', (socket) => {
        console.log('✅ New client connected:', socket.id);

        // Join user to their individual room
        socket.on('join_room', (userId) => {
            socket.join(userId);
            console.log(`📍 User ${userId} joined room ${userId} (Socket: ${socket.id})`);
            socket.broadcast.emit('user_online', { userId });
        });

        // Send message to recipient
        socket.on('send_message', async (messageData) => {
            const { senderId, recipientId, message, time, sender } = messageData;
            console.log(`📤 Message from ${senderId} to ${recipientId}:`, message);
            
            try {
                // Save message to database
                const savedMessage = await Message.create({
                    senderId,
                    recipientId,
                    message,
                });

                console.log(`✅ Message saved with ID: ${savedMessage._id}`);

                // Send to recipient's room
                io.to(recipientId).emit('receive_message', {
                    _id: savedMessage._id,
                    senderId,
                    sender,
                    message,
                    time,
                    recipientId,
                    createdAt: savedMessage.createdAt,
                    isEdited: false,
                    readAt: null,
                });
                
                // Send back to the sender so it shows up in their chat window instantly
                socket.emit('receive_message', {
                    _id: savedMessage._id,
                    senderId,
                    sender,
                    message,
                    time,
                    recipientId,
                    createdAt: savedMessage.createdAt,
                    isEdited: false,
                    readAt: null,
                });

                console.log(`📨 Message delivered to both sender and recipient`);
            } catch (error) {
                console.error('❌ Error saving message:', error);
                socket.emit('message_error', { error: 'Failed to save message' });
            }
        });

        // Edit message
        socket.on('edit_message', async (data) => {
            const { messageId, newMessage, senderId, recipientId } = data;
            console.log(`Editing message ${messageId}:`, newMessage);

            try {
                const message = await Message.findById(messageId);
                if (!message) {
                    socket.emit('message_error', { error: 'Message not found' });
                    return;
                }

                if (message.senderId.toString() !== senderId) {
                    socket.emit('message_error', { error: 'Unauthorized' });
                    return;
                }

                message.message = newMessage;
                message.isEdited = true;
                message.editedAt = new Date();
                await message.save();

                // Notify both users
                io.to(senderId).emit('message_edited', {
                    messageId,
                    newMessage,
                    editedAt: message.editedAt,
                });
                io.to(recipientId).emit('message_edited', {
                    messageId,
                    newMessage,
                    editedAt: message.editedAt,
                });
            } catch (error) {
                console.error('Error editing message:', error);
                socket.emit('message_error', { error: 'Failed to edit message' });
            }
        });

        // Delete message
        socket.on('delete_message', async (data) => {
            const { messageId, userId, recipientId } = data;
            console.log(`Deleting message ${messageId}`);

            try {
                const message = await Message.findById(messageId);
                if (!message) {
                    socket.emit('message_error', { error: 'Message not found' });
                    return;
                }

                if (message.senderId.toString() !== userId && message.recipientId.toString() !== userId) {
                    socket.emit('message_error', { error: 'Unauthorized' });
                    return;
                }

                message.deletedAt = new Date();
                message.deletedBy = userId;
                await message.save();

                // Notify both users
                io.to(userId).emit('message_deleted', { messageId });
                io.to(recipientId).emit('message_deleted', { messageId });
            } catch (error) {
                console.error('Error deleting message:', error);
                socket.emit('message_error', { error: 'Failed to delete message' });
            }
        });

        // Mark message as read
        socket.on('mark_read', async (data) => {
            const { messageId, userId, senderId } = data;
            console.log(`✓ Marking message ${messageId} as read by ${userId}`);

            try {
                const message = await Message.findById(messageId);
                if (!message) {
                    socket.emit('message_error', { error: 'Message not found' });
                    return;
                }

                if (!message.readAt) {
                    message.readAt = new Date();
                    await message.save();
                    console.log(`✅ Message ${messageId} marked as read`);
                }

                // Notify sender that message was read
                io.to(senderId).emit('message_read', {
                    messageId,
                    readAt: message.readAt,
                });
            } catch (error) {
                console.error('❌ Error marking message as read:', error);
            }
        });

        // Typing indicator
        socket.on('typing', ({ senderId, recipientId }) => {
            console.log(`✏️  ${senderId} is typing to ${recipientId}`);
            io.to(recipientId).emit('typing', { senderId });
        });

        // Stop typing
        socket.on('stop_typing', ({ senderId, recipientId }) => {
            console.log(`⏹️  ${senderId} stopped typing`);
            io.to(recipientId).emit('stop_typing', { senderId });
        });

        socket.on('disconnect', (reason) => {
            console.log('🔌 Client disconnected:', socket.id, 'Reason:', reason);
        });
    });
};