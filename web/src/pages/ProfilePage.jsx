import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Star,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Coins,
  Repeat,
  Camera,
  Save,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, updateProfile, switchRole } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const isCustomer = user?.activeRole === 'customer';

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const data = new FormData();
    data.append('name', formData.name);
    data.append('phone', formData.phone);
    if (avatarFile) data.append('avatar', avatarFile);

    const res = await updateProfile(data);
    setLoading(false);
    if (res.success) {
      setMessage('Profile updated successfully!');
      setIsEditing(false);
    } else {
      setMessage(res.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="p-6 sm:p-10 rounded-3xl glass border border-slate-800 shadow-2xl">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-8 border-b border-slate-800">
          <div className="relative group">
            <img
              src={avatarPreview || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop'}
              alt={user?.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-2 border-brand-500 shadow-xl"
            />
            {isEditing && (
              <label className="absolute inset-0 bg-black/60 rounded-3xl flex flex-col items-center justify-center cursor-pointer text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold">Change</span>
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h1 className="text-2xl font-black text-white">{user?.name}</h1>
              {user?.isVerified && (
                <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1">
              <MapPin className="w-3.5 h-3.5 text-brand-400 shrink-0" />
              <span>{user?.location?.address || 'Location not set'}</span>
            </p>

            {/* Role switch toggle */}
            <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <button
                onClick={() => switchRole(isCustomer ? 'helper' : 'customer')}
                className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-slate-700 bg-slate-900 text-xs font-bold text-brand-300 hover:border-brand-500 transition-all"
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>Active as {user?.activeRole?.toUpperCase()} (Switch)</span>
              </button>

              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
              >
                {isEditing ? 'Cancel Edit' : 'Edit Profile'}
              </button>
            </div>
          </div>
        </div>

        {message && (
          <div className="my-4 p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold">
            {message}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-8 border-b border-slate-800">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <span className="text-xs font-bold text-slate-400 block">Helper Rating</span>
            <span className="text-xl font-black text-amber-400 mt-1 block">
              ⭐ {user?.stats?.avgRatingAsHelper || '5.0'}
            </span>
            <span className="text-[10px] text-slate-500">
              {user?.stats?.ratingCountHelper || 0} reviews
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <span className="text-xs font-bold text-slate-400 block">Customer Rating</span>
            <span className="text-xl font-black text-amber-400 mt-1 block">
              ⭐ {user?.stats?.avgRatingAsCustomer || '5.0'}
            </span>
            <span className="text-[10px] text-slate-500">
              {user?.stats?.ratingCountCustomer || 0} reviews
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <span className="text-xs font-bold text-slate-400 block">Tasks Completed</span>
            <span className="text-xl font-black text-white mt-1 block">
              {user?.stats?.tasksCompleted || 0}
            </span>
            <span className="text-[10px] text-emerald-400">Total resolved</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <span className="text-xs font-bold text-slate-400 block">Total Earned</span>
            <span className="text-xl font-black text-emerald-400 mt-1 block">
              ₹{user?.stats?.totalEarned?.toLocaleString('en-IN') || 0}
            </span>
            <span className="text-[10px] text-slate-500">Lifetime earnings</span>
          </div>
        </div>

        {/* Contact details & edit form */}
        <div className="pt-8">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
            Account Details
          </h3>

          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </form>
          ) : (
            <div className="space-y-3 max-w-md">
              <div className="flex items-center space-x-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <Mail className="w-4 h-4 text-brand-400" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Email</span>
                  <span className="text-xs text-white font-bold">{user?.email}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <Phone className="w-4 h-4 text-brand-400" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Phone</span>
                  <span className="text-xs text-white font-bold">{user?.phone}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
