import React, { useState } from 'react';
import {
  HelpCircle, ShieldCheck, Mail, Phone, Clock,
  CheckCircle2, Copy, Check, Sparkles, MessageSquare,
  ArrowUpRight, HeartHandshake
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function SupportDeskView() {
  const { user } = useAuth();
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = (email) => {
    navigator.clipboard?.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  return (
    <div
      className="p-4 sm:p-7 max-w-4xl mx-auto space-y-6 bg-[#F7F8FB] min-h-full antialiased text-slate-800 select-text"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
    >
      {/* ── Top Header ── */}
      <div className="pb-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200/60 text-[#FF7043] flex items-center justify-center font-bold shadow-2xs">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-[26px] font-semibold text-slate-900 leading-tight tracking-tight m-0">
                Uptrix Support & Concierge Desk
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Concierge Online
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 m-0">
              Direct assistance, account support, and enterprise SLA guarantee for all Uptrix members.
            </p>
          </div>
        </div>
      </div>

      {/* ── 1. Uptrix Help Guarantee ── */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3 text-emerald-600" /> Uptrix Help Guarantee
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 m-0">
                100% Dedicated Concierge & Resolution Guarantee
              </h2>
              <p className="text-xs text-slate-500 mt-1 m-0 leading-relaxed max-w-xl">
                Every inquiry received during operational business hours is handled directly by a dedicated concierge engineer with a guaranteed initial response.
              </p>
            </div>
          </div>
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Response SLA
            </span>
            <div className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
              <span>&lt; 2 Hours</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-[11px] text-slate-500 m-0">Priority inquiry turnaround</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Satisfaction Rate
            </span>
            <div className="text-lg font-bold text-emerald-700 flex items-center gap-1.5">
              <span>99.4% CSAT</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-[11px] text-slate-500 m-0">Verified member feedback</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Operating Hours
            </span>
            <div className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
              <span>Mon – Sat</span>
              <HeartHandshake className="w-4 h-4 text-[#FF7043]" />
            </div>
            <p className="text-[11px] text-slate-500 m-0">9:00 AM – 8:00 PM IST</p>
          </div>
        </div>
      </div>

      {/* ── 2. Help Contact & Email Channels ── */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 m-0">
          <Mail className="w-3.5 h-3.5 text-[#FF7043]" /> Direct Help Contacts
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Official Support Email */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.02)] space-y-3 flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200/60 text-[#FF7043] flex items-center justify-center font-bold">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">General Support</span>
                <h4 className="text-base font-bold text-slate-900 mt-0.5 m-0">support@uptrix.in</h4>
                <p className="text-xs text-slate-500 mt-1 m-0 leading-relaxed">
                  For profile assistance, KYC verification, application questions, or general platform help.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <a
                href="mailto:support@uptrix.in?subject=Help%20Request%20-%20Uptrix%20Portal"
                className="px-3.5 py-2 bg-[#FF7043] hover:bg-[#E65B30] text-white text-xs font-semibold rounded-xl transition-all shadow-[0_1px_2px_rgba(255,112,67,0.3)] inline-flex items-center gap-1.5 no-underline cursor-pointer"
              >
                <span>Email Support</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => handleCopyEmail('support@uptrix.in')}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors border border-slate-200 inline-flex items-center gap-1.5 cursor-pointer"
              >
                {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copiedEmail ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Priority Escalations Desk */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.02)] space-y-3 flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Priority Escalations</span>
                <h4 className="text-base font-bold text-slate-900 mt-0.5 m-0">escalations@uptrix.in</h4>
                <p className="text-xs text-slate-500 mt-1 m-0 leading-relaxed">
                  For urgent requisition reviews, compliance flags, or enterprise hiring escalations.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <a
                href="mailto:escalations@uptrix.in?subject=Priority%20Escalation%20-%20Uptrix%20Portal"
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5 no-underline cursor-pointer"
              >
                <span>Contact Escalations</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => handleCopyEmail('escalations@uptrix.in')}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors border border-slate-200 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy</span>
              </button>
            </div>
          </div>

          {/* WhatsApp & Phone Concierge */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.02)] space-y-3 flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-600 flex items-center justify-center font-bold">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">WhatsApp & Chat</span>
                <h4 className="text-base font-bold text-slate-900 mt-0.5 m-0">+91 98765 43210</h4>
                <p className="text-xs text-slate-500 mt-1 m-0 leading-relaxed">
                  Chat directly with our verified concierge team for instant answers during office hours.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <a
                href="https://wa.me/919876543210?text=Hello%20Uptrix%20Support,%20I%20need%20help%20with%20my%20portal%20account."
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5 no-underline cursor-pointer"
              >
                <span>WhatsApp Concierge</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Phone Call Support */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.02)] space-y-3 flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200/60 text-sky-600 flex items-center justify-center font-bold">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Direct Call Support</span>
                <h4 className="text-base font-bold text-slate-900 mt-0.5 m-0">+91 98765 43210</h4>
                <p className="text-xs text-slate-500 mt-1 m-0 leading-relaxed">
                  Speak directly with an enterprise support representative (Monday to Saturday, 9am - 8pm).
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <a
                href="tel:+919876543210"
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors border border-slate-200 inline-flex items-center gap-1.5 no-underline cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5 text-slate-600" />
                <span>Call Concierge</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer Reassurance ── */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Logged in as: <strong className="text-slate-800 font-semibold">{user?.email || 'Authenticated User'}</strong> ({user?.role || 'Member'})
          </span>
        </div>
        <span className="text-slate-400 text-[11px]">
          Uptrix Concierge Desk · ISO 27001 Certified Security
        </span>
      </div>
    </div>
  );
}
