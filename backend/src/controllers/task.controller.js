const Task = require('../models/Task');
const TaskBid = require('../models/TaskBid');
const User = require('../models/User');
const Notification = require('../models/Notification');
const cloudinary = require('../config/cloudinary');
const { emitToUser, emitToTaskRoom, broadcastToAll } = require('../services/socket.service');
const { sendPushNotification } = require('../services/fcm.service');
const { calculateDistanceKm } = require('../services/geo.service');

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Customer)
const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      coordinates, // [lng, lat]
      address,
      landmark,
      forSelf,
      recipientName,
      recipientPhone,
      locationNotes,
      budgetAmount,
      budgetType,
      isUrgent,
      searchRadius,
      tags,
      scheduledDate,
      scheduledTime,
      scheduledText,
    } = req.body;

    if (!title || !description || !category || !coordinates || !budgetAmount || !address) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (title, description, category, coordinates, address, budgetAmount)',
      });
    }

    if (!Array.isArray(coordinates) || coordinates.length < 2 || isNaN(coordinates[0]) || isNaN(coordinates[1])) {
      return res.status(400).json({
        success: false,
        message: 'Valid coordinates [longitude, latitude] are required',
      });
    }

    const cleanCoordinates = [parseFloat(coordinates[0]), parseFloat(coordinates[1])];

    const isForSelf = forSelf !== undefined ? Boolean(forSelf) : true;

    // Resolve scheduled date and readable text
    let scheduledFor = null;
    if (scheduledDate) {
      const parsedDate = new Date(scheduledDate);
      if (!isNaN(parsedDate.getTime())) {
        scheduledFor = parsedDate;
      }
    }

    let readableScheduledText = scheduledText || 'ASAP / Immediate';
    if (!scheduledText && scheduledDate) {
      readableScheduledText = scheduledTime ? `${scheduledDate} at ${scheduledTime}` : `${scheduledDate}`;
    }

    const task = await Task.create({
      title,
      description,
      category,
      customerId: req.user._id,
      location: {
        type: 'Point',
        coordinates: cleanCoordinates,
        address,
        landmark: landmark || '',
      },
      recipient: {
        forSelf: isForSelf,
        name: isForSelf ? req.user.name : (recipientName || ''),
        phone: isForSelf ? req.user.phone : (recipientPhone || ''),
        landmark: landmark || '',
        notes: locationNotes || '',
      },
      budget: {
        amount: Number(budgetAmount),
        currency: 'INR',
        type: budgetType || 'fixed',
      },
      isUrgent: Boolean(isUrgent),
      searchRadius: searchRadius ? Number(searchRadius) : 10000,
      tags: Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map((t) => t.trim()) : [],
      status: 'open',
      timeline: {
        postedAt: new Date(),
        scheduledFor,
        scheduledText: readableScheduledText,
      },
    });

    // Update customer stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.tasksPosted': 1 },
    });

    const populatedTask = await Task.findById(task._id).populate('customerId', 'name avatar stats phone');

    // Notify nearby helpers via Socket, DB Notifications, and FCM
    const helpers = await User.find({
      _id: { $ne: req.user._id },
      activeRole: 'helper',
    }).select('_id fcmToken name location');

    for (const helper of helpers) {
      let isNear = true;
      if (helper.location?.coordinates && helper.location.coordinates[0] !== 0) {
        const distKm = calculateDistanceKm(coordinates, helper.location.coordinates);
        const maxKm = task.searchRadius ? task.searchRadius / 1000 : 25;
        if (distKm > maxKm) {
          isNear = false;
        }
      }

      if (isNear) {
        try {
          await Notification.create({
            userId: helper._id,
            type: 'task_posted',
            title: `New Task Nearby: ${task.title}`,
            body: `₹${task.budget.amount} • ${task.category} • ${address}`,
            data: { taskId: task._id },
          });
        } catch (notifErr) {
          console.warn('Failed to save notification:', notifErr.message);
        }

        emitToUser(helper._id, 'new_nearby_task', populatedTask);
        emitToUser(helper._id, 'notification', {
          title: `New Task Nearby: ${task.title}`,
          body: `₹${task.budget.amount} • ${task.category} • ${address}`,
          data: { taskId: task._id },
        });

        if (helper.fcmToken) {
          sendPushNotification(helper.fcmToken, {
            title: `New Task Nearby: ${task.title}`,
            body: `₹${task.budget.amount} • ${task.category} • ${address}`,
            data: { taskId: task._id.toString() },
          });
        }
      }
    }

    // Global broadcast for live map feeds & real-time radar
    broadcastToAll('task_created', populatedTask);
    broadcastToAll('new_nearby_task', populatedTask);

    return res.status(201).json({
      success: true,
      message: 'Task posted successfully',
      data: populatedTask,
    });
  } catch (error) {
    console.error('[Task Controller - createTask]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create task',
      error: error.message,
    });
  }
};

