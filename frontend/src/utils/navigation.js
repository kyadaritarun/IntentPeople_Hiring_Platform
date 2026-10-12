/**
 * Navigation & URL Route Management for Uptrix Platform
 */

// Mapping of internal tab identifiers to canonical URL path & document titles
export const TAB_CONFIG = {
  home: {
    path: '/home',
    title: 'Home | Uptrix',
  },
  superadmin_dashboard: {
    path: '/superadmin',
    title: 'Superadmin Console | Uptrix',
  },
  admin_dashboard: {
    path: '/admin-dashboard',
    title: 'Admin Dashboard | Uptrix',
  },
  recruiter_dashboard: {
    path: '/recruiter-dashboard',
    title: 'Recruiter Dashboard | Uptrix',
  },
  hiring_manager_dashboard: {
    path: '/manager-dashboard',
    title: 'Manager Dashboard | Uptrix',
  },
  find_jobs: {
    path: '/find-jobs',
    title: 'Find Jobs | Uptrix',
  },
  job_search: {
    path: '/find-jobs',
    title: 'Find Jobs | Uptrix',
  },
  manage_jobs: {
    path: '/manage-jobs',
    title: 'Manage Jobs | Uptrix',
  },
  post_job: {
    path: '/post-job',
    title: 'Post Job | Uptrix',
  },
  applicants: {
    path: '/applicants',
    title: 'Applicants | Uptrix',
  },
  applicants_view: {
    path: '/applicants',
    title: 'Applicants | Uptrix',
  },
  application_status: {
    path: '/application-status',
    title: 'Application Status | Uptrix',
  },
  documents: {
    path: '/documents',
    title: 'Organization Documents | Uptrix',
  },
  my_applications: {
    path: '/my-applications',
    title: 'My Applications | Uptrix',
  },
  saved_jobs: {
    path: '/saved-jobs',
    title: 'Saved Jobs | Uptrix',
  },
  skill_advisory: {
    path: '/skill-advisory',
    title: 'Monthly Analysis | Uptrix',
  },
  career_analytics: {
    path: '/skill-advisory',
    title: 'Monthly Analysis | Uptrix',
  },
  my_posts: {
    path: '/home',
    title: 'Home | Uptrix',
  },
  posts: {
    path: '/home',
    title: 'Home | Uptrix',
  },
  community_feed: {
    path: '/home',
    title: 'Home | Uptrix',
  },
  community: {
    path: '/home',
    title: 'Home | Uptrix',
  },
  interviews: {
    path: '/interviews',
    title: 'Candidate Interviews | Uptrix',
  },
  my_interviews: {
    path: '/interviews',
    title: 'My Interviews | Uptrix',
  },
  ai_scheduler: {
    path: '/ai-scheduler',
    title: 'AI Interview Scheduler | Uptrix',
  },
  profile: {
    path: '/profile',
    title: 'Candidate Profile | Uptrix',
  },
  candidate_profile: {
    path: '/profile',
    title: 'Candidate Profile | Uptrix',
  },
  company_profile: {
    path: '/company-profile',
    title: 'Company Profile | Uptrix',
  },
  add_staff: {
    path: '/add-staff',
    title: 'Add Staff Member | Uptrix',
  },
  hiring_groups: {
    path: '/hiring-groups',
    title: 'Hiring Groups & Pods | Uptrix',
  },
  staff_directory: {
    path: '/staff-directory',
    title: 'Staff Directory | Uptrix',
  },
  staff_documents: {
    path: '/staff-documents',
    title: 'Staff KYC Documents | Uptrix',
  },
  messages: {
    path: '/messages',
    title: 'Messages | Uptrix',
  },
  support: {
    path: '/support',
    title: 'Support & Help Desk | Uptrix',
  },
  support_desk: {
    path: '/support',
    title: 'Support & Help Desk | Uptrix',
  },
  onboarding: {
    path: '/onboarding',
    title: 'Candidate Onboarding | Uptrix',
  },
};

