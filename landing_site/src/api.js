/**
 * Lightweight API helper for Landing Site
 * Fetches dynamic subscription tiers from the backend with reliable offline fallbacks.
 */

const API_BASE = 'https://backend.intentpeople.com';

export const DEFAULT_PLANS = [
  {
    id: 'FREE',
    name: 'Free Starter',
    price: 0,
    price_display: '₹0',
    billing: 'Free Forever',
    duration_days: 365,
    max_roles: 1,
    max_jobs: 1,
    max_candidates_per_job: 15,
    badge: 'Free Trial',
    badge_color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Essential exploratory recruitment for founders & early-stage hiring teams.',
    highlight: false,
    features: [
      '1 Recruiter Seat',
      '1 Active Job Requisition',
      '15 Visible Candidates (Excess blurred with upgrade prompt)',
      'Community feed & messaging access',
      'Verified applicant skills preview'
    ]
  },
  {
    id: 'PLAN_4999',
    name: 'Standard Role Plan',
    price: 4999,
    price_display: '₹4,999',
    billing: 'per 45 days',
    duration_days: 45,
    max_roles: 2,
    max_jobs: 4,
    max_candidates_per_job: 50,
    badge: 'Most Popular',
    badge_color: 'bg-indigo-600 text-white border-indigo-600',
    description: 'Focused hiring engine with collaborative recruiter and manager roles.',
    highlight: true,
    is_popular: true,
    features: [
      '2 Staff Roles (1 Recruiter + 1 Manager)',
      '4 Active Job Postings',
      '50 Visible Candidates per requisition',
      '45 Days full platform validity',
      'AI candidate scoring & matching dossier',
      'Direct candidate chat & interview scheduling',
      'Zero agency markups or hidden fees'
    ]
  },
  {
    id: 'PLAN_14999',
    name: 'Growth Scale Plan',
    price: 14999,
    price_display: '₹14,999',
    billing: 'per month (30 days)',
    duration_days: 30,
    max_roles: 4,
    max_jobs: 8,
    max_candidates_per_job: 200,
    badge: 'High Volume Scale',
    badge_color: 'bg-amber-500 text-white border-amber-500',
    description: 'Full-throttle recruitment engine for fast-growing companies and multi-pod hiring.',
    highlight: false,
    is_popular: false,
    features: [
      '4 Staff Roles (2 Recruiters + 2 Hiring Managers)',
      '8 Active Job Postings',
      '200 Visible Candidates per requisition',
      '30 Days / 1 Month validity',
      'Priority AI candidate rankings & bulk pipeline stages',
      'Advanced multi-pod collaboration & interview workflows',
      'Dedicated priority candidate matchmaking'
    ]
  }
];

export const ENTERPRISE_PLAN = {
  id: 'ENTERPRISE',
  name: 'Enterprise Cloud',
  price: null,
  price_display: 'Custom',
  billing: 'Tailored to your organization',
  duration_days: null,
  max_roles: 'Unlimited',
  max_jobs: 'Unlimited',
  max_candidates_per_job: 'Unlimited',
  badge: 'Custom Architecture',
  badge_color: 'bg-purple-600 text-white border-purple-600',
  description: 'Dedicated talent pods, custom integrations, and SLA guarantees for scale.',
  highlight: false,
  features: [
    'Unlimited Staff Roles & custom RBAC',
    'Unlimited Active Requisitions',
    'Unlimited Candidate Reach & verified dossiers',
    'Dedicated Talent Partner & Sourcing Pod',
    'Tailored ATS integrations & Webhook sync',
    '24/7 dedicated support & SLA guarantees'
  ]
};

export const api = {
  async getSubscriptionPlans() {
    try {
      const res = await fetch(`${API_BASE}/payments/plans`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch (e) {
      console.warn('Backend unavailable, using default subscription plan template', e);
    }

    return DEFAULT_PLANS;
  }
};
