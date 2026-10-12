/**
 * Unified AI Match & Domain Alignment Scorer for Candidate & Recruiter views
 * Mirrors the backend CandidateScorer engine in app.services.scoring
 * Guarantees consistent % numbers across JobSearch, SavedJobs, MyApplications, and Recruiter views.
 */

function normalizeText(text) {
  if (!text) return '';
  return String(text).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
}

export function computeUnifiedJobMatch(job, profileData, appliedApp = null) {
  if (!job) {
    return {
      score: 0,
      roleFitScore: 0,
      domainAlignment: 0,
      skillsScore: 0,
      jdScore: 0,
      matchedSkills: [],
      missingSkills: [],
      matchedCount: 0,
      missingCount: 0,
      totalSkills: 0,
      badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
      barClass: 'bg-slate-500',
      verdict: 'Incomplete',
      isOfficial: false
    };
  }


  const profile = profileData?.profile || profileData || {};

  // Extract candidate profile skills, capabilities, and tools
  const candidateSkills = [];
  if (Array.isArray(profile.skills)) {
    profile.skills.forEach(s => candidateSkills.push(String(s).trim()));
  } else if (typeof profile.skills === 'string') {
    profile.skills.split(',').forEach(s => candidateSkills.push(s.trim()));
  }

  // Marketing capabilities
  const specialisations = Array.isArray(profile.specialisations_data) ? profile.specialisations_data : [];
  specialisations.forEach(item => {
    if (item.capability) candidateSkills.push(String(item.capability).trim());
    if (item.name) candidateSkills.push(String(item.name).trim());
    if (item.specialisation) candidateSkills.push(String(item.specialisation).trim());
  });

  // Tools proficiency
  const tools = Array.isArray(profile.tools_proficiency) ? profile.tools_proficiency : [];
  tools.forEach(t => {
    if (typeof t === 'string') candidateSkills.push(t);
    else if (t?.tool) candidateSkills.push(t.tool);
  });

  const cleanCandSkills = candidateSkills.map(s => normalizeText(s)).filter(Boolean);
  const candTitle = normalizeText(profile.title || '');
  const candSummary = normalizeText(profile.summary || '');

  // ── Dimension 1: Skills Match ──
  let jobSkills = [];
  if (Array.isArray(job.skills)) jobSkills = job.skills;
  else if (typeof job.skills === 'string') jobSkills = job.skills.split(',').map(s => s.trim());
  jobSkills = jobSkills.filter(Boolean);

  const matchedSkills = [];
  const missingSkills = [];

  jobSkills.forEach(reqSkill => {
    const reqClean = normalizeText(reqSkill);
    if (!reqClean) return;

    const isMatch =
      cleanCandSkills.some(cs => cs === reqClean || cs.includes(reqClean) || reqClean.includes(cs)) ||
      candTitle.includes(reqClean) ||
      candSummary.includes(reqClean);

    if (isMatch) matchedSkills.push(reqSkill);
    else missingSkills.push(reqSkill);
  });

  const totalReq = jobSkills.length;
  let skillsScore = totalReq > 0 ? Math.round((matchedSkills.length / totalReq) * 100) : 75;

  // 1. IF OFFICIAL APPLIED APPLICATION EXISTS: Use official backend scores for 100% parity
  if (appliedApp && (appliedApp.fit_score != null || appliedApp.fit_breakdown?.total != null)) {
    const officialFit = Math.round(appliedApp.fit_score != null ? appliedApp.fit_score : appliedApp.fit_breakdown.total);
    const breakdown = appliedApp.fit_breakdown?.breakdown || appliedApp.fit_breakdown || {};
    const officialDomain = Math.round(
      appliedApp.domain_alignment != null
        ? appliedApp.domain_alignment
        : (appliedApp.fit_breakdown?.domain_alignment != null
            ? appliedApp.fit_breakdown.domain_alignment
            : (breakdown.domain_alignment || breakdown.marketing_alignment || officialFit))
    );
    const officialSkills = breakdown.skills != null ? Math.round(breakdown.skills) : skillsScore;
    const officialJd = Math.round(breakdown.relevance != null ? (breakdown.relevance > 0 ? breakdown.relevance : 60) : 60);

    let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
    let barClass = 'bg-emerald-500';
    let verdict = 'Strong Match';
    if (officialFit < 50 || officialSkills < 50 || matchedSkills.length < totalReq) {
      badgeClass = 'bg-rose-50 text-rose-700 border-rose-200/80';
      barClass = 'bg-rose-500';
      verdict = 'Skill Gap Detected';
    } else if (officialFit < 75) {
      badgeClass = 'bg-amber-50 text-amber-700 border-amber-200/80';
      barClass = 'bg-amber-500';
      verdict = 'Good Match';
    }

    return {
      score: officialFit,
      roleFitScore: officialFit,
      domainAlignment: officialDomain,
      skillsScore: officialSkills,
      jdScore: officialJd,
      matchedSkills,
      missingSkills,
      matchedCount: matchedSkills.length,
      missingCount: missingSkills.length,
      totalSkills: totalReq,
      badgeClass,
      barClass,
      verdict,
      marketingMatch: true,
      gtmMatch: true,
      caseStudiesCount: Array.isArray(profile.case_studies) ? profile.case_studies.length : 0,
      isOfficial: true,
      breakdown: appliedApp.fit_breakdown
    };
  }

  // 2. DYNAMIC REAL-DATA MULTI-DIMENSIONAL SCORING (Mirroring backend CandidateScorer)
  // ── Dimension 2: Experience Depth ──
  const reqExp = job.min_experience || 0;
  const candExpYears = profile.years_of_experience || (Array.isArray(profile.experience) ? profile.experience.length * 1.5 : 2);
  let expScore = candExpYears >= reqExp ? 85 : Math.max(30, Math.round((candExpYears / Math.max(1, reqExp)) * 80));

  // ── Dimension 3: Role Relevance ──
  const jobTitleNorm = normalizeText(job.title || '');
  let relevanceScore = 0;
  if (candTitle && (candTitle.includes(jobTitleNorm) || jobTitleNorm.includes(candTitle))) {
    relevanceScore = 95;
  } else if (candTitle) {
    const candTitleWords = candTitle.split(' ').filter(w => w.length > 3);
    if (candTitleWords.some(w => jobTitleNorm.includes(w))) relevanceScore = 80;
    else relevanceScore = 0;
  }

  // ── Dimension 4: Completeness & Tools ──
  const compScore = Math.min(100, Math.max(50, (cleanCandSkills.length > 5 ? 85 : 65) + (profile.resume_url ? 15 : 0)));

  // Base Composite (45% general fit)
  const baseScore = (skillsScore * 0.35) + (expScore * 0.30) + (relevanceScore * 0.25) + (compScore * 0.10);

  // ── Dimension 5: Marketing Domain Matrix Alignment (55% domain fit) ──
  // A. Capability & Ownership (Target: 80% for verified discipline & execution)
  let capScore = 60;
  const jobSpecNorm = normalizeText(job.specialization || '');
  const primarySpec = profile.career_interests?.primary_specialisation || '';
  const primarySpecNorm = normalizeText(primarySpec);

  if (jobSpecNorm && (primarySpecNorm.includes(jobSpecNorm) || jobSpecNorm.includes(primarySpecNorm))) {
    capScore = 85;
  } else if (jobSpecNorm && cleanCandSkills.some(cs => cs.includes(jobSpecNorm))) {
    capScore = 80;
  } else if (specialisations.length > 0 || primarySpec) {
    // Verified discipline with executed capabilities
    capScore = 80;
  }
  if (matchedSkills.length > 0) {
    capScore = Math.min(100, capScore + Math.min(15, matchedSkills.length * 5));
  }
  capScore = Math.min(100, Math.max(35, Math.round(capScore)));

  // B. Audience & GTM Context (Target: 95% for B2B/aligned audience)
  const rawModel = profile.gtm_experience?.customer_model;
  const candModels = Array.isArray(rawModel) ? rawModel : (rawModel ? [rawModel] : []);
  const jobModelNorm = normalizeText(job.business_model || job.business_context?.business_model || 'b2b');
  let gtmScore = 65;
  if (candModels.length > 0) {
    const hasGtmMatch = candModels.some(m => {
      const mNorm = normalizeText(m);
      return jobModelNorm && (jobModelNorm.includes(mNorm) || mNorm.includes(jobModelNorm) || mNorm === 'b2b');
    });
    if (hasGtmMatch) gtmScore = 95;
    else if (!jobModelNorm) gtmScore = 85;
    else gtmScore = 70;
  } else {
    gtmScore = 75;
  }
  gtmScore = Math.min(100, Math.max(35, Math.round(gtmScore)));

  // C. Environment & Budget Scale (Target: 80% for scale managed)
  const candSpend = profile.execution_environment?.largest_monthly_spend || '';
  let envScore = candSpend ? 80 : 70;

  // D. Proof of Work / Evidence (Target: 90% for verified ROI case study)
  const caseStudies = Array.isArray(profile.case_studies) ? profile.case_studies : [];
  const csCount = caseStudies.length;
  const hasMetrics = caseStudies.some(cs => Boolean(cs.results_metrics || (cs.before_metric && cs.after_metric)));
  let evidenceScore = 40;
  if (csCount >= 2 && hasMetrics) evidenceScore = 95;
  else if (csCount >= 1 && hasMetrics) evidenceScore = 90;
  else if (csCount >= 1) evidenceScore = 80;
  else if (profile.portfolio_url || profile.resume_url) evidenceScore = 65;

  // E. Preference & Setup Compatibility (Target: 90% for aligned hybrid/comp)
  const candMode = profile.career_interests?.preferred_arrangement || profile.hiring_preferences?.work_mode || '';
  const jobWorkMode = normalizeText(job.work_mode || '');
  let prefScore = 75;
  if (candMode) {
    const cmNorm = normalizeText(candMode);
    if (jobWorkMode && (jobWorkMode.includes(cmNorm) || cmNorm.includes(jobWorkMode) || cmNorm.includes('open') || cmNorm.includes('any') || cmNorm.includes('hybrid'))) {
      prefScore = 90;
    } else if (jobWorkMode) {
      prefScore = 70;
    }
  } else {
    prefScore = 85;
  }

  // Combined Domain Alignment (weighted 30% cap, 20% evi, 20% gtm, 15% env, 15% pref)
  // (80 * 0.30) + (90 * 0.20) + (95 * 0.20) + (80 * 0.15) + (90 * 0.15) = 24 + 18 + 19 + 12 + 13.5 = 86.5 ≈ 86%
  const domainAlignment = Math.min(100, Math.max(25, Math.round(
    (capScore * 0.30) +
    (evidenceScore * 0.20) +
    (gtmScore * 0.20) +
    (envScore * 0.15) +
    (prefScore * 0.15)
  )));

  // Overall Composite AI Role-Fit Score: 45% base + 55% domain
  // When skills = 0, baseScore ~ 25%, finalRoleFit = (25.5 * 0.45) + (86.5 * 0.55) = 11.4 + 47.6 = 59% ≈ 60%
  const finalRoleFit = Math.min(100, Math.max(20, Math.round(
    (baseScore * 0.45) + (domainAlignment * 0.55)
  )));

  let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
  let barClass = 'bg-emerald-500';
  let verdict = 'Strong Match';

  if (finalRoleFit < 50 || skillsScore < 50 || matchedSkills.length < totalReq) {
    badgeClass = 'bg-rose-50 text-rose-700 border-rose-200/80';
    barClass = 'bg-rose-500';
    verdict = 'Skill Gap Detected';
  } else if (finalRoleFit < 75) {
    badgeClass = 'bg-amber-50 text-amber-700 border-amber-200/80';
    barClass = 'bg-amber-500';
    verdict = 'Good Match';
  }

  return {
    score: finalRoleFit,
    roleFitScore: finalRoleFit,
    domainAlignment,
    skillsScore,
    jdScore: 60, // JD relevance baseline
    matchedSkills,
    missingSkills,
    matchedCount: matchedSkills.length,
    missingCount: missingSkills.length,
    totalSkills: totalReq,
    badgeClass,
    barClass,
    verdict,
    marketingMatch: Boolean(jobSpecNorm && (primarySpecNorm.includes(jobSpecNorm) || jobSpecNorm.includes(primarySpecNorm))),
    gtmMatch: gtmScore >= 80,
    caseStudiesCount: csCount,
    isOfficial: false
  };
}
