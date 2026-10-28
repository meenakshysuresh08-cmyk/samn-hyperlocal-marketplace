const express = require('express');
const router = express.Router();
const {
  submitRating,
  getUserRatings,
  getTaskRatings,
} = require('../controllers/rating.controller');
const { protect } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.post('/', protect, upload.single('photo'), submitRating);
router.get('/task/:taskId', protect, getTaskRatings);
router.get('/user/:userId', getUserRatings);

module.exports = router;
