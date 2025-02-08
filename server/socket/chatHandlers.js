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
                        
                        // Get chat with populated participants
                        const chat = await Chat.findById(chatId)
                            .populate('users', 'name email isOnline lastSeen');
                        
                        if (chat) {
                            // Find other participant
                            const otherParticipant = chat.users.find(
                                p => p._id.toString() !== userId.toString()
                            );

                            // Emit initial online status to the joining user
                            if (otherParticipant) {
                                socket.emit('user online', {
                                    userId: otherParticipant._id,
                                    isOnline: otherParticipant.isOnline
                                });
                            }

                            // Notify other participants that this user is online
                            socket.to(chatId).emit('user online', {
                                userId: userId,
                                isOnline: true
                            });

                            console.log(`User ${userId} joined chat room:`, {
                                chatId,
                                socketId: socket.id,
                                otherParticipant: otherParticipant?._id
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
                    
                    // Verify if socket is in the chat room
                    if (!socket.rooms.has(chatId)) {
                        console.log('Rejoining chat room');
                        socket.join(chatId);
                    }

                    console.log('New message:', {
                        chatId,
                        content,
                        senderId: userId,
                        rooms: Array.from(socket.rooms)
                    });
            
                    // Create new message
                    const newMessage = await Message.create({
                        sender: userId,
                        content,
                        chat: chatId
                    });

                    // Increment unread count for other users
                    await Chat.findOneAndUpdate(
                        { _id: chatId },
                        {
                            $inc: {
                                'unreadCounts.$[other].count': 1
                            }
                        },
                        {
                            arrayFilters: [{ 'other.user': { $ne: userId } }]
                        }
                    );
            
                    const user = await User.findById(userId).select('name email');
                    
                    const messageData = {
                        _id: newMessage._id,
                        content: content,
                        sender: {
                            _id: userId,
                            name: user.name,
                            email: user.email
                        },
                        chatId: chatId,
                        createdAt: newMessage.createdAt,
                        readBy: [{ user: userId, readAt: new Date() }],
                        isRead: false
                    };

                    // Get updated unread counts
                    const updatedChat = await Chat.findById(chatId);

                    // Broadcast to all sockets in the room including sender
                    console.log(`Broadcasting to room ${chatId}`);
                    io.to(chatId).emit('message received', messageData);
                    updatedChat.unreadCounts.forEach(({user: recipientId, count}) => {
                        if (recipientId.toString() !== userId) {
                            io.to(recipientId.toString()).emit('unread count updated', {
                                chatId,
                                count
                            });
                        }
                    });
            
                } catch (error) {
                    console.error('New message error:', error);
                    socket.emit('message error', { error: 'Failed to send message' });
                }
            });

            // Handle message received/read acknowledgment
            socket.on('message received', async ({ messageId, chatId }) => {
                try {
                    // Decrement unread count by 1 for the current user
                    await Chat.findOneAndUpdate(
                        { 
                            _id: chatId,
                            'unreadCounts.user': userId
                        },
                        {
                            $inc: { 'unreadCounts.$.count': -1 }
                        }
                    );

                    // Update message read receipt
                    await Message.findByIdAndUpdate(messageId, {
                        $addToSet: {
                            readBy: {
                                user: userId,
                                readAt: new Date()
                            }
                        }
                    });

                    // Get and emit updated count
                    const chat = await Chat.findById(chatId);
                    const userCount = chat.unreadCounts.find(
                        uc => uc.user.toString() === userId
                    );
                    
                    socket.emit('unread count updated', {
                        chatId,
                        count: userCount ? userCount.count : 0
                    });

                } catch (error) {
                    console.error('Message received error:', error);
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

            // Handle mark all as read
            socket.on('mark read', async ({ chatId }) => {
                try {
                    console.log(`Marking messages as read in chat ${chatId} by user ${userId}`);
                    
                    // Reset unread count to 0 for current user
                    await Chat.findOneAndUpdate(
                        { 
                            _id: chatId,
                            'unreadCounts.user': userId 
                        },
                        {
                            $set: { 'unreadCounts.$.count': 0 }
                        }
                    );

                    // Update all unread messages in this chat
                    const result = await Message.updateMany(
                        {
                            chat: chatId,
                            'readBy.user': { $ne: userId }
                        },
                        {
                            $addToSet: {
                                readBy: {
                                    user: userId,
                                    readAt: new Date()
                                }
                            }
                        }
                    );

                    // Emit updates
                    io.to(chatId).emit('messages read', { chatId, userId });
                    socket.emit('unread count updated', {
                        chatId,
                        count: 0
                    });

                } catch (error) {
                    console.error('Mark read error:', error);
                    socket.emit('error', { message: 'Failed to mark messages as read' });
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