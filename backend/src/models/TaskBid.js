const mongoose = require('mongoose');

const TaskBidSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
      index: true,
    },
    helperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    proposedAmount: {
      type: Number,
      required: [true, 'Proposed amount is required'],
      min: 0,
    },
    message: {
      type: String,
      trim: true,
      default: '',
    },
    estimatedTime: {
      type: String,
      default: '1 hour',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

TaskBidSchema.index({ taskId: 1, helperId: 1 }, { unique: true });

module.exports = mongoose.model('TaskBid', TaskBidSchema);
