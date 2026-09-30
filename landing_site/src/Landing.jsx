import React, { useState, useEffect, useRef } from "react";
import { api } from "./api";
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
} from "lucide-react";

/**
 * Animated Number Counter: supports both increasing (e.g. 0 -> 1,400)
 * and decreasing (e.g. 50 -> 1 for Top 1%) with smooth cubic easing.
 */
function AnimatedNumber({ from = 0, to, duration = 1800, decimals = 0, prefix = "", suffix = "" }) {
  const [value, setValue] = useState(from);
  const ref = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let startTime = null;
          const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic formula
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = from + (to - from) * easeOut;
            setValue(current);
            if (progress < 1) {
              requestAnimationFrame(step);
            } else {
              setValue(to);
            }
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.2 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [from, to, duration]);

  const display = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString();

  return (
    <span ref={ref} className="tabular-nums font-mono">
      {prefix}{display}{suffix}
    </span>
  );
}

/**
 * Animated Progress Bar: smoothly fills from 0% to target width when scrolled into view.
 */
function AnimatedProgressBar({ targetWidth, gradientClass }) {
  const [width, setWidth] = useState("0%");
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setWidth(targetWidth), 250);
        }
      },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [targetWidth]);

  return (
    <div ref={ref} className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
      <div
        className={`h-full ${gradientClass} rounded-full transition-all duration-1200 ease-out`}
        style={{ width }}
      />
    </div>
  );
}

