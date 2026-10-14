/**
 * Taxonomy of Growth Marketing Roles, Dummy Job Requisitions, and Dummy Verified Candidates.
 * Modeled after top talent marketplaces (Strategy & Leadership, Customer Acquisition, Convert & Retain, Ops & Data).
 */

export const MARKETING_ROLE_CATEGORIES = [
  {
    id: "STRATEGY",
    title: "STRATEGY & LEADERSHIP",
    color: "text-indigo-600",
    roles: [
      "Chief Marketing Officer",
      "Creative Strategist",
      "Brand Marketer",
      "Product Marketer"
    ]
  },
  {
    id: "ACQUISITION",
    title: "CUSTOMER ACQUISITION",
    color: "text-emerald-600",
    roles: [
      "Growth Marketer",
      "Paid Social Marketer",
      "Paid Search Marketer",
      "SEO Marketer",
      "Programmatic Marketer",
      "Amazon Marketer"
    ]
  },
  {
    id: "RETENTION",
    title: "CONVERT & RETAIN",
    color: "text-amber-600",
    roles: [
      "Email Marketer",
      "Social Media Manager",
      "Content Marketer"
    ]
  },
  {
    id: "OPS",
    title: "OPS & DATA",
    color: "text-cyan-600",
    roles: [
      "Marketing Automation",
      "Graphic Designer",
      "Agency Account Manager",
      "Marketing Analyst"
    ]
  }
];

export const DUMMY_JOBS = [
  {
    id: "role-1",
    title: "Performance Marketing Manager",
    category: "ACQUISITION",
    roleTag: "Performance Marketing",
    type: "Full-Time"
  },
  {
    id: "role-2",
    title: "Growth Marketing Manager",
    category: "ACQUISITION",
    roleTag: "Growth Marketing",
    type: "Full-Time"
  },
  {
    id: "role-3",
    title: "Paid Media Manager",
    category: "ACQUISITION",
    roleTag: "Paid Media",
    type: "Full-Time"
  },
  {
    id: "role-4",
    title: "SEO Manager",
    category: "ACQUISITION",
    roleTag: "SEO",
    type: "Full-Time"
  },
  {
    id: "role-5",
    title: "Digital Marketing Manager",
    category: "ACQUISITION",
    roleTag: "Digital Marketing",
    type: "Full-Time"
  },
  {
    id: "role-6",
    title: "Performance Marketing Specialist",
    category: "ACQUISITION",
    roleTag: "Performance Marketing",
    type: "Full-Time"
  },
  {
    id: "role-7",
    title: "Growth Marketing Specialist",
    category: "ACQUISITION",
    roleTag: "Growth Marketing",
    type: "Full-Time"
  },
  {
    id: "role-8",
    title: "Paid Search / PPC Specialist",
    category: "ACQUISITION",
    roleTag: "Paid Search",
    type: "Full-Time"
  },
  {
    id: "role-9",
    title: "Paid Social Specialist",
    category: "ACQUISITION",
    roleTag: "Paid Social",
    type: "Full-Time"
  },
  {
    id: "role-10",
    title: "Meta Ads Specialist",
    category: "ACQUISITION",
    roleTag: "Meta Ads",
    type: "Full-Time"
  },
  {
    id: "role-11",
    title: "Google Ads Specialist",
    category: "ACQUISITION",
    roleTag: "Google Ads",
    type: "Full-Time"
  },
  {
    id: "role-12",
    title: "Head of Digital Marketing",
    category: "STRATEGY",
    roleTag: "Leadership",
    type: "Full-Time"
  },
  {
    id: "role-13",
    title: "Head of Growth",
    category: "STRATEGY",
    roleTag: "Leadership",
    type: "Full-Time"
  },
  {
    id: "role-14",
    title: "Marketing Analytics Manager",
    category: "OPS",
    roleTag: "Analytics",
    type: "Full-Time"
  },
  {
    id: "role-15",
    title: "Marketing Data Analyst",
    category: "OPS",
    roleTag: "Data Analyst",
    type: "Full-Time"
  },
  {
    id: "role-16",
    title: "Marketing Automation Manager",
    category: "OPS",
    roleTag: "Automation",
    type: "Full-Time"
  },
  {
    id: "role-17",
    title: "CRM Marketing Manager",
    category: "RETENTION",
    roleTag: "CRM",
    type: "Full-Time"
  },
  {
    id: "role-18",
    title: "Lifecycle Marketing Manager",
    category: "RETENTION",
    roleTag: "Lifecycle",
    type: "Full-Time"
  },
  {
    id: "role-19",
    title: "Email Marketing Manager",
    category: "RETENTION",
    roleTag: "Email Marketing",
    type: "Full-Time"
  },
  {
    id: "role-20",
    title: "E-commerce Marketing Manager",
    category: "ACQUISITION",
    roleTag: "E-commerce",
    type: "Full-Time"
  },
  {
    id: "role-21",
    title: "Marketplace Marketing Manager",
    category: "ACQUISITION",
    roleTag: "Marketplace",
    type: "Full-Time"
  },
  {
    id: "role-22",
    title: "Product Marketing Manager",
    category: "STRATEGY",
    roleTag: "Product Marketing",
    type: "Full-Time"
  },
  {
    id: "role-23",
    title: "Content Marketing Manager",
    category: "RETENTION",
    roleTag: "Content Marketing",
    type: "Full-Time"
  },
  {
    id: "role-24",
    title: "Content Strategist",
    category: "RETENTION",
    roleTag: "Content Strategy",
    type: "Full-Time"
  },
  {
    id: "role-25",
    title: "Social Media Manager",
    category: "RETENTION",
    roleTag: "Social Media",
    type: "Full-Time"
  },
  {
    id: "role-26",
    title: "Influencer Marketing Manager",
    category: "RETENTION",
    roleTag: "Influencer Marketing",
    type: "Full-Time"
  },
];

