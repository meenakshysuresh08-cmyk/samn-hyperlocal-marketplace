import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useTaskStore } from '../stores/taskStore';
import {
  X,
  Sparkles,
  MapPin,
  Flame,
  ArrowRight,
  ArrowLeft,
  Check,
  ShoppingBag,
  Truck,
  Wrench,
  Utensils,
  BookOpen,
  Home,
  HeartHandshake,
  DollarSign,
  Scissors,
  Car,
  Sprout,
  Stethoscope,
  UserCheck,
  Loader2,
} from 'lucide-react';

const categories = [
  { id: 'delivery', label: 'Delivery & Courier', icon: Truck },
  { id: 'grocery', label: 'Grocery & Errands', icon: ShoppingBag },
  { id: 'cleaning', label: 'Cleaning & Housekeeping', icon: Sparkles },
  { id: 'care_taker', label: 'Care Takers & Elderly Care', icon: UserCheck },
  { id: 'hospital_accompany', label: 'Accompany to Hospital', icon: Stethoscope },
  { id: 'pet_care', label: 'Pet Care & Walking', icon: HeartHandshake },
  { id: 'pet_grooming', label: 'Pet Grooming & Spa', icon: Scissors },
  { id: 'car_wash', label: 'Car Wash & Detailing', icon: Car },
  { id: 'gardening', label: 'Gardening & Yard Care', icon: Sprout },
  { id: 'tech_help', label: 'Tech & Device Setup', icon: Wrench },
  { id: 'moving', label: 'Moving & Heavy Lifting', icon: Home },
  { id: 'cooking', label: 'Cooking & Home Meals', icon: Utensils },
  { id: 'repair', label: 'Quick Repair & Assembly', icon: Wrench },
  { id: 'tutoring', label: 'Tutoring & Learning', icon: BookOpen },
  { id: 'other', label: 'Other Everyday Task', icon: MapPin },
];

