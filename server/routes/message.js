const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const messageController = require('../controllers/messageController');

// Apply auth middleware to all routes
router.use(auth);

// Message routes
router.post('/chat/:chatId', messageController.sendMessage);             // Send new message
router.get('/chat/:chatId', messageController.getChatMessages);          // Get chat messages
router.post('/chat/:chatId/read', messageController.markMessagesAsRead); // Mark messages as read
router.delete('/:messageId', messageController.deleteMessage);           // Delete message

module.exports = router;