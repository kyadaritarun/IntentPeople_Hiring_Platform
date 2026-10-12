/**
 * Uptrix Marketing Talent Intelligence & Taxonomy
 * Complete data dictionary for Marketing Specialisations, Capabilities,
 * GTM Dimensions, Responsibility Levels, and Onboarding Options.
 */

export const CAREER_STAGES = [
  { id: 'fresher', label: 'Fresher / Entry-Level', desc: 'Starting my digital marketing career' },
  { id: 'working_professional', label: 'Working Professional', desc: 'Actively employed or experienced individual contributor / manager' },
  { id: 'returning_to_work', label: 'Returning to Work', desc: 'Resuming career after a sabbatical or career break' },
  { id: 'freelancer_consultant', label: 'Freelancer / Consultant', desc: 'Independent specialist delivering client campaigns & projects' }
];

export const RESPONSIBILITY_LEVELS = [
  'Guided execution',
  'Independent execution',
  'Channel ownership',
  'Cross-channel strategy',
  'People leadership',
  'Function leadership'
];

export const EMPLOYMENT_PREFERENCES = [
  'Full-time',
  'Part-time',
  'Contract',
  'Internship',
  'Consulting'
];

export const WORK_ARRANGEMENTS = [
  'Remote',
  'Hybrid',
  'Office'
];

export const JOINING_AVAILABILITY = [
  'Available now',
  'Notice period',
  'Specific date',
  'Negotiable'
];

export const JOB_SEARCH_STATUSES = [
  'Actively looking',
  'Open to suitable roles',
  'Not currently looking'
];

export const COMPANY_ENVIRONMENTS = [
  'Early-stage',
  'Scaling',
  'Established',
  'No preference'
];

export const EMPLOYER_TYPES = [
  'In-house',
  'Marketing agency',
  'Either'
];

export const CUSTOMER_MODELS = [
  'B2B',
  'B2C',
  'B2B2C',
  'D2C',
  'Other'
];

export const REVENUE_MODELS = [
  'Subscription',
  'One-time sale',
  'Retainer',
  'Transaction fees'
];

export const ROUTES_TO_MARKET = [
  'Sales-led',
  'Product-led',
  'Self-service',
  'Partner-led',
  'Retail',
  'Marketplace'
];

export const BUYING_CYCLES = [
  'Same day',
  'Weeks',
  'Months',
  'Unknown'
];

export const BUDGET_OWNERSHIP_OPTIONS = [
  'Spent within a plan',
  'Allocated budget',
  'Approved budget'
];

export const TEAM_ENVIRONMENTS = [
  'Worked independently',
  'Small team',
  'Specialist team',
  'Cross-functional team'
];

export const PROFICIENCY_LEVELS = [
  { id: 'learning', label: 'Learning', desc: 'Gaining foundational knowledge & exposure' },
  { id: 'guided', label: 'Executes with guidance', desc: 'Handles tasks with senior direction' },
  { id: 'independent', label: 'Works independently', desc: 'Delivers autonomously without oversight' },
  { id: 'lead', label: 'Leads the practice', desc: 'Defines strategy, mentors peers & sets standard' }
];

export const OWNERSHIP_LEVELS = [
  { id: 'executed', label: 'Personally executed', desc: 'Hands-on operational execution' },
  { id: 'managed', label: 'Managed delivery', desc: 'Oversaw execution by peers, team or agencies' },
  { id: 'approved', label: 'Approved strategy', desc: 'High-level sign-off and strategic directive' },
  { id: 'supported', label: 'Supported another owner', desc: 'Collaborated as a secondary contributor' }
];

export const INTEREST_AGAIN_OPTIONS = [
  'Yes',
  'Open to it',
  'Not preferred'
];

export const CASE_STUDY_VISIBILITY_OPTIONS = [
  'Public',
  'Registered employers',
  'Approved employers only',
  'Private'
];

/**
 * 14 Core Digital Marketing Specialisations and their capability areas
 */
