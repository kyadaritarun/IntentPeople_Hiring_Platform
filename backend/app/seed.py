from app.database import SessionLocal, engine, Base
from app.models import User, Company, Candidate, Job
from app.models.company import CompanyMember
from app.core.security import hash_password

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. ADMIN: admin@uptrix.com / 123
        admin_user = db.query(User).filter(User.email == "admin@uptrix.com").first()
        if not admin_user:
            admin_user = User(
                email="admin@uptrix.com",
                password_hash=hash_password("123"),
                role="ADMIN",
                is_verified=True
            )
            db.add(admin_user)
            db.flush()
        else:
            admin_user.password_hash = hash_password("123")
            admin_user.role = "ADMIN"
            admin_user.is_verified = True
            db.flush()

        # Company: Uptrix Corporation (assigned to admin)
        uptrix_company = db.query(Company).filter(Company.company_name == "Uptrix Corporation").first()
        if not uptrix_company:
            uptrix_company = db.query(Company).filter(Company.company_name.ilike("%uptrix%")).first()

        if not uptrix_company:
            uptrix_company = Company(
                user_id=admin_user.id,
                company_name="Uptrix Corporation",
                business_email="admin@uptrix.com",
                phone="+91 98765 43210",
                website="https://uptrix.dev",
                industry="Digital Marketing & Cloud Media",
                location="Hyderabad, Telangana, India",
                about="Uptrix Corporation is a premier digital marketing platform connecting enterprise teams with elite growth engineering and performance marketing talent.",
                logo_url="https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=150&auto=format&fit=crop&q=80",
                is_verified=True,
                verification_status="VERIFIED"
            )
            db.add(uptrix_company)
            db.flush()
        else:
            uptrix_company.user_id = admin_user.id
            uptrix_company.business_email = "admin@uptrix.com"
            uptrix_company.is_verified = True
            uptrix_company.verification_status = "VERIFIED"
            db.flush()

        # 2. RECRUITER: recruiter@uptrix.com / 123
        recruiter_user = db.query(User).filter(User.email == "recruiter@uptrix.com").first()
        if not recruiter_user:
            recruiter_user = User(
                email="recruiter@uptrix.com",
                password_hash=hash_password("123"),
                role="RECRUITER",
                is_verified=True
            )
            db.add(recruiter_user)
            db.flush()
        else:
            recruiter_user.password_hash = hash_password("123")
            recruiter_user.role = "RECRUITER"
            recruiter_user.is_verified = True
            db.flush()

        recruiter_member = db.query(CompanyMember).filter(CompanyMember.user_id == recruiter_user.id).first()
        if not recruiter_member:
            db.add(CompanyMember(
                company_id=uptrix_company.id,
                user_id=recruiter_user.id,
                name="Uptrix Recruiter",
                role="RECRUITER",
                title="Senior Technical Recruiter"
            ))
        else:
            recruiter_member.company_id = uptrix_company.id
            recruiter_member.role = "RECRUITER"

        # 3. HIRING MANAGER: manager@uptrix.com / 123
        manager_user = db.query(User).filter(User.email == "manager@uptrix.com").first()
        if not manager_user:
            manager_user = User(
                email="manager@uptrix.com",
                password_hash=hash_password("123"),
                role="HIRING_MANAGER",
                is_verified=True
            )
            db.add(manager_user)
            db.flush()
        else:
            manager_user.password_hash = hash_password("123")
            manager_user.role = "HIRING_MANAGER"
            manager_user.is_verified = True
            db.flush()

        manager_member = db.query(CompanyMember).filter(CompanyMember.user_id == manager_user.id).first()
        if not manager_member:
            db.add(CompanyMember(
                company_id=uptrix_company.id,
                user_id=manager_user.id,
                name="Varun Sharma",
                role="HIRING_MANAGER",
                title="VP of Marketing Engineering"
            ))
        else:
            manager_member.company_id = uptrix_company.id
            manager_member.role = "HIRING_MANAGER"

        # 4. CANDIDATE: student@gmail.com / 123
        student_user = db.query(User).filter(User.email == "student@gmail.com").first()
        if not student_user:
            student_user = User(
                email="student@gmail.com",
                password_hash=hash_password("123"),
                role="CANDIDATE",
                is_verified=True
            )
            db.add(student_user)
            db.flush()
        else:
            student_user.password_hash = hash_password("123")
            student_user.role = "CANDIDATE"
            student_user.is_verified = True
            db.flush()

        student_candidate = db.query(Candidate).filter(Candidate.user_id == student_user.id).first()
        if not student_candidate:
            student_candidate = Candidate(
                user_id=student_user.id,
                full_name="Student Candidate",
                phone="+91 98765 00000",
                place="Hyderabad",
                city="Hyderabad",
                state="Telangana",
                title="Digital Marketing Specialist",
                summary="Aspiring digital marketing and performance growth specialist with expertise in paid media, CRO, and campaign analytics.",
                skills=["Meta Ads", "Google Ads", "SEO", "Google Analytics 4", "Copywriting"],
                experience=[],
                education=[
                    {
                        "degree": "B.S. in Computer Science & Marketing",
                        "institution": "University",
                        "year": "2024"
                    }
                ],
                resume_url=None,
                resume_filename=None,
                portfolio_url="https://studentportfolio.dev"
            )
            db.add(student_candidate)
        else:
            student_candidate.full_name = "Student Candidate"

        # 5. JOBS: Add 10 published jobs for Uptrix Corporation (recruiter@uptrix.com)
        seed_jobs = [
            {
                "title": "Senior Performance Marketing Lead",
                "location": "Hyderabad, India",
                "work_mode": "Hybrid",
                "job_type": "Full-Time",
                "experience_level": "Senior",
                "min_experience": "5+ Years",
                "salary_min": 1800000,
                "salary_max": 2600000,
                "salary_currency": "INR",
                "skills": ["Meta Ads", "Google Ads", "Performance Marketing", "GA4", "ROAS Optimization", "Attribution Modeling"],
                "specialization": "Paid Acquisition & Media Buying",
                "ownership_level": "Team Lead",
                "availability_requirement": "Immediate / 15-30 Days",
                "must_have_capabilities": "Proven track record scaling Meta & Google ad spend profitably (> ₹50L/mo). Deep expertise in GA4, post-iOS tracking, and CAPI setup.",
                "preferred_capabilities": "Experience leading creative strategy and collaborating with video editors and copywriters.",
                "description": "Scale paid acquisition campaigns across Meta, Google Search & YouTube. Own multi-crore ad budgets and optimize full-funnel CAC to LTV metrics for high-growth client portfolios.",
                "screening_questions": [
                    {
                        "id": "sq_seed_1",
                        "question": "How many years of hands-on experience do you have managing Meta & Google Ads budgets?",
                        "type": "choice",
                        "options": ["1 - 2 years", "3 - 5 years", "6+ years"],
                        "required": True
                    },
                    {
                        "id": "sq_seed_2",
                        "question": "What is the highest monthly ad budget you have independently managed?",
                        "type": "choice",
                        "options": ["Under ₹10 Lakhs", "₹10L - ₹50L", "₹50L - ₹1 Crore", "₹1 Crore+"],
                        "required": True
                    },
                    {
                        "id": "sq_seed_3",
                        "question": "Are you comfortable working in our hybrid office model in Hyderabad?",
                        "type": "yes_no",
                        "options": ["Yes", "No"],
                        "required": True
                    },
                    {
                        "id": "sq_seed_4",
                        "question": "Share a brief link or summary of your highest ROAS performance marketing campaign.",
                        "type": "text",
                        "options": [],
                        "required": False
                    }
                ]
            },
            {
                "title": "Full Stack Growth Engineer (React & Node.js)",
                "location": "Bengaluru, India",
                "work_mode": "Remote",
                "job_type": "Full-Time",
                "experience_level": "Mid-Senior",
                "min_experience": "3-6 Years",
                "salary_min": 1600000,
                "salary_max": 2400000,
                "salary_currency": "INR",
                "skills": ["React.js", "Node.js", "TypeScript", "TailwindCSS", "PostgreSQL", "A/B Testing", "REST APIs"],
                "specialization": "Web Engineering & Product Growth",
                "ownership_level": "Individual Contributor",
                "availability_requirement": "Immediate or 30 Days",
                "must_have_capabilities": "Strong proficiency in React.js, modern JavaScript/TypeScript, RESTful API architecture, and database design.",
                "preferred_capabilities": "Familiarity with marketing analytics APIs, server-side tracking, and web performance optimization.",
                "description": "Build high-converting landing pages, interactive product funnels, and martech integrations. Collaborate with marketing and analytics teams to engineer viral user loops and seamless checkout flows.",
                "screening_questions": [
                    {
                        "id": "sq_seed_5",
                        "question": "How many years of production experience do you have with React.js and TypeScript?",
                        "type": "choice",
                        "options": ["1 - 2 years", "3 - 5 years", "5+ years"],
                        "required": True
                    },
                    {
                        "id": "sq_seed_6",
                        "question": "Please link your GitHub profile or personal portfolio.",
                        "type": "text",
                        "options": [],
                        "required": True
                    }
                ]
            },
            {
                "title": "Technical SEO & Organic Growth Strategist",
                "location": "Hyderabad, India",
                "work_mode": "Hybrid",
                "job_type": "Full-Time",
                "experience_level": "Mid-Level",
                "min_experience": "3-5 Years",
                "salary_min": 1200000,
                "salary_max": 1800000,
                "salary_currency": "INR",
                "skills": ["Technical SEO", "Ahrefs", "Semrush", "Google Search Console", "Schema Markup", "Core Web Vitals"],
                "specialization": "Organic Search & Technical SEO",
                "ownership_level": "Senior Specialist",
                "availability_requirement": "Immediate",
                "must_have_capabilities": "Deep knowledge of crawling algorithms, indexation protocols, structured data, schema markup, and JavaScript rendering.",
                "preferred_capabilities": "Experience executing programmatic SEO campaigns and managing enterprise content migrations.",
                "description": "Lead comprehensive site audits, programmatic SEO architectures, and core web vitals optimization. Drive organic search acquisition and revenue impact for enterprise brands."
            },
            {
                "title": "Senior Social Media & Brand Content Architect",
                "location": "Mumbai, India",
                "work_mode": "Hybrid",
                "job_type": "Full-Time",
                "experience_level": "Senior",
                "min_experience": "4-7 Years",
                "salary_min": 1400000,
                "salary_max": 2000000,
                "salary_currency": "INR",
                "skills": ["Brand Strategy", "LinkedIn Growth", "Content Marketing", "Copywriting", "Creative Direction", "Canva"],
                "specialization": "Brand Identity & Viral Storytelling",
                "ownership_level": "Lead Creator",
                "availability_requirement": "30 Days",
                "must_have_capabilities": "Exceptional written English, portfolio of viral organic campaigns, and mastery of LinkedIn & Instagram organic distribution algorithms.",
                "preferred_capabilities": "Video editing proficiency in CapCut / Premiere Pro and influencer partnership management.",
                "description": "Architect viral storytelling, thought leadership campaigns, and cross-channel content funnels across LinkedIn, YouTube, and Instagram to accelerate brand equity."
            },
            {
                "title": "Data Analytics & Marketing Intelligence Specialist",
                "location": "Remote (India)",
                "work_mode": "Remote",
                "job_type": "Full-Time",
                "experience_level": "Mid-Senior",
                "min_experience": "3-6 Years",
                "salary_min": 1500000,
                "salary_max": 2200000,
                "salary_currency": "INR",
                "skills": ["Google Analytics 4", "Looker Studio", "SQL", "BigQuery", "Attribution Modeling", "Tableau"],
                "specialization": "Marketing Analytics & Business Intelligence",
                "ownership_level": "Senior Analyst",
                "availability_requirement": "Immediate",
                "must_have_capabilities": "Expertise in SQL query optimization, BigQuery data pipelines, GA4 custom event tracking, and Looker Studio dashboarding.",
                "preferred_capabilities": "Python data science libraries (Pandas, NumPy) and predictive churn modeling.",
                "description": "Build automated marketing dashboards, customer cohorts, and predictive revenue models. Empower performance marketers with real-time attribution intelligence."
            },
            {
                "title": "DevOps & Cloud Infrastructure Engineer (AWS)",
                "location": "Hyderabad, India",
                "work_mode": "Hybrid",
                "job_type": "Full-Time",
                "experience_level": "Mid-Senior",
                "min_experience": "4-6 Years",
                "salary_min": 1800000,
                "salary_max": 2500000,
                "salary_currency": "INR",
                "skills": ["AWS", "Docker", "Kubernetes", "CI/CD", "Terraform", "PostgreSQL", "Linux"],
                "specialization": "Cloud DevOps & Infrastructure",
                "ownership_level": "Core Engineer",
                "availability_requirement": "30 Days Notice",
                "must_have_capabilities": "Hands-on production experience with AWS (ECS, RDS, S3, CloudFront), Docker containerization, and GitHub Actions CI/CD.",
                "preferred_capabilities": "AWS Certified Solutions Architect certification and experience with Redis caching layers.",
                "description": "Maintain highly reliable cloud microservices, automate CI/CD pipelines, optimize database queries, and ensure zero-downtime deployments for the Uptrix platform."
            },
            {
                "title": "UI/UX Product Designer (Design Systems & SaaS)",
                "location": "Bengaluru, India",
                "work_mode": "Hybrid",
                "job_type": "Full-Time",
                "experience_level": "Mid-Level",
                "min_experience": "3-5 Years",
                "salary_min": 1300000,
                "salary_max": 1900000,
                "salary_currency": "INR",
                "skills": ["Figma", "Design Systems", "Prototyping", "User Research", "Wireframing", "Micro-interactions"],
                "specialization": "Product Design & UI Engineering",
                "ownership_level": "Lead Designer",
                "availability_requirement": "Immediate / 15 Days",
                "must_have_capabilities": "World-class visual aesthetics, deep understanding of SaaS user flows, component libraries, and responsive mobile-first design.",
                "preferred_capabilities": "Knowledge of TailwindCSS tokens and Framer motion prototyping.",
                "description": "Craft intuitive, aesthetically exceptional user interfaces and scalable design systems for our portal, web applications, and marketing experiences."
            },
            {
                "title": "Conversion Rate Optimization (CRO) & Funnel Specialist",
                "location": "Remote (India)",
                "work_mode": "Remote",
                "job_type": "Full-Time",
                "experience_level": "Mid-Senior",
                "min_experience": "3-6 Years",
                "salary_min": 1400000,
                "salary_max": 2100000,
                "salary_currency": "INR",
                "skills": ["CRO", "VWO", "Hotjar", "Google Optimize", "User Testing", "Landing Page Optimization"],
                "specialization": "Funnel Architecture & Experimentation",
                "ownership_level": "Growth Specialist",
                "availability_requirement": "Immediate",
                "must_have_capabilities": "Extensive experience forming test hypotheses, executing qualitative user session replays, and running statistically valid A/B tests.",
                "preferred_capabilities": "Basic frontend coding (HTML/CSS/JS) for rapid variant deployment.",
                "description": "Design and execute high-velocity split testing programs. Optimize user journeys from initial ad impression to completed purchase and account retention."
            },
            {
                "title": "Retention & Email Marketing Automation Manager",
                "location": "Delhi NCR, India",
                "work_mode": "Hybrid",
                "job_type": "Full-Time",
                "experience_level": "Mid-Level",
                "min_experience": "3-5 Years",
                "salary_min": 1100000,
                "salary_max": 1700000,
                "salary_currency": "INR",
                "skills": ["Klaviyo", "HubSpot", "Lifecycle Marketing", "Email Automation", "Audience Segmentation", "SMS Marketing"],
                "specialization": "Lifecycle & CRM Marketing",
                "ownership_level": "Channel Lead",
                "availability_requirement": "15-30 Days",
                "must_have_capabilities": "Proven ability to build automated trigger flows (welcome, browse abandon, win-back) and deliver high deliverability domain reputations.",
                "preferred_capabilities": "HTML email templating and dynamic liquid personalization syntax.",
                "description": "Design automated customer lifecycle flows, re-engagement triggers, and personalized email drip sequences that maximize customer lifetime value."
            },
            {
                "title": "Enterprise MarTech & Client Solutions Director",
                "location": "Hyderabad, India",
                "work_mode": "On-site",
                "job_type": "Full-Time",
                "experience_level": "Executive / Lead",
                "min_experience": "7-10+ Years",
                "salary_min": 2800000,
                "salary_max": 4000000,
                "salary_currency": "INR",
                "skills": ["Client Relations", "MarTech Architecture", "Enterprise Sales", "Team Leadership", "Strategic Consulting"],
                "specialization": "Enterprise Client Solutions",
                "ownership_level": "Director",
                "availability_requirement": "30-60 Days",
                "must_have_capabilities": "Extensive leadership experience in global digital agencies, enterprise pitch wins, and cross-functional team orchestration.",
                "preferred_capabilities": "MBA from a top-tier institution and deep network across tech & e-commerce C-suite executives.",
                "description": "Lead strategic partnerships with Fortune 500 brands and enterprise clients. Oversee client delivery teams and guide digital transformation initiatives."
            }
        ]

        jobs_added_count = 0
        for jdata in seed_jobs:
            existing_job = db.query(Job).filter(
                Job.company_id == uptrix_company.id,
                Job.title == jdata["title"]
            ).first()
            if not existing_job:
                db.add(Job(
                    company_id=uptrix_company.id,
                    title=jdata["title"],
                    description=jdata["description"],
                    skills=jdata["skills"],
                    experience_level=jdata["experience_level"],
                    min_experience=jdata["min_experience"],
                    salary_min=jdata["salary_min"],
                    salary_max=jdata["salary_max"],
                    salary_currency=jdata["salary_currency"],
                    location=jdata["location"],
                    work_mode=jdata["work_mode"],
                    job_type=jdata["job_type"],
                    status="PUBLISHED",
                    specialization=jdata.get("specialization"),
                    ownership_level=jdata.get("ownership_level"),
                    availability_requirement=jdata.get("availability_requirement"),
                    must_have_capabilities=jdata.get("must_have_capabilities"),
                    preferred_capabilities=jdata.get("preferred_capabilities"),
                    product_service=uptrix_company.product_service or "Uptrix Full-Service Digital Marketing & Engineering Platform",
                    business_model=uptrix_company.business_model or "B2B Enterprise",
                    growth_stage=uptrix_company.growth_stage or "Series B / Growth",
                    screening_questions=jdata.get("screening_questions", [])
                ))
                jobs_added_count += 1
            else:
                if jdata.get("screening_questions") and not existing_job.screening_questions:
                    existing_job.screening_questions = jdata.get("screening_questions")

        db.flush()

        # 6. 20 CANDIDATE PROFILES
        seed_candidates = [
            {
                "full_name": "Aarav Sharma",
                "email": "aarav.sharma@uptrix.dev",
                "phone": "+91 98765 11001",
                "city": "Hyderabad",
                "state": "Telangana",
                "place": "Hyderabad, Telangana",
                "title": "Senior Performance Marketing Lead",
                "summary": "Data-driven performance marketer with 6+ years orchestrating high-scale paid acquisition across Meta & Google Ads. Managed over Rs. 4Cr+ annual ad spend with an average ROAS of 3.8x. Proven track record in DTC scale-up, creative testing loops, and full-funnel attribution.",
                "skills": ["Meta Ads", "Google Ads", "GA4", "ROAS Optimization", "Attribution Modeling", "SQL", "Looker Studio", "Creative Strategy"],
                "expertise": ["Paid Social Scaling", "Direct-Response Creative Strategy", "Conversion Rate Optimization", "Multi-Touch Attribution"],
                "experience": [
                    {
                        "title": "Senior Media Buyer & Performance Lead",
                        "company": "Urban Company",
                        "duration": "2022 - Present",
                        "location": "Hyderabad, India",
                        "employment_type": "Full-Time",
                        "description": "Scaled monthly acquisition spend by 180% while decreasing blended CAC by 24%. Built real-time Looker dashboards tracking cohort LTV and ROAS across 14 service categories.",
                        "technologies": ["Meta Ads Manager", "Google Ads", "GA4", "Looker Studio", "BigQuery"]
                    },
                    {
                        "title": "Performance Marketing Analyst",
                        "company": "Nykaa",
                        "duration": "2019 - 2022",
                        "location": "Mumbai, India",
                        "employment_type": "Full-Time",
                        "description": "Managed Google Shopping and Search campaigns with Rs. 1.2Cr monthly budget. Led A/B tests on landing pages lifting checkout conversion rates by 18%.",
                        "technologies": ["Google Ads", "Search Ads 360", "Optimizely", "Excel Modeling"]
                    }
                ],
                "education": [
                    {
                        "degree": "B.Tech in Information Technology",
                        "institution": "Osmania University, Hyderabad",
                        "duration": "2015 - 2019",
                        "year": "2019",
                        "grade": "8.4 CGPA",
                        "description": "Major in Data Systems with minor in Digital Communications."
                    }
                ],
                "certifications": [
                    {
                        "name": "Google Ads Search & Display Certified",
                        "issuer": "Google Skillshop",
                        "year": "2023",
                        "credential_id": "GOOG-78921"
                    },
                    {
                        "name": "Meta Certified Media Buying Professional",
                        "issuer": "Meta Blueprint",
                        "year": "2022",
                        "credential_id": "META-44219"
                    }
                ],
                "hiring_preferences": {
                    "work_mode": "Hybrid",
                    "availability": "15 Days",
                    "desired_salary": "Rs. 22 - 28 LPA",
                    "preferred_location": "Hyderabad",
                    "job_type": "Full-Time",
                    "relocation": "Open to relocation"
                },
                "portfolio_url": "https://aaravmarketing.dev",
                "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
                "resume_url": "https://assets.uptrix.dev/resumes/aarav_sharma_cv.pdf",
                "resume_filename": "Aarav_Sharma_Resume.pdf"
            },
            {
                "full_name": "Priya Patel",
                "email": "priya.patel@uptrix.dev",
                "phone": "+91 98765 11002",
                "city": "Bengaluru",
                "state": "Karnataka",
                "place": "Bengaluru, Karnataka",
                "title": "Lead Growth Marketing Engineer",
                "summary": "Hybrid marketing technologist and software engineer with 5+ years building full-funnel activation engines, server-side tracking (CAPI, SGTM), and algorithmic experiment frameworks. Bridging engineering rigor with growth metrics.",
                "skills": ["Server-Side GTM", "Meta Conversions API", "Python", "Segment CDP", "PostHog", "Next.js", "SQL", "Mixpanel"],
                "expertise": ["MarTech Engineering", "Full-Funnel Automation", "First-Party Data Infrastructure", "Algorithmic Growth"],
                "experience": [
                    {
                        "title": "Lead Growth Engineer",
                        "company": "Razorpay",
                        "duration": "2021 - Present",
                        "location": "Bengaluru, India",
                        "employment_type": "Full-Time",
                        "description": "Architected server-side tracking pipeline processing 10M+ events daily with zero data loss. Built automated lead routing service cutting response latency from 45 min to 90 seconds.",
                        "technologies": ["Python", "FastAPI", "Server-Side GTM", "Segment", "Kafka"]
                    },
                    {
                        "title": "Frontend & Growth Developer",
                        "company": "Freshworks",
                        "duration": "2019 - 2021",
                        "location": "Chennai, India",
                        "employment_type": "Full-Time",
                        "description": "Engineered dynamic viral referral widgets and localized signup funnels yielding 35,000+ organic product signups.",
                        "technologies": ["React", "TypeScript", "TailwindCSS", "Mixpanel"]
                    }
                ],
                "education": [
                    {
                        "degree": "B.E. in Computer Science & Engineering",
                        "institution": "PES University, Bangalore",
                        "duration": "2015 - 2019",
                        "year": "2019",
                        "grade": "9.1 CGPA",
                        "description": "Focus on Distributed Web Architectures and Analytics Engines."
                    }
                ],
                "certifications": [
                    {
                        "name": "Segment Certified CDP Architect",
                        "issuer": "Twilio Segment",
                        "year": "2023",
                        "credential_id": "SEG-90211"
                    },
                    {
                        "name": "AWS Certified Solutions Architect",
                        "issuer": "Amazon Web Services",
                        "year": "2022",
                        "credential_id": "AWS-SA-3841"
                    }
                ],
                "hiring_preferences": {
                    "work_mode": "Remote",
                    "availability": "Immediate",
                    "desired_salary": "Rs. 26 - 34 LPA",
                    "preferred_location": "Bengaluru / Remote",
                    "job_type": "Full-Time",
                    "relocation": "Remote preferred"
                },
                "portfolio_url": "https://github.com/priyapatel-growth",
                "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
                "resume_url": "https://assets.uptrix.dev/resumes/priya_patel_cv.pdf",
                "resume_filename": "Priya_Patel_Resume.pdf"
            },
            {
                "full_name": "Rohan Verma",
                "email": "rohan.verma@uptrix.dev",
                "phone": "+91 98765 11003",
                "city": "Pune",
                "state": "Maharashtra",
                "place": "Pune, Maharashtra",
                "title": "Senior Technical SEO & Search Strategist",
                "summary": "Technical SEO specialist with 7 years of deep organic growth expertise. Built programmatic SEO engines generating over 2.5M monthly organic visitors for SaaS and e-commerce platforms. Master of Core Web Vitals and Schema graph engineering.",
                "skills": ["Technical SEO", "Programmatic SEO", "Core Web Vitals", "Python for SEO", "Screaming Frog", "Ahrefs", "Semrush", "Next.js SSR"],
                "expertise": ["Algorithmic Organic Recovery", "AEO & LLM Search Optimization", "Site Architecture Auditing", "Dynamic Indexation"],
                "experience": [
                    {
                        "title": "Head of Organic Search",
                        "company": "Rebel Foods",
                        "duration": "2021 - Present",
                        "location": "Pune, India",
                        "employment_type": "Full-Time",
                        "description": "Led technical SEO overhaul across 6 cloud kitchen brands, lifting non-brand organic visits by 140% in 12 months. Automated international schema markup generation using Python.",
                        "technologies": ["Python", "Screaming Frog", "Ahrefs", "BigQuery", "Search Console API"]
                    },
                    {
                        "title": "Senior SEO Specialist",
                        "company": "Cleartrip",
                        "duration": "2018 - 2021",
                        "location": "Mumbai, India",
                        "employment_type": "Full-Time",
                        "description": "Resolved critical JavaScript rendering bottlenecks and index bloat across 800k travel routes, recovering 450k lost monthly sessions.",
                        "technologies": ["JavaScript SEO", "Sitebulb", "Semrush", "Google Data Studio"]
                    }
                ],
                "education": [
                    {
                        "degree": "B.Tech in Electronics & Telecommunication",
                        "institution": "COEP Pune",
                        "duration": "2014 - 2018",
                        "year": "2018",
                        "grade": "8.2 CGPA",
                        "description": "Final project on automated web crawlers and index structures."
                    }
                ],
                "certifications": [
                    {
                        "name": "Advanced Technical SEO Master",
                        "issuer": "BrightEdge",
                        "year": "2023",
                        "credential_id": "BE-SEO-102"
                    }
                ],
                "hiring_preferences": {
                    "work_mode": "Hybrid",
                    "availability": "30 Days",
                    "desired_salary": "Rs. 18 - 24 LPA",
                    "preferred_location": "Pune / Mumbai",
                    "job_type": "Full-Time",
                    "relocation": "Yes, open to relocation"
                },
                "portfolio_url": "https://rohanseo.io",
                "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
                "resume_url": "https://assets.uptrix.dev/resumes/rohan_verma_cv.pdf",
                "resume_filename": "Rohan_Verma_Resume.pdf"
            },
            {
                "full_name": "Ananya Deshmukh",
                "email": "ananya.deshmukh@uptrix.dev",
                "phone": "+91 98765 11004",
                "city": "Mumbai",
                "state": "Maharashtra",
                "place": "Mumbai, Maharashtra",
                "title": "Lead Product & Interaction Designer",
                "summary": "Systems-oriented product designer with 6+ years creating intuitive fintech and enterprise SaaS interfaces. Passionate about design token systems, accessibility (WCAG AAA), and high-conversion payment journeys.",
                "skills": ["Figma", "Design Systems", "Prototyping", "User Research", "Tailwind CSS", "Framer", "Information Architecture", "Micro-interactions"],
                "expertise": ["Enterprise UX", "Design Token Architecture", "High-Converting Checkout Funnels", "Design-to-Code Pipelines"],
                "experience": [
                    {
                        "title": "Senior Product Designer",
                        "company": "CRED",
                        "duration": "2022 - Present",
                        "location": "Mumbai, India",
                        "employment_type": "Full-Time",
                        "description": "Designed reward mechanics and gamified checkout flows used by 12M+ monthly active members. Standardized design tokens across iOS, Android, and Web.",
                        "technologies": ["Figma", "Principle", "Framer", "Tokens Studio"]
                    },
                    {
                        "title": "UX Designer",
                        "company": "BookMyShow",
                        "duration": "2019 - 2022",
                        "location": "Mumbai, India",
                        "employment_type": "Full-Time",
                        "description": "Redesigned seat selection and checkout steps, reducing cart drop-offs by 19% across 4 million monthly transactions.",
                        "technologies": ["Figma", "Miro", "Hotjar", "UserTesting"]
                    }
                ],
                "education": [
                    {
                        "degree": "Bachelor of Design (B.Des) in Interaction Design",
                        "institution": "National Institute of Design (NID), Ahmedabad",
                        "duration": "2015 - 2019",
                        "year": "2019",
                        "grade": "First Class with Distinction",
                        "description": "Specialized in Cognitive Psychology and Human-Centered Interface Design."
                    }
                ],
                "certifications": [
                    {
                        "name": "UX Master Certified (NN/g)",
                        "issuer": "Nielsen Norman Group",
                        "year": "2022",
                        "credential_id": "NNG-UX-8891"
                    }
                ],
                "hiring_preferences": {
                    "work_mode": "Hybrid",
                    "availability": "Immediate",
                    "desired_salary": "Rs. 24 - 30 LPA",
                    "preferred_location": "Mumbai",
                    "job_type": "Full-Time",
                    "relocation": "Mumbai only"
                },
                "portfolio_url": "https://dribbble.com/ananyadeshmukh",
                "avatar_url": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80",
                "resume_url": "https://assets.uptrix.dev/resumes/ananya_deshmukh_cv.pdf",
                "resume_filename": "Ananya_Deshmukh_Resume.pdf"
            },
            {
                "full_name": "Vikram Aditya",
                "email": "vikram.aditya@uptrix.dev",
                "phone": "+91 98765 11005",
                "city": "Hyderabad",
                "state": "Telangana",
                "place": "Hyderabad, Telangana",
                "title": "Senior Full Stack Developer",
                "summary": "Versatile full-stack engineer with 5+ years architecting scalable web applications, real-time analytics dashboards, and headless commerce platforms using React, Next.js, and Python FastAPI.",
                "skills": ["React", "Next.js", "Python", "FastAPI", "Node.js", "PostgreSQL", "Redis", "Docker", "AWS", "TypeScript"],
                "expertise": ["Microservices Architecture", "Real-Time WebSocket Feeds", "High-Throughput REST APIs", "Database Optimization"],
                "experience": [
                    {
                        "title": "Senior Full Stack Engineer",
                        "company": "Darwinbox",
                        "duration": "2022 - Present",
                        "location": "Hyderabad, India",
                        "employment_type": "Full-Time",
                        "description": "Engineered high-concurrency recruitment workflow service supporting 80,000 daily active HR users with sub-100ms response times.",
                        "technologies": ["React", "FastAPI", "PostgreSQL", "Redis", "Docker"]
                    },
                    {
                        "title": "Software Development Engineer",
                        "company": "HighRadius",
                        "duration": "2019 - 2022",
                        "location": "Hyderabad, India",
                        "employment_type": "Full-Time",
                        "description": "Developed predictive receivables dashboard and ledger sync microservices handling 2M+ transactions daily.",
                        "technologies": ["Node.js", "React", "PostgreSQL", "RabbitMQ"]
                    }
                ],
                "education": [
                    {
                        "degree": "B.Tech in Computer Science & Engineering",
                        "institution": "IIIT Hyderabad",
                        "duration": "2015 - 2019",
                        "year": "2019",
                        "grade": "8.7 CGPA",
                        "description": "Coursework in Advanced Data Structures, Distributed Computing, and Cloud Systems."
                    }
                ],
                "certifications": [
                    {
                        "name": "AWS Certified Developer Associate",
                        "issuer": "Amazon Web Services",
                        "year": "2022",
                        "credential_id": "AWS-DVA-990"
                    }
                ],
                "hiring_preferences": {
                    "work_mode": "Hybrid",
                    "availability": "15 Days",
                    "desired_salary": "Rs. 22 - 28 LPA",
                    "preferred_location": "Hyderabad",
                    "job_type": "Full-Time",
                    "relocation": "Yes, open to relocation"
                },
                "portfolio_url": "https://github.com/vikramaditya-dev",
                "avatar_url": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80",
                "resume_url": "https://assets.uptrix.dev/resumes/vikram_aditya_cv.pdf",
                "resume_filename": "Vikram_Aditya_Resume.pdf"
            },
            {
                "full_name": "Sneha Reddy",
                "email": "sneha.reddy@uptrix.dev",
                "phone": "+91 98765 11006",
                "city": "Hyderabad",
                "state": "Telangana",
                "place": "Hyderabad, Telangana",
                "title": "Marketing Data & Attribution Analytics Lead",
                "summary": "Analytics leader with 6 years experience bridging raw BigQuery event streams, multi-touch attribution models, and executive marketing decisions. Deep expertise in statistical modeling, dbt pipelines, and Looker Studio.",
                "skills": ["BigQuery", "SQL", "Looker Studio", "Tableau", "GA4", "Python", "dbt", "Attribution Modeling", "R"],
                "expertise": ["Marketing Mix Modeling (MMM)", "Multi-Touch Attribution", "Predictive LTV Modeling", "Cohort Retention Analysis"],
                "experience": [
                    {
                        "title": "Staff Marketing Analytics Lead",
                        "company": "Flipkart",
                        "duration": "2021 - Present",
                        "location": "Bengaluru / Hyderabad, India",
                        "employment_type": "Full-Time",
                        "description": "Built automated Marketing Mix Modeling (MMM) framework that re-routed Rs. 8Cr from low-efficiency display campaigns to high-intent search.",
                        "technologies": ["BigQuery", "dbt", "Python", "Looker", "Airflow"]
                    },
                    {
                        "title": "Senior BI Analyst",
                        "company": "Swiggy",
                        "duration": "2018 - 2021",
                        "location": "Bengaluru, India",
                        "employment_type": "Full-Time",
                        "description": "Modeled customer churn probability algorithms and built real-time discount coupon efficacy monitoring dashboards.",
                        "technologies": ["PostgreSQL", "Tableau", "Python", "GA4"]
                    }
                ],
                "education": [
                    {
                        "degree": "M.S. in Data Science & Machine Learning",
                        "institution": "BITS Pilani",
                        "duration": "2018 - 2020",
                        "year": "2020",
                        "grade": "9.4 CGPA",
                        "description": "Thesis on Bayesian Attribution Models for Multi-Channel E-Commerce."
                    },
                    {
                        "degree": "B.Tech in Electronics & Communication",
                        "institution": "JNTU Hyderabad",
                        "duration": "2014 - 2018",
                        "year": "2018",
                        "grade": "8.5 CGPA",
                        "description": "Graduated with University Merit."
                    }
                ],
                "certifications": [
                    {
                        "name": "Google Professional Data Engineer",
                        "issuer": "Google Cloud",
                        "year": "2023",
                        "credential_id": "GCP-PDE-4410"
                    }
                ],
                "hiring_preferences": {
                    "work_mode": "Remote",
                    "availability": "30 Days",
                    "desired_salary": "Rs. 25 - 32 LPA",
                    "preferred_location": "Hyderabad / Remote",
                    "job_type": "Full-Time",
                    "relocation": "Remote only"
                },
                "portfolio_url": "https://snehareddy-analytics.dev",
                "avatar_url": "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=200&auto=format&fit=crop&q=80",
                "resume_url": "https://assets.uptrix.dev/resumes/sneha_reddy_cv.pdf",
                "resume_filename": "Sneha_Reddy_Resume.pdf"
            },
            {
                "full_name": "Karthik Subramanian",
                "email": "karthik.subramanian@uptrix.dev",
                "phone": "+91 98765 11007",
                "city": "Chennai",
                "state": "Tamil Nadu",
                "place": "Chennai, Tamil Nadu",
                "title": "Enterprise Content & Communications Lead",
                "summary": "B2B tech storyteller with 7+ years authoring high-authority whitepapers, research reports, and executive thought leadership that drives seven-figure enterprise sales pipeline. Expert in content engine operations and account-based narrative positioning.",
                "skills": ["B2B Storytelling", "Content Strategy", "Thought Leadership", "Editorial Operations", "SEO Copywriting", "HubSpot", "Case Studies"],
                "expertise": ["Enterprise Account-Based Content", "SaaS Narrative Positioning", "Technical Whitepapers", "PR & Brand Voice"],
                "experience": [
                    {
                        "title": "Director of Content & Communications",
                        "company": "Zoho",
                        "duration": "2020 - Present",
                        "location": "Chennai, India",
                        "employment_type": "Full-Time",
                        "description": "Scaled SaaS resource library to 800k monthly readers, directly generating $4.2M in annual inbound enterprise pipeline. Managed team of 8 tech writers.",
                        "technologies": ["HubSpot CMS", "Ahrefs", "WordPress VIP", "Notion"]
                    },
                    {
                        "title": "Senior Technical Content Lead",
                        "company": "Cognizant",
                        "duration": "2017 - 2020",
                        "location": "Chennai, India",
                        "employment_type": "Full-Time",
                        "description": "Authored enterprise cloud modernization case studies and global executive research briefs presented to Fortune 100 CIOs.",
                        "technologies": ["InDesign", "Clearscope", "Grammarly Business"]
                    }
                ],
                "education": [
                    {
                        "degree": "M.A. in English & Corporate Communications",
                        "institution": "Madras University, Chennai",
                        "duration": "2015 - 2017",
                        "year": "2017",
                        "grade": "Gold Medalist",
                        "description": "Focus on Narrative Persuasion and Organizational Discourse."
                    }
                ],
                "certifications": [
                    {
                        "name": "HubSpot Inbound Marketing Certified",
                        "issuer": "HubSpot Academy",
                        "year": "2023",
                        "credential_id": "HS-INB-7721"
                    }
                ],
                "hiring_preferences": {
                    "work_mode": "Remote",
                    "availability": "Immediate",
                    "desired_salary": "Rs. 18 - 24 LPA",
                    "preferred_location": "Chennai / Bengaluru",
                    "job_type": "Full-Time",
                    "relocation": "Open to relocation"
                },
                "portfolio_url": "https://karthikwords.dev",
                "avatar_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80",
                "resume_url": "https://assets.uptrix.dev/resumes/karthik_subramanian_cv.pdf",
                "resume_filename": "Karthik_Subramanian_Resume.pdf"
            },
            {
                "full_name": "Pooja Iyer",
                "email": "pooja.iyer@uptrix.dev",
                "phone": "+91 98765 11008",
                "city": "Bengaluru",
                "state": "Karnataka",
                "place": "Bengaluru, Karnataka",
                "title": "Senior Social Media & Community Strategist",
                "summary": "Brand amplification strategist with 5+ years growing engaged followings across LinkedIn, YouTube, and X. Generated over 45M viral impressions organically for tech startups and creator communities.",
                "skills": ["Viral Campaign Strategy", "LinkedIn Creator Management", "Community Building", "Discord", "Canva", "Video Scripting", "Notion", "CapCut"],
                "expertise": ["Founder Branding", "Organic Viral Loops", "Developer Community Building", "Live Stream Event Production"],
                "experience": [
                    {
                        "title": "Social Media & Community Lead",
                        "company": "Postman",
                        "duration": "2022 - Present",
                        "location": "Bengaluru, India",
                        "employment_type": "Full-Time",
                        "description": "Scaled Postman global developer community across Discord and Twitter by 300%. Created technical micro-content series viewed 18M+ times.",
                        "technologies": ["Discord API", "Twitter Analytics", "Figma", "Buffer"]
                    },
                    {
                        "title": "Community Specialist",
                        "company": "Unacademy",
                        "duration": "2019 - 2022",
                        "location": "Bengaluru, India",
                        "employment_type": "Full-Time",
                        "description": "Spearheaded nationwide student ambassador program driving 120,000+ active forum discussions and 40k app downloads.",
                        "technologies": ["Telegram Groups", "Hootsuite", "Zapier"]
                    }
                ],
                "education": [
                    {
                        "degree": "B.A. in Media & Mass Communication",
                        "institution": "Christ University, Bangalore",
                        "duration": "2016 - 2019",
                        "year": "2019",
                        "grade": "8.8 CGPA",
                        "description": "Focus on Digital Media Culture and Interactive Public Relations."
                    }
                ],
                "certifications": [
                    {
                        "name": "Hootsuite Social Marketing Certified",
                        "issuer": "Hootsuite",
                        "year": "2022",
                        "credential_id": "HOOT-SOC-301"
                    }
                ],
                "hiring_preferences": {
                    "work_mode": "Hybrid",
                    "availability": "15 Days",
                    "desired_salary": "Rs. 14 - 19 LPA",
                    "preferred_location": "Bengaluru",
                    "job_type": "Full-Time",
                    "relocation": "No"
                },
                "portfolio_url": "https://poojaiyer.media",
                "avatar_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80",
                "resume_url": "https://assets.uptrix.dev/resumes/pooja_iyer_cv.pdf",
                "resume_filename": "Pooja_Iyer_Resume.pdf"
            },
            {
                "full_name": "Arjun Nair",
                "email": "arjun.nair@uptrix.dev",
                "phone": "+91 98765 11009",
                "city": "Bengaluru",
                "state": "Karnataka",
                "place": "Bengaluru, Karnataka",
                "title": "Senior DevOps & Infrastructure Engineer",
                "summary": "Cloud infrastructure engineer with 6+ years managing multi-region Kubernetes clusters, zero-downtime CI/CD pipelines, and high-availability AWS architectures. Specialist in FinOps cloud spend reduction.",
                "skills": ["Kubernetes", "Docker", "Terraform", "AWS", "GitHub Actions", "Prometheus", "Grafana", "Linux", "ArgoCD"],
                "expertise": ["GitOps Workflow", "Cost Optimization (FinOps)", "High-Availability Disaster Recovery", "Infrastructure as Code"],
                "experience": [
                    {
                        "title": "Senior DevOps Engineer",
                        "company": "PhonePe",
                        "duration": "2021 - Present",
                        "location": "Bengaluru, India",
                        "employment_type": "Full-Time",
                        "description": "Managed EKS Kubernetes clusters serving 15,000 requests per second. Implemented Karpenter autoscaling, cutting cloud infrastructure spend by $180k/year.",
                        "technologies": ["Kubernetes (EKS)", "Terraform", "ArgoCD", "Prometheus", "AWS"]
                    },
                    {
                        "title": "Cloud Operations Engineer",
                        "company": "Infosys",
                        "duration": "2018 - 2021",
                        "location": "Bengaluru, India",
                        "employment_type": "Full-Time",
                        "description": "Standardized GitHub Actions pipelines deploying over 40 microservices with blue-green deployment strategies.",
                        "technologies": ["Docker", "Jenkins", "Ansible", "AWS EC2/S3"]
                    }
                ],
                "education": [
                    {
                        "degree": "B.Tech in Information Technology",
                        "institution": "NIT Calicut",
                        "duration": "2014 - 2018",
                        "year": "2018",
                        "grade": "8.6 CGPA",
                        "description": "Specialized in Computer Networks and Operating Systems."
                    }
                ],
                "certifications": [
                    {
                        "name": "Certified Kubernetes Administrator (CKA)",
                        "issuer": "Linux Foundation",
                        "year": "2023",
                        "credential_id": "CKA-2300-881"
                    },
                    {
                        "name": "AWS Certified Solutions Architect Professional",
                        "issuer": "Amazon Web Services",
                        "year": "2022",
                        "credential_id": "AWS-SAP-1094"
                    }
                ],
                "hiring_preferences": {
                    "work_mode": "Hybrid",
                    "availability": "30 Days",
                    "desired_salary": "Rs. 28 - 36 LPA",
                    "preferred_location": "Bengaluru",
                    "job_type": "Full-Time",
                    "relocation": "Yes, open to relocation"
                },
                "portfolio_url": "https://github.com/arjunnair-infra",
                "avatar_url": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80",
                "resume_url": "https://assets.uptrix.dev/resumes/arjun_nair_cv.pdf",
                "resume_filename": "Arjun_Nair_Resume.pdf"
            },
            {
                "full_name": "Meera Sen",
                "email": "meera.sen@uptrix.dev",
                "phone": "+91 98765 11010",
                "city": "Kolkata",
                "state": "West Bengal",
                "place": "Kolkata, West Bengal",
                "title": "CRO & Experimentation Strategist",
                "summary": "Experimentation practitioner who has run 400+ A/B and multivariate tests. Proven track record of lifting e-commerce add-to-cart rates by 34% and checkout conversions by 28% using behavioral heuristics.",
                "skills": ["VWO", "Optimizely", "Hotjar", "UserTesting", "GA4", "Statistical Analysis", "Behavioral Economics", "CSS/HTML"],
                "expertise": ["Frictionless Checkout Design", "A/B Testing Methodology", "Customer Journey Heuristic Auditing", "Statistical Rigor"],
                "experience": [
                    {
                        "title": "Lead CRO Specialist",
                        "company": "Tata CLiQ",
                        "duration": "2021 - Present",
                        "location": "Mumbai / Remote, India",
                        "employment_type": "Full-Time",
                        "description": "Boosted mobile checkout conversion rate by 22% across 8 high-traffic categories. Formulated Bayesian statistical testing guidelines for product squads.",
                        "technologies": ["Optimizely Web", "VWO", "GA4", "Hotjar", "SQL"]
                    },
                    {
                        "title": "Growth Analyst",
                        "company": "Lenskart",
                        "duration": "2019 - 2021",
                        "location": "Delhi NCR, India",
                        "employment_type": "Full-Time",
                        "description": "Ran statistical test matrices for virtual AR 3D frame try-on feature, increasing try-to-buy ratio by 31%.",
                        "technologies": ["Google Optimize", "Mixpanel", "CrazyEgg"]
                    }
                ],
                "education": [
                    {
                        "degree": "B.Sc in Statistics & Applied Economics",
                        "institution": "St. Xavier's College, Kolkata",
                        "duration": "2016 - 2019",
                        "year": "2019",
                        "grade": "First Class",
                        "description": "Coursework in Probability Distributions, Hypothesis Testing, and Econometrics."
                    }
                ],
                "certifications": [
                    {
                        "name": "CXL Certified Conversion Optimization Specialist",
                        "issuer": "CXL Institute",
                        "year": "2023",
                        "credential_id": "CXL-CRO-551"
                    }
                ],
                "hiring_preferences": {
                    "work_mode": "Remote",
                    "availability": "Immediate",
                    "desired_salary": "Rs. 18 - 25 LPA",
                    "preferred_location": "Remote / Kolkata",
                    "job_type": "Full-Time",
                    "relocation": "Open to relocation"
                },
                "portfolio_url": "https://meerasen-cro.dev",
                "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
                "resume_url": "https://assets.uptrix.dev/resumes/meera_sen_cv.pdf",
                "resume_filename": "Meera_Sen_Resume.pdf"
            },
            {
                "full_name": "Rahul Kapoor",
                "email": "rahul.kapoor@uptrix.dev",
                "phone": "+91 98765 11011",
                "city": "Gurugram",
                "state": "Haryana",
                "place": "Delhi NCR (Gurugram)",
                "title": "B2B Lifecycle & Marketing Automation Manager",
                "summary": "CRM and lifecycle architect with 5+ years designing automated lead-scoring, nurturing, and customer expansion workflows in HubSpot, Marketo, and Salesforce.",
                "skills": ["HubSpot", "Marketo", "Salesforce CRM", "Customer.io", "Lead Scoring", "Zapier", "Email Deliverability", "Segment"],
                "expertise": ["Lead-to-Revenue Alignment", "Churn Prevention Automation", "Account-Based Marketing (ABM)", "Database Health"],
                "experience": [
                    {
                        "title": "Lifecycle Marketing Manager",
                        "company": "Pine Labs",
                        "duration": "2022 - Present",
                        "location": "Gurugram, India",
                        "employment_type": "Full-Time",
                        "description": "Orchestrated automated onboarding sequences for 80,000+ merchants, increasing 30-day product adoption by 27%.",
                        "technologies": ["HubSpot Enterprise", "Salesforce", "Customer.io", "SQL"]
                    },
                    {
                        "title": "CRM Specialist",
                        "company": "PolicyBazaar",
                        "duration": "2019 - 2022",
                        "location": "Gurugram, India",
                        "employment_type": "Full-Time",
                        "description": "Re-engaged dormant leads through multi-channel WhatsApp and email workflows, generating Rs. 3.5Cr in incremental insurance premiums.",
                        "technologies": ["Marketo", "LeadSquared", "Gupshup API"]
                    }
                ],
                "education": [
                    {
                        "degree": "MBA in Marketing Management",
                        "institution": "IMT Ghaziabad",
                        "duration": "2017 - 2019",
                        "year": "2019",
                        "grade": "3.7/4.0 GPA",
                        "description": "Dean's Honor Roll for Business Analytics and B2B Operations."
                    }
                ],
                "certifications": [
                    {
                        "name": "HubSpot Marketing Software Certified",
                        "issuer": "HubSpot Academy",
                        "year": "2023",
                        "credential_id": "HS-MKT-9912"
                    },
                    {
                        "name": "Adobe Marketo Certified Expert",
                        "issuer": "Adobe",
                        "year": "2022",
                        "credential_id": "ADOBE-MCE-402"
                    }
                ],
                "hiring_preferences": {
                    "work_mode": "Hybrid",
                    "availability": "15 Days",
                    "desired_salary": "Rs. 20 - 26 LPA",
                    "preferred_location": "Delhi NCR / Gurugram",
                    "job_type": "Full-Time",
                    "relocation": "No"
                },
                "portfolio_url": "https://rahulkapoor.marketing",
                "avatar_url": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80",
                "resume_url": "https://assets.uptrix.dev/resumes/rahul_kapoor_cv.pdf",
                "resume_filename": "Rahul_Kapoor_Resume.pdf"
            },
            {
                "full_name": "Divya Menon",
                "email": "divya.menon@uptrix.dev",
                "phone": "+91 98765 11012",
                "city": "Kochi",
                "state": "Kerala",
                "place": "Kochi, Kerala",
                "title": "Creative Director & Brand Strategist",
                "summary": "Visual storyteller with 8 years leading 360-degree brand identities, multi-channel ad concepts, and interactive brand experiences that win national advertising accolades.",
                "skills": ["Brand Strategy", "Art Direction", "Motion Graphics", "Adobe Creative Cloud", "Copy Direction", "Video Production", "Figma"],
                "expertise": ["Direct-to-Consumer Visual Rebranding", "Campaign Conceptualization", "Agency Creative Leadership", "Storyboarding"],
                "experience": [
                    {
                        "title": "Creative Lead",
                        "company": "Ogilvy India",
                        "duration": "2020 - Present",
                        "location": "Mumbai / Remote, India",
                        "employment_type": "Full-Time",
                        "description": "Directed cross-platform digital brand campaigns for top FMCG and fintech clients, winning 2 Kyoorius Creative Awards.",
                        "technologies": ["Adobe Illustrator", "Photoshop", "After Effects", "Figma"]
                    },
                    {
                        "title": "Senior Art Director",
                        "company": "DDB Mudra",
                        "duration": "2016 - 2020",
                        "location": "Bengaluru, India",
                        "employment_type": "Full-Time",
                        "description": "Managed creative production studio executing television and digital video ad campaigns seen by over 30M consumers.",
                        "technologies": ["Premiere Pro", "Cinema 4D", "InDesign"]
                    }
                ],
                "education": [
                    {
                        "degree": "Master of Applied Arts (Commercial Art)",
                        "institution": "College of Art, New Delhi",
                        "duration": "2014 - 2016",
                        "year": "2016",
                        "grade": "Distinction",
                        "description": "Specialization in Visual Communication and Typography."
                    }
                ],
                "certifications": [
                    {
                        "name": "D&AD Masterclass in Brand Narrative",
                        "issuer": "D&AD Global",
                        "year": "2022",
                        "credential_id": "DAD-BN-2022"
                    }
                ],
                "hiring_preferences": {
                    "work_mode": "Hybrid",
                    "availability": "30 Days",
                    "desired_salary": "Rs. 24 - 32 LPA",
                    "preferred_location": "Bengaluru / Kochi",
                    "job_type": "Full-Time",
                    "relocation": "Yes, open to relocation"
                },
                "portfolio_url": "https://behance.net/divyamenon",
                "avatar_url": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80",
                "resume_url": "https://assets.uptrix.dev/resumes/divya_menon_cv.pdf",
                "resume_filename": "Divya_Menon_Resume.pdf"
            },
            {
                "full_name": "Siddharth Joshi",
                "email": "siddharth.joshi@uptrix.dev",
                "phone": "+91 98765 11013",
                "city": "Pune",
                "state": "Maharashtra",
                "place": "Pune, Maharashtra",
                "title": "MarTech Solutions Architect",
                "summary": "Enterprise technology architect with 8+ years designing enterprise data integration between Salesforce Marketing Cloud, Adobe Experience Platform, and Snowflake.",
                "skills": ["Salesforce Marketing Cloud", "Snowflake", "CDP", "Segment", "Kafka", "Data Governance", "Python", "SQL"],
                "expertise": ["Enterprise Identity Resolution", "Real-Time Customer 360", "Privacy & Consent Engineering", "Event-Driven Integration"],
                "experience": [
                    {
                        "title": "MarTech Solutions Architect",
                        "company": "Infosys Consulting",
                        "duration": "2020 - Present",
                        "location": "Pune, India",
                        "employment_type": "Full-Time",
                        "description": "Architected customer data platform integration for Fortune 50 automotive enterprise connecting 14 disparate retail systems into Snowflake.",
                        "technologies": ["Salesforce Marketing Cloud", "Snowflake", "Kafka", "Segment CDP"]
                    },
                    {
                        "title": "Enterprise Integration Specialist",
                        "company": "Wipro",
                        "duration": "2016 - 2020",
                        "location": "Pune, India",
                        "employment_type": "Full-Time",
                        "description": "Engineered automated data feeds between ERP backends and CRM automation suites for global European banks.",
                        "technologies": ["MuleSoft", "Oracle DB", "Python", "REST APIs"]
                    }
                ],
                "education": [
                    {
                        "degree": "B.Tech in Information Technology",
                        "institution": "VJTI Mumbai",
                        "duration": "2012 - 2016",
                        "year": "2016",
                        "grade": "8.9 CGPA",
                        "description": "Focus on Enterprise Databases and Distributed Architectures."
                    }
                ],
                "certifications": [
                    {
                        "name": "Salesforce Certified Marketing Cloud Consultant",
                        "issuer": "Salesforce",
                        "year": "2023",
                        "credential_id": "SF-MCC-8802"
                    },
                    {
                        "name": "SnowPro Core Certified",
                        "issuer": "Snowflake",
                        "year": "2022",
                        "credential_id": "SNOW-CORE-319"
                    }
                ],
                "hiring_preferences": {
                    "work_mode": "Hybrid",
                    "availability": "45 Days",
                    "desired_salary": "Rs. 30 - 40 LPA",
                    "preferred_location": "Pune / Mumbai",
                    "job_type": "Full-Time",
                    "relocation": "Yes, open to relocation"
                },
                "portfolio_url": "https://siddharthjoshi-martech.io",
                "avatar_url": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80",
                "resume_url": "https://assets.uptrix.dev/resumes/siddharth_joshi_cv.pdf",
                "resume_filename": "Siddharth_Joshi_Resume.pdf"
            },
            {
                "full_name": "Tanvi Bhatia",
                "email": "tanvi.bhatia@uptrix.dev",
                "phone": "+91 98765 11014",
                "city": "Noida",
                "state": "Uttar Pradesh",
                "place": "Delhi NCR (Noida)",
                "title": "Performance Marketing Specialist (E-commerce)",
                "summary": "DTC media specialist with 4+ years scaling Shopify brands from Rs. 10L/mo to Rs. 1.5Cr/mo using Meta Ads, Advantage+ shopping campaigns, and creator UGC funnels.",
                "skills": ["Meta Advantage+ Campaigns", "Shopify Analytics", "Klaviyo", "TikTok Ads", "UGC Sourcing", "Google Shopping", "Canva"],
                "expertise": ["D2C Scaling", "Creative Fatigue Management", "First-Order Contribution Margin", "High-Converting UGC"],
                "experience": [
                    {
                        "title": "Performance Marketing Lead",
                        "company": "Mamaearth (Honasa Consumer)",
                        "duration": "2022 - Present",
                        "location": "Gurugram, India",
                        "employment_type": "Full-Time",
                        "description": "Scaled skincare product lines achieving 210% YoY revenue expansion with average 3.2x ROAS on Meta and Google Shopping.",
                        "technologies": ["Meta Ads", "Shopify Plus", "Triple Whale", "Klaviyo"]
                    },
                    {
                        "title": "Media Buyer",
                        "company": "WOW Skin Science",
                        "duration": "2020 - 2022",
                        "location": "Bengaluru, India",
                        "employment_type": "Full-Time",
                        "description": "Executed creative testing sprints testing 40+ dynamic UGC creatives weekly with rapid hook iterations.",
                        "technologies": ["Meta Ads Manager", "Google Ads", "Asana"]
                    }
                ],
                "education": [
                    {
                        "degree": "BBA in Digital Marketing",
                        "institution": "Amity University, Noida",
                        "duration": "2017 - 2020",
                        "year": "2020",
                        "grade": "8.5 CGPA",
                        "description": "Specialized in E-Commerce Retail and Consumer Behavior."
                    }
                ],
                "certifications": [
                    {
                        "name": "Meta Certified Digital Marketing Associate",
                        "issuer": "Meta Blueprint",
                        "year": "2022",
                        "credential_id": "META-DMA-661"
                    }
                ],
                "hiring_preferences": {
                    "work_mode": "Hybrid",
                    "availability": "15 Days",
                    "desired_salary": "Rs. 15 - 20 LPA",
                    "preferred_location": "Delhi NCR",
                    "job_type": "Full-Time",
                    "relocation": "No"
                },
                "portfolio_url": "https://tanvibhatia.dev",
                "avatar_url": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80",
                "resume_url": "https://assets.uptrix.dev/resumes/tanvi_bhatia_cv.pdf",
                "resume_filename": "Tanvi_Bhatia_Resume.pdf"
            },
            {
                "full_name": "Nikhil Mehta",
                "email": "nikhil.mehta@uptrix.dev",
                "phone": "+91 98765 11015",
                "city": "Bengaluru",
                "state": "Karnataka",
                "place": "Bengaluru, Karnataka",
                "title": "Senior Mobile App Growth Marketer",
                "summary": "Mobile acquisition & retention specialist with 5+ years driving 15M+ app installs across FinTech and Gaming apps with deep expertise in App Store Optimization (ASO) and SKAdNetwork attribution.",
                "skills": ["Apple Search Ads", "Google App Campaigns", "AppsFlyer", "Branch.io", "ASO", "CleverTap", "MoEngage", "Mixpanel"],
                "expertise": ["SKAdNetwork 4.0 Compliance", "Push Notification Retention", "In-App Referral Loops", "Cost-Per-Install Arbitrage"],
                "experience": [
                    {
                        "title": "Senior Growth Manager (Mobile)",
                        "company": "Mobile Premier League (MPL)",
                        "duration": "2021 - Present",
                        "location": "Bengaluru, India",
                        "employment_type": "Full-Time",
                        "description": "Cut cost per registered user by 31% while scaling daily installs to 45,000 across iOS and Android.",
                        "technologies": ["AppsFlyer", "Apple Search Ads", "Google UAC", "Tableau"]
                    },
                    {
                        "title": "ASO & App Marketing Executive",
                        "company": "Games24x7",
                        "duration": "2019 - 2021",
                        "location": "Mumbai, India",
                        "employment_type": "Full-Time",
                        "description": "Optimized app store metadata and keyword indexing across 8 regional Indian languages, boosting organic store installs by 58%.",
                        "technologies": ["AppTweak", "SensorTower", "CleverTap"]
                    }
                ],
                "education": [
                    {
                        "degree": "B.Tech in Computer Science",
                        "institution": "Manipal Institute of Technology",
                        "duration": "2015 - 2019",
                        "year": "2019",
                        "grade": "8.3 CGPA",
                        "description": "Focus on Mobile Computing and Statistical Modeling."
                    }
                ],
                "certifications": [
                    {
                        "name": "Apple Search Ads Certified",
                        "issuer": "Apple",
                        "year": "2023",
                        "credential_id": "ASA-CERT-908"
                    },
                    {
                        "name": "AppsFlyer Mobile Attribution Expert",
                        "issuer": "AppsFlyer Academy",
                        "year": "2022",
                        "credential_id": "AF-MAE-1102"
                    }
                ],
                "hiring_preferences": {
                    "work_mode": "Remote",
                    "availability": "Immediate",
                    "desired_salary": "Rs. 22 - 28 LPA",
                    "preferred_location": "Bengaluru / Remote",
                    "job_type": "Full-Time",
                    "relocation": "Open to relocation"
                },
                "portfolio_url": "https://nikhilappgrowth.dev",
                "avatar_url": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80",
                "resume_url": "https://assets.uptrix.dev/resumes/nikhil_mehta_cv.pdf",
                "resume_filename": "Nikhil_Mehta_Resume.pdf"
            },
            {
                "full_name": "Ishita Gupta",
                "email": "ishita.gupta@uptrix.dev",
                "phone": "+91 98765 11016",
                "city": "Gurugram",
                "state": "Haryana",
                "place": "Delhi NCR (Gurugram)",
                "title": "AI Marketing & Generative Automation Specialist",
                "summary": "Innovator applying large language models, Midjourney, and automated generative workflows to produce localized marketing copy, dynamic banner generation, and AI marketing copilot tools.",
                "skills": ["Prompt Engineering", "OpenAI API", "LangChain", "Midjourney", "Python", "Zapier", "Marketing Automation", "FastAPI"],
                "expertise": ["Automated Dynamic Creative Optimization", "AI Workflow Orchestration", "Hyper-Personalization", "Custom GPT Agents"],
                "experience": [
                    {
                        "title": "AI Growth Strategist",
                        "company": "InMobi",
                        "duration": "2022 - Present",
                        "location": "Bengaluru / Gurugram, India",
                        "employment_type": "Full-Time",
                        "description": "Engineered automated AI ad copy generation pipeline reducing creative turnaround time from 4 days to 20 minutes across 12 languages.",
                        "technologies": ["OpenAI API", "Python", "LangChain", "FastAPI", "Redis"]
                    },
                    {
                        "title": "Content & Automation Lead",
                        "company": "Mindtickle",
                        "duration": "2020 - 2022",
                        "location": "Pune, India",
                        "employment_type": "Full-Time",
                        "description": "Developed internal prompt engineering library and sales enablement workflows adopted by 40+ content creators.",
                        "technologies": ["Zapier", "Make.com", "Airtable", "Notion API"]
                    }
                ],
                "education": [
                    {
                        "degree": "B.Tech in Computer Engineering",
                        "institution": "Delhi Technological University (DTU)",
                        "duration": "2016 - 2020",
                        "year": "2020",
                        "grade": "8.8 CGPA",
                        "description": "Specialization in Natural Language Processing and Artificial Intelligence."
                    }
                ],
                "certifications": [
                    {
                        "name": "Prompt Engineering for Developers",
                        "issuer": "DeepLearning.AI",
                        "year": "2023",
                        "credential_id": "DLAI-PE-884"
                    }
                ],
                "hiring_preferences": {
                    "work_mode": "Remote",
                    "availability": "Immediate",
                    "desired_salary": "Rs. 24 - 30 LPA",
                    "preferred_location": "Delhi NCR / Remote",
                    "job_type": "Full-Time",
                    "relocation": "Yes, open to relocation"
                },
                "portfolio_url": "https://ishitagupta-ai.dev",
                "avatar_url": "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&auto=format&fit=crop&q=80",
                "resume_url": "https://assets.uptrix.dev/resumes/ishita_gupta_cv.pdf",
                "resume_filename": "Ishita_Gupta_Resume.pdf"
            },
            {
                "full_name": "Manoj Kumar",
                "email": "manoj.kumar@uptrix.dev",
                "phone": "+91 98765 11017",
                "city": "Hyderabad",
                "state": "Telangana",
                "place": "Hyderabad, Telangana",
                "title": "Director of Paid Search & Performance Media",
                "summary": "9+ years directing high-intent search campaigns across Google Ads, Bing, and Amazon Advertising. Managed $10M+ aggregate search ad spend for enterprise SaaS, healthcare, and finance clients.",
                "skills": ["Google Search Ads", "Performance Max", "Amazon Ads", "Search Ads 360", "Scripts for Google Ads", "Bidding Algorithms", "Looker Studio"],
                "expertise": ["Enterprise SEM Account Architecture", "Negative Keyword Sculpting", "Smart Bidding Migration", "Executive Media Stewardship"],
                "experience": [
                    {
                        "title": "Search Media Director",
                        "company": "Merkle Sokrati",
                        "duration": "2019 - Present",
                        "location": "Pune / Hyderabad, India",
                        "employment_type": "Full-Time",
                        "description": "Supervised a team of 14 media buyers managing 25 enterprise search accounts with $1.2M monthly Google Ads budget.",
                        "technologies": ["Search Ads 360", "Google Ads Scripts", "BigQuery", "Tableau"]
                    },
                    {
                        "title": "Senior PPC Strategist",
                        "company": "GroupM",
                        "duration": "2015 - 2019",
                        "location": "Mumbai, India",
                        "employment_type": "Full-Time",
                        "description": "Optimized Google Search and Shopping campaigns for leading pharmaceutical and banking conglomerates.",
                        "technologies": ["Google Ads", "Bing Ads", "Marin Software"]
                    }
                ],
                "education": [
                    {
                        "degree": "MBA in Marketing",
                        "institution": "SIBM Pune",
                        "duration": "2013 - 2015",
                        "year": "2015",
                        "grade": "First Class",
                        "description": "Specialization in Strategic Media Management."
                    },
                    {
                        "degree": "B.Sc in Mathematics",
                        "institution": "University of Hyderabad",
                        "duration": "2010 - 2013",
                        "year": "2013",
                        "grade": "Distinction",
                        "description": "Top rank in Numerical Analysis."
                    }
                ],
                "certifications": [
                    {
                        "name": "Google Ads Search Professional",
                        "issuer": "Google",
                        "year": "2023",
                        "credential_id": "GOOG-PPC-901"
                    }
                ],
                "hiring_preferences": {
                    "work_mode": "Hybrid",
                    "availability": "30 Days",
                    "desired_salary": "Rs. 32 - 42 LPA",
                    "preferred_location": "Hyderabad",
                    "job_type": "Full-Time",
                    "relocation": "No"
                },
                "portfolio_url": "https://manojppc.dev",
                "avatar_url": "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200&auto=format&fit=crop&q=80",
                "resume_url": "https://assets.uptrix.dev/resumes/manoj_kumar_cv.pdf",
                "resume_filename": "Manoj_Kumar_Resume.pdf"
            },
            {
                "full_name": "Riya Chatterjee",
                "email": "riya.chatterjee@uptrix.dev",
                "phone": "+91 98765 11018",
                "city": "Mumbai",
                "state": "Maharashtra",
                "place": "Mumbai, Maharashtra",
                "title": "Influencer & Affiliate Marketing Strategist",
                "summary": "Influencer growth architect with 5+ years managing 500+ micro and macro creators across beauty, lifestyle, and edtech. Built high-yield affiliate commission programs delivering 4.5x blended ROI.",
                "skills": ["Influencer Sourcing", "Affiliate Networks", "Contract Negotiation", "Creator Briefing", "Tracking Links", "Instagram Reels", "Impact.com"],
                "expertise": ["Performance-Based Creator Contracting", "Affiliate Fraud Prevention", "Viral Brand Seeding", "Gifting Campaign Architecture"],
                "experience": [
                    {
                        "title": "Influencer Marketing Lead",
                        "company": "SUGAR Cosmetics",
                        "duration": "2021 - Present",
                        "location": "Mumbai, India",
                        "employment_type": "Full-Time",
                        "description": "Directed Rs. 5Cr annual influencer budget across 300+ creator partnerships, driving 40% of festive sale customer acquisitions.",
                        "technologies": ["Impact.com", "HypeAuditor", "Modash", "Asana"]
                    },
                    {
                        "title": "Brand Partnerships Specialist",
                        "company": "Plum Goodness",
                        "duration": "2019 - 2021",
                        "location": "Mumbai, India",
                        "employment_type": "Full-Time",
                        "description": "Built ambassador network of 250 organic micro-influencers achieving 6.8% average engagement rate.",
                        "technologies": ["Instagram Insights", "Canva", "Excel Modeling"]
                    }
                ],
                "education": [
                    {
                        "degree": "B.A. in Advertising & Mass Media",
                        "institution": "St. Xavier's College, Mumbai",
                        "duration": "2016 - 2019",
                        "year": "2019",
                        "grade": "First Class with Distinction",
                        "description": "Focus on Brand Endorsements and Consumer Psychology."
                    }
                ],
                "certifications": [
                    {
                        "name": "Impact.com Certified Partnerships Specialist",
                        "issuer": "Impact.com",
                        "year": "2022",
                        "credential_id": "IMP-PART-302"
                    }
                ],
                "hiring_preferences": {
                    "work_mode": "Hybrid",
                    "availability": "15 Days",
                    "desired_salary": "Rs. 16 - 22 LPA",
                    "preferred_location": "Mumbai",
                    "job_type": "Full-Time",
                    "relocation": "Yes, open to relocation"
                },
                "portfolio_url": "https://riyachatterjee.agency",
                "avatar_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
                "resume_url": "https://assets.uptrix.dev/resumes/riya_chatterjee_cv.pdf",
                "resume_filename": "Riya_Chatterjee_Resume.pdf"
            },
            {
                "full_name": "Aditya Kulkarni",
                "email": "aditya.kulkarni@uptrix.dev",
                "phone": "+91 98765 11019",
                "city": "Pune",
                "state": "Maharashtra",
                "place": "Pune, Maharashtra",
                "title": "Senior Retention & CRM Marketing Specialist",
                "summary": "Retention and loyalty strategist with 6 years experience driving repeat purchase rates, maximizing 90-day LTV, and implementing RFM segmentation in MoEngage, CleverTap, and Klaviyo.",
                "skills": ["CleverTap", "MoEngage", "RFM Segmentation", "Klaviyo", "SMS/WhatsApp Campaigns", "Loyalty Programs", "SQL", "Cohort Analysis"],
                "expertise": ["LTV Maximization", "Churn Prediction & Winback", "Omnichannel Messaging Orchestration", "Push Deliverability"],
                "experience": [
                    {
                        "title": "Retention Marketing Lead",
                        "company": "Curefit (Cult.fit)",
                        "duration": "2021 - Present",
                        "location": "Bengaluru / Pune, India",
                        "employment_type": "Full-Time",
                        "description": "Decreased 60-day subscription churn by 18% through dynamic WhatsApp and app push workflows triggered by workout frequency.",
                        "technologies": ["MoEngage", "CleverTap", "Mixpanel", "BigQuery"]
                    },
                    {
                        "title": "Lifecycle Marketing Executive",
                        "company": "Pepperfry",
                        "duration": "2018 - 2021",
                        "location": "Mumbai, India",
                        "employment_type": "Full-Time",
                        "description": "Built personalized repeat-purchase triggers based on browse abandonment and delivery confirmations, lifting repeat revenue by 24%.",
                        "technologies": ["Netcore", "WebEngage", "Google Analytics"]
                    }
                ],
                "education": [
                    {
                        "degree": "B.E. in Computer Engineering",
                        "institution": "MIT World Peace University, Pune",
                        "duration": "2014 - 2018",
                        "year": "2018",
                        "grade": "8.4 CGPA",
                        "description": "Major in Database Management Systems and Algorithms."
                    }
                ],
                "certifications": [
                    {
                        "name": "CleverTap Certified Engagement Professional",
                        "issuer": "CleverTap",
                        "year": "2023",
                        "credential_id": "CT-CEP-772"
                    }
                ],
                "hiring_preferences": {
                    "work_mode": "Hybrid",
                    "availability": "30 Days",
                    "desired_salary": "Rs. 20 - 27 LPA",
                    "preferred_location": "Pune / Bengaluru",
                    "job_type": "Full-Time",
                    "relocation": "Yes, open to relocation"
                },
                "portfolio_url": "https://adityakulkarni.co",
                "avatar_url": "https://images.unsplash.com/photo-1521119989659-a83eee488004?w=200&auto=format&fit=crop&q=80",
                "resume_url": "https://assets.uptrix.dev/resumes/aditya_kulkarni_cv.pdf",
                "resume_filename": "Aditya_Kulkarni_Resume.pdf"
            },
            {
                "full_name": "Neha Singh",
                "email": "neha.singh@uptrix.dev",
                "phone": "+91 98765 11020",
                "city": "Bengaluru",
                "state": "Karnataka",
                "place": "Bengaluru, Karnataka",
                "title": "Senior Digital Media Planner & Buyer",
                "summary": "Omnichannel media planner with 6+ years allocating Rs. 30Cr+ budgets across programmatic DSPs (DV360, The Trade Desk), YouTube, LinkedIn, and premium native ad networks.",
                "skills": ["DV360", "The Trade Desk", "Programmatic Buying", "YouTube Advertising", "Media Planning", "Comscore", "Nielsen DAR"],
                "expertise": ["Cross-Channel Reach & Frequency Optimization", "Brand Safety & Viewability", "Programmatic Deal ID Curation", "Media Mix Strategy"],
                "experience": [
                    {
                        "title": "Senior Media Planner & Programmatic Lead",
                        "company": "MediaCom / GroupM",
                        "duration": "2021 - Present",
                        "location": "Bengaluru, India",
                        "employment_type": "Full-Time",
                        "description": "Managed programmatic DSP strategy for automotive and banking conglomerates with Rs. 2.5Cr monthly spend, achieving 88% brand-safe viewability.",
                        "technologies": ["DV360", "The Trade Desk", "CM360", "Google Ads"]
                    },
                    {
                        "title": "Digital Media Buyer",
                        "company": "Dentsu",
                        "duration": "2018 - 2021",
                        "location": "Bengaluru, India",
                        "employment_type": "Full-Time",
                        "description": "Executed connected TV and video ad campaigns reaching 40M unique Indian internet users.",
                        "technologies": ["Google Ads", "YouTube TrueView", "Comscore"]
                    }
                ],
                "education": [
                    {
                        "degree": "MBA in Strategic Media Management",
                        "institution": "MICA, Ahmedabad",
                        "duration": "2016 - 2018",
                        "year": "2018",
                        "grade": "3.8/4.0 GPA",
                        "description": "Top Honors in Digital Media Economics and Brand Strategy."
                    },
                    {
                        "degree": "B.Tech in Computer Science",
                        "institution": "Manipal University",
                        "duration": "2012 - 2016",
                        "year": "2016",
                        "grade": "8.1 CGPA",
                        "description": "Graduated First Class."
                    }
                ],
                "certifications": [
                    {
                        "name": "Display & Video 360 Certified",
                        "issuer": "Google Skillshop",
                        "year": "2023",
                        "credential_id": "DV360-CERT-110"
                    },
                    {
                        "name": "The Trade Desk Edge Academy Certified",
                        "issuer": "The Trade Desk",
                        "year": "2022",
                        "credential_id": "TTD-EDGE-504"
                    }
                ],
                "hiring_preferences": {
                    "work_mode": "Hybrid",
                    "availability": "Immediate",
                    "desired_salary": "Rs. 22 - 29 LPA",
                    "preferred_location": "Bengaluru",
                    "job_type": "Full-Time",
                    "relocation": "Open to relocation"
                },
                "portfolio_url": "https://nehasinghmedia.com",
                "avatar_url": "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&auto=format&fit=crop&q=80",
                "resume_url": "https://assets.uptrix.dev/resumes/neha_singh_cv.pdf",
                "resume_filename": "Neha_Singh_Resume.pdf"
            }
        ]

        candidates_added = 0
        for cdata in seed_candidates:
            cuser = db.query(User).filter(User.email == cdata["email"]).first()
            if not cuser:
                cuser = User(
                    email=cdata["email"],
                    password_hash=hash_password("123"),
                    role="CANDIDATE",
                    is_verified=True
                )
                db.add(cuser)
                db.flush()
            else:
                cuser.password_hash = hash_password("123")
                cuser.role = "CANDIDATE"
                cuser.is_verified = True
                db.flush()

            cand = db.query(Candidate).filter(Candidate.user_id == cuser.id).first()
            if not cand:
                cand = Candidate(
                    user_id=cuser.id,
                    full_name=cdata["full_name"],
                    phone=cdata["phone"],
                    place=cdata["place"],
                    city=cdata["city"],
                    state=cdata["state"],
                    title=cdata["title"],
                    summary=cdata["summary"],
                    skills=cdata["skills"],
                    expertise=cdata["expertise"],
                    experience=cdata["experience"],
                    education=cdata["education"],
                    certifications=cdata["certifications"],
                    hiring_preferences=cdata["hiring_preferences"],
                    portfolio_url=cdata["portfolio_url"],
                    avatar_url=cdata["avatar_url"],
                    resume_url=cdata["resume_url"],
                    resume_filename=cdata["resume_filename"]
                )
                db.add(cand)
                candidates_added += 1
            else:
                cand.full_name = cdata["full_name"]
                cand.phone = cdata["phone"]
                cand.place = cdata["place"]
                cand.city = cdata["city"]
                cand.state = cdata["state"]
                cand.title = cdata["title"]
                cand.summary = cdata["summary"]
                cand.skills = cdata["skills"]
                cand.expertise = cdata["expertise"]
                cand.experience = cdata["experience"]
                cand.education = cdata["education"]
                cand.certifications = cdata["certifications"]
                cand.hiring_preferences = cdata["hiring_preferences"]
                cand.portfolio_url = cdata["portfolio_url"]
                cand.avatar_url = cdata["avatar_url"]
                cand.resume_url = cdata["resume_url"]
                cand.resume_filename = cdata["resume_filename"]

            db.flush()

        db.commit()
        print("Database successfully seeded with requested users, jobs, and candidates:")
        print(" - admin@uptrix.com (123) [ADMIN]")
        print(" - recruiter@uptrix.com (123) [RECRUITER]")
        print(" - manager@uptrix.com (123) [HIRING_MANAGER]")
        print(" - student@gmail.com (123) [CANDIDATE]")
        print(f" - Added/verified {len(seed_jobs)} jobs for Uptrix Corporation ({jobs_added_count} newly inserted)")
        print(f" - Added/verified {len(seed_candidates)} candidate profiles ({candidates_added} newly created)")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed()

