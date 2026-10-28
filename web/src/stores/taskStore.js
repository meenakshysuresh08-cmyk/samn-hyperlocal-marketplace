import { create } from 'zustand';
import API from '../services/api';
import { getSocket } from '../services/socket';
import { useAuthStore } from './authStore';

export const useTaskStore = create((set, get) => ({
  nearbyTasks: [],
  myTasks: [],
  currentTask: null,
  nearbyHelpers: [],
  isLoading: false,
  error: null,
  filters: {
    category: 'all',
    radius: 15000, // 15km default
    minBudget: '',
    maxBudget: '',
    isUrgent: false,
    searchQuery: '',
  },

  // Set filter
  setFilter: (key, value) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    }));
  },

  // Reset filters
  resetFilters: () => {
    set({
      filters: {
        category: 'all',
        radius: 15000,
        minBudget: '',
        maxBudget: '',
        isUrgent: false,
        searchQuery: '',
      },
    });
  },

  // Fetch nearby tasks based on location and filters
  fetchNearbyTasks: async (coords) => {
    try {
      set({ isLoading: true, error: null });
      const { filters } = get();
      const authState = useAuthStore.getState();
      const activeCoords =
        coords && coords.length === 2 && (coords[0] !== 0 || coords[1] !== 0)
          ? coords
          : authState.userLocation?.coordinates || authState.user?.location?.coordinates;

      const params = {
        radius: filters.radius,
        category: filters.category,
        isUrgent: filters.isUrgent,
      };

      if (activeCoords && activeCoords.length >= 2 && (activeCoords[0] !== 0 || activeCoords[1] !== 0)) {
        params.lng = activeCoords[0];
        params.lat = activeCoords[1];
      } else {
        params.lng = 77.5946;
        params.lat = 12.9716;
      }

      if (filters.minBudget) params.minBudget = filters.minBudget;
      if (filters.maxBudget) params.maxBudget = filters.maxBudget;

      const res = await API.get('/tasks/nearby', { params });
      set({ nearbyTasks: res.data.data, isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch tasks', isLoading: false });
    }
  },

  // Fetch user's own tasks
  fetchMyTasks: async (role = 'customer') => {
    try {
      set({ isLoading: true });
      const res = await API.get('/tasks/my-tasks', { params: { role } });
      set({ myTasks: res.data.data, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
    }
  },

  // Fetch single task details
  fetchTaskById: async (taskId) => {
    try {
      set({ isLoading: true, error: null });
      const res = await API.get(`/tasks/${taskId}`);
      set({ currentTask: res.data.data, isLoading: false });
      return res.data.data;
    } catch (err) {
      set({ error: 'Failed to load task', isLoading: false });
      return null;
    }
  },

  // Fetch nearby helpers for radar map
  fetchNearbyHelpers: async (coords) => {
    try {
      const res = await API.get('/users/nearby-helpers', {
        params: {
          lng: coords ? coords[0] : 77.5946,
          lat: coords ? coords[1] : 12.9716,
          radius: 15000,
        },
      });
      set({ nearbyHelpers: res.data.data });
    } catch (err) {
      console.warn('Failed to load helpers:', err.message);
    }
  },

  // Create new task
  createTask: async (taskData) => {
    try {
      set({ isLoading: true });
      const res = await API.post('/tasks', taskData);
      const newTask = res.data.data;
      set((state) => ({
        // Ensure customer's own task is NOT placed in nearbyTasks feed
        nearbyTasks: state.nearbyTasks.filter((t) => t._id !== newTask._id),
        myTasks: [newTask, ...state.myTasks.filter((t) => t._id !== newTask._id)],
        isLoading: false,
      }));
      return { success: true, task: newTask };
    } catch (err) {
      set({ isLoading: false });
      return { success: false, message: err.response?.data?.message || 'Failed to post task' };
    }
  },

  // Submit Bid
  submitBid: async (taskId, bidData) => {
    try {
      const res = await API.post(`/tasks/${taskId}/bid`, bidData);
      return { success: true, bid: res.data.data };
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to submit bid';
      return { success: false, message: errorMsg };
    }
  },

  // Accept Bid
  acceptBid: async (taskId, bidId) => {
    try {
      const res = await API.post(`/tasks/${taskId}/accept-bid`, { bidId });
      const updatedTask = res.data.data;
      set({ currentTask: updatedTask });
      return { success: true, task: updatedTask };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to accept bid' };
    }
  },

  // Start Task
  startTask: async (taskId) => {
    try {
      const res = await API.post(`/tasks/${taskId}/start`);
      const updatedTask = res.data.data;
      set({ currentTask: updatedTask });
      return { success: true };
    } catch (err) {
      return { success: false, message: 'Failed to start task' };
    }
  },

  // Submit Category-Specific Completion Proof with OTP
  submitProof: async (taskId, formData) => {
    try {
      const res = await API.post(`/tasks/${taskId}/submit-proof`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const updatedTask = res.data.data;
      set({ currentTask: updatedTask });
      return { success: true, task: updatedTask };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit proof and verify OTP';
      return { success: false, message: msg };
    }
  },

  // Customer Approves Completion Directly
  approveCompletion: async (taskId) => {
    try {
      const res = await API.post(`/tasks/${taskId}/approve-completion`);
      const updatedTask = res.data.data;
      set({ currentTask: updatedTask });
      return { success: true, task: updatedTask };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to approve completion';
      return { success: false, message: msg };
    }
  },

  // Cancel Task
  cancelTask: async (taskId, reason) => {
    try {
      const res = await API.post(`/tasks/${taskId}/cancel`, { reason });
      const updatedTask = res.data.data;
      set({ currentTask: updatedTask });
      return { success: true };
    } catch (err) {
      return { success: false, message: 'Failed to cancel task' };
    }
  },

  // Real-time socket event integrations
  bindSocketEvents: () => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('task_created', (newTask) => {
      const currentUserId = useAuthStore.getState().user?._id;
      const taskCustId = newTask.customerId?._id || newTask.customerId;
      // Do not add task to nearbyTasks if it was created by current user
      if (currentUserId && taskCustId && taskCustId.toString() === currentUserId.toString()) {
        return;
      }
      set((state) => {
        // Prevent duplicate
        if (state.nearbyTasks.some((t) => t._id === newTask._id)) return state;
        return { nearbyTasks: [newTask, ...state.nearbyTasks] };
      });
    });

    socket.on('task_updated', (updatedTask) => {
      set((state) => ({
        nearbyTasks: state.nearbyTasks.map((t) => (t._id === updatedTask._id ? updatedTask : t)),
        myTasks: state.myTasks.map((t) => (t._id === updatedTask._id ? updatedTask : t)),
        currentTask: state.currentTask?._id === updatedTask._id ? updatedTask : state.currentTask,
      }));
    });

    socket.on('task_broadcasted', (broadcastData) => {
      set((state) => ({
        nearbyTasks: state.nearbyTasks.map((t) =>
          t._id === broadcastData.taskId ? { ...t, status: 'broadcasted', isUrgent: true } : t
        ),
      }));
    });
  },
}));
