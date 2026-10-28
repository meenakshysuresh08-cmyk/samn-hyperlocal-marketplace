import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTaskStore } from '../stores/taskStore';
import BidModal from '../components/BidModal';
import ProofModal from '../components/ProofModal';
import RatingModal from '../components/RatingModal';
import ChatDrawer from '../components/ChatDrawer';
import QRCodeModal from '../components/QRCodeModal';
import LiveTrackingMap from '../components/LiveTrackingMap';
import {
  MapPin,
  Clock,
  CheckCircle2,
  DollarSign,
  Flame,
  Radio,
  Star,
  Users,
  MessageSquare,
  ArrowLeft,
  ShieldCheck,
  Play,
  Check,
  AlertTriangle,
  XCircle,
  Eye,
  KeyRound,
  QrCode,
  Sparkles,
  Camera,
} from 'lucide-react';

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    currentTask,
    fetchTaskById,
    acceptBid,
    startTask,
    approveCompletion,
    cancelTask,
    isLoading,
  } = useTaskStore();

  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  useEffect(() => {
    if (id) fetchTaskById(id);
  }, [id]);

  if (isLoading || !currentTask) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isCustomer = currentTask.customerId?._id?.toString() === user?._id?.toString();
  const isAssignedHelper = currentTask.helperId?._id?.toString() === user?._id?.toString();
  const hasUserBid = currentTask.bids?.some(
    (b) => b.helperId?._id?.toString() === user?._id?.toString()
  );

  const handleAcceptBid = async (bidId) => {
    if (window.confirm('Accept this bid and assign helper to your task?')) {
      await acceptBid(currentTask._id, bidId);
      fetchTaskById(currentTask._id);
    }
  };

  const handleStartTask = async () => {
    await startTask(currentTask._id);
    fetchTaskById(currentTask._id);
  };

  const handleApproveDirectly = async () => {
    if (window.confirm('Are you sure you want to approve this task and release payment to the helper?')) {
      const res = await approveCompletion(currentTask._id);
      if (res.success) {
        fetchTaskById(currentTask._id);
      } else {
        alert(res.message);
      }
    }
  };

  const handleCancelTask = async () => {
    const reason = window.prompt('Please enter the reason for cancellation:');
    if (reason) {
      await cancelTask(currentTask._id, reason);
      fetchTaskById(currentTask._id);
    }
  };

  // Status timeline steps
  const steps = [
    { key: 'open', label: 'Broadcasted', done: true },
    { key: 'assigned', label: 'Helper Assigned', done: ['assigned', 'in_progress', 'completed'].includes(currentTask.status) },
    { key: 'in_progress', label: 'In Progress', done: ['in_progress', 'completed'].includes(currentTask.status) },
    { key: 'completed', label: 'Completed & Reviewed', done: currentTask.status === 'completed' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-1.5 text-xs font-bold text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      {/* Main Task Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl glass border border-slate-800 shadow-2xl mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30 uppercase tracking-wide">
                {currentTask.category?.replace(/_/g, ' ')}
              </span>

              {currentTask.isUrgent && (
                <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                  <Flame className="w-3.5 h-3.5 fill-red-400 animate-pulse" />
                  <span>URGENT PRIORITY</span>
                </span>
              )}

              {currentTask.status === 'broadcasted' && (
                <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  <span>Radar Broadcasting Active</span>
                </span>
              )}

              {currentTask.status === 'completed' && (
                <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Task Completed & Verified</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {currentTask.title}
            </h1>
          </div>

          <div className="sm:text-right bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <span className="text-xs font-bold text-slate-400 block">Agreed Budget</span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">
              ₹{currentTask.budget?.amount}
            </span>
            <span className="block text-[10px] text-slate-500 font-semibold uppercase">
              {currentTask.budget?.type} payout
            </span>
          </div>
        </div>

        {/* Progress Tracker Bar */}
        <div className="py-6 border-b border-slate-800">
          <div className="grid grid-cols-4 gap-2">
            {steps.map((step, i) => (
              <div key={step.key} className="flex flex-col items-center text-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all mb-2 ${
                    step.done
                      ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400/40'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {step.done ? <Check className="w-4 h-4 stroke-[3]" /> : i + 1}
                </div>
                <span
                  className={`text-[11px] font-semibold ${
                    step.done ? 'text-white' : 'text-slate-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Description & Location */}
        <div className="py-6 border-b border-slate-800 space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Task Details
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
              {currentTask.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-2">
            <div className="flex items-center space-x-2 text-slate-300 text-xs">
              <MapPin className="w-4 h-4 text-brand-400 shrink-0" />
              <span>{currentTask.location?.address}</span>
            </div>

            <div className="flex items-center space-x-2 text-slate-300 text-xs">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Posted {new Date(currentTask.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            <div className="flex items-center space-x-2 text-slate-300 text-xs">
              <Eye className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{currentTask.viewCount || 1} views</span>
            </div>
          </div>
        </div>

        {/* Poster Profile Bar */}
        <div className="py-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={
                currentTask.customerId?.avatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop'
              }
              alt={currentTask.customerId?.name}
              className="w-12 h-12 rounded-full object-cover border border-slate-700"
            />
            <div>
              <span className="text-xs text-slate-400 font-semibold">Posted By</span>
              <h4 className="text-sm font-bold text-white">{currentTask.customerId?.name}</h4>
              <div className="flex items-center space-x-2 text-xs text-amber-400 mt-0.5">
                <div className="flex items-center space-x-1">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>{currentTask.customerId?.stats?.avgRatingAsCustomer || '5.0'}</span>
                </div>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">{currentTask.customerId?.stats?.tasksPosted || 1} tasks posted</span>
              </div>
            </div>
          </div>

          {/* In-Task Chat Button */}
          {(isCustomer || isAssignedHelper) && currentTask.status !== 'open' && (
            <button
              onClick={() => setChatDrawerOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30 transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>In-Task Chat</span>
            </button>
          )}
        </div>

        {/* 🗺️ REAL-TIME LIVE LOCATION TRACKING (Customer & Delivery Person / Helper) */}
        {['assigned', 'in_progress', 'completed'].includes(currentTask.status) && (
          <div className="my-6">
            <LiveTrackingMap
              task={currentTask}
              currentUser={user}
              isCustomer={isCustomer}
              isAssignedHelper={isAssignedHelper}
            />
          </div>
        )}

        {/* 🔐 CUSTOMER COMPLETION PASSCODE & QR CARD (For Customer when task is assigned or in progress) */}
        {isCustomer && ['assigned', 'in_progress'].includes(currentTask.status) && (
          <div className="my-5 p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-brand-950/40 border border-emerald-500/40 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs mb-1">
                  <KeyRound className="w-4 h-4" />
                  <span>Task Completion Passcode (Share with Helper)</span>
                </div>
                <p className="text-xs text-slate-300 max-w-lg">
                  Provide this 4-digit code to your helper <strong>only when the work is done</strong> to your satisfaction. Entering this code releases the payment.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="px-4 py-2 rounded-xl bg-slate-950 border border-emerald-500/60 font-mono text-2xl font-black tracking-widest text-emerald-400 shadow-inner">
                  {currentTask.completionOtp || '----'}
                </div>

                <button
                  onClick={() => setQrModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-lg shadow-brand-600/20"
                  title="Show Completion QR Code"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Show QR</span>
                </button>

                <button
                  onClick={handleApproveDirectly}
                  className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Directly Approve</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 🌟 HELPER OTP VERIFICATION PROMPT (For Helper when in progress) */}
        {isAssignedHelper && currentTask.status === 'in_progress' && (
          <div className="my-5 p-5 rounded-2xl bg-brand-950/40 border border-brand-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-brand-300 font-bold text-xs mb-1">
                <Sparkles className="w-4 h-4 text-brand-400" />
                <span>Customer OTP Verification Required</span>
              </div>
              <p className="text-xs text-slate-300">
                Finished the task? Ask the customer for their 4-digit completion passcode to verify and release payment.
              </p>
            </div>

            <button
              onClick={() => setProofModalOpen(true)}
              className="flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 transition-all hover:scale-105"
            >
              <KeyRound className="w-4 h-4" />
              <span>Enter Customer OTP & Complete</span>
            </button>
          </div>
        )}

        {/* ✅ VERIFIED OTP COMPLETION BADGE (If task is completed) */}
        {currentTask.status === 'completed' && currentTask.proof && (
          <div className="py-6 border-b border-slate-800 bg-emerald-950/20 p-5 rounded-2xl border border-emerald-500/40 my-5 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center space-x-2 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
                <h4 className="text-sm font-bold">Task Completed & Verified</h4>
              </div>

              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                🔐 4-Digit Customer OTP Verified
              </span>
            </div>

            {currentTask.proof.description && (
              <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                "{currentTask.proof.description}"
              </p>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-6 flex flex-wrap items-center justify-between gap-3">
          {/* Helper Actions */}
          {!isCustomer && (
            <div>
              {['open', 'broadcasted'].includes(currentTask.status) && (
                <button
                  onClick={() => setBidModalOpen(true)}
                  className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-black shadow-xl shadow-brand-600/30 transition-all hover:scale-105"
                >
                  {hasUserBid ? 'Update My Offer' : 'Submit Offer to Assist'}
                </button>
              )}

              {isAssignedHelper && currentTask.status === 'assigned' && (
                <button
                  onClick={handleStartTask}
                  className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-xl shadow-indigo-600/30 transition-all"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Task Now</span>
                </button>
              )}

              {isAssignedHelper && currentTask.status === 'in_progress' && (
                <button
                  onClick={() => setProofModalOpen(true)}
                  className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-xl shadow-emerald-600/30 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Evident Proof</span>
                </button>
              )}

              {isAssignedHelper && currentTask.status === 'completed' && !currentTask.rating?.byHelper && (
                <button
                  onClick={() => setRatingModalOpen(true)}
                  className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-black shadow-xl shadow-amber-500/30 transition-all"
                >
                  <Star className="w-4 h-4 fill-slate-950" />
                  <span>Rate Customer</span>
                </button>
              )}
            </div>
          )}

          {/* Customer Actions */}
          {isCustomer && (
            <div className="flex items-center space-x-3">
              {currentTask.status === 'completed' && !currentTask.rating?.byCustomer && (
                <button
                  onClick={() => setRatingModalOpen(true)}
                  className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-black shadow-xl shadow-amber-500/30 transition-all"
                >
                  <Star className="w-4 h-4 fill-slate-950" />
                  <span>Rate Helper & Close</span>
                </button>
              )}

              {['open', 'broadcasted', 'assigned'].includes(currentTask.status) && (
                <button
                  onClick={handleCancelTask}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors"
                >
                  Cancel Task
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bids Section for Customer */}
      {isCustomer && ['open', 'broadcasted'].includes(currentTask.status) && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-black text-white">Helper Offers ({currentTask.bids?.length || 0})</h3>
            <span className="text-xs text-slate-400">Review proposals and select the best helper</span>
          </div>

          {currentTask.bids?.length === 0 ? (
            <div className="p-8 rounded-2xl glass-card border border-slate-800 text-center text-slate-400 text-xs">
              Waiting for nearby helpers to place bids... Broadcast active within {currentTask.searchRadius / 1000}km!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentTask.bids.map((bid) => (
                <div
                  key={bid._id}
                  className="p-5 rounded-2xl glass-card border border-slate-800 hover:border-brand-500/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <img
                        src={bid.helperId?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop'}
                        alt={bid.helperId?.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-700"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-white">{bid.helperId?.name}</h4>
                        <div className="flex items-center space-x-1 text-xs text-amber-400">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span>{bid.helperId?.stats?.avgRatingAsHelper || '5.0'}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-400">
                            {bid.helperId?.stats?.tasksCompleted || 0} completed
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-black text-emerald-400">
                        ₹{bid.proposedAmount}
                      </span>
                      <span className="block text-[10px] text-slate-400 font-semibold">
                        ⏱️ {bid.estimatedTime}
                      </span>
                    </div>
                  </div>

                  {bid.message && (
                    <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800 mb-4">
                      "{bid.message}"
                    </p>
                  )}

                  <button
                    onClick={() => handleAcceptBid(bid._id)}
                    className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/20 transition-all"
                  >
                    Accept Offer & Assign Helper
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals & Drawers */}
      {bidModalOpen && (
        <BidModal
          isOpen={bidModalOpen}
          task={currentTask}
          onClose={() => setBidModalOpen(false)}
          onSuccess={() => fetchTaskById(currentTask._id)}
        />
      )}

      {proofModalOpen && (
        <ProofModal
          isOpen={proofModalOpen}
          task={currentTask}
          onClose={() => setProofModalOpen(false)}
          onSuccess={() => fetchTaskById(currentTask._id)}
        />
      )}

      {qrModalOpen && (
        <QRCodeModal
          isOpen={qrModalOpen}
          task={currentTask}
          onClose={() => setQrModalOpen(false)}
        />
      )}

      {ratingModalOpen && (
        <RatingModal
          isOpen={ratingModalOpen}
          task={currentTask}
          targetUser={isCustomer ? currentTask.helperId : currentTask.customerId}
          targetRole={isCustomer ? 'helper' : 'customer'}
          onClose={() => setRatingModalOpen(false)}
          onSuccess={() => fetchTaskById(currentTask._id)}
        />
      )}

      {chatDrawerOpen && (
        <ChatDrawer
          isOpen={chatDrawerOpen}
          task={currentTask}
          onClose={() => setChatDrawerOpen(false)}
        />
      )}
    </div>
  );
}
