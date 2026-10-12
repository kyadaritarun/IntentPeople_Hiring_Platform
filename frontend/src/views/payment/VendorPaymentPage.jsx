import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import {
  ShieldCheck,
  CreditCard,
  Building2,
  CheckCircle2,
  Lock,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Clock,
  Briefcase,
  Users,
  Eye,
  Globe,
  Layers,
  Sparkles,
  Zap,
  CheckCheck,
  BadgeCheck,
  CheckCircle
} from 'lucide-react';

export default function VendorPaymentPage({ token: propToken, onLoginRedirect }) {
  // Extract token from prop or URL
  const [token, setToken] = useState(() => {
    if (propToken) return propToken;
    const pathParts = window.location.pathname.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart && lastPart !== 'vendor-pay') return lastPart;
    const queryToken = new URLSearchParams(window.location.search).get('token');
    return queryToken || '';
  });

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState('');

  // Checkout state
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [portalUrl, setPortalUrl] = useState('');
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    if (!token) {
      setError('Missing invitation token in checkout URL.');
      setLoading(false);
      return;
    }

    let isMounted = true;
    api.verifyVendorPaymentToken(token)
      .then((data) => {
        if (!isMounted) return;
        setInvitation(data);
        if (data.is_paid) {
          setPaymentSuccess(true);
          setPortalUrl(data.portal_domain ? `https://${data.portal_domain}` : `/tenant/${data.subdomain}`);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'The invitation link is invalid or has expired. Please contact your Super Administrator.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [token]);

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2200);
  };

  const handleCompletePayment = async (method = 'INSTANT') => {
    setProcessing(true);
    setError('');

    try {
      // 1. If Razorpay is available and price > 0, attempt Razorpay checkout if window.Razorpay loaded
      if (invitation?.price > 0 && window.Razorpay && invitation?.razorpay_key_id) {
        try {
          const order = await api.createVendorCheckoutOrder(token);
          const options = {
            key: invitation.razorpay_key_id,
            amount: order.amount_paise,
            currency: order.currency || 'INR',
            name: 'IntentPeople Recruitment Portal',
            description: `Onboarding Package for ${invitation.company_name}`,
            order_id: order.order_id,
            handler: async (response) => {
              const res = await api.completeVendorCheckout(token, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                payment_method: 'RAZORPAY'
              });
              setCredentials(res.credentials);
              setPortalUrl(res.portal_url || `https://${invitation.subdomain}.intentpeople.com`);
              setPaymentSuccess(true);
              setProcessing(false);
            },
            prefill: {
              name: invitation.vendor_name,
              email: invitation.vendor_email,
            },
            theme: { color: '#4F46E5' }
          };
          const rzp = new window.Razorpay(options);
          rzp.open();
          return;
        } catch (rzpErr) {
          console.warn('Razorpay order fallback:', rzpErr);
          // Fall through to instant checkout
        }
      }

      // 2. Default/Instant Secure Payment
      const res = await api.completeVendorCheckout(token, {
        payment_method: method
      });

      setCredentials(res.credentials);
      setPortalUrl(res.portal_url || `https://${invitation?.subdomain}.intentpeople.com`);
      setPaymentSuccess(true);
    } catch (err) {
      setError(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // LOADING STATE
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-600">Verifying secure onboarding package...</p>
        <p className="text-xs text-slate-400 mt-1">IntentPeople Enterprise Portal Provisioning</p>
      </div>
    );
  }

  // ERROR STATE
  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 border border-rose-200 text-rose-500 flex items-center justify-center mb-5">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Invalid Invitation Link</h2>
          <p className="text-xs text-slate-600 leading-relaxed mb-6">{error}</p>
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white transition-all shadow-sm"
          >
            Return to Homepage
          </a>
        </div>
      </div>
    );
  }

  // SUCCESS / ACTIVATED STATE
  if (paymentSuccess) {
    const credEmail = credentials?.email || invitation?.vendor_email;
    const credPassword = credentials?.password || '••••••••';
    const cleanTenantSlug = invitation?.subdomain || '';

    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4 sm:p-8 font-sans">
        <div className="max-w-xl w-full bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          {/* Subtle top ambient glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-emerald-500/10 blur-3xl pointer-events-none" />

          {/* Badge */}
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-xs">
            <CheckCheck className="w-8 h-8" />
          </div>

          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 mb-3">
              <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
              Payment Confirmed & Verified
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Portal Provisioned Successfully!
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
              Your dedicated recruitment portal for <span className="text-slate-900 font-bold">{invitation?.company_name}</span> is live.
              Credentials have also been emailed to <span className="text-slate-800 font-mono font-medium">{credEmail}</span>.
            </p>
          </div>

          {/* Dedicated Subdomain Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Your Dedicated Portal Address</p>
              <p className="text-sm sm:text-base font-mono font-bold text-sky-700 mt-0.5">
                https://{invitation?.subdomain}.intentpeople.com
              </p>
            </div>
            <button
              onClick={() => handleCopy(`https://${invitation?.subdomain}.intentpeople.com`, 'subdomain')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-200 transition-all shrink-0 self-start sm:self-auto shadow-xs"
            >
              {copiedField === 'subdomain' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied URL</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy URL</span>
                </>
              )}
            </button>
          </div>

          {/* Generated Credentials Card */}
          <div className="bg-gradient-to-br from-indigo-50/60 via-slate-50 to-blue-50/50 border border-indigo-100 rounded-2xl p-5 mb-8 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-indigo-100/80">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Master Admin Credentials</span>
              </div>
              <span className="text-[10px] text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full font-bold border border-amber-200">
                Keep Secure
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Login Email (User ID)</span>
                  <span className="font-mono text-slate-900 text-sm font-semibold">{credEmail}</span>
                </div>
                <button
                  onClick={() => handleCopy(credEmail, 'email')}
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 transition-all"
                  title="Copy Email"
                >
                  {copiedField === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Temporary Master Password</span>
                  <span className="font-mono text-amber-700 text-sm font-bold tracking-wider">{credPassword}</span>
                </div>
                <button
                  onClick={() => handleCopy(credPassword, 'password')}
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 transition-all"
                  title="Copy Password"
                >
                  {copiedField === 'password' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => {
                if (onLoginRedirect) {
                  onLoginRedirect(invitation?.subdomain);
                } else {
                  window.location.href = `/tenant/${invitation?.subdomain}`;
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <span>Go to {invitation?.company_name} Portal & Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href={`https://${invitation?.subdomain}.intentpeople.com`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-xs transition-colors border border-slate-200"
            >
              <Globe className="w-3.5 h-3.5 text-sky-600" />
              <span>Open https://{invitation?.subdomain}.intentpeople.com in New Tab</span>
              <ExternalLink className="w-3 h-3 text-slate-400 ml-1" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // MAIN CHECKOUT & PACKAGE OVERVIEW SCREEN (LIGHT / WHITE THEME)
  const priceDisplay = invitation?.price_display || `₹${invitation?.price?.toLocaleString()}`;
  const sidebar = invitation?.sidebar_access || {};
  const adminCount = Array.isArray(sidebar.ADMIN) ? sidebar.ADMIN.length : 10;
  const recruiterCount = Array.isArray(sidebar.RECRUITER) ? sidebar.RECRUITER.length : 11;
  const managerCount = Array.isArray(sidebar.HIRING_MANAGER) ? sidebar.HIRING_MANAGER.length : (Array.isArray(sidebar.MANAGER) ? sidebar.MANAGER.length : 7);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans selection:bg-indigo-500 selection:text-white antialiased">

      {/* Top Header */}
      <header className="border-b border-slate-200/90 bg-white/95 backdrop-blur-md px-6 py-4 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="IntentPeople" className="h-7 sm:h-8 w-auto object-contain" />
            <span className="text-[10px] font-extrabold tracking-widest uppercase bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-2.5 py-0.5 rounded-full">
              Vendor Onboarding
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-emerald-50/80 border border-emerald-200/70 px-3 py-1 rounded-full shadow-2xs">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-emerald-800 font-semibold">256-Bit SSL Encrypted Checkout</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Package Overview & Entitlements (7 cols) */}
          <div className="lg:col-span-7 space-y-6">

            {/* Hero Card */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
              {/* Soft ambient gradient overlay */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-100/50 via-blue-50/30 to-transparent rounded-full blur-3xl pointer-events-none" />

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 border border-indigo-200/60 mb-3 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Custom Enterprise Onboarding Package</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Dedicated Recruitment Portal for {invitation?.company_name}
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 mt-2.5 leading-relaxed">
                Prepared by the Super Administrator for <strong className="text-slate-900 font-semibold">{invitation?.vendor_name}</strong> ({invitation?.vendor_email}).
                Includes private white-labeled subdomain routing, tailored hiring quotas, and custom role permissions.
              </p>

              {/* Assigned Tenant Subdomain Callout */}
              <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky-50/90 via-blue-50/40 to-indigo-50/30 border border-sky-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white text-sky-600 border border-sky-200 shadow-xs flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                      Assigned Tenant Subdomain
                    </span>
                    <span className="text-sm sm:text-base font-mono font-bold text-sky-700">
                      https://{invitation?.subdomain}.intentpeople.com
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => handleCopy(`https://${invitation?.subdomain}.intentpeople.com`, 'subdomain')}
                    className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 shadow-2xs transition-all"
                    title="Copy Domain URL"
                  >
                    {copiedField === 'subdomain' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-100/90 text-emerald-800 border border-emerald-200/80 shadow-2xs shrink-0 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    Reserved
                  </span>
                </div>
              </div>
            </div>

            {/* Quotas & Capacity Grid */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Included Entitlements & Hiring Quotas</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Active Jobs */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-blue-50/70 to-white border border-blue-100/90 hover:border-blue-200 transition-all shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100/90 text-blue-600 flex items-center justify-center">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Jobs</span>
                  </div>
                  <div className="text-3xl font-black text-slate-900 mt-1">{invitation?.max_jobs}</div>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Active Job Postings</p>
                </div>

                {/* Team / Staff Seats */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-indigo-50/70 to-white border border-indigo-100/90 hover:border-indigo-200 transition-all shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100/90 text-indigo-600 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Team</span>
                  </div>
                  <div className="text-3xl font-black text-slate-900 mt-1">{invitation?.max_roles}</div>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Recruiter / Staff Seats</p>
                </div>

                {/* Visible Candidates */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-emerald-50/70 to-white border border-emerald-100/90 hover:border-emerald-200 transition-all shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100/90 text-emerald-600 flex items-center justify-center">
                      <Eye className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Candidates</span>
                  </div>
                  <div className="text-3xl font-black text-slate-900 mt-1">{invitation?.max_candidates_per_job}</div>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Visible / Job Pipeline</p>
                </div>
              </div>
            </div>

            {/* Sidebar Navigation Modules Enabled */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Role-Based Navigation Access Granted By Superadmin</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between shadow-2xs">
                  <span className="text-slate-700 font-semibold">Admin Modules</span>
                  <span className="px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-mono font-bold text-xs">
                    {adminCount} Active
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between shadow-2xs">
                  <span className="text-slate-700 font-semibold">Recruiter Modules</span>
                  <span className="px-2.5 py-0.5 rounded-md bg-sky-100 text-sky-800 font-mono font-bold text-xs">
                    {recruiterCount} Active
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between shadow-2xs">
                  <span className="text-slate-700 font-semibold">Manager Modules</span>
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-mono font-bold text-xs">
                    {managerCount} Active
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 mt-3.5 leading-relaxed">
                When you and your team log into your dedicated portal, the navigation sidebar will dynamically conform to these granted access permissions.
              </p>
            </div>
          </div>

          {/* Right Column: Checkout & Payment Summary (5 cols) */}
          <div className="lg:col-span-5 sticky top-24">
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/70 relative">

              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-extrabold text-slate-900">Payment Summary</h2>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/70">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Direct Activation
                </span>
              </div>

              {/* Price Callout */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-slate-50 to-blue-50/60 border border-indigo-100 mb-6 shadow-2xs">
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-xs uppercase font-extrabold tracking-wider text-slate-500">Total Agreed Fee</span>
                  <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">{priceDisplay}</div>
                </div>
                <div className="flex items-center gap-2 text-xs text-indigo-900 mt-2.5 font-medium bg-white/80 py-1.5 px-3 rounded-lg border border-indigo-100/80 w-fit shadow-2xs">
                  <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>Valid for <strong>{invitation?.validity_days} Days</strong> ({invitation?.billing_note || 'Custom Vendor Recruitment Contract'})</span>
                </div>
              </div>

              {/* Line items breakdown */}
              <div className="space-y-3.5 pb-6 mb-6 border-b border-slate-200 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Organization Tenant</span>
                  <span className="font-bold text-slate-900">{invitation?.company_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Vendor Contact</span>
                  <span className="font-semibold text-slate-900">{invitation?.vendor_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Billing Account</span>
                  <span className="font-mono text-slate-700 font-medium">{invitation?.vendor_email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Custom Domain</span>
                  <span className="font-mono text-sky-700 font-bold bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200/70">
                    {invitation?.subdomain}.intentpeople.com
                  </span>
                </div>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs mb-4 flex items-center gap-2 shadow-2xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* Primary Payment Action */}
              <button
                onClick={() => handleCompletePayment('INSTANT')}
                disabled={processing}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm sm:text-base shadow-xl shadow-emerald-600/25 hover:shadow-emerald-600/35 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Payment & Provisioning Tenant...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Complete Payment of {priceDisplay}</span>
                  </>
                )}
              </button>

              <p className="text-xs text-slate-500 text-center mt-4 leading-relaxed">
                By completing payment, your credentials will be generated automatically and your organization domain <code className="text-slate-800 font-mono font-bold bg-slate-100 px-1 py-0.5 rounded">{invitation?.subdomain}.intentpeople.com</code> will be provisioned immediately.
              </p>

              {/* Trust Badges */}
              <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-center gap-3 sm:gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Instant Activation
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  Verified Merchant
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  256-Bit SSL
                </span>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