// @desc    Get nearby tasks with geospatial search and filters
// @route   GET /api/tasks/nearby
// @access  Public / Private
const getNearbyTasks = async (req, res) => {
  try {
    const queryLng = req.query.lng !== undefined && req.query.lng !== '' ? parseFloat(req.query.lng) : NaN;
    const queryLat = req.query.lat !== undefined && req.query.lat !== '' ? parseFloat(req.query.lat) : NaN;

    const userLng = req.user?.location?.coordinates?.[0];
    const userLat = req.user?.location?.coordinates?.[1];

    const lng = !isNaN(queryLng)
      ? queryLng
      : (typeof userLng === 'number' && !isNaN(userLng) && (userLng !== 0 || userLat !== 0) ? userLng : 77.5946);
    const lat = !isNaN(queryLat)
      ? queryLat
      : (typeof userLat === 'number' && !isNaN(userLat) && (userLng !== 0 || userLat !== 0) ? userLat : 12.9716);

    const radiusInMeters = parseInt(req.query.radius, 10) || 25000;
    const category = req.query.category;
    const minBudget = parseFloat(req.query.minBudget);
    const maxBudget = parseFloat(req.query.maxBudget);
    const isUrgent = req.query.isUrgent === 'true';

    const matchQuery = {
      status: { $in: ['open', 'broadcasted'] },
    };

    // Authoritative server-side filter: exclude creator's own tasks from available helper feed
    if (req.user && req.user._id) {
      matchQuery.customerId = { $ne: req.user._id };
    }

    if (category && category !== 'all') {
      matchQuery.category = category;
    }

    if (isUrgent) {
      matchQuery.isUrgent = true;
    }

    if (!isNaN(minBudget) || !isNaN(maxBudget)) {
      matchQuery['budget.amount'] = {};
      if (!isNaN(minBudget)) matchQuery['budget.amount'].$gte = minBudget;
      if (!isNaN(maxBudget)) matchQuery['budget.amount'].$lte = maxBudget;
    }

    // Geospatial lookup
    matchQuery.location = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        $maxDistance: radiusInMeters,
      },
    };

    let tasks;
    try {
      tasks = await Task.find(matchQuery)
        .populate('customerId', 'name avatar stats isVerified')
        .populate({
          path: 'bids',
          populate: { path: 'helperId', select: 'name avatar stats' },
        })
        .limit(50);
    } catch (geoErr) {
      console.warn('Geospatial lookup fallback:', geoErr.message);
      delete matchQuery.location;
      tasks = await Task.find(matchQuery)
        .populate('customerId', 'name avatar stats isVerified')
        .populate({
          path: 'bids',
          populate: { path: 'helperId', select: 'name avatar stats' },
        })
        .sort({ createdAt: -1 })
        .limit(50);
    }

    // Compute distance for each task relative to helper query coordinates and strictly filter by radius
    const radiusInKm = radiusInMeters / 1000;
    const tasksWithDistance = tasks
      .map((task) => {
        const doc = task.toObject();
        const tCoords = task.location?.coordinates;
        if (
          Array.isArray(tCoords) &&
          tCoords.length >= 2 &&
          typeof tCoords[0] === 'number' &&
          typeof tCoords[1] === 'number' &&
          !isNaN(tCoords[0]) &&
          !isNaN(tCoords[1]) &&
          (tCoords[0] !== 0 || tCoords[1] !== 0)
        ) {
          doc.distanceKm = calculateDistanceKm([lng, lat], tCoords);
          return doc;
        }
        // Never assign fabricated distance! Exclude missing or invalid coordinates from nearby feed
        doc.distanceKm = null;
        return doc;
      })
      .filter((task) => task.distanceKm !== null && task.distanceKm <= radiusInKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return res.status(200).json({
      success: true,
      count: tasksWithDistance.length,
      data: tasksWithDistance,
    });
  } catch (error) {
    console.error('[Task Controller - getNearbyTasks]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby tasks',
      error: error.message,
    });
  }
};

