import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Filter, Users, Briefcase, MapPin, Award, GraduationCap,
  Sparkles, CheckCircle2, Download, Printer, X, Eye, Phone, Mail,
  ExternalLink, FileText, ChevronDown, ChevronLeft, ChevronRight, Compass, ShieldCheck, Clock,
  Building2, ArrowRight, RefreshCw, Zap, Tag, Star, Trophy
} from 'lucide-react';
import { api } from '../../api';
import { MARKETING_SPECIALISATIONS, CUSTOMER_MODELS } from '../../utils/marketingTaxonomy';
import RecruiterMatchDossier from '../../components/RecruiterMatchDossier';

// Popular digital marketing skill suggestions for 1-click filtering
const POPULAR_SKILLS = [
  'SEO', 'Google Ads', 'Meta Ads', 'Performance Marketing', 'Social Media Marketing', 'Copywriting'
];

const EXPERIENCE_TIERS = [
  { id: 'all', label: 'Any Experience', min: null, max: null },
  { id: 'fresher', label: 'Fresher (0 - 1y)', min: 0, max: 1 },
  { id: 'junior', label: 'Junior (1 - 3y)', min: 1, max: 3 },
  { id: 'mid', label: 'Mid-Level (3 - 5y)', min: 3, max: 5 },
  { id: 'senior', label: 'Senior (5 - 8y)', min: 5, max: 8 },
  { id: 'lead', label: 'Lead & Director (8y+)', min: 8, max: null },
];

// Soft-tint badge styling matching UnifiedRoleDashboard, PostJob, and ManageJobs
const TINTS = {
  indigo: 'bg-[#5C59E8]/8 text-[#4845D2] ring-1 ring-inset ring-[#5C59E8]/15',
  orange: 'bg-[#FF7043]/8 text-[#E15A2C] ring-1 ring-inset ring-[#FF7043]/15',
  emerald: 'bg-[#00A884]/8 text-[#00846A] ring-1 ring-inset ring-[#00A884]/15',
  slate: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200/70',
  sky: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200/80',
  purple: 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200/80',
};

