"""
AI-Powered Candidate Scoring Engine
Multi-signal scoring across 6 dimensions to rank applicants for a job.
No external AI API needed — runs entirely on structured profile data.
"""
import re
from typing import List, Optional


# ── Scoring Weights (total = 100%) ──────────────────────────────────────
WEIGHTS = {
    "skills":       0.30,   # 30%  — Skills match
    "experience":   0.25,   # 25%  — Experience depth (years + recency)
    "relevance":    0.20,   # 20%  — Role/title relevance to job
    "education":    0.10,   # 10%  — Education quality + field match
    "seniority":    0.10,   # 10%  — Career trajectory / growth pattern
    "completeness": 0.05,   # 5%   — Profile completeness
}

# ── Seniority keyword tiers ─────────────────────────────────────────────
SENIORITY_KEYWORDS = {
    "intern":       1,
    "trainee":      1,
    "fresher":      1,
    "junior":       2,
    "associate":    2,
    "entry":        2,
    "mid":          3,
    "intermediate": 3,
    "senior":       4,
    "lead":         5,
    "principal":    5,
    "staff":        5,
    "architect":    5,
    "manager":      5,
    "head":         6,
    "director":     6,
    "vp":           7,
    "vice president": 7,
    "cto":          8,
    "ceo":          8,
    "co-founder":   8,
    "founder":      8,
}

# ── Education degree tiers ──────────────────────────────────────────────
DEGREE_TIERS = {
    "phd":          5,
    "doctorate":    5,
    "ph.d":         5,
    "master":       4,
    "mba":          4,
    "mtech":        4,
    "m.tech":       4,
    "ms":           4,
    "m.s":          4,
    "mca":          4,
    "m.sc":         4,
    "bachelor":     3,
    "btech":        3,
    "b.tech":       3,
    "b.e":          3,
    "bca":          3,
    "b.sc":         3,
    "bs":           3,
    "b.s":          3,
    "bba":          3,
    "diploma":      2,
    "associate":    2,
    "certificate":  1,
    "certification": 1,
    "bootcamp":     1,
    "course":       1,
}

# ── Tech/field relevance keywords ───────────────────────────────────────
TECH_FIELDS = {
    "computer science", "software engineering", "information technology",
    "computer engineering", "data science", "artificial intelligence",
    "machine learning", "cybersecurity", "digital marketing",
    "web development", "mobile development", "cloud computing",
    "devops", "full stack", "frontend", "backend", "ui/ux",
    "design", "product management", "marketing", "analytics",
    "business", "finance", "economics", "statistics", "mathematics",
}


def _normalize(text: str) -> str:
    """Lowercase and strip a string for fuzzy comparison."""
    if not text:
        return ""
    return re.sub(r'[^a-z0-9\s]', '', text.lower().strip())


def _extract_years(text: str) -> float:
    """Extract numeric duration in years from a string."""
    if not text:
        return 0
    text = text.lower().strip()
    CURRENT_YEAR = 2026

    # 1. Check for calendar year ranges like "2019 - 2021" or "2019-2021"
    year_range_match = re.search(r'(\b\d{4}\b)\s*[-–to/]+\s*(\b\d{4}\b)', text)
    if year_range_match:
        y1 = int(year_range_match.group(1))
        y2 = int(year_range_match.group(2))
        return max(0.5, min(float(abs(y2 - y1)), 40.0))

    # 2. Check for calendar year to present like "2021 - Present", "2022 - current"
    present_match = re.search(r'(\b\d{4}\b)\s*[-–to/]+\s*(?:present|current|now|ongoing)', text)
    if present_match:
        y1 = int(present_match.group(1))
        return max(0.5, min(float(CURRENT_YEAR - y1), 40.0))

    # 3. Check for duration strings like "3-5 years", "2 - 4 yrs"
    dur_range = re.search(r'(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)\s*(?:years?|yrs?)?', text)
    if dur_range:
        v1 = float(dur_range.group(1))
        v2 = float(dur_range.group(2))
        if v1 < 50 and v2 < 50:  # Not calendar years
            return (v1 + v2) / 2

    # 4. Check for "5+ years", "3 yrs", "2.5 years"
    single_match = re.search(r'(\d+(?:\.\d+)?)\s*\+?\s*(?:year|yr)', text)
    if single_match:
        val = float(single_match.group(1))
        if val < 60:
            return val

    # 5. Check for months like "6 months"
    month_match = re.search(r'(\d+)\s*(?:month|mo)', text)
    if month_match:
        return round(float(month_match.group(1)) / 12, 1)

    return 0


def _fuzzy_skill_match(candidate_skill: str, job_skill: str) -> bool:
    """Check if a candidate skill matches a job skill (case-insensitive, partial)."""
    cs = _normalize(candidate_skill)
    js = _normalize(job_skill)
    if not cs or not js:
        return False
    # Exact match
    if cs == js:
        return True
    # One contains the other
    if cs in js or js in cs:
        return True
    # Word-level overlap (e.g., "react js" matches "react.js")
    cs_words = set(cs.split())
    js_words = set(js.split())
    if cs_words & js_words and len(cs_words & js_words) / max(len(js_words), 1) >= 0.5:
        return True
    return False