// @desc    Get user's tasks (posted by customer or accepted/applied by helper)
// @route   GET /api/tasks/my-tasks
// @access  Private
const getMyTasks = async (req, res) => {
  try {
    const role = req.query.role || req.user.activeRole;
    let query = {};

    if (role === 'customer') {
      query.customerId = req.user._id;
    } else {
      // Helper: either assigned or has submitted bid
      const helperBids = await TaskBid.find({ helperId: req.user._id }).select('taskId');
      const bidTaskIds = helperBids.map((b) => b.taskId);

      query = {
        $or: [{ helperId: req.user._id }, { _id: { $in: bidTaskIds } }],
      };
    }

    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }

    const tasks = await Task.find(query)
      .populate('customerId', 'name avatar stats phone isVerified')
      .populate('helperId', 'name avatar stats phone isVerified')
      .populate({
        path: 'bids',
        populate: { path: 'helperId', select: 'name avatar stats isVerified phone' },
      })
      .sort({ createdAt: -1 });

    // Ensure all bids are populated from TaskBid for each task
    const tasksWithBids = await Promise.all(
      tasks.map(async (t) => {
        const doc = t.toObject();
        const bids = await TaskBid.find({ taskId: t._id, status: { $ne: 'withdrawn' } })
          .populate('helperId', 'name avatar stats isVerified phone')
          .sort({ createdAt: -1 });
        doc.bids = bids;
        return doc;
      })
    );

    return res.status(200).json({
      success: true,
      count: tasksWithBids.length,
      data: tasksWithBids,
    });
  } catch (error) {
    console.error('[Task Controller - getMyTasks]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve your tasks',
      error: error.message,
    });
  }
};

// @desc    Get task detail by ID
// @route   GET /api/tasks/:id
// @access  Public / Private
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('customerId', 'name avatar stats phone isVerified email')
      .populate('helperId', 'name avatar stats phone isVerified email')
      .populate('selectedBid');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Increment view counter
    task.viewCount = (task.viewCount || 0) + 1;
    await task.save();

    // Fetch ALL bids directly from TaskBid collection to ensure 100% completeness
    const bids = await TaskBid.find({ taskId: task._id, status: { $ne: 'withdrawn' } })
      .populate('helperId', 'name avatar stats isVerified phone')
      .sort({ createdAt: -1 });

    const taskObj = task.toObject();
    taskObj.bids = bids;

    return res.status(200).json({
      success: true,
      data: taskObj,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to load task details',
      error: error.message,
    });
  }
};

