/**
 * Lightweight API helper for Landing Site
 * Fetches dynamic subscription tiers from the backend with reliable offline fallbacks.
 */

const API_BASE = 'https://backend.intentpeople.com';

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

    return [
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
        features: [
          '1 Recruiter Seat',
          '1 Active Job Requisition',
          '15 Visible Candidates (Excess blurred with upgrade prompt)',
          'Community feed & messaging access'
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
        is_popular: true,
        features: [
          '2 Staff Roles (1 Recruiter + 1 Manager)',
          '4 Active Job Postings',
          '50 Visible Candidates per requisition',
          '45 Days full platform validity',
          'AI candidate scoring & matching dossier',
          'Direct candidate chat & interview scheduling'
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
        is_popular: false,
        features: [
          '4 Staff Roles (2 Recruiters + 2 Hiring Managers)',
          '8 Active Job Postings',
          '200 Visible Candidates per requisition',
          '30 Days / 1 Month validity',
          'Priority AI candidate rankings & bulk pipeline stages',
          'Advanced multi-pod collaboration'
        ]
      }
    ];
  }
};
