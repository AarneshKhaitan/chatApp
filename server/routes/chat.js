const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const chatController = require('../controllers/chatController');

// Apply auth middleware to all routes
router.use(auth);

// Chat routes
router.post('/', chatController.createChat);
router.get('/', chatController.getUserChats);
router.get('/:chatId', chatController.getChatById);

// Group chat routes
router.post('/:chatId/add', chatController.addToGroup);
router.post('/:chatId/make-admin', chatController.makeAdmin);
router.post('/:chatId/leave', chatController.leaveGroup);
router.post('/:chatId/remove', chatController.removeFromGroup);
router.put('/:chatId', chatController.updateChatName);

module.exports = router;