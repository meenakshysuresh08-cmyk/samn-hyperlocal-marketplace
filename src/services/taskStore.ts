import { create } from 'zustand';
import API from './api';
import { getMobileSocket } from './socket';
import { useAuthStore } from './authStore';
import { calculateDistanceKm } from './locationService';

export interface TaskItem {
  _id: string;
  title: string;
  description: string;
  category: string;
  customerId: any;
  helperId?: any;
  location: {
    address: string;
    landmark?: string;
    coordinates?: [number, number];
  };
  recipient?: {
    forSelf: boolean;
    name?: string;
    phone?: string;
    landmark?: string;
    notes?: string;
  };
  budget: {
    amount: number;
    currency: string;
    type: string;
  };
  isUrgent: boolean;
  searchRadius: number;
  status: 'open' | 'broadcasted' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  completionOtp?: string;
  bids: Array<{
    _id: string;
    helperId: any;
    proposedAmount: number;
    message?: string;
    status: string;
    estimatedTime?: string;
    createdAt: string;
  }>;
  selectedBid?: any;
  timeline?: {
    postedAt: string;
    assignedAt?: string;
    startedAt?: string;
    completedAt?: string;
    scheduledFor?: string;
    scheduledText?: string;
  };
  distanceKm?: number;
}

interface TaskState {
  nearbyTasks: TaskItem[];
  myTasks: TaskItem[];
  currentTask: TaskItem | null;
  isLoading: boolean;
  error: string | null;
  selectedCategory: string;
  searchRadius: number;
  fetchNearbyTasks: (coords?: [number, number]) => Promise<void>;
  fetchMyTasks: (role?: string) => Promise<void>;
  fetchTaskById: (id: string) => Promise<TaskItem | null>;
  createTask: (data: any) => Promise<{ success: boolean; task?: any; message?: string }>;
  submitBid: (taskId: string, bidData: any) => Promise<{ success: boolean; message?: string }>;
  acceptBid: (taskId: string, bidId: string) => Promise<{ success: boolean; message?: string }>;
  rejectBid: (taskId: string, bidId: string) => Promise<{ success: boolean; message?: string }>;
  cancelAssignment: (taskId: string) => Promise<{ success: boolean; message?: string }>;
  startTask: (taskId: string) => Promise<{ success: boolean; message?: string }>;
  submitProof: (taskId: string, formData: any) => Promise<{ success: boolean; message?: string }>;
  approveCompletion: (taskId: string) => Promise<{ success: boolean; message?: string }>;
  deleteTask: (taskId: string) => Promise<{ success: boolean; message?: string }>;
  setSelectedCategory: (category: string) => void;
  setSearchRadius: (radius: number) => void;
  bindSocketListeners: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  nearbyTasks: [],
  myTasks: [],
  currentTask: null,
  isLoading: false,
  error: null,
  selectedCategory: 'all',
  searchRadius: 25000,

  setSelectedCategory: (selectedCategory) => {
    set({ selectedCategory });
    get().fetchNearbyTasks();
  },
  setSearchRadius: (searchRadius) => {
    const user = useAuthStore.getState().user;
    const userCoords = user?.location?.coordinates;
    const radiusKm = searchRadius / 1000;

    // 1. Instant client-side filter so UI updates in 0ms without delay
    set((state) => ({
      searchRadius,
      nearbyTasks: state.nearbyTasks.filter((t) => {
        if (t.distanceKm !== undefined && t.distanceKm !== null) {
          return t.distanceKm <= radiusKm;
        }
        if (t.location?.coordinates && userCoords && userCoords.length === 2 && (userCoords[0] !== 0 || userCoords[1] !== 0)) {
          const dist = calculateDistanceKm(userCoords, t.location.coordinates);
          return dist <= radiusKm;
        }
        return true;
      }),
    }));

    // 2. Fetch full results within new radius boundary from server
    get().fetchNearbyTasks(userCoords);
  },