function Badge({ tone = 'slate', children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold tabular-nums whitespace-nowrap ${TINTS[tone] || TINTS.slate} ${className}`}
    >
      {children}
    </span>
  );
}

export default function CandidateSearchView({ setActiveTab }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  // Search & Filter state
  const [query, setQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [selectedExpTier, setSelectedExpTier] = useState('all');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedWorkMode, setSelectedWorkMode] = useState('all');
  const [selectedSpecialisation, setSelectedSpecialisation] = useState('ALL');
  const [selectedCustomerModel, setSelectedCustomerModel] = useState('ALL');
  const [onlyWithCaseStudies, setOnlyWithCaseStudies] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modal states
  const [selectedCandidateForPdf, setSelectedCandidateForPdf] = useState(null);
  const [selectedCandidateForDossier, setSelectedCandidateForDossier] = useState(null);

  // Initial candidate load
  const loadCandidates = async () => {
    setLoading(true);
    try {
      const results = await api.searchCandidates({ limit: 100 });
      setCandidates(results || []);
    } catch (err) {
      console.error('Failed to load candidate database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, []);

  // Execute Search
  const handleSearch = async () => {
    setSearching(true);
    try {
      const tier = EXPERIENCE_TIERS.find(t => t.id === selectedExpTier);
      const params = {
        q: query.trim() || undefined,
        skills: selectedSkills.length > 0 ? selectedSkills.join(',') : undefined,
        min_experience: tier && tier.min !== null ? tier.min : undefined,
        max_experience: tier && tier.max !== null ? tier.max : undefined,
        city: selectedCity.trim() || undefined,
        work_mode: selectedWorkMode !== 'all' ? selectedWorkMode : undefined,
        limit: 100,
      };

      const results = await api.searchCandidates(params);
      setCandidates(results || []);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setQuery('');
    setSelectedSkills([]);
    setCustomSkillInput('');
    setSelectedExpTier('all');
    setSelectedCity('');
    setSelectedWorkMode('all');
    setSelectedSpecialisation('ALL');
    setSelectedCustomerModel('ALL');
    setOnlyWithCaseStudies(false);
    setCurrentPage(1);
    loadCandidates();
  };

  // Filter candidates client-side based on marketing attributes
  const displayedCandidates = useMemo(() => {
    return candidates.filter(cand => {
      if (selectedSpecialisation !== 'ALL') {
        const specs = cand.specialisations_data || [];
        const matchesSpec = specs.some(s => s.id === selectedSpecialisation || s.name?.toLowerCase().includes(selectedSpecialisation.toLowerCase()))
          || (cand.title && cand.title.toLowerCase().includes(selectedSpecialisation.toLowerCase()))
          || (cand.skills && cand.skills.some(sk => sk.toLowerCase().includes(selectedSpecialisation.toLowerCase())));
        if (!matchesSpec) return false;
      }
      if (selectedCustomerModel !== 'ALL') {
        const rawM = cand.gtm_experience?.customer_model;
        const models = Array.isArray(rawM) ? rawM : (rawM ? [rawM] : []);
        const matchesModel = models.some(m => String(m).toLowerCase().includes(selectedCustomerModel.toLowerCase()))
          || (cand.summary && cand.summary.toLowerCase().includes(selectedCustomerModel.toLowerCase()));
        if (!matchesModel) return false;
      }
      if (onlyWithCaseStudies) {
        if (!cand.case_studies || cand.case_studies.length === 0) return false;
      }
      return true;
    });
  }, [candidates, selectedSpecialisation, selectedCustomerModel, onlyWithCaseStudies]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    query,
    selectedSkills,
    selectedExpTier,
    selectedCity,
    selectedWorkMode,
    selectedSpecialisation,
    selectedCustomerModel,
    onlyWithCaseStudies,
    pageSize
  ]);

  // Pagination calculations
  const totalPages = Math.ceil(displayedCandidates.length / pageSize) || 1;
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedCandidates = displayedCandidates.slice(startIndex, startIndex + pageSize);

  const getPageNumbers = (current, total) => {
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 3) {
      return [1, 2, 3, 4, '...', total];
    }
    if (current >= total - 2) {
      return [1, '...', total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  // Skill toggle
  const toggleSkill = (skill) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const handleAddCustomSkill = (e) => {
    e.preventDefault();
    const s = customSkillInput.trim();
    if (s && !selectedSkills.some(item => item.toLowerCase() === s.toLowerCase())) {
      setSelectedSkills(prev => [...prev, s]);
      setCustomSkillInput('');
    }
  };

  // ── Open Full Dossier PDF View / Print ──────────────────────────────
  const handlePrintCandidatePdf = (candidate) => {
    if (!candidate) return;
    const title = `${candidate.full_name || 'Candidate'}_Official_Profile.pdf`;

    const expHtml = (candidate.experience || []).map(exp => `
      <div style="margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px dashed #e2e8f0;">
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <strong style="font-size: 13px; color: #0f172a;">${exp.title || 'Role'}</strong>
          <span style="font-size: 11px; color: #64748b; font-weight: bold;">${exp.duration || ''}</span>
        </div>
        <div style="font-size: 12px; color: #00a884; font-weight: 600; margin-top: 2px;">
          ${exp.company || ''} ${exp.location ? '• ' + exp.location : ''} ${exp.employment_type ? '(' + exp.employment_type + ')' : ''}
        </div>
        ${exp.description ? `<p style="font-size: 11px; color: #4a4e55ff; margin-top: 4px; line-height: 1.5;">${exp.description}</p>` : ''}
        ${Array.isArray(exp.technologies) && exp.technologies.length > 0 ? `
          <div style="margin-top: 5px;">
            ${exp.technologies.map(t => `<span style="display: inline-block; background: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 4px; font-size: 9.5px; font-weight: bold; margin-right: 4px; margin-bottom: 4px;">${t}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    `).join('');

    const eduHtml = (candidate.education || []).map(edu => `
      <div style="margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between;">
          <strong style="font-size: 12px; color: #0f172a;">${edu.degree || 'Degree'}</strong>
          <span style="font-size: 11px; color: #64748b;">${edu.year || edu.duration || ''}</span>
        </div>
        <div style="font-size: 11px; color: #475569;">${edu.institution || ''} ${edu.grade ? '• ' + edu.grade : ''}</div>
        ${edu.description ? `<div style="font-size: 10.5px; color: #64748b; margin-top: 2px;">${edu.description}</div>` : ''}
      </div>
    `).join('');

    const certHtml = (candidate.certifications || []).map(cert => `
      <div style="margin-bottom: 8px; font-size: 11px;">
        <strong style="color: #0f172a;">${cert.name || ''}</strong>
        <span style="color: #64748b;"> — ${cert.issuer || ''} ${cert.year ? '(' + cert.year + ')' : ''}</span>
        ${cert.credential_id ? `<div style="font-size: 9.5px; color: #94a3b8;">ID: ${cert.credential_id}</div>` : ''}
      </div>
    `).join('');

    const pref = candidate.hiring_preferences || {};

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <meta charset="utf-8" />
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 20px; font-size: 12px; line-height: 1.4; }
          .header { border-bottom: 3px solid #00a884; padding-bottom: 14px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-start; }
          .brand { font-size: 10px; font-weight: 800; color: #00a884; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px; }
          .name { font-size: 22px; font-weight: 900; color: #0f172a; margin: 0; }
          .title { font-size: 13px; font-weight: 700; color: #00a884; margin-top: 2px; }
          .contact { font-size: 11px; color: #475569; margin-top: 6px; }
          .badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: bold; background: #e6fffa; color: #00a884; border: 1px solid #99f6e4; }
          .section-title { font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #334155; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px; margin-top: 18px; margin-bottom: 10px; }
          .skill-pill { display: inline-block; background: #f8fafc; border: 1px solid #cbd5e1; padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 600; margin-right: 4px; margin-bottom: 5px; }
          .pref-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 11px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">UPTRIX TALENT PLATFORM • OFFICIAL DOSSIER</div>
            <h1 class="name">${candidate.full_name || 'Candidate Profile'}</h1>
            <div class="title">${candidate.title || 'Professional'}</div>
            <div class="contact">
              ${candidate.email ? `<span>✉ ${candidate.email}</span> &nbsp;•&nbsp; ` : ''}
              ${candidate.phone ? `<span>✆ ${candidate.phone}</span> &nbsp;•&nbsp; ` : ''}
              ${candidate.city ? `<span>📍 ${candidate.city}${candidate.state ? ', ' + candidate.state : ''}</span>` : ''}
            </div>
          </div>
          <div style="text-align: right;">
            <span class="badge">VERIFIED CANDIDATE</span>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 6px;">Ref: UPC-${candidate.id || '001'}</div>
            <div style="font-size: 10px; color: #94a3b8;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
          </div>
        </div>

        ${candidate.summary ? `
          <div class="section-title">Professional Summary</div>
          <p style="font-size: 11.5px; color: #334155; line-height: 1.5; margin: 0 0 14px 0;">
            ${candidate.summary}
          </p>
        ` : ''}

        ${Array.isArray(candidate.skills) && candidate.skills.length > 0 ? `
          <div class="section-title">Core Skills & Technical Competencies</div>
          <div style="margin-bottom: 14px;">
            ${candidate.skills.map(s => `<span class="skill-pill">${s}</span>`).join('')}
            ${Array.isArray(candidate.expertise) ? candidate.expertise.map(e => `<span class="skill-pill" style="background: #e6fffa; border-color: #99f6e4; color: #00a884;">${e}</span>`).join('') : ''}
          </div>
        ` : ''}

        ${expHtml ? `
          <div class="section-title">Work Experience (${candidate.total_experience_years || '0'}+ Years Total)</div>
          ${expHtml}
        ` : ''}

        ${eduHtml ? `
          <div class="section-title">Education & Academic Background</div>
          ${eduHtml}
        ` : ''}

        ${certHtml ? `
          <div class="section-title">Certifications & Credentials</div>
          ${certHtml}
        ` : ''}

        <div class="section-title">Hiring & Placement Preferences</div>
        <div class="pref-grid">
          <div><strong>Preferred Work Mode:</strong> ${pref.work_mode || 'Flexible / Hybrid'}</div>
          <div><strong>Availability / Notice:</strong> ${pref.availability || 'Immediate to 30 days'}</div>
          <div><strong>Target Compensation:</strong> ${pref.desired_salary || 'Competitive / Open'}</div>
          <div><strong>Preferred Location:</strong> ${pref.preferred_location || candidate.city || 'India'}</div>
        </div>

        <div style="margin-top: 24px; padding-top: 10px; border-top: 1px solid #e2e8f0; font-size: 9.5px; color: #94a3b8; display: flex; justify-content: space-between;">
          <span>Confidential — Prepared exclusively for verified hiring partner review via Uptrix Hiring Portal</span>
          <span>Page 1 of 1</span>
        </div>
      </body>
      </html>
    `;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(html);
      printWin.document.close();
      setTimeout(() => {
        printWin.focus();
        printWin.print();
      }, 350);
    }
  };

  return (
    <div
      className="p-4 sm:p-7 max-w-7xl mx-auto space-y-6 bg-[#F7F8FB] min-h-full antialiased select-text text-slate-800"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
    >

      {/* ── 1. Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-[28px] font-semibold text-slate-900 leading-tight tracking-tight m-0">
              Candidate Search & Sourcing
            </h1>
            <Badge tone="slate">
              {candidates.length} Profiles
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1.5 m-0">
            Search verified candidates across skills, experience, and roles. View complete candidate dossiers in PDF format.
          </p>
        </div>

        <button
          type="button"
          onClick={loadCandidates}
          disabled={loading}
          className="p-2.5 rounded-xl border border-slate-200/80 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] self-start sm:self-auto flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#5C59E8]' : ''}`} />
          <span className="text-xs font-semibold">Refresh Pool</span>
        </button>
      </div>

      {/* ── 2. Search & Filter Command Panel ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] space-y-4">

        {/* Main Search Input & Sourcing Button */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="flex items-center gap-2 flex-1 bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 focus-within:border-[#5C59E8] focus-within:ring-2 focus-within:ring-[#5C59E8]/10 transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search candidates by title, keywords, name, or companies (e.g. 'Performance Marketer', 'Priya', 'Growth Lead')..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full bg-transparent border-none text-xs outline-none text-slate-800 placeholder:text-slate-400 font-medium"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleSearch}
            disabled={searching}
            className="px-6 py-2.5 rounded-lg bg-[#FF7043] hover:bg-[#E65B30] text-white text-xs font-semibold transition-all shadow-[0_1px_2px_rgba(255,112,67,0.3)] flex items-center justify-center gap-2 cursor-pointer border-none shrink-0"
          >
            <Sparkles className={`w-4 h-4 ${searching ? 'animate-spin' : ''}`} />
            <span>{searching ? 'Sourcing...' : 'Search Candidates'}</span>
          </button>

          {(query || selectedSkills.length > 0 || selectedExpTier !== 'all' || selectedCity || selectedWorkMode !== 'all') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200/80 transition-all cursor-pointer shadow-[0_1px_2px_rgba(15,23,42,0.04)] shrink-0"
            >
              Reset
            </button>
          )}
        </div>

        {/* Skills Tag Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Tag className="w-3 h-3 text-[#5C59E8]" />
              Filter by Skills & Expertise:
            </span>
            {selectedSkills.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedSkills([])}
                className="text-[11px] text-rose-600 font-semibold hover:underline border-none bg-transparent cursor-pointer p-0"
              >
                Clear all skills ({selectedSkills.length})
              </button>
            )}
          </div>

          {/* Selected Skills Chips */}
          {selectedSkills.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/70">
              <span className="text-xs font-semibold text-slate-700 mr-1">Active:</span>
              {selectedSkills.map(skill => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#5C59E8]/10 text-[#4845D2] ring-1 ring-inset ring-[#5C59E8]/20 text-xs font-semibold"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className="hover:text-rose-600 rounded-full p-0.5 border-none bg-transparent text-[#4845D2] cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Quick Skill Recommendations + Add Custom Skill */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {POPULAR_SKILLS.map(skill => {
              const isSelected = selectedSkills.includes(skill);
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${isSelected
                    ? 'bg-[#5C59E8]/10 text-[#4845D2] border-[#5C59E8]/30 shadow-[0_1px_2px_rgba(92,89,232,0.06)]'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/80'
                    }`}
                >
                  {isSelected ? '✓ ' : '+ '}{skill}
                </button>
              );
            })}

            {/* Custom Skill Input Form */}
            <form onSubmit={handleAddCustomSkill} className="inline-flex items-center gap-1">
              <input
                type="text"
                placeholder="Other skill..."
                value={customSkillInput}
                onChange={(e) => setCustomSkillInput(e.target.value)}
                className="w-24 px-2.5 py-1 rounded-lg border border-slate-200/90 text-xs font-medium text-slate-700 bg-white outline-none focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 shadow-[0_1px_2px_rgba(15,23,42,0.02)]"
              />
              <button
                type="submit"
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer border-none shadow-[0_1px_2px_rgba(15,23,42,0.08)]"
              >
                Add
              </button>
            </form>
          </div>
        </div>

        {/* Marketing Specialisation, Customer Model, Experience Tier, and Work Mode Filters */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Marketing Specialisation */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Marketing Specialisation:
            </label>
            <select
              value={selectedSpecialisation}
              onChange={(e) => setSelectedSpecialisation(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200/90 bg-white text-xs font-semibold text-slate-700 outline-none cursor-pointer shadow-2xs focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 transition-all"
            >
              <option value="ALL">All 14 Specialisations</option>
              {MARKETING_SPECIALISATIONS.map(spec => (
                <option key={spec.id} value={spec.title || spec.name}>
                  {spec.title || spec.name}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Model */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Customer / GTM Model:
            </label>
            <select
              value={selectedCustomerModel}
              onChange={(e) => setSelectedCustomerModel(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200/90 bg-white text-xs font-semibold text-slate-700 outline-none cursor-pointer shadow-2xs focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 transition-all"
            >
              <option value="ALL">All GTM Models</option>
              {CUSTOMER_MODELS.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>

          {/* Experience Tier */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Experience Level:
            </label>
            <select
              value={selectedExpTier}
              onChange={(e) => setSelectedExpTier(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200/90 bg-white text-xs font-semibold text-slate-700 outline-none cursor-pointer shadow-2xs focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 transition-all"
            >
              {EXPERIENCE_TIERS.map(tier => (
                <option key={tier.id} value={tier.id}>{tier.label}</option>
              ))}
            </select>
          </div>

          {/* Work Mode */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Work Mode Preference:
            </label>
            <select
              value={selectedWorkMode}
              onChange={(e) => setSelectedWorkMode(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200/90 bg-white text-xs font-semibold text-slate-700 outline-none cursor-pointer shadow-2xs focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 transition-all"
            >
              <option value="all">All Work Modes</option>
              <option value="remote">Remote Only</option>
              <option value="hybrid">Hybrid</option>
              <option value="on-site">On-site</option>
            </select>
          </div>
        </div>

        {/* Proof of Work Toggle Bar */}
        <div className="pt-2 flex items-center justify-between flex-wrap gap-2 text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 font-semibold">
            <input
              type="checkbox"
              checked={onlyWithCaseStudies}
              onChange={(e) => setOnlyWithCaseStudies(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 border-slate-300"
            />
            <span className="flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              Only show candidates with verified Campaign Case Studies (Proof of Work)
            </span>
          </label>
          <span className="text-slate-500 text-[11px] font-medium">
            Showing <strong className="text-slate-900">{displayedCandidates.length === 0 ? 0 : startIndex + 1}</strong> to <strong className="text-slate-900">{Math.min(startIndex + pageSize, displayedCandidates.length)}</strong> of <strong className="text-slate-900">{displayedCandidates.length}</strong> talent profiles
          </span>
        </div>
      </div>

      {/* ── 3. Candidate Results ── */}
      {loading ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-16 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)] space-y-3">
          <RefreshCw className="w-8 h-8 text-[#5C59E8] animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-semibold">Scanning candidate talent pool...</p>
        </div>
      ) : displayedCandidates.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-16 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)] space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#5C59E8]/10 text-[#4845D2] flex items-center justify-center mx-auto mb-2">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 m-0">No candidates match your criteria</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
            Try broadening your search query, adjusting specialisation or customer model filters to discover more candidates.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer border-none shadow-[0_1px_2px_rgba(15,23,42,0.1)] transition-colors mt-2"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedCandidates.map(candidate => {
              const expYears = candidate.total_experience_years || 0;
              const skills = candidate.skills || [];
              const latestExp = (candidate.experience && candidate.experience[0]) || null;
              const pref = candidate.hiring_preferences || {};
              const primarySpec = candidate.specialisations_data?.find(s => s.type === 'primary') || candidate.specialisations_data?.[0];
              const caseStudiesCount = candidate.case_studies?.length || 0;
              const rawCustomerModel = candidate.gtm_experience?.customer_model;
              const customerModels = Array.isArray(rawCustomerModel)
                ? rawCustomerModel
                : (rawCustomerModel ? [rawCustomerModel] : []);

              return (
                <div
                  key={candidate.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
                >
                  <div>
                    {/* Card Header: Avatar, Name, Experience, and # Number Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {candidate.avatar_url ? (
                          <img
                            src={candidate.avatar_url}
                            alt={candidate.full_name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-slate-100 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                            {(candidate.full_name || 'C').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                        <div className="font-semibold text-sm text-slate-900 truncate">
                          {candidate.full_name || 'Candidate'}
                        </div>
                        <div className="text-xs font-semibold text-[#5C59E8] truncate mt-0.5">
                          {candidate.title || 'Professional'}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span>{candidate.city || 'India'}{candidate.state ? `, ${candidate.state}` : ''}</span>
                        </div>
                      </div>
                    </div>

                    <Badge tone="slate" className="shrink-0">
                      <Clock className="w-3 h-3 text-slate-400 mr-1" />
                      <span>{expYears > 0 ? `${expYears}y exp` : 'Fresher'}</span>
                    </Badge>
                  </div>

                  {/* Primary Specialisation & Case Studies Badges */}
                  <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                    {primarySpec && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        ★ {primarySpec.name}
                      </span>
                    )}
                    {caseStudiesCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-amber-600" />
                        {caseStudiesCount} Case {caseStudiesCount === 1 ? 'Study' : 'Studies'}
                      </span>
                    )}
                    {customerModels.slice(0, 2).map((cm, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[9px] font-bold border border-blue-200">
                        {cm}
                      </span>
                    ))}
                  </div>

                  {/* Summary Snippet */}
                  {candidate.summary && (
                    <p className="text-xs text-slate-500 line-clamp-2 mt-3 font-normal leading-relaxed m-0">
                      {candidate.summary}
                    </p>
                  )}

                  {/* Latest Experience Teaser */}
                  {latestExp && (
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 text-xs">
                      <div className="font-semibold text-slate-800 truncate">
                        {latestExp.title}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {latestExp.company} • {latestExp.duration || 'Recent'}
                      </div>
                    </div>
                  )}

                  {/* Skills Chips */}
                  <div className="mt-3 flex items-center gap-1 flex-wrap">
                    {skills.slice(0, 4).map((sk, idx) => {
                      const isMatched = (candidate.matched_skills || []).some(m => m.toLowerCase() === sk.toLowerCase());
                      return (
                        <span
                          key={idx}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${isMatched
                            ? 'bg-[#5C59E8]/10 text-[#4845D2] ring-1 ring-inset ring-[#5C59E8]/20'
                            : 'bg-slate-100 text-slate-600'
                            }`}
                        >
                          {sk}
                        </span>
                      );
                    })}
                    {skills.length > 4 && (
                      <span className="text-[10px] font-semibold text-slate-400 px-1">
                        +{skills.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                  <div className="text-[11px] text-slate-400 font-medium">
                    {pref.work_mode ? `${pref.work_mode}` : 'Open to offers'}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* View Match Dossier Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCandidateForDossier(candidate);
                        if (candidate.id) {
                          api.recordCandidateView(candidate.id).catch(() => { });
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer border-none shadow-2xs transition-all"
                      title="Open 8-Dimension Recruiter Match Dossier"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                      <span>Dossier</span>
                    </button>

                    {/* View Profile in PDF Format (Modal) */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCandidateForPdf(candidate);
                        if (candidate.id) {
                          api.recordCandidateView(candidate.id).catch(() => { });
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-2xs flex items-center gap-1 cursor-pointer border-none"
                      title="View complete profile dossier in PDF form"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-300" />
                      <span>PDF</span>
                    </button>

                    {/* Quick Print / Download Shortcut */}
                    <button
                      type="button"
                      onClick={() => {
                        handlePrintCandidatePdf(candidate);
                        if (candidate.id) {
                          api.recordCandidateView(candidate.id).catch(() => { });
                        }
                      }}
                      className="p-1.5 rounded-lg border border-slate-200/80 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer bg-white shadow-2xs"
                      title="Direct Download / Print PDF"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Pagination Controls Bar ── */}
        <div className="bg-white border border-slate-200/80 rounded-2xl px-5 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 text-slate-500 font-medium flex-wrap">
            <span>
              Showing <strong className="text-slate-900">{displayedCandidates.length === 0 ? 0 : startIndex + 1}</strong> to{' '}
              <strong className="text-slate-900">{Math.min(startIndex + pageSize, displayedCandidates.length)}</strong> of{' '}
              <strong className="text-slate-900">{displayedCandidates.length}</strong> talent profiles
            </span>
            <span className="hidden sm:inline-block text-slate-300">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[11px]">Show:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-[#5C59E8] cursor-pointer shadow-2xs"
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={30}>30 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed font-semibold text-slate-700 bg-white flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            <div className="flex items-center gap-1">
              {getPageNumbers(safePage, totalPages).map((p, idx) => (
                p === '...' ? (
                  <span key={`dots-${idx}`} className="px-1 text-slate-400 font-bold">...</span>
                ) : (
                  <button
                    key={`page-${p}`}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center cursor-pointer border transition-colors ${safePage === p
                      ? 'bg-[#5C59E8] text-white border-[#5C59E8] shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    {p}
                  </button>
                )
              ))}
            </div>

            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed font-semibold text-slate-700 bg-white flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </>
    )}

      {/* ── 4. Full Candidate Dossier PDF Modal ── */}
      {selectedCandidateForPdf && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in"
          onClick={() => setSelectedCandidateForPdf(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200/80 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Action Bar */}
            <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between shrink-0 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-[#5C59E8]/10 text-[#4845D2] flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 m-0">Official Candidate Dossier</h3>
                  <p className="text-[11px] text-slate-400 m-0 mt-0.5">Document ready for review, export, or print</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintCandidatePdf(selectedCandidateForPdf)}
                  className="px-4 py-2 bg-[#FF7043] hover:bg-[#E65B30] text-white rounded-lg text-xs font-semibold transition-all shadow-[0_1px_2px_rgba(255,112,67,0.3)] flex items-center gap-1.5 border-none cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Download / Print PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCandidateForPdf(null)}
                  className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-600 flex items-center justify-center border-none cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: A4 Document Sheet with Hidden Scrollbars */}
            <div
              className="p-4 sm:p-8 overflow-y-auto flex-1 bg-slate-100/70 no-scrollbar scrollbar-none"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <div className="max-w-2xl mx-auto bg-white p-6 sm:p-10 rounded-2xl border border-slate-200/80 shadow-md text-slate-800 space-y-6">

                {/* Document Sheet Header */}
                <div className="flex items-start justify-between pb-5 border-b-2 border-[#00a884] gap-4">
                  <div className="flex items-center gap-4">
                    {selectedCandidateForPdf.avatar_url ? (
                      <img
                        src={selectedCandidateForPdf.avatar_url}
                        alt={selectedCandidateForPdf.full_name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-[#00a884] shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xl shrink-0 border-2 border-[#00a884]">
                        {(selectedCandidateForPdf.full_name || 'C').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="text-[0.62rem] font-black uppercase tracking-widest text-[#00a884]">
                        UPTRIX TALENT PLATFORM • CONFIDENTIAL DOSSIER
                      </div>
                      <h2 className="text-xl font-black text-slate-900 mt-0.5">
                        {selectedCandidateForPdf.full_name}
                      </h2>
                      <div className="text-xs font-bold text-teal-700">
                        {selectedCandidateForPdf.title || 'Professional'}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-2 flex-wrap">
                        {selectedCandidateForPdf.email && (
                          <span className="flex items-center gap-1 font-medium">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {selectedCandidateForPdf.email}
                          </span>
                        )}
                        {selectedCandidateForPdf.phone && (
                          <span className="flex items-center gap-1 font-medium">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {selectedCandidateForPdf.phone}
                          </span>
                        )}
                        {(selectedCandidateForPdf.city || selectedCandidateForPdf.state) && (
                          <span className="flex items-center gap-1 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {selectedCandidateForPdf.city}{selectedCandidateForPdf.state ? `, ${selectedCandidateForPdf.state}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.65rem] font-black bg-teal-50 text-teal-800 border border-teal-200">
                      VERIFIED
                    </span>
                    <div className="text-[0.65rem] text-slate-400 mt-1 font-semibold">
                      Ref: UPC-{selectedCandidateForPdf.id || '001'}
                    </div>
                    <div className="text-[0.65rem] text-slate-400">
                      Exp: {selectedCandidateForPdf.total_experience_years || '0'}+ Yrs
                    </div>
                  </div>
                </div>

                {/* Professional Summary */}
                {selectedCandidateForPdf.summary && (
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5 pb-1 border-b border-slate-100">
                      Professional Summary
                    </h4>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {selectedCandidateForPdf.summary}
                    </p>
                  </div>
                )}

                {/* Skills & Expertise */}
                {Array.isArray(selectedCandidateForPdf.skills) && selectedCandidateForPdf.skills.length > 0 && (
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 pb-1 border-b border-slate-100">
                      Core Skills & Functional Competencies
                    </h4>
                    <div className="flex gap-1.5 flex-wrap">
                      {selectedCandidateForPdf.skills.map((sk, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200/80">
                          {sk}
                        </span>
                      ))}
                      {Array.isArray(selectedCandidateForPdf.expertise) && selectedCandidateForPdf.expertise.map((exp, idx) => (
                        <span key={`exp-${idx}`} className="px-2.5 py-1 rounded-md bg-teal-50 text-[#00a884] font-bold text-xs border border-teal-200">
                          {exp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Work Experience Timeline */}
                {Array.isArray(selectedCandidateForPdf.experience) && selectedCandidateForPdf.experience.length > 0 && (
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 pb-1 border-b border-slate-100">
                      Work Experience History
                    </h4>
                    <div className="space-y-4">
                      {selectedCandidateForPdf.experience.map((exp, idx) => (
                        <div key={idx} className="border-l-2 border-teal-500 pl-3.5 pb-1 space-y-1">
                          <div className="flex items-center justify-between text-xs flex-wrap">
                            <span className="font-black text-slate-900">{exp.title}</span>
                            <span className="text-slate-500 font-bold text-[0.68rem]">{exp.duration}</span>
                          </div>
                          <div className="text-xs font-bold text-[#00a884]">
                            {exp.company} {exp.location ? `• ${exp.location}` : ''}
                          </div>
                          {exp.description && (
                            <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1">
                              {exp.description}
                            </p>
                          )}
                          {Array.isArray(exp.technologies) && exp.technologies.length > 0 && (
                            <div className="flex gap-1 flex-wrap pt-1">
                              {exp.technologies.map((t, i) => (
                                <span key={i} className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[0.62rem] font-semibold">
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {Array.isArray(selectedCandidateForPdf.education) && selectedCandidateForPdf.education.length > 0 && (
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 pb-1 border-b border-slate-100">
                      Education & Academic Background
                    </h4>
                    <div className="space-y-2.5">
                      {selectedCandidateForPdf.education.map((edu, idx) => (
                        <div key={idx} className="flex justify-between items-start text-xs">
                          <div>
                            <div className="font-bold text-slate-900">{edu.degree}</div>
                            <div className="text-slate-500 font-medium">{edu.institution} {edu.grade ? `• ${edu.grade}` : ''}</div>
                          </div>
                          <span className="text-slate-400 font-bold text-[0.68rem]">{edu.year || edu.duration}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {Array.isArray(selectedCandidateForPdf.certifications) && selectedCandidateForPdf.certifications.length > 0 && (
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 pb-1 border-b border-slate-100">
                      Verified Certifications & Credentials
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {selectedCandidateForPdf.certifications.map((c, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="font-bold text-slate-900">{c.name}</div>
                          <div className="text-slate-500 text-[0.68rem]">{c.issuer} {c.year ? `(${c.year})` : ''}</div>
                          {c.credential_id && (
                            <div className="text-[0.62rem] text-slate-400 font-mono mt-0.5">ID: {c.credential_id}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hiring Preferences */}
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 pb-1 border-b border-slate-100">
                    Hiring Preferences & Placement Availability
                  </h4>
                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold text-[0.68rem] block">Work Mode</span>
                      <span className="font-bold text-slate-800">{selectedCandidateForPdf.hiring_preferences?.work_mode || 'Flexible / Hybrid'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold text-[0.68rem] block">Availability</span>
                      <span className="font-bold text-slate-800">{selectedCandidateForPdf.hiring_preferences?.availability || 'Immediate to 30 Days'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold text-[0.68rem] block">Target Salary</span>
                      <span className="font-bold text-slate-800">{selectedCandidateForPdf.hiring_preferences?.desired_salary || 'Competitive / Open'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold text-[0.68rem] block">Preferred City</span>
                      <span className="font-bold text-slate-800">{selectedCandidateForPdf.hiring_preferences?.preferred_location || selectedCandidateForPdf.city || 'India'}</span>
                    </div>
                  </div>
                </div>

                {/* Document Footer */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[0.65rem] text-slate-400 font-medium">
                  <span>Prepared exclusively for verified hiring partner review • Uptrix Talent Platform</span>
                  <span>CONFIDENTIAL</span>
                </div>

              </div>
            </div>

            {/* Modal Bottom Footer */}
            <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                Print or download this candidate profile directly as an official PDF.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCandidateForPdf(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer bg-white"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handlePrintCandidatePdf(selectedCandidateForPdf)}
                  className="px-5 py-2 bg-[#00a884] hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 border-none cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Download / Print PDF</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── 5. Recruiter Match Dossier Modal ── */}
      {selectedCandidateForDossier && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in"
          onClick={() => setSelectedCandidateForDossier(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-2xl sm:max-w-3xl w-full p-5 sm:p-7 border border-slate-200 text-xs max-h-[90vh] overflow-y-auto no-scrollbar scrollbar-none space-y-4 animate-in zoom-in-95"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                  <Zap className="w-5 h-5 text-indigo-600 fill-indigo-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {selectedCandidateForDossier.full_name || 'Candidate'} — Candidate Match Dossier
                  </h3>
                  <p className="text-[0.7rem] text-slate-500">
                    {selectedCandidateForDossier.title || 'Digital Marketer'} • {selectedCandidateForDossier.city || 'India'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCandidateForDossier(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center border-none cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <RecruiterMatchDossier
              candidate={selectedCandidateForDossier}
              compact={false}
            />

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCandidateForDossier(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer border-none"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
