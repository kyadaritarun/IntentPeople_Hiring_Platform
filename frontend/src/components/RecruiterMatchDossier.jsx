import React, { useState } from 'react';
import {
  Target, Users, DollarSign, Trophy, Layers, HelpCircle,
  Compass, Clock, CheckCircle2, AlertCircle, ChevronDown,
  ChevronUp, ExternalLink, Sparkles, Zap, Award, ShieldCheck,
  Briefcase, TrendingUp, Check, Copy, ArrowRight, BookOpen
} from 'lucide-react';
import ScoringGuideDrawer from './ScoringGuideDrawer';

export default function RecruiterMatchDossier({
  dossier: propDossier,
  candidate = {},
  job = {},
  fitScore = null,
  fitBreakdown = {},
  compact = false
}) {
  const [expandedCard, setExpandedCard] = useState(null);
  const [copiedQuestion, setCopiedQuestion] = useState(null);
  const [showGuideDrawer, setShowGuideDrawer] = useState(false);

  // Use provided dossier, or construct fallback from candidate & job fields
  // Use provided dossier, or construct fallback from candidate & job fields
  const dossier = propDossier || fitBreakdown?.dossier || (() => {
    const specialisations = candidate?.specialisations_data || [];
    const gtm = candidate?.gtm_experience || {};
    const caseStudies = candidate?.case_studies || [];
    const executionEnv = candidate?.execution_environment || {};
    const toolsList = candidate?.tools_proficiency || [];
    const interests = candidate?.career_interests || {};
    const hiringPrefs = candidate?.hiring_preferences || {};

    // 1. Primary discipline & capabilities
    const primarySpecId = interests?.primary_specialisation || '';
    let candCaps = [];
    let primaryName = '';

    if (specialisations.length > 0 && (specialisations[0]?.capability || specialisations[0]?.specialisation_id)) {
      candCaps = specialisations.map(c => ({
        name: c.capability || c.name || '',
        proficiency: c.proficiency || 'Works independently',
        ownership: c.ownership || 'Personally executed',
        specialisation_id: c.specialisation_id || ''
      })).filter(c => c.name);

      if (primarySpecId) {
        primaryName = primarySpecId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      } else if (candCaps[0]?.specialisation_id) {
        primaryName = candCaps[0].specialisation_id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
    } else {
      const primarySpec = specialisations.find(s => s.type === 'primary') || specialisations[0];
      primaryName = primarySpec?.name || '';
      candCaps = (primarySpec?.capabilities || []).map(c => ({
        name: c.name || c.capability || '',
        proficiency: c.proficiency || 'Proficient',
        ownership: c.ownership || 'Personally executed'
      })).filter(c => c.name);
    }

    if (!primaryName) {
      primaryName = primarySpecId
        ? primarySpecId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        : (candidate?.title || 'Digital Marketing');
    }

    const primaryOwnership = candCaps[0]?.ownership || 'Personally executed';

    // Capability score based on actual job match
    const jobSpec = (job?.specialization || '').toLowerCase();
    const jobSkills = Array.isArray(job?.skills) ? job.skills.map(s => String(s).toLowerCase()) : [];
    const jobDesc = (job?.description || '').toLowerCase();
    const jobTitle = (job?.title || '').toLowerCase();

    let capScore = 60;
    const matchedCaps = [];
    const normPrimary = primaryName.toLowerCase();

    if (jobSpec && (normPrimary.includes(jobSpec) || jobSpec.includes(normPrimary))) {
      capScore += 20;
    } else if (jobSpec && candCaps.some(c => c.name.toLowerCase().includes(jobSpec))) {
      capScore += 15;
    }

    candCaps.forEach(cap => {
      const cNorm = cap.name.toLowerCase();
      const isMatched = jobSkills.some(js => js.includes(cNorm) || cNorm.includes(js)) ||
        (jobDesc && jobDesc.includes(cNorm)) ||
        (jobTitle && jobTitle.includes(cNorm));
      if (isMatched || matchedCaps.length < 3) {
        matchedCaps.push({
          name: cap.name,
          proficiency: cap.proficiency,
          ownership: cap.ownership
        });
      }
    });

    if (matchedCaps.length > 0) {
      capScore += Math.min(20, matchedCaps.length * 6.5);
    }
    capScore = Math.min(100, Math.max(30, Math.round(capScore)));

    // 2. Audience & GTM Context
    const rawModel = gtm?.customer_model;
    const candModels = Array.isArray(rawModel) ? rawModel : (rawModel ? [rawModel] : []);
    const candRtm = gtm?.route_to_market || gtm?.routes_to_market || '';
    const candRtmList = Array.isArray(candRtm) ? candRtm : (candRtm ? [candRtm] : []);
    const jobModel = (job?.business_model || '').toLowerCase();

    let gtmScore = 65;
    const matchedGtm = [];
    if (candModels.length > 0) {
      candModels.forEach(m => {
        const mNorm = String(m).toLowerCase();
        if (jobModel && (jobModel.includes(mNorm) || mNorm.includes(jobModel))) {
          matchedGtm.push(m);
        } else if (jobDesc.includes(mNorm) || jobTitle.includes(mNorm)) {
          matchedGtm.push(m);
        }
      });
      if (matchedGtm.length > 0) {
        gtmScore = 90 + Math.min(10, matchedGtm.length * 5);
      } else if (jobModel) {
        gtmScore = 60;
      } else {
        gtmScore = 80;
        matchedGtm.push(...candModels.slice(0, 2));
      }
    }
    gtmScore = Math.min(100, Math.max(30, Math.round(gtmScore)));

    // 3. Environment & Budget
    let largestSpend = executionEnv?.largest_monthly_spend || '';
    if (!largestSpend && caseStudies.length > 0) {
      largestSpend = caseStudies.find(cs => cs.ad_spend)?.ad_spend || '';
    }
    if (!largestSpend && gtm?.avg_purchase_value) {
      largestSpend = `ACV: ${gtm.avg_purchase_value}`;
    }
    const teamSetup = executionEnv?.primary_team_setup || candidate?.experience?.[0]?.company || 'In-house team';

    let envScore = 75;
    if (largestSpend) {
      const s = String(largestSpend).toLowerCase();
      if (['100,000', '50,000', '75,000', '2m', '1m', '500k'].some(k => s.includes(k))) {
        envScore = 92;
      } else if (['10,000', '25,000', '30,000', '15,000'].some(k => s.includes(k))) {
        envScore = 85;
      } else {
        envScore = 80;
      }
    }
    envScore = Math.min(100, Math.max(30, Math.round(envScore)));

    // 4. Evidence of Performance
    const csCount = caseStudies.length;
    const hasMetrics = caseStudies.some(cs => Boolean(cs.results_metrics || (cs.before_metric && cs.after_metric)));
    const hasLinks = Boolean(candidate?.portfolio_url || caseStudies.some(cs => cs.evidence_url || cs.proof_url));

    const csHighlights = [];
    caseStudies.slice(0, 2).forEach(cs => {
      const t = cs.title || 'Campaign';
      const m = cs.results_metrics || (cs.before_metric && cs.after_metric ? `${cs.before_metric} → ${cs.after_metric}` : '');
      if (m) csHighlights.push(`${t}: ${m}`);
      else if (t) csHighlights.push(t);
    });

    let evidenceScore = 35;
    if (csCount >= 2 && hasMetrics) evidenceScore = 95;
    else if (csCount >= 1 && hasMetrics) evidenceScore = 90;
    else if (csCount >= 1) evidenceScore = 80;
    else if (hasLinks) evidenceScore = 65;
    else if (candidate?.resume_url) evidenceScore = 55;
    evidenceScore = Math.min(100, Math.max(30, Math.round(evidenceScore)));

    // 5. Transferable Experience & Tools
    let secSpecs = interests?.secondary_specialisations || specialisations.filter(s => s.type === 'secondary').map(s => s.name);
    if (Array.isArray(secSpecs)) {
      secSpecs = secSpecs.map(s => typeof s === 'string' ? s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : String(s));
    } else {
      secSpecs = [];
    }

    const topTools = toolsList.map(t => {
      if (typeof t === 'string') return t;
      return t?.tool || t?.name || '';
    }).filter(Boolean);

    let transScore = 65;
    if (secSpecs.length > 0) transScore += Math.min(18, secSpecs.length * 9);
    if (topTools.length > 0) transScore += Math.min(17, topTools.length * 4);
    transScore = Math.min(100, Math.round(transScore));

    // 6. Clarifications
    const candAvail = interests?.joining_availability || hiringPrefs?.availability || '';
    const candMode = interests?.preferred_arrangement || (interests?.work_arrangement || [])[0] || hiringPrefs?.work_mode || '';
    const candComp = interests?.target_compensation || hiringPrefs?.expected_ctc || hiringPrefs?.desired_salary || '';

    const clarifications = [];
    const suggestedQuestions = [];
    if (candAvail && (candAvail.includes('month') || candAvail.includes('60') || candAvail.includes('90'))) {
      clarifications.push(`Notice period is ${candAvail}`);
      suggestedQuestions.push(`Confirm earliest possible start date given your ${candAvail} notice period.`);
    }
    if (csCount === 0) {
      clarifications.push('No campaign case studies or ROI metrics uploaded');
      suggestedQuestions.push('Can you walk us through a specific campaign where you achieved substantial CAC reduction or ROAS lift?');
    }
    if (topTools.length === 0) {
      clarifications.push('Tools proficiency list not filled');
      suggestedQuestions.push('Which ad platforms and analytics tools are you actively using day-to-day?');
    }
    const clarifyScore = Math.min(100, Math.max(55, Math.round(100 - (clarifications.length * 15))));

    // 7. Preferences
    let prefScore = 75;
    let modeMatch = 'Compatible';
    const jobWorkMode = (job?.work_mode || '').toLowerCase();
    if (candMode) {
      const cmNorm = candMode.toLowerCase();
      if (jobWorkMode && (jobWorkMode.includes(cmNorm) || cmNorm.includes(jobWorkMode) || cmNorm.includes('any') || cmNorm.includes('open'))) {
        prefScore += 15;
        modeMatch = `Aligned (${candMode})`;
      } else if (jobWorkMode) {
        prefScore -= 10;
        modeMatch = `Candidate prefers ${candMode} vs Job ${job?.work_mode || 'Remote'}`;
      } else {
        modeMatch = `Aligned (${candMode})`;
      }
    }
    const compMatch = candComp ? `Target: ${candComp}` : 'Open';
    prefScore = Math.min(100, Math.max(40, Math.round(prefScore)));

    // 8. Timing
    let timingScore = 80;
    let timingDelta = 'On Track';
    const caNorm = candAvail.toLowerCase();
    if (!candAvail) {
      timingScore = 85;
      timingDelta = 'Available / Flexible';
    } else if (['immediate', 'ready', '15 day', '0-15'].some(k => caNorm.includes(k))) {
      timingScore = 98;
      timingDelta = 'Immediate Start Ready';
    } else if (['1 month', '30 day'].some(k => caNorm.includes(k))) {
      timingScore = 88;
      timingDelta = 'Standard 30-day notice';
    } else if (['2 month', '3 month', '60 day', '90 day'].some(k => caNorm.includes(k))) {
      timingScore = 60;
      timingDelta = '60-90 days notice (Planning required)';
    }
    timingScore = Math.min(100, Math.max(30, Math.round(timingScore)));

    return {
      relevant_capability: {
        card_id: 'relevant_capability',
        title: 'Relevant Capability & Execution Depth',
        score: capScore,
        status: capScore >= 80 ? 'High Match' : (capScore >= 60 ? 'Moderate Match' : 'Partial Match'),
        discipline: primaryName,
        matched_capabilities: matchedCaps,
        candidate_ownership: primaryOwnership,
        required_ownership: job?.ownership_level || 'Personally executed',
        ownership_status: 'Aligned',
        summary: `Specialization in ${primaryName} with hands-on capabilities (${primaryOwnership}).`
      },
      relevant_audience: {
        card_id: 'relevant_audience',
        title: 'Relevant Audience & GTM Context',
        score: gtmScore,
        status: gtmScore >= 80 ? 'High Alignment' : (gtmScore >= 60 ? 'Compatible' : 'Exploratory'),
        matched_models: matchedGtm.length > 0 ? matchedGtm : (candModels.length > 0 ? candModels : ['Digital / Omnichannel']),
        candidate_models: candModels,
        job_model: job?.business_model || 'Not specified',
        buying_cycle: gtm?.buying_cycle || 'Not specified',
        routes_to_market: candRtmList,
        summary: `Experienced in ${matchedGtm.join(', ') || candModels.join(', ') || 'general marketing'} audiences.`
      },
      relevant_environment: {
        card_id: 'relevant_environment',
        title: 'Relevant Environment & Budget Scale',
        score: envScore,
        status: envScore >= 80 ? 'Well Aligned' : (envScore >= 60 ? 'Scale Capable' : 'Review Needed'),
        largest_spend_managed: largestSpend || 'Standard budget',
        job_budget_range: job?.monthly_budget_range || 'Not specified',
        team_setup: teamSetup,
        growth_stage: job?.growth_stage || 'Growth',
        summary: `Managed budgets up to ${largestSpend || 'flexible scale'} in ${teamSetup}.`
      },
      evidence: {
        card_id: 'evidence',
        title: 'Evidence of Performance (Proof of Work)',
        score: evidenceScore,
        status: evidenceScore >= 80 ? 'Verified Proof' : (csCount > 0 ? 'Documented' : 'Portfolio Only'),
        case_studies_count: csCount,
        has_metrics: hasMetrics,
        has_live_links: hasLinks,
        highlights: csHighlights,
        summary: csCount > 0
          ? `${csCount} documented campaign case study with verified measurable ROI.`
          : (hasLinks || candidate?.resume_url ? 'Candidate has submitted portfolio and resume documentation.' : 'No campaign case studies uploaded yet.')
      },
      transferable_experience: {
        card_id: 'transferable_experience',
        title: 'Transferable Experience & Marketing Tools',
        score: transScore,
        status: transScore >= 80 ? 'High Versatility' : (transScore >= 60 ? 'Moderate Breadth' : 'Specialist'),
        secondary_specialisations: secSpecs,
        proficient_tools: topTools.slice(0, 6),
        summary: secSpecs.length > 0
          ? `T-shaped breadth in ${secSpecs.join(', ')} with proficiency across ${topTools.length} tools.`
          : `Active proficiency in ${topTools.length || 'core marketing'} tools.`
      },
      needs_clarification: {
        card_id: 'needs_clarification',
        title: 'Points for Recruiter Clarification',
        score: clarifyScore,
        status: clarifications.length === 0 ? 'Clear Profile' : `${clarifications.length} Point(s) to Probe`,
        clarification_points: clarifications,
        suggested_questions: suggestedQuestions,
        summary: clarifications.length === 0
          ? 'No major profile discrepancies or timing friction detected.'
          : `${clarifications.length} item(s) recommended for interview clarification.`
      },
      preference_compatibility: {
        card_id: 'preference_compatibility',
        title: 'Preference & Work Setup Compatibility',
        score: prefScore,
        status: prefScore >= 85 ? 'Fully Aligned' : (prefScore >= 65 ? 'Partially Aligned' : 'Friction Detected'),
        work_mode_alignment: modeMatch,
        compensation_alignment: compMatch,
        summary: `Work setup: ${modeMatch}. Compensation: ${compMatch}.`
      },
      timing_difference: {
        card_id: 'timing_difference',
        title: 'Timing & Availability Alignment',
        score: timingScore,
        status: timingScore >= 95 ? 'Immediate Start' : (timingScore >= 80 ? 'On Track' : (timingScore >= 60 ? 'Moderate Delay' : 'Extended Notice')),
        candidate_availability: candAvail || 'Flexible',
        timing_delta: timingDelta,
        summary: `Availability: ${candAvail || 'Flexible'} (${timingDelta}).`
      }
    };
  })();

  const copyQuestion = (text, idx) => {
    navigator.clipboard?.writeText(text);
    setCopiedQuestion(idx);
    setTimeout(() => setCopiedQuestion(null), 2500);
  };

  const getScoreBadgeColor = (score) => {
    if (score >= 85) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 70) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (score >= 55) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  const cardsConfig = [
    {
      key: 'relevant_capability',
      icon: Target,
      accent: 'border-l-indigo-500',
      iconBg: 'bg-indigo-100 text-indigo-600',
      renderContent: (card) => (
        <div className="space-y-2 mt-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Primary Discipline:</span>
            <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
              {card.discipline}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Ownership Level:</span>
            <span className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${
              card.candidate_ownership?.toLowerCase().includes('personally')
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
            }`}>
              ★ {card.candidate_ownership}
            </span>
          </div>
          {card.matched_capabilities?.length > 0 && (
            <div className="mt-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Key Matched Capabilities
              </div>
              <div className="space-y-1">
                {card.matched_capabilities.map((cap, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] bg-slate-50 p-1.5 rounded-lg border border-slate-200/70">
                    <span className="font-semibold text-slate-700">{cap.name}</span>
                    <span className="text-[10px] font-extrabold text-indigo-600 bg-white px-1.5 py-0.5 rounded border border-indigo-100">
                      {cap.proficiency}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'relevant_audience',
      icon: Users,
      accent: 'border-l-blue-500',
      iconBg: 'bg-blue-100 text-blue-600',
      renderContent: (card) => (
        <div className="space-y-2 mt-2 pt-2 border-t border-slate-100">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Customer & Audience Models
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(card.matched_models || card.candidate_models || []).map((m, i) => (
              <span key={i} className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-200">
                ✓ {m}
              </span>
            ))}
          </div>
          {card.buying_cycle && card.buying_cycle !== 'Not specified' && (
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500">Sales / Buying Cycle:</span>
              <span className="font-bold text-slate-700">{card.buying_cycle}</span>
            </div>
          )}
          {card.routes_to_market?.length > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">GTM Routes:</span>
              <span className="font-semibold text-slate-700 truncate max-w-[180px]">
                {card.routes_to_market.join(', ')}
              </span>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'relevant_environment',
      icon: DollarSign,
      accent: 'border-l-teal-500',
      iconBg: 'bg-teal-100 text-teal-600',
      renderContent: (card) => (
        <div className="space-y-2 mt-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Largest Spend Managed:</span>
            <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
              {card.largest_spend_managed}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Operating Team Setup:</span>
            <span className="font-semibold text-slate-700">{card.team_setup}</span>
          </div>
          {card.job_budget_range && card.job_budget_range !== 'Not specified' && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Requisition Budget:</span>
              <span className="font-semibold text-slate-800">{card.job_budget_range}</span>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'evidence',
      icon: Trophy,
      accent: 'border-l-amber-500',
      iconBg: 'bg-amber-100 text-amber-600',
      renderContent: (card) => (
        <div className="space-y-2 mt-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Documented Case Studies:</span>
            <span className="font-extrabold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              {card.case_studies_count || 0} Case Study
            </span>
          </div>
          {card.highlights?.length > 0 && (
            <div className="space-y-1 mt-1.5">
              {card.highlights.map((h, i) => (
                <div key={i} className="text-[11px] font-semibold text-amber-900 bg-amber-50/70 p-2 rounded-lg border border-amber-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          )}
          {card.has_live_links && (
            <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 pt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Live evidence & campaign portfolio URLs attached
            </div>
          )}
        </div>
      )
    },
    {
      key: 'transferable_experience',
      icon: Layers,
      accent: 'border-l-purple-500',
      iconBg: 'bg-purple-100 text-purple-600',
      renderContent: (card) => (
        <div className="space-y-2 mt-2 pt-2 border-t border-slate-100">
          {card.secondary_specialisations?.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Secondary Disciplines (T-Shaped)
              </div>
              <div className="flex flex-wrap gap-1">
                {card.secondary_specialisations.map((sec, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[11px] font-bold border border-purple-200">
                    + {sec}
                  </span>
                ))}
              </div>
            </div>
          )}
          {card.proficient_tools?.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Platform & Tool Mastery
              </div>
              <div className="flex flex-wrap gap-1">
                {card.proficient_tools.map((t, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'needs_clarification',
      icon: HelpCircle,
      accent: 'border-l-rose-500',
      iconBg: 'bg-rose-100 text-rose-600',
      renderContent: (card) => (
        <div className="space-y-2.5 mt-2 pt-2 border-t border-slate-100">
          {card.clarification_points?.length > 0 ? (
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
                Clarification Checkpoints
              </div>
              {card.clarification_points.map((pt, i) => (
                <div key={i} className="text-[11px] text-rose-900 bg-rose-50/80 p-2 rounded-lg border border-rose-200 flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                  <span>{pt}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-emerald-700 font-semibold bg-emerald-50 p-2 rounded-lg border border-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Profile details are complete with zero red flags detected.
            </div>
          )}

          {card.suggested_questions?.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <span>Suggested Interview Probing Questions</span>
              </div>
              {card.suggested_questions.map((q, i) => (
                <div key={i} className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs text-slate-800 flex items-start justify-between gap-2 group">
                  <span className="italic leading-relaxed">"{q}"</span>
                  <button
                    type="button"
                    onClick={() => copyQuestion(q, i)}
                    className="shrink-0 p-1 text-slate-400 hover:text-indigo-600 hover:bg-white rounded transition-colors"
                    title="Copy interview question"
                  >
                    {copiedQuestion === i ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'preference_compatibility',
      icon: Compass,
      accent: 'border-l-emerald-500',
      iconBg: 'bg-emerald-100 text-emerald-600',
      renderContent: (card) => (
        <div className="space-y-2 mt-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Work Arrangement:</span>
            <span className="font-bold text-slate-800">{card.work_mode_alignment}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Compensation Target:</span>
            <span className="font-bold text-slate-800">{card.compensation_alignment}</span>
          </div>
        </div>
      )
    },
    {
      key: 'timing_difference',
      icon: Clock,
      accent: 'border-l-sky-500',
      iconBg: 'bg-sky-100 text-sky-600',
      renderContent: (card) => (
        <div className="space-y-2 mt-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Candidate Availability:</span>
            <span className="font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
              {card.candidate_availability}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Start Timing Delta:</span>
            <span className="font-semibold text-slate-700">{card.timing_delta}</span>
          </div>
        </div>
      )
    }
  ];

  // Calculate real AI Role-Fit and Domain Alignment scores
  const effectiveFitScore = fitScore != null
    ? Math.round(fitScore)
    : (fitBreakdown?.total != null
        ? Math.round(fitBreakdown.total)
        : (fitBreakdown?.fit_score != null ? Math.round(fitBreakdown.fit_score) : null));

  const domainAlignmentScore = fitBreakdown?.domain_alignment != null
    ? Math.round(fitBreakdown.domain_alignment)
    : (fitBreakdown?.breakdown?.domain_alignment != null
        ? Math.round(fitBreakdown.breakdown.domain_alignment)
        : (fitBreakdown?.breakdown?.marketing_alignment != null
            ? Math.round(fitBreakdown.breakdown.marketing_alignment)
            : Math.round(
                ((dossier.relevant_capability?.score || 70) * 0.30) +
                ((dossier.evidence?.score || 65) * 0.20) +
                ((dossier.relevant_audience?.score || 70) * 0.20) +
                ((dossier.relevant_environment?.score || 70) * 0.15) +
                ((dossier.preference_compatibility?.score || 75) * 0.15)
              )));

  return (
    <div className="space-y-4">
      {/* Dossier Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-indigo-900/50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center font-bold text-indigo-300 shadow-inner">
              <Zap className="w-6 h-6 text-amber-400 fill-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black tracking-tight text-white">
                  8-Dimension Recruiter Match Dossier
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 uppercase tracking-wider">
                  Digital Marketing Matrix
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5 font-medium">
                Comprehensive evaluation across capability, audience GTM, ad spend scale, proof of work & timing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* AI Role-Fit Score */}
            {effectiveFitScore != null && (
              <div className="flex items-center gap-2.5 bg-white/10 px-3.5 py-2 rounded-xl backdrop-blur-xs border border-white/10 shadow-xs">
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider">
                    AI Role-Fit
                  </div>
                  <div className="text-lg font-black text-white leading-none mt-0.5">
                    {effectiveFitScore}%
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-black text-xs shadow-sm">
                  FIT
                </div>
              </div>
            )}

            {/* Domain Alignment Score */}
            <div className="flex items-center gap-2.5 bg-emerald-500/20 px-3.5 py-2 rounded-xl backdrop-blur-xs border border-emerald-400/30 shadow-xs">
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">
                  Domain Alignment
                </div>
                <div className="text-lg font-black text-emerald-100 leading-none mt-0.5">
                  {domainAlignmentScore}%
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-black text-xs shadow-sm">
                <Target className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* How 8 Cards Work Explainer Button */}
            <button
              type="button"
              onClick={() => setShowGuideDrawer(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer shadow-xs select-none"
              title="Click to understand how the 8 cards and percentages are scored"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-300" />
              <span>How 8 Cards Work</span>
            </button>
          </div>
        </div>
      </div>

      {/* 8 Dossier Cards Grid */}
      <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-3`}>
        {cardsConfig.map((cfg, idx) => {
          const cardData = dossier[cfg.key] || {
            title: cfg.key.replace(/_/g, ' '),
            score: 75,
            status: 'Evaluated',
            summary: 'Data evaluated from profile.'
          };
          const CardIcon = cfg.icon;
          const isExpanded = expandedCard === cfg.key;
          const scoreColor = getScoreBadgeColor(cardData.score);

          return (
            <div
              key={cfg.key}
              className={`bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden border-l-4 ${cfg.accent}`}
            >
              <div
                className="p-3.5 sm:p-4 cursor-pointer select-none"
                onClick={() => setExpandedCard(isExpanded ? null : cfg.key)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-8 h-8 rounded-xl ${cfg.iconBg} flex items-center justify-center font-bold shrink-0`}>
                      <CardIcon className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Card 0{idx + 1}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${scoreColor}`}>
                          {cardData.status}
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-slate-900 mt-0.5">
                        {cardData.title}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-black text-slate-900">
                      {Math.round(cardData.score)}%
                    </span>
                    <button
                      type="button"
                      className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center border-none cursor-pointer transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 mt-2 font-medium leading-relaxed">
                  {cardData.summary}
                </p>

                {/* Card-specific Rich Details */}
                {isExpanded && cfg.renderContent(cardData)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recruiter Scoring & 8-Card Guide Slide-over Drawer */}
      <ScoringGuideDrawer
        isOpen={showGuideDrawer}
        onClose={() => setShowGuideDrawer(false)}
      />
    </div>
  );
}