  fetchNearbyTasks: async (coords) => {
    try {
      set({ isLoading: true, error: null });
      const { selectedCategory, searchRadius } = get();
      const user = useAuthStore.getState().user;
      const userCoords = user?.location?.coordinates;
      const activeCoords = coords || (userCoords && userCoords.length === 2 && (userCoords[0] !== 0 || userCoords[1] !== 0) ? userCoords : null);

      const params: any = {
        radius: searchRadius || 25000,
        role: user?.activeRole || 'helper',
      };
      if (activeCoords) {
        params.lng = activeCoords[0];
        params.lat = activeCoords[1];
      }
      if (selectedCategory && selectedCategory !== 'all') {
        params.category = selectedCategory;
      }

      const res = await API.get('/tasks/nearby', { params });
      if (res.data?.success && Array.isArray(res.data.data)) {
        const radiusKm = (searchRadius || 25000) / 1000;
        const currentUserId = user?._id;

        const strictlyFiltered = res.data.data
          .filter((task: any) => {
            const taskCreatorId = task.customerId?._id || task.customerId;
            if (currentUserId && taskCreatorId && String(taskCreatorId) === String(currentUserId)) {
              return false;
            }
            if (activeCoords && task.location?.coordinates && Array.isArray(task.location.coordinates) && task.location.coordinates.length >= 2) {
              task.distanceKm = calculateDistanceKm(activeCoords, task.location.coordinates);
            }
            if (task.distanceKm === undefined || task.distanceKm === null || isNaN(task.distanceKm)) {
              return false;
            }
            return task.distanceKm <= radiusKm;
          })
          .sort((a: any, b: any) => (a.distanceKm || 0) - (b.distanceKm || 0));

        set({ nearbyTasks: strictlyFiltered, isLoading: false });
      } else {
        set({ nearbyTasks: [], isLoading: false });
      }
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
    }
  },

