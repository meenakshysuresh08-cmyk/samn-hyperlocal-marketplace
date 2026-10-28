const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
      index: true,
    },
    raterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rateeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rateeRole: {
      type: String,
      enum: ['helper', 'customer'],
      required: true,
    },
    score: {
      type: Number,
      required: [true, 'Rating score is required'],
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      trim: true,
      default: '',
    },
    tags: [{ type: String }],
    photoUrl: {
      type: String,
      default: null,
    },
    photos: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

RatingSchema.index({ taskId: 1, raterId: 1 }, { unique: true });

module.exports = mongoose.model('Rating', RatingSchema);
