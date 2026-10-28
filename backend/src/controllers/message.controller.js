const Message = require('../models/Message');
const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');
const cloudinary = require('../config/cloudinary');
const { emitToUser, emitToTaskRoom } = require('../services/socket.service');
const { sendPushNotification } = require('../services/fcm.service');

// @desc    Get messages for a task chat room
// @route   GET /api/messages/task/:taskId
// @access  Private
const getTaskMessages = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const userId = req.user._id.toString();
    const isCustomer = task.customerId?.toString() === userId;
    const isHelper = task.helperId && task.helperId.toString() === userId;

    if (!isCustomer && !isHelper) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access messages for this task',
      });
    }

    const messages = await Message.find({ taskId })
      .populate('senderId', 'name avatar')
      .populate('receiverId', 'name avatar')
      .sort({ createdAt: 1 });

    // Mark unread messages as read for this user
    await Message.updateMany(
      { taskId, receiverId: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    return res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    console.error('[Message Controller - getTaskMessages]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve messages',
      error: error.message,
    });
  }
};

// @desc    Get all chat conversations / sessions for the logged in user
// @route   GET /api/messages/conversations
// @access  Private
const getUserConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all tasks where user is customer or helper, or where messages exist involving user
    const tasks = await Task.find({
      $or: [{ customerId: userId }, { helperId: userId }],
    })
      .populate('customerId', 'name avatar phone')
      .populate('helperId', 'name avatar phone')
      .sort({ updatedAt: -1 });

    const conversations = [];

    for (const task of tasks) {
      const lastMessage = await Message.findOne({ taskId: task._id })
        .populate('senderId', 'name avatar')
        .sort({ createdAt: -1 });

      const unreadCount = await Message.countDocuments({
        taskId: task._id,
        receiverId: userId,
        isRead: false,
      });

      const isCustomer = task.customerId?._id?.toString() === userId.toString();
      const participant = isCustomer ? task.helperId : task.customerId;

      conversations.push({
        taskId: task._id,
        taskTitle: task.title,
        taskStatus: task.status,
        taskCategory: task.category,
        taskBudget: task.budget,
        participant: participant || {
          name: isCustomer ? 'Waiting for Helper' : 'Customer',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
        },
        isCustomer,
        lastMessage: lastMessage
          ? {
              content: lastMessage.content || (lastMessage.mediaUrl ? '📷 Photo' : ''),
              createdAt: lastMessage.createdAt,
              senderId: lastMessage.senderId?._id,
              senderName: lastMessage.senderId?.name,
            }
          : null,
        unreadCount,
        updatedAt: lastMessage ? lastMessage.createdAt : task.updatedAt,
      });
    }

    // Sort by latest message date or task update
    conversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    return res.status(200).json({
      success: true,
      count: conversations.length,
      data: conversations,
    });
  } catch (error) {
    console.error('[Message Controller - getUserConversations]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve conversations',
      error: error.message,
    });
  }
};

// @desc    Send a message in task chat
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { taskId, content, type = 'text', receiverId: customReceiverId } = req.body;

    if (!taskId) {
      return res.status(400).json({ success: false, message: 'taskId is required' });
    }

    const task = await Task.findById(taskId)
      .populate('customerId', 'name avatar fcmToken')
      .populate('helperId', 'name avatar fcmToken');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Verify sender authorization: must be task customer or assigned helper
    const userId = req.user._id.toString();
    const isCustomer = task.customerId?._id?.toString() === userId;
    const isHelper = task.helperId && task.helperId._id?.toString() === userId;

    if (!isCustomer && !isHelper) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send messages in this task conversation',
      });
    }

    // Determine receiver
    let receiver = isCustomer ? task.helperId : task.customerId;

    if (!receiver) {
      return res.status(400).json({
        success: false,
        message: isCustomer
          ? 'Cannot send message: no helper is currently assigned to this task'
          : 'Cannot send message: task customer details not found',
      });
    }

    let mediaUrl = null;
    if (req.file) {
      const uploadPromise = new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'samn_chat', resource_type: 'auto' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );
        stream.end(req.file.buffer);
      });
      mediaUrl = await uploadPromise;
    }

    const message = await Message.create({
      taskId,
      roomId: `task_${taskId}`,
      senderId: req.user._id,
      receiverId: receiver._id,
      type: mediaUrl ? 'image' : type,
      content: content || '',
      mediaUrl,
      isRead: false,
    });

    const populatedMsg = await Message.findById(message._id)
      .populate('senderId', 'name avatar')
      .populate('receiverId', 'name avatar');

    // Emit live socket event to task room & direct user
    emitToTaskRoom(taskId, 'receive_message', populatedMsg);

    if (receiver && receiver._id) {
      emitToUser(receiver._id, 'new_message', populatedMsg);

      // FCM Notification
      if (receiver.fcmToken) {
        sendPushNotification(receiver.fcmToken, {
          title: `${req.user.name} sent a message`,
          body: content || 'Sent an attachment',
          data: { taskId: taskId.toString(), messageId: message._id.toString() },
        });
      }
    }

    return res.status(201).json({
      success: true,
      data: populatedMsg,
    });
  } catch (error) {
    console.error('[Message Controller - sendMessage]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message,
    });
  }
};

// @desc    Mark messages as read in room
// @route   POST /api/messages/mark-read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const { taskId } = req.body;
    if (!taskId) {
      return res.status(400).json({ success: false, message: 'taskId is required' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const userId = req.user._id.toString();
    const isCustomer = task.customerId?.toString() === userId;
    const isHelper = task.helperId && task.helperId.toString() === userId;

    if (!isCustomer && !isHelper) {
      return res.status(403).json({ success: false, message: 'Not authorized for this task conversation' });
    }

    await Message.updateMany(
      { taskId, receiverId: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    emitToTaskRoom(taskId, 'messages_read', {
      taskId,
      readerId: req.user._id,
    });

    return res.status(200).json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to mark read', error: error.message });
  }
};

module.exports = {
  getTaskMessages,
  getUserConversations,
  sendMessage,
  markAsRead,
};
