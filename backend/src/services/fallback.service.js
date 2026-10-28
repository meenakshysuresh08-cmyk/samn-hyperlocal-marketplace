const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { emitToUser, emitToTaskRoom, broadcastToAll } = require('./socket.service');
const { sendPushNotification } = require('./fcm.service');

/**
 * Checks for tasks posted >= 15 minutes ago with status 'open' and fallback.isBroadcasted = false
 * Expands their radius, finds nearby active helpers, and broadcasts notifications.
 */
const checkAndExecuteFallbackBroadcast = async () => {
  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const staleTasks = await Task.find({
      status: 'open',
      'fallback.isBroadcasted': { $ne: true },
      createdAt: { $lte: fifteenMinutesAgo },
    }).populate('customerId', 'name avatar fcmToken');

    if (staleTasks.length === 0) {
      return { broadcastedCount: 0 };
    }

    console.log(`[Fallback Job] Found ${staleTasks.length} tasks ready for fallback broadcast`);

    for (const task of staleTasks) {
      const expandedRadius = (task.fallback?.broadcastRadius || 5000) * 2; // e.g. 10km or 15km (in meters)

      // Find eligible helpers in the expanded radius (2dsphere geospatial search)
      const nearbyHelpers = await User.find({
        _id: { $ne: task.customerId?._id },
        activeRole: 'helper',
        isActive: true,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: task.location.coordinates,
            },
            $maxDistance: expandedRadius,
          },
        },
      }).select('_id name fcmToken');

      const helperIds = nearbyHelpers.map((h) => h._id);

      // Update task record
      task.status = 'broadcasted';
      task.fallback = {
        isBroadcasted: true,
        broadcastedAt: new Date(),
        broadcastRadius: expandedRadius,
        broadcastedTo: helperIds,
      };
      await task.save();

      // Notify Customer
      const customerNotification = await Notification.create({
        userId: task.customerId._id,
        type: 'fallback_broadcast',
        title: 'Task broadcasted to wider area!',
        body: `Your task "${task.title}" has been broadcasted to ${nearbyHelpers.length} helpers within ${expandedRadius / 1000}km.`,
        data: { taskId: task._id },
      });

      emitToUser(task.customerId._id, 'notification', customerNotification);
      emitToUser(task.customerId._id, 'task_updated', task);

      if (task.customerId?.fcmToken) {
        await sendPushNotification(task.customerId.fcmToken, {
          title: 'Wider broadcast activated',
          body: `We expanded search to ${expandedRadius / 1000}km for "${task.title}".`,
          data: { taskId: task._id.toString() },
        });
      }

      // Notify each nearby helper
      for (const helper of nearbyHelpers) {
        const helperNotification = await Notification.create({
          userId: helper._id,
          type: 'fallback_broadcast',
          title: 'Urgent Task Nearby!',
          body: `New broadcasted task: "${task.title}" (₹${task.budget.amount}). Be the first to assist!`,
          data: { taskId: task._id },
        });

        emitToUser(helper._id, 'notification', helperNotification);

        if (helper.fcmToken) {
          sendPushNotification(helper.fcmToken, {
            title: 'Urgent Task Nearby!',
            body: `"${task.title}" is waiting for a helper in your area.`,
            data: { taskId: task._id.toString() },
          });
        }
      }

      // Global socket event for real-time task maps & feeds
      broadcastToAll('task_broadcasted', {
        taskId: task._id,
        title: task.title,
        budget: task.budget,
        location: task.location,
        expandedRadius,
      });

      console.log(`[Fallback Job] Broadcasted task ${task._id} (${task.title}) to ${nearbyHelpers.length} helpers`);
    }

    return { broadcastedCount: staleTasks.length };
  } catch (error) {
    console.error('[Fallback Service Error] Execution failed:', error);
    return { error: error.message };
  }
};

module.exports = {
  checkAndExecuteFallbackBroadcast,
};
