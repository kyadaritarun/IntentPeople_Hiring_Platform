import React, { useState, useEffect } from 'react';
import {
  Briefcase, Eye, Plus, Search, Filter, X, RefreshCw,
  CheckCircle2, Clock, MapPin, Users, Building2,
  ChevronRight, ArrowUpRight, Sparkles, Loader2, AlertCircle,
  Edit3, Save, DollarSign, Layers, FileText
} from 'lucide-react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';

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

    return matchesSearch && matchesStatus && matchesWorkMode;
  });

  const publishedCount = jobs.filter(j => j.status === 'PUBLISHED').length;
  const closedCount = jobs.filter(j => j.status === 'CLOSED').length;

  const getWorkModeBadge = (mode) => {
    const m = (mode || '').toLowerCase();
    if (m === 'remote') return 'bg-teal-50 text-[#00a884] border-teal-200/80';
    if (m === 'hybrid') return 'bg-blue-50 text-blue-700 border-blue-200/80';
    return 'bg-purple-50 text-purple-700 border-purple-200/80';
  };

  return (
    <div className="p-4 sm:p-8 max-w-10xl mx-auto space-y-6 select-text text-slate-800">

      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-teal-50 text-[#00a884] flex items-center justify-center font-bold">
              <Briefcase className="w-4 h-4" />
            </span>
            Manage Posted Jobs & Requisitions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isAdmin
              ? 'Monitor active requisitions, work modes, required skills, and publication statuses across your organization.'
              : isHiringManager
                ? 'Review active requisitions, job criteria, and requisition details for candidate evaluation.'
                : 'Monitor active requisitions, calibrate hiring pipelines, manage job statuses, and review applicant submissions.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchJobs}
            title="Refresh jobs list"
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer bg-white shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#00a884]' : ''}`} />
          </button>

          {canPostJob && (
            <button
              type="button"
              onClick={() => setActiveTab?.('post_job')}
              className="px-4 py-2 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer border-none shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Post New Job
            </button>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs font-medium flex items-center justify-between shadow-lg animate-in fade-in">
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage('')}
            className="text-slate-400 hover:text-white border-none bg-transparent cursor-pointer ml-4"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Quick Metrics Bar ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total Requisitions
          </span>
          <div className="text-xl font-black text-slate-900 flex items-center justify-between">
            <span>{jobs.length} Positions</span>
            <Briefcase className="w-5 h-5 text-slate-300" />
          </div>
          <span className="text-[0.65rem] text-slate-400 mt-1 block">Full agency pipeline</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[0.68rem] font-bold uppercase tracking-wider text-emerald-600 block mb-1">
            Active & Published
          </span>
          <div className="text-xl font-black text-emerald-700 flex items-center justify-between">
            <span>{publishedCount} Live</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <span className="text-[0.65rem] text-slate-400 mt-1 block">Sourcing candidates</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Closed / Inactive
          </span>
          <div className="text-xl font-black text-slate-700 flex items-center justify-between">
            <span>{closedCount} Closed</span>
            <Clock className="w-5 h-5 text-slate-400" />
          </div>
          <span className="text-[0.65rem] text-slate-400 mt-1 block">Archived or paused</span>
        </div>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by title, location, skill..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all bg-slate-50/50"
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
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:border-black cursor-pointer shadow-2xs"
          >
            <option value="ALL">All Statuses ({jobs.length})</option>
            <option value="PUBLISHED">Published ({publishedCount})</option>
            <option value="CLOSED">Closed ({closedCount})</option>
          </select>

          {/* Work Mode Filter */}
          <select
            value={workModeFilter}
            onChange={e => setWorkModeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:border-black cursor-pointer shadow-2xs"
          >
            <option value="ALL">All Work Modes</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="On-site">On-site</option>
          </select>

          <button
            type="button"
            onClick={fetchJobs}
            title="Refresh jobs list"
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer bg-white"
          >
            <Briefcase className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── The Jobs Table ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-7 h-7 border-2 border-slate-200 border-t-[#00a884] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-500">Loading posted jobs...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#00a884] flex items-center justify-center mx-auto mb-3">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-800">
              {searchQuery || statusFilter !== 'ALL' || workModeFilter !== 'ALL'
                ? 'No matching jobs found'
                : 'No job requisitions posted yet'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
              {searchQuery || statusFilter !== 'ALL' || workModeFilter !== 'ALL'
                ? 'Try adjusting your search criteria or filters.'
                : !canPostJob
                  ? 'No job requisitions have been posted by recruiters yet.'
                  : 'Create and publish job requisitions to source candidates and screen applicants.'}
            </p>
            {canPostJob && (
              <button
                type="button"
                onClick={() => setActiveTab?.('post_job')}
                className="mt-4 px-4 py-2 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-bold border-none cursor-pointer inline-flex items-center gap-2 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Post First Job
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[0.68rem] font-extrabold text-slate-400 uppercase tracking-wider">
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

                  return (
                    <tr key={job.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Title & Location */}
                      <td className="py-4 px-5">
                        <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                          {job.title}
                        </div>
                        <div className="flex items-center gap-2 text-[0.68rem] text-slate-500 mt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {job.location}
                          </span>
                          <span>•</span>
                          <span>{job.job_type || 'Full-Time'}</span>
                          {(job.salary_range || (job.salary_min || job.salary_max)) && (
                            <>
                              <span>•</span>
                              <span className="font-bold text-emerald-700">
                                {job.salary_range || (
                                  `${job.salary_currency === 'INR' ? '₹' : (job.salary_currency === 'EUR' ? '€' : (job.salary_currency === 'GBP' ? '£' : '$'))}${job.salary_min ? job.salary_min.toLocaleString() : '0'} - ${job.salary_currency === 'INR' ? '₹' : (job.salary_currency === 'EUR' ? '€' : (job.salary_currency === 'GBP' ? '£' : '$'))}${job.salary_max ? job.salary_max.toLocaleString() : 'Negotiable'}`
                                )}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Work Mode */}
                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.68rem] font-extrabold border ${getWorkModeBadge(job.work_mode)}`}>
                          {job.work_mode || 'Remote'}
                        </span>
                      </td>

                      {/* Skills Required */}
                      <td className="py-4 px-5">
                        <div className="flex gap-1.5 flex-wrap max-w-xs">
                          {(job.skills && job.skills.length > 0 ? job.skills : ['Digital Marketing', 'Growth']).slice(0, 3).map((sk, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[0.68rem] font-bold"
                            >
                              {sk}
                            </span>
                          ))}
                          {(job.skills || []).length > 3 && (
                            <span className="text-[0.65rem] text-slate-400 font-bold self-center">
                              +{(job.skills || []).length - 3} more
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.68rem] font-extrabold border ${isPublished
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                            }`} />
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
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border transition-all cursor-pointer ${(job.applicant_count || 0) > 0
                                ? 'bg-teal-50 hover:bg-teal-100 text-[#00a884] border-teal-200/80 shadow-2xs'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200'
                              }`}
                            title={`View ${job.applicant_count || 0} candidate applicant(s)`}
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>{job.applicant_count || 0}</span>
                          </button>
                        </td>
                      )}

                      {/* Actions (hidden for Administrator: Edit, Close Job & Applicants) */}
                      {!isAdmin && (
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Edit Job Option - Only for Recruiter */}
                            <button
                              type="button"
                              onClick={() => handleStartEdit(job)}
                              className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#00a884] border border-teal-200/80 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                              title="Edit job details"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              disabled={isToggling}
                              onClick={() => handleToggleStatus(job.id, job.status)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${isPublished
                                  ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 shadow-2xs'
                                }`}
                              title="Toggle publication status"
                            >
                              {isToggling ? '...' : (isPublished ? 'Close Job' : 'Publish Job')}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedJobId?.(job.id);
                                setActiveTab?.('applicants_view');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer border-none"
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl my-auto overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#00a884] border border-teal-200/60 flex items-center justify-center font-bold">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-slate-900">
                      Edit Job Requisition
                    </h2>
                    <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                      ID #{editingJob.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Modify requisition parameters, required capabilities, compensation, and requirements.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingJob(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleSaveEdit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
                {editError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{editError}</span>
                  </div>
                )}

                {/* Section 1: Core Requisition Details */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs pb-1 border-b border-slate-100">
                    <Briefcase className="w-4 h-4 text-[#00a884]" />
                    <span>Basic Position Information</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Job Title *</label>
                      <input
                        type="text"
                        required
                        value={editFormData.title}
                        onChange={e => setEditFormData({ ...editFormData, title: e.target.value })}
                        placeholder="e.g. Senior Performance Marketing Manager"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Specialization</label>
                      <input
                        type="text"
                        value={editFormData.specialization}
                        onChange={e => setEditFormData({ ...editFormData, specialization: e.target.value })}
                        placeholder="e.g. Full-Stack / Paid Search / Growth"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Location *</label>
                      <input
                        type="text"
                        required
                        value={editFormData.location}
                        onChange={e => setEditFormData({ ...editFormData, location: e.target.value })}
                        placeholder="e.g. San Francisco, CA or Remote"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Work Mode *</label>
                      <select
                        value={editFormData.work_mode}
                        onChange={e => setEditFormData({ ...editFormData, work_mode: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:border-black outline-none cursor-pointer"
                      >
                        <option value="Remote">Remote</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="On-site">On-site</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Job Type *</label>
                      <select
                        value={editFormData.job_type}
                        onChange={e => setEditFormData({ ...editFormData, job_type: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:border-black outline-none cursor-pointer"
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
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs pb-1 border-b border-slate-100">
                    <DollarSign className="w-4 h-4 text-[#00a884]" />
                    <span>Experience & Compensation</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Min Experience</label>
                      <input
                        type="text"
                        value={editFormData.min_experience}
                        onChange={e => setEditFormData({ ...editFormData, min_experience: e.target.value })}
                        placeholder="e.g. 3 years"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Experience Level</label>
                      <select
                        value={editFormData.experience_level}
                        onChange={e => setEditFormData({ ...editFormData, experience_level: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:border-black outline-none cursor-pointer"
                      >
                        <option value="Entry Level">Entry Level</option>
                        <option value="Mid Level">Mid Level</option>
                        <option value="Senior Level">Senior Level</option>
                        <option value="Lead / Principal">Lead / Principal</option>
                        <option value="Executive">Executive</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Ownership Level</label>
                      <select
                        value={editFormData.ownership_level}
                        onChange={e => setEditFormData({ ...editFormData, ownership_level: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:border-black outline-none cursor-pointer"
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
                      <label className="block font-bold text-slate-700 mb-1">Salary Currency</label>
                      <select
                        value={editFormData.salary_currency}
                        onChange={e => setEditFormData({ ...editFormData, salary_currency: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:border-black outline-none cursor-pointer"
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
                      <label className="block font-bold text-slate-700 mb-1">Min Salary (Annual)</label>
                      <input
                        type="number"
                        value={editFormData.salary_min}
                        onChange={e => setEditFormData({ ...editFormData, salary_min: e.target.value })}
                        placeholder="e.g. 60000"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Max Salary (Annual)</label>
                      <input
                        type="number"
                        value={editFormData.salary_max}
                        onChange={e => setEditFormData({ ...editFormData, salary_max: e.target.value })}
                        placeholder="e.g. 100000"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Skills & Capabilities */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs pb-1 border-b border-slate-100">
                    <Layers className="w-4 h-4 text-[#00a884]" />
                    <span>Skills & Capabilities</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Required Skills (comma-separated) *
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.skills}
                      onChange={e => setEditFormData({ ...editFormData, skills: e.target.value })}
                      placeholder="e.g. React, Node.js, TypeScript, PostgreSQL"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Must-have capabilities</label>
                      <textarea
                        rows={3}
                        value={editFormData.must_have_capabilities}
                        onChange={e => setEditFormData({ ...editFormData, must_have_capabilities: e.target.value })}
                        placeholder="Core non-negotiables for candidates..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50 leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Preferred capabilities</label>
                      <textarea
                        rows={3}
                        value={editFormData.preferred_capabilities}
                        onChange={e => setEditFormData({ ...editFormData, preferred_capabilities: e.target.value })}
                        placeholder="Nice-to-have qualifications..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50 leading-relaxed"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 4: Description */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs pb-1 border-b border-slate-100">
                    <FileText className="w-4 h-4 text-[#00a884]" />
                    <span>Job Description</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Detailed Description *</label>
                    <textarea
                      rows={4}
                      required
                      value={editFormData.description}
                      onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                      placeholder="Detail the position scope, team context, responsibilities, and expected outcomes..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50 leading-relaxed"
                    />
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 px-6 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  disabled={savingJob}
                  onClick={() => setEditingJob(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingJob}
                  className="px-5 py-2 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer border-none disabled:opacity-50"
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
