import React, { useState, useEffect } from 'react';
import { KeyRound, Mail, ArrowRight, CheckCircle2, AlertCircle, Eye, EyeOff, Loader2, RefreshCw, X } from 'lucide-react';
import { api } from '../api';

export default function ForgotPasswordModal({ initialEmail = '', onSuccess, onClose }) {
  const [step, setStep] = useState(1); // 1 = Enter Email, 2 = Enter OTP & New Password, 3 = Success
  const [email, setEmail] = useState(initialEmail || '');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSendCode = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address');
      return;
    }
    setError('');
    setInfoMsg('');
    setLoading(true);

    try {
      await api.forgotPassword(cleanEmail);
      setStep(2);
      setResendCooldown(45);
      setInfoMsg(`A 6-digit reset code has been sent to ${cleanEmail}`);
    } catch (err) {
      setError(err.message || 'Failed to send password reset code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || resending) return;
    setError('');
    setInfoMsg('');
    setResending(true);

    try {
      await api.forgotPassword(email.trim());
      setInfoMsg('A new reset code has been sent to your email.');
      setResendCooldown(45);
    } catch (err) {
      setError(err.message || 'Failed to resend code. Please try again in a few moments.');
    } finally {
      setResending(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const cleanOtp = otpCode.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setError('Please enter the full 6-digit code sent to your email');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setInfoMsg('');
    setLoading(true);

    try {
      await api.resetPassword({
        email: email.trim(),
        otp_code: cleanOtp,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      setStep(3);
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please check your code and try again.');
    } finally {
      setLoading(false);
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

        {/* ================= STEP 1: ENTER EMAIL ================= */}
        {step === 1 && (
          <div>
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200 text-[#FF6008] flex items-center justify-center mx-auto mb-3 shadow-xs">
                <KeyRound className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1 tracking-tight">
                Reset Your Password
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Enter your registered email address and we'll send you a 6-digit code to reset your password.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl mb-4">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="block text-[11.5px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Email Address
                </label>
                <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 focus-within:border-[#FF6008] focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-100 transition-all">
                  <Mail size={16} className="text-slate-400 shrink-0" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full text-xs bg-transparent border-none outline-none text-slate-800 placeholder-slate-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-[#FF6008] hover:bg-[#E05200] disabled:opacity-60 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer border-none"
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Sending Code…
                  </>
                ) : (
                  <>
                    Send Reset Code
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ================= STEP 2: ENTER OTP & NEW PASSWORD ================= */}
        {step === 2 && (
          <div>
            <div className="text-center mb-5">
              <div className="w-13 h-13 rounded-2xl bg-orange-50 border border-orange-200 text-[#FF6008] flex items-center justify-center mx-auto mb-3 shadow-xs">
                <Mail className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1 tracking-tight">
                Enter Verification Code
              </h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mb-2">
                We've sent a 6-digit code to:
              </p>
              <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full text-xs font-semibold text-slate-800">
                <span>{email}</span>
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(''); setInfoMsg(''); }}
                  className="text-[11px] text-[#FF6008] hover:underline font-bold border-none bg-transparent cursor-pointer p-0"
                >
                  Change
                </button>
              </div>
            </div>

            {infoMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl mb-4 leading-relaxed">
                📩 {infoMsg}
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl mb-4">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  6-Digit Reset Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full text-center tracking-[8px] font-mono text-xl py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#FF6008] focus:ring-2 focus:ring-orange-100 outline-none transition-all font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  New Password
                </label>
                <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 focus-within:border-[#FF6008] focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-100 transition-all">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 chars)"
                    className="w-full text-xs bg-transparent border-none outline-none text-slate-800 placeholder-slate-400"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0.5"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Confirm New Password
                </label>
                <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 focus-within:border-[#FF6008] focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-100 transition-all">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full text-xs bg-transparent border-none outline-none text-slate-800 placeholder-slate-400"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0.5"
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Resend Code Button */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || resending}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#FF6008] disabled:opacity-50 disabled:cursor-not-allowed border-none bg-transparent cursor-pointer transition-colors"
                >
                  <RefreshCw size={13} className={resending ? 'animate-spin' : ''} />
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-[#FF6008] hover:bg-[#E05200] disabled:opacity-60 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer border-none mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Updating Password…
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          </div>
        )}

        {/* ================= STEP 3: SUCCESS ================= */}
        {step === 3 && (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">
              Password Reset Complete!
            </h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mb-6 leading-relaxed">
              Your password has been successfully updated. You can now sign in to your IntentPeople account with your new credentials.
            </p>
            <button
              type="button"
              onClick={() => {
                if (onSuccess) onSuccess(email);
                if (onClose) onClose();
              }}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-[#FF6008] hover:bg-[#E05200] transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer border-none"
            >
              Sign In Now &rarr;
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
