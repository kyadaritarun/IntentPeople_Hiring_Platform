import React, { useState } from 'react';
import Header from './Header';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  Users,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
  Star,
  Zap,
  Building2,
  UserCheck,
  ChevronDown,
  Sparkles,
  Check,
  HelpCircle,
  ArrowLeft,
  DollarSign,
  Briefcase,
  Target,
  BarChart3,
  Layers,
  Award
} from 'lucide-react';

export default function RecruitersPage({
  onNavigateToView,
  onNavigateToAuth,
  onOpenPrivacy,
  onOpenTerms
}) {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const faqs = [
    {
      q: "How does IntentPeople verify candidate ROAS and ad spend?",
      a: "Candidates connect their read-only advertising accounts (Meta Ads Manager, Google Ads, TikTok, Amazon) or provide audited client campaign exports. Our verification engine checks historical lifetime spend, average ROAS benchmarks, and attribution accuracy before awarding verification badges."
    },
    {
      q: "What does the 48-hour shortlist guarantee entail?",
      a: "Once you submit your growth marketing requisition and target channels, our team and algorithmic matcher curate 3 to 5 interview-ready candidate dossiers with complete rubrics within 48 business hours."
    },
    {
      q: "Are there really zero placement commissions?",
      a: "Yes. Unlike traditional headhunters who take 20% to 30% of first-year salaries, IntentPeople operates on transparent software subscription tiers. You keep 100% of your compensation budget for your team."
    },
    {
      q: "Can our entire hiring committee collaborate on candidates?",
      a: "Absolutely. You can invite your founders, CMO, and hiring managers into synchronized hiring pods to review dossiers, score standardized rubrics, leave private notes, and coordinate interviews in one place."
    },
    {
      q: "What roles can we hire through IntentPeople?",
      a: "We specialize exclusively in digital growth marketing: Chief Marketing Officers (CMOs), Heads of Growth, Paid Social & Meta Specialists, Paid Search & Google Ads Directors, SEO & Organic Leads, Lifecycle/Retention Marketers, and Marketing Attribution Analysts."
    }
  ];

  const hiringSteps = [
    {
      step: "01",
      title: "Specify Your Growth Mandate",
      desc: "Define your target channels, budget range, and required experience. Whether you need a Meta scale specialist or a full-funnel CMO, we calibrate to your metrics."
    },
    {
      step: "02",
      title: "Review Audited Candidate Dossiers",
      desc: "Within 48 hours, receive pre-evaluated candidates with verified ad spend history, campaign ROAS track records, and standardized skill scores."
    },
    {
      step: "03",
      title: "Interview & Make Offers in 9 Days",
      desc: "Directly schedule interviews with motivated candidates. Release competitive offers with 0% placement commission penalties."
    }
  ];

  const hireRoles = [
    { title: "Chief Marketing Officer (CMO)", tags: ["P&L Ownership", "Brand & Performance", "Team Scale"], avgSalary: "₹50L - ₹90L" },
    { title: "Senior Growth Marketer", tags: ["CAC Reduction", "Funnel Optimization", "Meta & Google"], avgSalary: "₹25L - ₹42L" },
    { title: "Paid Social & Meta Ads Lead", tags: ["Creative Testing", "Scaling Budgets", "Reels/TikTok"], avgSalary: "₹20L - ₹34L" },
    { title: "Paid Search & Google Ads Director", tags: ["Search Arbitrage", "YouTube Ads", "Demand Gen"], avgSalary: "₹22L - ₹36L" },
    { title: "Director of Organic Growth & SEO", tags: ["Technical SEO", "Programmatic Moats", "Ahrefs"], avgSalary: "₹22L - ₹35L" },
    { title: "Lifecycle & Retention Marketer", tags: ["Klaviyo / Braze", "LTV Uplift", "Cohort Analysis"], avgSalary: "₹18L - ₹30L" }
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0F172A] font-sans antialiased flex flex-col">
      {/* ============================================================
           HEADER & NAVIGATION (SHARED COMPONENT)
           ============================================================ */}
      <Header
        currentView="recruiters"
        onNavigateToView={onNavigateToView}
        onNavigateToAuth={onNavigateToAuth}
      />

      {/* ============================================================
           HERO SECTION: FOR RECRUITERS
           ============================================================ */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 px-6 overflow-hidden bg-[#FAF9F6] border-b border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 mb-6">
                <span className="w-2 h-2 rounded-full bg-[#FF6008] animate-ping" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF6008]">
                  EXECUTIVE & GROWTH HIRING SUITE
                </span>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-medium text-[#0F172A] leading-[1.12] mb-6">
                Hire audited Top 1% growth marketers in <span className="italic underline decoration-orange-400">48 hours</span>.
              </h1>

              <p className="text-[#526071] text-base sm:text-lg leading-relaxed mb-8 max-w-2xl">
                Skip recruitment agencies taking 30% commissions and sorting through bloated CVs. IntentPeople delivers pre-evaluated growth leaders with verified ad spend history, campaign ROAS, and channel expertise.
              </p>

              {/* Value Stats Pills */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8 max-w-xl">
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs text-center">
                  <p className="text-xl sm:text-2xl font-extrabold text-[#FF6008] m-0">48 Hours</p>
                  <p className="text-[11px] font-medium text-slate-500 m-0 mt-0.5">Shortlist Turnaround</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs text-center">
                  <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 m-0">₹0</p>
                  <p className="text-[11px] font-medium text-slate-500 m-0 mt-0.5">Placement Commission</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs text-center">
                  <p className="text-xl sm:text-2xl font-extrabold text-indigo-600 m-0">9 Days</p>
                  <p className="text-[11px] font-medium text-slate-500 m-0 mt-0.5">Average Time-to-Offer</p>
                </div>
              </div>

              {/* Primary Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => onNavigateToAuth && onNavigateToAuth("register_company")}
                  className="btn btn-primary py-3.5 px-6 rounded-xl text-xs font-bold uppercase tracking-wider text-center cursor-pointer shadow-md hover:shadow-lg transition-all"
                >
                  Create Company Account &rarr;
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateToAuth && onNavigateToAuth("login_recruiter")}
                  className="btn btn-secondary py-3.5 px-6 rounded-xl text-xs font-bold text-center cursor-pointer"
                >
                  Sign In to Recruiter Portal
                </button>
              </div>
            </div>

            {/* Right Visual Card */}
            <div className="lg:col-span-5">
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xl relative group">
                <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-md">
                  <img
                    src="/images/journey_recruiter.jpg"
                    alt="Recruiter Hiring Suite"
                    className="w-full h-80 sm:h-96 object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-200/80 shadow-md flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#FF6008] animate-ping" />
                    <span className="text-xs font-bold text-[#0F172A]">⚡ 48h Shortlist Guarantee</span>
                  </div>
                  <div className="absolute bottom-4 right-4 bg-[#0F172A]/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/80 shadow-lg text-white text-right">
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider m-0">Audited Talent</p>
                    <p className="text-xs font-semibold m-0">Zero Recruitment Markups</p>
                  </div>
                </div>

                <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900 m-0">Neha Verma • Senior Growth Marketer</p>
                      <p className="text-[10.5px] text-slate-500 m-0">₹12 Cr+ Ad Spend Verified • 4.8x ROAS</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      98% Match
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
           HOW IT WORKS FOR EMPLOYERS
           ============================================================ */}
      <section className="py-16 md:py-24 px-6 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="eyebrow justify-center mb-2.5 text-[#FF6008]">STREAMLINED HIRING ENGINE</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#0F172A] leading-tight mb-3">
              How Hiring on IntentPeople Works
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              From requisition to signed offer in under 10 days with zero commission penalties.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {hiringSteps.map((item, idx) => (
              <div
                key={idx}
                className="relative p-6 sm:p-8 rounded-3xl bg-[#FAF9F6] border border-slate-200/90 hover:border-orange-300 hover:shadow-lg transition-all"
              >
                <span className="text-3xl font-extrabold text-orange-500/80 mb-4 block font-serif">
                  {item.step}
                </span>
                <h3 className="font-serif font-bold text-lg text-slate-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed m-0">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
           CORE RECRUITER VALUE PROPOSITIONS
           ============================================================ */}
      <section className="py-16 md:py-24 px-6 bg-[#FAF9F6] border-b border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-12">
            <span className="eyebrow mb-2.5 text-indigo-600">UNCOMPROMISING RIGOR</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#0F172A] leading-tight mb-3">
              Why High-Growth Companies Hire With Us
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              We replaced traditional headhunters with programmatic verification, deep growth rubrics, and collaborative pipeline pods.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF6008] mb-4">
                <TrendingUp size={20} />
              </div>
              <h3 className="font-serif font-bold text-base text-slate-900 mb-2">
                Audited Ad Spend & ROAS
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed m-0">
                Marketers link live ad channels to verify lifetime spend history, blended ROAS, and CAC reduction benchmarks.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
                <Clock size={20} />
              </div>
              <h3 className="font-serif font-bold text-base text-slate-900 mb-2">
                48-Hour Shortlists
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed m-0">
                Stop waiting 6 weeks for recruiters. Receive 3 to 5 vetted, interview-ready profiles tailored to your stack in 48 hours.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-4">
                <CheckCircle2 size={20} />
              </div>
              <h3 className="font-serif font-bold text-base text-slate-900 mb-2">
                Zero Placement Tax
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed m-0">
                Keep 100% of your compensation budget. No 25% agency cuts, no finder's fees, and zero placement commissions.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 mb-4">
                <Users size={20} />
              </div>
              <h3 className="font-serif font-bold text-base text-slate-900 mb-2">
                Collaborative Hiring Pods
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed m-0">
                Bring your CMO, founders, and team into unified candidate rubrics, shared notes, and 1-click offer generation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
           SPECIALIZED MARKETING ROLES YOU CAN HIRE
           ============================================================ */}
      <section className="py-16 md:py-24 px-6 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="eyebrow justify-center mb-2.5 text-emerald-600">SPECIALIZED TALENT TAXONOMY</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#0F172A] leading-tight mb-3">
              Growth Marketing Roles Ready to Interview
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Every candidate is evaluated specifically on channel mastery, experiment velocity, and analytical moats.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {hireRoles.map((role, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-[#FAF9F6] border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-bold text-sm text-slate-900 m-0">
                    {role.title}
                  </h3>
                  <span className="text-[10.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {role.avgSalary}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {role.tags.map((t, tidx) => (
                    <span
                      key={tidx}
                      className="text-[10.5px] font-medium px-2 py-0.5 rounded-md bg-white border border-slate-200/80 text-slate-600"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={() => onNavigateToAuth && onNavigateToAuth("register_company")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer border-none"
            >
              <span>Explore Candidate Shortlists</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================
           FREQUENTLY ASKED QUESTIONS FOR RECRUITERS
           ============================================================ */}
      <section className="py-16 md:py-24 px-6 bg-[#FAF9F6] border-b border-slate-200">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="eyebrow justify-center mb-2.5 text-indigo-600">COMMON QUESTIONS</span>
            <h2 className="font-serif text-3xl font-medium text-[#0F172A] leading-tight mb-2">
              Recruiter & Employer FAQ
            </h2>
            <p className="text-slate-600 text-sm">
              Everything you need to know about vetting, shortlisting, and pricing.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden transition-all shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left bg-transparent border-none cursor-pointer"
                >
                  <span className="font-bold text-sm text-slate-900 pr-4">
                    {faq.q}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                      openFaq === idx ? "rotate-180 text-indigo-600" : ""
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 animate-in fade-in duration-150">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
           BOTTOM CTA BANNER
           ============================================================ */}
      <section className="py-16 px-6 bg-gradient-to-br from-[#0F172A] to-[#1E293B] text-white text-center">
        <div className="max-w-3xl mx-auto">
          <span className="text-orange-400 font-bold text-xs uppercase tracking-widest mb-3 block">
            READY TO SCALE YOUR GROWTH ENGINE?
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-medium text-white mb-4">
            Receive your first audited candidate shortlist in 48 hours.
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8 max-w-xl mx-auto">
            Join funded startups and consumer brands hiring high-performing marketing leaders without agency markups.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3.5">
            <button
              type="button"
              onClick={() => onNavigateToAuth && onNavigateToAuth("register_company")}
              className="btn btn-primary py-3.5 px-7 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-lg hover:shadow-orange-500/20"
            >
              Get Started Now &rarr;
            </button>
            <button
              type="button"
              onClick={() => onNavigateToAuth && onNavigateToAuth("login_recruiter")}
              className="btn bg-white/10 hover:bg-white/20 text-white border border-white/20 py-3.5 px-6 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Sign In to Portal
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================
           GLOBAL FOOTER
           ============================================================ */}
      <footer className="bg-[#0B132B] text-white py-12 px-6 border-t border-slate-800 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3.5 text-left w-full md:w-auto">
            <img src="/logo.svg" alt="IntentPeople" className="h-9 w-auto object-contain flex-shrink-0" />
            <div>
              <p className="text-slate-400 text-xs italic m-0">
                We identify executive growth talent before the rest of the market.
              </p>
            </div>
          </div>

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

