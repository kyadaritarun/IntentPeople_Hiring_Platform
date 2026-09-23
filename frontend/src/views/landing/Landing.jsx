import React, { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Briefcase,
  Check,
  CheckCircle,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Building2,
  UserCheck,
  FileText,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
  Target,
  MessageSquare,
  Settings,
  LayoutDashboard,
  UserRound,
  PieChart,
  Menu,
  X,
  Play,
  Star,
} from "lucide-react";

const candidates = [
  {
    name: "Priya Sharma",
    role: "Performance Marketer",
    match: "94%",
    status: "Shortlisted",
    image: "https://i.pravatar.cc/100?img=47",
  },
  {
    name: "Rahul Verma",
    role: "SEO Specialist",
    match: "90%",
    status: "Interview",
    image: "https://i.pravatar.cc/100?img=12",
  },
  {
    name: "Ananya Desai",
    role: "Content Strategist",
    match: "86%",
    status: "Applied",
    image: "https://i.pravatar.cc/100?img=32",
  },
  {
    name: "Karan Mehta",
    role: "Social Media Expert",
    match: "82%",
    status: "Shortlisted",
    image: "https://i.pravatar.cc/100?img=68",
  },
];

const features = [
  {
    icon: Sparkles,
    title: "AI Candidate Matching",
    description: "Smart recommendations using advanced AI.",
  },
  {
    icon: Search,
    title: "Advanced Search",
    description: "Find talent with precise filters.",
  },
  {
    icon: Briefcase,
    title: "Hiring Pipeline",
    description: "Track candidates at every stage.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Work together seamlessly.",
  },
  {
    icon: UserRound,
    title: "Candidate Profiles",
    description: "Detailed insights and analytics.",
  },
  {
    icon: BarChart3,
    title: "Hiring Analytics",
    description: "Data-driven hiring decisions.",
  },
];