// Default dashboard tab for each user role
export function getDefaultTabForRole(role) {
  if (role === 'SUPERADMIN') return 'superadmin_dashboard';
  if (role === 'ADMIN') return 'admin_dashboard';
  if (role === 'RECRUITER') return 'recruiter_dashboard';
  if (role === 'HIRING_MANAGER') return 'hiring_manager_dashboard';
  return 'home';
}

// Normalize tab according to role
export function normalizeTabForRole(tab, role) {
  if (role === 'SUPERADMIN') return 'superadmin_dashboard';
  const isAdmin = role === 'ADMIN';
  const isRecruiter = role === 'RECRUITER';
  const isHiringManager = role === 'HIRING_MANAGER';
  const isStaff = isAdmin || isRecruiter || isHiringManager;

  if (!tab || tab === 'feed' || tab === 'home' || tab === 'dashboard') {
    if (isAdmin) return 'admin_dashboard';
    if (isRecruiter) return 'recruiter_dashboard';
    if (isHiringManager) return 'hiring_manager_dashboard';
    return 'home';
  }
  if (tab === 'admin_dashboard' || (isAdmin && tab === 'dashboard')) return 'admin_dashboard';
  if (tab === 'recruiter_dashboard' || (isRecruiter && tab === 'dashboard')) return 'recruiter_dashboard';
  if (tab === 'hiring_manager_dashboard' || (isHiringManager && tab === 'dashboard')) return 'hiring_manager_dashboard';
  if (tab === 'team' || tab === 'team_management') return 'admin_dashboard';
  if (tab === 'job_search' || tab === 'find_jobs') return 'find_jobs';
  if (tab === 'my_applications') return 'my_applications';
  if (tab === 'saved_jobs') return 'saved_jobs';
  if (tab === 'my_posts' || tab === 'posts') return getDefaultTabForRole(role);
  if (tab === 'community_feed' || tab === 'community' || tab === 'community-feed') return getDefaultTabForRole(role);
  if (tab === 'interviews' || tab === 'my_interviews') return isStaff ? 'interviews' : 'my_interviews';
  if (tab === 'post_job') {
    if (isAdmin) return 'admin_dashboard';
    if (isHiringManager) return 'hiring_manager_dashboard';
    return 'post_job';
  }
  if (tab === 'application_status' || tab === 'status_pipeline') return 'application_status';
  if (tab === 'applicants_view' || tab === 'applicants') return 'applicants';
  if (tab === 'company_profile') return 'company_profile';
  if (tab === 'profile' || tab === 'candidate_profile') return 'profile';
  if (tab === 'documents' || tab === 'my_documents' || tab === 'recruiter_documents') return isStaff ? 'documents' : 'profile';
  if (tab === 'add_staff' || tab === 'add_staff_member') return 'add_staff';
  if (tab === 'hiring_groups' || tab === 'groups' || tab === 'staff_groups' || tab === 'pods') return 'hiring_groups';
  if (tab === 'staff_directory' || tab === 'directory') return 'staff_directory';
  if (tab === 'staff_documents' || tab === 'staff_document') return 'staff_documents';
  if (tab === 'messages' || tab === 'message' || tab === 'chat') return 'messages';
  if (tab === 'ai_scheduler') return 'ai_scheduler';
  if (tab === 'onboarding') return 'onboarding';
  if (tab === 'support' || tab === 'help' || tab === 'support_desk') return 'support';
  return tab;
}

// Get canonical URL path for a tab
export function getPathForTab(tab, role = null) {
  if (role === 'SUPERADMIN' || tab === 'superadmin_dashboard') return '/superadmin';
  const normalized = normalizeTabForRole(tab, role);
  const config = TAB_CONFIG[normalized];
  if (config) return config.path;
  if (role === 'ADMIN') return '/admin-dashboard';
  if (role === 'RECRUITER') return '/recruiter-dashboard';
  if (role === 'HIRING_MANAGER') return '/manager-dashboard';
  return '/home';
}

