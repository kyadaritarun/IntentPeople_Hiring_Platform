import React, { useState } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  Eye,
  Database,
  UserCheck,
  Key,
  FileLock2,
  Mail,
  Lock,
  Printer,
  Copy,
  Check,
  ChevronRight,
  Sparkles,
  Server,
  FileText,
  AlertCircle
} from 'lucide-react';

export default function PrivacyPolicy({ onBack, onOpenTerms, onNavigateToAuth }) {
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', title: '1. Privacy Commitment & Scope', icon: ShieldCheck },
    { id: 'data-collected', title: '2. Information We Collect', icon: Database },
    { id: 'collection-methods', title: '3. How Data is Collected', icon: UserCheck },
    { id: 'purposes-processing', title: '4. Purpose & Legal Basis', icon: Eye },
    { id: 'ai-ethics', title: '5. AI Processing & Algorithm Transparency', icon: Sparkles },
    { id: 'data-sharing', title: '6. Third-Party Sharing & Gateways', icon: Server },
    { id: 'security-measures', title: '7. Data Security & Encryption', icon: Key },
    { id: 'retention-deletion', title: '8. Data Retention & Erasure', icon: FileLock2 },
    { id: 'user-rights', title: '9. Your Rights (DPDP & GDPR)', icon: Lock },
    { id: 'cookies-tracking', title: '10. Cookies & Tracking Policy', icon: FileText },
    { id: 'grievance-contact', title: '11. Grievance Officer & Contact', icon: Mail },
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
              <span className="hidden sm:inline-block text-[11px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Privacy
              </span>
            </div>
          </div>

          {/* Quick Legal Switcher & CTA */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/60 text-xs font-semibold">
              <button
                type="button"
                onClick={onOpenTerms}
                className="px-3 py-1 rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Terms of Service
              </button>
              <span className="px-3 py-1 rounded-lg bg-white text-emerald-700 shadow-2xs font-bold">
                Privacy Policy
              </span>
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
      <div className="relative overflow-hidden bg-gradient-to-b from-emerald-50/60 via-white to-transparent border-b border-slate-200/60 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-emerald-800 bg-emerald-100/70 border border-emerald-200/70 mb-4">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>DPDP & GDPR Compliant • Version 3.1</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Privacy Policy
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
              We respect your privacy and are committed to protecting the personal data of our candidates, recruiters, and partner organizations with enterprise-grade security.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Last Revised: October 2025</span>
              <span>•</span>
              <span>Covers Candidate Profiles, Resumes & Recruiter Data</span>
              <span>•</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1 text-slate-600 hover:text-emerald-700 transition"
                  title="Print this document"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1 text-slate-600 hover:text-emerald-700 transition"
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
                  Privacy Sections
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
                            ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/80 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span className="truncate">{sec.title}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Data Rights Card */}
              <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white p-5 shadow-sm">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <FileLock2 className="w-4 h-4 text-emerald-200" />
                  <span>Exercise Your Data Rights</span>
                </h4>
                <p className="mt-2 text-xs text-emerald-100 leading-relaxed">
                  You can request a complete copy of your candidate dossier, correct your profile data, or request permanent erasure at any time.
                </p>
                <a
                  href="mailto:privacy@intentpeople.com"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-950 bg-white hover:bg-emerald-50 px-3.5 py-1.5 rounded-lg shadow-2xs transition"
                >
                  <span>Request Data Export / Deletion</span>
                  <Mail className="w-3 h-3" />
                </a>
              </div>
            </div>
          </aside>

          {/* Right Column: Exhaustive Privacy Clauses */}
          <main className="lg:col-span-8 space-y-12">

            {/* 1. Privacy Commitment & Scope */}
            <section id="overview" className="scroll-mt-24 rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-2xs">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">1. Privacy Commitment & Scope</h2>
                  <p className="text-xs text-slate-500">Core privacy commitments under international and national privacy frameworks</p>
                </div>
              </div>

              <div className="prose prose-slate prose-sm max-w-none text-slate-600 space-y-4 leading-relaxed text-[13.5px]">
                <p>
                  <strong>Uptrix Technologies Inc.</strong> (“Uptrix”, “We”, “Our”, or “Us”) operates the modern digital talent pipeline, AI matching engine, and hiring portal accessible at intentpeople.com and associated domains. This Privacy Policy describes how we collect, store, process, and safeguard your personal information when you use our recruitment portal as a job candidate, hiring manager, recruiter, or platform administrator.
                </p>
                <p>
                  We are committed to operating in strict compliance with the <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong> of India, the <strong>General Data Protection Regulation (GDPR)</strong>, and relevant international data privacy laws.
                </p>
              </div>
            </section>

            {/* 2. Information We Collect */}
            <section id="data-collected" className="scroll-mt-24 rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-2xs">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">2. Information We Collect</h2>
                  <p className="text-xs text-slate-500">Candidate credentials, resume data, and corporate recruiter details</p>
                </div>
              </div>

              <div className="prose prose-slate prose-sm max-w-none text-slate-600 space-y-4 leading-relaxed text-[13.5px]">
                <p>We collect information necessary to deliver talent matching and recruitment tracking features:</p>
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                    <span className="font-bold text-slate-900 block mb-1 text-[13px]">A. Candidate Information</span>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600 mt-1">
                      <li><strong>Identity & Contact:</strong> Full name, verified email address, phone number, city, state, country, and optional profile photograph.</li>
                      <li><strong>Professional Dossier:</strong> Uploaded resumes (PDF, DOCX), employment history, academic records, certifications, portfolio links, and GitHub/LinkedIn URLs.</li>
                      <li><strong>Application Records:</strong> Jobs applied to, application status pipeline events, interview scheduling notes, and screening questionnaire answers.</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                    <span className="font-bold text-slate-900 block mb-1 text-[13px]">B. Employer & Recruiter Information</span>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600 mt-1">
                      <li><strong>Corporate Profile:</strong> Company name, registered domain, industry, business email, official contact numbers, corporate address, and branding assets.</li>
                      <li><strong>Staff Member Details:</strong> Names, work emails, phone numbers, and role assignments (Admin, Recruiter, Manager) for authorized staff seats.</li>
                      <li><strong>Billing & Invoicing:</strong> GSTIN/Tax ID, transaction audit records, and Razorpay payment order references. (Note: Raw credit card numbers are never stored on Uptrix servers).</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                    <span className="font-bold text-slate-900 block mb-1 text-[13px]">C. Technical & Telemetry Data</span>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600 mt-1">
                      <li>IP address, browser type, operating system, session tokens, audit access logs, and referrer URLs for security and fraud prevention.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. How Data is Collected */}
            <section id="collection-methods" className="scroll-mt-24 rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-2xs">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">3. How Data is Collected</h2>
                  <p className="text-xs text-slate-500">Direct registration, resume document parsing, and automated logs</p>
                </div>
              </div>

              <div className="prose prose-slate prose-sm max-w-none text-slate-600 space-y-3 leading-relaxed text-[13.5px]">
                <p>We collect information through the following transparent touchpoints:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                  <li><strong>Direct User Input:</strong> When you register an account, fill in your profile, apply for a job, post a requisition, or communicate via platform messaging.</li>
                  <li><strong>Automated Document Extraction:</strong> When candidates upload CV documents, our secure parsing pipeline extracts key structured data (skills, years of experience, job titles) to populate candidate cards.</li>
                  <li><strong>Recruiter Delegation:</strong> When an employer invites staff members to a hiring pod, their basic business contact details are provided by the administrator.</li>
                </ul>
              </div>
            </section>

            {/* 4. Purpose & Legal Basis */}
            <section id="purposes-processing" className="scroll-mt-24 rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-2xs">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">4. Purpose & Legal Basis</h2>
                  <p className="text-xs text-slate-500">Legitimate recruitment facilitation and user consent</p>
                </div>
              </div>

              <div className="prose prose-slate prose-sm max-w-none text-slate-600 space-y-3 leading-relaxed text-[13.5px]">
                <p>We process your personal data under the following legitimate legal bases:</p>
                <ul className="list-disc pl-5 space-y-2 text-slate-600">
                  <li><strong>Contractual Necessity:</strong> To provide you with platform services, authenticate your login, route applications to prospective employers, and enable hiring collaboration.</li>
                  <li><strong>Explicit Consent:</strong> For publishing candidate dossiers into employer candidate search pools and sending career advisory or job alert notifications.</li>
                  <li><strong>Legitimate Business Interests:</strong> For platform security monitoring, system optimization, anti-fraud auditing, and billing verification.</li>
                  <li><strong>Legal Obligation:</strong> For maintaining tax records, responding to lawful government subpoenas, and resolving billing disputes.</li>
                </ul>
              </div>
            </section>

            {/* 5. AI Processing & Algorithm Transparency */}
            <section id="ai-ethics" className="scroll-mt-24 rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-2xs">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">5. AI Processing & Algorithm Transparency</h2>
                  <p className="text-xs text-slate-500">Ethics, bias mitigation, and candidate score transparency</p>
                </div>
              </div>

              <div className="prose prose-slate prose-sm max-w-none text-slate-600 space-y-4 leading-relaxed text-[13.5px]">
                <p>
                  Uptrix uses advanced machine learning models to assist employers in screening and prioritizing high-volume candidate pipelines.
                </p>
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/70 text-emerald-950 text-xs space-y-2">
                  <span className="font-bold block text-[13px]">Our Ethical AI Commitments:</span>
                  <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
                    <li><strong>No Solely Automated Rejection:</strong> Candidates are never auto-rejected by algorithms without human recruiter review. Match percentages are advisory indicators.</li>
                    <li><strong>Protected Characteristics Excluded:</strong> Our ranking algorithms do not factor in race, religion, gender, sexual orientation, disability, or marital status in candidate scoring.</li>
                    <li><strong>Data Privacy in AI Training:</strong> Your private resumes are never shared or sold to public LLM foundation model providers for general public training without explicit consent.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 6. Third-Party Sharing & Gateways */}
            <section id="data-sharing" className="scroll-mt-24 rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-2xs">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">6. Third-Party Sharing & Gateways</h2>
                  <p className="text-xs text-slate-500">Service providers, payment gateways, and confidentiality safeguards</p>
                </div>
              </div>

              <div className="prose prose-slate prose-sm max-w-none text-slate-600 space-y-3 leading-relaxed text-[13.5px]">
                <p>We do not sell personal data to advertisers. We share information only in the following controlled contexts:</p>
                <ul className="list-disc pl-5 space-y-2 text-slate-600">
                  <li><strong>With Verified Employers:</strong> When a candidate applies for an active job or enables public recruiter visibility, their application dossier is accessible to that employer's authorized staff.</li>
                  <li><strong>Payment Infrastructure (Razorpay):</strong> Transaction details are shared securely with PCI-DSS compliant payment gateways to process subscription fees.</li>
                  <li><strong>Cloud Hosting & Email Services:</strong> Encrypted hosting providers and transactional email providers (e.g. for sending verification OTP codes).</li>
                  <li><strong>Legal & Regulatory Authorities:</strong> Where compelled by valid court orders or statutory government requests.</li>
                </ul>
              </div>
            </section>

            {/* 7. Data Security & Encryption */}
            <section id="security-measures" className="scroll-mt-24 rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-2xs">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">7. Data Security & Encryption</h2>
                  <p className="text-xs text-slate-500">256-bit SSL encryption, database isolation, and role-based controls</p>
                </div>
              </div>

              <div className="prose prose-slate prose-sm max-w-none text-slate-600 space-y-3 leading-relaxed text-[13.5px]">
                <p>Uptrix implements robust physical, administrative, and technical safeguards:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                    <span className="font-bold text-slate-900 block mb-1">Encryption at Rest & in Transit</span>
                    <span>All web and API traffic is encrypted via TLS 1.3 / SSL. Stored documents and sensitive fields are protected with AES-256 encryption.</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                    <span className="font-bold text-slate-900 block mb-1">Multi-Tenant Isolation</span>
                    <span>Strict schema and company tenancy rules prevent unauthorized cross-organization data access or leakage between competing employers.</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 8. Data Retention & Erasure */}
            <section id="retention-deletion" className="scroll-mt-24 rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-2xs">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                  <FileLock2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">8. Data Retention & Erasure</h2>
                  <p className="text-xs text-slate-500">Account lifecycle, resume lifecycle, and permanent deletion</p>
                </div>
              </div>

              <div className="prose prose-slate prose-sm max-w-none text-slate-600 space-y-3 leading-relaxed text-[13.5px]">
                <p>
                  We retain candidate resumes and application histories for as long as your account remains active or as needed to facilitate employment opportunities.
                </p>
                <p>
                  If you choose to delete your account, your personal profile, resume documents, and direct message history will be permanently deleted from our active databases within thirty (30) days, retaining only anonymized telemetry or statutory billing audit logs as required by applicable tax law.
                </p>
              </div>
            </section>

            {/* 9. Your Rights (DPDP & GDPR) */}
            <section id="user-rights" className="scroll-mt-24 rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-2xs">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">9. Your Rights (DPDP & GDPR)</h2>
                  <p className="text-xs text-slate-500">Right to access, correct, port, or erase your information</p>
                </div>
              </div>

              <div className="prose prose-slate prose-sm max-w-none text-slate-600 space-y-3 leading-relaxed text-[13.5px]">
                <p>Regardless of your geographic location, Uptrix extends the following fundamental privacy rights:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                  <li><strong>Right to Access:</strong> You may request a machine-readable copy of the personal information we hold about you.</li>
                  <li><strong>Right to Rectification:</strong> You may update or correct inaccurate profile details at any time directly through your dashboard.</li>
                  <li><strong>Right to Erasure ("Right to be Forgotten"):</strong> You may request the permanent deletion of your profile and resumes.</li>
                  <li><strong>Right to Withdraw Consent:</strong> You may withdraw recruitment consent by deactivating your candidate visibility or deleting your account.</li>
                </ul>
              </div>
            </section>

            {/* 10. Cookies & Tracking Policy */}
            <section id="cookies-tracking" className="scroll-mt-24 rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-2xs">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">10. Cookies & Tracking Policy</h2>
                  <p className="text-xs text-slate-500">Essential session tokens, preference storage, and analytics</p>
                </div>
              </div>

              <div className="prose prose-slate prose-sm max-w-none text-slate-600 space-y-3 leading-relaxed text-[13.5px]">
                <p>
                  Uptrix uses essential session cookies, local storage items, and secure tokens strictly necessary to maintain authenticated sessions, secure API communications, and remember your interface preferences (e.g. sidebar state). We do not use third-party invasive ad-retargeting tracking pixels.
                </p>
              </div>
            </section>

            {/* 11. Grievance Officer & Contact */}
            <section id="grievance-contact" className="scroll-mt-24 rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-2xs">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">11. Grievance Officer & Contact</h2>
                  <p className="text-xs text-slate-500">Official contact point for data protection inquiries</p>
                </div>
              </div>

              <div className="prose prose-slate prose-sm max-w-none text-slate-600 space-y-4 leading-relaxed text-[13.5px]">
                <p>
                  To exercise your data protection rights, request account erasure, or file a privacy inquiry, please contact our designated Data Protection & Grievance Officer:
                </p>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5 text-slate-700">
                  <p><strong>Officer:</strong> Data Protection & Compliance Officer</p>
                  <p><strong>Company:</strong> Uptrix Technologies Inc. / IntentPeople</p>
                  <p><strong>Privacy Email:</strong> <a href="mailto:privacy@intentpeople.com" className="text-emerald-700 font-semibold hover:underline">privacy@intentpeople.com</a></p>
                  <p><strong>Corporate Address:</strong> Financial District, Gachibowli, Hyderabad, Telangana 500032, India</p>
                  <p><strong>Response Time:</strong> Written requests are acknowledged within 24-48 hours.</p>
                </div>
              </div>
            </section>

            {/* Reciprocal Banner to Terms */}
            <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md">
                  Terms of Service
                </span>
                <h3 className="text-lg font-bold text-white mt-2">
                  Need to review billing rules or employer obligations?
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  Check our Terms & Conditions for subscription plans, job posting rules, candidate rights, and platform terms.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenTerms}
                className="px-5 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition-colors shadow-sm shrink-0 cursor-pointer"
              >
                Read Terms of Service →
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
            <button onClick={onBack} className="hover:text-emerald-700 transition">Home</button>
            <button onClick={onOpenTerms} className="hover:text-emerald-700 transition">Terms of Service</button>
            <a href="mailto:support@intentpeople.com" className="hover:text-emerald-700 transition">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
