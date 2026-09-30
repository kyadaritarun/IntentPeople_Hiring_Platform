import React from 'react';
import LandingPage from './LandingPage';

export default function App() {
  const handleNavigateToAuth = (mode) => {
    // Portal Base URL (production: https://portal.intentpeople.com, local dev fallback if on localhost)
    const portalBase =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? (import.meta.env.VITE_PORTAL_URL || 'http://localhost:5173')
        : 'https://portal.intentpeople.com';

    let path = '/login';
    if (mode === 'login_candidate') {
      path = '/login/candidate';
    } else if (mode === 'login_recruiter') {
      path = '/login/recruiter';
    } else if (mode === 'select_role' || mode === 'register') {
      path = '/register';
    } else if (mode === 'register_company') {
      path = '/register/company';
    } else if (mode === 'register_candidate') {
      path = '/register/candidate';
    } else if (mode === 'login') {
      path = '/login';
    } else if (mode) {
      path = `/${mode.replace(/^_/, '').replace(/_/g, '/')}`;
    }

    window.location.href = `${portalBase}${path}`;
  };

  return <LandingPage onNavigateToAuth={handleNavigateToAuth} />;
}
