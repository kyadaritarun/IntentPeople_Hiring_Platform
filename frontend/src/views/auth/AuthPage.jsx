import React, { useState, useEffect } from 'react';
import {
  Building2, UserCheck, AlertCircle, ArrowRight, ChevronLeft, Eye, EyeOff,
  Check, X, Mail, Lock, Phone, MapPin, Globe, Quote, Users, TrendingUp,
  ShieldCheck, Loader2, CheckCircle2, User, Linkedin
} from 'lucide-react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import OTPModal from '../../components/OTPModal';
import PlanSelectionModal from '../../components/PlanSelectionModal';
import ForgotPasswordModal from '../../components/ForgotPasswordModal';
import { getDetectedTenantSubdomain } from '../../utils/navigation';
import { INDIA_STATES_AND_CITIES, INDIAN_STATES } from '../../utils/indiaLocations';

const DISALLOWED_COMPANY_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];

/* ---------------------------------------------------------------
   Brand panel content — real substance instead of generic slides.
   Rotating client proof + a fixed stat strip underneath.
---------------------------------------------------------------- */
const TESTIMONIALS = [
  {
    quote: 'We closed two senior growth hires in under three weeks. The candidate quality here is unlike any generalist board.',
    name: 'Priya Nair',
    role: 'Head of Talent, GrowthX Agency'
  },
  {
    quote: 'Every profile is verified before it reaches us, so screening calls turned into offer calls almost immediately.',
    name: 'Marcus Tan',
    role: 'VP Marketing, ScaleUp Media'
  },
  {
    quote: 'Uptrix surfaces marketers who actually understand attribution and LTV, not just campaign buzzwords.',
    name: 'Elena Ruiz',
    role: 'Talent Partner, Northwind Digital'
  }
];

const STATS = [
  { icon: Users, value: '12,000+', label: 'Verified marketers' },
  { icon: Building2, value: '850+', label: 'Hiring agencies' },
  { icon: TrendingUp, value: '94%', label: 'Roles filled in 30 days' }
];

/* ---------------------------------------------------------------
   Shared style tokens — one radius family, one focus treatment,
   so inputs and buttons read as a single, deliberate system.
---------------------------------------------------------------- */
const FIELD_SHELL =
  'flex items-center gap-2 rounded-[9px] border bg-white px-2.5 transition-colors border-slate-200 focus-within:border-[#1E3155] focus-within:ring-2 focus-within:ring-[#1E3155]/10';
const FIELD_INPUT =
  'w-full bg-transparent py-2 text-[12.5px] font-medium text-[#12141C] outline-none placeholder:text-slate-400 placeholder:font-normal';
const FIELD_LABEL = 'block text-[11.5px] font-semibold text-[#12141C] mb-1';
const PRIMARY_BTN =
  'w-full rounded-[9px] bg-[#1E3155] hover:bg-[#152340] disabled:opacity-60 disabled:cursor-not-allowed text-white text-[13px] font-semibold py-2.5 flex items-center justify-center gap-2 transition-colors shadow-[0_1px_2px_rgba(16,26,51,0.08)]';
const SECONDARY_BTN =
  'w-full rounded-[10px] border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-[#12141C] text-[13px] font-semibold py-2.5 flex items-center justify-center gap-2.5 transition-colors';

function Field({ icon: Icon, error, children }) {
  return (
    <div className={`${FIELD_SHELL} ${error ? 'border-rose-300 focus-within:border-rose-400 focus-within:ring-rose-100' : ''}`}>
      {Icon && <Icon size={15} className="shrink-0 text-slate-400" />}
      {children}
    </div>
  );
}

