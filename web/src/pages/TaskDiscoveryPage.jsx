import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useTaskStore } from '../stores/taskStore';
import TaskMap from '../components/TaskMap';
import TaskCard from '../components/TaskCard';
import BidModal from '../components/BidModal';
import {
  Compass,
  Filter,
  Flame,
  Radio,
  MapPin,
  Search,
  RotateCcw,
  Layers,
  ChevronDown,
} from 'lucide-react';

const categoryFilterOptions = [
  { id: 'all', label: 'All Tasks' },
  { id: 'delivery', label: '🚚 Delivery' },
  { id: 'grocery', label: '🛍️ Grocery' },
  { id: 'cleaning', label: '✨ Cleaning' },
  { id: 'care_taker', label: '🤝 Care Takers' },
  { id: 'hospital_accompany', label: '🏥 Hospital Escort' },
  { id: 'pet_care', label: '🐾 Pet Care' },
  { id: 'pet_grooming', label: '✂️ Pet Grooming' },
  { id: 'car_wash', label: '🚗 Car Wash' },
  { id: 'gardening', label: '🌱 Gardening' },
  { id: 'tech_help', label: '💻 Tech Help' },
  { id: 'moving', label: '📦 Moving' },
  { id: 'cooking', label: '🍳 Cooking' },
  { id: 'repair', label: '🔧 Repair' },
  { id: 'tutoring', label: '📚 Tutoring' },
];