  fetchMyTasks: async (role = 'customer') => {
    try {
      set({ isLoading: true, error: null });
      const res = await API.get('/tasks/my-tasks', { params: { role } });
      set({ myTasks: res.data.data, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
    }
  },

  fetchTaskById: async (id) => {
    try {
      set({ isLoading: true });
      const res = await API.get(`/tasks/${id}`);
      set({ currentTask: res.data.data, isLoading: false });
      return res.data.data;
    } catch (err) {
      set({ isLoading: false });
      return null;
    }
  },

  createTask: async (data) => {
    try {
      set({ isLoading: true });
      const res = await API.post('/tasks', data);
      const newTask = res.data.data;
      set((state) => ({
        nearbyTasks: state.nearbyTasks.filter((t) => t._id !== newTask._id),
        myTasks: [newTask, ...state.myTasks.filter((t) => t._id !== newTask._id)],
        isLoading: false,
      }));
      return { success: true, task: newTask };
    } catch (err: any) {
      set({ isLoading: false });
      return { success: false, message: err.response?.data?.message || 'Failed to create task' };
    }
  },

  submitBid: async (taskId, bidData) => {
    try {
      await API.post(`/tasks/${taskId}/bid`, bidData);
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Failed to submit bid' };
    }
  },

  acceptBid: async (taskId, bidId) => {
    try {
      const res = await API.post(`/tasks/${taskId}/accept-bid`, { bidId });
      set({ currentTask: res.data.data });
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Failed to accept bid' };
    }
  },

  rejectBid: async (taskId, bidId) => {
    try {
      const res = await API.post(`/tasks/${taskId}/reject-bid`, { bidId });
      set({ currentTask: res.data.data });
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Failed to reject offer' };
    }
  },

  cancelAssignment: async (taskId) => {
    try {
      const res = await API.post(`/tasks/${taskId}/cancel-assignment`);
      set({ currentTask: res.data.data });
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Failed to cancel assignment' };
    }
  },

  startTask: async (taskId) => {
    try {
      const res = await API.post(`/tasks/${taskId}/start`);
      set({ currentTask: res.data.data });
      return { success: true };
    } catch (err: any) {
      return { success: false, message: 'Failed to start task' };
    }
  },

  submitProof: async (taskId, formData) => {
    try {
      const res = await API.post(`/tasks/${taskId}/submit-proof`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      set({ currentTask: res.data.data });
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Failed to submit proof' };
    }
  },

  approveCompletion: async (taskId) => {
    try {
      const res = await API.post(`/tasks/${taskId}/approve-completion`);
      set({ currentTask: res.data.data });
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Failed to approve completion' };
    }
  },

  deleteTask: async (taskId) => {
    try {
      await API.delete(`/tasks/${taskId}`);
      set((state) => ({
        myTasks: state.myTasks.filter((t) => t._id !== taskId),
        nearbyTasks: state.nearbyTasks.filter((t) => t._id !== taskId),
        currentTask: state.currentTask?._id === taskId ? null : state.currentTask,
      }));
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to permanently delete task',
      };
    }
  },

  bindSocketListeners: () => {
    const socket = getMobileSocket();
    if (!socket) return;

    // Listen for new tasks broadcasted
    const handleNewTask = (newTask: any) => {
      const user = useAuthStore.getState().user;
      const isCustomer = user?.activeRole === 'customer';
      const custId = newTask.customerId?._id || newTask.customerId;

      // Exclude own tasks from nearby feed
      if (user?._id && custId?.toString() === user._id.toString()) {
        return;
      }

      const { searchRadius } = get();
      const radiusKm = (searchRadius || 25000) / 1000;
      const userCoords = user?.location?.coordinates;
      const hasValidCoords = userCoords && userCoords.length === 2 && (userCoords[0] !== 0 || userCoords[1] !== 0);

      // Tasks without valid coordinates cannot be discovered in nearby feed
      if (!newTask.location?.coordinates || !Array.isArray(newTask.location.coordinates) || newTask.location.coordinates.length < 2) {
        return;
      }

      if (hasValidCoords) {
        newTask.distanceKm = calculateDistanceKm(userCoords, newTask.location.coordinates);
        // STRICT FILTER: If outside helper's selected radius, ignore immediately
        if (newTask.distanceKm > radiusKm) {
          return;
        }
      }

      set((state) => {
        if (state.nearbyTasks.some((t) => t._id === newTask._id)) return state;
        const updated = [newTask, ...state.nearbyTasks].sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
        return { nearbyTasks: updated };
      });

      if (!isCustomer) {
        const { showLocalNotification } = require('./notificationService');
        showLocalNotification(
          `📡 New Task Nearby: ${newTask.title}`,
          `₹${newTask.budget?.amount || ''} • ${newTask.category || ''} • ${newTask.location?.address || 'Nearby'}`,
          { taskId: newTask._id }
        );
      }
    };

    socket.on('task_created', handleNewTask);
    socket.on('new_nearby_task', handleNewTask);

    socket.on('task_deleted', ({ taskId }: { taskId: string }) => {
      set((state) => ({
        myTasks: state.myTasks.filter((t) => t._id !== taskId),
        nearbyTasks: state.nearbyTasks.filter((t) => t._id !== taskId),
        currentTask: state.currentTask?._id === taskId ? null : state.currentTask,
      }));
    });

    socket.on('notification', (notif: any) => {
      const { showLocalNotification } = require('./notificationService');
      showLocalNotification(
        notif.title || '🔔 SAMN Notification',
        notif.body || '',
        notif.data
      );
    });

    socket.on('rating_received', (data: any) => {
      const { showLocalNotification } = require('./notificationService');
      showLocalNotification(
        '⭐ New Rating & Review Received!',
        'You received new rating & feedback on your completed service.',
        data
      );
    });

    socket.on('bid_received', (data: any) => {
      const { showLocalNotification } = require('./notificationService');
      const helperName = data.bid?.helperId?.name || 'A helper';
      const amount = data.bid?.proposedAmount ? `₹${data.bid.proposedAmount}` : '';
      showLocalNotification(
        '🏷️ New Offer Received!',
        `${helperName} submitted an offer of ${amount} for your task.`,
        { taskId: data.taskId, bidId: data.bid?._id }
      );
      // Auto-refresh tasks list and current task
      const userRole = useAuthStore.getState().user?.activeRole || 'customer';
      get().fetchMyTasks(userRole);
      if (data.taskId) {
        get().fetchTaskById(data.taskId);
      }
    });

    socket.on('bid_updated', (data: any) => {
      const { showLocalNotification } = require('./notificationService');
      const helperName = data.bid?.helperId?.name || 'A helper';
      const amount = data.bid?.proposedAmount ? `₹${data.bid.proposedAmount}` : '';
      showLocalNotification(
        '🏷️ Offer Updated!',
        `${helperName} updated their offer to ${amount}.`,
        { taskId: data.taskId, bidId: data.bid?._id }
      );
      const userRole = useAuthStore.getState().user?.activeRole || 'customer';
      get().fetchMyTasks(userRole);
      if (data.taskId) {
        get().fetchTaskById(data.taskId);
      }
    });

    socket.on('task_updated', (updated) => {
      set((state) => ({
        nearbyTasks: state.nearbyTasks.map((t) => (t._id === updated._id ? updated : t)),
        myTasks: state.myTasks.map((t) => (t._id === updated._id ? updated : t)),
        currentTask: state.currentTask?._id === updated._id ? updated : state.currentTask,
      }));
    });

    socket.on('task_assigned', (assignedTask) => {
      set((state) => ({
        myTasks: [assignedTask, ...state.myTasks.filter(t => t._id !== assignedTask._id)],
        currentTask: state.currentTask?._id === assignedTask._id ? assignedTask : state.currentTask,
      }));
      const { showLocalNotification } = require('./notificationService');
      showLocalNotification(
        '🤝 Helper Assigned!',
        `Helper assigned to: ${assignedTask.title}`,
        { taskId: assignedTask._id }
      );
    });
  },
}));