// @desc    Submit a bid/proposal on a task (Helper)
// @route   POST /api/tasks/:id/bid
// @access  Private (Helper)
const submitBid = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { proposedAmount, message, estimatedTime } = req.body;

    const task = await Task.findById(taskId).populate('customerId', 'name avatar fcmToken');
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (!['open', 'broadcasted'].includes(task.status)) {
      return res.status(400).json({ success: false, message: 'Task is no longer accepting bids' });
    }

    const customerId = task.customerId?._id || task.customerId;
    const isOwner = customerId && customerId.toString() === req.user._id.toString();

    // In production, helpers cannot bid on their own tasks; in development, allow for testing
    if (isOwner && process.env.NODE_ENV === 'production') {
      return res.status(400).json({ success: false, message: 'You cannot bid on your own task' });
    }

    const existingBid = await TaskBid.findOne({ taskId, helperId: req.user._id });
    if (existingBid) {
      existingBid.proposedAmount = Number(proposedAmount);
      existingBid.message = message || existingBid.message;
      existingBid.estimatedTime = estimatedTime || existingBid.estimatedTime;
      await existingBid.save();

      const populatedBid = await TaskBid.findById(existingBid._id).populate('helperId', 'name avatar stats isVerified phone');

      try {
        const notif = await Notification.create({
          userId: customerId,
          type: 'bid_received',
          title: 'Offer Updated by Helper 🏷️',
          body: `${req.user.name} updated offer to ₹${proposedAmount} for "${task.title}"`,
          data: { taskId: task._id, bidId: existingBid._id },
        });
        emitToUser(customerId, 'notification', notif);
      } catch (notifErr) {
        console.warn('Notification skipped:', notifErr.message);
      }

      emitToUser(customerId, 'bid_received', { taskId, bid: populatedBid });
      emitToUser(customerId, 'bid_updated', { taskId, bid: populatedBid });
      emitToTaskRoom(taskId, 'bid_received', { taskId, bid: populatedBid });

      const updatedTask = await Task.findById(taskId)
        .populate('customerId', 'name avatar stats phone isVerified')
        .populate('helperId', 'name avatar stats phone isVerified')
        .populate({
          path: 'bids',
          populate: { path: 'helperId', select: 'name avatar stats isVerified phone' },
        })
        .populate('selectedBid');

      emitToUser(customerId, 'task_updated', updatedTask);
      emitToTaskRoom(taskId, 'task_updated', updatedTask);
      broadcastToAll('task_updated', updatedTask);

      return res.status(200).json({
        success: true,
        message: 'Bid updated successfully',
        data: populatedBid,
      });
    }

    const bid = await TaskBid.create({
      taskId,
      helperId: req.user._id,
      proposedAmount: Number(proposedAmount),
      message: message || '',
      estimatedTime: estimatedTime || '1 hour',
    });

    task.bids.push(bid._id);
    await task.save();

    const populatedBid = await TaskBid.findById(bid._id).populate('helperId', 'name avatar stats isVerified phone');

    // Notify task creator (Customer)
    try {
      const notification = await Notification.create({
        userId: customerId,
        type: 'bid_received',
        title: 'New Offer Received! 🏷️',
        body: `${req.user.name} offered ₹${proposedAmount} for "${task.title}"`,
        data: { taskId: task._id, bidId: bid._id },
      });
      emitToUser(customerId, 'notification', notification);
    } catch (notifErr) {
      console.warn('Notification skipped:', notifErr.message);
    }

    emitToUser(task.customerId._id, 'notification', notification);
    emitToUser(task.customerId._id, 'bid_received', { taskId: task._id, bid: populatedBid });
    emitToTaskRoom(task._id, 'bid_received', { taskId: task._id, bid: populatedBid });

    const updatedTask = await Task.findById(taskId)
      .populate('customerId', 'name avatar stats phone isVerified')
      .populate('helperId', 'name avatar stats phone isVerified')
      .populate({
        path: 'bids',
        populate: { path: 'helperId', select: 'name avatar stats isVerified phone' },
      })
      .populate('selectedBid');

    emitToUser(task.customerId._id, 'task_updated', updatedTask);
    emitToTaskRoom(taskId, 'task_updated', updatedTask);
    broadcastToAll('task_updated', updatedTask);

    if (task.customerId?.fcmToken) {
      sendPushNotification(task.customerId.fcmToken, {
        title: 'New Offer on your Task! 🏷️',
        body: `${req.user.name} offered ₹${proposedAmount}`,
        data: { taskId: task._id.toString(), bidId: bid._id.toString() },
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Bid submitted successfully',
      data: populatedBid,
    });
  } catch (error) {
    console.error('[Task Controller - submitBid]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit bid',
      error: error.message,
    });
  }
};

