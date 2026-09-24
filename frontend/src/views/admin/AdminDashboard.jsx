import React, { useState, useEffect } from 'react';
import {
  Building2, CheckCircle2, ShieldCheck, PlusCircle,
  Briefcase, Users, ArrowRight, Sparkles, MapPin,
  Calendar, Award, TrendingUp, ChevronRight, Plus,
  Clock, Target, ArrowUpRight, UserPlus, Trash2, X,
  KeyRound, Mail, UserCheck, Shield, Pencil
} from 'lucide-react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';

const NAVY = '#132340';
const NAVY_SOFT = '#2C4470';
const INK = '#0F1B2E';
const GOLD = '#F2A93B';
const GOLD_DEEP = '#D98D1E';
const PAPER = '#F6F7FB';
const LINE = '#EAEDF3';
const DISPLAY_FONT = "'Lexend', 'Inter', system-ui, sans-serif";

export default function AdminDashboard({
  setActiveTab,
  setSelectedJobId,
  openAddModal = false,
  onCloseAddModal
}) {
  const { user, refreshUser } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showToast, setShowToast] = useState(null);

  // Modal State for Creating Team Member
  const [showCreateModal, setShowCreateModal] = useState(openAddModal);

  useEffect(() => {
    if (openAddModal) {
      setShowCreateModal(true);
      onCloseAddModal?.();
    }
  }, [openAddModal, onCloseAddModal]);
  const [submittingMember, setSubmittingMember] = useState(false);
  const [memberFormError, setMemberFormError] = useState('');
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    password: '',
    role: 'RECRUITER',
    title: ''
  });

  const company = user?.profile || {};
  const companyName = company.company_name || user?.email?.split('@')[0] || 'Agency Administrator';
  const companyTitle = company.industry || 'Digital Marketing & Tech Agency';
  const companyLocation = company.location || (company.city ? `${company.city}${company.state ? ', ' + company.state : ''}` : 'Global / Remote');

  const triggerToast = (msg) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3500);
  };

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 40);
    loadData();
    return () => clearTimeout(t);
  }, []);

  const loadData = () => {
    api.getJobs()
      .then(list => setJobs(list || []))
      .catch(() => { })
      .finally(() => setLoading(false));

    api.getTeamMembers()
      .then(members => setTeamMembers(members || []))
      .catch(() => { })
      .finally(() => setLoadingTeam(false));
  };

  const handleRequestVerification = async () => {
    setVerifying(true);
    try {
      await api.verifyCompany();
      await refreshUser();
      triggerToast('✨ Company verified successfully!');
    } catch (e) {
      triggerToast(e.message || 'Verification request submitted');
    } finally {
      setVerifying(false);
    }
  };

  const handleCreateMember = async (e) => {
    e.preventDefault();
    setMemberFormError('');

    if (!newMember.name.trim() || !newMember.email.trim() || !newMember.password.trim()) {
      setMemberFormError('Please fill in all required fields (Name, Email, Password).');
      return;
    }

    setSubmittingMember(true);
    try {
      const res = await api.createTeamMember(newMember);
      triggerToast(`🎉 Created ${newMember.role.replace('_', ' ').toLowerCase()} account for ${newMember.name}!`);
      setShowCreateModal(false);
      setNewMember({
        name: '',
        email: '',
        password: '',
        role: 'RECRUITER',
        title: ''
      });
      loadData();
    } catch (err) {
      setMemberFormError(err.message || 'Failed to create team member.');
    } finally {
      setSubmittingMember(false);
    }
  };

  const handleDeleteMember = async (memberId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from your company team?`)) return;
    try {
      await api.deleteTeamMember(memberId);
      triggerToast(`Removed ${memberName} from team.`);
      loadData();
    } catch (err) {
      triggerToast(err.message || 'Failed to delete member.');
    }
  };

  const greet = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };

  // Administrator KPI stats
  const adminStats = [
    { icon: Briefcase, label: 'Active listings', value: jobs.length || 0, delta: '+2 this week', color: NAVY },
    { icon: Users, label: 'Total applicants', value: 47, delta: '+12 this week', color: '#0E9F6E', tab: 'applicants_view' },
    { icon: UserPlus, label: 'Team staff', value: teamMembers.length || 0, delta: 'Recruiters & Managers', color: GOLD_DEEP, action: () => setShowCreateModal(true) },
    { icon: Award, label: 'Placements hired', value: 3, delta: 'Last: Fri', color: '#D14343', tab: 'applicants_view' },
  ];

  const quickActions = [
    { icon: UserPlus, label: 'Add staff member', action: () => setShowCreateModal(true), primary: true },
    { icon: Building2, label: 'Company profile', tab: 'company_profile' },
  ];

  return (
    <div className="min-h-full pb-10" style={{ background: PAPER }}>

      {/* Toast Alert */}
      {showToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-5 py-3 rounded-xl bg-slate-900 text-white shadow-2xl border border-teal-500/40 text-xs font-medium animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-[#00a884]" />
          {showToast}
        </div>
      )}

      {/* ─── HERO BANNER ─── */}
      <div style={{
        background: `radial-gradient(120% 140% at 12% 0%, ${NAVY_SOFT} 0%, ${NAVY} 46%, ${INK} 100%)`,
        position: 'relative', overflow: 'hidden'
      }}>
        <svg className="absolute inset-0 w-full h-full opacity-[0.07]" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <pattern id="admin-grid" width="46" height="46" patternUnits="userSpaceOnUse">
              <path d="M46 0H0V46" fill="none" stroke="#FFFFFF" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#admin-grid)" />
        </svg>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="pt-8 sm:pt-10 pb-7 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">

            {/* Administrator Identity */}
            <div className={`flex items-center gap-4 sm:gap-5 ${mounted ? 'ux-rise' : 'opacity-0'}`}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl overflow-hidden shrink-0 shadow-lg ring-2 ring-amber-400/50"
                style={{
                  fontFamily: DISPLAY_FONT,
                  background: 'linear-gradient(135deg, rgba(242,169,59,0.22), rgba(242,169,59,0.06))',
                  border: '2px solid rgba(242,169,59,0.45)',
                }}
              >
                {company.logo_url ? (
                  <img src={company.logo_url} alt={companyName} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <Building2 size={26} className="text-amber-300" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[0.7rem] font-semibold tracking-wide text-amber-300/70">{greet()}</p>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold text-[0.62rem] border border-amber-400/30">
                    Administrator
                  </span>
                </div>
                <h1 className="text-[1.6rem] sm:text-[1.9rem] font-bold text-white leading-tight" style={{ fontFamily: DISPLAY_FONT }}>
                  {companyName}
                </h1>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-xs text-white/55 flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-amber-300/80" /> {companyTitle}
                    <span className="ml-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold text-[0.65rem] border border-emerald-500/30">
                      {company.is_verified ? 'Verified Organization' : 'Pending Verification'}
                    </span>
                  </span>
                  {companyLocation && (
                    <>
                      <span className="text-white/20">·</span>
                      <span className="text-xs text-white/45 flex items-center gap-1"><MapPin size={11} /> {companyLocation}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className={`flex items-center gap-2 flex-wrap lg:justify-end ${mounted ? 'ux-rise' : 'opacity-0'}`} style={{ animationDelay: '60ms' }}>
              {quickActions.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => item.action ? item.action() : setActiveTab?.(item.tab)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[0.8rem] font-semibold transition-all border-none cursor-pointer whitespace-nowrap"
                  style={item.primary
                    ? { background: GOLD, color: INK }
                    : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.12)' }
                  }
                  onMouseEnter={e => { e.currentTarget.style.filter = item.primary ? 'brightness(1.08)' : 'none'; if (!item.primary) e.currentTarget.style.background = 'rgba(255,255,255,0.11)'; }}
                  onMouseLeave={e => { e.currentTarget.style.filter = 'none'; if (!item.primary) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                >
                  <item.icon size={14} /> {item.label}
                </button>
              ))}
            </div>

          </div>

          {/* ─── STATS STRIP ─── */}
          <div className="-mb-8 relative z-10">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {adminStats.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => s.action ? s.action() : setActiveTab?.(s.tab)}
                  className={`bg-white rounded-2xl px-5 py-4 text-left cursor-pointer border-none transition-all hover:-translate-y-0.5 group ${mounted ? 'ux-rise' : 'opacity-0'}`}
                  style={{ boxShadow: '0 10px 30px -12px rgba(15,27,46,0.25)', borderTop: `3px solid ${s.color}`, animationDelay: `${100 + i * 40}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <s.icon size={16} style={{ color: s.color }} strokeWidth={2.25} />
                    <ArrowUpRight size={13} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </div>
                  <div className="text-[1.6rem] font-bold leading-none mt-3 ux-tabular" style={{ color: INK, fontFamily: DISPLAY_FONT }}>{s.value}</div>
                  <div className="text-[0.78rem] text-slate-500 font-medium mt-1.5">{s.label}</div>
                  <div className="text-[0.68rem] text-slate-400 mt-1">{s.delta}</div>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ─── MAIN WORKSPACE GRID ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-12 space-y-8">

        {/* ======================================================================= */}
        {/* TEAM & ROLE MANAGEMENT SECTION (PRIMARY ADMIN FEATURE)                  */}
        {/* ======================================================================= */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-xs" style={{ border: `1px solid ${LINE}` }}>
          <div className="px-5 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ borderBottom: `1px solid ${LINE}` }}>
            <div>
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-[#00a884]" />
                <h2 className="text-base font-bold text-slate-900" style={{ fontFamily: DISPLAY_FONT }}>
                  Team & Role Management
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[0.65rem] font-extrabold bg-teal-50 text-[#00a884] border border-teal-200/60">
                  {teamMembers.length} Members
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Create and manage dedicated <strong>Recruiter</strong> and <strong>Hiring Manager</strong> accounts for your agency.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('staff_directory')}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer bg-white shadow-2xs transition-all"
              >
                <Users size={14} className="text-blue-600" />
                Staff Directory ({teamMembers.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('add_staff')}
                className="px-4 py-2.5 rounded-xl bg-[#00a884] hover:bg-[#009272] text-white text-xs font-bold flex items-center justify-center gap-2 border-none cursor-pointer shadow-sm transition-all"
              >
                <UserPlus size={15} />
                Add Recruiter or Manager
              </button>
            </div>
          </div>

          {loadingTeam ? (
            <div className="p-10 text-center">
              <div className="w-6 h-6 border-2 rounded-full animate-spin mx-auto mb-2" style={{ borderColor: LINE, borderTopColor: NAVY_SOFT }} />
              <p className="text-xs text-slate-400">Loading team staff...</p>
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#00a884] flex items-center justify-center mx-auto mb-3">
                <Users size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No staff members created yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                As the Administrator, you can create <strong>Recruiters</strong> to post jobs and screen applicants, or <strong>Hiring Managers</strong> to review candidate scorecards and conduct final evaluations.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('add_staff')}
                className="mt-4 px-5 py-2.5 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-bold border-none cursor-pointer inline-flex items-center gap-2"
              >
                <Plus size={14} /> Create First Role
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[0.68rem] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-5">Staff Member</th>
                    <th className="py-3 px-5">Assigned Role</th>
                    <th className="py-3 px-5">Department / Title</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {teamMembers.map((member) => {
                    const isRecruiterRole = member.role === 'RECRUITER';
                    return (
                      <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            {member.avatar_url ? (
                              <img
                                src={member.avatar_url}
                                alt={member.name}
                                className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                              style={{
                                background: isRecruiterRole ? '#2C4470' : '#7C5CBF',
                                display: member.avatar_url ? 'none' : 'flex'
                              }}
                            >
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{member.name}</div>
                              <div className="text-[0.68rem] text-slate-400">{member.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-5">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.68rem] font-extrabold border"
                            style={isRecruiterRole
                              ? { background: '#EFF6FF', color: '#1D4ED8', borderColor: '#BFDBFE' }
                              : { background: '#FAF5FF', color: '#7E22CE', borderColor: '#E9D5FF' }
                            }
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: isRecruiterRole ? '#1D4ED8' : '#7E22CE' }} />
                            {isRecruiterRole ? 'Recruiter' : 'Hiring Manager'}
                          </span>
                        </td>

                        <td className="py-4 px-5 text-slate-700">
                          {member.title || (isRecruiterRole ? 'Technical Recruiter' : 'Hiring Manager')}
                        </td>

                        <td className="py-4 px-5 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setActiveTab('staff_directory')}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#00a884] hover:bg-teal-50 transition-colors border-none bg-transparent cursor-pointer"
                              title={`Edit ${member.name} in Staff Directory`}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMember(member.id, member.name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors border-none bg-transparent cursor-pointer"
                              title={`Remove ${member.name}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ======================================================================= */}
        {/* RECENT ACTIVE LISTINGS & PIPELINE ACTIVITY (2 COLUMNS)                  */}
        {/* ======================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Left: Active Jobs */}
          <div className="lg:col-span-3 bg-white rounded-2xl overflow-hidden shadow-xs" style={{ border: `1px solid ${LINE}` }}>
            <div className="px-5 sm:px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${LINE}` }}>
              <h2 className="text-[0.95rem] font-bold flex items-center gap-2.5" style={{ color: INK, fontFamily: DISPLAY_FONT }}>
                <Briefcase size={16} style={{ color: NAVY_SOFT }} />
                Agency active listings
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                {jobs.length} Active {jobs.length === 1 ? 'Job' : 'Jobs'}
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading jobs...</div>
            ) : jobs.length === 0 ? (
              <div className="p-8 text-center">
                <Briefcase size={28} className="text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-600">No active job listings</p>
                <p className="text-[0.72rem] text-slate-400 mt-1">Requisitions posted by recruiters will appear here.</p>
              </div>
            ) : (
              <div>
                {jobs.slice(0, 4).map((j, idx) => (
                  <div
                    key={j.id}
                    className="px-5 sm:px-6 py-4 flex items-center gap-4 hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    style={{ borderBottom: idx < Math.min(jobs.length, 4) - 1 ? `1px solid ${LINE}` : 'none' }}
                    onClick={() => { setSelectedJobId?.(j.id); setActiveTab?.('applicants_view'); }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-slate-100 text-slate-700">
                      <Briefcase size={17} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-800 group-hover:text-[#132340] transition-colors line-clamp-1">{j.title}</h4>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 flex-wrap">
                        <span>{j.location || 'Remote'}</span>
                        <span className="text-slate-300">·</span>
                        <span className="px-1.5 py-0.5 rounded text-[0.65rem] font-medium bg-slate-100">{j.work_mode || 'Full-time'}</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Quick Action Cards */}
          <div className="lg:col-span-2 space-y-5">
            <div
              className="rounded-2xl p-5 cursor-pointer transition-all hover:brightness-[1.05]"
              onClick={() => setActiveTab?.('add_staff')}
              style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_SOFT} 100%)` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <UserPlus size={18} className="text-amber-300" />
                <h3 className="text-sm font-bold text-white" style={{ fontFamily: DISPLAY_FONT }}>
                  Invite New Recruiter or Manager
                </h3>
              </div>
              <p className="text-xs text-white/60 leading-relaxed mb-4">
                Empower your recruiters to source talent and hiring managers to evaluate candidates with tailored portal dashboards.
              </p>
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-xs font-bold border-none cursor-pointer"
                style={{ background: GOLD, color: INK }}
              >
                Create Staff Account →
              </button>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-xs" style={{ border: `1px solid ${LINE}` }}>
              <h3 className="text-sm font-bold text-slate-800 mb-3" style={{ fontFamily: DISPLAY_FONT }}>
                Agency Governance & Controls
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span>Only Administrators can add or revoke staff access.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span>Recruiters manage candidate sourcing & ATS pipelines.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span>Hiring Managers evaluate resumes and submit scorecards.</span>
                </li>
              </ul>
            </div>
          </div>

        </div>

      </div>

      {/* ======================================================================= */}
      {/* "ADD STAFF MEMBER" MODAL                                                */}
      {/* ======================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in select-none">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 text-slate-800 relative">

            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#00a884] flex items-center justify-center">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: DISPLAY_FONT }}>
                    Create Staff Member Account
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Assign Recruiter or Hiring Manager role</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer border-none"
              >
                <X size={16} />
              </button>
            </div>

            {/* Error Message */}
            {memberFormError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <span>{memberFormError}</span>
              </div>
            )}

            <form onSubmit={handleCreateMember} className="space-y-4">

              {/* Role Selection Toggle */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Role Assignment *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setNewMember({ ...newMember, role: 'RECRUITER' })}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${newMember.role === 'RECRUITER'
                      ? 'border-2 border-[#1D4ED8] bg-blue-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">Recruiter</span>
                      {newMember.role === 'RECRUITER' && <CheckCircle2 size={16} className="text-[#1D4ED8]" />}
                    </div>
                    <p className="text-[0.68rem] text-slate-500 leading-snug">
                      Posts job openings, screens applicants, moves ATS stages.
                    </p>
                  </div>

                  <div
                    onClick={() => setNewMember({ ...newMember, role: 'HIRING_MANAGER' })}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${newMember.role === 'HIRING_MANAGER'
                      ? 'border-2 border-[#7E22CE] bg-purple-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">Hiring Manager</span>
                      {newMember.role === 'HIRING_MANAGER' && <CheckCircle2 size={16} className="text-[#7E22CE]" />}
                    </div>
                    <p className="text-[0.68rem] text-slate-500 leading-snug">
                      Reviews candidate submissions, evaluates scorecards, hires.
                    </p>
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newMember.name}
                  onChange={e => setNewMember({ ...newMember, name: e.target.value })}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-[#00a884] focus:outline-none"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Official Email Address *</label>
                <input
                  type="email"
                  required
                  value={newMember.email}
                  onChange={e => setNewMember({ ...newMember, email: e.target.value })}
                  placeholder="e.g. sarah@youragency.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-[#00a884] focus:outline-none"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Initial Password *</label>
                <input
                  type="password"
                  required
                  value={newMember.password}
                  onChange={e => setNewMember({ ...newMember, password: e.target.value })}
                  placeholder="Create a strong password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-[#00a884] focus:outline-none"
                />
              </div>

              {/* Title / Department */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Job Title / Department</label>
                <input
                  type="text"
                  value={newMember.title}
                  onChange={e => setNewMember({ ...newMember, title: e.target.value })}
                  placeholder={newMember.role === 'RECRUITER' ? 'e.g. Senior Talent Partner' : 'e.g. VP Engineering / Marketing Director'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-[#00a884] focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 border-none bg-transparent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingMember}
                  className="px-5 py-2.5 rounded-xl bg-[#00a884] hover:bg-[#009272] text-white text-xs font-bold border-none cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {submittingMember ? 'Creating Account...' : 'Confirm & Create Account ✨'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
