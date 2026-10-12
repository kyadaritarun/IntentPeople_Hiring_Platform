import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  UserCheck,
  Building2
} from "lucide-react";
import RolesExplorer from "./RolesExplorer";

export default function Header({
  currentView = "landing",
  onNavigateToView,
  onNavigateToAuth,
  rolesMenuOpen: controlledRolesMenuOpen,
  setRolesMenuOpen: setControlledRolesMenuOpen
}) {
  const [internalRolesMenuOpen, setInternalRolesMenuOpen] = useState(false);
  const rolesMenuOpen = controlledRolesMenuOpen !== undefined ? controlledRolesMenuOpen : internalRolesMenuOpen;
  const setRolesMenuOpen = setControlledRolesMenuOpen || setInternalRolesMenuOpen;

  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close dropdowns on outside click
  useEffect(() => {
    const closeDropdown = (e) => {
      // If target element is already detached from DOM, ignore
      if (!e.target || !document.body.contains(e.target)) return;

      if (!e.target.closest("#login-dropdown-container")) {
        setLoginDropdownOpen(false);
      }
      if (!e.target.closest("#roles-nav-container") && !e.target.closest("#roles-header-dropdown")) {
        setRolesMenuOpen(false);
      }
    };
    window.addEventListener("click", closeDropdown);
    return () => window.removeEventListener("click", closeDropdown);
  }, []);

  const handleNavClick = (view) => {
    setMobileOpen(false);
    setRolesMenuOpen(false);
    if (onNavigateToView) {
      onNavigateToView(view);
    }
  };

  const handlePricingClick = (e) => {
    if (e) e.preventDefault();
    setMobileOpen(false);
    setRolesMenuOpen(false);

    if (currentView === "landing") {
      const el = document.getElementById("pricing");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      if (onNavigateToView) onNavigateToView("landing");
      setTimeout(() => {
        const el = document.getElementById("pricing");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 150);
    }
  };

  const handleCandidateLogin = () => {
    setLoginDropdownOpen(false);
    setMobileOpen(false);
    if (onNavigateToAuth) onNavigateToAuth("login_candidate");
  };

  const handleRecruiterLogin = () => {
    setLoginDropdownOpen(false);
    setMobileOpen(false);
    if (onNavigateToAuth) onNavigateToAuth("login_recruiter");
  };

  const handleStartHiring = () => {
    setLoginDropdownOpen(false);
    setMobileOpen(false);
    if (onNavigateToAuth) onNavigateToAuth("register_company");
  };

  return (
    <header
      id="site-header"
      className="fixed w-full top-0 bg-[#FAF9F6]/95 backdrop-blur-md z-50 border-b border-slate-200/80 transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex justify-between items-center">
        {/* Logo */}
        <button
          type="button"
          onClick={() => handleNavClick("landing")}
          className="flex items-center gap-3 font-serif font-semibold text-xl text-[#0F172A] hover:opacity-90 transition-opacity bg-transparent border-none cursor-pointer p-0"
        >
          <img src="/logo.svg" alt="IntentPeople" className="h-8 w-auto object-contain select-none" />
        </button>

        {/* Navigation Links */}
        <nav className="hidden md:flex gap-7 text-sm items-center text-[#526071] font-medium">
          <button
            type="button"
            onClick={() => handleNavClick("landing")}
            className={`transition-colors bg-transparent border-none cursor-pointer p-0 text-sm font-medium ${
              currentView === "landing"
                ? "text-indigo-600 font-semibold border-b-2 border-indigo-600 pb-0.5"
                : "text-[#526071] hover:text-indigo-600"
            }`}
          >
            Home
          </button>

          <button
            type="button"
            onClick={() => handleNavClick("recruiters")}
            className={`transition-colors bg-transparent border-none cursor-pointer p-0 text-sm font-medium ${
              currentView === "recruiters"
                ? "text-indigo-600 font-semibold border-b-2 border-indigo-600 pb-0.5"
                : "text-[#526071] hover:text-indigo-600"
            }`}
          >
            For Recruiters
          </button>

          <button
            type="button"
            onClick={() => handleNavClick("candidates")}
            className={`transition-colors bg-transparent border-none cursor-pointer p-0 text-sm font-medium ${
              currentView === "candidates"
                ? "text-indigo-600 font-semibold border-b-2 border-indigo-600 pb-0.5"
                : "text-[#526071] hover:text-indigo-600"
            }`}
          >
            For Candidates
          </button>

          {/* Roles Dropdown Button */}
          <div id="roles-nav-container" className="relative flex items-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setRolesMenuOpen((prev) => !prev);
              }}
              className={`hover:text-indigo-600 transition-colors inline-flex items-center gap-1.5 font-medium bg-transparent border-none cursor-pointer p-0 text-sm ${
                rolesMenuOpen ? "text-indigo-600 font-semibold" : "text-[#526071]"
              }`}
            >
              <span>Roles</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${
                  rolesMenuOpen ? "rotate-180 text-indigo-600" : "text-slate-400"
                }`}
              />
            </button>
          </div>

          <button
            type="button"
            onClick={handlePricingClick}
            className="hover:text-indigo-600 transition-colors cursor-pointer bg-transparent border-none p-0 text-sm font-medium text-[#526071]"
          >
            Pricing
          </button>
        </nav>

        {/* Action CTAs */}
        <div className="flex items-center gap-3.5">
          {/* Split Login Dropdown */}
          <div id="login-dropdown-container" className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLoginDropdownOpen((prev) => !prev);
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
            >
              <span>Sign In</span>
              <ChevronDown
                size={14}
                className={`text-slate-400 transition-transform ${loginDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {loginDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-slate-200/90 bg-white p-2 shadow-xl shadow-slate-900/10 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Select Portal Access
                  </span>
                </div>

                {/* Candidate Login */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCandidateLogin();
                  }}
                  className="group flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition hover:bg-teal-50/80 border-none bg-transparent cursor-pointer"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-[#00a884] group-hover:bg-[#00a884] group-hover:text-white transition-colors shadow-2xs">
                    <UserCheck size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-800 group-hover:text-teal-900 transition-colors flex items-center justify-between">
                      <span>Candidate Login</span>
                      <ChevronRight
                        size={13}
                        className="text-slate-400 group-hover:text-[#00a884] group-hover:translate-x-0.5 transition-all"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 truncate m-0 mt-0.5">
                      Jobs, applications & interviews
                    </p>
                  </div>
                </button>

                {/* Recruiter Login */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRecruiterLogin();
                  }}
                  className="group flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition hover:bg-indigo-50/80 border-none bg-transparent cursor-pointer mt-0.5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-2xs">
                    <Building2 size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-900 transition-colors flex items-center justify-between">
                      <span>Recruiter Login</span>
                      <ChevronRight
                        size={13}
                        className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 truncate m-0 mt-0.5">
                      Post jobs, pipelines & hire talent
                    </p>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Primary Get Started Button */}
          <button
            onClick={handleStartHiring}
            type="button"
            className="btn btn-primary inline-flex text-xs md:text-sm font-semibold py-2.5 px-5 rounded-lg shadow-sm cursor-pointer"
          >
            Start Hiring
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            type="button"
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 focus:outline-none cursor-pointer bg-transparent border-none"
            aria-label="Toggle navigation menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 shadow-xl py-4 px-6 flex flex-col gap-3.5 animate-in fade-in duration-200">
          <button
            type="button"
            onClick={() => handleNavClick("landing")}
            className={`text-left font-semibold py-1 border-b border-slate-100 bg-transparent border-none cursor-pointer text-sm ${
              currentView === "landing" ? "text-indigo-600" : "text-slate-700 hover:text-indigo-600"
            }`}
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => handleNavClick("recruiters")}
            className={`text-left font-medium py-1 border-b border-slate-100 bg-transparent border-none cursor-pointer text-sm ${
              currentView === "recruiters" ? "text-indigo-600 font-semibold" : "text-slate-700 hover:text-indigo-600"
            }`}
          >
            For Recruiters
          </button>
          <button
            type="button"
            onClick={() => handleNavClick("candidates")}
            className={`text-left font-medium py-1 border-b border-slate-100 bg-transparent border-none cursor-pointer text-sm ${
              currentView === "candidates" ? "text-indigo-600 font-semibold" : "text-slate-700 hover:text-indigo-600"
            }`}
          >
            For Candidates
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              setRolesMenuOpen(true);
            }}
            className="text-left text-slate-700 hover:text-indigo-600 font-medium py-1 border-b border-slate-100 bg-transparent border-none cursor-pointer flex items-center justify-between w-full text-sm"
          >
            <span>Roles & Directory</span>
            <ChevronRight size={15} className="text-slate-400" />
          </button>
          <button
            type="button"
            onClick={handlePricingClick}
            className="text-left text-slate-700 hover:text-indigo-600 font-medium py-1 border-b border-slate-100 cursor-pointer bg-transparent border-none text-sm"
          >
            Pricing
          </button>

          <div className="pt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCandidateLogin}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 py-2.5 text-xs font-bold text-teal-800 cursor-pointer"
            >
              <UserCheck size={14} className="text-[#00a884]" />
              <span>Candidate</span>
            </button>
            <button
              type="button"
              onClick={handleRecruiterLogin}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 py-2.5 text-xs font-bold text-indigo-800 cursor-pointer"
            >
              <Building2 size={14} className="text-indigo-600" />
              <span>Recruiter</span>
            </button>
          </div>

          <button
            onClick={handleStartHiring}
            type="button"
            className="btn btn-primary w-full text-center font-semibold py-3 rounded-lg text-xs mt-1 cursor-pointer"
          >
            Start Hiring
          </button>
        </div>
      )}

      {/* Roles Dropdown attached directly beneath the Header */}
      {rolesMenuOpen && (
        <div
          id="roles-header-dropdown"
          className="absolute top-full left-0 right-0 flex justify-center px-4 pt-1.5 pointer-events-none"
        >
          <div className="w-full max-w-3xl bg-white border border-slate-200/95 rounded-2xl shadow-2xl overflow-visible pointer-events-auto animate-in slide-in-from-top-2 duration-150">
            <div className="p-4">
              <RolesExplorer
                isDropdown={false}
                compact={true}
                onApplyJob={(job) => {
                  setRolesMenuOpen(false);
                  handleCandidateLogin();
                }}
                onHireCandidate={(cand) => {
                  setRolesMenuOpen(false);
                  handleRecruiterLogin();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
