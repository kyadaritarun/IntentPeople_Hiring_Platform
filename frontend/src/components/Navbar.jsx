import React, { useState, useEffect, useRef } from 'react';
import {
  Home, Users, Briefcase, Bell, Search,
  HelpCircle, LogOut, ShieldCheck, ChevronDown,
  PlusCircle, User, Building2, LayoutDashboard,
  CheckCircle2, Calendar, PenSquare, FileText, Bookmark, Sparkles, MessageSquare, TrendingUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function Navbar({
  activeTab,
  setActiveTab,
  onOpenSupport,
  onOpenNotifs,
  onTriggerCreatePost
}) {
  const { user, logout } = useAuth();
  const [unreadNotifs, setUnreadNotifs] = useState(15);
  const [showMeMenu, setShowMeMenu] = useState(false);

  const meMenuRef = useRef(null);

  useEffect(() => {
    if (user) {
      api.getNotifications()
        .then(list => {
          const count = list.filter(n => !n.is_read).length;
          if (count > 0) setUnreadNotifs(count);
        })
        .catch(() => { });
    }
  }, [user]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (meMenuRef.current && !meMenuRef.current.contains(e.target)) {
        setShowMeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const isRecruiter = user.role === 'RECRUITER';
  const profile = user.profile || {};
  const profileName = isRecruiter
    ? (profile.company_name || 'Recruiting Partner')
    : (profile.full_name || user.email?.split('@')[0] || 'Member');
  const profileHeadline = isRecruiter
    ? (profile.industry || 'Digital Marketing Agency')
    : (!profile.title || profile.title.toLowerCase().includes('digital marketing') ? 'Candidate' : profile.title);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-2xs font-sans">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 h-14 flex items-center justify-between gap-2 sm:gap-3">

        {/* ========================================================= */}
        <div className="flex items-center shrink-0">
          <img
            src="/logo.svg"
            alt="Uptrix Logo"
            className="h-8 sm:h-9 object-contain cursor-pointer select-none hover:opacity-90 transition-opacity"
            onClick={() => setActiveTab(isRecruiter ? 'recruiter_dashboard' : 'home')}
            title="Uptrix Home"
          />
        </div>

        {/* ========================================================= */}
        {/* CENTER / RIGHT: Role-Specific Navigation Links            */}
        {/* ========================================================= */}
        <nav className="flex items-center space-x-1 sm:space-x-1.5 md:space-x-2 h-full overflow-x-auto no-scrollbar py-0.5">

          {/* ======================================================= */}
          {/* A. RECRUITER NAVIGATION ITEMS                          */}
          {/* ======================================================= */}
          {isRecruiter ? (
            <>
              {/* 1. Dashboard */}
              <button
                type="button"
                onClick={() => setActiveTab('recruiter_dashboard')}
                className={`h-full flex flex-col items-center justify-center px-2 border-b-2 transition-colors cursor-pointer border-transparent ${activeTab === 'recruiter_dashboard'
                  ? 'border-slate-900 text-slate-900 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
                  }`}
                title="Recruiter Operations Dashboard"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="text-[0.68rem] font-medium hidden md:block mt-0.5 whitespace-nowrap">Dashboard</span>
              </button>

              {/* 2. Post Job */}
              <button
                type="button"
                onClick={() => setActiveTab('post_job')}
                className={`h-full flex flex-col items-center justify-center px-2 border-b-2 transition-colors cursor-pointer border-transparent ${activeTab === 'post_job'
                  ? 'border-slate-900 text-slate-900 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
                  }`}
                title="Post a New Job"
              >
                <PlusCircle className="w-5 h-5 text-[#0a66c2]" />
                <span className="text-[0.68rem] font-medium hidden md:block mt-0.5 whitespace-nowrap">Post Job</span>
              </button>

              {/* 3. Manage Job */}
              <button
                type="button"
                onClick={() => setActiveTab('manage_jobs')}
                className={`h-full flex flex-col items-center justify-center px-2 border-b-2 transition-colors cursor-pointer border-transparent ${activeTab === 'manage_jobs'
                  ? 'border-slate-900 text-slate-900 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
                  }`}
                title="Manage Posted Jobs"
              >
                <Briefcase className="w-5 h-5 text-indigo-600" />
                <span className="text-[0.68rem] font-medium hidden md:block mt-0.5 whitespace-nowrap">Manage Job</span>
              </button>

              {/* 4. Applicants */}
              <button
                type="button"
                onClick={() => setActiveTab('applicants_view')}
                className={`h-full flex flex-col items-center justify-center px-2 border-b-2 transition-colors cursor-pointer border-transparent ${activeTab === 'applicants_view'
                  ? 'border-slate-900 text-slate-900 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
                  }`}
                title="Review Candidate Applications"
              >
                <Users className="w-5 h-5 text-emerald-600" />
                <span className="text-[0.68rem] font-medium hidden md:block mt-0.5 whitespace-nowrap">Applicants</span>
              </button>

              {/* 5. Application Status */}
              <button
                type="button"
                onClick={() => setActiveTab('applicants_view')}
                className={`h-full flex flex-col items-center justify-center px-2 border-b-2 transition-colors cursor-pointer border-transparent ${activeTab === 'applicants_view'
                  ? 'border-slate-900 text-slate-900 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
                  }`}
                title="Application Status & Pipeline"
              >
                <CheckCircle2 className="w-5 h-5 text-cyan-600" />
                <span className="text-[0.68rem] font-medium hidden md:block mt-0.5 whitespace-nowrap">Application Status</span>
              </button>

              {/* 6. Interview */}
              <button
                type="button"
                onClick={() => setActiveTab('interviews')}
                className={`h-full flex flex-col items-center justify-center px-2 border-b-2 transition-colors cursor-pointer border-transparent ${activeTab === 'interviews'
                  ? 'border-slate-900 text-slate-900 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
                  }`}
                title="Candidate Interview Schedule"
              >
                <Calendar className="w-5 h-5 text-amber-600" />
                <span className="text-[0.68rem] font-medium hidden md:block mt-0.5 whitespace-nowrap">Interview</span>
              </button>

              {/* 6B. Messages */}
              <button
                type="button"
                onClick={() => setActiveTab('messages')}
                className={`h-full flex flex-col items-center justify-center px-2 border-b-2 transition-colors cursor-pointer border-transparent ${activeTab === 'messages'
                  ? 'border-slate-900 text-slate-900 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
                  }`}
                title="Candidate & Team Messages"
              >
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                <span className="text-[0.68rem] font-medium hidden md:block mt-0.5 whitespace-nowrap">Messages</span>
              </button>

              {/* 8. Notifications */}
              <button
                type="button"
                onClick={onOpenNotifs}
                className="h-full flex flex-col items-center justify-center px-2 border-b-2 transition-colors cursor-pointer border-transparent text-slate-500 hover:text-slate-900 relative"
                title="Notifications"
              >
                <div className="relative">
                  <Bell className="w-5 h-5" />
                  {unreadNotifs > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-rose-600 text-white rounded-full min-w-[15px] h-3.5 px-0.5 text-[0.6rem] font-bold flex items-center justify-center ring-2 ring-white">
                      {unreadNotifs}
                    </span>
                  )}
                </div>
                <span className="text-[0.68rem] font-medium hidden md:block mt-0.5 whitespace-nowrap">Notifications</span>
              </button>

              {/* 8. Support */}
              <button
                type="button"
                onClick={onOpenSupport}
                className="h-full flex flex-col items-center justify-center px-2 border-b-2 transition-colors cursor-pointer border-transparent text-slate-500 hover:text-slate-900"
                title="Help & Recruiter Support"
              >
                <HelpCircle className="w-5 h-5" />
                <span className="text-[0.68rem] font-medium hidden md:block mt-0.5 whitespace-nowrap">Support</span>
              </button>
            </>
          ) : (
            /* ======================================================= */
            /* B. CANDIDATE NAVIGATION ITEMS                           */
            /* ======================================================= */
            <>
              {/* 1. Home */}
              <button
                type="button"
                onClick={() => setActiveTab('home')}
                className={`h-full flex flex-col items-center justify-center px-2 border-b-2 transition-colors cursor-pointer border-transparent ${activeTab === 'home'
                  ? 'border-slate-900 text-slate-900 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
                  }`}
                title="Candidate Home"
              >
                <Home className="w-5 h-5" />
                <span className="text-[0.68rem] font-medium hidden md:block mt-0.5 whitespace-nowrap">Home</span>
              </button>

              {/* 3. Job Search */}
              <button
                type="button"
                onClick={() => setActiveTab('job_search')}
                className={`h-full flex flex-col items-center justify-center px-2 border-b-2 transition-colors cursor-pointer border-transparent ${activeTab === 'job_search'
                  ? 'border-slate-900 text-slate-900 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
                  }`}
                title="Search Digital Marketing Jobs"
              >
                <Search className="w-5 h-5" />
                <span className="text-[0.68rem] font-medium hidden md:block mt-0.5 whitespace-nowrap">Job Search</span>
              </button>

              {/* 4. My Applications */}
              <button
                type="button"
                onClick={() => setActiveTab('my_applications')}
                className={`h-full flex flex-col items-center justify-center px-2 border-b-2 transition-colors cursor-pointer border-transparent ${activeTab === 'my_applications'
                  ? 'border-slate-900 text-slate-900 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
                  }`}
                title="Track My Submitted Applications"
              >
                <FileText className="w-5 h-5 text-emerald-600" />
                <span className="text-[0.68rem] font-medium hidden md:block mt-0.5 whitespace-nowrap">My Applications</span>
              </button>

              {/* 5. Saved Jobs */}
              <button
                type="button"
                onClick={() => setActiveTab('saved_jobs')}
                className={`h-full flex flex-col items-center justify-center px-2 border-b-2 transition-colors cursor-pointer border-transparent ${activeTab === 'saved_jobs'
                  ? 'border-slate-900 text-slate-900 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
                  }`}
                title="Saved & Bookmarked Roles"
              >
                <Bookmark className="w-5 h-5 text-amber-600" />
                <span className="text-[0.68rem] font-medium hidden md:block mt-0.5 whitespace-nowrap">Saved Jobs</span>
              </button>

              {/* 5B. Monthly Analysis */}
              <button
                type="button"
                onClick={() => setActiveTab('skill_advisory')}
                className={`h-full flex flex-col items-center justify-center px-2 border-b-2 transition-colors cursor-pointer border-transparent ${activeTab === 'skill_advisory'
                  ? 'border-slate-900 text-slate-900 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
                  }`}
                title="Monthly Analysis"
              >
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                <span className="text-[0.68rem] font-medium hidden md:block mt-0.5 whitespace-nowrap">Monthly Analysis</span>
              </button>

              {/* 6. Interview */}
              <button
                type="button"
                onClick={() => setActiveTab('interviews')}
                className={`h-full flex flex-col items-center justify-center px-2 border-b-2 transition-colors cursor-pointer border-transparent ${activeTab === 'interviews'
                  ? 'border-slate-900 text-slate-900 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
                  }`}
                title="My Upcoming Interviews"
              >
                <Calendar className="w-5 h-5 text-cyan-600" />
                <span className="text-[0.68rem] font-medium hidden md:block mt-0.5 whitespace-nowrap">Interview</span>
              </button>

              {/* 6B. Messages */}
              <button
                type="button"
                onClick={() => setActiveTab('messages')}
                className={`h-full flex flex-col items-center justify-center px-2 border-b-2 transition-colors cursor-pointer border-transparent ${activeTab === 'messages'
                  ? 'border-slate-900 text-slate-900 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
                  }`}
                title="Direct Messages"
              >
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                <span className="text-[0.68rem] font-medium hidden md:block mt-0.5 whitespace-nowrap">Messages</span>
              </button>

              {/* 7. Notifications */}
              <button
                type="button"
                onClick={onOpenNotifs}
                className="h-full flex flex-col items-center justify-center px-2 border-b-2 transition-colors cursor-pointer border-transparent text-slate-500 hover:text-slate-900 relative"
                title="Notifications"
              >
                <div className="relative">
                  <Bell className="w-5 h-5" />
                  {unreadNotifs > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-rose-600 text-white rounded-full min-w-[15px] h-3.5 px-0.5 text-[0.6rem] font-bold flex items-center justify-center ring-2 ring-white">
                      {unreadNotifs}
                    </span>
                  )}
                </div>
                <span className="text-[0.68rem] font-medium hidden md:block mt-0.5 whitespace-nowrap">Notifications</span>
              </button>
            </>
          )}
        </nav>

        {/* ======================================================= */}
        {/* RIGHT: DIVIDER + ME PROFILE DROPDOWN (Outside overflow) */}
        {/* ======================================================= */}
        <div className="flex items-center h-full shrink-0">
          <div className="h-8 w-px bg-slate-200 mx-1.5 shrink-0" />

          <div className="relative h-full flex items-center shrink-0" ref={meMenuRef}>
            <button
              type="button"
              onClick={() => setShowMeMenu(prev => !prev)}
              className="h-full flex flex-col items-center justify-center px-2 sm:px-3 border-b-2 border-transparent text-slate-600 hover:text-slate-900 cursor-pointer select-none"
            >
              <div className="w-6 h-6 rounded-full bg-slate-800 text-white text-[0.7rem] font-bold flex items-center justify-center ring-1 ring-slate-300">
                {profileName.charAt(0).toUpperCase()}
              </div>
              <span className="text-[0.68rem] font-medium flex items-center gap-0.5 mt-0.5">
                Me <ChevronDown className="w-3 h-3 text-slate-400" />
              </span>
            </button>

            {/* "Me" Dropdown Panel - Floats freely outside overflow */}
            {showMeMenu && (
              <div
                className="absolute right-0 top-full mt-1 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 py-3 z-50 text-slate-800 animate-in fade-in duration-150"
                style={{ minWidth: '250px' }}
              >
                {/* User Info Header */}
                <div className="px-4 pb-3 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 text-white text-base font-bold flex items-center justify-center shrink-0">
                    {profileName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-900 truncate">{profileName}</div>
                    <div className="text-[0.68rem] text-slate-500 truncate">{profileHeadline}</div>
                    <div className="text-[0.65rem] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Verified {isRecruiter ? 'Recruiter' : 'Candidate'}
                    </div>
                  </div>
                </div>

                {/* View Profile Action */}
                <div className="p-2 border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab(isRecruiter ? 'company_profile' : 'candidate_profile');
                      setShowMeMenu(false);
                    }}
                    className="w-full py-1.5 px-3 rounded-full border border-[#0a66c2] text-[#0a66c2] hover:bg-blue-50 text-xs font-bold transition-colors cursor-pointer text-center"
                  >
                    View Profile
                  </button>
                </div>

                {/* Manage Links */}
                <div className="py-2 text-xs text-slate-700 border-b border-slate-100">
                  <div className="px-4 py-1 font-bold text-slate-900 text-[0.7rem] uppercase tracking-wider">
                    Quick Navigation
                  </div>
                  <div
                    onClick={() => {
                      setActiveTab(isRecruiter ? 'manage_jobs' : 'my_applications');
                      setShowMeMenu(false);
                    }}
                    className="px-4 py-1.5 hover:bg-slate-50 cursor-pointer flex items-center gap-2"
                  >
                    <span>{isRecruiter ? 'Manage Job Roles' : 'My Applications & Status'}</span>
                  </div>
                  {!isRecruiter && (
                    <div
                      onClick={() => {
                        setActiveTab('skill_advisory');
                        setShowMeMenu(false);
                      }}
                      className="px-4 py-1.5 hover:bg-slate-50 cursor-pointer flex items-center gap-2 text-indigo-700 font-medium"
                    >
                      <TrendingUp size={13} />
                      <span>Monthly Analysis</span>
                    </div>
                  )}
                  <div
                    onClick={() => {
                      setActiveTab('interviews');
                      setShowMeMenu(false);
                    }}
                    className="px-4 py-1.5 hover:bg-slate-50 cursor-pointer flex items-center gap-2"
                  >
                    <span>Upcoming Interviews</span>
                  </div>
                  <div
                    onClick={() => { onOpenSupport(); setShowMeMenu(false); }}
                    className="px-4 py-1.5 hover:bg-slate-50 cursor-pointer flex items-center gap-2"
                  >
                    <span>Help & Support Center</span>
                  </div>
                </div>

                {/* Sign Out */}
                <div className="pt-2 px-2">
                  <button
                    type="button"
                    onClick={() => { logout(); setShowMeMenu(false); }}
                    className="w-full py-1.5 px-3 text-left hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded text-xs font-semibold flex items-center gap-2 cursor-pointer border-none bg-transparent"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
