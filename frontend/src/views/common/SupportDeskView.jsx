import React, { useState, useEffect } from 'react';
import {
  HelpCircle, Send, CheckCircle2, X, Clock, ShieldCheck,
  MessageSquare, FileText, Phone, Mail, Sparkles, AlertCircle,
  ChevronRight, RefreshCw, Loader2, ArrowUpRight, Zap, Search,
  ExternalLink, Building2, User
} from 'lucide-react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function SupportDeskView({ setActiveTab }) {
  const { user } = useAuth();
  const [activeTab, setActiveTabLocal] = useState('create'); // 'create', 'history', 'faq'
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Form State
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Company Verification & KYC');
  const [priority, setPriority] = useState('Standard');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Search in FAQs
  const [faqSearch, setFaqSearch] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const data = await api.getSupportTickets();
      setTickets(data || []);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setSubmitting(true);
    try {
      const payload = {
        subject: `[${priority}] ${subject.trim()}`,
        category,
        message: message.trim()
      };
      await api.createSupportTicket(payload);
      triggerToast('✨ Support ticket submitted successfully! A concierge will respond shortly.');
      setSubject('');
      setMessage('');
      setPriority('Standard');
      await fetchTickets();
      setActiveTabLocal('history');
    } catch (err) {
      triggerToast(err.message || 'Failed to submit support request');
    } finally {
      setSubmitting(false);
    }
  };

  const openTicketsCount = tickets.filter(t => (t.status || 'OPEN').toUpperCase() === 'OPEN').length;

  const faqs = [
    {
      q: 'How long does Organization & KYC Verification take?',
      a: 'All submitted business PAN, GSTIN, and incorporation certificates are reviewed within 2 to 4 business hours by our verified compliance desk.',
      category: 'KYC & Verification'
    },
    {
      q: 'How are Google Meet interview links generated?',
      a: 'When you create or reschedule an interview, an encrypted Google Meet room URL is automatically provisioned and linked to candidate calendars.',
      category: 'Interviews'
    },
    {
      q: 'Where are Staff KYC documents and resumes stored?',
      a: 'All staff proofs and candidate resumes stream directly to encrypted AWS S3 buckets (ap-south-1) with signed temporal URLs for secure access.',
      category: 'Cloud & Security'
    },
    {
      q: 'Can I post unlimited job requisitions?',
      a: 'Verified employers can publish active requisitions, manage candidate pipelines, and review ATS match percentages without monthly caps.',
      category: 'Job Postings'
    }
  ];

  const filteredFaqs = faqs.filter(f => 
    f.q.toLowerCase().includes(faqSearch.toLowerCase()) || 
    f.a.toLowerCase().includes(faqSearch.toLowerCase()) ||
    f.category.toLowerCase().includes(faqSearch.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 max-w-10xl mx-auto space-y-6 select-text text-slate-800">

      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-teal-50 text-[#00a884] flex items-center justify-center font-bold">
              <HelpCircle className="w-4 h-4" />
            </span>
            Uptrix Support & Concierge Desk
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Direct portal assistance, KYC verification inquiries, technical platform tickets, and enterprise SLA management.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTabLocal('create')}
            className="px-4 py-2 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer border-none shadow-xs flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Create New Ticket</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs font-medium flex items-center justify-between shadow-lg animate-in fade-in">
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white border-none bg-transparent cursor-pointer ml-4"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Quick Metrics Bar ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Ticket Pipeline
          </span>
          <div className="text-xl font-black text-slate-900 flex items-center justify-between">
            <span>{openTicketsCount} Active</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <span className="text-[0.65rem] text-slate-400 mt-1 block">
            {tickets.length} total logged requests
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[0.68rem] font-bold uppercase tracking-wider text-amber-600 block mb-1">
            Average Response SLA
          </span>
          <div className="text-xl font-black text-amber-700 flex items-center justify-between">
            <span>&lt; 2 Hours</span>
            <Clock className="w-5 h-5 text-amber-500 shrink-0" />
          </div>
          <span className="text-[0.65rem] text-slate-400 mt-1 block">
            Priority ticket turnaround
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[0.68rem] font-bold uppercase tracking-wider text-teal-600 block mb-1">
            Dedicated Concierge
          </span>
          <div className="text-xl font-black text-[#00a884] flex items-center justify-between">
            <span>Online & Ready</span>
            <ShieldCheck className="w-5 h-5 text-[#00a884]" />
          </div>
          <span className="text-[0.65rem] text-slate-400 mt-1 block">
            Mon - Sat: 9:00 AM - 8:00 PM IST
          </span>
        </div>
      </div>

      {/* ── In-Page Segmented Tab Filter ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="inline-flex p-0.5 bg-slate-100 rounded-xl border border-slate-200/60 overflow-x-auto no-scrollbar">
          {[
            { id: 'create', label: 'Raise Ticket', icon: Send },
            { id: 'history', label: 'My Tickets', count: tickets.length, icon: FileText },
            { id: 'faq', label: 'Help Center & FAQs', icon: Sparkles }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTabLocal(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'bg-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-md text-[0.65rem] font-bold ${
                    activeTab === tab.id ? 'bg-slate-100 text-slate-900' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="text-xs text-slate-500 font-medium px-2 flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Mail className="w-3.5 h-3.5 text-slate-400" /> support@uptrix.in
          </span>
          <span className="text-slate-300">·</span>
          <span className="flex items-center gap-1">
            <Phone className="w-3.5 h-3.5 text-slate-400" /> +91 98765 43210
          </span>
        </div>
      </div>

      {/* ── TAB 1: RAISE A TICKET ── */}
      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Submit Support Inquiries</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Our support desk assigns high-priority tickets to dedicated account engineers.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:border-black outline-none cursor-pointer shadow-2xs"
                  >
                    <option value="Company Verification & KYC">Company Verification & KYC</option>
                    <option value="Job Postings & Requisition Management">Job Postings & Requisitions</option>
                    <option value="Staff Member KYC & Documents">Staff Member KYC & Documents</option>
                    <option value="Candidate Interview & Google Meet">Candidate Interviews & Google Meet</option>
                    <option value="Technical Platform / Bug Report">Technical Platform / Bug Report</option>
                    <option value="Billing & Invoicing">Billing & Account Plans</option>
                    <option value="General Platform Inquiry">General Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Priority Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Standard', 'High', 'Urgent'].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setPriority(lvl)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          priority === lvl
                            ? lvl === 'Urgent'
                              ? 'border-red-500 bg-red-50 text-red-700'
                              : lvl === 'High'
                              ? 'border-amber-500 bg-amber-50 text-amber-700'
                              : 'border-black bg-black text-white'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Subject Line *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Expedited review for Company Incorporation Certificate"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Detailed Explanation & Context *
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Provide all relevant details, document names, candidate IDs, or error messages..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black focus:ring-1 focus:ring-black outline-none bg-slate-50/50 resize-y leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[0.68rem] text-slate-400">
                  Logged as: <strong className="text-slate-700">{user?.email || 'Authenticated User'}</strong> ({user?.role})
                </span>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-bold transition-all border-none cursor-pointer shadow-xs flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Ticket</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Support Concierge Card */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#00a884] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Uptrix Help Guarantee</h3>
                  <p className="text-[0.68rem] text-slate-400">Enterprise support SLA</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Tickets submitted during Indian business hours (9:00 AM - 8:00 PM IST) receive an initial engineer response within 120 minutes.
              </p>

              <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-semibold text-slate-400">Escalation Email</span>
                  <span className="font-bold text-slate-800">escalations@uptrix.in</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-semibold text-slate-400">WhatsApp Concierge</span>
                  <span className="font-bold text-slate-800">+91 98765 43210</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-semibold text-slate-400">Average Satisfaction</span>
                  <span className="font-bold text-emerald-600">99.4% CSAT</span>
                </div>
              </div>
            </div>

            <div className="bg-teal-50/70 border border-teal-200/70 rounded-2xl p-5 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-[#00a884] font-bold text-xs">
                <Sparkles className="w-4 h-4" />
                <span>Instant Self-Help</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Need immediate guidance regarding KYC document guidelines or AWS S3 uploads? Check our verified Knowledge Base.
              </p>
              <button
                type="button"
                onClick={() => setActiveTabLocal('faq')}
                className="text-xs font-bold text-[#00a884] hover:underline cursor-pointer border-none bg-transparent p-0 inline-flex items-center gap-1 mt-1"
              >
                Browse Knowledge Articles <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: TICKET HISTORY ── */}
      {activeTab === 'history' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
          <div className="p-5 border-b border-slate-200/80 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Your Support Tickets</h2>
              <p className="text-xs text-slate-500 mt-0.5">Track resolution status and communications from Uptrix support</p>
            </div>

            <button
              type="button"
              onClick={fetchTickets}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer bg-white shadow-2xs flex items-center gap-1.5 text-xs font-bold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingTickets ? 'animate-spin text-[#00a884]' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {loadingTickets ? (
            <div className="p-12 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#00a884]" />
              <p className="text-xs font-bold">Loading support tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#00a884] flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-800">No active support tickets</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Everything looks good! If you ever face any questions or need KYC help, raise a new ticket anytime.
              </p>
              <button
                type="button"
                onClick={() => setActiveTabLocal('create')}
                className="mt-4 px-4 py-2 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-bold border-none cursor-pointer shadow-xs"
              >
                Create a Ticket
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[0.68rem] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-5">Ticket ID</th>
                    <th className="py-3 px-5">Subject & Preview</th>
                    <th className="py-3 px-5">Category</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5">Date Created</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {tickets.map((t) => {
                    const isResolved = (t.status || '').toUpperCase() === 'RESOLVED';
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-5">
                          <span className="font-mono font-bold text-slate-900">#UPT-{t.id}</span>
                        </td>
                        <td className="py-4 px-5 max-w-xs">
                          <div className="font-bold text-slate-900 truncate">{t.subject}</div>
                          <div className="text-[0.68rem] text-slate-400 truncate">{t.message}</div>
                        </td>
                        <td className="py-4 px-5">
                          <span className="px-2.5 py-1 rounded-lg text-[0.65rem] font-bold bg-slate-100 text-slate-700">
                            {t.category}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[0.68rem] font-extrabold border ${
                            isResolved
                              ? 'bg-slate-100 text-slate-700 border-slate-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isResolved ? 'bg-slate-400' : 'bg-emerald-500 animate-pulse'}`} />
                            {t.status || 'OPEN'}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-slate-500 text-[0.72rem]">
                          {t.created_at ? new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                        </td>
                        <td className="py-4 px-5 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedTicket(t)}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer bg-white"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: FAQS & KNOWLEDGE ── */}
      {activeTab === 'faq' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs">
            <div className="max-w-md">
              <h2 className="text-base font-bold text-slate-900 mb-1">Frequently Asked Questions</h2>
              <p className="text-xs text-slate-500 mb-4">
                Instant answers to common portal questions, KYC verification guidelines, and scheduling.
              </p>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search articles & FAQs..."
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-black outline-none bg-slate-50/50"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFaqs.map((faq, idx) => (
              <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-teal-50 text-[#00a884] text-[0.65rem] font-bold">
                    {faq.category}
                  </span>
                </div>
                <h3 className="text-xs font-black text-slate-900 leading-snug">{faq.q}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TICKET DETAILS MODAL ── */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in select-text">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 text-slate-800 relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-sm text-slate-900">#UPT-{selectedTicket.id}</span>
                <span className="px-2.5 py-0.5 rounded-full text-[0.68rem] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                  {selectedTicket.status || 'OPEN'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <span className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider block">Category</span>
              <span className="text-xs font-bold text-slate-800">{selectedTicket.category}</span>
            </div>

            <div>
              <span className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider block">Subject</span>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5">{selectedTicket.subject}</h3>
            </div>

            <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4">
              <span className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider block mb-1">Ticket Message</span>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedTicket.message}</p>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
              <span>Submitted: {selectedTicket.created_at ? new Date(selectedTicket.created_at).toLocaleString() : 'Recent'}</span>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-bold border-none cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
