import React, { useState, useEffect } from 'react';
import {
  Search, MapPin, Briefcase, Filter, Sparkles, Building2,
  Send, CheckCircle2, X, DollarSign, Clock, Bookmark,
  ArrowUpRight, TrendingUp, ShieldCheck, ChevronRight,
  SlidersHorizontal, Check, RefreshCw, Eye, Zap, Layers,
  Target, FileText, Users, AlertCircle, Compass, Copy, Bot, Plus,
  AlertTriangle, ShieldAlert
} from 'lucide-react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function JobSearch({ setActiveTab }) {
  const { user, refreshUser } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [workModeFilter, setWorkModeFilter] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('');
  const [selectedSkillTag, setSelectedSkillTag] = useState('');
  const [sortBy, setSortBy] = useState('relevant'); // 'relevant' | 'salary' | 'newest'

  // Application & Detail Modals
  const [selectedJob, setSelectedJob] = useState(null);
  const [viewDetailsJob, setViewDetailsJob] = useState(null);
  const [aiModalJob, setAiModalJob] = useState(null);
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [appliedJobs, setAppliedJobs] = useState({});
  const [addingSkillName, setAddingSkillName] = useState(null);
  const [removingSkillName, setRemovingSkillName] = useState(null);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [lowMatchPrompt, setLowMatchPrompt] = useState(null);

  // Saved Jobs state synced with localStorage
  const [savedJobIds, setSavedJobIds] = useState(() => {
    try {
      const saved = localStorage.getItem('uptrix_saved_job_ids');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // User Profile details
  const profile = user?.profile || {};
  const [candidateProfile, setCandidateProfile] = useState(profile);
  const userName = profile.full_name || user?.full_name || user?.email?.split('@')[0] || 'Candidate';
  const userTitle = (!profile.title || profile.title.toLowerCase().includes('digital marketing')) ? 'Candidate' : profile.title;
  const userLocation = profile.city ? `${profile.city}, ${profile.state || 'India'}` : 'Hyderabad, India';

  const POPULAR_TAGS = [
    'Meta Ads', 'Google PPC', 'GA4', 'ROAS Optimization',
    'React', 'SEO Strategy', 'TikTok Ads', 'Growth Hacking'
  ];

  useEffect(() => {
    if (user?.role === 'CANDIDATE') {
      api.getCandidateProfile()
        .then(res => {
          if (res && res.id) setCandidateProfile(res);
        })
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (user?.profile) {
      setCandidateProfile(prev => ({ ...prev, ...user.profile }));
    }
  }, [user?.profile]);

  useEffect(() => {
    fetchJobs();
    fetchMyApplications();
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    try {
      const serverSaved = await api.getSavedJobs();
      if (Array.isArray(serverSaved)) {
        const map = {};
        serverSaved.forEach(j => {
          map[j.id] = {
            id: j.id,
            title: j.title,
            company: j.company || 'Digital Agency',
            location: j.location,
            salary: j.salary || `$${j.salary_min?.toLocaleString()} - $${j.salary_max?.toLocaleString()} / yr`,
            work_mode: j.work_mode,
            dateSaved: j.dateSaved || 'Saved recently'
          };
        });
        setSavedJobIds(map);
        localStorage.setItem('uptrix_saved_job_ids', JSON.stringify(map));
      }
    } catch (e) {
      // Fallback gracefully to local storage
    }
  };

  const fetchMyApplications = async () => {
    try {
      const myApps = await api.getMyApplications();
      if (Array.isArray(myApps)) {
        const map = {};
        myApps.forEach(app => {
          if (app.job_id) map[app.job_id] = true;
        });
        setAppliedJobs(map);
      }
    } catch (e) { }
  };

  const fetchJobs = (overrideParams = {}) => {
    setLoading(true);
    const params = {};
    if (searchTerm) params.search = searchTerm;
    if (workModeFilter) params.work_mode = workModeFilter;
    if (locationInput) params.location = locationInput;

    const merged = { ...params, ...overrideParams };

    api.getJobs(merged)
      .then(list => setJobs(list || []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    fetchJobs();
  };

  const handleTagClick = (tag) => {
    if (selectedSkillTag === tag) {
      setSelectedSkillTag('');
      setSearchTerm('');
      fetchJobs({ search: '' });
    } else {
      setSelectedSkillTag(tag);
      setSearchTerm(tag);
      fetchJobs({ search: tag });
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setLocationInput('');
    setWorkModeFilter('');
    setExperienceFilter('');
    setSelectedSkillTag('');
    fetchJobs({ search: '', work_mode: '', location: '' });
  };

  const handleToggleSave = async (job) => {
    const isCurrentlySaved = Boolean(savedJobIds[job.id]);
    const updated = { ...savedJobIds };

    if (isCurrentlySaved) {
      delete updated[job.id];
      setSavedJobIds(updated);
      localStorage.setItem('uptrix_saved_job_ids', JSON.stringify(updated));
      try {
        await api.unsaveJob(job.id);
      } catch (e) {
        console.error('Failed to unsave job on server', e);
      }
    } else {
      updated[job.id] = {
        id: job.id,
        title: job.title,
        company: job.company?.company_name || 'Digital Agency',
        location: job.location,
        salary: `$${job.salary_min?.toLocaleString()} - $${job.salary_max?.toLocaleString()} / yr`,
        work_mode: job.work_mode,
        dateSaved: 'Saved recently'
      };
      setSavedJobIds(updated);
      localStorage.setItem('uptrix_saved_job_ids', JSON.stringify(updated));
      try {
        await api.saveJob(job.id);
      } catch (e) {
        console.error('Failed to save job on server', e);
      }
    }
  };

  const handleOpenApply = (job) => {
    setCoverLetter('');
    setSelectedJob(job);
  };

  const executeSubmitApplication = async (job, letter) => {
    if (!job) return;
    setApplying(true);
    try {
      await api.applyJob(job.id, letter);
      setAppliedJobs(prev => ({ ...prev, [job.id]: true }));
      alert(`🎉 Application submitted successfully for '${job.title}'!`);
      setSelectedJob(null);
      setAiModalJob(null);
      setCoverLetter('');
      setLowMatchPrompt(null);
    } catch (err) {
      alert(err.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!selectedJob) return;

    // If skills match or JD match is low (< 50%), trigger the professional advisory popup
    const match = computeProfileMatch(selectedJob, candidateProfile);
    if (match.skillsScore < 50 || match.jdScore < 50 || match.score < 50) {
      setLowMatchPrompt({
        job: selectedJob,
        coverLetter: coverLetter,
        skillsScore: match.skillsScore,
        jdScore: match.jdScore,
        matchedCount: match.matchedCount,
        totalSkills: match.totalSkills
      });
      return;
    }

    await executeSubmitApplication(selectedJob, coverLetter);
  };

  const handleAddSkillToProfile = async (skillToAdd) => {
    if (!skillToAdd) return;
    setAddingSkillName(skillToAdd);
    try {
      let currentSkills = [];
      if (Array.isArray(candidateProfile?.skills)) {
        currentSkills = [...candidateProfile.skills];
      } else if (typeof candidateProfile?.skills === 'string') {
        currentSkills = candidateProfile.skills.split(',').map(s => s.trim()).filter(Boolean);
      }

      if (!currentSkills.some(s => s.toLowerCase() === skillToAdd.toLowerCase())) {
        currentSkills.push(skillToAdd);
      }

      await api.updateCandidateProfile({ skills: currentSkills });
      setCandidateProfile(prev => ({ ...prev, skills: currentSkills }));
      if (refreshUser) await refreshUser();
    } catch (e) {
      console.error('Failed to add skill to profile', e);
      alert('Failed to add skill to profile: ' + (e.message || 'Error occurred'));
    } finally {
      setAddingSkillName(null);
    }
  };

  const handleAddAllMissingSkills = async (missingSkills) => {
    if (!missingSkills || missingSkills.length === 0) return;
    setAddingSkillName('ALL');
    try {
      let currentSkills = [];
      if (Array.isArray(candidateProfile?.skills)) {
        currentSkills = [...candidateProfile.skills];
      } else if (typeof candidateProfile?.skills === 'string') {
        currentSkills = candidateProfile.skills.split(',').map(s => s.trim()).filter(Boolean);
      }

      missingSkills.forEach(ms => {
        if (!currentSkills.some(s => s.toLowerCase() === ms.toLowerCase())) {
          currentSkills.push(ms);
        }
      });

      await api.updateCandidateProfile({ skills: currentSkills });
      setCandidateProfile(prev => ({ ...prev, skills: currentSkills }));
      if (refreshUser) await refreshUser();
    } catch (e) {
      console.error('Failed to add all missing skills', e);
      alert('Failed to add skills: ' + (e.message || 'Error occurred'));
    } finally {
      setAddingSkillName(null);
    }
  };

  const handleRemoveSkillFromProfile = async (skillToRemove) => {
    if (!skillToRemove) return;
    setRemovingSkillName(skillToRemove);
    try {
      let currentSkills = [];
      if (Array.isArray(candidateProfile?.skills)) {
        currentSkills = [...candidateProfile.skills];
      } else if (typeof candidateProfile?.skills === 'string') {
        currentSkills = candidateProfile.skills.split(',').map(s => s.trim()).filter(Boolean);
      }

      const updatedSkills = currentSkills.filter(s => s.toLowerCase() !== skillToRemove.toLowerCase());

      await api.updateCandidateProfile({ skills: updatedSkills });
      setCandidateProfile(prev => ({ ...prev, skills: updatedSkills }));
      if (refreshUser) await refreshUser();
    } catch (e) {
      console.error('Failed to remove skill from profile', e);
      alert('Failed to remove skill: ' + (e.message || 'Error occurred'));
    } finally {
      setRemovingSkillName(null);
    }
  };

  const handleAddCustomSkill = async (e) => {
    if (e) e.preventDefault();
    const trimmed = customSkillInput.trim();
    if (!trimmed) return;
    await handleAddSkillToProfile(trimmed);
    setCustomSkillInput('');
  };

  const computeProfileMatch = (job, profileData) => {
    if (!job) {
      return {
        score: 0,
        skillsScore: 0,
        jdScore: 0,
        matchedSkills: [],
        missingSkills: [],
        matchedCount: 0,
        missingCount: 0,
        totalSkills: 0,
        badgeClass: '',
        barClass: '',
        verdict: ''
      };
    }

    let candidateSkills = [];
    if (Array.isArray(profileData?.skills)) {
      candidateSkills = profileData.skills;
    } else if (typeof profileData?.skills === 'string') {
      candidateSkills = profileData.skills.split(',').map(s => s.trim());
    }
    const cleanCandSkills = candidateSkills.map(s => String(s).toLowerCase().trim()).filter(Boolean);

    let candidateExpertise = [];
    if (Array.isArray(profileData?.expertise)) {
      candidateExpertise = profileData.expertise;
    } else if (typeof profileData?.expertise === 'string') {
      candidateExpertise = profileData.expertise.split(',').map(s => s.trim());
    }
    const cleanCandExpertise = candidateExpertise.map(s => String(s).toLowerCase().trim()).filter(Boolean);

    const candTitle = String(profileData?.title || '').toLowerCase();
    const candSummary = String(profileData?.summary || '').toLowerCase();

    // 1. SKILLS MATCH
    let jobSkills = [];
    if (Array.isArray(job.skills)) {
      jobSkills = job.skills;
    } else if (typeof job.skills === 'string') {
      jobSkills = job.skills.split(',').map(s => s.trim());
    }
    jobSkills = jobSkills.filter(Boolean);

    const matchedSkills = [];
    const missingSkills = [];

    jobSkills.forEach(reqSkill => {
      const reqClean = String(reqSkill).toLowerCase().trim();
      if (!reqClean) return;

      const isMatch =
        cleanCandSkills.some(cs => cs === reqClean || cs.includes(reqClean) || reqClean.includes(cs)) ||
        cleanCandExpertise.some(ce => ce === reqClean || ce.includes(reqClean) || reqClean.includes(ce)) ||
        candTitle.includes(reqClean) ||
        candSummary.includes(reqClean);

      if (isMatch) {
        matchedSkills.push(reqSkill);
      } else {
        missingSkills.push(reqSkill);
      }
    });

    const totalReq = jobSkills.length;
    let skillsScore = 0;
    if (totalReq > 0) {
      skillsScore = Math.round((matchedSkills.length / totalReq) * 100);
    } else {
      skillsScore = 80;
    }

    // 2. JOB JD (JOB DESCRIPTION & RESPONSIBILITIES) MATCH
    const jdText = [
      job.title || '',
      job.description || '',
      job.must_have_capabilities || '',
      job.preferred_capabilities || '',
      job.specialization || '',
      job.experience_level || ''
    ].join(' ').toLowerCase();

    let candExpText = '';
    if (Array.isArray(profileData?.experience)) {
      candExpText = profileData.experience.map(e => `${e.title || ''} ${e.company || ''} ${e.description || ''}`).join(' ');
    }
    let candEduText = '';
    if (Array.isArray(profileData?.education)) {
      candEduText = profileData.education.map(ed => `${ed.degree || ''} ${ed.field_of_study || ''}`).join(' ');
    }
    const candFullText = [
      candTitle,
      candSummary,
      cleanCandSkills.join(' '),
      cleanCandExpertise.join(' '),
      candExpText,
      candEduText
    ].join(' ').toLowerCase();

    const stopwords = new Set([
      'the', 'and', 'with', 'for', 'this', 'that', 'from', 'have', 'will', 'your',
      'about', 'role', 'team', 'work', 'candidates', 'candidate', 'responsibilities',
      'requirements', 'looking', 'uptrix', 'must', 'join', 'opportunity', 'plus',
      'such', 'more', 'their', 'they', 'what', 'when', 'which', 'where', 'also'
    ]);

    const jdWords = jdText
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .map(w => w.trim())
      .filter(w => w.length > 3 && !stopwords.has(w));

    const uniqueJdWords = Array.from(new Set(jdWords));
    let matchedJdWords = 0;
    uniqueJdWords.forEach(w => {
      if (candFullText.includes(w)) {
        matchedJdWords++;
      }
    });

    const keywordRatio = uniqueJdWords.length > 0 ? (matchedJdWords / uniqueJdWords.length) : 0.6;
    let jdKeywordScore = Math.min(100, Math.round(keywordRatio * 100 * 1.35));

    let titleBonus = 0;
    const jobTitleLower = (job.title || '').toLowerCase();
    const jobSpecLower = (job.specialization || '').toLowerCase();
    if (candTitle && (candTitle.includes(jobTitleLower) || jobTitleLower.includes(candTitle))) {
      titleBonus += 20;
    } else if (jobSpecLower && candTitle && candTitle.includes(jobSpecLower)) {
      titleBonus += 15;
    } else if (cleanCandExpertise.some(ce => jobTitleLower.includes(ce) || jobSpecLower.includes(ce))) {
      titleBonus += 12;
    } else {
      titleBonus += 5;
    }

    let locBonus = 0;
    const jobWorkMode = (job.work_mode || '').toLowerCase();
    const candCity = (profileData?.city || '').toLowerCase();
    const jobLoc = (job.location || '').toLowerCase();
    if (jobWorkMode.includes('remote') || (candCity && jobLoc.includes(candCity))) {
      locBonus += 10;
    } else {
      locBonus += 5;
    }

    let expBonus = 0;
    const reqExp = job.min_experience || 0;
    const candExpYears = profileData?.years_of_experience || (Array.isArray(profileData?.experience) ? profileData.experience.length * 1.5 : 2);
    if (candExpYears >= reqExp) {
      expBonus += 15;
    } else {
      expBonus += 8;
    }

    let jdScore = Math.min(100, Math.max(15, Math.round((jdKeywordScore * 0.55) + titleBonus + locBonus + expBonus)));

    // 3. OVERALL COMPOSITE FIT SCORE
    let score = Math.round((skillsScore * 0.55) + (jdScore * 0.45));
    score = Math.min(100, Math.max(10, score));

    let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
    let barClass = 'bg-emerald-500';
    let verdict = 'Strong Match';

    if (score < 50 || skillsScore < 50) {
      badgeClass = 'bg-rose-50 text-rose-700 border-rose-200/80';
      barClass = 'bg-rose-500';
      verdict = 'Skill Gap Detected';
    } else if (score < 75) {
      badgeClass = 'bg-amber-50 text-amber-700 border-amber-200/80';
      barClass = 'bg-amber-500';
      verdict = 'Good Match';
    }

    return {
      score,
      skillsScore,
      jdScore,
      matchedSkills,
      missingSkills,
      matchedCount: matchedSkills.length,
      missingCount: missingSkills.length,
      totalSkills: totalReq,
      badgeClass,
      barClass,
      verdict
    };
  };

  const generateAiPitch = (job, match, profileData) => {
    if (!job) return '';
    const company = job.company?.company_name || 'your team';
    const matchedText = match.matchedSkills.length > 0
      ? `leveraging my strong background in ${match.matchedSkills.slice(0, 3).join(', ')}`
      : `bringing my digital marketing experience and fast learning agility`;

    const missingText = match.missingSkills.length > 0
      ? `While actively working with ${match.missingSkills.slice(0, 2).join(' and ')}, I apply data-driven campaign testing and rapid iteration to deliver measurable ROI.`
      : `My qualifications closely mirror the core requirements for this opening.`;

    return `Dear Hiring Team at ${company},\n\nI am excited about the ${job.title} opportunity. In this role, I am eager to contribute by ${matchedText}. ${missingText}\n\nI would welcome the opportunity to discuss how my skill set can accelerate your growth objectives.\n\nBest regards,\n${profileData?.full_name || userName || 'Candidate'}`;
  };

  // Filter & Sort jobs client-side for ultra-smooth responsiveness
  const filteredJobs = jobs.filter(job => {
    if (workModeFilter && job.work_mode?.toLowerCase() !== workModeFilter.toLowerCase()) {
      return false;
    }
    if (experienceFilter) {
      const exp = (job.experience_level || '').toLowerCase();
      if (experienceFilter === 'entry' && !exp.includes('entry') && !exp.includes('junior')) return false;
      if (experienceFilter === 'mid' && !exp.includes('mid')) return false;
      if (experienceFilter === 'senior' && !exp.includes('senior') && !exp.includes('lead')) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'match') {
      const matchA = computeProfileMatch(a, candidateProfile).score;
      const matchB = computeProfileMatch(b, candidateProfile).score;
      return matchB - matchA;
    }
    if (sortBy === 'salary') {
      return (b.salary_max || 0) - (a.salary_max || 0);
    }
    if (sortBy === 'newest') {
      return (b.id || 0) - (a.id || 0);
    }
    return 0; // 'relevant' default
  });

  return (
    <div className="bg-[#F6F7FB] min-h-screen py-5 text-slate-800 font-sans">
      <div className="max-w-10xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* ========================================================================= */}
          {/* LEFT COLUMN: Candidate Summary & Interactive Filter Sidebar (Fixed/Sticky) */}
          {/* ========================================================================= */}
          <aside className="lg:col-span-3">
            <div className="lg:sticky lg:top-5 space-y-4 lg:max-h-[calc(100vh-6.5rem)] lg:overflow-y-auto no-scrollbar overscroll-contain pb-6">

            {/* 1. Candidate Mini Profile Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
              <div className="h-16 bg-gradient-to-r from-slate-800 via-slate-900 to-indigo-950 relative">
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:12px_12px]" />
              </div>
              <div className="px-4 pb-4 pt-0 text-center relative -mt-9">
                <div className="inline-block relative">
                  <div className="w-16 h-16 rounded-full border-2 border-white shadow-md bg-slate-900 text-white font-bold text-xl flex items-center justify-center mx-auto ring-2 ring-[#0a66c2]/40">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div
                  className="mt-2.5 cursor-pointer group"
                  onClick={() => setActiveTab('candidate_profile')}
                >
                  <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:underline group-hover:text-[#0a66c2] flex items-center justify-center gap-1">
                    {userName}
                    <ShieldCheck className="w-4 h-4 text-[#0a66c2] shrink-0" />
                  </h3>
                  <p className="text-xs text-slate-500 leading-snug mt-0.5 line-clamp-1">
                    {userTitle}
                  </p>
                  <p className="text-[0.7rem] text-slate-400 mt-1 flex items-center justify-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" /> {userLocation}
                  </p>
                </div>

                <div className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
                  <div
                    onClick={() => setActiveTab('my_applications')}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    <span className="block font-bold text-slate-900 text-sm">{Object.keys(appliedJobs).length}</span>
                    <span className="text-[0.68rem] text-slate-500 font-medium">Applied</span>
                  </div>
                  <div
                    onClick={() => setActiveTab('saved_jobs')}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    <span className="block font-bold text-slate-900 text-sm">{Object.keys(savedJobIds).length}</span>
                    <span className="text-[0.68rem] text-slate-500 font-medium">Saved</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Refine Filter Studio */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#0a66c2]" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Filter Roles
                  </span>
                </div>
                {(workModeFilter || experienceFilter || selectedSkillTag || searchTerm || locationInput) && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-[0.7rem] font-bold text-[#0a66c2] hover:underline flex items-center gap-1 bg-transparent border-none cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Reset
                  </button>
                )}
              </div>

              {/* Work Mode Pill Selector */}
              <div>
                <label className="block text-[0.72rem] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Work Setup
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {['', 'Remote', 'Hybrid', 'On-site'].map(mode => {
                    const label = mode === '' ? 'All Modes' : mode;
                    const isActive = workModeFilter === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          setWorkModeFilter(mode);
                          fetchJobs({ work_mode: mode });
                        }}
                        className={`py-1.5 px-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${isActive
                            ? 'bg-[#0a66c2] text-white border-[#0a66c2] shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Experience Level Selector */}
              <div>
                <label className="block text-[0.72rem] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Experience Level
                </label>
                <div className="space-y-1.5">
                  {[
                    { id: '', label: 'Any Experience' },
                    { id: 'mid', label: 'Mid-Senior Level' },
                    { id: 'senior', label: 'Senior / Lead' },
                    { id: 'entry', label: 'Entry / Associate' }
                  ].map(lvl => (
                    <label
                      key={lvl.id}
                      className="flex items-center gap-2 text-xs text-slate-700 font-medium hover:text-slate-900 cursor-pointer py-1"
                    >
                      <input
                        type="radio"
                        name="exp_filter"
                        checked={experienceFilter === lvl.id}
                        onChange={() => setExperienceFilter(lvl.id)}
                        className="text-[#0a66c2] focus:ring-[#0a66c2]"
                      />
                      <span>{lvl.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Popular Skill Chips */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-[0.72rem] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Popular Skill Tags
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_TAGS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagClick(tag)}
                      className={`text-[0.68rem] font-medium px-2.5 py-1 rounded-lg transition-colors cursor-pointer border ${selectedSkillTag === tag
                          ? 'bg-[#0a66c2] text-white border-[#0a66c2]'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* 3. Job Alert Notification Box */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-2xl border border-emerald-200/70 p-4 text-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold">
                <Zap className="w-4 h-4 text-emerald-600" />
                <span>Instant Job Match Alert</span>
              </div>
              <p className="text-emerald-900/80 text-[0.72rem] leading-relaxed">
                Receive instant notifications as soon as verified recruiters publish roles matching your preferred skills.
              </p>
              <button
                type="button"
                onClick={() => alert('Job alerts activated for your profile!')}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors border-none cursor-pointer"
              >
                Turn On Job Alerts
              </button>
            </div>

            {/* 4. Fast-Track Candidate Advice */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 text-xs space-y-2.5">
              <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Recruiter Tips</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[0.72rem]">
                Candidates who include past campaign ROAS or portfolio links receive responses from digital marketing hiring managers 3x faster.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('candidate_profile')}
                className="text-[#0a66c2] hover:underline font-bold text-[0.72rem] inline-flex items-center gap-1 border-none bg-transparent p-0 cursor-pointer"
              >
                Refine Your Candidate Profile <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            </div>
          </aside>

          {/* ========================================================================= */}
          {/* CENTER COLUMN: Search Studio & Professional Job Listings Feed             */}
          {/* ========================================================================= */}
          <main className="lg:col-span-9 space-y-4 self-start">

            {/* 1. LinkedIn-style Hero Search Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    Explore <span className="text-[#0a66c2]">Opportunities</span>
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Connect with top digital marketing agencies, growth teams, and verified tech partners.
                  </p>
                </div>
                <span className="text-[0.7rem] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                  <Sparkles className="w-3 h-3 text-emerald-600" /> Verified Openings
                </span>
              </div>

              {/* Dual Input Search Bar */}
              <form onSubmit={handleSearchSubmit} className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">

                  {/* Role / Technology Keyword Input */}
                  <div className="sm:col-span-7 relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200/90 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#0a66c2] transition-all placeholder:text-slate-400"
                      placeholder="Title, skill, or keyword (e.g. SEO, Meta Ads)..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Location Input */}
                  <div className="sm:col-span-5 relative">
                    <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200/90 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#0a66c2] transition-all placeholder:text-slate-400"
                      placeholder="City, location, or remote..."
                      value={locationInput}
                      onChange={e => setLocationInput(e.target.value)}
                    />
                  </div>

                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto no-scrollbar py-1">
                    <span className="text-[0.7rem] font-bold text-slate-400 uppercase shrink-0">Try:</span>
                    {['Meta Ads', 'React', 'SEO Strategy', 'ROAS'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleTagClick(t)}
                        className="text-[0.7rem] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md shrink-0 border-none cursor-pointer transition-colors"
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#0a66c2] hover:bg-[#084e96] text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 shrink-0 border-none cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Search Roles</span>
                  </button>
                </div>
              </form>
            </div>

            {/* 2. Results Header Bar */}
            <div className="flex items-center justify-between px-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">
                  {loading ? 'Searching...' : `${filteredJobs.length} Open Positions`}
                </span>
                {workModeFilter && (
                  <span className="bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-md text-[0.7rem]">
                    {workModeFilter}
                  </span>
                )}
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                <span>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="bg-transparent border-none font-bold text-slate-800 text-xs outline-none cursor-pointer py-1"
                >
                  <option value="relevant">Most Relevant</option>
                  <option value="match">Highest Profile Match ★</option>
                  <option value="salary">Highest Salary</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>
            </div>

            {/* 3. Job Results Feed */}
            {loading ? (
              <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-sm space-y-3">
                <div className="w-8 h-8 border-3 border-[#0a66c2] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-600">Loading digital marketing opportunities...</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">No matching roles found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try broadening your keyword, removing location constraints, or clearing active filters.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors border-none cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredJobs.map(job => {
                  const isApplied = Boolean(appliedJobs[job.id]);
                  const isSaved = Boolean(savedJobIds[job.id]);
                  const companyName = job.company?.company_name || 'Verified Agency';
                  const compInitial = companyName.charAt(0).toUpperCase();

                  return (
                    <div
                      key={job.id}
                      className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 hover:border-[#0a66c2]/60 hover:shadow-md transition-all duration-200 shadow-sm group relative"
                    >
                      {/* Top Header: Company Avatar + Title + Bookmark */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-xs border border-slate-200 group-hover:scale-105 transition-transform">
                            {compInitial}
                          </div>
                          <div className="min-w-0">
                            <h3
                              onClick={() => setViewDetailsJob(job)}
                              className="text-base font-bold text-slate-900 group-hover:text-[#0a66c2] transition-colors leading-snug cursor-pointer line-clamp-1"
                            >
                              {job.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-600 flex-wrap">
                              <span className="font-semibold text-slate-800 flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                {companyName}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="flex items-center gap-1 text-slate-500">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                {job.location || 'Remote'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Bookmark Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleSave(job)}
                          className={`p-2 rounded-xl border transition-colors cursor-pointer shrink-0 ${isSaved
                              ? 'bg-amber-50 border-amber-200 text-amber-600'
                              : 'bg-transparent border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-700'
                            }`}
                          title={isSaved ? 'Remove from saved' : 'Save job'}
                        >
                          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-500' : ''}`} />
                        </button>
                      </div>

                      {/* Meta Tags: Salary + Work Mode + Experience */}
                      <div className="flex items-center gap-2 flex-wrap mb-3 text-xs">
                        <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-lg flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-emerald-600" />
                          ${job.salary_min?.toLocaleString()} - ${job.salary_max?.toLocaleString()} / yr
                        </span>
                        <span className="font-semibold text-slate-700 bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-lg">
                          {job.work_mode || 'Flexible'}
                        </span>
                        {job.job_type && (
                          <span className="font-medium text-slate-600 bg-slate-50 border border-slate-200/70 px-2.5 py-1 rounded-lg">
                            {job.job_type}
                          </span>
                        )}
                        {job.ownership_level && (
                          <span className="font-medium text-purple-700 bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-lg">
                            {job.ownership_level}
                          </span>
                        )}
                        {job.specialization && (
                          <span className="font-medium text-teal-700 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-lg">
                            {job.specialization}
                          </span>
                        )}
                        {job.availability_requirement && (
                          <span className="font-medium text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-lg">
                            {job.availability_requirement}
                          </span>
                        )}
                        {!job.ownership_level && job.experience_level && (
                          <span className="font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                            {job.experience_level}
                          </span>
                        )}
                      </div>

                      {/* Description Snippet */}
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3.5">
                        {job.description}
                      </p>

                      {/* Required Skills Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap mb-3.5">
                        <span className="text-[0.68rem] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                          Required Skills:
                        </span>
                        {(job.skills || []).map((skill, i) => (
                          <span
                            key={i}
                            onClick={() => handleTagClick(skill)}
                            className="text-[0.68rem] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                      {/* Action Footer Bar */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 flex-wrap gap-2">
                        <div className="flex items-center gap-1.5 text-[0.7rem] text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Actively Reviewing Applicants</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setAiModalJob(job)}
                            className="px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-700 hover:text-indigo-900 border border-indigo-200/80 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs group"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600 group-hover:rotate-12 transition-transform" />
                            <span>AI Analyse</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setViewDetailsJob(job)}
                            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            View Details
                          </button>

                          {isApplied ? (
                            <span className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Applied
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenApply(job)}
                              className="px-4 py-2 rounded-xl bg-[#0a66c2] hover:bg-[#084e96] text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 border-none cursor-pointer"
                            >
                              <Send className="w-3 h-3" /> Easy Apply
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </main>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: VIEW FULL JOB DETAILS & ROLE BRIEF SPECIFICATION                */}
      {/* ========================================================================= */}
      {viewDetailsJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl border border-slate-200 p-6 sm:p-7 space-y-5">

            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white font-bold text-lg flex items-center justify-center shrink-0 shadow-sm">
                  {(viewDetailsJob.company?.company_name || 'A').charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[0.65rem] font-extrabold uppercase tracking-widest text-[#00a884] bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/50">
                      Role Specification Brief
                    </span>
                    {viewDetailsJob.company?.is_verified && (
                      <span className="flex items-center gap-1 text-[0.65rem] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        <ShieldCheck className="w-3 h-3" /> Verified Employer
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-1 capitalize leading-snug">
                    {viewDetailsJob.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-700">{viewDetailsJob.company?.company_name || 'Hiring Organization'}</span>
                    <span>•</span>
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{viewDetailsJob.location || 'Remote / Flexible'}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewDetailsJob(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors border-none bg-transparent cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Key Role Parameters Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {/* Compensation */}
              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100/80">
                <span className="text-[0.65rem] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> Compensation
                </span>
                <p className="text-xs font-extrabold text-emerald-900 mt-0.5">
                  {viewDetailsJob.salary_min && viewDetailsJob.salary_max
                    ? `$${viewDetailsJob.salary_min.toLocaleString()} - $${viewDetailsJob.salary_max.toLocaleString()} / yr`
                    : 'Competitive'}
                </p>
              </div>

              {/* Work Mode & Type */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Briefcase className="w-3 h-3" /> Workplace & Type
                </span>
                <p className="text-xs font-bold text-slate-800 mt-0.5">
                  {viewDetailsJob.work_mode || 'Flexible'} {viewDetailsJob.job_type ? `• ${viewDetailsJob.job_type}` : ''}
                </p>
              </div>

              {/* Availability Requirement */}
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-100/80">
                <span className="text-[0.65rem] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Availability / Notice
                </span>
                <p className="text-xs font-bold text-amber-900 mt-0.5 truncate">
                  {viewDetailsJob.availability_requirement || 'Immediate to 30 days'}
                </p>
              </div>

              {/* Ownership Level */}
              <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-100/80">
                <span className="text-[0.65rem] font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1">
                  <Target className="w-3 h-3" /> Ownership Level
                </span>
                <p className="text-xs font-bold text-purple-900 mt-0.5 truncate">
                  {viewDetailsJob.ownership_level || 'Pod / Project Contributor'}
                </p>
              </div>

              {/* Specialization */}
              <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-100/80">
                <span className="text-[0.65rem] font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Specialization
                </span>
                <p className="text-xs font-bold text-teal-900 mt-0.5 capitalize truncate">
                  {viewDetailsJob.specialization || 'Full Stack Track'}
                </p>
              </div>

              {/* Experience */}
              <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100/80">
                <span className="text-[0.65rem] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                  <Layers className="w-3 h-3" /> Experience Req.
                </span>
                <p className="text-xs font-bold text-indigo-900 mt-0.5">
                  {viewDetailsJob.min_experience ? `${viewDetailsJob.min_experience}+ Years` : 'Open / Unrestricted'}
                </p>
              </div>
            </div>

            {/* Real-Time Profile Match Analysis */}
            {(() => {
              const detailsMatch = computeProfileMatch(viewDetailsJob, candidateProfile);
              return (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200/90 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 shadow-2xs ${detailsMatch.badgeClass}`}>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{detailsMatch.score}% Profile Match</span>
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        {detailsMatch.verdict}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      {detailsMatch.matchedCount} of {detailsMatch.totalSkills || 1} requirements met
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${detailsMatch.barClass}`}
                      style={{ width: `${detailsMatch.score}%` }}
                    />
                  </div>

                  {/* Dual Breakdown: Skills vs Job JD */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
                      <div className="flex justify-between items-center text-[0.68rem] font-bold text-slate-700">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Skills Match
                        </span>
                        <span className={detailsMatch.skillsScore < 50 ? "text-rose-600 font-black" : "text-emerald-700 font-black"}>
                          {detailsMatch.skillsScore}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${detailsMatch.skillsScore < 50 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                          style={{ width: `${detailsMatch.skillsScore}%` }}
                        />
                      </div>
                      <span className="text-[0.62rem] text-slate-400 block">
                        {detailsMatch.matchedCount}/{detailsMatch.totalSkills || 1} Skills
                      </span>
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
                      <div className="flex justify-between items-center text-[0.68rem] font-bold text-slate-700">
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-indigo-600" /> Job JD Match
                        </span>
                        <span className="text-indigo-700 font-black">
                          {detailsMatch.jdScore}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${detailsMatch.jdScore}%` }}
                        />
                      </div>
                      <span className="text-[0.62rem] text-slate-400 block">
                        JD Relevance
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-0.5 text-xs">
                    {detailsMatch.matchedSkills.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-emerald-800 flex items-center gap-1 text-[0.72rem] shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Matched:
                        </span>
                        {detailsMatch.matchedSkills.map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[0.7rem] flex items-center gap-1"
                          >
                            <Check className="w-3 h-3 text-emerald-600" /> {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {detailsMatch.missingSkills.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-amber-800 flex items-center gap-1 text-[0.72rem] shrink-0">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Missing in Profile:
                        </span>
                        {detailsMatch.missingSkills.map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-[0.7rem] flex items-center gap-1"
                          >
                            <X className="w-3 h-3 text-amber-600" /> {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Core Capabilities */}
            {(viewDetailsJob.must_have_capabilities || viewDetailsJob.preferred_capabilities) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {viewDetailsJob.must_have_capabilities && (
                  <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100/80 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00a884]" />
                      <h5 className="text-[0.68rem] font-extrabold uppercase tracking-wider">Must-Have Capabilities</h5>
                    </div>
                    <p className="text-xs text-slate-800 leading-relaxed font-medium pl-5">{viewDetailsJob.must_have_capabilities}</p>
                  </div>
                )}
                {viewDetailsJob.preferred_capabilities && (
                  <div className="p-4 bg-blue-50/40 rounded-2xl border border-blue-100/80 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-blue-800">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <h5 className="text-[0.68rem] font-extrabold uppercase tracking-wider">Preferred Capabilities</h5>
                    </div>
                    <p className="text-xs text-slate-800 leading-relaxed font-medium pl-5">{viewDetailsJob.preferred_capabilities}</p>
                  </div>
                )}
              </div>
            )}

            {/* Role Overview */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" /> Role Overview & Scope of Work
              </h4>
              <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {viewDetailsJob.description || 'No detailed scope of work provided for this requisition.'}
              </div>
            </div>

            {/* Target Skills & Proficiencies */}
            {viewDetailsJob.skills && viewDetailsJob.skills.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-slate-400" /> Target Skills & Proficiencies
                </h4>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {viewDetailsJob.skills.map((sk, i) => (
                    <span key={i} className="text-xs font-semibold bg-slate-100 text-slate-800 px-3 py-1 rounded-lg border border-slate-200/60">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── Business Context ── */}
            {(() => {
              const bContext = viewDetailsJob.business_context || {
                product_service: viewDetailsJob.product_service || viewDetailsJob.company?.product_service || 'CloudNest workflow software',
                business_model: viewDetailsJob.business_model || viewDetailsJob.company?.business_model || 'Local services',
                growth_stage: viewDetailsJob.growth_stage || viewDetailsJob.company?.growth_stage || 'Scaling',
                target_audience: viewDetailsJob.target_audience || viewDetailsJob.company?.target_audience || 'Operations leaders at mid-market companies',
                ideal_customer_profile: viewDetailsJob.ideal_customer_profile || viewDetailsJob.company?.ideal_customer_profile || 'Companies with 100–500 employees managing complex internal approvals.'
              };
              const hasBContext = bContext.product_service || bContext.business_model || bContext.growth_stage || bContext.target_audience || bContext.ideal_customer_profile;
              if (!hasBContext) return null;

              return (
                <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#00a884]" /> Business Context
                    </h4>
                    <span className="text-[0.65rem] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      Organization Architecture
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    {bContext.product_service && (
                      <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[0.65rem] font-bold text-slate-400 block uppercase">Product / Service</span>
                        <span className="font-semibold text-slate-800">{bContext.product_service}</span>
                      </div>
                    )}
                    {bContext.business_model && (
                      <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[0.65rem] font-bold text-slate-400 block uppercase">Business Model</span>
                        <span className="font-semibold text-slate-800">{bContext.business_model}</span>
                      </div>
                    )}
                    {bContext.growth_stage && (
                      <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[0.65rem] font-bold text-slate-400 block uppercase">Growth Stage</span>
                        <span className="font-semibold text-slate-800">{bContext.growth_stage}</span>
                      </div>
                    )}
                    {bContext.target_audience && (
                      <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[0.65rem] font-bold text-slate-400 block uppercase">Target Audience</span>
                        <span className="font-semibold text-slate-800">{bContext.target_audience}</span>
                      </div>
                    )}
                  </div>

                  {bContext.ideal_customer_profile && (
                    <div className="bg-white p-3 rounded-xl border border-slate-100 text-xs">
                      <span className="text-[0.65rem] font-bold text-slate-400 block uppercase mb-0.5">Ideal Customer Profile (ICP)</span>
                      <p className="text-slate-700 leading-relaxed font-medium">{bContext.ideal_customer_profile}</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── Hiring Need ── */}
            {(() => {
              const hNeed = viewDetailsJob.hiring_need || {
                business_problem: viewDetailsJob.business_problem || viewDetailsJob.company?.business_problem || 'Lead volume is rising, but qualified pipeline is inconsistent.',
                expected_outcome: viewDetailsJob.expected_outcome || viewDetailsJob.company?.expected_outcome || 'Build a repeatable demand programme and improve lead-to-opportunity quality.',
                team_support: viewDetailsJob.team_support || viewDetailsJob.company?.team_support || 'Marketing head, content specialist, shared design support',
                monthly_budget_range: viewDetailsJob.monthly_budget_range || viewDetailsJob.company?.monthly_budget_range || '₹8–12 lakh',
                decision_authority: viewDetailsJob.decision_authority || viewDetailsJob.company?.decision_authority || 'Own campaigns and recommend budget allocation',
                success_horizon: viewDetailsJob.success_horizon || viewDetailsJob.company?.success_horizon || 'First 90 days'
              };
              const hasHNeed = hNeed.business_problem || hNeed.expected_outcome || hNeed.team_support || hNeed.monthly_budget_range || hNeed.decision_authority || hNeed.success_horizon;
              if (!hasHNeed) return null;

              return (
                <div className="p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-[#00a884]" /> Hiring Need & Strategic Objectives
                    </h4>
                    <span className="text-[0.65rem] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Requisition Mandate
                    </span>
                  </div>

                  {/* Problem & Expected Outcome */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {hNeed.business_problem && (
                      <div className="bg-white p-3 rounded-xl border border-amber-100 shadow-2xs space-y-1">
                        <span className="text-[0.65rem] font-bold text-amber-700 flex items-center gap-1 uppercase tracking-wider">
                          <AlertCircle className="w-3 h-3 text-amber-600" /> Business Problem
                        </span>
                        <p className="text-xs text-slate-800 leading-relaxed font-medium">{hNeed.business_problem}</p>
                      </div>
                    )}
                    {hNeed.expected_outcome && (
                      <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs space-y-1">
                        <span className="text-[0.65rem] font-bold text-emerald-700 flex items-center gap-1 uppercase tracking-wider">
                          <CheckCircle2 className="w-3 h-3 text-[#00a884]" /> Expected Outcome
                        </span>
                        <p className="text-xs text-slate-800 leading-relaxed font-medium">{hNeed.expected_outcome}</p>
                      </div>
                    )}
                  </div>

                  {/* Team, Budget, Authority, Horizon */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {hNeed.team_support && (
                      <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[0.62rem] font-bold text-slate-400 block uppercase">Team Support</span>
                        <span className="font-semibold text-slate-800 text-[0.72rem] leading-tight line-clamp-2">{hNeed.team_support}</span>
                      </div>
                    )}
                    {hNeed.monthly_budget_range && (
                      <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[0.62rem] font-bold text-slate-400 block uppercase">Monthly Budget</span>
                        <span className="font-semibold text-emerald-800 text-[0.72rem] leading-tight">{hNeed.monthly_budget_range}</span>
                      </div>
                    )}
                    {hNeed.decision_authority && (
                      <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[0.62rem] font-bold text-slate-400 block uppercase">Decision Authority</span>
                        <span className="font-semibold text-slate-800 text-[0.72rem] leading-tight line-clamp-2">{hNeed.decision_authority}</span>
                      </div>
                    )}
                    {hNeed.success_horizon && (
                      <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[0.62rem] font-bold text-slate-400 block uppercase">Success Horizon</span>
                        <span className="font-semibold text-indigo-800 text-[0.72rem] leading-tight">{hNeed.success_horizon}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Company Overview Story */}
            {viewDetailsJob.company?.about && (
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-1.5">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" /> About {viewDetailsJob.company?.company_name || 'Hiring Organization'}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">{viewDetailsJob.company.about}</p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setAiModalJob(viewDetailsJob);
                  setViewDetailsJob(null);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-700 border border-indigo-200/80 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs group"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 group-hover:rotate-12 transition-transform" />
                <span>AI Analyse Match & Gaps</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewDetailsJob(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
                {appliedJobs[viewDetailsJob.id] ? (
                  <span className="px-5 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#00a884]" /> Already Applied
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      handleOpenApply(viewDetailsJob);
                      setViewDetailsJob(null);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#00a884] hover:bg-[#008f6f] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all border-none cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Apply Now
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EASY APPLY DIALOG WITH COVER NOTE                                */}
      {/* ========================================================================= */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl border border-slate-200 p-6 sm:p-7 space-y-5">

            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[0.68rem] font-bold text-[#0a66c2] uppercase tracking-wider">
                  Easy Application
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">{selectedJob.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedJob.company?.company_name} • {selectedJob.location}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedJob(null); setCoverLetter(''); }}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors border-none bg-transparent cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Applicant Profile Verification */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900">{userName}</p>
                <p className="text-[0.7rem] text-slate-500">{user?.email}</p>
                <p className="text-[0.68rem] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Profile and Credentials Attached
                </p>
              </div>
            </div>

            {/* Real-Time Profile Match Analysis for this Application */}
            {(() => {
              const modalMatch = computeProfileMatch(selectedJob, candidateProfile);
              return (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-200/90 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-xl text-xs font-extrabold border flex items-center gap-1.5 shadow-2xs ${modalMatch.badgeClass}`}>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{modalMatch.score}% Profile Match</span>
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        {modalMatch.verdict}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      {modalMatch.matchedCount} of {modalMatch.totalSkills || 1} required skills matched
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${modalMatch.barClass}`}
                      style={{ width: `${modalMatch.score}%` }}
                    />
                  </div>

                  {/* Dual Breakdown: Skills vs Job JD */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
                    <div className="p-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
                      <div className="flex justify-between items-center text-[0.68rem] font-bold text-slate-700">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Skills Match
                        </span>
                        <span className={modalMatch.skillsScore < 50 ? "text-rose-600 font-black" : "text-emerald-700 font-black"}>
                          {modalMatch.skillsScore}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${modalMatch.skillsScore < 50 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                          style={{ width: `${modalMatch.skillsScore}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
                      <div className="flex justify-between items-center text-[0.68rem] font-bold text-slate-700">
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-indigo-600" /> Job JD Match
                        </span>
                        <span className="text-indigo-700 font-black">
                          {modalMatch.jdScore}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${modalMatch.jdScore}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Breakdown details */}
                  <div className="space-y-2 pt-1 text-xs">
                    {modalMatch.matchedSkills.length > 0 && (
                      <div>
                        <span className="font-bold text-emerald-800 flex items-center gap-1 mb-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Matched Qualifications ({modalMatch.matchedSkills.length}):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {modalMatch.matchedSkills.map((s, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[0.72rem] flex items-center gap-1"
                            >
                              <Check className="w-3 h-3 text-emerald-600" /> {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {modalMatch.missingSkills.length > 0 && (
                      <div>
                        <span className="font-bold text-amber-800 flex items-center gap-1 mb-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                          Missing in your profile ({modalMatch.missingSkills.length}):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {modalMatch.missingSkills.map((s, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-[0.72rem] flex items-center gap-1"
                            >
                              <X className="w-3 h-3 text-amber-600" /> {s}
                            </span>
                          ))}
                        </div>
                        <div className="mt-2 p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[0.72rem] text-amber-900 leading-relaxed">
                          💡 <strong>Candidate Tip:</strong> Address <strong>{modalMatch.missingSkills.slice(0, 2).join(', ')}</strong> in your note below to convince the recruiter you can handle these tools!
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            <form onSubmit={handleApply} className="space-y-4">
              {/* Low Requisition Match Advisory Warning */}
              {(() => {
                const match = computeProfileMatch(selectedJob, candidateProfile);
                if (match.skillsScore < 50 || match.jdScore < 50 || match.score < 50) {
                  return (
                    <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/90 text-rose-950 text-xs flex items-start gap-2.5 shadow-2xs">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-[0.72rem] text-rose-800 uppercase tracking-wide">
                            Low Match Warning:
                          </span>
                          <span className="text-[0.65rem] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                            Apply at your own risk
                          </span>
                        </div>
                        <p className="text-[0.72rem] text-rose-700 leading-relaxed font-medium">
                          Your skills have <strong>{match.skillsScore}%</strong> and your profile has <strong>{match.jdScore}%</strong> match to this JD, so you will likely not get shortlisted. You are taking your own risk.
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Note to Hiring Manager (Optional)
                </label>
                <textarea
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#0a66c2] focus:border-transparent transition-all placeholder:text-slate-400 bg-white"
                  rows={4}
                  placeholder="Share a brief note about your experience, campaign ROAS achievements, or availability..."
                  value={coverLetter}
                  onChange={e => setCoverLetter(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setSelectedJob(null); setCoverLetter(''); }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={applying}
                  className="px-5 py-2.5 bg-[#0a66c2] hover:bg-[#084e96] text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 border-none cursor-pointer"
                >
                  {applying ? (
                    'Submitting...'
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" /> Submit Application
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: AI MATCH & PROFILE GAP ANALYSIS POPUP                            */}
      {/* ========================================================================= */}
      {aiModalJob && (() => {
        const aiMatch = computeProfileMatch(aiModalJob, candidateProfile);
        const generatedPitch = generateAiPitch(aiModalJob, aiMatch, candidateProfile);
        const currentProfileSkills = Array.isArray(candidateProfile?.skills)
          ? candidateProfile.skills
          : (typeof candidateProfile?.skills === 'string'
              ? candidateProfile.skills.split(',').map(s => s.trim()).filter(Boolean)
              : []);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl border border-slate-200 p-6 sm:p-7 space-y-5">

              {/* Top Banner & Close */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-extrabold text-[0.65rem] uppercase tracking-wider px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                      <Sparkles className="w-3 h-3" /> AI Match Intelligence
                    </span>
                    <span className="text-[0.68rem] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      Profile vs. Job Analysis
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 leading-snug">
                    {aiModalJob.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {aiModalJob.company?.company_name || 'Hiring Organization'} • {aiModalJob.location} • {aiModalJob.work_mode}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setAiModalJob(null); setCopiedPitch(false); }}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors border-none bg-transparent cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Match Score Hero Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white relative overflow-hidden shadow-md">
                <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                  <div className="flex items-center gap-3.5">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex flex-col items-center justify-center shrink-0 shadow-inner">
                      <span className="text-2xl font-black text-white leading-none">
                        {aiMatch.score}%
                      </span>
                      <span className="text-[0.6rem] font-bold text-indigo-200 uppercase tracking-widest mt-1">
                        Fit Score
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {aiMatch.verdict}
                        </span>
                        <span className="text-[0.68rem] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30">
                          {aiMatch.matchedCount}/{aiMatch.totalSkills || 1} Skills Matched
                        </span>
                      </div>
                      <p className="text-xs text-indigo-200/80 mt-1 max-w-md leading-relaxed">
                        {aiMatch.verdict === 'Skill Gap Detected'
                          ? `Your skills match ${aiMatch.skillsScore}% of requested requirements, while your experience aligns with ${aiMatch.jdScore}% of the Job Description responsibilities.`
                          : (aiMatch.score >= 75
                              ? "Your profile has high alignment with the requisition and Job Description. You are well-positioned for an interview shortlist."
                              : "You have strong transferable background from the JD, and bridging remaining skills will maximize your interview callback rate.")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
                    {/* Skills Match Gauge */}
                    <div className="w-full sm:w-32 bg-white/10 p-2.5 rounded-xl border border-white/10 text-right">
                      <span className="text-[0.62rem] text-emerald-300 block uppercase font-bold">Skills Match</span>
                      <div className="text-base font-black text-white mt-0.5">
                        {aiMatch.skillsScore}%
                      </div>
                      <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="bg-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: `${aiMatch.skillsScore}%` }} />
                      </div>
                      <span className="text-[0.58rem] text-indigo-200 block mt-1">
                        {aiMatch.matchedCount}/{aiMatch.totalSkills || 1} Skills
                      </span>
                    </div>

                    {/* Job JD Match Gauge */}
                    <div className="w-full sm:w-32 bg-white/10 p-2.5 rounded-xl border border-white/10 text-right">
                      <span className="text-[0.62rem] text-sky-300 block uppercase font-bold">Job JD Match</span>
                      <div className="text-base font-black text-white mt-0.5">
                        {aiMatch.jdScore}%
                      </div>
                      <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="bg-sky-400 h-full rounded-full transition-all duration-500" style={{ width: `${aiMatch.jdScore}%` }} />
                      </div>
                      <span className="text-[0.58rem] text-indigo-200 block mt-1">
                        JD Relevance
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skill Gap Detected - Skills vs. Job JD Comparison Section */}
              {aiMatch.verdict === 'Skill Gap Detected' && (
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/90 text-slate-800 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                        <AlertCircle className="w-4 h-4 text-amber-700" />
                      </span>
                      <div>
                        <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide">
                          Skill Gap Detected — Match Breakdown
                        </h4>
                        <p className="text-[0.68rem] text-amber-800 font-medium">
                          Comparing your verified skills vs. the employer's Job Description (JD)
                        </p>
                      </div>
                    </div>
                    <span className="text-[0.68rem] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300/60">
                      Skills vs JD Breakdown
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* 1. Skills Match Bar */}
                    <div className="p-3 bg-white rounded-xl border border-amber-200/70 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700 text-[0.72rem] flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Your Skills Match
                        </span>
                        <span className="font-black text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                          {aiMatch.skillsScore}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-rose-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${aiMatch.skillsScore}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[0.68rem] text-slate-500">
                        <span>Matched: <strong className="text-slate-800">{aiMatch.matchedCount}</strong></span>
                        <span>Total Req: <strong className="text-slate-800">{aiMatch.totalSkills}</strong></span>
                        <span>Missing: <strong className="text-rose-600">{aiMatch.missingCount}</strong></span>
                      </div>
                    </div>

                    {/* 2. Job JD Match Bar */}
                    <div className="p-3 bg-white rounded-xl border border-amber-200/70 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700 text-[0.72rem] flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-indigo-600" /> Job JD (Description) Match
                        </span>
                        <span className="font-black text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          {aiMatch.jdScore}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${aiMatch.jdScore}%` }}
                        />
                      </div>
                      <p className="text-[0.68rem] text-slate-600 font-medium leading-relaxed">
                        {aiMatch.jdScore >= 60
                          ? `Your experience & background align with ${aiMatch.jdScore}% of the JD responsibilities & duties.`
                          : `Your experience shows foundational relevance with ${aiMatch.jdScore}% of the JD criteria.`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Core Breakdown Grid: Skills Requested vs Missing in Profile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                
                {/* 1. What Skills the Job Requests */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[0.68rem]">
                      <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                      Skills Requested by Job ({aiMatch.totalSkills})
                    </span>
                    <span className="text-[0.65rem] text-slate-400 font-medium">Requisition Criteria</span>
                  </div>
                  <div className="space-y-1.5">
                    {(aiModalJob.skills || []).map((req, idx) => {
                      const isFound = aiMatch.matchedSkills.includes(req);
                      return (
                        <div
                          key={idx}
                          className={`p-2 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                            isFound
                              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900 font-semibold'
                              : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            {isFound ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0 ml-1 mr-1" />
                            )}
                            {req}
                          </span>
                          <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded-md ${
                            isFound ? 'bg-emerald-200/60 text-emerald-800' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {isFound ? 'Matched' : 'Missing'}
                          </span>
                        </div>
                      );
                    })}
                    {(!aiModalJob.skills || aiModalJob.skills.length === 0) && (
                      <p className="text-slate-400 italic text-[0.7rem] py-2">
                        No specific skills tagged on this job. Open application.
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. Full Profile Skills Management */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[0.68rem]">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      Your Profile Skills ({currentProfileSkills.length})
                    </span>
                    <span className="text-[0.62rem] text-slate-400 font-medium">
                      Click × to remove
                    </span>
                  </div>

                  {/* Current Skills Badges with Remove (x) */}
                  <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto p-2 bg-white rounded-xl border border-slate-200/80 shadow-inner">
                    {currentProfileSkills.length === 0 ? (
                      <p className="text-slate-400 italic text-[0.7rem] p-2 text-center w-full">
                        No skills listed in your profile.
                      </p>
                    ) : (
                      currentProfileSkills.map((sk, idx) => {
                        const isMatchedWithJob = aiMatch.matchedSkills.some(ms => ms.toLowerCase() === sk.toLowerCase());
                        return (
                          <span
                            key={idx}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[0.7rem] font-semibold border transition-all ${
                              isMatchedWithJob
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/80'
                            }`}
                          >
                            {isMatchedWithJob && <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0" />}
                            <span>{sk}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSkillFromProfile(sk)}
                              disabled={removingSkillName === sk}
                              className="w-3.5 h-3.5 rounded-full hover:bg-rose-100 hover:text-rose-600 text-slate-400 flex items-center justify-center border-none bg-transparent cursor-pointer transition-colors p-0 shrink-0 ml-0.5"
                              title={`Remove ${sk} from your profile`}
                            >
                              {removingSkillName === sk ? (
                                <RefreshCw className="w-2 h-2 animate-spin text-rose-500" />
                              ) : (
                                <X className="w-2.5 h-2.5" />
                              )}
                            </button>
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>

              {/* AI Application Pitch / Recommendation Snippet */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200/70 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-slate-900 text-xs">
                      AI Generated Cover Note Pitch
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedPitch);
                      setCopiedPitch(true);
                      setTimeout(() => setCopiedPitch(false), 2500);
                    }}
                    className="text-[0.7rem] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 cursor-pointer shadow-2xs"
                  >
                    {copiedPitch ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedPitch ? 'Copied Pitch!' : 'Copy Pitch'}</span>
                  </button>
                </div>
                <div className="p-3 bg-white rounded-xl border border-indigo-100 text-slate-700 text-xs leading-relaxed whitespace-pre-line font-medium shadow-inner">
                  {generatedPitch}
                </div>
                <p className="text-[0.68rem] text-slate-400 italic">
                  Tip: Clicking "Apply with this Pitch" will automatically open Easy Apply and insert this note for you.
                </p>
              </div>

              {/* Action Buttons Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => { setAiModalJob(null); setCopiedPitch(false); }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (aiMatch.skillsScore < 50 || aiMatch.jdScore < 50 || aiMatch.score < 50) {
                        setLowMatchPrompt({
                          job: aiModalJob,
                          coverLetter: generatedPitch,
                          skillsScore: aiMatch.skillsScore,
                          jdScore: aiMatch.jdScore,
                          matchedCount: aiMatch.matchedCount,
                          totalSkills: aiMatch.totalSkills
                        });
                        return;
                      }
                      setCoverLetter(generatedPitch);
                      setSelectedJob(aiModalJob);
                      setAiModalJob(null);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 border-none cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Apply with this Pitch</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (aiMatch.skillsScore < 50 || aiMatch.jdScore < 50 || aiMatch.score < 50) {
                        setLowMatchPrompt({
                          job: aiModalJob,
                          coverLetter: '',
                          skillsScore: aiMatch.skillsScore,
                          jdScore: aiMatch.jdScore,
                          matchedCount: aiMatch.matchedCount,
                          totalSkills: aiMatch.totalSkills
                        });
                        return;
                      }
                      handleOpenApply(aiModalJob);
                      setAiModalJob(null);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[#0a66c2] hover:bg-[#084e96] text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 border-none cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Easy Apply</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL 4: PROFESSIONAL LOW MATCH / AT YOUR OWN RISK ADVISORY POPUP         */}
      {/* ========================================================================= */}
      {lowMatchPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200/90 p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200 relative overflow-hidden">
            
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600" />

            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-rose-100 text-rose-800 text-[0.65rem] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md">
                    Low Requisition Match
                  </span>
                  <span className="text-[0.68rem] font-bold text-slate-400">
                    Application Risk Advisory
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 leading-snug">
                  Requisition Fit Advisory
                </h3>
                <p className="text-xs text-slate-500 font-medium truncate">
                  {lowMatchPrompt.job?.title} • {lowMatchPrompt.job?.company?.company_name || 'Hiring Organization'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLowMatchPrompt(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors border-none bg-transparent cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Dual Score Metric Display */}
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
              {/* Skills Match */}
              <div className="p-3 bg-white rounded-xl border border-rose-200/70 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 text-[0.7rem] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Skills Match
                  </span>
                  <span className="font-black text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                    {lowMatchPrompt.skillsScore}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${lowMatchPrompt.skillsScore}%` }}
                  />
                </div>
                <span className="text-[0.62rem] text-slate-500 block">
                  {lowMatchPrompt.matchedCount || 0} of {lowMatchPrompt.totalSkills || 1} required skills in profile
                </span>
              </div>

              {/* JD Match */}
              <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 text-[0.7rem] flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-indigo-600" /> Job JD Fit
                  </span>
                  <span className="font-black text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    {lowMatchPrompt.jdScore}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${lowMatchPrompt.jdScore}%` }}
                  />
                </div>
                <span className="text-[0.62rem] text-slate-500 block">
                  Relevance to Job Description
                </span>
              </div>
            </div>

            {/* Professional Advisory Body */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/90 space-y-2 text-xs text-slate-800">
              <div className="flex items-center gap-1.5 font-bold text-amber-950 text-xs">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Candidate Shortlisting Notice</span>
              </div>
              <p className="text-[0.72rem] leading-relaxed text-amber-900 font-medium">
                Your profile currently holds <strong>{lowMatchPrompt.skillsScore}% skills match</strong> and <strong>{lowMatchPrompt.jdScore}% JD alignment</strong> with this position. Automated recruitment filters and employer hiring algorithms typically reject candidate applications below the 50% requisition fit threshold without recruiter shortlisting.
              </p>
              <div className="pt-1.5 border-t border-amber-200/60 text-[0.7rem] text-amber-950 font-bold flex items-center gap-1">
                <span>⚠️ If you proceed, you are applying at your own risk.</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 pt-2 flex-col sm:flex-row">
              <button
                type="button"
                onClick={() => setLowMatchPrompt(null)}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Cancel & Review Profile</span>
              </button>

              <button
                type="button"
                disabled={applying}
                onClick={() => executeSubmitApplication(lowMatchPrompt.job, lowMatchPrompt.coverLetter)}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white text-xs font-black shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 border-none disabled:opacity-50"
              >
                {applying ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Apply at My Own Risk
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