export default function Landing({ onNavigateToAuth }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    setLoginDropdownOpen(prev => !prev);
  };

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

  return (
    <div className="min-h-screen overflow-hidden bg-white text-[#101735]">
      {/* NAVBAR */}
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between px-5 lg:px-8">
          <a href="#" className="flex items-center gap-2">
            <img
              src="/logo.svg"
              alt="Uptrix"
              className="h-8 w-auto object-contain select-none"
            />
          </a>

          <nav className="hidden items-center gap-8 lg:flex">
            {["Product", "Solutions", "Pricing", "Resources", "About"].map(
              (item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-[13px] font-medium text-slate-600 transition hover:text-indigo-600"
                >
                  {item}
                </a>
              )
            )}
          </nav>

          <div className="hidden items-center gap-5 sm:flex">
            {/* Login with Hover Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setLoginDropdownOpen(true)}
              onMouseLeave={() => setLoginDropdownOpen(false)}
            >
              <button
                onClick={handleLogin}
                type="button"
                className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700 hover:text-indigo-600 transition cursor-pointer py-2 border-none bg-transparent"
                aria-expanded={loginDropdownOpen}
              >
                <span>Login</span>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 text-slate-400 ${loginDropdownOpen ? 'rotate-180 text-indigo-600' : ''}`}
                />
              </button>

              {/* Hover Dropdown Menu */}
              {loginDropdownOpen && (
                <div
                  className="absolute right-0 top-full pt-1.5 w-64 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                  style={{ filter: 'drop-shadow(0 10px 25px rgba(16, 23, 53, 0.12))' }}
                >
                  <div className="rounded-2xl border border-slate-100 bg-white p-2 shadow-xl">
                    <div className="px-3 py-1.5 border-b border-slate-100/80 mb-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Select Portal Sign In
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
                      className="group flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition hover:bg-teal-50/70 border-none bg-transparent cursor-pointer"
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
                      className="group flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition hover:bg-indigo-50/70 border-none bg-transparent cursor-pointer mt-0.5"
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
                          Post jobs, pipeline & hire talent
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleGetStarted}
              type="button"
              className="group flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-700 cursor-pointer"
            >
              Get Started
              <ArrowRight
                size={15}
                className="transition group-hover:translate-x-0.5"
              />
            </button>
          </div>

          <button
            className="rounded-lg p-2 text-slate-700 lg:hidden cursor-pointer"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-slate-100 bg-white px-5 py-5 lg:hidden animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-col gap-4">
              {["Product", "Solutions", "Pricing", "Resources", "About"].map(
                (item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    className="text-sm font-medium text-slate-700 hover:text-indigo-600"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item}
                  </a>
                )
              )}

              <div className="pt-2 flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      handleCandidateLogin();
                    }}
                    type="button"
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50/70 py-2.5 text-xs font-bold text-teal-800 hover:bg-teal-100 transition-colors"
                  >
                    <UserCheck size={14} className="text-[#00a884]" />
                    <span>Candidate Login</span>
                  </button>

                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      handleRecruiterLogin();
                    }}
                    type="button"
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 py-2.5 text-xs font-bold text-indigo-800 hover:bg-indigo-100 transition-colors"
                  >
                    <Building2 size={14} className="text-indigo-600" />
                    <span>Recruiter Login</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    setMobileOpen(false);
                    handleGetStarted();
                  }}
                  type="button"
                  className="w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-xs cursor-pointer"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section id="product" className="relative overflow-hidden pt-[125px]">
        {/* background glow */}
        <div className="pointer-events-none absolute -right-40 -top-32 h-[650px] w-[650px] rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="pointer-events-none absolute left-[30%] top-20 h-[400px] w-[400px] rounded-full bg-purple-100/60 blur-3xl" />

        <div className="relative mx-auto grid max-w-[1240px] items-center gap-14 px-5 pb-20 lg:grid-cols-[42%_58%] lg:px-8 lg:pb-28">
          {/* Hero copy */}
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-[12px] font-semibold text-indigo-600">
              <Sparkles size={13} />
              AI-Powered Hiring Platform
            </div>

            <h1 className="max-w-[600px] text-[48px] font-extrabold leading-[1.02] tracking-[-2.5px] sm:text-[58px] lg:text-[62px]">
              Hire Better
              <br />
              Digital Marketing
              <br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 bg-clip-text text-transparent">
                Talent, Faster.
              </span>
            </h1>

            <p className="mt-7 max-w-[500px] text-[16px] leading-7 text-slate-600">
              Uptrix connects businesses with pre-vetted digital marketing
              talent using AI-powered matching, helping you hire faster,
              smarter, and with confidence.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={handleStartHiring}
                type="button"
                className="group flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:bg-indigo-700 cursor-pointer"
              >
                Start Hiring
                <ArrowRight
                  size={16}
                  className="transition group-hover:translate-x-1"
                />
              </button>

              <button
                onClick={handleExploreTalent}
                type="button"
                className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600 cursor-pointer"
              >
                <Play size={15} fill="currentColor" />
                Explore Talent
              </button>
            </div>

            {/* Stats */}
            <div className="mt-10 flex flex-wrap gap-9">
              <Stat number="10K+" label="Verified Candidates" />
              <Stat number="500+" label="Companies Hire" />
              <Stat number="90%" label="Faster Hiring" />
            </div>
          </div>

          {/* Dashboard */}
          <DashboardPreview />
        </div>
      </section>

      {/* TRUST */}
      <section className="border-y border-slate-100 bg-white py-9">
        <div className="mx-auto max-w-[1100px] px-5">
          <p className="mb-7 text-center text-[12px] font-semibold uppercase tracking-[2px] text-slate-400">
            Trusted by growing teams
          </p>

          <div className="grid grid-cols-3 items-center gap-7 text-center sm:grid-cols-6">
            {["Google", "Meta", "amazon", "NETFLIX", "Spotify", "Adobe"].map(
              (brand) => (
                <div
                  key={brand}
                  className="text-[20px] font-bold tracking-tight text-slate-400"
                >
                  {brand}
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* ENTERPRISE EFFICIENCY SECTION */}
      <section className="bg-slate-50/50 py-14 sm:py-16">
        <div className="mx-auto max-w-[1080px] px-5 text-center">
          <div className="inline-flex items-center rounded-full bg-[#EDE9FE] px-3.5 py-0.5">
            <span className="text-[10px] font-bold tracking-[1.5px] uppercase text-[#6366F1]">
              Enterprise Efficiency
            </span>
          </div>

          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-[34px] leading-tight">
            Built for Speed. Engineered for Precision.
          </h2>

          <p className="mx-auto mt-2.5 max-w-xl text-xs sm:text-[13px] leading-relaxed text-slate-500">
            Remove candidate noise and eliminate recruiter bottlenecks with our deterministic growth evaluation protocol.
          </p>
        </div>

        <div className="mx-auto mt-9 grid max-w-[1080px] gap-5 px-5 md:grid-cols-3">
          {/* Card 1: Find the Right Talent */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-lg shadow-slate-200/40 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDE9FE] text-[#6366F1]">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 6h7" />
                  <path d="M4 12h16" />
                  <path d="M4 18h11" />
                  <circle cx="16" cy="6" r="3" />
                  <path d="m18.5 8.5 2 2" />
                </svg>
              </div>

              <h3 className="text-[15px] font-bold text-slate-900">
                Find the Right Talent
              </h3>

              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Access pre-vetted digital marketing professionals across paid media, organic growth, CRO, and lifecycle automation with proven metrics.
              </p>
            </div>

            <div className="mt-6 flex items-center gap-2 rounded-lg border border-slate-100 bg-[#F8FAFC] px-3.5 py-2">
              <div className="flex h-4 w-4 shrink-0 items-center justify-center text-teal-600">
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <span className="text-[11px] font-semibold text-slate-700">
                100% verified case study audits
              </span>
            </div>
          </div>

          {/* Card 2: Evaluate Faster */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-lg shadow-slate-200/40 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3E8FF] text-[#9333EA]">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
                  <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
                  <path d="M12 18V5" />
                  <path d="M8 9h8" />
                  <path d="M7 13h10" />
                </svg>
              </div>

              <h3 className="text-[15px] font-bold text-slate-900">
                Evaluate Faster
              </h3>

              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                AI-powered dynamic benchmarking assesses campaign strategy, channel-specific CAC/LTV instincts, and operational agility in seconds.
              </p>
            </div>

            <div className="mt-6 flex items-center gap-2 rounded-lg border border-slate-100 bg-[#F8FAFC] px-3.5 py-2">
              <div className="flex h-4 w-4 shrink-0 items-center justify-center text-indigo-600">
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m12 14 4-4" />
                  <path d="M3.34 19a10 10 0 1 1 17.32 0" />
                </svg>
              </div>
              <span className="text-[11px] font-semibold text-slate-700">
                Automated skill scoring
              </span>
            </div>
          </div>

          {/* Card 3: Manage End-to-End */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-lg shadow-slate-200/40 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#CCFBF1] text-[#0D9488]">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <circle cx="19" cy="5" r="2" />
                  <circle cx="5" cy="5" r="2" />
                  <circle cx="12" cy="21" r="2" />
                  <path d="m14 10 3.5-3.5" />
                  <path d="m10 10-3.5-3.5" />
                  <path d="M12 15v4" />
                </svg>
              </div>

              <h3 className="text-[15px] font-bold text-slate-900">
                Manage End-to-End
              </h3>

              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                From automated role specification to real-time interviews, background clearance, and contracts — coordinate everything on one unified canvas.
              </p>
            </div>

            <div className="mt-6 flex items-center gap-2 rounded-lg border border-slate-100 bg-[#F8FAFC] px-3.5 py-2">
              <div className="flex h-4 w-4 shrink-0 items-center justify-center text-teal-600">
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m11 17 2 2a1 1 0 0 0 1.4 0l6.6-6.6a1 1 0 0 0 0-1.4l-5-5a1 1 0 0 0-1.4 0L8 12" />
                  <path d="m13 11 4 4" />
                  <path d="m8 12-4.5 4.5a1 1 0 0 0 0 1.4l2.6 2.6a1 1 0 0 0 1.4 0L12 16" />
                </svg>
              </div>
              <span className="text-[11px] font-semibold text-slate-700">
                One-click contract offer flows
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* AI SECTION */}
      <section id="solutions" className="relative overflow-hidden bg-[#080D27] py-14 sm:py-16">
        <div className="absolute -left-40 top-0 h-[450px] w-[450px] rounded-full bg-indigo-700/25 blur-[120px]" />
        <div className="absolute right-0 top-20 h-[350px] w-[350px] rounded-full bg-purple-700/20 blur-[120px]" />

        <div className="relative mx-auto grid max-w-[1080px] items-center gap-8 px-5 lg:grid-cols-[44%_56%]">
          <div className="text-white">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 backdrop-blur-sm">
              <Sparkles className="h-3 w-3 text-indigo-300" />
              <span className="text-[10px] font-bold tracking-[1.5px] uppercase text-indigo-200">
                Smarter hiring with AI
              </span>
            </div>

            <h2 className="mt-3.5 text-2xl font-extrabold leading-[1.15] tracking-[-0.5px] text-white sm:text-[32px]">
              AI-powered talent matching at molecular precision.
            </h2>

            <p className="mt-4 max-w-[440px] text-xs sm:text-[13px] leading-relaxed text-slate-300">
              Our deep learning model indexes candidate performance across 38+ performance marketing disciplines, comparing historical CAC results, spend scale, and channel versatility against your exact hiring specifications.
            </p>

            <div className="mt-6 space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                  <Check className="h-3 w-3 stroke-[2.5]" />
                </div>
                <span className="text-xs font-medium text-slate-200">
                  Replaces manual resume screening entirely
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                  <Check className="h-3 w-3 stroke-[2.5]" />
                </div>
                <span className="text-xs font-medium text-slate-200">
                  Verified proof-of-work performance logs
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                  <Check className="h-3 w-3 stroke-[2.5]" />
                </div>
                <span className="text-xs font-medium text-slate-200">
                  Direct live candidate intent scoring
                </span>
              </div>
            </div>

            <a
              href="#workflow"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition hover:bg-indigo-500 cursor-pointer"
            >
              See How It Works
              <ArrowRight size={14} />
            </a>
          </div>

          <div className="relative">
            <div className="rounded-2xl border border-white/10 bg-[#161B26] p-4 sm:p-5 shadow-xl shadow-black/50">
              {/* Profile & Calibrated Match */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-indigo-500/40 bg-[#0F1424] text-base font-bold text-white shadow-inner">
                    RV
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-[15px] font-bold text-white">Rahul Verma</h3>
                      <CheckCircle className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      SEO Specialist &amp; Growth Architect • 5+ years experience
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-start rounded-xl border border-white/5 bg-[#202738] px-3 py-1.5 sm:self-auto">
                  <div>
                    <div className="text-xl sm:text-2xl font-black leading-none tracking-tight text-emerald-400">
                      94%
                    </div>
                    <div className="mt-0.5 text-[7px] font-bold uppercase tracking-wider text-slate-400">
                      Calibrated Match
                    </div>
                  </div>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                    <Target className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Skills Tag Row */}
              <div className="mt-3.5 flex flex-wrap gap-1.5">
                {["Technical SEO", "SEM & Performance", "Google Ads Elite", "Programmatic Backlinking"].map((skill) => (
                  <span
                    key={skill}
                    className="rounded-md border border-white/5 bg-[#202738] px-2.5 py-1 text-[11px] font-medium text-slate-200"
                  >
                    {skill}
                  </span>
                ))}
                <span className="rounded-md border border-white/5 bg-[#1A1F2D] px-2.5 py-1 text-[11px] font-semibold text-slate-400">
                  +5 More Verified
                </span>
              </div>

              {/* 2x2 Criteria Grid */}
              <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div className="flex items-start gap-2.5 rounded-lg border border-white/5 bg-[#1B2131] p-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/5 text-slate-300">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-200">Skills Match</h4>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-slate-400">
                      Core skills align 98% with your role technical requirements.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-lg border border-white/5 bg-[#1B2131] p-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/5 text-slate-300">
                    <TrendingUp className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-200">Experience Match</h4>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-slate-400">
                      Managed &gt;₹1.2Cr annual ad spend across high-growth D2C.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-lg border border-white/5 bg-[#1B2131] p-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-400">
                    <Users className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-200">Cultural Fit</h4>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-slate-400">
                      Matches fast-turnaround, asynchronous, data-led team cadence.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-lg border border-white/5 bg-[#1B2131] p-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/5 text-slate-300">
                    <Zap className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-200">High Intent</h4>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-slate-400">
                      Available within 14 days, active on interview requests.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer Row */}
              <div className="mt-3.5 flex flex-col items-center justify-between gap-2.5 border-t border-white/5 pt-3 text-xs sm:flex-row">
                <span className="text-[10px] font-medium text-slate-400">
                  Dossier generated in 1.4s via Neural Parser
                </span>
                <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
                  <button
                    type="button"
                    className="cursor-pointer rounded-md border border-white/10 bg-[#252C3E] px-3 py-1.5 text-[11px] font-semibold text-slate-200 transition hover:bg-[#2F374D]"
                  >
                    Full Audit PDF
                  </button>
                  <button
                    type="button"
                    className="cursor-pointer rounded-md bg-indigo-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-md shadow-indigo-600/30 transition hover:bg-indigo-500"
                  >
                    Fast-Track Candidate
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section id="workflow" className="bg-white py-24">
        <div className="mx-auto max-w-[1120px] px-5">
          <div className="mx-auto max-w-[600px] text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-slate-900">
              A simpler way to hire
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              From posting a job to making a hire, Uptrix streamlines the entire
              process.
            </p>
          </div>

          <div className="mt-14 grid gap-3 md:grid-cols-5">
            <Step number="1" title="Create Job" text="Post your requirements" />
            <Step number="2" title="Discover Talent" text="Get AI-matched candidates" />
            <Step number="3" title="Shortlist" text="Review top talent" />
            <Step number="4" title="Interview" text="Schedule interviews" />
            <Step number="5" title="Hire" text="Make the right hire" />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="bg-slate-50 py-24">
        <div className="mx-auto max-w-[1120px] px-5">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[2px] text-indigo-600">
                Everything you need
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl text-slate-900">
                Hire better, with less work.
              </h2>

              <p className="mt-3 text-sm text-slate-500">
                Powerful features to streamline your hiring process.
              </p>
            </div>

            <a
              href="#features"
              className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View all features
              <ArrowRight size={15} />
            </a>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section id="about" className="bg-[#F6F7FD] py-16 sm:py-20">
        <div className="mx-auto max-w-[1140px] px-5 sm:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-[40%_60%]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-indigo-600">
                Testimonials
              </p>

              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl leading-tight">
                Loved by hiring teams<br className="hidden sm:inline" /> worldwide.
              </h2>

              <p className="mt-3 max-w-[360px] text-xs sm:text-[13px] leading-relaxed text-slate-500">
                See what talent leaders and founders say about using Uptrix to accelerate their performance marketing hires.
              </p>

              <div className="mt-5 flex items-center gap-1.5">
                <div className="flex items-center gap-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={16}
                      fill="currentColor"
                      className="text-amber-400"
                    />
                  ))}
                </div>
                <span className="ml-2 text-xs font-semibold text-slate-700">
                  4.9 / 5 across 200+ companies
                </span>
              </div>
            </div>

            <div className="relative rounded-3xl border border-white bg-white p-7 shadow-xl shadow-indigo-100/50 sm:p-9">
              {/* Stylized Quote Mark */}
              <div className="pointer-events-none absolute right-8 top-4 text-7xl font-serif font-black leading-none text-indigo-100 select-none">
                ”
              </div>

              <p className="relative max-w-xl text-base font-medium leading-relaxed text-slate-800 sm:text-lg">
                “Uptrix has completely transformed our hiring process. We found amazing digital marketing talent much faster than traditional recruitment methods. The AI matching is spot on.”
              </p>

              <div className="mt-8 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-indigo-600/70 bg-[#EAE8FE] text-xs font-bold text-slate-900 shadow-sm">
                    SK
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Sneha Kapoor</h4>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Marketing Head, GrowthX
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-[#EFEFFE] px-3.5 py-1.5 text-xs font-bold text-slate-800 shadow-xs">
                  Growth <span className="font-black text-indigo-600">X</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="bg-white py-24 border-t border-slate-100">
        <div className="mx-auto max-w-[1140px] px-5">
          <div className="mx-auto max-w-[650px] text-center">
            <p className="text-xs font-bold uppercase tracking-[2px] text-indigo-600">
              Transparent Pricing
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl text-slate-900">
              Plans that scale with your hiring
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Simple, predictable pricing. No hidden candidate placement fees or commission surprises.
            </p>

            {/* Monthly / Annual Toggle */}
            <div className="mt-8 inline-flex items-center gap-1 rounded-2xl bg-slate-100 p-1.5 border border-slate-200/80">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                  billingCycle === "monthly"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("annual")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                  billingCycle === "annual"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>Annual Billing</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
                  SAVE 20%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="mt-14 grid gap-8 lg:grid-cols-3 items-stretch">
            {/* Plan 1: Candidate & Starter */}
            <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-7 sm:p-8 shadow-sm transition duration-300 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-100">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-[1.5px] text-indigo-600">
                    Starter & Candidate
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                    Free Forever
                  </span>
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">₹0</span>
                  <span className="text-xs font-medium text-slate-400">/forever</span>
                </div>

                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Everything candidates and boutique teams need to get discovered and initiate verified hiring.
                </p>

                <div className="mt-6 space-y-3 border-t border-slate-100 pt-6">
                  {[
                    "Unlimited job applications & searches",
                    "Verified candidate profile & portfolio builder",
                    "1 Active job requisition posting",
                    "Standard applicant list & status tracker",
                    "Direct candidate-recruiter messaging",
                    "Video interview link integration",
                    "Support Desk & Help Center access"
                  ].map((feature) => (
                    <div key={feature} className="flex items-start gap-2.5 text-xs text-slate-700">
                      <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 mt-0.5">
                        <Check size={11} strokeWidth={3} />
                      </div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 border-t border-slate-100 pt-6">
                <button
                  type="button"
                  onClick={handleExploreTalent}
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 text-xs font-bold text-slate-700 transition hover:border-indigo-400 hover:text-indigo-600 cursor-pointer"
                >
                  Get Started Free
                </button>
              </div>
            </div>

            {/* Plan 2: Pro Team (Featured / Elevated) */}
            <div className="relative flex flex-col justify-between rounded-3xl border-2 border-indigo-600 bg-[#090E29] p-7 sm:p-8 text-white shadow-2xl shadow-indigo-950/40 lg:-translate-y-2">
              <div className="absolute -top-3.5 right-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-3.5 py-1 text-[10.5px] font-extrabold tracking-wide text-white shadow-md">
                MOST POPULAR
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-[1.5px] text-indigo-300">
                    Pro Team
                  </span>
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">
                    {billingCycle === "annual" ? "₹1,999" : "₹2,499"}
                  </span>
                  <span className="text-xs font-medium text-slate-400">/month</span>
                </div>

                <p className="mt-3 text-xs leading-5 text-slate-300">
                  Full-featured AI recruitment engine for growing performance agencies and active hiring teams.
                </p>

                <div className="mt-6 space-y-3 border-t border-white/10 pt-6">
                  {[
                    "Everything in Free plan",
                    "Unlimited active job requisitions",
                    "Full ATS pipeline (Data Grid + Split Review)",
                    "FastAPI AI candidate fit scoring (94% accuracy)",
                    "Search Candidate Talent Pool with filters",
                    "One-click Candidate Dossier PDF export",
                    "Multi-round interview funnel with calendar sync",
                    "Team collaboration (Admin, Recruiter, Manager)",
                    "Priority email & 24/7 concierge support"
                  ].map((feature) => (
                    <div key={feature} className="flex items-start gap-2.5 text-xs text-slate-200">
                      <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 mt-0.5">
                        <Check size={11} strokeWidth={3} />
                      </div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 border-t border-white/10 pt-6">
                <button
                  type="button"
                  onClick={handleStartHiring}
                  className="w-full rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 cursor-pointer"
                >
                  Start 14-Day Free Trial
                </button>
              </div>
            </div>

            {/* Plan 3: Enterprise Scale */}
            <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-7 sm:p-8 shadow-sm transition duration-300 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-100">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-[1.5px] text-slate-700">
                    Enterprise Scale
                  </span>
                  <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700">
                    High Volume
                  </span>
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">
                    {billingCycle === "annual" ? "₹5,999" : "₹6,999"}
                  </span>
                  <span className="text-xs font-medium text-slate-400">/month</span>
                </div>

                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Dedicated multi-tenant infrastructure, custom compliance vaults, and SLA for high-scale staffing operations.
                </p>

                <div className="mt-6 space-y-3 border-t border-slate-100 pt-6">
                  {[
                    "Everything in Pro Team plan",
                    "Unlimited recruiter seats & team members",
                    "Dedicated isolated multi-tenant database",
                    "Custom branded career portal & domain",
                    "Automated bulk candidate email campaigns",
                    "Tailored evaluation rubrics & scorecards",
                    "Advanced team audit logs & compliance vault",
                    "Dedicated account manager & 99.9% uptime SLA"
                  ].map((feature) => (
                    <div key={feature} className="flex items-start gap-2.5 text-xs text-slate-700">
                      <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 mt-0.5">
                        <Check size={11} strokeWidth={3} />
                      </div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 border-t border-slate-100 pt-6">
                <button
                  type="button"
                  onClick={handleStartHiring}
                  className="w-full rounded-xl border border-slate-200 bg-slate-900 py-3 text-xs font-bold text-white transition hover:bg-slate-800 cursor-pointer shadow-sm"
                >
                  Contact Enterprise Sales
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-16">
        <div className="relative mx-auto max-w-[1120px] overflow-hidden rounded-3xl bg-[#090F29] px-7 py-12 shadow-2xl sm:px-12">
          <div className="absolute -right-20 -top-32 h-[300px] w-[300px] rounded-full bg-indigo-600/30 blur-3xl" />

          <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="text-white">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Build your hiring pipeline
                <br className="hidden sm:block" />
                with confidence.
              </h2>

              <p className="mt-3 text-sm text-slate-300">
                Join thousands of companies already finding great talent on
                Uptrix.
              </p>
            </div>

            <div className="flex w-full flex-wrap gap-3 md:w-auto">
              <button
                onClick={handleGetStarted}
                type="button"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition hover:bg-indigo-500 md:flex-none cursor-pointer"
              >
                Get Started Free
                <ArrowRight size={15} />
              </button>

              <button
                onClick={handleStartHiring}
                type="button"
                className="flex flex-1 items-center justify-center rounded-xl border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10 md:flex-none cursor-pointer"
              >
                Talk to Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="resources" className="border-t border-slate-200/60 bg-[#F6F8FC] py-14">
        <div className="mx-auto max-w-[1140px] px-5 sm:px-8">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[30%_17.5%_17.5%_17.5%_17.5%]">
            <div>
              <a href="#" className="inline-flex items-center gap-2">
                <img
                  src="/logo.svg"
                  alt="Uptrix"
                  className="h-8 w-auto object-contain select-none"
                />
              </a>

              <p className="mt-4 max-w-[280px] text-xs leading-relaxed text-slate-500">
                Autonomous AI scouting, evaluation, and pipeline acceleration for elite digital marketing and growth professionals.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-3.5 py-1.5 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-medium text-slate-600">
                  All systems operational
                </span>
              </div>
            </div>

            <FooterColumn
              title="Platform"
              links={[
                "AI Precision Match",
                "Growth Skill Graph",
                "Workflow Engine",
                "Enterprise Suite",
              ]}
            />

            <FooterColumn
              title="Solutions"
              links={[
                "Scaleup Agencies",
                "B2B SaaS Teams",
                "E-Commerce Giants",
                "Pricing Tiers",
              ]}
            />

            <FooterColumn
              title="Company"
              links={[
                "Case Studies",
                "Customer Proof",
                "Security & AI Trust",
                "Careers",
              ]}
            />

            <FooterColumn
              title="Legal & Privacy"
              links={[
                "Privacy Policy",
                "Terms of Service",
                "SOC-2 Report",
                "AI Ethics Notice",
              ]}
            />
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200/60 pt-8 text-xs text-slate-500 sm:flex-row">
            <p>© 2025 Uptrix Technologies Inc. Built for executive-level growth recruitment.</p>

            <div className="flex items-center gap-6">
              <a href="#" className="transition hover:text-indigo-600">
                Privacy
              </a>
              <a href="#" className="transition hover:text-indigo-600">
                Terms
              </a>
              <a href="#" className="transition hover:text-indigo-600">
                Security
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ---------------------------------- */
/* COMPONENTS */
/* ---------------------------------- */

function Stat({ number, label }) {
  return (
    <div>
      <div className="text-[22px] font-extrabold tracking-tight text-slate-900">{number}</div>
      <div className="mt-1 text-[11px] text-slate-500">{label}</div>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="relative min-w-0">
      {/* floating badge */}
      <div className="absolute -right-2 -top-7 z-20 hidden rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-xl sm:block">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-600">
            <ArrowUpRight size={19} />
          </div>

          <div>
            <p className="font-bold text-slate-900">3x</p>
            <p className="text-[11px] text-slate-500">Faster Hiring</p>
          </div>
        </div>
      </div>

      {/* dashboard */}
      <div className="relative rounded-[22px] border border-slate-200 bg-white p-2 shadow-[0_30px_80px_rgba(48,40,120,0.16)] sm:p-3">
        <div className="overflow-hidden rounded-[16px] border border-slate-100 bg-[#F8F9FC]">
          {/* top bar */}
          <div className="flex h-12 items-center justify-between border-b border-slate-100 bg-white px-4">
            <img
              src="/logo.svg"
              alt="Uptrix"
              className="h-6 w-auto object-contain select-none"
            />

            <div className="hidden h-7 w-[220px] items-center gap-2 rounded-lg bg-slate-50 px-3 text-[10px] text-slate-400 sm:flex">
              <Search size={12} />
              Search candidates, jobs...
            </div>

            <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
              T
            </div>
          </div>

          <div className="flex">
            {/* sidebar */}
            <aside className="hidden w-[130px] border-r border-slate-100 bg-white p-3 sm:block">
              <div className="space-y-1">
                <SideItem icon={LayoutDashboard} text="Dashboard" active />
                <SideItem icon={Briefcase} text="Jobs" />
                <SideItem icon={Users} text="Candidates" />
                <SideItem icon={MessageSquare} text="Messages" />
                <SideItem icon={BarChart3} text="Analytics" />
                <SideItem icon={Users} text="Team" />
                <SideItem icon={Settings} text="Settings" />
              </div>
            </aside>

            {/* content */}
            <main className="min-w-0 flex-1 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Good Morning, Tarun 👋
                  </h3>
                  <p className="mt-1 text-[9px] text-slate-400">
                    Here's what's happening with your hiring today.
                  </p>
                </div>

                <div className="hidden rounded-full bg-slate-100 px-2 py-1 text-[8px] font-semibold text-slate-600 sm:block">
                  Recruiter
                </div>
              </div>

              {/* stats */}
              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <DashboardStat number="24" label="Active Jobs" />
                <DashboardStat number="182" label="Total Applicants" />
                <DashboardStat number="12" label="Interviews" />
                <DashboardStat number="8" label="Hired" />
              </div>

              <div className="mt-5 grid gap-3 lg:grid-cols-[1.3fr_.7fr]">
                {/* candidates */}
                <div className="rounded-xl border border-slate-100 bg-white p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[11px] font-bold text-slate-900">Recent Candidates</p>
                    <span className="text-[8px] font-semibold text-indigo-600">
                      View all
                    </span>
                  </div>

                  <div className="space-y-2">
                    {candidates.map((candidate) => (
                      <div
                        key={candidate.name}
                        className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-50 transition"
                      >
                        <img
                          src={candidate.image}
                          alt=""
                          className="h-7 w-7 rounded-full object-cover"
                        />

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[9px] font-semibold text-slate-900">
                            {candidate.name}
                          </p>
                          <p className="truncate text-[7px] text-slate-400">
                            {candidate.role}
                          </p>
                        </div>

                        <span className="rounded-full bg-green-50 px-1.5 py-1 text-[7px] font-bold text-green-600">
                          {candidate.match}
                        </span>

                        <span className="hidden rounded-full bg-indigo-50 px-1.5 py-1 text-[7px] font-semibold text-indigo-600 sm:block">
                          {candidate.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* pipeline */}
                <div className="rounded-xl border border-slate-100 bg-white p-3">
                  <p className="text-[11px] font-bold text-slate-900">Hiring Pipeline</p>

                  <div className="mx-auto mt-5 flex h-28 w-28 items-center justify-center rounded-full border-[12px] border-indigo-100">
                    <div className="text-center">
                      <p className="text-xl font-extrabold text-slate-900">182</p>
                      <p className="text-[8px] text-slate-400">Total</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <Pipeline color="bg-indigo-500" label="Applied" value="72" />
                    <Pipeline
                      color="bg-purple-500"
                      label="Shortlisted"
                      value="48"
                    />
                    <Pipeline
                      color="bg-orange-400"
                      label="Interview"
                      value="36"
                    />
                    <Pipeline color="bg-green-500" label="Hired" value="26" />
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* candidate floating card */}
      <div className="absolute -bottom-8 -left-6 z-20 hidden w-[165px] rounded-2xl border border-slate-100 bg-white p-3 shadow-2xl sm:block">
        <div className="flex items-center gap-2">
          <img
            src="https://i.pravatar.cc/100?img=47"
            className="h-9 w-9 rounded-full object-cover"
            alt=""
          />

          <div>
            <p className="text-[9px] font-bold text-slate-900">Priya Sharma</p>
            <p className="text-[7px] text-slate-400">Performance Marketer</p>
          </div>
        </div>

        <div className="mt-2 rounded-full bg-green-50 px-2 py-1 text-center text-[8px] font-bold text-green-600">
          94% Match
        </div>
      </div>
    </div>
  );
}

function DashboardStat({ number, label }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white p-2.5">
      <p className="text-lg font-extrabold text-slate-900">{number}</p>
      <p className="mt-0.5 text-[7px] text-slate-400">{label}</p>
    </div>
  );
}

function SideItem({ icon: Icon, text, active }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-md px-2 py-2 text-[8px] font-medium ${
        active
          ? "bg-indigo-600 text-white"
          : "text-slate-500 hover:bg-slate-50"
      }`}
    >
      <Icon size={11} />
      {text}
    </div>
  );
}

function Pipeline({ color, label, value }) {
  return (
    <div className="flex items-center gap-2 text-[8px]">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span className="flex-1 text-slate-500">{label}</span>
      <span className="font-bold text-slate-900">{value}</span>
    </div>
  );
}

function ValueCard({ icon: Icon, title, text }) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/50">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
        <Icon size={22} />
      </div>

      <h3 className="mt-5 text-base font-bold text-slate-900">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
    </div>
  );
}

function MatchItem({ icon, title, text }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-white">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300">
          {React.cloneElement(icon, { size: 13 })}
        </div>

        <span className="text-[11px] font-bold">{title}</span>
      </div>

      <p className="mt-2 text-[9px] leading-4 text-slate-400">{text}</p>
    </div>
  );
}

function Step({ number, title, text }) {
  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
        {number}
      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-900">{title}</h3>

      <p className="mt-1 text-[11px] leading-5 text-slate-500">{text}</p>

      {number !== "5" && (
        <ChevronRight
          className="absolute -right-3 top-1/2 hidden -translate-y-1/2 bg-white text-indigo-300 md:block"
          size={20}
        />
      )}
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/40">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
        <Icon size={19} />
      </div>

      <h3 className="mt-5 text-sm font-bold text-slate-900">{title}</h3>

      <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>

      <div className="mt-5 flex items-center gap-1 text-[11px] font-semibold text-indigo-600 opacity-0 transition group-hover:opacity-100">
        Learn more
        <ArrowRight size={12} />
      </div>
    </div>
  );
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
        {title}
      </h4>

      <div className="mt-4 space-y-2.5">
        {links.map((link) => (
          <a
            href="#"
            key={link}
            className="block text-xs text-slate-500 transition hover:text-indigo-600"
          >
            {link}
          </a>
        ))}
      </div>
    </div>
  );
}

export { Landing as App };















