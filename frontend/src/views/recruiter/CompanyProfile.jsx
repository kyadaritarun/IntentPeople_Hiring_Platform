import React, { useState, useEffect, useRef } from 'react';
import {
  Building2, Globe, Phone, MapPin, Save, ShieldCheck,
  CheckCircle2, Edit3, Camera, Share2, ExternalLink,
  Users, Plus, Briefcase, X, Eye, TrendingUp, Sparkles,
  ArrowUpRight, Award, Zap, Check, Clock, Layers, ChevronRight,
  Upload, Loader2, RefreshCw, AlertCircle, Trash2, User, Mail
} from 'lucide-react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function CompanyProfile() {
  const { user, refreshUser } = useAuth();
  const comp = user?.profile || {};

  const isStaff = user?.role === 'RECRUITER' || user?.role === 'HIRING_MANAGER';
  const isAdmin = user?.role === 'ADMIN';

  // ── Staff Personal Profile State (for Recruiter & Hiring Manager) ─────────
  const [staffData, setStaffData] = useState({
    name: comp.name || comp.full_name || (user?.email ? user.email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Staff Member'),
    email: user?.email || '',
    phone: comp.phone || '+91 98765 43210',
    place: comp.place || comp.location || 'Hyderabad, Telangana, India',
    role: user?.role === 'RECRUITER' ? 'Recruiter' : (user?.role === 'HIRING_MANAGER' ? 'Hiring Manager' : (comp.role || 'Staff')),
    title: comp.title || (user?.role === 'RECRUITER' ? 'Senior Technical Recruiter' : 'Engineering Hiring Manager'),
    avatar_url: comp.avatar_url || ''
  });

  const [isEditingStaff, setIsEditingStaff] = useState(false);
  const [savingStaff, setSavingStaff] = useState(false);
  const [uploadingStaffPhoto, setUploadingStaffPhoto] = useState(false);
  const staffPhotoInputRef = useRef(null);

  // ── Administrator Organization State ─────────────────────────────────────
  const [formData, setFormData] = useState({
    company_name: comp.company_name || 'Visys Cloud Technologies',
    logo_url: comp.logo_url || '',
    phone: comp.phone || '+91 40 1234 5678',
    website: comp.website || 'https://visyscloud.com',
    industry: comp.industry || 'Digital Marketing, Cloud Media & MarTech Engineering',
    location: comp.location || 'Hitec City, Hyderabad, Telangana, India',
    about: comp.about || 'Visys Cloud Technologies is an industry-leading digital marketing technology firm delivering performance advertising, programmatic media, search optimization, and enterprise growth engineering. We build high-converting funnel architectures and partner with top brands worldwide to accelerate user acquisition and build resilient MarTech stacks.',
    product_service: comp.product_service || 'CloudNest workflow software',
    business_model: comp.business_model || 'Local services',
    growth_stage: comp.growth_stage || 'Scaling',
    target_audience: comp.target_audience || 'Operations leaders at mid-market companies',
    ideal_customer_profile: comp.ideal_customer_profile || 'Companies with 100–500 employees managing complex internal approvals.',
    business_problem: comp.business_problem || 'Lead volume is rising, but qualified pipeline is inconsistent.',
    expected_outcome: comp.expected_outcome || 'Build a repeatable demand programme and improve lead-to-opportunity quality.',
    team_support: comp.team_support || 'Marketing head, content specialist, shared design support',
    monthly_budget_range: comp.monthly_budget_range || '₹8–12 lakh',
    decision_authority: comp.decision_authority || 'Own campaigns and recommend budget allocation',
    success_horizon: comp.success_horizon || 'First 90 days'
  });

  const [activeTab, setActiveTab] = useState('about'); // 'about' | 'team' | 'jobs' | 'stack' | 'culture'
  const [isEditingOrg, setIsEditingOrg] = useState(false);
  const [loading, setLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const logoInputRef = useRef(null);

  useEffect(() => {
    if (user?.profile) {
      // Sync Staff Data
      setStaffData(prev => ({
        ...prev,
        name: user.profile.name || user.profile.full_name || prev.name,
        email: user.email || prev.email,
        phone: user.profile.phone || prev.phone,
        place: user.profile.place || user.profile.location || prev.place,
        role: user.role === 'RECRUITER' ? 'Recruiter' : (user.role === 'HIRING_MANAGER' ? 'Hiring Manager' : (user.profile.role || prev.role)),
        title: user.profile.title || prev.title,
        avatar_url: user.profile.avatar_url || prev.avatar_url
      }));

      // Sync Admin Org Data
      setFormData(prev => ({
        ...prev,
        company_name: user.profile.company_name || prev.company_name,
        logo_url: user.profile.logo_url || prev.logo_url,
        phone: user.profile.phone || prev.phone,
        website: user.profile.website || prev.website,
        industry: user.profile.industry || prev.industry,
        about: user.profile.about || prev.about,
        product_service: user.profile.product_service || prev.product_service || 'CloudNest workflow software',
        business_model: user.profile.business_model || prev.business_model || 'Local services',
        growth_stage: user.profile.growth_stage || prev.growth_stage || 'Scaling',
        target_audience: user.profile.target_audience || prev.target_audience || 'Operations leaders at mid-market companies',
        ideal_customer_profile: user.profile.ideal_customer_profile || prev.ideal_customer_profile || 'Companies with 100–500 employees managing complex internal approvals.',
        business_problem: user.profile.business_problem || prev.business_problem || 'Lead volume is rising, but qualified pipeline is inconsistent.',
        expected_outcome: user.profile.expected_outcome || prev.expected_outcome || 'Build a repeatable demand programme and improve lead-to-opportunity quality.',
        team_support: user.profile.team_support || prev.team_support || 'Marketing head, content specialist, shared design support',
        monthly_budget_range: user.profile.monthly_budget_range || prev.monthly_budget_range || '₹8–12 lakh',
        decision_authority: user.profile.decision_authority || prev.decision_authority || 'Own campaigns and recommend budget allocation',
        success_horizon: user.profile.success_horizon || prev.success_horizon || 'First 90 days'
      }));
    }

    if (isAdmin) {
      loadAdditionalData();
    }
  }, [user, isAdmin]);

  const loadAdditionalData = async () => {
    try {
      const [membersData, jobsData] = await Promise.all([
        api.getTeamMembers().catch(() => []),
        api.getMyJobs().catch(() => [])
      ]);
      setTeamMembers(membersData || []);
      setMyJobs(jobsData || []);
    } catch (err) {
      console.error('Failed to load company supplemental data:', err);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // ── Staff Profile Handlers ────────────────────────────────────────────────
  const handleStaffChange = (e) => {
    setStaffData({ ...staffData, [e.target.name]: e.target.value });
  };

  const handleStaffPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    setUploadingStaffPhoto(true);
    try {
      const res = await api.uploadStaffPhoto(file);
      if (res?.avatar_url) {
        setStaffData(prev => ({ ...prev, avatar_url: res.avatar_url }));
        showToast('✨ Staff profile photo updated successfully!');
        await refreshUser?.();
      }
    } catch (err) {
      showToast(err.message || 'Failed to upload profile photo.');
    } finally {
      setUploadingStaffPhoto(false);
    }
  };

  const handleSaveStaffProfile = async (e) => {
    e.preventDefault();
    setSavingStaff(true);
    try {
      await api.updateStaffProfile({
        name: staffData.name,
        phone: staffData.phone,
        place: staffData.place,
        title: staffData.title
      });
      await refreshUser?.();
      showToast('✨ Profile details updated successfully!');
      setIsEditingStaff(false);
    } catch (err) {
      showToast(`Error: ${err.message || 'Failed to update profile'}`);
    } finally {
      setSavingStaff(false);
    }
  };

  // ── Admin Org Handlers ───────────────────────────────────────────────────
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLogoError('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setLogoError('Logo image size exceeds 5MB limit.');
      return;
    }

    setLogoError('');
    setUploadingLogo(true);

    try {
      const res = await api.uploadCompanyLogo(file);
      if (res?.logo_url) {
        setFormData(prev => ({ ...prev, logo_url: res.logo_url }));
        showToast('✨ Company logo successfully uploaded to AWS S3!');
        await refreshUser?.();
      }
    } catch (err) {
      setLogoError(err.message || 'Failed to upload logo to AWS S3.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.updateCompanyProfile(formData);
      await refreshUser?.();
      showToast('✨ Organization profile updated successfully!');
      setIsEditingOrg(false);
    } catch (err) {
      showToast(`Error: ${err.message || 'Failed to update profile'}`);
    } finally {
      setLoading(false);
    }
  };

  const [savingBusinessContext, setSavingBusinessContext] = useState(false);

  const handleSaveBusinessContext = async (e) => {
    if (e) e.preventDefault();
    setSavingBusinessContext(true);
    try {
      await api.updateCompanyProfile(formData);
      await refreshUser?.();
      showToast('✨ Business context saved successfully!');
    } catch (err) {
      showToast(`Error: ${err.message || 'Failed to update business context'}`);
    } finally {
      setSavingBusinessContext(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    showToast('Link copied to clipboard!');
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. RECRUITER & HIRING MANAGER VIEW: Executive White-Card Profile Dossier
  // ═══════════════════════════════════════════════════════════════════════════
  if (isStaff) {
    return (
      <div
        className="p-4 sm:p-7 max-w-7xl mx-auto space-y-6 bg-[#F7F8FB] min-h-full antialiased text-slate-800 select-text"
        style={{ fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
      >
        {/* ── Top Header Bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
              <span>Workspace</span>
              <span>/</span>
              <span>Team & Members</span>
              <span>/</span>
              <span className="text-slate-600 font-semibold">Staff Profile</span>
            </div>
            <h1 className="text-2xl sm:text-[28px] font-semibold text-slate-900 leading-tight tracking-tight">
              My Profile
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">
              Personal staff credentials, contact details, and hiring workspace access.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleShare}
              className="px-3.5 py-2 rounded-lg border border-slate-200/90 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-500" />
              Share Profile
            </button>
            <button
              type="button"
              onClick={() => setIsEditingStaff(true)}
              className="px-4 py-2 rounded-lg bg-[#FF7043] hover:bg-[#E65B30] text-white text-xs font-semibold transition-all cursor-pointer border-none shadow-[0_1px_2px_rgba(255,112,67,0.3)] flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Profile
            </button>
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

        {/* ── 1. Hero Profile Card (All-White Card with Soft Pastel Header Accent) ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
          {/* Subtle Banner Accent (Clean soft aesthetic, NO harsh black) */}
          <div className="h-28 sm:h-32 bg-gradient-to-r from-slate-100 via-[#EEF2FF] to-[#FFF1F2] border-b border-slate-200/60 relative overflow-hidden">
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="absolute top-3 right-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-xs text-slate-700 border border-slate-200/80 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Active Seat
              </span>
            </div>
          </div>

          {/* Profile Identity Row overlapping the banner */}
          <div className="px-6 sm:px-8 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 -mt-12 sm:-mt-14">
              
              {/* Avatar + Main Details */}
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-5">
                {/* Avatar with Camera Upload */}
                <div className="relative shrink-0 group">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-white shadow-md bg-gradient-to-br from-[#1E293B] to-[#0F172A] text-white font-bold text-3xl sm:text-4xl flex items-center justify-center overflow-hidden">
                    {staffData.avatar_url ? (
                      <img
                        src={staffData.avatar_url}
                        alt={staffData.name}
                        className="w-full h-full object-cover"
                        onError={e => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="w-full h-full flex items-center justify-center text-white font-bold"
                      style={{
                        display: staffData.avatar_url ? 'none' : 'flex'
                      }}
                    >
                      {staffData.name ? staffData.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => staffPhotoInputRef.current?.click()}
                    disabled={uploadingStaffPhoto}
                    title="Change profile picture"
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#FF7043] hover:bg-[#E65B30] text-white flex items-center justify-center shadow-md border-2 border-white transition-all cursor-pointer"
                  >
                    {uploadingStaffPhoto ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Camera className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <input
                    type="file"
                    ref={staffPhotoInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleStaffPhotoUpload}
                  />
                </div>

                {/* Name, Roles & Designation */}
                <div className="space-y-1.5 pb-0.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                      {staffData.name}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        user?.role === 'RECRUITER'
                          ? 'bg-blue-50 text-blue-700 border-blue-200/80'
                          : 'bg-purple-50 text-purple-700 border-purple-200/80'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          user?.role === 'RECRUITER' ? 'bg-blue-600' : 'bg-purple-600'
                        }`}
                      />
                      {staffData.role}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Verified Staff
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-700">
                    {staffData.title}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap pt-0.5">
                    <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {comp.company_name || 'Uptrix Corporation'}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {staffData.place}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {staffData.email}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Profile Actions on Desktop */}
              <div className="flex items-center gap-2 self-start sm:self-end">
                <button
                  type="button"
                  onClick={() => setIsEditingStaff(true)}
                  className="px-4 py-2 rounded-lg border border-slate-200/90 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  Edit Profile
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* ── 2. Structured Dual-Column Dossier ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left 2 Cols: Personal & Contact Information Tiles */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Personal & Contact Dossier</h3>
                  <p className="text-xs text-slate-400">Direct contact channels and corporate profile identifiers</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingStaff(true)}
                className="text-xs font-semibold text-[#FF7043] hover:text-[#E65B30] flex items-center gap-1 border-none bg-transparent cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
            </div>

            {/* Grid of Clean Info Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Full Name */}
              <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center shrink-0 text-slate-600 shadow-2xs">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Full Name</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">{staffData.name}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Primary profile name</p>
                </div>
              </div>

              {/* Official Email */}
              <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center shrink-0 text-emerald-600 shadow-2xs">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Official Email</p>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded-md">Verified</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 font-mono mt-0.5 truncate">{staffData.email}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Workspace domain locked</p>
                </div>
              </div>

              {/* Phone Number */}
              <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center shrink-0 text-slate-600 shadow-2xs">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Phone Number</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{staffData.phone}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Direct hiring line</p>
                </div>
              </div>

              {/* Place / Location */}
              <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center shrink-0 text-slate-600 shadow-2xs">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Work Location</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">{staffData.place}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Timezone / Regional Base</p>
                </div>
              </div>

              {/* Designation Title */}
              <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center shrink-0 text-slate-600 shadow-2xs">
                  <Award className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Designation Title</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">{staffData.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Internal corporate title</p>
                </div>
              </div>

              {/* Platform Role */}
              <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center shrink-0 text-indigo-600 shadow-2xs">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Assigned Platform Role</p>
                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${
                        user?.role === 'RECRUITER'
                          ? 'bg-blue-50 text-blue-700 border-blue-200/80'
                          : 'bg-purple-50 text-purple-700 border-purple-200/80'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          user?.role === 'RECRUITER' ? 'bg-blue-600' : 'bg-purple-600'
                        }`}
                      />
                      {staffData.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Full candidate pipeline authority</p>
                </div>
              </div>

            </div>

            {/* Quick Footer Action strip */}
            <div className="p-3.5 rounded-xl bg-slate-50/60 border border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                All staff credentials verified against workspace registry.
              </span>
              <button
                type="button"
                onClick={() => setIsEditingStaff(true)}
                className="text-xs font-semibold text-[#FF7043] hover:text-[#E65B30] flex items-center gap-1 border-none bg-transparent cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Information
              </button>
            </div>
          </div>

          {/* Right Col: Workspace & Enterprise Privileges */}
          <div className="space-y-6">
            
            {/* Workspace Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-6 space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Workspace Access</h3>
                  <p className="text-xs text-slate-400">Enterprise seat status</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Active Provisioned Seat
                </div>
                <p className="text-[11px] text-emerald-700/90 leading-relaxed">
                  Your account has licensed recruiter privileges on the {comp.company_name || 'Uptrix Corporation'} workspace.
                </p>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Organization</span>
                  <span className="font-bold text-slate-900">{comp.company_name || 'Uptrix Corporation'}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Department</span>
                  <span className="font-bold text-slate-900">Talent Acquisition</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Member ID</span>
                  <span className="font-mono font-bold text-slate-800">UPTX-STAFF-9021</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-400 font-medium">Security</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    2FA Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Recruiter Capabilities Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-6 space-y-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#FF7043]" />
                Authorized Capabilities
              </h4>

              <div className="space-y-2 text-xs">
                {[
                  'Create & publish job requisitions',
                  'Source & filter candidate profiles',
                  'Schedule & conduct interview rounds',
                  'Advance candidate pipeline stages',
                  'Direct messaging & offer rollouts'
                ].map((cap, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-slate-700">
                    <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                    <span className="font-medium text-[11.5px]">{cap}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* ── Edit Staff Profile Modal ── */}
        {isEditingStaff && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in select-text">
            <div className="w-full max-w-lg bg-white rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-200/80 text-slate-800 relative">
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#5C59E8] flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Edit Staff Profile
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Update your personal staff details and contact channels
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingStaff(false)}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer border-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveStaffProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={staffData.name}
                      onChange={handleStaffChange}
                      required
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white placeholder:text-slate-400 focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Designation Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={staffData.title}
                      onChange={handleStaffChange}
                      placeholder="e.g. Senior Tech Recruiter"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white placeholder:text-slate-400 focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Official Email (Fixed by Workspace)
                  </label>
                  <input
                    type="email"
                    value={staffData.email}
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono bg-slate-50 text-slate-400 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Managed and provisioned by your corporate admin</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Phone Number *
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={staffData.phone}
                      onChange={handleStaffChange}
                      required
                      placeholder="e.g. +91 98765 43210"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white placeholder:text-slate-400 focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Place / Location *
                    </label>
                    <input
                      type="text"
                      name="place"
                      value={staffData.place}
                      onChange={handleStaffChange}
                      required
                      placeholder="e.g. Hyderabad, Telangana, India"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white placeholder:text-slate-400 focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditingStaff(false)}
                    className="px-4 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer bg-white"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={savingStaff}
                    className="px-5 py-2.5 rounded-lg bg-[#FF7043] hover:bg-[#E65B30] text-white text-xs font-semibold flex items-center gap-1.5 shadow-[0_1px_2px_rgba(255,112,67,0.3)] transition-all cursor-pointer border-none disabled:opacity-50"
                  >
                    {savingStaff ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Profile</span>
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

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. ADMINISTRATOR VIEW: Organization Profile & About Story
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div
      className="p-4 sm:p-7 max-w-7xl mx-auto space-y-6 bg-[#F7F8FB] min-h-full antialiased text-slate-800 select-text"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
    >
      {/* ── Top Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-semibold text-slate-900 leading-tight tracking-tight flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-indigo-50 text-[#5C59E8] flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </span>
            Company Profile & Branding
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">
            Manage corporate branding, AWS S3 logo assets, employer verification, and business intelligence overview.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="px-3.5 py-2 rounded-lg border border-slate-200/90 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-500" />
            Share Profile
          </button>

          {formData.website && (
            <a
              href={formData.website}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-lg border border-slate-200/90 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex items-center gap-1.5 no-underline cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#5C59E8]" />
              Website
              <ArrowUpRight className="w-3 h-3 text-slate-400" />
            </a>
          )}

          <button
            type="button"
            onClick={() => setIsEditingOrg(true)}
            className="px-4 py-2 rounded-lg bg-[#FF7043] hover:bg-[#E65B30] text-white text-xs font-semibold transition-all cursor-pointer border-none shadow-[0_1px_2px_rgba(255,112,67,0.3)] flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit Profile
          </button>
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

      {/* ── Organization Profile Card ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Logo Avatar with S3 Upload Button */}
            <div className="relative inline-block shrink-0 group">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-slate-200/80 shadow-2xs bg-white text-slate-900 font-bold text-2xl sm:text-3xl flex items-center justify-center overflow-hidden">
                {formData.logo_url ? (
                  <img
                    src={formData.logo_url}
                    alt={formData.company_name}
                    className="w-full h-full object-contain p-2 bg-white"
                    onError={e => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className="w-full h-full flex items-center justify-center bg-slate-900 text-white font-bold"
                  style={{ display: formData.logo_url ? 'none' : 'flex' }}
                >
                  {formData.company_name ? formData.company_name.charAt(0).toUpperCase() : 'C'}
                </div>
              </div>

              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                title="Upload S3 Company Logo"
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-slate-900 text-white hover:bg-slate-800 flex items-center justify-center shadow-md border-2 border-white transition-all cursor-pointer"
              >
                {uploadingLogo ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
              </button>

              <input
                type="file"
                ref={logoInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>

            {/* Name, Industry & Metadata */}
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {formData.company_name}
                </h2>
                <span className="inline-flex items-center gap-1 text-[0.68rem] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-md">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Verified Employer
                </span>
                <span className="inline-flex items-center gap-1 text-[0.68rem] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-md">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  Administrator
                </span>
              </div>

              <p className="text-xs sm:text-sm font-semibold text-slate-600 leading-relaxed">
                {formData.industry}
              </p>

              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap pt-0.5">
                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {formData.location}
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  {teamMembers.length > 0 ? `${teamMembers.length} Staff Members` : '51-200 Employees'}
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {formData.phone}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── In-Page Segmented Tab Switcher ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 shadow-2xs flex-wrap">
          {[
            { id: 'about', label: 'About & Overview', icon: Building2 },
            { id: 'culture', label: 'Culture & Benefits', icon: Sparkles }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border-none cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 bg-transparent font-medium'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#FF7043]' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setIsEditingOrg(true)}
          className="px-3.5 py-1.5 rounded-lg border border-slate-200/90 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all bg-white shadow-2xs flex items-center gap-1.5 cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5 text-slate-500" />
          Edit Organization
        </button>
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="space-y-6">

        {/* ── 1. ABOUT & OVERVIEW TAB ── */}
        {activeTab === 'about' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Story Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FF7043]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    About {formData.company_name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingOrg(true)}
                  className="text-xs font-semibold text-[#FF7043] hover:text-[#E65B30] hover:underline border-none bg-transparent cursor-pointer flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Story
                </button>
              </div>
              <div className="p-6">
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line font-medium">
                  {formData.about}
                </p>
              </div>
            </div>

            {/* ── Business Context (Inline Editable Directly on Page) ── */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-[0_1px_2px_rgba(15,23,42,0.04)] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    Business context
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live editable parameters for target audience, monetization model, and client profile.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSaveBusinessContext}
                  disabled={savingBusinessContext}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#FF7043] hover:bg-[#E65B30] text-white text-xs font-semibold transition-all shadow-[0_1px_2px_rgba(255,112,67,0.3)] cursor-pointer border-none disabled:opacity-50 self-start sm:self-auto"
                >
                  {savingBusinessContext ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-5">
                {/* Row 1: Product / service & Business model */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Product / service
                    </label>
                    <input
                      type="text"
                      name="product_service"
                      value={formData.product_service}
                      onChange={handleChange}
                      placeholder="CloudNest workflow software"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white placeholder:text-slate-400 focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Business model
                    </label>
                    <div className="relative">
                      <select
                        name="business_model"
                        value={formData.business_model}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-semibold text-slate-700 bg-white focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)] appearance-none cursor-pointer pr-10"
                      >
                        <option value="Local services">Local services</option>
                        <option value="B2B SaaS">B2B SaaS</option>
                        <option value="D2C">D2C</option>
                        <option value="Marketplace">Marketplace</option>
                        <option value="Agency">Agency</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 2: Growth stage & Target audience */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Growth stage
                    </label>
                    <div className="relative">
                      <select
                        name="growth_stage"
                        value={formData.growth_stage}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-semibold text-slate-700 bg-white focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)] appearance-none cursor-pointer pr-10"
                      >
                        <option value="Scaling">Scaling</option>
                        <option value="Early stage">Early stage</option>
                        <option value="Growth">Growth</option>
                        <option value="Mature enterprise">Mature enterprise</option>
                        <option value="Seed stage">Seed stage</option>
                        <option value="Series A/B">Series A/B</option>
                        <option value="Bootstrapped">Bootstrapped</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Target audience
                    </label>
                    <input
                      type="text"
                      name="target_audience"
                      value={formData.target_audience}
                      onChange={handleChange}
                      placeholder="Operations leaders at mid-market companies"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white placeholder:text-slate-400 focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)]"
                    />
                  </div>
                </div>

                {/* Row 3: Ideal customer profile */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Ideal customer profile
                  </label>
                  <textarea
                    name="ideal_customer_profile"
                    rows="3"
                    value={formData.ideal_customer_profile}
                    onChange={handleChange}
                    placeholder="Companies with 100–500 employees managing complex internal approvals."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white placeholder:text-slate-400 focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)] resize-y min-h-[85px] leading-relaxed"
                  />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ── CULTURE & BENEFITS TAB ── */}
        {activeTab === 'culture' && (
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-6 space-y-4 animate-in fade-in duration-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FF7043]" />
              Life, Culture & Benefits at {formData.company_name}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70">
                <h4 className="font-bold text-slate-900">🏠 Flexible Hybrid Work Model</h4>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  2 days remote, 3 days collaborative studio work with high autonomy and flexible hours.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70">
                <h4 className="font-bold text-slate-900">🚀 Fast-Track Career Growth</h4>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Bi-annual compensation reviews and clear engineering & marketing advancement ladders.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70">
                <h4 className="font-bold text-slate-900">💡 Learning & Upskilling Budget</h4>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  ₹50,000 annual allowance for certifications, cloud workshops, and technical conferences.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70">
                <h4 className="font-bold text-slate-900">🩺 Comprehensive Health Coverage</h4>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Full medical insurance coverage for employees and direct family dependents.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* EDIT ORGANIZATION PROFILE MODAL (ADMINISTRATOR)                         */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {isEditingOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in select-text">
          <div className="w-full max-w-2xl bg-white rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-200/80 text-slate-800 relative max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#5C59E8] flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Edit Organization Profile & Overview
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Update corporate details, business models, growth stage, and ICP
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditingOrg(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Logo S3 Upload Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Company Brand Logo (Stored on AWS S3)
                </label>
                <div className="flex items-center gap-3 p-3 bg-slate-50/60 rounded-xl border border-slate-200/80">
                  <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                    {formData.logo_url ? (
                      <img
                        src={formData.logo_url}
                        alt="Logo Preview"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <span className="text-base font-bold text-slate-400">
                        {formData.company_name ? formData.company_name.charAt(0).toUpperCase() : 'C'}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs">
                        {uploadingLogo ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Uploading to S3...</span>
                          </>
                        ) : (
                          <>
                            <Camera className="w-3.5 h-3.5" />
                            <span>Upload Logo to S3</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingLogo}
                          onChange={handleLogoUpload}
                        />
                      </label>

                      {formData.logo_url && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition-colors cursor-pointer bg-white"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {logoError && (
                      <p className="text-[0.7rem] text-rose-600 font-bold mt-1">{logoError}</p>
                    )}
                    <p className="text-[0.68rem] text-slate-400 mt-1">
                      High-resolution PNG or SVG with transparent background (Max 5MB)
                    </p>
                  </div>
                </div>
              </div>

              {/* Company Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Company Name *</label>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white placeholder:text-slate-400 focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Official Phone *</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white placeholder:text-slate-400 focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)]"
                  />
                </div>
              </div>

              {/* Website & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Official Website</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://yourcompany.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white placeholder:text-slate-400 focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Headquarters Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="City, State, Country"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white placeholder:text-slate-400 focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)]"
                  />
                </div>
              </div>

              {/* Industry & Specialization */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Industry & Specialization *</label>
                <input
                  type="text"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Digital Marketing, MarTech, Cloud Media"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white placeholder:text-slate-400 focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)]"
                />
              </div>

              {/* About & Mission */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">About Company Story & Mission</label>
                <textarea
                  name="about"
                  rows="3"
                  value={formData.about}
                  onChange={handleChange}
                  placeholder="Describe your company, culture, and core competency..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white placeholder:text-slate-400 focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)] leading-relaxed"
                />
              </div>

              {/* Business Context Fields in Modal */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Business Context
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Product / service</label>
                    <input
                      type="text"
                      name="product_service"
                      value={formData.product_service}
                      onChange={handleChange}
                      placeholder="CloudNest workflow software"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white placeholder:text-slate-400 focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Business model</label>
                    <select
                      name="business_model"
                      value={formData.business_model}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-semibold text-slate-700 bg-white focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)] cursor-pointer"
                    >
                      <option value="Local services">Local services</option>
                      <option value="B2B SaaS">B2B SaaS</option>
                      <option value="D2C">D2C</option>
                      <option value="Marketplace">Marketplace</option>
                      <option value="Agency">Agency</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Growth stage</label>
                    <select
                      name="growth_stage"
                      value={formData.growth_stage}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-semibold text-slate-700 bg-white focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)] cursor-pointer"
                    >
                      <option value="Scaling">Scaling</option>
                      <option value="Early stage">Early stage</option>
                      <option value="Growth">Growth</option>
                      <option value="Mature enterprise">Mature enterprise</option>
                      <option value="Seed stage">Seed stage</option>
                      <option value="Series A/B">Series A/B</option>
                      <option value="Bootstrapped">Bootstrapped</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Target audience</label>
                    <input
                      type="text"
                      name="target_audience"
                      value={formData.target_audience}
                      onChange={handleChange}
                      placeholder="Operations leaders at mid-market companies"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white placeholder:text-slate-400 focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ideal customer profile</label>
                  <textarea
                    name="ideal_customer_profile"
                    rows="2"
                    value={formData.ideal_customer_profile}
                    onChange={handleChange}
                    placeholder="Companies with 100–500 employees managing complex internal approvals."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white placeholder:text-slate-400 focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)] leading-relaxed"
                  />
                </div>
              </div>

              {/* Hiring Need Fields in Modal */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Hiring Need
                </h4>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Business problem</label>
                  <textarea
                    name="business_problem"
                    rows="2"
                    value={formData.business_problem}
                    onChange={handleChange}
                    placeholder="Lead volume is rising, but qualified pipeline is inconsistent."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white placeholder:text-slate-400 focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)] leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Expected outcome</label>
                  <textarea
                    name="expected_outcome"
                    rows="2"
                    value={formData.expected_outcome}
                    onChange={handleChange}
                    placeholder="Build a repeatable demand programme and improve lead-to-opportunity quality."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white placeholder:text-slate-400 focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)] leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Team support</label>
                    <input
                      type="text"
                      name="team_support"
                      value={formData.team_support}
                      onChange={handleChange}
                      placeholder="Marketing head, content specialist, shared design support"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white placeholder:text-slate-400 focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Monthly budget range</label>
                    <input
                      type="text"
                      name="monthly_budget_range"
                      value={formData.monthly_budget_range}
                      onChange={handleChange}
                      placeholder="₹8–12 lakh"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white placeholder:text-slate-400 focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Decision authority</label>
                    <input
                      type="text"
                      name="decision_authority"
                      value={formData.decision_authority}
                      onChange={handleChange}
                      placeholder="Own campaigns and recommend budget allocation"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white placeholder:text-slate-400 focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Success horizon</label>
                    <input
                      type="text"
                      name="success_horizon"
                      value={formData.success_horizon}
                      onChange={handleChange}
                      placeholder="First 90 days"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white placeholder:text-slate-400 focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)]"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingOrg(false)}
                  className="px-4 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer bg-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading || uploadingLogo}
                  className="px-5 py-2.5 rounded-lg bg-[#FF7043] hover:bg-[#E65B30] text-white text-xs font-semibold flex items-center gap-1.5 shadow-[0_1px_2px_rgba(255,112,67,0.3)] transition-all cursor-pointer border-none disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Organization</span>
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

