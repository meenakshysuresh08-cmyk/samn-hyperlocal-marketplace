const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, phone, password, role, coordinates, address } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, phone, and password',
      });
    }

    const userExists = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { phone }],
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: userExists.email === email.toLowerCase() ? 'Email is already registered' : 'Phone number is already registered',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const initialLocation = {
      type: 'Point',
      coordinates: coordinates && coordinates.length === 2 ? coordinates : [77.5946, 12.9716], // Default Bengaluru or passed coords
      address: address || 'Current Location',
    };

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      passwordHash,
      activeRole: role === 'helper' ? 'helper' : 'customer',
      location: initialLocation,
      stats: {
        tasksPosted: 0,
        tasksCompleted: 0,
        totalEarned: 0,
        totalSpent: 0,
        avgRatingAsHelper: 5.0,
        avgRatingAsCustomer: 5.0,
      },
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    console.error('[Auth Controller Error - Register]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { emailOrPhone, password, fcmToken } = req.body;

    if (!emailOrPhone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email/phone and password',
      });
    }

    const query = emailOrPhone.includes('@')
      ? { email: emailOrPhone.toLowerCase() }
      : { phone: emailOrPhone };

    const user = await User.findOne(query);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (fcmToken) {
      user.fcmToken = fcmToken;
    }
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    console.error('[Auth Controller Error - Login]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message,
    });
  }
};

// @desc    Get current authenticated user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error fetching user profile',
    });
  }
};

// @desc    Switch active role (Customer <-> Helper)
// @route   POST /api/auth/switch-role
// @access  Private
const switchRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !['customer', 'helper'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Valid role (customer or helper) is required',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { activeRole: role },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: `Role switched to ${role}`,
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to switch role',
      error: error.message,
    });
  }
};

// @desc    Update FCM push notification token
// @route   POST /api/auth/fcm-token
// @access  Private
const updateFcmToken = async (req, res) => {
  try {
    const { fcmToken, token } = req.body;
    const tokenToSave = fcmToken || token;

    if (!tokenToSave) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { fcmToken: tokenToSave },
      { new: true }
    ).select('-passwordHash');

    return res.status(200).json({
      success: true,
      message: 'FCM token updated successfully',
      data: user,
    });
  } catch (error) {
    console.error('[Auth Controller Error - Update FCM Token]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update FCM token',
      error: error.message,
    });
  }
};

// In-memory OTP Store for password reset
const otpStore = new Map();

// @desc    Request Password Reset OTP
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email address' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins

    otpStore.set(cleanEmail, { otp, expiresAt });

    console.log(`\n========================================`);
    console.log(`🔑 [SAMN SECURITY] PASSWORD RESET OTP`);
    console.log(`👤 Target Email: ${cleanEmail}`);
    console.log(`🔢 6-Digit OTP:  ${otp}`);
    console.log(`⏱️ Valid for:     10 minutes`);
    console.log(`========================================\n`);

    return res.status(200).json({
      success: true,
      message: `Verification code sent to ${cleanEmail}`,
    });
  } catch (error) {
    console.error('[Auth Controller Error - Forgot Password]:', error);
    return res.status(500).json({ success: false, message: 'Server error generating OTP' });
  }
};

// @desc    Verify Password Reset OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const record = otpStore.get(cleanEmail);

    if (!record || record.otp !== otp.toString().trim()) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(cleanEmail);
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new one.' });
    }

    return res.status(200).json({ success: true, message: 'Verification successful' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error verifying code' });
  }
};

// @desc    Reset Password with OTP
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const record = otpStore.get(cleanEmail);

    if (!record || record.otp !== otp.toString().trim()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    const user = await User.findOneAndUpdate(
      { email: cleanEmail },
      { passwordHash },
      { new: true }
    );

    otpStore.delete(cleanEmail);

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now login.',
    });
  } catch (error) {
    console.error('[Auth Controller Error - Reset Password]:', error);
    return res.status(500).json({ success: false, message: 'Server error resetting password' });
  }
};

module.exports = {
  register,
  login,
  getMe,
  switchRole,
  updateFcmToken,
  forgotPassword,
  verifyOtp,
  resetPassword,
};