// @desc    Accept a bid and assign helper (Customer)
// @route   POST /api/tasks/:id/accept-bid
// @access  Private (Customer)
const acceptBid = async (req, res) => {
  try {
    const { bidId } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (task.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to manage this task' });
    }

    const bid = await TaskBid.findById(bidId).populate('helperId', 'name avatar fcmToken stats');
    if (!bid || bid.taskId.toString() !== task._id.toString()) {
      return res.status(404).json({ success: false, message: 'Bid not found for this task' });
    }

    // Update bids statuses
    await TaskBid.updateMany({ taskId: task._id, _id: { $ne: bidId } }, { status: 'rejected' });
    bid.status = 'accepted';
    await bid.save();

    // Update Task
    task.status = 'assigned';
    task.helperId = bid.helperId._id;
    task.selectedBid = bid._id;
    task.budget.amount = bid.proposedAmount; // Finalize agreed amount
    task.timeline.assignedAt = new Date();
    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('customerId', 'name avatar stats phone')
      .populate('helperId', 'name avatar stats phone')
      .populate('selectedBid');

    // Notify Helper
    const helperNotification = await Notification.create({
      userId: bid.helperId._id,
      type: 'bid_accepted',
      title: 'Your Bid was Accepted! 🎉',
      body: `You are assigned to "${task.title}" for ₹${bid.proposedAmount}. Contact the customer to begin!`,
      data: { taskId: task._id },
    });

    emitToUser(bid.helperId._id, 'notification', helperNotification);
    emitToUser(bid.helperId._id, 'task_assigned', updatedTask);
    emitToTaskRoom(task._id, 'task_status_changed', updatedTask);
    broadcastToAll('task_updated', updatedTask);

    if (bid.helperId?.fcmToken) {
      sendPushNotification(bid.helperId.fcmToken, {
        title: 'Bid Accepted!',
        body: `You have been selected for "${task.title}".`,
        data: { taskId: task._id.toString() },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Bid accepted and helper assigned',
      data: updatedTask,
    });
  } catch (error) {
    console.error('[Task Controller - acceptBid]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to accept bid',
      error: error.message,
    });
  }
};

// @desc    Start task execution (Helper)
// @route   POST /api/tasks/:id/start
// @access  Private (Assigned Helper)
const startTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('customerId', 'name avatar fcmToken');
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (task.helperId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the assigned helper can start the task' });
    }

    task.status = 'in_progress';
    task.timeline.startedAt = new Date();
    await task.save();

    const notif = await Notification.create({
      userId: task.customerId._id,
      type: 'task_started',
      title: 'Task Started 🚀',
      body: `${req.user.name} has started working on "${task.title}".`,
      data: { taskId: task._id },
    });

    emitToUser(task.customerId._id, 'notification', notif);
    emitToTaskRoom(task._id, 'task_status_changed', task);

    return res.status(200).json({
      success: true,
      message: 'Task is now in progress',
      data: task,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to start task', error: error.message });
  }
};