// Check if pathname matches an authentication route
export function getAuthModeFromPath(pathname) {
  if (!pathname) return null;
  const path = pathname.toLowerCase().replace(/\/+$/, '') || '/';
  if (path === '/superadmin/login' || path === '/superadmin-login') return 'superadmin_login';
  if (path === '/superadmin') return 'superadmin';
  if (path === '/login/candidate' || path === '/candidate-login' || path === '/login-candidate') return 'login_candidate';
  if (path === '/login/recruiter' || path === '/recruiter-login' || path === '/login-recruiter') return 'login_recruiter';
  if (path === '/login') return 'login';
  if (path === '/register/candidate' || path === '/register-candidate') return 'register_candidate';
  if (path === '/register/company' || path === '/register-company') return 'register_company';
  if (path === '/register') return 'select_role';
  return null;
}

// Resolve any incoming URL pathname (handling hyphens, spaces, underscores, camelCase) to tab
export function getTabFromPathname(pathname, role = null) {
  if (!pathname) return getDefaultTabForRole(role);

  let raw = pathname;
  try {
    raw = decodeURIComponent(pathname);
  } catch (e) {
    // fallback to untouched
  }

  // Normalize: lowercased, trim slashes, replace spaces/underscores with dashes
  const slug = raw.toLowerCase().trim().replace(/^\/+|\/+$/g, '').replace(/[\s_]+/g, '-');

  if (!slug || slug === '' || slug === 'home' || slug === 'feed') {
    if (role === 'ADMIN') return 'admin_dashboard';
    if (role === 'RECRUITER') return 'recruiter_dashboard';
    if (role === 'HIRING_MANAGER') return 'hiring_manager_dashboard';
    return 'home';
  }

  const SLUG_MAP = {
    'home': 'home',
    'feed': 'home',
    'dashboard': getDefaultTabForRole(role),
    'superadmin': 'superadmin_dashboard',
    'superadmin-dashboard': 'superadmin_dashboard',
    'superadmin/login': 'superadmin_dashboard',
    'admin-dashboard': 'admin_dashboard',
    'admin': 'admin_dashboard',
    'recruiter-dashboard': 'recruiter_dashboard',
    'recruiter': 'recruiter_dashboard',
    'manager-dashboard': 'hiring_manager_dashboard',
    'hiring-manager-dashboard': 'hiring_manager_dashboard',
    'manager': 'hiring_manager_dashboard',
    'manage-jobs': 'manage_jobs',
    'managejobs': 'manage_jobs',
    'consultants': 'manage_jobs',
    'post-job': 'post_job',
    'postjob': 'post_job',
    'applicants': 'applicants',
    'applicants-view': 'applicants',
    'application-status': 'applicants',
    'candidates': 'applicants',
    'find-jobs': 'find_jobs',
    'findjobs': 'find_jobs',
    'job-search': 'find_jobs',
    'jobs': 'find_jobs',
    'my-applications': 'my_applications',
    'myapplications': 'my_applications',
    'applications': 'my_applications',
    'saved-jobs': 'saved_jobs',
    'savedjobs': 'saved_jobs',
    'my-posts': getDefaultTabForRole(role),
    'myposts': getDefaultTabForRole(role),
    'posts': getDefaultTabForRole(role),
    'community-feed': getDefaultTabForRole(role),
    'communityfeed': getDefaultTabForRole(role),
    'community': getDefaultTabForRole(role),
    'interviews': role === 'CANDIDATE' ? 'my_interviews' : 'interviews',
    'my-interviews': 'my_interviews',
    'myinterviews': 'my_interviews',
    'ai-scheduler': 'ai_scheduler',
    'aischeduler': 'ai_scheduler',
    'scheduler': 'ai_scheduler',
    'profile': 'profile',
    'candidate-profile': 'profile',
    'my-profile': 'profile',
    'company-profile': 'company_profile',
    'company': 'company_profile',
    'messages': 'messages',
    'message': 'messages',
    'chat': 'messages',
    'add-staff': 'add_staff',
    'add-staff-member': 'add_staff',
    'hiring-groups': 'hiring_groups',
    'groups': 'hiring_groups',
    'staff-groups': 'hiring_groups',
    'pods': 'hiring_groups',
    'staff-directory': 'staff_directory',
    'directory': 'staff_directory',
    'staff': 'staff_directory',
    'staff-document': 'staff_documents',
    'staff-documents': 'staff_documents',
    'candidate-interview': 'interviews',
    'candidate-interviews': 'interviews',
    'scheduled-interview': 'interviews',
    'scheduled-interviews': 'interviews',
    'team': 'staff_directory',
    'team-management': 'staff_directory',
    'documents': role === 'CANDIDATE' ? 'profile' : 'documents',
    'my-documents': role === 'CANDIDATE' ? 'profile' : 'documents',
    'application-status': 'application_status',
    'applicationstatus': 'application_status',
    'support': 'support',
    'support-desk': 'support',
    'help': 'support',
    'onboarding': 'onboarding',
    'candidate-onboarding': 'onboarding',
  };

  return SLUG_MAP[slug] || null;
}

