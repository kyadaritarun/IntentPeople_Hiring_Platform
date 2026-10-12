import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../api';
import { SIDEBAR_FEATURE_OPTIONS } from './SuperadminDashboard';
import {
  Globe,
  Building2,
  Users,
  CreditCard,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Send,
  Sparkles,
  Trash2,
  Zap,
  Lock,
  Unlock,
  Layers,
  ShieldCheck,
  Eye,
  RefreshCw,
  XCircle,
  ArrowRight,
  Briefcase,
  DollarSign,
  ChevronRight
} from 'lucide-react';

export default function VendorOnboardingTab({ triggerToast, onCountChange }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [stats, setStats] = useState({
    total_invitations: 0,
    pending_payment: 0,
    active_paid: 0,
    total_revenue: 0,
    total_revenue_display: '₹0'
  });
  const [error, setError] = useState('');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Creation Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [roleTab, setRoleTab] = useState('ADMIN'); // 'ADMIN', 'RECRUITER', 'MANAGER'

  // Default initial form values
  const getInitialForm = () => ({
    vendor_name: '',
    vendor_email: '',
    vendor_phone: '',
    company_name: '',
    subdomain: '',
    price: 14999,
    currency: 'INR',
    validity_days: 45,
    billing_note: 'Custom Vendor Recruitment Contract',
    max_roles: 3,
    max_jobs: 6,
    max_candidates_per_job: 150,
    send_email_now: true,
    sidebar_access: {
      ADMIN: SIDEBAR_FEATURE_OPTIONS.ADMIN.map(item => item.key),
      RECRUITER: SIDEBAR_FEATURE_OPTIONS.RECRUITER.map(item => item.key),
      MANAGER: SIDEBAR_FEATURE_OPTIONS.MANAGER.map(item => item.key)
    }
  });

  const [formData, setFormData] = useState(getInitialForm());

  // Details Modal State (Credentials review)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState(null);

  // Fetch all vendor invitations
  const fetchInvitations = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const res = await api.getSuperadminVendorInvitations({
        q: searchQuery,
        status_filter: statusFilter
      });
      if (res) {
        setInvitations(res.invitations || []);
        if (res.stats) {
          setStats(res.stats);
          if (onCountChange) onCountChange(res.stats.total_invitations || 0);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch vendor invitations.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, statusFilter, onCountChange]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    if (triggerToast) triggerToast('Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Auto-generate subdomain slug from company name
  const handleCompanyNameChange = (e) => {
    const val = e.target.value;
    const slug = val
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    setFormData(prev => ({
      ...prev,
      company_name: val,
      subdomain: prev.subdomain ? prev.subdomain : slug
    }));
  };

  // Toggle individual sidebar module permission
  const handleToggleModule = (role, key) => {
    setFormData(prev => {
      const currentList = prev.sidebar_access?.[role] || [];
      const updated = currentList.includes(key)
        ? currentList.filter(k => k !== key)
        : [...currentList, key];
      return {
        ...prev,
        sidebar_access: {
          ...prev.sidebar_access,
          [role]: updated
        }
      };
    });
  };

  // Select all or clear all for current role
  const handleSelectAllForRole = (role, selectAll = true) => {
    setFormData(prev => {
      const allKeys = (SIDEBAR_FEATURE_OPTIONS[role] || []).map(i => i.key);
      return {
        ...prev,
        sidebar_access: {
          ...prev.sidebar_access,
          [role]: selectAll ? allKeys : []
        }
      };
    });
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.company_name.trim()) {
      setFormError('Please enter the Company / Vendor Organization Name.');
      return;
    }
    if (!formData.vendor_email.trim()) {
      setFormError('Please enter the Vendor Contact Email.');
      return;
    }
    if (!formData.subdomain.trim()) {
      setFormError('Please configure a valid subdomain slug.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createSuperadminVendorInvitation(formData);
      if (triggerToast) {
        triggerToast(`🎉 Onboarding invitation sent to ${formData.vendor_email} for ${formData.company_name}!`);
      }
      setModalOpen(false);
      setFormData(getInitialForm());
      fetchInvitations(true);
    } catch (err) {
      setFormError(err.message || 'Failed to create vendor invitation.');
    } finally {
      setSubmitting(false);
    }
  };

  // Resend invitation email
  const handleResend = async (invitationId, email) => {
    try {
      await api.resendSuperadminVendorInvitation(invitationId);
      if (triggerToast) triggerToast(`✉️ Invitation email re-sent to ${email}!`);
      fetchInvitations(true);
    } catch (err) {
      if (triggerToast) triggerToast(`❌ Error: ${err.message}`);
    }
  };

  // Simulate payment / Instant activation
  const handleSimulatePayment = async (invitationId, companyName) => {
    if (!window.confirm(`Are you sure you want to instantly activate the portal for "${companyName}"? This will create their account, provision the tenant, and send them login credentials.`)) {
      return;
    }

    try {
      const res = await api.simulateSuperadminVendorPayment(invitationId);
      if (triggerToast) triggerToast(`🚀 Organization "${companyName}" activated successfully! Credentials sent.`);
      fetchInvitations(true);
    } catch (err) {
      if (triggerToast) triggerToast(`❌ Error: ${err.message}`);
    }
  };

  // Revoke invitation
  const handleRevoke = async (invitationId, companyName) => {
    if (!window.confirm(`Are you sure you want to revoke the pending invitation for "${companyName}"?`)) {
      return;
    }

    try {
      await api.revokeSuperadminVendorInvitation(invitationId);
      if (triggerToast) triggerToast(`Revoked invitation for ${companyName}.`);
      fetchInvitations(true);
    } catch (err) {
      if (triggerToast) triggerToast(`❌ Error: ${err.message}`);
    }
  };

  // Open details modal
  const handleViewDetails = (inv) => {
    setSelectedInvitation(inv);
    setDetailsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#1E3155] via-[#243B66] to-[#1E3155] text-white p-6 sm:p-7 rounded-2xl shadow-sm border border-slate-700/50">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Globe className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Multi-Tenant Onboarding</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Vendor Portals & Custom Invitations
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Configure custom commercial pricing, validity, hiring quotas, and role-based sidebar access.
            Send vendors an email invitation with a secure payment link. Upon payment, credentials and their dedicated domain (<code className="text-sky-300 font-mono">vendor.intentpeople.com</code>) are provisioned automatically.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => fetchInvitations(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => {
              setFormData(getInitialForm());
              setFormError('');
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Vendor Invitation</span>
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Invitations</span>
            <Globe className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.total_invitations}</div>
          <p className="text-[10px] text-slate-400 mt-1">Configured vendor packages</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Paid Tenants</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{stats.active_paid}</div>
          <p className="text-[10px] text-emerald-600 font-semibold mt-1">Live provisioned portals</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Payment</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{stats.pending_payment}</div>
          <p className="text-[10px] text-amber-600 font-medium mt-1">Awaiting vendor checkout</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Custom Contract Rev</span>
            <CreditCard className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-900">{stats.total_revenue_display}</div>
          <p className="text-[10px] text-indigo-600 font-semibold mt-1">Collected from vendor portals</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by company, vendor, email, subdomain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending Payment</option>
            <option value="PAID">Paid & Active</option>
          </select>
        </div>
      </div>

      {/* Invitations Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500">Loading vendor records...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-600">{error}</div>
        ) : invitations.length === 0 ? (
          <div className="py-20 text-center px-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center mb-3">
              <Globe className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Vendor Invitations Yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Click the button below to onboard a new vendor with customized pricing, validity, hiring limits, and role access.
            </p>
            <button
              onClick={() => {
                setFormData(getInitialForm());
                setModalOpen(true);
              }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Vendor Invitation</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Organization & Contact</th>
                  <th className="py-3.5 px-4">Dedicated Subdomain</th>
                  <th className="py-3.5 px-4">Commercials</th>
                  <th className="py-3.5 px-4">Quotas</th>
                  <th className="py-3.5 px-4">Access Modules</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-normal">
                {invitations.map((inv) => {
                  const isPaid = inv.status === 'PAID';
                  const sidebar = inv.sidebar_access || {};
                  const adminCount = Array.isArray(sidebar.ADMIN) ? sidebar.ADMIN.length : 10;
                  const recruiterCount = Array.isArray(sidebar.RECRUITER) ? sidebar.RECRUITER.length : 11;
                  const managerCount = Array.isArray(sidebar.HIRING_MANAGER) ? sidebar.HIRING_MANAGER.length : (Array.isArray(sidebar.MANAGER) ? sidebar.MANAGER.length : 7);
                  const paymentUrl = `${window.location.origin}/vendor-pay/${inv.token}`;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Organization & Contact */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{inv.company_name}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5">{inv.vendor_name}</div>
                        <div className="text-[10px] font-mono text-slate-400">{inv.vendor_email}</div>
                      </td>

                      {/* Subdomain */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-sky-700 font-semibold bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200/80 w-fit">
                          <Globe className="w-3 h-3 text-sky-600" />
                          <span>{inv.subdomain}.intentpeople.com</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Tenant ID: <span className="font-mono">{inv.subdomain}</span>
                        </div>
                      </td>

                      {/* Commercials */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 text-sm">{inv.price_display}</div>
                        <div className="text-[10px] font-semibold text-indigo-600">
                          {inv.validity_days} Days Access
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{inv.billing_note}</div>
                      </td>

                      {/* Quotas */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 text-[11px]">
                          <div><strong>{inv.max_jobs}</strong> Active Jobs</div>
                          <div><strong>{inv.max_roles}</strong> Staff Seats</div>
                          <div className="text-[10px] text-slate-400">{inv.max_candidates_per_job} Cands / Job</div>
                        </div>
                      </td>

                      {/* Access Modules */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-[10px] font-mono">
                          <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200" title="Admin modules">
                            A:{adminCount}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200" title="Recruiter modules">
                            R:{recruiterCount}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200" title="Manager modules">
                            M:{managerCount}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Paid & Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Pending Payment</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Copy Payment Link */}
                          <button
                            onClick={() => handleCopy(paymentUrl, `url_${inv.id}`)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                            title="Copy Payment Checkout Link"
                          >
                            {copiedId === `url_${inv.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>

                          {/* Open Payment Page in New Tab */}
                          <a
                            href={`/vendor-pay/${inv.token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                            title="Open Payment Checkout in New Tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          {/* Resend Email */}
                          {!isPaid && (
                            <button
                              onClick={() => handleResend(inv.id, inv.vendor_email)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-indigo-600 hover:text-indigo-800 transition-colors"
                              title="Resend Invitation Email"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Simulate / Instant Activate (if pending) */}
                          {!isPaid && (
                            <button
                              onClick={() => handleSimulatePayment(inv.id, inv.company_name)}
                              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-[10px] transition-colors"
                              title="Instant 1-Click Activate & Provision"
                            >
                              Mark as Paid
                            </button>
                          )}

                          {/* View Details / Credentials Modal */}
                          {isPaid && (
                            <>
                              <button
                                onClick={() => {
                                  setFormData({
                                    vendor_name: inv.vendor_name || '',
                                    vendor_email: inv.vendor_email || '',
                                    vendor_phone: inv.vendor_phone || '',
                                    company_name: inv.company_name || '',
                                    subdomain: inv.subdomain || '',
                                    price: inv.price || 9999,
                                    currency: inv.currency || 'INR',
                                    validity_days: 30,
                                    billing_note: 'Contract Renewal & Quota Upgrade',
                                    max_roles: inv.max_roles || 3,
                                    max_jobs: inv.max_jobs || 6,
                                    max_candidates_per_job: inv.max_candidates_per_job || 150,
                                    send_email_now: true,
                                    sidebar_access: inv.sidebar_access || {
                                      ADMIN: SIDEBAR_FEATURE_OPTIONS.ADMIN.map(item => item.key),
                                      RECRUITER: SIDEBAR_FEATURE_OPTIONS.RECRUITER.map(item => item.key),
                                      MANAGER: SIDEBAR_FEATURE_OPTIONS.MANAGER.map(item => item.key)
                                    }
                                  });
                                  setModalOpen(true);
                                }}
                                className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-[10px] transition-colors"
                                title="Issue Renewal & Quota Upgrade Link for this Vendor"
                              >
                                Renew / Upgrade
                              </button>
                              <button
                                onClick={() => handleViewDetails(inv)}
                                className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-[10px] transition-colors"
                                title="View Credentials & Portal Link"
                              >
                                Credentials
                              </button>
                            </>
                          )}

                          {/* Revoke Invitation */}
                          {!isPaid && (
                            <button
                              onClick={() => handleRevoke(inv.id, inv.company_name)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Revoke Invitation"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* ========================================================================= */}
      {/* CREATE VENDOR ONBOARDING INVITATION MODAL                                */}
      {/* ========================================================================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                    <Globe className="w-4 h-4" />
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Create Vendor Onboarding & Invitation
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Configure custom price, validity, hiring limits, and role access. The vendor will receive an email payment link.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Section 1: Vendor & Tenant Identity */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1.5">
                  1. Organization & Contact Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Organization / Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Nexus Tech Talent"
                      value={formData.company_name}
                      onChange={handleCompanyNameChange}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Vendor Contact Person *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Henderson"
                      value={formData.vendor_name}
                      onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Vendor Billing / Contact Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. alex@nexustech.io"
                      value={formData.vendor_email}
                      onChange={(e) => setFormData({ ...formData, vendor_email: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Vendor Phone (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +91 98765 43210"
                      value={formData.vendor_phone}
                      onChange={(e) => setFormData({ ...formData, vendor_phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                {/* Subdomain Input with Live Preview */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    Dedicated Subdomain Slug *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      placeholder="nexustech"
                      value={formData.subdomain}
                      onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                      className="flex-1 px-3 py-2 text-xs font-mono font-bold rounded-xl bg-white border border-slate-200 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <span className="text-xs font-mono text-slate-500 font-semibold">.intentpeople.com</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Live Portal Preview: <strong className="text-sky-700 font-mono">https://{formData.subdomain || 'slug'}.intentpeople.com</strong>
                  </p>
                </div>
              </div>

              {/* Section 2: Pricing & Validity */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1.5">
                  2. Commercial Pricing & Validity Period
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Agreed Price (₹ INR) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Validity Period (Days) *
                    </label>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={formData.validity_days}
                        onChange={(e) => setFormData({ ...formData, validity_days: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-semibold"
                      >
                        <option value={30}>30 Days (1 Month)</option>
                        <option value={45}>45 Days (Standard)</option>
                        <option value={60}>60 Days (2 Months)</option>
                        <option value={90}>90 Days (Quarterly)</option>
                        <option value={180}>180 Days (Half Year)</option>
                        <option value={365}>365 Days (1 Year)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Billing Note / Contract
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Pilot Hiring Tier"
                      value={formData.billing_note}
                      onChange={(e) => setFormData({ ...formData, billing_note: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Entitlements & Hiring Quotas */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1.5">
                  3. Entitlements & Hiring Capacity Quotas
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Active Job Postings Limit
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.max_jobs}
                      onChange={(e) => setFormData({ ...formData, max_jobs: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Staff / Recruiter Seats
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.max_roles}
                      onChange={(e) => setFormData({ ...formData, max_roles: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Visible Candidates Per Job
                    </label>
                    <input
                      type="number"
                      min="5"
                      required
                      value={formData.max_candidates_per_job}
                      onChange={(e) => setFormData({ ...formData, max_candidates_per_job: parseInt(e.target.value) || 15 })}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Sidebar Navigation Access Matrix */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    4. Role-Based Sidebar Navigation Access
                  </h4>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleSelectAllForRole(roleTab, true)}
                      className="text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => handleSelectAllForRole(roleTab, false)}
                      className="text-slate-500 hover:text-slate-700 font-semibold"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Role Tabs */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                  {[
                    { key: 'ADMIN', label: 'Administrator', total: 10 },
                    { key: 'RECRUITER', label: 'Recruiter', total: 11 },
                    { key: 'MANAGER', label: 'Hiring Manager', total: 7 },
                  ].map((r) => {
                    const active = roleTab === r.key;
                    const count = formData.sidebar_access?.[r.key]?.length || 0;
                    return (
                      <button
                        key={r.key}
                        type="button"
                        onClick={() => setRoleTab(r.key)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          active
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <span>{r.label}</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${active ? 'bg-blue-100 text-blue-700 font-bold' : 'bg-slate-200 text-slate-600'}`}>
                          {count}/{r.total}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Feature Checkboxes for current role */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                  {(SIDEBAR_FEATURE_OPTIONS[roleTab] || []).map((item) => {
                    const isChecked = formData.sidebar_access?.[roleTab]?.includes(item.key);
                    const Icon = item.icon;
                    return (
                      <label
                        key={item.key}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-blue-50/70 border-blue-200 text-slate-900'
                            : 'bg-slate-50/60 border-slate-200 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleModule(roleTab, item.key)}
                          className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-xs flex items-center gap-1.5">
                            {Icon && <Icon className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                            <span className="truncate">{item.label}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{item.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Email dispatch checkbox */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Email Invitation with Payment Link</p>
                    <p className="text-[11px] text-slate-500">
                      Instantly deliver tailored package specs and checkout button to {formData.vendor_email || 'vendor email'}.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.send_email_now}
                  onChange={(e) => setFormData({ ...formData, send_email_now: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating & Dispatching...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Onboarding Invitation</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DETAILS & CREDENTIALS MODAL                                             */}
      {/* ========================================================================= */}
      {detailsModalOpen && selectedInvitation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Vendor Portal Credentials
                </h3>
              </div>
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Organization</span>
                <span className="text-sm font-bold text-slate-900">{selectedInvitation.company_name}</span>
              </div>

              <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-sky-700 block mb-0.5">Dedicated Subdomain</span>
                  <span className="font-mono text-sm font-bold text-sky-900">https://{selectedInvitation.subdomain}.intentpeople.com</span>
                </div>
                <button
                  onClick={() => handleCopy(`https://${selectedInvitation.subdomain}.intentpeople.com`, 'sub_dt')}
                  className="p-1.5 rounded-lg hover:bg-sky-100 text-sky-600"
                  title="Copy Subdomain"
                >
                  {copiedId === 'sub_dt' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Login Email (ID)</span>
                  <span className="font-mono text-sm text-slate-800">{selectedInvitation.vendor_email}</span>
                </div>
                <button
                  onClick={() => handleCopy(selectedInvitation.vendor_email, 'email_dt')}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600"
                  title="Copy Email"
                >
                  {copiedId === 'email_dt' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-700 block mb-0.5">Generated Password</span>
                  <span className="font-mono text-sm font-bold text-amber-900">
                    {selectedInvitation.generated_password || '••••••••'}
                  </span>
                </div>
                {selectedInvitation.generated_password && (
                  <button
                    onClick={() => handleCopy(selectedInvitation.generated_password, 'pwd_dt')}
                    className="p-1.5 rounded-lg hover:bg-amber-100 text-amber-700"
                    title="Copy Password"
                  >
                    {copiedId === 'pwd_dt' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <a
                href={`/tenant/${selectedInvitation.subdomain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all"
              >
                <span>Launch Vendor Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
