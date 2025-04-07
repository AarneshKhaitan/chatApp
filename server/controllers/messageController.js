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
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