// Standard Google Meet / Live Room generator
export function generateGoogleMeetLink() {
  return generateInterviewRoomLink();
}

// Detect custom organization tenant from path (/tenant/:slug), query (?tenant= or ?subdomain=), or host
export function getDetectedTenantSubdomain() {
  if (typeof window === 'undefined') return null;

  // 1. Path match /tenant/:slug
  const pathMatch = window.location.pathname.match(/^\/tenant\/([a-zA-Z0-9_-]+)/);
  if (pathMatch && pathMatch[1]) return pathMatch[1].toLowerCase();

  // 2. Query param ?tenant=slug or ?subdomain=slug
  const params = new URLSearchParams(window.location.search);
  const qTenant = params.get('tenant') || params.get('subdomain');
  if (qTenant) return qTenant.toLowerCase();

  // 3. Subdomain on host
  const host = window.location.hostname.toLowerCase();

  // If host is an IP address (e.g. 187.77.188.152 or 127.0.0.1), no subdomain
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) return null;

  const parts = host.split('.');
  const isLocalhostSubdomain = parts.length === 2 && parts[1] === 'localhost';

  // Standard domain needs at least 3 parts (e.g. <subdomain>.intentpeople.com)
  if (parts.length >= 3 || isLocalhostSubdomain) {
    const sub = parts[0];
    if (!['www', 'api', 'app', 'backend', 'localhost', '127', 'portal', 'admin', 'superadmin', 'mail', 'smtp', 'ftp'].includes(sub)) {
      return sub;
    }
  }
  return null;
}

// Detect job ID or short code from URL path (/jobs/:id, /job/:id) or query (?job=:id, ?jobId=:id, ?id=:id)
export function getJobIdFromUrl() {
  if (typeof window === 'undefined') return null;

  // 1. Path match /jobs/:id or /job/:id (supports unguessable short codes e.g. 2yxsr6 or numeric IDs)
  const pathMatch = window.location.pathname.match(/^\/(?:jobs|job)\/([a-zA-Z0-9_-]+)/i);
  if (pathMatch && pathMatch[1]) {
    const val = pathMatch[1].trim();
    if (val) return val;
  }

  // 2. Query param ?job=id or ?jobId=id or ?id=id
  const params = new URLSearchParams(window.location.search);
  const qId = params.get('jobId') || params.get('job') || (window.location.pathname.startsWith('/job') ? params.get('id') : null);
  if (qId) {
    const val = qId.trim();
    if (val) return val;
  }

  return null;
}

