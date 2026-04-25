import Message from '../models/message.model.js';
import User from '../models/User.model.js';
import { sendNotification } from '../services/notification.service.js';

export const socketHandler = (io) => {
    io.on('connection', (socket) => {
        console.log('✅ New client connected:', socket.id);

        // Join user to their individual room
        socket.on('join_room', (userId) => {
            socket.join(userId);
            console.log(`📍 User ${userId} joined room ${userId} (Socket: ${socket.id})`);
            socket.broadcast.emit('user_online', { userId });
        });

        // Join user to a group room
        socket.on('join_group_room', (groupId) => {
            socket.join(`group_${groupId}`);
            console.log(`📍 User joined group room: group_${groupId} (Socket: ${socket.id})`);
            // Notify all group members that user joined
            io.to(`group_${groupId}`).emit('user_joined_group', { groupId });
        });

        // Leave group room
        socket.on('leave_group_room', (groupId) => {
            socket.leave(`group_${groupId}`);
            console.log(`👋 User left group room: group_${groupId} (Socket: ${socket.id})`);
            io.to(`group_${groupId}`).emit('user_left_group', { groupId });
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

                // Create notification for recipient
                const senderUser = await User.findById(senderId).select('name');
                const senderName = senderUser?.name || 'Someone';
                const preview = message.length > 60 ? message.slice(0, 57) + '...' : message;

                await sendNotification({
                    userId: recipientId,
                    type: 'new_message',
                    title: `New message from ${senderName}`,
                    message: preview,
                    data: { senderId, messageId: savedMessage._id },
                });

                // Push real-time notification badge update to recipient
                io.to(recipientId).emit('new_notification', {
                    type: 'new_message',
                    title: `New message from ${senderName}`,
                    message: preview,
                    senderId,
                    createdAt: new Date(),
                    isRead: false,
                });

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

        // Send message to group
        socket.on('send_group_message', async (messageData) => {
            const { senderId, groupId, message, time, sender } = messageData;
            console.log(`📤 Group message from ${senderId} to group ${groupId}:`, message);

            try {
                // Save message to database
                const savedMessage = await Message.create({
                    senderId,
                    recipientId: groupId, // Use groupId as recipientId
                    message,
                });

                console.log(`✅ Group message saved with ID: ${savedMessage._id}`);

                // Emit to all members in the group room
                io.to(`group_${groupId}`).emit('receive_group_message', {
                    _id: savedMessage._id,
                    senderId,
                    sender,
                    message,
                    time,
                    groupId,
                    createdAt: savedMessage.createdAt,
                    isEdited: false,
                });

                console.log(`📨 Group message delivered to all members`);
            } catch (error) {
                console.error('❌ Error saving group message:', error);
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