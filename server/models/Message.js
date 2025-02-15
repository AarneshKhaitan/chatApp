const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  chat: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Chat',
    required: true 
  },
  readBy: [{
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    readAt: { 
      type: Date, 
      required: true 
    }
  }]
}, {
  timestamps: true
});

// Add method to check if message is read by a user
messageSchema.methods.isReadBy = function(userId) {
  return this.readBy.some(read => read.user.toString() === userId.toString());
};

// Indexing in Message model
messageSchema.index({ chat: 1, createdAt: -1 });
// This index helps in quickly retrieving messages for a specific chat
// sorted by creation time (newest first due to -1)
// Used when loading chat history

messageSchema.index({ sender: 1 });
// This index helps in quickly finding all messages from a specific sender
// Useful for features like "My Messages" or message search

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;