// @desc    Submit category-specific completion proof and verify OTP (Helper)
// @route   POST /api/tasks/:id/submit-proof
// @access  Private (Helper)
const submitProof = async (req, res) => {
  try {
    const { description, otp, helperLng, helperLat } = req.body;
    const task = await Task.findById(req.params.id)
      .populate('customerId', 'name avatar fcmToken phone')
      .populate('helperId', 'name avatar fcmToken phone');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (task.helperId?._id?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the assigned helper can submit completion proof' });
    }

    if (task.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Task is already marked as completed' });
    }

    // 1. Verify Completion OTP
    const cleanSubmittedOtp = (otp || '').toString().trim();
    const taskExpectedOtp = (task.completionOtp || '').toString().trim();

    if (!cleanSubmittedOtp || cleanSubmittedOtp !== taskExpectedOtp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Completion OTP. Please ask the customer for the 4-digit verification code shown in their app.',
      });
    }

    // 2. Upload proof images (if provided)
    const proofImages = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploadPromise = new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'samn_proofs', resource_type: 'image' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result.secure_url);
            }
          );
          stream.end(file.buffer);
        });
        const url = await uploadPromise;
        proofImages.push(url);
      }
    }

    // 3. Category-Specific Validation & Verification Tag
    const photoRequiredCategories = [
      'car_wash',
      'gardening',
      'repair',
      'cleaning',
      'pet_grooming',
      'delivery',
      'grocery',
      'moving',
    ];

    const inPersonCategories = [
      'care_taker',
      'hospital_accompany',
      'tutoring',
      'cooking',
      'pet_care',
      'tech_help',
    ];

    let verifiedVia = 'otp_handshake';
    let geofenceVerified = false;
    let distanceAtCompletionMeters = 0;

    // Geofence check if helper coordinates provided
    if (helperLng && helperLat && task.location?.coordinates) {
      const { calculateDistanceKm } = require('../services/geo.service');
      const distKm = calculateDistanceKm([parseFloat(helperLng), parseFloat(helperLat)], task.location.coordinates);
      distanceAtCompletionMeters = Math.round(distKm * 1000);
      if (distanceAtCompletionMeters <= 1000) {
        geofenceVerified = true;
      }
    }

    // 3. Update Task to Completed
    task.status = 'completed';
    task.proof = {
      images: proofImages,
      description: description || 'Task successfully completed and verified via Customer OTP',
      submittedAt: new Date(),
      verifiedVia,
      geofenceVerified,
      distanceAtCompletionMeters,
    };
    task.timeline.completedAt = new Date();
    await task.save();

    // Increment helper stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: {
        'stats.tasksCompleted': 1,
        'stats.totalEarned': task.budget.amount,
      },
    });

    // Increment customer stats
    await User.findByIdAndUpdate(task.customerId._id, {
      $inc: {
        'stats.totalSpent': task.budget.amount,
      },
    });

    const notif = await Notification.create({
      userId: task.customerId._id,
      type: 'proof_submitted',
      title: 'Task Verified & Completed! 🎉',
      body: `${req.user.name} entered the completion OTP and finished "${task.title}". Payment released!`,
      data: { taskId: task._id },
    });

    emitToUser(task.customerId._id, 'notification', notif);
    emitToTaskRoom(task._id, 'task_status_changed', task);
    broadcastToAll('task_updated', task);

    if (task.customerId?.fcmToken) {
      sendPushNotification(task.customerId.fcmToken, {
        title: 'Task Completed & Verified!',
        body: `Your task "${task.title}" has been successfully completed with proof.`,
        data: { taskId: task._id.toString() },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Task verified with evident proof and marked as completed',
      data: task,
    });
  } catch (error) {
    console.error('[Task Controller - submitProof]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit proof',
      error: error.message,
    });
  }
};

