import React, { useState } from 'react';
import {
  Video, Copy, Check, ExternalLink, Loader2, Sparkles,
  AlertCircle, ShieldCheck, Calendar, Clock, User
} from 'lucide-react';
import { api } from '../../api';

/**
 * Official Google Meet SaaS Integration Card
 * - Recruiter view: "Create Google Meet" -> calls backend -> saves real Google URL -> "Join Interview"
 * - Candidate view: Shows scheduled round details -> "Join Interview" in new tab
 * - Zero embedding: Always executes window.open(meeting_url, '_blank', 'noopener,noreferrer')
 * - Prevents duplicate meetings
 */
export default function GoogleMeetCard({
  interview,
  user,
  onMeetingCreated,
  onToast,
  variant = 'standard' // 'standard', 'compact', 'candidate'
}) {
  const isStaff = user?.role === 'ADMIN' || user?.role === 'RECRUITER' || user?.role === 'HIRING_MANAGER';
  const meetingUrl = interview?.meeting_url || interview?.meet_url || '';
  const meetingCode = interview?.meeting_code || (meetingUrl ? meetingUrl.replace('https://meet.google.com/', '') : '');
  const hasExistingMeeting = Boolean(meetingUrl && meetingUrl.includes('meet.google.com') && !meetingUrl.includes('upt-'));

  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [manualLink, setManualLink] = useState('');
  const [savingManual, setSavingManual] = useState(false);

  const handleSaveManualLink = async (e) => {
    e?.preventDefault?.();
    const clean = manualLink.trim();
    if (!clean) return;
    if (!clean.includes('meet.google.com/')) {
      onToast?.('Please enter a valid Google Meet URL (e.g. https://meet.google.com/xxx-yyyy-zzz)');
      return;
    }
    setSavingManual(true);
    try {
      await api.updateInterview(interview.id, { meet_url: clean });
      onToast?.('Google Meet link saved successfully!');
      onMeetingCreated?.({
        meetingUrl: clean,
        meetingCode: clean.split('meet.google.com/')[-1] || '',
        provider: 'google_meet'
      });
      setErrorMessage(null);
      setManualLink('');
    } catch (err) {
      onToast?.(err.message || 'Failed to save meeting link');
    } finally {
      setSavingManual(false);
    }
  };

  // Trigger copy to clipboard with local feedback
  const handleCopyLink = (e) => {
    e?.stopPropagation?.();
    if (!meetingUrl) return;
    navigator.clipboard?.writeText(meetingUrl);
    setCopied(true);
    onToast?.('Meeting link copied to clipboard!');
    setTimeout(() => setCopied(false), 2200);
  };

  // Launch official Google Meet in a clean NEW browser tab
  const handleJoinInterview = (e) => {
    e?.stopPropagation?.();
    if (!meetingUrl) return;

    window.open(
      meetingUrl,
      '_blank',
      'noopener,noreferrer'
    );
  };

  // Create real Google Meet space via backend API
  const handleCreateGoogleMeet = async (e) => {
    e?.stopPropagation?.();
    if (loading || hasExistingMeeting) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      // 1. Check Google OAuth status first
      const status = await api.getGoogleOAuthStatus();

      if (!status.connected) {
        // Recruiter needs to authorize Google Account
        const authData = await api.getGoogleOAuthUrl();
        if (authData?.authorizationUrl) {
          // Open Google OAuth consent popup
          const width = 560;
          const height = 660;
          const left = window.screen.width / 2 - width / 2;
          const top = window.screen.height / 2 - height / 2;

          const popup = window.open(
            authData.authorizationUrl,
            'GoogleOAuthPopup',
            `width=${width},height=${height},top=${top},left=${left},status=no,toolbar=no,menubar=no`
          );

          // Listen for postMessage from popup callback
          const handleMessage = async (event) => {
            if (event.data?.type === 'GOOGLE_OAUTH_SUCCESS') {
              window.removeEventListener('message', handleMessage);
              onToast?.('Google Account connected! Generating real Google Meet space...');
              // Proceed with Meet space creation now that account is authorized
              try {
                const result = await api.createGoogleMeet(interview.id);
                if (result?.meeting) {
                  onMeetingCreated?.(result.meeting);
                  onToast?.('Google Meet space created successfully!');
                }
              } catch (err) {
                setErrorMessage(err.message || 'Failed to create Google Meet space.');
              } finally {
                setLoading(false);
              }
            }
          };

          window.addEventListener('message', handleMessage);
          return;
        }
      }

      // 2. Call backend endpoint to create real Google Meet space
      const result = await api.createGoogleMeet(interview.id);
      if (result?.meeting) {
        onMeetingCreated?.(result.meeting);
        onToast?.('Official Google Meet space created successfully!');
      }
    } catch (err) {
      console.error('Google Meet error:', err);
      const msg = err?.message || 'Could not create Google Meet space. Please verify Google Cloud permissions.';
      setErrorMessage(msg);
      onToast?.(msg);
    } finally {
      setLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // COMPACT BUTTON VARIANT (For Table rows or action bars)
  // ──────────────────────────────────────────────────────────────────────────
  if (variant === 'compact') {
    if (hasExistingMeeting) {
      return (
        <div className="inline-flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleJoinInterview}
            className="px-3 py-1.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-xs border-none"
            title="Open real Google Meet in a new browser tab"
          >
            <Video className="w-3.5 h-3.5 text-indigo-200" />
            <span>Join Interview</span>
            <ExternalLink className="w-3 h-3 text-indigo-300" />
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer bg-white"
            title="Copy Meeting Link"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      );
    }

    if (!isStaff) {
      return (
        <span className="text-[0.68rem] text-slate-400 font-medium italic">
          Link pending organizer
        </span>
      );
    }

    return (
      <button
        type="button"
        disabled={loading}
        onClick={handleCreateGoogleMeet}
        className="px-3 py-1.5 rounded-xl font-bold text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed"
        title="Provision real Google Meet room via Google API"
      >
        {loading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
            <span>Creating...</span>
          </>
        ) : (
          <>
            <Video className="w-3.5 h-3.5 text-indigo-600" />
            <span>Create Google Meet</span>
          </>
        )}
      </button>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CANDIDATE VIEW (Sleek, simple, compact single-row card)
  // ──────────────────────────────────────────────────────────────────────────
  if (variant === 'candidate') {
    return (
      <div className="w-full bg-slate-50/80 hover:bg-slate-50/95 border border-slate-200/90 rounded-xl p-3 sm:p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors shadow-2xs">
        {/* Left: Icon & Details */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Video className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-900">Google Meet Interview</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[0.62rem] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Confirmed
              </span>
              {meetingCode && (
                <span className="font-mono text-[0.68rem] text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200/80 select-all">
                  code: <strong className="text-indigo-600">{meetingCode}</strong>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[0.72rem] text-slate-500 mt-0.5 flex-wrap">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                {interview?.date || interview?.interview_date || 'Scheduled'}
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                {interview?.time || interview?.interview_time || '2:30 PM IST'}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 flex items-center gap-1 truncate max-w-[260px]" title={interview?.interviewer || interview?.interviewer_name || 'Hiring Lead'}>
                <User className="w-3 h-3 text-slate-400 shrink-0" />
                {interview?.interviewer || interview?.interviewer_name || 'Hiring Lead'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          {hasExistingMeeting ? (
            <>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/90 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                title="Copy Meeting URL"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={handleJoinInterview}
                className="px-3.5 py-1.5 rounded-lg bg-[#0a66c2] hover:bg-[#084e96] active:scale-[0.98] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs border-none cursor-pointer transition-all"
                title="Launch Google Meet in external tab"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Join Interview</span>
                <ExternalLink className="w-3 h-3 text-white/70" />
              </button>
            </>
          ) : (
            <span className="text-[0.7rem] text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-500" />
              <span>Link pending recruiter</span>
            </span>
          )}
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // STANDARD RECRUITER / STAFF CARD
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-slate-800 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
            <Video className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 m-0 flex items-center gap-2">
              <span>Google Meet</span>
              {hasExistingMeeting && (
                <span className="px-2 py-0.2 rounded-full text-[0.62rem] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Ready
                </span>
              )}
            </h4>
            <p className="text-xs text-slate-400 m-0">
              {hasExistingMeeting ? 'Meeting created successfully' : 'Provision official Google Meet space via Google API'}
            </p>
          </div>
        </div>

        <span className="text-[0.68rem] font-bold text-slate-400 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>OAuth 2.0</span>
        </span>
      </div>

      {/* Error / Setup Notice */}
      {errorMessage && (
        <div className={`p-4 rounded-2xl border text-xs space-y-3 animate-in fade-in ${
          errorMessage.includes('GOOGLE_CLIENT_ID')
            ? 'bg-amber-50/90 border-amber-200 text-slate-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-start gap-2.5">
            <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${errorMessage.includes('GOOGLE_CLIENT_ID') ? 'text-amber-600' : 'text-rose-600'}`} />
            <div className="flex-1 min-w-0">
              <strong className={`block font-bold ${errorMessage.includes('GOOGLE_CLIENT_ID') ? 'text-amber-950' : 'text-rose-900'}`}>
                {errorMessage.includes('GOOGLE_CLIENT_ID') ? 'Google Cloud Credentials Setup Required:' : 'Google Meet Notice:'}
              </strong>
              <p className={`m-0 mt-0.5 leading-relaxed text-[0.72rem] ${errorMessage.includes('GOOGLE_CLIENT_ID') ? 'text-amber-800' : 'text-rose-700'}`}>
                {errorMessage}
              </p>
            </div>
          </div>

          {errorMessage.includes('GOOGLE_CLIENT_ID') && (
            <div className="space-y-2.5 pt-1 border-t border-amber-200/70">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowGuide(!showGuide)}
                  className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[0.7rem] border border-amber-300/80 cursor-pointer transition-colors"
                >
                  {showGuide ? 'Hide Setup Steps' : 'View Quick 3-Step Setup Guide'}
                </button>
                <span className="text-[0.68rem] text-amber-700">or attach a real meeting link directly below</span>
              </div>

              {showGuide && (
                <div className="bg-white p-3.5 rounded-xl border border-amber-200 space-y-2 text-[0.72rem] text-slate-700 leading-relaxed font-sans shadow-xs">
                  <div className="font-bold text-slate-900">How to get credentials from Google Cloud Console:</div>
                  <ol className="list-decimal pl-4 space-y-1.5 m-0 text-slate-600">
                    <li>
                      Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-indigo-600 font-bold underline">Google Cloud Console</a> and enable <strong>Google Meet API</strong> in APIs & Services &gt; Library.
                    </li>
                    <li>
                      In <strong>APIs & Services &gt; Credentials &gt; Create Credentials &gt; OAuth client ID</strong> (Web app):
                      <br />• Set Authorized redirect URI to: <code className="bg-slate-100 px-1 py-0.2 rounded font-mono text-indigo-700 select-all">http://localhost:8000/api/auth/google/callback</code>
                    </li>
                    <li>
                      Paste the Client ID & Client Secret into <code className="bg-slate-100 px-1 py-0.2 rounded font-mono">backend/.env</code>:
                      <div className="bg-slate-950 text-slate-100 font-mono text-[0.68rem] p-2.5 rounded-lg mt-1 select-all">
                        GOOGLE_CLIENT_ID="your_client_id.apps.googleusercontent.com"<br />
                        GOOGLE_CLIENT_SECRET="your_client_secret"
                      </div>
                    </li>
                  </ol>
                </div>
              )}

              {/* Quick Manual Meeting URL Input */}
              <form onSubmit={handleSaveManualLink} className="pt-1 flex items-center gap-2">
                <input
                  type="url"
                  placeholder="Paste real Google Meet link (e.g. https://meet.google.com/xxx-yyyy-zzz)"
                  value={manualLink}
                  onChange={(e) => setManualLink(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-amber-300 bg-white text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:border-indigo-600 outline-none"
                />
                <button
                  type="submit"
                  disabled={savingManual || !manualLink.trim()}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs border-none cursor-pointer transition-colors disabled:opacity-50 shrink-0"
                >
                  {savingManual ? 'Saving...' : 'Attach Link'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* State A: Meeting Already Created */}
      {hasExistingMeeting ? (
        <div className="space-y-3.5 pt-1">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between flex-wrap gap-2">
            <div className="min-w-0">
              <span className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider block">
                Google Meet URL
              </span>
              <span className="font-mono text-xs font-black text-indigo-700 truncate block mt-0.5">
                {meetingUrl}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                title="Copy real Google Meet URL"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copied ? 'Copied' : 'Copy Link'}</span>
              </button>

              <button
                type="button"
                onClick={handleJoinInterview}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs border-none cursor-pointer transition-all"
                title="Open Google Meet in a new browser tab"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Join Interview</span>
                <ExternalLink className="w-3 h-3 text-indigo-200" />
              </button>
            </div>
          </div>

          <p className="text-[0.68rem] text-slate-400 m-0 flex items-center gap-1">
            <span>• Opens outside Uptrix in a clean external Google Meet browser tab.</span>
          </p>
        </div>
      ) : (
        /* State B: Meeting Not Created Yet */
        <div className="space-y-3 pt-1">
          <p className="text-xs text-slate-500 m-0 leading-relaxed">
            Click below to authorize and create an official Google Meet space for this interview round. A real Google URL will be provisioned and shared with both the candidate and recruiter.
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={handleCreateGoogleMeet}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-xs border-none cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Creating Meeting...</span>
                </>
              ) : (
                <>
                  <Video className="w-4 h-4 text-indigo-200" />
                  <span>Create Google Meet</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
