import React, { useState, useEffect } from 'react';
import {
  CheckCircle2, ArrowRight, ArrowLeft, Sparkles, Briefcase, Award,
  Target, Layers, DollarSign, Clock, MapPin, Globe, FileText, Upload,
  ShieldCheck, Eye, Plus, Trash2, Check, ExternalLink, HelpCircle, X,
  Building2, Users, Rocket, ChevronRight, ChevronDown, AlertCircle, BarChart3, Search
} from 'lucide-react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import {
  CAREER_STAGES,
  RESPONSIBILITY_LEVELS,
  EMPLOYMENT_PREFERENCES,
  WORK_ARRANGEMENTS,
  JOINING_AVAILABILITY,
  JOB_SEARCH_STATUSES,
  COMPANY_ENVIRONMENTS,
  EMPLOYER_TYPES,
  CUSTOMER_MODELS,
  REVENUE_MODELS,
  ROUTES_TO_MARKET,
  BUYING_CYCLES,
  PROFICIENCY_LEVELS,
  OWNERSHIP_LEVELS,
  INTEREST_AGAIN_OPTIONS,
  CASE_STUDY_VISIBILITY_OPTIONS,
  MARKETING_SPECIALISATIONS,
  POPULAR_MARKETING_TOOLS
} from '../../utils/marketingTaxonomy';
import RevenueModelHelpTooltip from '../../components/RevenueModelHelpTooltip';

const STEPS = [
  { id: 1, title: 'Identity', subtitle: 'Account & Career Stage' },
  { id: 2, title: 'Preferences', subtitle: 'Role & Work Setup' },
  { id: 3, title: 'Expertise', subtitle: 'Marketing Capabilities' },
  { id: 4, title: 'GTM Context', subtitle: 'Audience & Experience' },
  { id: 5, title: 'Show Work', subtitle: 'Campaign Case Study' },
  { id: 6, title: 'Review', subtitle: 'Privacy & Profile' },
  { id: 7, title: 'Matches', subtitle: 'Live Opportunities' }
];

