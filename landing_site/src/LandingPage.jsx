import React, { useState, useEffect, useCallback } from 'react';
import Landing from './Landing';
import TermsAndConditions from './TermsAndConditions';
import PrivacyPolicy from './PrivacyPolicy';
import RecruitersPage from './RecruitersPage';
import CandidatesPage from './CandidatesPage';

/**
 * Unified Landing Controller:
 * Hosts the primary Uptrix Landing Page, dedicated Recruiters & Candidates pages,
 * Terms & Conditions, and Privacy Policy with synchronized URL routing
 * (/recruiters, /candidates, /terms, /privacy, /) and seamless browser back/forward support.
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
    if (path === '/recruiters' || path === '/for-recruiters') {
      return 'recruiters';
    }
    if (path === '/candidates' || path === '/for-candidates') {
      return 'candidates';
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
    } else if (view === 'recruiters') {
      document.title = 'Hire Top 1% Growth Marketers | IntentPeople';
      if (shouldPushState && window.location.pathname !== '/recruiters') {
        window.history.pushState({ pageView: 'recruiters' }, '', '/recruiters');
      }
    } else if (view === 'candidates') {
      document.title = 'For Growth Marketers & Candidates | IntentPeople';
      if (shouldPushState && window.location.pathname !== '/candidates') {
        window.history.pushState({ pageView: 'candidates' }, '', '/candidates');
      }
    } else {
      document.title = 'IntentPeople - AI-Powered Executive Hiring Platform';
      if (shouldPushState && window.location.pathname !== '/') {
        window.history.pushState({ pageView: 'landing' }, '', '/');
      }
    }
  }, []);

  // Listen to browser Back / Forward (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const resolved = resolveViewFromPath(window.location.pathname);
      setCurrentView(resolved);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      if (resolved === 'terms') {
        document.title = 'Terms & Conditions | IntentPeople';
      } else if (resolved === 'privacy') {
        document.title = 'Privacy Policy | IntentPeople';
      } else if (resolved === 'recruiters') {
        document.title = 'Hire Top 1% Growth Marketers | IntentPeople';
      } else if (resolved === 'candidates') {
        document.title = 'For Growth Marketers & Candidates | IntentPeople';
      } else {
        document.title = 'IntentPeople - AI-Powered Executive Hiring Platform';
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Set initial document title on mount
  useEffect(() => {
    if (currentView === 'terms') {
      document.title = 'Terms & Conditions | IntentPeople';
    } else if (currentView === 'privacy') {
      document.title = 'Privacy Policy | IntentPeople';
    } else if (currentView === 'recruiters') {
      document.title = 'Hire Top 1% Growth Marketers | IntentPeople';
    } else if (currentView === 'candidates') {
      document.title = 'For Growth Marketers & Candidates | IntentPeople';
    }
  }, [currentView]);

  if (currentView === 'recruiters') {
    return (
      <RecruitersPage
        onNavigateToView={switchView}
        onNavigateToAuth={onNavigateToAuth}
        onOpenPrivacy={() => switchView('privacy')}
        onOpenTerms={() => switchView('terms')}
      />
    );
  }

  if (currentView === 'candidates') {
    return (
      <CandidatesPage
        onNavigateToView={switchView}
        onNavigateToAuth={onNavigateToAuth}
        onOpenPrivacy={() => switchView('privacy')}
        onOpenTerms={() => switchView('terms')}
      />
    );
  }

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
      onNavigateToView={switchView}
      onOpenTerms={() => switchView('terms')}
      onOpenPrivacy={() => switchView('privacy')}
    />
  );
}
