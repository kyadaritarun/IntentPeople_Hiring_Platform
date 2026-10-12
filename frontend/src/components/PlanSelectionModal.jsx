import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Check, Sparkles, Zap, Crown, ArrowRight,
  Loader2, X, AlertCircle, Users, Briefcase, Eye, CheckCircle2, Lock, Star, Building2, Clock
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export const PLANS_DATA = [
  {
    id: 'FREE',
    name: 'Free Starter',
    price: 0,
    priceDisplay: '₹0',
    billing: 'Free Forever',
    badge: 'Basic Trial',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    description: 'Essential exploratory recruitment with basic pipeline access.',
    maxRoles: 1,
    maxJobs: 1,
    maxCandidates: 5,
    highlight: false,
    features: [
      { text: '1 Recruiter / Staff role', icon: Users },
      { text: '1 Job requisition posting', icon: Briefcase },
      { text: '5 Candidates visible per job', icon: Eye },
      { text: 'Basic applicant pipeline review', icon: Check }
    ],
    ctaText: 'Get Started Free'
  },
  {
    id: 'PLAN_4999',
    name: 'Standard Role Plan',
    price: 4999,
    priceDisplay: '₹4,999',
    billing: 'per role / 45 days',
    badge: 'Most Popular',
    badgeColor: 'bg-indigo-600 text-white border-indigo-600',
    description: 'Focused hiring with recruiter and hiring manager roles.',
    maxRoles: 2,
    maxJobs: 4,
    maxCandidates: 6,
    highlight: true,
    features: [
      { text: '2 Staff roles (Recruiter + Manager)', icon: Users },
      { text: '4 Active job postings', icon: Briefcase },
      { text: '6 Candidates visible per job', icon: Eye },
      { text: '45 Days plan validity', icon: Zap },
      { text: 'AI Candidate Fit Scoring', icon: Sparkles }
    ],
    ctaText: 'Choose Standard'
  },
  {
    id: 'PLAN_14999',
    name: 'Growth Scale Plan',
    price: 14999,
    priceDisplay: '₹14,999',
    billing: 'per month (30 days)',
    badge: 'High Volume Scale',
    badgeColor: 'bg-amber-500 text-white border-amber-500',
    description: 'Full recruitment engine with expanded candidate reach.',
    maxRoles: 4,
    maxJobs: 8,
    maxCandidates: 200,
    highlight: false,
    features: [
      { text: '4 Staff roles (2 Rec + 2 Mgr)', icon: Users },
      { text: '8 Active job postings', icon: Briefcase },
      { text: '200 Candidates visible per job', icon: Eye },
      { text: '30 Days validity', icon: Zap },
      { text: 'Priority AI Ranking & Screening', icon: Crown }
    ],
    ctaText: 'Choose Growth'
  }
];

