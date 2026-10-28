import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';
import {
  Compass,
  PlusCircle,
  Bell,
  User,
  LogOut,
  MapPin,
  Repeat,
  Sparkles,
  Layers,
  CheckCircle2,
  Menu,
  MessageSquare,
  X,
  LayoutDashboard,
} from 'lucide-react';

export default function Navbar({ onOpenPostModal }) {
  const { user, isAuthenticated, logout, switchRole, userLocation } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const userMenuRef = useRef(null);

  const isCustomer = user?.activeRole === 'customer';

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleToggleRole = async () => {
    const nextRole = isCustomer ? 'helper' : 'customer';
    await switchRole(nextRole);
    setShowUserMenu(false);
    navigate(nextRole === 'customer' ? '/customer-dashboard' : '/helper-dashboard');
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full glass border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tagline */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-white group-hover:text-brand-300 transition-colors">
                  SAMN
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  Someone Around Me Now
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center space-x-1">
              {isCustomer ? (
                <>
                  <Link
                    to="/customer-dashboard"
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                      location.pathname.includes('customer-dashboard')
                        ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>Track My Tasks</span>
                  </Link>

                  <Link
                    to="/explore"
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                      location.pathname === '/explore'
                        ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Compass className="w-4 h-4" />
                    <span>Map View</span>
                  </Link>

                  <Link
                    to="/messages"
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                      location.pathname.includes('messages')
                        ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Chats</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/explore"
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                      location.pathname === '/explore'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Compass className="w-4 h-4" />
                    <span>Live Radar Feed</span>
                  </Link>

                  <Link
                    to="/helper-dashboard"
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                      location.pathname.includes('helper-dashboard')
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>Helper Dashboard</span>
                  </Link>

                  <Link
                    to="/messages"
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                      location.pathname.includes('messages')
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Chats</span>
                  </Link>
                </>
              )}
            </nav>
          )}

          {/* Right Action Bar */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                {/* Role Switcher Pill */}
                <button
                  onClick={handleToggleRole}
                  className={`hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                    isCustomer
                      ? 'bg-indigo-950/70 border-indigo-500/40 text-indigo-300 hover:border-indigo-400'
                      : 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300 hover:border-emerald-400'
                  }`}
                  title="Switch between asking for help & earning as a helper"
                >
                  <Repeat className="w-3.5 h-3.5 text-current animate-spin-slow" />
                  <span>Mode: {isCustomer ? 'Customer' : 'Helper'}</span>
                </button>

                {/* Post Task Button (Only in Customer mode) */}
                {isCustomer && (
                  <button
                    onClick={onOpenPostModal}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-sm font-semibold shadow-md shadow-brand-500/25 hover:from-brand-500 hover:to-indigo-500 transition-all hover:scale-[1.02]"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Post Task</span>
                  </button>
                )}

                {/* Direct Messages Icon Button */}
                <Link
                  to="/messages"
                  className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
                  title="Active Chat Sessions"
                >
                  <MessageSquare className="w-5 h-5" />
                </Link>

                {/* Notifications Bell */}
                <Link
                  to="/notifications"
                  className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* User Avatar Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-1 rounded-full border border-slate-700 hover:border-brand-500 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                    title="User Profile Menu"
                  >
                    {!avatarError && user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name || 'User'}
                        onError={() => setAvatarError(true)}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center uppercase shadow-inner">
                        {user?.name ? user.name.charAt(0) : 'U'}
                      </div>
                    )}
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-4 py-2.5 border-b border-slate-800">
                        <p className="text-sm font-bold text-white truncate">{user?.name || 'Account'}</p>
                        <p className="text-xs text-slate-400 truncate">{user?.email || ''}</p>
                        <div className="mt-1.5 flex items-center space-x-1.5 text-[11px] font-semibold text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Active as {isCustomer ? 'Customer' : 'Helper'}</span>
                        </div>
                      </div>

                      <div className="py-1">
                        <Link
                          to="/profile"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                        >
                          <User className="w-4 h-4 text-brand-400" />
                          <span>My Profile & Account</span>
                        </Link>

                        <Link
                          to={isCustomer ? '/customer-dashboard' : '/helper-dashboard'}
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                          <span>{isCustomer ? 'Customer Dashboard' : 'Helper Dashboard'}</span>
                        </Link>

                        <button
                          onClick={handleToggleRole}
                          className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left"
                        >
                          <Repeat className="w-4 h-4 text-indigo-400" />
                          <span>Switch to {isCustomer ? 'Helper Mode' : 'Customer Mode'}</span>
                        </button>
                      </div>

                      <div className="border-t border-slate-800 my-1"></div>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand-600 text-white hover:bg-brand-500 transition-colors shadow-md shadow-brand-600/25"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
