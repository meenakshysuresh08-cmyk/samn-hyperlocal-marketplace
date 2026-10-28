import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNotificationStore } from '../stores/notificationStore';
import {
  Bell,
  CheckCheck,
  Radio,
  CheckCircle2,
  DollarSign,
  MessageSquare,
  Star,
  ChevronRight,
  Inbox,
} from 'lucide-react';

const notifIcons = {
  task_posted: Radio,
  bid_received: DollarSign,
  bid_accepted: CheckCircle2,
  task_assigned: CheckCircle2,
  task_started: CheckCircle2,
  task_completed: CheckCircle2,
  proof_submitted: CheckCircle2,
  rating_received: Star,
  new_message: MessageSquare,
  fallback_broadcast: Radio,
  task_cancelled: Bell,
};

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    bindNotificationEvents,
    isLoading,
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
    bindNotificationEvents();
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between pb-6 border-b border-slate-800 mb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center space-x-2">
            <Bell className="w-6 h-6 text-brand-400" />
            <span>Activity & Alerts</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time updates on bids, task milestones, and community messages
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            <CheckCheck className="w-4 h-4 text-emerald-400" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="p-12 rounded-3xl glass-card border border-slate-800 text-center flex flex-col items-center justify-center">
          <Inbox className="w-12 h-12 text-slate-600 mb-2" />
          <h3 className="text-sm font-bold text-white">No notifications yet</h3>
          <p className="text-xs text-slate-400 mt-1">
            When someone offers to help or sends a message, it will pop up right here!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => {
            const Icon = notifIcons[notif.type] || Bell;
            const taskId = notif.data?.taskId;

            return (
              <div
                key={notif._id}
                onClick={() => !notif.isRead && markAsRead(notif._id)}
                className={`p-4 rounded-2xl glass-card border transition-all flex items-start justify-between gap-4 cursor-pointer ${
                  notif.isRead
                    ? 'border-slate-800/80 opacity-80'
                    : 'border-brand-500/40 bg-brand-950/20 shadow-md'
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      notif.isRead ? 'bg-slate-800 text-slate-400' : 'bg-brand-600 text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-white">{notif.title}</h4>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse"></span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{notif.body}</p>
                    <span className="text-[10px] text-slate-500 font-semibold block mt-1.5">
                      {new Date(notif.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {taskId && (
                  <Link
                    to={`/task/${taskId}`}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white shrink-0 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
