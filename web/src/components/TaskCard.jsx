import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Flame,
  Radio,
  Star,
  Users,
  ChevronRight,
  ShoppingBag,
  Truck,
  Sparkles,
  Wrench,
  Utensils,
  BookOpen,
  Home,
  HeartHandshake,
  Scissors,
  Car,
  Sprout,
  Stethoscope,
  UserCheck,
} from 'lucide-react';

const categoryIcons = {
  delivery: Truck,
  grocery: ShoppingBag,
  cleaning: Sparkles,
  care_taker: UserCheck,
  hospital_accompany: Stethoscope,
  pet_care: HeartHandshake,
  pet_grooming: Scissors,
  car_wash: Car,
  gardening: Sprout,
  tech_help: Wrench,
  moving: Home,
  cooking: Utensils,
  tutoring: BookOpen,
  repair: Wrench,
  other: MapPin,
};

const categoryLabels = {
  delivery: 'Delivery',
  grocery: 'Grocery',
  cleaning: 'Cleaning',
  care_taker: 'Care Takers',
  hospital_accompany: 'Hospital Escort',
  pet_care: 'Pet Care',
  pet_grooming: 'Pet Grooming',
  car_wash: 'Car Wash',
  gardening: 'Gardening',
  tech_help: 'Tech Help',
  moving: 'Moving',
  cooking: 'Cooking',
  tutoring: 'Tutoring',
  repair: 'Repair',
  other: 'General Help',
};

export default function TaskCard({ task, onOpenBid, isHelper, compact = false }) {
  const Icon = categoryIcons[task.category] || MapPin;
  const isUrgent = task.isUrgent;
  const isBroadcasted = task.status === 'broadcasted';
  const bidCount = task.bids?.length || 0;

  const statusColors = {
    open: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    broadcasted: 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse',
    assigned: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    in_progress: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    completed: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  return (
    <div
      className={`relative group rounded-2xl glass-card border transition-all duration-300 hover:border-brand-500/50 hover:shadow-xl hover:shadow-brand-500/10 ${
        isUrgent
          ? 'border-red-500/40 bg-gradient-to-b from-red-950/20 to-slate-900/80'
          : isBroadcasted
          ? 'border-amber-500/40 bg-gradient-to-b from-amber-950/20 to-slate-900/80'
          : 'border-slate-800/80'
      } ${compact ? 'p-4' : 'p-5'}`}
    >
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800/80 text-brand-300 border border-slate-700">
            <Icon className="w-3.5 h-3.5 text-brand-400" />
            <span>{categoryLabels[task.category] || task.category}</span>
          </span>

          {isUrgent && (
            <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
              <Flame className="w-3 h-3 text-red-400 fill-red-400 animate-pulse" />
              <span>URGENT</span>
            </span>
          )}

          {isBroadcasted && (
            <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Radio className="w-3 h-3 text-amber-400 animate-pulse" />
              <span>WIDE RADAR</span>
            </span>
          )}
        </div>

        {/* Budget Pill */}
        <div className="text-right">
          <span className="text-lg font-black text-emerald-400">
            ₹{task.budget?.amount?.toLocaleString('en-IN')}
          </span>
          <span className="block text-[10px] uppercase font-bold text-slate-400">
            {task.budget?.type || 'Fixed'}
          </span>
        </div>
      </div>

      {/* Task Title & Description */}
      <Link to={`/task/${task._id}`} className="block group-hover:text-brand-300 transition-colors">
        <h3 className="text-base font-bold text-white line-clamp-1 mb-1">{task.title}</h3>
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">{task.description}</p>
      </Link>

      {/* Location & Distance */}
      <div className="flex items-center justify-between text-xs text-slate-400 mb-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-1 truncate max-w-[65%]">
          <MapPin className="w-3.5 h-3.5 text-brand-400 shrink-0" />
          <span className="truncate">
            {task.location?.address}
            {task.location?.landmark ? ` (Near ${task.location.landmark})` : ''}
          </span>
        </div>

        {task.distanceKm !== undefined && (
          <span className="text-slate-300 font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-[11px]">
            {task.distanceKm < 1 ? `${Math.round(task.distanceKm * 1000)}m` : `${task.distanceKm}km`} away
          </span>
        )}
      </div>

      {/* OTP Verification Status Banner */}
      {task.status === 'completed' && task.proof && (
        <div className="mb-3 p-2 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between text-[11px]">
          <span className="text-emerald-400 font-bold flex items-center space-x-1">
            <span>🔐 Customer OTP Verified</span>
          </span>
          <span className="text-emerald-300/80 text-[10px]">
            Payment Released
          </span>
        </div>
      )}

      {/* Customer Passcode Reminder (When task in progress) */}
      {!isHelper && ['assigned', 'in_progress'].includes(task.status) && task.completionOtp && (
        <div className="mb-3 p-2 rounded-xl bg-slate-900/90 border border-emerald-500/40 flex items-center justify-between text-[11px]">
          <span className="text-slate-300 font-medium">🔐 Completion Passcode:</span>
          <span className="font-mono font-bold text-emerald-400 tracking-wider bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-700">
            {task.completionOtp}
          </span>
        </div>
      )}

      {/* Bottom Footer (Poster Info & Actions) */}
      <div className="flex items-center justify-between">
        {/* Customer info */}
        <div className="flex items-center space-x-2">
          <img
            src={
              task.customerId?.avatar ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop'
            }
            alt={task.customerId?.name || 'User'}
            className="w-7 h-7 rounded-full object-cover border border-slate-700"
          />
          <div>
            <span className="text-xs font-semibold text-slate-200 block leading-tight">
              {task.customerId?.name || 'Anonymous'}
            </span>
            <div className="flex items-center space-x-1 text-[10px] text-amber-400">
              <Star className="w-2.5 h-2.5 fill-amber-400" />
              <span>{task.customerId?.stats?.avgRatingAsCustomer || '5.0'}</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center space-x-2">
          {bidCount > 0 && (
            <span className="flex items-center space-x-1 text-xs text-slate-400">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>{bidCount} {bidCount === 1 ? 'offer' : 'offers'}</span>
            </span>
          )}

          {isHelper && (task.status === 'open' || task.status === 'broadcasted') ? (
            <button
              onClick={() => onOpenBid && onOpenBid(task)}
              className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-md shadow-brand-600/20"
            >
              Make Offer
            </button>
          ) : (
            <Link
              to={`/task/${task._id}`}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
