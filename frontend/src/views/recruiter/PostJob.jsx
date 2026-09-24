import React, { useState } from 'react';
import { 
  Briefcase, Plus, CheckCircle2, AlertCircle, ArrowLeft, Loader2, Compass, 
  HelpCircle, Trash2, ListPlus, Sparkles, CheckSquare, X, ChevronDown 
} from 'lucide-react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';

const QUESTION_TEMPLATES = [
  {
    label: 'Years of Experience',
    question: 'How many years of relevant experience do you have in this specialization?',
    type: 'choice',
    options: ['Less than 1 year', '1 - 3 years', '3 - 5 years', '5+ years'],
    required: true
  },
  {
    label: 'Notice Period',
    question: 'What is your current notice period / earliest joining date?',
    type: 'choice',
    options: ['Immediate (0-15 days)', '30 days', '60-90 days'],
    required: true
  },
  {
    label: 'Work Authorization',
    question: 'Are you legally authorized to work in this job location without visa sponsorship?',
    type: 'yes_no',
    options: ['Yes', 'No'],
    required: true
  },
  {
    label: 'Portfolio / Samples',
    question: 'Please provide a link to your live portfolio, case study, or GitHub repository.',
    type: 'text',
    options: [],
    required: false
  }
];

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

  const [screeningQuestions, setScreeningQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addQuestion = (type = 'text', customQuestion = '') => {
    const newQ = {
      id: `sq_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      question: customQuestion || '',
      type: type, // 'text', 'choice', 'yes_no', 'number'
      options: type === 'choice' ? ['Option 1', 'Option 2'] : [],
      required: true
    };
    setScreeningQuestions(prev => [...prev, newQ]);
  };

  const updateQuestion = (id, field, value) => {
    setScreeningQuestions(prev => prev.map(q => {
      if (q.id !== id) return q;
      const updated = { ...q, [field]: value };
      if (field === 'type' && value === 'choice' && (!updated.options || updated.options.length === 0)) {
        updated.options = ['Option 1', 'Option 2'];
      }
      return updated;
    }));
  };

  const removeQuestion = (id) => {
    setScreeningQuestions(prev => prev.filter(q => q.id !== id));
  };

  const addOption = (questionId) => {
    setScreeningQuestions(prev => prev.map(q => {
      if (q.id !== questionId) return q;
      const currentOpts = q.options || [];
      return { ...q, options: [...currentOpts, `Option ${currentOpts.length + 1}`] };
    }));
  };

  const updateOption = (questionId, optIndex, value) => {
    setScreeningQuestions(prev => prev.map(q => {
      if (q.id !== questionId) return q;
      const opts = [...(q.options || [])];
      opts[optIndex] = value;
      return { ...q, options: opts };
    }));
  };

  const removeOption = (questionId, optIndex) => {
    setScreeningQuestions(prev => prev.map(q => {
      if (q.id !== questionId) return q;
      const opts = (q.options || []).filter((_, i) => i !== optIndex);
      return { ...q, options: opts.length > 0 ? opts : ['Option 1'] };
    }));
  };

  const addTemplate = (template) => {
    const newQ = {
      id: `sq_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      ...template,
      options: template.options ? [...template.options] : []
    };
    setScreeningQuestions(prev => [...prev, newQ]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(Boolean);

      // Clean and validate questions
      const cleanedQuestions = screeningQuestions
        .filter(q => q.question && q.question.trim().length > 0)
        .map(q => ({
          id: q.id,
          question: q.question.trim(),
          type: q.type || 'text',
          options: q.type === 'choice' 
            ? (q.options || []).map(o => String(o).trim()).filter(Boolean)
            : (q.type === 'yes_no' ? ['Yes', 'No'] : []),
          required: Boolean(q.required)
        }));

      await api.createJob({
        ...formData,
        salary_min: parseInt(formData.salary_min) || 0,
        salary_max: parseInt(formData.salary_max) || 0,
        skills: skillsArray,
        screening_questions: cleanedQuestions
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

          {/* ── Candidate Screening Questions Builder ── */}
          <div className="p-5 sm:p-6 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <ListPlus className="w-4 h-4" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Candidate Screening Questions
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {screeningQuestions.length} {screeningQuestions.length === 1 ? 'Question' : 'Questions'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Ask candidates specific questions when they apply to evaluate qualifications faster.
                  </p>
                </div>
              </div>

              {/* Add Question Button */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => addQuestion('text')}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs border-none cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Question</span>
                </button>
              </div>
            </div>

            {/* Quick Templates Bar */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Quick Add:
              </span>
              {QUESTION_TEMPLATES.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => addTemplate(tpl)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-700 hover:text-indigo-900 text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                  title={`Add '${tpl.question}'`}
                >
                  <Plus className="w-3 h-3 text-indigo-500" />
                  <span>{tpl.label}</span>
                </button>
              ))}
            </div>

            {/* Question Cards List */}
            {screeningQuestions.length === 0 ? (
              <div className="py-8 text-center bg-white rounded-xl border border-dashed border-slate-200 p-4">
                <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">No screening questions added yet</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-1">
                  Click "+ Add Question" or pick a template above to require candidates to provide custom answers (experience, portfolio, notice period, etc.).
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {screeningQuestions.map((q, idx) => (
                  <div 
                    key={q.id}
                    className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-3 hover:border-slate-300 transition-colors"
                  >
                    {/* Header: Question Number, Type Selector, Required Toggle, Delete */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">
                          Q{idx + 1}
                        </span>
                        <div className="relative">
                          <select
                            value={q.type}
                            onChange={(e) => updateQuestion(q.id, 'type', e.target.value)}
                            className="pl-2.5 pr-7 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 outline-none cursor-pointer appearance-none"
                          >
                            <option value="text">Short / Long Text</option>
                            <option value="choice">Multiple Choice</option>
                            <option value="yes_no">Yes / No</option>
                            <option value="number">Numeric Answer</option>
                          </select>
                          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Required Toggle */}
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700 select-none">
                          <input
                            type="checkbox"
                            checked={q.required}
                            onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)}
                            className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-0 border-slate-300 cursor-pointer"
                          />
                          <span>Required</span>
                        </label>

                        {/* Delete Question */}
                        <button
                          type="button"
                          onClick={() => removeQuestion(q.id)}
                          className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors border-none cursor-pointer"
                          title="Delete this question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Question Text Input */}
                    <div>
                      <input
                        type="text"
                        value={q.question}
                        onChange={(e) => updateQuestion(q.id, 'question', e.target.value)}
                        placeholder="Type question here (e.g. How many years of experience do you have with Google Ads?)"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none bg-slate-50/50"
                        required
                      />
                    </div>

                    {/* Multiple Choice Options Builder */}
                    {q.type === 'choice' && (
                      <div className="pl-3 border-l-2 border-indigo-200 space-y-2 pt-1">
                        <div className="text-[11px] font-bold text-slate-600">Candidate Choices:</div>
                        <div className="space-y-1.5">
                          {(q.options || []).map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full border-2 border-indigo-400 shrink-0" />
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => updateOption(q.id, optIdx, e.target.value)}
                                placeholder={`Option ${optIdx + 1}`}
                                className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white outline-none focus:border-indigo-600"
                              />
                              {(q.options || []).length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeOption(q.id, optIdx)}
                                  className="p-1 text-slate-400 hover:text-rose-600 border-none bg-transparent cursor-pointer"
                                  title="Remove option"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => addOption(q.id)}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 border-none bg-transparent cursor-pointer pt-1"
                        >
                          <Plus className="w-3 h-3" /> Add Choice Option
                        </button>
                      </div>
                    )}

                    {/* Yes/No Preview */}
                    {q.type === 'yes_no' && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
                        <span>Format: Candidate selects between</span>
                        <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-bold text-slate-700">Yes</span>
                        <span>or</span>
                        <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-bold text-slate-700">No</span>
                      </div>
                    )}

                    {/* Numeric Preview */}
                    {q.type === 'number' && (
                      <div className="text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
                        Format: Candidate enters a numeric value (e.g. years of experience, budget managed).
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
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
