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
    """Scores a candidate against a job posting across 6 dimensions."""

    def __init__(self, job: dict):
        """
        Initialize with job data.
        job should have: title, description, skills[], experience_level,
                         specialization, must_have_capabilities,
                         preferred_capabilities, min_experience
        """
        self.job = job
        self.job_skills = [_normalize(s) for s in (job.get("skills") or []) if s]
        self.job_title = _normalize(job.get("title", ""))
        self.job_desc = _normalize(job.get("description", ""))
        self.job_specialization = _normalize(job.get("specialization", ""))
        self.job_exp_level = _normalize(job.get("experience_level", ""))
        self.job_min_exp = _extract_years(job.get("min_experience", ""))
        self.must_have = _normalize(job.get("must_have_capabilities", ""))
        self.preferred = _normalize(job.get("preferred_capabilities", ""))

    def score(self, candidate: dict) -> dict:
        """
        Score a candidate and return breakdown + total.

        candidate should have: skills[], experience[], education[],
                               certifications[], title, summary,
                               resume_url, portfolio_url, expertise[]
        Returns: {
            "total": 0-100,
            "breakdown": { "skills": X, "experience": X, ... },
            "highlights": ["Strong skill match", ...],
            "gaps": ["Missing 2 required skills", ...]
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

        total = sum(scores[k] * WEIGHTS[k] for k in WEIGHTS)
        total = round(min(100, max(0, total)), 1)

        highlights, gaps = self._generate_insights(candidate, scores)

        return {
            "total": total,
            "breakdown": {k: round(v, 1) for k, v in scores.items()},
            "highlights": highlights,
            "gaps": gaps,
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
    def _generate_insights(self, candidate: dict, scores: dict) -> tuple:
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

        if scores["education"] >= 70:
            highlights.append("Strong educational background")

        if scores["seniority"] >= 70:
            highlights.append("Clear upward career trajectory")

        if scores["completeness"] < 50:
            gaps.append("Profile is incomplete — missing key information")

        if candidate.get("resume_url"):
            highlights.append("Resume uploaded")
        else:
            gaps.append("No resume uploaded")

        return highlights[:4], gaps[:3]


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
