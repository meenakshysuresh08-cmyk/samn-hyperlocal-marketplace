import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import {
  Sparkles,
  MapPin,
  ShieldCheck,
  Zap,
  Users,
  ArrowRight,
  Flame,
  Radio,
  CheckCircle2,
  Clock,
  Coins,
} from 'lucide-react';

export default function LandingPage({ onOpenPostModal }) {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Background Glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-600/20 rounded-full blur-[140px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-brand-500/30 text-brand-300 text-xs font-bold shadow-lg shadow-brand-500/10 animate-bounce-slow">
            <Radio className="w-3.5 h-3.5 text-brand-400 animate-pulse" />
            <span>Hyperlocal Real-Time Task Marketplace</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            Help is just <br />
            <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-amber-300 bg-clip-text text-transparent">
              around you now.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Need urgent groceries, a quick package pickup, tool assistance, or chores done? Connect in seconds with verified helpers located right in your neighborhood.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/explore"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-black text-sm shadow-xl shadow-brand-600/30 flex items-center justify-center space-x-2 transition-all hover:scale-105"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Open Live Radar</span>
                </Link>

                <button
                  onClick={onOpenPostModal}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 font-bold text-sm flex items-center justify-center space-x-2 transition-all hover:scale-105"
                >
                  <Sparkles className="w-4 h-4 text-brand-400" />
                  <span>Post a Task</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-brand-600/30 flex items-center justify-center space-x-2 transition-all hover:scale-105"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/explore"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 font-bold text-sm flex items-center justify-center space-x-2 transition-all"
                >
                  <MapPin className="w-4 h-4 text-brand-400" />
                  <span>Browse Live Radar</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Live Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
          <div className="p-6 rounded-3xl glass-card border border-slate-800/80 hover:border-brand-500/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6 text-brand-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Instant Hyperlocal Dispatch</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Geospatial queries pinpoint helpers within 500m to 10km. Real-time Socket.IO broadcasts ensure responses within minutes.
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-card border border-slate-800/80 hover:border-amber-500/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Radio className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Smart Fallback Broadcast</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              If an open task receives no helper within 15 minutes, automated background cron expands search radius and alerts wider helper networks.
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-card border border-slate-800/80 hover:border-emerald-500/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Proof Review & Ratings</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Helpers upload completion photos and receipts. Two-way 5-star ratings with compliment tags build trusted community credibility.
            </p>
          </div>
        </div>

        {/* How It Works Steps */}
        <div className="mt-24 text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-12">How SAMN Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-brand-400 font-black text-xl mb-4 shadow-lg shadow-brand-500/10">
                1
              </div>
              <h4 className="text-base font-bold text-white mb-1">Post Your Need</h4>
              <p className="text-xs text-slate-400 max-w-xs">
                Describe the task, set your budget in ₹, and pick your urgent priority level.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-brand-400 font-black text-xl mb-4 shadow-lg shadow-brand-500/10">
                2
              </div>
              <h4 className="text-base font-bold text-white mb-1">Receive Nearby Offers</h4>
              <p className="text-xs text-slate-400 max-w-xs">
                Local helpers place bids with estimated arrival times. Accept your preferred helper.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 font-black text-xl mb-4 shadow-lg shadow-emerald-500/10">
                3
              </div>
              <h4 className="text-base font-bold text-white mb-1">Complete & Review</h4>
              <p className="text-xs text-slate-400 max-w-xs">
                Chat in real-time, view live completion proof, release payment, and leave 5-star ratings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