export const MARKETING_SPECIALISATIONS = [
  {
    id: 'seo',
    title: 'SEO',
    color: '#0284C7',
    capabilities: [
      'Technical SEO',
      'On-page SEO',
      'Content SEO',
      'Local SEO',
      'Ecommerce SEO',
      'International SEO',
      'Site Migrations'
    ]
  },
  {
    id: 'paid_search',
    title: 'Paid Search',
    color: '#2563EB',
    capabilities: [
      'Google Ads',
      'Microsoft Ads',
      'Shopping campaigns',
      'Account structure',
      'Bidding strategies',
      'Conversion tracking'
    ]
  },
  {
    id: 'paid_social',
    title: 'Paid Social',
    color: '#7C3AED',
    capabilities: [
      'Meta Ads Manager',
      'LinkedIn Campaign Manager',
      'TikTok Ads',
      'Audience strategy',
      'Creative testing',
      'Retargeting funnels'
    ]
  },
  {
    id: 'content_marketing',
    title: 'Content Marketing',
    color: '#DB2777',
    capabilities: [
      'Content strategy',
      'Editorial planning',
      'Content distribution',
      'Thought leadership',
      'Content measurement & ROI'
    ]
  },
  {
    id: 'organic_social',
    title: 'Organic Social & Community',
    color: '#EA580C',
    capabilities: [
      'Social strategy',
      'Community operations',
      'Audience engagement',
      'Social listening',
      'Discord / Slack communities'
    ]
  },
  {
    id: 'lifecycle_crm',
    title: 'Lifecycle, Email & CRM',
    color: '#D97706',
    capabilities: [
      'Customer segmentation',
      'User onboarding flows',
      'Drip nurture campaigns',
      'Retention & Churn reduction',
      'Reactivation',
      'Marketing automation (HubSpot/Klaviyo)'
    ]
  },
  {
    id: 'demand_gen_abm',
    title: 'Demand Gen & ABM',
    color: '#059669',
    capabilities: [
      'Pipeline programmes',
      'Account-based targeting (ABM)',
      'Sales & Marketing alignment',
      'MQL-to-SQL handoffs',
      'Lead scoring & nurturing'
    ]
  },
  {
    id: 'product_marketing',
    title: 'Product Marketing',
    color: '#4F46E5',
    capabilities: [
      'Customer research & ICP',
      'Value positioning & messaging',
      'Product launch execution',
      'Sales enablement collaterals',
      'Competitive battlecards'
    ]
  },
  {
    id: 'growth_cro',
    title: 'Growth & CRO',
    color: '#0D9488',
    capabilities: [
      'Funnel drop-off analysis',
      'Experimentation & A/B testing',
      'Landing page optimisation',
      'User activation loops',
      'Conversion rate optimisation'
    ]
  },
  {
    id: 'analytics_operations',
    title: 'Analytics & Operations',
    color: '#475569',
    capabilities: [
      'Measurement plans',
      'GA4 & event tracking',
      'Multi-touch attribution',
      'Executive dashboard reporting',
      'CRM & MarTech operations'
    ]
  },
  {
    id: 'ecommerce_marketplace',
    title: 'Ecommerce & Marketplace',
    color: '#C026D3',
    capabilities: [
      'Product feeds & catalogues',
      'Marketplace advertising (Amazon/Flipkart)',
      'Digital merchandising',
      'Repeat purchase & LTV'
    ]
  },
  {
    id: 'brand_comms',
    title: 'Brand & Communications',
    color: '#E11D48',
    capabilities: [
      'Brand positioning & narrative',
      'Integrated multichannel campaigns',
      'Digital PR & media outreach',
      'Reputation & crisis management'
    ]
  },
  {
    id: 'partnerships_creators',
    title: 'Partnerships & Influencers',
    color: '#9333EA',
    capabilities: [
      'Partner acquisition',
      'Affiliate programme management',
      'Creator & influencer campaigns',
      'Sponsorship measurement'
    ]
  },
  {
    id: 'marketing_leadership',
    title: 'Marketing Leadership',
    color: '#0F172A',
    capabilities: [
      'Full-funnel marketing strategy',
      'Annual budgeting & forecasting',
      'Team building & hiring',
      'Agency & vendor oversight',
      'Board-level growth reporting'
    ]
  }
];

// Ensure backwards and cross-component compatibility for both spec.name and spec.title
MARKETING_SPECIALISATIONS.forEach(s => {
  if (!s.name) s.name = s.title;
  if (!s.title) s.title = s.name;
});

export const POPULAR_MARKETING_TOOLS = [
  'Google Analytics 4 (GA4)',
  'Google Tag Manager',
  'Google Search Console',
  'Google Ads',
  'Meta Ads Manager',
  'LinkedIn Campaign Manager',
  'HubSpot',
  'Klaviyo',
  'Salesforce / Pardot',
  'Ahrefs',
  'SEMrush',
  'Mixpanel',
  'Amplitude',
  'Hotjar',
  'Looker Studio',
  'Notion',
  'Figma',
  'Canva',
  'Zapier',
  'Make'
];
