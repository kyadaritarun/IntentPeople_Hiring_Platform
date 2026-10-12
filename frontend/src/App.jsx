import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';

// Lazy-loaded top-level view modules for performance & code splitting
const AuthPage = lazy(() => import('./views/auth/AuthPage'));
const FeedDashboard = lazy(() => import('./views/feed/FeedDashboard'));
const NotificationModal = lazy(() => import('./components/NotificationModal'));
const SuperadminLogin = lazy(() => import('./views/superadmin/SuperadminLogin'));
const SuperadminDashboard = lazy(() => import('./views/superadmin/SuperadminDashboard'));
const VendorPaymentPage = lazy(() => import('./views/payment/VendorPaymentPage'));
const PublicJobView = lazy(() => import('./views/public/PublicJobView'));
const CandidateOnboardingView = lazy(() => import('./views/candidate/CandidateOnboardingView'));

// Universal page loading fallback
function PageLoadingFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F6F7FB] text-slate-600 font-sans p-4 animate-in fade-in duration-200">
      <div className="flex flex-col items-center gap-4">
        <img
          src="/logo.svg"
          alt="Uptrix Platform"
          width="140"
          height="34"
          className="h-9 w-auto object-contain select-none"
        />
        <p className="text-[0.72rem] font-bold text-slate-500 uppercase tracking-widest animate-pulse m-0">
          Loading Platform...
        </p>
      </div>
    </div>
  );
}

// Routing utilities
import {
  TAB_CONFIG,
  getDefaultTabForRole,
  normalizeTabForRole,
  getPathForTab,
  getAuthModeFromPath,
  getTabFromPathname,
  getDetectedTenantSubdomain,
  getJobIdFromUrl,
} from './utils/navigation';

