import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, Sparkles, Target, AlertCircle, CheckCircle2,
  Clock, XCircle, Plus, Check, RefreshCw, Briefcase, Building2,
  Award, Zap, BarChart3, Layers, BookOpen, ArrowRight, Lightbulb,
  FileText, Search
} from 'lucide-react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function CandidateSkillAdvisoryView({ setActiveTab, onNavigateTab, setSelectedJobId }) {
  const { user, refreshUser } = useAuth();
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('all'); // 'all' | 'YYYY-MM'
  const [addingSkill, setAddingSkill] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [activeTabFilter, setActiveTabFilter] = useState('all'); // 'all' | 'not_shortlisted' | 'shortlisted'

  // Extract candidate skills from user profile
  const profile = user?.profile || user?.candidate_profile || {};
  const candidateSkills = useMemo(() => {
    const raw = profile.skills;
    if (Array.isArray(raw)) {
      return raw.map(s => String(s).trim()).filter(Boolean);
    }
    if (typeof raw === 'string' && raw.trim()) {
      return raw.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
  }, [profile.skills]);

  // Candidate skills lookup set (case-insensitive)
  const candidateSkillsSet = useMemo(() => {
    return new Set(candidateSkills.map(s => s.toLowerCase()));
  }, [candidateSkills]);

  // Load applications and all platform jobs
  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [appsRes, jobsRes] = await Promise.all([
        api.getMyApplications().catch(err => {
          console.error('Error fetching applications:', err);
          return [];
        }),
        api.getJobs().catch(err => {
          console.error('Error fetching jobs:', err);
          return [];
        })
      ]);

      setApplications(Array.isArray(appsRes) ? appsRes : []);
      setJobs(Array.isArray(jobsRes) ? jobsRes : []);
    } catch (err) {
      console.error('Failed to load skill advisory data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Format month helpers
  const getMonthKey = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  };

  const getMonthLabel = (key) => {
    if (!key || key === 'all') return 'All Time (Full History)';
    const [y, m] = key.split('-');
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  // Derive unique months available from applications
  const availableMonths = useMemo(() => {
    const map = new Map();
    // Always include current month
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    map.set(currentKey, getMonthLabel(currentKey));

    applications.forEach(app => {
      const k = getMonthKey(app.applied_at || app.created_at);
      if (k && !map.has(k)) {
        map.set(k, getMonthLabel(k));
      }
    });

    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [applications]);

  // Filter applications by selected month
  const filteredApplications = useMemo(() => {
    if (selectedMonth === 'all') return applications;
    return applications.filter(app => {
      const k = getMonthKey(app.applied_at || app.created_at);
      return k === selectedMonth;
    });
  }, [applications, selectedMonth]);

  // Calculate Funnel Metrics
  const funnelStats = useMemo(() => {
    const total = filteredApplications.length;
    let inReview = 0;
    let shortlisted = 0;
    let interview = 0;
    let selected = 0;
    let notSelected = 0;

    filteredApplications.forEach(app => {
      const s = (app.status || '').toUpperCase();
      if (s === 'REJECTED' || s === 'NOT_SELECTED' || s === 'PASS') {
        notSelected++;
      } else if (s === 'SELECTED' || s === 'HIRED' || s === 'OFFER') {
        selected++;
      } else if (s === 'INTERVIEW_SCHEDULED' || s.includes('INTERVIEW')) {
        interview++;
      } else if (s === 'SHORTLISTED') {
        shortlisted++;
      } else {
        // APPLIED, UNDER_REVIEW, SCREENING
        inReview++;
      }
    });

    // Shortlist rate includes those shortlisted, interviewed, and selected
    const positiveOutcomes = shortlisted + interview + selected;
    const shortlistRate = total > 0 ? Math.round((positiveOutcomes / total) * 100) : 0;
    const interviewRate = total > 0 ? Math.round(((interview + selected) / total) * 100) : 0;
    const selectionRate = total > 0 ? Math.round((selected / total) * 100) : 0;

    return {
      total,
      inReview,
      shortlisted,
      interview,
      selected,
      notSelected,
      shortlistRate,
      interviewRate,
      selectionRate
    };
  }, [filteredApplications]);

  // Aggregation of recruiter skills across all jobs
  const marketSkillAnalysis = useMemo(() => {
    const freq = {};
    const skillJobs = {};

    jobs.forEach(job => {
      const jobSkills = Array.isArray(job.skills) ? job.skills : [];
      jobSkills.forEach(rawSkill => {
        if (!rawSkill) return;
        const trimmed = String(rawSkill).trim();
        if (!trimmed) return;
        const normalized = trimmed.toLowerCase();

        // Use canonical display version
        if (!freq[normalized]) {
          freq[normalized] = {
            name: trimmed,
            count: 0,
            roles: []
          };
        }
        freq[normalized].count += 1;
        if (freq[normalized].roles.length < 3 && job.title) {
          freq[normalized].roles.push(job.title);
        }
      });
    });

    const missingInDemand = [];
    const matchedSkills = [];

    Object.entries(freq).forEach(([normKey, data]) => {
      const hasSkill = candidateSkillsSet.has(normKey);
      if (hasSkill) {
        matchedSkills.push(data);
      } else {
        missingInDemand.push(data);
      }
    });

    // Sort by recruiter frequency descending
    missingInDemand.sort((a, b) => b.count - a.count);
    matchedSkills.sort((a, b) => b.count - a.count);

    return {
      missingInDemand: missingInDemand.slice(0, 10),
      matchedSkills: matchedSkills.slice(0, 8),
      totalRecruiterSkills: Object.keys(freq).length
    };
  }, [jobs, candidateSkillsSet]);

  // Detailed analysis of non-shortlisted / pending applications
  const analyzedApplications = useMemo(() => {
    return filteredApplications.map(app => {
      const job = app.job || {};
      const jobSkills = Array.isArray(job.skills) ? job.skills : [];
      const requiredNormalized = jobSkills.map(s => String(s).trim());

      const matched = [];
      const missing = [];

      requiredNormalized.forEach(s => {
        if (candidateSkillsSet.has(s.toLowerCase())) {
          matched.push(s);
        } else {
          missing.push(s);
        }
      });

      const totalReq = requiredNormalized.length;
      const matchScore = totalReq > 0 ? Math.round((matched.length / totalReq) * 100) : 70;

      // Status categorization
      const s = (app.status || '').toUpperCase();
      const isRejected = s === 'REJECTED' || s === 'NOT_SELECTED';
      const isShortlisted = s === 'SHORTLISTED' || s.includes('INTERVIEW') || s === 'SELECTED' || s === 'HIRED';
      const isUnderReview = !isRejected && !isShortlisted;

      // Diagnosis advice
      let diagnosis = '';
      let priority = 'normal';

      if (isRejected) {
        if (missing.length >= 2) {
          diagnosis = `Application was filtered during initial screening. The recruiter required critical skills (${missing.slice(0, 2).join(', ')}) that are not visible in your profile.`;
          priority = 'high';
        } else if (missing.length === 1) {
          diagnosis = `High applicant volume. Missing proficiency in "${missing[0]}" lowered your automated keyword ranking compared to shortlisted peers.`;
          priority = 'medium';
        } else {
          diagnosis = `Strong technical alignment (${matchScore}% match). Screening likely prioritized candidates with specific years of experience or portfolio project depth.`;
          priority = 'low';
        }
      } else if (isUnderReview) {
        if (missing.length >= 2) {
          diagnosis = `Profile is currently in review. You have a ${matchScore}% skill match. Adding ${missing.slice(0, 2).join(' & ')} to your profile can significantly improve your shortlist odds.`;
          priority = 'medium';
        } else {
          diagnosis = `Solid profile alignment (${matchScore}% match). Your application is moving through recruiter triage. Keep your profile updated for recruiter review.`;
          priority = 'low';
        }
      } else {
        diagnosis = `Successfully shortlisted! Your technical capabilities and profile keywords strongly aligned with the recruiter's criteria.`;
        priority = 'success';
      }

      return {
        ...app,
        matchScore,
        matched,
        missing,
        diagnosis,
        priority,
        isRejected,
        isShortlisted,
        isUnderReview
      };
    });
  }, [filteredApplications, candidateSkillsSet]);

  // Add skill to candidate profile with 1-click
  const handleAddSkillToProfile = async (skillToAdd) => {
    if (!skillToAdd || addingSkill) return;
    setAddingSkill(skillToAdd);

    try {
      // Build updated skills array
      const existing = [...candidateSkills];
      const trimmed = skillToAdd.trim();
      if (!existing.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
        existing.push(trimmed);
      }

      // Save to database
      await api.updateCandidateProfile({ skills: existing });
      await refreshUser();

      // Show toast
      showNotification(`"${trimmed}" successfully added to your profile! Your shortlist match score has increased.`);
    } catch (err) {
      console.error('Failed to add skill:', err);
      showNotification('Failed to update profile. Please try again from Candidate Profile.');
    } finally {
      setAddingSkill(null);
    }
  };

  const showNotification = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleNavigate = (tab) => {
    if (typeof onNavigateTab === 'function') {
      onNavigateTab(tab);
    } else if (typeof setActiveTab === 'function') {
      setActiveTab(tab);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-8 space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-5">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
          <p className="text-sm font-medium tracking-wide m-0">{toastMessage}</p>
        </div>
      )}

      {/* ── Monthly Application Outcome Funnel Cards ──────────────────────── */}
      <div className="space-y-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <h1 className="text-xl font-extrabold text-slate-900 m-0">
                Monthly Analysis
              </h1>
            </div>
            <p className="text-xs text-slate-500 m-0">
              Showing application outcomes for: <strong className="text-slate-700">{getMonthLabel(selectedMonth)}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Analysis Period Dropdown */}
            <div className="flex items-center gap-2">
              <label htmlFor="month-selector" className="text-xs font-bold text-slate-600 whitespace-nowrap uppercase tracking-wider">
                Analysis Period:
              </label>
              <select
                id="month-selector"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors cursor-pointer"
              >
                <option value="all">All Time (Full History)</option>
                {availableMonths.map(m => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              title="Refresh monthly data"
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {/* Shortlist Conversion Rate */}
            <div className="text-xs font-semibold px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl whitespace-nowrap">
              Shortlist Rate: <span className="font-extrabold text-xs">{funnelStats.shortlistRate}%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Total Applied */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Applied</span>
              <FileText className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{funnelStats.total}</div>
            <p className="text-[11px] text-slate-400 mt-1 m-0">Submitted applications</p>
          </div>

          {/* In Review */}
          <div className="bg-white rounded-2xl p-4 border border-blue-200 shadow-sm hover:shadow-md transition-shadow bg-blue-50/20">
            <div className="flex items-center justify-between text-blue-600 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">In Review</span>
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-700">{funnelStats.inReview}</div>
            <p className="text-[11px] text-blue-500 mt-1 m-0">
              {funnelStats.total > 0 ? `${Math.round((funnelStats.inReview / funnelStats.total) * 100)}% of total` : '0%'}
            </p>
          </div>

          {/* Shortlisted */}
          <div className="bg-white rounded-2xl p-4 border border-emerald-300 shadow-sm hover:shadow-md transition-shadow bg-emerald-50/30">
            <div className="flex items-center justify-between text-emerald-700 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Shortlisted</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700">{funnelStats.shortlisted}</div>
            <p className="text-[11px] text-emerald-600 font-medium mt-1 m-0">
              {funnelStats.total > 0 ? `${Math.round((funnelStats.shortlisted / funnelStats.total) * 100)}% passed screening` : '0%'}
            </p>
          </div>

          {/* Interview Scheduled */}
          <div className="bg-white rounded-2xl p-4 border border-indigo-200 shadow-sm hover:shadow-md transition-shadow bg-indigo-50/20">
            <div className="flex items-center justify-between text-indigo-600 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Interviews</span>
              <Zap className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-700">{funnelStats.interview}</div>
            <p className="text-[11px] text-indigo-500 mt-1 m-0">
              {funnelStats.total > 0 ? `${Math.round((funnelStats.interview / funnelStats.total) * 100)}% scheduled` : '0%'}
            </p>
          </div>

          {/* Selected / Offers */}
          <div className="bg-white rounded-2xl p-4 border border-amber-300 shadow-sm hover:shadow-md transition-shadow bg-amber-50/30">
            <div className="flex items-center justify-between text-amber-700 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Selected</span>
              <Award className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-700">{funnelStats.selected}</div>
            <p className="text-[11px] text-amber-600 font-medium mt-1 m-0">Offers extended</p>
          </div>

          {/* Not Selected */}
          <div className="bg-white rounded-2xl p-4 border border-rose-200 shadow-sm hover:shadow-md transition-shadow bg-rose-50/20">
            <div className="flex items-center justify-between text-rose-600 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Not Selected</span>
              <XCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-700">{funnelStats.notSelected}</div>
            <p className="text-[11px] text-rose-500 mt-1 m-0">
              {funnelStats.total > 0 ? `${Math.round((funnelStats.notSelected / funnelStats.total) * 100)}% pass rate` : '0%'}
            </p>
          </div>
        </div>

        {/* Visual Progression Funnel Bar */}
        {funnelStats.total > 0 && (
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2.5">
              <span>Hiring Pipeline Progression</span>
              <span className="text-slate-500">{funnelStats.total} Total Submissions</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${Math.max(5, (funnelStats.inReview / funnelStats.total) * 100)}%` }}
                className="bg-blue-400 hover:opacity-90 transition-all"
                title={`In Review: ${funnelStats.inReview}`}
              />
              <div
                style={{ width: `${Math.max(5, (funnelStats.shortlisted / funnelStats.total) * 100)}%` }}
                className="bg-emerald-500 hover:opacity-90 transition-all"
                title={`Shortlisted: ${funnelStats.shortlisted}`}
              />
              <div
                style={{ width: `${Math.max(5, (funnelStats.interview / funnelStats.total) * 100)}%` }}
                className="bg-indigo-500 hover:opacity-90 transition-all"
                title={`Interviews: ${funnelStats.interview}`}
              />
              <div
                style={{ width: `${Math.max(5, (funnelStats.selected / funnelStats.total) * 100)}%` }}
                className="bg-amber-400 hover:opacity-90 transition-all"
                title={`Selected: ${funnelStats.selected}`}
              />
              <div
                style={{ width: `${Math.max(5, (funnelStats.notSelected / funnelStats.total) * 100)}%` }}
                className="bg-rose-400 hover:opacity-90 transition-all"
                title={`Not Selected: ${funnelStats.notSelected}`}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2.5 flex-wrap gap-2">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" /> In Review ({funnelStats.inReview})</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Shortlisted ({funnelStats.shortlisted})</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" /> Interview ({funnelStats.interview})</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Selected ({funnelStats.selected})</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" /> Not Selected ({funnelStats.notSelected})</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Recruiter Market Skill Demand Aggregation (THE KEY REQUEST) ────── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold tracking-wide mb-1.5">
              <Target className="w-3.5 h-3.5" />
              Recruiter Market Scan Intelligence
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 m-0">
              Top Skills Demanded by Recruiters
            </h2>
            <p className="text-sm text-slate-500 mt-1 m-0">
              We aggregated requirements across all active recruiter postings. If you add these high-demand matching skills to your profile and resume, you will get shortlisted faster.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Click <strong className="text-emerald-700">+ Add</strong> to update profile instantly:</span>
          </div>
        </div>

        {/* Missing High Demand Skills Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 m-0">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              High-Demand Skills Missing From Your Profile ({marketSkillAnalysis.missingInDemand.length})
            </h3>
            <span className="text-xs text-slate-400">Ranked by recruiter job frequency</span>
          </div>

          {marketSkillAnalysis.missingInDemand.length === 0 ? (
            <div className="p-6 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-emerald-800 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-sm m-0">Outstanding! You possess all top in-demand market skills.</p>
                <p className="text-xs text-emerald-700 mt-0.5 m-0">Your profile is equipped with all the most commonly posted skills by platform recruiters.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {marketSkillAnalysis.missingInDemand.map((item, idx) => {
                const isAdding = addingSkill === item.name;
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-amber-300 bg-gradient-to-br from-white to-slate-50/50 hover:shadow-md transition-all flex flex-col justify-between gap-3 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-base group-hover:text-amber-600 transition-colors">
                            {item.name}
                          </span>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md">
                            {item.count >= 3 ? 'Top Priority' : 'High Demand'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 m-0">
                          Demanded in <strong className="text-slate-800 font-semibold">{item.count}</strong> recruiter {item.count === 1 ? 'job posting' : 'job postings'}
                        </p>
                      </div>

                      <button
                        onClick={() => handleAddSkillToProfile(item.name)}
                        disabled={isAdding}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer"
                      >
                        {isAdding ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                        <span>{isAdding ? 'Adding...' : 'Add to Profile'}</span>
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 text-slate-600 font-medium">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        Shortlist impact: High keyword match boost
                      </span>
                      {item.roles.length > 0 && (
                        <span className="truncate max-w-[200px]" title={item.roles.join(', ')}>
                          e.g. {item.roles[0]}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Matched Strong Skills */}
        {marketSkillAnalysis.matchedSkills.length > 0 && (
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2 m-0">
              <Check className="w-4 h-4 text-emerald-600" />
              Your Matched Market Power Skills (Already in Profile)
            </h3>
            <div className="flex flex-wrap gap-2">
              {marketSkillAnalysis.matchedSkills.map((item, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/70 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{item.name}</span>
                  <span className="text-[10px] bg-emerald-200/60 px-1.5 py-0.5 rounded-full font-bold">
                    {item.count} jobs
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── "Why Applications Aren't Getting Shortlisted" Diagnosis ────────── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold tracking-wide mb-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              Application Screening Diagnosis
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 m-0">
              Why Your Applications Aren't Getting Shortlisted
            </h2>
            <p className="text-sm text-slate-500 mt-1 m-0">
              We evaluated each of your submissions against recruiter screening criteria and technical requirements to identify exact bottleneck reasons.
            </p>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 shrink-0">
            <button
              onClick={() => setActiveTabFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${activeTabFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
            >
              All ({analyzedApplications.length})
            </button>
            <button
              onClick={() => setActiveTabFilter('not_shortlisted')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${activeTabFilter === 'not_shortlisted' ? 'bg-white text-rose-600 shadow-xs' : 'hover:text-slate-900'}`}
            >
              Needs Attention ({analyzedApplications.filter(a => a.isRejected || a.isUnderReview).length})
            </button>
            <button
              onClick={() => setActiveTabFilter('shortlisted')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${activeTabFilter === 'shortlisted' ? 'bg-white text-emerald-600 shadow-xs' : 'hover:text-slate-900'}`}
            >
              Shortlisted ({analyzedApplications.filter(a => a.isShortlisted).length})
            </button>
          </div>
        </div>

        {/* Diagnosis Cards List */}
        {analyzedApplications.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-700 m-0">No applications found in this timeframe</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto m-0">
              Submit applications to active jobs to receive automated shortlist diagnoses and recruiter feedback analysis.
            </p>
            <button
              onClick={() => handleNavigate('find_jobs')}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              Explore Open Jobs
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {analyzedApplications
              .filter(app => {
                if (activeTabFilter === 'not_shortlisted') return app.isRejected || app.isUnderReview;
                if (activeTabFilter === 'shortlisted') return app.isShortlisted;
                return true;
              })
              .map((app) => {
                const job = app.job || {};
                const isRejected = app.isRejected;
                const isShortlisted = app.isShortlisted;

                return (
                  <div
                    key={app.id}
                    className={`rounded-2xl border p-5 transition-all ${
                      isRejected
                        ? 'border-rose-200 bg-rose-50/15 hover:border-rose-300'
                        : isShortlisted
                          ? 'border-emerald-200 bg-emerald-50/15 hover:border-emerald-300'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base font-bold text-slate-900 m-0">
                            {job.title || 'Role Position'}
                          </h4>
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                              isRejected
                                ? 'bg-rose-100 text-rose-800'
                                : isShortlisted
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {app.status || 'Under Review'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {job.company_name || 'Hiring Company'}
                          </span>
                          <span>•</span>
                          <span>Applied {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'Recently'}</span>
                        </div>
                      </div>

                      {/* Match Score Badge */}
                      <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1">
                        <div className="text-xs text-slate-400 font-semibold uppercase">Keyword Match</div>
                        <div className={`text-lg font-extrabold ${
                          app.matchScore >= 75 ? 'text-emerald-600' : app.matchScore >= 50 ? 'text-amber-600' : 'text-rose-600'
                        }`}>
                          {app.matchScore}%
                        </div>
                      </div>
                    </div>

                    {/* AI Diagnosis Reason Card */}
                    <div className="mt-3.5 p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 text-xs text-slate-700 space-y-2">
                      <div className="flex items-start gap-2">
                        <Lightbulb className={`w-4 h-4 shrink-0 mt-0.5 ${isRejected ? 'text-rose-500' : isShortlisted ? 'text-emerald-500' : 'text-amber-500'}`} />
                        <div>
                          <strong className="font-semibold text-slate-900">Diagnosis: </strong>
                          <span>{app.diagnosis}</span>
                        </div>
                      </div>

                      {/* Missing skills with 1-click addition */}
                      {app.missing.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-bold text-rose-700 uppercase">Missing Job Skills:</span>
                            {app.missing.map((sk, skIdx) => (
                              <button
                                key={skIdx}
                                onClick={() => handleAddSkillToProfile(sk)}
                                disabled={addingSkill === sk}
                                title={`Click to add ${sk} to profile`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 hover:bg-rose-200 text-rose-800 text-[11px] font-semibold transition-colors cursor-pointer"
                              >
                                <span>{sk}</span>
                                <Plus className="w-3 h-3 text-rose-600" />
                              </button>
                            ))}
                          </div>
                          <span className="text-[10px] text-slate-400">Click any skill to add to your profile</span>
                        </div>
                      )}

                      {/* Matched skills */}
                      {app.matched.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500">
                          <span className="font-semibold text-emerald-700">Matched Skills:</span>
                          {app.matched.map((sk, skIdx) => (
                            <span key={skIdx} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200/50">
                              ✓ {sk}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* ── Shortlist Acceleration & Resume Advice Guide ─────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            Proven Shortlist Strategies
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white m-0">
            How to Double Your Shortlist Probability
          </h2>
          <p className="text-slate-400 text-sm m-0">
            Based on hiring data from 10,000+ candidates and recruiter screening workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-400/40 transition-colors space-y-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center font-bold text-sm">
              01
            </div>
            <h4 className="text-sm font-bold text-white m-0">Mirror Exact Job Keywords</h4>
            <p className="text-xs text-slate-400 leading-relaxed m-0">
              Recruiters and automated ATS filter for specific terminology. Ensure skills like <span className="text-amber-300">"React.js"</span> or <span className="text-amber-300">"Docker"</span> appear verbatim in your resume work experience.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-400/40 transition-colors space-y-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-400/10 text-indigo-400 flex items-center justify-center font-bold text-sm">
              02
            </div>
            <h4 className="text-sm font-bold text-white m-0">Quantify Every Impact</h4>
            <p className="text-xs text-slate-400 leading-relaxed m-0">
              Avoid generic lists of responsibilities. Use concrete metrics like <em>"Increased web performance by 35%"</em> or <em>"Handled $50k monthly ad spend"</em>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-400/40 transition-colors space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-400/10 text-emerald-400 flex items-center justify-center font-bold text-sm">
              03
            </div>
            <h4 className="text-sm font-bold text-white m-0">Apply Within First 48h</h4>
            <p className="text-xs text-slate-400 leading-relaxed m-0">
              Over 70% of candidate shortlists are compiled within the initial 48 hours of a job being posted. Check <strong>Find Jobs</strong> frequently for new listings.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-400/40 transition-colors space-y-2">
            <div className="w-8 h-8 rounded-xl bg-purple-400/10 text-purple-400 flex items-center justify-center font-bold text-sm">
              04
            </div>
            <h4 className="text-sm font-bold text-white m-0">Sync Profile & Resume PDF</h4>
            <p className="text-xs text-slate-400 leading-relaxed m-0">
              When recruiter searches find your profile, they download your resume immediately. Keep your Uptrix profile skills and resume PDF content in lockstep.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-slate-400 m-0">
            Ready to apply these improvements to your profile?
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNavigate('profile')}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
            >
              Update Candidate Profile
            </button>
            <button
              onClick={() => handleNavigate('find_jobs')}
              className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl text-xs transition-colors border border-white/20 cursor-pointer"
            >
              Browse Open Jobs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