export default function PostTaskModal({ isOpen, onClose, onSuccess }) {
  const { user, userLocation } = useAuthStore();
  const { createTask, isLoading } = useTaskStore();

  const getCleanAddress = () => {
    if (userLocation?.address && !userLocation.address.toLowerCase().includes('browser location') && userLocation.address !== 'Current Location') {
      return userLocation.address;
    }
    if (user?.location?.address && !user.location.address.toLowerCase().includes('browser location') && user.location.address !== 'Current Location') {
      return user.location.address;
    }
    return 'Bengaluru, Karnataka';
  };

  const getInitialFormData = () => ({
    title: '',
    description: '',
    category: 'delivery',
    forSelf: true,
    recipientName: '',
    recipientPhone: '',
    address: getCleanAddress(),
    landmark: '',
    locationNotes: '',
    coordinates: userLocation?.coordinates || user?.location?.coordinates || [77.5946, 12.9716],
    searchRadius: 10000, // 10km
    budgetAmount: 350,
    budgetType: 'fixed',
    isUrgent: false,
    tags: '',
  });

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(getInitialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [error, setError] = useState(null);

  // ALWAYS reset modal state when opened fresh!
  React.useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError(null);
      setIsSubmitting(false);
      setFormData(getInitialFormData());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUseMyLocation = () => {
    const cleanAddr = getCleanAddress();
    setFormData((prev) => ({
      ...prev,
      address: cleanAddr,
      coordinates: userLocation?.coordinates || user?.location?.coordinates || prev.coordinates,
    }));
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!formData.title.trim()) return setError('Please enter a task title');
      if (!formData.description.trim()) return setError('Please describe what you need help with');
    }
    if (step === 2) {
      if (!formData.address.trim()) return setError('Please specify the task location address');
      if (!formData.forSelf && !formData.recipientName.trim()) {
        return setError('Please provide the recipient name or relationship (e.g. Mom, Friend, Patient)');
      }

      // If user provided an address different from current geolocation address, geocode it
      const currentLocAddress = userLocation?.address || user?.location?.address || '';
      const isCustomAddress = formData.address.trim().toLowerCase() !== currentLocAddress.trim().toLowerCase();

      if (isCustomAddress) {
        setIsGeocoding(true);
        setError(null);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.address.trim())}&limit=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (res.ok) {
            const results = await res.json();
            if (results && results.length > 0) {
              const item = results[0];
              const coords = [parseFloat(item.lon), parseFloat(item.lat)];
              setFormData((prev) => ({
                ...prev,
                coordinates: coords,
              }));
            } else {
              setIsGeocoding(false);
              return setError('Could not find location coordinates for this address. Please provide a more specific street, locality, or landmark.');
            }
          } else {
            setIsGeocoding(false);
            return setError('Location service error. Please check your address and try again.');
          }
        } catch (err) {
          setIsGeocoding(false);
          return setError('Failed to lookup address coordinates. Please check your internet connection.');
        }
        setIsGeocoding(false);
      }
    }
    setError(null);
    setStep((s) => s + 1);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting || isLoading) return;

    if (!formData.budgetAmount || Number(formData.budgetAmount) <= 0) {
      return setError('Please enter a valid reward amount');
    }

    if (!formData.coordinates || !Array.isArray(formData.coordinates) || formData.coordinates.length !== 2 || isNaN(formData.coordinates[0]) || isNaN(formData.coordinates[1])) {
      return setError('Invalid location coordinates. Please select or verify the address.');
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const payload = {
        ...formData,
        tags: formData.tags
          ? Array.isArray(formData.tags)
            ? formData.tags
            : formData.tags.split(',').map((t) => t.trim())
          : [],
      };

      const res = await createTask(payload);
      if (res && res.success) {
        setFormData(getInitialFormData());
        setStep(1);
        if (onSuccess) onSuccess(res.task);
        onClose();
      } else {
        setError(res?.message || 'Failed to submit task. Please verify your connection.');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Server error submitting task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl rounded-3xl glass border border-slate-700 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
              Step {step} of 3
            </span>
            <h2 className="text-xl font-black text-white">Post a New Task</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full my-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-brand-500 to-indigo-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Step 1: Category & Details */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Task Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Need someone to pick up medication from pharmacy"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Select Category *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = formData.category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat.id })}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'bg-brand-600/30 border-brand-500 text-white shadow-lg shadow-brand-500/20'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-1 ${isSelected ? 'text-brand-400' : 'text-slate-400'}`} />
                      <span className="text-xs font-semibold line-clamp-1">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Description & Instructions *
              </label>
              <textarea
                rows={3}
                placeholder="Provide details: items, exact pickup/drop details, special requirements..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm"
              />
            </div>
          </div>
        )}

        {/* Step 2: Location, Recipient & Landmark */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Who is this help for? Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                Who needs this help? *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      forSelf: true,
                      address: userLocation?.address || formData.address,
                    })
                  }
                  className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border text-center font-bold text-xs transition-all ${
                    formData.forSelf
                      ? 'bg-brand-600/30 border-brand-500 text-white shadow-md shadow-brand-500/20 ring-1 ring-brand-500'
                      : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-base">👤</span>
                  <span>For Myself</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      forSelf: false,
                    })
                  }
                  className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border text-center font-bold text-xs transition-all ${
                    !formData.forSelf
                      ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md shadow-indigo-500/20 ring-1 ring-indigo-500'
                      : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-base">👥</span>
                  <span>For Someone Else</span>
                </button>
              </div>
            </div>

            {/* If For Someone Else -> Recipient details */}
            {!formData.forSelf && (
              <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-indigo-300">Recipient Contact & Info</span>
                  <span className="text-[10px] text-slate-400 font-medium">(Helper will assist this person)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Person Name / Relationship *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. My Mom, Grandma Mary, Rajesh"
                      value={formData.recipientName}
                      onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Recipient Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={formData.recipientPhone}
                      onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Location & Address */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  {formData.forSelf ? 'My Location / Address *' : "Recipient's Location / Address *"}
                </label>
                {formData.forSelf && userLocation?.address && (
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    className="text-[11px] font-bold text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    📍 Use Current Location
                  </button>
                )}
              </div>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-brand-400" />
                <input
                  type="text"
                  placeholder={
                    formData.forSelf
                      ? 'Your street, apartment name, flat number...'
                      : "Recipient's street, apartment name, locality..."
                  }
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm"
                />
              </div>
            </div>

            {/* Landmark (Prominent Landmark for Helper Navigation) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Key Landmark / Spot Directions {formData.forSelf ? '(Optional)' : '(Recommended)'}
              </label>
              <input
                type="text"
                placeholder="e.g. Opposite Apollo Pharmacy, Behind SBI Bank, 2nd Floor Yellow Gate"
                value={formData.landmark}
                onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm"
              />
            </div>

            {/* Helper Radar Radius */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Helper Radar Radius: <span className="text-brand-400 font-bold">{formData.searchRadius / 1000} km</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[3000, 5000, 10000, 25000].map((radius) => (
                  <button
                    key={radius}
                    type="button"
                    onClick={() => setFormData({ ...formData, searchRadius: radius })}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      formData.searchRadius === radius
                        ? 'bg-brand-600 text-white border-brand-500 shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {radius / 1000} km
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                If no helper accepts within 15 minutes, SAMN will automatically expand your broadcast zone!
              </p>
            </div>

            {/* Keywords / Tags */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Keywords / Tags (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. quick, fragile, heavy, car required"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm"
              />
            </div>
          </div>
        )}

        {/* Step 3: Budget & Urgency */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Reward / Budget (INR ₹) *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-lg font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  min="50"
                  step="50"
                  value={formData.budgetAmount}
                  onChange={(e) => setFormData({ ...formData, budgetAmount: Number(e.target.value) })}
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-emerald-400 font-bold text-xl focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, budgetType: 'fixed' })}
                className={`p-3 rounded-xl border text-center transition-all ${
                  formData.budgetType === 'fixed'
                    ? 'bg-brand-600/30 border-brand-500 text-white font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <span className="text-sm">Fixed Price</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, budgetType: 'hourly' })}
                className={`p-3 rounded-xl border text-center transition-all ${
                  formData.budgetType === 'hourly'
                    ? 'bg-brand-600/30 border-brand-500 text-white font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <span className="text-sm">Hourly Rate</span>
              </button>
            </div>

            {/* Urgency Toggle */}
            <div
              onClick={() => setFormData({ ...formData, isUrgent: !formData.isUrgent })}
              className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                formData.isUrgent
                  ? 'bg-red-950/40 border-red-500/50 shadow-lg shadow-red-500/10'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    formData.isUrgent ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Mark as Urgent</h4>
                  <p className="text-xs text-slate-400">Pushes immediate high-priority alert to nearby helpers</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.isUrgent}
                onChange={() => {}}
                className="w-5 h-5 accent-red-500 rounded cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-800">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-semibold text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div></div>
          )}

          {step < 3 ? (
            <button
              type="button"
              disabled={isGeocoding}
              onClick={handleNext}
              className="flex items-center space-x-1.5 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeocoding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Locating Address...</span>
                </>
              ) : (
                <>
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              disabled={isLoading || isSubmitting}
              onClick={handleSubmit}
              className="flex items-center space-x-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-brand-600/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading || isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Broadcasting Task...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Broadcast Task Live</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
