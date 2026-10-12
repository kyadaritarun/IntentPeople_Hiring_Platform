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
  Target,
  MapPin,
  Phone,
  Linkedin,
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
  Power,
  Camera,
  FileCheck,
  Eye,
  X
} from 'lucide-react';
import VendorOnboardingTab from './VendorOnboardingTab';

export const COMPLIANCE_DOCS_META = [
  { key: 'pan_card', label: 'Company PAN card', shortTitle: 'PAN Card', badge: 'Tax / ID', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { key: 'labour_license', label: 'Labour License', shortTitle: 'Labour License', badge: 'Statutory', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { key: 'trade_license', label: 'Trade License', shortTitle: 'Trade License', badge: 'Municipal', color: 'text-sky-700 bg-sky-50 border-sky-200' },
  { key: 'coi', label: 'Certificate of Incorporation (COI)', shortTitle: 'COI', badge: 'Corporate', color: 'text-purple-700 bg-purple-50 border-purple-200' },
  { key: 'registration_doc', label: 'Company Registration / GSTIN', shortTitle: 'Registration Doc', badge: 'Business', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
];

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

  // Verification Queue State
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [verificationStatusFilter, setVerificationStatusFilter] = useState('ALL');
  const [verificationSearch, setVerificationSearch] = useState('');
  const [inspectingCompany, setInspectingCompany] = useState(null);
  const [rejectModalCompany, setRejectModalCompany] = useState(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [previewDocModal, setPreviewDocModal] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

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
      const [statsData, compData, candData, recData, payData, plansData, verifData] = await Promise.all([
        api.getSuperadminStats().catch(err => { console.warn('Stats error:', err); return null; }),
        api.getSuperadminCompanies().catch(err => { console.warn('Companies error:', err); return []; }),
        api.getSuperadminCandidates().catch(err => { console.warn('Candidates error:', err); return []; }),
        api.getSuperadminRecruiters().catch(err => { console.warn('Recruiters error:', err); return []; }),
        api.getSuperadminPayments().catch(err => { console.warn('Payments error:', err); return []; }),
        api.getSuperadminPlanConfigs().catch(err => { console.warn('Plan configs error:', err); return []; }),
        api.getSuperadminVerificationRequests().catch(err => { console.warn('Verification requests error:', err); return []; })
      ]);

      if (statsData) setStats(statsData);
      if (Array.isArray(compData)) setCompanies(compData);
      if (Array.isArray(candData)) setCandidates(candData);
      if (Array.isArray(recData)) setRecruiters(recData);
      if (Array.isArray(payData)) setPayments(payData);
      if (Array.isArray(plansData) && plansData.length > 0) setPlanTemplates(plansData);
      if (Array.isArray(verifData)) setVerificationRequests(verifData);
    } catch (err) {
      setError('Failed to synchronize superadmin records. Please check API connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const pendingVerificationsCount = verificationRequests.filter(
    v => v.verification_status === 'UNDER_REVIEW'
  ).length;

  const handleApproveVerification = async (companyId) => {
    setActionLoadingId(companyId);
    try {
      const res = await api.approveCompanyVerification(companyId);
      triggerToast(res.message || '✨ Organization verified! Free Trial subscription unlocked.');
      if (inspectingCompany?.id === companyId) {
        setInspectingCompany(prev => ({
          ...prev,
          is_verified: true,
          verification_status: 'VERIFIED',
          plan_type: 'FREE',
          plan_status: 'ACTIVE'
        }));
      }
      await fetchData(true);
    } catch (err) {
      alert(`Approval error: ${err.message || 'Failed to approve verification'}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectVerification = async () => {
    if (!rejectModalCompany) return;
    setActionLoadingId(rejectModalCompany.id);
    try {
      const res = await api.rejectCompanyVerification(rejectModalCompany.id, rejectionReasonInput);
      triggerToast(res.message || 'Verification request rejected with feedback.');
      setRejectModalCompany(null);
      setRejectionReasonInput('');
      if (inspectingCompany?.id === rejectModalCompany.id) {
        setInspectingCompany(null);
      }
      await fetchData(true);
    } catch (err) {
      alert(`Rejection error: ${err.message || 'Failed to reject verification'}`);
    } finally {
      setActionLoadingId(null);
    }
  };

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
          <div className="flex items-center gap-3 sm:gap-3.5">
            <img
              src="/logo.svg"
              alt="IntentPeople"
              className="h-8 w-auto object-contain shrink-0"
            />
            <div className="h-7 w-px bg-slate-200 hidden sm:block" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  Superadmin Console
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium m-0">Platform Master Subscription &amp; User Control</p>
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
            {
              id: 'verifications',
              label: 'Verification Desk',
              icon: ShieldCheck,
              count: pendingVerificationsCount,
              badgeColor: pendingVerificationsCount > 0 ? 'bg-amber-500 text-white font-bold animate-pulse' : undefined
            },
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
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${tab.badgeColor ? tab.badgeColor : (isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 font-bold')
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
                              type="button"
                              onClick={() => setInspectingCompany(c)}
                              className="px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-semibold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                              title="Inspect full 6-step blueprint details"
                            >
                              <Eye className="w-3 h-3 text-indigo-600" />
                              <span>Inspect</span>
                            </button>
                            <button
                              onClick={() => openPlanModal(c)}
                              className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-semibold transition-all shadow-xs cursor-pointer"
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

            {/* 1.5 COMPANY VERIFICATION REQUESTS & KYC DESK TAB */}
            {activeTab === 'verifications' && (
              <div className="space-y-6">
                {/* Header & Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-amber-200/90 rounded-2xl p-5 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-amber-700">Awaiting Superadmin Review</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      {verificationRequests.filter(v => v.verification_status === 'UNDER_REVIEW').length}
                    </div>
                    <p className="text-[11px] text-amber-800/80 font-medium">100% profile completed &amp; submitted</p>
                  </div>

                  <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">Draft / Incomplete Profile</span>
                      <Clock className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      {verificationRequests.filter(v => !v.verification_status || v.verification_status === 'PENDING_PROFILE').length}
                    </div>
                    <p className="text-[11px] text-slate-400">Profile completion &lt; 100%</p>
                  </div>

                  <div className="bg-white border border-emerald-200/90 rounded-2xl p-5 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-700">Verified Organizations</span>
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      {verificationRequests.filter(v => v.is_verified || v.verification_status === 'VERIFIED').length}
                    </div>
                    <p className="text-[11px] text-emerald-700/80 font-medium">Free Trial / Plan Unlocked</p>
                  </div>

                  <div className="bg-white border border-rose-200/90 rounded-2xl p-5 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-rose-700">Rejected / Revisions Needed</span>
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      {verificationRequests.filter(v => v.verification_status === 'REJECTED').length}
                    </div>
                    <p className="text-[11px] text-rose-700/80 font-medium">Returned with corrective feedback</p>
                  </div>
                </div>

                {/* Search & Filter Pills */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search company name, email, industry, city..."
                      value={verificationSearch}
                      onChange={(e) => setVerificationSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                    {[
                      { id: 'ALL', label: 'All Requests' },
                      { id: 'UNDER_REVIEW', label: 'Under Review', count: verificationRequests.filter(v => v.verification_status === 'UNDER_REVIEW').length },
                      { id: 'PENDING_PROFILE', label: 'Draft Profile' },
                      { id: 'VERIFIED', label: 'Verified' },
                      { id: 'REJECTED', label: 'Rejected' },
                    ].map((filt) => (
                      <button
                        key={filt.id}
                        type="button"
                        onClick={() => setVerificationStatusFilter(filt.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${verificationStatusFilter === filt.id
                            ? 'bg-[#1E3155] text-white border-[#1E3155] shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                      >
                        <span>{filt.label}</span>
                        {filt.count !== undefined && filt.count > 0 && (
                          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${verificationStatusFilter === filt.id ? 'bg-amber-400 text-slate-900' : 'bg-amber-100 text-amber-800'
                            }`}>
                            {filt.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Verification Queue List Cards */}
                <div className="space-y-3">
                  {verificationRequests.filter((v) => {
                    if (verificationStatusFilter !== 'ALL') {
                      if (verificationStatusFilter === 'VERIFIED') {
                        if (!v.is_verified && v.verification_status !== 'VERIFIED') return false;
                      } else if (v.verification_status !== verificationStatusFilter) {
                        return false;
                      }
                    }
                    if (verificationSearch) {
                      const q = verificationSearch.toLowerCase();
                      const match =
                        v.company_name?.toLowerCase().includes(q) ||
                        v.business_email?.toLowerCase().includes(q) ||
                        v.industry?.toLowerCase().includes(q) ||
                        v.location?.toLowerCase().includes(q);
                      if (!match) return false;
                    }
                    return true;
                  }).length === 0 ? (
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-2xs">
                      <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <h4 className="text-sm font-bold text-slate-800">No organizations found</h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        No verification requests match the selected status filter or search query.
                      </p>
                    </div>
                  ) : (
                    verificationRequests.filter((v) => {
                      if (verificationStatusFilter !== 'ALL') {
                        if (verificationStatusFilter === 'VERIFIED') {
                          if (!v.is_verified && v.verification_status !== 'VERIFIED') return false;
                        } else if (v.verification_status !== verificationStatusFilter) {
                          return false;
                        }
                      }
                      if (verificationSearch) {
                        const q = verificationSearch.toLowerCase();
                        const match =
                          v.company_name?.toLowerCase().includes(q) ||
                          v.business_email?.toLowerCase().includes(q) ||
                          v.industry?.toLowerCase().includes(q) ||
                          v.location?.toLowerCase().includes(q);
                        if (!match) return false;
                      }
                      return true;
                    }).map((company) => {
                      const docsData = company.compliance_documents_data || {};
                      const isPendingReview = company.verification_status === 'UNDER_REVIEW';

                      return (
                        <div
                          key={company.id}
                          className={`bg-white border rounded-2xl p-5 shadow-2xs transition-all hover:shadow-md ${isPendingReview ? 'border-amber-300/80 ring-1 ring-amber-300/30' : 'border-slate-200/80'
                            }`}
                        >
                          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                            {/* Company Branding & Metadata */}
                            <div className="flex items-start gap-3.5 min-w-0">
                              <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center font-bold text-slate-700 text-lg shrink-0 overflow-hidden">
                                {company.logo_url ? (
                                  <img src={company.logo_url} alt="" className="w-full h-full object-contain p-1" />
                                ) : (
                                  company.company_name?.charAt(0).toUpperCase() || 'C'
                                )}
                              </div>
                              <div className="min-w-0 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-base font-bold text-slate-900 truncate">
                                    {company.company_name}
                                  </h4>
                                  {company.verification_status === 'UNDER_REVIEW' ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/90 animate-pulse">
                                      <Clock className="w-3 h-3 text-amber-600" />
                                      Under Superadmin Review
                                    </span>
                                  ) : (company.is_verified || company.verification_status === 'VERIFIED') ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/90">
                                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                      Verified Employer
                                    </span>
                                  ) : company.verification_status === 'REJECTED' ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200/90">
                                      <AlertCircle className="w-3 h-3 text-rose-600" />
                                      Verification Rejected
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                      <Lock className="w-3 h-3 text-slate-500" />
                                      Draft Profile
                                    </span>
                                  )}

                                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                                    Plan: {company.plan_type || 'NONE'} ({company.plan_status || 'PENDING'})
                                  </span>
                                </div>

                                <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                                  <span>{company.business_email || 'No email'}</span>
                                  <span>•</span>
                                  <span>{company.phone || 'No phone'}</span>
                                  <span>•</span>
                                  <span>{company.location || 'Location not set'}</span>
                                  <span>•</span>
                                  <span>{company.industry || 'Industry not set'}</span>
                                </div>

                                {/* Rejection Feedback if rejected */}
                                {company.verification_rejection_reason && (
                                  <p className="text-xs text-rose-700 bg-rose-50/80 border border-rose-200 rounded-lg px-2.5 py-1 mt-1 font-medium">
                                    <strong>Superadmin Feedback:</strong> {company.verification_rejection_reason}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => setInspectingCompany(company)}
                                className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                <span>Inspect Docs &amp; Photos</span>
                              </button>

                              {isPendingReview && (
                                <>
                                  <button
                                    type="button"
                                    disabled={actionLoadingId === company.id}
                                    onClick={() => handleApproveVerification(company.id)}
                                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs border-none cursor-pointer disabled:opacity-50"
                                  >
                                    {actionLoadingId === company.id ? (
                                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                      <ShieldCheck className="w-3.5 h-3.5" />
                                    )}
                                    <span>Approve Free Trial</span>
                                  </button>

                                  <button
                                    type="button"
                                    disabled={actionLoadingId === company.id}
                                    onClick={() => {
                                      setRejectModalCompany(company);
                                      setRejectionReasonInput('');
                                    }}
                                    className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1.5 transition-all border border-rose-200 cursor-pointer disabled:opacity-50"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Reject</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
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
                                      type="button"
                                      onClick={() => setInspectingCompany(c)}
                                      className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold text-xs transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                                      title="Inspect full 6-step organization blueprint & submitted documents"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-indigo-600" />
                                      <span>Inspect Profile</span>
                                    </button>

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
                <div className={`grid ${selectedCompany?.plan_type === 'CUSTOM_VENDOR' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'} gap-2`}>
                  {(selectedCompany?.plan_type === 'CUSTOM_VENDOR' ? [
                    { id: 'CUSTOM_VENDOR', name: 'Dedicated Partner', price: 'Custom Agreement' },
                    { id: 'FREE', name: 'Free Starter', price: '₹0' },
                    { id: 'PLAN_4999', name: 'Standard (45d)', price: '₹4,999' },
                    { id: 'PLAN_14999', name: 'Growth Scale', price: '₹14,999' },
                  ] : [
                    { id: 'FREE', name: 'Free Starter', price: '₹0' },
                    { id: 'PLAN_4999', name: 'Standard (45d)', price: '₹4,999' },
                    { id: 'PLAN_14999', name: 'Growth Scale', price: '₹14,999' },
                  ]).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        let roles = selectedCompany?.max_roles || 2;
                        let jobs = selectedCompany?.max_jobs || 5;
                        let cands = selectedCompany?.max_candidates_per_job || 100;
                        if (p.id === 'FREE') { roles = 1; jobs = 1; cands = 15; }
                        else if (p.id === 'PLAN_4999') { roles = 2; jobs = 4; cands = 50; }
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
                        ? (p.id === 'CUSTOM_VENDOR' ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 ring-1 ring-emerald-500' : 'border-blue-600 bg-blue-50/80 text-blue-900 ring-1 ring-blue-500')
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white'
                        }`}
                    >
                      <div className="font-bold text-xs">{p.name}</div>
                      <div className={`text-sm font-extrabold ${p.id === 'CUSTOM_VENDOR' ? 'text-emerald-700' : 'text-blue-600'}`}>{p.price}</div>
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
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${templateRoleTab === r.key
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                      >
                        <span>{r.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${templateRoleTab === r.key
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
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-2.5 ${isChecked
                            ? 'bg-white border-blue-300 ring-1 ring-blue-500/20 shadow-xs'
                            : 'bg-white/60 border-slate-200 opacity-75 hover:opacity-100 hover:border-slate-300'
                          }`}
                      >
                        {/* Custom styled checkbox indicator */}
                        <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors ${isChecked
                            ? 'bg-blue-600 text-white'
                            : 'border border-slate-300 bg-white text-transparent'
                          }`}>
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className={`text-xs font-bold truncate flex items-center gap-1.5 ${isChecked ? 'text-slate-900' : 'text-slate-600'
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

      {/* ── Inspection Modal: Company Profile & 5 Compliance Documents ── */}
      {inspectingCompany && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in"
          onClick={() => setInspectingCompany(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-7 relative space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center font-bold text-slate-800 text-xl overflow-hidden shrink-0">
                  {inspectingCompany.logo_url ? (
                    <img src={inspectingCompany.logo_url} alt="" className="w-full h-full object-contain p-1" />
                  ) : (
                    inspectingCompany.company_name?.charAt(0).toUpperCase() || 'C'
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-slate-900">{inspectingCompany.company_name}</h3>
                    {inspectingCompany.verification_status === 'UNDER_REVIEW' ? (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                        Under Review
                      </span>
                    ) : (inspectingCompany.is_verified || inspectingCompany.verification_status === 'VERIFIED') ? (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Verified Employer
                      </span>
                    ) : inspectingCompany.verification_status === 'REJECTED' ? (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                        Rejected
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        Draft Profile
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {inspectingCompany.business_email} • {inspectingCompany.phone || 'No phone'} • {inspectingCompany.location || 'Location not set'} • {inspectingCompany.industry || 'Industry not set'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectingCompany(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action Decision Bar */}
            {inspectingCompany.verification_status === 'UNDER_REVIEW' && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                  <span className="text-xs font-semibold text-amber-900">
                    This organization is awaiting your verification approval to unlock their Free Trial.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={actionLoadingId === inspectingCompany.id}
                    onClick={() => handleApproveVerification(inspectingCompany.id)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs border-none cursor-pointer disabled:opacity-50"
                  >
                    {actionLoadingId === inspectingCompany.id ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    )}
                    <span>Approve &amp; Activate Free Trial</span>
                  </button>

                  <button
                    type="button"
                    disabled={actionLoadingId === inspectingCompany.id}
                    onClick={() => {
                      setRejectModalCompany(inspectingCompany);
                      setRejectionReasonInput('');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1.5 border border-rose-200 cursor-pointer disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            )}

            {/* SECTION 1: Statutory Compliance KYC Documents (5 items) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-[#5C59E8]" />
                  Statutory KYC &amp; Legal Compliance Documents
                </h4>
                <span className="text-xs font-semibold text-slate-500">
                  {COMPLIANCE_DOCS_META.filter(d => (inspectingCompany.compliance_documents_data || {})[d.key]?.file_url || (inspectingCompany.compliance_documents_data || {})[d.key]?.doc_number).length} / 5 provided (Min 2 required)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {COMPLIANCE_DOCS_META.map((doc) => {
                  const docInfo = (inspectingCompany.compliance_documents_data || {})[doc.key] || {};
                  const hasPhoto = Boolean(docInfo.file_url);

                  return (
                    <div
                      key={doc.key}
                      className="rounded-xl border border-slate-200/90 bg-slate-50/60 p-3.5 space-y-2.5 flex flex-col justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${doc.color}`}>
                            {doc.badge}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400">
                            {hasPhoto ? 'Photo Ready' : 'Pending Photo'}
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-slate-900">{doc.label}</h5>
                        <p className="text-[11px] text-slate-600 font-mono bg-white border border-slate-200 rounded px-2 py-1 truncate">
                          {docInfo.doc_number ? `No: ${docInfo.doc_number}` : 'No ID / Number specified'}
                        </p>
                      </div>

                      {/* Photo Thumbnail */}
                      <div className="pt-1">
                        {hasPhoto ? (
                          <div className="space-y-1.5">
                            <div
                              onClick={() => setPreviewDocModal({ title: doc.label, url: docInfo.file_url })}
                              className="relative aspect-video rounded-lg overflow-hidden bg-slate-900/10 border border-slate-200 cursor-pointer group"
                            >
                              <img
                                src={docInfo.file_url}
                                alt={doc.label}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold">
                                <Camera className="w-4 h-4" />
                                <span>Zoom Photo</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <button
                                type="button"
                                onClick={() => setPreviewDocModal({ title: doc.label, url: docInfo.file_url })}
                                className="text-blue-600 hover:underline font-semibold flex items-center gap-1 p-0 bg-transparent border-none cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Inspect Photo</span>
                              </button>
                              <a
                                href={docInfo.file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
                              >
                                <span>Original</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="aspect-video rounded-lg border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 text-xs">
                            <Camera className="w-5 h-5 mb-1 text-slate-300" />
                            <span>No photo scan uploaded</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION 2: Organization Profile Blueprint Breakdown (All 6 Steps) */}
            <div className="space-y-4 pt-3 border-t border-slate-200/80">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#5C59E8]" />
                    Organization Blueprint Details (All 6 Steps)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Full organizational DNA, products, buyer audience, growth roadmap, team structure, and hiring defaults.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-1 rounded-lg">
                  6 Blueprint Steps
                </span>
              </div>

              {(() => {
                const bm = {
                  customer_model: inspectingCompany.business_model,
                  product_name: inspectingCompany.product_service,
                  ...((inspectingCompany.business_model_data) || {})
                };
                const ta = {
                  target_markets: inspectingCompany.target_audience,
                  buyer_roles: inspectingCompany.ideal_customer_profile,
                  customer_problem: inspectingCompany.business_problem,
                  ...((inspectingCompany.target_audience_data) || {})
                };
                const gs = {
                  business_stage: inspectingCompany.growth_stage,
                  planning_horizon: inspectingCompany.success_horizon,
                  desired_outcomes: inspectingCompany.expected_outcome,
                  ...((inspectingCompany.growth_stage_data) || {})
                };
                const mt = {
                  team_size: inspectingCompany.team_support,
                  monthly_budget_range: inspectingCompany.monthly_budget_range,
                  decision_authority: inspectingCompany.decision_authority,
                  ...((inspectingCompany.marketing_team_data) || {})
                };
                const hd = inspectingCompany.hiring_defaults_data || {};

                const toArray = (val) => {
                  if (Array.isArray(val)) return val.filter(Boolean);
                  if (typeof val === 'string' && val.trim()) {
                    return val.split(',').map(s => s.trim()).filter(Boolean);
                  }
                  return [];
                };

                const routesToMarket = toArray(bm.route_to_market);
                const priorities = toArray(gs.business_priorities);
                const capabilities = toArray(mt.capabilities || mt.current_capabilities);
                const employmentTypes = toArray(hd.employment_types);
                const benefits = toArray(hd.benefits_perks);

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* ───────────────────────────────────────────────────────────── */}
                    {/* STEP 1: Corporate Profile & Overview                         */}
                    {/* ───────────────────────────────────────────────────────────── */}
                    <div className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50/80 transition-all space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                            1
                          </span>
                          <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-blue-600" />
                            Step 1: Corporate Profile &amp; Overview
                          </h5>
                        </div>
                        {inspectingCompany.organisation_type && (
                          <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                            {inspectingCompany.organisation_type}
                          </span>
                        )}
                      </div>

                      {/* Company Name & Business Email */}
                      <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/70 text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Company Name</span>
                          <span className="font-bold text-slate-900">{inspectingCompany.company_name}</span>
                        </div>
                        {inspectingCompany.business_email && (
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Official Email</span>
                            <span className="font-semibold text-slate-700 font-mono text-[11px]">{inspectingCompany.business_email}</span>
                          </div>
                        )}
                      </div>

                      {/* Bio */}
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200/70 space-y-1">
                        <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">Company Description &amp; Overview</span>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {inspectingCompany.about || 'No corporate description provided.'}
                        </p>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 bg-white rounded-lg border border-slate-100">
                          <span className="text-slate-400 block font-medium">Primary Industry</span>
                          <span className="font-semibold text-slate-800">
                            {inspectingCompany.primary_industry || inspectingCompany.industry || 'Not set'}
                          </span>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-slate-100">
                          <span className="text-slate-400 block font-medium">Sub-Industry</span>
                          <span className="font-semibold text-slate-800">
                            {inspectingCompany.sub_industry || 'Not set'}
                          </span>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-slate-100">
                          <span className="text-slate-400 block font-medium">Company Size</span>
                          <span className="font-semibold text-slate-800">
                            {inspectingCompany.company_size ? `${inspectingCompany.company_size} employees` : 'Not set'}
                          </span>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-slate-100">
                          <span className="text-slate-400 block font-medium">Year Founded</span>
                          <span className="font-semibold text-slate-800">
                            {inspectingCompany.year_founded ? `Est. ${inspectingCompany.year_founded}` : 'Not set'}
                          </span>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-slate-100">
                          <span className="text-slate-400 block font-medium">Headquarters</span>
                          <span className="font-semibold text-slate-800 truncate block">
                            {inspectingCompany.headquarters_location || inspectingCompany.location || 'Not set'}
                          </span>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-slate-100">
                          <span className="text-slate-400 block font-medium">Other Locations</span>
                          <span className="font-semibold text-slate-800 truncate block">
                            {inspectingCompany.other_locations || 'None listed'}
                          </span>
                        </div>
                      </div>

                      {/* Web, Phone & Social Links */}
                      <div className="flex items-center gap-3 text-[11px] pt-1 border-t border-slate-200/50 flex-wrap">
                        {inspectingCompany.website ? (
                          <a
                            href={inspectingCompany.website.startsWith('http') ? inspectingCompany.website : `https://${inspectingCompany.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#5C59E8] font-semibold hover:underline flex items-center gap-1"
                          >
                            <Globe className="w-3 h-3" />
                            Website <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">No website</span>
                        )}
                        {inspectingCompany.linkedin_url && (
                          <a
                            href={inspectingCompany.linkedin_url.startsWith('http') ? inspectingCompany.linkedin_url : `https://${inspectingCompany.linkedin_url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sky-600 font-semibold hover:underline flex items-center gap-1"
                          >
                            <Linkedin className="w-3 h-3" />
                            LinkedIn <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                        {inspectingCompany.phone && (
                          <span className="text-slate-600 font-medium flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {inspectingCompany.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ───────────────────────────────────────────────────────────── */}
                    {/* STEP 2: Products & Business Model                            */}
                    {/* ───────────────────────────────────────────────────────────── */}
                    <div className="p-4 rounded-2xl border border-slate-200/90 bg-indigo-50/30 hover:bg-indigo-50/50 transition-all space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                            2
                          </span>
                          <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-indigo-600" />
                            Step 2: Products &amp; Business Model
                          </h5>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {bm.customer_model && (
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-md border border-indigo-200">
                              {bm.customer_model}
                            </span>
                          )}
                          {bm.revenue_model && (
                            <span className="text-[10px] font-semibold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                              {bm.revenue_model}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 text-xs">
                        {bm.product_name && (
                          <div className="p-2 bg-white rounded-lg border border-indigo-100 text-[11px]">
                            <span className="text-slate-400 block font-medium">Product / Service Name(s)</span>
                            <span className="font-semibold text-indigo-950">{bm.product_name}</span>
                          </div>
                        )}

                        <div className="p-2.5 bg-white rounded-xl border border-indigo-100/80 space-y-1">
                          <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">Core Offering Description</span>
                          <p className="text-slate-800 leading-relaxed">
                            {bm.offering_description || 'No offerings description provided.'}
                          </p>
                        </div>

                        {/* Buying cycle & ACV */}
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2 bg-white rounded-lg border border-indigo-50">
                            <span className="text-slate-400 block font-medium">Buying Cycle</span>
                            <span className="font-semibold text-slate-800">{bm.buying_cycle || 'Not specified'}</span>
                          </div>
                          <div className="p-2 bg-white rounded-lg border border-indigo-50">
                            <span className="text-slate-400 block font-medium">Typical Deal Value (ACV)</span>
                            <span className="font-semibold text-slate-800">
                              {bm.purchase_value_range
                                ? `${bm.purchase_value_currency === 'USD' ? '$' : bm.purchase_value_currency === 'EUR' ? '€' : bm.purchase_value_currency === 'GBP' ? '£' : '₹'}${bm.purchase_value_range} (${bm.purchase_value_basis || 'Annual'})`
                                : 'Not specified'}
                            </span>
                          </div>
                        </div>

                        {/* Route to market */}
                        {routesToMarket.length > 0 && (
                          <div className="p-2.5 bg-white rounded-xl border border-indigo-100/80 space-y-1">
                            <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">Route to Market</span>
                            <div className="flex flex-wrap gap-1.5">
                              {routesToMarket.map((item, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10.5px] font-semibold text-indigo-800 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {bm.competitors && (
                          <div className="p-2 bg-white rounded-lg border border-indigo-50 text-[11px]">
                            <span className="text-slate-400 block font-medium">Key Competitors</span>
                            <span className="font-semibold text-slate-800">{bm.competitors}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ───────────────────────────────────────────────────────────── */}
                    {/* STEP 3: Target Audience & Buyers                             */}
                    {/* ───────────────────────────────────────────────────────────── */}
                    <div className="p-4 rounded-2xl border border-slate-200/90 bg-purple-50/30 hover:bg-purple-50/50 transition-all space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                            3
                          </span>
                          <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5 text-purple-600" />
                            Step 3: Target Audience &amp; Buyers
                          </h5>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {ta.customer_segment && (
                            <span className="text-[10px] font-bold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-md border border-purple-200">
                              {ta.customer_segment}
                            </span>
                          )}
                          {ta.market_scope && (
                            <span className="text-[10px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                              {ta.market_scope}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2.5 bg-white rounded-xl border border-purple-100 space-y-0.5">
                            <span className="text-slate-400 block font-medium">Target Geographic Markets</span>
                            <span className="font-semibold text-slate-800 block">{ta.target_markets || 'Not specified'}</span>
                          </div>
                          <div className="p-2.5 bg-white rounded-xl border border-purple-100 space-y-0.5">
                            <span className="text-slate-400 block font-medium">Buyer / Decision-Maker Roles</span>
                            <span className="font-semibold text-slate-800 block truncate">{ta.buyer_roles || 'Decision Makers'}</span>
                          </div>
                        </div>

                        <div className="p-2.5 bg-white rounded-xl border border-purple-100 space-y-1">
                          <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">Core Problem Solved</span>
                          <p className="text-slate-800 leading-relaxed">
                            {ta.customer_problem || 'No customer problem specified.'}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2 bg-white rounded-lg border border-purple-50">
                            <span className="text-slate-400 block font-medium">Target Languages</span>
                            <span className="font-semibold text-slate-800">{ta.audience_languages || 'English'}</span>
                          </div>
                          <div className="p-2 bg-white rounded-lg border border-purple-50">
                            <span className="text-slate-400 block font-medium">Customer Org Size</span>
                            <span className="font-semibold text-slate-800">{ta.customer_size ? `${ta.customer_size} employees` : 'Any size'}</span>
                          </div>
                          <div className="p-2 bg-white rounded-lg border border-purple-50">
                            <span className="text-slate-400 block font-medium">Market Positioning</span>
                            <span className="font-semibold text-slate-800">{ta.positioning || 'Standard'}</span>
                          </div>
                          <div className="p-2 bg-white rounded-lg border border-purple-50">
                            <span className="text-slate-400 block font-medium">Purchase Triggers</span>
                            <span className="font-semibold text-slate-800 truncate block">{ta.purchase_triggers || 'Growth needs'}</span>
                          </div>
                        </div>

                        {ta.buying_objections && (
                          <div className="p-2 bg-white rounded-lg border border-purple-50 text-[11px]">
                            <span className="text-slate-400 block font-medium">Common Buying Objections</span>
                            <span className="font-semibold text-slate-800">{ta.buying_objections}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ───────────────────────────────────────────────────────────── */}
                    {/* STEP 4: Growth Stage & Priorities                           */}
                    {/* ───────────────────────────────────────────────────────────── */}
                    <div className="p-4 rounded-2xl border border-slate-200/90 bg-emerald-50/30 hover:bg-emerald-50/50 transition-all space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                            4
                          </span>
                          <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                            Step 4: Growth Stage &amp; Priorities
                          </h5>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {gs.business_stage && (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                              {gs.business_stage}
                            </span>
                          )}
                          {gs.planning_horizon && (
                            <span className="text-[10px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                              {gs.planning_horizon}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2 bg-white rounded-lg border border-emerald-100">
                            <span className="text-slate-400 block font-medium">Marketing Maturity</span>
                            <span className="font-semibold text-slate-800">{gs.marketing_maturity || 'Developing'}</span>
                          </div>
                          <div className="p-2 bg-white rounded-lg border border-emerald-100">
                            <span className="text-slate-400 block font-medium">Planning Horizon</span>
                            <span className="font-semibold text-slate-800">{gs.planning_horizon || '3–6 months'}</span>
                          </div>
                        </div>

                        <div className="p-2.5 bg-white rounded-xl border border-emerald-100 space-y-1">
                          <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">Biggest Growth / Hiring Challenge</span>
                          <p className="text-slate-800 leading-relaxed">
                            {gs.marketing_challenge || 'Not specified'}
                          </p>
                        </div>

                        {priorities.length > 0 && (
                          <div className="p-2.5 bg-white rounded-xl border border-emerald-100 space-y-1.5">
                            <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">Top Business Priorities</span>
                            <div className="flex flex-wrap gap-1.5">
                              {priorities.map((item, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10.5px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {gs.desired_outcomes && (
                          <div className="p-2.5 bg-white rounded-xl border border-emerald-100 space-y-1">
                            <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">Desired Business Outcomes</span>
                            <p className="text-slate-800 leading-relaxed text-[11px]">{gs.desired_outcomes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ───────────────────────────────────────────────────────────── */}
                    {/* STEP 5: Team, Capabilities & Tools                          */}
                    {/* ───────────────────────────────────────────────────────────── */}
                    <div className="p-4 rounded-2xl border border-slate-200/90 bg-amber-50/30 hover:bg-amber-50/50 transition-all space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-amber-100">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                            5
                          </span>
                          <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-amber-600" />
                            Step 5: Team, Capabilities &amp; Tools
                          </h5>
                        </div>
                        {mt.team_size && (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                            Team: {mt.team_size}
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2 bg-white rounded-lg border border-amber-100">
                            <span className="text-slate-400 block font-medium">Leadership Structure</span>
                            <span className="font-semibold text-slate-800">{mt.leadership_structure || 'Not set'}</span>
                          </div>
                          <div className="p-2 bg-white rounded-lg border border-amber-100">
                            <span className="text-slate-400 block font-medium">Capability Ownership</span>
                            <span className="font-semibold text-slate-800">{mt.capability_ownership || 'In-house team'}</span>
                          </div>
                          <div className="p-2 bg-white rounded-lg border border-amber-100">
                            <span className="text-slate-400 block font-medium">Monthly Budget</span>
                            <span className="font-semibold text-slate-800">{mt.monthly_budget_range || 'Not specified'}</span>
                          </div>
                          <div className="p-2 bg-white rounded-lg border border-amber-100">
                            <span className="text-slate-400 block font-medium">Decision Authority</span>
                            <span className="font-semibold text-slate-800">{mt.decision_authority || 'Leadership'}</span>
                          </div>
                        </div>

                        {capabilities.length > 0 && (
                          <div className="p-2.5 bg-white rounded-xl border border-amber-100 space-y-1.5">
                            <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">Existing Capabilities</span>
                            <div className="flex flex-wrap gap-1.5">
                              {capabilities.map((item, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10.5px] font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {mt.active_channels && (
                          <div className="p-2 bg-white rounded-lg border border-amber-50 text-[11px]">
                            <span className="text-slate-400 block font-medium">Active Channels</span>
                            <span className="font-semibold text-slate-800">{mt.active_channels}</span>
                          </div>
                        )}

                        {mt.tools_used && (
                          <div className="p-2 bg-white rounded-lg border border-amber-50 text-[11px]">
                            <span className="text-slate-400 block font-medium">Core Tools &amp; Tech Stack</span>
                            <span className="font-semibold text-slate-800">{mt.tools_used}</span>
                          </div>
                        )}

                        {mt.measurement_maturity && (
                          <div className="p-2 bg-white rounded-lg border border-amber-50 text-[11px]">
                            <span className="text-slate-400 block font-medium">Measurement Maturity</span>
                            <span className="font-semibold text-slate-800">{mt.measurement_maturity}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ───────────────────────────────────────────────────────────── */}
                    {/* STEP 6: Hiring Defaults & Smart Job Cascade                 */}
                    {/* ───────────────────────────────────────────────────────────── */}
                    <div className="p-4 rounded-2xl border border-slate-200/90 bg-orange-50/30 hover:bg-orange-50/50 transition-all space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-orange-100">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-orange-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                            6
                          </span>
                          <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-orange-600" />
                            Step 6: Hiring Defaults &amp; Showcase
                          </h5>
                        </div>
                        {hd.workplace_model && (
                          <span className="text-[10px] font-bold text-orange-800 bg-orange-100 px-2 py-0.5 rounded-md border border-orange-200">
                            {hd.workplace_model}
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="p-2 bg-white rounded-lg border border-orange-100 text-[11px]">
                          <span className="text-slate-400 block font-medium">Working Hours &amp; Timezone Overlap</span>
                          <span className="font-semibold text-slate-800">{hd.working_hours_timezone || 'Standard Business Hours'}</span>
                        </div>

                        {employmentTypes.length > 0 && (
                          <div className="p-2.5 bg-white rounded-xl border border-orange-100 space-y-1.5">
                            <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">Employment Types Offered</span>
                            <div className="flex flex-wrap gap-1.5">
                              {employmentTypes.map((item, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10.5px] font-semibold text-orange-800 bg-orange-50 border border-orange-200/80 px-2 py-0.5 rounded-md"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {benefits.length > 0 && (
                          <div className="p-2.5 bg-white rounded-xl border border-orange-100 space-y-1.5">
                            <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">Employee Benefits &amp; Perks</span>
                            <div className="flex flex-wrap gap-1.5">
                              {benefits.map((item, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10.5px] font-medium text-slate-700 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {hd.why_join_us && (
                          <div className="p-2.5 bg-white rounded-xl border border-orange-100 space-y-1">
                            <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">"Why Join Us" Elevator Pitch</span>
                            <p className="text-slate-800 leading-relaxed text-[11px]">{hd.why_join_us}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2 bg-white rounded-lg border border-orange-50">
                            <span className="text-slate-400 block font-medium">Glassdoor / Review Link</span>
                            {hd.employer_review_url ? (
                              <a
                                href={hd.employer_review_url.startsWith('http') ? hd.employer_review_url : `https://${hd.employer_review_url}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-orange-700 font-semibold hover:underline truncate block"
                              >
                                {hd.employer_review_url}
                              </a>
                            ) : (
                              <span className="text-slate-400 italic">None provided</span>
                            )}
                          </div>
                          <div className="p-2 bg-white rounded-lg border border-orange-50">
                            <span className="text-slate-400 block font-medium">Accessibility Contact / Note</span>
                            <span className="font-semibold text-slate-800 truncate block">{hd.accessibility_contact || 'None specified'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setInspectingCompany(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors border-none cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Rejection Feedback Modal ── */}
      {rejectModalCompany && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in"
          onClick={() => setRejectModalCompany(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-sm font-bold text-rose-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Reject Verification Request
              </h4>
              <button
                type="button"
                onClick={() => setRejectModalCompany(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 bg-transparent border-none cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Please provide clear corrective guidance for <strong>{rejectModalCompany.company_name}</strong>. The recruiter will see this reason in their portal so they can fix their document photos or profile details.
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Corrective Feedback / Rejection Reason *
              </label>
              <textarea
                rows={4}
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="e.g. The uploaded Company PAN card photo is unclear and blurry. Please capture a clear, well-lit photo of the physical PAN card and resubmit."
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectModalCompany(null)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoadingId === rejectModalCompany.id}
                onClick={handleRejectVerification}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs border-none cursor-pointer disabled:opacity-50"
              >
                {actionLoadingId === rejectModalCompany.id ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── High-Res Photo Lightbox Modal ── */}
      {previewDocModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setPreviewDocModal(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full p-4 sm:p-5 shadow-2xl relative space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-600" />
                {previewDocModal.title} — Statutory KYC Document Scan
              </h4>
              <div className="flex items-center gap-2">
                <a
                  href={previewDocModal.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                  title="Open original file in new browser tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDocModal(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 border-none bg-transparent cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[75vh] flex items-center justify-center overflow-auto rounded-xl bg-slate-900/5 p-2">
              <img
                src={previewDocModal.url}
                alt={previewDocModal.title}
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg shadow-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
