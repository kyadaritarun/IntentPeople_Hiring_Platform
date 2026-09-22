import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Filter, Users, Briefcase, MapPin, Award, GraduationCap,
  Sparkles, CheckCircle2, Download, Printer, X, Eye, Phone, Mail,
  ExternalLink, FileText, ChevronDown, Compass, ShieldCheck, Clock,
  Building2, ArrowRight, RefreshCw, Zap, Tag, Star
} from 'lucide-react';
import { api } from '../../api';

// Popular digital marketing skill suggestions for 1-click filtering
const POPULAR_SKILLS = [
  'SEO', 'Google Ads', 'Meta Ads', 'Performance Marketing', 'GA4 & Analytics',
  'Content Strategy', 'ROAS Optimization', 'Email Marketing', 'Social Media Marketing',
  'SEM & PPC', 'Conversion Rate Optimization (CRO)', 'Copywriting', 'Influencer Marketing',
  'Lead Generation', 'Affiliate Marketing', 'CRM & HubSpot'
];

const EXPERIENCE_TIERS = [
  { id: 'all', label: 'Any Experience', min: null, max: null },
  { id: 'fresher', label: 'Fresher (0 - 1y)', min: 0, max: 1 },
  { id: 'junior', label: 'Junior (1 - 3y)', min: 1, max: 3 },
  { id: 'mid', label: 'Mid-Level (3 - 5y)', min: 3, max: 5 },
  { id: 'senior', label: 'Senior (5 - 8y)', min: 5, max: 8 },
  { id: 'lead', label: 'Lead & Director (8y+)', min: 8, max: null },
];

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

  // PDF Dossier Modal state
  const [selectedCandidateForPdf, setSelectedCandidateForPdf] = useState(null);

  // Initial candidate load
  const loadCandidates = async () => {
    setLoading(true);
    try {
      const results = await api.searchCandidates({});
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
    loadCandidates();
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
        ${exp.description ? `<p style="font-size: 11px; color: #334155; margin-top: 4px; line-height: 1.5;">${exp.description}</p>` : ''}
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
    <div className="p-3 sm:p-6 lg:p-8 max-w-10xl mx-auto space-y-6 select-text text-slate-800">
      
      {/* ── 1. Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-teal-50 text-[#00a884] flex items-center justify-center font-bold border border-teal-100/80 shadow-2xs">
              <Search className="w-4 h-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Candidate Search & Sourcing
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200/80">
              {candidates.length} Profiles
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Search verified candidates across skills, experience, and roles. View complete candidate dossiers in PDF format.
          </p>
        </div>

        <button
          type="button"
          onClick={loadCandidates}
          disabled={loading}
          className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#00a884]' : ''}`} />
          <span>Refresh Pool</span>
        </button>
      </div>

      {/* ── 2. Search & Filter Command Panel ── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
        
        {/* Main Search Input & Sourcing Button */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="flex items-center gap-2 flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus-within:bg-white focus-within:border-[#00a884] focus-within:ring-2 focus-within:ring-teal-100 transition-all">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search candidates by title, keywords, name, or companies (e.g. 'Performance Marketer', 'Priya', 'Growth Lead')..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full bg-transparent border-none text-xs outline-none text-slate-800 placeholder-slate-400"
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
            className="px-6 py-2.5 rounded-xl bg-[#00a884] hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer border-none shrink-0"
          >
            <Sparkles className={`w-4 h-4 ${searching ? 'animate-spin' : ''}`} />
            <span>{searching ? 'Sourcing...' : 'Search Candidates'}</span>
          </button>

          {(query || selectedSkills.length > 0 || selectedExpTier !== 'all' || selectedCity || selectedWorkMode !== 'all') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-all cursor-pointer border-none shrink-0"
            >
              Reset
            </button>
          )}
        </div>

        {/* Skills Tag Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Tag className="w-3 h-3 text-[#00a884]" />
              Filter by Skills & Expertise:
            </span>
            {selectedSkills.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedSkills([])}
                className="text-[0.68rem] text-rose-600 font-bold hover:underline border-none bg-transparent cursor-pointer p-0"
              >
                Clear all skills ({selectedSkills.length})
              </button>
            )}
          </div>

          {/* Selected Skills Chips */}
          {selectedSkills.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap p-2.5 bg-teal-50/50 rounded-xl border border-teal-100">
              <span className="text-xs font-bold text-teal-800 mr-1">Active:</span>
              {selectedSkills.map(skill => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#00a884] text-white text-xs font-bold shadow-2xs"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className="hover:bg-teal-800 rounded-full p-0.5 border-none bg-transparent text-white cursor-pointer"
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
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-teal-50 text-[#00a884] border-teal-300 shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
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
                className="w-24 px-2 py-1 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white outline-none focus:border-[#00a884]"
              />
              <button
                type="submit"
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer border-none"
              >
                Add
              </button>
            </form>
          </div>
        </div>

        {/* Experience Tier, Location, and Work Mode Filters */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Experience Tier */}
          <div>
            <label className="block text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
              Experience Level:
            </label>
            <select
              value={selectedExpTier}
              onChange={(e) => setSelectedExpTier(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 outline-none cursor-pointer shadow-2xs focus:border-[#00a884]"
            >
              {EXPERIENCE_TIERS.map(tier => (
                <option key={tier.id} value={tier.id}>{tier.label}</option>
              ))}
            </select>
          </div>

          {/* Location / City */}
          <div>
            <label className="block text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
              Location / City:
            </label>
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-2xs focus-within:border-[#00a884]">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="e.g. Hyderabad, Bengaluru..."
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full bg-transparent border-none text-xs outline-none text-slate-800 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Work Mode */}
          <div>
            <label className="block text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
              Work Mode Preference:
            </label>
            <select
              value={selectedWorkMode}
              onChange={(e) => setSelectedWorkMode(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 outline-none cursor-pointer shadow-2xs focus:border-[#00a884]"
            >
              <option value="all">All Work Modes</option>
              <option value="remote">Remote Only</option>
              <option value="hybrid">Hybrid</option>
              <option value="on-site">On-site</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── 3. Candidate Results ── */}
      {loading ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-2xs space-y-3">
          <RefreshCw className="w-8 h-8 text-[#00a884] animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-bold">Scanning candidate talent pool...</p>
        </div>
      ) : candidates.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-2xs space-y-3">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-black text-slate-900">No candidates match your criteria</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try broadening your search query, removing skill filters, or adjusting the experience tier to discover more candidates.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer border-none"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {candidates.map(candidate => {
            const expYears = candidate.total_experience_years || 0;
            const skills = candidate.skills || [];
            const latestExp = (candidate.experience && candidate.experience[0]) || null;
            const pref = candidate.hiring_preferences || {};

            return (
              <div
                key={candidate.id}
                className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-teal-200 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Card Header: Avatar, Name, Experience */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {candidate.avatar_url ? (
                        <img
                          src={candidate.avatar_url}
                          alt={candidate.full_name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-[#00a884] shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0 border-2 border-[#00a884]">
                          {(candidate.full_name || 'C').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-extrabold text-sm text-slate-900 truncate">
                          {candidate.full_name || 'Candidate'}
                        </div>
                        <div className="text-xs font-bold text-[#00a884] truncate mt-0.5">
                          {candidate.title || 'Professional'}
                        </div>
                        <div className="text-[0.68rem] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span>{candidate.city || 'India'}{candidate.state ? `, ${candidate.state}` : ''}</span>
                        </div>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[0.68rem] font-black border border-slate-200 shrink-0">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{expYears > 0 ? `${expYears}y exp` : 'Fresher'}</span>
                    </span>
                  </div>

                  {/* Summary Snippet */}
                  {candidate.summary && (
                    <p className="text-xs text-slate-600 line-clamp-2 mt-3 font-medium leading-relaxed">
                      {candidate.summary}
                    </p>
                  )}

                  {/* Latest Experience Teaser */}
                  {latestExp && (
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <div className="font-bold text-slate-800 truncate">
                        {latestExp.title}
                      </div>
                      <div className="text-[0.68rem] text-slate-500 truncate">
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
                          className={`px-2 py-0.5 rounded-md text-[0.65rem] font-bold ${
                            isMatched
                              ? 'bg-teal-100 text-teal-800 border border-teal-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {sk}
                        </span>
                      );
                    })}
                    {skills.length > 4 && (
                      <span className="text-[0.65rem] font-bold text-slate-400 px-1">
                        +{skills.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-[0.68rem] text-slate-400 font-medium">
                    {pref.work_mode ? `${pref.work_mode}` : 'Open to offers'}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View Profile in PDF Format (Modal) */}
                    <button
                      type="button"
                      onClick={() => setSelectedCandidateForPdf(candidate)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer border-none"
                      title="View complete profile dossier in PDF form"
                    >
                      <FileText className="w-3.5 h-3.5 text-teal-300" />
                      <span>View PDF</span>
                    </button>

                    {/* Quick Print / Download Shortcut */}
                    <button
                      type="button"
                      onClick={() => handlePrintCandidatePdf(candidate)}
                      className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer bg-white"
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
      )}

      {/* ── 4. Full Candidate Dossier PDF Modal ── */}
      {selectedCandidateForPdf && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in"
          onClick={() => setSelectedCandidateForPdf(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Action Bar */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-teal-100 text-[#00a884] flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Official Candidate Dossier</h3>
                  <p className="text-[0.68rem] text-slate-500">Document ready for review, export, or print</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintCandidatePdf(selectedCandidateForPdf)}
                  className="px-4 py-2 bg-[#00a884] hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 border-none cursor-pointer"
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

    </div>
  );
}
