import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
  Sparkles,
  Server,
  ArrowLeft
} from 'lucide-react';

export default function SuperadminLogin({ onLoginSuccess, onBackToLanding }) {
  const { loginUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please provide both superadmin email and password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await api.superadminLogin(email.trim(), password);
      loginUser(res.access_token, res.user);
      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        const target = (typeof window !== 'undefined' && (window.location.hostname === 'admin.intentpeople.com' || window.location.hostname.startsWith('admin.')))
          ? '/'
          : '/superadmin';
        window.history.pushState(null, '', target);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    } catch (err) {
      setError(err.message || 'Superadmin authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemoCredentials = () => {
    setEmail('superadmin@intentpeople.com');
    setPassword('SuperAdmin@IntentPeople2026!');
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background ambient lighting effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-blue-100/60 via-indigo-100/30 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-blue-100/40 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-indigo-100/40 blur-3xl pointer-events-none rounded-full" />

      {/* Top Bar Navigation */}
      <header className="relative z-10 px-6 py-5 max-w-7xl mx-auto w-full flex items-center justify-between">
        <button
          onClick={onBackToLanding || (() => { window.location.href = 'https://intentpeople.com/'; })}
          className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors bg-white hover:bg-slate-50 px-3.5 py-1.5 rounded-lg border border-slate-200 shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Main Portal</span>
        </button>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Superadmin Gateway Active
        </div>
      </header>

      {/* Main Login Card */}
      <main className="relative z-10 max-w-md w-full mx-auto px-6 py-8">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-8 shadow-xl shadow-slate-200/60">
          
          {/* Header & Icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 mb-4 shadow-xs">
              <ShieldCheck className="w-7 h-7 text-blue-600" />
            </div>

            <div className="flex items-center justify-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Superadmin Portal</h1>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Master Control & Subscription Management Console
            </p>

            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-800">
              <Lock className="w-3 h-3" />
              <span>Restricted Access • Master Role Only</span>
            </div>
          </div>

          {/* Error Message Box */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700 animate-in fade-in shadow-xs">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Superadmin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="superadmin@intentpeople.com"
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Master Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  required
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Master Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In as Superadmin</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Credential Helper */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2.5">
              <span className="flex items-center gap-1.5 font-medium">
                <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                Default Credentials:
              </span>
              <button
                type="button"
                onClick={handleFillDemoCredentials}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold underline decoration-dotted transition-colors"
              >
                Autofill Credentials
              </button>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-600 space-y-1">
              <div><span className="text-slate-400">Email:</span> superadmin@intentpeople.com</div>
              <div><span className="text-slate-400">Password:</span> SuperAdmin@IntentPeople2026!</div>
            </div>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-slate-500 font-medium">
          <Server className="w-3.5 h-3.5 text-slate-400" />
          <span>IntentPeople Core Engine • End-to-End Encrypted Session</span>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} IntentPeople Hiring Platform. All rights reserved.
      </footer>
    </div>
  );
}
