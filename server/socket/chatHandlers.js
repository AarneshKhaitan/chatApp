const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

module.exports = (io) => {
    const connectedUsers = new Map();

    io.on('connection', async (socket) => {
        const userId = socket.user.userId;
        console.log('User connected:', userId);

        // Add user to connected users
        connectedUsers.set(userId.toString(), socket.id);

        try {
            // Update user status to online
            await User.findByIdAndUpdate(userId, { 
                isOnline: true,
                lastSeen: new Date() 
            });

            // Join personal room
            socket.join(userId.toString());

            // Notify others that user is online
            io.emit('user online', userId);

            // Join chat room
            socket.on('join chat', async (chatId) => {
                if (chatId) {
                    try {
                        socket.join(chatId);
                        const chat = await Chat.findById(chatId)
                            .populate('users', 'name email isOnline lastSeen');
                        
                        if (chat) {
                            const otherParticipant = chat.users.find(
                                p => p._id.toString() !== userId.toString()
                            );

                            if (otherParticipant) {
                                socket.emit('user online', {
                                    userId: otherParticipant._id,
                                    isOnline: otherParticipant.isOnline
                                });
                            }

                            socket.to(chatId).emit('user online', {
                                userId: userId,
                                isOnline: true
                            });
                        }
                    } catch (error) {
                        console.error('Error joining chat:', error);
                        socket.emit('error', { message: 'Failed to join chat' });
                    }
                }
            });

            // Handle new message
            socket.on('new message', async (data) => {
                try {
                    const { chatId, content } = data;
                    console.log('Server received new message:', { chatId, content, userId, socketRooms: Array.from(socket.rooms) });
                    
                    // Verify if socket is in the chat room
                    if (!socket.rooms.has(chatId)) {
                        console.log('Socket not in chat room, joining...');
                        socket.join(chatId);
                    }

                    // Create new message
                    const newMessage = await Message.create({
                        sender: userId,
                        content,
                        chat: chatId,
                        createdAt: new Date()
                    });

                    // Update chat's latest message
                    await Chat.findByIdAndUpdate(chatId, {
                        latestMessage: newMessage._id
                    });

                    console.log('Created message in DB:', newMessage);

                    // Get fully populated message
                    const populatedMessage = await Message.findById(newMessage._id)
                        .populate('sender', 'name email')
                        .populate('chat');

                    if (!populatedMessage) {
                        throw new Error('Failed to populate message');
                    }

                    const messageData = {
                        _id: populatedMessage._id,
                        content: populatedMessage.content,
                        sender: populatedMessage.sender,
                        chat: populatedMessage.chat,
                        createdAt: populatedMessage.createdAt,
                    };

                    console.log('Broadcasting message to room:', chatId, messageData);
                    
                    // Emit to all users in the chat including sender
                    io.in(chatId).emit('message received', messageData);

                } catch (error) {
                    console.error('New message error:', error);
                    socket.emit('message error', { error: error.message });
                }
            });

            // Typing indicators
            socket.on('typing', async (chatId) => {
                try {
                    if (chatId) {
                        const user = await User.findById(userId).select('name');
                        socket.to(chatId).emit('typing', {
                            chatId,
                            userId,
                            userName: user.name
                        });
                    }
                } catch (error) {
                    console.error('Typing indicator error:', error);
                }
            });

            socket.on('stop typing', (chatId) => {
                if (chatId) {
                    socket.to(chatId).emit('stop typing', {
                        chatId,
                        userId
                    });
                }
            });

            // Handle get online status
            socket.on('get online status', async (chatId) => {
                try {
                    const chat = await Chat.findById(chatId)
                        .populate('users', 'name email isOnline');
                    
                    if (chat) {
                        const onlineUsers = chat.users
                            .filter(user => user.isOnline)
                            .map(user => ({
                                _id: user._id.toString(),
                                name: user.name,
                                email: user.email,
                                isOnline: user.isOnline
                            }));

                        socket.emit('online users', onlineUsers);
                    }
                } catch (error) {
                    console.error('Error fetching online status:', error);
                }
            });

            // Handle disconnect
            socket.on('disconnect', async () => {
                try {
                    connectedUsers.delete(userId.toString());
                    
                    await User.findByIdAndUpdate(userId, {
                        isOnline: false,
                        lastSeen: new Date()
                    });

                    io.emit('user offline', userId);
                    console.log('User disconnected:', userId);
                } catch (error) {
                    console.error('Disconnect error:', error);
                }
            });

        } catch (error) {
            console.error('Socket connection error:', error);
        }
    });
};