export default function CandidateOnboardingView({ onComplete, onExit }) {
  const { user, refreshUser, logout } = useAuth();
  const candidate = user?.profile || {};

  const [currentStep, setCurrentStep] = useState(candidate.onboarding_step || 1);
  const [saving, setSaving] = useState(false);

  const handleFinishOnboarding = async (targetTab = 'feed') => {
    setSaving(true);
    try {
      const ok = await saveProgress(7, true);
      if (ok && onComplete) {
        await onComplete(targetTab);
      }
    } catch (e) {
      setErrorMsg('Failed to complete onboarding. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  // ── Step 1 Form: Personal details & Career Stage ──
  const [step1Data, setStep1Data] = useState({
    full_name: candidate.full_name || user?.full_name || '',
    email: user?.email || '',
    phone: candidate.phone || '',
    city: candidate.city || '',
    state: candidate.state || '',
    place: candidate.place || '',
    title: candidate.title || '',
    career_stage: candidate.career_stage || '',
    summary: candidate.summary || '',
    linkedin_url: candidate.linkedin_url || '',
    portfolio_url: candidate.portfolio_url || '',
    resume_url: candidate.resume_url || '',
    resume_filename: candidate.resume_filename || ''
  });

  // ── Step 2 Form: Career interests & availability ──
  const hiringPrefs = candidate.hiring_preferences || {};
  const careerInts = candidate.career_interests || {};
  const [step2Data, setStep2Data] = useState({
    desired_roles: Array.isArray(careerInts.desired_roles) && careerInts.desired_roles.length > 0
      ? careerInts.desired_roles
      : (hiringPrefs.target_role ? [hiringPrefs.target_role] : (candidate.title ? [candidate.title] : [])),
    responsibility_level: careerInts.responsibility_level || '',
    employment_preference: careerInts.employment_preference || hiringPrefs.job_type || '',
    work_arrangement: Array.isArray(careerInts.work_arrangement) && careerInts.work_arrangement.length > 0
      ? careerInts.work_arrangement
      : (hiringPrefs.work_mode ? [hiringPrefs.work_mode] : []),
    preferred_locations: careerInts.preferred_locations || hiringPrefs.preferred_city || candidate.city || '',
    relocation_willingness: careerInts.relocation_willingness || '',
    timezone: careerInts.timezone || '',
    expected_salary_min: careerInts.expected_salary_min || hiringPrefs.expected_ctc || '',
    expected_salary_max: careerInts.expected_salary_max || '',
    salary_currency: careerInts.salary_currency || 'INR',
    joining_availability: careerInts.joining_availability || hiringPrefs.availability || '',
    job_search_status: careerInts.job_search_status || '',
    company_environments: careerInts.company_environments || '',
    employer_type: careerInts.employer_type || ''
  });

  // ── Step 3 Form: Specialisations & Capabilities ──
  const [primarySpec, setPrimarySpec] = useState(careerInts.primary_specialisation || '');
  const [secondarySpecs, setSecondarySpecs] = useState(Array.isArray(careerInts.secondary_specialisations) ? careerInts.secondary_specialisations : []);
  const [selectedCapabilities, setSelectedCapabilities] = useState(Array.isArray(candidate.specialisations_data) ? candidate.specialisations_data : []);
  const [capabilitySearch, setCapabilitySearch] = useState('');

  const primarySpecObj = MARKETING_SPECIALISATIONS.find(s => s.id === primarySpec);

  // Search results across all capabilities
  const searchResults = React.useMemo(() => {
    if (!capabilitySearch.trim()) return [];
    const q = capabilitySearch.toLowerCase().trim();
    const results = [];
    MARKETING_SPECIALISATIONS.forEach(spec => {
      spec.capabilities.forEach(cap => {
        if (cap.toLowerCase().includes(q)) {
          results.push({ specId: spec.id, capName: cap, specTitle: spec.title });
        }
      });
    });
    return results;
  }, [capabilitySearch]);

  const [selectedTools, setSelectedTools] = useState(
    Array.isArray(candidate.tools_proficiency) && candidate.tools_proficiency.length > 0
      ? candidate.tools_proficiency.map(t => typeof t === 'string' ? t : t.tool)
      : (Array.isArray(candidate.skills) ? candidate.skills : [])
  );

  // ── Step 4 Form: Employment, Products & GTM Context ──
  const gtmExp = candidate.gtm_experience || {};
  const pastExp = Array.isArray(candidate.experience) && candidate.experience.length > 0 ? candidate.experience[0] : {};
  const [step4Data, setStep4Data] = useState({
    company_name: pastExp.company || '',
    job_title: pastExp.title || candidate.title || '',
    employment_type: pastExp.employment_type || '',
    employer_type: gtmExp.employer_type || '',
    business_stage: gtmExp.business_stage || '',
    marketing_maturity: gtmExp.marketing_maturity || '',
    customer_model: gtmExp.customer_model || '',
    revenue_model: gtmExp.revenue_model || '',
    route_to_market: gtmExp.route_to_market || '',
    buyer_roles: gtmExp.buyer_roles || '',
    target_markets: gtmExp.target_markets || '',
    buying_cycle: gtmExp.buying_cycle || '',
    avg_purchase_value: gtmExp.avg_purchase_value || ''
  });

  // ── Step 5 Form: Show Your Work / Campaign Case Study ──
  const existingCaseStudies = Array.isArray(candidate.case_studies) && candidate.case_studies.length > 0 ? candidate.case_studies : [];
  const defaultCase = existingCaseStudies[0] || {
    title: '',
    project_type: '',
    business_context: '',
    objective: '',
    target_audience: '',
    strategy: '',
    channels: '',
    ad_spend: '',
    results_metrics: '',
    evidence_url: '',
    visibility: 'Registered employers'
  };
  const [caseStudy, setCaseStudy] = useState(defaultCase);

  // ── Step 6: Review & Privacy Settings ──
  const [privacySettings, setPrivacySettings] = useState({
    hide_mobile_from_unapproved: true,
    keep_client_confidential: false,
    open_to_matching: true
  });

  // Dynamic Profile Readiness Calculation
  const calculateReadinessScore = () => {
    let score = 20; // Base signup
    if (step1Data.full_name?.trim()) score += 10;
    if (step1Data.title?.trim()) score += 10;
    if (step1Data.resume_url) score += 15;
    if (step2Data.responsibility_level) score += 10;
    if (step2Data.work_arrangement?.length > 0) score += 5;
    if (selectedCapabilities.length > 0) {
      score += Math.min(15, selectedCapabilities.length * 3);
    }
    if (selectedTools.length > 0) score += 5;
    if (step4Data.company_name?.trim() || step4Data.customer_model) score += 5;
    if (caseStudy.title?.trim() && caseStudy.results_metrics?.trim()) score += 10;
    return Math.min(100, score);
  };

  // Load and dynamically score matched jobs when reaching Step 7
  useEffect(() => {
    if (currentStep === 7) {
      setLoadingJobs(true);
      api.getJobs()
        .then(jobs => {
          const list = Array.isArray(jobs) ? jobs : [];
          const candidateSkills = [
            ...selectedCapabilities.map(c => c.capability.toLowerCase()),
            ...selectedTools.map(t => t.toLowerCase()),
            ...(primarySpec ? [primarySpec.replace(/_/g, ' ').toLowerCase()] : [])
          ];

          const scored = list.map(job => {
            let score = 65;
            const jTitle = (job.title || '').toLowerCase();
            const jSpec = (job.specialization || '').toLowerCase();
            const jSkills = Array.isArray(job.skills) ? job.skills.map(s => s.toLowerCase()) : [];

            if (primarySpec) {
              const p = primarySpec.replace(/_/g, ' ').toLowerCase();
              if (jSpec.includes(p) || jTitle.includes(p)) score += 15;
            }

            const commonSkills = jSkills.filter(s => candidateSkills.some(cs => cs.includes(s) || s.includes(cs)));
            score += Math.min(15, commonSkills.length * 5);

            if (step2Data.work_arrangement.length > 0 && job.work_mode) {
              if (step2Data.work_arrangement.some(m => m.toLowerCase() === job.work_mode.toLowerCase())) {
                score += 5;
              }
            }

            return { ...job, fitScore: Math.min(98, Math.max(68, score)) };
          });

          scored.sort((a, b) => b.fitScore - a.fitScore);
          setMatchedJobs(scored.slice(0, 5));
        })
        .catch(() => {})
        .finally(() => setLoadingJobs(false));
    }
  }, [currentStep, primarySpec, selectedCapabilities, selectedTools, step2Data.work_arrangement]);

  // Capability Toggle & Customizer
  const toggleCapability = (specId, capName) => {
    const exists = selectedCapabilities.find(c => c.capability === capName);
    if (exists) {
      setSelectedCapabilities(prev => prev.filter(c => c.capability !== capName));
    } else {
      setSelectedCapabilities(prev => [
        ...prev,
        {
          specialisation_id: specId,
          capability: capName,
          proficiency: 'Works independently',
          ownership: 'Personally executed',
          last_used: 'Currently using',
          interest: 'Yes'
        }
      ]);
    }
  };

  const selectAllCapabilitiesForSpec = (specId) => {
    const spec = MARKETING_SPECIALISATIONS.find(s => s.id === specId);
    if (!spec) return;
    setSelectedCapabilities(prev => {
      const existingCaps = new Set(prev.map(c => c.capability));
      const toAdd = spec.capabilities
        .filter(cap => !existingCaps.has(cap))
        .map(cap => ({
          specialisation_id: specId,
          capability: cap,
          proficiency: 'Works independently',
          ownership: 'Personally executed',
          last_used: 'Currently using',
          interest: 'Yes'
        }));
      return [...prev, ...toAdd];
    });
  };

  const removeAllCapabilitiesForSpec = (specId) => {
    const spec = MARKETING_SPECIALISATIONS.find(s => s.id === specId);
    if (!spec) return;
    const capsInSpec = new Set(spec.capabilities);
    setSelectedCapabilities(prev => prev.filter(c => !capsInSpec.has(c.capability)));
  };

  const updateCapabilityAttr = (capName, attr, val) => {
    setSelectedCapabilities(prev => prev.map(c => {
      if (c.capability === capName) {
        return { ...c, [attr]: val };
      }
      return c;
    }));
  };

  const toggleTool = (tool) => {
    setSelectedTools(prev => prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]);
  };

  // Resume Upload Handler
  const handleResumeFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('Resume file size must be less than 15MB');
      return;
    }
    setUploadingResume(true);
    setErrorMsg('');
    try {
      const res = await api.uploadResume(file);
      setStep1Data(prev => ({
        ...prev,
        resume_url: res?.resume_url || `/uploads/resume/${file.name}`,
        resume_filename: res?.filename || file.name
      }));
      setResumeFile(file);
      setSuccessMsg('Resume attached successfully! We will use it to strengthen your profile match.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to upload resume');
    } finally {
      setUploadingResume(false);
    }
  };

  // Save Progress to Backend API
  const saveProgress = async (nextStep = null, forceFinished = false) => {
    setSaving(true);
    setErrorMsg('');

    const targetStep = nextStep || currentStep;
    const isFinished = forceFinished || targetStep === 7;

    // Consolidate complete profile data
    const skillsList = selectedCapabilities.map(c => c.capability);
    const expectedCtcVal = (step2Data.expected_salary_min || step2Data.expected_salary_max)
      ? `${step2Data.salary_currency} ${step2Data.expected_salary_min || '0'} - ${step2Data.expected_salary_max || ''}`.trim()
      : (hiringPrefs.expected_ctc || '');

    const updatedPayload = {
      full_name: step1Data.full_name,
      phone: step1Data.phone,
      city: step1Data.city,
      state: step1Data.state,
      place: step1Data.place,
      title: step1Data.title || (selectedCapabilities[0]?.capability ? `${selectedCapabilities[0].capability} Specialist` : (candidate.title || 'Digital Marketer')),
      summary: step1Data.summary,
      linkedin_url: step1Data.linkedin_url,
      portfolio_url: step1Data.portfolio_url,
      resume_url: step1Data.resume_url,
      resume_filename: step1Data.resume_filename,
      career_stage: step1Data.career_stage,
      skills: skillsList.length > 0 ? skillsList : (Array.isArray(candidate.skills) ? candidate.skills : []),
      expertise: skillsList.length > 0 ? skillsList : (Array.isArray(candidate.expertise) ? candidate.expertise : []),
      hiring_preferences: {
        target_role: step2Data.desired_roles[0] || step1Data.title || candidate.title || 'Digital Marketer',
        job_type: step2Data.employment_preference,
        work_mode: step2Data.work_arrangement[0] || hiringPrefs.work_mode || 'Remote',
        preferred_city: step2Data.preferred_locations,
        expected_ctc: expectedCtcVal,
        availability: step2Data.joining_availability
      },
      career_interests: {
        desired_roles: step2Data.desired_roles,
        primary_specialisation: primarySpec,
        secondary_specialisations: secondarySpecs,
        responsibility_level: step2Data.responsibility_level,
        employment_preference: step2Data.employment_preference,
        work_arrangement: step2Data.work_arrangement,
        preferred_locations: step2Data.preferred_locations,
        relocation_willingness: step2Data.relocation_willingness,
        timezone: step2Data.timezone,
        expected_salary_min: step2Data.expected_salary_min,
        expected_salary_max: step2Data.expected_salary_max,
        salary_currency: step2Data.salary_currency,
        joining_availability: step2Data.joining_availability,
        job_search_status: step2Data.job_search_status,
        company_environments: step2Data.company_environments,
        employer_type: step2Data.employer_type
      },
      specialisations_data: selectedCapabilities,
      gtm_experience: step4Data,
      case_studies: caseStudy.title?.trim() ? [caseStudy] : existingCaseStudies,
      tools_proficiency: selectedTools.map(t => ({ tool: t, proficiency: 'Works independently' })),
      onboarding_step: targetStep,
      onboarding_completed: isFinished
    };

    // If step 4 has company name, ensure candidate.experience list includes it
    if (step4Data.company_name) {
      const existingExp = Array.isArray(candidate.experience) ? [...candidate.experience] : [];
      const updatedFirstExp = {
        title: step4Data.job_title || step1Data.title || 'Marketer',
        company: step4Data.company_name,
        employment_type: step4Data.employment_type || 'Full-time',
        duration: 'Current / Recent',
        description: `Customer model: ${step4Data.customer_model || 'B2B/B2C'}, route-to-market: ${step4Data.route_to_market || 'Direct'}.`
      };
      if (existingExp.length > 0) {
        existingExp[0] = { ...existingExp[0], ...updatedFirstExp };
      } else {
        existingExp.push(updatedFirstExp);
      }
      updatedPayload.experience = existingExp;
    }

    try {
      await api.updateCandidateProfile(updatedPayload);
      await refreshUser();
      if (nextStep) {
        setCurrentStep(nextStep);
      }
      return true;
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save onboarding data to database.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    // Basic validation per step
    if (currentStep === 1) {
      if (!step1Data.full_name.trim()) {
        setErrorMsg('Please enter your full name');
        return;
      }
    }
    if (currentStep === 3) {
      if (selectedCapabilities.length === 0) {
        setErrorMsg('Please select at least 1 core marketing capability to showcase to recruiters.');
        return;
      }
    }
    const next = Math.min(STEPS.length, currentStep + 1);
    await saveProgress(next);
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  return (
    <div
      className="min-h-screen bg-[#F7F9FC] text-slate-800 pb-20 selection:bg-[#F2A93B]/30 antialiased"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
    >
      
      {/* ── Top Header & Wizard Navigation Bar ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Uptrix" className="h-7 w-auto object-contain" />
            <span className="hidden sm:inline-block h-4 w-px bg-slate-200" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider hidden sm:inline-block">
              Candidate Onboarding
            </span>
          </div>

          {/* Step Progress Pill */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">
              Step {currentStep} of {STEPS.length}:
            </span>
            <span className="text-xs font-bold text-[#1E3155] bg-[#F2A93B]/15 px-2.5 py-1 rounded-full border border-[#F2A93B]/30">
              {STEPS[currentStep - 1]?.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                const ok = await saveProgress();
                if (ok) {
                  setSuccessMsg('Onboarding progress saved successfully!');
                  setTimeout(() => setSuccessMsg(''), 3000);
                }
              }}
              disabled={saving}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Progress'}
            </button>
            {onExit ? (
              <button
                type="button"
                onClick={onExit}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 border-none bg-transparent cursor-pointer"
                title="Exit onboarding"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={logout}
                className="text-xs font-semibold text-slate-500 hover:text-rose-600 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
                title="Sign out of Uptrix"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>

        {/* Horizontal Step Indicator Bar */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-3 pt-1">
          <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
            {STEPS.map((step) => {
              const isPast = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => isPast && setCurrentStep(step.id)}
                  disabled={!isPast && !isCurrent}
                  className={`flex-1 min-w-[100px] flex items-center gap-2 pb-1.5 border-b-2 text-left transition-all cursor-pointer ${
                    isCurrent
                      ? 'border-[#1E3155] text-[#1E3155]'
                      : isPast
                        ? 'border-emerald-500 text-emerald-700'
                        : 'border-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                    isPast
                      ? 'bg-emerald-500 text-white'
                      : isCurrent
                        ? 'bg-[#1E3155] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-400'
                  }`}>
                    {isPast ? <Check className="w-3 h-3 stroke-[3]" /> : step.id}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold leading-tight truncate">{step.title}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── Main Step Container ── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        
        {/* Error notification */}
        {errorMsg && (
          <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5 shadow-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success notification */}
        {successMsg && (
          <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: Personal Details, Career Stage & Resume Prefill                    */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
              <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 m-0">
                    Create Your Marketing Profile
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 m-0">
                    Recruiters match with candidates based on exact capabilities, customer context, and verified experience.
                  </p>
                </div>
                <span className="p-2.5 rounded-2xl bg-[#5C59E8]/10 text-[#5C59E8]">
                  <Briefcase className="w-6 h-6" />
                </span>
              </div>

              {/* Career Stage Selector (Dropdown) */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Your Current Career Stage <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={step1Data.career_stage}
                    onChange={e => setStep1Data(prev => ({ ...prev, career_stage: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white outline-none cursor-pointer appearance-none pr-9 focus:border-[#1E3155]"
                    style={{ fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
                    required
                  >
                    <option value="" disabled>Choose your career stage...</option>
                    {CAREER_STAGES.map(stage => (
                      <option key={stage.id} value={stage.id} style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                        {stage.label} — {stage.desc}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
                {step1Data.career_stage && (
                  <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1.5 m-0">
                    <span className="font-semibold text-slate-700">Stage Summary:</span>
                    <span>{CAREER_STAGES.find(s => s.id === step1Data.career_stage)?.desc}</span>
                  </p>
                )}
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={step1Data.full_name}
                    onChange={e => setStep1Data({ ...step1Data, full_name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:border-[#1E3155] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Mobile Number (Country code + number)
                  </label>
                  <input
                    type="text"
                    value={step1Data.phone}
                    onChange={e => setStep1Data({ ...step1Data, phone: e.target.value })}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:border-[#1E3155] outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 m-0">Visibility is protected and controlled by you.</p>
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">City</label>
                  <input
                    type="text"
                    value={step1Data.city}
                    onChange={e => setStep1Data({ ...step1Data, city: e.target.value })}
                    placeholder="e.g. Bengaluru"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:border-[#1E3155] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">State</label>
                  <input
                    type="text"
                    value={step1Data.state}
                    onChange={e => setStep1Data({ ...step1Data, state: e.target.value })}
                    placeholder="e.g. Karnataka"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:border-[#1E3155] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Country</label>
                  <input
                    type="text"
                    value={step1Data.place}
                    onChange={e => setStep1Data({ ...step1Data, place: e.target.value })}
                    placeholder="e.g. India"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:border-[#1E3155] outline-none"
                  />
                </div>
              </div>

              {/* Professional Headline */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Professional Headline (Quick Introduction)
                </label>
                <input
                  type="text"
                  value={step1Data.title}
                  onChange={e => setStep1Data({ ...step1Data, title: e.target.value })}
                  placeholder="e.g. Senior Performance Marketing Lead | Google & Meta Ads Specialist ($2M+ Spend Managed)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:border-[#1E3155] outline-none"
                />
              </div>

              {/* Professional Summary */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Professional Summary
                </label>
                <textarea
                  rows={3}
                  value={step1Data.summary}
                  onChange={e => setStep1Data({ ...step1Data, summary: e.target.value })}
                  placeholder="Summarize your marketing journey, top channel strengths, and core metrics achieved..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:border-[#1E3155] outline-none leading-relaxed"
                />
              </div>

              {/* Resume Upload Box */}
              <div className="p-4 sm:p-5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 mb-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#5C59E8] shadow-2xs">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {step1Data.resume_filename ? step1Data.resume_filename : 'Upload Resume / CV (PDF or DOCX)'}
                      </div>
                      <p className="text-[11px] text-slate-500 m-0 mt-0.5">
                        {step1Data.resume_url ? 'Resume uploaded and linked to profile' : 'Prefills editable profile information and serves as recruiter evidence'}
                      </p>
                    </div>
                  </div>
                  <label className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs cursor-pointer transition-colors shrink-0">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleResumeFileChange}
                      disabled={uploadingResume}
                      className="hidden"
                    />
                    <span>{uploadingResume ? 'Uploading...' : (step1Data.resume_url ? 'Replace Resume' : 'Choose File')}</span>
                  </label>
                </div>
              </div>

              {/* Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">LinkedIn Profile URL</label>
                  <input
                    type="url"
                    value={step1Data.linkedin_url}
                    onChange={e => setStep1Data({ ...step1Data, linkedin_url: e.target.value })}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:border-[#1E3155] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Portfolio / Website URL</label>
                  <input
                    type="url"
                    value={step1Data.portfolio_url}
                    onChange={e => setStep1Data({ ...step1Data, portfolio_url: e.target.value })}
                    placeholder="https://mywork.com or Notion doc"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:border-[#1E3155] outline-none"
                  />
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: Career Interests, Work Setup & Availability                       */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 m-0">
                  Tell Us What Roles &amp; Terms You Want
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 m-0">
                  Matches your exact role requirements, compensation, and work mode against active company requisitions.
                </p>
              </div>

              {/* Preferred Level of Responsibility (Dropdown) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Preferred Level of Responsibility <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={step2Data.responsibility_level}
                    onChange={e => setStep2Data(prev => ({ ...prev, responsibility_level: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white outline-none cursor-pointer appearance-none pr-9 focus:border-[#1E3155]"
                    style={{ fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
                    required
                  >
                    <option value="" disabled>Select preferred level of responsibility...</option>
                    {RESPONSIBILITY_LEVELS.map(level => (
                      <option key={level} value={level} style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                        {level}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Work Arrangement & Employment Preference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Work Arrangement
                  </label>
                  <div className="flex items-center gap-2">
                    {WORK_ARRANGEMENTS.map(mode => {
                      const isSelected = step2Data.work_arrangement.includes(mode);
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            setStep2Data(prev => ({
                              ...prev,
                              work_arrangement: isSelected
                                ? prev.work_arrangement.filter(m => m !== mode)
                                : [...prev.work_arrangement, mode]
                            }));
                          }}
                          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                              : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                          }`}
                        >
                          {mode}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Employment Preference
                  </label>
                  <select
                    value={step2Data.employment_preference}
                    onChange={e => setStep2Data({ ...step2Data, employment_preference: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white outline-none cursor-pointer"
                  >
                    <option value="">Select employment preference...</option>
                    {EMPLOYMENT_PREFERENCES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Compensation Range */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Expected Annual Compensation
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-semibold mb-1">Currency</label>
                    <select
                      value={step2Data.salary_currency}
                      onChange={e => setStep2Data({ ...step2Data, salary_currency: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="AED">AED (د.إ)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-semibold mb-1">Minimum</label>
                    <input
                      type="number"
                      value={step2Data.expected_salary_min}
                      onChange={e => setStep2Data({ ...step2Data, expected_salary_min: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                      placeholder="e.g. 1500000"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-semibold mb-1">Target / Maximum</label>
                    <input
                      type="number"
                      value={step2Data.expected_salary_max}
                      onChange={e => setStep2Data({ ...step2Data, expected_salary_max: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                      placeholder="e.g. 2500000"
                    />
                  </div>
                </div>
              </div>

              {/* Joining availability & Search status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Earliest Joining / Notice Period
                  </label>
                  <select
                    value={step2Data.joining_availability}
                    onChange={e => setStep2Data({ ...step2Data, joining_availability: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white outline-none cursor-pointer"
                  >
                    <option value="">Select notice period / availability...</option>
                    <option value="Immediate (0-15 days)">Immediate (0-15 days)</option>
                    <option value="30 days">30 days notice</option>
                    <option value="60 days">60 days notice</option>
                    <option value="90 days">90 days notice</option>
                    <option value="Negotiable">Negotiable</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Job Search Status
                  </label>
                  <select
                    value={step2Data.job_search_status}
                    onChange={e => setStep2Data({ ...step2Data, job_search_status: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white outline-none cursor-pointer"
                  >
                    <option value="">Select job search status...</option>
                    {JOB_SEARCH_STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Company Environments & Employer Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Preferred Company Environment
                  </label>
                  <select
                    value={step2Data.company_environments}
                    onChange={e => setStep2Data({ ...step2Data, company_environments: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white outline-none cursor-pointer"
                  >
                    <option value="">Select company environment...</option>
                    {COMPANY_ENVIRONMENTS.map(env => (
                      <option key={env} value={env}>{env}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Preferred Employer Type
                  </label>
                  <select
                    value={step2Data.employer_type}
                    onChange={e => setStep2Data({ ...step2Data, employer_type: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white outline-none cursor-pointer"
                  >
                    <option value="">Select employer type...</option>
                    {EMPLOYER_TYPES.map(emp => (
                      <option key={emp} value={emp}>{emp}</option>
                    ))}
                  </select>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: Marketing Specialisations & Capabilities                          */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 m-0">
                  Select Your Marketing Specialisations
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 m-0">
                  Choose your primary discipline and specific capabilities you deliver. Recruiters match with you based on these capabilities.
                </p>
              </div>

              {/* 1. Primary Specialisation Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Primary Specialisation <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={primarySpec}
                    onChange={e => {
                      const val = e.target.value;
                      setPrimarySpec(val);
                      // Auto-select skills if none selected yet for a frictionless 1-click experience
                      if (selectedCapabilities.length === 0) {
                        const spec = MARKETING_SPECIALISATIONS.find(s => s.id === val);
                        if (spec) {
                          const autoCaps = spec.capabilities.map(cap => ({
                            specialisation_id: val,
                            capability: cap,
                            proficiency: 'Works independently',
                            ownership: 'Personally executed',
                            last_used: 'Currently using',
                            interest: 'Yes'
                          }));
                          setSelectedCapabilities(autoCaps);
                        }
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white outline-none cursor-pointer appearance-none pr-9 focus:border-[#1E3155]"
                    style={{ fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
                    required
                  >
                    <option value="" disabled>Select your primary marketing discipline...</option>
                    {MARKETING_SPECIALISATIONS.map(spec => (
                      <option key={spec.id} value={spec.id} style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                        {spec.title}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* 2. Secondary Specialisations Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Secondary Specialisations <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative mb-2.5">
                  <select
                    value=""
                    onChange={e => {
                      const val = e.target.value;
                      if (val && !secondarySpecs.includes(val)) {
                        setSecondarySpecs(prev => [...prev, val]);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white outline-none cursor-pointer appearance-none pr-9 focus:border-[#1E3155]"
                    style={{ fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
                  >
                    <option value="">+ Add a secondary specialisation...</option>
                    {MARKETING_SPECIALISATIONS.filter(s => s.id !== primarySpec && !secondarySpecs.includes(s.id)).map(spec => (
                      <option key={spec.id} value={spec.id} style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                        {spec.title}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>

                {secondarySpecs.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {secondarySpecs.map(secId => {
                      const spec = MARKETING_SPECIALISATIONS.find(s => s.id === secId);
                      if (!spec) return null;
                      return (
                        <span
                          key={secId}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200"
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: spec.color }}
                          />
                          <span>{spec.title}</span>
                          <button
                            type="button"
                            onClick={() => setSecondarySpecs(prev => prev.filter(x => x !== secId))}
                            className="text-slate-400 hover:text-rose-600 border-none bg-transparent p-0 cursor-pointer flex items-center"
                            title="Remove secondary specialisation"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 3. Selected Capabilities Summary (Counter & removable chips) */}
              {selectedCapabilities.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Selected Capabilities ({selectedCapabilities.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedCapabilities([])}
                      className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors border-none bg-transparent cursor-pointer font-medium"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCapabilities.map(cap => (
                      <span
                        key={cap.capability}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#1E3155] text-white shadow-2xs"
                      >
                        <span>{cap.capability}</span>
                        <button
                          type="button"
                          onClick={() => toggleCapability(cap.specialisation_id, cap.capability)}
                          className="text-slate-300 hover:text-[#F2A93B] border-none bg-transparent p-0 cursor-pointer flex items-center"
                          title="Remove capability"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Core Capabilities Selection Area */}
              <div className="space-y-4 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 m-0">
                      Key Skills &amp; Capabilities <span className="text-rose-500">*</span>
                    </label>
                    <p className="text-[11px] text-slate-400 mt-0.5 m-0">
                      Toggle skills below or search for specific capabilities.
                    </p>
                  </div>

                  {/* Skill Search Box */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search any skill..."
                      value={capabilitySearch}
                      onChange={e => setCapabilitySearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#1E3155]"
                      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                    />
                    {capabilitySearch && (
                      <button
                        type="button"
                        onClick={() => setCapabilitySearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent p-0 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* If searching, show matching search results */}
                {capabilitySearch.trim() ? (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <p className="text-xs font-semibold text-slate-500 mb-2.5 m-0">
                      Search results for "{capabilitySearch}":
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {searchResults.map(({ specId, capName }) => {
                        const isChecked = selectedCapabilities.some(c => c.capability === capName);
                        return (
                          <button
                            key={capName}
                            type="button"
                            onClick={() => toggleCapability(specId, capName)}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                              isChecked
                                ? 'bg-[#1E3155] text-white shadow-2xs ring-1 ring-[#1E3155]'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[3] text-[#F2A93B]" />}
                            <span>{capName}</span>
                          </button>
                        );
                      })}
                      {searchResults.length === 0 && (
                        <p className="text-xs text-slate-400 py-2 m-0">No capabilities found matching "{capabilitySearch}".</p>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Not searching: Show clean suggested skills for primary & secondary specialisations */
                  <div className="space-y-4">
                    {/* Primary Spec Skills */}
                    {primarySpecObj ? (
                      <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: primarySpecObj.color }}
                            />
                            <span className="text-xs font-bold text-slate-900">
                              Skills in {primarySpecObj.title}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const allSelected = primarySpecObj.capabilities.every(cap =>
                                selectedCapabilities.some(c => c.capability === cap)
                              );
                              if (allSelected) {
                                removeAllCapabilitiesForSpec(primarySpecObj.id);
                              } else {
                                selectAllCapabilitiesForSpec(primarySpecObj.id);
                              }
                            }}
                            className="text-xs font-semibold text-[#1E3155] hover:underline border-none bg-transparent cursor-pointer p-0"
                          >
                            {primarySpecObj.capabilities.every(cap =>
                              selectedCapabilities.some(c => c.capability === cap)
                            )
                              ? 'Deselect All'
                              : 'Select All'}
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {primarySpecObj.capabilities.map(capName => {
                            const isChecked = selectedCapabilities.some(c => c.capability === capName);
                            return (
                              <button
                                key={capName}
                                type="button"
                                onClick={() => toggleCapability(primarySpecObj.id, capName)}
                                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                                  isChecked
                                    ? 'bg-[#1E3155] text-white shadow-2xs ring-1 ring-[#1E3155]'
                                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                {isChecked && <Check className="w-3.5 h-3.5 stroke-[3] text-[#F2A93B]" />}
                                <span>{capName}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 rounded-2xl bg-amber-50/60 border border-amber-200 text-center">
                        <p className="text-xs font-semibold text-amber-800 m-0">
                          Please choose your Primary Specialisation above to see recommended skills.
                        </p>
                      </div>
                    )}

                    {/* Secondary Specs Skills (if any chosen) */}
                    {secondarySpecs.map(secId => {
                      const secSpec = MARKETING_SPECIALISATIONS.find(s => s.id === secId);
                      if (!secSpec) return null;
                      const allSecSelected = secSpec.capabilities.every(cap =>
                        selectedCapabilities.some(c => c.capability === cap)
                      );
                      return (
                        <div key={secSpec.id} className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: secSpec.color }}
                              />
                              <span className="text-xs font-bold text-slate-900">
                                Skills in {secSpec.title}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (allSecSelected) {
                                  removeAllCapabilitiesForSpec(secSpec.id);
                                } else {
                                  selectAllCapabilitiesForSpec(secSpec.id);
                                }
                              }}
                              className="text-xs font-semibold text-[#1E3155] hover:underline border-none bg-transparent cursor-pointer p-0"
                            >
                              {allSecSelected ? 'Deselect All' : 'Select All'}
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {secSpec.capabilities.map(capName => {
                              const isChecked = selectedCapabilities.some(c => c.capability === capName);
                              return (
                                <button
                                  key={capName}
                                  type="button"
                                  onClick={() => toggleCapability(secSpec.id, capName)}
                                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                                    isChecked
                                      ? 'bg-[#1E3155] text-white shadow-2xs ring-1 ring-[#1E3155]'
                                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                                  }`}
                                >
                                  {isChecked && <Check className="w-3.5 h-3.5 stroke-[3] text-[#F2A93B]" />}
                                  <span>{capName}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 5. Tools Stack Selection (Optional & Compact) */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 m-0">
                      Tools &amp; Platforms You Use <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <p className="text-[11px] text-slate-400 mt-0.5 m-0">
                      Highlight the software and platforms you use comfortably.
                    </p>
                  </div>
                  {selectedTools.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedTools([])}
                      className="text-[11px] text-slate-400 hover:text-rose-600 border-none bg-transparent cursor-pointer font-medium"
                    >
                      Clear tools ({selectedTools.length})
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {POPULAR_MARKETING_TOOLS.map(tool => {
                    const isSelected = selectedTools.includes(tool);
                    return (
                      <button
                        key={tool}
                        type="button"
                        onClick={() => toggleTool(tool)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        <span>{tool}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: Employment, Products & GTM Context                                 */}
        {/* ========================================================================= */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 m-0">
                  Target Customer &amp; Go-To-Market Context
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 m-0">
                  Marketing in B2B SaaS differs vastly from D2C e-commerce. Share your market models so recruiters see contextual fit.
                </p>
              </div>

              {/* Recent Company Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Most Recent Company / Client
                  </label>
                  <input
                    type="text"
                    value={step4Data.company_name}
                    onChange={e => setStep4Data({ ...step4Data, company_name: e.target.value })}
                    placeholder="e.g. Current Company or Agency Client"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:border-[#1E3155] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Job Title During Tenure
                  </label>
                  <input
                    type="text"
                    value={step4Data.job_title}
                    onChange={e => setStep4Data({ ...step4Data, job_title: e.target.value })}
                    placeholder="e.g. Lead Growth Marketer"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:border-[#1E3155] outline-none"
                  />
                </div>
              </div>

              {/* Customer Model & Revenue Model */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Customer Model</label>
                  <select
                    value={step4Data.customer_model}
                    onChange={e => setStep4Data({ ...step4Data, customer_model: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white outline-none cursor-pointer focus:border-[#1E3155]"
                  >
                    <option value="">Select customer model...</option>
                    {CUSTOMER_MODELS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Audience target (e.g. B2B businesses or B2C consumers)
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Revenue Model</label>
                    <RevenueModelHelpTooltip align="right" />
                  </div>
                  <select
                    value={step4Data.revenue_model}
                    onChange={e => setStep4Data({ ...step4Data, revenue_model: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white outline-none cursor-pointer focus:border-[#1E3155]"
                  >
                    <option value="">Select revenue model...</option>
                    {REVENUE_MODELS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    How the business monetizes (e.g. subscriptions, one-time sales, retainers)
                  </p>
                </div>
              </div>

              {/* Route to Market & Buying Cycle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Route to Market</label>
                  <select
                    value={step4Data.route_to_market}
                    onChange={e => setStep4Data({ ...step4Data, route_to_market: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white outline-none cursor-pointer"
                  >
                    <option value="">Select route to market...</option>
                    {ROUTES_TO_MARKET.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Typical Buying Cycle</label>
                  <select
                    value={step4Data.buying_cycle}
                    onChange={e => setStep4Data({ ...step4Data, buying_cycle: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white outline-none cursor-pointer"
                  >
                    <option value="">Select buying cycle...</option>
                    {BUYING_CYCLES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Buyer Persona & Markets Served */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Target Buyer Roles Reached (Personas)
                </label>
                <input
                  type="text"
                  value={step4Data.buyer_roles}
                  onChange={e => setStep4Data({ ...step4Data, buyer_roles: e.target.value })}
                  placeholder="e.g. CMOs, VP of Growth, Founders, Enterprise HR Leaders"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:border-[#1E3155] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Average Order Value (AOV) / Contract Value (ACV)
                </label>
                <input
                  type="text"
                  value={step4Data.avg_purchase_value}
                  onChange={e => setStep4Data({ ...step4Data, avg_purchase_value: e.target.value })}
                  placeholder="e.g. $10,000 - $35,000 ACV or $85 AOV"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:border-[#1E3155] outline-none"
                />
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 5: Show Your Work (Guided Campaign & Case Study)                      */}
        {/* ========================================================================= */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="p-1 rounded bg-[#F2A93B]/20 text-[#1E3155]">
                    <Sparkles className="w-4 h-4 text-[#F2A93B]" />
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 m-0">
                    Show Your Work: Campaign Dossier
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 m-0">
                  Vetted candidates are 5x more likely to be interviewed when they provide concrete proof of results.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Campaign or Project Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={caseStudy.title}
                    onChange={e => setCaseStudy({ ...caseStudy, title: e.target.value })}
                    placeholder="e.g. Scaling Paid Acquisition to $50k/mo with 3.4x ROAS"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-[#1E3155] outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Objective / Target Metric</label>
                    <input
                      type="text"
                      value={caseStudy.objective}
                      onChange={e => setCaseStudy({ ...caseStudy, objective: e.target.value })}
                      placeholder="e.g. Lower CAC by 30% and acquire 300+ customers"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:border-[#1E3155] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Monthly Ad Spend / Budget</label>
                    <input
                      type="text"
                      value={caseStudy.ad_spend}
                      onChange={e => setCaseStudy({ ...caseStudy, ad_spend: e.target.value })}
                      placeholder="e.g. $10,000 - $25,000 / month"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:border-[#1E3155] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Strategy &amp; Tactics</label>
                  <textarea
                    rows={2}
                    value={caseStudy.strategy}
                    onChange={e => setCaseStudy({ ...caseStudy, strategy: e.target.value })}
                    placeholder="Explain the angle, testing framework, channel mix, and adjustments you personally owned..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:border-[#1E3155] outline-none leading-relaxed"
                  />
                </div>

                {/* Quantified Results Box */}
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                  <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Measured Results (Metric, Baseline, End Value) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={caseStudy.results_metrics}
                    onChange={e => setCaseStudy({ ...caseStudy, results_metrics: e.target.value })}
                    placeholder="e.g. Scaled pipeline from $20k to $140k/mo. CVR increased from 1.8% to 3.4%."
                    className="w-full px-3 py-2 rounded-xl border border-emerald-300/80 bg-white text-xs font-semibold text-slate-800 outline-none"
                  />
                </div>

                {/* Evidence Link & Visibility */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Evidence Link (Optional)</label>
                    <input
                      type="url"
                      value={caseStudy.evidence_url}
                      onChange={e => setCaseStudy({ ...caseStudy, evidence_url: e.target.value })}
                      placeholder="Loom video, Notion case study, or deck"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:border-[#1E3155] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Case Study Visibility</label>
                    <select
                      value={caseStudy.visibility}
                      onChange={e => setCaseStudy({ ...caseStudy, visibility: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white outline-none cursor-pointer"
                    >
                      {CASE_STUDY_VISIBILITY_OPTIONS.map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 6: Review Profile & Privacy Settings                                 */}
        {/* ========================================================================= */}
        {currentStep === 6 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 m-0">
                  Review &amp; Confirm Your Match Profile
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 m-0">
                  Confirm your imported information and privacy settings before publishing to the talent matching network.
                </p>
              </div>

              {/* Dossier Summary Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                  <div>
                    <h3 className="text-base font-black text-slate-900 m-0">{step1Data.full_name || 'Candidate'}</h3>
                    <p className="text-xs text-slate-500 m-0">{step1Data.title || 'Digital Marketing Specialist'}</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full self-start sm:self-auto">
                    Verified Readiness: {calculateReadinessScore()}%
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Primary Anchor</span>
                    <span className="font-bold text-slate-900">
                      {primarySpec ? primarySpec.replace(/_/g, ' ').toUpperCase() : 'Not Specified'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Work Setup</span>
                    <span className="font-bold text-slate-900">
                      {step2Data.work_arrangement?.length > 0 ? step2Data.work_arrangement.join(', ') : 'Flexible'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Expected CTC</span>
                    <span className="font-bold text-slate-900">
                      {step2Data.expected_salary_min ? `${step2Data.salary_currency} ${step2Data.expected_salary_min}` : 'Negotiable'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Notice Period</span>
                    <span className="font-bold text-slate-900">
                      {step2Data.joining_availability || 'Immediate'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Tagged Capabilities ({selectedCapabilities.length})</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCapabilities.length > 0 ? (
                      selectedCapabilities.map(c => (
                        <span key={c.capability} className="text-[11px] font-semibold bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700">
                          {c.capability} ({c.proficiency})
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No specific capabilities selected yet</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider m-0">Privacy &amp; Visibility Controls</h4>
                <label className="flex items-center gap-3 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacySettings.hide_mobile_from_unapproved}
                    onChange={e => setPrivacySettings({ ...privacySettings, hide_mobile_from_unapproved: e.target.checked })}
                    className="w-4 h-4 rounded text-[#1E3155]"
                  />
                  <span>Keep mobile number hidden until recruiter sends an official match inquiry</span>
                </label>
                <label className="flex items-center gap-3 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacySettings.open_to_matching}
                    onChange={e => setPrivacySettings({ ...privacySettings, open_to_matching: e.target.checked })}
                    className="w-4 h-4 rounded text-[#1E3155]"
                  />
                  <span>Allow verified hiring managers to source and invite me to active job requisitions</span>
                </label>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 7: Opportunities & Matches Preview                                   */}
        {/* ========================================================================= */}
        {currentStep === 7 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs text-center space-y-5">
              
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 m-0">
                  You’re All Set, {step1Data.full_name.split(' ')[0] || 'Marketer'}!
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto m-0">
                  Your marketing talent dossier is now active. We’ve computed your capability scores and matched you against active requisitions.
                </p>
              </div>

              {/* Matched Requisitions Preview */}
              <div className="text-left mt-6 pt-6 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider m-0">
                    Live Compatible Requisitions
                  </h3>
                  <span className="text-[11px] text-indigo-600 font-bold">
                    {matchedJobs.length} Positions Available
                  </span>
                </div>

                {loadingJobs ? (
                  <div className="p-8 text-center text-xs text-slate-400">Computing live matches...</div>
                ) : matchedJobs.length > 0 ? (
                  <div className="space-y-2.5">
                    {matchedJobs.slice(0, 3).map(job => (
                      <div
                        key={job.id}
                        className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between gap-4 transition-colors"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900">{job.title}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {job.company?.company_name || 'Hiring Partner'} • {job.location || 'Remote'} • {job.work_mode || 'Hybrid'}
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
                          {job.fitScore || 85}% Fit
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Matching algorithms are actively running across all open requisitions.</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleFinishOnboarding('feed')}
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#1E3155] hover:bg-[#152340] text-white text-xs font-extrabold shadow-sm flex items-center justify-center gap-2 border-none cursor-pointer transition-all"
                >
                  <Sparkles className="w-4 h-4 text-[#F2A93B]" />
                  <span>Go to Candidate Dashboard</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFinishOnboarding('find_jobs')}
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-extrabold border border-indigo-200 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Rocket className="w-4 h-4 text-indigo-600" />
                  <span>Explore Matched Jobs</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFinishOnboarding('profile')}
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border-none cursor-pointer transition-all"
                >
                  <span>View My Full Profile</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ── Footer Navigation Buttons ── */}
        <div className="flex items-center justify-between gap-4 mt-6 pt-4">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : <div />}

          {currentStep < 7 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-[#1E3155] hover:bg-[#152340] text-white text-xs font-extrabold shadow-xs flex items-center gap-2 border-none cursor-pointer transition-all ml-auto"
            >
              <span>{saving ? 'Saving...' : (currentStep === 6 ? 'Complete Onboarding' : 'Save & Continue')}</span>
              <ArrowRight className="w-4 h-4 text-[#F2A93B]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleFinishOnboarding('feed')}
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-[#1E3155] hover:bg-[#152340] text-white text-xs font-extrabold shadow-xs flex items-center gap-2 border-none cursor-pointer transition-all ml-auto"
            >
              <span>Go to Candidate Dashboard</span>
              <ArrowRight className="w-4 h-4 text-[#F2A93B]" />
            </button>
          )}
        </div>

      </main>

    </div>
  );
}
