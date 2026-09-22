import React, { useState, useEffect } from 'react';
import { 
  User, FileText, Upload, Save, CheckCircle2, Globe, MapPin, 
  Phone, Briefcase, GraduationCap, Eye, TrendingUp, Search, 
  Edit3, Plus, ExternalLink, ShieldCheck, Camera, Share2, 
  Sparkles, Building2, X, Check, Download, Award, Zap, 
  Code2, Rocket, Mail, ChevronRight, Calendar, Layers, Clock, ArrowUpRight, Trash2
} from 'lucide-react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function CandidateProfile({ onNavigateTab } = {}) {
  const { user, refreshUser } = useAuth();
  const candidate = user?.profile || {};

  const [formData, setFormData] = useState({
    full_name: candidate.full_name || user?.full_name || '',
    phone: candidate.phone || '',
    place: candidate.place || '',
    city: candidate.city || '',
    state: candidate.state || '',
    title: candidate.title || '',
    summary: candidate.summary || '',
    skills: Array.isArray(candidate.skills)
      ? candidate.skills.join(', ')
      : (typeof candidate.skills === 'string' ? candidate.skills : ''),
    expertise: Array.isArray(candidate.expertise)
      ? candidate.expertise.join(', ')
      : (typeof candidate.expertise === 'string' ? candidate.expertise : ''),
    portfolio_url: candidate.portfolio_url || ''
  });

  const [avatarUrl, setAvatarUrl] = useState(candidate.avatar_url || '');

  // Cleanup any legacy localhost / localStorage cache keys so database is the single source of truth
  useEffect(() => {
    [
      'uptrix_candidate_experiences',
      'uptrix_candidate_educations',
      'uptrix_candidate_certifications',
      'uptrix_candidate_preferences',
      'uptrix_candidate_resume'
    ].forEach(k => {
      try { localStorage.removeItem(k); } catch (e) {}
    });
  }, []);

  useEffect(() => {
    if (user) {
      const c = user.profile || {};
      setFormData({
        full_name: c.full_name || user.full_name || '',
        phone: c.phone || '',
        place: c.place || '',
        city: c.city || '',
        state: c.state || '',
        title: c.title || '',
        summary: c.summary || '',
        skills: Array.isArray(c.skills)
          ? c.skills.join(', ')
          : (typeof c.skills === 'string' ? c.skills : ''),
        expertise: Array.isArray(c.expertise)
          ? c.expertise.join(', ')
          : (typeof c.expertise === 'string' ? c.expertise : ''),
        portfolio_url: c.portfolio_url || ''
      });
      if (c.avatar_url) setAvatarUrl(c.avatar_url);
      setExperiences(Array.isArray(c.experience) ? c.experience : []);
      setEducations(Array.isArray(c.education) ? c.education : []);
      setCertifications(Array.isArray(c.certifications) ? c.certifications : []);
      const hp = c.hiring_preferences || {};
      setPreferences({
        availability: hp.availability || '',
        work_setup: hp.work_mode || hp.work_setup || '',
        target_role: hp.job_type || hp.target_role || '',
        preferred_city: hp.preferred_location || hp.preferred_city || '',
        expected_ctc: hp.desired_salary || hp.expected_ctc || ''
      });
      if (c.resume_url && !isDummyResume(c.resume_filename, c.resume_url)) {
        setResumeData({
          url: c.resume_url,
          filename: c.resume_filename || 'Candidate_Resume.pdf',
          size: 'PDF Document',
          uploaded_at: 'Saved'
        });
      } else {
        setResumeData(null);
      }
    }
  }, [user]);

  // Helper to identify dummy or simulated resumes
  const isDummyResume = (name, url) => {
    if (!name && !url) return true;
    const n = (name || '').toLowerCase();
    const u = (url || '').toLowerCase();
    return (
      n.includes('sarah_jenkins') ||
      n.includes('official_cv') ||
      n.includes('official_resume') ||
      n.includes('digital_marketing_resume') ||
      u.includes('sarah_jenkins') ||
      u.includes('official_cv') ||
      u.includes('digital_marketing_resume')
    );
  };

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'experience' | 'skills' | 'education'
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);

  // Dedicated Bio / Executive Summary Modal State
  const [showBioModal, setShowBioModal] = useState(false);
  const [bioSummary, setBioSummary] = useState('');
  const [savingBio, setSavingBio] = useState(false);

  // Dedicated Skills & Tech Stack Modal State
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [editSkillsList, setEditSkillsList] = useState([]);
  const [newSkillText, setNewSkillText] = useState('');
  const [editExpertiseText, setEditExpertiseText] = useState('');
  const [savingSkills, setSavingSkills] = useState(false);

  // Resume State (Direct DB Ground-truth)
  const [resumeData, setResumeData] = useState(() => {
    if (candidate.resume_url && !isDummyResume(candidate.resume_filename, candidate.resume_url)) {
      return {
        url: candidate.resume_url,
        filename: candidate.resume_filename || 'Candidate_Resume.pdf',
        size: 'PDF Document',
        uploaded_at: 'Saved'
      };
    }
    return null;
  });

  // Experience & Impact Dynamic State (Direct DB Ground-truth)
  const [experiences, setExperiences] = useState(() => {
    return Array.isArray(candidate.experience) ? candidate.experience : [];
  });

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRoleIndex, setEditingRoleIndex] = useState(null);
  const [savingRole, setSavingRole] = useState(false);
  const [roleForm, setRoleForm] = useState({
    title: '',
    company: '',
    company_logo: '',
    location: '',
    employment_type: 'Full-time',
    duration: '',
    description: '',
    technologies: ''
  });

  const handleOpenAddRole = () => {
    setEditingRoleIndex(null);
    setRoleForm({
      title: '',
      company: '',
      company_logo: '',
      location: '',
      employment_type: 'Full-time',
      duration: '',
      description: '',
      technologies: ''
    });
    setShowRoleModal(true);
  };

  const handleOpenEditRole = (index) => {
    setEditingRoleIndex(index);
    const role = experiences[index];
    setRoleForm({
      title: role.title || '',
      company: role.company || '',
      company_logo: role.company_logo || '',
      location: role.location || '',
      employment_type: role.employment_type || 'Full-time',
      duration: role.duration || '',
      description: Array.isArray(role.description) ? role.description.map(d => `• ${d}`).join('\n') : (role.description || ''),
      technologies: Array.isArray(role.technologies) ? role.technologies.join(', ') : (role.technologies || '')
    });
    setShowRoleModal(true);
  };

  const handleDeleteRole = async (index) => {
    if (!window.confirm('Are you sure you want to remove this role from your timeline?')) return;
    const updated = experiences.filter((_, i) => i !== index);
    try {
      await api.updateCandidateProfile({ experience: updated });
      setExperiences(updated);
      await refreshUser();
    } catch (e) {
      alert('Failed to remove role from database: ' + (e.message || 'Error occurred'));
    }
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!roleForm.title.trim() || !roleForm.company.trim()) {
      alert('Please provide at least a Job Title and Company Name');
      return;
    }

    setSavingRole(true);
    const descArray = roleForm.description
      .split('\n')
      .map(line => line.trim().replace(/^[•\-\*]\s*/, ''))
      .filter(Boolean);

    const techArray = roleForm.technologies
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const roleData = {
      id: editingRoleIndex !== null ? experiences[editingRoleIndex].id || Date.now() : Date.now(),
      title: roleForm.title.trim(),
      company: roleForm.company.trim(),
      company_logo: roleForm.company_logo?.trim() || '',
      location: roleForm.location.trim() || 'Remote',
      employment_type: roleForm.employment_type || 'Full-time',
      duration: roleForm.duration.trim() || 'Present',
      description: descArray.length > 0 ? descArray : [roleForm.description.trim()],
      technologies: techArray
    };

    let updatedList;
    if (editingRoleIndex !== null) {
      updatedList = [...experiences];
      updatedList[editingRoleIndex] = roleData;
    } else {
      updatedList = [roleData, ...experiences];
    }

    try {
      await api.updateCandidateProfile({ experience: updatedList });
      setExperiences(updatedList);
      await refreshUser();
      setShowRoleModal(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save role to database: ' + (err.message || 'Error occurred'));
    } finally {
      setSavingRole(false);
    }
  };

  // Education & Qualifications Dynamic State (Direct DB Ground-truth)
  const [educations, setEducations] = useState(() => {
    return Array.isArray(candidate.education) ? candidate.education : [];
  });

  const [certifications, setCertifications] = useState(() => {
    return Array.isArray(candidate.certifications) ? candidate.certifications : [];
  });

  // Education Modal State
  const [showEduModal, setShowEduModal] = useState(false);
  const [editingEduIndex, setEditingEduIndex] = useState(null);
  const [savingEdu, setSavingEdu] = useState(false);
  const [eduForm, setEduForm] = useState({
    degree: '',
    institution: '',
    duration: '',
    grade: '',
    description: ''
  });

  // Certification Modal State
  const [showCertModal, setShowCertModal] = useState(false);
  const [editingCertIndex, setEditingCertIndex] = useState(null);
  const [savingCert, setSavingCert] = useState(false);
  const [certForm, setCertForm] = useState({
    name: '',
    issuer: '',
    year: '',
    url: ''
  });

  const handleOpenAddEducation = () => {
    setEditingEduIndex(null);
    setEduForm({
      degree: '',
      institution: '',
      duration: '',
      grade: '',
      description: ''
    });
    setShowEduModal(true);
  };

  const handleOpenEditEducation = (index) => {
    setEditingEduIndex(index);
    const edu = educations[index];
    setEduForm({
      degree: edu.degree || '',
      institution: edu.institution || '',
      duration: edu.duration || '',
      grade: edu.grade || '',
      description: edu.description || ''
    });
    setShowEduModal(true);
  };

  const handleDeleteEducation = async (index) => {
    if (!window.confirm('Are you sure you want to remove this academic qualification?')) return;
    const updated = educations.filter((_, i) => i !== index);
    try {
      await api.updateCandidateProfile({ education: updated });
      setEducations(updated);
      await refreshUser();
    } catch (e) {
      alert('Failed to remove qualification from database: ' + (e.message || 'Error occurred'));
    }
  };

  const handleSaveEducation = async (e) => {
    e.preventDefault();
    if (!eduForm.degree.trim() || !eduForm.institution.trim()) {
      alert('Please provide at least a Degree / Qualification name and University / College');
      return;
    }

    setSavingEdu(true);
    const eduData = {
      id: editingEduIndex !== null ? educations[editingEduIndex].id || Date.now() : Date.now(),
      degree: eduForm.degree.trim(),
      institution: eduForm.institution.trim(),
      duration: eduForm.duration.trim() || '2018 - 2022',
      grade: eduForm.grade.trim() || '',
      description: eduForm.description.trim() || ''
    };

    let updatedList;
    if (editingEduIndex !== null) {
      updatedList = [...educations];
      updatedList[editingEduIndex] = eduData;
    } else {
      updatedList = [eduData, ...educations];
    }

    try {
      await api.updateCandidateProfile({ education: updatedList });
      setEducations(updatedList);
      await refreshUser();
      setShowEduModal(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save qualification to database: ' + (err.message || 'Error occurred'));
    } finally {
      setSavingEdu(false);
    }
  };

  const handleOpenAddCert = () => {
    setEditingCertIndex(null);
    setCertForm({
      name: '',
      issuer: '',
      year: '',
      url: ''
    });
    setShowCertModal(true);
  };

  const handleOpenEditCert = (index) => {
    setEditingCertIndex(index);
    const cert = certifications[index];
    setCertForm({
      name: cert.name || '',
      issuer: cert.issuer || '',
      year: cert.year || '',
      url: cert.url || ''
    });
    setShowCertModal(true);
  };

  const handleDeleteCert = async (index) => {
    if (!window.confirm('Are you sure you want to remove this certification?')) return;
    const updated = certifications.filter((_, i) => i !== index);
    try {
      await api.updateCandidateProfile({ certifications: updated });
      setCertifications(updated);
      await refreshUser();
    } catch (err) {
      alert('Failed to remove certification from database: ' + (err.message || 'Error occurred'));
    }
  };

  const handleSaveCert = async (e) => {
    e.preventDefault();
    if (!certForm.name.trim() || !certForm.issuer.trim()) {
      alert('Please provide at least Certification Name and Issuing Organization');
      return;
    }

    setSavingCert(true);
    const certData = {
      id: editingCertIndex !== null ? certifications[editingCertIndex].id || Date.now() : Date.now(),
      name: certForm.name.trim(),
      issuer: certForm.issuer.trim(),
      year: certForm.year.trim() || '2024',
      url: certForm.url.trim() || ''
    };

    let updatedList;
    if (editingCertIndex !== null) {
      updatedList = [...certifications];
      updatedList[editingCertIndex] = certData;
    } else {
      updatedList = [certData, ...certifications];
    }

    try {
      await api.updateCandidateProfile({ certifications: updatedList });
      setCertifications(updatedList);
      await refreshUser();
      setShowCertModal(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save certification to database: ' + (err.message || 'Error occurred'));
    } finally {
      setSavingCert(false);
    }
  };

  // Hiring Preferences State & Handlers (Direct DB Ground-truth)
  const [preferences, setPreferences] = useState(() => {
    const hp = candidate.hiring_preferences || {};
    return {
      availability: hp.availability || '',
      work_setup: hp.work_mode || hp.work_setup || '',
      target_role: hp.job_type || hp.target_role || '',
      preferred_city: hp.preferred_location || hp.preferred_city || '',
      expected_ctc: hp.desired_salary || hp.expected_ctc || ''
    };
  });

  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [prefForm, setPrefForm] = useState({
    availability: '',
    work_setup: '',
    target_role: '',
    preferred_city: '',
    expected_ctc: ''
  });

  const handleOpenPreferences = () => {
    setPrefForm({
      availability: preferences.availability || '',
      work_setup: preferences.work_setup || '',
      target_role: preferences.target_role || '',
      preferred_city: preferences.preferred_city || '',
      expected_ctc: preferences.expected_ctc || ''
    });
    setShowPreferencesModal(true);
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setSavingPreferences(true);

    const hiringPrefs = {
      work_mode: prefForm.work_setup || '',
      work_setup: prefForm.work_setup || '',
      availability: prefForm.availability || '',
      desired_salary: prefForm.expected_ctc || '',
      expected_ctc: prefForm.expected_ctc || '',
      preferred_location: prefForm.preferred_city || '',
      preferred_city: prefForm.preferred_city || '',
      job_type: prefForm.target_role || '',
      target_role: prefForm.target_role || '',
      relocation: 'Open'
    };

    try {
      await api.updateCandidateProfile({ hiring_preferences: hiringPrefs });
      setPreferences(prefForm);
      await refreshUser();
      setShowPreferencesModal(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save preferences to database: ' + (err.message || 'Error occurred'));
    } finally {
      setSavingPreferences(false);
    }
  };

  // Dedicated Bio & Executive Summary Handlers
  const handleOpenEditBio = () => {
    setBioSummary(formData.summary || '');
    setShowBioModal(true);
  };

  const handleSaveBio = async (e) => {
    e.preventDefault();
    setSavingBio(true);
    try {
      await api.updateCandidateProfile({ summary: bioSummary });
      setFormData(prev => ({ ...prev, summary: bioSummary }));
      await refreshUser();
      setShowBioModal(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save bio to database: ' + (err.message || 'Error occurred'));
    } finally {
      setSavingBio(false);
    }
  };

  // Dedicated Skills & Tech Stack Handlers
  const handleOpenSkillsModal = () => {
    const currentSkills = formData.skills
      ? formData.skills.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    setEditSkillsList(currentSkills);
    setNewSkillText('');
    setEditExpertiseText(formData.expertise || '');
    setShowSkillsModal(true);
  };

  const handleAddSkillChip = () => {
    const trimmed = newSkillText.trim();
    if (!trimmed) return;
    if (!editSkillsList.includes(trimmed)) {
      setEditSkillsList(prev => [...prev, trimmed]);
    }
    setNewSkillText('');
  };

  const handleRemoveSkillChip = (skillToRemove) => {
    setEditSkillsList(prev => prev.filter(s => s !== skillToRemove));
  };

  const handleSaveSkillsToDb = async (e) => {
    if (e) e.preventDefault();
    setSavingSkills(true);
    try {
      const expertiseArray = editExpertiseText
        ? editExpertiseText.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      await api.updateCandidateProfile({
        skills: editSkillsList,
        expertise: expertiseArray
      });
      setFormData(prev => ({
        ...prev,
        skills: editSkillsList.join(', '),
        expertise: editExpertiseText
      }));
      await refreshUser();
      setShowSkillsModal(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save skills to database: ' + (err.message || 'Error occurred'));
    } finally {
      setSavingSkills(false);
    }
  };

  // Endorsements counter state for interactive feel
  const [endorsedSkills, setEndorsedSkills] = useState({
    'React.js': 34,
    'Node.js': 28,
    'SEO Strategy': 22,
    'Meta Ads': 19,
    'Performance Marketing': 27,
    'TailwindCSS': 31,
    'REST APIs': 25
  });

  const handleEndorse = (skillName) => {
    setEndorsedSkills(prev => ({
      ...prev,
      [skillName]: (prev[skillName] || 15) + 1
    }));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Calculate Dynamic Profile Strength based on 4 Core Sections:
  // 1. Overview & Bio (Max 30%)
  // 2. Experience & Impact (Max 25%)
  // 3. Skills & Tech Stack (Max 25%)
  // 4. Education & Credentials (Max 20%)
  const calculateProfileStrength = () => {
    let score = 0;
    const checks = {
      overview: false,
      experience: false,
      skills: false,
      education: false
    };

    // 1. Overview & Bio (Max 30%)
    if (formData.full_name?.trim() && formData.title?.trim()) score += 10;
    if (formData.summary && formData.summary.trim().length > 30) score += 10;
    if (formData.city?.trim() || formData.portfolio_url?.trim() || candidate.resume_url) score += 10;
    if (score >= 20) checks.overview = true;

    // 2. Experience & Impact (Max 25%)
    if (experiences && experiences.length > 0) {
      score += 15;
      if (experiences.length > 1 || (experiences[0]?.description && (Array.isArray(experiences[0].description) ? experiences[0].description.length > 0 : experiences[0].description.trim().length > 0))) {
        score += 10;
      }
      checks.experience = true;
    }

    // 3. Skills & Tech Stack (Max 25%)
    const validSkills = formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
    if (validSkills.length >= 3) {
      score += 15;
      if (validSkills.length >= 6) {
        score += 10;
      }
      checks.skills = true;
    } else if (validSkills.length > 0) {
      score += 10;
    }

    // 4. Education & Credentials (Max 20%)
    if (educations && educations.length > 0) {
      score += 10;
      checks.education = true;
    }
    if (certifications && certifications.length > 0) {
      score += 10;
      checks.education = true;
    }

    const finalScore = Math.min(100, Math.max(score, 10));

    let tier = 'Beginner';
    let tierColor = 'text-amber-700 bg-amber-50 border border-amber-200/60';
    let barColor = 'bg-amber-500';

    if (finalScore >= 85) {
      tier = 'Elite';
      tierColor = 'text-emerald-700 bg-emerald-50 border border-emerald-200/60';
      barColor = 'bg-emerald-500';
    } else if (finalScore >= 65) {
      tier = 'Strong';
      tierColor = 'text-teal-700 bg-teal-50 border border-teal-200/60';
      barColor = 'bg-teal-500';
    } else if (finalScore >= 40) {
      tier = 'Intermediate';
      tierColor = 'text-blue-700 bg-blue-50 border border-blue-200/60';
      barColor = 'bg-blue-500';
    }

    return {
      score: finalScore,
      tier,
      tierColor,
      barColor,
      checks
    };
  };

  const profileStrength = calculateProfileStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const skillsArray = formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
      const expertiseArray = formData.expertise ? formData.expertise.split(',').map(s => s.trim()).filter(Boolean) : [];
      await api.updateCandidateProfile({
        ...formData,
        skills: skillsArray,
        expertise: expertiseArray
      });
      await refreshUser();
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPhotoFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert('Photo file size must be less than 8MB');
      return;
    }
    setUploadingPhoto(true);
    try {
      const res = await api.uploadCandidatePhoto(file);
      if (res?.avatar_url) {
        setAvatarUrl(res.avatar_url);
      }
      await refreshUser();
      alert('Profile photo uploaded and saved to AWS S3 (image/) successfully!');
    } catch (err) {
      alert(err.message || 'Failed to upload profile photo');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleUploadResumeFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      alert('Resume file size must be less than 15MB');
      return;
    }
    setUploadingResume(true);
    try {
      const res = await api.uploadResume(file);
      const newResume = {
        url: res?.resume_url || `/uploads/resume/${file.name}`,
        filename: res?.filename || file.name,
        size: `${Math.round(file.size / 1024)} KB`,
        uploaded_at: 'Just now'
      };
      setResumeData(newResume);
      await refreshUser();
      alert('Resume uploaded and saved to AWS S3 (resume/) successfully!');
    } catch (err) {
      alert(err.message || 'Failed to upload resume');
    } finally {
      setUploadingResume(false);
      e.target.value = '';
    }
  };

  const handleRemoveResume = async () => {
    if (!window.confirm('Are you sure you want to remove your attached resume?')) return;
    try {
      await api.updateCandidateProfile({ resume_url: null, resume_filename: null });
      setResumeData(null);
      await refreshUser();
    } catch (e) {
      alert('Failed to remove resume from database: ' + (e.message || 'Error occurred'));
    }
  };

  const handleShareProfile = () => {
    navigator.clipboard?.writeText(window.location.href);
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 3000);
  };

  const skillsList = (typeof formData.skills === 'string' ? formData.skills : (Array.isArray(formData.skills) ? formData.skills.join(', ') : '')).split(',').map(s => s.trim()).filter(Boolean);
  const expertiseList = (typeof formData.expertise === 'string' ? formData.expertise : (Array.isArray(formData.expertise) ? formData.expertise.join(', ') : '')).split(',').map(s => s.trim()).filter(Boolean);

  return (
    <div className="bg-[#F0F2F5] min-h-screen pb-16 pt-4 text-slate-800 font-sans selection:bg-[#F2A93B] selection:text-[#1E3155]">
      
      {/* Toast Notification */}
      {showShareToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-medium border border-slate-700 animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Profile link copied to clipboard!</span>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Success Alert */}
        {success && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl p-4 mb-5 text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
              Your Uptrix profile was updated successfully and changes are live!
            </span>
            <button type="button" onClick={() => setSuccess(false)} className="text-emerald-700 hover:text-emerald-900 border-none bg-transparent cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 1. HERO IDENTITY CARD (Executive Studio Perfection)                       */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] p-6 sm:p-8 mb-6 relative overflow-hidden">
          
          {/* Subtle Top Brand Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#1E3155] via-[#2a4070] to-[#F2A93B]" />

          {/* Main Identity Flex: Avatar + Details + Actions */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pt-1">
            
            {/* Left Block: Avatar + Name + Headline + Metadata */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6 flex-1 min-w-0">
              
              {/* Avatar with Camera Overlay */}
              <div className="relative inline-block shrink-0 group">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-xl bg-gradient-to-br from-[#1E3155] to-[#2d4a7a] text-white font-black text-3xl sm:text-4xl flex items-center justify-center ring-2 ring-[#F2A93B]/40 overflow-hidden relative transition-transform group-hover:scale-[1.02]">
                  {avatarUrl || candidate.avatar_url ? (
                    <img 
                      src={avatarUrl || candidate.avatar_url} 
                      alt={formData.full_name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    formData.full_name ? formData.full_name.charAt(0).toUpperCase() : (user?.full_name ? user.full_name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'U'))
                  )}
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-xs text-white font-bold">
                      Uploading...
                    </div>
                  )}
                </div>

                {/* Camera icon button */}
                <label 
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#1E3155] hover:bg-[#152340] text-[#F2A93B] flex items-center justify-center border-2 border-white shadow-md cursor-pointer transition-all hover:scale-110 active:scale-95"
                  title="Upload profile photo (Saved to AWS S3)"
                >
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingPhoto}
                    onChange={handleUploadPhotoFile}
                  />
                </label>
              </div>

              {/* Identity & Headline Text Column */}
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {formData.full_name || user?.full_name || 'Your Name'}
                  </h1>
                  <span className="inline-flex items-center gap-1.5 text-[0.7rem] font-bold text-[#1E3155] bg-[#F2A93B]/15 border border-[#F2A93B]/30 px-2.5 py-0.5 rounded-full shadow-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#F2A93B]" /> Verified Talent
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    (he/him)
                  </span>
                </div>

                <p className="text-sm sm:text-base font-semibold text-slate-700 leading-snug">
                  {formData.title || 'Digital Marketing & Technology Professional'}
                </p>

                {/* Meta Chips: Location, Contact Details, Portfolio */}
                <div className="flex items-center gap-3 sm:gap-4 text-xs text-slate-500 flex-wrap pt-0.5">
                  <span className="flex items-center gap-1 text-slate-600 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-[#F2A93B]" />
                    {(formData.city || formData.state) ? `${formData.city ? formData.city + ', ' : ''}${formData.state ? formData.state + ', ' : ''}India` : 'Hyderabad, India'}
                  </span>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => setShowContactInfo(true)}
                    className="text-[#1E3155] hover:text-[#F2A93B] font-semibold hover:underline flex items-center gap-1 border-none bg-transparent cursor-pointer p-0 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    Contact Details
                  </button>
                  {formData.portfolio_url && (
                    <>
                      <span className="text-slate-300">•</span>
                      <a
                        href={formData.portfolio_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-600 hover:text-slate-900 flex items-center gap-1 hover:underline font-medium"
                      >
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        Portfolio
                        <ArrowUpRight className="w-3 h-3 text-slate-400" />
                      </a>
                    </>
                  )}
                </div>
              </div>

            </div>

            {/* Right Block: Action Buttons Cluster */}
            <div className="flex items-center gap-2.5 flex-wrap lg:self-start shrink-0 pt-2 lg:pt-0">
              <button
                type="button"
                onClick={handleShareProfile}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                title="Share profile link"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Share</span>
              </button>

              {resumeData && (
                <button
                  type="button"
                  onClick={() => setShowResumeModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  View CV
                </button>
              )}

              <label className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>{uploadingResume ? 'Uploading...' : (resumeData ? 'Replace CV' : 'Upload CV')}</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  disabled={uploadingResume}
                  onChange={handleUploadResumeFile}
                />
              </label>

              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2.5 rounded-xl bg-[#1E3155] hover:bg-[#152340] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-[#1E3155]/20 transition-all cursor-pointer active:scale-95"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#F2A93B]" />
                <span>Edit Profile</span>
              </button>
            </div>

          </div>

          {/* Quick Preference Tags & Highlights Bar */}
          <div className="flex items-center gap-2.5 mt-5 pt-4 border-t border-slate-100 flex-wrap">
            <span className="text-[0.68rem] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
              Preferences:
            </span>
            {preferences.work_setup ? (
              <span className="text-xs font-semibold bg-slate-100/80 text-slate-700 border border-slate-200/60 px-3 py-1 rounded-xl">
                {preferences.work_setup}
              </span>
            ) : (
              <span className="text-xs font-medium bg-slate-50 text-slate-500 border border-slate-200/50 px-2.5 py-1 rounded-xl">
                Work Mode: Open to Remote / Hybrid
              </span>
            )}
            {preferences.availability ? (
              <span className="text-xs font-semibold bg-[#F2A93B]/10 text-[#1E3155] border border-[#F2A93B]/25 px-3 py-1 rounded-xl flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#F2A93B]" /> Notice Period: {preferences.availability}
              </span>
            ) : (
              <span className="text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-xl flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Immediate / Available
              </span>
            )}
            {preferences.target_role ? (
              <span className="text-xs font-semibold bg-indigo-50/80 text-indigo-800 border border-indigo-200/60 px-3 py-1 rounded-xl">
                Target: {preferences.target_role}
              </span>
            ) : null}
            {preferences.expected_ctc ? (
              <span className="text-xs font-semibold bg-amber-50/80 text-amber-800 border border-amber-200/60 px-3 py-1 rounded-xl">
                CTC: {preferences.expected_ctc}
              </span>
            ) : null}
          </div>

        </div>

        {/* ========================================================================= */}
        {/* 2. PERFORMANCE METRIC HUD (4 Sleek Studio Cards)                           */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
          
          {/* Metric 1: Profile Strength (Dynamic based on 4 Core Sections) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs relative overflow-hidden group hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Profile Strength</span>
              <span className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600">
                <Zap className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">{profileStrength.score}%</span>
              <span className={`text-[0.7rem] font-bold px-2 py-0.5 rounded-md ${profileStrength.tierColor}`}>
                {profileStrength.tier}
              </span>
            </div>
            {/* Dynamic Progress line */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div 
                className={`${profileStrength.barColor} h-full rounded-full transition-all duration-500`}
                style={{ width: `${profileStrength.score}%` }}
              />
            </div>
            <p className="text-[0.68rem] text-slate-400 mt-1.5">Calculated across profile sections</p>
          </div>

          {/* Metric 2: Recruiter Views */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs relative overflow-hidden group hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Recruiter Views</span>
              <span className="p-1.5 rounded-xl bg-blue-50 text-blue-600">
                <Eye className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">324</span>
              <span className="text-[0.7rem] font-semibold text-emerald-600 flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" /> +28%
              </span>
            </div>
            <p className="text-[0.68rem] text-slate-400 mt-1.5">Last 30 days discovery</p>
          </div>

          {/* Metric 3: Search Matches */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs relative overflow-hidden group hover:border-indigo-300 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Search Appearances</span>
              <span className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600">
                <Search className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">68</span>
              <span className="text-[0.7rem] font-semibold text-indigo-600">Queries</span>
            </div>
            <p className="text-[0.68rem] text-slate-400 mt-1.5">Keywords: React, Node, MarTech</p>
          </div>

          {/* Metric 4: Direct Inquiries */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs relative overflow-hidden group hover:border-teal-300 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Recruiter Inquiries</span>
              <span className="p-1.5 rounded-xl bg-teal-50 text-teal-600">
                <Rocket className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">12</span>
              <span className="text-[0.7rem] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">Active</span>
            </div>
            <p className="text-[0.68rem] text-slate-400 mt-1.5">4 interviews scheduled</p>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* 3. MAIN SECTION: TABBED CONTENT & RIGHT SIDEBAR                           */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Content Area (8 Cols) */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* Navigation Tabs Bar */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-1.5 shadow-xs flex items-center gap-1 overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview & Bio', icon: User },
                { id: 'experience', label: 'Experience & Impact', icon: Briefcase },
                { id: 'skills', label: 'Skills & Tech Stack', icon: Code2 },
                { id: 'education', label: 'Education & Credentials', icon: GraduationCap }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer border-none ${
                      isActive 
                        ? 'bg-[#1E3155] text-white shadow-sm' 
                        : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#F2A93B]' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                
                {/* About & Executive Bio */}
                <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#F2A93B]" />
                      Executive Summary & Background
                    </h2>
                    <button
                      type="button"
                      onClick={handleOpenEditBio}
                      className="text-xs text-[#1E3155] hover:text-[#F2A93B] font-semibold flex items-center gap-1 border-none bg-transparent cursor-pointer transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Bio
                    </button>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {formData.summary || 'No executive summary added yet. Click "Edit Profile" above to introduce yourself and describe your professional journey.'}
                  </p>
                </div>

                {/* Featured Resume & Document Card */}
                <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      Attached Resume & Credentials
                    </h2>
                    {resumeData ? (
                      <span className="text-[0.7rem] font-bold uppercase tracking-wider text-[#1E3155] bg-[#F2A93B]/10 px-2 py-0.5 rounded-full border border-[#F2A93B]/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#F2A93B]" /> Resume Attached
                      </span>
                    ) : (
                      <span className="text-[0.7rem] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                        Not Attached
                      </span>
                    )}
                  </div>

                  {resumeData ? (
                    <div className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0 shadow-xs">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                            {resumeData.filename}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            PDF • {resumeData.size || 'Document'} • Updated {resumeData.uploaded_at || 'Recently'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => setShowResumeModal(true)}
                          className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          Preview
                        </button>
                        <label className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                          <Upload className="w-3.5 h-3.5 text-slate-500" />
                          <span>{uploadingResume ? 'Uploading...' : 'Replace'}</span>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            className="hidden"
                            disabled={uploadingResume}
                            onChange={handleUploadResumeFile}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={handleRemoveResume}
                          className="p-2 rounded-xl border border-slate-200 hover:bg-red-50 hover:border-red-200 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Remove resume"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-700">
                            No Resume Attached
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Upload your official resume PDF or CV to showcase your credentials to recruiters.
                          </p>
                        </div>
                      </div>

                      <label className="px-4 py-2.5 rounded-xl bg-[#1E3155] hover:bg-[#152340] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingResume ? 'Uploading...' : 'Upload Resume PDF'}</span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                          disabled={uploadingResume}
                          onChange={handleUploadResumeFile}
                        />
                      </label>
                    </div>
                  )}

                  {/* Connected Credentials summary */}
                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-[#F2A93B]" />
                      Linked Credentials: <strong className="text-slate-800">{certifications.length} Industry Certification{certifications.length === 1 ? '' : 's'}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('education')}
                      className="text-[#1E3155] hover:underline font-semibold bg-transparent border-none p-0 cursor-pointer text-xs transition-colors"
                    >
                      Manage in Credentials &gt;
                    </button>
                  </div>
                </div>

                {/* Highlighted Portfolio Work (Rendered only if candidate provided a portfolio) */}
                {formData.portfolio_url && (
                  <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Rocket className="w-4 h-4 text-emerald-600" />
                        Featured Portfolio & Work
                      </h2>
                    </div>
                    <div className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/70 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#F2A93B]/10 text-[#1E3155] flex items-center justify-center">
                          <Globe className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">Online Portfolio / Showcase</div>
                          <a 
                            href={formData.portfolio_url.startsWith('http') ? formData.portfolio_url : `https://${formData.portfolio_url}`}
                            target="_blank" 
                            rel="noreferrer"
                            className="text-xs text-[#1E3155] hover:underline flex items-center gap-1 font-medium mt-0.5 hover:text-[#F2A93B] transition-colors"
                          >
                            {formData.portfolio_url} <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* TAB 2: EXPERIENCE & IMPACT */}
            {activeTab === 'experience' && (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-emerald-600" />
                      Professional Experience & Impact Timeline
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Verified track record across high-growth engineering & marketing teams</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAddRole}
                    className="px-3.5 py-2 rounded-xl bg-[#1E3155] hover:bg-[#152340] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-[#1E3155]/20 transition-all cursor-pointer border-none"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Role</span>
                  </button>
                </div>

                {/* Timeline Items */}
                {experiences.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#F2A93B]/10 text-[#1E3155] flex items-center justify-center mx-auto">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">No Experience Roles Added Yet</h3>
                      <p className="text-xs text-slate-500 mt-1">Showcase your past accomplishments, companies, and tech stack.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenAddRole}
                      className="px-4 py-2 rounded-xl bg-[#1E3155] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer border-none shadow-sm hover:bg-[#152340] transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Add Your First Role
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-slate-200">
                    {experiences.map((exp, idx) => {
                      const companyInitial = exp.company ? exp.company.charAt(0).toUpperCase() : 'C';
                      const isCurrent = exp.duration && exp.duration.toLowerCase().includes('present');
                      return (
                        <div key={exp.id || idx} className="relative flex items-start gap-4 group">
                          {/* Company Avatar Badge with Logo Support */}
                          <div className={`w-10 h-10 rounded-2xl text-white font-bold flex items-center justify-center text-sm ring-4 ring-white shrink-0 z-10 shadow-sm overflow-hidden ${
                            exp.company_logo ? 'bg-white border border-slate-200 p-1' : (idx % 2 === 0 ? 'bg-indigo-600' : 'bg-slate-800')
                          }`}>
                            {exp.company_logo ? (
                              <img 
                                src={exp.company_logo} 
                                alt={exp.company} 
                                className="w-full h-full object-contain rounded-xl"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }} 
                              />
                            ) : (
                              companyInitial
                            )}
                          </div>

                          {/* Role Card */}
                          <div className="flex-1 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-all relative">
                            
                            {/* Card Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                              <h3 className="text-sm font-bold text-slate-900">
                                {exp.title}
                              </h3>
                              
                              <div className="flex items-center gap-2 self-start sm:self-auto">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                                  isCurrent
                                    ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                                    : 'text-slate-600 bg-slate-100 border border-slate-200'
                                }`}>
                                  {exp.duration} • {exp.employment_type || 'Full-time'}
                                </span>

                                {/* Edit and Delete Quick Actions */}
                                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditRole(idx)}
                                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors border-none bg-transparent cursor-pointer"
                                    title="Edit role"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRole(idx)}
                                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors border-none bg-transparent cursor-pointer"
                                    title="Remove role"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Company & Location */}
                            <div className="text-xs font-semibold text-indigo-600 mb-2.5">
                              {exp.company} • {exp.location}
                            </div>

                            {/* Description Bullets */}
                            {Array.isArray(exp.description) ? (
                              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside leading-relaxed mb-3">
                                {exp.description.map((item, itemIdx) => (
                                  <li key={itemIdx}>{item}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                                {exp.description}
                              </p>
                            )}

                            {/* Technology Chips */}
                            {Array.isArray(exp.technologies) && exp.technologies.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {exp.technologies.map((tech, techIdx) => (
                                  <span key={techIdx} className="text-[0.68rem] font-medium bg-white text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                                    {tech}
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
            )}

            {/* TAB 3: SKILLS & TECH STACK */}
            {activeTab === 'skills' && (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-[#F2A93B]" />
                      Core Tech Stack & Verified Skills
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Core technical proficiencies, frameworks, and growth tools</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenSkillsModal}
                    className="p-2 px-3 rounded-xl bg-[#1E3155] hover:bg-[#152340] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer border-none shadow-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Manage Skills & Tech Stack</span>
                  </button>
                </div>

                {/* Skills Display (Clean tags) */}
                {skillsList.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500 w-full">
                    No skills added yet. Click <span className="font-semibold text-[#1E3155] cursor-pointer hover:underline" onClick={handleOpenSkillsModal}>Manage Skills & Tech Stack</span> above to showcase your technologies and proficiencies.
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {skillsList.map(skill => (
                      <div 
                        key={skill}
                        className="px-4 py-2.5 rounded-2xl border border-slate-200/90 bg-slate-50/70 hover:bg-white hover:border-[#F2A93B]/40 hover:shadow-xs transition-all flex items-center gap-2.5 group"
                      >
                        <span className="w-2 h-2 rounded-full bg-[#F2A93B] group-hover:scale-125 transition-transform" />
                        <span className="text-xs font-bold text-slate-800 group-hover:text-[#1E3155] transition-colors">
                          {skill}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Candidate Core Expertise (Dynamic from database) */}
                {expertiseList.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-slate-100">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#00a884]" />
                      <span>Candidate Core Expertise & Competencies</span>
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {expertiseList.map((exp, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-[#00a884] text-xs font-bold"
                        >
                          <span>★</span>
                          <span>{exp}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* TAB 4: EDUCATION & CREDENTIALS */}
            {activeTab === 'education' && (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-[#F2A93B]" />
                      Academic Qualifications & Certifications
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Verified educational history and recognized industry accreditations</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAddEducation}
                    className="px-3.5 py-2 rounded-xl bg-[#1E3155] hover:bg-[#152340] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-[#1E3155]/20 transition-all cursor-pointer border-none"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Qualification</span>
                  </button>
                </div>

                {/* Academic Qualifications List */}
                {educations.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#F2A93B]/10 text-[#1E3155] flex items-center justify-center mx-auto">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">No Academic Qualifications Added Yet</h3>
                      <p className="text-xs text-slate-500 mt-1">Add your degrees, universities, graduation years, and academic distinctions.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenAddEducation}
                      className="px-4 py-2 rounded-xl bg-[#1E3155] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer border-none shadow-sm hover:bg-[#152340] transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Add Academic Degree
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {educations.map((edu, idx) => (
                      <div 
                        key={edu.id || idx}
                        className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 transition-all group relative"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-[#1E3155] text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-sm">
                          <GraduationCap className="w-6 h-6 text-[#F2A93B]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                            <h3 className="text-sm font-bold text-slate-900 leading-snug">
                              {edu.degree}
                            </h3>
                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity self-start sm:self-auto">
                              <button
                                type="button"
                                onClick={() => handleOpenEditEducation(idx)}
                                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors border-none bg-transparent cursor-pointer"
                                title="Edit qualification"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteEducation(idx)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors border-none bg-transparent cursor-pointer"
                                title="Delete qualification"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs font-semibold text-[#1E3155] mt-0.5">
                            {edu.institution}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {edu.duration}{edu.grade ? ` • ${edu.grade}` : ''}
                          </p>
                          {edu.description && (
                            <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
                              {edu.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Certifications Section */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Verified Industry Certifications
                    </span>
                    <button
                      type="button"
                      onClick={handleOpenAddCert}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer border-none transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 text-slate-500" />
                      <span>Add Certification</span>
                    </button>
                  </div>
                  
                  {certifications.length === 0 ? (
                    <div className="p-6 text-center rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-500">
                      No certifications listed. Add certifications like Meta Blueprint, Google Skillshop, AWS, etc.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {certifications.map((cert, idx) => (
                        <div 
                          key={cert.id || idx}
                          className="p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs transition-all flex items-center justify-between gap-3 group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center shrink-0">
                              <Award className="w-4.5 h-4.5 text-amber-600 shrink-0" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-slate-900 block truncate">
                                {cert.name}
                              </span>
                              <p className="text-[0.68rem] text-slate-400 truncate">
                                {cert.issuer} • Issued {cert.year}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                            {cert.url && (
                              <a
                                href={cert.url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                                title="View certificate credential"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenEditCert(idx)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors border-none bg-transparent cursor-pointer"
                              title="Edit certification"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCert(idx)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors border-none bg-transparent cursor-pointer"
                              title="Delete certification"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>

          {/* ========================================================================= */}
          {/* RIGHT SIDEBAR: CANDIDATE PREFERENCES & HIRING INTELLIGENCE (4 Cols)       */}
          {/* ========================================================================= */}
          <aside className="lg:col-span-4 space-y-5">
            
            {/* Card 1: Hiring Intelligence & Job Search Readiness */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Hiring Preferences
                </span>
                <span className="w-2 h-2 rounded-full bg-[#F2A93B] animate-pulse" />
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Availability</span>
                  {preferences.availability ? (
                    <span className="font-bold text-[#1E3155] bg-[#F2A93B]/10 px-2 py-0.5 rounded-md">
                      {preferences.availability}
                    </span>
                  ) : (
                    <span className="text-slate-400 font-normal italic">Not specified</span>
                  )}
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Work Setup</span>
                  <span className={preferences.work_setup ? "font-semibold text-slate-800" : "text-slate-400 font-normal italic"}>
                    {preferences.work_setup || 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Target Role</span>
                  <span className={preferences.target_role ? "font-semibold text-slate-800" : "text-slate-400 font-normal italic"}>
                    {preferences.target_role || 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Preferred City</span>
                  <span className={preferences.preferred_city ? "font-semibold text-slate-800" : "text-slate-400 font-normal italic"}>
                    {preferences.preferred_city || 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Expected CTC</span>
                  <span className={preferences.expected_ctc ? "font-bold text-slate-900" : "text-slate-400 font-normal italic"}>
                    {preferences.expected_ctc || 'Not specified'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenPreferences}
                className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                Update Preferences
              </button>
            </div>

            {/* Card 2: AI Job Match Score */}
            <div className="bg-gradient-to-br from-[#1E3155] to-[#2a4070] rounded-3xl p-5 sm:p-6 text-white shadow-xs relative overflow-hidden">
              <div className="relative z-10 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#F2A93B]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#F2A93B]/80">
                    Uptrix Match Score
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">94%</span>
                  <span className="text-xs text-[#F2A93B]/80 font-medium">Top Match in Hyderabad</span>
                </div>
                <p className="text-xs text-white/70 leading-relaxed">
                  Your profile matches 94% of digital marketing & full stack engineer openings currently posted by verified recruiters.
                </p>
                <div className="pt-1">
                  <a
                    href="#jobs"
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.hash = 'job_search';
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#F2A93B] hover:text-white transition-colors"
                  >
                    View 28 Matching Openings <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Card 3: Profile Verification Badges */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Verified Credentials
              </span>

              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5 text-xs">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${user?.email ? 'bg-[#F2A93B]/10 text-[#1E3155]' : 'bg-slate-100 text-slate-400'}`}>
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-slate-700 font-medium">
                    {user?.email ? 'Email Verified' : 'Email Pending'}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 text-xs">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${resumeData ? 'bg-[#F2A93B]/10 text-[#1E3155]' : 'bg-slate-100 text-slate-400'}`}>
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-slate-700 font-medium">
                    {resumeData ? 'ATS PDF Resume Attached' : 'No Resume Attached'}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 text-xs">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${certifications.length > 0 ? 'bg-[#F2A93B]/10 text-[#1E3155]' : 'bg-slate-100 text-slate-400'}`}>
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-slate-700 font-medium">
                    {certifications.length > 0 ? `${certifications.length} Industry Certificate${certifications.length > 1 ? 's' : ''}` : 'No Certificates Linked'}
                  </span>
                </div>
              </div>
            </div>

          </aside>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL: EDIT PROFILE FORM                                               */}
      {/* ========================================================================= */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shadow-2xl border border-slate-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#F2A93B]/10 text-[#1E3155] flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Edit Uptrix Profile</h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsEditing(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 border-none bg-transparent cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#F2A93B] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#F2A93B] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Headline / Role Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Full Stack Developer & MarTech Specialist"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#F2A93B] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Hyderabad"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#F2A93B] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="Telangana"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#F2A93B] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Portfolio or GitHub URL</label>
                <input
                  type="url"
                  name="portfolio_url"
                  value={formData.portfolio_url}
                  onChange={handleChange}
                  placeholder="https://github.com/yourhandle"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#F2A93B] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Executive Summary / About</label>
                <textarea
                  name="summary"
                  rows="4"
                  value={formData.summary}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#F2A93B] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Skills (Comma-separated)</label>
                <input
                  type="text"
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  placeholder="React.js, Node.js, TailwindCSS, SEO, Meta Ads"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#F2A93B] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Candidate Core Expertise (Comma-separated)</label>
                <input
                  type="text"
                  name="expertise"
                  value={formData.expertise || ''}
                  onChange={handleChange}
                  placeholder="Full Stack Web Development, RESTful API Engineering, Database Management"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#F2A93B] outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-[#1E3155] hover:bg-[#152340] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-[#1E3155]/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {loading ? 'Saving Changes...' : 'Save Profile'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: CONTACT INFO VIEW                                               */}
      {/* ========================================================================= */}
      {showContactInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#F2A93B]" />
                Contact Information
              </h3>
              <button 
                type="button"
                onClick={() => setShowContactInfo(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 border-none bg-transparent cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[0.68rem] text-slate-400 uppercase font-bold">Email Address</span>
                <p className="font-semibold text-slate-900 mt-0.5">{user?.email || 'Not provided'}</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[0.68rem] text-slate-400 uppercase font-bold">Phone</span>
                <p className="font-semibold text-slate-900 mt-0.5">{formData.phone}</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[0.68rem] text-slate-400 uppercase font-bold">Location</span>
                <p className="font-semibold text-slate-900 mt-0.5">{formData.city ? `${formData.city}, ${formData.state}, India` : `${formData.state}, India`}</p>
              </div>

              {formData.portfolio_url && (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[0.68rem] text-slate-400 uppercase font-bold">Portfolio & Code</span>
                  <p className="font-semibold text-[#1E3155] mt-0.5 truncate">{formData.portfolio_url}</p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowContactInfo(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer border-none mt-2"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: RESUME PREVIEW                                                  */}
      {/* ========================================================================= */}
      {showResumeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#F2A93B]" />
                <h3 className="text-sm font-bold text-slate-900">
                  {formData.full_name}_Official_Resume.pdf
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowResumeModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 border-none bg-transparent cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">{formData.full_name}</h4>
                <p className="text-xs text-slate-500 mt-1">{formData.title}</p>
                <p className="text-[0.72rem] text-slate-400 mt-0.5">
                  Verified ATS Format • Ready for Recruiter Evaluation
                </p>
              </div>

              <div className="text-left bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
                <p className="font-semibold text-slate-900">Summary Snapshot:</p>
                <p>{formData.summary}</p>
                <p className="font-semibold text-slate-900 pt-1">Core Tech:</p>
                <p>{formData.skills}</p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const downloadUrl = resumeData?.url || candidate.resume_url;
                    if (downloadUrl) {
                      window.open(downloadUrl, '_blank');
                    } else {
                      alert('No resume PDF attached yet');
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#1E3155] hover:bg-[#152340] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-[#1E3155]/20 cursor-pointer border-none"
                >
                  <Download className="w-3.5 h-3.5" /> Download / Open PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowResumeModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL: ADD / EDIT EXPERIENCE ROLE                                      */}
      {/* ========================================================================= */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shadow-2xl border border-slate-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#F2A93B]/10 text-[#1E3155] flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingRoleIndex !== null ? 'Edit Experience Role' : 'Add Experience Role'}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowRoleModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 border-none bg-transparent cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveRole} className="p-6 space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Job Title / Position <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Frontend Developer"
                  value={roleForm.title}
                  onChange={(e) => setRoleForm({ ...roleForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#F2A93B] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Uptrix "
                    value={roleForm.company}
                    onChange={(e) => setRoleForm({ ...roleForm, company: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#F2A93B] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Employment Type</label>
                  <select
                    value={roleForm.employment_type}
                    onChange={(e) => setRoleForm({ ...roleForm, employment_type: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#F2A93B] outline-none bg-white"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                </div>
              </div>

              {/* Company Logo Upload & URL Section */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Company Logo (Upload Image or Paste URL)
                  </label>
                  {roleForm.company_logo && (
                    <button
                      type="button"
                      onClick={() => setRoleForm({ ...roleForm, company_logo: '' })}
                      className="text-[0.68rem] text-red-500 hover:text-red-700 font-semibold border-none bg-transparent cursor-pointer p-0"
                    >
                      Remove Logo
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Logo Preview Box */}
                  <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                    {roleForm.company_logo ? (
                      <img 
                        src={roleForm.company_logo} 
                        alt="Company logo preview" 
                        className="w-full h-full object-contain p-1"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }} 
                      />
                    ) : (
                      <span className="text-sm font-bold text-slate-400">
                        {roleForm.company ? roleForm.company.charAt(0).toUpperCase() : <Building2 className="w-5 h-5 text-slate-300" />}
                      </span>
                    )}
                  </div>

                  {/* Upload File Button + URL Input */}
                  <div className="flex-1 flex items-center gap-2">
                    <label className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors shrink-0">
                      <Camera className="w-3.5 h-3.5 text-slate-500" />
                      <span>Upload Logo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 2 * 1024 * 1024) {
                              alert('Logo image should be under 2MB');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = () => {
                              setRoleForm(prev => ({ ...prev, company_logo: reader.result }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>

                    <input
                      type="url"
                      placeholder="or paste logo URL (https://...)"
                      value={roleForm.company_logo || ''}
                      onChange={(e) => setRoleForm({ ...roleForm, company_logo: e.target.value })}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#F2A93B] outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. India (Hybrid) or Remote"
                    value={roleForm.location}
                    onChange={(e) => setRoleForm({ ...roleForm, location: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#F2A93B] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Duration / Date Range</label>
                  <input
                    type="text"
                    placeholder="e.g. Jan 2024 - Present or Jun 2022 - Dec 2023"
                    value={roleForm.duration}
                    onChange={(e) => setRoleForm({ ...roleForm, duration: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#F2A93B] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Key Responsibilities & Impact (One bullet per line)
                </label>
                <textarea
                  rows="4"
                  placeholder="• Architected core web platforms and user acquisition funnels.&#10;• Optimized application response times and increased conversion metrics.&#10;• Collaborated with cross-functional product and growth teams."
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <span className="text-[0.68rem] text-slate-400">
                  Tip: Press Enter for each new bullet point you want to appear in your timeline.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Technologies & Tools Used (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="React.js, Node.js, TailwindCSS, REST APIs, Meta Ads"
                  value={roleForm.technologies}
                  onChange={(e) => setRoleForm({ ...roleForm, technologies: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRole}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingRole ? 'Saving Role...' : (editingRoleIndex !== null ? 'Update Role' : 'Save Role')}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: ADD / EDIT ACADEMIC QUALIFICATION                                */}
      {/* ========================================================================= */}
      {showEduModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingEduIndex !== null ? 'Edit Academic Qualification' : 'Add Academic Qualification'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEduModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 border-none bg-transparent cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEducation} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Degree / Course Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bachelor of Technology (B.Tech) in Computer Science"
                  value={eduForm.degree}
                  onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  University / College / Institution <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jawaharlal Nehru Technological University (JNTU)"
                  value={eduForm.institution}
                  onChange={(e) => setEduForm({ ...eduForm, institution: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Duration / Years Attended
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2018 - 2022"
                    value={eduForm.duration}
                    onChange={(e) => setEduForm({ ...eduForm, duration: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Grade / GPA / Division
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. First Class with Distinction (8.4 CGPA)"
                    value={eduForm.grade}
                    onChange={(e) => setEduForm({ ...eduForm, grade: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Specialization, Major or Relevant Coursework
                </label>
                <textarea
                  rows="3"
                  placeholder="e.g. Specialized in Web Engineering, Distributed Systems, Database Management, and Algorithm Optimization."
                  value={eduForm.description}
                  onChange={(e) => setEduForm({ ...eduForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEduModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdu}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingEdu ? 'Saving...' : (editingEduIndex !== null ? 'Update Qualification' : 'Save Qualification')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: ADD / EDIT CERTIFICATION                                         */}
      {/* ========================================================================= */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingCertIndex !== null ? 'Edit Certification' : 'Add Certification'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCertModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 border-none bg-transparent cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCert} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Certification Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Meta Certified Digital Marketing Associate"
                  value={certForm.name}
                  onChange={(e) => setCertForm({ ...certForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Issuing Organization <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Meta Blueprint, Google"
                    value={certForm.issuer}
                    onChange={(e) => setCertForm({ ...certForm, issuer: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Issue Year
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2024"
                    value={certForm.year}
                    onChange={(e) => setCertForm({ ...certForm, year: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Credential URL / Verification Link (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://www.credential.net/..."
                  value={certForm.url}
                  onChange={(e) => setCertForm({ ...certForm, url: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCertModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCert}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingCert ? 'Saving...' : (editingCertIndex !== null ? 'Update Certification' : 'Save Certification')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: EDIT HIRING PREFERENCES                                          */}
      {/* ========================================================================= */}
      {showPreferencesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Update Hiring Preferences</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPreferencesModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 border-none bg-transparent cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePreferences} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Availability / Notice Period
                </label>
                <select
                  value={prefForm.availability}
                  onChange={(e) => setPrefForm({ ...prefForm, availability: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                >
                  <option value="">Select Notice Period / Availability</option>
                  <option value="Immediate (Available Now)">Immediate (Available Now)</option>
                  <option value="Immediate / 15 Days">Immediate / 15 Days</option>
                  <option value="1 Month Notice">1 Month Notice</option>
                  <option value="2 Months Notice">2 Months Notice</option>
                  <option value="3 Months Notice">3 Months Notice</option>
                  <option value="Serving Notice Period">Serving Notice Period</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Work Setup Preference
                </label>
                <select
                  value={prefForm.work_setup}
                  onChange={(e) => setPrefForm({ ...prefForm, work_setup: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                >
                  <option value="">Select Work Setup</option>
                  <option value="Remote / Hybrid / On-site">Remote / Hybrid / On-site (Flexible)</option>
                  <option value="Remote Only">Remote Only</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="On-site Only">On-site Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Role / Position
                </label>
                <input
                  type="text"
                  placeholder="e.g. Full Stack / Growth Eng, Frontend Developer"
                  value={prefForm.target_role}
                  onChange={(e) => setPrefForm({ ...prefForm, target_role: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Preferred Cities / Locations
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hyderabad, Bengaluru, Remote"
                  value={prefForm.preferred_city}
                  onChange={(e) => setPrefForm({ ...prefForm, preferred_city: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Expected Compensation (CTC)
                </label>
                <input
                  type="text"
                  placeholder="e.g. ₹12.0 - 18.0 LPA"
                  value={prefForm.expected_ctc}
                  onChange={(e) => setPrefForm({ ...prefForm, expected_ctc: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPreferencesModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPreferences}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingPreferences ? 'Saving to Database...' : 'Save Preferences to Database'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 8: EDIT EXECUTIVE SUMMARY & BIO                                     */}
      {/* ========================================================================= */}
      {showBioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#F2A93B]/10 text-[#1E3155] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#F2A93B]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Executive Summary & Bio</h3>
                  <p className="text-[0.68rem] text-slate-400">Directly persisted to PostgreSQL candidate database</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBioModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 border-none bg-transparent cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBio} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Professional Bio / Executive Background <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows="6"
                  required
                  placeholder="Introduce yourself, your key achievements, strengths, growth areas, and the value you bring to prospective teams..."
                  value={bioSummary}
                  onChange={(e) => setBioSummary(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#F2A93B] outline-none leading-relaxed"
                />
                <div className="flex items-center justify-between mt-1 text-[0.68rem] text-slate-400">
                  <span>Aim for 40-150 words for optimal recruiter engagement</span>
                  <span>{bioSummary.length} characters</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBioModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBio}
                  className="px-5 py-2.5 rounded-xl bg-[#1E3155] hover:bg-[#152340] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-[#1E3155]/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingBio ? 'Saving to Database...' : 'Save Bio to Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 9: MANAGE SKILLS & TECH STACK                                       */}
      {/* ========================================================================= */}
      {showSkillsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#F2A93B]/10 text-[#1E3155] flex items-center justify-center">
                  <Code2 className="w-4 h-4 text-[#F2A93B]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Manage Skills & Tech Stack</h3>
                  <p className="text-[0.68rem] text-slate-400">Directly persisted to PostgreSQL candidate database</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSkillsModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 border-none bg-transparent cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSkillsToDb} className="p-6 space-y-5">
              {/* Add Single Skill Input Bar */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Add New Skill Tag
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Docker, TypeScript, GA4, PostgreSQL, Next.js..."
                    value={newSkillText}
                    onChange={(e) => setNewSkillText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkillChip();
                      }
                    }}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#F2A93B] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkillChip}
                    className="px-4 py-2.5 rounded-xl bg-[#1E3155] hover:bg-[#152340] text-white text-xs font-semibold cursor-pointer border-none shadow-xs transition-colors shrink-0"
                  >
                    Add Skill
                  </button>
                </div>
                <span className="text-[0.68rem] text-slate-400 mt-1 block">
                  Tip: Type a technology and press Enter or click "Add Skill".
                </span>
              </div>

              {/* Active Skill Tags Cloud */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Active Skills ({editSkillsList.length})
                  </label>
                  {editSkillsList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setEditSkillsList([])}
                      className="text-[0.68rem] text-red-500 hover:text-red-700 font-semibold border-none bg-transparent cursor-pointer p-0"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {editSkillsList.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center text-xs text-slate-400">
                    No skills in list. Add skills using the input above.
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap p-3 rounded-2xl bg-slate-50 border border-slate-200/80 max-h-48 overflow-y-auto">
                    {editSkillsList.map(skill => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 shadow-xs group"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F2A93B]" />
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkillChip(skill)}
                          className="w-4 h-4 rounded-full hover:bg-red-50 hover:text-red-600 text-slate-400 flex items-center justify-center border-none bg-transparent cursor-pointer transition-colors ml-0.5"
                          title={`Remove ${skill}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Core Expertise / Specialization Domains */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Core Expertise & Tech Domains (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Full Stack Engineering, RESTful API Design, Cloud DevOps, MarTech Systems"
                  value={editExpertiseText}
                  onChange={(e) => setEditExpertiseText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#F2A93B] outline-none"
                />
                <span className="text-[0.68rem] text-slate-400 mt-1 block">
                  High-level focus domains to highlight on your profile and ATS candidate card.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSkillsModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSkills}
                  className="px-5 py-2.5 rounded-xl bg-[#1E3155] hover:bg-[#152340] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-[#1E3155]/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingSkills ? 'Saving to Database...' : 'Save Skills to Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
