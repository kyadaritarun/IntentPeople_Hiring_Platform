import React, { useState } from 'react';
import Header from './Header';
import {
  Lock,
  Send,
  Sparkles,
  DollarSign,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
  Star,
  Zap,
  Building2,
  UserCheck,
  ChevronDown,
  Check,
  HelpCircle,
  ArrowLeft,
  Briefcase,
  Target,
  EyeOff,
  CheckCircle2,
  Award
} from 'lucide-react';

export default function CandidatesPage({
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
      q: "Is my profile really 100% confidential and masked?",
      a: "Yes. By default, your name, current employer, and contact information are completely hidden. Hiring managers see your verified track record, anonymized experience, and skill rubrics. You choose exactly when and to whom your identity is revealed."
    },
    {
      q: "Is IntentPeople free for candidates and marketers?",
      a: "100% free, forever. We never charge candidates, and we never take a cut of your salary or sign-on bonus. Employers pay software subscriptions to access our network."
    },
    {
      q: "How does the talent dossier differ from a regular resume?",
      a: "A resume is static text that anyone can embellish. Your IntentPeople Talent Dossier is an interactive proof-of-work asset featuring verified ad spend history, blended ROAS metrics, campaign creative samples, and standardized skill scores."
    },
    {
      q: "Who reaches out to me on the platform?",
      a: "Verified decision-makers: Founders, CEOs, and Chief Marketing Officers from venture-funded startups, scale-ups, and top consumer brands. No junior agency recruiters or spammy automated outreach."
    },
    {
      q: "What salary ranges and contract types are available?",
      a: "Roles on IntentPeople range from senior practitioner to executive leadership (typically ₹24L to ₹90L+ CTC in India, and competitive global remote rates). Opportunities include full-time, fractional CMO, and high-impact advisory contracts."
    }
  ];

  const candidateSteps = [
    {
      step: "01",
      title: "Build Your Confidential Dossier",
      desc: "Connect your marketing experience, channel specialties, and career goals in under 10 minutes. Your profile remains fully masked from your current employer."
    },
    {
      step: "02",
      title: "Get Audited & Awarded Badges",
      desc: "Optionally verify your historical ad spend and campaign impact. Earn the Top 1% Verified badge to rank at the top of hiring manager search feeds."
    },
    {
      step: "03",
      title: "Receive Direct Founder Inbounds",
      desc: "Top companies pitch you directly with transparent upfront compensation, scope of work, and interview scheduling. Accept only the opportunities that excite you."
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0F172A] font-sans antialiased flex flex-col">
      {/* ============================================================
           HEADER & NAVIGATION (SHARED COMPONENT)
           ============================================================ */}
      <Header
        currentView="candidates"
        onNavigateToView={onNavigateToView}
        onNavigateToAuth={onNavigateToAuth}
      />

      {/* ============================================================
           HERO SECTION: FOR CANDIDATES
           ============================================================ */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 px-6 overflow-hidden bg-[#FAF9F6] border-b border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200/80 mb-6">
                <span className="w-2 h-2 rounded-full bg-[#00a884] animate-ping" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                  EXCLUSIVE TALENT NETWORK • 100% CONFIDENTIAL
                </span>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-medium text-[#0F172A] leading-[1.12] mb-6">
                Get discovered by top brands. <span className="italic underline decoration-teal-400">Zero resume spam</span>.
              </h1>

              <p className="text-[#526071] text-base sm:text-lg leading-relaxed mb-8 max-w-2xl">
                Replace outdated resumes with an AI-audited proof-of-work dossier. Let funded tech startups and consumer brands pitch directly to you with transparent upfront compensation.
              </p>

              {/* Value Stats Pills */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8 max-w-xl">
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs text-center">
                  <p className="text-xl sm:text-2xl font-extrabold text-[#00a884] m-0">100% Free</p>
                  <p className="text-[11px] font-medium text-slate-500 m-0 mt-0.5">Zero Placement Cut</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs text-center">
                  <p className="text-xl sm:text-2xl font-extrabold text-indigo-600 m-0">Direct</p>
                  <p className="text-[11px] font-medium text-slate-500 m-0 mt-0.5">Founder Inbounds</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs text-center">
                  <p className="text-xl sm:text-2xl font-extrabold text-amber-600 m-0">Masked</p>
                  <p className="text-[11px] font-medium text-slate-500 m-0 mt-0.5">100% Discretion</p>
                </div>
              </div>

              {/* Primary Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => onNavigateToAuth && onNavigateToAuth("register_candidate")}
                  className="btn bg-[#00a884] hover:bg-teal-700 text-white py-3.5 px-6 rounded-xl text-xs font-bold uppercase tracking-wider text-center cursor-pointer shadow-md hover:shadow-lg transition-all border-none"
                >
                  Build Your Free Dossier &rarr;
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateToAuth && onNavigateToAuth("login_candidate")}
                  className="btn btn-secondary py-3.5 px-6 rounded-xl text-xs font-bold text-center cursor-pointer"
                >
                  Candidate Sign In
                </button>
              </div>
            </div>

            {/* Right Visual Card */}
            <div className="lg:col-span-5">
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xl relative group">
                <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-md">
                  <img
                    src="/images/journey_candidate.jpg"
                    alt="Candidate Growth Dossier"
                    className="w-full h-80 sm:h-96 object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-200/80 shadow-md flex items-center gap-2">
                    <Lock size={13} className="text-[#00a884]" />
                    <span className="text-xs font-bold text-[#0F172A]">Masked Profile Active</span>
                  </div>
                  <div className="absolute bottom-4 right-4 bg-[#0F172A]/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/80 shadow-lg text-white text-right">
                    <p className="text-[10px] text-teal-300 font-bold uppercase tracking-wider m-0">Verified Inbounds</p>
                    <p className="text-xs font-semibold m-0">₹24L – ₹65L CTC Roles</p>
                  </div>
                </div>

                <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900 m-0">Head of Performance Marketing</p>
                      <p className="text-[10.5px] text-slate-500 m-0">₹32L - ₹45L CTC • Inbound Request Received</p>
                    </div>
                    <span className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                      Direct Pitch
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
           HOW IT WORKS FOR CANDIDATES
           ============================================================ */}
      <section className="py-16 md:py-24 px-6 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="eyebrow justify-center mb-2.5 text-teal-700">YOUR CAREER ROADMAP</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#0F172A] leading-tight mb-3">
              How IntentPeople Works for Growth Leaders
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              No endless job applications. Build your dossier once and let top offers come to you.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {candidateSteps.map((item, idx) => (
              <div
                key={idx}
                className="relative p-6 sm:p-8 rounded-3xl bg-[#FAF9F6] border border-slate-200/90 hover:border-teal-300 hover:shadow-lg transition-all"
              >
                <span className="text-3xl font-extrabold text-teal-600/80 mb-4 block font-serif">
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
           CANDIDATE VALUE PROPOSITIONS
           ============================================================ */}
      <section className="py-16 md:py-24 px-6 bg-[#FAF9F6] border-b border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-12">
            <span className="eyebrow mb-2.5 text-teal-700">BUILT FOR MARKETERS</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#0F172A] leading-tight mb-3">
              Why Elite Growth Marketers Choose Us
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Skip junior recruiters, ghosting, and blind applications. Experience high-leverage career mobility.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#00a884] mb-4">
                <EyeOff size={20} />
              </div>
              <h3 className="font-serif font-bold text-base text-slate-900 mb-2">
                100% Confidential
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed m-0">
                Your current employer never sees your profile. Explore opportunities with complete discretion.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF6008] mb-4">
                <Send size={20} />
              </div>
              <h3 className="font-serif font-bold text-base text-slate-900 mb-2">
                Direct Inbound Pitches
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed m-0">
                Founders and CMOs reach out directly with company mission, team context, and compensation upfront.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-4">
                <Sparkles size={20} />
              </div>
              <h3 className="font-serif font-bold text-base text-slate-900 mb-2">
                Proof-of-Work Dossier
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed m-0">
                Showcase verified ad spend, blended ROAS, and creative case studies instead of generic bullet points.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
                <DollarSign size={20} />
              </div>
              <h3 className="font-serif font-bold text-base text-slate-900 mb-2">
                Transparent Compensation
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed m-0">
                Every inbound includes transparent base CTC, bonuses, equity, and remote work policy upfront.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
           FREQUENTLY ASKED QUESTIONS FOR CANDIDATES
           ============================================================ */}
      <section className="py-16 md:py-24 px-6 bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="eyebrow justify-center mb-2.5 text-teal-700">COMMON QUESTIONS</span>
            <h2 className="font-serif text-3xl font-medium text-[#0F172A] leading-tight mb-2">
              Candidate FAQ
            </h2>
            <p className="text-slate-600 text-sm">
              Learn how your confidentiality is preserved and how inbounds work.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200/90 bg-[#FAF9F6] overflow-hidden transition-all shadow-2xs"
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
                      openFaq === idx ? "rotate-180 text-teal-600" : ""
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-200/80 animate-in fade-in duration-150">
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
      <section className="py-16 px-6 bg-gradient-to-br from-[#0F172A] to-[#115E59] text-white text-center">
        <div className="max-w-3xl mx-auto">
          <span className="text-teal-300 font-bold text-xs uppercase tracking-widest mb-3 block">
            TAKE CONTROL OF YOUR MARKETING CAREER
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-medium text-white mb-4">
            Build your private dossier and unlock direct inbound offers.
          </h2>
          <p className="text-slate-200 text-sm sm:text-base leading-relaxed mb-8 max-w-xl mx-auto">
            Join the top 1% growth marketing network. 100% free, 100% confidential.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3.5">
            <button
              type="button"
              onClick={() => onNavigateToAuth && onNavigateToAuth("register_candidate")}
              className="btn bg-[#00a884] hover:bg-teal-500 text-white py-3.5 px-7 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-lg border-none"
            >
              Build Free Dossier &rarr;
            </button>
            <button
              type="button"
              onClick={() => onNavigateToAuth && onNavigateToAuth("login_candidate")}
              className="btn bg-white/10 hover:bg-white/20 text-white border border-white/20 py-3.5 px-6 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Candidate Sign In
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

