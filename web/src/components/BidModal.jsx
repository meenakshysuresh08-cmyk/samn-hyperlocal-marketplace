import React, { useState } from 'react';
import { useTaskStore } from '../stores/taskStore';
import { X, DollarSign, Clock, MessageSquare, Send } from 'lucide-react';

export default function BidModal({ isOpen, onClose, task, onSuccess }) {
  const { submitBid } = useTaskStore();
  const [proposedAmount, setProposedAmount] = useState(task?.budget?.amount || 250);
  const [estimatedTime, setEstimatedTime] = useState('30-45 mins');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !task) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!proposedAmount || proposedAmount <= 0) {
      return setError('Please enter a valid offer amount');
    }

    setLoading(true);
    setError(null);
    const res = await submitBid(task._id, {
      proposedAmount: Number(proposedAmount),
      estimatedTime,
      message,
    });
    setLoading(false);

    if (res.success) {
      if (onSuccess) onSuccess(res.bid);
      onClose();
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl glass border border-slate-700 shadow-2xl p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-black text-white">Make an Offer</h3>
            <p className="text-xs text-slate-400 truncate mt-0.5">Task: {task.title}</p>
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Target / Offered Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Your Offer Amount (INR ₹)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-lg font-bold text-slate-400">₹</span>
              <input
                type="number"
                min="50"
                step="25"
                value={proposedAmount}
                onChange={(e) => setProposedAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-emerald-400 font-bold text-xl focus:outline-none focus:border-brand-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Customer's budget: <span className="text-emerald-400 font-bold">₹{task.budget?.amount}</span>
            </p>
          </div>

          {/* Estimated Completion Time */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Estimated Completion Time
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['15-30 mins', '45-60 mins', '2+ hours'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setEstimatedTime(t)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                    estimatedTime === t
                      ? 'bg-brand-600 border-brand-500 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Pitch / Message */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Message to Customer (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. I am 5 minutes away and have a two-wheeler ready to assist!"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-xl shadow-brand-600/30 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span>Submitting Offer...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send Offer to Customer</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
