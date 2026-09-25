import React, { useState, useEffect } from 'react';
import {
  Briefcase, Building2, MapPin, Clock, CheckCircle2, ChevronRight,
  ArrowUpRight, Search, Filter, AlertCircle, XCircle, Calendar,
  Sparkles, Send, Eye, RefreshCw, X, ShieldCheck, FileText,
  Check, DollarSign, ExternalLink, Award, ArrowRight, Video,
  LayoutList, LayoutGrid, Star, MessageSquare, TrendingUp
} from 'lucide-react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import GoogleMeetCard from '../../components/interview/GoogleMeetCard';

const STAGES = [
  { key: 'APPLIED', label: 'Applied', desc: 'Application received' },
  { key: 'UNDER_REVIEW', label: 'Under Review', desc: 'Profile screening' },
  { key: 'SHORTLISTED', label: 'Shortlisted', desc: 'Passed screening' },
  { key: 'INTERVIEW_SCHEDULED', label: 'Interview', desc: 'Interview round' },
  { key: 'SELECTED', label: 'Selected', desc: 'Offer extended' }
];

const getFeedbackForApp = (app, user) => {
  if (!app) return null;
  // 1. Read from localStorage
  let localData = null;
  try {
    const raw = localStorage.getItem('uptrix_candidate_feedbacks');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed[app.id]) {
        localData = parsed[app.id];
      } else {
        const userName = user?.name || user?.full_name || '';
        const found = Object.values(parsed).find(f =>
          f.candidateName && userName && f.candidateName.toLowerCase() === userName.toLowerCase()
        );
        if (found) localData = found;
      }
    }
  } catch { }

  // 2. Parse from app.interview?.notes
  const ivNotes = app.interview?.notes || '';
  let parsedRec = null;
  let parsedTech = null;
  let parsedComm = null;
  let notesBody = ivNotes;
  let parsedRound = app.interview?.round;
  let parsedSubject = null;

  if (ivNotes) {
    if (ivNotes.includes('Strong Hire / Offer')) parsedRec = 'HIRE';
    else if (ivNotes.includes('Do Not Hire')) parsedRec = 'PASS';
    else if (ivNotes.includes('Next Round')) parsedRec = 'ADVANCE';

    const techMatch = ivNotes.match(/Tech:\s*(\d+)\/5/);
    if (techMatch) parsedTech = parseInt(techMatch[1], 10);

    const commMatch = ivNotes.match(/Comm:\s*(\d+)\/5/);
    if (commMatch) parsedComm = parseInt(commMatch[1], 10);

    const subjectMatch = ivNotes.match(/Next Round:\s*([^|]+)\s*-\s*([^|]+)/);
    if (subjectMatch) {
      parsedSubject = subjectMatch[2]?.trim();
    }

    const bracketEnd = ivNotes.indexOf(']');
    if (bracketEnd !== -1) {
      notesBody = ivNotes.substring(bracketEnd + 1).trim();
    }
  }

  const recommendation = localData?.recommendation || parsedRec || (
    app.status === 'SELECTED' ? 'HIRE' : app.status === 'REJECTED' ? 'PASS' : null
  );

  if (!recommendation && !notesBody && app.status !== 'SELECTED' && app.status !== 'REJECTED') {
    return null;
  }

  const notes = localData?.notes || notesBody || (
    recommendation === 'HIRE' || app.status === 'SELECTED'
      ? 'Congratulations! After reviewing your interview performance and technical scorecard, our hiring team was thoroughly impressed with your problem-solving depth and cultural alignment. We are thrilled to extend this formal offer!'
      : recommendation === 'PASS' || app.status === 'REJECTED'
      ? 'Thank you for taking the time to interview with our team. While we appreciated your experience and discussion, we have decided to proceed with other candidates whose profiles more closely align with our current role requirements.'
      : 'Evaluation completed.'
  );

  return {
    recommendation,
    notes,
    roundLevel: localData?.roundLevel || parsedRound || 'Technical Interview Round',
    subject: localData?.subject || parsedSubject,
    interviewer: localData?.interviewer || app.interview?.interviewer_name || 'Hiring Lead',
    submittedAt: localData?.submittedAt
  };
};

