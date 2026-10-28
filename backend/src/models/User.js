const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
    },
    avatar: {
      type: String,
      default: 'https://res.cloudinary.com/demo/image/upload/v1690000000/default_avatar.png',
    },
    activeRole: {
      type: String,
      enum: ['customer', 'helper'],
      default: 'customer',
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [lng, lat]
        default: [0, 0],
      },
      address: {
        type: String,
        default: 'Location not set',
      },
    },
    fcmToken: {
      type: String,
      default: null,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    stats: {
      tasksPosted: { type: Number, default: 0 },
      tasksCompleted: { type: Number, default: 0 },
      totalEarned: { type: Number, default: 0 },
      totalSpent: { type: Number, default: 0 },
      avgRatingAsHelper: { type: Number, default: 0 },
      avgRatingAsCustomer: { type: Number, default: 0 },
      ratingCountHelper: { type: Number, default: 0 },
      ratingCountCustomer: { type: Number, default: 0 },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

// 2dsphere index on location for geospatial queries
UserSchema.index({ location: '2dsphere' });
UserSchema.index({ activeRole: 1, isOnline: 1 });

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.passwordHash);
};

module.exports = mongoose.model('User', UserSchema);
