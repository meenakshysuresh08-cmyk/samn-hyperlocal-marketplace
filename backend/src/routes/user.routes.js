const express = require('express');
const router = express.Router();
const {
  updateProfile,
  updateLocation,
  getNearbyHelpers,
  getUserById,
} = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.get('/nearby-helpers', getNearbyHelpers);
router.get('/:id', getUserById);
router.put('/profile', protect, upload.single('avatar'), updateProfile);
router.put('/location', protect, updateLocation);

module.exports = router;
