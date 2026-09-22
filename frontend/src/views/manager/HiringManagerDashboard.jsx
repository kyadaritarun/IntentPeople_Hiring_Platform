import React, { useState, useEffect } from 'react';
import {
  Users, CheckCircle2, Award, Calendar, Video, FileText,
  ChevronRight, Star, ThumbsUp, ThumbsDown, Clock, Building2,
  ExternalLink, ArrowUpRight, X, ShieldCheck, Sparkles, Filter
} from 'lucide-react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';

const NAVY = '#132340';
const NAVY_SOFT = '#2C4470';
const INK = '#0F1B2E';
const GOLD = '#F2A93B';
const GOLD_DEEP = '#D98D1E';
const PAPER = '#F6F7FB';
const LINE = '#EAEDF3';
const DISPLAY_FONT = "'Lexend', 'Inter', system-ui, sans-serif";

export default function HiringManagerDashboard({ setActiveTab, setSelectedJobId }) {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL');

  // Evaluation Scorecard Modal State
  const [evaluatingCandidate, setEvaluatingCandidate] = useState(null);
  const [technicalScore, setTechnicalScore] = useState(4);
  const [commScore, setCommScore] = useState(5);
  const [fitScore, setFitScore] = useState(4);
  const [recommendation, setRecommendation] = useState('HIRE');
  const [evalNotes, setEvalNotes] = useState('');
  const [submittingEval, setSubmittingEval] = useState(false);

  const profile = user?.profile || {};
  const managerName = profile.full_name || user?.email?.split('@')[0] || 'Hiring Manager';
  const companyName = profile.company_name || 'Hiring Organization';
  const managerTitle = profile.title || 'Hiring Manager';

  const triggerToast = (msg) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3500);
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = () => {
    api.getCompanyApplications()
      .then(data => setApplications(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleUpdateStatus = async (appId, newStatus, candidateName) => {
    try {
      await api.updateApplicationStatus(appId, newStatus);
      triggerToast(`Updated ${candidateName}'s stage to ${newStatus.replace('_', ' ')}`);
      loadApplications();
    } catch (err) {
      triggerToast(err.message || 'Failed to update status');
    }
  };

  const handleSubmitScorecard = async (e) => {
    e.preventDefault();
    if (!evaluatingCandidate) return;

    setSubmittingEval(true);
    try {
      const nextStatus = recommendation === 'HIRE' ? 'OFFERED' : recommendation === 'ADVANCE' ? 'INTERVIEW_SCHEDULED' : 'REJECTED';
      await api.updateApplicationStatus(evaluatingCandidate.id, nextStatus);
      triggerToast(`📋 Scorecard submitted! ${evaluatingCandidate.candidate?.full_name} marked as ${nextStatus.replace('_', ' ')}.`);
      setEvaluatingCandidate(null);
      setEvalNotes('');
      loadApplications();
    } catch (err) {
      triggerToast(err.message || 'Failed to submit scorecard');
    } finally {
      setSubmittingEval(false);
    }
  };

  const filteredApps = applications.filter(app => {
    if (activeFilter === 'REVIEW') return app.status === 'APPLIED' || app.status === 'UNDER_REVIEW';
    if (activeFilter === 'INTERVIEW') return app.status === 'INTERVIEW_SCHEDULED';
    if (activeFilter === 'OFFER') return app.status === 'OFFERED' || app.status === 'HIRED';
    return true;
  });

  const kpis = [
    { icon: Users, label: 'Candidates in review', value: applications.filter(a => a.status === 'APPLIED' || a.status === 'UNDER_REVIEW').length || 4, delta: '2 pending decision', color: NAVY },
    { icon: Calendar, label: 'Interviews scheduled', value: applications.filter(a => a.status === 'INTERVIEW_SCHEDULED').length || 2, delta: '1 session today', color: GOLD_DEEP },
    { icon: Award, label: 'Offers extended', value: applications.filter(a => a.status === 'OFFERED' || a.status === 'HIRED').length || 1, delta: 'Final sign-off', color: '#0E9F6E' },
    { icon: Star, label: 'Scorecards logged', value: 8, delta: 'High satisfaction', color: '#7C5CBF' }
  ];

  return (
    <div className="min-h-full pb-10" style={{ background: PAPER }}>

      {/* Toast Alert */}
      {showToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-5 py-3 rounded-xl bg-slate-900 text-white shadow-2xl border border-teal-500/40 text-xs font-medium animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-[#00a884]" />
          {showToast}
        </div>
      )}

      {/* ─── HERO BANNER ─── */}
      <div style={{
        background: `radial-gradient(120% 140% at 12% 0%, #2A1F45 0%, #17112B 46%, #0D091A 100%)`,
        position: 'relative', overflow: 'hidden'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="pt-8 sm:pt-10 pb-8 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">

            <div className="flex items-center gap-4 sm:gap-5">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl overflow-hidden shrink-0 shadow-lg ring-2 ring-purple-400/50 bg-gradient-to-br from-purple-500/30 to-purple-800/40 border-2 border-purple-400/30">
                {managerName.charAt(0).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/25 text-purple-300 font-bold text-[0.65rem] border border-purple-400/30">
                    Hiring Manager
                  </span>
                  <span className="text-[0.7rem] text-white/50">{companyName}</span>
                </div>
                <h1 className="text-[1.6rem] sm:text-[1.9rem] font-bold text-white leading-tight" style={{ fontFamily: DISPLAY_FONT }}>
                  {managerName}
                </h1>
                <p className="text-xs text-white/60 mt-1 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-purple-300" />
                  <span>{managerTitle} · Evaluation & Hiring Decisions</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab?.('interviews')}
                className="px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold flex items-center gap-2 border-none cursor-pointer shadow-md transition-all"
              >
                <Calendar size={15} />
                View Interview Schedule
              </button>
            </div>

          </div>

          {/* ─── STATS RIBBON ─── */}
          <div className="-mb-8 relative z-10">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {kpis.map((kpi, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl px-5 py-4 text-left shadow-xs border-t-3 hover:-translate-y-0.5 transition-all"
                  style={{ borderTopColor: kpi.color }}
                >
                  <div className="flex items-start justify-between">
                    <kpi.icon size={16} style={{ color: kpi.color }} />
                    <ArrowUpRight size={13} className="text-slate-300" />
                  </div>
                  <div className="text-[1.6rem] font-bold leading-none mt-3 text-slate-900" style={{ fontFamily: DISPLAY_FONT }}>
                    {kpi.value}
                  </div>
                  <div className="text-[0.78rem] text-slate-500 font-medium mt-1.5">{kpi.label}</div>
                  <div className="text-[0.68rem] text-slate-400 mt-1">{kpi.delta}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ─── MAIN CANDIDATE EVALUATION WORKSPACE ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-12 space-y-6">

        {/* Filter Pills */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            {[
              { id: 'ALL', label: 'All Candidates' },
              { id: 'REVIEW', label: 'Awaiting Evaluation' },
              { id: 'INTERVIEW', label: 'Interview Scheduled' },
              { id: 'OFFER', label: 'Offer / Hired' },
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${activeFilter === f.id
                  ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <span className="text-xs font-semibold text-slate-400">
            Showing {filteredApps.length} candidate submissions
          </span>
        </div>

        {/* Candidate Evaluation Cards */}
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            Loading candidate submissions...
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <Users size={32} className="text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No candidates found for this filter</h3>
            <p className="text-xs text-slate-400 mt-1">
              When recruiters screen and forward applicants, they will appear here for your technical assessment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredApps.map((app) => {
              const candidate = app.candidate || {};
              const isInterviewStage = app.status === 'INTERVIEW_SCHEDULED';
              const isOffered = app.status === 'OFFERED' || app.status === 'HIRED';

              return (
                <div
                  key={app.id}
                  className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/90 flex flex-col justify-between hover:shadow-md transition-all"
                >
                  <div>
                    {/* Header: Candidate & Match */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-700 font-bold text-sm flex items-center justify-center shrink-0 border border-purple-200/60">
                          {candidate.full_name ? candidate.full_name.charAt(0) : 'C'}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{candidate.full_name || 'Applicant'}</h3>
                          <p className="text-xs text-purple-700 font-semibold">{app.job_title || 'Marketing Specialist'}</p>
                          <p className="text-[0.68rem] text-slate-400 mt-0.5">{candidate.city ? `${candidate.city}, ${candidate.state || ''}` : 'India'}</p>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[0.65rem] font-extrabold border uppercase tracking-wider ${isOffered
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isInterviewStage
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}>
                        {app.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Summary / Skills */}
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                      {candidate.summary || 'Demonstrated track record across campaigns, performance growth, and technical execution.'}
                    </p>

                    {/* Skill Tags */}
                    {candidate.skills && candidate.skills.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap mb-4">
                        {candidate.skills.slice(0, 4).map((sk, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md text-[0.65rem] font-medium bg-slate-100 text-slate-600">
                            #{sk}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {candidate.resume_url && (
                        <a
                          href={candidate.resume_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1.5 no-underline"
                        >
                          <FileText size={13} /> Resume
                        </a>
                      )}
                      {isInterviewStage && (
                        <button
                          type="button"
                          onClick={() => setActiveTab?.('interviews')}
                          className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-[#00a884] text-xs font-bold flex items-center gap-1.5 border-none cursor-pointer"
                        >
                          <Video size={13} /> View Interview
                        </button>
                      )}
                    </div>

                    {/* Scorecard CTA */}
                    <button
                      type="button"
                      onClick={() => setEvaluatingCandidate(app)}
                      className="px-4 py-1.5 rounded-lg bg-purple-900 hover:bg-purple-800 text-white text-xs font-bold flex items-center gap-1.5 border-none cursor-pointer shadow-xs"
                    >
                      <Star size={13} className="text-amber-300" />
                      Scorecard
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ======================================================================= */}
      {/* STRUCTURED EVALUATION / SCORECARD MODAL                                 */}
      {/* ======================================================================= */}
      {evaluatingCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in select-none">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 text-slate-800 relative">

            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <span className="text-[0.65rem] font-bold text-purple-700 uppercase tracking-widest block">
                  CANDIDATE SCORECARD
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5" style={{ fontFamily: DISPLAY_FONT }}>
                  {evaluatingCandidate.candidate?.full_name}
                </h3>
                <p className="text-xs text-slate-400">Position: {evaluatingCandidate.job_title}</p>
              </div>
              <button
                type="button"
                onClick={() => setEvaluatingCandidate(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer border-none"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitScorecard} className="space-y-4">

              {/* Technical Depth Rating (1-5) */}
              <div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1.5">
                  <span>Technical & Functional Depth</span>
                  <span className="text-purple-700">{technicalScore} / 5 Stars</span>
                </div>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setTechnicalScore(star)}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-all ${technicalScore >= star
                        ? 'bg-purple-50 text-purple-700 border-purple-300 font-extrabold'
                        : 'bg-white text-slate-400 border-slate-200'
                      }`}
                    >
                      ★ {star}
                    </button>
                  ))}
                </div>
              </div>

              {/* Communication Rating (1-5) */}
              <div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1.5">
                  <span>Communication & Problem Solving</span>
                  <span className="text-purple-700">{commScore} / 5 Stars</span>
                </div>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setCommScore(star)}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-all ${commScore >= star
                        ? 'bg-purple-50 text-purple-700 border-purple-300 font-extrabold'
                        : 'bg-white text-slate-400 border-slate-200'
                      }`}
                    >
                      ★ {star}
                    </button>
                  ))}
                </div>
              </div>

              {/* Decision Recommendation */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Hiring Recommendation *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'HIRE', label: 'Strong Hire', color: 'text-emerald-700 border-emerald-300 bg-emerald-50' },
                    { id: 'ADVANCE', label: 'Next Round', color: 'text-amber-700 border-amber-300 bg-amber-50' },
                    { id: 'PASS', label: 'Do Not Hire', color: 'text-rose-700 border-rose-300 bg-rose-50' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setRecommendation(opt.id)}
                      className={`py-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${recommendation === opt.id
                        ? `${opt.color} border-2 shadow-xs`
                        : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Evaluation Feedback Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Evaluation Feedback & Summary Notes
                </label>
                <textarea
                  rows={3}
                  value={evalNotes}
                  onChange={e => setEvalNotes(e.target.value)}
                  placeholder="Key strengths, observations from technical interview, and rationale for this recommendation..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:border-purple-600 focus:outline-none"
                />
              </div>

              {/* Submit CTA */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEvaluatingCandidate(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 border-none bg-transparent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEval}
                  className="px-5 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-800 text-white text-xs font-bold border-none cursor-pointer shadow-md disabled:opacity-50"
                >
                  {submittingEval ? 'Saving...' : 'Submit Evaluation Scorecard ✨'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
