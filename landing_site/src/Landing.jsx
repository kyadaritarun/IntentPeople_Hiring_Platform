import React, { useState, useEffect, useRef } from "react";
import { api, DEFAULT_PLANS } from "./api";
import RolesExplorer from "./RolesExplorer";
import Header from "./Header";
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Building2,
  UserCheck,
  CheckCircle,
  Briefcase,
  Users,
  Sparkles,
  ShieldCheck,
  Star,
  Target,
  Clock,
  Compass,
  Zap,
  TrendingUp,
  Layers,
  Award,
  Globe,
  Check,
  ChevronUp,
  EyeOff,
  Send,
  DollarSign,
  CheckCircle2,
  Lock,
  Eye,
  Crown,
  X,
  CreditCard,
  HelpCircle,
  Info
} from "lucide-react";

const TRUSTED_COMPANIES = [
  {
    name: "Aptroid Consulting PVT.LTD",
    logo: "/images/aptroid_consulting_india_pvt_ltd_logo.jpg",
  },
  {
    name: "Zeta Global",
    logo: "/images/zetaglobal_logo.jpg",
  },
  {
    name: "Premier People Logistic Solutions",
    logo: "/images/premiere_people_logistic_solutions_logo.jpg",
  },
  {
    name: "Vrinda Techapps",
    logo: "/images/vrindaio_logo.jpg",
  },
  {
    name: "Leapfront Technologies",
    logo: "/images/leapfront_technologies_logo.jpg",
  },
  {
    name: "WhiteScholars",
    logo: "/images/whitescholars_academy_logo.jpg",
  },
  {
    name: "Fort Dental",
    logo: "/images/finalogo1-r8lpqtllrjcodssw688ueq04bas5c7fs19f3gkuzxk.webp",
  },
];

