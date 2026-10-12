import React, { useEffect, useState, useRef } from 'react';
import {
  CheckCircle2, AlertCircle, Lock, Clock, FileText,
  X, ArrowRight, Sparkles, ShieldAlert, ExternalLink, ChevronRight
} from 'lucide-react';

export default function ToastNotification({
  toast,
  onClose,
  onAction,
  duration = 5000
}) {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const startTimeRef = useRef(Date.now());
  const remainingTimeRef = useRef(duration);
  const timerRef = useRef(null);

  // Normalize toast input (string or object)
  const normalized = (() => {
    if (!toast) return null;
    if (typeof toast === 'object') {
      return {
        type: toast.type || 'info',
        title: toast.title || 'Notification',
        message: toast.message || '',
        tag: toast.tag || null,
        actionText: toast.actionText || null,
        actionTab: toast.actionTab || null,
        stepCount: toast.stepCount ?? null,
        totalSteps: toast.totalSteps ?? 7,
        onCustomAction: toast.onAction || null
      };
    }

    const raw = String(toast).trim();

    // 1. Company Profile Locked Case
    if (raw.includes('Complete all 7 steps of your Company Profile') || raw.includes('steps of your Company Profile')) {
      const matchSteps = raw.match(/\((\d+)\/(\d+)\)/);
      const stepStr = matchSteps ? `${matchSteps[1]}/${matchSteps[2]}` : '0/7';
      const matchFeature = raw.match(/to unlock ["']?([^"']+)["']?/);
      const featureName = matchFeature ? matchFeature[1].replace(/["'.]/g, '') : 'this feature';

      return {
        type: 'profile_locked',
        title: `Unlock "${featureName}"`,
        message: `Complete all 7 steps of your Company Profile (${stepStr} completed) to unlock "${featureName}".`,
        tag: `${stepStr} Steps Completed`,
        actionText: 'Complete Profile (100%)',
        actionTab: 'company_profile'
      };
    }

    // 2. Plan Locked Case
    if (raw.includes('is locked under your current plan tier') || raw.includes('Upgrade your plan to unlock') || raw.startsWith('🔒')) {
      const cleanMsg = raw.replace(/^🔒\s*/, '');
      return {
        type: 'plan_locked',
        title: 'Subscription Tier Required',
        message: cleanMsg,
        tag: 'Plan Locked',
        actionText: 'Upgrade Plan',
        actionTab: 'plans'
      };
    }

    // 3. Under Review Case
    if (raw.includes('under inspect review') || raw.startsWith('⏳')) {
      const cleanMsg = raw.replace(/^⏳\s*/, '');
      return {
        type: 'review',
        title: 'Profile Under Review',
        message: cleanMsg,
        tag: 'Inspect Review',
        actionText: 'View Profile',
        actionTab: 'company_profile'
      };
    }

    // 4. Warning / Error Case
    if (raw.startsWith('⚠️') || raw.startsWith('❌') || raw.toLowerCase().includes('error') || raw.toLowerCase().includes('rejected')) {
      const cleanMsg = raw.replace(/^[⚠️❌]\s*/, '');
      return {
        type: 'warning',
        title: 'Action Required',
        message: cleanMsg,
        tag: 'Notice'
      };
    }

    // 5. Success / Copied Case
    if (raw.startsWith('✨') || raw.startsWith('🚀') || raw.startsWith('🎉') || raw.includes('successfully') || raw.includes('copied to clipboard')) {
      const cleanMsg = raw.replace(/^[✨🚀🎉📋]\s*/, '');
      return {
        type: 'success',
        title: raw.includes('copied') ? 'Copied to Clipboard' : 'Success',
        message: cleanMsg,
        tag: 'Success'
      };
    }

    // Default general info
    return {
      type: 'info',
      title: 'Update',
      message: raw.replace(/^[📋ℹ️]\s*/, ''),
      tag: null
    };
  })();

  // Timer countdown with pause on hover
  useEffect(() => {
    if (!normalized || isPaused) return;

    const intervalMs = 50;
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, remainingTimeRef.current - elapsed);
      const pct = (remaining / duration) * 100;
      setProgress(pct);

      if (remaining <= 0) {
        clearInterval(interval);
        onClose();
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [normalized, isPaused, duration, onClose]);

  const handleMouseEnter = () => {
    setIsPaused(true);
    remainingTimeRef.current = Math.max(0, remainingTimeRef.current - (Date.now() - startTimeRef.current));
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
    startTimeRef.current = Date.now();
  };

  if (!normalized) return null;

  // Visual style tokens by toast type
  const config = (() => {
    switch (normalized.type) {
      case 'profile_locked':
        return {
          icon: FileText,
          iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/25',
          borderAccent: 'border-amber-500/40 hover:border-amber-400/60',
          topGlow: 'bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-transparent',
          tagClass: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
          progressBg: 'bg-gradient-to-r from-amber-500 to-orange-500',
          actionBtn: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-amber-600/30'
        };
      case 'plan_locked':
        return {
          icon: Lock,
          iconBg: 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-indigo-500/25',
          borderAccent: 'border-indigo-500/40 hover:border-indigo-400/60',
          topGlow: 'bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-transparent',
          tagClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
          progressBg: 'bg-gradient-to-r from-indigo-500 to-purple-500',
          actionBtn: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-indigo-600/30'
        };
      case 'review':
        return {
          icon: Clock,
          iconBg: 'bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-sky-500/25',
          borderAccent: 'border-sky-500/40',
          topGlow: 'bg-gradient-to-r from-sky-500/20 via-blue-500/20 to-transparent',
          tagClass: 'bg-sky-500/20 text-sky-300 border-sky-400/30',
          progressBg: 'bg-sky-500',
          actionBtn: 'bg-sky-600 hover:bg-sky-700 text-white'
        };
      case 'warning':
        return {
          icon: AlertCircle,
          iconBg: 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-rose-500/25',
          borderAccent: 'border-rose-500/40',
          topGlow: 'bg-gradient-to-r from-rose-500/20 via-red-500/20 to-transparent',
          tagClass: 'bg-rose-500/20 text-rose-300 border-rose-400/30',
          progressBg: 'bg-rose-500',
          actionBtn: 'bg-rose-600 hover:bg-rose-700 text-white'
        };
      case 'success':
        return {
          icon: CheckCircle2,
          iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/25',
          borderAccent: 'border-emerald-500/40',
          topGlow: 'bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-transparent',
          tagClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
          progressBg: 'bg-emerald-500',
          actionBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white'
        };
      default:
        return {
          icon: Sparkles,
          iconBg: 'bg-gradient-to-br from-slate-600 to-slate-800 text-white',
          borderAccent: 'border-slate-700',
          topGlow: 'bg-gradient-to-r from-slate-700/20 to-transparent',
          tagClass: 'bg-slate-800 text-slate-300 border-slate-700',
          progressBg: 'bg-indigo-500',
          actionBtn: 'bg-indigo-600 hover:bg-indigo-700 text-white'
        };
    }
  })();

  const Icon = config.icon;

  const handleActionClick = () => {
    if (normalized.onCustomAction) {
      normalized.onCustomAction();
    } else if (normalized.actionTab && onAction) {
      onAction(normalized.actionTab);
    }
    onClose();
  };

  return (
    <div
      role="alert"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`fixed top-5 right-5 z-[9999] w-[calc(100vw-2.5rem)] sm:w-[440px] max-w-[460px] bg-slate-900/95 backdrop-blur-md text-white rounded-2xl border ${config.borderAccent} shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-top-3 group`}
    >
      {/* Subtle top ambient glow */}
      <div className={`absolute top-0 left-0 right-0 h-10 ${config.topGlow} pointer-events-none opacity-80`} />

      <div className="relative p-4 sm:p-4.5 space-y-3">
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {/* Glowing Icon Badge */}
            <div className={`w-9 h-9 rounded-xl ${config.iconBg} shadow-md flex items-center justify-center shrink-0 mt-0.5 ring-2 ring-white/10`}>
              <Icon className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <h4 className="text-xs sm:text-sm font-black text-white tracking-tight truncate m-0">
                  {normalized.title}
                </h4>
                {normalized.tag && (
                  <span className={`text-[10px] font-extrabold px-2 py-0.2 rounded-full border ${config.tagClass} uppercase tracking-wider shrink-0`}>
                    {normalized.tag}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-medium m-0">
                {normalized.message}
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white flex items-center justify-center transition-colors border-none cursor-pointer shrink-0"
            title="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action Button Row if actionable */}
        {normalized.actionText && (
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors border-none bg-transparent cursor-pointer"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={handleActionClick}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm border-none cursor-pointer ${config.actionBtn}`}
            >
              <span>{normalized.actionText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Auto-dismiss progress countdown line */}
      <div className="w-full h-1 bg-white/10 overflow-hidden">
        <div
          className={`h-full ${config.progressBg} transition-all duration-75 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