// @desc    Customer directly approves and completes task (Customer)
// @route   POST /api/tasks/:id/approve-completion
// @access  Private (Customer)
const approveCompletion = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('customerId', 'name avatar fcmToken')
      .populate('helperId', 'name avatar fcmToken');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (task.customerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the customer who posted this task can approve completion' });
    }

    if (task.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Task is already marked as completed' });
    }

    task.status = 'completed';
    task.proof = {
      images: task.proof?.images || [],
      description: 'Approved directly by customer',
      submittedAt: new Date(),
      verifiedVia: 'manual_customer_approval',
      geofenceVerified: true,
      distanceAtCompletionMeters: 0,
    };
    task.timeline.completedAt = new Date();
    await task.save();

    if (task.helperId) {
      await User.findByIdAndUpdate(task.helperId._id, {
        $inc: {
          'stats.tasksCompleted': 1,
          'stats.totalEarned': task.budget.amount,
        },
      });

      const notif = await Notification.create({
        userId: task.helperId._id,
        type: 'task_completed',
        title: 'Task Approved by Customer! 🎉',
        body: `Customer ${req.user.name} confirmed completion for "${task.title}". ₹${task.budget.amount} added to your earnings!`,
        data: { taskId: task._id },
      });
      emitToUser(task.helperId._id, 'notification', notif);
    }

    emitToTaskRoom(task._id, 'task_status_changed', task);
    broadcastToAll('task_updated', task);

    return res.status(200).json({
      success: true,
      message: 'Task successfully marked as completed',
      data: task,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to approve completion', error: error.message });
  }
};