def _calculate_experience_years(experience_list: list) -> float:
    """Estimate total years from candidate's experience entries."""
    if not experience_list or not isinstance(experience_list, list):
        return 0
    total = 0.0
    CURRENT_YEAR = 2026
    for exp in experience_list:
        if isinstance(exp, dict):
            # Try to extract duration from 'duration' field
            duration = exp.get("duration", "")
            if duration:
                years = _extract_years(str(duration))
                if years > 0:
                    total += years
                    continue
            # Fallback: estimate from start/end dates
            start = exp.get("start_date") or exp.get("from") or exp.get("start") or ""
            end = exp.get("end_date") or exp.get("to") or exp.get("end") or ""
            if start:
                sy_match = re.search(r'(\b\d{4}\b)', str(start))
                ey_match = re.search(r'(\b\d{4}\b)', str(end)) if end else None
                if sy_match:
                    sy = int(sy_match.group(1))
                    ey = int(ey_match.group(1)) if ey_match else CURRENT_YEAR
                    diff = max(0.5, float(ey - sy))
                    total += min(diff, 30.0)
                    continue
            # If no parseable dates, assume 1 year per entry
            total += 1.0
    return min(round(total, 1), 50.0)


def _get_seniority_level(title: str) -> int:
    """Extract seniority level from a job title string."""
    if not title:
        return 1
    t = _normalize(title)
    best = 1
    for keyword, level in SENIORITY_KEYWORDS.items():
        if keyword in t:
            best = max(best, level)
    return best


# ═══════════════════════════════════════════════════════════════════════
#   MAIN SCORER CLASS
# ═══════════════════════════════════════════════════════════════════════

