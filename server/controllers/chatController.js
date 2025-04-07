const Chat = require('../models/Chat');
const User = require('../models/User');
const Message = require('../models/Message');
const mongoose = require('mongoose');

// Create new chat (1-on-1 or group)
exports.createChat = async (req, res) => {
  try {
    const { isGroupChat, users, chatName } = req.body;
    
    // Check if users array is provided and valid
    if (!users || !Array.isArray(users) || users.length < 1) {
      return res.status(400).json({ message: "Please select at least one user for the chat" });
    }

    // Ensure we have valid MongoDB ObjectIds
    const validUserIds = users.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validUserIds.length === 0) {
      return res.status(400).json({ message: "Please provide valid user IDs" });
    }

    // For 1-on-1 chat
    if (!isGroupChat) {
      if (validUserIds.length > 1) {
        return res.status(400).json({ message: "One-on-one chat can only have one other user" });
      }

      // Check if chat already exists
      const existingChat = await Chat.findOne({
        isGroupChat: false,
        users: { 
          $all: [req.user.userId, validUserIds[0]],
          $size: 2
        }
      }).populate('users', '-password')
        .populate('latestMessage');

      if (existingChat) {
        return res.json(existingChat);
      }
    }

    // Create chat data
    const chatData = {
      chatName: isGroupChat ? chatName : null,
      isGroupChat,
      users: [req.user.userId, ...validUserIds],
      admins: isGroupChat ? [req.user.userId] : []
    };

    const newChat = await Chat.create(chatData);
    const fullChat = await Chat.findById(newChat._id)
      .populate('users', '-password')
      .populate('admins', '-password');

    // Add chat to each user's chats array
    try {
      await Promise.all(
        chatData.users.map(userId =>
          User.findByIdAndUpdate(
            userId,
            {
              $addToSet: { chats: newChat._id }
            },
            { new: true }
          )
        )
      );
    } catch (updateError) {
      // Continue with response even if user update fails
    }

    res.status(201).json(fullChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all chats for a user
exports.getUserChats = async (req, res) => {
  try {

    const chats = await Chat.find({ 
      users: req.user.userId  // Make sure this matches how we store the ID in auth middleware
    })
      .populate('users', '-password')
      .populate('admins', '-password')
      .populate({
        path: 'latestMessage',
        populate: {
          path: 'sender',
          select: 'name email'
        }
      })
      .sort({ updatedAt: -1 });
    
    
    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single chat by ID
exports.getChatById = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId)
      .populate('users', '-password')
      .populate('admins', '-password')
      .populate({
        path: 'latestMessage',
        populate: {
          path: 'sender',
          select: 'name email'
        }
      });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Check if user is part of the chat
    if (!chat.users.some(user => user._id.toString() === req.user.userId.toString())) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Group chat functions
exports.addToGroup = async (req, res) => {
  try {
    const { userIds } = req.body;
    
    // Validate userIds
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: "Please provide valid user IDs" });
    }

    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (!chat.isGroupChat) {
      return res.status(400).json({ message: "This is not a group chat" });
    }

    const adminIds = chat.admins.map(adminId => adminId.toString());
    const requestingUserId = req.user.userId.toString();

    // Check if requesting user is admin
    if (!adminIds.includes(requestingUserId)) {
      return res.status(403).json({ message: "Only admins can make others admin" });
    }

    // Add new users and their unread counts
    const updatedChat = await Chat.findByIdAndUpdate(
      req.params.chatId,
      {
        $addToSet: { 
          users: { $each: userIds },
        }
      },
      { new: true }
    ).populate('users', '-password')
     .populate('admins', '-password');

    res.json(updatedChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Make user admin in group chat
exports.makeAdmin = async (req, res) => {
  try {
    const { userId } = req.body;
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (!chat.isGroupChat) {
      return res.status(400).json({ message: "This is not a group chat" });
    }

    // Convert ObjectIds to strings for comparison
    const adminIds = chat.admins.map(adminId => adminId.toString());
    const requestingUserId = req.user.userId.toString();

    // Check if requesting user is admin
    if (!adminIds.includes(requestingUserId)) {
      return res.status(403).json({ message: "Only admins can make others admin" });
    }

    // Check if user to be promoted is in the chat
    const chatUserIds = chat.users.map(userId => userId.toString());
    if (!chatUserIds.includes(userId)) {
      return res.status(400).json({ message: "User is not a member of this chat" });
    }

    const updatedChat = await Chat.findByIdAndUpdate(
      req.params.chatId,
      {
        $addToSet: { admins: userId }
      },
      { new: true }
    ).populate('users', '-password')
     .populate('admins', '-password');

    res.json(updatedChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Leave group chat
exports.leaveGroup = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (!chat.isGroupChat) {
      return res.status(400).json({ message: "This is not a group chat" });
    }

    // Make sure we're using req.user.userId instead of req.user._id
    // This matches how we set up the user object in the auth middleware
    const updatedChat = await Chat.findByIdAndUpdate(
      req.params.chatId,
      {
        $pull: { 
          users: req.user.userId,
          admins: req.user.userId,
        }
      },
      { 
        new: true,
        runValidators: true
      }
    ).populate('users', '-password')
     .populate('admins', '-password');

    if (!updatedChat) {
      return res.status(404).json({ message: "Failed to update chat" });
    }

    res.json(updatedChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove user from group chat
exports.removeFromGroup = async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: "Please provide a user ID to remove" });
    }

    const chat = await Chat.findById(req.params.chatId);
    
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (!chat.isGroupChat) {
      return res.status(400).json({ message: "This is not a group chat" });
    }

    const adminIds = chat.admins.map(adminId => adminId.toString());
    const requestingUserId = req.user.userId.toString();

    // Check if requesting user is admin
    if (!adminIds.includes(requestingUserId)) {
      return res.status(403).json({ message: "Only admins can make others admin" });
    }

    const updatedChat = await Chat.findByIdAndUpdate(
      req.params.chatId,
      {
        $pull: { 
          users: userId,
          admins: userId,
        }
      },
      { 
        new: true,
        runValidators: true
      }
    ).populate('users', '-password')
     .populate('admins', '-password');

    if (!updatedChat) {
      return res.status(404).json({ message: "Failed to update chat" });
    }

    res.json(updatedChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update chat name
exports.updateChatName = async (req, res) => {
  try {
    const { chatName } = req.body;

    if (!chatName) {
      return res.status(400).json({ message: "Please provide a chat name" });
    }

    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (!chat.isGroupChat) {
      return res.status(400).json({ message: "Can only update group chat names" });
    }

    // Check if user is admin
    const isAdmin = chat.admins.some(adminId => 
      adminId.toString() === req.user.userId.toString()
    );

    if (!isAdmin) {
      return res.status(403).json({ message: "Only admins can update group name" });
    }

    const updatedChat = await Chat.findByIdAndUpdate(
      req.params.chatId,
      { chatName },
      { 
        new: true,
        runValidators: true
      }
    ).populate('users', '-password')
     .populate('admins', '-password');

    if (!updatedChat) {
      return res.status(404).json({ message: "Failed to update chat" });
    }

    res.json(updatedChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};