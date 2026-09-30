import React, { useState, useEffect, useCallback } from 'react';
import Landing from './Landing';
import TermsAndConditions from './TermsAndConditions';
import PrivacyPolicy from './PrivacyPolicy';

/**
 * Unified Landing Controller:
 * Hosts the primary Uptrix Landing Page, Terms & Conditions, and Privacy Policy
 * with synchronized URL routing (/terms, /privacy, /) and seamless browser back/forward support.
 */
export default function LandingPage({ onNavigateToAuth }) {
  // Determine initial view from current URL pathname
  const resolveViewFromPath = (pathname) => {
    const path = (pathname || '').toLowerCase().replace(/\/+$/, '') || '/';
    if (path === '/terms' || path === '/terms-and-conditions' || path === '/terms-of-service') {
      return 'terms';
    }
    if (path === '/privacy' || path === '/privacy-policy') {
      return 'privacy';
    }
    return 'landing';
  };

  const [currentView, setCurrentView] = useState(() => resolveViewFromPath(window.location.pathname));

  // Sync document title and canonical URL when view changes
  const switchView = useCallback((view, shouldPushState = true) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (view === 'terms') {
      document.title = 'Terms & Conditions | IntentPeople';
      if (shouldPushState && window.location.pathname !== '/terms') {
        window.history.pushState({ legalView: 'terms' }, '', '/terms');
      }
    } else if (view === 'privacy') {
      document.title = 'Privacy Policy | IntentPeople';
      if (shouldPushState && window.location.pathname !== '/privacy') {
        window.history.pushState({ legalView: 'privacy' }, '', '/privacy');
      }
    } else {
      document.title = 'IntentPeople - AI-Powered Executive Hiring Platform';
      if (shouldPushState && window.location.pathname !== '/') {
        window.history.pushState({ legalView: 'landing' }, '', '/');
      }
    }
  }, []);

  // Listen to browser Back / Forward (popstate)
  useEffect(() => {
    const handlePopState = (event) => {
      const resolved = resolveViewFromPath(window.location.pathname);
      setCurrentView(resolved);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      if (resolved === 'terms') {
        document.title = 'Terms & Conditions | IntentPeople';
      } else if (resolved === 'privacy') {
        document.title = 'Privacy Policy | IntentPeople';
      } else {
        document.title = 'IntentPeople - AI-Powered Executive Hiring Platform';
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Set initial document title on mount if on legal page
  useEffect(() => {
    if (currentView === 'terms') {
      document.title = 'Terms & Conditions | IntentPeople';
    } else if (currentView === 'privacy') {
      document.title = 'Privacy Policy | IntentPeople';
    }
  }, [currentView]);

  if (currentView === 'terms') {
    return (
      <TermsAndConditions
        onBack={() => switchView('landing')}
        onOpenPrivacy={() => switchView('privacy')}
        onNavigateToAuth={onNavigateToAuth}
      />
    );
  }

  if (currentView === 'privacy') {
    return (
      <PrivacyPolicy
        onBack={() => switchView('landing')}
        onOpenTerms={() => switchView('terms')}
        onNavigateToAuth={onNavigateToAuth}
      />
    );
  }

  return (
    <Landing
      onNavigateToAuth={onNavigateToAuth}
      onOpenTerms={() => switchView('terms')}
      onOpenPrivacy={() => switchView('privacy')}
    />
  );
}
