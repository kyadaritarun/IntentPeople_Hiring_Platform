import React, { useState } from 'react';
import {
  Briefcase, Plus, CheckCircle2, AlertCircle, ArrowLeft, Loader2, Compass,
  HelpCircle, Trash2, ListPlus, Sparkles, CheckSquare, X, ChevronDown,
  DollarSign, MapPin, Layers, Award, Target, FileText, Calendar, Clock, ArrowRight
} from 'lucide-react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';

const ROUND_PRESETS = {
  2: [
    { round_number: 1, name: 'Round 1: Screening & Candidate Background', duration: '30 mins' },
    { round_number: 2, name: 'Round 2: Technical Assessment & Final Evaluation', duration: '60 mins' },
  ],
  3: [
    { round_number: 1, name: 'Round 1: Screening & Candidate Background', duration: '30 mins' },
    { round_number: 2, name: 'Round 2: Technical Assessment & Deep-Dive', duration: '45 mins' },
    { round_number: 3, name: 'Round 3: Hiring Manager & Culture Fit', duration: '45 mins' },
  ],
  4: [
    { round_number: 1, name: 'Round 1: Recruiter Phone Screening', duration: '30 mins' },
    { round_number: 2, name: 'Round 2: Technical Assessment & Practical Task', duration: '60 mins' },
    { round_number: 3, name: 'Round 3: Peer Team & Cross-Functional Fit', duration: '45 mins' },
    { round_number: 4, name: 'Round 4: Leadership Interview & Offer Review', duration: '45 mins' },
  ],
  5: [
    { round_number: 1, name: 'Round 1: Initial Recruiter Screening', duration: '30 mins' },
    { round_number: 2, name: 'Round 2: Core Competency & Skills Assessment', duration: '45 mins' },
    { round_number: 3, name: 'Round 3: Live Case Study / System Design', duration: '60 mins' },
    { round_number: 4, name: 'Round 4: Hiring Manager Discussion', duration: '45 mins' },
    { round_number: 5, name: 'Round 5: Executive Leadership & Culture Alignment', duration: '45 mins' },
  ],
};

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

// Consistent soft-tint badge matching the unified dashboard
const TINTS = {
  indigo: 'bg-[#5C59E8]/8 text-[#4845D2] ring-1 ring-inset ring-[#5C59E8]/15',
  orange: 'bg-[#FF7043]/8 text-[#E15A2C] ring-1 ring-inset ring-[#FF7043]/15',
  emerald: 'bg-[#00A884]/8 text-[#00846A] ring-1 ring-inset ring-[#00A884]/15',
  slate: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200/70',
};

