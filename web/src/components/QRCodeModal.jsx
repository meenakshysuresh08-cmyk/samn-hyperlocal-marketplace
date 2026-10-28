import React from 'react';
import { X, QrCode, ShieldCheck, Copy, Check } from 'lucide-react';

export default function QRCodeModal({ isOpen, onClose, task }) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !task) return null;

  const otp = task.completionOtp || '----';
  const qrData = encodeURIComponent(
    JSON.stringify({
      taskId: task._id,
      title: task.title,
      otp: task.completionOtp,
      type: 'SAMN_TASK_COMPLETION_HANDSHAKE',
    })
  );
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&color=050b14&bgcolor=ffffff&data=${qrData}`;

  const copyCode = () => {
    navigator.clipboard.writeText(otp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-sm rounded-3xl glass border border-slate-700 shadow-2xl p-6 text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-center space-x-2 text-brand-400 mb-1">
          <QrCode className="w-5 h-5" />
          <h3 className="text-base font-black text-white">Completion Handshake</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">{task.title}</p>

        {/* QR Code Container */}
        <div className="bg-white p-4 rounded-2xl shadow-xl inline-block mb-4 border-2 border-brand-500/40">
          <img
            src={qrUrl}
            alt="Completion QR Code"
            className="w-48 h-48 mx-auto rounded-lg"
          />
        </div>

        {/* 4-Digit OTP Display */}
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3 mb-4">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">
            Or share this 4-Digit Verification Code:
          </span>
          <div className="flex items-center justify-center space-x-2">
            <span className="font-mono text-2xl font-black tracking-widest text-emerald-400">
              {otp}
            </span>
            <button
              onClick={copyCode}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
              title="Copy OTP"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Security & Privacy Notice */}
        <div className="flex items-start space-x-2 text-left bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-[11px] text-amber-300/90">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong>Privacy Protected:</strong> Share this code or QR only when helper has finished work in person. Entering this code releases the payout.
          </span>
        </div>
      </div>
    </div>
  );
}
