const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Task = require('../models/Task');

let ioInstance = null;

const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
        const user = await User.findById(decoded.id).select('-passwordHash');
        if (user) {
          socket.user = user;
          return next();
        }
      }
      // Allow unauthenticated socket for public task browsing if needed, but mark as guest
      socket.user = null;
      next();
    } catch (err) {
      console.warn('[Socket Auth Warning] Handshake auth failed, proceeding as guest:', err.message);
      socket.user = null;
      next();
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user?._id?.toString();
    console.log(`[Socket.IO] Client connected: ${socket.id} (User: ${userId || 'Guest'})`);

    if (userId) {
      // Join personal room for private notifications & messages
      socket.join(`user:${userId}`);

      // Update user online status
      await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
      io.emit('user_status_changed', { userId, isOnline: true });
    }

    // Join task-specific chat room (only authorized participants)
    socket.on('join_task_room', async (taskId) => {
      if (!taskId) return;
      if (!socket.user) {
        socket.emit('socket_error', { message: 'Authentication required to join task chat' });
        return;
      }
      try {
        const task = await Task.findById(taskId).select('customerId helperId');
        if (!task) {
          socket.emit('socket_error', { message: 'Task not found' });
          return;
        }
        const userIdStr = socket.user._id.toString();
        const isCustomer = task.customerId?.toString() === userIdStr;
        const isHelper = task.helperId && task.helperId.toString() === userIdStr;
        if (isCustomer || isHelper) {
          socket.join(`task:${taskId}`);
          console.log(`[Socket.IO] Authorized socket ${socket.id} (user ${userIdStr}) joined task:${taskId}`);
        } else {
          socket.emit('socket_error', { message: 'Not authorized to join this task chat room' });
        }
      } catch (err) {
        console.warn(`[Socket.IO] Error validating task room join for task ${taskId}:`, err.message);
      }
    });

    // Leave task-specific chat room
    socket.on('leave_task_room', (taskId) => {
      if (taskId) {
        socket.leave(`task:${taskId}`);
        console.log(`[Socket.IO] Socket ${socket.id} left task:${taskId}`);
      }
    });

    // Real-time typing indicators
    socket.on('typing_start', ({ taskId, receiverId }) => {
      if (taskId) {
        socket.to(`task:${taskId}`).emit('typing_start', {
          taskId,
          userId: socket.user?._id,
          userName: socket.user?.name,
        });
      }
    });

    socket.on('typing_stop', ({ taskId, receiverId }) => {
      if (taskId) {
        socket.to(`task:${taskId}`).emit('typing_stop', {
          taskId,
          userId: socket.user?._id,
        });
      }
    });

    // Live location update from helper/customer
    socket.on('update_location', async ({ coordinates, address }) => {
      if (userId && coordinates && coordinates.length === 2) {
        await User.findByIdAndUpdate(userId, {
          location: {
            type: 'Point',
            coordinates,
            address: address || 'Current Location',
          },
          lastSeen: new Date(),
        });
        io.emit('helper_location_updated', {
          userId,
          coordinates,
          address,
        });
      }
    });

    // Real-time live helper location streaming for assigned task
    socket.on('send_helper_location', ({ taskId, coordinates, heading, speed }) => {
      if (taskId && coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
        io.to(`task:${taskId}`).emit('helper_live_location', {
          taskId,
          helperId: userId,
          coordinates,
          heading: heading || 0,
          speed: speed || 0,
          timestamp: new Date(),
        });
      }
    });

    // Disconnect handling
    socket.on('disconnect', async () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
      if (userId) {
        await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
        io.emit('user_status_changed', { userId, isOnline: false });
      }
    });
  });

  ioInstance = io;
  return io;
};

const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.IO not initialized! Call initSocket first.');
  }
  return ioInstance;
};

module.exports = { initSocket, getIO };