export default function Landing({ onNavigateToAuth, onOpenTerms, onOpenPrivacy }) {
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [selectedJourney, setSelectedJourney] = useState(null);

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
      if (!e.target.closest("#login-dropdown-container")) {
        setLoginDropdownOpen(false);
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
           HEADER & NAVIGATION
           ============================================================ */}
      <header
        id="site-header"
        className="fixed w-full top-0 bg-[#FAF9F6]/95 backdrop-blur-md z-50 border-b border-slate-200/80 transition-all duration-300"
      >
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex justify-between items-center">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 font-serif font-semibold text-xl text-[#0F172A] hover:opacity-90 transition-opacity">
            <img src="/logo.svg" alt="IntentPeople" className="h-8 w-auto object-contain select-none" />
          </a>

          {/* Navigation Links */}
          <nav className="hidden md:flex gap-7 text-sm items-center text-[#526071] font-medium">
            <a href="#home" className="text-indigo-600 font-semibold border-b-2 border-indigo-600 pb-0.5">
              Home
            </a>
            <a href="#recruiters" className="hover:text-indigo-600 transition-colors">
              For Recruiters
            </a>
            <a href="#candidates" className="hover:text-indigo-600 transition-colors">
              For Candidates
            </a>
            <a href="#enterprise" className="hover:text-indigo-600 transition-colors">
              Enterprise
            </a>
            <a href="#stats" className="hover:text-indigo-600 transition-colors">
              Platform Stats
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3.5">
            {/* Split Login Dropdown */}
            <div id="login-dropdown-container" className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLoginDropdownOpen((prev) => !prev);
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
              >
                <span>Sign In</span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${loginDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {loginDropdownOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-slate-200/90 bg-white p-2 shadow-xl shadow-slate-900/10 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                >
                  <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Select Portal Access
                    </span>
                  </div>

                  {/* Candidate Login */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLoginDropdownOpen(false);
                      handleCandidateLogin();
                    }}
                    className="group flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition hover:bg-teal-50/80 border-none bg-transparent cursor-pointer"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-[#00a884] group-hover:bg-[#00a884] group-hover:text-white transition-colors shadow-2xs">
                      <UserCheck size={17} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-800 group-hover:text-teal-900 transition-colors flex items-center justify-between">
                        <span>Candidate Login</span>
                        <ChevronRight size={13} className="text-slate-400 group-hover:text-[#00a884] group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <p className="text-[11px] text-slate-500 truncate m-0 mt-0.5">
                        Jobs, applications & interviews
                      </p>
                    </div>
                  </button>

                  {/* Recruiter Login */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLoginDropdownOpen(false);
                      handleRecruiterLogin();
                    }}
                    className="group flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition hover:bg-indigo-50/80 border-none bg-transparent cursor-pointer mt-0.5"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-2xs">
                      <Building2 size={17} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-900 transition-colors flex items-center justify-between">
                        <span>Recruiter Login</span>
                        <ChevronRight size={13} className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <p className="text-[11px] text-slate-500 truncate m-0 mt-0.5">
                        Post jobs, pipelines & hire talent
                      </p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Primary Get Started Button */}
            <button
              onClick={handleGetStarted}
              type="button"
              className="btn btn-primary inline-flex text-xs md:text-sm font-semibold py-2.5 px-5 rounded-lg shadow-sm cursor-pointer"
            >
              Start Hiring
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileOpen((prev) => !prev)}
              type="button"
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 focus:outline-none cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>


        {/* Mobile Dropdown Menu */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 shadow-xl py-4 px-6 flex flex-col gap-3.5 animate-in fade-in duration-200">
            <a
              href="#home"
              onClick={() => setMobileOpen(false)}
              className="text-indigo-600 font-semibold py-1 border-b border-slate-100"
            >
              Home
            </a>
            <a
              href="#recruiters"
              onClick={() => setMobileOpen(false)}
              className="text-slate-700 hover:text-indigo-600 font-medium py-1 border-b border-slate-100"
            >
              For Recruiters
            </a>
            <a
              href="#candidates"
              onClick={() => setMobileOpen(false)}
              className="text-slate-700 hover:text-indigo-600 font-medium py-1 border-b border-slate-100"
            >
              For Candidates
            </a>
            <a
              href="#enterprise"
              onClick={() => setMobileOpen(false)}
              className="text-slate-700 hover:text-indigo-600 font-medium py-1 border-b border-slate-100"
            >
              Enterprise
            </a>
            <a
              href="#stats"
              onClick={() => setMobileOpen(false)}
              className="text-slate-700 hover:text-indigo-600 font-medium py-1 border-b border-slate-100"
            >
              Platform Stats
            </a>

            <div className="pt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  handleCandidateLogin();
                }}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 py-2.5 text-xs font-bold text-teal-800"
              >
                <UserCheck size={14} className="text-[#00a884]" />
                <span>Candidate</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  handleRecruiterLogin();
                }}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 py-2.5 text-xs font-bold text-indigo-800"
              >
                <Building2 size={14} className="text-indigo-600" />
                <span>Recruiter</span>
              </button>
            </div>

            <button
              onClick={() => {
                setMobileOpen(false);
                handleGetStarted();
              }}
              type="button"
              className="btn btn-primary w-full text-center font-semibold py-3 rounded-lg text-xs mt-1"
            >
              Start Hiring
            </button>
          </div>
        )}
      </header>

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
                Find the <span className="font-serif text-indigo-600 italic">right next step</span> for your hiring & growth journey.
              </h1>

              <p className="text-[#526071] text-base md:text-lg leading-relaxed mb-6 max-w-xl mx-auto md:mx-0">
                Whether you're an ambitious growth marketer advancing your career, or a hiring team scouting top-tier marketing talent, IntentPeople connects verified skill graphs with high-impact opportunities.
              </p>

              {/* 3 Value Badges */}
              <div className="hidden md:flex items-center gap-7 text-sm font-semibold text-[#526071] mb-8">
                <div className="flex items-center gap-2">
                  <span className="text-indigo-600 font-bold">✓</span> AI-Verified Skill Dossiers
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-indigo-600 font-bold">✓</span> Real Campaign Portfolios
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-indigo-600 font-bold">✓</span> Zero-Spam Direct Pipeline
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

            {/* Right Column: Clean SaaS Talent Dossier Showcase */}
            <div className="flex-1 w-full max-w-[530px] mx-auto relative mt-5 lg:mt-0">
              {/* Soft Ambient Radial Backdrop */}
              <div className="absolute -inset-3 sm:-inset-4 rounded-[2.5rem] bg-gradient-to-tr from-indigo-500/10 via-emerald-500/8 to-blue-500/10 blur-2xl pointer-events-none" />

              {/* Main Card Container: Crisp White, Balanced Padding, Sleek Shadow */}
              <div className="relative rounded-2xl border border-slate-200/90 bg-white/98 backdrop-blur-sm p-4.5 sm:p-6 shadow-xl shadow-slate-900/5">

                {/* Top Section: 1,420+ Vetted Leaders Pill */}
                <div className="flex items-center justify-end mb-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0]/60 text-[#065F46] text-xs font-semibold">
                    <Users size={13} className="text-[#059669]" />
                    <span>1,420+ Vetted Leaders</span>
                  </div>
                </div>

                {/* Candidate Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    {/* Candidate Avatar with Professional Portrait */}
                    <div className="relative flex-shrink-0">
                      <img
                        src="/images/elena_miller.jpg"
                        alt="Elena Miller - Growth Marketing Lead"
                        className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl object-cover shadow-sm shadow-slate-900/10 border border-slate-200/90"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-[#10B981] border-2 border-white flex items-center justify-center text-white text-[9px] font-bold">
                        ✓
                      </span>
                    </div>

                    {/* Candidate Details */}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-bold text-[#0F172A] tracking-tight">Elena Miller</h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2FF] border border-[#E0E7FF] text-[#4F46E5] text-[10px] font-bold uppercase tracking-wider">
                          TOP 1%
                        </span>
                      </div>
                      <p className="text-xs text-[#526071] font-medium mt-0.5 mb-2">
                        Senior Growth & Performance Lead • Ex-DTC
                      </p>

                      {/* Mini Platform Badges */}
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-200/80 text-[11px] font-medium text-slate-700">
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-[#0081FB]"><path d="M12 7.2c-2.4 0-4.4 1.4-5.6 3.6-1.1-2.2-3.1-3.6-5.5-3.6C.4 7.2 0 7.8 0 8.5v7c0 .7.4 1.3.9 1.3 2.4 0 4.4-1.4 5.6-3.6 1.1 2.2 3.1 3.6 5.5 3.6 2.4 0 4.4-1.4 5.6-3.6 1.1 2.2 3.1 3.6 5.5 3.6.5 0 .9-.6.9-1.3v-7c0-.7-.4-1.3-.9-1.3-2.4 0-4.4 1.4-5.6 3.6-1.1-2.2-3.1-3.6-5.5-3.6zm0 7.8c-1.8 0-3.3-1.3-3.8-3.1.5-1.8 2-3.1 3.8-3.1s3.3 1.3 3.8 3.1c-.5 1.8-2 3.1-3.8 3.1z" /></svg>
                          Meta
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-200/80 text-[11px] font-medium text-slate-700">
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" /><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.15C3.25 21.35 7.34 24 12 24z" /><path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.27C.46 8.21 0 10.05 0 12s.46 3.79 1.27 5.42l4.01-3.15z" /><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.65 1.27 6.58l4.01 3.15c.95-2.83 3.6-4.98 6.72-4.98z" /></svg>
                          Google
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-200/80 text-[11px] font-medium text-slate-700">
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-[#000000]"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298 0 .59.05.86.15V9.4a6.33 6.33 0 0 0-.86-.06A6.34 6.34 0 0 0 3.1 15.68a6.34 6.34 0 0 0 10.82 4.47 6.27 6.27 0 0 0 1.87-4.48V8.71a8.28 8.28 0 0 0 4.8 1.52v-3.4c-.34-.04-.69-.09-1-.14z" /></svg>
                          TikTok
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mint Green Turnaround Box */}
                  <div className="flex flex-col justify-center rounded-xl bg-[#ECFDF5]/70 border border-[#A7F3D0]/80 px-3.5 py-2.5 min-w-[170px] shadow-2xs">
                    <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      TURNAROUND
                    </span>
                    <div className="flex items-center justify-between text-[#065F46]">
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-[#059669]" />
                        <span className="text-[13px] font-bold text-[#065F46]">&lt; 24h Shortlist</span>
                      </div>
                      <ChevronRight size={13} className="text-[#059669]" />
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal mt-0.5">
                      Pre-vetted & ready to interview
                    </span>
                  </div>
                </div>

                {/* 3 Metric Cards with Wave Sparklines */}
                <div className="grid grid-cols-3 gap-2.5 mb-4">
                  {/* Card 1: Audited ROAS */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between overflow-hidden relative">
                    <div>
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="20" x2="18" y2="10" />
                          <line x1="12" y1="20" x2="12" y2="4" />
                          <line x1="6" y1="20" x2="6" y2="14" />
                        </svg>
                      </div>
                      <span className="text-[10px] font-medium text-slate-500 block">Audited ROAS</span>
                      <span className="text-lg sm:text-xl font-bold text-[#059669] block leading-tight">8.4x</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">Verified PMax</span>
                    </div>
                    <div className="w-16 h-8 flex-shrink-0 self-end">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 80 36">
                        <defs>
                          <linearGradient id="roasSparkGradSm" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path d="M0 32 Q 20 30, 40 24 T 65 12 T 80 4 L 80 36 L 0 36 Z" fill="url(#roasSparkGradSm)" />
                        <path d="M0 32 Q 20 30, 40 24 T 65 12 T 80 4" fill="none" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>

                  {/* Card 2: Spend Managed */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between overflow-hidden relative">
                    <div>
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1.5">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <ellipse cx="12" cy="5" rx="9" ry="3" />
                          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                          <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
                        </svg>
                      </div>
                      <span className="text-[10px] font-medium text-slate-500 block">Spend Managed</span>
                      <span className="text-lg sm:text-xl font-bold text-[#4F46E5] block leading-tight">$4.2M</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">Meta & Google</span>
                    </div>
                    <div className="w-16 h-8 flex-shrink-0 self-end">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 80 36">
                        <defs>
                          <linearGradient id="spendSparkGradSm" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path d="M0 33 Q 25 33, 45 26 T 65 14 T 80 4 L 80 36 L 0 36 Z" fill="url(#spendSparkGradSm)" />
                        <path d="M0 33 Q 25 33, 45 26 T 65 14 T 80 4" fill="none" stroke="#8B5CF6" strokeWidth="2.2" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>

                  {/* Card 3: AI Fit Match */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between overflow-hidden relative">
                    <div>
                      <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-1.5">
                        <Target size={15} />
                      </div>
                      <span className="text-[10px] font-medium text-slate-500 block">AI Fit Match</span>
                      <span className="text-lg sm:text-xl font-bold text-[#0F172A] block leading-tight">99.2%</span>
                      <span className="text-[9px] text-[#059669] font-semibold block mt-0.5">Pre-screened</span>
                    </div>
                    <div className="w-16 h-8 flex-shrink-0 self-end">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 80 36">
                        <defs>
                          <linearGradient id="fitSparkGradSm" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path d="M0 31 Q 20 25, 38 29 T 62 14 T 80 4 L 80 36 L 0 36 Z" fill="url(#fitSparkGradSm)" />
                        <path d="M0 31 Q 20 25, 38 29 T 62 14 T 80 4" fill="none" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Specialties Row */}
                <div className="flex flex-wrap items-center gap-1.5 mb-4">
                  <span className="text-xs font-bold text-slate-700 mr-1">Specialties</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF2FF]/70 border border-[#E0E7FF] text-[#4F46E5] text-[11px] font-semibold">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-[#0081FB]"><path d="M12 7.2c-2.4 0-4.4 1.4-5.6 3.6-1.1-2.2-3.1-3.6-5.5-3.6C.4 7.2 0 7.8 0 8.5v7c0 .7.4 1.3.9 1.3 2.4 0 4.4-1.4 5.6-3.6 1.1 2.2 3.1 3.6 5.5 3.6 2.4 0 4.4-1.4 5.6-3.6 1.1 2.2 3.1 3.6 5.5 3.6.5 0 .9-.6.9-1.3v-7c0-.7-.4-1.3-.9-1.3-2.4 0-4.4 1.4-5.6 3.6-1.1-2.2-3.1-3.6-5.5-3.6zm0 7.8c-1.8 0-3.3-1.3-3.8-3.1.5-1.8 2-3.1 3.8-3.1s3.3 1.3 3.8 3.1c-.5 1.8-2 3.1-3.8 3.1z" /></svg>
                    Meta Ads (CBO)
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-[11px] font-medium">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" /><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.15C3.25 21.35 7.34 24 12 24z" /><path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.27C.46 8.21 0 10.05 0 12s.46 3.79 1.27 5.42l4.01-3.15z" /><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.65 1.27 6.58l4.01 3.15c.95-2.83 3.6-4.98 6.72-4.98z" /></svg>
                    Google PMax
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-[11px] font-medium">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-[#000000]"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298 0 .59.05.86.15V9.4a6.33 6.33 0 0 0-.86-.06A6.34 6.34 0 0 0 3.1 15.68a6.34 6.34 0 0 0 10.82 4.47 6.27 6.27 0 0 0 1.87-4.48V8.71a8.28 8.28 0 0 0 4.8 1.52v-3.4c-.34-.04-.69-.09-1-.14z" /></svg>
                    TikTok UGC
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-[11px] font-medium">
                    <svg className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                    Attribution
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#EEF2FF] border border-[#E0E7FF] text-[#4F46E5] text-[10.5px] font-semibold">
                    +2 more
                  </span>
                </div>

                {/* Bottom Match Activity Bar */}
                <div className="rounded-xl bg-[#F8FAFC] border border-slate-200/80 p-3 sm:px-3.5 sm:py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6.5 h-6.5 rounded-md bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5]">
                      <Users size={14} />
                    </div>
                    <span className="text-xs text-slate-600 font-medium">
                      Dossier matched with <strong className="text-slate-900 font-bold">4 Scaleup Teams</strong> today
                    </span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                    {/* Overlapping Company Logos Stack */}
                    <div className="flex items-center -space-x-1.5">
                      {/* Slack */}
                      <div className="w-5.5 h-5.5 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 127 127">
                          <path d="M27.2 80c0 7.3-5.9 13.2-13.2 13.2C6.7 93.2.8 87.3.8 80c0-7.3 5.9-13.2 13.2-13.2h13.2V80zm6.6 0c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2v33c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V80z" fill="#E01E5A" />
                          <path d="M47 27.2c-7.3 0-13.2-5.9-13.2-13.2C33.8 6.7 39.7.8 47 .8c7.3 0 13.2 5.9 13.2 13.2v13.2H47zm0 6.6c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H14c-7.3 0-13.2-5.9-13.2-13.2 0-7.3 5.9-13.2 13.2-13.2h33z" fill="#36C5F0" />
                          <path d="M99.8 47c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H99.8V47zm-6.6 0c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V14c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2v33z" fill="#2EB67D" />
                          <path d="M80 99.8c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V99.8H80zm0-6.6c-7.3 0-13.2-5.9-13.2-13.2 0-7.3 5.9-13.2 13.2-13.2h33c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2H80z" fill="#ECB22E" />
                        </svg>
                      </div>
                      {/* Notion */}
                      <div className="w-5.5 h-5.5 rounded-full bg-black text-white text-[10px] font-bold border border-slate-200 shadow-xs flex items-center justify-center font-serif">
                        N
                      </div>
                      {/* HubSpot */}
                      <div className="w-5.5 h-5.5 rounded-full bg-[#FF7A59] text-white border border-slate-200 shadow-xs flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
                          <path d="M18.8 9.3V6.6a2.2 2.2 0 0 0 1.3-2 2.2 2.2 0 1 0-4.4 0c0 .9.5 1.6 1.3 2v2.7a5.5 5.5 0 0 0-3.3 1.9L7.3 8.3a2.1 2.1 0 1 0-1.2 1.5l6.3 4.9a5.5 5.5 0 1 0 6.4-5.4zm-3.6 7.4a3.3 3.3 0 1 1 0-6.6 3.3 3.3 0 0 1 0 6.6z" />
                        </svg>
                      </div>
                      {/* Stripe */}
                      <div className="w-5.5 h-5.5 rounded-full bg-[#635BFF] text-white text-[10px] font-bold border border-slate-200 shadow-xs flex items-center justify-center">
                        S
                      </div>
                    </div>

                    <a href="#recruiters" className="text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] flex items-center gap-1 cursor-pointer no-underline">
                      <span>View Live Match</span>
                      <ArrowRight size={13} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Interactive Role Pathway Selector */}
          <div className="mt-14 pt-10 border-t border-slate-200/90 w-full">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-2">
              <div>
                <span className="eyebrow text-xs uppercase tracking-wider mb-1.5 block">
                  CHOOSE YOUR OBJECTIVE
                </span>
                <h3 className="font-serif text-xl md:text-2xl font-semibold text-[#0F172A]">
                  Tailored pathways for employers, marketers, and enterprises
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
                    Instant access to pre-vetted marketing leaders with verified ROAS and ad spend history. Zero resume fluff with a guaranteed 48-hour interview turnaround.
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
                    Build a private AI talent dossier that highlights your real campaign impact. Skip recruiters and get direct inbound interview invites from funded startups.
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

              {/* Card 3: Agency & Enterprise */}
              <div
                className={`relative flex flex-col justify-between p-6 rounded-2xl bg-white border transition-all duration-300 ${selectedJourney === "enterprise"
                  ? "border-purple-600 shadow-xl shadow-purple-500/10 ring-2 ring-purple-500/20"
                  : "border-slate-200 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/5"
                  }`}
                onMouseEnter={() => setSelectedJourney("enterprise")}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-sm">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                        Enterprise
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        Dedicated Portal
                      </span>
                    </div>
                  </div>

                  <h4 className="text-base font-bold text-[#0F172A] mb-1.5">
                    Deploy a Dedicated Hiring Suite
                  </h4>
                  <p className="text-xs leading-relaxed text-[#526071] mb-4">
                    Scale high-volume marketing recruitment with dedicated tenant subdomains, multi-seat hiring pods, automated skill tests, and centralized ATS sync.
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 mb-5 text-[11px] font-medium text-slate-600">
                    <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200">
                      🏢 Multi-Seat Pods
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200">
                      🌐 Custom Domain
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200">
                      📊 Central Pipeline
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <a
                    href="#enterprise"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-sm hover:shadow transition-all no-underline cursor-pointer"
                  >
                    <span>View Enterprise Cloud</span>
                    <ArrowRight size={13} />
                  </a>
                  <button
                    type="button"
                    onClick={() => focusJourney("enterprise", "enterprise")}
                    className="py-2.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Architecture
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
           PLATFORM BENCHMARKS & AUDITED SIGNAL SECTION
           ============================================================ */}
      <section id="stats" className="py-14 md:py-20 px-6 bg-[#FAF9F6] border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-6 border-b border-slate-200/80 gap-4">
            <div>
              <span className="eyebrow mb-2">PLATFORM BENCHMARKS & AUDITED SIGNAL</span>
              <h2 className="font-serif text-2xl md:text-3xl font-medium text-[#0F172A] m-0">
                Verified talent performance in real time
              </h2>
            </div>
            <p className="text-xs md:text-sm text-[#526071] max-w-md m-0 leading-relaxed">
              Every metric on IntentPeople is backed by live candidate skill assessments, verified ad spend, and authenticated hiring outcomes.
            </p>
          </div>

          {/* 4 Stat Counter Spotlight Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {/* Tile 1: Verified Profiles (Increasing Number 0 -> 1,400+) */}
            <div className="group relative p-6 rounded-2xl text-white bg-gradient-to-b from-[#111C35] to-[#0A1020] border border-slate-700/70 shadow-xl hover:border-emerald-500/60 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none group-hover:bg-emerald-500/25 transition-colors" />

              <div className="flex items-center justify-between mb-5 relative z-10">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-sm group-hover:scale-105 transition-transform">
                  <Users size={20} />
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active Pool
                </span>
              </div>

              <div className="relative z-10">
                <h4 className="font-serif font-extrabold text-white text-3xl md:text-4xl leading-tight tracking-tight mb-1 flex items-baseline gap-0.5">
                  <AnimatedNumber from={0} to={1400} duration={1800} />
                  <span className="text-emerald-400 font-sans font-bold">+</span>
                </h4>
                <p className="text-xs font-semibold text-slate-300 mb-4">
                  Verified Marketer Profiles
                </p>

                <div className="pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                    <span>Performance & Growth</span>
                    <span className="text-emerald-400 font-bold">₹120 Cr+ Spend</span>
                  </div>
                  <AnimatedProgressBar targetWidth="88%" gradientClass="bg-gradient-to-r from-emerald-500 to-teal-400" />
                </div>
              </div>
            </div>

            {/* Tile 2: Recruiter Satisfaction (Increasing Number 0.0 -> 5.0 ★) */}
            <div className="group relative p-6 rounded-2xl text-white bg-gradient-to-b from-[#111C35] to-[#0A1020] border border-slate-700/70 shadow-xl hover:border-amber-500/60 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-amber-500/15 blur-2xl pointer-events-none group-hover:bg-amber-500/25 transition-colors" />

              <div className="flex items-center justify-between mb-5 relative z-10">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-sm group-hover:scale-105 transition-transform">
                  <Star size={20} />
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-amber-500/10 text-amber-300 border border-amber-500/25">
                  <Star size={10} className="fill-amber-400 text-amber-400" />
                  Verified Reviews
                </span>
              </div>

              <div className="relative z-10">
                <h4 className="font-serif font-extrabold text-amber-300 text-3xl md:text-4xl leading-tight tracking-tight mb-1 flex items-baseline gap-1.5">
                  <AnimatedNumber from={0} to={5.0} duration={1600} decimals={1} />
                  <span className="text-2xl text-amber-400">★</span>
                </h4>
                <p className="text-xs font-semibold text-slate-300 mb-4">
                  Recruiter Hiring Satisfaction
                </p>

                <div className="pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                    <span>Placement CSAT</span>
                    <span className="text-amber-400 font-bold">100% Recommended</span>
                  </div>
                  <AnimatedProgressBar targetWidth="100%" gradientClass="bg-gradient-to-r from-amber-500 to-yellow-300" />
                </div>
              </div>
            </div>

            {/* Tile 3: AI Precision Match (Increasing Number 0% -> 98.2%) */}
            <div className="group relative p-6 rounded-2xl text-white bg-gradient-to-b from-[#111C35] to-[#0A1020] border border-slate-700/70 shadow-xl hover:border-orange-500/60 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-[#FF6008]/15 blur-2xl pointer-events-none group-hover:bg-[#FF6008]/25 transition-colors" />

              <div className="flex items-center justify-between mb-5 relative z-10">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#FF6008]/10 border border-[#FF6008]/30 text-[#FF6008] shadow-sm group-hover:scale-105 transition-transform">
                  <Target size={20} />
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-[#FF6008]/10 text-orange-300 border border-[#FF6008]/25">
                  <Sparkles size={10} className="text-[#FF6008]" />
                  AI Scored
                </span>
              </div>

              <div className="relative z-10">
                <h4 className="font-serif font-extrabold text-white text-3xl md:text-4xl leading-tight tracking-tight mb-1 flex items-baseline gap-0.5">
                  <AnimatedNumber from={0} to={98.2} duration={1800} decimals={1} />
                  <span className="text-[#FF6008] font-sans font-bold">%</span>
                </h4>
                <p className="text-xs font-semibold text-slate-300 mb-4">
                  AI Dossier Precision Match
                </p>

                <div className="pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                    <span>Interview to Offer</span>
                    <span className="text-[#FF6008] font-bold">&lt;48h Fast Track</span>
                  </div>
                  <AnimatedProgressBar targetWidth="98%" gradientClass="bg-gradient-to-r from-orange-500 to-amber-400" />
                </div>
              </div>
            </div>

            {/* Tile 4: Top 1% Pre-Evaluated (Decreasing Number 50% -> 1%) */}
            <div className="group relative p-6 rounded-2xl text-white bg-gradient-to-b from-[#111C35] to-[#0A1020] border border-slate-700/70 shadow-xl hover:border-cyan-500/60 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-cyan-500/15 blur-2xl pointer-events-none group-hover:bg-cyan-500/25 transition-colors" />

              <div className="flex items-center justify-between mb-5 relative z-10">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-sm group-hover:scale-105 transition-transform">
                  <Award size={20} />
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
                  <TrendingUp size={10} className="text-cyan-400" />
                  Elite Tier
                </span>
              </div>

              <div className="relative z-10">
                <h4 className="font-serif font-extrabold text-white text-3xl md:text-4xl leading-tight tracking-tight mb-1 flex items-baseline gap-0.5">
                  <span className="font-serif">Top </span>
                  <AnimatedNumber from={50} to={1} duration={1800} />
                  <span className="text-cyan-400 font-sans font-bold">%</span>
                </h4>
                <p className="text-xs font-semibold text-slate-300 mb-4">
                  Pre-Evaluated Talent Rank
                </p>

                <div className="pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                    <span>Rigorous Vetting</span>
                    <span className="text-cyan-400 font-bold">1 in 100 Selected</span>
                  </div>
                  <AnimatedProgressBar targetWidth="92%" gradientClass="bg-gradient-to-r from-cyan-500 to-teal-400" />
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
                  Audited Ad Spend & ROAS
                </h3>
                <p className="text-xs text-[#526071] leading-relaxed">
                  Marketers verify historical spend histories and campaign portfolios. Review verified CAC scale, blended ROAS, and channel mastery across Meta, Google Ads, TikTok, and Amazon Ads before booking an interview.
                </p>
              </div>

              {/* Feature 2: 48h Shortlists */}
              <div className="p-6 rounded-2xl bg-[#FAF9F6] border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4 shadow-2xs">
                  <Clock size={20} />
                </div>
                <h3 className="font-serif font-semibold text-lg text-[#0F172A] mb-2">
                  48-Hour Curated Shortlists
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

              {/* Feature 3: AI-Audited Talent Dossier */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-4 shadow-2xs">
                  <Sparkles size={20} />
                </div>
                <h3 className="font-serif font-semibold text-lg text-[#0F172A] mb-2">
                  AI-Audited Talent Dossier
                </h3>
                <p className="text-xs text-[#526071] leading-relaxed">
                  Replace static text resumes with an interactive proof-of-work dossier. Showcase your verified ad spend scale, creative experiments, conversion benchmarks, and standardized assessment ratings.
                </p>
              </div>

              {/* Feature 4: Transparent Compensation */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#00a884] mb-4 shadow-2xs">
                  <DollarSign size={20} />
                </div>
                <h3 className="font-serif font-semibold text-lg text-[#0F172A] mb-2">
                  Transparent Upfront CTC
                </h3>
                <p className="text-xs text-[#526071] leading-relaxed">
                  Never waste time guessing salary ranges. Every inbound requisition states explicit base compensation, performance bonuses, equity tiers, and remote work policies upfront before you connect.
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
           ENTERPRISE & AGENCY WORKSPACES SECTION
           ============================================================ */}
      <section id="enterprise" className="py-16 md:py-24 px-6 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            {/* Left Content (6 Cols) */}
            <div className="lg:col-span-6 space-y-6">
              <div>
                <span className="eyebrow mb-3 text-purple-700">ENTERPRISE & AGENCY HIRING CLOUD</span>
                <h2 className="font-serif text-3xl md:text-4xl font-medium text-[#0F172A] leading-tight mb-4">
                  Dedicated Multi-Pod Hiring Portals for Scale-Ups & Agencies
                </h2>
                <p className="text-[#526071] text-base leading-relaxed">
                  Deploy a branded, multi-tenant recruitment environment for your internal teams or client hiring pods. Includes dedicated company subdomains, automated skill evaluation pipelines, and centralized ATS synchronization.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-[#FAF9F6] border border-slate-200">
                  <div className="text-purple-600 font-bold text-sm mb-1 flex items-center gap-1.5">
                    <Globe size={16} />
                    <span>Branded Subdomain</span>
                  </div>
                  <p className="text-xs text-slate-500 m-0">
                    Host on your dedicated address (e.g. yourbrand.intentpeople.com).
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#FAF9F6] border border-slate-200">
                  <div className="text-purple-600 font-bold text-sm mb-1 flex items-center gap-1.5">
                    <Building2 size={16} />
                    <span>Multi-Seat Pods</span>
                  </div>
                  <p className="text-xs text-slate-500 m-0">
                    Unlimited recruiter seats with granular role-based permissions.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#FAF9F6] border border-slate-200">
                  <div className="text-purple-600 font-bold text-sm mb-1 flex items-center gap-1.5">
                    <Zap size={16} />
                    <span>Custom Skill Audits</span>
                  </div>
                  <p className="text-xs text-slate-500 m-0">
                    Tailored pre-hire assessments tuned to your specific growth stack.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#FAF9F6] border border-slate-200">
                  <div className="text-purple-600 font-bold text-sm mb-1 flex items-center gap-1.5">
                    <Layers size={16} />
                    <span>ATS & Webhook Sync</span>
                  </div>
                  <p className="text-xs text-slate-500 m-0">
                    Instant bi-directional candidate pipeline sync with Greenhouse & Ashby.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleStartHiring}
                  type="button"
                  className="btn bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  Deploy Enterprise Portal &rarr;
                </button>
                <button
                  onClick={handleRecruiterLogin}
                  type="button"
                  className="btn btn-secondary font-semibold text-xs py-3.5 px-6 rounded-xl cursor-pointer"
                >
                  Recruiter Sign In
                </button>
              </div>
            </div>

            {/* Right Visual (6 Cols) */}
            <div className="lg:col-span-6">
              <div className="rounded-3xl border border-slate-200 p-3 bg-[#FAF9F6] shadow-sm relative group overflow-hidden">
                <div className="rounded-2xl overflow-hidden border border-slate-200/90 shadow-md">
                  <img
                    loading="lazy"
                    decoding="async"
                    src="/images/journey_enterprise.jpg"
                    alt="Enterprise Hiring Cloud Architecture"
                    className="w-full h-80 sm:h-[28rem] object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4 bg-[#0F172A]/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700/80 shadow-md text-white text-xs font-semibold">
                    Multi-Pod Cloud Architecture
                  </div>
                </div>
              </div>
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