// @desc    Cancel a task
// @route   POST /api/tasks/:id/cancel
// @access  Private (Customer or Helper)
const cancelTask = async (req, res) => {
  try {
    const { reason } = req.body;
    const task = await Task.findById(req.params.id)
      .populate('customerId', 'name avatar fcmToken')
      .populate('helperId', 'name avatar fcmToken');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const isCustomer = task.customerId._id.toString() === req.user._id.toString();
    const isHelper = task.helperId && task.helperId._id.toString() === req.user._id.toString();

    if (!isCustomer && !isHelper) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this task' });
    }

    if (task.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Completed tasks cannot be cancelled' });
    }

    task.status = 'cancelled';
    task.timeline.cancelledAt = new Date();
    await task.save();

    const recipient = isCustomer ? task.helperId : task.customerId;
    if (recipient) {
      const notif = await Notification.create({
        userId: recipient._id,
        type: 'task_cancelled',
        title: 'Task Cancelled',
        body: `Task "${task.title}" was cancelled. Reason: ${reason || 'No reason provided'}`,
        data: { taskId: task._id },
      });
      emitToUser(recipient._id, 'notification', notif);
    }

    emitToTaskRoom(task._id, 'task_status_changed', task);
    broadcastToAll('task_updated', task);

    return res.status(200).json({
      success: true,
      message: 'Task cancelled successfully',
      data: task,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to cancel task', error: error.message });
  }
};

// @desc    Reject an individual helper bid (Customer)
// @route   POST /api/tasks/:id/reject-bid
// @access  Private (Customer)
const rejectBid = async (req, res) => {
  try {
    const { bidId } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (task.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to manage this task' });
    }

    const bid = await TaskBid.findById(bidId).populate('helperId', 'name avatar fcmToken');
    if (!bid || bid.taskId.toString() !== task._id.toString()) {
      return res.status(404).json({ success: false, message: 'Bid not found for this task' });
    }

    bid.status = 'rejected';
    await bid.save();

    // Remove rejected bid from task.bids array
    task.bids = task.bids.filter((b) => b.toString() !== bidId.toString());
    await task.save();

    // Notify Helper
    try {
      const helperNotification = await Notification.create({
        userId: bid.helperId._id,
        type: 'bid_received',
        title: 'Offer Declined',
        body: `Your offer for "${task.title}" was declined by the customer.`,
        data: { taskId: task._id },
      });
      emitToUser(bid.helperId._id, 'notification', helperNotification);
    } catch (e) {}

    const updatedTask = await Task.findById(task._id)
      .populate('customerId', 'name avatar stats phone')
      .populate({
        path: 'bids',
        populate: { path: 'helperId', select: 'name avatar stats' },
      });

    broadcastToAll('task_updated', updatedTask);

    return res.status(200).json({
      success: true,
      message: 'Offer rejected successfully',
      data: updatedTask,
    });
  } catch (error) {
    console.error('[Task Controller - rejectBid]:', error);
    return res.status(500).json({ success: false, message: 'Failed to reject offer', error: error.message });
  }
};

// @desc    Cancel helper assignment / unassign helper and reopen task (Customer or Helper)
// @route   POST /api/tasks/:id/cancel-assignment
// @access  Private (Customer or Helper)
const cancelAssignment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('customerId', 'name avatar fcmToken')
      .populate('helperId', 'name avatar fcmToken');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const isCustomer = task.customerId._id.toString() === req.user._id.toString();
    const isHelper = task.helperId && task.helperId._id.toString() === req.user._id.toString();

    if (!isCustomer && !isHelper) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this task assignment' });
    }

    if (task.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Completed tasks cannot be unassigned' });
    }

    const prevHelper = task.helperId;

    // Reset task back to open/broadcasted
    task.status = 'open';
    task.helperId = null;
    task.selectedBid = null;
    task.timeline.assignedAt = null;
    task.timeline.startedAt = null;
    await task.save();

    // Notify the unassigned party
    if (prevHelper && isCustomer) {
      try {
        const notif = await Notification.create({
          userId: prevHelper._id,
          type: 'task_cancelled',
          title: 'Assignment Cancelled',
          body: `The assignment for "${task.title}" was cancelled by the customer. The task has been reopened.`,
          data: { taskId: task._id },
        });
        emitToUser(prevHelper._id, 'notification', notif);
      } catch (e) {}
    } else if (isHelper && task.customerId) {
      try {
        const notif = await Notification.create({
          userId: task.customerId._id,
          type: 'task_cancelled',
          title: 'Helper Withdrew from Task',
          body: `Helper ${req.user.name} withdrew from "${task.title}". Your task is now open for new helper offers.`,
          data: { taskId: task._id },
        });
        emitToUser(task.customerId._id, 'notification', notif);
      } catch (e) {}
    }

    const updatedTask = await Task.findById(task._id)
      .populate('customerId', 'name avatar stats phone')
      .populate({
        path: 'bids',
        populate: { path: 'helperId', select: 'name avatar stats' },
      });

    emitToTaskRoom(task._id, 'task_status_changed', updatedTask);
    broadcastToAll('task_updated', updatedTask);
    broadcastToAll('task_created', updatedTask);

    return res.status(200).json({
      success: true,
      message: 'Assignment cancelled and task reopened successfully',
      data: updatedTask,
    });
  } catch (error) {
    console.error('[Task Controller - cancelAssignment]:', error);
    return res.status(500).json({ success: false, message: 'Failed to cancel assignment', error: error.message });
  }
};

// @desc    Permanently delete task (Customer only)
// @route   DELETE /api/tasks/:id
// @access  Private (Customer)
const deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (task.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this task' });
    }

    // Clean up associated bids
    await TaskBid.deleteMany({ taskId });

    // Clean up associated notifications
    await Notification.deleteMany({ 'data.taskId': taskId });

    // Delete the task
    await Task.findByIdAndDelete(taskId);

    // Broadcast deletion event via sockets
    emitToTaskRoom(taskId, 'task_deleted', { taskId });
    broadcastToAll('task_deleted', { taskId });

    return res.status(200).json({
      success: true,
      message: 'Task permanently deleted',
      data: { taskId },
    });
  } catch (error) {
    console.error('[Task Controller - deleteTask]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete task',
      error: error.message,
    });
  }
};

module.exports = {
  createTask,
  getNearbyTasks,
  getMyTasks,
  getTaskById,
  submitBid,
  acceptBid,
  rejectBid,
  cancelAssignment,
  startTask,
  submitProof,
  approveCompletion,
  cancelTask,
  deleteTask,
};
