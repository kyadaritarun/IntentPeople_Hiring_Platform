import React, { useState, useEffect } from 'react';
import { 
  Bookmark, Briefcase, MapPin, Building2, ExternalLink, 
  Trash2, Send, CheckCircle2, DollarSign, Clock, Search, 
  Filter, ShieldCheck, ChevronRight, ArrowUpRight, Sparkles, 
  Eye, X, Check, RefreshCw, Layers, Zap, AlertCircle, Compass, HelpCircle, Share2,
  LayoutGrid, LayoutList, Target
} from 'lucide-react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { computeUnifiedJobMatch } from '../../utils/aiMatchScorer';
import ShareJobModal from '../../components/ShareJobModal';

export default function SavedJobs({ setActiveTab, setSelectedJobId }) {
  const { user } = useAuth();
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
  const [viewMode, setViewMode] = useState('table');

  // Modals
  const [applyModalJob, setApplyModalJob] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [screeningAnswers, setScreeningAnswers] = useState({});
  const [screeningErrors, setScreeningErrors] = useState({});
  const [applying, setApplying] = useState(false);
  const [viewDetailsJob, setViewDetailsJob] = useState(null);
  const [sharingJob, setSharingJob] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([fetchSavedJobs(), fetchApplications()]);
      showToast('Saved jobs refreshed!');
    } catch (err) {
      console.error('Error refreshing saved jobs:', err);
    } finally {
      setRefreshing(false);
    }
  };

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
          const jId = a.job_id || a.job?.id;
          if (jId) {
            map[jId] = a;
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
    setScreeningAnswers({});
    setScreeningErrors({});
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    if (!applyModalJob) return;

    // Validate screening questions
    const questions = applyModalJob.screening_questions || [];
    const errors = {};
    for (const q of questions) {
      if (q.required) {
        const val = screeningAnswers[q.id];
        if (val === undefined || val === null || String(val).trim() === '') {
          errors[q.id] = 'This question is required.';
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setScreeningErrors(errors);
      return;
    }
    setScreeningErrors({});

    const formattedAnswers = questions.map(q => ({
      question_id: q.id,
      question: q.question,
      answer: screeningAnswers[q.id] !== undefined ? String(screeningAnswers[q.id]).trim() : '',
      type: q.type
    }));

    setApplying(true);
    try {
      await api.applyJob(applyModalJob.id, coverLetter, formattedAnswers);
      setAppliedJobsMap(prev => ({ ...prev, [applyModalJob.id]: 'APPLIED' }));
      showToast(`🎉 Application submitted for "${applyModalJob.title}"!`);
      setApplyModalJob(null);
      setCoverLetter('');
      setScreeningAnswers({});
      setScreeningErrors({});
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
    <div
      className="p-4 sm:p-7 max-w-7xl mx-auto space-y-6 bg-[#F7F8FB] min-h-full antialiased text-slate-800 select-text relative"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-3.5 h-3.5 text-[#FF7043]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-[28px] font-semibold text-slate-900 leading-tight tracking-tight m-0">
              Saved Jobs
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-semibold flex items-center gap-1">
              <Bookmark className="w-3 h-3 text-amber-600 fill-amber-500" /> Curated Collection
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1.5 m-0">
            Review and apply for roles you bookmarked for later across top digital marketing and tech teams.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3.5 py-2.5 rounded-lg border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-2xs hover:border-slate-300 disabled:opacity-50"
            title="Refresh saved jobs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin text-[#FF7043]' : ''}`} />
            <span>Refresh</span>
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

      {/* ── 4 Compact Funnel KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Total Saved */}
        <div
          onClick={() => setWorkModeFilter('ALL')}
          className={`bg-white rounded-xl border px-3.5 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.02)] cursor-pointer transition-all hover:border-slate-300 flex items-center justify-between gap-2 ${
            workModeFilter === 'ALL' ? 'border-[#FF7043] ring-1 ring-[#FF7043]/30 bg-orange-50/15' : 'border-slate-200/80 hover:bg-slate-50/50'
          }`}
        >
          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-[#FF7043] uppercase tracking-wider block truncate">
              Total Saved
            </span>
            <div className="text-sm sm:text-base font-bold text-slate-900 leading-tight mt-0.5">
              {totalSaved} <span className="text-xs font-semibold text-slate-500">Roles</span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-[#FF7043]/10 text-[#FF7043] flex items-center justify-center shrink-0">
            <Bookmark className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Ready to Apply */}
        <div
          onClick={() => setWorkModeFilter('READY')}
          className={`bg-white rounded-xl border px-3.5 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.02)] cursor-pointer transition-all hover:border-slate-300 flex items-center justify-between gap-2 ${
            workModeFilter === 'READY' ? 'border-emerald-400 ring-1 ring-emerald-400/30 bg-emerald-50/15' : 'border-slate-200/80 hover:bg-slate-50/50'
          }`}
        >
          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider block truncate">
              Ready to Apply
            </span>
            <div className="text-sm sm:text-base font-bold text-slate-900 leading-tight mt-0.5">
              {readyToApplyCount} <span className="text-xs font-semibold text-slate-500">Open</span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Send className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Remote Roles */}
        <div
          onClick={() => setWorkModeFilter('REMOTE')}
          className={`bg-white rounded-xl border px-3.5 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.02)] cursor-pointer transition-all hover:border-slate-300 flex items-center justify-between gap-2 ${
            workModeFilter === 'REMOTE' ? 'border-sky-400 ring-1 ring-sky-400/30 bg-sky-50/15' : 'border-slate-200/80 hover:bg-slate-50/50'
          }`}
        >
          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-sky-600 uppercase tracking-wider block truncate">
              Remote Setup
            </span>
            <div className="text-sm sm:text-base font-bold text-slate-900 leading-tight mt-0.5">
              {remoteCount} <span className="text-xs font-semibold text-slate-500">Remote</span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <MapPin className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Already Applied */}
        <div
          onClick={() => setWorkModeFilter('APPLIED')}
          className={`bg-white rounded-xl border px-3.5 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.02)] cursor-pointer transition-all hover:border-slate-300 flex items-center justify-between gap-2 ${
            workModeFilter === 'APPLIED' ? 'border-[#5C59E8] ring-1 ring-[#5C59E8]/30 bg-[#5C59E8]/5' : 'border-slate-200/80 hover:bg-slate-50/50'
          }`}
        >
          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-[#5C59E8] uppercase tracking-wider block truncate">
              Applied Status
            </span>
            <div className="text-sm sm:text-base font-bold text-slate-900 leading-tight mt-0.5">
              {appliedCount} <span className="text-xs font-semibold text-slate-500">Submitted</span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-[#5C59E8]/10 text-[#5C59E8] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* ── Search Toolbar & Work Mode Pills ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              className="w-full pl-10 pr-8 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200/90 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400 shadow-[0_1px_2px_rgba(15,23,42,0.02)]"
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

          {/* Sort & Applications Link & View Switcher */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {/* View Mode Toggle: Table / Grid */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1.5 rounded-lg border-none cursor-pointer transition-all flex items-center gap-1.5 text-xs font-semibold ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'bg-transparent text-slate-500 hover:text-slate-800'
                }`}
                title="Table View"
              >
                <LayoutList size={13} />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1.5 rounded-lg border-none cursor-pointer transition-all flex items-center gap-1.5 text-xs font-semibold ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'bg-transparent text-slate-500 hover:text-slate-800'
                }`}
                title="Grid View"
              >
                <LayoutGrid size={13} />
                <span className="hidden sm:inline">Grid</span>
              </button>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer hover:border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            >
              <option value="recent">Recently Saved</option>
              <option value="title">Job Title (A-Z)</option>
              <option value="company">Company Name</option>
            </select>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer flex items-center justify-center disabled:opacity-50"
              title="Refresh saved jobs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#FF7043]' : ''}`} />
            </button>

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
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 border-t border-slate-100">
          {filterTabs.map(tab => {
            const isActive = workModeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setWorkModeFilter(tab.id)}
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

      {/* ─── 2. Saved Jobs List ─── */}
      {savedList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)] space-y-3.5 max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF7043] flex items-center justify-center mx-auto">
            <Bookmark className="w-6 h-6 fill-orange-400/30" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              No Saved Jobs in Your Collection
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
              Save digital marketing and tech roles while exploring to keep track of top openings and apply when you are ready.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#FF7043]' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab?.('job_search')}
              className="px-5 py-2.5 rounded-xl bg-[#FF7043] hover:bg-[#E65B30] text-white text-xs font-semibold transition-all border-none cursor-pointer shadow-[0_1px_2px_rgba(255,112,67,0.3)]"
            >
              Browse Open Jobs
            </button>
          </div>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)] space-y-3 max-w-md mx-auto">
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
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Job Role & Organization</th>
                  <th className="py-3.5 px-4">Location & Setup</th>
                  <th className="py-3.5 px-4">Compensation</th>
                  <th className="py-3.5 px-4">Match Fit</th>
                  <th className="py-3.5 px-4">Saved On</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredList.map((job) => {
                  const appliedApp = appliedJobsMap[job.id];
                  const isApplied = !!appliedApp;
                  const match = computeUnifiedJobMatch(job, user, appliedApp);
                  const matchPct = match.score;
                  const domainPct = match.domainAlignment;

                  return (
                    <tr
                      key={job.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Job Role & Organization */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-800 font-extrabold text-sm flex items-center justify-center shrink-0 shadow-2xs group-hover:border-[#FF7043]/40 transition-colors">
                            {(job.company || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => setViewDetailsJob(job)}
                              className="text-left font-bold text-slate-900 group-hover:text-[#FF7043] transition-colors truncate max-w-[220px] sm:max-w-[280px] block border-none bg-transparent p-0 cursor-pointer text-xs sm:text-sm"
                            >
                              {job.title}
                            </button>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                              <span className="font-semibold text-slate-700 flex items-center gap-1 truncate max-w-[150px]">
                                <ShieldCheck size={12} className="text-emerald-600 shrink-0" />
                                {job.company}
                              </span>
                              {job.job_type && (
                                <>
                                  <span>•</span>
                                  <span className="text-slate-400 truncate">{job.job_type}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Location & Setup */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-slate-600 font-medium">
                            <MapPin size={11} className="text-slate-400 shrink-0" />
                            <span className="truncate max-w-[160px] text-xs">{job.location || 'Remote'}</span>
                          </div>
                          {job.work_mode && (
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                              job.work_mode.toLowerCase().includes('remote')
                                ? 'bg-orange-50 text-[#FF7043] border border-orange-200/60'
                                : job.work_mode.toLowerCase().includes('hybrid')
                                ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {job.work_mode}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Compensation */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {job.salary ? (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 inline-block">
                            {job.salary}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Competitive</span>
                        )}
                      </td>

                      {/* Match Fit */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80">
                            <Sparkles size={11} className="text-indigo-600" />
                            {matchPct}% Role-Fit
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80">
                            <Target size={10} className="text-emerald-600" />
                            {domainPct}% Domain
                          </span>
                        </div>
                      </td>

                      {/* Saved On */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                          <Clock size={11} className="text-slate-400" />
                          {job.dateSaved || 'Recently'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Share Job */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSharingJob(job);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 border-none bg-transparent cursor-pointer transition-colors"
                            title="Share job opening"
                          >
                            <Share2 size={15} />
                          </button>

                          {/* View Details */}
                          <button
                            type="button"
                            onClick={() => setViewDetailsJob(job)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 border-none bg-transparent cursor-pointer transition-colors"
                            title="View full job details"
                          >
                            <Eye size={15} />
                          </button>

                          {/* Remove Bookmark */}
                          <button
                            type="button"
                            onClick={(e) => handleRemove(job.id, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border-none bg-transparent cursor-pointer transition-colors"
                            title="Remove from saved"
                          >
                            <Trash2 size={15} />
                          </button>

                          {/* Easy Apply / Status */}
                          {isApplied ? (
                            <div className="inline-flex items-center gap-1.5 ml-1">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
                                <CheckCircle2 size={12} /> Applied
                              </span>
                              <button
                                type="button"
                                onClick={() => setActiveTab?.('my_applications')}
                                className="text-[11px] font-semibold text-[#FF7043] hover:text-[#E65B30] hover:underline border-none bg-transparent cursor-pointer"
                              >
                                Track
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => handleOpenApplyModal(job, e)}
                              className="ml-1 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#FF7043] hover:bg-[#E65B30] shadow-[0_1px_2px_rgba(255,112,67,0.3)] transition-all border-none cursor-pointer"
                            >
                              <Send size={11} /> Easy Apply
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredList.map((job) => {
            const appliedApp = appliedJobsMap[job.id];
            const isApplied = !!appliedApp;
            const match = computeUnifiedJobMatch(job, user, appliedApp);
            const matchPct = match.score;
            const domainPct = match.domainAlignment;

            return (
              <div
                key={job.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-slate-300 transition-all flex flex-col justify-between group relative"
              >
                <div>
                  {/* Top Row: Company & Title + Remove Button */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 text-slate-800 font-extrabold text-base flex items-center justify-center shrink-0 shadow-2xs">
                        {(job.company || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 
                          className="text-base font-bold text-slate-900 hover:text-[#FF7043] transition-colors cursor-pointer truncate m-0"
                          onClick={() => setViewDetailsJob(job)}
                        >
                          {job.title}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <span className="font-semibold text-slate-800 flex items-center gap-1">
                            <ShieldCheck size={13} className="text-emerald-600" />
                            {job.company}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons: Share + Remove Bookmark */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSharingJob(job);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 border-none bg-transparent cursor-pointer transition-colors"
                        title="Share job opening"
                      >
                        <Share2 size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleRemove(job.id, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border-none bg-transparent cursor-pointer transition-colors"
                        title="Remove from saved"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Metadata Strip */}
                  <div className="flex items-center gap-2 mt-3.5 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1 bg-slate-50 border border-slate-200/70 px-2 py-0.5 rounded-md text-[11px] font-medium">
                      <MapPin size={11} className="text-slate-400" /> {job.location || 'Remote'}
                    </span>
                    {job.work_mode && (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-orange-50 text-[#FF7043] border border-orange-200/60">
                        {job.work_mode}
                      </span>
                    )}
                    {job.salary && (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 flex items-center gap-0.5">
                        {job.salary}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 flex items-center gap-1">
                      <Sparkles size={11} className="text-indigo-600" />
                      {matchPct}% Role-Fit
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 flex items-center gap-1">
                      <Target size={11} className="text-emerald-600" />
                      {domainPct}% Domain
                    </span>
                  </div>

                  {/* Saved Date */}
                  {job.dateSaved && (
                    <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1 font-medium">
                      <Clock size={11} /> Saved {job.dateSaved}
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="pt-3.5 mt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setViewDetailsJob(job)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 border-none bg-transparent cursor-pointer p-0"
                  >
                    <Eye size={13} /> View Details
                  </button>

                  {isApplied ? (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                        <CheckCircle2 size={13} /> Applied
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveTab?.('my_applications')}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#FF7043] hover:text-[#E65B30] hover:underline border-none bg-transparent cursor-pointer transition-colors"
                      >
                        Track Status
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => handleOpenApplyModal(job, e)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#FF7043] hover:bg-[#E65B30] transition-all border-none cursor-pointer shadow-[0_1px_2px_rgba(255,112,67,0.3)]"
                    >
                      <Send size={12} /> Easy Apply
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
                  <span className="text-[10px] font-bold text-[#FF7043] uppercase tracking-wider block">One-Click Application</span>
                  <h3 className="text-xl font-bold text-white leading-snug mt-0.5 m-0">
                    {applyModalJob.title}
                  </h3>
                  <p className="text-xs text-white/70 mt-1 flex items-center gap-1.5 m-0">
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

            <form onSubmit={handleSubmitApplication} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Screening Questions */}
              {Array.isArray(applyModalJob.screening_questions) && applyModalJob.screening_questions.length > 0 && (
                <div className="p-4 bg-orange-50/40 rounded-2xl border border-orange-100/90 space-y-3.5">
                  <div className="flex items-center gap-2 pb-2 border-b border-orange-100">
                    <HelpCircle className="w-4 h-4 text-[#FF7043]" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 m-0">
                        Employer Screening Questions ({applyModalJob.screening_questions.length})
                      </h4>
                      <p className="text-[11px] text-slate-500 m-0">
                        Please answer the questions below to submit your application.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {applyModalJob.screening_questions.map((q, qIdx) => (
                      <div key={q.id || qIdx} className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                        <label className="block text-xs font-bold text-slate-800 leading-snug">
                          <span className="text-[#FF7043] mr-1.5 font-black">Q{qIdx + 1}.</span>
                          {q.question} {q.required && <span className="text-rose-500">*</span>}
                        </label>

                        {/* Type: Choice */}
                        {q.type === 'choice' && (
                          <div className="space-y-1.5 pt-1">
                            {(q.options || []).map((opt, optIdx) => (
                              <label 
                                key={optIdx} 
                                className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                                  screeningAnswers[q.id] === opt 
                                    ? 'bg-orange-50/70 border-[#FF7043] text-slate-900 font-bold shadow-2xs' 
                                    : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`sq_saved_${q.id}`}
                                  value={opt}
                                  checked={screeningAnswers[q.id] === opt}
                                  onChange={() => {
                                    setScreeningAnswers(prev => ({ ...prev, [q.id]: opt }));
                                    if (screeningErrors[q.id]) {
                                      setScreeningErrors(prev => { const n = { ...prev }; delete n[q.id]; return n; });
                                    }
                                  }}
                                  className="w-3.5 h-3.5 text-[#FF7043] focus:ring-0"
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        {/* Type: Yes / No */}
                        {q.type === 'yes_no' && (
                          <div className="flex items-center gap-2 pt-1">
                            {['Yes', 'No'].map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => {
                                  setScreeningAnswers(prev => ({ ...prev, [q.id]: opt }));
                                  if (screeningErrors[q.id]) {
                                    setScreeningErrors(prev => { const n = { ...prev }; delete n[q.id]; return n; });
                                  }
                                }}
                                className={`flex-1 py-2 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                                  screeningAnswers[q.id] === opt
                                    ? 'bg-[#FF7043] border-[#FF7043] text-white shadow-2xs'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Type: Number */}
                        {q.type === 'number' && (
                          <input
                            type="number"
                            value={screeningAnswers[q.id] || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setScreeningAnswers(prev => ({ ...prev, [q.id]: val }));
                              if (screeningErrors[q.id]) {
                                setScreeningErrors(prev => { const n = { ...prev }; delete n[q.id]; return n; });
                              }
                            }}
                            placeholder="e.g. 3"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white"
                          />
                        )}

                        {/* Type: Text */}
                        {(!q.type || q.type === 'text') && (
                          <textarea
                            rows={2}
                            value={screeningAnswers[q.id] || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setScreeningAnswers(prev => ({ ...prev, [q.id]: val }));
                              if (screeningErrors[q.id]) {
                                setScreeningErrors(prev => { const n = { ...prev }; delete n[q.id]; return n; });
                              }
                            }}
                            placeholder="Your answer..."
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white leading-relaxed"
                          />
                        )}

                        {screeningErrors[q.id] && (
                          <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {screeningErrors[q.id]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Personalized Cover Letter / Note
                </label>
                <textarea
                  rows={5}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Introduce yourself and explain why you're a great fit for this role..."
                  className="w-full p-3.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 resize-none leading-relaxed"
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
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#FF7043] hover:bg-[#E65B30] border-none cursor-pointer shadow-[0_1px_2px_rgba(255,112,67,0.3)] disabled:opacity-50 flex items-center gap-1.5"
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
                  <span className="text-[10px] font-bold text-[#FF7043] uppercase tracking-wider block">Job Overview</span>
                  <h3 className="text-xl font-bold text-white leading-snug mt-0.5 m-0">
                    {viewDetailsJob.title}
                  </h3>
                  <p className="text-xs text-white/70 mt-1 flex items-center gap-1.5 m-0">
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
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Work Mode</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{viewDetailsJob.work_mode || 'Flexible'}</span>
                </div>
                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100/80">
                  <span className="text-[10px] text-emerald-700 font-bold block uppercase">Compensation</span>
                  <span className="font-bold text-emerald-900 mt-0.5 block">{viewDetailsJob.salary || 'Competitive'}</span>
                </div>
                <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-100/80">
                  <span className="text-[10px] text-purple-700 font-bold block uppercase">Ownership</span>
                  <span className="font-bold text-purple-900 mt-0.5 block truncate">{viewDetailsJob.ownership_level || 'Pod / Project Contributor'}</span>
                </div>
                <div className="p-3 bg-orange-50/70 rounded-xl border border-orange-100/80">
                  <span className="text-[10px] text-[#FF7043] font-bold block uppercase">Specialization</span>
                  <span className="font-bold text-slate-900 mt-0.5 block truncate">{viewDetailsJob.specialization || 'Full Track'}</span>
                </div>
                <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-100/80">
                  <span className="text-[10px] text-amber-700 font-bold block uppercase">Availability</span>
                  <span className="font-bold text-amber-900 mt-0.5 block truncate">{viewDetailsJob.availability_requirement || 'Immediate'}</span>
                </div>
                <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100/80">
                  <span className="text-[10px] text-indigo-700 font-bold block uppercase">Experience</span>
                  <span className="font-bold text-indigo-900 mt-0.5 block">{viewDetailsJob.min_experience || '1+ Years'}</span>
                </div>
              </div>

              {/* Capabilities */}
              {(viewDetailsJob.must_have_capabilities || viewDetailsJob.preferred_capabilities) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {viewDetailsJob.must_have_capabilities && (
                    <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100 space-y-1">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block">Must-Have Capabilities</span>
                      <p className="text-xs text-slate-800 font-medium m-0">{viewDetailsJob.must_have_capabilities}</p>
                    </div>
                  )}
                  {viewDetailsJob.preferred_capabilities && (
                    <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-100 space-y-1">
                      <span className="text-[10px] font-bold text-blue-800 uppercase block">Preferred Capabilities</span>
                      <p className="text-xs text-slate-800 font-medium m-0">{viewDetailsJob.preferred_capabilities}</p>
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
                    <span className="text-[11px] font-bold text-slate-900 uppercase flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-[#FF7043]" /> Business Context
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Product / Service</span>
                        <span className="font-semibold text-slate-800">{bContext.product_service}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Business Model</span>
                        <span className="font-semibold text-slate-800">{bContext.business_model}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Growth Stage</span>
                        <span className="font-semibold text-slate-800">{bContext.growth_stage}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Target Audience</span>
                        <span className="font-semibold text-slate-800">{bContext.target_audience}</span>
                      </div>
                    </div>
                    {bContext.ideal_customer_profile && (
                      <div className="pt-1 border-t border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">ICP</span>
                        <p className="text-slate-700 text-xs leading-relaxed m-0">{bContext.ideal_customer_profile}</p>
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
                    <span className="text-[11px] font-bold text-slate-900 uppercase flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5 text-emerald-600" /> Hiring Need
                    </span>
                    <div className="space-y-1.5">
                      {hNeed.business_problem && (
                        <div>
                          <span className="text-[10px] text-amber-700 font-bold block uppercase">Business Problem</span>
                          <p className="text-slate-800 font-medium text-xs m-0">{hNeed.business_problem}</p>
                        </div>
                      )}
                      {hNeed.expected_outcome && (
                        <div>
                          <span className="text-[10px] text-emerald-700 font-bold block uppercase">Expected Outcome</span>
                          <p className="text-slate-800 font-medium text-xs m-0">{hNeed.expected_outcome}</p>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-emerald-100">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Team Support</span>
                        <span className="font-semibold text-slate-800 text-xs">{hNeed.team_support}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Monthly Budget</span>
                        <span className="font-semibold text-emerald-800 text-xs">{hNeed.monthly_budget_range}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Role Scope */}
              {viewDetailsJob.description && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 leading-relaxed text-slate-600">
                  <p className="font-semibold text-slate-900 mb-1">Role Description:</p>
                  <p className="whitespace-pre-line m-0">{viewDetailsJob.description}</p>
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
                      className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#FF7043] hover:bg-[#E65B30] border-none cursor-pointer shadow-[0_1px_2px_rgba(255,112,67,0.3)]"
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

      {/* Share Job Modal */}
      {sharingJob && (
        <ShareJobModal job={sharingJob} onClose={() => setSharingJob(null)} />
      )}

    </div>
  );
}
