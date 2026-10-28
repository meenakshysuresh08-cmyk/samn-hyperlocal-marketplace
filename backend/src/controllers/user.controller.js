const User = require('../models/User');
const cloudinary = require('../config/cloudinary');

// @desc    Update user profile (name, avatar, phone)
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, phone, fcmToken } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (fcmToken) updateData.fcmToken = fcmToken;

    if (req.file) {
      // Upload buffer to Cloudinary
      const uploadPromise = new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'samn_avatars', resource_type: 'image' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      const uploadResult = await uploadPromise;
      updateData.avatar = uploadResult.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    }).select('-passwordHash');

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    console.error('[User Controller Error - updateProfile]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
};

// @desc    Update user live location
// @route   PUT /api/users/location
// @access  Private
const updateLocation = async (req, res) => {
  try {
    const { coordinates, address } = req.body; // coordinates: [lng, lat]

    if (!coordinates || coordinates.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'Valid coordinates [longitude, latitude] are required',
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        location: {
          type: 'Point',
          coordinates,
          address: address || 'Current Location',
        },
        lastSeen: new Date(),
      },
      { new: true }
    ).select('-passwordHash');

    return res.status(200).json({
      success: true,
      message: 'Location updated',
      data: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: error.message,
    });
  }
};

// @desc    Get nearby helpers for map preview
// @route   GET /api/users/nearby-helpers
// @access  Private/Public
const getNearbyHelpers = async (req, res) => {
  try {
    const lng = parseFloat(req.query.lng) || req.user?.location?.coordinates[0] || 77.5946;
    const lat = parseFloat(req.query.lat) || req.user?.location?.coordinates[1] || 12.9716;
    const maxDistance = parseInt(req.query.radius, 10) || 10000; // default 10km

    const helpers = await User.find({
      _id: { $ne: req.user?._id },
      activeRole: 'helper',
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          $maxDistance: maxDistance,
        },
      },
    }).select('name avatar stats location isOnline lastSeen isVerified');

    return res.status(200).json({
      success: true,
      count: helpers.length,
      data: helpers,
    });
  } catch (error) {
    console.error('[User Controller - getNearbyHelpers]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby helpers',
      error: error.message,
    });
  }
};

// @desc    Get public user profile & stats by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      'name avatar activeRole stats isVerified createdAt location.address'
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error retrieving user' });
  }
};

module.exports = {
  updateProfile,
  updateLocation,
  getNearbyHelpers,
  getUserById,
};
