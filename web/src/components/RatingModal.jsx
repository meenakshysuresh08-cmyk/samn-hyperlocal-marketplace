import React, { useState } from 'react';
import API from '../services/api';
import { X, Star, Sparkles, Check } from 'lucide-react';

const tagOptions = [
  'Super Fast ⚡',
  'Polite & Friendly 😊',
  'Punctual ⏰',
  'Clear Communication 💬',
  'Great Quality 🌟',
  'Fair Pricing 💰',
  'Highly Recommended 👍',
];

export default function RatingModal({ isOpen, onClose, task, targetUser, targetRole, onSuccess }) {
  const [score, setScore] = useState(5);
  const [hoverScore, setHoverScore] = useState(0);
  const [review, setReview] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !task) return null;

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await API.post('/ratings', {
        taskId: task._id,
        score,
        review,
        tags: selectedTags,
      });
      setLoading(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to submit rating');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl glass border border-slate-700 shadow-2xl p-6 sm:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-black text-white">Rate Experience</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Rate {targetUser?.name || 'User'} as {targetRole || 'participant'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 my-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-5 text-center">
          {/* Star Rating selector */}
          <div className="flex items-center justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverScore(star)}
                onMouseLeave={() => setHoverScore(0)}
                onClick={() => setScore(star)}
                className="p-1.5 transition-transform hover:scale-125 focus:outline-none"
              >
                <Star
                  className={`w-8 h-8 ${
                    (hoverScore || score) >= star
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-slate-600'
                  } transition-colors`}
                />
              </button>
            ))}
          </div>
          <span className="text-xs font-bold text-amber-300">
            {score === 5 && 'Excellent! ⭐⭐⭐⭐⭐'}
            {score === 4 && 'Very Good! ⭐⭐⭐⭐'}
            {score === 3 && 'Average ⭐⭐⭐'}
            {score === 2 && 'Below Average ⭐⭐'}
            {score === 1 && 'Poor Experience ⭐'}
          </span>

          {/* Quick Compliment Tags */}
          <div className="text-left">
            <label className="block text-xs font-bold text-slate-300 mb-2">
              Select Compliment Tags
            </label>
            <div className="flex flex-wrap gap-1.5">
              {tagOptions.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Written Review */}
          <div className="text-left">
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Written Review (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Share how this task went..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/30 transition-all disabled:opacity-50"
          >
            {loading ? 'Submitting Rating...' : 'Submit Rating & Feedback'}
          </button>
        </form>
      </div>
    </div>
  );
}
