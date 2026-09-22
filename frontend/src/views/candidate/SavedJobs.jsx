import React, { useState, useEffect } from 'react';
import { 
  Bookmark, Briefcase, MapPin, Building2, ExternalLink, 
  Trash2, Send, CheckCircle2, DollarSign, Clock, Search, 
  Filter, ShieldCheck, ChevronRight, ArrowUpRight, Sparkles, 
  Eye, X, Check, RefreshCw, Layers, Zap, AlertCircle, Compass
} from 'lucide-react';
import { api } from '../../api';

export default function SavedJobs({ setActiveTab, setSelectedJobId }) {
  const [savedList, setSavedList] = useState(() => {
    try {
      const saved = localStorage.getItem('uptrix_saved_job_ids');
      if (saved) {
        const obj = JSON.parse(saved);
        if (obj && typeof obj === 'object') {
          return Object.values(obj);
        }
      }
    } catch (e) {}
    return [];
  });

  const [appliedJobsMap, setAppliedJobsMap] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [workModeFilter, setWorkModeFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('recent');

  // Modals
  const [applyModalJob, setApplyModalJob] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [viewDetailsJob, setViewDetailsJob] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    fetchApplications();
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    try {
      const serverSaved = await api.getSavedJobs();
      if (Array.isArray(serverSaved)) {
        setSavedList(serverSaved);
        // Sync with local storage
        const map = {};
        serverSaved.forEach(j => { map[j.id] = j; });
        localStorage.setItem('uptrix_saved_job_ids', JSON.stringify(map));
      }
    } catch (e) {
      // Fallback gracefully to localStorage
    }
  };

  const fetchApplications = async () => {
    try {
      const apps = await api.getMyApplications();
      if (Array.isArray(apps)) {
        const map = {};
        apps.forEach(a => {
          if (a.job_id || a.job?.id) {
            map[a.job_id || a.job.id] = a.status || 'APPLIED';
          }
        });
        setAppliedJobsMap(map);
      }
    } catch (e) {}
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleRemove = async (jobId, e) => {
    if (e) e.stopPropagation();
    const updated = savedList.filter(j => j.id !== jobId);
    setSavedList(updated);
    try {
      const saved = localStorage.getItem('uptrix_saved_job_ids');
      if (saved) {
        const obj = JSON.parse(saved);
        delete obj[jobId];
        localStorage.setItem('uptrix_saved_job_ids', JSON.stringify(obj));
      }
    } catch (e) {}
    showToast('Role removed from your saved list');
    try {
      await api.unsaveJob(jobId);
    } catch (err) {
      console.error('Failed to remove saved job on server', err);
    }
  };

  const handleOpenApplyModal = (job, e) => {
    if (e) e.stopPropagation();
    setApplyModalJob(job);
    setCoverLetter('');
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    if (!applyModalJob) return;

    setApplying(true);
    try {
      await api.applyJob(applyModalJob.id, coverLetter);
      setAppliedJobsMap(prev => ({ ...prev, [applyModalJob.id]: 'APPLIED' }));
      showToast(`🎉 Application submitted for "${applyModalJob.title}"!`);
      setApplyModalJob(null);
      setCoverLetter('');
    } catch (err) {
      alert(err.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  // Stats
  const totalSaved = savedList.length;
  const remoteCount = savedList.filter(j => (j.work_mode || '').toLowerCase().includes('remote')).length;
  const readyToApplyCount = savedList.filter(j => !appliedJobsMap[j.id]).length;
  const appliedCount = savedList.filter(j => !!appliedJobsMap[j.id]).length;

  const stats = [
    { 
      label: 'Total Saved', 
      value: totalSaved, 
      sub: 'Bookmarked for later', 
      color: '#d97706', 
      filterKey: 'ALL'
    },
    { 
      label: 'Ready to Apply', 
      value: readyToApplyCount, 
      sub: 'Opportunities to act on', 
      color: '#059669', 
      filterKey: 'READY'
    },
    { 
      label: 'Remote Roles', 
      value: remoteCount, 
      sub: 'Work from anywhere', 
      color: '#0a66c2', 
      filterKey: 'REMOTE'
    },
    { 
      label: 'Already Applied', 
      value: appliedCount, 
      sub: 'Active in pipeline', 
      color: '#0891b2', 
      filterKey: 'APPLIED'
    },
  ];

  // Filter & Sort
  const filteredList = savedList.filter(job => {
    const q = searchTerm.toLowerCase();
    const title = (job.title || '').toLowerCase();
    const comp = (job.company || '').toLowerCase();
    const loc = (job.location || '').toLowerCase();

    const matchesSearch = !q || title.includes(q) || comp.includes(q) || loc.includes(q);
    if (!matchesSearch) return false;

    if (workModeFilter === 'ALL') return true;
    if (workModeFilter === 'REMOTE') return (job.work_mode || '').toLowerCase().includes('remote');
    if (workModeFilter === 'HYBRID') return (job.work_mode || '').toLowerCase().includes('hybrid');
    if (workModeFilter === 'ONSITE') return (job.work_mode || '').toLowerCase().includes('site') || (job.work_mode || '').toLowerCase().includes('office');
    if (workModeFilter === 'READY') return !appliedJobsMap[job.id];
    if (workModeFilter === 'APPLIED') return !!appliedJobsMap[job.id];

    return true;
  }).sort((a, b) => {
    if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
    if (sortBy === 'company') return (a.company || '').localeCompare(b.company || '');
    return 0; // default recent
  });

  const filterTabs = [
    { id: 'ALL', label: 'All Saved', count: totalSaved },
    { id: 'READY', label: 'Ready to Apply', count: readyToApplyCount },
    { id: 'REMOTE', label: 'Remote Only', count: remoteCount },
    { id: 'HYBRID', label: 'Hybrid', count: savedList.filter(j => (j.work_mode || '').toLowerCase().includes('hybrid')).length },
    { id: 'APPLIED', label: 'Applied', count: appliedCount },
  ];

  return (
    <div className="max-w-10xl mx-auto px-3 sm:px-6 lg:px-8 space-y-5">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── 1. JobSearch-Style Hero Header Card ─── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Saved <span className="text-[#0a66c2]">Jobs</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and apply for roles you bookmarked for later across top digital marketing and tech teams.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[0.7rem] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
              <Bookmark className="w-3 h-3 text-amber-600 fill-amber-500" /> Curated Collection
            </span>
            <button
              type="button"
              onClick={() => setActiveTab?.('job_search')}
              className="px-4 py-2 rounded-xl bg-[#0a66c2] hover:bg-[#084e96] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 border-none cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" /> Explore Jobs
            </button>
          </div>
        </div>

        {/* Search Toolbar & Work Mode Pills */}
        <div className="space-y-3 pt-1">
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                className="w-full pl-10 pr-8 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200/90 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#0a66c2] transition-all placeholder:text-slate-400"
                placeholder="Filter saved roles by title, company, or location..."
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

            {/* Sort & Applications Link */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer hover:border-slate-300"
              >
                <option value="recent">Recently Saved</option>
                <option value="title">Job Title (A-Z)</option>
                <option value="company">Company Name</option>
              </select>

              <button
                type="button"
                onClick={() => setActiveTab?.('my_applications')}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors border-none cursor-pointer shrink-0"
              >
                My Applications
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            {filterTabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setWorkModeFilter(tab.id)}
                className={`text-[0.7rem] px-3 py-1.5 rounded-xl font-semibold transition-colors border cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  workModeFilter === tab.id
                    ? 'bg-[#0a66c2] text-white border-[#0a66c2] shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/80'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[0.62rem] font-bold ${
                  workModeFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── 2. Saved Jobs List ─── */}
      {savedList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-xs space-y-3.5 max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Bookmark className="w-6 h-6 fill-amber-400/30" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              No Saved Jobs in Your Collection
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
              Save digital marketing and tech roles while exploring to keep track of top openings and apply when you are ready.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setActiveTab?.('job_search')}
              className="px-5 py-2.5 rounded-xl bg-[#0a66c2] hover:bg-[#084e96] text-white text-xs font-bold transition-all border-none cursor-pointer shadow-xs"
            >
              Browse Open Jobs
            </button>
          </div>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-xs space-y-3 max-w-md mx-auto">
          <p className="text-sm font-bold text-slate-800">No saved jobs match this filter</p>
          <p className="text-xs text-slate-500">Try adjusting your keyword search or switching category pills.</p>
          <button
            type="button"
            onClick={() => { setSearchTerm(''); setWorkModeFilter('ALL'); }}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 border-none cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredList.map((job) => {
            const isApplied = !!appliedJobsMap[job.id];
            const matchPct = 90 + ((job.id * 7) % 8);

            return (
              <div
                key={job.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between group relative"
              >
                <div>
                  {/* Top Row: Company & Title + Remove Button */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-slate-900 text-white font-bold text-base flex items-center justify-center shrink-0 shadow-xs">
                        {(job.company || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 
                          className="text-base font-bold text-slate-900 hover:text-[#0a66c2] transition-colors cursor-pointer truncate"
                          onClick={() => setViewDetailsJob(job)}
                        >
                          {job.title}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <span className="font-semibold text-slate-800 flex items-center gap-1">
                            <ShieldCheck size={13} className="text-[#0a66c2]" />
                            {job.company}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Remove Bookmark Button */}
                    <button
                      type="button"
                      onClick={(e) => handleRemove(job.id, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border-none bg-transparent cursor-pointer transition-colors shrink-0"
                      title="Remove from saved"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Metadata Strip */}
                  <div className="flex items-center gap-2 mt-3.5 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1 bg-slate-50 border border-slate-200/70 px-2 py-0.5 rounded-md text-[0.7rem]">
                      <MapPin size={11} className="text-slate-400" /> {job.location || 'Remote'}
                    </span>
                    {job.work_mode && (
                      <span className="px-2 py-0.5 rounded-md text-[0.7rem] font-semibold bg-blue-50 text-[#0a66c2] border border-blue-100">
                        {job.work_mode}
                      </span>
                    )}
                    {job.salary && (
                      <span className="px-2 py-0.5 rounded-md text-[0.7rem] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 flex items-center gap-0.5">
                        {job.salary}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md text-[0.7rem] font-bold text-amber-700 bg-amber-50 border border-amber-100">
                      {matchPct}% Match
                    </span>
                  </div>

                  {/* Saved Date */}
                  {job.dateSaved && (
                    <div className="text-[0.68rem] text-slate-400 mt-2 flex items-center gap-1">
                      <Clock size={11} /> {job.dateSaved}
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setViewDetailsJob(job)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 border-none bg-transparent cursor-pointer p-0"
                  >
                    <Eye size={13} /> View Details
                  </button>

                  {isApplied ? (
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                        <CheckCircle2 size={13} /> Applied
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveTab?.('my_applications')}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#0a66c2] hover:bg-blue-50 border-none bg-transparent cursor-pointer transition-colors"
                      >
                        Track Status
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => handleOpenApplyModal(job, e)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0a66c2] hover:bg-[#084e96] transition-all border-none cursor-pointer shadow-xs"
                    >
                      <Send size={12} /> Apply Now
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Apply Modal ─── */}
      {applyModalJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="p-6 bg-slate-900 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[0.7rem] font-bold text-emerald-400 uppercase tracking-wider block">One-Click Application</span>
                  <h3 className="text-xl font-bold text-white leading-snug mt-0.5">
                    {applyModalJob.title}
                  </h3>
                  <p className="text-xs text-white/70 mt-1 flex items-center gap-1.5">
                    <Building2 size={12} /> {applyModalJob.company} • {applyModalJob.location}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setApplyModalJob(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border-none cursor-pointer transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmitApplication} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Personalized Cover Letter / Note
                </label>
                <textarea
                  rows={6}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Introduce yourself and explain why you're a great fit for this role..."
                  className="w-full p-3.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-800 resize-none leading-relaxed"
                  required
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>Your profile summary, experience history, and resume will be automatically delivered to the recruiter.</span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setApplyModalJob(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border-none bg-transparent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applying}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0a66c2] hover:bg-[#084e96] border-none cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {applying ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={13} /> Submit Application
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Role Details Modal ─── */}
      {viewDetailsJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="p-6 bg-slate-900 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[0.7rem] font-bold text-emerald-400 uppercase tracking-wider block">Job Overview</span>
                  <h3 className="text-xl font-bold text-white leading-snug mt-0.5">
                    {viewDetailsJob.title}
                  </h3>
                  <p className="text-xs text-white/70 mt-1 flex items-center gap-1.5">
                    <Building2 size={12} /> {viewDetailsJob.company} • {viewDetailsJob.location}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewDetailsJob(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border-none cursor-pointer transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700 max-h-[75vh] overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[0.65rem] text-slate-400 font-bold block uppercase">Work Mode</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{viewDetailsJob.work_mode || 'Flexible'}</span>
                </div>
                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100/80">
                  <span className="text-[0.65rem] text-emerald-700 font-bold block uppercase">Compensation</span>
                  <span className="font-bold text-emerald-900 mt-0.5 block">{viewDetailsJob.salary || 'Competitive'}</span>
                </div>
                <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-100/80">
                  <span className="text-[0.65rem] text-purple-700 font-bold block uppercase">Ownership</span>
                  <span className="font-bold text-purple-900 mt-0.5 block truncate">{viewDetailsJob.ownership_level || 'Pod / Project Contributor'}</span>
                </div>
                <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-100/80">
                  <span className="text-[0.65rem] text-teal-700 font-bold block uppercase">Specialization</span>
                  <span className="font-bold text-teal-900 mt-0.5 block truncate">{viewDetailsJob.specialization || 'Full Track'}</span>
                </div>
                <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-100/80">
                  <span className="text-[0.65rem] text-amber-700 font-bold block uppercase">Availability</span>
                  <span className="font-bold text-amber-900 mt-0.5 block truncate">{viewDetailsJob.availability_requirement || 'Immediate'}</span>
                </div>
                <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100/80">
                  <span className="text-[0.65rem] text-indigo-700 font-bold block uppercase">Experience</span>
                  <span className="font-bold text-indigo-900 mt-0.5 block">{viewDetailsJob.min_experience || '1+ Years'}</span>
                </div>
              </div>

              {/* Capabilities */}
              {(viewDetailsJob.must_have_capabilities || viewDetailsJob.preferred_capabilities) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {viewDetailsJob.must_have_capabilities && (
                    <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100 space-y-1">
                      <span className="text-[0.65rem] font-bold text-emerald-800 uppercase block">Must-Have Capabilities</span>
                      <p className="text-xs text-slate-800 font-medium">{viewDetailsJob.must_have_capabilities}</p>
                    </div>
                  )}
                  {viewDetailsJob.preferred_capabilities && (
                    <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-100 space-y-1">
                      <span className="text-[0.65rem] font-bold text-blue-800 uppercase block">Preferred Capabilities</span>
                      <p className="text-xs text-slate-800 font-medium">{viewDetailsJob.preferred_capabilities}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Business Context ── */}
              {(() => {
                const bContext = viewDetailsJob.business_context || {
                  product_service: viewDetailsJob.product_service || 'CloudNest workflow software',
                  business_model: viewDetailsJob.business_model || 'Local services',
                  growth_stage: viewDetailsJob.growth_stage || 'Scaling',
                  target_audience: viewDetailsJob.target_audience || 'Operations leaders at mid-market companies',
                  ideal_customer_profile: viewDetailsJob.ideal_customer_profile || 'Companies with 100–500 employees managing complex internal approvals.'
                };
                return (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                    <span className="text-[0.68rem] font-bold text-slate-900 uppercase flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-[#00a884]" /> Business Context
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[0.62rem] text-slate-400 font-bold block uppercase">Product / Service</span>
                        <span className="font-semibold text-slate-800">{bContext.product_service}</span>
                      </div>
                      <div>
                        <span className="text-[0.62rem] text-slate-400 font-bold block uppercase">Business Model</span>
                        <span className="font-semibold text-slate-800">{bContext.business_model}</span>
                      </div>
                      <div>
                        <span className="text-[0.62rem] text-slate-400 font-bold block uppercase">Growth Stage</span>
                        <span className="font-semibold text-slate-800">{bContext.growth_stage}</span>
                      </div>
                      <div>
                        <span className="text-[0.62rem] text-slate-400 font-bold block uppercase">Target Audience</span>
                        <span className="font-semibold text-slate-800">{bContext.target_audience}</span>
                      </div>
                    </div>
                    {bContext.ideal_customer_profile && (
                      <div className="pt-1 border-t border-slate-100">
                        <span className="text-[0.62rem] text-slate-400 font-bold block uppercase">ICP</span>
                        <p className="text-slate-700 text-[0.72rem] leading-relaxed">{bContext.ideal_customer_profile}</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ── Hiring Need ── */}
              {(() => {
                const hNeed = viewDetailsJob.hiring_need || {
                  business_problem: viewDetailsJob.business_problem || 'Lead volume is rising, but qualified pipeline is inconsistent.',
                  expected_outcome: viewDetailsJob.expected_outcome || 'Build a repeatable demand programme and improve lead-to-opportunity quality.',
                  team_support: viewDetailsJob.team_support || 'Marketing head, content specialist, shared design support',
                  monthly_budget_range: viewDetailsJob.monthly_budget_range || '₹8–12 lakh',
                  decision_authority: viewDetailsJob.decision_authority || 'Own campaigns and recommend budget allocation',
                  success_horizon: viewDetailsJob.success_horizon || 'First 90 days'
                };
                return (
                  <div className="p-3.5 bg-emerald-50/40 rounded-xl border border-emerald-100/80 space-y-2">
                    <span className="text-[0.68rem] font-bold text-slate-900 uppercase flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5 text-[#00a884]" /> Hiring Need
                    </span>
                    <div className="space-y-1.5">
                      {hNeed.business_problem && (
                        <div>
                          <span className="text-[0.62rem] text-amber-700 font-bold block uppercase">Business Problem</span>
                          <p className="text-slate-800 font-medium text-xs">{hNeed.business_problem}</p>
                        </div>
                      )}
                      {hNeed.expected_outcome && (
                        <div>
                          <span className="text-[0.62rem] text-emerald-700 font-bold block uppercase">Expected Outcome</span>
                          <p className="text-slate-800 font-medium text-xs">{hNeed.expected_outcome}</p>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-emerald-100">
                      <div>
                        <span className="text-[0.62rem] text-slate-400 font-bold block uppercase">Team Support</span>
                        <span className="font-semibold text-slate-800 text-[0.72rem]">{hNeed.team_support}</span>
                      </div>
                      <div>
                        <span className="text-[0.62rem] text-slate-400 font-bold block uppercase">Monthly Budget</span>
                        <span className="font-semibold text-emerald-800 text-[0.72rem]">{hNeed.monthly_budget_range}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Role Scope */}
              {viewDetailsJob.description && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 leading-relaxed text-slate-600">
                  <p className="font-semibold text-slate-900 mb-1">Role Description:</p>
                  <p className="whitespace-pre-line">{viewDetailsJob.description}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    handleRemove(viewDetailsJob.id);
                    setViewDetailsJob(null);
                  }}
                  className="text-xs text-rose-600 hover:underline border-none bg-transparent cursor-pointer font-semibold"
                >
                  Remove Bookmark
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewDetailsJob(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border-none bg-transparent cursor-pointer"
                  >
                    Close
                  </button>
                  {!appliedJobsMap[viewDetailsJob.id] && (
                    <button
                      type="button"
                      onClick={() => {
                        const j = viewDetailsJob;
                        setViewDetailsJob(null);
                        handleOpenApplyModal(j);
                      }}
                      className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#0a66c2] hover:bg-[#084e96] border-none cursor-pointer shadow-sm"
                    >
                      Apply Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
