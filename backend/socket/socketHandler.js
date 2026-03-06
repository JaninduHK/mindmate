export const socketHandler = (io) => {
    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        // Join user to their individual room
        socket.on('join_room', (userId) => {
            socket.join(userId);
            console.log(`User ${userId} joined room ${userId}`);
            // Notify others that user came online
            socket.broadcast.emit('user_online', { userId });
        });

        // Send message to recipient
        socket.on('send_message', (messageData) => {
            const { senderId, recipientId, message, time, sender } = messageData;
            console.log(`Message from ${senderId} to ${recipientId}:`, message);
            
            // Send to recipient's room
            io.to(recipientId).emit('receive_message', {
                senderId,
                sender,
                message,
                time,
                recipientId
            });
        });

        // Typing indicator
        socket.on('typing', ({ senderId, recipientId }) => {
            io.to(recipientId).emit('typing', { senderId });
        });

        // Stop typing
        socket.on('stop_typing', ({ senderId, recipientId }) => {
            io.to(recipientId).emit('stop_typing', { senderId });
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });
};