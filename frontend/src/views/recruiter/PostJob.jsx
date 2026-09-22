import React, { useState } from 'react';
import { Briefcase, Plus, CheckCircle2, AlertCircle, ArrowLeft, Loader2, Compass } from 'lucide-react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function PostJob({ setActiveTab }) {
  const { user } = useAuth();
  const compProfile = user?.profile || {};

  const [formData, setFormData] = useState({
    title: '',
    specialization: '',
    ownership_level: 'End-to-End Ownership',
    availability_requirement: 'Immediate (0-15 days)',
    must_have_capabilities: '',
    preferred_capabilities: '',
    description: '',
    skills: '',
    min_experience: '',
    salary_min: '',
    salary_max: '',
    salary_currency: 'USD',
    location: '',
    work_mode: 'Remote',
    job_type: 'Full-Time',
    business_problem: compProfile.business_problem || 'Lead volume is rising, but qualified pipeline is inconsistent.',
    expected_outcome: compProfile.expected_outcome || 'Build a repeatable demand programme and improve lead-to-opportunity quality.',
    team_support: compProfile.team_support || 'Marketing head, content specialist, shared design support',
    monthly_budget_range: compProfile.monthly_budget_range || '₹8–12 lakh',
    decision_authority: compProfile.decision_authority || 'Own campaigns and recommend budget allocation',
    success_horizon: compProfile.success_horizon || 'First 90 days'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(Boolean);
      await api.createJob({
        ...formData,
        salary_min: parseInt(formData.salary_min) || 0,
        salary_max: parseInt(formData.salary_max) || 0,
        skills: skillsArray
      });
      setSuccess(true);
      setTimeout(() => {
        setActiveTab?.('manage_jobs');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to post job requisition.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6 select-text text-slate-800">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-teal-50 text-[#00a884] flex items-center justify-center font-bold">
              <Briefcase className="w-4 h-4" />
            </span>
            Post New Job Requisition
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create and publish a new job opening to source top marketers and engineers across your recruitment funnel.
          </p>
        </div>

        {setActiveTab && (
          <button
            type="button"
            onClick={() => setActiveTab('manage_jobs')}
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all bg-white shadow-2xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Jobs
          </button>
        )}
      </div>

      {/* Success Banner */}
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Job requisition posted successfully! Redirecting to Manage Jobs...</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Container */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-2xs">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Job Title & Specialization */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Job Title *</label>
              <input
                type="text"
                name="title"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50"
                placeholder="e.g. Senior Performance Marketing Manager"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Specialization *</label>
              <input
                type="text"
                name="specialization"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50"
                placeholder="e.g. Paid Search, Meta Ads, MarTech Engineering"
                value={formData.specialization}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Role Parameters: Work Mode, Job Type, Ownership Level, Availability */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Work Mode *</label>
              <select
                name="work_mode"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:border-black outline-none cursor-pointer shadow-2xs"
                value={formData.work_mode}
                onChange={handleChange}
              >
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Job Type *</label>
              <select
                name="job_type"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:border-black outline-none cursor-pointer shadow-2xs"
                value={formData.job_type}
                onChange={handleChange}
              >
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ownership level *</label>
              <select
                name="ownership_level"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:border-black outline-none cursor-pointer shadow-2xs"
                value={formData.ownership_level}
                onChange={handleChange}
              >
                <option value="End-to-End Ownership">End-to-End Ownership</option>
                <option value="Project / Pod Lead">Project / Pod Lead</option>
                <option value="Autonomous Contributor">Autonomous Contributor</option>
                <option value="Strategic Department Head">Strategic Department Head</option>
                <option value="Individual Contributor">Individual Contributor</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Availability requirement *</label>
              <select
                name="availability_requirement"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:border-black outline-none cursor-pointer shadow-2xs"
                value={formData.availability_requirement}
                onChange={handleChange}
              >
                <option value="Immediate (0-15 days)">Immediate (0-15 days)</option>
                <option value="Within 30 days">Within 30 days</option>
                <option value="Within 45-60 days">Within 45-60 days</option>
                <option value="Notice Period Buyout">Notice Period Buyout</option>
                <option value="Flexible">Flexible</option>
              </select>
            </div>
          </div>

          {/* Salary, Min Experience & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Min Salary (Annual)</label>
              <input
                type="number"
                name="salary_min"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50"
                placeholder="e.g. 75000"
                value={formData.salary_min}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Max Salary (Annual)</label>
              <input
                type="number"
                name="salary_max"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50"
                placeholder="e.g. 110000"
                value={formData.salary_max}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Min Experience *</label>
              <input
                type="text"
                name="min_experience"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50"
                placeholder="e.g. 3 years"
                value={formData.min_experience}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Location *</label>
              <input
                type="text"
                name="location"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50"
                placeholder="e.g. San Francisco, CA or Remote"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Capabilities Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Must-have capabilities *
              </label>
              <textarea
                name="must_have_capabilities"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50 leading-relaxed"
                rows={3}
                placeholder="e.g. Proven track record managing high ad spend, ROAS modeling, deep Google Ads & Meta Ads proficiency."
                value={formData.must_have_capabilities}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Preferred capabilities
              </label>
              <textarea
                name="preferred_capabilities"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50 leading-relaxed"
                rows={3}
                placeholder="e.g. Segment CDP, BigQuery analytics, high-converting creative copy, and marketing automation."
                value={formData.preferred_capabilities}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Skills Required */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Required Skills (Comma Separated) *
            </label>
            <input
              type="text"
              name="skills"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50"
              placeholder="e.g. Meta Ads, Google Ads, SEO, GA4, Copywriting"
              value={formData.skills}
              onChange={handleChange}
              required
            />
          </div>

          {/* ── Hiring Need ── */}
          <div className="p-4 sm:p-5 bg-emerald-50/40 rounded-2xl border border-emerald-100 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-emerald-200/50">
              <Compass className="w-4 h-4 text-[#00a884]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Hiring Need
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Business problem</label>
                <textarea
                  name="business_problem"
                  rows={2}
                  value={formData.business_problem}
                  onChange={handleChange}
                  placeholder="Lead volume is rising, but qualified pipeline is inconsistent."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-black outline-none bg-white leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Expected outcome</label>
                <textarea
                  name="expected_outcome"
                  rows={2}
                  value={formData.expected_outcome}
                  onChange={handleChange}
                  placeholder="Build a repeatable demand programme and improve lead-to-opportunity quality."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-black outline-none bg-white leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Team support</label>
                  <input
                    type="text"
                    name="team_support"
                    value={formData.team_support}
                    onChange={handleChange}
                    placeholder="Marketing head, content specialist, shared design support"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-black outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Monthly budget range</label>
                  <input
                    type="text"
                    name="monthly_budget_range"
                    value={formData.monthly_budget_range}
                    onChange={handleChange}
                    placeholder="₹8–12 lakh"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-black outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Decision authority</label>
                  <input
                    type="text"
                    name="decision_authority"
                    value={formData.decision_authority}
                    onChange={handleChange}
                    placeholder="Own campaigns and recommend budget allocation"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-black outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Success horizon</label>
                  <input
                    type="text"
                    name="success_horizon"
                    value={formData.success_horizon}
                    onChange={handleChange}
                    placeholder="First 90 days"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-black outline-none bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Job Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Job Description & Responsibilities *
            </label>
            <textarea
              name="description"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50 leading-relaxed"
              rows={6}
              placeholder="Outline role responsibilities, key performance indicators, required tools, and company perks..."
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          {/* Submit Action */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-black hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer border-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing Job Requisition...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Publish Job Requisition</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
