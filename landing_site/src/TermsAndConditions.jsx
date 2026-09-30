import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  FileText,
  Shield,
  Scale,
  CheckCircle2,
  Lock,
  Building2,
  Users,
  CreditCard,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  Printer,
  Copy,
  Check,
  ChevronRight,
  Sparkles,
  Zap,
  Globe2
} from 'lucide-react';

export default function TermsAndConditions({ onBack, onOpenPrivacy, onNavigateToAuth }) {
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState('acceptance');

  const sections = [
    { id: 'acceptance', title: '1. Acceptance & Eligibility', icon: Scale },
    { id: 'platform-services', title: '2. Platform & Services Scope', icon: Globe2 },
    { id: 'user-accounts', title: '3. User Accounts & Responsibilities', icon: Users },
    { id: 'subscriptions-billing', title: '4. Subscriptions, Fees & Billing', icon: CreditCard },
    { id: 'cancellation-refunds', title: '5. Cancellation & Refund Policy', icon: Zap },
    { id: 'ip-content', title: '6. Intellectual Property & Content Rights', icon: Building2 },
    { id: 'ai-matching', title: '7. AI Matching & Algorithm Disclaimers', icon: Sparkles },
    { id: 'acceptable-use', title: '8. Acceptable Use & Prohibitions', icon: AlertTriangle },
    { id: 'liability-warranties', title: '9. Limitation of Liability & Disclaimers', icon: Shield },
    { id: 'disputes-law', title: '10. Governing Law & Dispute Resolution', icon: Lock },
    { id: 'contact-grievance', title: '11. Contact & Grievance Officer', icon: HelpCircle },
  ];

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-500 selection:text-white">
      {/* ── Top Header Navigation Bar ── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200/60"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>
            <div className="h-5 w-px bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-2 cursor-pointer" onClick={onBack}>
              <img src="/logo.svg" alt="IntentPeople" className="h-7 w-auto object-contain" />
              <span className="hidden sm:inline-block text-[11px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                Legal
              </span>
            </div>
          </div>

          {/* Quick Legal Switcher & CTA */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/60 text-xs font-semibold">
              <span className="px-3 py-1 rounded-lg bg-white text-indigo-700 shadow-2xs font-bold">
                Terms of Service
              </span>
              <button
                type="button"
                onClick={onOpenPrivacy}
                className="px-3 py-1 rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
            </div>

            {onNavigateToAuth && (
              <button
                type="button"
                onClick={() => onNavigateToAuth('select_role')}
                className="hidden md:inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all cursor-pointer"
              >
                <span>Get Started</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-b from-indigo-50/60 via-white to-transparent border-b border-slate-200/60 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-indigo-700 bg-indigo-100/70 border border-indigo-200/70 mb-4">
              <FileText className="w-3.5 h-3.5" />
              <span>Official Agreement • Version 2.5</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Terms & Conditions
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
              Please read these terms carefully before accessing or using the Uptrix recruitment platform, application tracking suite, and candidate matching services.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Last Revised: October 2025</span>
              <span>•</span>
              <span>Applies to Employers, Recruiters, and Candidates</span>
              <span>•</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1 text-slate-600 hover:text-indigo-600 transition"
                  title="Print this document"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1 text-slate-600 hover:text-indigo-600 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Link Copied' : 'Share'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Two-Column Layout ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Left Column: Sticky Table of Contents */}
          <aside className="hidden lg:block lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-2xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Table of Contents
                </h3>
                <nav className="space-y-1">
                  {sections.map((sec) => {
                    const Icon = sec.icon;
                    const isActive = activeSection === sec.id;
                    return (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => scrollToSection(sec.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-left transition-all cursor-pointer ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <span className="truncate">{sec.title}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Quick Legal Help Box */}
              <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-5 shadow-sm">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-200" />
                  <span>Questions or Compliance?</span>
                </h4>
                <p className="mt-2 text-xs text-indigo-100 leading-relaxed">
                  Our legal and data compliance team is available to assist with enterprise DPA requests or vendor assessments.
                </p>
                <a
                  href="mailto:legal@intentpeople.com"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-white/20 hover:bg-white/30 px-3.5 py-1.5 rounded-lg backdrop-blur-sm transition"
                >
                  <span>Contact Legal Team</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </aside>

          {/* Right Column: Exhaustive Legal Clauses */}
          <main className="lg:col-span-8 space-y-12">

            {/* 1. Acceptance & Eligibility */}
            <section id="acceptance" className="scroll-mt-24 rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-2xs">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">1. Acceptance & Eligibility</h2>
                  <p className="text-xs text-slate-500">Binding legal agreement between you and Uptrix Technologies</p>
                </div>
              </div>

              <div className="prose prose-slate prose-sm max-w-none text-slate-600 space-y-4 leading-relaxed text-[13.5px]">
                <p>
                  These Terms and Conditions (“Terms”, “Agreement”) constitute a legally binding agreement between you (“User”, “Client”, “Candidate”, or “You”) and <strong>Uptrix Technologies Inc.</strong> (“Uptrix”, “We”, “Us”, or “Our”), governing your access to and use of the Uptrix website, employer portal, candidate pipeline, and associated software applications (collectively, the “Platform”).
                </p>
                <p>
                  By registering an account, publishing a job requisition, submitting a resume, or browsing the Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms and our companion <button onClick={onOpenPrivacy} className="text-indigo-600 hover:underline font-semibold cursor-pointer">Privacy Policy</button>. If you do not agree to these Terms, you must immediately discontinue use of the Platform.
                </p>
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/70 text-amber-900 text-xs flex gap-2.5 items-start">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Eligibility:</strong> You must be at least 18 years of age or possess the legal capacity to form a binding contract under applicable law in your jurisdiction to use this Platform. By registering an organization account, you warrant that you are authorized to bind that entity to these Terms.
                  </span>
                </div>
              </div>
            </section>

            {/* 2. Platform & Services Scope */}
            <section id="platform-services" className="scroll-mt-24 rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-2xs">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <Globe2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">2. Platform & Services Scope</h2>
                  <p className="text-xs text-slate-500">Recruitment management, candidate matching, and AI screening services</p>
                </div>
              </div>

              <div className="prose prose-slate prose-sm max-w-none text-slate-600 space-y-4 leading-relaxed text-[13.5px]">
                <p>
                  Uptrix provides a unified hiring platform designed for fast-scaling enterprises, agencies, and top-tier job seekers. The core services provided through the Platform include:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-slate-600">
                  <li><strong>Employer Management & Pipeline:</strong> Multi-tenant hiring portals, job requisition publishing, applicant stage tracking, and candidate dossiers.</li>
                  <li><strong>Staff Pods & Delegation:</strong> Role-based access control for Primary Administrators, Technical Recruiters, and Hiring Managers.</li>
                  <li><strong>AI Candidate Intelligence:</strong> Resume parsing, smart keyword evaluation, skill scoring, and automated candidate ranking.</li>
                  <li><strong>Candidate Career Portals:</strong> Candidate profile curation, one-click job applications, interview scheduling, and application tracking.</li>
                </ul>
                <p>
                  Uptrix acts solely as a technological intermediary connecting employers and prospective candidates. Uptrix is not an employment agency or employer of record, and makes no representations regarding the suitability, qualifications, or legal authorization of any candidate.
                </p>
              </div>
            </section>

            {/* 3. User Accounts & Responsibilities */}
            <section id="user-accounts" className="scroll-mt-24 rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-2xs">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">3. User Accounts & Responsibilities</h2>
                  <p className="text-xs text-slate-500">Security of credentials, staff invitations, and authentic profile representation</p>
                </div>
              </div>

              <div className="prose prose-slate prose-sm max-w-none text-slate-600 space-y-4 leading-relaxed text-[13.5px]">
                <p>
                  To access key platform capabilities, you must register for an account using accurate, current, and complete information. You are solely responsible for safeguarding the credentials associated with your account:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                    <span className="font-bold text-slate-900 block mb-1">Company Accounts</span>
                    <span>Primary administrators are responsible for actions taken by invited staff members, recruiters, and managers. Staff invitations must only be sent to authorized company personnel.</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                    <span className="font-bold text-slate-900 block mb-1">Candidate Accounts</span>
                    <span>Candidates must provide authentic academic credentials, genuine work history, and current contact details. Misrepresenting identity or qualifications is strictly prohibited.</span>
                  </div>
                </div>
                <p>
                  You agree to immediately notify Uptrix at <a href="mailto:security@intentpeople.com" className="text-indigo-600 hover:underline">security@intentpeople.com</a> of any unauthorized access or breach of security. Uptrix shall not be liable for any losses caused by unauthorized use of your account.
                </p>
              </div>
            </section>

            {/* 4. Subscriptions, Fees & Billing */}
            <section id="subscriptions-billing" className="scroll-mt-24 rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-2xs">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">4. Subscriptions, Fees & Billing</h2>
                  <p className="text-xs text-slate-500">Tier limits, Razorpay payments, taxes, and dynamic plan upgrades</p>
                </div>
              </div>

              <div className="prose prose-slate prose-sm max-w-none text-slate-600 space-y-4 leading-relaxed text-[13.5px]">
                <p>
                  Certain platform tiers and enterprise features require a paid subscription. All pricing, tier limits (such as active job posting caps, staff seat quotas, and candidate view thresholds), and billing validity durations are clearly displayed prior to purchase.
                </p>
                <ul className="list-disc pl-5 space-y-2 text-slate-600">
                  <li><strong>Currency & Taxes:</strong> Unless expressly stated otherwise, all prices are denominated in Indian Rupees (INR) and are exclusive of applicable GST or statutory levies.</li>
                  <li><strong>Payment Processing:</strong> Transactions are securely processed through authorized third-party gateways including Razorpay. Uptrix does not store unencrypted credit card or debit card numbers on its servers.</li>
                  <li><strong>Tier Limits Enforcement:</strong> Exceeding plan quotas (e.g. attempting to post jobs beyond your plan cap or add excess staff seats) will require an upgrade to an expanded subscription tier.</li>
                  <li><strong>Dynamic Superadmin Overrides:</strong> Custom contract arrangements or enterprise terms provisioned by an Uptrix Administrator shall govern over standard self-serve tiers.</li>
                </ul>
              </div>
            </section>

            {/* 5. Cancellation & Refund Policy */}
            <section id="cancellation-refunds" className="scroll-mt-24 rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-2xs">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">5. Cancellation & Refund Policy</h2>
                  <p className="text-xs text-slate-500">Subscription validity, non-refundable services, and billing disputes</p>
                </div>
              </div>

              <div className="prose prose-slate prose-sm max-w-none text-slate-600 space-y-4 leading-relaxed text-[13.5px]">
                <p>
                  Due to the immediate provisioning of digital recruitment infrastructure, candidate database search access, and AI compute capacity upon payment verification:
                </p>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs text-slate-700">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span><strong>Pre-paid Plans:</strong> All pre-paid subscription fees (including Standard 45-day and Growth 30-day plans) are non-refundable once payment is completed and active access is granted.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span><strong>Technical Failures:</strong> In the event of a verified double payment or gateway failure where a plan was charged but not activated, Uptrix will process a refund to the original payment method within 5-7 business days.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span><strong>Dispute Resolution:</strong> If you believe an erroneous charge has occurred, contact <a href="mailto:billing@intentpeople.com" className="text-indigo-600 font-semibold hover:underline">billing@intentpeople.com</a> within 14 days of the transaction date.</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 6. Intellectual Property & Content Rights */}
            <section id="ip-content" className="scroll-mt-24 rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-2xs">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">6. Intellectual Property & Content Rights</h2>
                  <p className="text-xs text-slate-500">Ownership of software, algorithms, trademarks, and user-submitted resumes</p>
                </div>
              </div>

              <div className="prose prose-slate prose-sm max-w-none text-slate-600 space-y-4 leading-relaxed text-[13.5px]">
                <p>
                  All proprietary rights in the Platform—including but not limited to source code, algorithms, user interface designs, logos, graphics, and documentation—are the exclusive intellectual property of <strong>Uptrix Technologies Inc.</strong> and its licensors.
                </p>
                <p>
                  <strong>User Content License:</strong> By uploading job descriptions, company logos, candidate resumes, or portfolio materials, you grant Uptrix a limited, worldwide, non-exclusive license to host, display, and analyze such content solely for the purpose of operating the hiring platform and facilitating applicant evaluations.
                </p>
              </div>
            </section>

            {/* 7. AI Matching & Algorithm Disclaimers */}
            <section id="ai-matching" className="scroll-mt-24 rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-2xs">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">7. AI Matching & Algorithm Disclaimers</h2>
                  <p className="text-xs text-slate-500">Automated candidate matching, scoring accuracy, and final hiring discretion</p>
                </div>
              </div>

              <div className="prose prose-slate prose-sm max-w-none text-slate-600 space-y-4 leading-relaxed text-[13.5px]">
                <p>
                  Uptrix utilizes proprietary artificial intelligence and machine learning models to assist recruiters with resume parsing, candidate scoring, and initial alignment evaluations.
                </p>
                <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200/70 text-indigo-950 text-xs space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Human-in-the-Loop Requirement</span>
                  </div>
                  <p className="text-slate-600 leading-normal">
                    AI match scores and automated rankings are advisory metrics provided to streamline candidate shortlisting. Uptrix does not make unilateral employment determinations. All final hiring, rejection, interviewing, and compensation decisions remain within the sole discretion and judgment of the employer.
                  </p>
                </div>
              </div>
            </section>

            {/* 8. Acceptable Use & Prohibitions */}
            <section id="acceptable-use" className="scroll-mt-24 rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-2xs">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">8. Acceptable Use & Prohibitions</h2>
                  <p className="text-xs text-slate-500">Strictly prohibited activities, scraping, and platform safeguards</p>
                </div>
              </div>

              <div className="prose prose-slate prose-sm max-w-none text-slate-600 space-y-3 leading-relaxed text-[13.5px]">
                <p>When using the Uptrix platform, you expressly agree not to:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                  <li>Post fraudulent, deceptive, or non-existent job openings or charge candidates application fees.</li>
                  <li>Harvest, scrape, or extract candidate contact information or resumes using automated bots, crawlers, or scrapers without express written authorization.</li>
                  <li>Upload viruses, malware, or destructive code intended to damage or intercept platform infrastructure.</li>
                  <li>Reverse engineer, decompile, or disassemble any part of the Uptrix source code or proprietary matching algorithms.</li>
                  <li>Engage in discriminatory recruitment practices violating applicable equal employment opportunity laws.</li>
                </ul>
              </div>
            </section>

            {/* 9. Limitation of Liability & Disclaimers */}
            <section id="liability-warranties" className="scroll-mt-24 rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-2xs">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">9. Limitation of Liability & Disclaimers</h2>
                  <p className="text-xs text-slate-500">Platform provided "as is" and liability monetary caps</p>
                </div>
              </div>

              <div className="prose prose-slate prose-sm max-w-none text-slate-600 space-y-4 leading-relaxed text-[13.5px]">
                <p>
                  THE PLATFORM IS PROVIDED ON AN “AS IS” AND “AS AVAILABLE” BASIS WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR UNINTERRUPTED AVAILABILITY.
                </p>
                <p>
                  TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL UPTRIX TECHNOLOGIES INC., ITS OFFICERS, DIRECTORS, OR EMPLOYEES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF OR INABILITY TO USE THE PLATFORM.
                </p>
                <p>
                  OUR AGGREGATE TOTAL LIABILITY FOR ANY CLAIM ARISING OUT OF THESE TERMS SHALL NOT EXCEED THE TOTAL AMOUNT PAID BY YOU TO UPTRIX IN THE THREE (3) MONTHS IMMEDIATELY PRECEDING THE CLAIM.
                </p>
              </div>
            </section>

            {/* 10. Governing Law & Dispute Resolution */}
            <section id="disputes-law" className="scroll-mt-24 rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-2xs">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">10. Governing Law & Dispute Resolution</h2>
                  <p className="text-xs text-slate-500">Applicable legal jurisdiction, binding arbitration, and venue</p>
                </div>
              </div>

              <div className="prose prose-slate prose-sm max-w-none text-slate-600 space-y-4 leading-relaxed text-[13.5px]">
                <p>
                  These Terms shall be governed by and construed in accordance with the substantive laws of India, without giving effect to any principles of conflicts of law.
                </p>
                <p>
                  Any dispute, controversy, or claim arising out of or relating to this Agreement shall be resolved through good-faith negotiation. If unresolved within thirty (30) days, such dispute shall be subject to the exclusive jurisdiction of the competent courts situated in Hyderabad, Telangana, India.
                </p>
              </div>
            </section>

            {/* 11. Contact & Grievance Officer */}
            <section id="contact-grievance" className="scroll-mt-24 rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-2xs">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">11. Contact & Grievance Officer</h2>
                  <p className="text-xs text-slate-500">Designated officer for legal queries and official notices</p>
                </div>
              </div>

              <div className="prose prose-slate prose-sm max-w-none text-slate-600 space-y-4 leading-relaxed text-[13.5px]">
                <p>
                  In accordance with the Information Technology Act and applicable digital personal data rules, the contact information for our designated Grievance & Legal Officer is:
                </p>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5 text-slate-700">
                  <p><strong>Designation:</strong> Legal Officer & Data Grievance Cell</p>
                  <p><strong>Organization:</strong> Uptrix Technologies Inc. / IntentPeople Portal</p>
                  <p><strong>Email:</strong> <a href="mailto:legal@intentpeople.com" className="text-indigo-600 hover:underline">legal@intentpeople.com</a></p>
                  <p><strong>Address:</strong> Financial District, Gachibowli, Hyderabad, Telangana 500032, India</p>
                  <p><strong>Response SLA:</strong> Inquiries are addressed within 48 business hours.</p>
                </div>
              </div>
            </section>

            {/* Reciprocal Banner to Privacy Policy */}
            <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded-md">
                  Privacy Compliance
                </span>
                <h3 className="text-lg font-bold text-white mt-2">
                  Looking for how we handle candidate & recruiter data?
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  Review our complete Privacy Policy detailing automated AI resume parsing, candidate dossier encryption, and data retention standards.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenPrivacy}
                className="px-5 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition-colors shadow-sm shrink-0 cursor-pointer"
              >
                Read Privacy Policy →
              </button>
            </div>

          </main>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200/80 bg-white py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2025 Uptrix Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <button onClick={onBack} className="hover:text-indigo-600 transition">Home</button>
            <button onClick={onOpenPrivacy} className="hover:text-indigo-600 transition">Privacy Policy</button>
            <a href="mailto:support@intentpeople.com" className="hover:text-indigo-600 transition">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
