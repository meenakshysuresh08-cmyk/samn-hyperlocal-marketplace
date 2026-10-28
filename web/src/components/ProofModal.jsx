import React, { useState } from 'react';
import { useTaskStore } from '../stores/taskStore';
import {
  X,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  Lock,
} from 'lucide-react';

export default function ProofModal({ isOpen, onClose, task, onSuccess }) {
  const { submitProof } = useTaskStore();
  const [otp, setOtp] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !task) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 4) {
      setError('Please enter the 4-digit completion code provided by the customer.');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('otp', cleanOtp);
    formData.append('description', description || 'Task successfully verified and completed via Customer OTP');

    const res = await submitProof(task._id, formData);
    setLoading(false);

    if (res.success) {
      if (onSuccess) onSuccess(res.task);
      onClose();
    } else {
      setError(res.message || 'Invalid completion code. Please check with customer.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl glass border border-slate-700 shadow-2xl p-6 sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3 text-emerald-400">
            <KeyRound className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-white">Enter Completion OTP</h3>
          <p className="text-xs text-slate-400 mt-1">
            Task: <span className="text-slate-300 font-semibold">{task.title}</span>
          </p>
        </div>

        {/* Info Banner */}
        <div className="mb-5 p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-start space-x-2.5 text-left">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-300 leading-relaxed">
            Ask the customer for the <strong>4-digit verification code</strong> shown on their SAMN screen. Entering this code releases the payment.
          </p>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 4-Digit OTP Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2 text-center">
              Customer 4-Digit Passcode
            </label>
            <div className="relative max-w-[200px] mx-auto">
              <input
                type="text"
                maxLength={4}
                autoFocus
                placeholder="• • • •"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full py-3.5 px-4 rounded-2xl bg-slate-950 border-2 border-emerald-500/60 text-emerald-300 font-mono text-3xl tracking-[0.4em] text-center font-black focus:outline-none focus:border-emerald-400 shadow-inner"
                required
              />
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5">
              Completion Note <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Work completed to customer satisfaction"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-xs"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || otp.length !== 4}
            className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-xl shadow-emerald-600/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.01]"
          >
            {loading ? (
              <span>Verifying Code...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify OTP & Complete Task</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
