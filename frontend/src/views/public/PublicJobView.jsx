import React, { useState, useEffect } from 'react';
import {
  Building2, MapPin, Briefcase, DollarSign, Clock, CheckCircle2,
  Share2, ArrowLeft, ArrowUpRight, ShieldCheck, Target, Layers,
  Users, Sparkles, AlertCircle, Loader2, Send, ChevronRight
} from 'lucide-react';
import { api } from '../../api';
import ShareJobModal from '../../components/ShareJobModal';

export default function PublicJobView({ jobId, onNavigateToAuth, onBackToLanding }) {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareModalOpen, setShareModalOpen] = useState(false);

  useEffect(() => {
    if (!jobId) {
      setError('No job specified');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    api.getJobById(jobId)
      .then((data) => {
        setJob(data);
      })
      .catch((err) => {
        console.error('Error fetching public job:', err);
        setError(err.message || 'Job opening not found or has been closed.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [jobId]);

  const handleApplyClick = () => {
    // Save intended job in session storage for post-login auto-application / opening
    if (job?.id) {
      try {
        sessionStorage.setItem('uptrix_pending_apply_job_id', String(job.id));
      } catch (e) {}
    }
    // Redirect unauthenticated user to login / candidate auth page
    if (onNavigateToAuth) {
      onNavigateToAuth('login_candidate');
    } else {
      window.location.href = '/login/candidate';
    }
  };

  const company = job?.company || {};
  const companyName = company.company_name || 'Hiring Organization';
  const compInitial = companyName.charAt(0).toUpperCase();

  // Format compensation display
  const salaryText = (job?.salary_min && job?.salary_max)
    ? `${job.salary_currency === 'INR' ? '₹' : '$'}${job.salary_min.toLocaleString()} - ${job.salary_currency === 'INR' ? '₹' : '$'}${job.salary_max.toLocaleString()} / yr`
    : (job?.salary_min ? `${job.salary_currency === 'INR' ? '₹' : '$'}${job.salary_min.toLocaleString()} / yr` : 'Competitive Compensation');

  return (
    <div className="min-h-screen bg-[#F6F7FB] text-slate-800 font-sans flex flex-col">
      {/* Top Public Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <a
            href="/"
            onClick={(e) => {
              if (onBackToLanding) {
                e.preventDefault();
                onBackToLanding();
              }
            }}
            className="flex items-center gap-2 group cursor-pointer text-decoration-none"
          >
            <img
              src="/logo.svg"
              alt="Uptrix Platform"
              className="h-8 w-auto object-contain"
            />
          </a>
          <span className="hidden sm:inline-block text-xs font-semibold text-slate-400 border-l border-slate-200 pl-3">
            Recruitment Portal
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigateToAuth?.('login')}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200/80 bg-white cursor-pointer shadow-2xs"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => onNavigateToAuth?.('register_candidate')}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#FF7043] hover:bg-[#E65B30] transition-all cursor-pointer shadow-xs border-none"
          >
            Join as Candidate
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm font-medium">Loading position specifications...</p>
          </div>
        ) : error ? (
          <div className="max-w-lg mx-auto py-16 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center border border-rose-100">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Job Not Found</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              {error} The opening may have been filled or expired.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onNavigateToAuth?.('login_candidate')}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer border-none"
              >
                Sign In to Explore All Openings
              </button>
            </div>
          </div>
        ) : job ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Top Navigation Back */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (onBackToLanding) onBackToLanding();
                  else window.location.href = '/';
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors bg-transparent border-none cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to All Openings</span>
              </button>

              <button
                type="button"
                onClick={() => setShareModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Share Opening</span>
              </button>
            </div>

            {/* Hero Job Banner */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white font-black text-2xl flex items-center justify-center shrink-0 shadow-md border border-slate-100">
                    {company.logo_url ? (
                      <img src={company.logo_url} alt={companyName} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      compInitial
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#00a884] bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/50">
                        Active Opening
                      </span>
                      {company.is_verified && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          <ShieldCheck className="w-3 h-3" /> Verified Employer
                        </span>
                      )}
                      {job.group_name && (
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          {job.group_name}
                        </span>
                      )}
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                      {job.title}
                    </h1>
                    <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {companyName}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {job.location || 'Remote / Flexible'}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1 text-slate-500 font-medium">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                        {job.work_mode || 'Flexible'} • {job.job_type || 'Full-Time'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Apply CTA Block */}
                <div className="flex sm:flex-col items-center sm:items-end gap-3 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <button
                    type="button"
                    onClick={handleApplyClick}
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#FF7043] hover:bg-[#E65B30] text-white font-bold text-sm shadow-[0_2px_8px_rgba(255,112,67,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer border-none active:scale-[0.98]"
                  >
                    <Send className="w-4 h-4" />
                    <span>Apply Now</span>
                  </button>
                  <p className="text-[11px] text-slate-400 font-medium hidden sm:block text-right">
                    Requires free candidate sign-in
                  </p>
                </div>
              </div>

              {/* Quick Specs Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
                <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100/70">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> Compensation
                  </span>
                  <div className="text-xs font-extrabold text-emerald-900 mt-1 truncate">
                    {salaryText}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Availability
                  </span>
                  <div className="text-xs font-bold text-slate-800 mt-1 truncate">
                    {job.availability_requirement || 'Immediate to 30 days'}
                  </div>
                </div>

                <div className="p-3 bg-purple-50/70 rounded-2xl border border-purple-100/70">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1">
                    <Target className="w-3 h-3" /> Experience / Level
                  </span>
                  <div className="text-xs font-bold text-purple-900 mt-1 truncate">
                    {job.min_experience ? `${job.min_experience} Experience` : (job.experience_level || 'Mid Level')}
                  </div>
                </div>

                <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-100/70">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1">
                    <Layers className="w-3 h-3" /> Track
                  </span>
                  <div className="text-xs font-bold text-amber-900 mt-1 truncate">
                    {job.specialization || job.ownership_level || 'General Marketing'}
                  </div>
                </div>
              </div>
            </div>

            {/* Two Column Layout: Main Content + Right Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column (2 Cols) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Description */}
                <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-sm space-y-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    <span>Role Overview & Responsibilities</span>
                  </h3>
                  <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line space-y-2">
                    {job.description || 'No detailed description provided.'}
                  </div>
                </div>

                {/* Capabilities & Requirements */}
                {(job.must_have_capabilities || job.preferred_capabilities) && (
                  <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-sm space-y-4">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Target className="w-4 h-4 text-emerald-600" />
                      <span>Requirements & Capabilities</span>
                    </h3>

                    {job.must_have_capabilities && (
                      <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/60">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block mb-1">
                          Must-Have Capabilities
                        </span>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed m-0 whitespace-pre-line">
                          {job.must_have_capabilities}
                        </p>
                      </div>
                    )}

                    {job.preferred_capabilities && (
                      <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-200/60">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 block mb-1">
                          Preferred / Nice-to-Have
                        </span>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed m-0 whitespace-pre-line">
                          {job.preferred_capabilities}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Required Skills Badges */}
                {Array.isArray(job.skills) && job.skills.length > 0 && (
                  <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-sm space-y-3">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span>Required Skills & Tooling</span>
                    </h3>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {job.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Screening & Interview Process Overview */}
                {(Array.isArray(job.interview_rounds) && job.interview_rounds.length > 0) && (
                  <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-sm space-y-3">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>Selection Stages</span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      The hiring team has configured a streamlined {job.interview_rounds.length}-stage evaluation process:
                    </p>
                    <div className="space-y-2 pt-1">
                      {job.interview_rounds.map((round, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                          <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[11px] shrink-0">
                            {i + 1}
                          </span>
                          <span className="font-semibold text-slate-800">
                            {typeof round === 'string' ? round : round.name || `Interview Round ${i + 1}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Sidebar (1 Col) */}
              <div className="space-y-6">
                {/* Apply CTA Card */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-6 shadow-md space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
                      Take the next step
                    </span>
                    <h4 className="text-lg font-bold text-white leading-snug">
                      Ready to apply for this position?
                    </h4>
                    <p className="text-xs text-blue-100 leading-relaxed font-normal">
                      Submit your candidate profile, portfolio, and screening details directly to the hiring manager.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyClick}
                    className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 text-blue-900 font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border-none active:scale-[0.98]"
                  >
                    <span>Sign In & Apply</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <div className="pt-2 border-t border-white/20 text-center">
                    <p className="text-[11px] text-blue-100 m-0">
                      New to Uptrix?{' '}
                      <button
                        type="button"
                        onClick={() => onNavigateToAuth?.('register_candidate')}
                        className="font-bold underline text-white bg-transparent border-none cursor-pointer p-0"
                      >
                        Create free profile
                      </button>
                    </p>
                  </div>
                </div>

                {/* Company Card */}
                <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    About The Employer
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center shrink-0">
                      {compInitial}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900">{companyName}</div>
                      <div className="text-[11px] text-slate-500">{company.industry || 'Digital Marketing'}</div>
                    </div>
                  </div>
                  {company.about && (
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {company.about}
                    </p>
                  )}
                  {company.website && (
                    <a
                      href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline pt-1"
                    >
                      <span>Visit Company Website</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {/* Social Share Card */}
                <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-3 text-center">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Know someone who fits?</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Share this requisition directly via WhatsApp, LinkedIn, or Twitter.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShareModalOpen(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Share with Network
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {/* Share Modal */}
      {shareModalOpen && job && (
        <ShareJobModal job={job} onClose={() => setShareModalOpen(false)} />
      )}
    </div>
  );
}