export default function Landing({ onNavigateToAuth, onNavigateToView, onOpenTerms, onOpenPrivacy }) {
  const [plans, setPlans] = useState(DEFAULT_PLANS);
  const [plansLoading, setPlansLoading] = useState(false);
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const [rolesMenuOpen, setRolesMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [selectedJourney, setSelectedJourney] = useState(null);

  // Initial scroll if URL contains #pricing or /pricing
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      (window.location.hash === "#pricing" || window.location.pathname === "/pricing")
    ) {
      const timer = setTimeout(() => {
        const el = document.getElementById("pricing");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handlePricingClick = (e) => {
    if (e) e.preventDefault();
    const el = document.getElementById("pricing");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      if (window.location.hash !== "#pricing") {
        window.history.pushState(null, "", "#pricing");
      }
    }
  };

  const handleChoosePlan = (plan) => {
    handleStartHiring();
  };

  // Load subscription plans from API with fallback
  useEffect(() => {
    let isMounted = true;
    api
      .getSubscriptionPlans()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setPlans(data);
        }
      })
      .catch((err) => {
        console.warn("Could not load plans for landing site:", err);
      })
      .finally(() => {
        if (isMounted) setPlansLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const closeDropdown = (e) => {
      // If target element is already detached from DOM (unmounted by React during state update), do not close
      if (!e.target || !document.body.contains(e.target)) return;

      if (!e.target.closest("#login-dropdown-container")) {
        setLoginDropdownOpen(false);
      }
      if (!e.target.closest("#roles-nav-container") && !e.target.closest("#roles-header-dropdown")) {
        setRolesMenuOpen(false);
      }
    };
    window.addEventListener("click", closeDropdown);
    return () => window.removeEventListener("click", closeDropdown);
  }, []);

  // Handlers for authentication routing
  const handleCandidateLogin = () => {
    if (onNavigateToAuth) onNavigateToAuth("login_candidate");
  };

  const handleRecruiterLogin = () => {
    if (onNavigateToAuth) onNavigateToAuth("login_recruiter");
  };

  const handleGetStarted = () => {
    if (onNavigateToAuth) onNavigateToAuth("select_role");
  };

  const handleStartHiring = () => {
    if (onNavigateToAuth) onNavigateToAuth("register_company");
  };

  const handleExploreTalent = () => {
    if (onNavigateToAuth) onNavigateToAuth("register_candidate");
  };

  const toggleAccordion = (idx) => {
    setActiveAccordion((prev) => (prev === idx ? null : idx));
  };

  const focusJourney = (journeyKey, targetCardId) => {
    setSelectedJourney(journeyKey);
    if (journeyKey === "recruiter" && onNavigateToView) {
      onNavigateToView("recruiters");
      return;
    }
    if (journeyKey === "candidate" && onNavigateToView) {
      onNavigateToView("candidates");
      return;
    }
    const targetElement = document.getElementById(targetCardId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      targetElement.classList.add("journey-highlight");
      setTimeout(() => {
        targetElement.classList.remove("journey-highlight");
      }, 2500);
    }
  };

  return (
    <div className="font-sans antialiased flex flex-col min-h-screen bg-[#FAF9F6] text-[#0F172A] selection:bg-indigo-600 selection:text-white relative">
      <div className="grain-overlay" aria-hidden="true" />
      <div className="ambient-field" aria-hidden="true" />

      {/* ============================================================
           HEADER & NAVIGATION (SHARED COMPONENT)
           ============================================================ */}
      <Header
        currentView="landing"
        onNavigateToView={onNavigateToView}
        onNavigateToAuth={onNavigateToAuth}
        rolesMenuOpen={rolesMenuOpen}
        setRolesMenuOpen={setRolesMenuOpen}
      />

      {/* ============================================================
           HERO SECTION
           ============================================================ */}
      <section id="home" className="relative pt-24 pb-16 md:pt-32 md:pb-24 px-6 overflow-hidden bg-[#FAF9F6]">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-[-10%] right-[-8%] w-[32rem] h-[32rem] rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute bottom-[-15%] left-[-10%] w-[26rem] h-[26rem] rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-dot-pattern opacity-[0.06]" />
        </div>

        <div className="max-w-7xl mx-auto relative">
          {/* Top Row: Content + Interactive Visual Dossier */}
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-14">
            <div className="flex-1 text-center md:text-left">
              <span className="eyebrow justify-center md:justify-start mb-5">
                THE DIGITAL MARKETING & GROWTH TALENT PLATFORM
              </span>

              <h1 className="font-serif text-[2.5rem] leading-[1.12] sm:text-5xl md:text-[3.25rem] font-medium text-[#0F172A] mb-6 max-w-2xl mx-auto md:mx-0">
                <span className="font-serif text-indigo-600 italic">Hire marketers</span> who've already grown businesses like yours.
              </h1>

              <p className="text-[#526071] text-base md:text-lg leading-relaxed mb-6 max-w-xl mx-auto md:mx-0">
                IntentPeople connects verified marketing skills with genuine opportunities, making it easier for professionals to find the right role and companies to find the right talent.
              </p>

              {/* 3 Value Badges */}
              <div className="hidden md:flex items-center gap-7 text-sm font-semibold text-[#526071] mb-8">
                <div className="flex items-center gap-2">
                  <span className="text-indigo-600 font-bold">✓</span> AI-Verified Talent Profiles
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-indigo-600 font-bold">✓</span> Real Campaign Portfolios
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-indigo-600 font-bold">✓</span> Zero-Spam
                </div>
              </div>

              {/* Hero Action Buttons */}
              <div className="flex flex-col items-center md:items-start gap-3">
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                  <button
                    onClick={handleStartHiring}
                    type="button"
                    className="btn btn-primary w-full sm:w-auto text-center font-semibold py-3.5 px-8 rounded-lg shadow-sm hover:shadow-md cursor-pointer"
                  >
                    Start Hiring Now
                  </button>
                  <a
                    href="#recruiters"
                    className="btn btn-secondary w-full sm:w-auto text-center font-semibold py-3.5 px-8 rounded-lg cursor-pointer no-underline"
                  >
                    Explore Hiring
                  </a>
                </div>
                <span className="text-[11.5px] text-[#526071] ml-0.5">
                  Not sure where to start? We'll help you find the right place.
                </span>
              </div>
            </div>

            {/* Right Column: 3 Interactive Tilted Marketer Cards */}
            <div className="flex-1 w-full max-w-[560px] mx-auto relative mt-8 lg:mt-0 flex items-center justify-center">
              {/* Soft Ambient Radial Backdrop */}
              <div className="absolute -inset-4 sm:-inset-6 rounded-[3rem] bg-gradient-to-tr from-indigo-500/10 via-amber-500/10 to-rose-500/10 blur-3xl pointer-events-none" />

              {/* Responsive Container for the 3 Overlapping Tilted Cards */}
              <div className="relative w-full h-[470px] sm:h-[510px] flex items-center justify-center">
                <div className="relative w-[340px] sm:w-[500px] h-[450px] sm:h-[490px] scale-[0.82] sm:scale-100 origin-center transition-transform">

                  {/* ── Card 2: Growth Marketer (Center Top) ── */}
                  <div
                    onClick={() => onNavigateToAuth ? onNavigateToAuth("login_recruiter") : null}
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[220px] sm:w-[245px] bg-white rounded-2xl p-2.5 sm:p-3 shadow-xl shadow-slate-900/10 border border-slate-100/90 z-10 transition-all duration-300 ease-out hover:z-30 hover:rotate-0 hover:scale-105 hover:shadow-2xl cursor-pointer -rotate-[1deg]"
                  >
                    <div className="rounded-xl overflow-hidden aspect-[4/3] mb-2.5 bg-slate-100">
                      <img
                        src="/images/marketer_growth.jpg"
                        alt="Growth Marketer"
                        className="w-full h-full object-cover object-top select-none pointer-events-none"
                        loading="eager"
                      />
                    </div>
                    <div className="px-1">
                      <h4 className="text-sm sm:text-[15px] font-extrabold text-slate-900 tracking-tight mb-2">
                        Growth Marketer
                      </h4>
                      <div className="flex items-center gap-3 mb-2.5">
                        {/* Aptroid Consulting */}
                        <div className="flex items-center gap-1.5">
                          <img
                            src="/images/aptroid_consulting_india_pvt_ltd_logo.jpg"
                            alt="Aptroid Consulting"
                            className="w-4 h-4 rounded object-contain shrink-0"
                          />
                          <span className="font-black text-[#EB1700] text-[10.5px] tracking-wider uppercase font-sans">Aptroid Consulting</span>
                        </div>
                        
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="bg-slate-100/90 border border-slate-200/70 text-slate-700 text-[10.5px] font-semibold px-2 py-0.5 rounded-md whitespace-nowrap">
                          +400K Merchants
                        </span>
                        <span className="bg-slate-100/90 border border-slate-200/70 text-slate-700 text-[10.5px] font-semibold px-2 py-0.5 rounded-md whitespace-nowrap">
                          +$100M Scale
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ── Card 1: SEO & Content Marketer (Bottom Left) ── */}
                  <div
                    onClick={() => onNavigateToAuth ? onNavigateToAuth("login_recruiter") : null}
                    className="absolute bottom-2 left-0 sm:left-2 w-[220px] sm:w-[245px] bg-white rounded-2xl p-2.5 sm:p-3 shadow-xl shadow-slate-900/10 border border-slate-100/90 z-20 transition-all duration-300 ease-out hover:z-30 hover:rotate-0 hover:scale-105 hover:shadow-2xl cursor-pointer -rotate-[6deg]"
                  >
                    <div className="rounded-xl overflow-hidden aspect-[4/3] mb-2.5 bg-slate-100">
                      <img
                        src="/images/marketer_seo.jpg"
                        alt="SEO & Content Marketer"
                        className="w-full h-full object-cover object-top select-none pointer-events-none"
                        loading="eager"
                      />
                    </div>
                    <div className="px-1">
                      <h4 className="text-sm sm:text-[15px] font-extrabold text-slate-900 tracking-tight mb-2">
                        SEO & Content Marketer
                      </h4>
                      <div className="flex items-center gap-2 mb-2.5">
                       
                        {/* Zeta Global */}
                        <div className="flex items-center gap-1.5">
                          <img
                            src="/images/zetaglobal_logo.jpg"
                            alt="Zeta Global"
                            className="w-4 h-4 rounded object-contain shrink-0"
                          />
                          <span className="text-[10px] font-bold text-[#F22F46] tracking-tight">Zeta Global</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="bg-slate-100/90 border border-slate-200/70 text-slate-700 text-[10.5px] font-semibold px-2 py-0.5 rounded-md whitespace-nowrap">
                          +377% Revenue
                        </span>
                        <span className="bg-slate-100/90 border border-slate-200/70 text-slate-700 text-[10.5px] font-semibold px-2 py-0.5 rounded-md whitespace-nowrap">
                          +195% Traffic
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ── Card 3: Head of Marketing (Bottom Right) ── */}
                  <div
                    onClick={() => onNavigateToAuth ? onNavigateToAuth("login_recruiter") : null}
                    className="absolute bottom-6 right-0 sm:right-2 w-[220px] sm:w-[245px] bg-white rounded-2xl p-2.5 sm:p-3 shadow-xl shadow-slate-900/10 border border-slate-100/90 z-20 transition-all duration-300 ease-out hover:z-30 hover:rotate-0 hover:scale-105 hover:shadow-2xl cursor-pointer rotate-[6deg]"
                  >
                    <div className="rounded-xl overflow-hidden aspect-[4/3] mb-2.5 bg-pink-50">
                      <img
                        src="/images/marketer_head.jpg"
                        alt="Head of Marketing"
                        className="w-full h-full object-cover object-top select-none pointer-events-none"
                        loading="eager"
                      />
                    </div>
                    <div className="px-1">
                      <h4 className="text-sm sm:text-[15px] font-extrabold text-slate-900 tracking-tight mb-2">
                        Head of Marketing
                      </h4>
                      <div className="flex items-center gap-2.5 mb-2.5">
                        {/* WhiteScholars */}
                        <div className="flex items-center gap-1.5">
                          <img
                            src="/images/whitescholars_academy_logo.jpg"
                            alt="WhiteScholars"
                            className="w-4 h-4 rounded object-contain shrink-0"
                          />
                          <span className="text-[11px] font-bold text-slate-800 tracking-tight">
                            WhiteScholars
                          </span>
                        </div>                        
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="bg-slate-100/90 border border-slate-200/70 text-slate-700 text-[10.5px] font-semibold px-2.5 py-0.5 rounded-md whitespace-nowrap">
                          50K+ Students
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* Trusted Companies Ribbon (Social Proof) */}
          <div className="mt-14 pt-8 pb-3 border-t border-slate-200/80 w-full overflow-hidden">
            <p className="text-center text-[10.5px] sm:text-xs font-bold uppercase tracking-widest text-slate-500 mb-6">
              TRUSTED BY 500+ FAST-GROWING COMPANIES
            </p>
            {/* Infinite Marquee with edge gradient fade */}
            <div className="relative w-full overflow-hidden py-1 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
              <div className="animate-trust-marquee flex items-center gap-4">
                {[...TRUSTED_COMPANIES, ...TRUSTED_COMPANIES].map((company, idx) => (
                  <div
                    key={`${company.name}-${idx}`}
                    className="bg-white rounded-2xl border border-slate-200/85 px-3.5 py-2 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex items-center gap-3 shrink-0 cursor-default"
                  >
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white border border-slate-200/80 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                      <img
                        src={company.logo}
                        alt={company.name}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    </div>
                    <span className="text-xs sm:text-[13px] font-bold text-slate-900 tracking-tight leading-snug whitespace-nowrap">
                      {company.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Row: Interactive Role Pathway Selector */}
          <div className="mt-10 pt-10 border-t border-slate-200/90 w-full">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-2">
              <div>
                <span className="eyebrow text-xs uppercase tracking-wider mb-1.5 block">
                  CHOOSE YOUR OBJECTIVE
                </span>
                <h3 className="font-serif text-xl md:text-2xl font-semibold text-[#0F172A]">
                  Tailored pathways for employers, marketers, and growth teams
                </h3>
              </div>
              <p className="text-xs text-[#526071] max-w-sm">
                Select your role to access dedicated talent screening tools, verified candidate portfolios, or multi-seat infrastructure.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Card 1: Hiring Teams & Recruiters */}
              <div
                className={`relative flex flex-col justify-between p-6 rounded-2xl bg-white border transition-all duration-300 ${selectedJourney === "recruiter"
                  ? "border-indigo-600 shadow-xl shadow-indigo-500/10 ring-2 ring-indigo-500/20"
                  : "border-slate-200 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/5"
                  }`}
                onMouseEnter={() => setSelectedJourney("recruiter")}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                        For Employers
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        1.4K+ Profiles
                      </span>
                    </div>
                  </div>

                  <h4 className="text-base font-bold text-[#0F172A] mb-1.5">
                    Hire Verified Growth Leaders
                  </h4>
                  <p className="text-xs leading-relaxed text-[#526071] mb-4">
                    Find marketing professionals with verified skills, real project experience, and proven performance not just impressive resumes. Get access to relevant, pre-vetted candidates and spend less time screening and more time talking to the right talent.
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 mb-5 text-[11px] font-medium text-slate-600">
                    <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200">
                      ⚡ 48h Shortlists
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200">
                      📊 Verified ROAS
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200">
                      🎯 Zero Commission
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleStartHiring}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm hover:shadow transition-all cursor-pointer"
                  >
                    <span>Start Hiring</span>
                    <ArrowRight size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => focusJourney("recruiter", "recruiters")}
                    className="py-2.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Employer Features
                  </button>
                </div>
              </div>

              {/* Card 2: Growth Marketers & Candidates */}
              <div
                className={`relative flex flex-col justify-between p-6 rounded-2xl bg-white border transition-all duration-300 ${selectedJourney === "candidate"
                  ? "border-emerald-600 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500/20"
                  : "border-slate-200 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/5"
                  }`}
                onMouseEnter={() => setSelectedJourney("candidate")}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                      <Compass className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                        For Marketers
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        100% Confidential
                      </span>
                    </div>
                  </div>

                  <h4 className="text-base font-bold text-[#0F172A] mb-1.5">
                    Advance Your Marketing Career
                  </h4>
                  <p className="text-xs leading-relaxed text-[#526071] mb-4">
                    Showcase your skills, campaigns, and results and get discovered by companies looking for marketing talent.
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 mb-5 text-[11px] font-medium text-slate-600">
                    <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200">
                      🔒 Masked Profiles
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200">
                      💼 Direct Inbounds
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200">
                      ✨ 100% Free
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleCandidateLogin}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm hover:shadow transition-all cursor-pointer"
                  >
                    <span>Join Talent Network</span>
                    <ArrowRight size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => focusJourney("candidate", "candidates")}
                    className="py-2.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Candidate Benefits
                  </button>
                </div>
              </div>

              {/* Card 3: Roles & Taxonomy */}
              <div
                className={`relative flex flex-col justify-between p-6 rounded-2xl bg-white border transition-all duration-300 ${selectedJourney === "roles"
                  ? "border-amber-500 shadow-xl shadow-amber-500/10 ring-2 ring-amber-500/20"
                  : "border-slate-200 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/5"
                  }`}
                onMouseEnter={() => setSelectedJourney("roles")}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
                      <Target className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                        Roles
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        Curated Directory
                      </span>
                    </div>
                  </div>

                  <h4 className="text-base font-bold text-[#0F172A] mb-1.5">
                    Matched to Your Industry, Scale &amp; Tools
                  </h4>
                  <p className="text-xs leading-relaxed text-[#526071] mb-4">
                    Not only is your marketer a pro, they have experience helping companies exactly like yours. We match on millions of data points, including industry, growth stage, and specific challenges.
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 mb-5 text-[11px] font-medium text-slate-600">
                    <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200">
                      🎯 Exact Industry Fit
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200">
                      📊 Growth Stage Match
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200">
                      🛠️ Tool Stack Aligned
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setRolesMenuOpen(true)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm hover:shadow transition-all cursor-pointer border-none"
                  >
                    <span>Explore Roles</span>
                    <ArrowRight size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRolesMenuOpen(true);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="py-2.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer text-center bg-transparent"
                  >
                    Directory
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* ============================================================
           RECRUITER HIRING SECTION (FOR EMPLOYERS & HIRING MANAGERS)
           ============================================================ */}
      <section id="recruiters" className="py-16 md:py-24 px-6 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="max-w-3xl mb-12">
            <span className="eyebrow mb-3 text-[#FF6008]">FOR EMPLOYERS & RECRUITING TEAMS</span>
            <h2 className="font-serif text-3xl md:text-4xl font-medium text-[#0F172A] leading-tight mb-4">
              Hire audited Top 1% growth marketers in 48 hours. Zero agency markups.
            </h2>
            <p className="text-[#526071] text-base leading-relaxed">
              Stop sifting through keyword-stuffed CVs and sluggish agencies. IntentPeople matches your exact growth requirements with pre-evaluated candidates whose campaign ROAS, platform spend histories, and domain skills are already verified.
            </p>
          </div>

          {/* Split Content: Visual Showcase & Feature Cards */}
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            {/* Visual Card Column (5 Cols) */}
            <div className="lg:col-span-5">
              <div className="bg-[#FAF9F6] border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm relative group overflow-hidden">
                <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-md">
                  <img
                    loading="lazy"
                    decoding="async"
                    src="/images/journey_recruiter.jpg"
                    alt="Recruiter Hiring Suite"
                    className="w-full h-80 sm:h-96 object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Floating Badges */}
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-200/80 shadow-md flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#FF6008] animate-ping" />
                    <span className="text-xs font-bold text-[#0F172A]">⚡ 48h Shortlist Guarantee</span>
                  </div>
                  <div className="absolute bottom-4 right-4 bg-[#0F172A]/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/80 shadow-lg text-white text-right">
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider m-0">Zero Recruitment Tax</p>
                    <p className="text-xs font-semibold m-0">0% Placement Fees</p>
                  </div>
                </div>

                {/* Quick Value Metrics */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-200/80 text-center">
                  <div className="p-2 rounded-xl bg-white border border-slate-200/60">
                    <p className="text-base font-extrabold text-[#FF6008] m-0">48h</p>
                    <p className="text-[10px] font-semibold text-slate-500 m-0">Shortlist Speed</p>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-slate-200/60">
                    <p className="text-base font-extrabold text-emerald-600 m-0">₹0</p>
                    <p className="text-[10px] font-semibold text-slate-500 m-0">Commission</p>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-slate-200/60">
                    <p className="text-base font-extrabold text-purple-600 m-0">9 Days</p>
                    <p className="text-[10px] font-semibold text-slate-500 m-0">Avg. Time-to-Offer</p>
                  </div>
                </div>

                {/* CTAs */}
                <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
                  <button
                    onClick={handleStartHiring}
                    type="button"
                    className="btn btn-primary flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-center cursor-pointer shadow-sm"
                  >
                    Start Hiring Marketers &rarr;
                  </button>
                  <button
                    onClick={handleRecruiterLogin}
                    type="button"
                    className="btn btn-secondary py-3 px-4 rounded-xl text-xs font-semibold text-center cursor-pointer"
                  >
                    Recruiter Sign In
                  </button>
                </div>
              </div>
            </div>

            {/* Feature Blocks Column (7 Cols) */}
            <div className="lg:col-span-7 grid sm:grid-cols-2 gap-5">
              {/* Feature 1: Audited Ad Spend */}
              <div className="p-6 rounded-2xl bg-[#FAF9F6] border border-slate-200 hover:border-orange-400 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF6008] mb-4 shadow-2xs">
                  <TrendingUp size={20} />
                </div>
                <h3 className="font-serif font-semibold text-lg text-[#0F172A] mb-2">
                  Know Their Real Marketing Experience
                </h3>
                <p className="text-xs text-[#526071] leading-relaxed">
                  See the marketing experience behind the resume, campaigns managed, ad spend handled, ROAS achieved, CAC delivered, and channels worked across. Get a clearer picture of a marketer’s real performance before bringing them into the interview process.
                </p>
              </div>

              {/* Feature 2: 48h Shortlists */}
              <div className="p-6 rounded-2xl bg-[#FAF9F6] border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4 shadow-2xs">
                  <Clock size={20} />
                </div>
                <h3 className="font-serif font-semibold text-lg text-[#0F172A] mb-2">
                  48-Hour Turnaround
                </h3>
                <p className="text-xs text-[#526071] leading-relaxed">
                  Submit your requisition details and target channels. Our algorithmic matcher delivers 3 to 5 pre-evaluated, interview-ready candidate dossiers with complete skill rubrics within 2 business days.
                </p>
              </div>

              {/* Feature 3: 0% Placement Commissions */}
              <div className="p-6 rounded-2xl bg-[#FAF9F6] border border-slate-200 hover:border-purple-400 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-4 shadow-2xs">
                  <CheckCircle2 size={20} />
                </div>
                <h3 className="font-serif font-semibold text-lg text-[#0F172A] mb-2">
                  Zero Placement Cuts
                </h3>
                <p className="text-xs text-[#526071] leading-relaxed">
                  Never pay 20% to 30% first-year recruitment agency bounties. Keep 100% of your compensation budget for the talent. Enjoy transparent platform access with zero per-hire penalties.
                </p>
              </div>

              {/* Feature 4: Collaborative Pipeline */}
              <div className="p-6 rounded-2xl bg-[#FAF9F6] border border-slate-200 hover:border-cyan-400 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 mb-4 shadow-2xs">
                  <Users size={20} />
                </div>
                <h3 className="font-serif font-semibold text-lg text-[#0F172A] mb-2">
                  Multi-Seat Hiring Pods
                </h3>
                <p className="text-xs text-[#526071] leading-relaxed">
                  Invite your CMO, founders, and hiring committee into a synchronized hiring pipeline. Score standardized rubrics, leave private interview feedback, and release offers in one click.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
           CANDIDATE HIRING SECTION (FOR MARKETERS & GROWTH PRACTITIONERS)
           ============================================================ */}
      <section id="candidates" className="py-16 md:py-24 px-6 bg-[#FAF9F6] border-b border-slate-200">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="max-w-3xl mb-12">
            <span className="eyebrow mb-3 text-emerald-700">FOR MARKETERS & GROWTH PRACTITIONERS</span>
            <h2 className="font-serif text-3xl md:text-4xl font-medium text-[#0F172A] leading-tight mb-4">
              Get discovered by top scaling brands. No recruiters, zero resume spam.
            </h2>
            <p className="text-[#526071] text-base leading-relaxed">
              Create your verified talent dossier once. Let leading venture-backed startups, high-growth D2C brands, and tech companies apply directly to you with transparent upfront compensation.
            </p>
          </div>

          {/* Split Content: Feature Cards & Visual Showcase (Reversed Layout) */}
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            {/* Feature Blocks Column (7 Cols) */}
            <div className="lg:col-span-7 grid sm:grid-cols-2 gap-5 order-2 lg:order-1">
              {/* Feature 1: 100% Confidential */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4 shadow-2xs">
                  <EyeOff size={20} />
                </div>
                <h3 className="font-serif font-semibold text-lg text-[#0F172A] mb-2">
                  100% Confidential & Masked
                </h3>
                <p className="text-xs text-[#526071] leading-relaxed">
                  Your current employer and identity are masked by default. Explore high-growth leadership opportunities with complete discretion. You decide exactly when and to whom your profile is revealed.
                </p>
              </div>

              {/* Feature 2: Direct Inbound from Founders */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-orange-400 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF6008] mb-4 shadow-2xs">
                  <Send size={20} />
                </div>
                <h3 className="font-serif font-semibold text-lg text-[#0F172A] mb-2">
                  Direct Inbound from Founders
                </h3>
                <p className="text-xs text-[#526071] leading-relaxed">
                  No automated ATS black holes or junior recruiter phone tag. Verified hiring decision-makers pitch their company mission, channel priorities, and compensation directly to you.
                </p>
              </div>

              {/* Feature 3: Know What to Expect */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-4 shadow-2xs">
                  <Sparkles size={20} />
                </div>
                <h3 className="font-serif font-semibold text-lg text-[#0F172A] mb-2">
                  Know What to Expect
                </h3>
                <p className="text-xs text-[#526071] leading-relaxed">
                  Get a clear picture of the company, compensation, role expectations, required skills, and experience before you apply. No guesswork. Just the details you need to make an informed decision.
                </p>
              </div>

              {/* Feature 4: Apply Where You Fit */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#00a884] mb-4 shadow-2xs">
                  <Target size={20} />
                </div>
                <h3 className="font-serif font-semibold text-lg text-[#0F172A] mb-2">
                  Apply Where You Fit
                </h3>
                <p className="text-xs text-[#526071] leading-relaxed">
                  Find opportunities that match your skills, experience, and the work you've actually done. Spend less time applying to roles that aren't right for you and more time exploring opportunities where you can make a difference.
                </p>
              </div>
            </div>

            {/* Visual Card Column (5 Cols) */}
            <div className="lg:col-span-5 order-1 lg:order-2">
              <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm relative group overflow-hidden">
                <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-md">
                  <img
                    loading="lazy"
                    decoding="async"
                    src="/images/journey_candidate.jpg"
                    alt="Candidate Growth Dossier"
                    className="w-full h-80 sm:h-96 object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Floating Badges */}
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-200/80 shadow-md flex items-center gap-2">
                    <Lock size={13} className="text-emerald-600" />
                    <span className="text-xs font-bold text-[#0F172A]">Masked Profile Active</span>
                  </div>
                  <div className="absolute bottom-4 right-4 bg-[#0F172A]/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/80 shadow-lg text-white text-right">
                    <p className="text-[10px] text-teal-300 font-bold uppercase tracking-wider m-0">Verified Inbounds</p>
                    <p className="text-xs font-semibold m-0">₹24L – ₹55L CTC Roles</p>
                  </div>
                </div>

                {/* Quick Value Metrics */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-200/80 text-center">
                  <div className="p-2 rounded-xl bg-[#FAF9F6] border border-slate-200/60">
                    <p className="text-base font-extrabold text-emerald-600 m-0">100%</p>
                    <p className="text-[10px] font-semibold text-slate-500 m-0">Free for Talent</p>
                  </div>
                  <div className="p-2 rounded-xl bg-[#FAF9F6] border border-slate-200/60">
                    <p className="text-base font-extrabold text-[#FF6008] m-0">Top 1%</p>
                    <p className="text-[10px] font-semibold text-slate-500 m-0">Elite Network</p>
                  </div>
                  <div className="p-2 rounded-xl bg-[#FAF9F6] border border-slate-200/60">
                    <p className="text-base font-extrabold text-amber-600 m-0">Direct</p>
                    <p className="text-[10px] font-semibold text-slate-500 m-0">Founder Inbound</p>
                  </div>
                </div>

                {/* CTAs */}
                <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
                  <button
                    onClick={handleExploreTalent}
                    type="button"
                    className="btn bg-emerald-600 hover:bg-emerald-700 text-white flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-center cursor-pointer shadow-sm transition-colors"
                  >
                    Build Your Free Dossier &rarr;
                  </button>
                  <button
                    onClick={handleCandidateLogin}
                    type="button"
                    className="btn btn-secondary py-3 px-4 rounded-xl text-xs font-semibold text-center cursor-pointer"
                  >
                    Candidate Sign In
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* ============================================================
           PRICING & SUBSCRIPTION PLANS SECTION
           ============================================================ */}
      <section id="pricing" className="py-16 md:py-24 px-6 bg-[#FAF9F6] border-b border-slate-200 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="max-w-3xl mb-12 pb-6 border-b border-slate-200/80">
            <span className="eyebrow mb-2">TRANSPARENT SUBSCRIPTION TIERS</span>
            <h2 className="font-serif text-3xl md:text-4xl font-medium text-[#0F172A] leading-tight mb-3">
              Simple, predictable plans. Zero placement commissions.
            </h2>
            <p className="text-[#526071] text-sm md:text-base leading-relaxed m-0">
              Every plan includes pre-evaluated candidate dossiers, verified ad spend histories, and direct scheduling. Scale your hiring without percentage-based agency fees.
            </p>
          </div>

          {/* 3 Core Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {plans.map((plan) => {
              const isPopular = Boolean(plan.is_popular);
              const priceDisplay = plan.price_display || (plan.price === 0 ? "₹0" : `₹${plan.price?.toLocaleString()}`);

              return (
                <div
                  key={plan.id}
                  className={`rounded-3xl flex flex-col justify-between transition-all duration-300 relative ${isPopular
                      ? "bg-white border-2 border-indigo-600 shadow-xl hover:shadow-2xl md:-translate-y-2 p-7 lg:p-8"
                      : "bg-white border border-slate-200 shadow-sm hover:shadow-md p-7 lg:p-8"
                    }`}
                >
                  {/* Top Recommended Tag for Popular Plan */}
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[11px] font-bold tracking-wide uppercase px-4 py-1 rounded-full shadow-md flex items-center gap-1.5 whitespace-nowrap">
                      <Star size={11} className="fill-white" />
                      <span>Most Popular • Recommended</span>
                    </div>
                  )}

                  <div>
                    {/* Badge & Name */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${plan.badge_color || (isPopular ? "bg-indigo-50 text-indigo-700 border border-indigo-200" : "bg-slate-100 text-slate-700 border border-slate-200")
                        }`}>
                        {plan.badge || "Plan Tier"}
                      </span>
                    </div>

                    <h3 className="font-serif text-2xl font-bold text-[#0F172A] mb-1.5">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-[#526071] leading-relaxed mb-6 min-h-[36px]">
                      {plan.description || "Scalable recruitment tier for hiring managers and growth teams."}
                    </p>

                    {/* Price Header */}
                    <div className="pb-6 mb-6 border-b border-slate-100">
                      <div className="flex items-baseline gap-1">
                        <span className="font-serif text-4xl font-extrabold text-[#0F172A] tracking-tight">
                          {priceDisplay}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          / {plan.billing || (plan.price === 0 ? "forever" : `${plan.duration_days} days`)}
                        </span>
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-2.5 mb-8">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Included Platform Features:
                      </div>
                      {(plan.features || []).map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                          <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check size={10} className="stroke-[3]" />
                          </div>
                          <span className="leading-snug">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Plan Card Actions */}
                  <div className="pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleChoosePlan(plan)}
                      className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs ${isPopular
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg"
                          : plan.price === 0
                            ? "bg-slate-900 hover:bg-slate-800 text-white"
                            : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200"
                        }`}
                    >
                      <span>{plan.price === 0 ? "Get Started Free" : `Choose ${plan.name}`}</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Payment & Trust Guarantee Badges */}
          <div className="mt-10 pt-8 border-t border-slate-200/80 flex flex-wrap items-center justify-center gap-8 text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span>Instant platform activation via Razorpay</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard size={16} className="text-indigo-600" />
              <span>GST compliant tax invoices generated automatically</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-amber-500" />
              <span>0% Placement commissions • Zero hidden agency fees</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
           FINAL CALL TO ACTION SECTION (DUAL RECRUITER & CANDIDATE)
           ============================================================ */}
      <section className="py-16 md:py-24 px-6 bg-[#FAF9F6]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="eyebrow justify-center mb-3">ACCELERATE YOUR HIRING</span>
            <h2 className="font-serif text-3xl md:text-4xl font-medium text-[#0F172A] mb-3">
              Ready to transform how you hire and get hired?
            </h2>
            <p className="text-[#526071] text-sm md:text-base leading-relaxed">
              Join over 1,400+ growth practitioners and high-growth companies closing top marketing talent on IntentPeople.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Card 1: For Companies */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF6008] bg-orange-50 px-2.5 py-1 rounded-full inline-block mb-4">
                  For Hiring Teams
                </span>
                <h3 className="font-serif font-bold text-2xl text-[#0F172A] mb-2">
                  Need to hire growth talent?
                </h3>
                <p className="text-sm text-[#526071] leading-relaxed mb-6">
                  Post your requisition in 3 minutes. Receive pre-evaluated, audited candidate dossiers within 48 hours with 0% placement commission.
                </p>
              </div>
              <button
                onClick={handleStartHiring}
                type="button"
                className="btn btn-primary w-full py-3.5 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer shadow-xs"
              >
                Start Hiring Marketers &rarr;
              </button>
            </div>

            {/* Card 2: For Candidates */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full inline-block mb-4">
                  For Marketers
                </span>
                <h3 className="font-serif font-bold text-2xl text-[#0F172A] mb-2">
                  Ready for your next career move?
                </h3>
                <p className="text-sm text-[#526071] leading-relaxed mb-6">
                  Build your verified proof-of-work dossier. Keep your identity masked and receive direct interview offers from top startups.
                </p>
              </div>
              <button
                onClick={handleExploreTalent}
                type="button"
                className="btn bg-emerald-600 hover:bg-emerald-700 text-white w-full py-3.5 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer shadow-xs transition-colors"
              >
                Build Your Free Dossier &rarr;
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
           GLOBAL FOOTER
           ============================================================ */}
      <footer className="bg-[#0B132B] text-white py-12 px-6 border-t border-slate-800 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          {/* Brand Info */}
          <div className="flex items-center gap-3.5 text-left w-full md:w-auto">
            <img src="/logo.svg" alt="IntentPeople" className="h-9 w-auto object-contain flex-shrink-0" />
            <div className="flex flex-col justify-center text-left">
              <p className="text-slate-400 text-xs italic m-0">
                We identify executive growth talent before the rest of the market.
              </p>
            </div>
          </div>

          {/* Social Links & Copyright */}
          <div className="flex flex-col items-center md:items-end gap-3.5">
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={onOpenPrivacy}
                className="text-xs text-slate-400 hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer"
              >
                Privacy Policy
              </button>
              <button
                type="button"
                onClick={onOpenTerms}
                className="text-xs text-slate-400 hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer"
              >
                Terms of Service
              </button>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
            </div>
            <p className="text-xs text-slate-500 m-0">
              © {new Date().getFullYear()} IntentPeople. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