function CandidateFeedbackMessageCard({ feedback, appStatus }) {
  if (!feedback) return null;
  const isHire = feedback.recommendation === 'HIRE' || appStatus === 'SELECTED';
  const isPass = feedback.recommendation === 'PASS' || appStatus === 'REJECTED';
  const isAdvance = feedback.recommendation === 'ADVANCE';

  if (isHire) {
    return (
      <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-emerald-50 via-teal-50/40 to-emerald-100/40 border border-emerald-300/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-3 animate-in fade-in">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-2xs shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Hiring Decision
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-950 border border-emerald-300">
                  Strong Hire / Offer
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-bold text-emerald-950 mt-0.5">
                🎉 Congratulations! Offer Extended
              </h4>
            </div>
          </div>
        </div>

        {/* Evaluation Feedback & Summary Notes */}
        <div>
          <span className="text-[11px] font-semibold text-emerald-900 uppercase tracking-wider block mb-1">
            Hiring Team Evaluation & Feedback
          </span>
          <div className="p-3.5 rounded-xl bg-white/95 border border-emerald-200 text-xs text-emerald-950 leading-relaxed font-medium shadow-2xs">
            {feedback.notes}
          </div>
        </div>

        <div className="text-[11px] text-emerald-800 flex items-center gap-1.5 pt-0.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Our HR & Talent Operations team will reach out with your formal compensation breakdown and joining documentation.</span>
        </div>
      </div>
    );
  }

  if (isPass) {
    return (
      <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-rose-50/90 via-slate-50 to-rose-100/40 border border-rose-200/90 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-3 animate-in fade-in">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-2xs shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">
                  Hiring Decision
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-200">
                  Do Not Hire · Application Concluded
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                Interview Outcome & Evaluation Feedback
              </h4>
            </div>
          </div>
        </div>

        {/* Evaluation Feedback & Summary Notes */}
        <div>
          <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">
            Interviewer Feedback & Summary Notes
          </span>
          <div className="p-3.5 rounded-xl bg-white/95 border border-rose-200/80 text-xs text-slate-800 leading-relaxed font-medium shadow-2xs">
            {feedback.notes}
          </div>
        </div>

        <p className="text-[11px] text-slate-500 m-0 leading-relaxed">
          We genuinely appreciate the effort and time you invested in interviewing with our team. We wish you continued success in your career journey and invite you to explore future roles on our platform.
        </p>
      </div>
    );
  }

  if (isAdvance) {
    return (
      <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-amber-50 via-orange-50/40 to-amber-100/40 border border-amber-300/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-3 animate-in fade-in">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FF7043] text-white flex items-center justify-center shadow-2xs shrink-0">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                  Interview Progression
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-950 border border-amber-300">
                  Next Round
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-bold text-amber-950 mt-0.5">
                🚀 Advanced to Next Round!
              </h4>
            </div>
          </div>
        </div>

        {/* Next Round Setup */}
        <div className="p-3 rounded-xl bg-white/90 border border-amber-200 text-xs space-y-1">
          {feedback.roundLevel && (
            <div className="font-bold text-slate-800">
              Round: <span className="text-amber-800">{feedback.roundLevel}</span>
            </div>
          )}
          {feedback.subject && (
            <div className="font-medium text-slate-600">
              Focus Topic: <span className="text-slate-900 font-bold">{feedback.subject}</span>
            </div>
          )}
        </div>

        {/* Feedback & Notes */}
        {feedback.notes && (
          <div>
            <span className="text-[11px] font-semibold text-amber-900 uppercase tracking-wider block mb-1">
              Interviewer Feedback & Next Round Objectives
            </span>
            <div className="p-3.5 rounded-xl bg-white/95 border border-amber-200 text-xs text-slate-800 leading-relaxed font-medium shadow-2xs">
              {feedback.notes}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default function MyApplications({ setActiveTab, setSelectedJobId }) {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const [hoveredAppId, setHoveredAppId] = useState(null);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [viewingApp, setViewingApp] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [, setFeedbackVersion] = useState(0);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    loadApplications();
    const handleUpdate = () => {
      setFeedbackVersion(v => v + 1);
      loadApplications();
    };
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('uptrix_feedback_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('uptrix_feedback_updated', handleUpdate);
    };
  }, []);

  const loadApplications = async () => {
    try {
      setRefreshing(true);
      const list = await api.getMyApplications();
      setApplications(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('Could not load applications:', err);
      setApplications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStageIndex = (status) => {
    if (status === 'REJECTED') return -1;
    const idx = STAGES.findIndex(s => s.key === status);
    return idx !== -1 ? idx : 0;
  };

  // Counts for Stats
  const totalCount = applications.length;
  const inReviewCount = applications.filter(a => a.status === 'UNDER_REVIEW' || a.status === 'APPLIED').length;
  const interviewCount = applications.filter(a => a.status === 'INTERVIEW_SCHEDULED').length;
  const selectedCount = applications.filter(a => a.status === 'SELECTED').length;
  const rejectedCount = applications.filter(a => a.status === 'REJECTED').length;
  const shortlistedCount = applications.filter(a => a.status === 'SHORTLISTED').length;

  // Filtering
  const filteredApplications = applications.filter(app => {
    const job = app.job || {};
    const title = (job.title || '').toLowerCase();
    const company = (job.company_name || '').toLowerCase();
    const location = (job.location || '').toLowerCase();
    const q = searchTerm.toLowerCase();

    const matchesSearch = !q || title.includes(q) || company.includes(q) || location.includes(q);
    if (!matchesSearch) return false;

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'IN_REVIEW') return app.status === 'UNDER_REVIEW' || app.status === 'APPLIED';
    if (statusFilter === 'SHORTLISTED') return app.status === 'SHORTLISTED';
    if (statusFilter === 'INTERVIEW_SCHEDULED') return app.status === 'INTERVIEW_SCHEDULED';
    if (statusFilter === 'SELECTED') return app.status === 'SELECTED';
    if (statusFilter === 'REJECTED') return app.status === 'REJECTED';

    return true;
  }).sort((a, b) => {
    if (sortBy === 'newest') return (b.id || 0) - (a.id || 0);
    if (sortBy === 'oldest') return (a.id || 0) - (b.id || 0);
    if (sortBy === 'company') {
      const compA = a.job?.company_name || '';
      const compB = b.job?.company_name || '';
      return compA.localeCompare(compB);
    }
    return 0;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SELECTED':
        return {
          style: 'bg-emerald-50 text-emerald-700 border-emerald-300/80',
          label: 'Selected / Offer',
          icon: Sparkles
        };
      case 'INTERVIEW_SCHEDULED':
        return {
          style: 'bg-[#5C59E8]/10 text-[#5C59E8] border-[#5C59E8]/30',
          label: 'Interview Scheduled',
          icon: Calendar
        };
      case 'SHORTLISTED':
        return {
          style: 'bg-sky-50 text-sky-700 border-sky-300/80',
          label: 'Shortlisted',
          icon: Award
        };
      case 'UNDER_REVIEW':
        return {
          style: 'bg-amber-50 text-amber-700 border-amber-300/80',
          label: 'Under Review',
          icon: Clock
        };
      case 'REJECTED':
        return {
          style: 'bg-rose-50 text-rose-700 border-rose-300/80',
          label: 'Not Selected',
          icon: XCircle
        };
      case 'APPLIED':
      default:
        return {
          style: 'bg-slate-100 text-slate-700 border-slate-200',
          label: 'Applied',
          icon: Send
        };
    }
  };

  const filterTabs = [
    { id: 'ALL', label: 'All Applications', count: totalCount },
    { id: 'IN_REVIEW', label: 'In Review', count: inReviewCount },
    { id: 'SHORTLISTED', label: 'Shortlisted', count: shortlistedCount },
    { id: 'INTERVIEW_SCHEDULED', label: 'Interviews', count: interviewCount },
    { id: 'SELECTED', label: 'Selected', count: selectedCount },
    { id: 'REJECTED', label: 'Not Selected', count: rejectedCount },
  ];

  return (
    <div
      className="p-4 sm:p-7 max-w-7xl mx-auto space-y-6 bg-[#F7F8FB] min-h-full antialiased text-slate-800 select-text relative"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
    >
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-in slide-in-from-bottom-2">
          <Sparkles className="w-3.5 h-3.5 text-[#FF7043]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-[28px] font-semibold text-slate-900 leading-tight tracking-tight m-0">
              My Applications
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" /> Live ATS Pipeline
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1.5 m-0">
            Live status tracker for all roles you applied to across verified recruiters and growth teams.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadApplications}
            disabled={refreshing}
            title="Refresh applications"
            className="p-2.5 rounded-xl border border-slate-200/80 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#FF7043]' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setActiveTab?.('job_search')}
            className="px-4 py-2.5 rounded-lg bg-[#FF7043] hover:bg-[#E65B30] text-white text-xs font-semibold shadow-[0_1px_2px_rgba(255,112,67,0.3)] transition-colors flex items-center gap-1.5 cursor-pointer border-none"
          >
            <Search className="w-4 h-4" /> Explore Jobs
          </button>
        </div>
      </div>

      {/* ── 4 Funnel KPI Cards (Compact) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Total Applied */}
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`bg-white rounded-xl border px-3.5 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.02)] cursor-pointer transition-all hover:border-slate-300 flex items-center justify-between gap-2 ${
            statusFilter === 'ALL' ? 'border-[#FF7043] ring-1 ring-[#FF7043]/30 bg-orange-50/15' : 'border-slate-200/80 hover:bg-slate-50/50'
          }`}
        >
          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-[#FF7043] uppercase tracking-wider block truncate">
              Total Submissions
            </span>
            <div className="text-sm sm:text-base font-bold text-slate-900 leading-tight mt-0.5">
              {totalCount} <span className="text-xs font-semibold text-slate-500">Applications</span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-[#FF7043]/10 text-[#FF7043] flex items-center justify-center shrink-0">
            <Briefcase className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* In Review */}
        <div
          onClick={() => setStatusFilter('IN_REVIEW')}
          className={`bg-white rounded-xl border px-3.5 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.02)] cursor-pointer transition-all hover:border-slate-300 flex items-center justify-between gap-2 ${
            statusFilter === 'IN_REVIEW' ? 'border-amber-400 ring-1 ring-amber-400/30 bg-amber-50/15' : 'border-slate-200/80 hover:bg-slate-50/50'
          }`}
        >
          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider block truncate">
              Screening & Review
            </span>
            <div className="text-sm sm:text-base font-bold text-slate-900 leading-tight mt-0.5">
              {inReviewCount} <span className="text-xs font-semibold text-slate-500">In Review</span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Interviews */}
        <div
          onClick={() => setStatusFilter('INTERVIEW_SCHEDULED')}
          className={`bg-white rounded-xl border px-3.5 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.02)] cursor-pointer transition-all hover:border-slate-300 flex items-center justify-between gap-2 ${
            statusFilter === 'INTERVIEW_SCHEDULED' ? 'border-[#5C59E8] ring-1 ring-[#5C59E8]/30 bg-[#5C59E8]/5' : 'border-slate-200/80 hover:bg-slate-50/50'
          }`}
        >
          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-[#5C59E8] uppercase tracking-wider block truncate">
              Live Interviews
            </span>
            <div className="text-sm sm:text-base font-bold text-slate-900 leading-tight mt-0.5">
              {interviewCount} <span className="text-xs font-semibold text-slate-500">Scheduled</span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-[#5C59E8]/10 text-[#5C59E8] flex items-center justify-center shrink-0">
            <Calendar className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Offers Extended */}
        <div
          onClick={() => setStatusFilter('SELECTED')}
          className={`bg-white rounded-xl border px-3.5 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.02)] cursor-pointer transition-all hover:border-slate-300 flex items-center justify-between gap-2 ${
            statusFilter === 'SELECTED' ? 'border-emerald-400 ring-1 ring-emerald-400/30 bg-emerald-50/15' : 'border-slate-200/80 hover:bg-slate-50/50'
          }`}
        >
          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider block truncate">
              Offers & Placements
            </span>
            <div className="text-sm sm:text-base font-bold text-slate-900 leading-tight mt-0.5">
              {selectedCount} <span className="text-xs font-semibold text-slate-500">Selected</span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* ── Search Toolbar & Filter Pills ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              className="w-full pl-10 pr-8 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200/90 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400 shadow-[0_1px_2px_rgba(15,23,42,0.02)]"
              placeholder="Search applications by role title, company, or location..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* View Mode Toggle & Sort */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center flex-wrap">
            {/* View Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border-none ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 bg-transparent'
                }`}
                title="Table view with live hover preview"
              >
                <LayoutList size={13} />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border-none ${
                  viewMode === 'cards'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 bg-transparent'
                }`}
                title="Card view"
              >
                <LayoutGrid size={13} />
                <span className="hidden sm:inline">Cards</span>
              </button>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer hover:border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            >
              <option value="newest">Newest Applied</option>
              <option value="oldest">Oldest First</option>
              <option value="company">Company Name</option>
            </select>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 border-t border-slate-100">
          {filterTabs.map(tab => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border-none cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-[#FF7043] text-white shadow-[0_1px_2px_rgba(255,112,67,0.25)] font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── 2. Applications Content ─── */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)] space-y-3">
          <div className="w-8 h-8 border-2 border-[#FF7043] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Loading your candidate submissions...</p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)] space-y-3.5 max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF7043] flex items-center justify-center mx-auto">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {searchTerm || statusFilter !== 'ALL' ? 'No matching applications found' : 'No Submitted Applications Yet'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
              {searchTerm || statusFilter !== 'ALL'
                ? 'Try resetting your search filters to view your submitted positions.'
                : 'Browse active marketing roles, submit applications, and track recruiter updates in real-time.'}
            </p>
          </div>

          <div className="pt-2">
            {searchTerm || statusFilter !== 'ALL' ? (
              <button
                type="button"
                onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border-none cursor-pointer"
              >
                Reset Filters
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab?.('job_search')}
                className="px-5 py-2.5 rounded-xl bg-[#FF7043] hover:bg-[#E65B30] text-white text-xs font-semibold transition-all border-none cursor-pointer shadow-[0_1px_2px_rgba(255,112,67,0.3)]"
              >
                Browse Open Jobs
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'table' ? (
        (() => {
          const activeApp = filteredApplications.find(a => a.id === (hoveredAppId || selectedAppId)) || filteredApplications[0];
          const activeStageIdx = activeApp ? getStageIndex(activeApp.status) : 0;
          const activeBadge = activeApp ? getStatusBadge(activeApp.status) : null;
          const ActiveBadgeIcon = activeBadge ? activeBadge.icon : Sparkles;
          const activeFeedback = getFeedbackForApp(activeApp, user);
          const activeSalary = activeApp && activeApp.job?.salary_min && activeApp.job?.salary_max
            ? `$${activeApp.job.salary_min.toLocaleString()} - $${activeApp.job.salary_max.toLocaleString()}/yr`
            : activeApp && activeApp.job?.salary_min
              ? `From $${activeApp.job.salary_min.toLocaleString()}/yr`
              : null;

          return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: SaaS Applications Table */}
              <div className="lg:col-span-7 space-y-2">
                <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          <th className="py-3 px-4">Role & Company</th>
                          <th className="py-3 px-3">Stage</th>
                          <th className="py-3 px-3">Meeting</th>
                          <th className="py-3 px-3">Applied</th>
                          <th className="py-3 px-3 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {filteredApplications.map((app) => {
                          const j = app.job || {};
                          const badge = getStatusBadge(app.status);
                          const BadgeIcon = badge.icon;
                          const isSelected = activeApp?.id === app.id;
                          const isInterview = app.status === 'INTERVIEW_SCHEDULED';

                          return (
                            <tr
                              key={app.id}
                              onMouseEnter={() => setHoveredAppId(app.id)}
                              onClick={() => setSelectedAppId(selectedAppId === app.id ? null : app.id)}
                              className={`transition-all cursor-pointer group ${
                                isSelected
                                  ? 'bg-orange-50/40 border-l-4 border-l-[#FF7043]'
                                  : 'hover:bg-slate-50/80 border-l-4 border-l-transparent'
                              }`}
                            >
                              {/* Role & Company */}
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-800 font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                    {(j.company_name || 'U').charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-bold text-slate-900 group-hover:text-[#FF7043] transition-colors truncate max-w-[200px] sm:max-w-[240px]">
                                      {j.title || 'Marketing Role'}
                                    </div>
                                    <div className="text-[11px] text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                                      <span className="font-semibold text-slate-600 truncate">{j.company_name}</span>
                                      <span>•</span>
                                      <span className="truncate">{j.location || 'Remote'}</span>
                                    </div>
                                    {app.fit_score != null && (
                                      <div className="mt-1">
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/70">
                                          <Sparkles className="w-2.5 h-2.5 text-purple-600" />
                                          <span>{Math.round(app.fit_score)}% Match</span>
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Stage */}
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shadow-2xs ${badge.style}`}
                                >
                                  <BadgeIcon size={11} />
                                  {badge.label}
                                </span>
                              </td>

                              {/* Meeting / Next Step */}
                              <td className="py-3 px-3 whitespace-nowrap">
                                {app.status === 'SELECTED' || getFeedbackForApp(app, user)?.recommendation === 'HIRE' ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                                    <Award size={11} className="text-emerald-600" />
                                    <span>Offer Extended</span>
                                  </span>
                                ) : app.status === 'REJECTED' || getFeedbackForApp(app, user)?.recommendation === 'PASS' ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                                    <XCircle size={11} className="text-rose-600" />
                                    <span>Feedback Ready</span>
                                  </span>
                                ) : isInterview ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#5C59E8]/10 text-[#5C59E8] border border-[#5C59E8]/30 shadow-2xs">
                                    <Video size={11} className="text-[#5C59E8] animate-pulse" />
                                    <span>Google Meet</span>
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-400 font-medium">
                                    In Review
                                  </span>
                                )}
                              </td>

                              {/* Applied Date */}
                              <td className="py-3 px-3 whitespace-nowrap text-[11px] text-slate-500 font-medium">
                                {app.applied_at
                                  ? new Date(app.applied_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                                  : 'Recent'}
                              </td>

                              {/* Chevron Indicator */}
                              <td className="py-3 px-3 text-right whitespace-nowrap">
                                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg transition-all ${
                                  isSelected
                                    ? 'bg-[#FF7043] text-white shadow-2xs'
                                    : 'text-slate-400 group-hover:text-slate-700 group-hover:bg-slate-100'
                                }`}>
                                  <ChevronRight size={14} />
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between flex-wrap gap-2 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={12} className="text-[#FF7043]" />
                      <span>Hover or click any row to preview full status & interview details</span>
                    </span>
                    <span className="font-semibold text-slate-700">
                      {filteredApplications.length} {filteredApplications.length === 1 ? 'Application' : 'Applications'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Detail Preview */}
              <div className="lg:col-span-5 lg:sticky lg:top-5 space-y-3">
                {activeApp ? (
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] space-y-4 animate-in fade-in duration-150">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-slate-100">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 text-slate-800 font-extrabold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                          {(activeApp.job?.company_name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Active Preview
                          </span>
                          <h3 className="text-base font-bold text-slate-900 leading-snug truncate m-0" title={activeApp.job?.title}>
                            {activeApp.job?.title || 'Marketing Role'}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                            <span className="font-semibold text-slate-800">{activeApp.job?.company_name}</span>
                            <span>•</span>
                            <span>{activeApp.job?.location}</span>
                            {activeApp.job?.job_type && (
                              <>
                                <span>•</span>
                                <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold">
                                  {activeApp.job.job_type}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {activeBadge && (
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-2xs shrink-0 ${activeBadge.style}`}
                        >
                          <ActiveBadgeIcon size={12} />
                          {activeBadge.label}
                        </span>
                      )}
                    </div>

                    {/* AI Fit Score Card (if scored) */}
                    {activeApp.fit_score != null && (
                      <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                            <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider">
                              AI Match Score
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
                            {Math.round(activeApp.fit_score)}%
                          </span>
                        </div>
                        <div className="w-full bg-purple-200/60 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-purple-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(0, activeApp.fit_score))}%` }}
                          />
                        </div>
                        {activeApp.fit_breakdown && typeof activeApp.fit_breakdown === 'object' && (
                          <div className="grid grid-cols-3 gap-1 pt-1 text-[10px] text-purple-800 font-medium">
                            {activeApp.fit_breakdown.skills != null && (
                              <div>Skills: <span className="font-bold">{Math.round(activeApp.fit_breakdown.skills)}%</span></div>
                            )}
                            {activeApp.fit_breakdown.experience != null && (
                              <div>Exp: <span className="font-bold">{Math.round(activeApp.fit_breakdown.experience)}%</span></div>
                            )}
                            {activeApp.fit_breakdown.relevance != null && (
                              <div>Role: <span className="font-bold">{Math.round(activeApp.fit_breakdown.relevance)}%</span></div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Compensation */}
                    {activeSalary && (
                      <div className="flex items-center justify-between text-xs bg-emerald-50/60 border border-emerald-200/70 p-2.5 rounded-xl">
                        <span className="text-emerald-800 font-medium">Compensation</span>
                        <span className="font-bold text-emerald-900">{activeSalary}</span>
                      </div>
                    )}

                    {/* Strong Hire / Offer, Do Not Hire, or Next Round Feedback Message */}
                    <CandidateFeedbackMessageCard feedback={activeFeedback} appStatus={activeApp.status} />

                    {/* ATS Pipeline */}
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                        ATS Pipeline Progress
                      </span>
                      <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/70">
                        <div className="grid grid-cols-5 gap-1.5">
                          {STAGES.map((stg, i) => {
                            const isCompleted = activeStageIdx > i;
                            const isCurrent = activeStageIdx === i;

                            return (
                              <div key={stg.key} className="space-y-1 min-w-0">
                                <div
                                  className={`h-1.5 rounded-full transition-all duration-300 ${
                                    isCompleted
                                      ? 'bg-emerald-500 shadow-2xs'
                                      : isCurrent
                                        ? 'bg-[#FF7043] ring-2 ring-orange-100'
                                        : 'bg-slate-200'
                                  }`}
                                />
                                <div className="flex items-center gap-1 min-w-0">
                                  {isCompleted ? (
                                    <Check size={9} className="text-emerald-600 shrink-0" strokeWidth={3} />
                                  ) : isCurrent ? (
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF7043] shrink-0 animate-pulse" />
                                  ) : (
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                                  )}
                                  <span
                                    className={`text-[11px] truncate ${
                                      isCurrent
                                        ? 'text-[#FF7043] font-bold'
                                        : isCompleted
                                          ? 'text-slate-800 font-medium'
                                          : 'text-slate-400 font-normal'
                                    }`}
                                  >
                                    {stg.label}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Google Meet Video Interview Section */}
                    {(activeApp.status === 'INTERVIEW_SCHEDULED' || activeApp.interview) && (
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                          Live Video Conference
                        </span>
                        <GoogleMeetCard
                          interview={activeApp.interview || {
                            job_title: activeApp.job?.title,
                            interview_date: 'Scheduled',
                            interview_time: 'Check Schedule',
                            interviewer_name: activeApp.job?.company_name || 'Hiring Lead',
                            status: 'CONFIRMED'
                          }}
                          user={user}
                          variant="candidate"
                          onToast={triggerToast}
                        />
                      </div>
                    )}

                    {/* Candidate Cover Note */}
                    {activeApp.cover_letter && (
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                          Your Submitted Note
                        </span>
                        <p className="italic text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/70 m-0">
                          "{activeApp.cover_letter}"
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setViewingApp(activeApp)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer flex items-center gap-1.5"
                      >
                        <Eye size={13} /> View Full Role Details
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedJobId?.(activeApp.job?.id);
                          setActiveTab?.('job_search');
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#FF7043] hover:text-[#E65B30] hover:underline transition-colors border-none bg-transparent cursor-pointer flex items-center gap-1"
                      >
                        Similar Roles <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })()
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((app) => {
            const j = app.job || {};
            const currentStageIdx = getStageIndex(app.status);
            const isRejected = app.status === 'REJECTED';
            const badge = getStatusBadge(app.status);
            const BadgeIcon = badge.icon;

            const salaryFormatted = j.salary_min && j.salary_max
              ? `$${j.salary_min.toLocaleString()} - $${j.salary_max.toLocaleString()}/yr`
              : j.salary_min
                ? `From $${j.salary_min.toLocaleString()}/yr`
                : null;

            return (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-slate-300 transition-all space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-800 font-extrabold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                      {(j.company_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          className="text-base font-bold text-slate-900 hover:text-[#FF7043] transition-colors cursor-pointer truncate m-0"
                          onClick={() => setViewingApp(app)}
                        >
                          {j.title || 'Digital Marketing Role'}
                        </h3>
                        {j.job_type && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">
                            {j.job_type}
                          </span>
                        )}
                        {app.fit_score != null && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200/80 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-purple-600" />
                            <span>{Math.round(app.fit_score)}% Match</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <Building2 size={13} className="text-slate-400" />
                          {j.company_name || 'Verified Agency'}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1">
                          <MapPin size={13} className="text-slate-400" />
                          {j.location || 'Remote'} {j.work_mode ? `(${j.work_mode})` : ''}
                        </span>
                        {salaryFormatted && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="font-bold text-emerald-700 flex items-center gap-0.5">
                              <DollarSign size={12} /> {salaryFormatted}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0 flex sm:flex-col items-start sm:items-end gap-1">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-2xs ${badge.style}`}
                    >
                      <BadgeIcon size={13} />
                      {badge.label}
                    </span>
                    {app.applied_at && (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock size={10} /> Applied {new Date(app.applied_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>

                {/* 5-Stage ATS Visual Stepper & Outcome Feedbacks */}
                {isRejected ? (
                  <div className="space-y-3">
                    <CandidateFeedbackMessageCard feedback={getFeedbackForApp(app, user)} appStatus={app.status} />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-slate-50/80 rounded-xl p-3 sm:px-4 sm:py-3 border border-slate-200/70">
                      <div className="grid grid-cols-5 gap-2 sm:gap-3">
                        {STAGES.map((stg, i) => {
                          const isCompleted = currentStageIdx > i;
                          const isCurrent = currentStageIdx === i;

                          return (
                            <div key={stg.key} className="space-y-1.5 min-w-0">
                              {/* Segment Bar */}
                              <div
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                  isCompleted
                                    ? 'bg-emerald-500 shadow-2xs'
                                    : isCurrent
                                      ? 'bg-[#FF7043] shadow-xs ring-2 ring-orange-100'
                                      : 'bg-slate-200/90'
                                }`}
                              />
                              {/* Step Label & Indicator */}
                              <div className="flex items-center gap-1.5 min-w-0">
                                {isCompleted ? (
                                  <Check size={11} className="text-emerald-600 shrink-0" strokeWidth={3} />
                                ) : isCurrent ? (
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF7043] shrink-0 animate-pulse" />
                                ) : (
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                                )}
                                <span
                                  className={`text-[11px] sm:text-xs truncate tracking-tight ${
                                    isCurrent
                                      ? 'text-[#FF7043] font-bold'
                                      : isCompleted
                                        ? 'text-slate-800 font-medium'
                                        : 'text-slate-400 font-normal'
                                  }`}
                                >
                                  {stg.label}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Offer Extended Card in Card View */}
                    {(app.status === 'SELECTED' || getFeedbackForApp(app, user)?.recommendation === 'HIRE') && (
                      <CandidateFeedbackMessageCard feedback={getFeedbackForApp(app, user)} appStatus={app.status} />
                    )}
                  </div>
                )}

                {/* Google Meet Video Interview Section */}
                {(app.status === 'INTERVIEW_SCHEDULED' || app.interview) && (
                  <div className="pt-1">
                    <GoogleMeetCard
                      interview={app.interview || {
                        job_title: j.title,
                        interview_date: 'Scheduled',
                        interview_time: 'Check Schedule',
                        interviewer_name: j.company_name || 'Hiring Lead',
                        status: 'CONFIRMED'
                      }}
                      user={user}
                      variant="candidate"
                      onToast={triggerToast}
                    />
                  </div>
                )}

                {/* Candidate Cover Note */}
                {app.cover_letter && (
                  <div className="bg-slate-50 rounded-xl p-3 sm:p-3.5 border border-slate-200/60 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-1">
                      <FileText size={13} className="text-slate-400" />
                      <span>Your Application Note:</span>
                    </div>
                    <p className="italic text-slate-600 leading-relaxed line-clamp-2 m-0">
                      "{app.cover_letter}"
                    </p>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setViewingApp(app)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
                    >
                      <Eye size={13} /> View Full Role Details
                    </button>

                    {app.status === 'INTERVIEW_SCHEDULED' && (
                      <button
                        type="button"
                        onClick={() => setActiveTab?.('interviews')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
                      >
                        <Calendar size={13} /> All Interviews <ChevronRight size={12} />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedJobId?.(j.id);
                      setActiveTab?.('job_search');
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#FF7043] hover:text-[#E65B30] hover:underline transition-colors border-none bg-transparent cursor-pointer"
                  >
                    Browse Similar Roles <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Role Details Modal ─── */}
      {viewingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl my-8 border border-slate-200 animate-in fade-in">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white relative">
              <button
                type="button"
                onClick={() => setViewingApp(null)}
                className="absolute top-5 right-5 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border-none cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-2">
                <div className="w-11 h-11 rounded-xl bg-white text-slate-900 font-extrabold text-lg flex items-center justify-center border border-white/40 shadow-xs">
                  {(viewingApp.job?.company_name || 'U').charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <ShieldCheck size={13} /> {viewingApp.job?.company_name || 'Verified Recruiter'}
                  </div>
                  <h2 className="text-xl font-bold text-white leading-snug m-0">
                    {viewingApp.job?.title}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-white/70 mt-3 flex-wrap">
                <span className="flex items-center gap-1"><MapPin size={12} /> {viewingApp.job?.location} ({viewingApp.job?.work_mode})</span>
                <span>•</span>
                <span>Type: {viewingApp.job?.job_type || 'Full-Time'}</span>
                {viewingApp.job?.experience_level && (
                  <>
                    <span>•</span>
                    <span>Level: {viewingApp.job?.experience_level}</span>
                  </>
                )}
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
              {/* Application Status Alert */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Status</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                    {viewingApp.status.replace(/_/g, ' ')}
                  </span>
                </div>
                {viewingApp.applied_at && (
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Applied Date</span>
                    <span className="text-xs text-slate-600 mt-0.5 block font-medium">
                      {new Date(viewingApp.applied_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>

              {/* AI Fit Score Details (if available) */}
              {viewingApp.fit_score != null && (
                <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                        AI Candidate Fit Assessment
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
                      {Math.round(viewingApp.fit_score)}% Match
                    </span>
                  </div>
                  <div className="w-full bg-purple-200/60 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, viewingApp.fit_score))}%` }}
                    />
                  </div>
                  {viewingApp.fit_breakdown && typeof viewingApp.fit_breakdown === 'object' && (
                    <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-purple-900">
                      {viewingApp.fit_breakdown.skills != null && (
                        <div className="bg-white/80 p-2 rounded-lg border border-purple-100">
                          <span className="text-purple-600 block text-[10px]">Skills Match</span>
                          <span className="font-bold">{Math.round(viewingApp.fit_breakdown.skills)}%</span>
                        </div>
                      )}
                      {viewingApp.fit_breakdown.experience != null && (
                        <div className="bg-white/80 p-2 rounded-lg border border-purple-100">
                          <span className="text-purple-600 block text-[10px]">Experience Depth</span>
                          <span className="font-bold">{Math.round(viewingApp.fit_breakdown.experience)}%</span>
                        </div>
                      )}
                      {viewingApp.fit_breakdown.relevance != null && (
                        <div className="bg-white/80 p-2 rounded-lg border border-purple-100">
                          <span className="text-purple-600 block text-[10px]">Role Relevance</span>
                          <span className="font-bold">{Math.round(viewingApp.fit_breakdown.relevance)}%</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Feedback Message Card in Details Modal */}
              <CandidateFeedbackMessageCard feedback={getFeedbackForApp(viewingApp, user)} appStatus={viewingApp.status} />

              {/* Job Description */}
              {viewingApp.job?.description && (
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Role Overview & Responsibilities</h4>
                  <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50/60 p-4 rounded-xl border border-slate-100">
                    {viewingApp.job.description}
                  </div>
                </div>
              )}

              {/* Required Skills */}
              {Array.isArray(viewingApp.job?.skills) && viewingApp.job.skills.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Target Skills & Tools</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {viewingApp.job.skills.map((skill, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-orange-50 text-[#FF7043] text-xs font-semibold border border-orange-200/60">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Candidate Cover Note */}
              {viewingApp.cover_letter && (
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Your Submitted Cover Note</h4>
                  <div className="text-xs text-slate-600 italic bg-amber-50/50 border border-amber-200/60 p-3.5 rounded-xl">
                    "{viewingApp.cover_letter}"
                  </div>
                </div>
              )}

              {/* Google Meet Video Interview Section */}
              {(viewingApp.status === 'INTERVIEW_SCHEDULED' || viewingApp.interview) && (
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Live Interview Session</h4>
                  <GoogleMeetCard
                    interview={viewingApp.interview || {
                      job_title: viewingApp.job?.title,
                      interview_date: 'Scheduled',
                      interview_time: 'Check Schedule',
                      interviewer_name: viewingApp.job?.company_name || 'Hiring Lead',
                      status: 'CONFIRMED'
                    }}
                    user={user}
                    variant="candidate"
                    onToast={triggerToast}
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setViewingApp(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 border-none bg-slate-100 cursor-pointer transition-colors"
              >
                Close
              </button>

              {viewingApp.status === 'INTERVIEW_SCHEDULED' && (
                <button
                  type="button"
                  onClick={() => {
                    setViewingApp(null);
                    setActiveTab?.('interviews');
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#FF7043] hover:bg-[#E65B30] border-none cursor-pointer transition-colors flex items-center gap-1.5 shadow-[0_1px_2px_rgba(255,112,67,0.3)]"
                >
                  <Calendar size={13} /> View Interview Details
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
