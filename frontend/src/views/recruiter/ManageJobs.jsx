import React, { useState, useEffect } from 'react';
import {
  Briefcase, Eye, Plus, Search, Filter, X, RefreshCw,
  CheckCircle2, Clock, MapPin, Users, Building2,
  ChevronRight, ArrowUpRight, Sparkles, Loader2, AlertCircle,
  Edit3, Save, DollarSign, Layers, FileText, Check
} from 'lucide-react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';

// Soft-tint badge styling matching UnifiedRoleDashboard and PostJob
const TINTS = {
  indigo: 'bg-[#5C59E8]/8 text-[#4845D2] ring-1 ring-inset ring-[#5C59E8]/15',
  orange: 'bg-[#FF7043]/8 text-[#E15A2C] ring-1 ring-inset ring-[#FF7043]/15',
  emerald: 'bg-[#00A884]/8 text-[#00846A] ring-1 ring-inset ring-[#00A884]/15',
  slate: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200/70',
  sky: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200/80',
  purple: 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200/80',
};

function Badge({ tone = 'slate', children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold tabular-nums whitespace-nowrap ${TINTS[tone] || TINTS.slate} ${className}`}
    >
      {children}
    </span>
  );
}

export default function ManageJobs({ setActiveTab, setSelectedJobId, role }) {
  const { user } = useAuth();
  const currentRole = role || user?.role || 'RECRUITER';
  const isAdmin = currentRole === 'ADMIN';
  const isHiringManager = currentRole === 'HIRING_MANAGER';
  const canPostJob = !isAdmin && !isHiringManager;
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [workModeFilter, setWorkModeFilter] = useState('ALL');
  const [groupFilter, setGroupFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  // Edit Job State
  const [editingJob, setEditingJob] = useState(null);
  const [savingJob, setSavingJob] = useState(false);
  const [editError, setEditError] = useState('');
  const [editFormData, setEditFormData] = useState({
    title: '',
    specialization: '',
    work_mode: 'Remote',
    job_type: 'Full-Time',
    experience_level: 'Mid Level',
    ownership_level: 'End-to-End Ownership',
    availability_requirement: 'Immediate (0-15 days)',
    min_experience: '',
    salary_min: '',
    salary_max: '',
    salary_currency: 'USD',
    location: '',
    description: '',
    must_have_capabilities: '',
    preferred_capabilities: '',
    skills: ''
  });

  const handleStartEdit = (job) => {
    setEditingJob(job);
    setEditFormData({
      title: job.title || '',
      specialization: job.specialization || '',
      work_mode: job.work_mode || 'Remote',
      job_type: job.job_type || 'Full-Time',
      experience_level: job.experience_level || 'Mid Level',
      ownership_level: job.ownership_level || 'End-to-End Ownership',
      availability_requirement: job.availability_requirement || 'Immediate (0-15 days)',
      min_experience: job.min_experience || '',
      salary_min: job.salary_min !== undefined && job.salary_min !== null ? job.salary_min : '',
      salary_max: job.salary_max !== undefined && job.salary_max !== null ? job.salary_max : '',
      salary_currency: job.salary_currency || 'USD',
      location: job.location || '',
      description: job.description || '',
      must_have_capabilities: job.must_have_capabilities || '',
      preferred_capabilities: job.preferred_capabilities || '',
      skills: Array.isArray(job.skills) ? job.skills.join(', ') : (job.skills || '')
    });
    setEditError('');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingJob) return;
    setSavingJob(true);
    setEditError('');

    try {
      const skillsArray = typeof editFormData.skills === 'string'
        ? editFormData.skills.split(',').map(s => s.trim()).filter(Boolean)
        : editFormData.skills;

      const payload = {
        title: editFormData.title,
        specialization: editFormData.specialization || null,
        work_mode: editFormData.work_mode,
        job_type: editFormData.job_type,
        experience_level: editFormData.experience_level || 'Mid Level',
        ownership_level: editFormData.ownership_level || null,
        availability_requirement: editFormData.availability_requirement || null,
        min_experience: editFormData.min_experience || null,
        salary_min: editFormData.salary_min !== '' ? parseInt(editFormData.salary_min, 10) || 0 : 0,
        salary_max: editFormData.salary_max !== '' ? parseInt(editFormData.salary_max, 10) || 0 : 0,
        salary_currency: editFormData.salary_currency || 'USD',
        location: editFormData.location,
        description: editFormData.description,
        must_have_capabilities: editFormData.must_have_capabilities || null,
        preferred_capabilities: editFormData.preferred_capabilities || null,
        skills: skillsArray
      };

      const updated = await api.updateJob(editingJob.id, payload);
      setJobs(prev => prev.map(j => (j.id === editingJob.id ? { ...j, ...updated } : j)));
      showToast('Job requisition updated successfully!');
      setEditingJob(null);
    } catch (err) {
      console.error('Failed to update job:', err);
      setEditError(err.message || 'Failed to update job requisition.');
    } finally {
      setSavingJob(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      let list = [];
      try {
        list = await api.getMyJobs();
      } catch {
        list = await api.getJobs();
      }
      setJobs(list || []);
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleToggleStatus = async (jobId, currentStatus) => {
    const nextStatus = currentStatus === 'PUBLISHED' ? 'CLOSED' : 'PUBLISHED';
    setTogglingId(jobId);
    try {
      await api.updateJobStatus(jobId, nextStatus);
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: nextStatus } : j));
      showToast(`Position status updated to ${nextStatus === 'PUBLISHED' ? 'Active / Published' : 'Closed'}.`);
    } catch (e) {
      showToast(`Error: ${e.message || 'Failed to update job status'}`);
    } finally {
      setTogglingId(null);
    }
  };

  // Filtered Jobs
  const filteredJobs = jobs.filter(job => {
    const matchesSearch =
      (job.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.skills || []).some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || job.status === statusFilter;
    const matchesWorkMode = workModeFilter === 'ALL' || (job.work_mode || '').toLowerCase() === workModeFilter.toLowerCase();
    const matchesGroup = groupFilter === 'ALL' || job.group_name === groupFilter;

    return matchesSearch && matchesStatus && matchesWorkMode && matchesGroup;
  });

  const availableGroups = Array.from(new Set(jobs.map(j => j.group_name).filter(Boolean)));

  const publishedCount = jobs.filter(j => j.status === 'PUBLISHED').length;
  const closedCount = jobs.filter(j => j.status === 'CLOSED').length;

  const getWorkModeTone = (mode) => {
    const m = (mode || '').toLowerCase();
    if (m === 'remote') return 'emerald';
    if (m === 'hybrid') return 'sky';
    return 'purple';
  };

  const formatSalary = (job) => {
    if (job.salary_range) return job.salary_range;
    if (!job.salary_min && !job.salary_max) return null;
    const sym = job.salary_currency === 'INR' ? '₹' : (job.salary_currency === 'EUR' ? '€' : (job.salary_currency === 'GBP' ? '£' : '$'));
    const min = job.salary_min ? job.salary_min.toLocaleString() : '0';
    const max = job.salary_max ? job.salary_max.toLocaleString() : 'Negotiable';
    return `${sym}${min} - ${sym}${max}`;
  };

  const cardClass = 'bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)]';
  const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white placeholder:text-slate-400 focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)]';
  const selectClass = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-semibold text-slate-700 bg-white focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)] cursor-pointer';
  const textareaClass = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white placeholder:text-slate-400 focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)] leading-relaxed';

  return (
    <div
      className="p-4 sm:p-7 max-w-7xl mx-auto space-y-6 bg-[#F7F8FB] min-h-full antialiased"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
    >

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-semibold text-slate-900 leading-tight tracking-tight m-0">
            Manage Posted Jobs & Requisitions
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 m-0">
            {isAdmin
              ? 'Monitor active requisitions, work modes, required skills, and publication statuses across your organization.'
              : isHiringManager
                ? 'Review active requisitions, job criteria, and requisition details for candidate evaluation.'
                : 'Monitor active requisitions, calibrate hiring pipelines, manage job statuses, and review applicant submissions.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchJobs}
            title="Refresh jobs list"
            className="p-2.5 rounded-xl border border-slate-200/80 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#5C59E8]' : ''}`} />
          </button>

          {canPostJob && (
            <button
              type="button"
              onClick={() => setActiveTab?.('post_job')}
              className="px-4 py-2.5 rounded-lg bg-[#FF7043] hover:bg-[#E65B30] text-white text-xs font-semibold shadow-[0_1px_2px_rgba(255,112,67,0.3)] transition-colors flex items-center gap-1.5 cursor-pointer border-none"
            >
              <Plus className="w-4 h-4" />
              <span>Post New Job</span>
            </button>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 px-4 rounded-xl bg-slate-900 text-white text-xs font-medium flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage('')}
            className="text-slate-400 hover:text-white border-none bg-transparent cursor-pointer ml-4 p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Quick Metrics Bar ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Requisitions */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)] px-4 py-3 transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Requisitions
            </span>
            <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-500 flex items-center justify-center">
              <Briefcase className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-none">
            {jobs.length} Positions
          </div>
          <p className="text-[11px] text-slate-400 mt-1 m-0">Full agency hiring pipeline</p>
        </div>

        {/* Active & Published */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)] px-4 py-3 transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">
              Active & Published
            </span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </div>
          <div className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-none">
            {publishedCount} Live
          </div>
          <p className="text-[11px] text-slate-400 mt-1 m-0">Currently sourcing candidates</p>
        </div>

        {/* Closed / Inactive */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)] px-4 py-3 transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Closed / Inactive
            </span>
            <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-400 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-none">
            {closedCount} Closed
          </div>
          <p className="text-[11px] text-slate-400 mt-1 m-0">Archived or paused requisitions</p>
        </div>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className={`${cardClass} p-4 flex flex-col sm:flex-row items-center justify-between gap-3`}>
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by title, location, skill..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white placeholder:text-slate-400 focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-start sm:justify-end">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200/90 text-xs font-semibold text-slate-700 bg-white focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all cursor-pointer shadow-[0_1px_2px_rgba(15,23,42,0.02)]"
          >
            <option value="ALL">All Statuses ({jobs.length})</option>
            <option value="PUBLISHED">Published ({publishedCount})</option>
            <option value="CLOSED">Closed ({closedCount})</option>
          </select>

          {/* Work Mode Filter */}
          <select
            value={workModeFilter}
            onChange={e => setWorkModeFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200/90 text-xs font-semibold text-slate-700 bg-white focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all cursor-pointer shadow-[0_1px_2px_rgba(15,23,42,0.02)]"
          >
            <option value="ALL">All Work Modes</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="On-site">On-site</option>
          </select>

          {/* Hiring Pod Filter */}
          {availableGroups.length > 0 && (
            <select
              value={groupFilter}
              onChange={e => setGroupFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-200/90 text-xs font-semibold text-slate-700 bg-white focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all cursor-pointer shadow-[0_1px_2px_rgba(15,23,42,0.02)]"
            >
              <option value="ALL">All Hiring Pods ({availableGroups.length})</option>
              {availableGroups.map(grp => (
                <option key={grp} value={grp}>Pod: {grp}</option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={fetchJobs}
            title="Refresh jobs list"
            className="p-2 rounded-xl border border-slate-200/80 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer bg-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#5C59E8]' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── The Jobs Table ── */}
      <div className={`${cardClass} overflow-hidden`}>
        {loading ? (
          <div className="p-16 text-center">
            <Loader2 className="w-8 h-8 text-[#5C59E8] animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-slate-500">Loading posted requisitions...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#5C59E8]/10 text-[#4845D2] flex items-center justify-center mx-auto mb-3">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 m-0">
              {searchQuery || statusFilter !== 'ALL' || workModeFilter !== 'ALL'
                ? 'No matching requisitions found'
                : 'No job requisitions posted yet'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1.5 leading-relaxed">
              {searchQuery || statusFilter !== 'ALL' || workModeFilter !== 'ALL'
                ? 'Try adjusting your search criteria or resetting filters.'
                : !canPostJob
                  ? 'No job requisitions have been posted by recruiters yet.'
                  : 'Create and publish job requisitions to source candidates and screen applicants.'}
            </p>
            {canPostJob && (
              <button
                type="button"
                onClick={() => setActiveTab?.('post_job')}
                className="mt-4 px-4 py-2 rounded-lg bg-[#FF7043] hover:bg-[#E65B30] text-white text-xs font-semibold border-none cursor-pointer inline-flex items-center gap-1.5 shadow-[0_1px_2px_rgba(255,112,67,0.3)] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Post First Job
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Title & Location</th>
                  <th className="py-3.5 px-5">Work Mode</th>
                  <th className="py-3.5 px-5">Skills Required</th>
                  <th className="py-3.5 px-5">Status</th>
                  {!isAdmin && <th className="py-3.5 px-5 text-center">Applicants</th>}
                  {!isAdmin && <th className="py-3.5 px-5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredJobs.map(job => {
                  const isPublished = job.status === 'PUBLISHED';
                  const isToggling = togglingId === job.id;
                  const salary = formatSalary(job);

                  return (
                    <tr key={job.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Title & Location */}
                      <td className="py-4 px-5">
                        <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                          {job.title}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {job.location}
                          </span>
                          <span>•</span>
                          <span>{job.job_type || 'Full-Time'}</span>
                          {salary && (
                            <>
                              <span>•</span>
                              <span className="font-semibold text-emerald-700">
                                {salary}
                              </span>
                            </>
                          )}
                          {Array.isArray(job.screening_questions) && job.screening_questions.length > 0 && (
                            <>
                              <span>•</span>
                              <Badge tone="indigo">
                                {job.screening_questions.length} Screening {job.screening_questions.length === 1 ? 'Q' : 'Qs'}
                              </Badge>
                            </>
                          )}
                          {Array.isArray(job.interview_rounds) && job.interview_rounds.length > 0 && (
                            <>
                              <span>•</span>
                              <Badge tone="emerald">
                                {job.interview_rounds.length} Interview {job.interview_rounds.length === 1 ? 'Round' : 'Rounds'}
                              </Badge>
                            </>
                          )}
                          {job.group_name && (
                            <>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                                <Layers className="w-3 h-3 text-indigo-500" />
                                {job.group_name}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Work Mode */}
                      <td className="py-4 px-5">
                        <Badge tone={getWorkModeTone(job.work_mode)}>
                          {job.work_mode || 'Remote'}
                        </Badge>
                      </td>

                      {/* Skills Required */}
                      <td className="py-4 px-5">
                        <div className="flex gap-1.5 flex-wrap max-w-xs">
                          {(job.skills && job.skills.length > 0 ? job.skills : ['Digital Marketing', 'Growth']).slice(0, 3).map((sk, i) => (
                            <Badge key={i} tone="slate">
                              {sk}
                            </Badge>
                          ))}
                          {(job.skills || []).length > 3 && (
                            <span className="text-[10px] text-slate-400 font-semibold self-center">
                              +{(job.skills || []).length - 3} more
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                          isPublished
                            ? 'bg-[#00A884]/8 text-[#00846A] ring-1 ring-inset ring-[#00A884]/15'
                            : 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200/70'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                          {job.status}
                        </span>
                      </td>

                      {/* Applicants (hidden for Administrator) */}
                      {!isAdmin && (
                        <td className="py-4 px-5 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedJobId?.(job.id);
                              setActiveTab?.('applicants_view');
                            }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${(job.applicant_count || 0) > 0
                              ? 'bg-[#5C59E8]/10 hover:bg-[#5C59E8]/15 text-[#4845D2] border-[#5C59E8]/20 shadow-[0_1px_2px_rgba(92,89,232,0.06)]'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200/80'
                            }`}
                            title={`View ${job.applicant_count || 0} candidate applicant(s)`}
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>{job.applicant_count || 0}</span>
                          </button>
                        </td>
                      )}

                      {/* Actions */}
                      {!isAdmin && (
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Edit Job Option */}
                            <button
                              type="button"
                              onClick={() => handleStartEdit(job)}
                              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 text-xs font-semibold transition-all shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex items-center gap-1.5 cursor-pointer"
                              title="Edit job details"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                              <span>Edit</span>
                            </button>

                            {/* Status Toggle */}
                            <button
                              type="button"
                              disabled={isToggling}
                              onClick={() => handleToggleStatus(job.id, job.status)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                                isPublished
                                  ? 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)]'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200/80 shadow-[0_1px_2px_rgba(16,185,129,0.1)]'
                              }`}
                              title="Toggle publication status"
                            >
                              {isToggling ? '...' : (isPublished ? 'Close Job' : 'Publish Job')}
                            </button>

                            {/* View Applicants */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedJobId?.(job.id);
                                setActiveTab?.('applicants_view');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-[0_1px_2px_rgba(15,23,42,0.1)] flex items-center gap-1.5 cursor-pointer border-none"
                              title="Review job applicants"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Applicants ({job.applicant_count || 0})</span>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Edit Job Modal ── */}
      {editingJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-3xl my-auto overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#5C59E8]/10 text-[#4845D2] flex items-center justify-center font-bold">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-semibold text-slate-900 m-0">
                      Edit Job Requisition
                    </h2>
                    <Badge tone="slate">ID #{editingJob.id}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 m-0">
                    Modify requisition parameters, required capabilities, compensation, and requirements.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingJob(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleSaveEdit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
                {editError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{editError}</span>
                  </div>
                )}

                {/* Section 1: Core Requisition Details */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-slate-900 text-xs pb-1 border-b border-slate-100">
                    <Briefcase className="w-4 h-4 text-[#5C59E8]" />
                    <span>Basic Position Information</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Job Title *</label>
                      <input
                        type="text"
                        required
                        value={editFormData.title}
                        onChange={e => setEditFormData({ ...editFormData, title: e.target.value })}
                        placeholder="e.g. Senior Performance Marketing Manager"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Specialization</label>
                      <input
                        type="text"
                        value={editFormData.specialization}
                        onChange={e => setEditFormData({ ...editFormData, specialization: e.target.value })}
                        placeholder="e.g. Full-Stack / Paid Search / Growth"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Location *</label>
                      <input
                        type="text"
                        required
                        value={editFormData.location}
                        onChange={e => setEditFormData({ ...editFormData, location: e.target.value })}
                        placeholder="e.g. San Francisco, CA or Remote"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Work Mode *</label>
                      <select
                        value={editFormData.work_mode}
                        onChange={e => setEditFormData({ ...editFormData, work_mode: e.target.value })}
                        className={selectClass}
                      >
                        <option value="Remote">Remote</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="On-site">On-site</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Job Type *</label>
                      <select
                        value={editFormData.job_type}
                        onChange={e => setEditFormData({ ...editFormData, job_type: e.target.value })}
                        className={selectClass}
                      >
                        <option value="Full-Time">Full-Time</option>
                        <option value="Part-Time">Part-Time</option>
                        <option value="Contract">Contract</option>
                        <option value="Internship">Internship</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Experience & Compensation */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-slate-900 text-xs pb-1 border-b border-slate-100">
                    <DollarSign className="w-4 h-4 text-[#5C59E8]" />
                    <span>Experience & Compensation</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Min Experience</label>
                      <input
                        type="text"
                        value={editFormData.min_experience}
                        onChange={e => setEditFormData({ ...editFormData, min_experience: e.target.value })}
                        placeholder="e.g. 3 years"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Experience Level</label>
                      <select
                        value={editFormData.experience_level}
                        onChange={e => setEditFormData({ ...editFormData, experience_level: e.target.value })}
                        className={selectClass}
                      >
                        <option value="Entry Level">Entry Level</option>
                        <option value="Mid Level">Mid Level</option>
                        <option value="Senior Level">Senior Level</option>
                        <option value="Lead / Principal">Lead / Principal</option>
                        <option value="Executive">Executive</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Ownership Level</label>
                      <select
                        value={editFormData.ownership_level}
                        onChange={e => setEditFormData({ ...editFormData, ownership_level: e.target.value })}
                        className={selectClass}
                      >
                        <option value="End-to-End Ownership">End-to-End Ownership</option>
                        <option value="Project / Pod Lead">Project / Pod Lead</option>
                        <option value="Autonomous Contributor">Autonomous Contributor</option>
                        <option value="Strategic Department Head">Strategic Department Head</option>
                        <option value="Individual Contributor">Individual Contributor</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Salary Currency</label>
                      <select
                        value={editFormData.salary_currency}
                        onChange={e => setEditFormData({ ...editFormData, salary_currency: e.target.value })}
                        className={selectClass}
                      >
                        <option value="USD">USD ($)</option>
                        <option value="INR">INR (₹)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="CAD">CAD ($)</option>
                        <option value="SGD">SGD ($)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Min Salary (Annual)</label>
                      <input
                        type="number"
                        value={editFormData.salary_min}
                        onChange={e => setEditFormData({ ...editFormData, salary_min: e.target.value })}
                        placeholder="e.g. 60000"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Max Salary (Annual)</label>
                      <input
                        type="number"
                        value={editFormData.salary_max}
                        onChange={e => setEditFormData({ ...editFormData, salary_max: e.target.value })}
                        placeholder="e.g. 100000"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Skills & Capabilities */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-slate-900 text-xs pb-1 border-b border-slate-100">
                    <Layers className="w-4 h-4 text-[#5C59E8]" />
                    <span>Skills & Capabilities</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Required Skills (comma-separated) *
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.skills}
                      onChange={e => setEditFormData({ ...editFormData, skills: e.target.value })}
                      placeholder="e.g. React, Node.js, TypeScript, PostgreSQL"
                      className={inputClass}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Must-have capabilities</label>
                      <textarea
                        rows={3}
                        value={editFormData.must_have_capabilities}
                        onChange={e => setEditFormData({ ...editFormData, must_have_capabilities: e.target.value })}
                        placeholder="Core non-negotiables for candidates..."
                        className={textareaClass}
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Preferred capabilities</label>
                      <textarea
                        rows={3}
                        value={editFormData.preferred_capabilities}
                        onChange={e => setEditFormData({ ...editFormData, preferred_capabilities: e.target.value })}
                        placeholder="Nice-to-have qualifications..."
                        className={textareaClass}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 4: Description */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-slate-900 text-xs pb-1 border-b border-slate-100">
                    <FileText className="w-4 h-4 text-[#5C59E8]" />
                    <span>Job Description</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Detailed Description *</label>
                    <textarea
                      rows={4}
                      required
                      value={editFormData.description}
                      onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                      placeholder="Detail the position scope, team context, responsibilities, and expected outcomes..."
                      className={textareaClass}
                    />
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 px-6 bg-slate-50/70 border-t border-slate-200/80 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  disabled={savingJob}
                  onClick={() => setEditingJob(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingJob}
                  className="px-5 py-2 rounded-lg bg-[#FF7043] hover:bg-[#E65B30] text-white text-xs font-semibold transition-all shadow-[0_1px_2px_rgba(255,112,67,0.3)] flex items-center gap-2 cursor-pointer border-none disabled:opacity-50"
                >
                  {savingJob ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