class CandidateScorer:
    """Scores a candidate against a job posting across 6 core dimensions + 8-card marketing match dossier."""

    def __init__(self, job: dict):
        """
        Initialize with job data.
        job should have: title, description, skills[], experience_level,
                         specialization, must_have_capabilities,
                         preferred_capabilities, min_experience, ownership_level,
                         business_model, monthly_budget_range, etc.
        """
        self.job = job or {}
        self.job_skills = [_normalize(s) for s in (job.get("skills") or []) if s]
        self.job_title = _normalize(job.get("title", ""))
        self.job_desc = _normalize(job.get("description", ""))
        self.job_specialization = _normalize(job.get("specialization", ""))
        self.job_exp_level = _normalize(job.get("experience_level", ""))
        self.job_min_exp = _extract_years(job.get("min_experience", ""))
        self.must_have = _normalize(job.get("must_have_capabilities", ""))
        self.preferred = _normalize(job.get("preferred_capabilities", ""))
        self.job_ownership_level = _normalize(job.get("ownership_level", ""))
        self.job_work_mode = _normalize(job.get("work_mode", ""))
        self.job_job_type = _normalize(job.get("job_type", ""))
        self.job_business_model = _normalize(job.get("business_model", ""))
        self.job_budget_range = str(job.get("monthly_budget_range", "") or "")
        self.job_growth_stage = _normalize(job.get("growth_stage", ""))
        self.job_target_audience = _normalize(job.get("target_audience", ""))
        self.job_availability_req = _normalize(job.get("availability_requirement", ""))
        self.job_salary_min = job.get("salary_min")
        self.job_salary_max = job.get("salary_max")
        self.job_salary_currency = job.get("salary_currency", "USD")

    def score(self, candidate: dict) -> dict:
        """
        Score a candidate and return breakdown, 8-dimension match dossier, and total.

        Returns: {
            "total": 0-100,
            "breakdown": { "skills": X, "experience": X, ..., "marketing_alignment": X },
            "highlights": ["Strong skill match", ...],
            "gaps": ["Missing 2 required skills", ...],
            "dossier": {
                "relevant_capability": { ... },
                "relevant_audience": { ... },
                "relevant_environment": { ... },
                "evidence": { ... },
                "transferable_experience": { ... },
                "needs_clarification": { ... },
                "preference_compatibility": { ... },
                "timing_difference": { ... }
            }
        }
        """
        scores = {
            "skills":       self._score_skills(candidate),
            "experience":   self._score_experience(candidate),
            "relevance":    self._score_relevance(candidate),
            "education":    self._score_education(candidate),
            "seniority":    self._score_seniority(candidate),
            "completeness": self._score_completeness(candidate),
        }

        base_total = sum(scores[k] * WEIGHTS.get(k, 0) for k in WEIGHTS)
        base_total = round(min(100.0, max(0.0, base_total)), 1)

        # Generate 8-dimension marketing match dossier
        dossier = self._generate_dossier(candidate, scores)

        # Calculate real Domain Alignment from dossier cards
        domain_alignment = self._score_marketing_alignment(dossier)
        scores["marketing_alignment"] = domain_alignment
        scores["domain_alignment"] = domain_alignment

        # Check if candidate or job has marketing-specific data
        has_marketing_data = bool(
            candidate.get("specialisations_data") or
            candidate.get("gtm_experience") or
            candidate.get("case_studies") or
            candidate.get("execution_environment") or
            self.job_specialization or
            self.job_business_model
        )

        if has_marketing_data:
            # Blend core general score (45%) with marketing domain dossier match (55%)
            total = (base_total * 0.45) + (domain_alignment * 0.55)
        else:
            total = base_total

        total = round(min(100.0, max(0.0, total)), 1)
        highlights, gaps = self._generate_insights(candidate, scores, dossier)

        return {
            "total": total,
            "fit_score": total,
            "domain_alignment": domain_alignment,
            "breakdown": {
                **{k: round(v, 1) for k, v in scores.items()},
                "domain_alignment": domain_alignment,
                "marketing_alignment": domain_alignment
            },
            "domain_matrix": {
                "capability_score": dossier.get("relevant_capability", {}).get("score", 0),
                "audience_score": dossier.get("relevant_audience", {}).get("score", 0),
                "environment_score": dossier.get("relevant_environment", {}).get("score", 0),
                "evidence_score": dossier.get("evidence", {}).get("score", 0),
                "preferences_score": dossier.get("preference_compatibility", {}).get("score", 0),
            },
            "highlights": highlights,
            "gaps": gaps,
            "dossier": dossier,
        }

    # ── Dimension 1: Skills Match (0-100) ───────────────────────────────
    def _score_skills(self, candidate: dict) -> float:
        cand_skills = [_normalize(s) for s in (candidate.get("skills") or []) if s]
        cand_expertise = [_normalize(s) for s in (candidate.get("expertise") or []) if s]
        all_cand = set(cand_skills + cand_expertise)

        if not self.job_skills:
            return 75  # No skills required = neutral score

        matched = 0
        for js in self.job_skills:
            for cs in all_cand:
                if _fuzzy_skill_match(cs, js):
                    matched += 1
                    break

        skill_ratio = matched / len(self.job_skills)

        # Must-have capabilities bonus/penalty
        must_have_bonus = 0
        if self.must_have:
            must_have_words = set(self.must_have.split())
            matching_must = sum(1 for w in must_have_words if any(w in cs for cs in all_cand))
            if must_have_words:
                must_have_bonus = (matching_must / len(must_have_words)) * 15

        # Preferred capabilities bonus
        preferred_bonus = 0
        if self.preferred:
            pref_words = set(self.preferred.split())
            matching_pref = sum(1 for w in pref_words if any(w in cs for cs in all_cand))
            if pref_words:
                preferred_bonus = (matching_pref / len(pref_words)) * 10

        # Extra skills beyond requirements (shows breadth)
        breadth_bonus = min(10, len(all_cand) * 0.5) if len(all_cand) > len(self.job_skills) else 0

        score = (skill_ratio * 65) + must_have_bonus + preferred_bonus + breadth_bonus
        return min(100, score)

    # ── Dimension 2: Experience Depth (0-100) ────────────────────────────
    def _score_experience(self, candidate: dict) -> float:
        exp_list = candidate.get("experience") or []
        total_years = _calculate_experience_years(exp_list)
        num_roles = len(exp_list) if isinstance(exp_list, list) else 0

        # Compare against job's minimum experience
        if self.job_min_exp > 0:
            exp_ratio = min(2.0, total_years / self.job_min_exp)
            base_score = exp_ratio * 50
        else:
            # No min specified: reward experience proportionally (cap at 15 years = 100)
            base_score = min(100, (total_years / 15) * 60)

        # Role diversity bonus (multiple roles = broader experience)
        diversity_bonus = min(20, num_roles * 4)

        # Penalty for zero experience
        if total_years == 0 and num_roles == 0:
            return 5

        return min(100, base_score + diversity_bonus)

    # ── Dimension 3: Role Relevance (0-100) ──────────────────────────────
    def _score_relevance(self, candidate: dict) -> float:
        cand_title = _normalize(candidate.get("title", ""))
        cand_summary = _normalize(candidate.get("summary", ""))
        exp_list = candidate.get("experience") or []

        score = 0

        # Current title match
        if cand_title:
            title_words = set(self.job_title.split())
            cand_title_words = set(cand_title.split())
            overlap = title_words & cand_title_words
            if title_words:
                score += (len(overlap) / len(title_words)) * 35

        # Summary relevance (keyword overlap with job description)
        if cand_summary and self.job_desc:
            desc_words = set(self.job_desc.split())
            summary_words = set(cand_summary.split())
            # Filter out common stop words
            stop_words = {"the", "a", "an", "and", "or", "is", "are", "was", "were",
                          "in", "on", "at", "to", "for", "of", "with", "by", "from",
                          "as", "we", "you", "our", "this", "that", "will", "be", "can",
                          "have", "has", "do", "does", "not", "but", "its", "all", "your"}
            desc_meaningful = desc_words - stop_words
            summary_meaningful = summary_words - stop_words
            if desc_meaningful:
                overlap = desc_meaningful & summary_meaningful
                score += (len(overlap) / min(len(desc_meaningful), 30)) * 25

        # Past role titles relevance
        if isinstance(exp_list, list):
            role_relevance_hits = 0
            job_title_words = set(self.job_title.split())
            spec_words = set(self.job_specialization.split()) if self.job_specialization else set()
            all_job_words = job_title_words | spec_words
            for exp in exp_list:
                if isinstance(exp, dict):
                    role_title = _normalize(exp.get("title") or exp.get("role") or exp.get("position", ""))
                    role_words = set(role_title.split())
                    if all_job_words & role_words:
                        role_relevance_hits += 1
            if exp_list:
                score += min(40, (role_relevance_hits / max(len(exp_list), 1)) * 40)

        return min(100, score)

    # ── Dimension 4: Education Quality (0-100) ───────────────────────────
    def _score_education(self, candidate: dict) -> float:
        edu_list = candidate.get("education") or []
        certs = candidate.get("certifications") or []

        if not edu_list and not certs:
            return 15  # No education data

        best_degree_tier = 0
        field_relevance = 0

        if isinstance(edu_list, list):
            for edu in edu_list:
                if isinstance(edu, dict):
                    degree = _normalize(edu.get("degree") or edu.get("qualification", ""))
                    field = _normalize(edu.get("field") or edu.get("major") or edu.get("specialization", ""))

                    # Degree tier
                    for key, tier in DEGREE_TIERS.items():
                        if key in degree:
                            best_degree_tier = max(best_degree_tier, tier)
                            break

                    # Field relevance
                    for tech_field in TECH_FIELDS:
                        if tech_field in field or tech_field in degree:
                            field_relevance = max(field_relevance, 1)
                            break

        # Degree tier score (0-50)
        degree_score = min(50, (best_degree_tier / 5) * 50)

        # Field relevance score (0-30)
        field_score = field_relevance * 30

        # Certifications bonus (0-20)
        cert_count = len(certs) if isinstance(certs, list) else 0
        cert_score = min(20, cert_count * 5)

        return min(100, degree_score + field_score + cert_score)

    # ── Dimension 5: Seniority Trajectory (0-100) ────────────────────────
    def _score_seniority(self, candidate: dict) -> float:
        exp_list = candidate.get("experience") or []
        cand_title = candidate.get("title", "")

        if not exp_list and not cand_title:
            return 10

        # Get seniority levels over career
        levels = []
        if isinstance(exp_list, list):
            for exp in exp_list:
                if isinstance(exp, dict):
                    title = exp.get("title") or exp.get("role") or exp.get("position", "")
                    level = _get_seniority_level(title)
                    levels.append(level)

        current_level = _get_seniority_level(cand_title) if cand_title else (levels[-1] if levels else 1)

        # Current seniority score (0-50)
        seniority_score = min(50, (current_level / 8) * 50)

        # Growth trajectory bonus: did they progress upward? (0-30)
        growth_score = 0
        if len(levels) >= 2:
            upward_moves = sum(1 for i in range(1, len(levels)) if levels[i] > levels[i - 1])
            growth_ratio = upward_moves / (len(levels) - 1)
            growth_score = growth_ratio * 30

        # Match against job's experience level (0-20)
        level_match = 0
        if self.job_exp_level:
            job_seniority = _get_seniority_level(self.job_exp_level)
            diff = abs(current_level - job_seniority)
            if diff == 0:
                level_match = 20
            elif diff == 1:
                level_match = 14
            elif diff == 2:
                level_match = 8
            else:
                level_match = 3

        return min(100, seniority_score + growth_score + level_match)

    # ── Dimension 6: Profile Completeness (0-100) ────────────────────────
    def _score_completeness(self, candidate: dict) -> float:
        checks = [
            bool(candidate.get("full_name")),
            bool(candidate.get("title")),
            bool(candidate.get("summary") and len(str(candidate.get("summary", ""))) > 20),
            bool(candidate.get("skills") and len(candidate.get("skills", [])) > 0),
            bool(candidate.get("experience") and len(candidate.get("experience", [])) > 0),
            bool(candidate.get("education") and len(candidate.get("education", [])) > 0),
            bool(candidate.get("resume_url")),
            bool(candidate.get("portfolio_url")),
            bool(candidate.get("avatar_url")),
            bool(candidate.get("phone")),
            bool(candidate.get("city") or candidate.get("state")),
            bool(candidate.get("certifications") and len(candidate.get("certifications", [])) > 0),
            bool(candidate.get("expertise") and len(candidate.get("expertise", [])) > 0),
        ]
        filled = sum(checks)
        return round((filled / len(checks)) * 100, 1)

    # ── Generate Human-Readable Insights ─────────────────────────────────
    # ── Score Marketing Domain Alignment (0-100) ─────────────────────────
    def _score_marketing_alignment(self, dossier: dict) -> float:
        """Calculate aggregate domain alignment from the 8-dimension dossier."""
        if not dossier:
            return 70.0
        
        # Weighted blend of the 5 primary capability and proof dimensions
        cap = dossier.get("relevant_capability", {}).get("score", 70.0)
        aud = dossier.get("relevant_audience", {}).get("score", 70.0)
        env = dossier.get("relevant_environment", {}).get("score", 70.0)
        evi = dossier.get("evidence", {}).get("score", 70.0)
        tra = dossier.get("transferable_experience", {}).get("score", 70.0)
        pre = dossier.get("preference_compatibility", {}).get("score", 75.0)

        # 30% Capability + 20% Proof + 20% Audience + 15% Environment + 15% Preferences
        domain_total = (cap * 0.30) + (evi * 0.20) + (aud * 0.20) + (env * 0.15) + (pre * 0.15)
        return min(100.0, max(10.0, domain_total))

    # ── Generate 8-Dimension Recruiter Match Dossier ──────────────────────
    def _generate_dossier(self, candidate: dict, scores: dict) -> dict:
        """
        Generate the 8-Dimension Recruiter Match Dossier:
        1. Relevant Capability (Discipline depth, capabilities & ownership)
        2. Relevant Audience & GTM Context (Customer model, buying cycles)
        3. Relevant Environment & Budget Scale (Ad spend, team setup)
        4. Evidence of Performance (Verified proof of work & before/after ROI)
        5. Transferable Experience & Tools (Secondary disciplines & platforms)
        6. Needs Clarification (Interview probes & gaps)
        7. Preference Compatibility (Work arrangement & compensation)
        8. Timing & Availability Alignment (Notice period vs start requirement)
        """
        specialisations = candidate.get("specialisations_data") or []
        gtm = candidate.get("gtm_experience") or {}
        case_studies = candidate.get("case_studies") or []
        execution_env = candidate.get("execution_environment") or {}
        tools_list = candidate.get("tools_proficiency") or []
        interests = candidate.get("career_interests") or {}

        # ── 1. Relevant Capability
        primary_spec_id = interests.get("primary_specialisation") or ""
        cand_caps = []
        primary_name = ""

        # Check if specialisations_data is flat array of { capability, specialisation_id, ... }
        if specialisations and isinstance(specialisations[0], dict) and ("capability" in specialisations[0] or "specialisation_id" in specialisations[0]):
            for c in specialisations:
                cap_name = c.get("capability") or c.get("name") or ""
                if cap_name:
                    cand_caps.append({
                        "name": cap_name,
                        "proficiency": c.get("proficiency", "Works independently"),
                        "ownership": c.get("ownership", "Personally executed"),
                        "specialisation_id": c.get("specialisation_id", "")
                    })
            if primary_spec_id:
                primary_name = primary_spec_id.replace("_", " ").title()
            elif cand_caps and cand_caps[0].get("specialisation_id"):
                primary_name = cand_caps[0]["specialisation_id"].replace("_", " ").title()
        else:
            # Nested { name, capabilities: [...] }
            primary_spec = next((s for s in specialisations if s.get("type") == "primary"), None)
            if not primary_spec and specialisations:
                primary_spec = specialisations[0]
            primary_name = primary_spec.get("name") if primary_spec else ""
            for c in (primary_spec.get("capabilities", []) if primary_spec else []):
                cap_name = c.get("name") or c.get("capability") or ""
                if cap_name:
                    cand_caps.append({
                        "name": cap_name,
                        "proficiency": c.get("proficiency", "Proficient"),
                        "ownership": c.get("ownership", "Personally executed")
                    })

        if not primary_name:
            primary_name = primary_spec_id.replace("_", " ").title() if primary_spec_id else (candidate.get("title") or "Digital Marketing")

        cap_score = 60.0
        matched_caps = []
        norm_primary = _normalize(primary_name)
        if norm_primary and self.job_specialization and (norm_primary in self.job_specialization or self.job_specialization in norm_primary):
            cap_score += 20.0
        elif self.job_specialization and any(self.job_specialization in _normalize(c.get("name", "")) for c in cand_caps):
            cap_score += 15.0

        for cap in cand_caps:
            c_name = cap.get("name", "")
            c_norm = _normalize(c_name)
            is_matched = False
            if self.must_have and any(w in self.must_have for w in c_norm.split() if len(w) > 3):
                is_matched = True
            elif any(_fuzzy_skill_match(c_norm, js) for js in self.job_skills):
                is_matched = True
            elif self.job_desc and any(w in self.job_desc for w in c_norm.split() if len(w) > 4):
                is_matched = True

            if is_matched or len(matched_caps) < 3:
                matched_caps.append({
                    "name": c_name,
                    "proficiency": cap.get("proficiency", "Works independently"),
                    "ownership": cap.get("ownership", "Personally executed")
                })

        if matched_caps:
            cap_score += min(20.0, len(matched_caps) * 6.5)

        cand_ownerships = [c.get("ownership") for c in cand_caps if c.get("ownership")]
        primary_ownership = cand_ownerships[0] if cand_ownerships else "Personally executed"
        ownership_aligned = True
        if "personally" in self.job_ownership_level and any("approved" in _normalize(o) for o in cand_ownerships) and not any("personally" in _normalize(o) for o in cand_ownerships):
            ownership_aligned = False
            cap_score = max(40.0, cap_score - 15.0)

        cap_score = round(min(100.0, max(25.0, cap_score)), 1)

        # ── 2. Relevant Audience & GTM
        raw_models = gtm.get("customer_model") or []
        cand_models = raw_models if isinstance(raw_models, list) else ([raw_models] if raw_models else [])
        cand_rtm = gtm.get("route_to_market") or gtm.get("routes_to_market") or ""
        cand_rtm_list = cand_rtm if isinstance(cand_rtm, list) else ([cand_rtm] if cand_rtm else [])

        gtm_score = 65.0
        matched_gtm = []
        if cand_models:
            job_model_norm = _normalize(self.job_business_model or "")
            for m in cand_models:
                m_norm = _normalize(m)
                if job_model_norm and (m_norm in job_model_norm or job_model_norm in m_norm):
                    matched_gtm.append(m)
                elif m_norm and (m_norm in self.job_desc or m_norm in self.job_title):
                    matched_gtm.append(m)

            if matched_gtm:
                gtm_score = 90.0 + min(10.0, len(matched_gtm) * 5.0)
            elif self.job_business_model:
                gtm_score = 60.0
            else:
                gtm_score = 80.0
                matched_gtm = cand_models[:2]

        if cand_rtm_list and any(_normalize(r) in self.job_desc for r in cand_rtm_list if r):
            gtm_score = min(100.0, gtm_score + 5.0)

        gtm_score = round(min(100.0, max(30.0, gtm_score)), 1)

        # ── 3. Relevant Environment & Budget
        largest_spend = execution_env.get("largest_monthly_spend") or ""
        if not largest_spend and case_studies:
            spends = [cs.get("ad_spend") for cs in case_studies if cs.get("ad_spend")]
            if spends:
                largest_spend = spends[0]
        if not largest_spend and gtm.get("avg_purchase_value"):
            largest_spend = f"ACV: {gtm.get('avg_purchase_value')}"

        team_setup = execution_env.get("primary_team_setup") or (candidate.get("experience", [{}])[0].get("company") if candidate.get("experience") else "In-house team")
        env_score = 75.0
        if largest_spend:
            if any(k in largest_spend for k in ["100,000", "50,000", "75,000", "2M", "1M", "500k"]):
                env_score = 92.0
            elif any(k in largest_spend for k in ["10,000", "25,000", "30,000", "15,000"]):
                env_score = 85.0
            else:
                env_score = 80.0
        env_score = round(min(100.0, env_score), 1)

        # ── 4. Evidence of Performance (Proof of Work)
        cs_count = len(case_studies)
        has_metrics = any(bool(cs.get("results_metrics") or (cs.get("before_metric") and cs.get("after_metric"))) for cs in case_studies)
        has_links = bool(candidate.get("portfolio_url")) or any(bool(cs.get("evidence_url") or cs.get("proof_url")) for cs in case_studies)
        
        cs_highlights = []
        for cs in case_studies[:2]:
            t = cs.get("title") or "Campaign"
            m = cs.get("results_metrics") or (f"{cs.get('before_metric')} → {cs.get('after_metric')}" if cs.get("before_metric") else "")
            if m:
                cs_highlights.append(f"{t}: {m}")
            elif t:
                cs_highlights.append(t)

        if cs_count >= 2 and has_metrics:
            evidence_score = 95.0
        elif cs_count >= 1 and has_metrics:
            evidence_score = 90.0
        elif cs_count >= 1:
            evidence_score = 80.0
        elif has_links:
            evidence_score = 65.0
        elif candidate.get("resume_url"):
            evidence_score = 55.0
        else:
            evidence_score = 35.0
        evidence_score = round(min(100.0, evidence_score), 1)

        # ── 5. Transferable Experience & Tools
        sec_specs = interests.get("secondary_specialisations") or [s.get("name") for s in specialisations if s.get("type") == "secondary"]
        if isinstance(sec_specs, list):
            sec_specs = [s.replace("_", " ").title() if isinstance(s, str) else str(s) for s in sec_specs]

        top_tools = []
        for t in tools_list:
            if isinstance(t, str):
                top_tools.append(t)
            elif isinstance(t, dict):
                tname = t.get("tool") or t.get("name")
                if tname:
                    top_tools.append(tname)

        trans_score = 65.0
        if sec_specs:
            trans_score += min(18.0, len(sec_specs) * 9.0)
        if top_tools:
            trans_score += min(17.0, len(top_tools) * 4.0)
        trans_score = round(min(100.0, trans_score), 1)

        # ── 6. Needs Clarification
        clarifications = []
        suggested_questions = []
        cand_avail = interests.get("joining_availability") or (candidate.get("hiring_preferences") or {}).get("availability", "")
        if cand_avail and any(x in cand_avail.lower() for x in ["2 month", "3 month", "60 day", "90 day"]):
            clarifications.append(f"Notice period is {cand_avail}")
            suggested_questions.append(f"Confirm availability to begin onboarding given {cand_avail} timeframe.")
        if cs_count == 0:
            clarifications.append("No campaign case studies or verified ROI metrics attached")
            suggested_questions.append("Can you describe a specific campaign where you achieved substantial CAC reduction or ROAS lift?")
        if self.job_ownership_level and not ownership_aligned:
            clarifications.append(f"Position requires hands-on {self.job.get('ownership_level')}; probe execution depth")
            suggested_questions.append("How much of your time is spent executing campaigns directly in ad platforms vs managing agencies?")
        if not tools_list:
            clarifications.append("Tools proficiency list not filled")
            suggested_questions.append("Which ad platforms and analytics tools are you actively using day-to-day?")
        clarify_score = max(55.0, 100.0 - (len(clarifications) * 15.0))
        clarify_score = round(min(100.0, clarify_score), 1)

        # ── 7. Preferences
        pref_score = 75.0
        cand_mode = interests.get("preferred_arrangement") or (interests.get("work_arrangement") or [None])[0] or (candidate.get("hiring_preferences") or {}).get("work_mode", "")
        mode_match = "Compatible"
        if cand_mode:
            if _normalize(cand_mode) == self.job_work_mode or "any" in cand_mode.lower() or "open" in cand_mode.lower():
                pref_score += 15.0
                mode_match = f"Aligned ({cand_mode})"
            else:
                pref_score -= 10.0
                mode_match = f"Candidate prefers {cand_mode} vs Job {self.job.get('work_mode', 'Remote')}"
        cand_comp = interests.get("target_compensation") or (candidate.get("hiring_preferences") or {}).get("expected_ctc") or (candidate.get("hiring_preferences") or {}).get("desired_salary", "")
        comp_match = f"Target: {cand_comp}" if cand_comp else "Open"
        pref_score = round(min(100.0, max(40.0, pref_score)), 1)

        # ── 8. Timing
        timing_score = 80.0
        timing_delta = "On Track"
        if not cand_avail:
            cand_avail = "Available / Flexible"
            timing_score = 85.0
        elif any(x in cand_avail.lower() for x in ["immediate", "ready", "15 day"]):
            timing_score = 98.0
            timing_delta = "Immediate Start Ready"
        elif "1 month" in cand_avail.lower() or "30 day" in cand_avail.lower():
            timing_score = 88.0
            timing_delta = "Standard 30-day notice"
        elif any(x in cand_avail.lower() for x in ["2 month", "3 month", "60 day", "90 day"]):
            timing_score = 60.0
            timing_delta = "60-90 days notice (Planning required)"
        timing_score = round(min(100.0, max(30.0, timing_score)), 1)

        return {
            "relevant_capability": {
                "card_id": "relevant_capability",
                "title": "Relevant Capability & Execution Depth",
                "score": cap_score,
                "status": "High Match" if cap_score >= 80 else ("Moderate Match" if cap_score >= 60 else "Partial Match"),
                "discipline": primary_name,
                "matched_capabilities": matched_caps,
                "candidate_ownership": primary_ownership,
                "required_ownership": self.job.get("ownership_level") or "Personally executed",
                "ownership_status": "Aligned" if ownership_aligned else "Probe hands-on depth",
                "summary": f"Primary discipline in {primary_name} with {len(matched_caps)} key capabilities ({primary_ownership})."
            },
            "relevant_audience": {
                "card_id": "relevant_audience",
                "title": "Relevant Audience & GTM Context",
                "score": gtm_score,
                "status": "High Alignment" if gtm_score >= 80 else ("Compatible" if gtm_score >= 60 else "Exploratory"),
                "matched_models": matched_gtm or cand_models or ["Digital / General"],
                "candidate_models": cand_models,
                "job_model": self.job.get("business_model") or "Not specified",
                "buying_cycle": gtm.get("buying_cycle") or "Not specified",
                "routes_to_market": cand_rtm_list,
                "summary": f"Experienced in {', '.join(matched_gtm) if matched_gtm else (', '.join(cand_models) if cand_models else 'General marketing')} audiences."
            },
            "relevant_environment": {
                "card_id": "relevant_environment",
                "title": "Relevant Environment & Budget Scale",
                "score": env_score,
                "status": "Well Aligned" if env_score >= 80 else ("Scale Capable" if env_score >= 60 else "Review Needed"),
                "largest_spend_managed": largest_spend or "Not declared",
                "job_budget_range": self.job_budget_range or "Not specified",
                "team_setup": team_setup,
                "growth_stage": self.job.get("growth_stage") or "Not declared",
                "summary": f"Managed up to {largest_spend or 'standard budgets'} in {team_setup} environment."
            },
            "evidence": {
                "card_id": "evidence",
                "title": "Evidence of Performance (Proof of Work)",
                "score": evidence_score,
                "status": "Verified Proof" if evidence_score >= 80 else ("Documented" if evidence_score >= 60 else "Unverified"),
                "case_studies_count": cs_count,
                "has_metrics": has_metrics,
                "has_live_links": has_links,
                "highlights": cs_highlights,
                "summary": f"{cs_count} documented case studies with verifiable performance proof." if cs_count > 0 else "Profile proof relies on resume and portfolio links."
            },
            "transferable_experience": {
                "card_id": "transferable_experience",
                "title": "Transferable Experience & Marketing Tools",
                "score": trans_score,
                "status": "High Versatility" if trans_score >= 80 else ("Moderate Breadth" if trans_score >= 60 else "Specialist"),
                "secondary_specialisations": sec_specs,
                "proficient_tools": top_tools[:6],
                "summary": f"T-shaped capabilities in {', '.join(sec_specs)} with mastery in {len(top_tools)} tools." if sec_specs else f"Tool proficiency in {len(top_tools)} platforms."
            },
            "needs_clarification": {
                "card_id": "needs_clarification",
                "title": "Points for Recruiter Clarification",
                "score": clarify_score,
                "status": "Clear Profile" if len(clarifications) == 0 else f"{len(clarifications)} Point(s) to Probe",
                "clarification_points": clarifications,
                "suggested_questions": suggested_questions,
                "summary": f"{len(clarifications)} key point(s) identified for candidate interview." if clarifications else "No major red flags or discrepancies detected."
            },
            "preference_compatibility": {
                "card_id": "preference_compatibility",
                "title": "Preference & Work Setup Compatibility",
                "score": pref_score,
                "status": "Fully Aligned" if pref_score >= 85 else ("Partially Aligned" if pref_score >= 65 else "Friction Detected"),
                "work_mode_alignment": mode_match,
                "compensation_alignment": comp_match,
                "summary": f"Work mode: {mode_match}. Compensation: {comp_match}."
            },
            "timing_difference": {
                "card_id": "timing_difference",
                "title": "Timing & Availability Alignment",
                "score": timing_score,
                "status": "Immediate Start" if timing_score >= 95 else ("On Track" if timing_score >= 80 else ("Moderate Delay" if timing_score >= 60 else "Extended Notice")),
                "candidate_availability": cand_avail,
                "timing_delta": timing_delta,
                "summary": f"Availability: {cand_avail} ({timing_delta})."
            }
        }

    # ── Score Marketing Domain Alignment from Dossier ────────────────────
    def _score_marketing_alignment(self, dossier: dict) -> float:
        """
        Calculate the real Domain Alignment percentage from the 8-dimension dossier.
        Weighted based on marketing domain matrix:
        - Capability & Hands-on Depth: 30%
        - Proof of Work & Performance Evidence: 20%
        - GTM & Audience Alignment: 20%
        - Environment & Budget Scale: 15%
        - Preference & Setup Compatibility: 15%
        """
        if not dossier:
            return 70.0

        c_cap = dossier.get("relevant_capability", {}).get("score", 70.0)
        c_evi = dossier.get("evidence", {}).get("score", 65.0)
        c_aud = dossier.get("relevant_audience", {}).get("score", 70.0)
        c_env = dossier.get("relevant_environment", {}).get("score", 70.0)
        c_pref = dossier.get("preference_compatibility", {}).get("score", 75.0)

        domain_score = (c_cap * 0.30) + (c_evi * 0.20) + (c_aud * 0.20) + (c_env * 0.15) + (c_pref * 0.15)
        return round(min(100.0, max(10.0, domain_score)), 1)

    # ── Generate Human-Readable Insights ─────────────────────────────────
    def _generate_insights(self, candidate: dict, scores: dict, dossier: dict = None) -> tuple:
        highlights = []
        gaps = []

        if scores["skills"] >= 80:
            highlights.append("Strong skill match with job requirements")
        elif scores["skills"] < 40:
            gaps.append("Missing several required skills")

        total_years = _calculate_experience_years(candidate.get("experience") or [])
        if total_years >= 5:
            highlights.append(f"{total_years:.0f}+ years of professional experience")
        elif total_years == 0:
            gaps.append("No work experience listed")

        if scores["relevance"] >= 70:
            highlights.append("Past roles closely align with this position")
        elif scores["relevance"] < 30:
            gaps.append("Limited role relevance to this position")

        # Dossier-informed highlights
        if dossier:
            evi = dossier.get("evidence", {})
            if evi.get("score", 0) >= 80 and evi.get("case_studies_count", 0) > 0:
                highlights.append(f"{evi['case_studies_count']} verified case studies with before/after ROI metrics")

            cap = dossier.get("relevant_capability", {})
            if cap.get("score", 0) >= 80:
                highlights.append(f"Strong hands-on depth in {cap.get('discipline', 'Digital Marketing')}")

            aud = dossier.get("relevant_audience", {})
            if aud.get("score", 0) >= 85 and aud.get("matched_models"):
                highlights.append(f"Direct {', '.join(aud['matched_models'])} audience experience")

            clarify = dossier.get("needs_clarification", {})
            for pt in clarify.get("clarification_points", []):
                gaps.append(pt)

        if scores["education"] >= 70:
            highlights.append("Strong educational background")

        if scores["seniority"] >= 70:
            highlights.append("Clear upward career trajectory")

        if scores["completeness"] < 50:
            gaps.append("Profile is incomplete — missing key information")

        if candidate.get("resume_url") and not any("resume" in h.lower() for h in highlights):
            highlights.append("Resume uploaded")
        elif not candidate.get("resume_url") and not any("resume" in g.lower() for g in gaps):
            gaps.append("No resume uploaded")

        return highlights[:5], gaps[:4]


# ═══════════════════════════════════════════════════════════════════════
#   CONVENIENCE FUNCTION
# ═══════════════════════════════════════════════════════════════════════

def score_candidate_for_job(job_data: dict, candidate_data: dict) -> dict:
    """
    Convenience function to score a single candidate against a job.
    Returns: {"total": float, "breakdown": dict, "highlights": list, "gaps": list}
    """
    scorer = CandidateScorer(job_data)
    return scorer.score(candidate_data)


def score_all_candidates(job_data: dict, candidates: list) -> list:
    """
    Score multiple candidates and return sorted results (highest first).
    Each item: {"candidate_id": int, "score": dict}
    """
    scorer = CandidateScorer(job_data)
    results = []
    for cand in candidates:
        score_result = scorer.score(cand)
        results.append({
            "candidate_id": cand.get("id"),
            "score": score_result
        })
    results.sort(key=lambda x: x["score"]["total"], reverse=True)
    return results
