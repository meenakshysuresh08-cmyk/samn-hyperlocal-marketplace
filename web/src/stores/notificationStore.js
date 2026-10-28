import { create } from 'zustand';
import API from '../services/api';
import { getSocket } from '../services/socket';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    try {
      set({ isLoading: true });
      const res = await API.get('/notifications');
      set({
        notifications: res.data.data,
        unreadCount: res.data.unreadCount || 0,
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      set((state) => ({
        notifications: state.notifications.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (err) {}
  },

  markAllAsRead: async () => {
    try {
      await API.put('/notifications/mark-all-read');
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (err) {}
  },

  bindNotificationEvents: () => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('notification', (newNotif) => {
      set((state) => ({
        notifications: [newNotif, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      }));
    });
  },
}));