export default function AuthPage({ onAuthSuccess, initialMode = 'login', onBackToLanding, onModeChange, tenant = null }) {
  const [mode, setMode] = useState(initialMode || 'login');
  const { loginUser } = useAuth();
  const [tenantInfo, setTenantInfo] = useState(null);

  useEffect(() => {
    const detected = tenant || getDetectedTenantSubdomain();
    if (detected) {
      api.getVendorTenantDetails(detected)
        .then((data) => {
          setTenantInfo(data);
          // If on a custom tenant portal, default to recruiter/staff login
          if (mode === 'login' || mode === 'login_candidate') {
            setMode('login_recruiter');
          }
        })
        .catch(() => {});
    }
  }, [tenant]);

  useEffect(() => {
    if (initialMode && initialMode !== mode) {
      setMode(initialMode);
    }
  }, [initialMode]);

  useEffect(() => {
    if (onModeChange) {
      onModeChange(mode);
    }
  }, [mode]);

  const [candData, setCandData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    place: '',
    city: '',
    state: '',
    phone: '',
    linkedin_url: ''
  });

  const [compData, setCompData] = useState({
    full_name: '',
    company_name: '',
    email: '',
    phone: '',
    website: '',
    location: '',
    company_size: '',
    company_details: '',
    password: '',
    confirm_password: '',
    industry: 'Digital Marketing & Media'
  });

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpModalData, setOtpModalData] = useState(null);
  const [onboardingUser, setOnboardingUser] = useState(null);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [showCandPassword, setShowCandPassword] = useState(false);
  const [showCandConfirmPassword, setShowCandConfirmPassword] = useState(false);
  const [showCompPassword, setShowCompPassword] = useState(false);
  const [showCompConfirmPassword, setShowCompConfirmPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');

  // Load the two type families used across the page. Falls back to
  // system fonts cleanly if the request is blocked (e.g. offline / firewalled).
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const [isCustomState, setIsCustomState] = useState(false);
  const [isCustomCity, setIsCustomCity] = useState(false);

  const availableCities = (candData.state && INDIA_STATES_AND_CITIES[candData.state]) || [];

  const handleCandChange = (e) => {
    setCandData({ ...candData, [e.target.name]: e.target.value });
  };

  const handleStateSelect = (e) => {
    const val = e.target.value;
    if (val === '__OTHER__') {
      setIsCustomState(true);
      setIsCustomCity(true);
      setCandData((prev) => ({ ...prev, state: '', city: '' }));
    } else {
      setIsCustomState(false);
      setIsCustomCity(false);
      setCandData((prev) => ({ ...prev, state: val, city: '' }));
    }
  };

  const handleCitySelect = (e) => {
    const val = e.target.value;
    if (val === '__OTHER__') {
      setIsCustomCity(true);
      setCandData((prev) => ({ ...prev, city: '' }));
    } else {
      setIsCustomCity(false);
      setCandData((prev) => ({ ...prev, city: val }));
    }
  };

  const handleCompChange = (e) => {
    const { name, value } = e.target;
    setCompData({ ...compData, [name]: value });

    if (name === 'email') {
      const domain = value.split('@')[1]?.toLowerCase();
      if (DISALLOWED_COMPANY_DOMAINS.includes(domain)) {
        setError(`Company emails cannot use public domain @${domain}. Please use your official business email (e.g. hr@company.com).`);
      } else {
        setError('');
      }
    }
  };

  const handleCandidateRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!candData.full_name?.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!candData.email?.trim()) {
      setError('Email address is required.');
      return;
    }
    if (!candData.state?.trim()) {
      setError('State is required.');
      return;
    }
    if (!candData.city?.trim()) {
      setError('City is required.');
      return;
    }
    if (!candData.password) {
      setError('Password is required.');
      return;
    }
    if (candData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (!candData.confirm_password) {
      setError('Please confirm your password.');
      return;
    }
    if (candData.password !== candData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...candData,
        place: candData.place?.trim() || `${candData.city}, ${candData.state}`
      };
      const res = await api.registerCandidate(payload);
      setOtpModalData({
        email: res.email,
        role: 'CANDIDATE'
      });
    } catch (err) {
      setError(err.message || 'Candidate registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!compData.full_name?.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!compData.company_name?.trim()) {
      setError('Company name is required.');
      return;
    }
    if (!compData.email?.trim()) {
      setError('Business email is required.');
      return;
    }
    const domain = compData.email.split('@')[1]?.toLowerCase();
    if (DISALLOWED_COMPANY_DOMAINS.includes(domain)) {
      setError(`Recruiters must register with an official business domain email. @${domain} is not permitted.`);
      return;
    }
    if (!compData.phone?.trim()) {
      setError('Phone number is required.');
      return;
    }
    if (!compData.website?.trim()) {
      setError('Company website is required.');
      return;
    }
    if (!compData.location?.trim()) {
      setError('Headquarters location is required.');
      return;
    }
    if (!compData.company_size) {
      setError('Please select your company size.');
      return;
    }
    if (!compData.password) {
      setError('Password is required.');
      return;
    }
    if (compData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (!compData.confirm_password) {
      setError('Please confirm your password.');
      return;
    }
    if (compData.password !== compData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.registerCompany(compData);
      setOtpModalData({
        email: res.email,
        role: res.role || 'ADMIN'
      });
    } catch (err) {
      setError(err.message || 'Company registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.login(loginEmail, loginPassword);
      loginUser(res.access_token, res.user);
      const isCustomVendor = res.user?.profile?.plan_type === 'CUSTOM_VENDOR' || Boolean(tenantInfo) || Boolean(tenant) || Boolean(getDetectedTenantSubdomain());
      if (!isCustomVendor && res.user?.role === 'ADMIN' && (res.user?.profile?.plan_type === 'NONE' || res.user?.profile?.plan_status === 'PENDING')) {
        setOnboardingUser(res.user);
      } else {
        if (onAuthSuccess) onAuthSuccess(res.user);
      }
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('not been verified')) {
        setOtpModalData({
          email: loginEmail,
          role: 'ADMIN'
        });
      }
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const t = TESTIMONIALS[currentTestimonial];

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#F7F8FA]"
      style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif" }}
    >
      <div className="w-full max-w-[960px] min-h-[600px] rounded-2xl overflow-hidden shadow-[0_24px_70px_-20px_rgba(16,26,51,0.25)] border border-slate-200/70 flex flex-col md:flex-row bg-white">

        {/* ============== LEFT: BRAND / PROOF PANEL ============== */}
        <div className="hidden md:flex md:w-[46%] relative flex-col justify-between p-9 overflow-hidden bg-[#101A33]">

          {/* Abstract ascending-line motif — the one bold gesture on the page */}
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.16]"
            viewBox="0 0 400 600"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <polyline points="0,520 70,470 140,500 210,380 280,410 340,260 400,300" fill="none" stroke="#F2A93B" strokeWidth="2.5" />
            <polyline points="0,560 70,540 140,555 210,470 280,490 340,360 400,400" fill="none" stroke="#5C79B8" strokeWidth="2" />
          </svg>
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[#F2A93B]/10 blur-3xl pointer-events-none" />

          {/* Wordmark */}


          {/* Rotating client quote */}
          <div className="relative z-10 my-auto pt-10">
            <Quote size={28} className="text-[#F2A93B] mb-4" strokeWidth={1.5} />
            <p
              className="text-white text-[22px] leading-[1.45] max-w-[340px] mb-6 transition-opacity duration-500"
              style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}
            >
              {t.quote}
            </p>
            <div className="mb-6">
              <p className="text-white text-[13px] font-semibold">{t.name}</p>
              <p className="text-white/55 text-[12.5px]">{t.role}</p>
            </div>
            <div className="flex items-center gap-1.5">
              {TESTIMONIALS.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentTestimonial(idx)}
                  className={`h-1 rounded-full border-none p-0 cursor-pointer transition-all duration-300 ${currentTestimonial === idx ? 'w-6 bg-[#F2A93B]' : 'w-1 bg-white/25 hover:bg-white/45'
                    }`}
                  aria-label={`Show testimonial ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Stat strip — concrete proof, not decoration */}
          <div className="relative z-10 grid grid-cols-3 gap-3 pt-8 border-t border-white/10">
            {STATS.map(({ icon: Icon, value, label }) => (
              <div key={label}>
                <Icon size={14} className="text-[#F2A93B] mb-1.5" strokeWidth={2} />
                <p className="text-white text-[15px] font-semibold leading-tight">{value}</p>
                <p className="text-white/50 text-[11px] leading-snug mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ============== RIGHT: FUNCTIONAL FORM PANEL ============== */}
        <div className="flex-1 md:w-[54%] px-7 sm:px-10 py-8 flex flex-col justify-center">

          {onBackToLanding && (
            <div className="mb-4">
              <button
                type="button"
                onClick={onBackToLanding}
                className="group inline-flex items-center gap-1.5 text-[12.5px] font-medium text-slate-400 hover:text-[#12141C] transition-colors cursor-pointer border-none bg-transparent p-0"
              >
                <ChevronLeft size={15} className="transition-transform group-hover:-translate-x-0.5" />
                Back to Home
              </button>
            </div>
          )}

          {/* Mobile-only compact brand mark when not on login */}
          {!['login', 'login_candidate', 'login_recruiter'].includes(mode) && (
            <div className="flex md:hidden items-center mb-6">
              <img src="/logo.svg" alt="Uptrix" className="h-7 object-contain select-none" />
            </div>
          )}

          {['login', 'login_candidate', 'login_recruiter'].includes(mode) && (
            <div className="text-center mb-6">
              <img src="/logo.svg" alt="Uptrix" className="mx-auto h-10 object-contain mb-3 select-none" />

              {tenantInfo && (
                <div className="mb-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold shadow-xs">
                  <Building2 size={14} className="text-indigo-600" />
                  <span>{tenantInfo.company_name} Portal ({tenantInfo.subdomain}.intentpeople.com)</span>
                </div>
              )}

              <h2 className="text-lg font-black text-[#12141C] tracking-tight">
                {tenantInfo
                  ? `${tenantInfo.company_name} Portal Login`
                  : mode === 'login_candidate'
                  ? 'Candidate Portal Login'
                  : mode === 'login_recruiter'
                  ? 'Recruiter / Agency Login'
                  : 'Welcome Back'}
              </h2>
              <p className="text-[13px] text-slate-500 mt-1 max-w-sm mx-auto">
                {tenantInfo
                  ? `Sign in to access ${tenantInfo.company_name}'s candidate pipeline, job postings, and assigned workflows.`
                  : mode === 'login_candidate'
                  ? 'Access your digital marketing profile, job applications & interviews.'
                  : mode === 'login_recruiter'
                  ? 'Post roles, review candidate submissions & manage your hiring funnel.'
                  : 'Sign in to pick up where you left off.'}
              </p>
            </div>
          )}

          {tenantInfo && tenantInfo.is_active === false && (
            <div className="bg-rose-50 border border-rose-300 rounded-xl p-3.5 mb-5 text-rose-800 text-xs flex items-start gap-2.5 shadow-2xs">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
              <div>
                <div className="font-bold text-[13px] text-rose-900 mb-0.5">Organization Account Deactivated</div>
                <p className="text-rose-700 leading-relaxed">
                  This organization portal has been deactivated by the Super Administrator. Sign in and platform access are currently suspended. Please contact your organization administrator or platform support.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div role="alert" aria-live="polite" className="bg-rose-50 border border-rose-200 rounded-[10px] px-3 py-2.5 mb-4 text-rose-700 text-[12.5px] flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {resetSuccessMsg && (
            <div role="status" className="bg-emerald-50 border border-emerald-200 rounded-[10px] px-3 py-2.5 mb-4 text-emerald-800 text-[12.5px] flex items-start gap-2">
              <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-emerald-600" />
              <span>{resetSuccessMsg}</span>
            </div>
          )}

          {/* 1. SIGN IN */}
          {['login', 'login_candidate', 'login_recruiter'].includes(mode) && (
            <form onSubmit={handleLogin} noValidate>
              <div className="mb-4">
                <label htmlFor="login-email" className={FIELD_LABEL}>
                  {mode === 'login_recruiter' ? 'Work / Business Email' : 'Email Address'}
                </label>
                <Field icon={Mail}>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    className={FIELD_INPUT}
                    placeholder={
                      mode === 'login_candidate'
                        ? 'marketer@example.com'
                        : mode === 'login_recruiter'
                        ? 'recruiter@agency.com'
                        : 'you@company.com'
                    }
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    disabled={tenantInfo && tenantInfo.is_active === false}
                    required
                  />
                </Field>
              </div>

              <div className="mb-2.5">
                <label htmlFor="login-password" className={FIELD_LABEL}>Password</label>
                <Field icon={Lock}>
                  <input
                    id="login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={FIELD_INPUT}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    disabled={tenantInfo && tenantInfo.is_active === false}
                    required
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="shrink-0 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0.5"
                    title={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </Field>
              </div>

              <div className="text-right mb-5">
                <button
                  type="button"
                  onClick={() => { setError(''); setResetSuccessMsg(''); setShowForgotModal(true); }}
                  className="text-[12.5px] text-slate-400 hover:text-[#FF6008] font-medium border-none bg-transparent cursor-pointer p-0 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                className={PRIMARY_BTN}
                disabled={loading || (tenantInfo && tenantInfo.is_active === false)}
              >
                {loading && <Loader2 size={15} className="animate-spin" />}
                {tenantInfo && tenantInfo.is_active === false
                  ? 'Portal Access Suspended'
                  : loading
                  ? 'Signing in…'
                  : mode === 'login_candidate'
                  ? 'Sign in as Candidate'
                  : mode === 'login_recruiter'
                  ? 'Sign in as Recruiter'
                  : 'Sign in'}
              </button>

              <p className="text-center text-[12.5px] text-slate-400 mt-6">
                New to Uptrix?{' '}
                <button
                  type="button"
                  className="bg-transparent border-none text-[#1E3155] hover:text-[#152340] font-semibold underline cursor-pointer"
                  onClick={() => { setMode('select_role'); setError(''); }}
                >
                  Create an account
                </button>
              </p>
            </form>
          )}

          {/* 2. SELECT ROLE */}
          {mode === 'select_role' && (
            <div className="flex flex-col h-full">
              <h1 className="text-[20px] font-semibold text-[#12141C] tracking-tight mb-1.5">Create your account</h1>
              <p className="text-[13px] text-slate-500 mb-6">Choose the account type that fits how you'll use Uptrix.</p>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => { setMode('register_candidate'); setError(''); }}
                  className="group text-left w-full p-4 rounded-xl border border-slate-200 hover:border-[#1E3155]/50 hover:shadow-[0_4px_16px_-8px_rgba(16,26,51,0.2)] transition-all flex items-center justify-between bg-white"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-[#1E3155] text-white flex items-center justify-center shrink-0">
                      <UserCheck size={18} />
                    </div>
                    <div>
                      <h4 className="text-[13.5px] font-semibold text-[#12141C]">Candidate</h4>
                      <p className="text-[12px] text-slate-500 leading-snug mt-0.5">Apply to roles, build your profile, get discovered.</p>
                    </div>
                  </div>
                  <ArrowRight size={15} className="text-slate-300 group-hover:text-[#1E3155] group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => { setMode('register_company'); setError(''); }}
                  className="group text-left w-full p-4 rounded-xl border border-slate-200 hover:border-[#1E3155]/50 hover:shadow-[0_4px_16px_-8px_rgba(16,26,51,0.2)] transition-all flex items-center justify-between bg-white"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-[#F2A93B] text-[#101A33] flex items-center justify-center shrink-0">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <h4 className="text-[13.5px] font-semibold text-[#12141C]">Recruiter / Agency</h4>
                      <p className="text-[12px] text-slate-500 leading-snug mt-0.5">Post roles and reach verified performance marketers.</p>
                    </div>
                  </div>
                  <ArrowRight size={15} className="text-slate-300 group-hover:text-[#1E3155] group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              </div>

              <p className="text-center text-[12.5px] text-slate-400 mt-auto pt-8">
                Already have an account?{' '}
                <button
                  type="button"
                  className="bg-transparent border-none text-[#1E3155] font-semibold cursor-pointer underline"
                  onClick={() => { setMode('login'); setError(''); }}
                >
                  Sign in
                </button>
              </p>
            </div>
          )}

          {/* 3A. CANDIDATE REGISTRATION */}
          {mode === 'register_candidate' && (
            <div className="flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-[17px] font-semibold text-[#12141C]">Create candidate account</h3>
                  <p className="text-[12.5px] text-slate-500 mt-0.5">Takes about a minute.</p>
                </div>
                <button
                  type="button"
                  className="bg-transparent border-none text-[#1E3155] font-semibold text-[12.5px] cursor-pointer shrink-0"
                  onClick={() => { setMode('select_role'); setError(''); }}
                >
                  Change role
                </button>
              </div>

              <form onSubmit={handleCandidateRegister} className="flex flex-col flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3.5 gap-y-2.5">
                  <div>
                    <label htmlFor="cand-name" className={FIELD_LABEL}>
                      Full name <span className="text-rose-500">*</span>
                    </label>
                    <Field icon={UserCheck}>
                      <input id="cand-name" type="text" name="full_name" autoComplete="name" className={FIELD_INPUT}
                        placeholder="Sarah Jenkins" value={candData.full_name} onChange={handleCandChange} required />
                    </Field>
                  </div>

                  <div>
                    <label htmlFor="cand-email" className={FIELD_LABEL}>
                      Email address <span className="text-rose-500">*</span>
                    </label>
                    <Field icon={Mail}>
                      <input id="cand-email" type="email" name="email" autoComplete="email" className={FIELD_INPUT}
                        placeholder="you@example.com" value={candData.email} onChange={handleCandChange} required />
                    </Field>
                  </div>

                  <div>
                    <label htmlFor="cand-phone" className={FIELD_LABEL}>
                      Phone number
                    </label>
                    <Field icon={Phone}>
                      <input id="cand-phone" type="tel" name="phone" autoComplete="tel" className={FIELD_INPUT}
                        placeholder="+1 (555) 000-0000" value={candData.phone} onChange={handleCandChange} />
                    </Field>
                  </div>

                  <div>
                    <label htmlFor="cand-linkedin" className={FIELD_LABEL}>
                      LinkedIn profile
                    </label>
                    <Field icon={Linkedin}>
                      <input id="cand-linkedin" type="url" name="linkedin_url" autoComplete="url" className={FIELD_INPUT}
                        placeholder="https://linkedin.com/in/username" value={candData.linkedin_url} onChange={handleCandChange} />
                    </Field>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="cand-state" className={`${FIELD_LABEL} mb-0`}>
                        State <span className="text-rose-500">*</span>
                      </label>
                      {isCustomState && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomState(false);
                            setIsCustomCity(false);
                            setCandData(prev => ({ ...prev, state: '', city: '' }));
                          }}
                          className="text-[11px] text-[#1E3155] font-semibold hover:underline shrink-0 border-none bg-transparent cursor-pointer p-0"
                        >
                          Select from list
                        </button>
                      )}
                    </div>
                    <Field icon={Globe}>
                      {isCustomState ? (
                        <input
                          id="cand-state"
                          type="text"
                          name="state"
                          autoComplete="address-level1"
                          className={FIELD_INPUT}
                          placeholder="e.g. Telangana / State name"
                          value={candData.state}
                          onChange={handleCandChange}
                          required
                        />
                      ) : (
                        <select
                          id="cand-state"
                          name="state"
                          className={`${FIELD_INPUT} cursor-pointer bg-transparent`}
                          value={candData.state}
                          onChange={handleStateSelect}
                          required
                        >
                          <option value="">Select State</option>
                          {INDIAN_STATES.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                          <option value="__OTHER__">Other / Outside India</option>
                        </select>
                      )}
                    </Field>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="cand-city" className={`${FIELD_LABEL} mb-0`}>
                        City <span className="text-rose-500">*</span>
                      </label>
                      {!isCustomState && isCustomCity && candData.state && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomCity(false);
                            setCandData(prev => ({ ...prev, city: '' }));
                          }}
                          className="text-[11px] text-[#1E3155] font-semibold hover:underline shrink-0 border-none bg-transparent cursor-pointer p-0"
                        >
                          Select from list
                        </button>
                      )}
                    </div>
                    <Field icon={MapPin}>
                      {(isCustomCity || isCustomState) ? (
                        <input
                          id="cand-city"
                          type="text"
                          name="city"
                          autoComplete="address-level2"
                          className={FIELD_INPUT}
                          placeholder={isCustomState ? "e.g. Dubai / City name" : "e.g. Enter your city"}
                          value={candData.city}
                          onChange={handleCandChange}
                          required
                        />
                      ) : (
                        <select
                          id="cand-city"
                          name="city"
                          className={`${FIELD_INPUT} cursor-pointer bg-transparent disabled:opacity-50 disabled:cursor-not-allowed`}
                          value={candData.city}
                          onChange={handleCitySelect}
                          disabled={!candData.state}
                          required
                        >
                          <option value="">{candData.state ? 'Select City' : 'Select State first'}</option>
                          {availableCities.map((ct) => (
                            <option key={ct} value={ct}>{ct}</option>
                          ))}
                          {candData.state && <option value="__OTHER__">Other (Enter manually)</option>}
                        </select>
                      )}
                    </Field>
                  </div>

                  <div>
                    <label htmlFor="cand-password" className={FIELD_LABEL}>
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <Field icon={Lock}>
                      <input id="cand-password" type={showCandPassword ? 'text' : 'password'} name="password" autoComplete="new-password"
                        className={FIELD_INPUT} placeholder="••••••••" value={candData.password} onChange={handleCandChange} required />
                      <button type="button" tabIndex={-1} onClick={() => setShowCandPassword(!showCandPassword)}
                        className="shrink-0 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0.5">
                        {showCandPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </Field>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="cand-confirm" className={`${FIELD_LABEL} mb-0`}>
                        Confirm password <span className="text-rose-500">*</span>
                      </label>
                      {candData.confirm_password && (
                        candData.password === candData.confirm_password ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                            <Check size={11} strokeWidth={2.5} /> Match
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500">
                            <X size={11} strokeWidth={2.5} /> No match
                          </span>
                        )
                      )}
                    </div>
                    <Field icon={Lock} error={candData.confirm_password && candData.password !== candData.confirm_password}>
                      <input id="cand-confirm" type={showCandConfirmPassword ? 'text' : 'password'} name="confirm_password" autoComplete="new-password"
                        className={FIELD_INPUT} placeholder="••••••••" value={candData.confirm_password} onChange={handleCandChange} required />
                      <button type="button" tabIndex={-1} onClick={() => setShowCandConfirmPassword(!showCandConfirmPassword)}
                        className="shrink-0 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0.5">
                        {showCandConfirmPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </Field>
                  </div>
                </div>

                <button type="submit" className={`${PRIMARY_BTN} mt-3.5`} disabled={loading}>
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {loading ? 'Creating account…' : 'Create account'}
                </button>
              </form>

              <p className="text-center text-[12px] text-slate-400 mt-3">
                Already have an account?{' '}
                <button type="button" className="bg-transparent border-none text-[#1E3155] font-semibold cursor-pointer underline"
                  onClick={() => { setMode('login'); setError(''); }}>
                  Sign in
                </button>
              </p>
            </div>
          )}

          {/* 3B. RECRUITER REGISTRATION */}
          {mode === 'register_company' && (
            <div className="flex flex-col h-full">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-[17px] font-semibold text-[#12141C]">Create recruiter account</h3>
                  <p className="text-[12.5px] text-slate-500 mt-0.5">Register with your company's business email.</p>
                </div>
                <button
                  type="button"
                  className="bg-transparent border-none text-[#1E3155] font-semibold text-[12.5px] cursor-pointer shrink-0"
                  onClick={() => { setMode('select_role'); setError(''); }}
                >
                  Change role
                </button>
              </div>

              <div className="flex items-center gap-2 bg-[#FFF8EC] border border-[#F2A93B]/30 rounded-[9px] px-2.5 py-1.5 mb-3">
                <ShieldCheck size={13} className="text-[#B5791A] shrink-0" />
                <p className="text-[11px] text-[#7A5312] leading-tight">
                  Business email required — free providers like @gmail.com aren't accepted.
                </p>
              </div>

              <form onSubmit={handleCompanyRegister} className="flex flex-col flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2">
                  <div>
                    <label htmlFor="comp-full-name" className={FIELD_LABEL}>
                      Full name <span className="text-rose-500">*</span>
                    </label>
                    <Field icon={User}>
                      <input id="comp-full-name" type="text" name="full_name" autoComplete="name" className={FIELD_INPUT}
                        placeholder="e.g. Sarah Jenkins" value={compData.full_name} onChange={handleCompChange} required />
                    </Field>
                  </div>

                  <div>
                    <label htmlFor="comp-name" className={FIELD_LABEL}>
                      Company name <span className="text-rose-500">*</span>
                    </label>
                    <Field icon={Building2}>
                      <input id="comp-name" type="text" name="company_name" autoComplete="organization" className={FIELD_INPUT}
                        placeholder="GrowthX Agency" value={compData.company_name} onChange={handleCompChange} required />
                    </Field>
                  </div>

                  <div>
                    <label htmlFor="comp-email" className={FIELD_LABEL}>
                      Business email <span className="text-rose-500">*</span>
                    </label>
                    <Field icon={Mail}>
                      <input id="comp-email" type="email" name="email" autoComplete="email" className={FIELD_INPUT}
                        placeholder="hr@growthmarketers.com" value={compData.email} onChange={handleCompChange} required />
                    </Field>
                  </div>

                  <div>
                    <label htmlFor="comp-phone" className={FIELD_LABEL}>
                      Phone number <span className="text-rose-500">*</span>
                    </label>
                    <Field icon={Phone}>
                      <input id="comp-phone" type="tel" name="phone" autoComplete="tel" className={FIELD_INPUT}
                        placeholder="+1 (555) 382-9102" value={compData.phone} onChange={handleCompChange} required />
                    </Field>
                  </div>

                  <div>
                    <label htmlFor="comp-website" className={FIELD_LABEL}>
                      Company website <span className="text-rose-500">*</span>
                    </label>
                    <Field icon={Globe}>
                      <input id="comp-website" type="url" name="website" autoComplete="url" className={FIELD_INPUT}
                        placeholder="https://agency.com" value={compData.website} onChange={handleCompChange} required />
                    </Field>
                  </div>

                  <div>
                    <label htmlFor="comp-location" className={FIELD_LABEL}>
                      Headquarters <span className="text-rose-500">*</span>
                    </label>
                    <Field icon={MapPin}>
                      <input id="comp-location" type="text" name="location" autoComplete="address-level2" className={FIELD_INPUT}
                        placeholder="e.g. Bengaluru / New York" value={compData.location} onChange={handleCompChange} required />
                    </Field>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="comp-size" className={FIELD_LABEL}>
                      Company size <span className="text-rose-500">*</span>
                    </label>
                    <Field icon={Users}>
                      <select
                        id="comp-size"
                        name="company_size"
                        className={`${FIELD_INPUT} cursor-pointer bg-transparent`}
                        value={compData.company_size}
                        onChange={handleCompChange}
                        required
                      >
                        <option value="" disabled className="text-slate-400">Select company size...</option>
                        <option value="1-10">1–10 employees (Startup / Seed)</option>
                        <option value="11-50">11–50 employees (Early Stage)</option>
                        <option value="51-200">51–200 employees (Mid Size / Scaling)</option>
                        <option value="201-500">201–500 employees (Growth Enterprise)</option>
                        <option value="501-1000">501–1,000 employees (Enterprise)</option>
                        <option value="1000+">1,000+ employees (Large Global Corp)</option>
                      </select>
                    </Field>
                  </div>

                  <div>
                    <label htmlFor="comp-password" className={FIELD_LABEL}>
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <Field icon={Lock}>
                      <input id="comp-password" type={showCompPassword ? 'text' : 'password'} name="password" autoComplete="new-password"
                        className={FIELD_INPUT} placeholder="••••••••" value={compData.password} onChange={handleCompChange} required />
                      <button type="button" tabIndex={-1} onClick={() => setShowCompPassword(!showCompPassword)}
                        className="shrink-0 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0.5">
                        {showCompPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </Field>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="comp-confirm" className={`${FIELD_LABEL} mb-0`}>
                        Confirm password <span className="text-rose-500">*</span>
                      </label>
                      {compData.confirm_password && (
                        compData.password === compData.confirm_password ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                            <Check size={11} strokeWidth={2.5} /> Match
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500">
                            <X size={11} strokeWidth={2.5} /> No match
                          </span>
                        )
                      )}
                    </div>
                    <Field icon={Lock} error={compData.confirm_password && compData.password !== compData.confirm_password}>
                      <input id="comp-confirm" type={showCompConfirmPassword ? 'text' : 'password'} name="confirm_password" autoComplete="new-password"
                        className={FIELD_INPUT} placeholder="••••••••" value={compData.confirm_password} onChange={handleCompChange} required />
                      <button type="button" tabIndex={-1} onClick={() => setShowCompConfirmPassword(!showCompConfirmPassword)}
                        className="shrink-0 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0.5">
                        {showCompConfirmPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </Field>
                  </div>
                </div>

                <button type="submit" className={`${PRIMARY_BTN} mt-3.5`} disabled={loading}>
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {loading ? 'Creating account…' : 'Create account'}
                </button>
              </form>

              <p className="text-center text-[12px] text-slate-400 mt-3">
                Already have an account?{' '}
                <button type="button" className="bg-transparent border-none text-[#1E3155] font-semibold cursor-pointer underline"
                  onClick={() => { setMode('login'); setError(''); }}>
                  Sign in
                </button>
              </p>
            </div>
          )}
        </div>
      </div>

      {otpModalData && (
        <OTPModal
          email={otpModalData.email}
          onSuccess={(verifiedUser) => {
            setOtpModalData(null);
            const isVendor = verifiedUser?.profile?.plan_type === 'CUSTOM_VENDOR' || Boolean(tenantInfo) || Boolean(tenant) || Boolean(getDetectedTenantSubdomain());
            if (!isVendor && verifiedUser?.role === 'ADMIN' && (verifiedUser?.profile?.plan_type === 'NONE' || verifiedUser?.profile?.plan_status === 'PENDING')) {
              setOnboardingUser(verifiedUser);
            } else {
              if (onAuthSuccess) onAuthSuccess(verifiedUser);
            }
          }}
          onClose={() => setOtpModalData(null)}
        />
      )}

      {showForgotModal && (
        <ForgotPasswordModal
          initialEmail={loginEmail}
          onSuccess={(resetEmail) => {
            setShowForgotModal(false);
            if (resetEmail) setLoginEmail(resetEmail);
            setResetSuccessMsg('Your password has been successfully reset! Please sign in with your new password.');
          }}
          onClose={() => setShowForgotModal(false)}
        />
      )}

      {onboardingUser && onboardingUser?.profile?.plan_type !== 'CUSTOM_VENDOR' && !tenant && !tenantInfo && (
        <PlanSelectionModal
          isOpen={true}
          isInitialOnboarding={true}
          onSuccess={() => {
            const u = onboardingUser;
            setOnboardingUser(null);
            if (onAuthSuccess) onAuthSuccess(u);
          }}
        />
      )}
    </div>
  );
}
