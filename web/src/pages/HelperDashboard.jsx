import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTaskStore } from '../stores/taskStore';
import { useChatStore } from '../stores/chatStore';
import TaskCard from '../components/TaskCard';
import BidModal from '../components/BidModal';
import {
  Compass,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Clock,
  Radio,
  Sparkles,
  Inbox,
  Flame,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';

export default function HelperDashboard() {
  const { user, userLocation } = useAuthStore();
  const { myTasks, fetchMyTasks, nearbyTasks, fetchNearbyTasks } = useTaskStore();
  const { conversations, loadConversations } = useChatStore();
  const [activeTab, setActiveTab] = useState('assigned'); // 'assigned', 'applied', 'nearby'
  const [selectedBidTask, setSelectedBidTask] = useState(null);

  const activeCoords = userLocation?.coordinates || user?.location?.coordinates;

  useEffect(() => {
    fetchMyTasks('helper');
    fetchNearbyTasks(activeCoords);
    loadConversations();
  }, [userLocation?.coordinates]);

  const assignedTasks = myTasks.filter((t) =>
    ['assigned', 'in_progress', 'completed'].includes(t.status) &&
    t.helperId?._id?.toString() === user?._id?.toString()
  );

  const appliedTasks = myTasks.filter((t) =>
    t.bids?.some((b) => b.helperId?._id?.toString() === user?._id?.toString())
  );

  const cleanNearbyTasks = nearbyTasks.filter((t) => {
    const custId = t.customerId?._id || t.customerId;
    return !user?._id || !custId || custId.toString() !== user._id.toString();
  });

  const totalEarned = user?.stats?.totalEarned || 0;
  const tasksCompleted = user?.stats?.tasksCompleted || 0;

  const displayedList =
    activeTab === 'assigned'
      ? assignedTasks
      : activeTab === 'applied'
      ? appliedTasks
      : cleanNearbyTasks;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-3xl glass border border-slate-800 shadow-xl mb-8">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>Helper Earnings & Radar Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Ready to Earn, {user?.name || 'Helper'}! 🚀
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tasks in your neighborhood are waiting for quick assistance.
          </p>
        </div>

        <Link
          to="/explore"
          className="flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 transition-all hover:scale-105"
        >
          <Compass className="w-5 h-5" />
          <span>Browse Live Radar Map</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-2xl glass-card border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Earned</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2">₹{totalEarned.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-emerald-400 font-semibold mt-1 block">Deposited earnings</span>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Tasks Completed</span>
            <CheckCircle2 className="w-4 h-4 text-brand-400" />
          </div>
          <p className="text-2xl font-black text-white mt-2">{tasksCompleted}</p>
          <span className="text-[10px] text-brand-400 font-semibold mt-1 block">Successfully resolved</span>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Active Assignments</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-white mt-2">
            {assignedTasks.filter((t) => t.status !== 'completed').length}
          </p>
          <span className="text-[10px] text-blue-400 font-semibold mt-1 block">In progress</span>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Helper Rating</span>
            <span className="text-xs text-amber-400 font-bold">⭐</span>
          </div>
          <p className="text-2xl font-black text-white mt-2">{user?.stats?.avgRatingAsHelper || '5.0'}</p>
          <span className="text-[10px] text-slate-400 font-semibold mt-1 block">
            {user?.stats?.ratingCountHelper || 0} customer reviews
          </span>
        </div>
      </div>

      {/* Active Chat Sessions Quick Bar */}
      {conversations.length > 0 && (
        <div className="mb-8 p-4 rounded-2xl glass border border-emerald-500/30 bg-emerald-950/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Active Chat Sessions ({conversations.length})</h3>
            </div>
            <Link
              to="/messages"
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
            >
              <span>Open All Chats</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {conversations.slice(0, 3).map((conv) => (
              <Link
                key={conv.taskId}
                to={`/messages?taskId=${conv.taskId}`}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition-all flex items-center space-x-3 group"
              >
                <img
                  src={
                    conv.participant?.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop'
                  }
                  alt={conv.participant?.name || 'User'}
                  className="w-10 h-10 rounded-full object-cover border border-slate-700"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                      {conv.participant?.name || 'Customer'}
                    </h4>
                    {conv.unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[9px] font-bold">
                        {conv.unreadCount} new
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {conv.taskTitle}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">
                    {conv.lastMessage?.content || 'Tap to chat'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Tabs and Task List */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('assigned')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'assigned'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            My Assigned Tasks ({assignedTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('applied')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'applied'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            My Submitted Offers ({appliedTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('nearby')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'nearby'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Nearby Open Tasks ({nearbyTasks.length})
          </button>
        </div>

        {displayedList.length === 0 ? (
          <div className="p-12 rounded-3xl glass-card border border-slate-800/80 text-center flex flex-col items-center justify-center">
            <Inbox className="w-12 h-12 text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No tasks in this list</h3>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              Explore the live radar to find nearby requests looking for quick helpers!
            </p>
            <Link
              to="/explore"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-lg shadow-emerald-600/25"
            >
              Open Live Radar
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedList.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                isHelper={true}
                onOpenBid={(t) => setSelectedBidTask(t)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bid Modal */}
      {selectedBidTask && (
        <BidModal
          isOpen={!!selectedBidTask}
          task={selectedBidTask}
          onClose={() => setSelectedBidTask(null)}
          onSuccess={() => {
            fetchMyTasks('helper');
            fetchNearbyTasks(activeCoords);
          }}
        />
      )}
    </div>
  );
}
