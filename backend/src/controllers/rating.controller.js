const Rating = require('../models/Rating');
const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');
const cloudinary = require('../config/cloudinary');
const { emitToUser } = require('../services/socket.service');

// @desc    Submit rating for a completed task
// @route   POST /api/ratings
// @access  Private
const submitRating = async (req, res) => {
  try {
    const { taskId, score, review } = req.body;
    let tags = req.body.tags;
    let photoUrl = req.body.photoUrl || null;

    if (typeof tags === 'string') {
      try {
        tags = JSON.parse(tags);
      } catch (e) {
        tags = tags.split(',').map((t) => t.trim()).filter(Boolean);
      }
    }

    if (!taskId || !score) {
      return res.status(400).json({ success: false, message: 'taskId and score (1-5) are required' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const isCustomer = task.customerId.toString() === req.user._id.toString();
    const isHelper = task.helperId && task.helperId.toString() === req.user._id.toString();

    if (!isCustomer && !isHelper) {
      return res.status(403).json({ success: false, message: 'You are not a participant in this task' });
    }

    const rateeId = isCustomer ? task.helperId : task.customerId;
    const rateeRole = isCustomer ? 'helper' : 'customer';

    if (!rateeId) {
      return res.status(400).json({ success: false, message: 'No target participant to rate' });
    }

    const existingRating = await Rating.findOne({ taskId, raterId: req.user._id });
    if (existingRating) {
      return res.status(400).json({ success: false, message: 'You have already rated this task' });
    }

    // Process optional uploaded photo
    if (req.file) {
      try {
        const uploadPromise = new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: 'samn/reviews',
              resource_type: 'image',
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result.secure_url);
            }
          );
          stream.end(req.file.buffer);
        });
        photoUrl = await uploadPromise;
      } catch (uploadErr) {
        console.warn('Review photo upload to Cloudinary failed, using local/data URI fallback:', uploadErr.message);
        photoUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      }
    }

    const rating = await Rating.create({
      taskId,
      raterId: req.user._id,
      rateeId,
      rateeRole,
      score: Number(score),
      review: review || '',
      tags: tags || [],
      photoUrl: photoUrl || null,
      photos: photoUrl ? [photoUrl] : [],
    });

    // Update Task rating field
    if (isCustomer) {
      task.rating.byCustomer = rating._id;
    } else {
      task.rating.byHelper = rating._id;
    }
    await task.save();

    // Recalculate target user average rating
    const allRatings = await Rating.find({ rateeId, rateeRole });
    const totalScore = allRatings.reduce((sum, r) => sum + r.score, 0);
    const avgScore = Number((totalScore / allRatings.length).toFixed(1));

    const updateFields = {};
    if (rateeRole === 'helper') {
      updateFields['stats.avgRatingAsHelper'] = avgScore;
      updateFields['stats.ratingCountHelper'] = allRatings.length;
    } else {
      updateFields['stats.avgRatingAsCustomer'] = avgScore;
      updateFields['stats.ratingCountCustomer'] = allRatings.length;
    }

    await User.findByIdAndUpdate(rateeId, { $set: updateFields });

    // Send notification to ratee
    try {
      const notif = await Notification.create({
        userId: rateeId,
        type: 'rating_received',
        title: 'New Rating Received! ⭐',
        body: `${req.user.name} rated you ${score} stars: "${review || 'Great experience!'}"`,
        data: { taskId: task._id, ratingId: rating._id },
      });

      emitToUser(rateeId, 'notification', notif);
      emitToUser(rateeId, 'rating_received', { taskId: task._id, rating });
    } catch (notifErr) {
      console.warn('Rating notification failed:', notifErr.message);
    }

    const populatedRating = await Rating.findById(rating._id).populate('raterId', 'name avatar');

    return res.status(201).json({
      success: true,
      message: 'Rating submitted successfully',
      data: populatedRating,
    });
  } catch (error) {
    console.error('[Rating Controller - submitRating]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit rating',
      error: error.message,
    });
  }
};

// @desc    Get reviews/ratings for a specific user
// @route   GET /api/ratings/user/:userId
// @access  Public / Private
const getUserRatings = async (req, res) => {
  try {
    const { userId } = req.params;
    const role = req.query.role; // 'helper' or 'customer'

    const filter = { rateeId: userId };
    if (role) filter.rateeRole = role;

    const ratings = await Rating.find(filter)
      .populate('raterId', 'name avatar')
      .populate('taskId', 'title category')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: ratings.length,
      data: ratings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve ratings',
      error: error.message,
    });
  }
};

// @desc    Get rating for a specific task and current user
// @route   GET /api/ratings/task/:taskId
// @access  Private
const getTaskRatings = async (req, res) => {
  try {
    const { taskId } = req.params;
    const ratings = await Rating.find({ taskId }).populate('raterId', 'name avatar');
    return res.status(200).json({
      success: true,
      data: ratings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve task ratings',
      error: error.message,
    });
  }
};

module.exports = {
  submitRating,
  getUserRatings,
  getTaskRatings,
};
