import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import {
  ShieldCheck,
  CreditCard,
  Users,
  Building2,
  Briefcase,
  TrendingUp,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  LogOut,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Sliders,
  DollarSign,
  FileText,
  Filter,
  AlertCircle,
  Copy,
  Check,
  UserCheck,
  UserX,
  PlusCircle,
  Lock,
  Unlock,
  LayoutDashboard,
  UserPlus,
  MessageSquare,
  Folder,
  HelpCircle,
  Calendar,
  Layers,
  Award,
  ChevronDown,
  Edit3,
  Trash2,
  Plus,
  Globe,
  PowerOff,
  Power
} from 'lucide-react';
import VendorOnboardingTab from './VendorOnboardingTab';

export const SIDEBAR_FEATURE_OPTIONS = {
  ADMIN: [
    { key: 'dashboard', label: 'Dashboard', desc: 'Main control center, key recruitment stats and metrics', icon: LayoutDashboard },
    { key: 'add_staff', label: 'Add Staff Member', desc: 'Invite and provision recruiter & manager team seats', icon: UserPlus },
    { key: 'hiring_groups', label: 'Hiring Group', desc: 'Create and organize collaborative hiring pods', icon: Layers },
    { key: 'manage_jobs', label: 'Jobs Oversight', desc: 'Master bird-eye view of all company listings', icon: Briefcase },
    { key: 'applicants', label: 'Application Pipeline', desc: 'Full company candidate pipeline overview', icon: Users },
    { key: 'interviews', label: 'Candidate Interview', desc: 'Schedule and manage Google Meet interviews', icon: Calendar },
    { key: 'messages', label: 'Internal Message', desc: 'Direct internal messaging and collaboration', icon: MessageSquare },
    { key: 'staff_documents', label: 'Staff Documents', desc: 'Manage company document vault and policies', icon: Folder },
    { key: 'company_profile', label: 'Company Profile', desc: 'Configure brand assets, bio, and company settings', icon: Building2 },
    { key: 'support', label: 'Support', desc: 'Direct support desk and platform assistance', icon: HelpCircle },
  ],
  RECRUITER: [
    { key: 'dashboard', label: 'Dashboard', desc: 'Recruiter personal metrics and pending applications', icon: LayoutDashboard },
    { key: 'post_job', label: 'Post New Job', desc: 'Draft and publish new hiring requisitions', icon: PlusCircle },
    { key: 'manage_jobs', label: 'Manage Jobs', desc: 'Edit active jobs, adjust criteria, and monitor flow', icon: Briefcase },
    { key: 'applicants', label: 'Applications Pipeline', desc: 'Review incoming candidate applications by stage', icon: Users },
    { key: 'search_candidates', label: 'Search Candidates', desc: 'Search and filter entire candidate talent pool', icon: Search },
    { key: 'application_status', label: 'Application Status', desc: 'Track applicant progression and outcome status', icon: CheckCircle2 },
    { key: 'interviews', label: 'Candidate Interview', desc: 'Host and manage live candidate interview rounds', icon: Calendar },
    { key: 'messages', label: 'Internal Message', desc: 'Chat with hiring managers and applicants', icon: MessageSquare },
    { key: 'documents', label: 'Recruiter Document', desc: 'Access job specifications and recruitment briefs', icon: Folder },
    { key: 'company_profile', label: 'Company Profile', desc: 'View company public profile and brand page', icon: Building2 },
    { key: 'support', label: 'Support', desc: 'Access help docs and customer support assistance', icon: HelpCircle },
  ],
  MANAGER: [
    { key: 'dashboard', label: 'Dashboard', desc: 'Hiring manager overview of team requisitions', icon: LayoutDashboard },
    { key: 'applicants', label: 'Review Candidates', desc: 'Screen and rate candidates submitted for roles', icon: Users },
    { key: 'manage_jobs', label: 'Active Requisitions', desc: 'View job positions assigned to manager team', icon: Briefcase },
    { key: 'interviews', label: 'Scheduled Interview', desc: 'Conduct interviews and submit candidate scores', icon: Calendar },
    { key: 'company_profile', label: 'My Profile', desc: 'Manage personal profile and hiring preferences', icon: Building2 },
    { key: 'messages', label: 'Internal Message', desc: 'Internal discussion with assigned recruiters', icon: MessageSquare },
    { key: 'support', label: 'Support', desc: 'Get assistance and user documentation', icon: HelpCircle },
  ]
};

const PLAN_INFO = {
  FREE: {
    name: 'Free Starter',
    price: '₹0',
    billing: 'Free Trial',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    color: 'slate'
  },
  PLAN_4999: {
    name: 'Standard Role Plan',
    price: '₹4,999',
    billing: 'per role / 45 days',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    color: 'indigo'
  },
  PLAN_14999: {
    name: 'Growth Scale Plan',
    price: '₹14,999',
    billing: 'per month',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    color: 'amber'
  }
};

