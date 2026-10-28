import { io } from 'socket.io-client';

let socket = null;

export const initializeSocket = (token) => {
  if (socket) {
    socket.disconnect();
  }

  const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
  
  socket = io(socketUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('[SAMN Socket.IO] Connected:', socket.id);
  });

  socket.on('connect_error', (error) => {
    console.warn('[SAMN Socket.IO] Connection Error:', error.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('[SAMN Socket.IO] Disconnected:', reason);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    const token = localStorage.getItem('samn_token');
    return initializeSocket(token);
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