export default function TaskDiscoveryPage({ onOpenPostModal }) {
  const { userLocation, user } = useAuthStore();
  const {
    nearbyTasks,
    myTasks,
    fetchMyTasks,
    nearbyHelpers,
    fetchNearbyTasks,
    fetchNearbyHelpers,
    filters,
    setFilter,
    resetFilters,
    bindSocketEvents,
  } = useTaskStore();

  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedBidTask, setSelectedBidTask] = useState(null);

  const isCustomer = user?.activeRole === 'customer';
  const isHelper = user?.activeRole === 'helper';

  useEffect(() => {
    if (isCustomer) {
      fetchMyTasks('customer');
    }
    const coords = userLocation?.coordinates || user?.location?.coordinates;
    if (coords && coords.length === 2) {
      fetchNearbyTasks(coords);
      fetchNearbyHelpers(coords);
    }
    bindSocketEvents();
  }, [
    userLocation?.coordinates?.[0],
    userLocation?.coordinates?.[1],
    filters.category,
    filters.radius,
    filters.isUrgent,
    isCustomer
  ]);

  // Tasks to display on radar map & task feed
  const taskMap = new Map();
  if (isCustomer) {
    // In customer mode, show customer's own posted requests
    myTasks.forEach((t) => {
      taskMap.set(t._id, t);
    });
  } else {
    // In helper mode: show active nearby tasks, strictly excluding any tasks created by the current user
    const currentUserId = user?._id || user?.id;
    nearbyTasks.forEach((t) => {
      const taskCreatorId = t.customerId?._id || t.customerId;
      if (currentUserId && taskCreatorId && String(taskCreatorId) === String(currentUserId)) {
        return; // Exclude own tasks from Helper radar
      }
      // Ensure tasks with missing/invalid distance or outside selected radius are excluded
      if (t.distanceKm !== null && t.distanceKm !== undefined && t.distanceKm <= filters.radius / 1000) {
        taskMap.set(t._id, t);
      }
    });
  }

  const allRadarTasks = Array.from(taskMap.values());
  const displayedTasks = allRadarTasks.filter((task) => {
    if (!filters.searchQuery) return true;
    const q = filters.searchQuery.toLowerCase();
    return (
      task.title?.toLowerCase().includes(q) ||
      task.description?.toLowerCase().includes(q) ||
      task.location?.address?.toLowerCase().includes(q)
    );
  });

  if (isHelper) {
    displayedTasks.sort((a, b) => {
      const distA = a.distanceKm ?? Infinity;
      const distB = b.distanceKm ?? Infinity;
      return distA - distB;
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-4.5rem)] flex flex-col">
      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl glass border border-slate-800 mb-4 shrink-0">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={
                isCustomer
                  ? "Search your posted tasks..."
                  : "Search nearby tasks by keyword or locality..."
              }
              value={filters.searchQuery}
              onChange={(e) => setFilter('searchQuery', e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-xs"
            />
          </div>

          <button
            onClick={() => setFilter('isUrgent', !filters.isUrgent)}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
              filters.isUrgent
                ? 'bg-red-500/20 text-red-400 border-red-500/40 shadow-sm'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Urgent Only</span>
          </button>
        </div>

        {/* Radius Selector */}
        <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 px-2">Radar:</span>
          {[3000, 5000, 10000, 25000].map((r) => (
            <button
              key={r}
              onClick={() => setFilter('radius', r)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                filters.radius === r
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {r / 1000}km
            </button>
          ))}
        </div>

        {/* Category Horizontal scroll */}
        <div className="w-full flex items-center space-x-1.5 overflow-x-auto pt-2 pb-1 text-xs">
          {categoryFilterOptions.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilter('category', cat.id)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-semibold border transition-all ${
                filters.category === cat.id
                  ? 'bg-brand-500/20 border-brand-500/50 text-brand-300 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area: Map + Task Cards */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
        {/* Left Side: Interactive Map (7 cols) */}
        <div className="lg:col-span-7 h-72 lg:h-full relative">
          <TaskMap
            tasks={displayedTasks}
            helpers={nearbyHelpers}
            userLocation={userLocation}
            searchRadius={filters.radius}
            selectedTaskId={selectedTask?._id}
            onSelectTask={(task) => setSelectedTask(task)}
          />
        </div>

        {/* Right Side: Scrollable Task List (5 cols) */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-0 bg-slate-900/40 rounded-2xl border border-slate-800/80 p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
            <div className="flex items-center space-x-2">
              {isCustomer ? (
                <>
                  <Layers className="w-4 h-4 text-brand-400" />
                  <h3 className="text-sm font-bold text-white">
                    My Posted Requests ({displayedTasks.length})
                  </h3>
                </>
              ) : (
                <>
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <h3 className="text-sm font-bold text-white">
                    Live Radar Feed ({displayedTasks.length})
                  </h3>
                </>
              )}
            </div>

            {isCustomer ? (
              <button
                onClick={onOpenPostModal}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-brand-600/30 transition-transform hover:scale-105"
              >
                <span>+ Post Task</span>
              </button>
            ) : (
              <span className="text-[11px] text-slate-400">
                Within {filters.radius / 1000}km radius
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 mt-3">
            {displayedTasks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                {isCustomer ? (
                  <>
                    <Layers className="w-10 h-10 text-slate-600 mb-2" />
                    <p className="text-sm font-bold text-white">No posted tasks found</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      Post a task to broadcast instantly to verified helpers in your neighborhood!
                    </p>
                    <button
                      onClick={onOpenPostModal}
                      className="mt-4 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white shadow-lg shadow-brand-600/25 transition-all hover:scale-105"
                    >
                      Post Your Request Now
                    </button>
                  </>
                ) : (
                  <>
                    <Compass className="w-10 h-10 text-slate-600 mb-2 animate-spin-slow" />
                    <p className="text-sm font-bold text-white">No tasks matching radar filters</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      Try expanding the search radius or resetting the category filters.
                    </p>
                    <button
                      onClick={resetFilters}
                      className="mt-3 flex items-center space-x-1 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-brand-300"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Filters</span>
                    </button>
                  </>
                )}
              </div>
            ) : (
              displayedTasks.map((task) => (
                <div
                  key={task._id}
                  onClick={() => setSelectedTask(task)}
                  className={`transition-all ${
                    selectedTask?._id === task._id ? 'ring-2 ring-brand-500 rounded-2xl' : ''
                  }`}
                >
                  <TaskCard
                    task={task}
                    isHelper={isHelper}
                    onOpenBid={(t) => setSelectedBidTask(t)}
                    compact={true}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bid Modal */}
      {selectedBidTask && (
        <BidModal
          isOpen={!!selectedBidTask}
          task={selectedBidTask}
          onClose={() => setSelectedBidTask(null)}
          onSuccess={() => {
            const coords = userLocation?.coordinates || user?.location?.coordinates;
            fetchNearbyTasks(coords);
          }}
        />
      )}
    </div>
  );
}
