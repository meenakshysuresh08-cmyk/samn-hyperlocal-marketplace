const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Task description is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'delivery',
        'grocery',
        'cleaning',
        'tech_help',
        'moving',
        'cooking',
        'pet_care',
        'pet_grooming',
        'care_taker',
        'hospital_accompany',
        'gardening',
        'car_wash',
        'tutoring',
        'repair',
        'other',
      ],
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    helperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
      landmark: {
        type: String,
        default: '',
      },
    },
    recipient: {
      forSelf: { type: Boolean, default: true },
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      landmark: { type: String, default: '' },
      notes: { type: String, default: '' },
    },
    budget: {
      amount: { type: Number, required: true, min: 0 },
      currency: { type: String, default: 'INR' },
      type: {
        type: String,
        enum: ['fixed', 'hourly', 'negotiable'],
        default: 'fixed',
      },
    },
    status: {
      type: String,
      enum: ['open', 'broadcasted', 'assigned', 'in_progress', 'completed', 'cancelled', 'disputed'],
      default: 'open',
      index: true,
    },
    // Fallback broadcast mechanism
    fallback: {
      isBroadcasted: { type: Boolean, default: false },
      broadcastedAt: { type: Date, default: null },
      broadcastRadius: { type: Number, default: 5000 }, // meters
      broadcastedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    },
    bids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TaskBid' }],
    selectedBid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaskBid',
      default: null,
    },
    timeline: {
      postedAt: { type: Date, default: Date.now },
      assignedAt: { type: Date, default: null },
      startedAt: { type: Date, default: null },
      completedAt: { type: Date, default: null },
      cancelledAt: { type: Date, default: null },
      deadlineAt: { type: Date, default: null },
      scheduledFor: { type: Date, default: null },
      scheduledText: { type: String, default: 'ASAP / Immediate' },
    },
    completionOtp: {
      type: String,
      default: () => Math.floor(1000 + Math.random() * 9000).toString(),
    },
    proof: {
      images: [{ type: String }],
      description: { type: String, default: '' },
      submittedAt: { type: Date, default: null },
      verifiedVia: {
        type: String,
        enum: ['photo_and_otp', 'delivery_photo_and_otp', 'geofence_and_otp', 'otp_handshake', 'manual_customer_approval'],
        default: 'otp_handshake',
      },
      geofenceVerified: { type: Boolean, default: false },
      distanceAtCompletionMeters: { type: Number, default: 0 },
    },
    searchRadius: {
      type: Number,
      default: 10000, // 10 km in meters
    },
    tags: [{ type: String }],
    isUrgent: {
      type: Boolean,
      default: false,
      index: true,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    rating: {
      byCustomer: { type: mongoose.Schema.Types.ObjectId, ref: 'Rating', default: null },
      byHelper: { type: mongoose.Schema.Types.ObjectId, ref: 'Rating', default: null },
    },
  },
  {
    timestamps: true,
  }
);

// 2dsphere index for geospatial task lookup
TaskSchema.index({ location: '2dsphere' });
TaskSchema.index({ status: 1, createdAt: -1 });
TaskSchema.index({ customerId: 1, status: 1 });
TaskSchema.index({ helperId: 1, status: 1 });

module.exports = mongoose.model('Task', TaskSchema);