function MainAppContent() {
  const { user, loading, refreshUser } = useAuth();

  // Route & Modal state
  const initialAuthMode = getAuthModeFromPath(window.location.pathname);
  const [authInitialMode, setAuthInitialMode] = useState(initialAuthMode || 'login');

  const [activeTab, setActiveTab] = useState(() => {
    const resolved = getTabFromPathname(window.location.pathname, null);
    return resolved || 'home';
  });

  const [sharedJobId, setSharedJobId] = useState(() => getJobIdFromUrl());
  const [selectedJobId, setSelectedJobId] = useState(() => getJobIdFromUrl());
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [triggerCreatePost, setTriggerCreatePost] = useState(false);

  // Sync document title and canonical URL when tab changes
  const handleTabChange = useCallback((newTab) => {
    const userRole = user?.role || null;
    const normalized = normalizeTabForRole(newTab, userRole);
    setActiveTab(normalized);

    const canonicalPath = getPathForTab(normalized, userRole);
    if (window.location.pathname !== canonicalPath) {
      window.history.pushState({ tab: normalized }, '', canonicalPath);
    }

    const title = TAB_CONFIG[normalized]?.title || 'Uptrix Platform';
    document.title = title;
  }, [user]);

  // Handle browser Back / Forward (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname;

      // Public vendor checkout URLs must never be captured by tab routing
      if (pathname.startsWith('/vendor-pay')) {
        return;
      }

      const authMode = getAuthModeFromPath(pathname);
      const urlJob = getJobIdFromUrl();
      if (urlJob) {
        setSharedJobId(urlJob);
      }

      if (!user) {
        if (authMode) {
          setAuthInitialMode(authMode);
        }
      } else {
        const resolvedTab = getTabFromPathname(pathname, user.role);
        if (resolvedTab) {
          setActiveTab(resolvedTab);
          const title = TAB_CONFIG[resolvedTab]?.title || 'Uptrix Platform';
          document.title = title;
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

  // Synchronize on authentication change or initial load with authenticated user
  useEffect(() => {
    const currentPath = window.location.pathname;

    // Public vendor payment and checkout pages must remain directly accessible even if logged in as admin/user
    if (currentPath.startsWith('/vendor-pay')) {
      return;
    }

    if (user) {
      // Check if candidate or user navigated to a shared job or logged in after clicking Apply
      const pendingJobStr = typeof window !== 'undefined' ? sessionStorage.getItem('uptrix_pending_apply_job_id') : null;
      const targetJobId = pendingJobStr || sharedJobId || getJobIdFromUrl();

      if (targetJobId) {
        setSelectedJobId(targetJobId);
        if (user.role === 'CANDIDATE') {
          setActiveTab('find_jobs');
        } else {
          setActiveTab('manage_jobs');
        }
        try {
          sessionStorage.removeItem('uptrix_pending_apply_job_id');
        } catch (e) { }
        setSharedJobId(null);
      }

      if (user.role === 'SUPERADMIN') {
        const isAdminHost = typeof window !== 'undefined' && (
          window.location.hostname === 'admin.intentpeople.com' ||
          window.location.hostname.startsWith('admin.')
        );
        if (!isAdminHost) {
          window.location.replace('https://admin.intentpeople.com/');
          return;
        }
        setActiveTab('superadmin_dashboard');
        document.title = 'Superadmin Console | Uptrix';
        return;
      }

      const authMode = getAuthModeFromPath(currentPath);

      if (authMode || currentPath === '/' || currentPath === '' || currentPath.startsWith('/superadmin')) {
        // Redirect standard user to their default dashboard URL
        const defaultTab = getDefaultTabForRole(user.role);
        const targetPath = getPathForTab(defaultTab, user.role);
        setActiveTab(defaultTab);
        window.history.replaceState({ tab: defaultTab }, '', targetPath);
        document.title = TAB_CONFIG[defaultTab]?.title || 'Uptrix Platform';
      } else {
        // Resolve tab from existing URL (e.g. /manage-jobs, /home, /applicants)
        const tabFromUrl = getTabFromPathname(currentPath, user.role);
        const active = tabFromUrl || getDefaultTabForRole(user.role);
        setActiveTab(active);
        const canonical = getPathForTab(active, user.role);
        if (currentPath !== canonical) {
          window.history.replaceState({ tab: active }, '', canonical);
        }
        document.title = TAB_CONFIG[active]?.title || 'Uptrix Platform';
      }
    }
  }, [user]);

  // Auth navigation helpers
  const navigateToAuth = (mode = 'login') => {
    let targetPath = '/login';
    if (mode === 'login_candidate') targetPath = '/login/candidate';
    else if (mode === 'login_recruiter') targetPath = '/login/recruiter';
    else if (mode === 'register_candidate') targetPath = '/register/candidate';
    else if (mode === 'register_company') targetPath = '/register/company';
    else if (mode === 'select_role') targetPath = '/register';

    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
    setAuthInitialMode(mode);
  };

  const navigateToHome = () => {
    window.location.href = 'https://intentpeople.com/';
  };

  const handleAuthModeChange = (mode) => {
    let targetPath = '/login';
    if (mode === 'login_candidate') targetPath = '/login/candidate';
    else if (mode === 'login_recruiter') targetPath = '/login/recruiter';
    else if (mode === 'register_candidate') targetPath = '/register/candidate';
    else if (mode === 'register_company') targetPath = '/register/company';
    else if (mode === 'select_role') targetPath = '/register';

    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
    setAuthInitialMode(mode);
  };

  if (loading) {
    return <PageLoadingFallback />;
  }

  // 1. PUBLIC VENDOR CHECKOUT & PAYMENT
  // Public vendor checkout URLs (e.g. /vendor-pay/:token) must ALWAYS be directly accessible on any domain
  const isVendorPayPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/vendor-pay');

  if (isVendorPayPath) {
    return (
      <Suspense fallback={<PageLoadingFallback />}>
        <VendorPaymentPage
          onLoginRedirect={(subdomain) => {
            window.history.pushState(null, '', `/tenant/${subdomain}`);
            window.location.reload();
          }}
        />
      </Suspense>
    );
  }

  const isAdminDomain = typeof window !== 'undefined' && (
    window.location.hostname === 'admin.intentpeople.com' ||
    window.location.hostname.startsWith('admin.')
  );

  // If someone accesses /superadmin on portal or any non-admin domain, redirect to admin.intentpeople.com
  if (!isAdminDomain && typeof window !== 'undefined' && window.location.pathname.startsWith('/superadmin')) {
    window.location.replace('https://admin.intentpeople.com/');
    return <PageLoadingFallback />;
  }

  // If on admin.intentpeople.com, it is exclusively reserved for SUPERADMIN
  if (isAdminDomain) {
    if (!user || user.role !== 'SUPERADMIN') {
      return (
        <Suspense fallback={<PageLoadingFallback />}>
          <SuperadminLogin
            onLoginSuccess={() => {
              window.history.pushState(null, '', '/');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            onBackToLanding={navigateToHome}
          />
        </Suspense>
      );
    }

    return (
      <Suspense fallback={<PageLoadingFallback />}>
        <SuperadminDashboard
          onLogout={() => {
            window.location.href = '/';
          }}
        />
      </Suspense>
    );
  }

  const detectedTenant = getDetectedTenantSubdomain();

  if (!user) {
    const currentPath = window.location.pathname;
    const authMode = getAuthModeFromPath(currentPath);
    const isPublicJobRequest = Boolean(sharedJobId && !authMode);

    if (isPublicJobRequest) {
      return (
        <Suspense fallback={<PageLoadingFallback />}>
          <PublicJobView
            jobId={sharedJobId}
            onNavigateToAuth={(mode) => {
              navigateToAuth(mode || 'login_candidate');
              setSharedJobId(null);
            }}
            onBackToLanding={navigateToHome}
          />
        </Suspense>
      );
    }

    if (detectedTenant) {
      return (
        <Suspense fallback={<PageLoadingFallback />}>
          <AuthPage
            tenant={detectedTenant}
            initialMode="login_recruiter"
            onBackToLanding={navigateToHome}
            onModeChange={handleAuthModeChange}
          />
        </Suspense>
      );
    }

    return (
      <Suspense fallback={<PageLoadingFallback />}>
        <AuthPage
          initialMode={authInitialMode}
          onBackToLanding={navigateToHome}
          onModeChange={handleAuthModeChange}
        />
      </Suspense>
    );
  }

  // CANDIDATE MANDATORY ONBOARDING GATE:
  // When a new candidate logs in and has not completed onboarding,
  // show exclusively the Candidate Onboarding page until completed.
  const isCandidate = user?.role === 'CANDIDATE';
  const isCandidateOnboardingIncomplete = isCandidate && !user?.profile?.onboarding_completed;

  if (isCandidateOnboardingIncomplete) {
    return (
      <Suspense fallback={<PageLoadingFallback />}>
        <CandidateOnboardingView
          onComplete={async (targetTab) => {
            await refreshUser();
            handleTabChange(targetTab || 'feed');
          }}
          onExit={null}
        />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <div className="min-h-screen bg-[#F6F7FB] text-slate-800 font-sans">
        <FeedDashboard
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          selectedJobId={selectedJobId}
          setSelectedJobId={setSelectedJobId}
          onOpenSupport={() => handleTabChange('support')}
          onOpenNotifs={() => setShowNotifModal(true)}
          openCreatePostModal={triggerCreatePost}
          onCloseCreatePostModal={() => setTriggerCreatePost(false)}
        />

        {/* Notification Modal (Fallback) */}
        {showNotifModal && <NotificationModal onClose={() => setShowNotifModal(false)} isDropdown={false} />}
      </div>
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
