import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';

// Lazy-loaded top-level view modules for performance & code splitting
const AuthPage = lazy(() => import('./views/auth/AuthPage'));
const Landing = lazy(() => import('./views/landing/Landing'));
const FeedDashboard = lazy(() => import('./views/feed/FeedDashboard'));
const NotificationModal = lazy(() => import('./components/NotificationModal'));

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
          Loading Uptrix Platform...
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
} from './utils/navigation';

function MainAppContent() {
  const { user, loading } = useAuth();

  // Route & Modal state
  const initialAuthMode = getAuthModeFromPath(window.location.pathname);
  const [showAuthPage, setShowAuthPage] = useState(Boolean(initialAuthMode));
  const [authInitialMode, setAuthInitialMode] = useState(initialAuthMode || 'login');

  const [activeTab, setActiveTab] = useState(() => {
    const resolved = getTabFromPathname(window.location.pathname, null);
    return resolved || 'home';
  });

  const [selectedJobId, setSelectedJobId] = useState(null);
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
      const authMode = getAuthModeFromPath(pathname);

      if (!user) {
        if (authMode) {
          setShowAuthPage(true);
          setAuthInitialMode(authMode);
        } else {
          setShowAuthPage(false);
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
    if (user) {
      setShowAuthPage(false);
      const currentPath = window.location.pathname;
      const authMode = getAuthModeFromPath(currentPath);

      if (authMode || currentPath === '/' || currentPath === '') {
        // Redirect to user's default dashboard URL
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
    setShowAuthPage(true);
  };

  const navigateToHome = () => {
    if (window.location.pathname !== '/') {
      window.history.pushState(null, '', '/');
    }
    setShowAuthPage(false);
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

  if (!user) {
    return (
      <Suspense fallback={<PageLoadingFallback />}>
        {!showAuthPage ? (
          <Landing onNavigateToAuth={navigateToAuth} />
        ) : (
          <AuthPage
            initialMode={authInitialMode}
            onBackToLanding={navigateToHome}
            onModeChange={handleAuthModeChange}
          />
        )}
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
