import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, ShieldCheck, KeyRound, AlertCircle, ArrowRight, RefreshCw, X } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function OTPModal({ email, onSuccess, onClose }) {
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { loginUser } = useAuth();

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    const cleanOtp = otpCode.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setError('Please enter the complete 6-digit OTP code sent to your email');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await api.verifyOTP(email, cleanOtp);
      loginUser(res.access_token, res.user);
      if (onSuccess) onSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP code. Please check your email and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    setError('');
    setSuccessMsg('');
    setResending(true);

    try {
      await api.resendOTP(email);
      setSuccessMsg('A new verification code has been dispatched to your email.');
      setResendCooldown(45);
    } catch (err) {
      setError(err.message || 'Failed to resend OTP. Please try again in a few moments.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in select-none">
      <div className="w-full max-w-md bg-white rounded-3xl p-7 sm:p-8 shadow-2xl border border-slate-100 text-slate-800 relative">

        {/* Close Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer border-none"
            title="Close"
          >
            <X size={16} />
          </button>
        )}

        {/* Header Icon */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-[#7a9c8b]/15 text-[#5c7f6e] flex items-center justify-center mx-auto mb-3 shadow-sm border border-[#7a9c8b]/20">
            <Mail className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-1 tracking-tight">
            Check Your Email
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            We've sent a 6-digit verification code to:
          </p>
          <div className="mt-1.5 inline-block bg-slate-50 border border-slate-200 px-3 py-1 rounded-full text-xs font-semibold text-slate-800">
            {email}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 text-[0.73rem] text-slate-600 leading-normal">
          📩 Please open your inbox (and check <strong>Spam / Junk</strong> folder if not found in Primary) and enter the 6-digit code below to finish registering.
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 mb-3.5 text-emerald-700 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle size={15} className="shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 mb-3.5 text-rose-600 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle size={15} className="shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleVerify}>
          <div className="mb-5">
            <label className="block text-center text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
              Enter 6-Digit OTP Code
            </label>
            <div className="relative">
              <KeyRound className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 text-2xl font-bold tracking-[0.45em] text-center focus:outline-none focus:border-[#7a9c8b] focus:bg-white transition-all font-mono placeholder:tracking-widest placeholder:text-slate-300"
                maxLength={6}
                value={otpCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setOtpCode(val);
                }}
                placeholder="000000"
                autoFocus
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || otpCode.length < 6}
          >
            {loading ? 'Verifying...' : (
              <>
                Verify & Complete Registration <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Resend Action */}
        <div className="text-center mt-4 text-xs text-slate-500">
          Didn't receive the email?{' '}
          {resendCooldown > 0 ? (
            <span className="text-slate-400 font-medium ml-1">
              Resend in {resendCooldown}s
            </span>
          ) : (
            <button
              type="button"
              className="bg-transparent border-none text-[#5a806e] hover:text-[#426052] font-semibold cursor-pointer underline ml-1 inline-flex items-center gap-1"
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? (
                <>
                  <RefreshCw size={12} className="animate-spin" /> Sending...
                </>
              ) : (
                'Resend code'
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