export const DUMMY_CANDIDATES = [
  {
    id: "cand-1",
    name: "Neha Verma",
    avatar: "/images/elena_miller.jpg",
    initials: "NV",
    title: "Senior Growth & Performance Lead",
    category: "ACQUISITION",
    roleTag: "Growth Marketer",
    location: "Bengaluru / Remote",
    experience: "7+ Yrs • Ex-DTC Unicorn",
    statBadge: "₹12 Cr+ Ad Spend Verified",
    statSubtext: "4.8x Blended ROAS across Meta & Google",
    matchScore: 98,
    badge: "Top 1% Verified",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    skills: ["Meta Ads", "Google Ads", "TikTok", "Retention", "CPA Scaling"],
    availability: "Ready to Interview (<24h turnaround)",
    verifiedWork: true
  },
  {
    id: "cand-2",
    name: "Aryan Sharma",
    avatar: null,
    initials: "AS",
    title: "Head of Paid Search & Performance Media",
    category: "ACQUISITION",
    roleTag: "Paid Search Marketer",
    location: "Delhi NCR / Remote",
    experience: "9+ Yrs • Ex-Agency VP",
    statBadge: "₹25 Cr+ Ad Spend Managed",
    statSubtext: "Google Premier Partner Certified",
    matchScore: 97,
    badge: "Elite Performer",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    skills: ["Google Search", "YouTube Ads", "Search Arbitrage", "Demand Gen"],
    availability: "Available in 2 Weeks",
    verifiedWork: true
  },
  {
    id: "cand-3",
    name: "Priya Nair",
    avatar: null,
    initials: "PN",
    title: "Director of Organic Growth & SEO",
    category: "ACQUISITION",
    roleTag: "SEO Marketer",
    location: "Bengaluru (Hybrid)",
    experience: "8+ Yrs • Scaled 0 to 4.5M monthly visits",
    statBadge: "4.5M Organic Visits/mo",
    statSubtext: "Built #1 ranking moats in competitive SaaS",
    matchScore: 99,
    badge: "Top 1% Organic",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    skills: ["Technical SEO", "Programmatic SEO", "Content Moats", "Ahrefs"],
    availability: "Ready to Interview",
    verifiedWork: true
  },
  {
    id: "cand-4",
    name: "Vikram Malhotra",
    avatar: null,
    initials: "VM",
    title: "Fractional Chief Marketing Officer (CMO)",
    category: "STRATEGY",
    roleTag: "Chief Marketing Officer",
    location: "Mumbai (Hybrid)",
    experience: "14+ Yrs • Ex-Swiggy & Zomato Leader",
    statBadge: "Scaled 3 Brands from Seed to Series C",
    statSubtext: "Comprehensive P&L and 50+ team management",
    matchScore: 98,
    badge: "Executive Tier",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    skills: ["Full-Funnel Strategy", "P&L Ownership", "Team Leadership", "GTM"],
    availability: "Advisory or Full-Time",
    verifiedWork: true
  },
  {
    id: "cand-5",
    name: "Sneha Patel",
    avatar: null,
    initials: "SP",
    title: "Lifecycle & Retention Marketing Lead",
    category: "RETENTION",
    roleTag: "Email Marketer",
    location: "Mumbai / Remote",
    experience: "6+ Yrs • Ex-Nykaa D2C Lead",
    statBadge: "42% Average LTV Uplift",
    statSubtext: "Klaviyo & Braze certified architect",
    matchScore: 96,
    badge: "Retention Pro",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    skills: ["Klaviyo Master", "Braze", "WhatsApp Marketing", "RFM Churn"],
    availability: "Ready to Interview",
    verifiedWork: true
  },
  {
    id: "cand-6",
    name: "Rohan Mehta",
    avatar: null,
    initials: "RM",
    title: "Marketing Automation & Attribution Architect",
    category: "OPS",
    roleTag: "Marketing Automation",
    location: "Hyderabad / Remote",
    experience: "8+ Yrs • 50+ Enterprise CRM Builds",
    statBadge: "50+ CRM Deployments",
    statSubtext: "HubSpot Solutions Partner & Segment Certified",
    matchScore: 97,
    badge: "Tech Specialist",
    badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
    skills: ["HubSpot Enterprise", "Segment CDP", "GA4 Attribution", "SQL"],
    availability: "Ready to Interview",
    verifiedWork: true
  },
  {
    id: "cand-7",
    name: "Ananya Deshmukh",
    avatar: null,
    initials: "AD",
    title: "Creative Strategist & UGC Director",
    category: "STRATEGY",
    roleTag: "Creative Strategist",
    location: "Bengaluru / Remote",
    experience: "5+ Yrs • Ex-Growth Agency Producer",
    statBadge: "500+ High-ROAS Video Ads",
    statSubtext: "12% Higher 3-second hook rate average",
    matchScore: 95,
    badge: "Creative Lead",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    skills: ["UGC Production", "Creative Directing", "Hook Optimization", "Figma"],
    availability: "Ready to Interview",
    verifiedWork: true
  },
  {
    id: "cand-8",
    name: "Kavita Rao",
    avatar: null,
    initials: "KR",
    title: "Amazon & Marketplace Growth Lead",
    category: "ACQUISITION",
    roleTag: "Amazon Marketer",
    location: "Delhi NCR (Hybrid)",
    experience: "6+ Yrs • Managed 15+ 8-Figure Brands",
    statBadge: "₹18 Cr+ Amazon GMV",
    statSubtext: "Blinkit, Zepto & Amazon Ads Specialist",
    matchScore: 96,
    badge: "Marketplace Master",
    badgeColor: "bg-orange-50 text-orange-700 border-orange-200",
    skills: ["Amazon Ads", "Quick Commerce Ads", "Buy Box Defense", "A+ Content"],
    availability: "Available in 10 Days",
    verifiedWork: true
  }
];

export const DIGITAL_MARKETING_CATEGORIES = [
  { id: "ALL", label: "All Digital Marketing Roles" },
  { id: "STRATEGY", label: "Strategy & Leadership" },
  { id: "ACQUISITION", label: "Customer Acquisition" },
  { id: "RETENTION", label: "Convert & Retain" },
  { id: "OPS", label: "Ops & Data" }
];
