const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const messageController = require('../controllers/messageController');

// Apply auth middleware to all routes
router.use(auth);

// Message routes
router.post('/chat/:chatId', messageController.sendMessage);             // Send new message
router.get('/chat/:chatId', messageController.getChatMessages);          // Get chat messages

module.exports = router;