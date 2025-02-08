const Message = require('../models/Message');
const Chat = require('../models/Chat');

// Send new message
exports.sendMessage = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { content } = req.body;

        if (!content || !chatId) {
            return res.status(400).json({ error: "Please provide message content and chat ID" });
        }

        const newMessage = await Message.create({
            sender: req.user.userId,
            content,
            chat: chatId,
            readBy: [{ user: req.user.userId }]
        });

        await Chat.findByIdAndUpdate(chatId, {
            latestMessage: newMessage._id
        });

        const populatedMessage = await Message.findById(newMessage._id)
            .populate('sender', 'name email')
            .populate('chat');

        res.status(201).json(populatedMessage);
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: "Error sending message" });
    }
};

// Get messages for a chat
exports.getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify chat exists and user is a member
    const chat = await Chat.findOne({
      _id: chatId,
      users: req.user.userId
    });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found or access denied" });
    }

    const messages = await Message.find({ chat: chatId })
      .populate('sender', 'name email')
      .populate('readBy.user', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json(messages.reverse());
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Mark messages as read
exports.markMessagesAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;

    // Verify chat exists and user is a member
    const chat = await Chat.findOne({
      _id: chatId,
      users: req.user.userId
    });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found or access denied" });
    }

    await Message.updateMany(
      {
        chat: chatId,
        'readBy.user': { $ne: req.user.userId }
      },
      {
        $addToSet: {
          readBy: {
            user: req.user.userId,
            readAt: new Date()
          }
        }
      }
    );

    await Chat.findByIdAndUpdate(chatId, {
      $set: {
        'unreadCounts.$[elem].count': 0
      }
    }, {
      arrayFilters: [{ 'elem.user': req.user.userId }]
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Mark messages read error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete message
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId)
      .populate('chat')
      .populate('sender');

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    console.log('Message sender ID:', message.sender._id);
    console.log('Current user ID:', req.user.userId);

    // Compare using the sender's _id
    if (message.sender._id.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: "Can't delete other's messages" });
    }

    // Verify user is still in the chat
    const isChatMember = await Chat.exists({
      _id: message.chat._id,
      users: req.user.userId
    });

    if (!isChatMember) {
      return res.status(403).json({ message: "Access denied" });
    }

    await Message.deleteOne({ _id: message._id });

    // Update latest message in chat if needed
    if (message.chat.latestMessage?.toString() === message._id.toString()) {
      const latestMessage = await Message.findOne({ 
        chat: message.chat._id,
        _id: { $ne: message._id } // Exclude the message being deleted
      })
      .sort({ createdAt: -1 });
      
      await Chat.findByIdAndUpdate(message.chat._id, {
        latestMessage: latestMessage ? latestMessage._id : null
      });
    }

    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: error.message });
  }
};