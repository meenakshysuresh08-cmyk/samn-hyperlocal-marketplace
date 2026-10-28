import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTaskStore } from '../stores/taskStore';
import { useChatStore } from '../stores/chatStore';
import TaskCard from '../components/TaskCard';
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Radio,
  Sparkles,
  DollarSign,
  TrendingUp,
  Inbox,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';

export default function CustomerDashboard({ onOpenPostModal }) {
  const { user } = useAuthStore();
  const { myTasks, fetchMyTasks, isLoading } = useTaskStore();
  const { conversations, loadConversations } = useChatStore();
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'completed', 'all'

  useEffect(() => {
    fetchMyTasks('customer');
    loadConversations();
  }, []);

  const openTasks = myTasks.filter((t) => ['open', 'broadcasted', 'assigned', 'in_progress'].includes(t.status));
  const completedTasks = myTasks.filter((t) => t.status === 'completed');
  const totalSpent = user?.stats?.totalSpent || 0;

  const displayedTasks = activeTab === 'active' ? openTasks : activeTab === 'completed' ? completedTasks : myTasks;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-3xl glass border border-slate-800 shadow-xl mb-8">
        <div>
          <div className="flex items-center space-x-2 text-brand-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Customer Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Hello, {user?.name || 'Customer'} 👋
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your posted requests, review incoming bids, and track helper progress live.
          </p>
        </div>

        <button
          onClick={onOpenPostModal}
          className="flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-brand-600/30 transition-all hover:scale-105"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Post New Task</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-2xl glass-card border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Active Requests</span>
            <Clock className="w-4 h-4 text-brand-400" />
          </div>
          <p className="text-2xl font-black text-white mt-2">{openTasks.length}</p>
          <span className="text-[10px] text-brand-400 font-semibold mt-1 block">Live in radar</span>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Completed Tasks</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white mt-2">{completedTasks.length}</p>
          <span className="text-[10px] text-emerald-400 font-semibold mt-1 block">Total resolved</span>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Spent</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white mt-2">₹{totalSpent.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-amber-400 font-semibold mt-1 block">Across all tasks</span>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Rating as Customer</span>
            <span className="text-xs text-amber-400 font-bold">⭐</span>
          </div>
          <p className="text-2xl font-black text-white mt-2">{user?.stats?.avgRatingAsCustomer || '5.0'}</p>
          <span className="text-[10px] text-slate-400 font-semibold mt-1 block">
            {user?.stats?.ratingCountCustomer || 0} reviews received
          </span>
        </div>
      </div>

      {/* Active Chat Sessions Quick Bar */}
      {conversations.length > 0 && (
        <div className="mb-8 p-4 rounded-2xl glass border border-brand-500/30 bg-brand-950/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-brand-400" />
              <h3 className="text-sm font-bold text-white">Active Chat Sessions ({conversations.length})</h3>
            </div>
            <Link
              to="/messages"
              className="text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center space-x-1"
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
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-brand-500/50 transition-all flex items-center space-x-3 group"
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
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-brand-300 transition-colors">
                      {conv.participant?.name || 'Helper'}
                    </h4>
                    {conv.unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-brand-600 text-white text-[9px] font-bold">
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
            onClick={() => setActiveTab('active')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'active'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Active & Pending ({openTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'completed'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Completed ({completedTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All History ({myTasks.length})
          </button>
        </div>

        {displayedTasks.length === 0 ? (
          <div className="p-12 rounded-3xl glass-card border border-slate-800/80 text-center flex flex-col items-center justify-center">
            <Inbox className="w-12 h-12 text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No tasks in this view</h3>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              Need help with everyday chores, deliveries, or quick assistance right now?
            </p>
            <button
              onClick={onOpenPostModal}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-colors shadow-lg shadow-brand-600/25"
            >
              Post Your First Task
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedTasks.map((task) => (
              <TaskCard key={task._id} task={task} isHelper={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
