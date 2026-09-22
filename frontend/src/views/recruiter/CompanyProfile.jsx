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
  // 1. RECRUITER & HIRING MANAGER VIEW: "show only there profile like name
  //    email phone number place role like that only"
  // ═══════════════════════════════════════════════════════════════════════════
  if (isStaff) {
    return (
      <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6 select-text text-slate-800">
        
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-teal-50 text-[#00a884] flex items-center justify-center font-bold">
                <User className="w-4 h-4" />
              </span>
              My Profile
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Personal staff credentials, direct contact details, and platform role.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditingStaff(true)}
              className="px-4 py-2 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer border-none shadow-xs flex items-center gap-1.5"
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

        {/* ── Focused Staff Profile Card (Only Name, Email, Phone, Place, Role) ── */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
          
          {/* Card Banner / Header Strip */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 sm:p-8 text-white relative">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              
              {/* Avatar with Camera upload */}
              <div className="relative inline-block shrink-0 group">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-white/20 shadow-md bg-white text-slate-900 font-black text-2xl sm:text-3xl flex items-center justify-center overflow-hidden">
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
                    className="w-full h-full flex items-center justify-center text-white font-black"
                    style={{
                      background: user?.role === 'RECRUITER' ? '#2C4470' : '#7C5CBF',
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
                  title="Upload profile photo"
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white text-slate-900 hover:bg-slate-100 flex items-center justify-center shadow-md border-2 border-slate-900 transition-all cursor-pointer"
                >
                  {uploadingStaffPhoto ? (
                    <Loader2 className="w-3 h-3 animate-spin text-slate-900" />
                  ) : (
                    <Camera className="w-3 h-3 text-slate-900" />
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

              {/* Name & Role Title */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {staffData.name}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[0.68rem] font-extrabold border ${
                      user?.role === 'RECRUITER'
                        ? 'bg-blue-500/20 text-blue-200 border-blue-400/40'
                        : 'bg-purple-500/20 text-purple-200 border-purple-400/40'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        user?.role === 'RECRUITER' ? 'bg-blue-400' : 'bg-purple-400'
                      }`}
                    />
                    {staffData.role}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[0.68rem] font-extrabold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Verified Staff
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-semibold text-slate-300">
                  {staffData.title}
                </p>
                <p className="text-xs text-slate-400">
                  {comp.company_name || 'Visys Cloud Technologies'} • Active Provisioned Seat
                </p>
              </div>

            </div>
          </div>

          {/* Profile Details List (Name, Email, Phone, Place, Role) */}
          <div className="p-6 sm:p-8 divide-y divide-slate-100">
            
            <div className="py-3.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-slate-500" />
                Full Name
              </span>
              <span className="text-sm font-black text-slate-900">
                {staffData.name}
              </span>
            </div>

            <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                Official Email Address
              </span>
              <span className="text-sm font-bold text-slate-900 font-mono flex items-center gap-1.5">
                {staffData.email}
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </span>
            </div>

            <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                Phone Number
              </span>
              <span className="text-sm font-bold text-slate-900">
                {staffData.phone}
              </span>
            </div>

            <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                Place / Location
              </span>
              <span className="text-sm font-bold text-slate-900">
                {staffData.place}
              </span>
            </div>

            <div className="py-3.5 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                Assigned Platform Role
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${
                    user?.role === 'RECRUITER'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-purple-50 text-purple-700 border-purple-200'
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
            </div>

          </div>

          {/* Quick Footer Action */}
          <div className="px-6 sm:px-8 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[0.7rem] text-slate-400">
              Need to update your contact details or phone number? Click Edit Profile.
            </span>
            <button
              type="button"
              onClick={() => setIsEditingStaff(true)}
              className="text-xs font-bold text-[#00a884] hover:underline flex items-center gap-1 border-none bg-transparent cursor-pointer"
            >
              <Edit3 className="w-3 h-3" /> Edit Profile Details
            </button>
          </div>

        </div>

        {/* ── Edit Staff Profile Modal ── */}
        {isEditingStaff && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in select-text">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 text-slate-800 relative">
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#00a884] flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Edit Profile
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Update your personal staff details
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingStaff(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer border-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveStaffProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={staffData.name}
                    onChange={handleStaffChange}
                    required
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Official Email (Fixed by Workspace)
                  </label>
                  <input
                    type="email"
                    value={staffData.email}
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono bg-slate-100 text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={staffData.phone}
                    onChange={handleStaffChange}
                    required
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Place / Location *
                  </label>
                  <input
                    type="text"
                    name="place"
                    value={staffData.place}
                    onChange={handleStaffChange}
                    required
                    placeholder="e.g. Hyderabad, Telangana, India"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Designation Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={staffData.title}
                    onChange={handleStaffChange}
                    placeholder="e.g. Senior Tech Recruiter"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditingStaff(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer bg-white"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={savingStaff}
                    className="px-5 py-2 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer border-none disabled:opacity-50"
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
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 select-text text-slate-800">

      {/* ── Top Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-teal-50 text-[#00a884] flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </span>
            Company Profile & Branding
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage corporate branding, AWS S3 logo assets, employer verification, and business intelligence overview.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all bg-white shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-500" />
            Share Profile
          </button>

          {formData.website && (
            <a
              href={formData.website}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all bg-white shadow-2xs flex items-center gap-1.5 no-underline cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              Website
              <ArrowUpRight className="w-3 h-3 text-slate-400" />
            </a>
          )}

          <button
            type="button"
            onClick={() => setIsEditingOrg(true)}
            className="px-4 py-2 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer border-none shadow-xs flex items-center gap-1.5"
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


      {/* ── Organization Profile Card (Clean, No Cover Banner) ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Logo Avatar with S3 Upload Button */}
            <div className="relative inline-block shrink-0 group">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-slate-200 shadow-2xs bg-white text-slate-900 font-black text-2xl sm:text-3xl flex items-center justify-center overflow-hidden">
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
                  className="w-full h-full flex items-center justify-center bg-slate-900 text-white font-black"
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
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-black text-white hover:bg-slate-800 flex items-center justify-center shadow-md border-2 border-white transition-all cursor-pointer"
              >
                {uploadingLogo ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Camera className="w-3 h-3" />
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
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {formData.company_name}
                </h2>
                <span className="inline-flex items-center gap-1 text-[0.68rem] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full shadow-2xs">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Verified Employer
                </span>
                <span className="inline-flex items-center gap-1 text-[0.68rem] font-extrabold text-blue-700 bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-full shadow-2xs">
                  <Building2 className="w-3 h-3 text-blue-600" />
                  Administrator
                </span>
              </div>

              <p className="text-xs sm:text-sm font-bold text-slate-600 leading-relaxed">
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
        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 shadow-2xs flex-wrap">
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
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 bg-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#00a884]' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setIsEditingOrg(true)}
          className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all bg-white shadow-2xs flex items-center gap-1.5 cursor-pointer"
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
            <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
              <div className="px-5 py-4 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#00a884]" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                    About {formData.company_name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingOrg(true)}
                  className="text-xs font-bold text-[#00a884] hover:underline border-none bg-transparent cursor-pointer flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" /> Edit Story
                </button>
              </div>
              <div className="p-6">
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line font-medium">
                  {formData.about}
                </p>
              </div>
            </div>

            {/* ── Business Context (Inline Editable Directly on Page) ── */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6">
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
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer border-none disabled:opacity-50 self-start sm:self-auto"
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
                    <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1.5">
                      Product / service
                    </label>
                    <input
                      type="text"
                      name="product_service"
                      value={formData.product_service}
                      onChange={handleChange}
                      placeholder="CloudNest workflow software"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-800 bg-white placeholder-slate-400 focus:outline-none focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1.5">
                      Business model
                    </label>
                    <div className="relative">
                      <select
                        name="business_model"
                        value={formData.business_model}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-800 bg-white focus:outline-none focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884] transition-all appearance-none cursor-pointer pr-10"
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
                    <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1.5">
                      Growth stage
                    </label>
                    <div className="relative">
                      <select
                        name="growth_stage"
                        value={formData.growth_stage}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-800 bg-white focus:outline-none focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884] transition-all appearance-none cursor-pointer pr-10"
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
                    <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1.5">
                      Target audience
                    </label>
                    <input
                      type="text"
                      name="target_audience"
                      value={formData.target_audience}
                      onChange={handleChange}
                      placeholder="Operations leaders at mid-market companies"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-800 bg-white placeholder-slate-400 focus:outline-none focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884] transition-all"
                    />
                  </div>
                </div>

                {/* Row 3: Ideal customer profile */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1.5">
                    Ideal customer profile
                  </label>
                  <textarea
                    name="ideal_customer_profile"
                    rows="3"
                    value={formData.ideal_customer_profile}
                    onChange={handleChange}
                    placeholder="Companies with 100–500 employees managing complex internal approvals."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-800 bg-white placeholder-slate-400 focus:outline-none focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884] transition-all resize-y min-h-[85px] leading-relaxed"
                  />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ── CULTURE & BENEFITS TAB ── */}
        {activeTab === 'culture' && (
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs p-6 space-y-4 animate-in fade-in duration-200">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#00a884]" />
              Life, Culture & Benefits at {formData.company_name}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70">
                <h4 className="font-extrabold text-slate-900">🏠 Flexible Hybrid Work Model</h4>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  2 days remote, 3 days collaborative studio work with high autonomy and flexible hours.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70">
                <h4 className="font-extrabold text-slate-900">🚀 Fast-Track Career Growth</h4>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Bi-annual compensation reviews and clear engineering & marketing advancement ladders.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70">
                <h4 className="font-extrabold text-slate-900">💡 Learning & Upskilling Budget</h4>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  ₹50,000 annual allowance for certifications, cloud workshops, and technical conferences.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70">
                <h4 className="font-extrabold text-slate-900">🩺 Comprehensive Health Coverage</h4>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in select-text">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 text-slate-800 relative max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#00a884] flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
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
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Logo S3 Upload Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Company Brand Logo (Stored on AWS S3)
                </label>
                <div className="flex items-center gap-3 p-3 bg-slate-50/60 rounded-2xl border border-slate-200/80">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                    {formData.logo_url ? (
                      <img
                        src={formData.logo_url}
                        alt="Logo Preview"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <span className="text-base font-black text-slate-400">
                        {formData.company_name ? formData.company_name.charAt(0).toUpperCase() : 'C'}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-1.5 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs">
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
                          className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold transition-colors cursor-pointer bg-white"
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Company Name *</label>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Official Phone *</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Website & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Official Website</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://yourcompany.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Headquarters Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="City, State, Country"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Industry & Specialization */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Industry & Specialization *</label>
                <input
                  type="text"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Digital Marketing, MarTech, Cloud Media"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50"
                />
              </div>

              {/* About & Mission */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">About Company Story & Mission</label>
                <textarea
                  name="about"
                  rows="3"
                  value={formData.about}
                  onChange={handleChange}
                  placeholder="Describe your company, culture, and core competency..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50 leading-relaxed"
                />
              </div>

              {/* Business Context Fields in Modal */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Business Context
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Product / service</label>
                    <input
                      type="text"
                      name="product_service"
                      value={formData.product_service}
                      onChange={handleChange}
                      placeholder="CloudNest workflow software"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Business model</label>
                    <select
                      name="business_model"
                      value={formData.business_model}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50"
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
                    <label className="block text-xs font-bold text-slate-700 mb-1">Growth stage</label>
                    <select
                      name="growth_stage"
                      value={formData.growth_stage}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50"
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
                    <label className="block text-xs font-bold text-slate-700 mb-1">Target audience</label>
                    <input
                      type="text"
                      name="target_audience"
                      value={formData.target_audience}
                      onChange={handleChange}
                      placeholder="Operations leaders at mid-market companies"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ideal customer profile</label>
                  <textarea
                    name="ideal_customer_profile"
                    rows="2"
                    value={formData.ideal_customer_profile}
                    onChange={handleChange}
                    placeholder="Companies with 100–500 employees managing complex internal approvals."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50 leading-relaxed"
                  />
                </div>
              </div>

              {/* Hiring Need Fields in Modal */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Hiring Need
                </h4>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Business problem</label>
                  <textarea
                    name="business_problem"
                    rows="2"
                    value={formData.business_problem}
                    onChange={handleChange}
                    placeholder="Lead volume is rising, but qualified pipeline is inconsistent."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50 leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expected outcome</label>
                  <textarea
                    name="expected_outcome"
                    rows="2"
                    value={formData.expected_outcome}
                    onChange={handleChange}
                    placeholder="Build a repeatable demand programme and improve lead-to-opportunity quality."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50 leading-relaxed"
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50"
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Decision authority</label>
                    <input
                      type="text"
                      name="decision_authority"
                      value={formData.decision_authority}
                      onChange={handleChange}
                      placeholder="Own campaigns and recommend budget allocation"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50"
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingOrg(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer bg-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading || uploadingLogo}
                  className="px-5 py-2.5 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer border-none disabled:opacity-50"
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
