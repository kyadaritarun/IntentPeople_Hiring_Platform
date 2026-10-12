import React, { useState, useEffect } from 'react';
import {
  Target, Users, DollarSign, Trophy, Layers, HelpCircle,
  Compass, Clock, X, ChevronRight, ChevronDown, CheckCircle2,
  AlertCircle, Sparkles, BookOpen, Calculator, Award, ArrowRight,
  Zap, Info, ShieldCheck, Check, Search, ExternalLink, Sliders
} from 'lucide-react';

export default function ScoringGuideDrawer({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('cards'); // 'cards' | 'formula' | 'tips'
  const [selectedCardId, setSelectedCardId] = useState('relevant_capability');
  const [searchQuery, setSearchQuery] = useState('');

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const CARDS_GUIDE = [
    {
      id: 'relevant_capability',
      number: 'CARD 01',
      title: 'Relevant Capability & Execution Depth',
      domainWeight: '30% Weight in Domain Alignment',
      icon: Target,
      accent: 'border-l-indigo-500',
      iconBg: 'bg-indigo-100 text-indigo-600',
      tagBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      summary: 'Evaluates the candidate’s hands-on domain discipline (e.g. SEO, Paid Social, Lifecycle) and depth of direct execution versus managerial delegation.',
      candidateData: [
        { field: 'Primary Specialization', desc: 'Candidate declared primary domain (e.g., SEO, Performance Marketing, Content).' },
        { field: 'Specific Capabilities', desc: 'Detailed skill list with self-reported proficiency (e.g., Technical SEO, Keyword Audits, Link Building).' },
        { field: 'Ownership Level', desc: 'Whether they Personally Executed campaigns, Strategised & Led, Managed Agencies, or simply Approved.' }
      ],
      jobData: [
        { field: 'Role Specialization', desc: 'Required domain focus in job requisition (e.g. "Senior SEO Strategist").' },
        { field: 'Required Skills & Keywords', desc: 'Extracted from job skills checklist and job description text.' },
        { field: 'Ownership Level Expected', desc: 'Whether the role is hands-on execution or high-level delegation/leadership.' }
      ],
      scoringFormula: [
        { range: 'Base Score', detail: '60% baseline capability score.' },
        { range: '+20%', detail: 'Direct match between Candidate primary specialization & Job primary specialization.' },
        { range: '+15%', detail: 'Secondary capability or keyword match with Job specialization.' },
        { range: '+ up to 20%', detail: 'Match density between Candidate specific capabilities & Job required skills (approx. +6.5% per matched capability).' },
        { range: '-15% Penalty', detail: 'Friction penalty if the job explicitly requires "Personally executed" hands-on work but candidate has only delegated/agency-managed experience.' }
      ],
      statusTiers: [
        { status: 'High Match', score: '80% - 100%', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', note: 'Primary discipline matches perfectly with hands-on proof.' },
        { status: 'Moderate Match', score: '60% - 79%', color: 'text-indigo-700 bg-indigo-50 border-indigo-200', note: 'Related discipline or good capability overlap; verify hands-on depth in interview.' },
        { status: 'Partial Match', score: '< 60%', color: 'text-amber-700 bg-amber-50 border-amber-200', note: 'Adjacent discipline or missing required core capabilities.' }
      ],
      recruiterTip: 'Expand this card in the candidate dossier to see which specific capabilities matched. If marked "Probe hands-on depth", ask how much of their weekly time is spent inside the ad tools vs managing vendors.'
    },
    {
      id: 'relevant_audience',
      number: 'CARD 02',
      title: 'Relevant Audience & GTM Context',
      domainWeight: '20% Weight in Domain Alignment',
      icon: Users,
      accent: 'border-l-blue-500',
      iconBg: 'bg-blue-100 text-blue-600',
      tagBg: 'bg-blue-50 text-blue-700 border-blue-200',
      summary: 'Matches candidate familiarity with your target customer type (B2B, B2C, Enterprise, D2C) and Go-To-Market motion (Inbound, Outbound, PLG).',
      candidateData: [
        { field: 'Customer Audience Model', desc: 'B2B, B2C, D2C, Enterprise, SMB, or Marketplace.' },
        { field: 'Route-to-Market (RTM)', desc: 'Inbound, Outbound Sales-Assisted, Product-Led Growth (PLG), Partner Channels.' },
        { field: 'Sales / Buying Cycle', desc: 'Self-serve instantaneous, 30-day SMB, or 6-12 month Enterprise deals.' }
      ],
      jobData: [
        { field: 'Business Model', desc: 'Company business model configured in the job posting (e.g. B2B SaaS).' },
        { field: 'Target Persona & Motion', desc: 'Extracted from job title and requisition requirements.' }
      ],
      scoringFormula: [
        { range: 'Direct Model Match', detail: '90% base if candidate model matches the job model (e.g. both are B2B), +5% for each extra aligned model.' },
        { range: 'General / Open Model', detail: '80% if job has no strict model specified and candidate has standard digital experience.' },
        { range: 'Cross-Domain / Mismatch', detail: '60% if candidate exclusively has B2C and job strictly requires Enterprise B2B.' },
        { range: '+5% GTM Bonus', detail: 'If candidate’s Route-to-Market motion (e.g. PLG) matches keywords in the job description.' }
      ],
      statusTiers: [
        { status: 'High Alignment', score: '80% - 100%', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', note: 'Immediate persona empathy; proven in your exact sales cycle.' },
        { status: 'Compatible', score: '60% - 79%', color: 'text-blue-700 bg-blue-50 border-blue-200', note: 'General digital audience experience; may require brief ramp-up on buyer psychology.' },
        { status: 'Exploratory', score: '< 60%', color: 'text-amber-700 bg-amber-50 border-amber-200', note: 'Completely different buying motion (e.g., fast FMCG vs 9-month Enterprise).' }
      ],
      recruiterTip: 'A B2C growth marketer behaves differently from an Enterprise B2B marketer. This card saves you from interviewing candidates who cannot speak to your specific buyers.'
    },
    {
      id: 'relevant_environment',
      number: 'CARD 03',
      title: 'Relevant Environment & Budget Scale',
      domainWeight: '15% Weight in Domain Alignment',
      icon: DollarSign,
      accent: 'border-l-teal-500',
      iconBg: 'bg-teal-100 text-teal-600',
      tagBg: 'bg-teal-50 text-teal-700 border-teal-200',
      summary: 'Verifies whether the candidate has managed ad budgets and organizational scale comparable to your requisition.',
      candidateData: [
        { field: 'Largest Monthly Spend', desc: 'Self-reported monthly ad budget managed (e.g. $10k/mo, $50k/mo, $500k/mo, or ₹10L - ₹50L).' },
        { field: 'Case Study Budgets', desc: 'Exact ad spends reported in attached campaign case studies.' },
        { field: 'Operating Team Setup', desc: 'In-house team, agency environment, or candidate’s previous employer scale (e.g. Razorpay, Swiggy).' }
      ],
      jobData: [
        { field: 'Requisition Budget Range', desc: 'Target monthly ad budget or campaign expenditure for this vacancy.' },
        { field: 'Company Growth Stage', desc: 'Seed, Series A-C, Growth, or Enterprise scale.' }
      ],
      scoringFormula: [
        { range: 'High Scale ($50K+ / ₹50L+)', detail: '92% score for enterprise/high-velocity scale experience.' },
        { range: 'Mid Scale ($10K - $30K)', detail: '85% score for scalable growth environments.' },
        { range: 'Standard / Early Scale', detail: '75% - 80% baseline for standard small business or early startup budgets.' },
        { range: 'Not Declared', detail: '70% default score when budget details are missing from profile.' }
      ],
      statusTiers: [
        { status: 'Well Aligned', score: '80% - 100%', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', note: 'Proven comfort managing high budgets without reckless ad spend wastage.' },
        { status: 'Scale Capable', score: '60% - 79%', color: 'text-teal-700 bg-teal-50 border-teal-200', note: 'Managed mid-level budgets; capable of scaling up with oversight.' },
        { status: 'Review Needed', score: '< 60%', color: 'text-amber-700 bg-amber-50 border-amber-200', note: 'Only managed microscopic budgets or unstated spend history.' }
      ],
      recruiterTip: 'Look at the "Largest Spend Managed" tag on this card to ensure you aren’t hiring someone who gets overwhelmed by your monthly ad spend.'
    },
    {
      id: 'evidence',
      number: 'CARD 04',
      title: 'Evidence of Performance (Proof of Work)',
      domainWeight: '20% Weight in Domain Alignment',
      icon: Trophy,
      accent: 'border-l-amber-500',
      iconBg: 'bg-amber-100 text-amber-600',
      tagBg: 'bg-amber-50 text-amber-700 border-amber-200',
      summary: 'Separates talkers from performers by grading verifiable campaign case studies, before/after metrics, and live portfolio evidence.',
      candidateData: [
        { field: 'Case Studies Count', desc: 'Number of structured campaign case studies submitted in Uptrix profile.' },
        { field: 'Measurable Metrics', desc: 'Quantitative proof: ROAS lift, CAC reduction, organic traffic boost (e.g. "3.2x ROAS", "+140% MQLs").' },
        { field: 'Verifiable Links', desc: 'Live proof URLs, portfolio links, or dashboard screenshots.' }
      ],
      jobData: [
        { field: 'Proof of Work Standard', desc: 'Benchmarked against verified talent bar (proven results over verbal resume claims).' }
      ],
      scoringFormula: [
        { range: '95%', detail: '2+ documented case studies with verifiable before/after metrics.' },
        { range: '90%', detail: '1 documented case study with concrete metrics (like in your candidate’s dossier).' },
        { range: '80%', detail: '1 case study submitted without full numerical metrics.' },
        { range: '65%', detail: 'Portfolio URL / design links provided without structured case studies.' },
        { range: '55%', detail: 'Standard resume PDF link only.' },
        { range: '35%', detail: 'Zero proof, zero case studies, zero portfolio documentation.' }
      ],
      statusTiers: [
        { status: 'Verified Proof', score: '80% - 100%', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', note: 'Backed by real campaign case studies with verifiable performance proof.' },
        { status: 'Documented', score: '60% - 79%', color: 'text-amber-700 bg-amber-50 border-amber-200', note: 'General resume or portfolio links present, but lacks structured ROI metrics.' },
        { status: 'Unverified', score: '< 60%', color: 'text-rose-700 bg-rose-50 border-rose-200', note: 'No proof of work attached; recruiter must independently verify all claims.' }
      ],
      recruiterTip: 'Click the "Work & Proof" tab in the candidate sidebar to read their full case study, including campaign objectives, ad spend, and screenshots.'
    },
    {
      id: 'transferable_experience',
      number: 'CARD 05',
      title: 'Transferable Experience & Marketing Tools',
      domainWeight: 'Diagnostic & Versatility Indicator',
      icon: Layers,
      accent: 'border-l-purple-500',
      iconBg: 'bg-purple-100 text-purple-600',
      tagBg: 'bg-purple-50 text-purple-700 border-purple-200',
      summary: 'Grades candidate "T-shaped" breadth — secondary specializations and active tool proficiency across analytics, ads, CRM, and automation.',
      candidateData: [
        { field: 'Secondary Specializations', desc: 'Adjacent capabilities (e.g. a primary SEO marketer who also knows Paid Search and CRO).' },
        { field: 'Tools Proficiency List', desc: 'Specific marketing platforms declared (Google Ads, Meta Ads Manager, GA4, HubSpot, Mixpanel, SEMrush, Webflow, etc.).' }
      ],
      jobData: [
        { field: 'Cross-functional Versatility', desc: 'Checks if candidate can handle modern martech workflows without endless external training.' }
      ],
      scoringFormula: [
        { range: 'Base Score', detail: '65% baseline versatility score.' },
        { range: '+9% per Secondary Specialization', detail: 'Up to +18% bonus for documented secondary skill depth (T-shaped marketer).' },
        { range: '+4% per Proficient Tool', detail: 'Up to +17% bonus based on count of declared marketing tools (e.g., 8 tools = ~82% score).' }
      ],
      statusTiers: [
        { status: 'High Versatility', score: '80% - 100%', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', note: 'T-shaped marketer with multi-channel and multi-tool fluency.' },
        { status: 'Moderate Breadth', score: '60% - 79%', color: 'text-purple-700 bg-purple-50 border-purple-200', note: 'Standard tool proficiency; solid for focused individual contributor roles.' },
        { status: 'Specialist', score: '< 60%', color: 'text-slate-700 bg-slate-100 border-slate-200', note: 'Single-channel specialist with narrow software exposure.' }
      ],
      recruiterTip: 'Modern marketers must be proficient across at least analytics and ad platforms. Check the expanded card to see the exact 6+ tools this candidate uses daily.'
    },
    {
      id: 'needs_clarification',
      number: 'CARD 06',
      title: 'Points for Recruiter Clarification',
      domainWeight: 'Interview Risk Radar',
      icon: HelpCircle,
      accent: 'border-l-rose-500',
      iconBg: 'bg-rose-100 text-rose-600',
      tagBg: 'bg-rose-50 text-rose-700 border-rose-200',
      summary: 'An automated radar that flags profile gaps, discrepancies, or delays, and generates copy-paste probing questions for your interview.',
      candidateData: [
        { field: 'Notice Period Checks', desc: 'Flags if notice period is 60–90 days (2–3 months delay).' },
        { field: 'Case Study Presence', desc: 'Flags if candidate submitted 0 case studies or zero ROI metrics.' },
        { field: 'Execution Depth Mismatch', desc: 'Flags if job requires hands-on execution but candidate only managed/delegated.' },
        { field: 'Missing Tools List', desc: 'Flags if the applicant omitted their tool proficiency list.' }
      ],
      jobData: [
        { field: 'Screening Benchmarks', desc: 'Ensures recruiter does not enter an interview without knowing key risks.' }
      ],
      scoringFormula: [
        { range: '100%', detail: 'Zero red flags detected (Clear Profile).' },
        { range: '-15% per checkpoint', detail: 'Each flagged item deducts 15% (e.g., 1 flag = 85%, 2 flags = 70%, 3 flags = 55% floor).' }
      ],
      statusTiers: [
        { status: 'Clear Profile', score: '100%', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', note: 'Zero discrepancy or delay flags detected.' },
        { status: '1 Point(s) to Probe', score: '85%', color: 'text-rose-700 bg-rose-50 border-rose-200', note: '1 item to clarify (e.g. 60-day notice period timeframe).' },
        { status: '2+ Points to Probe', score: '≤ 70%', color: 'text-rose-800 bg-rose-100 border-rose-300', note: 'Multiple gaps; requires targeted probing during phone screen.' }
      ],
      recruiterTip: 'Expand this card to view ready-made interview questions! Click the copy icon next to any suggested question to paste it directly into your interview notes or email.'
    },
    {
      id: 'preference_compatibility',
      number: 'CARD 07',
      title: 'Preference & Work Setup Compatibility',
      domainWeight: '15% Weight in Domain Alignment',
      icon: Compass,
      accent: 'border-l-emerald-500',
      iconBg: 'bg-emerald-100 text-emerald-600',
      tagBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      summary: 'Checks work arrangement alignment (Remote, Hybrid, On-site) and compensation target expectations against requisition limits.',
      candidateData: [
        { field: 'Preferred Work Arrangement', desc: 'Remote, Hybrid, Onsite, or Open/Flexible.' },
        { field: 'Target Compensation', desc: 'Expected CTC / desired salary range (e.g. "Rs. 26 - 34 LPA").' }
      ],
      jobData: [
        { field: 'Job Work Mode', desc: 'Required workplace setup (Remote, Hybrid, On-site).' },
        { field: 'Budgeted Salary Range', desc: 'Job salary minimum and maximum allocation.' }
      ],
      scoringFormula: [
        { range: 'Base Score', detail: '75% baseline compatibility.' },
        { range: '+15% (90% score)', detail: 'Full alignment when candidate work mode matches job work mode or is marked "Flexible/Any".' },
        { range: '-10% (65% score)', detail: 'Friction detected when candidate insists on Remote while job requires On-site.' }
      ],
      statusTiers: [
        { status: 'Fully Aligned', score: '85% - 100%', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', note: 'Zero friction on work mode; compensation fits within budget.' },
        { status: 'Partially Aligned', score: '65% - 84%', color: 'text-indigo-700 bg-indigo-50 border-indigo-200', note: 'Minor arrangement preference differences to discuss.' },
        { status: 'Friction Detected', score: '< 65%', color: 'text-rose-700 bg-rose-50 border-rose-200', note: 'Work mode mismatch (e.g., candidate refuses on-site relocation).' }
      ],
      recruiterTip: 'Saves you from offering the job only to get rejected at the final stage because of location or compensation dealbreakers.'
    },
    {
      id: 'timing_difference',
      number: 'CARD 08',
      title: 'Timing & Availability Alignment',
      domainWeight: 'Hiring Velocity Benchmark',
      icon: Clock,
      accent: 'border-l-sky-500',
      iconBg: 'bg-sky-100 text-sky-600',
      tagBg: 'bg-sky-50 text-sky-700 border-sky-200',
      summary: 'Evaluates joining readiness and notice period duration against your company’s hiring urgency.',
      candidateData: [
        { field: 'Declared Joining Availability', desc: 'Immediate, 15 days, 30 days, 60 days, or 90 days notice.' }
      ],
      jobData: [
        { field: 'Hiring Urgency', desc: 'Standard recruiter onboarding timeline (Immediate vs Planning required).' }
      ],
      scoringFormula: [
        { range: '98% (Immediate Start Ready)', detail: 'Candidate is ready to start immediately or within 15 days.' },
        { range: '88% (Standard 30-day notice)', detail: 'Candidate has a standard 1-month / 30-day notice period.' },
        { range: '85% (On Track)', detail: 'Candidate is flexible or open availability.' },
        { range: '60% (Moderate Delay)', detail: 'Candidate has a 60–90 day notice period (2–3 months delay, planning required).' }
      ],
      statusTiers: [
        { status: 'Immediate Start', score: '95% - 100%', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', note: 'Can start next Monday or within 15 days.' },
        { status: 'On Track', score: '80% - 94%', color: 'text-sky-700 bg-sky-50 border-sky-200', note: 'Standard 30-day notice period; normal onboarding velocity.' },
        { status: 'Moderate Delay', score: '60% - 79%', color: 'text-amber-700 bg-amber-50 border-amber-200', note: '60–90 days notice; company must plan for delayed start date.' },
        { status: 'Extended Notice', score: '< 60%', color: 'text-rose-700 bg-rose-50 border-rose-200', note: 'Notice period exceeds 90 days.' }
      ],
      recruiterTip: 'If your hiring manager needs someone immediately, a candidate with 60% on this card will take 2–3 months before their first day on the job.'
    }
  ];

  const filteredCards = CARDS_GUIDE.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      c.number.toLowerCase().includes(q) ||
      c.summary.toLowerCase().includes(q) ||
      c.candidateData.some(d => d.field.toLowerCase().includes(q) || d.desc.toLowerCase().includes(q))
    );
  });

  const activeCard = CARDS_GUIDE.find(c => c.id === selectedCardId) || CARDS_GUIDE[0];
  const ActiveIcon = activeCard.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      {/* Slide-over panel */}
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-start justify-between gap-4 border-b border-indigo-900/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/25 border border-indigo-400/40 flex items-center justify-center font-bold text-amber-300 shadow-inner shrink-0">
              <Zap className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-white m-0">
                  Recruiter Guide: AI Scoring & 8-Card Dossier
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 uppercase tracking-wider">
                  Real Data Explained
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-1 m-0">
                Understand how candidate capabilities are compared against your job requisition to produce transparent match percentages.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border-none cursor-pointer transition-colors shrink-0"
            title="Close Guide (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-200 shrink-0 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('cards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border-none cursor-pointer ${
              activeTab === 'cards'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>All 8 Cards Deep Dive</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('formula')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border-none cursor-pointer ${
              activeTab === 'formula'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Score Weights & Formula</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tips')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border-none cursor-pointer ${
              activeTab === 'tips'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Recruiter Quick Tips</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          
          {/* TAB 1: ALL 8 CARDS DEEP DIVE */}
          {activeTab === 'cards' && (
            <div className="space-y-4">
              
              {/* Search Bar & Quick Card Pills */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by topic, e.g. Notice period, Ad spend, Case studies, SEO, Tools..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Horizontal Quick Picker */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {filteredCards.map((c) => {
                    const isSelected = c.id === activeCard.id;
                    const Icon = c.icon;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCardId(c.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <Icon className={`w-3 h-3 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                        <span>{c.number}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Card Detailed Showcase */}
              <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden border-l-4 ${activeCard.accent}`}>
                <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-9 h-9 rounded-xl ${activeCard.iconBg} flex items-center justify-center font-bold shrink-0 shadow-2xs`}>
                        <ActiveIcon className="w-4 h-4" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {activeCard.number}
                          </span>
                          <span className={`px-2 py-0.2 rounded-full text-[10px] font-extrabold border ${activeCard.tagBg}`}>
                            {activeCard.domainWeight}
                          </span>
                        </div>
                        <h3 className="text-sm font-black text-slate-900 mt-0.5 m-0">
                          {activeCard.title}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mt-2.5 leading-relaxed font-medium m-0">
                    {activeCard.summary}
                  </p>
                </div>

                <div className="p-4 sm:p-5 space-y-4">
                  {/* Two-Column Comparison: What We Take vs What We Compare Against */}
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                      Data Comparison Mapping
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Left: Candidate Side */}
                      <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100/80 space-y-2">
                        <div className="text-[11px] font-extrabold text-blue-900 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          <span>Candidate Profile Data Used</span>
                        </div>
                        <div className="space-y-1.5">
                          {activeCard.candidateData.map((d, i) => (
                            <div key={i} className="text-xs">
                              <span className="font-bold text-slate-800">{d.field}: </span>
                              <span className="text-slate-600 font-medium">{d.desc}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right: Job Side */}
                      <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100/80 space-y-2">
                        <div className="text-[11px] font-extrabold text-purple-900 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                          <span>Compared Against Job Requisition</span>
                        </div>
                        <div className="space-y-1.5">
                          {activeCard.jobData.map((d, i) => (
                            <div key={i} className="text-xs">
                              <span className="font-bold text-slate-800">{d.field}: </span>
                              <span className="text-slate-600 font-medium">{d.desc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Scoring Formula & Criteria */}
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                      <Calculator className="w-3.5 h-3.5 text-teal-600" />
                      How the Percentage is Calculated
                    </h4>

                    <div className="space-y-1.5">
                      {activeCard.scoringFormula.map((f, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start justify-between gap-3 text-xs">
                          <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
                            {f.range}
                          </span>
                          <span className="text-slate-600 font-medium leading-relaxed text-right">
                            {f.detail}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status Badge Tiers */}
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      Status Badges & Thresholds
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {activeCard.statusTiers.map((tier, i) => (
                        <div key={i} className={`p-2.5 rounded-xl border ${tier.color} space-y-1`}>
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-[11px]">{tier.status}</span>
                            <span className="text-[10px] font-black opacity-80">{tier.score}</span>
                          </div>
                          <p className="text-[10.5px] opacity-90 leading-tight m-0 font-medium">
                            {tier.note}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recruiter Actionable Tip */}
                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-wider text-amber-900">
                        Recruiter Action Tip
                      </div>
                      <p className="text-xs text-amber-900/90 mt-0.5 leading-relaxed font-medium m-0">
                        {activeCard.recruiterTip}
                      </p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Quick Jump List to other cards */}
              <div className="pt-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Browse All 8 Dossier Cards
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CARDS_GUIDE.map((c) => {
                    const isSelected = c.id === activeCard.id;
                    const Icon = c.icon;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCardId(c.id)}
                        className={`text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-400/30'
                            : 'bg-white hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-7 h-7 rounded-lg ${c.iconBg} flex items-center justify-center shrink-0`}>
                            <Icon className="w-3.5 h-3.5" />
                          </span>
                          <div className="min-w-0">
                            <div className="text-[10px] font-bold text-slate-400 uppercase">{c.number}</div>
                            <div className="text-xs font-bold text-slate-800 truncate">{c.title}</div>
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-300'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: SCORE WEIGHTS & FORMULA */}
          {activeTab === 'formula' && (
            <div className="space-y-4">
              
              {/* Overall AI Fit Score Formula Box */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-md space-y-3">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-300">
                  <Calculator className="w-4 h-4" />
                  <span>The Uptrix Dual-Engine Scoring Formula</span>
                </div>
                <h3 className="text-sm font-black text-white m-0 leading-snug">
                  Overall AI Fit Score = (55% Domain Match Dossier) + (45% Core ATS Resume Match)
                </h3>
                <p className="text-xs text-indigo-200/90 leading-relaxed font-medium m-0">
                  Generic ATS tools fail because they only scan keywords on a resume. Uptrix blends core candidate qualifications (experience years, education, skills, seniority) with the <strong>8-Dimension Marketing Matrix</strong> (execution depth, proof of work, ad spend scale, customer model).
                </p>
              </div>

              {/* Weight Breakdown Diagram */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4 shadow-sm">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2 m-0">
                  <Target className="w-4 h-4 text-emerald-600" />
                  Domain Alignment Weighting (The 8 Cards)
                </h4>

                <div className="space-y-2.5">
                  {/* Card 01 */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-slate-800">Card 01: Capability & Execution Depth</span>
                      <span className="font-extrabold text-indigo-600">30% Weight</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: '30%' }}></div>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Primary discipline match + hands-on execution vs delegation.</div>
                  </div>

                  {/* Card 04 */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-slate-800">Card 04: Evidence of Performance (Proof of Work)</span>
                      <span className="font-extrabold text-amber-600">20% Weight</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '20%' }}></div>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Documented campaign case studies + verified before/after ROI metrics.</div>
                  </div>

                  {/* Card 02 */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-slate-800">Card 02: Audience & GTM Context</span>
                      <span className="font-extrabold text-blue-600">20% Weight</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: '20%' }}></div>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">B2B, B2C, D2C, Enterprise audience models + Go-To-Market motion.</div>
                  </div>

                  {/* Card 03 */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-slate-800">Card 03: Environment & Budget Scale</span>
                      <span className="font-extrabold text-teal-600">15% Weight</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full" style={{ width: '15%' }}></div>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Monthly ad spend scale handled ($10k vs $50k vs $1M+) and company environment.</div>
                  </div>

                  {/* Card 07 */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-slate-800">Card 07: Preference & Work Setup Compatibility</span>
                      <span className="font-extrabold text-emerald-600">15% Weight</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '15%' }}></div>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Work arrangement match (Remote/Hybrid/Onsite) & CTC target compatibility.</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                  <div className="font-bold text-slate-800">What about Cards 05, 06, and 08?</div>
                  <p className="m-0 leading-relaxed font-medium">
                    • <strong>Card 05 (Tools & Versatility)</strong> feeds candidate versatility and tool depth.<br />
                    • <strong>Card 06 (Points for Clarification)</strong> acts as an automated risk radar and generates probing interview questions.<br />
                    • <strong>Card 08 (Availability & Timing)</strong> highlights joining readiness (e.g. 60-day notice period delay).
                  </p>
                </div>
              </div>

              {/* Core ATS Breakdown (The other 45%) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-3 shadow-sm">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2 m-0">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Core ATS Resume Scoring (45% Weight)
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 font-medium">Skills Match:</span>
                    <div className="font-extrabold text-slate-800 mt-0.5">35% ATS Weight</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 font-medium">Experience Years:</span>
                    <div className="font-extrabold text-slate-800 mt-0.5">25% ATS Weight</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 font-medium">Relevance:</span>
                    <div className="font-extrabold text-slate-800 mt-0.5">15% ATS Weight</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 font-medium">Seniority Level:</span>
                    <div className="font-extrabold text-slate-800 mt-0.5">10% ATS Weight</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 font-medium">Education:</span>
                    <div className="font-extrabold text-slate-800 mt-0.5">10% ATS Weight</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 font-medium">Completeness:</span>
                    <div className="font-extrabold text-slate-800 mt-0.5">5% ATS Weight</div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: RECRUITER QUICK TIPS */}
          {activeTab === 'tips' && (
            <div className="space-y-4">
              
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-indigo-950 m-0">
                    How Top Recruiters Use the Dossier
                  </h4>
                  <p className="text-xs text-indigo-900/90 mt-1 leading-relaxed font-medium m-0">
                    Instead of reading resumes top-to-bottom for 10 minutes, recruiters use the 8 cards to make a 30-second qualified decision.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Tip 1 */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center">1</span>
                    <span className="text-xs font-black text-slate-900">Check Card 04 First (Proof of Work)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium m-0 pl-8">
                    Anyone can write "SEO Expert" or "Managed Meta Ads" on a CV. Look at Card 04: if it shows <strong>Verified Proof (90%+)</strong>, they attached real campaign case studies with before/after CAC, ROAS, or traffic metrics.
                  </p>
                </div>

                {/* Tip 2 */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-black flex items-center justify-center">2</span>
                    <span className="text-xs font-black text-slate-900">Watch Out for Card 06 (Points to Clarify)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium m-0 pl-8">
                    Card 06 alerts you to friction points, like notice periods over 60 days or missing hands-on depth. Expand the card and click the <strong>Copy</strong> icon next to the pre-generated interview questions to paste them into your screen notes.
                  </p>
                </div>

                {/* Tip 3 */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-black flex items-center justify-center">3</span>
                    <span className="text-xs font-black text-slate-900">Verify Card 08 for Hiring Urgency</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium m-0 pl-8">
                    If your team is in a hurry, look at Card 08. If the candidate is on a 60–90 day notice (scored at 60%), flag this immediately to the hiring manager before spending 4 rounds of interviews.
                  </p>
                </div>

                {/* Tip 4 */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 text-xs font-black flex items-center justify-center">4</span>
                    <span className="text-xs font-black text-slate-900">Hands-on Execution vs Agency Delegation (Card 01)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium m-0 pl-8">
                    Early-stage companies and growth teams need candidates who roll up their sleeves. Card 01 specifically examines whether the candidate <em>Personally executed</em> campaigns or merely delegated tasks to external marketing agencies.
                  </p>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            <Info className="w-3.5 h-3.5 text-indigo-600" />
            <span>Scores recalculate automatically whenever candidate profiles or job criteria change.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer border-none transition-all shadow-xs shrink-0"
          >
            Got It, Close Guide
          </button>
        </div>

      </div>
    </div>
  );
}
