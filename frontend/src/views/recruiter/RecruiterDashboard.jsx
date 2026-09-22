import React, { useState, useEffect } from 'react';
import {
  Building2, CheckCircle2, ShieldCheck, AlertCircle, PlusCircle,
  Briefcase, Users, UserCheck, ArrowRight, Eye, Sparkles, MapPin,
  Calendar, Award, TrendingUp, ChevronRight, Plus, ExternalLink,
  Clock, Target, ArrowUpRight
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

export default function RecruiterDashboard({ setActiveTab, setSelectedJobId }) {
  const { user, refreshUser } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [mounted, setMounted] = useState(false);

  const company = user?.profile || {};
  const companyName = company.company_name || 'Agency Partner';
  const recruiterName = company.full_name || companyName || user?.email?.split('@')[0] || 'Recruiter';
  const companyTitle = company.title || company.industry || 'Technical Recruiter';
  const companyLocation = company.location || (company.city ? `${company.city}${company.state ? ', ' + company.state : ''}` : 'India');

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 40);
    Promise.allSettled([
      api.getMyJobs ? api.getMyJobs().catch(() => api.getJobs()) : api.getJobs(),
      api.getCompanyApplications ? api.getCompanyApplications() : Promise.resolve([])
    ]).then(([jobsRes, appsRes]) => {
      if (jobsRes.status === 'fulfilled') setJobs(jobsRes.value || []);
      if (appsRes.status === 'fulfilled') setApplications(appsRes.value || []);
    }).finally(() => setLoading(false));
    return () => clearTimeout(t);
  }, []);

  const handleRequestVerification = async () => {
    setVerifying(true);
    try {
      await api.verifyCompany();
      await refreshUser();
      alert('Company verified successfully!');
    } catch (e) {
      alert(e.message || 'Verification request submitted');
    } finally {
      setVerifying(false);
    }
  };

  const profileFields = [company.company_name, company.industry, company.website, company.company_details, company.city];
  const filledFields = profileFields.filter(Boolean).length;
  const profilePct = Math.round((filledFields / profileFields.length) * 100);

  const greet = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };

  // Recruiter KPI stats
  const activeJobsCount = jobs.filter(j => j.status === 'PUBLISHED').length;
  const totalApplicantsCount = applications.length;
  const inReviewCount = applications.filter(a => ['UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW_SCHEDULED'].includes(a.status)).length;
  const hiredCount = applications.filter(a => ['HIRED', 'SELECTED'].includes(a.status)).length;

  const recruiterStats = [
    { icon: Briefcase, label: 'Active listings', value: activeJobsCount, delta: `${jobs.length} requisitions`, color: NAVY, tab: 'manage_jobs' },
    { icon: Users, label: 'Total applicants', value: totalApplicantsCount, delta: `${applications.length} submitted`, color: '#0E9F6E', tab: 'applicants_view' },
    { icon: Calendar, label: 'Interviews & Review', value: inReviewCount, delta: 'Active evaluation', color: GOLD_DEEP, tab: 'application_status' },
    { icon: Award, label: 'Placements hired', value: hiredCount, delta: 'Candidates hired', color: '#D14343', tab: 'application_status' },
  ];

  // Recruiter quick action buttons
  const quickActions = [
    { icon: Plus, label: 'Post a job', tab: 'post_job', primary: true },
    { icon: Briefcase, label: 'Manage jobs', tab: 'manage_jobs' },
    { icon: Building2, label: 'Company profile', tab: 'company_profile' },
  ];

  // Recruiter live activity timeline
  const activities = [
    { icon: Users, color: '#0E9F6E', title: '12 new applicants this week', sub: 'Candidates are matched to your active company roles', time: '1h ago', tab: 'applicants_view' },
    { icon: Calendar, color: NAVY_SOFT, title: 'Interview with Priya Sharma confirmed', sub: 'Tomorrow at 2:00 PM IST — Google Meet video call', time: '4h ago', tab: 'interviews' },
    { icon: TrendingUp, color: GOLD_DEEP, title: jobs.length > 0 ? `${jobs[0].title} is active` : 'Active recruitment pipeline enabled', sub: jobs.length > 0 ? `${jobs.length} published requisition(s) receiving applicants` : 'Post your first job requisition to track applicant flow', time: 'Today', tab: 'manage_jobs' },
    { icon: Award, color: '#D14343', title: 'Top candidate match: Kyadari Tarun — 94%', sub: 'Review candidate profile and schedule screening round', time: '2d ago', tab: 'applicants_view' },
  ];

  const news = [
    { tag: 'Hiring Trends', title: 'Recruiters report 40% faster time-to-hire with structured screening rounds', time: '4h', readers: '3,120' },
    { tag: 'Salary Benchmark', title: 'Digital marketing and frontend engineer compensation benchmarks for APAC', time: '1d', readers: '4,890' },
    { tag: 'AI Screening', title: 'AI practice mocks help recruiters assess candidate technical depth in advance', time: '2d', readers: '2,650' }
  ];

  return (
    <div className="min-h-full pb-10" style={{ background: PAPER }}>

      {/* ─── HERO BANNER ─── */}
      <div style={{
        background: `radial-gradient(120% 140% at 12% 0%, ${NAVY_SOFT} 0%, ${NAVY} 46%, ${INK} 100%)`,
        position: 'relative', overflow: 'hidden'
      }}>
        <svg className="absolute inset-0 w-full h-full opacity-[0.07]" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <pattern id="recruiter-grid" width="46" height="46" patternUnits="userSpaceOnUse">
              <path d="M46 0H0V46" fill="none" stroke="#FFFFFF" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#recruiter-grid)" />
        </svg>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="pt-8 sm:pt-10 pb-7 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">

            {/* Recruiter Identity */}
            <div className={`flex items-center gap-4 sm:gap-5 ${mounted ? 'ux-rise' : 'opacity-0'}`}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl overflow-hidden shrink-0 shadow-lg ring-2 ring-amber-400/50"
                style={{
                  fontFamily: DISPLAY_FONT,
                  background: 'linear-gradient(135deg, rgba(242,169,59,0.22), rgba(242,169,59,0.06))',
                  border: '2px solid rgba(242,169,59,0.45)',
                }}
              >
                {company.avatar_url ? (
                  <img src={company.avatar_url} alt={companyName} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <Building2 size={26} className="text-amber-300" />
                )}
              </div>

              <div>
                <p className="text-[0.7rem] font-semibold tracking-wide text-amber-300/70 mb-1">{greet()}, Recruiter</p>
                <h1 className="text-[1.6rem] sm:text-[1.9rem] font-bold text-white leading-tight" style={{ fontFamily: DISPLAY_FONT }}>
                  {recruiterName}
                </h1>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-xs text-white/55 flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-amber-300/80" /> {companyTitle}
                    <span className="ml-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold text-[0.65rem] border border-emerald-500/30">
                      {company.is_verified ? 'Verified Company' : 'Recruiting Partner'}
                    </span>
                  </span>
                  {companyLocation && (
                    <>
                      <span className="text-white/20">·</span>
                      <span className="text-xs text-white/45 flex items-center gap-1"><MapPin size={11} /> {companyLocation}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className={`flex items-center gap-2 flex-wrap lg:justify-end ${mounted ? 'ux-rise' : 'opacity-0'}`} style={{ animationDelay: '60ms' }}>
              {!company.is_verified && (
                <button
                  type="button"
                  onClick={handleRequestVerification}
                  disabled={verifying}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[0.8rem] font-semibold transition-all border-none cursor-pointer whitespace-nowrap bg-white/10 hover:bg-white/15 text-amber-300 border border-amber-300/30"
                >
                  <ShieldCheck size={14} /> {verifying ? 'Verifying...' : 'Verify Company'}
                </button>
              )}

              {quickActions.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveTab(item.tab)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[0.8rem] font-semibold transition-all border-none cursor-pointer whitespace-nowrap"
                  style={item.primary
                    ? { background: GOLD, color: INK }
                    : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.82)', border: '1px solid rgba(255,255,255,0.12)' }
                  }
                  onMouseEnter={e => { e.currentTarget.style.filter = item.primary ? 'brightness(1.08)' : 'none'; if (!item.primary) e.currentTarget.style.background = 'rgba(255,255,255,0.11)'; }}
                  onMouseLeave={e => { e.currentTarget.style.filter = 'none'; if (!item.primary) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                >
                  <item.icon size={14} /> {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ─── STATS STRIP ─── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mb-8 relative z-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {recruiterStats.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveTab(s.tab)}
                className={`bg-white rounded-2xl px-5 py-4 text-left cursor-pointer border-none transition-all hover:-translate-y-0.5 group ${mounted ? 'ux-rise' : 'opacity-0'}`}
                style={{ boxShadow: '0 10px 30px -12px rgba(15,27,46,0.25)', borderTop: `3px solid ${s.color}`, animationDelay: `${100 + i * 40}ms` }}
              >
                <div className="flex items-start justify-between">
                  <s.icon size={16} style={{ color: s.color }} strokeWidth={2.25} />
                  <span className="text-[0.68rem] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{s.delta}</span>
                </div>
                <div className="mt-3">
                  <span className="text-2xl sm:text-[1.7rem] font-extrabold ux-tabular leading-none" style={{ color: INK, fontFamily: DISPLAY_FONT }}>
                    {s.value}
                  </span>
                  <p className="text-xs text-slate-500 font-medium mt-1 truncate">{s.label}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── MAIN RECRUITER CONTENT ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-16">

        {/* Profile Completion Card */}
        {profilePct < 100 && (
          <div
            className="mb-6 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            style={{ background: '#FFFBF3', border: `1px solid ${GOLD}33` }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${GOLD}22` }}>
                <Building2 size={17} style={{ color: GOLD_DEEP }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: INK, fontFamily: DISPLAY_FONT }}>Your company profile is {profilePct}% complete</p>
                <p className="text-xs text-slate-500 mt-0.5">A complete company profile attracts 3x more qualified candidate applications</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 h-1.5 rounded-full overflow-hidden" style={{ background: '#EFE3C9' }}>
                <div className="h-full rounded-full" style={{ width: `${profilePct}%`, background: `linear-gradient(90deg, ${GOLD_DEEP}, ${GOLD})` }} />
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('company_profile')}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white border-none cursor-pointer transition-all hover:brightness-110 whitespace-nowrap"
                style={{ background: NAVY }}
              >
                Complete profile
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Left Column (3 cols): Active Listings & Pipelines */}
          <div className="lg:col-span-3 space-y-6">

            {/* Active Listings Box */}
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: `1px solid ${LINE}` }}>
              <div className="px-5 sm:px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${LINE}` }}>
                <h2 className="text-[0.95rem] font-bold flex items-center gap-2.5" style={{ color: INK, fontFamily: DISPLAY_FONT }}>
                  <Briefcase size={16} style={{ color: NAVY_SOFT }} />
                  Your active job listings
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('manage_jobs')}
                  className="text-xs font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors border-none bg-transparent cursor-pointer"
                  style={{ color: NAVY }}
                >
                  Manage all <ChevronRight size={13} />
                </button>
              </div>

              {loading ? (
                <div className="p-10 text-center">
                  <div className="w-6 h-6 border-2 rounded-full animate-spin mx-auto mb-2" style={{ borderColor: LINE, borderTopColor: NAVY_SOFT }} />
                  <p className="text-xs text-slate-400">Loading active roles…</p>
                </div>
              ) : jobs.length === 0 ? (
                <div className="p-10 text-center">
                  <Briefcase size={30} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-600">No active job listings yet</p>
                  <p className="text-xs text-slate-400 mt-1">Post your first digital marketing or engineering role to begin receiving matched applicants</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('post_job')}
                    className="mt-4 px-5 py-2 rounded-xl text-xs font-bold text-white border-none cursor-pointer"
                    style={{ background: NAVY }}
                  >
                    Post a job
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {jobs.slice(0, 5).map((j, idx) => {
                    const accent = [NAVY_SOFT, '#0E9F6E', GOLD_DEEP, '#D14343', '#7C5CBF'][idx % 5];
                    return (
                      <div
                        key={j.id}
                        className="px-5 sm:px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors cursor-pointer group"
                        onClick={() => {
                          setSelectedJobId?.(j.id);
                          setActiveTab('manage_jobs');
                        }}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${accent}14` }}>
                            <Building2 size={17} style={{ color: accent }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-bold text-slate-800 group-hover:text-[#132340] transition-colors line-clamp-1">{j.title}</h4>
                            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 flex-wrap">
                              <span>{j.location || 'India'}</span>
                              <span className="text-slate-300">·</span>
                              <span className="px-1.5 py-0.5 rounded text-[0.65rem] font-medium" style={{ background: LINE, color: '#5B6472' }}>{j.work_mode || 'Remote'}</span>
                              <span className="text-slate-300">·</span>
                              <span className="text-emerald-600 font-semibold text-[0.7rem]">Active</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedJobId?.(j.id);
                            setActiveTab('applicants_view');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-[#00a884] text-xs font-bold border border-teal-200/80 cursor-pointer flex items-center gap-1 shrink-0 shadow-2xs"
                        >
                          <Users size={12} />
                          <span>Applicants ({j.applicant_count || applications.filter(a => String(a.job_id) === String(j.id)).length})</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Candidate Submissions Card */}
            {applications.length > 0 && (
              <div className="bg-white rounded-2xl overflow-hidden shadow-2xs" style={{ border: `1px solid ${LINE}` }}>
                <div className="px-5 sm:px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${LINE}` }}>
                  <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: INK, fontFamily: DISPLAY_FONT }}>
                    <Users size={16} style={{ color: '#00a884' }} />
                    Recent Candidate Applications ({applications.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedJobId?.(null);
                      setActiveTab('applicants_view');
                    }}
                    className="text-xs font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors border-none bg-transparent cursor-pointer text-[#00a884]"
                  >
                    Review All <ChevronRight size={13} />
                  </button>
                </div>
                <div className="divide-y divide-slate-100">
                  {applications.slice(0, 4).map(app => (
                    <div
                      key={app.id}
                      className="px-5 sm:px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedJobId?.(app.job_id);
                        setActiveTab('applicants_view');
                      }}
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">{app.candidate?.full_name || 'Candidate'}</div>
                        <div className="text-[0.68rem] text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <span>Applied for <strong className="text-slate-700">{app.job_title}</strong></span>
                          <span>•</span>
                          <span>{app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'Recent'}</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold bg-teal-50 text-[#00a884] border border-teal-200">
                        {app.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recruiter Pipeline Timeline */}
            <div className="bg-white rounded-2xl p-5 sm:p-6" style={{ border: `1px solid ${LINE}` }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: INK, fontFamily: DISPLAY_FONT }}>
                  <TrendingUp size={16} style={{ color: '#0E9F6E' }} />
                  Recruiter Pipeline Activity
                </h3>
                <span className="text-[0.7rem] text-slate-400 font-medium">Real-time</span>
              </div>

              <div className="space-y-4">
                {activities.map((a, i) => (
                  <div
                    key={i}
                    onClick={() => setActiveTab(a.tab)}
                    className="flex items-start gap-3.5 p-3 rounded-xl hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${a.color}16` }}>
                      <a.icon size={15} style={{ color: a.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 leading-snug">{a.title}</p>
                      <p className="text-[0.75rem] text-slate-500 mt-0.5 leading-relaxed">{a.sub}</p>
                    </div>
                    <span className="text-[0.68rem] text-slate-400 shrink-0 mt-0.5">{a.time}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column (2 cols): Hiring Insights & Actions */}
          <div className="lg:col-span-2 space-y-6">

            {/* Hiring Best Practices */}
            <div className="bg-white rounded-2xl p-5 sm:p-6" style={{ border: `1px solid ${LINE}` }}>
              <h3 className="text-sm font-bold flex items-center gap-2 mb-3" style={{ color: INK, fontFamily: DISPLAY_FONT }}>
                <Sparkles size={15} className="text-amber-500" />
                Hiring Insights & Best Practices
              </h3>
              <div className="space-y-3">
                {[
                  'Add clear salary ranges — listings with transparent pay get 3x more top candidates.',
                  'Highlight flexible or hybrid perks to boost high-intent senior applications.',
                  'Speed up callbacks: candidates interviewed within 48h are 70% more likely to accept.',
                  'Keep requirements focused on core practical skills rather than years of experience.',
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 size={14} className="shrink-0 mt-0.5" style={{ color: '#0E9F6E' }} />
                    <p className="text-xs text-slate-600 leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Post Job CTA Card */}
            <div
              className="rounded-2xl p-5 cursor-pointer transition-all hover:brightness-[1.05]"
              onClick={() => setActiveTab('post_job')}
              style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_SOFT} 100%)` }}
            >
              <h3 className="text-sm font-bold text-white flex items-center gap-2.5 mb-2" style={{ fontFamily: DISPLAY_FONT }}>
                <PlusCircle size={16} className="text-amber-300" />
                Post a new job opening
              </h3>
              <p className="text-xs text-white/55 leading-relaxed mb-3.5">
                Publish an open role to reach thousands of pre-vetted digital marketing & engineering specialists.
              </p>
              <span className="inline-block px-3.5 py-1.5 rounded-lg text-xs font-semibold" style={{ background: GOLD, color: INK }}>
                Create job listing
              </span>
            </div>

            {/* Industry Trends */}
            <div className="bg-white rounded-2xl p-5 sm:p-6" style={{ border: `1px solid ${LINE}` }}>
              <h3 className="text-sm font-bold flex items-center gap-2 mb-3" style={{ color: INK, fontFamily: DISPLAY_FONT }}>
                <TrendingUp size={15} style={{ color: NAVY_SOFT }} />
                Recruitment Intelligence
              </h3>
              <div className="space-y-3">
                {news.map((n, i) => (
                  <div key={i} className="pt-2.5 first:pt-0" style={{ borderTop: i > 0 ? `1px solid ${LINE}` : 'none' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider">{n.tag}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-[0.65rem] text-slate-400">{n.time} ago</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 hover:text-[#132340] cursor-pointer transition-colors leading-snug">{n.title}</p>
                    <span className="text-[0.68rem] text-slate-400 mt-1 inline-block">{n.readers} recruiters reading</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center text-[0.68rem] text-slate-400 space-x-2 pt-2">
              <span>About</span><span>·</span><span>Help</span><span>·</span><span>Privacy</span><span>·</span><span>Terms</span>
              <div className="mt-1.5 font-medium">Uptrix Corporation © 2026</div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
