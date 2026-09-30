import React, { useState } from 'react';
import {
  X, Copy, Check, Share2, MessageCircle, Linkedin, Twitter, Send, Mail, Building2, MapPin, Briefcase, ExternalLink
} from 'lucide-react';
import { getJobShareCode } from '../utils/jobHash';

export default function ShareJobModal({ job, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!job) return null;

  const companyName = job.company?.company_name || job.company || 'Hiring Organization';
  const jobTitle = job.title || 'Career Opportunity';
  const location = job.location || 'Remote';
  const workMode = job.work_mode || 'Flexible';

  // Canonical shareable URL with unguessable short code (prevents IDOR and enumeration)
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://portal.intentpeople.com';
  const shareCode = getJobShareCode(job) || job.id;
  const shareUrl = `${baseUrl}/jobs/${shareCode}`;

  const shareText = `🚀 We're hiring: ${jobTitle} at ${companyName} (${location} • ${workMode})!\n\nView details & apply online here:\n${shareUrl}`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy share link', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${jobTitle} at ${companyName}`,
          text: `Check out this opening for ${jobTitle} at ${companyName}!`,
          url: shareUrl
        });
      } catch (e) {
        // User cancelled or unsupported
      }
    } else {
      handleCopyLink();
    }
  };

  const socialLinks = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      bg: 'hover:bg-[#25D366]/10 hover:text-[#25D366] hover:border-[#25D366]/30',
      iconColor: 'text-[#25D366]',
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      bg: 'hover:bg-[#0A66C2]/10 hover:text-[#0A66C2] hover:border-[#0A66C2]/30',
      iconColor: 'text-[#0A66C2]',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    },
    {
      name: 'X (Twitter)',
      icon: Twitter,
      bg: 'hover:bg-slate-900/10 hover:text-slate-900 hover:border-slate-900/30',
      iconColor: 'text-slate-900',
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`We're hiring: ${jobTitle} at ${companyName}! Apply here:`)}&hashtags=Hiring,JobOpening,Careers`
    },
    {
      name: 'Telegram',
      icon: Send,
      bg: 'hover:bg-[#24A1DE]/10 hover:text-[#24A1DE] hover:border-[#24A1DE]/30',
      iconColor: 'text-[#24A1DE]',
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Check out this role: ${jobTitle} at ${companyName}`)}`
    },
    {
      name: 'Email',
      icon: Mail,
      bg: 'hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200',
      iconColor: 'text-rose-600',
      url: `mailto:?subject=${encodeURIComponent(`Job Opening: ${jobTitle} at ${companyName}`)}&body=${encodeURIComponent(`Hi,\n\nI thought you might be interested in this job opening:\n\n${jobTitle} at ${companyName}\nLocation: ${location} (${workMode})\n\nView details & apply here:\n${shareUrl}\n\nBest regards,`)}`
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/80">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-snug">
                Share Job Opportunity
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Share with candidates or on social networks
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Job Card Snippet Preview */}
        <div className="p-5 space-y-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200/80">
            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">
              Active Opening #{job.id}
            </div>
            <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
              {jobTitle}
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-600 mt-1 flex-wrap">
              <span className="flex items-center gap-1 font-semibold text-slate-800">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {companyName}
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1 text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {location}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-medium">{workMode}</span>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 text-[11px]">
              Share on Social Channels
            </label>
            <div className="grid grid-cols-5 gap-2">
              {socialLinks.map((item) => {
                const IconComponent = item.icon;
                return (
                  <a
                    key={item.name}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border border-slate-200/80 bg-white transition-all group ${item.bg} text-slate-600`}
                    title={`Share on ${item.name}`}
                  >
                    <IconComponent className={`w-5 h-5 mb-1 ${item.iconColor} group-hover:scale-110 transition-transform`} />
                    <span className="text-[10px] font-semibold truncate max-w-full">
                      {item.name.split(' ')[0]}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Native Web Share API if supported */}
          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer border-none"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
              <span>Share via device applications...</span>
            </button>
          )}

          {/* Copy Direct Link */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 text-[11px]">
              Direct Share Link
            </label>
            <div className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 bg-slate-50 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full bg-transparent px-2.5 text-xs text-slate-700 outline-none select-all font-mono"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer border-none ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs active:scale-95'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Anyone with this link can view the role details and click <span className="font-semibold text-slate-600">Apply</span> to sign in or create an account.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition-colors border-none bg-transparent cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