function Badge({ tone = 'orange', children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold tabular-nums whitespace-nowrap ${TINTS[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

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

  const [staffGroups, setStaffGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [screeningQuestions, setScreeningQuestions] = useState([]);
  const [interviewRounds, setInterviewRounds] = useState(ROUND_PRESETS[3]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  React.useEffect(() => {
    if (api.getStaffGroups) {
      api.getStaffGroups().then(groups => {
        const grpList = groups || [];
        setStaffGroups(grpList);
        if (user && user.role !== 'ADMIN') {
          const myGroups = grpList.filter(g =>
            Array.isArray(g.members) && g.members.some(m => m.user_id === user.id)
          );
          if (myGroups.length > 0) {
            setSelectedGroupId(String(myGroups[0].id));
          }
        }
      }).catch(() => {});
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Interview rounds helper functions
  const handlePresetChange = (count) => {
    if (ROUND_PRESETS[count]) {
      setInterviewRounds(ROUND_PRESETS[count].map(r => ({ ...r })));
    }
  };

  const addInterviewRound = () => {
    const nextNum = interviewRounds.length + 1;
    setInterviewRounds(prev => [
      ...prev,
      {
        round_number: nextNum,
        name: `Round ${nextNum}: Interview Assessment`,
        duration: '45 mins'
      }
    ]);
  };

  const updateInterviewRound = (index, field, value) => {
    setInterviewRounds(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  const removeInterviewRound = (index) => {
    if (interviewRounds.length <= 1) return;
    setInterviewRounds(prev => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((r, idx) => ({
        ...r,
        round_number: idx + 1,
        name: r.name.replace(/^Round \d+:/, `Round ${idx + 1}:`)
      }));
    });
  };

  const addQuestion = (type = 'text', customQuestion = '') => {
    const newQ = {
      id: `sq_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      question: customQuestion || '',
      type: type,
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

      const cleanedRounds = interviewRounds
        .filter(r => r.name && r.name.trim().length > 0)
        .map((r, idx) => ({
          round_number: idx + 1,
          name: r.name.trim(),
          duration: r.duration || '45 mins'
        }));

      await api.createJob({
        ...formData,
        salary_min: parseInt(formData.salary_min) || 0,
        salary_max: parseInt(formData.salary_max) || 0,
        skills: skillsArray,
        screening_questions: cleanedQuestions,
        interview_rounds: cleanedRounds,
        group_id: selectedGroupId ? parseInt(selectedGroupId) : undefined
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

  // Card shell matching UnifiedRoleDashboard — white background, subtle 1px border, soft shadow
  const cardClass =
    'bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-shadow duration-200 hover:shadow-[0_6px_20px_rgba(15,23,42,0.06)]';

  const inputClass =
    'w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white placeholder:text-slate-400 focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)]';

  const selectClass =
    'w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-semibold text-slate-700 bg-white focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)] cursor-pointer';

  const textareaClass =
    'w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white placeholder:text-slate-400 focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)] leading-relaxed';

  return (
    <div
      className="p-4 sm:p-7 max-w-6xl mx-auto space-y-6 bg-[#F7F8FB] min-h-full antialiased"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
    >

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-semibold text-slate-900 leading-tight tracking-tight m-0">
            Post New Job Requisition
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 m-0">
            Publish a structured job requisition to source pre-vetted marketing &amp; engineering specialists.
          </p>
        </div>

        {setActiveTab && (
          <button
            type="button"
            onClick={() => setActiveTab('manage_jobs')}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Jobs</span>
          </button>
        )}
      </div>

      {/* Success Notification */}
      {success && (
        <div className="p-4 rounded-2xl bg-white border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 shadow-[0_1px_3px_rgba(16,185,129,0.1)] animate-in fade-in">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#00A884] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span>Job requisition published successfully! Redirecting to your active listings...</span>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="p-4 rounded-2xl bg-white border border-rose-300 text-rose-800 text-xs font-semibold flex items-center gap-2.5 shadow-[0_1px_3px_rgba(244,63,94,0.1)] animate-in fade-in">
          <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── BOX 1: Role Overview & Work Arrangement ── */}
        <div className={`${cardClass} p-5 sm:p-7 space-y-5`}>
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#5C59E8]/8 text-[#4845D2] flex items-center justify-center">
                <Briefcase className="w-4.5 h-4.5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900 m-0">Role Overview &amp; Specialization</h2>
                <p className="text-[11px] text-slate-400 m-0">Core requisition details, employment model, and seniority</p>
              </div>
            </div>
            <Badge tone="indigo">Core Requisition</Badge>
          </div>

          {/* Job Title & Specialization */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Job Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                className={inputClass}
                placeholder="e.g. Senior Performance Marketing Manager"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Specialization <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="specialization"
                className={inputClass}
                placeholder="e.g. Paid Search, Meta Ads, MarTech Engineering"
                value={formData.specialization}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Hiring Pod / Group Assignment */}
          {(() => {
            const selectableGroups = user?.role === 'ADMIN'
              ? staffGroups
              : staffGroups.filter(g =>
                  Array.isArray(g.members) && g.members.some(m => m.user_id === user?.id)
                );

            if (selectableGroups.length === 0) return null;

            return (
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
                <label className="block text-xs font-semibold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    Assigned Hiring Pod / Group <span className="text-rose-500">*</span>
                  </span>
                  {user?.role !== 'ADMIN' && (
                    <span className="text-[11px] text-indigo-600 font-medium">
                      {selectableGroups.length > 1
                        ? `You belong to ${selectableGroups.length} pods — select target pod`
                        : 'Linked to your recruitment pod'}
                    </span>
                  )}
                </label>
                <select
                  value={selectedGroupId}
                  onChange={e => setSelectedGroupId(e.target.value)}
                  className={selectClass}
                  required={user?.role !== 'ADMIN'}
                >
                  {user?.role === 'ADMIN' && <option value="">Company-Wide / Unassigned</option>}
                  {selectableGroups.map(grp => (
                    <option key={grp.id} value={grp.id}>
                      {grp.name} ({grp.department || 'General'})
                    </option>
                  ))}
                </select>
                {selectableGroups.length > 1 && (
                  <p className="text-[11px] text-slate-400 mt-1.5 m-0">
                    Only members of the selected pod and Administrators will have access to candidates and evaluations for this position.
                  </p>
                )}
              </div>
            );
          })()}

          {/* Role Parameters: Work Mode, Job Type, Ownership Level, Availability */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Work Mode</label>
              <select
                name="work_mode"
                className={selectClass}
                value={formData.work_mode}
                onChange={handleChange}
              >
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Job Type</label>
              <select
                name="job_type"
                className={selectClass}
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
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Ownership Level</label>
              <select
                name="ownership_level"
                className={selectClass}
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
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Availability Requirement</label>
              <select
                name="availability_requirement"
                className={selectClass}
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
        </div>

        {/* ── BOX 2: Compensation & Candidate Profile ── */}
        <div className={`${cardClass} p-5 sm:p-7 space-y-5`}>
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#00A884]/8 text-[#00846A] flex items-center justify-center">
                <Target className="w-4.5 h-4.5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900 m-0">Compensation &amp; Experience Requirements</h2>
                <p className="text-[11px] text-slate-400 m-0">Budget expectations, minimum experience, and required location</p>
              </div>
            </div>
            <Badge tone="emerald">Candidate Matching</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Min Salary (Annual USD)</label>
              <input
                type="number"
                name="salary_min"
                className={inputClass}
                placeholder="e.g. 75000"
                value={formData.salary_min}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Max Salary (Annual USD)</label>
              <input
                type="number"
                name="salary_max"
                className={inputClass}
                placeholder="e.g. 110000"
                value={formData.salary_max}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Min Experience <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="min_experience"
                className={inputClass}
                placeholder="e.g. 3 years"
                value={formData.min_experience}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Location <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="location"
                className={inputClass}
                placeholder="e.g. San Francisco, CA or Remote"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Skills Required */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-700">
                Required Skills (Comma-Separated) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">Used by matching algorithms &amp; ATS</span>
            </div>
            <input
              type="text"
              name="skills"
              className={inputClass}
              placeholder="e.g. Meta Ads, Google Ads, SEO, GA4, Copywriting"
              value={formData.skills}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* ── BOX 3: Scope, Capabilities & Description ── */}
        <div className={`${cardClass} p-5 sm:p-7 space-y-5`}>
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#FF7043]/8 text-[#E15A2C] flex items-center justify-center">
                <FileText className="w-4.5 h-4.5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900 m-0">Role Scope &amp; Job Description</h2>
                <p className="text-[11px] text-slate-400 m-0">Detailed responsibilities, expectations, and day-to-day workflow</p>
              </div>
            </div>
            <Badge tone="orange">Job Details</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Must-Have Capabilities <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="must_have_capabilities"
                className={textareaClass}
                rows={3}
                placeholder="e.g. Proven track record managing high ad spend, ROAS modeling, deep Google Ads & Meta Ads proficiency."
                value={formData.must_have_capabilities}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Preferred Capabilities
              </label>
              <textarea
                name="preferred_capabilities"
                className={textareaClass}
                rows={3}
                placeholder="e.g. Segment CDP, BigQuery analytics, high-converting creative copy, and marketing automation."
                value={formData.preferred_capabilities}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Detailed Job Description &amp; Responsibilities <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="description"
              className={textareaClass}
              rows={5}
              placeholder="Outline day-to-day responsibilities, key performance metrics, tools stack, and company advantages..."
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* ── BOX 4: Strategic Hiring Context & Department Needs ── */}
        <div className={`${cardClass} p-5 sm:p-7 space-y-5`}>
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#5C59E8]/8 text-[#4845D2] flex items-center justify-center">
                <Compass className="w-4.5 h-4.5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900 m-0">Strategic Hiring Context</h2>
                <p className="text-[11px] text-slate-400 m-0">Business challenge, expected deliverables, and team dynamics</p>
              </div>
            </div>
            <Badge tone="slate">Team Context</Badge>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Business Problem</label>
              <textarea
                name="business_problem"
                rows={2}
                value={formData.business_problem}
                onChange={handleChange}
                placeholder="Lead volume is rising, but qualified pipeline is inconsistent."
                className={textareaClass}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Expected Outcome</label>
              <textarea
                name="expected_outcome"
                rows={2}
                value={formData.expected_outcome}
                onChange={handleChange}
                placeholder="Build a repeatable demand programme and improve lead-to-opportunity quality."
                className={textareaClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Team Support</label>
                <input
                  type="text"
                  name="team_support"
                  value={formData.team_support}
                  onChange={handleChange}
                  placeholder="Marketing head, content specialist, shared design support"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Monthly Budget Range</label>
                <input
                  type="text"
                  name="monthly_budget_range"
                  value={formData.monthly_budget_range}
                  onChange={handleChange}
                  placeholder="₹8–12 lakh or $10k–$15k"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Decision Authority</label>
                <input
                  type="text"
                  name="decision_authority"
                  value={formData.decision_authority}
                  onChange={handleChange}
                  placeholder="Own campaigns and recommend budget allocation"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Success Horizon</label>
                <input
                  type="text"
                  name="success_horizon"
                  value={formData.success_horizon}
                  onChange={handleChange}
                  placeholder="First 90 days"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── BOX 5: Candidate Screening Questions Builder ── */}
        <div className={`${cardClass} p-5 sm:p-7 space-y-5`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#5C59E8]/8 text-[#4845D2] flex items-center justify-center">
                <ListPlus className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-slate-900 m-0">Candidate Screening Questions</h2>
                  <Badge tone="indigo">{screeningQuestions.length} Questions</Badge>
                </div>
                <p className="text-[11px] text-slate-400 m-0">Require structured responses during candidate submission</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => addQuestion('text')}
              className="px-3.5 py-1.5 rounded-lg bg-[#5C59E8] hover:bg-[#4845D2] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-[0_1px_2px_rgba(92,89,232,0.3)] border-none cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Question</span>
            </button>
          </div>

          {/* Quick Templates Chips */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> Quick Add:
            </span>
            {QUESTION_TEMPLATES.map((tpl, i) => (
              <button
                key={i}
                type="button"
                onClick={() => addTemplate(tpl)}
                className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-medium transition-colors border border-slate-200/70 flex items-center gap-1 cursor-pointer"
                title={`Add '${tpl.question}'`}
              >
                <Plus className="w-3 h-3 text-[#5C59E8]" />
                <span>{tpl.label}</span>
              </button>
            ))}
          </div>

          {/* Questions List */}
          {screeningQuestions.length === 0 ? (
            <div className="py-9 text-center rounded-xl border border-dashed border-slate-200 p-6 bg-slate-50/50">
              <HelpCircle className="w-7 h-7 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700 m-0">No screening questions added yet</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-1 m-0">
                Click "+ Add Question" or choose a template above to collect candidate experience, portfolio links, or notice periods.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {screeningQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.02)] space-y-3 hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] font-semibold tabular-nums">
                        Q{idx + 1}
                      </span>
                      <div className="relative">
                        <select
                          value={q.type}
                          onChange={(e) => updateQuestion(q.id, 'type', e.target.value)}
                          className="pl-2.5 pr-7 py-1 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 outline-none cursor-pointer appearance-none"
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
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-600 select-none">
                        <input
                          type="checkbox"
                          checked={q.required}
                          onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-[#5C59E8] focus:ring-0 border-slate-300 cursor-pointer"
                        />
                        <span>Required</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => removeQuestion(q.id)}
                        className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors border-none bg-transparent cursor-pointer"
                        title="Delete question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => updateQuestion(q.id, 'question', e.target.value)}
                    placeholder="Type question here (e.g. How many years of experience do you have with Google Ads?)"
                    className={inputClass}
                    required
                  />

                  {q.type === 'choice' && (
                    <div className="pl-3 border-l-2 border-[#5C59E8]/30 space-y-2 pt-1">
                      <div className="text-[11px] font-semibold text-slate-600">Candidate Choice Options:</div>
                      <div className="space-y-1.5">
                        {(q.options || []).map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full border-2 border-[#5C59E8] shrink-0" />
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => updateOption(q.id, optIdx, e.target.value)}
                              placeholder={`Option ${optIdx + 1}`}
                              className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white outline-none focus:border-[#5C59E8]"
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
                        className="text-[11px] font-semibold text-[#5C59E8] hover:text-[#4845D2] flex items-center gap-1 border-none bg-transparent cursor-pointer pt-1"
                      >
                        <Plus className="w-3 h-3" /> Add Choice Option
                      </button>
                    </div>
                  )}

                  {q.type === 'yes_no' && (
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50/70 px-3 py-1.5 rounded-lg">
                      <span>Format: Candidate selects between</span>
                      <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-semibold text-slate-700">Yes</span>
                      <span>or</span>
                      <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-semibold text-slate-700">No</span>
                    </div>
                  )}

                  {q.type === 'number' && (
                    <div className="text-[11px] text-slate-500 bg-slate-50/70 px-3 py-1.5 rounded-lg">
                      Format: Candidate enters a numeric value (e.g. years of experience, budget managed).
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── BOX 6: Interview Rounds & Selection Stages ── */}
        <div className={`${cardClass} p-5 sm:p-7 space-y-5`}>
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#00A884] flex items-center justify-center">
                <Calendar className="w-4.5 h-4.5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900 m-0">
                  Interview Rounds &amp; Selection Stages
                </h2>
                <p className="text-[11px] text-slate-400 m-0">
                  Configure the rounds for this requisition. When candidates are shortlisted, these rounds appear in Next Round Setup.
                </p>
              </div>
            </div>
            <Badge tone="emerald">
              {interviewRounds.length} {interviewRounds.length === 1 ? 'Round Configured' : 'Rounds Configured'}
            </Badge>
          </div>

          {/* Quick Preset Selector */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-slate-800 block">
                How many interview rounds for this job?
              </span>
              <span className="text-[11px] text-slate-500">
                Choose a standard hiring workflow preset or customize your stages:
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[2, 3, 4, 5].map((num) => {
                const isActive = interviewRounds.length === num;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handlePresetChange(num)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-[#5C59E8] text-white border-[#5C59E8] shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {num} Rounds {num === 3 ? '(Standard)' : ''}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visual Progression Pipeline Preview */}
          <div className="overflow-x-auto pb-1">
            <div className="flex items-center gap-2 min-w-max p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 px-1">Pipeline:</span>
              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200/60 text-indigo-700 text-xs font-semibold">
                ⭐ Shortlist
              </span>
              {interviewRounds.map((r, idx) => (
                <React.Fragment key={idx}>
                  <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-semibold shadow-2xs">
                    {r.name ? (r.name.length > 28 ? r.name.slice(0, 26) + '...' : r.name) : `Round ${idx + 1}`}
                  </span>
                </React.Fragment>
              ))}
              <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                🏆 Offer / Hire
              </span>
            </div>
          </div>

          {/* Rounds List Editor */}
          <div className="space-y-3">
            {interviewRounds.map((round, idx) => (
              <div
                key={idx}
                className="p-3.5 sm:p-4 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all space-y-3 shadow-[0_1px_2px_rgba(15,23,42,0.02)]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-50 text-[#00A884] flex items-center justify-center text-xs font-bold ring-1 ring-inset ring-[#00A884]/20">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      Round {idx + 1} Setup
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">
                      Stage {idx + 1} of {interviewRounds.length}
                    </span>
                    {interviewRounds.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeInterviewRound(idx)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors border-none bg-transparent cursor-pointer"
                        title="Remove round"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  {/* Round Setup */}
                  <div className="sm:col-span-8">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Round Setup *
                    </label>
                    <input
                      type="text"
                      value={round.name}
                      onChange={(e) => updateInterviewRound(idx, 'name', e.target.value)}
                      placeholder={`e.g. Round ${idx + 1}: Screening Call or Technical Assessment`}
                      className={inputClass}
                      required
                    />
                  </div>

                  {/* Duration */}
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Duration *
                    </label>
                    <select
                      value={round.duration || '45 mins'}
                      onChange={(e) => updateInterviewRound(idx, 'duration', e.target.value)}
                      className={selectClass}
                    >
                      <option value="15 mins">15 mins</option>
                      <option value="30 mins">30 mins</option>
                      <option value="45 mins">45 mins</option>
                      <option value="60 mins">60 mins</option>
                      <option value="90 mins">90 mins</option>
                      <option value="120 mins">120 mins (2 hrs)</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Custom Round Button */}
          <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
            <button
              type="button"
              onClick={addInterviewRound}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#00846A] text-xs font-semibold border border-emerald-200/80 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Round</span>
            </button>

            <span className="text-[11px] text-slate-400">
              💡 Shortlisted candidates will see and follow these rounds in Next Round Setup.
            </span>
          </div>
        </div>

        {/* ── Action Footer ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <p className="text-xs text-slate-400 m-0">
            Publishing makes this requisition active and matches qualified candidates immediately.
          </p>

          <div className="flex items-center gap-3">
            {setActiveTab && (
              <button
                type="button"
                onClick={() => setActiveTab('manage_jobs')}
                className="px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-lg bg-[#FF7043] hover:bg-[#E65B30] text-white text-xs font-semibold shadow-[0_1px_2px_rgba(255,112,67,0.3)] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer border-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing Requisition...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Publish Job Requisition</span>
                </>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
