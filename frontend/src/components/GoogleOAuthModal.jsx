import React, { useState } from 'react';
import { X, User, Plus, Check, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const PRESET_ACCOUNTS = [
  {
    name: 'Sarah Jenkins',
    email: 'sarah.digital@gmail.com',
    role: 'CANDIDATE',
    subtitle: 'Performance Marketer • Austin, TX',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80'
  },
  {
    name: 'Marcus Vance',
    email: 'marcus.seo@gmail.com',
    role: 'CANDIDATE',
    subtitle: 'SEO & Content Strategist',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'
  }
];

export default function GoogleOAuthModal({ onSuccess, onClose }) {
  const { loginUser } = useAuth();
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const executeGoogleLogin = async (email, name, role = 'CANDIDATE') => {
    setError('');
    setLoading(true);
    try {
      const res = await api.googleLogin({ email, name, role });
      loginUser(res.access_token, res.user);
      if (onSuccess) onSuccess(res.user);
      if (onClose) onClose();
    } catch (err) {
      setError(err.message || 'Google OAuth sign in failed.');
      setLoading(false);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes('@')) {
      setError('Please enter a valid Gmail address');
      return;
    }
    const name = customName || customEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase());
    executeGoogleLogin(customEmail.trim().toLowerCase(), name, 'CANDIDATE');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in select-none">
      <div className="w-full max-w-[420px] bg-white rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-100 text-slate-800 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Close"
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Google Header */}
        <div className="text-center mb-5">
          {/* Google Icon */}
          <div className="w-10 h-10 mx-auto mb-2 flex items-center justify-center">
            <svg className="w-8 h-8" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-slate-800">Sign in with Google</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Choose an account to continue to <span className="font-semibold text-slate-700">Uptrix Portal</span>
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 mb-3 text-red-600 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Account List */}
        {!showCustomInput ? (
          <div className="space-y-2 mb-4">
            {PRESET_ACCOUNTS.map((acc, i) => (
              <div
                key={i}
                onClick={() => {
                  if (loading) return;
                  setSelectedAccount(acc.email);
                  executeGoogleLogin(acc.email, acc.name, acc.role);
                }}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                  selectedAccount === acc.email
                    ? 'border-[#7a9c8b] bg-[#f2f7f4]'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <img
                  src={acc.avatar}
                  alt={acc.name}
                  className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                />
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-slate-800 truncate">{acc.name}</h4>
                    <span className="text-[0.65rem] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">
                      Google Verified
                    </span>
                  </div>
                  <p className="text-[0.72rem] text-slate-500 truncate">{acc.email}</p>
                </div>
                {loading && selectedAccount === acc.email ? (
                  <Loader2 size={16} className="text-[#557b68] animate-spin shrink-0" />
                ) : null}
              </div>
            ))}

            {/* Option to use another account */}
            <div
              onClick={() => setShowCustomInput(true)}
              className="p-3 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 flex items-center gap-3 transition-all cursor-pointer text-slate-600"
            >
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
                <Plus size={16} />
              </div>
              <div className="flex-1 text-left">
                <h4 className="text-xs font-semibold text-slate-700">Use another Gmail account</h4>
                <p className="text-[0.72rem] text-slate-400">Sign in or register with any Gmail address</p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCustomSubmit} className="space-y-3 mb-4">
            <div>
              <label className="block text-[0.72rem] font-semibold text-black mb-1">
                Your Full Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. David Miller"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:border-[#7a9c8b] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[0.72rem] font-semibold text-black mb-1">
                Gmail Address *
              </label>
              <input
                type="email"
                placeholder="yourname@gmail.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                required
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:border-[#7a9c8b] transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCustomInput(false)}
                className="flex-1 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : 'Continue'}
              </button>
            </div>
          </form>
        )}

        {/* Google Terms Footer */}
        <p className="text-[0.66rem] text-slate-400 text-center leading-relaxed">
          To continue, Google will share your name, email address, and profile picture with Uptrix. See Uptrix's{' '}
          <span className="text-slate-600 underline cursor-pointer">Privacy Policy</span> and{' '}
          <span className="text-slate-600 underline cursor-pointer">Terms of Service</span>.
        </p>

      </div>
    </div>
  );
}
