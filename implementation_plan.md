# AI-Powered Candidate Ranking & Smart Shortlisting

## Problem Statement

When a recruiter posts a job and receives 20, 200, or 400+ applications, they need a way to instantly surface the **top N best-fit candidates** without manually reviewing every profile. Currently the ApplicantsView only supports filtering/sorting by date or name — no intelligence.

Additionally, on the **candidate side**, we already offer AI skill gap analysis. But the deeper problem is: *if all 200 applicants add the missing skills and apply, how do we still differentiate the best candidates?* A senior engineer with 20 years of experience would look beyond just skill-matching — they'd evaluate **depth of experience, relevance of past roles, education quality, seniority trajectory, specialization alignment, and cultural fit signals**.

## Proposed Solution: Multi-Signal Scoring Engine

Build a **server-side scoring algorithm** (no external AI API needed — runs entirely on your data) that evaluates each applicant across **6 weighted dimensions**, producing a 0-100 fit score. The recruiter can then say "Show me the Top 10" and instantly get the best matches ranked.

---

## User Review Required

> [!IMPORTANT]
> **No external AI API costs** — This implementation uses a deterministic multi-signal scoring engine that runs entirely on your existing data (skills, experience, education, etc.). No OpenAI/Gemini API keys needed.

> [!IMPORTANT]
> **Database migration needed** — The `Application` model gets two new columns (`fit_score` and `fit_breakdown`). Running `init_db.py` or restarting the server will auto-create these.

## Open Questions

> [!IMPORTANT]
> **Scoring weights**: The default weights are Skills Match (30%), Experience Depth (25%), Role Relevance (20%), Education (10%), Seniority (10%), Profile Completeness (5%). Do you want to adjust these?

> [!IMPORTANT]
> **Auto-score on apply**: Should we auto-compute the fit score when a candidate applies, or only when the recruiter clicks "Rank Candidates"? (Plan proposes: auto-score on apply + manual re-rank button)

---

## Proposed Changes

### Backend: Scoring Engine Service

#### [NEW] [`backend/app/services/scoring.py`](file:///c:/Users/ACER/Desktop/uptrix%20-%20project/uptrix%20Hiring%20portal/backend/app/services/scoring.py)

A new service module containing the core `CandidateScorer` class with 6 scoring dimensions:

| Dimension | Weight | What it Measures | How it Differentiates |
|---|---|---|---|
| **Skills Match** | 30% | % of job-required skills the candidate has (case-insensitive, partial matching) | Candidates who only "added missing skills" get equal skills score, but other dimensions separate them |
| **Experience Depth** | 25% | Total years of work experience, weighted by recency and duration per role | A 5-year React dev beats someone who just listed "React" as a skill |
| **Role Relevance** | 20% | How closely past job titles/companies match the job's title, specialization, and industry | "Senior Frontend Engineer at Google" scores higher for a Frontend role than "Intern at XYZ" |
| **Education Quality** | 10% | Degree level (PhD > Masters > Bachelors > Diploma) + field relevance + institution tier | CS degree from IIT scores higher than unrelated degree |
| **Seniority Trajectory** | 10% | Career progression pattern — did they grow from Junior → Mid → Senior? Leadership signals | Shows career ambition and growth; a 20-year veteran scores highest |
| **Profile Completeness** | 5% | How much profile data is filled (resume uploaded, portfolio URL, certifications, etc.) | Penalizes low-effort applications even if skills match |

**Key design**: Even if all 200 candidates add the same skills, the **Experience Depth**, **Role Relevance**, and **Seniority Trajectory** dimensions will still create meaningful differentiation — exactly how a senior hiring manager thinks.

---

### Backend: Application Model Update

#### [MODIFY] [`backend/app/models/application.py`](file:///c:/Users/ACER/Desktop/uptrix%20-%20project/uptrix%20Hiring%20portal/backend/app/models/application.py)

Add two new columns:
- `fit_score` — Float (0-100), the computed overall match score
- `fit_breakdown` — JSON, the per-dimension breakdown (e.g., `{"skills": 85, "experience": 72, ...}`)

---

### Backend: New API Endpoints

#### [MODIFY] [`backend/app/api/endpoints/application.py`](file:///c:/Users/ACER/Desktop/uptrix%20-%20project/uptrix%20Hiring%20portal/backend/app/api/endpoints/application.py)

1. **Auto-score on apply**: When a candidate applies, compute `fit_score` and store it on the Application row
2. **`GET /applications/job/{job_id}/top?count=10`** — New endpoint: Returns the top N candidates for a job, sorted by `fit_score` descending. Recruiter specifies `count` (default 10)
3. **`POST /applications/job/{job_id}/rescore`** — Re-compute scores for all applicants of a job (useful after job requirements change)
4. **Include `fit_score` and `fit_breakdown` in all existing applicant responses**

---

### Frontend: Recruiter ApplicantsView

#### [MODIFY] [`frontend/src/views/recruiter/ApplicantsView.jsx`](file:///c:/Users/ACER/Desktop/uptrix%20-%20project/uptrix%20Hiring%20portal/frontend/src/views/recruiter/ApplicantsView.jsx)

Add a new **"AI Top Picks"** panel/mode to the existing ApplicantsView:

1. **"Show Top N" Input**: A numeric input + button above the applicants table. Recruiter types "10" and clicks → calls `/applications/job/{id}/top?count=10` → displays only the top 10 ranked candidates with their score badges
2. **Score Badge**: Each candidate card shows a colored fit score badge (green 80-100, yellow 60-79, orange 40-59, red 0-39)
3. **Score Breakdown Tooltip**: Hovering/clicking the score badge shows the 6-dimension radar breakdown
4. **Sort by Fit Score**: New sort option "Best Match" in the existing sort dropdown
5. **"Re-Rank" Button**: Calls rescore endpoint if recruiter updates job requirements

---

### Frontend: API Layer

#### [MODIFY] [`frontend/src/api.js`](file:///c:/Users/ACER/Desktop/uptrix%20-%20project/uptrix%20Hiring%20portal/frontend/src/api.js)

Add two new API functions:
- `getTopCandidates(jobId, count)` → `GET /api/applications/job/{jobId}/top?count={count}`
- `rescoreJob(jobId)` → `POST /api/applications/job/{jobId}/rescore`

---

## Verification Plan

### Automated Tests
- `python init_db.py` — Verify new columns are created in `hiring_portal.portal_applications`
- `python -m uvicorn main:app --reload --port 8000` — Server starts without errors
- `npm run build` — Frontend builds without errors

### Manual Verification
1. Login as `recruiter@uptrix.com` → Open ApplicantsView for any job
2. Enter "5" in "Show Top N" → Verify 5 candidates appear sorted by fit score
3. Verify score badges and breakdown tooltips render correctly
4. Login as `student@gmail.com` → Apply for a job → Verify fit_score is auto-computed
5. Test with seed data (20 candidates, 10 jobs) to validate scoring differentiation
