"""
Script to add 20 professional job requisitions for any Recruiter.

HOW TO CHANGE THE RECRUITER:
================================================================================
Option 1: Pass the email or User ID directly when running the command:
    python add_recruiter_jobs.py another_recruiter@example.com
    python add_recruiter_jobs.py 26

Option 2: Edit the TARGET_RECRUITER variable below:
    TARGET_RECRUITER = "another_recruiter@example.com"  # or user ID number, e.g. 26
================================================================================
"""
import sys
from datetime import datetime
from app.database import SessionLocal
from app.models.user import User
from app.models.company import Company, CompanyMember, StaffGroup, StaffGroupMember
from app.models.job import Job

# >>> SET DEFAULT RECRUITER EMAIL OR USER ID HERE <<<
TARGET_RECRUITER = "recruiter@kyadari.com"


def resolve_recruiter(db, identifier):
    """Find user by email or numeric user ID."""
    # Check if identifier is numeric ID
    if isinstance(identifier, int) or (isinstance(identifier, str) and identifier.strip().isdigit()):
        user = db.query(User).filter(User.id == int(identifier)).first()
    else:
        user = db.query(User).filter(User.email.ilike(str(identifier).strip())).first()
    return user


def add_jobs(target_identifier=None):
    identifier = target_identifier or TARGET_RECRUITER
    db = SessionLocal()
    try:
        user = resolve_recruiter(db, identifier)
        if not user:
            print(f"\n[ERROR] Recruiter with identifier '{identifier}' was not found in the database!")
            available_users = db.query(User).filter(User.role.in_(["RECRUITER", "ADMIN"])).all()
            print("Available recruiters & admins in the system:")
            for u in available_users:
                print(f"  - User ID: {u.id:2d} | Email: {u.email:<30} | Role: {u.role}")
            sys.exit(1)

        print(f"\n[OK] Found Recruiter: User ID={user.id}, Email='{user.email}', Role={user.role}")

        # Resolve associated company
        company = None
        member = db.query(CompanyMember).filter(CompanyMember.user_id == user.id).first()
        if member:
            company = db.query(Company).filter(Company.id == member.company_id).first()
        elif user.company_profile:
            company = user.company_profile
        elif user.company_member_profile:
            company = db.query(Company).filter(Company.id == user.company_member_profile.company_id).first()

        if not company:
            # Fallback to company with user_id or first company
            company = db.query(Company).filter(Company.user_id == user.id).first()

        if not company:
            print(f"[ERROR] No company profile or company membership found for user '{user.email}' (ID: {user.id})!")
            sys.exit(1)

        print(f"[OK] Associated Company: ID={company.id}, Name='{company.company_name}', Current Max Jobs={company.max_jobs}")

        # Resolve staff pod / group for this member (if any)
        group_id = None
        if member:
            sgm = db.query(StaffGroupMember).filter(StaffGroupMember.member_id == member.id).first()
            if sgm:
                group_id = sgm.group_id

        if not group_id:
            grp = db.query(StaffGroup).filter(StaffGroup.company_id == company.id).first()
            if grp:
                group_id = grp.id

        if group_id:
            grp_obj = db.query(StaffGroup).filter(StaffGroup.id == group_id).first()
            grp_name = grp_obj.name if grp_obj else "Unknown"
            print(f"[OK] Assigning jobs to Staff Group: ID={group_id} ('{grp_name}')")
        else:
            print("[INFO] No staff hiring group found; jobs will be created without group restriction.")

        job_definitions = [
            {
                "title": "Senior Performance Marketing Manager (Meta & Google Ads)",
                "description": "Drive exponential customer acquisition and ROAS across paid channels (Meta Ads, Google Search/Performance Max, and programmatic). You will oversee multi-million rupee budgets, build creative testing frameworks, and partner with our analytics and creative teams to scale full-funnel paid campaigns.",
                "skills": ["Meta Ads Manager", "Google Ads", "ROAS Optimization", "Attribution Modeling", "A/B Testing", "GA4", "Media Planning"],
                "experience_level": "Senior Level",
                "ownership_level": "End-to-End Ownership",
                "specialization": "Performance Marketing & Paid Acquisition",
                "must_have_capabilities": "Demonstrated history of scaling monthly ad spend past ₹25L+ at >3.5x ROAS; mastery of Meta Pixel, Conversion API, and GA4 event tracking.",
                "preferred_capabilities": "Experience in B2B SaaS and D2C brands, familiarity with Triple Whale or Northbeam attribution tools.",
                "availability_requirement": "Immediate (0-15 days)",
                "min_experience": "4-7 Years",
                "salary_min": 1400000,
                "salary_max": 2200000,
                "salary_currency": "INR",
                "location": "Bengaluru, India",
                "work_mode": "Hybrid",
                "job_type": "Full-Time",
                "product_service": "Kyadari Growth & Performance Suite",
                "business_model": "B2B SaaS / Growth Agency",
                "growth_stage": "Growth / Scale-Up",
                "screening_questions": [
                    {"question": "What is the highest monthly ad budget you have directly managed, and what ROAS did you achieve?", "required": True},
                    {"question": "How do you approach creative fatigue and audience saturation in Meta Ads?", "required": True}
                ],
                "interview_rounds": [
                    {"round_number": 1, "name": "Talent Partner Discovery", "type": "Phone/Video"},
                    {"round_number": 2, "name": "Paid Acquisition Case Study & Deep Dive", "type": "Technical"},
                    {"round_number": 3, "name": "Head of Growth & Culture Alignment", "type": "Behavioral"}
                ]
            },
            {
                "title": "Full Stack React & Node.js Engineer",
                "description": "Architect and develop high-performance web applications, responsive customer portals, and internal workflow automation tooling using modern TypeScript, React, and Node.js microservices.",
                "skills": ["React.js", "Node.js", "TypeScript", "PostgreSQL", "REST APIs", "TailwindCSS", "AWS", "Docker"],
                "experience_level": "Mid-Senior",
                "ownership_level": "Module Lead",
                "specialization": "Full Stack Engineering",
                "must_have_capabilities": "Strong command of React 18+, modern state management (Zustand/Redux), Express/Fastify backends, and clean SQL schema design.",
                "preferred_capabilities": "Familiarity with serverless AWS Lambda, Docker container deployments, and WebSockets.",
                "availability_requirement": "15-30 days",
                "min_experience": "3-6 Years",
                "salary_min": 1300000,
                "salary_max": 2100000,
                "salary_currency": "INR",
                "location": "Hyderabad, India",
                "work_mode": "Hybrid",
                "job_type": "Full-Time",
                "product_service": "Kyadari Cloud Portals",
                "business_model": "B2B SaaS",
                "growth_stage": "Growth / Scale-Up",
                "screening_questions": [
                    {"question": "Share a link to your GitHub profile or a live full-stack app you built.", "required": True},
                    {"question": "How do you handle database connection pooling and API error boundaries in production?", "required": True}
                ],
                "interview_rounds": [
                    {"round_number": 1, "name": "Technical Screen", "type": "Phone/Video"},
                    {"round_number": 2, "name": "Live Coding & Architecture Review", "type": "Technical"},
                    {"round_number": 3, "name": "Engineering Leadership Fit", "type": "Behavioral"}
                ]
            },
            {
                "title": "Lead UI/UX Product Designer",
                "description": "Own end-to-end design across our client dashboards, design system, and candidate recruitment experiences. Transform complex analytics and workflows into intuitive, visually breathtaking, and frictionless web and mobile interfaces.",
                "skills": ["Figma", "Design Systems", "User Research", "Wireframing", "Prototyping", "Micro-interactions", "Usability Testing"],
                "experience_level": "Lead",
                "ownership_level": "End-to-End Ownership",
                "specialization": "Product Design & UX Systems",
                "must_have_capabilities": "Portfolio exhibiting state-of-the-art SaaS product UI, scalable Figma component token libraries, and deep understanding of user psychology.",
                "preferred_capabilities": "Hands-on experience with Framer motion or frontend CSS token handoff.",
                "availability_requirement": "Immediate (0-15 days)",
                "min_experience": "5-8 Years",
                "salary_min": 1600000,
                "salary_max": 2500000,
                "salary_currency": "INR",
                "location": "Remote (India)",
                "work_mode": "Remote",
                "job_type": "Full-Time",
                "product_service": "Kyadari Design System & Client Apps",
                "business_model": "B2B SaaS",
                "growth_stage": "Growth / Scale-Up",
                "screening_questions": [
                    {"question": "Please provide a link to your online design portfolio or Figma case study.", "required": True},
                    {"question": "How do you align design system governance across cross-functional engineering pods?", "required": False}
                ],
                "interview_rounds": [
                    {"round_number": 1, "name": "Portfolio Walkthrough", "type": "Phone/Video"},
                    {"round_number": 2, "name": "Design Challenge & Whiteboard Session", "type": "Technical"},
                    {"round_number": 3, "name": "Founder & Product Alignment", "type": "Behavioral"}
                ]
            },
            {
                "title": "SEO & Organic Growth Strategist",
                "description": "Lead search visibility and organic revenue growth. Conduct in-depth technical audits, craft topical authority maps, optimize on-page signals, and build authoritative digital PR backlinks.",
                "skills": ["Technical SEO", "Semrush", "Ahrefs", "Content Strategy", "Core Web Vitals", "Schema Markup", "GA4", "Search Console"],
                "experience_level": "Mid-Senior",
                "ownership_level": "Strategic Driver",
                "specialization": "Organic Search & Inbound Growth",
                "must_have_capabilities": "Proven track record of taking domains from 10k to 250k+ monthly organic visitors; mastery of technical crawl audits and topical clustering.",
                "preferred_capabilities": "Knowledge of AI content workflows and international multi-lingual SEO.",
                "availability_requirement": "15-30 days",
                "min_experience": "3-6 Years",
                "salary_min": 900000,
                "salary_max": 1500000,
                "salary_currency": "INR",
                "location": "Mumbai, India",
                "work_mode": "Hybrid",
                "job_type": "Full-Time",
                "product_service": "Kyadari Media Platform",
                "business_model": "Digital Media & Agency",
                "growth_stage": "Growth / Scale-Up",
                "screening_questions": [
                    {"question": "Describe a technical SEO issue you identified and fixed that resulted in substantial traffic growth.", "required": True},
                    {"question": "What is your strategy for maintaining topical authority amidst Google Core Algorithm updates?", "required": True}
                ],
                "interview_rounds": [
                    {"round_number": 1, "name": "SEO Aptitude Screen", "type": "Phone/Video"},
                    {"round_number": 2, "name": "Live SEO Audit & Strategy Presentation", "type": "Technical"},
                    {"round_number": 3, "name": "Leadership Discussion", "type": "Behavioral"}
                ]
            },
            {
                "title": "DevOps & Cloud Infrastructure Engineer",
                "description": "Maintain highly available cloud microservices, automate CI/CD release cycles, ensure resilient disaster recovery, and manage Kubernetes clusters on AWS.",
                "skills": ["AWS", "Docker", "Kubernetes", "CI/CD", "Terraform", "PostgreSQL", "Linux", "Prometheus", "Grafana"],
                "experience_level": "Senior Level",
                "ownership_level": "Core Engineer",
                "specialization": "DevOps & Cloud Systems",
                "must_have_capabilities": "Production mastery of AWS (ECS/EKS, RDS, S3, CloudFront), Infrastructure as Code (Terraform), and GitHub Actions pipeline automation.",
                "preferred_capabilities": "AWS Certified Solutions Architect certification and zero-downtime database migration experience.",
                "availability_requirement": "30 days",
                "min_experience": "4-7 Years",
                "salary_min": 1600000,
                "salary_max": 2400000,
                "salary_currency": "INR",
                "location": "Bengaluru, India",
                "work_mode": "Remote",
                "job_type": "Full-Time",
                "product_service": "Kyadari Cloud Infrastructure",
                "business_model": "B2B Enterprise",
                "growth_stage": "Series A/B",
                "screening_questions": [
                    {"question": "Describe your experience setting up CI/CD pipelines with zero-downtime blue/green deployments.", "required": True},
                    {"question": "How do you monitor and alert on service degradation in distributed environments?", "required": True}
                ],
                "interview_rounds": [
                    {"round_number": 1, "name": "Recruiter Phone Screen", "type": "Phone/Video"},
                    {"round_number": 2, "name": "Hands-on Infrastructure & Debugging Scenario", "type": "Technical"},
                    {"round_number": 3, "name": "VP of Engineering Discussion", "type": "Behavioral"}
                ]
            },
            {
                "title": "Retention & Lifecycle Marketing Specialist (Klaviyo / Braze)",
                "description": "Design and execute automated lifecycle marketing journeys, customer retention flows, behavioral segmentation, and SMS/push notification campaigns that boost customer lifetime value (LTV).",
                "skills": ["Klaviyo", "Braze", "Email Automation", "Audience Segmentation", "Retention Strategy", "Copywriting", "A/B Testing"],
                "experience_level": "Mid Level",
                "ownership_level": "Channel Lead",
                "specialization": "CRM & Lifecycle Marketing",
                "must_have_capabilities": "Deep expertise building automated trigger flows (welcome, browse abandonment, win-back, post-purchase) with high deliverability metrics.",
                "preferred_capabilities": "HTML email template development and Liquid logic dynamic personalization.",
                "availability_requirement": "Immediate (0-15 days)",
                "min_experience": "2-5 Years",
                "salary_min": 800000,
                "salary_max": 1400000,
                "salary_currency": "INR",
                "location": "Delhi NCR, India",
                "work_mode": "Hybrid",
                "job_type": "Full-Time",
                "product_service": "Kyadari Growth Engine",
                "business_model": "D2C & B2B Solutions",
                "growth_stage": "Growth / Scale-Up",
                "screening_questions": [
                    {"question": "Which CRM / ESP platforms have you used, and what average open/click-through rates do you typically achieve?", "required": True},
                    {"question": "How do you diagnose and fix sudden email deliverability or spam folder issues?", "required": True}
                ],
                "interview_rounds": [
                    {"round_number": 1, "name": "HR Screen", "type": "Phone/Video"},
                    {"round_number": 2, "name": "Campaign Optimization Case Study", "type": "Technical"},
                    {"round_number": 3, "name": "Marketing Director Fit", "type": "Behavioral"}
                ]
            },
            {
                "title": "Senior Backend Engineer (Python / FastAPI / PostgreSQL)",
                "description": "Build high-throughput REST APIs, asynchronous task workers, database schemas, and third-party integrations powering our hiring and analytics platforms.",
                "skills": ["Python", "FastAPI", "SQLAlchemy", "PostgreSQL", "Redis", "Celery", "Docker", "Pytest"],
                "experience_level": "Senior Level",
                "ownership_level": "Module Lead",
                "specialization": "Backend API Engineering",
                "must_have_capabilities": "Robust production experience with FastAPI or Django, complex SQL query tuning, indexing, and asynchronous execution with Redis/Celery.",
                "preferred_capabilities": "Experience implementing OAuth2, JWT security, and payment gateways like Razorpay/Stripe.",
                "availability_requirement": "15-30 days",
                "min_experience": "4-7 Years",
                "salary_min": 1500000,
                "salary_max": 2300000,
                "salary_currency": "INR",
                "location": "Hyderabad, India",
                "work_mode": "Hybrid",
                "job_type": "Full-Time",
                "product_service": "Kyadari Core Backend",
                "business_model": "B2B SaaS",
                "growth_stage": "Growth / Scale-Up",
                "screening_questions": [
                    {"question": "Explain how you handle concurrency and database locking in high-volume API endpoints.", "required": True},
                    {"question": "Share a GitHub repository or snippet demonstrating your Python backend architecture.", "required": True}
                ],
                "interview_rounds": [
                    {"round_number": 1, "name": "Initial Screening", "type": "Phone/Video"},
                    {"round_number": 2, "name": "Backend Coding & System Design", "type": "Technical"},
                    {"round_number": 3, "name": "Engineering Culture & Team Fit", "type": "Behavioral"}
                ]
            },
            {
                "title": "Senior Content Marketing & Copywriting Lead",
                "description": "Direct content storytelling across blogs, whitepapers, social media, landing pages, and executive thought leadership. Translate technical digital marketing concepts into compelling conversion-driven narratives.",
                "skills": ["Content Strategy", "B2B Copywriting", "Editorial Direction", "SEO Writing", "LinkedIn Thought Leadership", "Brand Storytelling"],
                "experience_level": "Mid-Senior",
                "ownership_level": "Lead",
                "specialization": "Brand Communications & Copywriting",
                "must_have_capabilities": "Superb English writing skills with proven published articles, landing page copy, and case studies that generated measurable pipeline.",
                "preferred_capabilities": "Experience managing freelance writers and collaborating with graphic designers.",
                "availability_requirement": "Immediate (0-15 days)",
                "min_experience": "4-6 Years",
                "salary_min": 1000000,
                "salary_max": 1600000,
                "salary_currency": "INR",
                "location": "Pune, India",
                "work_mode": "Hybrid",
                "job_type": "Full-Time",
                "product_service": "Kyadari Brand Marketing",
                "business_model": "Digital Agency & Media",
                "growth_stage": "Growth / Scale-Up",
                "screening_questions": [
                    {"question": "Provide links to 2-3 of your best writing samples or published articles.", "required": True},
                    {"question": "How do you adapt tone of voice between technical B2B whitepapers and viral social posts?", "required": False}
                ],
                "interview_rounds": [
                    {"round_number": 1, "name": "Recruiter Discussion", "type": "Phone/Video"},
                    {"round_number": 2, "name": "Copywriting Assignment & Pitch", "type": "Technical"},
                    {"round_number": 3, "name": "Head of Content & Editorial Fit", "type": "Behavioral"}
                ]
            },
            {
                "title": "Data Analyst & Business Intelligence Specialist",
                "description": "Transform multi-channel marketing, sales, and platform data into actionable business dashboards, cohort retention curves, and revenue forecasts.",
                "skills": ["SQL", "Power BI", "Tableau", "Python", "GA4", "Data Modeling", "ETL Pipelines", "Excel Modeling"],
                "experience_level": "Mid Level",
                "ownership_level": "Individual Contributor",
                "specialization": "Data Analytics & BI",
                "must_have_capabilities": "Advanced SQL proficiency (window functions, CTEs), data warehouse exposure (BigQuery/PostgreSQL), and experience building interactive dashboards.",
                "preferred_capabilities": "Python data analysis (Pandas, NumPy) and marketing attribution modeling.",
                "availability_requirement": "15-30 days",
                "min_experience": "3-5 Years",
                "salary_min": 1100000,
                "salary_max": 1700000,
                "salary_currency": "INR",
                "location": "Bengaluru, India",
                "work_mode": "Hybrid",
                "job_type": "Full-Time",
                "product_service": "Kyadari Business Analytics",
                "business_model": "B2B SaaS / Consulting",
                "growth_stage": "Growth / Scale-Up",
                "screening_questions": [
                    {"question": "What is the most complex SQL query or data modeling challenge you solved recently?", "required": True},
                    {"question": "Which BI tool do you prefer (Power BI vs Tableau) and why?", "required": False}
                ],
                "interview_rounds": [
                    {"round_number": 1, "name": "HR Screen", "type": "Phone/Video"},
                    {"round_number": 2, "name": "SQL & BI Dashboard Practical Test", "type": "Technical"},
                    {"round_number": 3, "name": "Analytics Manager Interview", "type": "Behavioral"}
                ]
            },
            {
                "title": "Product Manager (Growth & User Acquisition)",
                "description": "Drive user onboarding optimization, viral invite loops, self-serve conversion funnels, and feature adoption across our hiring portal and candidate tools.",
                "skills": ["Product Strategy", "Growth Loops", "Experimentation", "Agile/Scrum", "User Journey Mapping", "Wireframing", "Mixpanel"],
                "experience_level": "Senior Level",
                "ownership_level": "Strategic Driver",
                "specialization": "Product Management",
                "must_have_capabilities": "Demonstrated success driving product-led growth (PLG) metrics, designing A/B test hypotheses, and collaborating tightly with design and engineering teams.",
                "preferred_capabilities": "Experience in HRTech or marketplace products.",
                "availability_requirement": "30 days",
                "min_experience": "4-7 Years",
                "salary_min": 1800000,
                "salary_max": 2800000,
                "salary_currency": "INR",
                "location": "Hyderabad, India",
                "work_mode": "Hybrid",
                "job_type": "Full-Time",
                "product_service": "Kyadari Portal & Talent Platform",
                "business_model": "B2B Marketplace",
                "growth_stage": "Growth / Scale-Up",
                "screening_questions": [
                    {"question": "Give an example of a product experiment you launched that moved a core acquisition or activation metric.", "required": True},
                    {"question": "How do you prioritize technical debt against growth feature requests?", "required": True}
                ],
                "interview_rounds": [
                    {"round_number": 1, "name": "Introductory Screen", "type": "Phone/Video"},
                    {"round_number": 2, "name": "Product Sense & Execution Case Study", "type": "Technical"},
                    {"round_number": 3, "name": "Executive & Culture Alignment", "type": "Behavioral"}
                ]
            },
            {
                "title": "Social Media & Influencer Marketing Manager",
                "description": "Cultivate viral brand presence across Instagram, LinkedIn, YouTube, and X. Source and partner with top micro and macro influencers to amplify agency campaigns and client deliverables.",
                "skills": ["Social Media Strategy", "Influencer Outreach", "Community Management", "Short-Form Video (Reels/Shorts)", "Brand Partnerships", "Social Analytics"],
                "experience_level": "Mid Level",
                "ownership_level": "Team Contributor",
                "specialization": "Social Media & Influencer Relations",
                "must_have_capabilities": "Track record of growing brand social accounts organically, managing influencer negotiation contracts, and tracking engagement metrics.",
                "preferred_capabilities": "Video editing and CapCut/Canva content creation agility.",
                "availability_requirement": "Immediate (0-15 days)",
                "min_experience": "2-5 Years",
                "salary_min": 750000,
                "salary_max": 1250000,
                "salary_currency": "INR",
                "location": "Mumbai, India",
                "work_mode": "On-site",
                "job_type": "Full-Time",
                "product_service": "Kyadari Social Studio",
                "business_model": "Media & Creative Agency",
                "growth_stage": "Growth / Scale-Up",
                "screening_questions": [
                    {"question": "Share social media handles or brand campaigns you have directly managed.", "required": True},
                    {"question": "How do you evaluate whether an influencer collaboration is commercially viable?", "required": True}
                ],
                "interview_rounds": [
                    {"round_number": 1, "name": "HR Screen", "type": "Phone/Video"},
                    {"round_number": 2, "name": "Social Campaign Strategy Exercise", "type": "Technical"},
                    {"round_number": 3, "name": "Creative Director Interview", "type": "Behavioral"}
                ]
            },
            {
                "title": "Conversion Rate Optimization (CRO) & Experimentation Lead",
                "description": "Conduct deep funnel user testing, heatmaps, and statistical A/B tests to double conversion rates across client high-intent landing pages and checkout flows.",
                "skills": ["CRO", "VWO", "Hotjar", "Google Optimize", "A/B Testing", "User Session Analysis", "Landing Page Design", "Unbounce"],
                "experience_level": "Mid-Senior",
                "ownership_level": "Specialist",
                "specialization": "Conversion Optimization & User Testing",
                "must_have_capabilities": "Extensive experience formulating test hypotheses, analyzing user drop-offs, and running statistically significant split tests.",
                "preferred_capabilities": "Basic frontend coding (HTML/CSS/JS) for quick variant tweaks.",
                "availability_requirement": "Immediate (0-15 days)",
                "min_experience": "3-6 Years",
                "salary_min": 1150000,
                "salary_max": 1750000,
                "salary_currency": "INR",
                "location": "Remote (India)",
                "work_mode": "Remote",
                "job_type": "Full-Time",
                "product_service": "Kyadari Conversion Lab",
                "business_model": "Agency / Optimization",
                "growth_stage": "Growth / Scale-Up",
                "screening_questions": [
                    {"question": "What is the biggest conversion lift you achieved from an A/B test, and what hypothesis drove it?", "required": True},
                    {"question": "How do you ensure statistical significance and avoid false positives in low-traffic scenarios?", "required": True}
                ],
                "interview_rounds": [
                    {"round_number": 1, "name": "Talent Partner Call", "type": "Phone/Video"},
                    {"round_number": 2, "name": "CRO Audit & Experimentation Framework Review", "type": "Technical"},
                    {"round_number": 3, "name": "Growth Lead Interview", "type": "Behavioral"}
                ]
            },
            {
                "title": "QA Automation Engineer (Cypress & Playwright)",
                "description": "Build end-to-end automated testing suites, API contract testing, and performance regression suites ensuring zero critical defects across our platform releases.",
                "skills": ["Cypress", "Playwright", "TypeScript", "Jest", "Postman", "CI/CD Integration", "Load Testing", "API Automation"],
                "experience_level": "Mid Level",
                "ownership_level": "Module Lead",
                "specialization": "Quality Assurance & Test Automation",
                "must_have_capabilities": "Proficiency writing scalable end-to-end automation scripts in Cypress or Playwright, and setting up automated regression runs in CI/CD pipelines.",
                "preferred_capabilities": "Performance testing with k6 or JMeter, security vulnerability scanning.",
                "availability_requirement": "15-30 days",
                "min_experience": "3-5 Years",
                "salary_min": 950000,
                "salary_max": 1550000,
                "salary_currency": "INR",
                "location": "Pune, India",
                "work_mode": "Hybrid",
                "job_type": "Full-Time",
                "product_service": "Kyadari Quality Engineering",
                "business_model": "B2B SaaS",
                "growth_stage": "Growth / Scale-Up",
                "screening_questions": [
                    {"question": "What framework (Cypress/Playwright) do you recommend for single-page React apps and why?", "required": True},
                    {"question": "How do you handle flaky tests in automated CI/CD builds?", "required": True}
                ],
                "interview_rounds": [
                    {"round_number": 1, "name": "Recruiter Screen", "type": "Phone/Video"},
                    {"round_number": 2, "name": "Automation Coding & Test Plan Exercise", "type": "Technical"},
                    {"round_number": 3, "name": "QA Lead & Engineering Fit", "type": "Behavioral"}
                ]
            },
            {
                "title": "Mobile App Developer (React Native / Flutter)",
                "description": "Develop and ship high-performance cross-platform mobile apps for iOS and Android. Ensure 60fps animations, seamless offline persistence, and polished mobile UX.",
                "skills": ["React Native", "Flutter", "TypeScript", "Redux Toolkit", "iOS Development", "Android SDK", "App Store Deployment"],
                "experience_level": "Mid-Senior",
                "ownership_level": "End-to-End Ownership",
                "specialization": "Cross-Platform Mobile Development",
                "must_have_capabilities": "Hands-on experience building and publishing React Native or Flutter apps to Apple App Store and Google Play Store.",
                "preferred_capabilities": "Native module bridging with Swift / Kotlin, push notification integration with Firebase.",
                "availability_requirement": "15-30 days",
                "min_experience": "3-6 Years",
                "salary_min": 1300000,
                "salary_max": 2000000,
                "salary_currency": "INR",
                "location": "Bengaluru, India",
                "work_mode": "Hybrid",
                "job_type": "Full-Time",
                "product_service": "Kyadari Mobile Applications",
                "business_model": "Mobile SaaS",
                "growth_stage": "Growth / Scale-Up",
                "screening_questions": [
                    {"question": "Provide links to apps you have published on the App Store or Google Play.", "required": True},
                    {"question": "How do you optimize render performance and memory consumption in React Native?", "required": True}
                ],
                "interview_rounds": [
                    {"round_number": 1, "name": "Initial Call", "type": "Phone/Video"},
                    {"round_number": 2, "name": "Mobile Architecture & Code Review", "type": "Technical"},
                    {"round_number": 3, "name": "Engineering Manager Fit", "type": "Behavioral"}
                ]
            },
            {
                "title": "Enterprise Business Development & Sales Manager",
                "description": "Close lucrative enterprise retainer contracts and agency partnerships across digital transformation, performance media, and custom technology solutions.",
                "skills": ["Enterprise B2B Sales", "Client Prospecting", "CRM (HubSpot)", "Pitch Presentations", "Contract Negotiation", "Revenue Closing"],
                "experience_level": "Senior Level",
                "ownership_level": "Strategic Driver",
                "specialization": "Enterprise Sales & Business Development",
                "must_have_capabilities": "Consistent quota over-attainment selling digital marketing services or SaaS solutions to VP and C-level executives.",
                "preferred_capabilities": "Existing rolodex of high-growth tech, D2C, or retail founders and CMOs.",
                "availability_requirement": "Immediate (0-15 days)",
                "min_experience": "4-8 Years",
                "salary_min": 1400000,
                "salary_max": 2500000,
                "salary_currency": "INR",
                "location": "Delhi NCR, India",
                "work_mode": "On-site",
                "job_type": "Full-Time",
                "product_service": "Kyadari Enterprise Partnerships",
                "business_model": "Agency & Solutions",
                "growth_stage": "Growth / Scale-Up",
                "screening_questions": [
                    {"question": "What was your annual quota in your most recent role, and what percentage did you achieve?", "required": True},
                    {"question": "Walk us through your enterprise outbound deal prospecting workflow.", "required": True}
                ],
                "interview_rounds": [
                    {"round_number": 1, "name": "Talent Partner Discovery", "type": "Phone/Video"},
                    {"round_number": 2, "name": "Enterprise Pitch Simulation", "type": "Technical"},
                    {"round_number": 3, "name": "Managing Director Fit", "type": "Behavioral"}
                ]
            },
            {
                "title": "AI & LLM Solutions Engineer (Python & LangChain)",
                "description": "Design and build generative AI workflows, intelligent document parsers, vector search retrieval (RAG), and agentic workflows that automate candidate matching and marketing creative generation.",
                "skills": ["Python", "OpenAI APIs", "LangChain", "Vector DBs (Pinecone/Milvus)", "RAG Systems", "Hugging Face", "FastAPI"],
                "experience_level": "Mid-Senior",
                "ownership_level": "Core Engineer",
                "specialization": "Artificial Intelligence & LLMs",
                "must_have_capabilities": "Hands-on experience deploying production RAG pipelines, fine-tuning or prompt engineering with OpenAI/Anthropic/Llama models, and integrating embeddings.",
                "preferred_capabilities": "Understanding of local model inference (vLLM, Ollama) and evaluation frameworks (Ragas).",
                "availability_requirement": "15-30 days",
                "min_experience": "3-6 Years",
                "salary_min": 1800000,
                "salary_max": 2900000,
                "salary_currency": "INR",
                "location": "Bengaluru, India",
                "work_mode": "Remote",
                "job_type": "Full-Time",
                "product_service": "Kyadari AI Intelligence Engine",
                "business_model": "AI SaaS",
                "growth_stage": "Series A/B",
                "screening_questions": [
                    {"question": "Share a production AI/LLM system or RAG application you built and explain its architecture.", "required": True},
                    {"question": "How do you evaluate and minimize hallucinations in generative AI pipelines?", "required": True}
                ],
                "interview_rounds": [
                    {"round_number": 1, "name": "Introductory Technical Screen", "type": "Phone/Video"},
                    {"round_number": 2, "name": "AI System Architecture & RAG Deep Dive", "type": "Technical"},
                    {"round_number": 3, "name": "CTO & Co-Founder Discussion", "type": "Behavioral"}
                ]
            },
            {
                "title": "Creative Motion Designer & Brand Animator",
                "description": "Craft show-stopping 2D/3D motion graphics, viral video ads for TikTok/Reels, brand reveal animations, and interactive web micro-animations.",
                "skills": ["After Effects", "Premiere Pro", "Motion Graphics", "3D Animation (Blender)", "Visual Storytelling", "Sound Design", "Illustrator"],
                "experience_level": "Mid Level",
                "ownership_level": "Individual Contributor",
                "specialization": "Motion Design & Video Animation",
                "must_have_capabilities": "Phenomenal motion showreel demonstrating kinetic typography, character animation, and high-converting commercial video ads.",
                "preferred_capabilities": "Familiarity with Lottie animations for web and mobile interfaces.",
                "availability_requirement": "Immediate (0-15 days)",
                "min_experience": "2-5 Years",
                "salary_min": 850000,
                "salary_max": 1400000,
                "salary_currency": "INR",
                "location": "Hyderabad, India",
                "work_mode": "Hybrid",
                "job_type": "Full-Time",
                "product_service": "Kyadari Creative Lab",
                "business_model": "Creative Production Agency",
                "growth_stage": "Growth / Scale-Up",
                "screening_questions": [
                    {"question": "Share a link to your latest motion design showreel (Vimeo / YouTube / Behance).", "required": True},
                    {"question": "What is your typical turnaround time for a 30-second animated commercial video?", "required": False}
                ],
                "interview_rounds": [
                    {"round_number": 1, "name": "Showreel Review & Screen", "type": "Phone/Video"},
                    {"round_number": 2, "name": "Animation Speed Test & Creative Brief", "type": "Technical"},
                    {"round_number": 3, "name": "Creative Director Interview", "type": "Behavioral"}
                ]
            },
            {
                "title": "E-Commerce Growth Manager (Shopify Plus & Amazon)",
                "description": "Scale GMV and profitability for flagship D2C accounts. Manage product listings, Amazon PPC advertising, storefront merchandising, inventory forecasting, and checkout conversions.",
                "skills": ["Shopify Plus", "Amazon Seller Central", "Amazon PPC", "Catalog Management", "Inventory Planning", "D2C Scaling", "Google Shopping"],
                "experience_level": "Mid-Senior",
                "ownership_level": "Account Lead",
                "specialization": "E-Commerce Strategy & Operations",
                "must_have_capabilities": "Demonstrated success driving 8-figure GMV growth on Shopify/Amazon, with deep fluency in ACoS/TACoS optimization and Buy Box dynamics.",
                "preferred_capabilities": "Experience with quick-commerce marketplaces (Blinkit, Zepto, Instamart) and Helium 10.",
                "availability_requirement": "15-30 days",
                "min_experience": "3-6 Years",
                "salary_min": 1000000,
                "salary_max": 1650000,
                "salary_currency": "INR",
                "location": "Mumbai, India",
                "work_mode": "Hybrid",
                "job_type": "Full-Time",
                "product_service": "Kyadari E-commerce Accelerators",
                "business_model": "E-commerce Agency",
                "growth_stage": "Growth / Scale-Up",
                "screening_questions": [
                    {"question": "What average monthly GMV have you managed on Shopify or Amazon?", "required": True},
                    {"question": "How do you balance organic ranking against Amazon PPC spend to lower TACoS?", "required": True}
                ],
                "interview_rounds": [
                    {"round_number": 1, "name": "HR Screen", "type": "Phone/Video"},
                    {"round_number": 2, "name": "E-Commerce Strategy & P&L Case Study", "type": "Technical"},
                    {"round_number": 3, "name": "Managing Partner Fit", "type": "Behavioral"}
                ]
            },
            {
                "title": "Technical Talent Acquisition & HR Specialist",
                "description": "Spearhead technical and digital marketing recruitment. Source elite engineering and marketing talent, manage high-velocity interview loops, and ensure a memorable candidate experience.",
                "skills": ["Technical Sourcing", "LinkedIn Recruiter", "Candidate Assessment", "ATS Management", "Offer Negotiation", "Employer Branding"],
                "experience_level": "Mid Level",
                "ownership_level": "End-to-End Ownership",
                "specialization": "Talent Acquisition & People Ops",
                "must_have_capabilities": "Proven record of closing niche software engineering and performance marketing roles with minimal time-to-hire and high acceptance rates.",
                "preferred_capabilities": "Experience working in high-growth tech startups or digital agencies.",
                "availability_requirement": "Immediate (0-15 days)",
                "min_experience": "2-5 Years",
                "salary_min": 700000,
                "salary_max": 1200000,
                "salary_currency": "INR",
                "location": "Hyderabad, India",
                "work_mode": "On-site",
                "job_type": "Full-Time",
                "product_service": "Kyadari Talent Team",
                "business_model": "Internal People Operations",
                "growth_stage": "Growth / Scale-Up",
                "screening_questions": [
                    {"question": "What is your average monthly hire count for technical and marketing positions?", "required": True},
                    {"question": "How do you source passive top-tier candidates who are not actively applying?", "required": True}
                ],
                "interview_rounds": [
                    {"round_number": 1, "name": "People Lead Phone Screen", "type": "Phone/Video"},
                    {"round_number": 2, "name": "Sourcing Strategy & Role-Play", "type": "Technical"},
                    {"round_number": 3, "name": "Founder & HR Leadership Fit", "type": "Behavioral"}
                ]
            },
            {
                "title": "Client Success & Strategic Account Director",
                "description": "Serve as the executive bridge between top client stakeholders and our internal delivery teams. Guarantee customer satisfaction, renewal rates, retainer upsells, and quarterly business reviews (QBRs).",
                "skills": ["Client Relationship Management", "Strategic Account Planning", "Retainer Upselling", "Cross-Functional Leadership", "QBRs", "Escalation Management"],
                "experience_level": "Senior Level",
                "ownership_level": "Director",
                "specialization": "Client Solutions & Account Leadership",
                "must_have_capabilities": "Exceptional presentation and negotiation prowess; proven history managing 15+ high-value corporate retainers with net negative churn.",
                "preferred_capabilities": "Prior leadership in top-tier advertising or marketing technology agencies.",
                "availability_requirement": "30 days",
                "min_experience": "5-9 Years",
                "salary_min": 1500000,
                "salary_max": 2400000,
                "salary_currency": "INR",
                "location": "Chennai, India",
                "work_mode": "Hybrid",
                "job_type": "Full-Time",
                "product_service": "Kyadari Enterprise Accounts",
                "business_model": "Strategic Agency Consulting",
                "growth_stage": "Growth / Scale-Up",
                "screening_questions": [
                    {"question": "Describe the largest portfolio of client accounts you have successfully managed.", "required": True},
                    {"question": "How do you turn around a dissatisfied enterprise client facing campaign underperformance?", "required": True}
                ],
                "interview_rounds": [
                    {"round_number": 1, "name": "Executive Recruiter Screen", "type": "Phone/Video"},
                    {"round_number": 2, "name": "Client Escalation & Account Growth Case Study", "type": "Technical"},
                    {"round_number": 3, "name": "Managing Director Final Interview", "type": "Behavioral"}
                ]
            }
        ]

        created_jobs = []
        for jd in job_definitions:
            job = Job(
                company_id=company.id,
                created_by=user.id,
                group_id=group_id,
                title=jd["title"],
                description=jd["description"],
                skills=jd["skills"],
                experience_level=jd["experience_level"],
                ownership_level=jd["ownership_level"],
                specialization=jd["specialization"],
                must_have_capabilities=jd["must_have_capabilities"],
                preferred_capabilities=jd["preferred_capabilities"],
                availability_requirement=jd["availability_requirement"],
                min_experience=jd["min_experience"],
                salary_min=jd["salary_min"],
                salary_max=jd["salary_max"],
                salary_currency=jd["salary_currency"],
                location=jd["location"],
                work_mode=jd["work_mode"],
                job_type=jd["job_type"],
                status="PUBLISHED",
                product_service=jd.get("product_service") or company.product_service,
                business_model=jd.get("business_model") or company.business_model,
                growth_stage=jd.get("growth_stage") or company.growth_stage,
                target_audience=company.target_audience,
                ideal_customer_profile=company.ideal_customer_profile,
                business_problem=company.business_problem,
                expected_outcome=company.expected_outcome,
                team_support=company.team_support,
                monthly_budget_range=company.monthly_budget_range,
                decision_authority=company.decision_authority,
                success_horizon=company.success_horizon,
                screening_questions=jd["screening_questions"],
                interview_rounds=jd["interview_rounds"],
                created_at=datetime.utcnow()
            )
            db.add(job)
            created_jobs.append(job)

        # Auto-adjust company max_jobs limit so it comfortably accommodates all jobs
        existing_jobs_count = db.query(Job).filter(Job.company_id == company.id).count()
        needed_capacity = existing_jobs_count + len(job_definitions) + 10
        if not company.max_jobs or company.max_jobs < needed_capacity:
            print(f"Expanding company.max_jobs capacity from {company.max_jobs} to {needed_capacity}...")
            company.max_jobs = needed_capacity
            db.commit()

        db.commit()

        print(f"\n[SUCCESS] Successfully added {len(created_jobs)} jobs for {user.email} (User ID: {user.id})!")
        for idx, j in enumerate(created_jobs, 1):
            db.refresh(j)
            print(f" {idx:2d}. [ID: {j.id}] {j.title} | {j.location} ({j.work_mode}) | INR {j.salary_min:,} - {j.salary_max:,}")

        # Total jobs count check
        total_company_jobs = db.query(Job).filter(Job.company_id == company.id).count()
        recruiter_jobs = db.query(Job).filter(Job.created_by == user.id).count()
        print(f"\nTotal jobs for company '{company.company_name}': {total_company_jobs}")
        print(f"Total jobs created by recruiter '{user.email}' (ID {user.id}): {recruiter_jobs}")
        print(f"Company max_jobs limit set to: {company.max_jobs}")

    except Exception as e:
        db.rollback()
        print(f"ERROR: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    # Check if a custom recruiter was passed as a command-line argument
    # Example: python add_recruiter_jobs.py recruiter2@example.com
    # Example: python add_recruiter_jobs.py 26
    arg_recruiter = sys.argv[1].strip() if len(sys.argv) > 1 else None
    add_jobs(arg_recruiter)

