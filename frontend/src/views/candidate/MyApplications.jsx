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
      <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-emerald-100/50 border-2 border-emerald-300 shadow-xs space-y-3 animate-in fade-in">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[0.65rem] font-black uppercase tracking-wider text-emerald-800">
                  Hiring Decision
                </span>
                <span className="px-2 py-0.5 rounded-full text-[0.65rem] font-black bg-emerald-200 text-emerald-950 border border-emerald-300">
                  Strong Hire / Offer
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-black text-emerald-950 mt-0.5">
                🎉 Congratulations! Offer Extended
              </h4>
            </div>
          </div>
        </div>

        {/* Evaluation Feedback & Summary Notes */}
        <div>
          <span className="text-[0.68rem] font-bold text-emerald-900 uppercase tracking-wider block mb-1">
            Hiring Team Evaluation & Feedback
          </span>
          <div className="p-3.5 rounded-xl bg-white/95 border border-emerald-200 text-xs text-emerald-950 leading-relaxed font-medium shadow-2xs">
            {feedback.notes}
          </div>
        </div>

        <div className="text-[0.72rem] text-emerald-800 flex items-center gap-1.5 pt-0.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Our HR & Talent Operations team will reach out with your formal compensation breakdown and joining documentation.</span>
        </div>
      </div>
    );
  }

  if (isPass) {
    return (
      <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-rose-50/90 via-slate-50 to-rose-100/40 border-2 border-rose-200 shadow-xs space-y-3 animate-in fade-in">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[0.65rem] font-black uppercase tracking-wider text-rose-800">
                  Hiring Decision
                </span>
                <span className="px-2 py-0.5 rounded-full text-[0.65rem] font-black bg-rose-100 text-rose-900 border border-rose-200">
                  Do Not Hire · Application Concluded
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
                Interview Outcome & Evaluation Feedback
              </h4>
            </div>
          </div>
        </div>

        {/* Evaluation Feedback & Summary Notes */}
        <div>
          <span className="text-[0.68rem] font-bold text-slate-600 uppercase tracking-wider block mb-1">
            Interviewer Feedback & Summary Notes
          </span>
          <div className="p-3.5 rounded-xl bg-white/95 border border-rose-200/80 text-xs text-slate-800 leading-relaxed font-medium shadow-2xs">
            {feedback.notes}
          </div>
        </div>

        <p className="text-[0.72rem] text-slate-500 m-0 leading-relaxed">
          We genuinely appreciate the effort and time you invested in interviewing with our team. We wish you continued success in your career journey and invite you to explore future roles on our platform.
        </p>
      </div>
    );
  }

  if (isAdvance) {
    return (
      <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-amber-50 via-purple-50/40 to-amber-100/40 border-2 border-amber-300 shadow-xs space-y-3 animate-in fade-in">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[0.65rem] font-black uppercase tracking-wider text-amber-800">
                  Interview Progression
                </span>
                <span className="px-2 py-0.5 rounded-full text-[0.65rem] font-black bg-amber-200 text-amber-950 border border-amber-300">
                  Next Round
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-black text-amber-950 mt-0.5">
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
            <span className="text-[0.68rem] font-bold text-amber-900 uppercase tracking-wider block mb-1">
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

  const stats = [
    {
      label: 'Total Applied',
      value: totalCount,
      sub: 'Active submissions',
      color: '#00a884',
      filterKey: 'ALL'
    },
    {
      label: 'In Review',
      value: inReviewCount,
      sub: 'Being screened',
      color: '#d97706',
      filterKey: 'IN_REVIEW'
    },
    {
      label: 'Interviews',
      value: interviewCount,
      sub: 'Rounds scheduled',
      color: '#0891b2',
      filterKey: 'INTERVIEW_SCHEDULED'
    },
    {
      label: 'Selected / Offers',
      value: selectedCount,
      sub: 'Placements',
      color: '#059669',
      filterKey: 'SELECTED'
    },
  ];

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
          bg: '#ECFDF5',
          text: '#065F46',
          border: '#A7F3D0',
          label: 'Selected / Offer',
          icon: Sparkles
        };
      case 'INTERVIEW_SCHEDULED':
        return {
          bg: '#ECFEFF',
          text: '#155E75',
          border: '#A5F3FC',
          label: 'Interview Scheduled',
          icon: Calendar
        };
      case 'SHORTLISTED':
        return {
          bg: '#EEF2FF',
          text: '#3730A3',
          border: '#C7D2FE',
          label: 'Shortlisted',
          icon: Award
        };
      case 'UNDER_REVIEW':
        return {
          bg: '#FFFBEB',
          text: '#92400E',
          border: '#FDE68A',
          label: 'Under Review',
          icon: Clock
        };
      case 'REJECTED':
        return {
          bg: '#FFF1F2',
          text: '#9F1239',
          border: '#FECDD3',
          label: 'Not Selected',
          icon: XCircle
        };
      case 'APPLIED':
      default:
        return {
          bg: '#F8FAFC',
          text: '#334155',
          border: '#E2E8F0',
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
    <div className="p-4 sm:p-8 max-w-10xl mx-auto space-y-6 select-text text-slate-800 relative">

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-in slide-in-from-bottom-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5 m-0">
              <span className="w-8 h-8 rounded-xl bg-teal-50 text-[#00a884] flex items-center justify-center font-bold border border-teal-100/80 shrink-0">
                <Briefcase className="w-4 h-4" />
              </span>
              My Applications
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed m-0">
            Live status tracker for all roles you applied to across verified recruiters and growth teams.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[0.7rem] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
            <Sparkles className="w-3 h-3 text-emerald-600" /> Live ATS Pipeline
          </span>
          <button
            type="button"
            onClick={loadApplications}
            disabled={refreshing}
            title="Refresh applications"
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer bg-white shadow-2xs disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-[#00a884]' : ''} />
          </button>
        </div>
      </div>

      {/* ── Search Toolbar & Filter Pills ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              className="w-full pl-10 pr-8 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200/90 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#00a884] transition-all placeholder:text-slate-400"
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

          {/* View Mode Toggle & Sort & Action Button */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center flex-wrap">
            {/* View Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border-none ${viewMode === 'table'
                    ? 'bg-white text-[#00a884] shadow-2xs font-extrabold'
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
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border-none ${viewMode === 'cards'
                    ? 'bg-white text-[#00a884] shadow-2xs font-extrabold'
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
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer hover:border-slate-300"
            >
              <option value="newest">Newest Applied</option>
              <option value="oldest">Oldest First</option>
              <option value="company">Company Name</option>
            </select>

            <button
              type="button"
              onClick={() => setActiveTab?.('job_search')}
              className="px-4 py-2 rounded-xl bg-[#00a884] hover:bg-[#008f70] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 border-none cursor-pointer shrink-0"
            >
              <Search className="w-3.5 h-3.5" /> Explore Jobs
            </button>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
          {filterTabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`text-[0.7rem] px-3 py-1.5 rounded-xl font-semibold transition-colors border cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${statusFilter === tab.id
                ? 'bg-[#00a884] text-white border-[#00a884] shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/80'
                }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[0.62rem] font-bold ${statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-600'
                }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── 2. Applications Content ─── */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-16 text-center shadow-xs space-y-3">
          <div className="w-8 h-8 border-3 border-[#00a884] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Loading your candidate submissions...</p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-xs space-y-3.5 max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#00a884] flex items-center justify-center mx-auto">
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
                className="px-5 py-2.5 rounded-xl bg-[#00a884] hover:bg-[#008f70] text-white text-xs font-bold transition-all border-none cursor-pointer shadow-xs"
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
                <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[0.68rem] font-bold text-slate-500 uppercase tracking-wider">
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
                              className={`transition-all cursor-pointer group ${isSelected
                                  ? 'bg-teal-50/70 border-l-4 border-l-[#00a884]'
                                  : 'hover:bg-slate-50/80 border-l-4 border-l-transparent'
                                }`}
                            >
                              {/* Role & Company */}
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                    {(j.company_name || 'U').charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-bold text-slate-900 group-hover:text-[#00a884] transition-colors truncate max-w-[200px] sm:max-w-[240px]">
                                      {j.title || 'Marketing Role'}
                                    </div>
                                    <div className="text-[0.7rem] text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                                      <span className="font-medium text-slate-600 truncate">{j.company_name}</span>
                                      <span>•</span>
                                      <span className="truncate">{j.location || 'Remote'}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Stage */}
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span
                                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.68rem] font-bold border shadow-2xs"
                                  style={{ background: badge.bg, color: badge.text, borderColor: badge.border }}
                                >
                                  <BadgeIcon size={11} />
                                  {badge.label}
                                </span>
                              </td>

                              {/* Meeting / Next Step */}
                              <td className="py-3 px-3 whitespace-nowrap">
                                {app.status === 'SELECTED' || getFeedbackForApp(app, user)?.recommendation === 'HIRE' ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[0.68rem] font-black bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                                    <Award size={11} className="text-emerald-600" />
                                    <span>Offer Extended</span>
                                  </span>
                                ) : app.status === 'REJECTED' || getFeedbackForApp(app, user)?.recommendation === 'PASS' ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[0.68rem] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                                    <XCircle size={11} className="text-rose-600" />
                                    <span>Feedback Ready</span>
                                  </span>
                                ) : isInterview ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[0.68rem] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">
                                    <Video size={11} className="text-indigo-600 animate-pulse" />
                                    <span>Google Meet</span>
                                  </span>
                                ) : (
                                  <span className="text-[0.7rem] text-slate-400">
                                    In Review
                                  </span>
                                )}
                              </td>

                              {/* Applied Date */}
                              <td className="py-3 px-3 whitespace-nowrap text-[0.72rem] text-slate-500">
                                {app.applied_at
                                  ? new Date(app.applied_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                                  : 'Recent'}
                              </td>

                              {/* Chevron Indicator */}
                              <td className="py-3 px-3 text-right whitespace-nowrap">
                                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg transition-all ${isSelected
                                    ? 'bg-[#00a884] text-white shadow-2xs'
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

                  <div className="p-3 bg-slate-50 border-t border-slate-100 text-[0.7rem] text-slate-500 flex items-center justify-between flex-wrap gap-2">
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={12} className="text-[#00a884]" />
                      <span>Hover any row to preview full status & interview details</span>
                    </span>
                    <span className="font-semibold text-slate-600">
                      {filteredApplications.length} {filteredApplications.length === 1 ? 'Application' : 'Applications'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Hover Detail Preview */}
              <div className="lg:col-span-5 lg:sticky lg:top-4 space-y-3">
                {activeApp ? (
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4 animate-in fade-in duration-150">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-slate-100">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                          {(activeApp.job?.company_name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider block">
                            Active Preview
                          </span>
                          <h3 className="text-base font-bold text-slate-900 leading-snug truncate" title={activeApp.job?.title}>
                            {activeApp.job?.title || 'Marketing Role'}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                            <span className="font-semibold text-slate-800">{activeApp.job?.company_name}</span>
                            <span>•</span>
                            <span>{activeApp.job?.location}</span>
                            {activeApp.job?.job_type && (
                              <>
                                <span>•</span>
                                <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[0.65rem] font-medium">
                                  {activeApp.job.job_type}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {activeBadge && (
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs shrink-0"
                          style={{
                            background: activeBadge.bg,
                            color: activeBadge.text,
                            borderColor: activeBadge.border
                          }}
                        >
                          <ActiveBadgeIcon size={12} />
                          {activeBadge.label}
                        </span>
                      )}
                    </div>

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
                      <span className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
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
                                  className={`h-1.5 rounded-full transition-all duration-300 ${isCompleted
                                      ? 'bg-emerald-500 shadow-2xs'
                                      : isCurrent
                                        ? 'bg-[#00a884] ring-2 ring-teal-100'
                                        : 'bg-slate-200'
                                    }`}
                                />
                                <div className="flex items-center gap-1 min-w-0">
                                  {isCompleted ? (
                                    <Check size={9} className="text-emerald-600 shrink-0" strokeWidth={3} />
                                  ) : isCurrent ? (
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] shrink-0 animate-pulse" />
                                  ) : (
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                                  )}
                                  <span
                                    className={`text-[0.62rem] truncate font-semibold ${isCurrent
                                        ? 'text-[#00a884] font-bold'
                                        : isCompleted
                                          ? 'text-slate-800'
                                          : 'text-slate-400'
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
                        <span className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
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
                        <span className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider block mb-1">
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
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#00a884] hover:underline transition-colors border-none bg-transparent cursor-pointer flex items-center gap-1"
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
                className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all space-y-3.5 sm:space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                      {(j.company_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          className="text-base font-bold text-slate-900 hover:text-[#00a884] transition-colors cursor-pointer truncate"
                          onClick={() => setViewingApp(app)}
                        >
                          {j.title || 'Digital Marketing Role'}
                        </h3>
                        {j.job_type && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[0.68rem] font-semibold">
                            {j.job_type}
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
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs"
                      style={{ background: badge.bg, color: badge.text, borderColor: badge.border }}
                    >
                      <BadgeIcon size={13} />
                      {badge.label}
                    </span>
                    {app.applied_at && (
                      <span className="text-[0.68rem] text-slate-400 flex items-center gap-1 mt-0.5">
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
                    <div className="bg-slate-50/70 rounded-xl p-3 sm:px-4 sm:py-3 border border-slate-200/70">
                      <div className="grid grid-cols-5 gap-2 sm:gap-3">
                        {STAGES.map((stg, i) => {
                          const isCompleted = currentStageIdx > i;
                          const isCurrent = currentStageIdx === i;

                          return (
                            <div key={stg.key} className="space-y-1.5 min-w-0">
                              {/* Segment Bar */}
                              <div
                                className={`h-1.5 rounded-full transition-all duration-300 ${isCompleted
                                    ? 'bg-emerald-500 shadow-2xs'
                                    : isCurrent
                                      ? 'bg-[#00a884] shadow-xs ring-2 ring-teal-100'
                                      : 'bg-slate-200/90'
                                  }`}
                              />
                              {/* Step Label & Indicator */}
                              <div className="flex items-center gap-1.5 min-w-0">
                                {isCompleted ? (
                                  <Check size={11} className="text-emerald-600 shrink-0" strokeWidth={3} />
                                ) : isCurrent ? (
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] shrink-0 animate-pulse" />
                                ) : (
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                                )}
                                <span
                                  className={`text-[0.68rem] sm:text-xs truncate font-semibold tracking-tight ${isCurrent
                                      ? 'text-[#00a884] font-bold'
                                      : isCompleted
                                        ? 'text-slate-800'
                                        : 'text-slate-400'
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

                {/* Google Meet Video Interview Section for Candidate */}
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
                    <p className="italic text-slate-600 leading-relaxed line-clamp-2">
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
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#00a884] hover:underline transition-colors border-none bg-transparent cursor-pointer"
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
                <div className="w-11 h-11 rounded-xl bg-white/15 text-white font-bold text-lg flex items-center justify-center border border-white/20">
                  {(viewingApp.job?.company_name || 'U').charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <ShieldCheck size={13} /> {viewingApp.job?.company_name || 'Verified Recruiter'}
                  </div>
                  <h2 className="text-xl font-bold text-white leading-snug">
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
                  <span className="text-[0.68rem] font-bold text-slate-400 uppercase tracking-wider block">Current Status</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                    {viewingApp.status.replace(/_/g, ' ')}
                  </span>
                </div>
                {viewingApp.applied_at && (
                  <div className="text-right">
                    <span className="text-[0.68rem] font-bold text-slate-400 uppercase tracking-wider block">Applied Date</span>
                    <span className="text-xs text-slate-600 mt-0.5 block">
                      {new Date(viewingApp.applied_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>

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
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-teal-50 text-[#00a884] text-xs font-medium border border-teal-100">
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
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#00a884] hover:bg-[#008f70] border-none cursor-pointer transition-colors flex items-center gap-1.5"
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