export default function SuperadminDashboard({ onLogout }) {
  const { user, logout } = useAuth();

  // Active Tab: 'overview', 'subscriptions', 'payments', 'candidates', 'recruiters'
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Data states
  const [stats, setStats] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [recruiters, setRecruiters] = useState([]);
  const [payments, setPayments] = useState([]);
  const [vendorCount, setVendorCount] = useState(0);

  // Search & Filters
  const [companySearch, setCompanySearch] = useState('');
  const [companyPlanFilter, setCompanyPlanFilter] = useState('');
  const [candidateSearch, setCandidateSearch] = useState('');
  const [recruiterSearch, setRecruiterSearch] = useState('');
  const [paymentPlanFilter, setPaymentPlanFilter] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Plan Management Modal State (Per Company)
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [planForm, setPlanForm] = useState({
    plan_type: 'PLAN_4999',
    plan_status: 'ACTIVE',
    extend_days: 0,
    max_roles: 2,
    max_jobs: 4,
    max_candidates_per_job: 50,
    notes: ''
  });

  // Global Plan Template Editing State (Edit Free / 4999 / 14999 plans)
  const [planTemplates, setPlanTemplates] = useState([]);
  const [editTemplateModalOpen, setEditTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateSubmitting, setTemplateSubmitting] = useState(false);
  const [templateRoleTab, setTemplateRoleTab] = useState('ADMIN');
  const [templateForm, setTemplateForm] = useState({
    id: '',
    name: '',
    price: 0,
    price_display: '',
    billing: '',
    duration_days: 30,
    max_roles: 1,
    max_jobs: 1,
    max_candidates_per_job: 15,
    badge: '',
    is_popular: false,
    description: '',
    features: [],
    sidebar_access: {
      ADMIN: [],
      RECRUITER: [],
      MANAGER: []
    }
  });

  // Fetch all initial data
  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const [statsData, compData, candData, recData, payData, plansData] = await Promise.all([
        api.getSuperadminStats().catch(err => { console.warn('Stats error:', err); return null; }),
        api.getSuperadminCompanies().catch(err => { console.warn('Companies error:', err); return []; }),
        api.getSuperadminCandidates().catch(err => { console.warn('Candidates error:', err); return []; }),
        api.getSuperadminRecruiters().catch(err => { console.warn('Recruiters error:', err); return []; }),
        api.getSuperadminPayments().catch(err => { console.warn('Payments error:', err); return []; }),
        api.getSuperadminPlanConfigs().catch(err => { console.warn('Plan configs error:', err); return []; })
      ]);

      if (statsData) setStats(statsData);
      if (Array.isArray(compData)) setCompanies(compData);
      if (Array.isArray(candData)) setCandidates(candData);
      if (Array.isArray(recData)) setRecruiters(recData);
      if (Array.isArray(payData)) setPayments(payData);
      if (Array.isArray(plansData) && plansData.length > 0) setPlanTemplates(plansData);
    } catch (err) {
      setError('Failed to synchronize superadmin records. Please check API connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Show temporary toast message
  const triggerToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 4500);
  };

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open Plan Management Modal
  const openPlanModal = (company) => {
    setSelectedCompany(company);
    setPlanForm({
      plan_type: company.plan_type || 'FREE',
      plan_status: company.plan_status || 'ACTIVE',
      extend_days: 0,
      max_roles: company.max_roles || 1,
      max_jobs: company.max_jobs || 1,
      max_candidates_per_job: company.max_candidates_per_job || 15,
      notes: ''
    });
    setModalOpen(true);
  };

  // Open Global Plan Template Editing Modal
  const openEditPlanTemplateModal = (plan) => {
    const defaultAccess = {
      ADMIN: ['dashboard', 'add_staff', 'hiring_groups', 'manage_jobs', 'applicants', 'interviews', 'messages', 'staff_documents', 'company_profile', 'support'],
      RECRUITER: ['dashboard', 'post_job', 'manage_jobs', 'applicants', 'search_candidates', 'application_status', 'interviews', 'messages', 'documents', 'company_profile', 'support'],
      MANAGER: ['dashboard', 'applicants', 'manage_jobs', 'interviews', 'company_profile', 'messages', 'support']
    };
    const currentAccess = plan.sidebar_access && Object.keys(plan.sidebar_access).length > 0
      ? {
          ADMIN: Array.isArray(plan.sidebar_access.ADMIN) ? [...plan.sidebar_access.ADMIN] : [...defaultAccess.ADMIN],
          RECRUITER: Array.isArray(plan.sidebar_access.RECRUITER) ? [...plan.sidebar_access.RECRUITER] : [...defaultAccess.RECRUITER],
          MANAGER: Array.isArray(plan.sidebar_access.MANAGER)
            ? [...plan.sidebar_access.MANAGER]
            : (Array.isArray(plan.sidebar_access.HIRING_MANAGER) ? [...plan.sidebar_access.HIRING_MANAGER] : [...defaultAccess.MANAGER])
        }
      : defaultAccess;

    setEditingTemplate(plan);
    setTemplateRoleTab('ADMIN');
    setTemplateForm({
      id: plan.id,
      name: plan.name || '',
      price: plan.price !== undefined ? plan.price : 0,
      price_display: plan.price_display || (plan.price === 0 ? '₹0' : `₹${plan.price?.toLocaleString()}`),
      billing: plan.billing || '',
      duration_days: plan.duration_days || 30,
      max_roles: plan.max_roles || 1,
      max_jobs: plan.max_jobs || 1,
      max_candidates_per_job: plan.max_candidates_per_job || 15,
      badge: plan.badge || '',
      is_popular: Boolean(plan.is_popular),
      description: plan.description || '',
      features: Array.isArray(plan.features) ? [...plan.features] : [],
      sidebar_access: currentAccess
    });
    setEditTemplateModalOpen(true);
  };

  const toggleSidebarItem = (roleKey, itemKey) => {
    setTemplateForm(prev => {
      const currentList = prev.sidebar_access?.[roleKey] || [];
      const exists = currentList.includes(itemKey);
      const updatedList = exists
        ? currentList.filter(k => k !== itemKey)
        : [...currentList, itemKey];
      return {
        ...prev,
        sidebar_access: {
          ...(prev.sidebar_access || {}),
          [roleKey]: updatedList
        }
      };
    });
  };

  const selectAllSidebarItems = (roleKey, selectAll = true) => {
    setTemplateForm(prev => {
      const allKeys = SIDEBAR_FEATURE_OPTIONS[roleKey]?.map(i => i.key) || [];
      return {
        ...prev,
        sidebar_access: {
          ...(prev.sidebar_access || {}),
          [roleKey]: selectAll ? allKeys : []
        }
      };
    });
  };

  // Save Plan Template Changes
  const handleSavePlanTemplate = async (e) => {
    e.preventDefault();
    if (!editingTemplate) return;

    setTemplateSubmitting(true);
    try {
      await api.updateSuperadminPlanConfig(editingTemplate.id, {
        name: templateForm.name,
        price: Number(templateForm.price),
        price_display: templateForm.price_display || (Number(templateForm.price) === 0 ? '₹0' : `₹${Number(templateForm.price).toLocaleString()}`),
        billing: templateForm.billing,
        duration_days: Number(templateForm.duration_days),
        max_roles: Number(templateForm.max_roles),
        max_jobs: Number(templateForm.max_jobs),
        max_candidates_per_job: Number(templateForm.max_candidates_per_job),
        badge: templateForm.badge,
        is_popular: templateForm.is_popular,
        description: templateForm.description,
        features: templateForm.features.filter(f => f && f.trim()),
        sidebar_access: templateForm.sidebar_access
      });

      triggerToast(`Plan "${templateForm.name}" updated successfully!`);
      setEditTemplateModalOpen(false);
      fetchData(true);
    } catch (err) {
      alert(`Failed to save plan template: ${err.message}`);
    } finally {
      setTemplateSubmitting(false);
    }
  };

  const handleAddFeatureBullet = () => {
    setTemplateForm(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const handleUpdateFeatureBullet = (index, value) => {
    setTemplateForm(prev => {
      const next = [...prev.features];
      next[index] = value;
      return { ...prev, features: next };
    });
  };

  const handleRemoveFeatureBullet = (index) => {
    setTemplateForm(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };
  const handlePlanSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCompany) return;

    setModalSubmitting(true);
    try {
      await api.updateCompanyPlan(selectedCompany.id, {
        plan_type: planForm.plan_type,
        plan_status: planForm.plan_status,
        extend_days: Number(planForm.extend_days) || 0,
        max_roles: Number(planForm.max_roles),
        max_jobs: Number(planForm.max_jobs),
        max_candidates_per_job: Number(planForm.max_candidates_per_job),
        notes: planForm.notes
      });

      triggerToast(`Plan for "${selectedCompany.company_name}" successfully updated!`);
      setModalOpen(false);
      fetchData(true);
    } catch (err) {
      alert(`Failed to update plan: ${err.message}`);
    } finally {
      setModalSubmitting(false);
    }
  };

  // Toggle company verification
  const handleToggleCompanyVerification = async (company) => {
    const nextStatus = !company.is_verified;
    try {
      await api.toggleCompanyVerification(company.id, {
        is_verified: nextStatus,
        verification_status: nextStatus ? 'VERIFIED' : 'REJECTED'
      });
      triggerToast(`Company "${company.company_name}" verification updated to ${nextStatus ? 'VERIFIED' : 'REJECTED'}`);
      fetchData(true);
    } catch (err) {
      alert(`Error updating company verification: ${err.message}`);
    }
  };

  // Toggle company active / deactivation status (controls login access)
  const handleToggleCompanyActive = async (company, nextActive) => {
    const confirmMsg = nextActive
      ? `Reactivate organization "${company.company_name}"?\n\nThis will restore login access for all administrators, recruiters, and hiring managers of this company.`
      : `DEACTIVATE organization "${company.company_name}"?\n\nWARNING: All users (Administrators, Recruiters, Hiring Managers) belonging to this organization will be immediately BLOCKED from logging in.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.toggleCompanyStatus(company.id, nextActive);
      triggerToast(res.message || `Organization "${company.company_name}" ${nextActive ? 'activated' : 'deactivated'}.`);
      fetchData(true);
    } catch (err) {
      alert(`Error updating organization status: ${err.message}`);
    }
  };

  // Toggle candidate verification
  const handleToggleCandidateVerification = async (cand) => {
    const nextStatus = !cand.is_verified;
    try {
      await api.toggleCandidateVerification(cand.id, nextStatus);
      triggerToast(`Candidate "${cand.full_name}" verification updated to ${nextStatus ? 'VERIFIED' : 'UNVERIFIED'}`);
      fetchData(true);
    } catch (err) {
      alert(`Error updating candidate verification: ${err.message}`);
    }
  };

  // Filtered Companies
  const filteredCompanies = companies.filter(c => {
    const matchesSearch = !companySearch ||
      c.company_name?.toLowerCase().includes(companySearch.toLowerCase()) ||
      c.business_email?.toLowerCase().includes(companySearch.toLowerCase()) ||
      c.industry?.toLowerCase().includes(companySearch.toLowerCase()) ||
      c.location?.toLowerCase().includes(companySearch.toLowerCase());
    const matchesPlan = !companyPlanFilter || c.plan_type === companyPlanFilter;
    return matchesSearch && matchesPlan;
  });

  // Filtered Candidates
  const filteredCandidates = candidates.filter(cd => {
    if (!candidateSearch) return true;
    const term = candidateSearch.toLowerCase();
    return (
      cd.full_name?.toLowerCase().includes(term) ||
      cd.email?.toLowerCase().includes(term) ||
      cd.city?.toLowerCase().includes(term) ||
      cd.title?.toLowerCase().includes(term) ||
      (cd.skills && cd.skills.some(s => typeof s === 'string' && s.toLowerCase().includes(term)))
    );
  });

  // Filtered Recruiters
  const filteredRecruiters = recruiters.filter(r => {
    if (!recruiterSearch) return true;
    const term = recruiterSearch.toLowerCase();
    return (
      r.name?.toLowerCase().includes(term) ||
      r.email?.toLowerCase().includes(term) ||
      r.company_name?.toLowerCase().includes(term) ||
      r.role?.toLowerCase().includes(term)
    );
  });

  // Filtered Payments
  const filteredPayments = payments.filter(p => {
    if (!paymentPlanFilter) return true;
    return p.plan_id === paymentPlanFilter;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans select-none antialiased">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-xl bg-emerald-600 text-white font-medium text-xs shadow-xl flex items-center gap-2 animate-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Superadmin Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md shadow-indigo-600/25">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900 tracking-tight">INTENTPEOPLE</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  Superadmin Console
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Platform Master Subscription & User Control</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
              <span>{refreshing ? 'Syncing...' : 'Sync Data'}</span>
            </button>

            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 text-xs font-medium shadow-xs transition-colors"
            >
              <span>Live Portal</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            <div className="h-5 w-px bg-slate-200" />

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-slate-700 font-medium">{user?.email || 'superadmin@intentpeople.com'}</span>
            </div>

            <button
              onClick={() => {
                logout();
                if (onLogout) onLogout();
                else window.location.href = '/superadmin/login';
              }}
              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors"
              title="Logout Superadmin"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Tabs Navigation Sub-Header */}
      <div className="bg-white border-b border-slate-200/80 px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-2">
          {[
            { id: 'overview', label: 'Overview & KPIs', icon: TrendingUp },
            { id: 'vendors', label: 'Vendor Onboarding & Portals', icon: Globe, count: vendorCount },
            { id: 'subscriptions', label: 'Company Subscriptions', icon: Award, count: companies.length },
            { id: 'payments', label: 'Payment Transactions', icon: CreditCard, count: payments.length },
            { id: 'candidates', label: 'Candidate Directory', icon: Users, count: candidates.length },
            { id: 'recruiters', label: 'Recruiters & Staff', icon: Building2, count: recruiters.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${isActive
                    ? 'bg-[#1E3155] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 font-bold'
                      }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Loading Superadmin Central Records...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <span>{error}</span>
            </div>
            <button onClick={() => fetchData()} className="underline font-semibold hover:text-rose-800">Try Again</button>
          </div>
        ) : (
          <>
            {/* 1. OVERVIEW & KPIS TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Metric Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Revenue Card */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-500">Total Subscription Revenue</span>
                      <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                        <DollarSign className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mb-1">
                      ₹{(stats?.metrics?.total_revenue || 0).toLocaleString()}
                    </div>
                    <p className="text-[11px] text-emerald-600 flex items-center gap-1 font-semibold">
                      <TrendingUp className="w-3 h-3" />
                      <span>Direct Gateway Collection</span>
                    </p>
                  </div>

                  {/* Registered Companies */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-500">Registered Companies</span>
                      <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                        <Building2 className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mb-1">
                      {stats?.metrics?.total_companies || companies.length}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {stats?.metrics?.active_subscriptions || 0} active subscriptions
                    </p>
                  </div>

                  {/* Registered Candidates */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-500">Registered Candidates</span>
                      <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                        <Users className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mb-1">
                      {stats?.metrics?.total_candidates || candidates.length}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {stats?.metrics?.total_applications || 0} applications submitted
                    </p>
                  </div>

                  {/* Job Requisitions */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-500">Job Requisitions</span>
                      <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                        <Briefcase className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mb-1">
                      {stats?.metrics?.total_jobs || 0}
                    </div>
                    <p className="text-[11px] text-slate-500">Active hiring opportunities</p>
                  </div>
                </div>

                {/* Plan Distribution & Breakdowns */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Plan Breakdown Card */}
                  <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Award className="w-4 h-4 text-blue-600" />
                        <span>Plan Distribution</span>
                      </h3>
                      <span className="text-xs text-slate-500">3 Hiring Tiers</span>
                    </div>

                    <div className="space-y-3 pt-2">
                      {/* Free */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-700 font-medium">Free Starter (₹0)</span>
                          <span className="text-slate-600 font-mono font-semibold">
                            {stats?.plans_breakdown?.FREE || 0} companies
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-slate-400 rounded-full"
                            style={{
                              width: `${companies.length > 0
                                  ? ((stats?.plans_breakdown?.FREE || 0) / companies.length) * 100
                                  : 0
                                }%`
                            }}
                          />
                        </div>
                      </div>

                      {/* Standard Plan 4999 */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-indigo-900 font-medium">Standard Role Plan (₹4,999)</span>
                          <span className="text-indigo-600 font-mono font-semibold">
                            {stats?.plans_breakdown?.PLAN_4999 || 0} companies
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full"
                            style={{
                              width: `${companies.length > 0
                                  ? ((stats?.plans_breakdown?.PLAN_4999 || 0) / companies.length) * 100
                                  : 0
                                }%`
                            }}
                          />
                        </div>
                      </div>

                      {/* Growth Scale Plan 14999 */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-amber-900 font-medium">Growth Scale Plan (₹14,999)</span>
                          <span className="text-amber-600 font-mono font-semibold">
                            {stats?.plans_breakdown?.PLAN_14999 || 0} companies
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{
                              width: `${companies.length > 0
                                  ? ((stats?.plans_breakdown?.PLAN_14999 || 0) / companies.length) * 100
                                  : 0
                                }%`
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Total Active Subscriptions</span>
                      <span className="font-bold text-emerald-600 font-mono">
                        {stats?.status_breakdown?.ACTIVE || 0}
                      </span>
                    </div>
                  </div>

                  {/* Recent Transactions List */}
                  <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                        <span>Recent Transactions</span>
                      </h3>
                      <button
                        onClick={() => setActiveTab('payments')}
                        className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 transition-colors"
                      >
                        <span>View All Transactions</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {(!stats?.recent_transactions || stats.recent_transactions.length === 0) ? (
                      <p className="text-xs text-slate-400 py-6 text-center">No payment transactions recorded yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {stats.recent_transactions.map((tx) => (
                          <div
                            key={tx.id}
                            className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                                <CreditCard className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900">{tx.company_name}</div>
                                <div className="text-[11px] text-slate-500">
                                  {PLAN_INFO[tx.plan_id]?.name || tx.plan_id} • {tx.razorpay_payment_id || tx.razorpay_order_id}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-emerald-600">₹{tx.amount.toLocaleString()}</div>
                              <div className="text-[10px] text-slate-400">
                                {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : 'N/A'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Registration Previews */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Companies */}
                  <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-indigo-600" />
                        <span>Recently Joined Companies</span>
                      </h3>
                      <button
                        onClick={() => setActiveTab('subscriptions')}
                        className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        Manage
                      </button>
                    </div>

                    <div className="space-y-2">
                      {companies.slice(0, 4).map((c) => (
                        <div
                          key={c.id}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-semibold text-slate-900">{c.company_name}</div>
                            <div className="text-[11px] text-slate-500">{c.business_email}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${PLAN_INFO[c.plan_type]?.badgeClass || ''}`}>
                              {PLAN_INFO[c.plan_type]?.name || c.plan_type}
                            </span>
                            <button
                              onClick={() => openPlanModal(c)}
                              className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-semibold transition-all shadow-xs"
                            >
                              Edit Plan
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Candidates */}
                  <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-600" />
                        <span>Recently Joined Candidates</span>
                      </h3>
                      <button
                        onClick={() => setActiveTab('candidates')}
                        className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        View All
                      </button>
                    </div>

                    <div className="space-y-2">
                      {candidates.slice(0, 4).map((cd) => (
                        <div
                          key={cd.id}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-semibold text-slate-900">{cd.full_name}</div>
                            <div className="text-[11px] text-slate-500">{cd.email || cd.title}</div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${cd.is_verified ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                            {cd.is_verified ? 'Verified' : 'Unverified'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. COMPANY SUBSCRIPTIONS & PLAN MANAGEMENT TAB */}
            {activeTab === 'subscriptions' && (
              <div className="space-y-6">
                {/* 3 Plans Description Cards (Editable by Superadmin) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(planTemplates.length > 0 ? planTemplates : [
                    {
                      id: 'FREE',
                      name: 'Free Starter',
                      price: 0,
                      price_display: '₹0',
                      billing: 'Free Trial',
                      duration_days: 365,
                      badge: 'TIER 1',
                      is_popular: false,
                      features: [
                        '1 Recruiter / Staff role',
                        '1 Job requisition posting',
                        '15 Candidates visible per job',
                        'Excess candidate cards blurred'
                      ]
                    },
                    {
                      id: 'PLAN_4999',
                      name: 'Standard Role Plan',
                      price: 4999,
                      price_display: '₹4,999',
                      billing: 'per role / 45 days',
                      duration_days: 45,
                      badge: 'MOST POPULAR',
                      is_popular: true,
                      features: [
                        '2 Staff roles (Recruiter + Hiring Manager)',
                        '4 Active job postings',
                        '50 Candidates visible per job',
                        'AI candidate fit scoring'
                      ]
                    },
                    {
                      id: 'PLAN_14999',
                      name: 'Growth Scale Plan',
                      price: 14999,
                      price_display: '₹14,999',
                      billing: 'per month',
                      duration_days: 30,
                      badge: 'HIGH VOLUME SCALE',
                      is_popular: false,
                      features: [
                        '4 Staff roles (2 Recruiters + 2 Managers)',
                        '8 Active job postings',
                        '200 Candidates visible per job',
                        'Agency-scale pipeline & pods'
                      ]
                    }
                  ]).map((p) => {
                    const isStandard = p.id === 'PLAN_4999';
                    const isGrowth = p.id === 'PLAN_14999';
                    const borderClass = isStandard
                      ? 'border-indigo-200 bg-gradient-to-b from-indigo-50/60 to-white shadow-sm ring-1 ring-indigo-500/20'
                      : isGrowth
                      ? 'border-amber-200 bg-gradient-to-b from-amber-50/60 to-white shadow-sm ring-1 ring-amber-500/20'
                      : 'border-slate-200 bg-white shadow-sm';
                    const badgeClass = isStandard
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : isGrowth
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200';

                    return (
                      <div key={p.id} className={`p-5 rounded-2xl border relative flex flex-col justify-between ${borderClass}`}>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${badgeClass}`}>
                              {p.badge || (p.id === 'FREE' ? 'TIER 1' : 'PLAN')}
                            </span>
                            <span className="text-xs font-semibold text-slate-500">
                              {p.duration_days ? `${p.duration_days} Days Validity` : (p.billing || 'Standard')}
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-slate-900 mb-0.5">{p.name}</h3>
                          <div className="text-xl font-extrabold text-slate-900 mb-2">
                            {p.price_display || `₹${p.price?.toLocaleString()}`}
                            {p.billing && (
                              <span className="text-xs text-slate-500 font-normal"> / {p.billing.replace(/^\/?\s*(per\s*)?/i, '')}</span>
                            )}
                          </div>

                          <ul className="text-xs text-slate-600 space-y-1.5 font-medium mb-3">
                            {Array.isArray(p.features) && p.features.map((feat, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="text-slate-400 mt-0.5">•</span>
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>

                          {/* Sidebar Access summary badge */}
                          <div className="mt-2 mb-3 p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60 text-[11px] space-y-1.5">
                            <div className="font-semibold text-slate-700 flex items-center justify-between">
                              <span className="flex items-center gap-1.5 text-slate-800">
                                <Lock className="w-3.5 h-3.5 text-blue-600" />
                                <span>Sidebar Menu Access</span>
                              </span>
                              <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">
                                Role Config
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5 text-[10.5px] text-slate-500 pt-0.5">
                              <div className="bg-white p-1.5 rounded-lg border border-slate-200/60 text-center shadow-2xs">
                                <div className="font-bold text-slate-900 text-xs">
                                  {p.sidebar_access?.ADMIN ? p.sidebar_access.ADMIN.length : 10}/10
                                </div>
                                <div className="text-[9.5px] text-slate-400 font-medium">Admin</div>
                              </div>
                              <div className="bg-white p-1.5 rounded-lg border border-slate-200/60 text-center shadow-2xs">
                                <div className="font-bold text-slate-900 text-xs">
                                  {p.sidebar_access?.RECRUITER ? p.sidebar_access.RECRUITER.length : 11}/11
                                </div>
                                <div className="text-[9.5px] text-slate-400 font-medium">Recruiter</div>
                              </div>
                              <div className="bg-white p-1.5 rounded-lg border border-slate-200/60 text-center shadow-2xs">
                                <div className="font-bold text-slate-900 text-xs">
                                  {p.sidebar_access?.MANAGER ? p.sidebar_access.MANAGER.length : 7}/7
                                </div>
                                <div className="text-[9.5px] text-slate-400 font-medium">Manager</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Superadmin Edit Plan Template Button */}
                        <div className="pt-3 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => openEditPlanTemplateModal(p)}
                            className="w-full py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-[0.99]"
                            title="Edit this plan's pricing, features, limits, and duration"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                            <span>Edit Plan Template</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Search & Filter Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search company, email, location..."
                      value={companySearch}
                      onChange={(e) => setCompanySearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                      value={companyPlanFilter}
                      onChange={(e) => setCompanyPlanFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:bg-white"
                    >
                      <option value="">All Subscription Tiers</option>
                      <option value="FREE">Free Starter</option>
                      <option value="PLAN_4999">Standard Role Plan</option>
                      <option value="PLAN_14999">Growth Scale Plan</option>
                    </select>
                  </div>
                </div>

                {/* Company Table */}
                <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        <tr>
                          <th className="py-3.5 px-4">Company</th>
                          <th className="py-3.5 px-4">Current Plan</th>
                          <th className="py-3.5 px-4">Status & Validity</th>
                          <th className="py-3.5 px-4">Plan Limits</th>
                          <th className="py-3.5 px-4">Usage</th>
                          <th className="py-3.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredCompanies.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="py-12 text-center text-slate-400">
                              No companies matching criteria.
                            </td>
                          </tr>
                        ) : (
                          filteredCompanies.map((c) => {
                            const planMeta = PLAN_INFO[c.plan_type] || PLAN_INFO.FREE;
                            const isDeactivated = c.is_active === false || c.plan_status === 'DEACTIVATED';
                            const isActive = !isDeactivated && c.plan_status === 'ACTIVE';

                            return (
                              <tr key={c.id} className={`transition-colors ${isDeactivated ? 'bg-rose-50/30 hover:bg-rose-50/50' : 'hover:bg-slate-50/70'}`}>
                                {/* Company Info */}
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-2">
                                    <div className="font-bold text-slate-900 text-sm">{c.company_name}</div>
                                    {isDeactivated && (
                                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                        Deactivated
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-500">{c.business_email}</div>
                                  <div className="text-[10px] text-slate-400">{c.location || 'Remote'}</div>
                                </td>

                                {/* Current Plan */}
                                <td className="py-3.5 px-4">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${planMeta.badgeClass}`}>
                                    <span>{planMeta.name}</span>
                                  </span>
                                </td>

                                {/* Status & Validity */}
                                <td className="py-3.5 px-4">
                                  {isDeactivated ? (
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                                        <span className="font-bold text-xs text-rose-700 uppercase tracking-wide">
                                          DEACTIVATED
                                        </span>
                                      </div>
                                      <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
                                        Login access blocked
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span
                                          className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-400'
                                            }`}
                                        />
                                        <span className="font-semibold text-xs text-slate-700">
                                          {c.plan_status || 'ACTIVE'}
                                        </span>
                                      </div>
                                      <div className="text-[11px] text-slate-500 mt-0.5">
                                        {c.days_remaining !== null
                                          ? `${c.days_remaining} days left`
                                          : 'No expiration'}
                                      </div>
                                    </div>
                                  )}
                                </td>

                                {/* Limits */}
                                <td className="py-3.5 px-4">
                                  <div className="text-[11px] space-y-0.5 font-mono text-slate-500">
                                    <div>Max Roles: <span className="text-slate-800 font-semibold">{c.max_roles}</span></div>
                                    <div>Max Jobs: <span className="text-slate-800 font-semibold">{c.max_jobs}</span></div>
                                    <div>Candidates/Job: <span className="text-slate-800 font-semibold">{c.max_candidates_per_job}</span></div>
                                  </div>
                                </td>

                                {/* Usage */}
                                <td className="py-3.5 px-4">
                                  <div className="text-[11px] space-y-0.5 text-slate-600 font-medium">
                                    <div>{c.members_count} Staff member(s)</div>
                                    <div>{c.jobs_count} Job posting(s)</div>
                                  </div>
                                </td>

                                {/* Actions */}
                                <td className="py-3.5 px-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => openPlanModal(c)}
                                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                                    >
                                      <Sliders className="w-3.5 h-3.5" />
                                      <span>Manage Plan</span>
                                    </button>

                                    {/* Deactivate / Activate Button */}
                                    {isDeactivated ? (
                                      <button
                                        onClick={() => handleToggleCompanyActive(c, true)}
                                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold text-xs transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                                        title="Reactivate company organization and restore user login access"
                                      >
                                        <Power className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Activate</span>
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleToggleCompanyActive(c, false)}
                                        className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                                        title="Deactivate company organization and block user login access"
                                      >
                                        <PowerOff className="w-3.5 h-3.5 text-rose-600" />
                                        <span>Deactivate</span>
                                      </button>
                                    )}

                                    <button
                                      onClick={() => handleToggleCompanyVerification(c)}
                                      className={`p-1.5 rounded-lg border text-xs transition-colors ${c.is_verified
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                          : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                                        }`}
                                      title={c.is_verified ? 'Verified Company (Click to unverify)' : 'Unverified (Click to verify)'}
                                    >
                                      {c.is_verified ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 3. PAYMENT TRANSACTIONS AUDIT TAB */}
            {activeTab === 'payments' && (
              <div className="space-y-4">
                {/* Header & Filter */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-sm text-slate-900">Payment Transactions Ledger</span>
                    <span className="text-xs text-slate-500">({filteredPayments.length} records)</span>
                  </div>

                  <select
                    value={paymentPlanFilter}
                    onChange={(e) => setPaymentPlanFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:bg-white"
                  >
                    <option value="">All Plans</option>
                    <option value="FREE">Free Plan</option>
                    <option value="PLAN_4999">Standard Role Plan (₹4,999)</option>
                    <option value="PLAN_14999">Growth Scale Plan (₹14,999)</option>
                  </select>
                </div>

                {/* Payments Table */}
                <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        <tr>
                          <th className="py-3.5 px-4">TX ID & Date</th>
                          <th className="py-3.5 px-4">Company & User</th>
                          <th className="py-3.5 px-4">Plan Selected</th>
                          <th className="py-3.5 px-4">Amount</th>
                          <th className="py-3.5 px-4">Razorpay Order & Payment ID</th>
                          <th className="py-3.5 px-4 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredPayments.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="py-12 text-center text-slate-400">
                              No payment transactions found.
                            </td>
                          </tr>
                        ) : (
                          filteredPayments.map((tx) => (
                            <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                              {/* TX ID & Date */}
                              <td className="py-3.5 px-4">
                                <div className="font-mono font-bold text-slate-900">#TX-{tx.id}</div>
                                <div className="text-[11px] text-slate-500">
                                  {tx.created_at ? new Date(tx.created_at).toLocaleString() : 'N/A'}
                                </div>
                              </td>

                              {/* Company */}
                              <td className="py-3.5 px-4">
                                <div className="font-semibold text-slate-900">{tx.company_name}</div>
                                <div className="text-[11px] text-slate-500">{tx.user_email || 'Direct Admin'}</div>
                              </td>

                              {/* Plan */}
                              <td className="py-3.5 px-4">
                                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${PLAN_INFO[tx.plan_id]?.badgeClass || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                  {tx.plan_name}
                                </span>
                              </td>

                              {/* Amount */}
                              <td className="py-3.5 px-4">
                                <div className="font-extrabold text-emerald-600 text-sm">{tx.amount_display}</div>
                              </td>

                              {/* Gateway Identifiers */}
                              <td className="py-3.5 px-4">
                                <div className="space-y-1 font-mono text-[11px]">
                                  {tx.razorpay_payment_id && (
                                    <div className="flex items-center gap-1 text-slate-700">
                                      <span className="text-slate-400">PID:</span>
                                      <span>{tx.razorpay_payment_id}</span>
                                      <button
                                        onClick={() => handleCopy(tx.razorpay_payment_id, `pid-${tx.id}`)}
                                        className="text-slate-400 hover:text-slate-600"
                                      >
                                        {copiedId === `pid-${tx.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                      </button>
                                    </div>
                                  )}
                                  {tx.razorpay_order_id && (
                                    <div className="flex items-center gap-1 text-slate-600">
                                      <span className="text-slate-400">OID:</span>
                                      <span>{tx.razorpay_order_id}</span>
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* Status */}
                              <td className="py-3.5 px-4 text-right">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${tx.status === 'SUCCESS'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                  }`}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                  {tx.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 4. CANDIDATES DIRECTORY TAB */}
            {activeTab === 'candidates' && (
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm">
                  <div className="relative w-full sm:w-96">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search candidates by name, email, skills, city..."
                      value={candidateSearch}
                      onChange={(e) => setCandidateSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    Showing {filteredCandidates.length} of {candidates.length} candidates
                  </div>
                </div>

                {/* Candidate Table */}
                <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        <tr>
                          <th className="py-3.5 px-4">Candidate</th>
                          <th className="py-3.5 px-4">Contact</th>
                          <th className="py-3.5 px-4">Skills & Profile</th>
                          <th className="py-3.5 px-4">Applications</th>
                          <th className="py-3.5 px-4">Resume</th>
                          <th className="py-3.5 px-4 text-right">Verification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredCandidates.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="py-12 text-center text-slate-400">
                              No candidates found matching query.
                            </td>
                          </tr>
                        ) : (
                          filteredCandidates.map((cd) => (
                            <tr key={cd.id} className="hover:bg-slate-50/70 transition-colors">
                              {/* Candidate Info */}
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-900 text-sm">{cd.full_name}</div>
                                <div className="text-[11px] text-blue-600 font-medium">{cd.title || 'Candidate'}</div>
                                <div className="text-[10px] text-slate-400">{cd.city || cd.place || 'India'}</div>
                              </td>

                              {/* Contact */}
                              <td className="py-3.5 px-4">
                                <div className="text-slate-800 font-medium">{cd.email}</div>
                                <div className="text-[11px] text-slate-500">{cd.phone || 'No phone'}</div>
                              </td>

                              {/* Skills */}
                              <td className="py-3.5 px-4 max-w-xs">
                                <div className="flex flex-wrap gap-1">
                                  {Array.isArray(cd.skills) && cd.skills.slice(0, 3).map((s, idx) => (
                                    <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px]">
                                      {typeof s === 'string' ? s : s.name || 'Skill'}
                                    </span>
                                  ))}
                                  {Array.isArray(cd.skills) && cd.skills.length > 3 && (
                                    <span className="text-[10px] text-slate-400">+{cd.skills.length - 3}</span>
                                  )}
                                </div>
                              </td>

                              {/* Applications count */}
                              <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                                {cd.applications_count} applied
                              </td>

                              {/* Resume Link */}
                              <td className="py-3.5 px-4">
                                {cd.resume_url ? (
                                  <a
                                    href={cd.resume_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors shadow-xs"
                                  >
                                    <FileText className="w-3 h-3" />
                                    <span>Resume</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">No file</span>
                                )}
                              </td>

                              {/* Verification Toggle */}
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  onClick={() => handleToggleCandidateVerification(cd)}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${cd.is_verified
                                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
                                    }`}
                                >
                                  {cd.is_verified ? (
                                    <>
                                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Verified</span>
                                    </>
                                  ) : (
                                    <>
                                      <UserX className="w-3.5 h-3.5 text-slate-400" />
                                      <span>Verify</span>
                                    </>
                                  )}
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 5. RECRUITERS & STAFF DIRECTORY TAB */}
            {activeTab === 'recruiters' && (
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm">
                  <div className="relative w-full sm:w-96">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search recruiters by name, email, company..."
                      value={recruiterSearch}
                      onChange={(e) => setRecruiterSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    Showing {filteredRecruiters.length} recruiter accounts
                  </div>
                </div>

                {/* Recruiter Table */}
                <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        <tr>
                          <th className="py-3.5 px-4">Recruiter / Staff</th>
                          <th className="py-3.5 px-4">Role & Title</th>
                          <th className="py-3.5 px-4">Company Affiliation</th>
                          <th className="py-3.5 px-4">Company Plan</th>
                          <th className="py-3.5 px-4">Contact</th>
                          <th className="py-3.5 px-4 text-right">Verification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredRecruiters.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="py-12 text-center text-slate-400">
                              No recruiters found.
                            </td>
                          </tr>
                        ) : (
                          filteredRecruiters.map((r) => (
                            <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                              {/* Recruiter */}
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-900 text-sm">{r.name}</div>
                                <div className="text-[11px] text-slate-500">{r.email}</div>
                              </td>

                              {/* Role */}
                              <td className="py-3.5 px-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${r.role === 'ADMIN'
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                    : r.role === 'RECRUITER'
                                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  }`}>
                                  {r.role}
                                </span>
                                <div className="text-[11px] text-slate-500 mt-0.5">{r.title}</div>
                              </td>

                              {/* Company */}
                              <td className="py-3.5 px-4">
                                <div className="font-semibold text-slate-900">{r.company_name}</div>
                                <div className="text-[10px] text-slate-400">ID #{r.company_id}</div>
                              </td>

                              {/* Company Plan */}
                              <td className="py-3.5 px-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${PLAN_INFO[r.company_plan]?.badgeClass || ''}`}>
                                  {PLAN_INFO[r.company_plan]?.name || r.company_plan}
                                </span>
                              </td>

                              {/* Contact */}
                              <td className="py-3.5 px-4">
                                <div className="text-slate-800">{r.phone || 'No phone'}</div>
                                <div className="text-[10px] text-slate-400">{r.place || 'Remote'}</div>
                              </td>

                              {/* Verification */}
                              <td className="py-3.5 px-4 text-right">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${r.is_verified ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                                  }`}>
                                  {r.is_verified ? 'Verified' : 'Pending'}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* VENDORS & CUSTOM TENANT ONBOARDING TAB */}
            {activeTab === 'vendors' && (
              <VendorOnboardingTab
                triggerToast={triggerToast}
                onCountChange={setVendorCount}
              />
            )}
          </>
        )}
      </main>

      {/* PLAN OVERRIDE & MANAGEMENT MODAL */}
      {modalOpen && selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200/90 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <span>Manage Subscription Plan</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedCompany.company_name} ({selectedCompany.business_email})
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handlePlanSubmit} className="space-y-4">
              {/* Select Plan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Subscription Plan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'FREE', name: 'Free Starter', price: '₹0' },
                    { id: 'PLAN_4999', name: 'Standard (45d)', price: '₹4,999' },
                    { id: 'PLAN_14999', name: 'Growth Scale', price: '₹14,999' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        let roles = 1;
                        let jobs = 1;
                        let cands = 15;
                        if (p.id === 'PLAN_4999') { roles = 2; jobs = 4; cands = 50; }
                        else if (p.id === 'PLAN_14999') { roles = 4; jobs = 8; cands = 200; }
                        setPlanForm(prev => ({
                          ...prev,
                          plan_type: p.id,
                          max_roles: roles,
                          max_jobs: jobs,
                          max_candidates_per_job: cands
                        }));
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${planForm.plan_type === p.id
                          ? 'border-blue-600 bg-blue-50/80 text-blue-900 ring-1 ring-blue-500'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white'
                        }`}
                    >
                      <div className="font-bold text-xs">{p.name}</div>
                      <div className="text-sm font-extrabold text-blue-600">{p.price}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Status and Extend Days */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Plan Status
                  </label>
                  <select
                    value={planForm.plan_status}
                    onChange={(e) => setPlanForm({ ...planForm, plan_status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="ACTIVE">ACTIVE (Enabled)</option>
                    <option value="DEACTIVATED">DEACTIVATED (Login Blocked)</option>
                    <option value="EXPIRED">EXPIRED</option>
                    <option value="PENDING">PENDING</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Extend Validity (+Days)
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      min="0"
                      value={planForm.extend_days}
                      onChange={(e) => setPlanForm({ ...planForm, extend_days: Number(e.target.value) })}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                    />
                    {[30, 45].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setPlanForm({ ...planForm, extend_days: d })}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-700"
                      >
                        +{d}d
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Custom Limits */}
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
                <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-600" />
                  <span>Customize Entitlement Limits</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Max Roles</label>
                    <input
                      type="number"
                      min="1"
                      value={planForm.max_roles}
                      onChange={(e) => setPlanForm({ ...planForm, max_roles: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Max Jobs</label>
                    <input
                      type="number"
                      min="1"
                      value={planForm.max_jobs}
                      onChange={(e) => setPlanForm({ ...planForm, max_jobs: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Candidates/Job</label>
                    <input
                      type="number"
                      min="5"
                      value={planForm.max_candidates_per_job}
                      onChange={(e) => setPlanForm({ ...planForm, max_candidates_per_job: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {modalSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Apply & Activate Plan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PLAN TEMPLATE MODAL */}
      {editTemplateModalOpen && editingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white border border-slate-200/90 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-blue-600" />
                    <span>Edit Plan Template: {templateForm.name}</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {editingTemplate.id}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Update plan pricing, entitlements, duration, feature bullets, and sidebar menu permissions per role
                </p>
              </div>
              <button
                onClick={() => setEditTemplateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSavePlanTemplate} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              {/* Row 1: Name and Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Plan Display Name</label>
                  <input
                    type="text"
                    required
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                    placeholder="e.g. Standard Role Plan"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={templateForm.badge}
                    onChange={(e) => setTemplateForm({ ...templateForm, badge: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                    placeholder="e.g. MOST POPULAR / TIER 1"
                  />
                </div>
              </div>

              {/* Row 2: Price and Billing */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Price (₹ INR)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={templateForm.price}
                    onChange={(e) => {
                      const p = Number(e.target.value);
                      setTemplateForm({
                        ...templateForm,
                        price: p,
                        price_display: p === 0 ? '₹0' : `₹${p.toLocaleString()}`
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                    placeholder="4999"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Price Display Text</label>
                  <input
                    type="text"
                    required
                    value={templateForm.price_display}
                    onChange={(e) => setTemplateForm({ ...templateForm, price_display: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                    placeholder="₹4,999"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Cycle Label</label>
                  <input
                    type="text"
                    value={templateForm.billing}
                    onChange={(e) => setTemplateForm({ ...templateForm, billing: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                    placeholder="per role / 45 days"
                  />
                </div>
              </div>

              {/* Row 3: Validity Days & Popular flag */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Validity (Days)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={templateForm.duration_days}
                    onChange={(e) => setTemplateForm({ ...templateForm, duration_days: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                    placeholder="45"
                  />
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={templateForm.is_popular}
                      onChange={(e) => setTemplateForm({ ...templateForm, is_popular: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 bg-white border-slate-300 focus:ring-0 cursor-pointer"
                    />
                    <span>Highlight as Popular / Recommended Plan</span>
                  </label>
                </div>
              </div>

              {/* Entitlement Limits Box */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
                <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-600" />
                  <span>Entitlement & Hiring Quotas</span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Max Staff Roles</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={templateForm.max_roles}
                      onChange={(e) => setTemplateForm({ ...templateForm, max_roles: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Max Active Jobs</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={templateForm.max_jobs}
                      onChange={(e) => setTemplateForm({ ...templateForm, max_jobs: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Visible Cands / Job</label>
                    <input
                      type="number"
                      min="5"
                      required
                      value={templateForm.max_candidates_per_job}
                      onChange={(e) => setTemplateForm({ ...templateForm, max_candidates_per_job: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* ROLE-BASED SIDEBAR FEATURE ACCESS CONFIGURATION */}
              <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-blue-600" />
                      <span>Sidebar Navigation Access by Role</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Tick items to unlock for subscribers of this plan. Unticked items show a lock (🔒) and prompt the user to upgrade.
                    </p>
                  </div>

                  {/* Role Tabs Selector */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
                    {[
                      { key: 'ADMIN', label: 'Administrator', total: 10, count: templateForm.sidebar_access?.ADMIN?.length || 0 },
                      { key: 'RECRUITER', label: 'Recruiter', total: 11, count: templateForm.sidebar_access?.RECRUITER?.length || 0 },
                      { key: 'MANAGER', label: 'Hiring Manager', total: 7, count: templateForm.sidebar_access?.MANAGER?.length || 0 },
                    ].map(r => (
                      <button
                        key={r.key}
                        type="button"
                        onClick={() => setTemplateRoleTab(r.key)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          templateRoleTab === r.key
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <span>{r.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          templateRoleTab === r.key
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {r.count}/{r.total}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subheader: Quick select & count */}
                <div className="flex items-center justify-between text-xs">
                  <div className="text-slate-600">
                    <span className="font-semibold text-slate-900">
                      {templateForm.sidebar_access?.[templateRoleTab]?.length || 0}
                    </span> of {SIDEBAR_FEATURE_OPTIONS[templateRoleTab]?.length || 0} features unlocked for {templateRoleTab === 'ADMIN' ? 'Administrator' : templateRoleTab === 'RECRUITER' ? 'Recruiter' : 'Hiring Manager'}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => selectAllSidebarItems(templateRoleTab, true)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-[11px] font-semibold transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => selectAllSidebarItems(templateRoleTab, false)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-[11px] font-semibold transition-colors"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                {/* Interactive Checkbox Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                  {(SIDEBAR_FEATURE_OPTIONS[templateRoleTab] || []).map((item) => {
                    const isChecked = templateForm.sidebar_access?.[templateRoleTab]?.includes(item.key);
                    const ItemIcon = item.icon || CheckCircle2;

                    return (
                      <div
                        key={item.key}
                        onClick={() => toggleSidebarItem(templateRoleTab, item.key)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-2.5 ${
                          isChecked
                            ? 'bg-white border-blue-300 ring-1 ring-blue-500/20 shadow-xs'
                            : 'bg-white/60 border-slate-200 opacity-75 hover:opacity-100 hover:border-slate-300'
                        }`}
                      >
                        {/* Custom styled checkbox indicator */}
                        <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors ${
                          isChecked
                            ? 'bg-blue-600 text-white'
                            : 'border border-slate-300 bg-white text-transparent'
                        }`}>
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className={`text-xs font-bold truncate flex items-center gap-1.5 ${
                              isChecked ? 'text-slate-900' : 'text-slate-600'
                            }`}>
                              <ItemIcon className={`w-3.5 h-3.5 shrink-0 ${isChecked ? 'text-blue-600' : 'text-slate-400'}`} />
                              <span>{item.label}</span>
                            </span>
                            {isChecked ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded shrink-0 flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5" /> Open
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded shrink-0 flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" /> Locked
                              </span>
                            )}
                          </div>
                          <p className="text-[10.5px] text-slate-500 leading-tight line-clamp-1">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Feature Bullet Points */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">Marketing Bullet Points (Pricing Cards)</label>
                  <button
                    type="button"
                    onClick={handleAddFeatureBullet}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Bullet Point</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {templateForm.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={feat}
                        onChange={(e) => handleUpdateFeatureBullet(idx, e.target.value)}
                        placeholder="Feature point description..."
                        className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveFeatureBullet(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Remove bullet point"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditTemplateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={templateSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {templateSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving Plan Template...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Save Plan Template Changes</span>
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