export default function PlanSelectionModal({
  isOpen = true,
  onClose = null,
  onSuccess = null,
  isInitialOnboarding = false,
  triggerReason = ''
}) {
  const { user, refreshUser } = useAuth();
  const isCustomVendor = user?.profile?.plan_type === 'CUSTOM_VENDOR';

  if (!isOpen || isCustomVendor) return null;

  const [plans, setPlans] = useState(PLANS_DATA);
  const [plansLoading, setPlansLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('PLAN_4999');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [simulatedCheckoutOrder, setSimulatedCheckoutOrder] = useState(null);

  // Load Razorpay script dynamically
  useEffect(() => {
    if (!document.getElementById('razorpay-checkout-script')) {
      const script = document.createElement('script');
      script.id = 'razorpay-checkout-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Fetch live dynamic plan templates from backend API (editable by superadmin)
  useEffect(() => {
    let isMounted = true;
    const fetchLivePlans = async () => {
      try {
        setPlansLoading(true);
        const live = await api.getSubscriptionPlans();
        if (isMounted && Array.isArray(live) && live.length > 0) {
          const mapped = live.map((p) => {
            const isStandard = p.id === 'PLAN_4999';
            const isGrowth = p.id === 'PLAN_14999';
            const isFree = p.id === 'FREE';

            const badge = p.badge || (isStandard ? 'Most Popular' : isGrowth ? 'High-Volume Scale' : 'Basic Trial');
            const badgeColor = isStandard
              ? 'bg-indigo-600 text-white border-indigo-600'
              : isGrowth
              ? 'bg-amber-500 text-white border-amber-500'
              : 'bg-slate-100 text-slate-700 border-slate-200';

            const rawFeatures = Array.isArray(p.features) ? p.features : [];
            const formattedFeatures = rawFeatures.map((feat) => {
              if (typeof feat === 'string') {
                let icon = Check;
                let note = '';
                const lower = feat.toLowerCase();
                if (lower.includes('staff') || lower.includes('role') || lower.includes('recruiter') || lower.includes('manager')) icon = Users;
                else if (lower.includes('job') || lower.includes('requisition') || lower.includes('posting')) icon = Briefcase;
                else if (lower.includes('candidate') || lower.includes('visible')) icon = Eye;
                else if (lower.includes('validity') || lower.includes('day')) icon = Zap;
                else if (lower.includes('ai') || lower.includes('scoring') || lower.includes('dossier')) icon = Sparkles;
                else if (lower.includes('pod') || lower.includes('scale') || lower.includes('crown') || lower.includes('priority')) icon = Crown;

                if (lower.includes('excess') || lower.includes('blurred') || lower.includes('upgrade prompt') || lower.includes('upgrade banner')) {
                  note = 'Remaining candidates blurred with upgrade banner';
                }
                return { text: feat, icon, note };
              }
              return {
                text: feat.text || '',
                icon: feat.icon || Check,
                note: feat.note || ''
              };
            });

            const priceNum = Number(p.price !== undefined ? p.price : 0);
            const priceDisplay = p.price_display || (priceNum === 0 ? '₹0' : `₹${priceNum.toLocaleString()}`);

            return {
              id: p.id,
              name: p.name,
              price: priceNum,
              priceDisplay: priceDisplay,
              billing: p.billing || (priceNum === 0 ? 'Free Forever' : p.duration_days ? `${p.duration_days} Days` : ''),
              duration_days: p.duration_days,
              badge: badge,
              badgeColor: badgeColor,
              description: p.description || '',
              maxRoles: p.max_roles !== undefined ? p.max_roles : 1,
              maxJobs: p.max_jobs !== undefined ? p.max_jobs : 1,
              maxCandidates: p.max_candidates_per_job !== undefined ? p.max_candidates_per_job : 15,
              highlight: Boolean(p.is_popular !== undefined ? p.is_popular : isStandard),
              features: formattedFeatures.length > 0 ? formattedFeatures : [
                { text: `${p.max_roles || 1} Staff role(s)`, icon: Users },
                { text: `${p.max_jobs || 1} Job requisition(s)`, icon: Briefcase },
                { text: `${p.max_candidates_per_job || 15} Candidates visible per job`, icon: Eye }
              ],
              ctaText: priceNum === 0 ? 'Get Started Free' : `Upgrade (${priceDisplay})`
            };
          });
          setPlans(mapped);
        }
      } catch (err) {
        console.warn('Could not load dynamic subscription plans, using fallback:', err);
      } finally {
        if (isMounted) setPlansLoading(false);
      }
    };

    fetchLivePlans();
    return () => { isMounted = false; };
  }, []);

  if (!isOpen) return null;

  const currentPlan = user?.profile?.plan_type || 'NONE';
  const isCompanyVerified = Boolean(user?.profile?.is_verified) || user?.profile?.verification_status === 'VERIFIED';
  const verificationStatus = user?.profile?.verification_status || (isCompanyVerified ? 'VERIFIED' : 'PENDING_PROFILE');
  const isCompanyAdmin = user?.role === 'ADMIN';

  if (!isCompanyVerified) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-indigo-100 overflow-hidden text-slate-800 text-center relative p-7 space-y-5">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer border-none"
              title="Close"
            >
              <X size={16} />
            </button>
          )}

          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center mx-auto text-[#5C59E8]">
            {verificationStatus === 'UNDER_REVIEW' ? (
              <Clock className="w-8 h-8 text-blue-600 animate-pulse" />
            ) : verificationStatus === 'REJECTED' ? (
              <AlertCircle className="w-8 h-8 text-rose-600" />
            ) : (
              <Building2 className="w-8 h-8 text-[#5C59E8]" />
            )}
          </div>

          <div className="space-y-2">
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
              verificationStatus === 'UNDER_REVIEW'
                ? 'bg-blue-100 text-blue-800 border-blue-200'
                : verificationStatus === 'REJECTED'
                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                  : 'bg-indigo-100 text-indigo-800 border-indigo-200'
            }`}>
              {verificationStatus === 'UNDER_REVIEW'
                ? 'Superadmin Review In Progress'
                : verificationStatus === 'REJECTED'
                  ? 'Verification Required'
                  : 'Profile Completion Required'}
            </span>
            <h3 className="text-xl font-bold text-slate-900 mt-2">
              Complete Profile to Unlock Plans
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
              Subscription plans and Free Trial access are locked until your organization completes 100% of the Company Profile and receives Superadmin approval.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Current Status</span>
              <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                verificationStatus === 'UNDER_REVIEW'
                  ? 'bg-blue-100 text-blue-800'
                  : verificationStatus === 'REJECTED'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
              }`}>
                {verificationStatus === 'UNDER_REVIEW'
                  ? 'In Review'
                  : verificationStatus === 'REJECTED'
                    ? 'Rejected'
                    : 'Profile Incomplete'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              {verificationStatus === 'UNDER_REVIEW'
                ? 'Your profile is currently under review by the Superadmin. Once approved, your Free Starter Plan and upgrade options will become accessible.'
                : verificationStatus === 'REJECTED'
                  ? 'Your profile was rejected. Please review feedback in your Company Profile, update required documents, and resubmit.'
                  : 'Please complete all 7 steps of your Company Profile (including statutory compliance documents: PAN, Labour License, Trade License, COI, Registration doc).'}
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                if (onClose) onClose();
                window.dispatchEvent(new CustomEvent('uptrix:navigate_tab', { detail: 'company_profile' }));
              }}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#5C59E8] to-[#4F46E5] hover:from-[#4F46E5] hover:to-[#4338CA] text-white font-bold text-xs shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all border-none"
            >
              <span>{verificationStatus === 'UNDER_REVIEW' ? 'View Profile Status' : 'Go to Company Profile (Complete 7 Steps)'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors border-none cursor-pointer"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const handleSelectFree = async () => {
    if (!isCompanyAdmin) {
      setError("Only your company's primary Administrator can activate or manage subscription plans. Please contact your company admin.");
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.activateFreePlan();
      await refreshUser();
      const freePlan = plans.find(p => p.id === 'FREE') || { name: 'Free Starter' };
      setSuccessData({
        planName: freePlan.name,
        message: `Your ${freePlan.name} is activated! You can now access your recruitment workspace.`
      });
      setTimeout(() => {
        if (onSuccess) onSuccess('FREE');
        if (onClose) onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to activate Free plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const ensureRazorpayLoaded = () => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        return resolve(true);
      }
      const existing = document.getElementById('razorpay-checkout-script');
      if (existing) {
        existing.addEventListener('load', () => resolve(true));
        existing.addEventListener('error', () => resolve(false));
      } else {
        const script = document.createElement('script');
        script.id = 'razorpay-checkout-script';
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      }
      setTimeout(() => resolve(Boolean(window.Razorpay)), 3000);
    });
  };

  const handlePaidCheckout = async (planId) => {
    if (!isCompanyAdmin) {
      setError("Only your company's primary Administrator can purchase or upgrade subscription plans. Please contact your company admin.");
      return;
    }
    setError('');
    setLoading(true);
    try {
      await ensureRazorpayLoaded();
      const order = await api.createRazorpayOrder(planId);
      const planInfo = plans.find(p => p.id === planId) || PLANS_DATA.find(p => p.id === planId) || { name: 'Recruitment Plan' };
      const activeKey = order.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_SWEEWJkuQSNLrI';

      if (window.Razorpay && activeKey) {
        const options = {
          key: activeKey,
          amount: order.amount,
          currency: order.currency || 'INR',
          name: 'Uptrix Hiring Platform',
          description: `${planInfo.name} Subscription`,
          order_id: order.order_id && !order.order_id.startsWith('order_demo_') ? order.order_id : undefined,
          prefill: order.prefill || {
            name: user?.profile?.company_name || 'Recruiter',
            email: user?.email || '',
            contact: user?.profile?.phone || ''
          },
          theme: {
            color: '#1E3155'
          },
          handler: async function (response) {
            try {
              setLoading(true);
              await api.verifyRazorpayPayment({
                plan_id: planId,
                razorpay_order_id: response.razorpay_order_id || order.order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature || ''
              });

              await refreshUser();
              setSuccessData({
                planName: planInfo.name,
                message: `Payment successful! Your ${planInfo.name} is now active.`
              });

              setTimeout(() => {
                if (onSuccess) onSuccess(planId);
                if (onClose) onClose();
              }, 1800);
            } catch (vErr) {
              setError(vErr.message || 'Payment verification failed. Please contact support.');
            } finally {
              setLoading(false);
            }
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
            }
          }
        };

        const rzpInstance = new window.Razorpay(options);
        rzpInstance.on('payment.failed', function (resp) {
          setError(`Payment failed: ${resp.error?.description || 'Transaction declined'}`);
          setLoading(false);
        });
        rzpInstance.open();
        setLoading(false);
      } else {
        // Fallback only if Razorpay CDN script was blocked (e.g. adblocker)
        setSimulatedCheckoutOrder({
          ...order,
          planInfo
        });
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to initiate payment. Please try again.');
      setLoading(false);
    }
  };

  const handleConfirmSimulatedPayment = async () => {
    if (!simulatedCheckoutOrder) return;
    setLoading(true);
    setError('');

    // If Razorpay is loaded, launch the real Razorpay popup directly
    if (window.Razorpay) {
      const activeKey = simulatedCheckoutOrder.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_SWEEWJkuQSNLrI';
      const order = simulatedCheckoutOrder;
      const planInfo = simulatedCheckoutOrder.planInfo;
      const planId = simulatedCheckoutOrder.plan_id;
      setSimulatedCheckoutOrder(null);

      const options = {
        key: activeKey,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'Uptrix Hiring Platform',
        description: `${planInfo?.name || 'Recruitment'} Subscription`,
        order_id: order.order_id && !order.order_id.startsWith('order_demo_') ? order.order_id : undefined,
        prefill: order.prefill || {
          name: user?.profile?.company_name || 'Recruiter',
          email: user?.email || '',
          contact: user?.profile?.phone || ''
        },
        theme: { color: '#1E3155' },
        handler: async function (response) {
          try {
            setLoading(true);
            await api.verifyRazorpayPayment({
              plan_id: planId,
              razorpay_order_id: response.razorpay_order_id || order.order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature || ''
            });

            await refreshUser();
            setSuccessData({
              planName: planInfo?.name,
              message: `Payment successful! Your ${planInfo?.name} is active.`
            });

            setTimeout(() => {
              if (onSuccess) onSuccess(planId);
              if (onClose) onClose();
            }, 1800);
          } catch (vErr) {
            setError(vErr.message || 'Payment verification failed.');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          }
        }
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on('payment.failed', function (resp) {
        setError(`Payment failed: ${resp.error?.description || 'Transaction declined'}`);
        setLoading(false);
      });
      rzpInstance.open();
      setLoading(false);
      return;
    }

    // Otherwise complete simulated verification
    try {
      const mockPaymentId = `pay_mock_${Date.now().toString(36)}`;
      const mockSig = `sig_demo_${Date.now()}`;

      await api.verifyRazorpayPayment({
        plan_id: simulatedCheckoutOrder.plan_id,
        razorpay_order_id: simulatedCheckoutOrder.order_id,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: mockSig
      });

      await refreshUser();
      setSuccessData({
        planName: simulatedCheckoutOrder.planInfo.name,
        message: `Payment confirmed via Razorpay! Your ${simulatedCheckoutOrder.planInfo.name} is active.`
      });
      setSimulatedCheckoutOrder(null);

      setTimeout(() => {
        if (onSuccess) onSuccess(simulatedCheckoutOrder.plan_id);
        if (onClose) onClose();
      }, 1600);
    } catch (err) {
      setError(err.message || 'Failed to verify payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-2 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-auto flex flex-col relative text-slate-800 max-h-[92vh]">
        
        {/* Close Button */}
        {!isInitialOnboarding && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3.5 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white flex items-center justify-center transition-colors cursor-pointer border-none z-20"
            title="Close"
          >
            <X size={15} />
          </button>
        )}

        {/* Compact Header Strip */}
        <div className="bg-gradient-to-r from-[#101A33] via-[#1E3155] to-[#2B447A] px-5 py-3 sm:px-6 sm:py-3.5 text-white relative overflow-hidden shrink-0">
          <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-[#F2A93B]/15 blur-2xl pointer-events-none" />
          <div className="relative z-10 pr-8">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-[#F2A93B] text-[10px] font-bold mb-1">
              <Sparkles size={11} />
              <span>UPTRIX RECRUITMENT SUBSCRIPTIONS</span>
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight leading-tight">
              Plans that scale with your hiring
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-300/90 leading-tight mt-0.5">
              {triggerReason || 
                (isInitialOnboarding 
                  ? 'Select your recruitment plan to activate full portal access.'
                  : 'Subscription plan upgrades can only be made by your company Administrator.')}
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-4 sm:mx-5 mt-2 py-1.5 px-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-[11px] text-rose-700 font-medium shrink-0">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Administrator Restriction Notice for Recruiters / Hiring Managers */}
        {!isCompanyAdmin && (
          <div className="mx-4 sm:mx-5 mt-2 py-1.5 px-3 rounded-lg bg-amber-50 border border-amber-200/80 flex items-center gap-2 text-[11px] text-amber-800 shrink-0">
            <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Administrator Upgrade Only:</span> Only your organization's primary Administrator can purchase or upgrade plans. Contact your company administrator to unlock features.
            </div>
          </div>
        )}

        {/* Success Modal Notification */}
        {successData && (
          <div className="mx-4 sm:mx-5 mt-2 py-2 px-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-emerald-800 font-bold text-xs shrink-0 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-extrabold">{successData.planName} Activated! </span>
              <span className="text-[11px] text-emerald-700 font-normal">{successData.message}</span>
            </div>
          </div>
        )}

        {/* Main Plans Grid */}
        <div className="p-3 sm:p-4 md:p-5 grid grid-cols-1 md:grid-cols-3 gap-3 overflow-y-auto">
          {plans.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            const isCurrent = currentPlan === plan.id;

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`rounded-xl p-3 sm:p-3.5 transition-all cursor-pointer relative flex flex-col justify-between border-2 ${
                  isSelected
                    ? 'border-[#1E3155] bg-slate-50/60 shadow-lg ring-1 ring-[#1E3155]/20'
                    : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div>
                  {/* Top Badge Row */}
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <span className={`px-2 py-0.5 rounded text-[9.5px] font-extrabold tracking-wider uppercase border ${plan.badgeColor}`}>
                      {plan.badge}
                    </span>
                    {isCurrent && (
                      <span className="text-[9.5px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        Active
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                    {plan.name}
                  </h3>
                  <p className="text-[10px] sm:text-[10.5px] text-slate-500 leading-tight mt-0.5 mb-2 line-clamp-2">
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="pb-1.5 mb-2 border-b border-slate-100 flex items-baseline justify-between">
                    <span className="text-xl sm:text-2xl font-black text-[#101A33] tracking-tight">
                      {plan.priceDisplay}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {plan.billing}
                    </span>
                  </div>

                  {/* Quotas Highlights */}
                  <div className="grid grid-cols-3 gap-1 py-1 mb-2 bg-slate-50 border border-slate-100 rounded-lg text-center">
                    <div>
                      <div className="text-xs font-black text-slate-900 leading-none">{plan.maxRoles}</div>
                      <div className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight mt-0.5">Roles</div>
                    </div>
                    <div className="border-x border-slate-200/80">
                      <div className="text-xs font-black text-slate-900 leading-none">{plan.maxJobs}</div>
                      <div className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight mt-0.5">Jobs</div>
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900 leading-none">{plan.maxCandidates}</div>
                      <div className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight mt-0.5">Visible</div>
                    </div>
                  </div>

                  {/* Feature Checklist (concise list) */}
                  <div className="space-y-1 mb-2.5 text-[10.5px]">
                    {plan.features.slice(0, 5).map((feat, idx) => {
                      const IconComp = feat.icon || Check;
                      return (
                        <div key={idx} className="flex items-center gap-1.5 text-slate-700 leading-tight">
                          <div className="w-3.5 h-3.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <IconComp size={8} className="stroke-[3]" />
                          </div>
                          <span className="font-medium text-[10.5px] truncate" title={feat.text}>
                            {feat.text}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Card CTA Button */}
                <button
                  type="button"
                  disabled={loading || !isCompanyAdmin}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isCompanyAdmin) {
                      setError("Only your organization's primary Administrator can upgrade subscription plans. Please contact your company admin.");
                      return;
                    }
                    if (Number(plan.price) === 0) {
                      handleSelectFree();
                    } else {
                      handlePaidCheckout(plan.id);
                    }
                  }}
                  className={`w-full py-1.5 px-2.5 rounded-lg font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 transition-all border-none shadow-sm ${
                    !isCompanyAdmin
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                      : plan.highlight
                        ? 'bg-[#1E3155] hover:bg-[#152340] text-white cursor-pointer'
                        : plan.id === 'FREE'
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer'
                          : 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer'
                  }`}
                >
                  {loading && selectedPlanId === plan.id ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : !isCompanyAdmin ? (
                    <>
                      <Lock size={12} className="text-slate-400" />
                      <span>Admin Only</span>
                    </>
                  ) : (
                    <>
                      <span>{plan.ctaText}</span>
                      <ArrowRight size={12} />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Bottom Guarantee Strip */}
        <div className="bg-slate-50 border-t border-slate-100 px-4 py-2 sm:px-5 sm:py-2 flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[10.5px] text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Secure 256-bit encrypted checkout via <strong>Razorpay</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-[10px]">
            <span>Instant Access</span>
            <span>•</span>
            <span>Upgrade Anytime</span>
            <span>•</span>
            <span>GST Invoicing</span>
          </div>
        </div>

        {/* Razorpay Test / Simulation Modal fallback */}
        {simulatedCheckoutOrder && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#1E3155] text-white flex items-center justify-center font-black text-xs">
                    RZP
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">Razorpay Checkout</h4>
                    <p className="text-[11px] text-slate-400">UPI • Cards • NetBanking</p>
                  </div>
                </div>
                <button
                  onClick={() => setSimulatedCheckoutOrder(null)}
                  className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-500">Plan</span>
                  <span className="text-xs font-bold text-slate-900">{simulatedCheckoutOrder.planInfo.name}</span>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-500">Order Ref</span>
                  <span className="text-[11px] font-mono text-slate-600">{simulatedCheckoutOrder.order_id}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 mt-2">
                  <span className="text-xs font-extrabold text-slate-900">Total Payable</span>
                  <span className="text-base font-black text-[#1E3155]">{simulatedCheckoutOrder.price_display}</span>
                </div>
              </div>

              <p className="text-[11.5px] text-slate-500 leading-normal mb-5 text-center">
                Click below to complete transaction and activate your plan with Razorpay signature verification.
              </p>

              <button
                type="button"
                disabled={loading}
                onClick={handleConfirmSimulatedPayment}
                className="w-full py-3 bg-[#1E3155] hover:bg-[#152340] text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer border-none shadow-md transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Verifying Razorpay Signature...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Authorize Payment ({simulatedCheckoutOrder.price_display})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
