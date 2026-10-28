const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  switchRole,
  updateFcmToken,
  forgotPassword,
  verifyOtp,
  resetPassword,
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);
router.post('/switch-role', protect, switchRole);
router.post('/fcm-token', protect, updateFcmToken);

module.exports = router;
