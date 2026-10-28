const express = require('express');
const router = express.Router();
const {
  getTaskMessages,
  getUserConversations,
  sendMessage,
  markAsRead,
} = require('../controllers/message.controller');
const { protect } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.get('/conversations', protect, getUserConversations);
router.get('/task/:taskId', protect, getTaskMessages);
router.post('/', protect, upload.single('media'), sendMessage);
router.post('/mark-read', protect, markAsRead);

module.exports = router;
