import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import {
  Home, Briefcase, MapPin, Building2, Users, Bookmark, Calendar,
  Image as ImageIcon, Video, FileText, Send, X, Plus, Sparkles, CheckCircle2,
  ShieldCheck, TrendingUp, Eye, Search, Clock, Zap, Target, Bell,
  ChevronRight, ChevronLeft, ChevronDown, ChevronUp, User, PenLine, Moon, Sun, LogOut,
  CalendarCheck, CalendarOff, UsersRound, LayoutDashboard, PlusCircle,
  HelpCircle, Check, Copy, Folder, ArrowUpRight, Activity, Rocket,
  ClipboardList, Laptop, Brain, Shield, BarChart3, Code, UserPlus,
  MessageSquare, Menu, Share2, Globe, Server, Layers, Crown, Sliders
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';

// ── Lazy-loaded sub-views for unified single-shell navigation & code-splitting ──
const JobSearch = lazy(() => import('../candidate/JobSearch'));
const MyApplications = lazy(() => import('../candidate/MyApplications'));
const SavedJobs = lazy(() => import('../candidate/SavedJobs'));
const CandidateSkillAdvisoryView = lazy(() => import('../candidate/CandidateSkillAdvisoryView'));
const CandidateProfile = lazy(() => import('../candidate/CandidateProfile'));
const InterviewsView = lazy(() => import('../common/InterviewsView'));
const MessagesView = lazy(() => import('../common/MessagesView'));
const AdminDashboard = lazy(() => import('../admin/AdminDashboard'));
const AddStaffMember = lazy(() => import('../admin/AddStaffMember'));
const StaffDocumentsView = lazy(() => import('../admin/StaffDocumentsView'));
const RecruiterDashboard = lazy(() => import('../recruiter/RecruiterDashboard'));
const HiringManagerDashboard = lazy(() => import('../manager/HiringManagerDashboard'));
const PostJob = lazy(() => import('../recruiter/PostJob'));
const ManageJobs = lazy(() => import('../recruiter/ManageJobs'));
const ApplicantsView = lazy(() => import('../recruiter/ApplicantsView'));
const CandidateSearchView = lazy(() => import('../recruiter/CandidateSearchView'));
const CompanyProfile = lazy(() => import('../recruiter/CompanyProfile'));
const SupportDeskView = lazy(() => import('../common/SupportDeskView'));
const ApplicationStatusView = lazy(() => import('../recruiter/ApplicationStatusView'));
const RecruiterDocumentsView = lazy(() => import('../recruiter/RecruiterDocumentsView'));
const NotificationModal = lazy(() => import('../../components/NotificationModal'));
const UnifiedRoleDashboard = lazy(() => import('../dashboard/UnifiedRoleDashboard'));

// Universal view loading fallback
function ViewLoadingFallback({ message = "Loading Uptrix Platform..." }) {
  return (
    <div className="min-h-[420px] flex flex-col items-center justify-center py-20 px-4 bg-[#F6F7FB]/50 rounded-2xl animate-in fade-in">
      <div className="flex flex-col items-center gap-3">
        <img
          src="/logo.svg"
          alt="Uptrix"
          width="130"
          height="30"
          className="h-7 w-auto object-contain select-none opacity-85"
        />
        <p className="text-[0.72rem] font-bold text-slate-500 uppercase tracking-widest animate-pulse m-0">
          {message}
        </p>
      </div>
    </div>
  );
}

// ── Brand tokens for Home View ────────────────────────────
const NAVY = '#132340';
const NAVY_SOFT = '#2C4470';
const INK = '#0F1B2E';
const GOLD = '#F2A93B';
const GOLD_DEEP = '#D98D1E';
const PAPER = '#F6F7FB';
const LINE = '#EAEDF3';

function useBrandFonts() {
  useEffect(() => {
    if (document.getElementById('uptrix-font-link')) return;
    const link = document.createElement('link');
    link.id = 'uptrix-font-link';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Lexend:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);
}

const DISPLAY_FONT = "'Lexend', 'Inter', system-ui, sans-serif";
const BODY_FONT = "'Inter', system-ui, sans-serif";

export default function FeedDashboard({
  activeTab = 'home',
  setActiveTab,
  selectedJobId = null,
  setSelectedJobId,
  onOpenSupport,
  onOpenNotifs,
  openCreatePostModal = false,
  onCloseCreatePostModal
}) {
  useBrandFonts();
  const { user, logout } = useAuth();
  const role = user?.role || 'CANDIDATE';
  const isAdmin = role === 'ADMIN';
  const isRecruiter = role === 'RECRUITER';
  const isHiringManager = role === 'HIRING_MANAGER';
  const isStaff = isAdmin || isRecruiter || isHiringManager;

  const normalizeTab = (tab) => {
    if (!tab || tab === 'feed' || tab === 'home') {
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
    if (tab === 'skill_advisory' || tab === 'career_analytics' || tab === 'skill-advisory') return 'skill_advisory';
    if (tab === 'my_posts' || tab === 'posts') return isStaff ? (isAdmin ? 'admin_dashboard' : isRecruiter ? 'recruiter_dashboard' : 'hiring_manager_dashboard') : 'home';
    if (tab === 'community_feed' || tab === 'community' || tab === 'community-feed') return isStaff ? (isAdmin ? 'admin_dashboard' : isRecruiter ? 'recruiter_dashboard' : 'hiring_manager_dashboard') : 'home';
    if (tab === 'interviews' || tab === 'my_interviews') return isStaff ? 'interviews' : 'my_interviews';
    if (tab === 'post_job') {
      if (isAdmin) return 'admin_dashboard';
      if (isHiringManager) return 'hiring_manager_dashboard';
      return 'post_job';
    }
    if (tab === 'search_candidates' || tab === 'candidate_search') return 'search_candidates';
    if (tab === 'application_status' || tab === 'status_pipeline') return 'application_status';
    if (tab === 'applicants_view' || tab === 'applicants') return 'applicants';
    if (tab === 'company_profile') return 'company_profile';
    if (tab === 'profile' || tab === 'candidate_profile') return 'profile';
    if (tab === 'documents' || tab === 'my_documents' || tab === 'recruiter_documents') {
      return isStaff ? 'documents' : 'profile';
    }
    if (tab === 'add_staff' || tab === 'add_staff_member') return 'add_staff';
    if (tab === 'staff_directory' || tab === 'directory') return 'staff_directory';
    if (tab === 'staff_documents' || tab === 'staff_document') return 'staff_documents';
    if (tab === 'messages' || tab === 'message' || tab === 'chat') return 'messages';
    if (tab === 'ai_scheduler') return 'ai_scheduler';
    if (tab === 'support' || tab === 'help' || tab === 'support_desk') return 'support';
    return tab;
  };

  // ── Top-level layout state (Responsive: Open on screens >1024px, closed on screens <=1024px) ──
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 1024;
    }
    return false;
  });
  const [activeSidebarItem, setActiveSidebarItem] = useState(() => normalizeTab(activeTab || (isStaff ? 'dashboard' : 'home')));
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showToast, setShowToast] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileDropdownRef = useRef(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const prevWidthRef = useRef(typeof window !== 'undefined' ? window.innerWidth : 1200);

  // Responsive sidebar handling on screen resize: closed if <=1024px, open if >1024px
  useEffect(() => {
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      const wasSmall = prevWidthRef.current <= 1024;
      const isSmall = currentWidth <= 1024;

      if (wasSmall !== isSmall) {
        setSidebarCollapsed(isSmall);
      }
      prevWidthRef.current = currentWidth;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (activeTab) {
      setActiveSidebarItem(normalizeTab(activeTab));
    }
  }, [activeTab]);

  const handleTabChange = (newTab) => {
    const normalized = normalizeTab(newTab);
    setActiveSidebarItem(normalized);
    if (setActiveTab) {
      setActiveTab(normalized);
    }
  };

  // ── Home View state (original feed dashboard) ───────────
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [isCreatingPost, setIsCreatingPost] = useState(openCreatePostModal);
  const [newPostText, setNewPostText] = useState('');
  const [selectedTag, setSelectedTag] = useState('#Hiring');
  const [mounted, setMounted] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  useEffect(() => {
    api.getNotifications()
      .then(list => {
        const unread = (list || []).filter(n => !n.is_read).length;
        setUnreadNotifsCount(unread);
      })
      .catch(() => { });
  }, []);

  useEffect(() => { if (openCreatePostModal) setIsCreatingPost(true); }, [openCreatePostModal]);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 40); return () => clearTimeout(t); }, []);

  const profile = user?.profile || {};
  const userName = isStaff
    ? (profile.full_name || profile.company_name || user?.email?.split('@')[0] || 'Member')
    : (profile.full_name || user?.email?.split('@')[0] || 'Member');
  const userTitle = isStaff
    ? (profile.title || profile.industry || (isAdmin ? 'Administrator' : (isRecruiter ? 'Recruiter' : 'Hiring Manager')))
    : (!profile.title || profile.title === 'Digital Marketing Professional' || profile.title === 'Digital Marketing Specialist' ? 'Candidate' : profile.title);
  const userLocation = profile.location || (profile.city ? `${profile.city}${profile.state ? ', ' + profile.state : ''}` : '');
  const firstName = userName.split(' ')[0];

  useEffect(() => {
    api.getJobs()
      .then(data => setJobs(data || []))
      .catch(() => { })
      .finally(() => setLoadingJobs(false));
  }, []);

  const profileFields = [profile.full_name, profile.title, profile.phone, profile.city, profile.summary, profile.resume_url, profile.avatar_url];
  const filledFields = profileFields.filter(Boolean).length;
  const profilePct = Math.round((filledFields / profileFields.length) * 100);

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newPostText.trim()) return;
    setNewPostText('');
    setIsCreatingPost(false);
    onCloseCreatePostModal?.();
    triggerToast('Post shared with the Uptrix community!');
  };

  const greet = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };

  const homeStats = [
    { icon: Eye, label: 'Profile views', value: 27, delta: '+9 this week', color: NAVY, tab: 'candidate_profile' },
    { icon: Send, label: 'Applied', value: 5, delta: '2 pending', color: '#0E9F6E', tab: 'my_applications' },
    { icon: Calendar, label: 'Interviews', value: 2, delta: '1 upcoming', color: GOLD_DEEP, tab: 'interviews' },
    { icon: Bookmark, label: 'Saved jobs', value: 8, delta: '1 closing soon', color: '#D14343', tab: 'saved_jobs' },
  ];

  const quickNav = [
    { icon: User, label: 'Edit profile', tab: 'candidate_profile', primary: true },
    { icon: TrendingUp, label: 'Monthly Analysis', tab: 'skill_advisory' },
  ];

  const activities = [
    { icon: TrendingUp, color: '#4F46E5', title: 'Monthly Analysis', sub: 'Discover in-demand recruiter skills and monthly funnel analysis', time: 'Active', tab: 'skill_advisory' },
    { icon: Target, color: '#0E9F6E', title: 'Smart job match enabled', sub: 'Explore matching openings across digital marketing & engineering', time: 'Just now', tab: 'job_search' },
    { icon: Eye, color: NAVY_SOFT, title: 'Profile visible to verified employers', sub: 'Hiring managers can discover your skill competencies', time: '5h ago', tab: 'candidate_profile' },
    { icon: CheckCircle2, color: '#0E9F6E', title: 'Application tracking active', sub: 'Track your submissions and scheduled interviews in real time', time: '1d ago', tab: 'my_applications' },
    { icon: Bell, color: '#D14343', title: 'Bookmark positions for later', sub: 'Save roles and apply whenever you are ready', time: '2d ago', tab: 'saved_jobs' },
    { icon: Sparkles, color: GOLD_DEEP, title: 'Profile completeness optimized', sub: 'Add portfolio items and documents to stand out', time: '3d ago', tab: 'candidate_profile' },
  ];

  const news = [
    { tag: 'Trending', title: 'Hiring confidence surges across India Inc as marketing roles lead demand', time: '5h', readers: '2,009' },
    { tag: 'AI', title: 'Meta launches personal AI for ad optimization workflows', time: '5h', readers: '3,730' },
    { tag: 'Salary', title: 'Performance marketing salaries climb 18% year over year in APAC', time: '1d', readers: '5,420' },
    { tag: 'Industry', title: 'Alternative ad channels start to outpace traditional search spend', time: '8h', readers: '823' },
  ];

  // ── Scheduler View state (VcruitAI 5-step wizard) ───────
  const [activeMainTab, setActiveMainTab] = useState('create');
  const [currentStep, setCurrentStep] = useState(1);
  const [interviewMode, setInterviewMode] = useState('Human');
  const [candidate, setCandidate] = useState('Not selected');
  const [personality, setPersonality] = useState('Technical Strict');
  const [interviewGoal, setInterviewGoal] = useState('Deep Skill Assessment');
  const [difficulty, setDifficulty] = useState('Medium');
  const [focus, setFocus] = useState('React');
  const [launchWindow, setLaunchWindow] = useState('May 4, 6:45 PM');
  const [questionBank, setQuestionBank] = useState('Frontend & React Core (45 Questions)');
  const [duration, setDuration] = useState('45 min');

  const [interviewList, setInterviewList] = useState([
    {
      id: 1,
      candidate: 'Kyadari Tarun',
      role: 'Senior React & Frontend Architect',
      mode: 'Human',
      personality: 'Technical Strict',
      goal: 'Deep Skill Assessment',
      focus: 'React',
      dateTime: 'May 4, 6:45 PM',
      duration: '45 min',
      status: 'Scheduled',
      meetUrl: 'https://meet.google.com/upt-vcruit-eval'
    },
    {
      id: 2,
      candidate: 'Priya Sharma',
      role: 'Full Stack Growth Engineer',
      mode: 'AI',
      personality: 'Analytical Balanced',
      goal: 'Fast AI Screening',
      focus: 'Node.js & Python',
      dateTime: 'May 5, 2:00 PM',
      duration: '30 min',
      status: 'Scheduled',
      meetUrl: 'https://meet.google.com/upt-vcruit-ai-priya'
    },
    {
      id: 3,
      candidate: 'Aditya Verma',
      role: 'Performance Marketing Specialist',
      mode: 'Hybrid',
      personality: 'Conversational',
      goal: 'Deep Skill Assessment',
      focus: 'Paid Ads & Analytics',
      dateTime: 'May 3, 11:30 AM',
      duration: '45 min',
      status: 'Completed',
      meetUrl: 'https://meet.google.com/upt-vcruit-aditya'
    }
  ]);

  const triggerToast = (msg) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3500);
  };

  const handleScheduleSubmit = () => {
    const newInterview = {
      id: Date.now(),
      candidate: candidate === 'Not selected' ? 'New Candidate' : candidate,
      role: `${focus} Specialist`,
      mode: interviewMode,
      personality,
      goal: interviewGoal,
      focus,
      dateTime: launchWindow,
      duration,
      status: 'Scheduled',
      meetUrl: 'https://meet.google.com/vcruit-live-' + Math.random().toString(36).substring(7)
    };
    setInterviewList([newInterview, ...interviewList]);
    triggerToast(`✨ Interview scheduled successfully for ${newInterview.candidate}!`);
    setActiveMainTab('list');
  };

  const copyMeetLink = (url) => {
    navigator.clipboard?.writeText(url);
    triggerToast('📋 Meeting link copied to clipboard!');
  };

  const candidateOptions = [
    { name: 'Kyadari Tarun', role: 'Full Stack React Engineer', email: 'tarun@uptrix.dev' },
    { name: 'Priya Sharma', role: 'Growth Specialist & Frontend', email: 'priya@example.com' },
    { name: 'Rahul Mehra', role: 'DevOps & Cloud Engineer', email: 'rahul.m@example.com' },
    { name: 'Ananya Roy', role: 'Digital Marketer & SEO Lead', email: 'ananya@growth.io' },
  ];

  // ── Role-tailored sidebar menu items (simple flat list) ──
  const candidateNavItems = [
    { id: 'home', label: 'Dashboard', icon: LayoutDashboard, tab: 'home' },
    { id: 'find_jobs', label: 'Find Jobs', icon: Search, tab: 'job_search' },
    { id: 'my_applications', label: 'My Applications', icon: Briefcase, tab: 'my_applications' },
    { id: 'saved_jobs', label: 'Saved Jobs', icon: Bookmark, tab: 'saved_jobs' },
    { id: 'my_interviews', label: 'Calendar / Interviews', icon: Calendar, tab: 'interviews' },
    { id: 'skill_advisory', label: 'Monthly Analysis', icon: TrendingUp, tab: 'skill_advisory' },
    { id: 'profile', label: 'Candidate Profile', icon: User, tab: 'profile' },
    { id: 'messages', label: 'Internal Messages', icon: MessageSquare, tab: 'messages' },
    { id: 'support', label: 'Support & Help', icon: HelpCircle, tab: 'support' }
  ];

  const recruiterNavItems = [
    { id: 'recruiter_dashboard', label: 'Dashboard', icon: LayoutDashboard, tab: 'recruiter_dashboard' },
    { id: 'post_job', label: 'Post New Job', icon: PlusCircle, tab: 'post_job' },
    { id: 'manage_jobs', label: 'Manage Jobs', icon: Briefcase, tab: 'manage_jobs' },
    { id: 'applicants', label: 'Applicants Pipeline', icon: Users, tab: 'applicants_view' },
    { id: 'search_candidates', label: 'Search Candidates', icon: Search, tab: 'search_candidates' },
    { id: 'application_status', label: 'Application Status', icon: CheckCircle2, tab: 'application_status' },
    { id: 'interviews', label: 'Candidate Interviews', icon: Calendar, tab: 'interviews' },
    { id: 'messages', label: 'Internal Messages', icon: MessageSquare, tab: 'messages' },
    { id: 'documents', label: 'Recruiter Documents', icon: Folder, tab: 'documents' },
    { id: 'company_profile', label: 'Company Profile', icon: Building2, tab: 'company_profile' },
    { id: 'support', label: 'Support & Help', icon: HelpCircle, tab: 'support' }
  ];

  const adminNavItems = [
    { id: 'admin_dashboard', label: 'Dashboard', icon: LayoutDashboard, tab: 'admin_dashboard' },
    { id: 'add_staff', label: 'Add Staff Member', icon: UserPlus, tab: 'add_staff' },
    { id: 'manage_jobs', label: 'Jobs Oversight', icon: Briefcase, tab: 'manage_jobs' },
    { id: 'applicants', label: 'Application Pipeline', icon: CheckCircle2, tab: 'applicants_view' },
    { id: 'interviews', label: 'Candidate Interviews', icon: Calendar, tab: 'interviews' },
    { id: 'messages', label: 'Internal Messages', icon: MessageSquare, tab: 'messages' },
    { id: 'staff_documents', label: 'Staff Documents', icon: Folder, tab: 'staff_documents' },
    { id: 'company_profile', label: 'Company Profile', icon: Building2, tab: 'company_profile' },
    { id: 'support', label: 'Support & Help', icon: HelpCircle, tab: 'support' }
  ];

  const managerNavItems = [
    { id: 'hiring_manager_dashboard', label: 'Dashboard', icon: LayoutDashboard, tab: 'hiring_manager_dashboard' },
    { id: 'manage_jobs', label: 'Active Requisitions', icon: Briefcase, tab: 'manage_jobs' },
    { id: 'applicants', label: 'Review Candidates', icon: Users, tab: 'applicants_view' },
    { id: 'interviews', label: 'Scheduled Interviews', icon: Calendar, tab: 'interviews' },
    { id: 'messages', label: 'Internal Messages', icon: MessageSquare, tab: 'messages' },
    { id: 'company_profile', label: 'My Profile', icon: User, tab: 'company_profile' },
    { id: 'support', label: 'Support & Help', icon: HelpCircle, tab: 'support' }
  ];

  const currentRoleNavItems = isAdmin
    ? adminNavItems
    : isRecruiter
      ? recruiterNavItems
      : isHiringManager
        ? managerNavItems
        : candidateNavItems;

  const getPageTitle = (tab) => {
    switch (tab) {
      case 'home':
      case 'recruiter_dashboard':
      case 'admin_dashboard':
      case 'hiring_manager_dashboard':
        return 'Dashboard';
      case 'find_jobs':
      case 'job_search':
        return 'Find Jobs';
      case 'my_applications':
        return 'My Applications';
      case 'saved_jobs':
        return 'Saved Jobs';
      case 'skill_advisory':
        return 'Monthly Analysis';
      case 'interviews':
      case 'my_interviews':
        return 'Interviews';
      case 'messages':
        return 'Internal Messages';
      case 'profile':
      case 'candidate_profile':
        return 'Candidate Profile';
      case 'post_job':
        return 'Post a New Job';
      case 'manage_jobs':
        return 'Manage Jobs';
      case 'search_candidates':
        return 'Search Candidates';
      case 'applicants':
      case 'applicants_view':
        return 'Applicants Pipeline';
      case 'application_status':
        return 'Application Status';
      case 'company_profile':
        return 'Company Profile';
      case 'add_staff':
        return 'Add Staff Member';
      case 'staff_documents':
      case 'documents':
      case 'recruiter_documents':
        return 'Document Vault';
      case 'support':
        return 'Support Desk';
      default:
        return 'Dashboard';
    }
  };

  const handleNavClick = (item) => {
    if (item.id === 'create_post') {
      setIsCreatingPost(true);
      return;
    }
    if (item.action) {
      item.action();
      return;
    }
    const target = item.tab || item.id;
    if (item.id === 'applicants' || target === 'applicants' || target === 'applicants_view') {
      setSelectedJobId?.(null);
    }
    handleTabChange(target);
    if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
      setSidebarCollapsed(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FD] text-slate-800 flex font-sans select-none antialiased" style={{ fontFamily: BODY_FONT }}>

      <style>{`
        @keyframes uptrixRise { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform: translateY(0); } }
        .ux-rise { animation: uptrixRise .5s cubic-bezier(.16,1,.3,1) both; }
        .ux-tabular { font-variant-numeric: tabular-nums; }
      `}</style>

      {/* Toast Alert */}
      {showToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-5 py-3 rounded-xl bg-slate-900 text-white shadow-2xl border border-indigo-500/40 text-xs font-medium animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-[#5C59E8]" />
          {showToast}
        </div>
      )}

      {/* Mobile Drawer Overlay Backdrop */}
      {!sidebarCollapsed && (
        <div
          onClick={() => setSidebarCollapsed(true)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 min-[1025px]:hidden transition-opacity"
        />
      )}

      {/* ========================================================================= */}
      {/* LEFT SIDEBAR - SERVER 360 / UPTRIX 360 MODERN LAYOUT                      */}
      {/* ========================================================================= */}
      <aside
        className={`${sidebarCollapsed ? 'w-20' : 'w-64'
          } min-h-screen h-screen sticky top-0 bg-white border-r border-slate-200/80 shrink-0 flex flex-col justify-between transition-all duration-300 z-40 ${sidebarCollapsed ? 'max-[1024px]:-translate-x-full' : 'max-[1024px]:fixed max-[1024px]:left-0 max-[1024px]:top-0 shadow-2xl min-[1025px]:shadow-none'
          }`}
      >
        {/* Top: Brand Header */}
        <div className={`h-20 border-b border-slate-100 shrink-0 flex items-center ${sidebarCollapsed ? 'flex-col justify-center gap-1.5 px-2' : 'justify-between px-5'}`}>
          <div
            onClick={() => {
              if (sidebarCollapsed) {
                setSidebarCollapsed(false);
              } else {
                handleTabChange('home');
              }
            }}
            className="flex items-center cursor-pointer select-none"
            title="Uptrix"
          >
            <img
              src="/logo.svg"
              alt="Uptrix Logo"
              className={`${sidebarCollapsed ? 'h-6 max-w-[46px]' : 'h-8 sm:h-9 max-w-[145px]'} object-contain hover:opacity-90 transition-all`}
            />
          </div>

          {/* Collapse/Expand Chevron Button */}
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-7 h-7 rounded-lg bg-[#F4F3FF] hover:bg-[#EBE9FE] text-[#5C59E8] flex items-center justify-center cursor-pointer transition-colors border-none"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Middle: Navigation Scroll Container (Simple flat list, no dropdowns) */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-4 px-3 space-y-1.5">
          {currentRoleNavItems.map((item) => {
            const isActive =
              activeSidebarItem === item.id ||
              (item.tab && activeSidebarItem === item.tab) ||
              (item.id === 'recruiter_dashboard' && (activeSidebarItem === 'recruiter_dashboard' || activeSidebarItem === 'dashboard' || activeSidebarItem === 'home')) ||
              (item.id === 'admin_dashboard' && (activeSidebarItem === 'admin_dashboard' || activeSidebarItem === 'dashboard' || activeSidebarItem === 'home')) ||
              (item.id === 'hiring_manager_dashboard' && (activeSidebarItem === 'hiring_manager_dashboard' || activeSidebarItem === 'dashboard' || activeSidebarItem === 'home')) ||
              (item.id === 'home' && (activeSidebarItem === 'home' || activeSidebarItem === 'dashboard')) ||
              (item.id === 'profile' && (activeSidebarItem === 'profile' || activeSidebarItem === 'candidate_profile')) ||
              (item.id === 'applicants' && (activeSidebarItem === 'applicants' || activeSidebarItem === 'applicants_view'));

            return (
              <div key={item.id} className="relative group">
                <button
                  type="button"
                  onClick={() => handleNavClick(item)}
                  className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center h-11 px-0' : 'justify-start gap-3 px-3.5 py-2.5'
                    } rounded-xl text-xs font-semibold transition-all border-none cursor-pointer ${isActive
                      ? 'text-[#5C59E8] font-bold bg-[#F4F3FF]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-[#F8F9FD]'
                    }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <item.icon
                    className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#5C59E8]' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                  />
                  {!sidebarCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </button>

                {/* Active vertical right indicator bar */}
                {isActive && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-l-full bg-[#5C59E8]" />
                )}

                {/* Collapsed Tooltip Flyout */}
                {sidebarCollapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 z-50 flex items-center select-none">
                    <span>{item.label}</span>
                    <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-0 h-0 border-y-4 border-y-transparent border-r-4 border-r-slate-900" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom: User Profile & Notifications Section (In Sidebar Only) */}
        <div className="p-3 border-t border-slate-100 bg-white shrink-0 relative" ref={profileDropdownRef}>
          {sidebarCollapsed ? (
            <div className="flex flex-col items-center gap-2.5 py-1">
              {/* Collapsed Notifications Bell */}
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => setShowNotifDropdown(true)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-[#5C59E8] hover:bg-[#F4F3FF] transition-colors relative border-none bg-transparent cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifsCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
                  )}
                </button>
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 z-50 flex items-center select-none">
                  <span>Notifications {unreadNotifsCount > 0 ? `(${unreadNotifsCount})` : ''}</span>
                  <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-0 h-0 border-y-4 border-y-transparent border-r-4 border-r-slate-900" />
                </div>
              </div>

              {/* Collapsed User Avatar */}
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FF7043] to-[#FF8A65] p-0.5 shadow-sm hover:ring-2 hover:ring-[#FF7043]/30 transition-all border-none cursor-pointer flex items-center justify-center"
                  title={userName}
                >
                  <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-xs bg-[#FF7043]">
                    {user?.profile?.avatar_url ? (
                      <img src={user.profile.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      firstName.charAt(0).toUpperCase()
                    )}
                  </div>
                </button>
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 z-50 flex flex-col select-none">
                  <span>{userName}</span>
                  <span className="text-[10px] text-slate-400 font-normal">{userTitle || role}</span>
                  <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-0 h-0 border-y-4 border-y-transparent border-r-4 border-r-slate-900" />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-slate-50/80 transition-colors">
              {/* User Profile Info - Clicking opens profile menu */}
              <div
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer select-none"
                title="View account options"
              >
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#FF7043] to-[#FF8A65] flex items-center justify-center text-white font-bold text-sm shadow-xs">
                    {user?.profile?.avatar_url ? (
                      <img src={user.profile.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      firstName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 truncate">{userName}</div>
                  <div className="text-[11px] text-slate-400 truncate">{userTitle || role}</div>
                </div>
              </div>

              {/* Notification Bell Icon */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowNotifDropdown(true)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-[#5C59E8] hover:bg-[#F4F3FF] transition-colors relative border-none bg-transparent cursor-pointer shrink-0"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifsCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Profile Dropdown Menu */}
          {showProfileDropdown && (
            <div className={`absolute ${sidebarCollapsed ? 'left-full bottom-0 ml-3 w-64' : 'left-3 right-3 bottom-full mb-2'} bg-white rounded-2xl shadow-2xl border border-slate-100 p-2.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150`}>
              <div className="flex items-center gap-3 p-2 border-b border-slate-100 mb-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#FF7043] to-[#FF8A65] flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {user?.profile?.avatar_url ? (
                    <img src={user.profile.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    firstName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 truncate">{userName}</div>
                  <div className="text-[10px] text-slate-400 truncate">{user?.email}</div>
                  <span className="inline-block mt-0.5 px-2 py-0.2 rounded-full text-[9px] font-extrabold bg-[#F4F3FF] text-[#5C59E8]">
                    {role}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowProfileDropdown(false);
                  handleTabChange(isStaff ? 'company_profile' : 'profile');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-[#5C59E8] hover:bg-[#F4F3FF] transition-colors border-none bg-transparent cursor-pointer text-left"
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>My Profile</span>
              </button>

              <button
                onClick={() => {
                  setShowProfileDropdown(false);
                  handleTabChange('support');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-[#5C59E8] hover:bg-[#F4F3FF] transition-colors border-none bg-transparent cursor-pointer text-left"
              >
                <HelpCircle className="w-4 h-4 text-slate-400" />
                <span>Help &amp; Support</span>
              </button>

              <div className="my-1 border-t border-slate-100" />

              <button
                onClick={() => {
                  setShowProfileDropdown(false);
                  if (window.confirm('Are you sure you want to log out?')) {
                    logout();
                  }
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors border-none bg-transparent cursor-pointer text-left"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Hamburger Menu button (visible on <=1024px when sidebar is collapsed) */}
      {sidebarCollapsed && (
        <button
          type="button"
          onClick={() => setSidebarCollapsed(false)}
          className="min-[1025px]:hidden fixed top-3 left-3 z-30 p-2.5 rounded-xl bg-white shadow-md border border-slate-200 text-slate-700 hover:text-black hover:bg-slate-50 flex items-center justify-center cursor-pointer transition-colors"
          title="Open menu"
        >
          <Menu className="w-5 h-5 text-slate-700" />
        </button>
      )}

      {/* Notifications Modal */}
      {showNotifDropdown && (
        <Suspense fallback={null}>
          <NotificationModal
            onClose={() => setShowNotifDropdown(false)}
            isDropdown={false}
            onUpdateUnreadCount={setUnreadNotifsCount}
          />
        </Suspense>
      )}

      {/* ========================================================================= */}
      {/* RIGHT MAIN CONTENT AREA: MAIN WORKSPACE                                   */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#F8F9FD]">

        {/* ── DYNAMIC MAIN WORKSPACE CONTENT ── */}
        <main className="flex-1 overflow-y-auto bg-[#F8F9FD]">

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* UNIFIED ROLE-BASED DASHBOARD (CANDIDATE, RECRUITER, ADMIN, MANAGER)     */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {(activeSidebarItem === 'home' ||
            activeSidebarItem === 'dashboard' ||
            activeSidebarItem === 'recruiter_dashboard' ||
            activeSidebarItem === 'admin_dashboard' ||
            activeSidebarItem === 'hiring_manager_dashboard') && (
              <div className="min-h-full bg-[#F8F9FD]">
                <Suspense fallback={<ViewLoadingFallback message="Loading Uptrix Dashboard..." />}>
                  <UnifiedRoleDashboard
                    role={role}
                    user={user}
                    onNavigateTab={handleTabChange}
                  />
                </Suspense>
              </div>
            )}

          {false && (
            <div className="min-h-full" style={{ background: PAPER }}>

              {/* ─── HERO ─── */}
              <div style={{
                background: `radial-gradient(120% 140% at 12% 0%, ${NAVY_SOFT} 0%, ${NAVY} 46%, ${INK} 100%)`,
                position: 'relative', overflow: 'hidden'
              }}>
                <svg className="absolute inset-0 w-full h-full opacity-[0.07]" preserveAspectRatio="none" aria-hidden="true">
                  <defs>
                    <pattern id="ux-grid" width="46" height="46" patternUnits="userSpaceOnUse">
                      <path d="M46 0H0V46" fill="none" stroke="#FFFFFF" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#ux-grid)" />
                </svg>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                  <div className="pt-8 sm:pt-10 pb-7 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">

                    <div className={`flex items-center gap-4 sm:gap-5 ${mounted ? 'ux-rise' : 'opacity-0'}`}>
                      <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl overflow-hidden shrink-0 shadow-lg ring-2 ring-amber-400/50"
                        style={{
                          fontFamily: DISPLAY_FONT,
                          background: 'linear-gradient(135deg, rgba(242,169,59,0.22), rgba(242,169,59,0.06))',
                          border: '2px solid rgba(242,169,59,0.45)',
                        }}
                      >
                        {user?.profile?.avatar_url ? (
                          <img src={user.profile.avatar_url} alt={userName} loading="lazy" decoding="async" className="w-full h-full object-cover rounded-full" />
                        ) : firstName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[0.7rem] font-semibold tracking-wide text-amber-300/70 mb-1">{greet()}</p>
                        <h1 className="text-[1.6rem] sm:text-[1.9rem] font-bold text-white leading-tight" style={{ fontFamily: DISPLAY_FONT }}>
                          {firstName}
                        </h1>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-xs text-white/55 flex items-center gap-1.5">
                            <ShieldCheck size={13} className="text-amber-300/80" /> {userTitle}
                          </span>
                          {userLocation && (
                            <>
                              <span className="text-white/20">·</span>
                              <span className="text-xs text-white/45 flex items-center gap-1"><MapPin size={11} /> {userLocation}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={`flex items-center gap-2 flex-wrap lg:justify-end ${mounted ? 'ux-rise' : 'opacity-0'}`} style={{ animationDelay: '60ms' }}>
                      {quickNav.map((item, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleTabChange(item.tab)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[0.8rem] font-semibold transition-all border-none cursor-pointer whitespace-nowrap"
                          style={item.primary
                            ? { background: GOLD, color: INK }
                            : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.82)', border: '1px solid rgba(255,255,255,0.12)' }
                          }
                          onMouseEnter={e => { e.currentTarget.style.filter = item.primary ? 'brightness(1.08)' : 'none'; if (!item.primary) e.currentTarget.style.background = 'rgba(255,255,255,0.11)'; }}
                          onMouseLeave={e => { e.currentTarget.style.filter = 'none'; if (!item.primary) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                        >
                          <item.icon size={14} /> {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ─── STATS STRIP ─── */}
                  <div className="-mb-8 relative z-10">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                      {homeStats.map((s, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleTabChange(s.tab)}
                          className={`bg-white rounded-2xl px-5 py-4 text-left cursor-pointer border-none transition-all hover:-translate-y-0.5 group ${mounted ? 'ux-rise' : 'opacity-0'}`}
                          style={{ boxShadow: '0 10px 30px -12px rgba(15,27,46,0.25)', borderTop: `3px solid ${s.color}`, animationDelay: `${100 + i * 40}ms` }}
                        >
                          <div className="flex items-start justify-between">
                            <s.icon size={16} style={{ color: s.color }} strokeWidth={2.25} />
                            <ArrowUpRight size={13} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                          </div>
                          <div className="text-[1.6rem] font-bold leading-none mt-3 ux-tabular" style={{ color: INK, fontFamily: DISPLAY_FONT }}>{s.value}</div>
                          <div className="text-[0.78rem] text-slate-500 font-medium mt-1.5">{s.label}</div>
                          <div className="text-[0.68rem] text-slate-400 mt-1">{s.delta}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── MAIN FEED GRID ─── */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-12">

                {profilePct < 100 && (
                  <div
                    className="mb-6 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    style={{ background: '#FFFBF3', border: `1px solid ${GOLD}33` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${GOLD}22` }}>
                        <Zap size={17} style={{ color: GOLD_DEEP }} />
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: INK, fontFamily: DISPLAY_FONT }}>Your profile is {profilePct}% complete</p>
                        <p className="text-xs text-slate-500 mt-0.5">A complete profile gets noticed by more recruiters</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-1.5 rounded-full overflow-hidden" style={{ background: '#EFE3C9' }}>
                        <div className="h-full rounded-full" style={{ width: `${profilePct}%`, background: `linear-gradient(90deg, ${GOLD_DEEP}, ${GOLD})` }} />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTabChange('profile')}
                        className="px-4 py-2 rounded-lg text-xs font-bold text-white border-none cursor-pointer transition-all hover:brightness-110 whitespace-nowrap"
                        style={{ background: NAVY }}
                      >
                        Complete profile
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                  {/* Left Column: Listings & Activity */}
                  <div className="lg:col-span-3 space-y-6">

                    {/* Active / Recommended Roles */}
                    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: `1px solid ${LINE}` }}>
                      <div className="px-5 sm:px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${LINE}` }}>
                        <h2 className="text-[0.95rem] font-bold flex items-center gap-2.5" style={{ color: INK, fontFamily: DISPLAY_FONT }}>
                          <Briefcase size={16} style={{ color: NAVY_SOFT }} />
                          Recommended for you
                        </h2>
                        <button
                          type="button"
                          onClick={() => handleTabChange('find_jobs')}
                          className="text-xs font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors border-none bg-transparent cursor-pointer"
                          style={{ color: NAVY }}
                        >
                          See all <ChevronRight size={13} />
                        </button>
                      </div>

                      {loadingJobs ? (
                        <div className="p-10 text-center">
                          <div className="w-6 h-6 border-2 rounded-full animate-spin mx-auto mb-2" style={{ borderColor: LINE, borderTopColor: NAVY_SOFT }} />
                          <p className="text-xs text-slate-400">Loading roles…</p>
                        </div>
                      ) : jobs.length === 0 ? (
                        <div className="p-10 text-center">
                          <Briefcase size={30} className="text-slate-300 mx-auto mb-3" />
                          <p className="text-sm font-semibold text-slate-600">No open roles yet</p>
                          <p className="text-xs text-slate-400 mt-1">New matches will appear here as they come in</p>
                          <button type="button" onClick={() => handleTabChange('find_jobs')} className="mt-4 px-5 py-2 rounded-xl text-xs font-bold text-white border-none cursor-pointer" style={{ background: NAVY }}>
                            Browse jobs
                          </button>
                        </div>
                      ) : (
                        <div>
                          {jobs.slice(0, 5).map((j, idx) => {
                            const matchPct = [95, 91, 88, 84, 80][idx] || 78;
                            const accent = [NAVY_SOFT, '#0E9F6E', GOLD_DEEP, '#D14343', '#7C5CBF'][idx % 5];
                            return (
                              <div
                                key={j.id}
                                className="px-5 sm:px-6 py-4 flex items-center gap-4 hover:bg-slate-50/70 transition-colors cursor-pointer group"
                                style={{ borderBottom: idx < Math.min(jobs.length, 5) - 1 ? `1px solid ${LINE}` : 'none' }}
                                onClick={() => { setSelectedJobId?.(j.id); handleTabChange('find_jobs'); }}
                              >
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${accent}14` }}>
                                  <Building2 size={17} style={{ color: accent }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-bold text-slate-800 group-hover:text-[#132340] transition-colors line-clamp-1">{j.title}</h4>
                                  <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 flex-wrap">
                                    <span className="font-medium">{j.company?.company_name || 'Uptrix Partner'}</span>
                                    <span className="text-slate-300">·</span>
                                    <span className="flex items-center gap-0.5 text-slate-400"><MapPin size={10} /> {j.location}</span>
                                    {j.work_mode && (
                                      <>
                                        <span className="text-slate-300">·</span>
                                        <span className="px-1.5 py-0.5 rounded text-[0.65rem] font-medium" style={{ background: LINE, color: '#5B6472' }}>{j.work_mode}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="shrink-0 text-right hidden sm:flex flex-col items-end">
                                  <div className="text-xs font-extrabold ux-tabular" style={{ color: matchPct >= 90 ? '#0E9F6E' : GOLD_DEEP }}>{matchPct}%</div>
                                  <div className="text-[0.6rem] text-slate-400">match</div>
                                </div>
                                <ChevronRight size={16} className="text-slate-300 shrink-0" />
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {jobs.length > 5 && (
                        <div className="px-5 sm:px-6 py-3 text-center" style={{ borderTop: `1px solid ${LINE}` }}>
                          <button type="button" onClick={() => handleTabChange('find_jobs')} className="text-xs font-bold border-none bg-transparent cursor-pointer" style={{ color: NAVY }}>
                            View all {jobs.length} roles
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Recent Activity Timeline */}
                    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: `1px solid ${LINE}` }}>
                      <div className="px-5 sm:px-6 py-4" style={{ borderBottom: `1px solid ${LINE}` }}>
                        <h2 className="text-[0.95rem] font-bold flex items-center gap-2.5" style={{ color: INK, fontFamily: DISPLAY_FONT }}>
                          <Activity size={16} style={{ color: '#0E9F6E' }} />
                          Recent activity
                        </h2>
                      </div>
                      <div className="px-5 sm:px-6 py-2">
                        {activities.map((a, i) => (
                          <div
                            key={i}
                            className="relative flex items-start gap-3.5 py-3.5 cursor-pointer group"
                            onClick={() => a.tab && handleTabChange(a.tab)}
                          >
                            {i < activities.length - 1 && (
                              <span className="absolute left-[17px] top-[38px] bottom-0 w-px" style={{ background: LINE }} />
                            )}
                            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-white relative z-10" style={{ border: `1.5px solid ${a.color}55` }}>
                              <a.icon size={14} style={{ color: a.color }} />
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                              <p className="text-sm font-semibold text-slate-800 leading-snug group-hover:text-slate-900">{a.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{a.sub}</p>
                              <p className="text-[0.68rem] text-slate-400 mt-1.5 flex items-center gap-1"><Clock size={10} /> {a.time}</p>
                            </div>
                            <ChevronRight size={14} className="text-slate-300 mt-1 shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Industry Pulse & Tips */}
                  <div className="lg:col-span-2 space-y-6">

                    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: `1px solid ${LINE}` }}>
                      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${LINE}` }}>
                        <h2 className="text-[0.95rem] font-bold flex items-center gap-2.5" style={{ color: INK, fontFamily: DISPLAY_FONT }}>
                          <TrendingUp size={16} style={{ color: GOLD_DEEP }} />
                          Industry pulse
                        </h2>
                        <span className="text-[0.6rem] font-bold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: '#0E9F6E14', color: '#0E9F6E' }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#0E9F6E' }} /> Live
                        </span>
                      </div>
                      <div>
                        {news.map((n, i) => (
                          <div key={i} className="px-5 py-3.5 hover:bg-slate-50/70 transition-colors cursor-pointer group" style={{ borderBottom: i < news.length - 1 ? `1px solid ${LINE}` : 'none' }}>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-[0.62rem] font-bold px-1.5 py-0.5 rounded" style={{ background: `${GOLD}1F`, color: GOLD_DEEP }}>{n.tag}</span>
                              <span className="text-[0.62rem] text-slate-400">{n.time}</span>
                            </div>
                            <p className="text-[0.82rem] font-semibold text-slate-700 group-hover:text-slate-900 leading-snug transition-colors">{n.title}</p>
                            <p className="text-[0.65rem] text-slate-400 mt-1.5 flex items-center gap-1"><Eye size={10} /> {n.readers} readers</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5" style={{ border: `1px solid ${LINE}` }}>
                      <h2 className="text-[0.95rem] font-bold flex items-center gap-2.5 mb-4" style={{ color: INK, fontFamily: DISPLAY_FONT }}>
                        <Rocket size={16} style={{ color: '#7C5CBF' }} />
                        Get noticed faster
                      </h2>
                      <div className="space-y-3">
                        {[
                          'Add campaign results with real numbers to boost visibility.',
                          'Profiles with a professional photo get far more recruiter views.',
                          'Keep your skills updated with the channels you work in today.',
                          'Set job alerts and apply early — first movers get more callbacks.',
                        ].map((tip, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <CheckCircle2 size={14} className="shrink-0 mt-0.5" style={{ color: '#7C5CBF' }} />
                            <p className="text-xs text-slate-600 leading-relaxed">{tip}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="text-center text-[0.68rem] text-slate-400 space-x-2 pt-2">
                      <span>About</span><span>·</span><span>Help</span><span>·</span><span>Privacy</span><span>·</span><span>Terms</span>
                      <div className="mt-1.5 font-medium">Uptrix Corporation © 2026</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* SUB-VIEWS (DYNAMICALLY LOADED VIA REACT.LAZY + SUSPENSE)            */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <Suspense fallback={<ViewLoadingFallback />}>
            {/* 2. FIND JOBS VIEW                                                   */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {activeSidebarItem === 'find_jobs' && (
              <div className="min-h-full">
                <JobSearch setActiveTab={handleTabChange} setSelectedJobId={setSelectedJobId} />
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* 3. MY APPLICATIONS VIEW                                             */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {activeSidebarItem === 'my_applications' && (
              <div className="min-h-full">
                <MyApplications setActiveTab={handleTabChange} setSelectedJobId={setSelectedJobId} />
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* 4. SAVED JOBS VIEW                                                  */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {activeSidebarItem === 'saved_jobs' && (
              <div className="min-h-full">
                <SavedJobs setActiveTab={handleTabChange} setSelectedJobId={setSelectedJobId} />
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* 4B. MONTHLY ANALYSIS VIEW                                         */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {activeSidebarItem === 'skill_advisory' && (
              <div className="pt-1 pb-6 min-h-full">
                <CandidateSkillAdvisoryView
                  setActiveTab={handleTabChange}
                  onNavigateTab={handleTabChange}
                  setSelectedJobId={setSelectedJobId}
                />
              </div>
            )}


            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* 5. INTERVIEWS VIEW (CANDIDATE & RECRUITER)                          */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {(activeSidebarItem === 'my_interviews' || activeSidebarItem === 'interviews') && (
              <div className="min-h-full">
                <InterviewsView setActiveTab={handleTabChange} />
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* 6. CANDIDATE PROFILE VIEW                                           */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {(activeSidebarItem === 'profile' || activeSidebarItem === 'candidate_profile') && (
              <div className="min-h-full">
                <CandidateProfile onNavigateTab={handleTabChange} />
              </div>
            )}


            {/* 7A-2. ADD STAFF MEMBER & STAFF DIRECTORY IN-PAGE VIEW */}
            {(activeSidebarItem === 'add_staff' || activeSidebarItem === 'staff_directory') && (
              <div className="min-h-full">
                <AddStaffMember
                  setActiveTab={handleTabChange}
                  initialView={activeSidebarItem === 'staff_directory' ? 'directory' : 'form'}
                />
              </div>
            )}

            {/* 7A-3. STAFF KYC & COMPLIANCE DOCUMENTS VIEW */}
            {activeSidebarItem === 'staff_documents' && (
              <div className="min-h-full">
                <StaffDocumentsView setActiveTab={handleTabChange} />
              </div>
            )}


            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* 8. POST JOB VIEW                                                    */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {activeSidebarItem === 'post_job' && (
              <div className="min-h-full">
                <PostJob setActiveTab={handleTabChange} />
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* 9. MANAGE JOBS VIEW                                                 */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {activeSidebarItem === 'manage_jobs' && (
              <div className="min-h-full">
                <ManageJobs setActiveTab={handleTabChange} setSelectedJobId={setSelectedJobId} role={user?.role} />
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* 9B. SEARCH CANDIDATES VIEW (RECRUITER ONLY)                         */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {activeSidebarItem === 'search_candidates' && (
              <div className="min-h-full">
                <CandidateSearchView setActiveTab={handleTabChange} />
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* 10. APPLICANTS VIEW                                                 */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {(activeSidebarItem === 'applicants' || activeSidebarItem === 'applicants_view') && (
              <div className="min-h-full">
                <ApplicantsView jobId={selectedJobId} setActiveTab={handleTabChange} setSelectedJobId={setSelectedJobId} role={user?.role} />
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* 10B. RECRUITER APPLICATION STATUS PIPELINE VIEW                      */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {activeSidebarItem === 'application_status' && (
              <div className="min-h-full">
                <ApplicationStatusView setActiveTab={handleTabChange} />
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* 11. COMPANY PROFILE VIEW                                            */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {activeSidebarItem === 'company_profile' && (
              <div className="min-h-full">
                <CompanyProfile />
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* 11B. MESSAGES VIEW                                                  */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {activeSidebarItem === 'messages' && (
              <div className="min-h-full">
                <MessagesView />
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* 11C. UPTRIX SUPPORT & CONCIERGE DESK (IN-PAGE VIEW)                 */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {activeSidebarItem === 'support' && (
              <div className="min-h-full">
                <SupportDeskView setActiveTab={handleTabChange} />
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* 11D. RECRUITER & ORGANIZATION DOCUMENTS VAULT                        */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {(activeSidebarItem === 'documents' || activeSidebarItem === 'recruiter_documents') && (
              <div className="min-h-full">
                <RecruiterDocumentsView setActiveTab={handleTabChange} />
              </div>
            )}
          </Suspense>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 12. VCRUITAI SCHEDULER WIZARD + REVIEW SUMMARY                      */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {activeSidebarItem === 'ai_scheduler' && (
            <div className="px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full">

              {/* Sub Navigation Tabs: + CREATE NEW vs INTERVIEW LIST */}
              <div className="flex items-center gap-8 border-b border-slate-200 mb-6">
                <button
                  type="button"
                  onClick={() => setActiveMainTab('create')}
                  className={`pb-3.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 bg-transparent cursor-pointer ${activeMainTab === 'create'
                    ? 'border-[#00a884] text-[#00a884]'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                    }`}
                >
                  <Plus className="w-4 h-4" />
                  CREATE NEW
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMainTab('list')}
                  className={`pb-3.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 bg-transparent cursor-pointer ${activeMainTab === 'list'
                    ? 'border-[#00a884] text-[#00a884]'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                    }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  INTERVIEW LIST
                  <span className="px-1.5 py-0.5 rounded-full text-[0.62rem] font-extrabold bg-slate-100 text-slate-600">
                    {interviewList.length}
                  </span>
                </button>
              </div>

              {activeMainTab === 'create' ? (
                <div>
                  {/* Stepper Progress Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-2xl">
                      {[1, 2, 3, 4, 5].map((s) => {
                        const isPassed = s < currentStep;
                        const isCurrent = s === currentStep;
                        return (
                          <React.Fragment key={s}>
                            <button
                              type="button"
                              onClick={() => setCurrentStep(s)}
                              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all cursor-pointer border-none ${isCurrent
                                ? 'bg-[#00a884] text-white shadow-md shadow-teal-500/20 ring-4 ring-teal-500/10'
                                : isPassed
                                  ? 'bg-[#00a884] text-white'
                                  : 'bg-white border border-slate-300 text-slate-400 hover:border-slate-400'
                                }`}
                            >
                              {isPassed ? <Check className="w-3.5 h-3.5" /> : s}
                            </button>
                            {s < 5 && (
                              <div className={`flex-1 h-[2px] rounded transition-all ${s < currentStep ? 'bg-[#00a884]' : 'bg-slate-200'
                                }`} />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider block">
                        STEP {currentStep} OF 5
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {currentStep === 1 && 'Interview Mode'}
                        {currentStep === 2 && 'Candidate & Role'}
                        {currentStep === 3 && 'Question Bank & Calibration'}
                        {currentStep === 4 && 'Launch Window'}
                        {currentStep === 5 && 'Review & Confirmation'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Left Step Content */}
                    <div className="lg:col-span-8 space-y-6">
                      {currentStep === 1 && (
                        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-teal-50 text-[#00a884] border border-teal-200/60">
                              <Laptop className="w-4 h-4" />
                            </div>
                            <h2 className="text-base font-bold text-slate-900">Interview Mode</h2>
                          </div>

                          <div className="space-y-4">
                            <div
                              onClick={() => setInterviewMode('AI')}
                              className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${interviewMode === 'AI' ? 'border-2 border-[#00a884] bg-teal-50/20 shadow-xs' : 'border-slate-200 hover:border-slate-300 bg-white'
                                }`}
                            >
                              <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 text-slate-600 shrink-0">
                                  <Brain className="w-5 h-5 text-indigo-500" />
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-slate-900">AI</div>
                                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                    Agent-led interview. No bank means fully AI-generated; selected bank means 40% bank and 60% resume/JD context.
                                  </p>
                                </div>
                              </div>
                              {interviewMode === 'AI' && <CheckCircle2 className="w-5 h-5 text-[#00a884] shrink-0" />}
                            </div>

                            <div
                              onClick={() => setInterviewMode('Human')}
                              className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${interviewMode === 'Human' ? 'border-2 border-[#00a884] bg-teal-50/20 shadow-xs' : 'border-slate-200 hover:border-slate-300 bg-white'
                                }`}
                            >
                              <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-teal-500 text-white shrink-0 shadow-xs">
                                  <User className="w-5 h-5" />
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-slate-900">Human</div>
                                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                    Question bank required. Human leads while AI shows next questions, answer matching, and suggestions.
                                  </p>
                                </div>
                              </div>
                              {interviewMode === 'Human' && <CheckCircle2 className="w-5 h-5 text-[#00a884] shrink-0" />}
                            </div>

                            <div
                              onClick={() => setInterviewMode('Hybrid')}
                              className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${interviewMode === 'Hybrid' ? 'border-2 border-[#00a884] bg-teal-50/20 shadow-xs' : 'border-slate-200 hover:border-slate-300 bg-white'
                                }`}
                            >
                              <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 text-slate-600 shrink-0">
                                  <Users className="w-5 h-5 text-amber-500" />
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-slate-900">Hybrid</div>
                                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                    Question bank plus approved AI follow-ups from resume, JD, technology and interview flow.
                                  </p>
                                </div>
                              </div>
                              {interviewMode === 'Hybrid' && <CheckCircle2 className="w-5 h-5 text-[#00a884] shrink-0" />}
                            </div>
                          </div>

                          <div className="mt-6 p-3.5 rounded-xl bg-teal-50/60 border border-teal-100 flex items-center gap-2.5 text-xs text-slate-600">
                            <Sparkles className="w-4 h-4 text-[#00a884] shrink-0" />
                            <span>AI-driven interviews adapt real-time based on your candidate's technical responses and experience depth.</span>
                          </div>
                        </div>
                      )}

                      {currentStep === 2 && (
                        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
                          <h2 className="text-base font-bold text-slate-900">Select Candidate & Skill Focus</h2>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {candidateOptions.map((c) => (
                              <div
                                key={c.name}
                                onClick={() => setCandidate(c.name)}
                                className={`p-4 rounded-xl border transition-all cursor-pointer ${candidate === c.name ? 'border-2 border-[#00a884] bg-teal-50/20' : 'border-slate-200 hover:border-slate-300'
                                  }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-bold text-slate-900">{c.name}</span>
                                  {candidate === c.name && <CheckCircle2 className="w-4 h-4 text-[#00a884]" />}
                                </div>
                                <div className="text-xs text-slate-500 mt-1">{c.role}</div>
                              </div>
                            ))}
                          </div>
                          <div className="pt-2">
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Primary Technical Focus</label>
                            <div className="flex items-center gap-2 flex-wrap">
                              {['React', 'Full Stack', 'Node.js', 'Python', 'Performance Marketing'].map((skill) => (
                                <button
                                  key={skill}
                                  type="button"
                                  onClick={() => setFocus(skill)}
                                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${focus === skill ? 'bg-[#00a884] text-white border-[#00a884]' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                  {skill}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {currentStep === 3 && (
                        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
                          <h2 className="text-base font-bold text-slate-900">Question Bank & Personality Tone</h2>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Selected Question Bank</label>
                            <select
                              value={questionBank}
                              onChange={(e) => setQuestionBank(e.target.value)}
                              className="w-full px-3 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:border-[#00a884] outline-none"
                            >
                              <option>Frontend & React Core (45 Questions)</option>
                              <option>Full Stack System Design & APIs (35 Questions)</option>
                              <option>Performance Marketing & SEO Metrics (30 Questions)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Evaluator Personality</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                              {['Technical Strict', 'Analytical Balanced', 'Conversational'].map((p) => (
                                <button
                                  key={p}
                                  type="button"
                                  onClick={() => setPersonality(p)}
                                  className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${personality === p ? 'border-2 border-[#00a884] bg-teal-50/20 text-[#00a884]' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                    }`}
                                >
                                  {p}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {currentStep === 4 && (
                        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
                          <h2 className="text-base font-bold text-slate-900">Date & Launch Window</h2>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1.5">Launch Window Time</label>
                              <input
                                type="text"
                                value={launchWindow}
                                onChange={(e) => setLaunchWindow(e.target.value)}
                                className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:border-[#00a884] outline-none font-semibold text-slate-800"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1.5">Duration</label>
                              <div className="flex items-center gap-2">
                                {['30 min', '45 min', '60 min'].map((dur) => (
                                  <button
                                    key={dur}
                                    type="button"
                                    onClick={() => setDuration(dur)}
                                    className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${duration === dur ? 'border-2 border-[#00a884] bg-teal-50/20 text-[#00a884]' : 'border-slate-200 text-slate-600'
                                      }`}
                                  >
                                    {dur}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {currentStep === 5 && (
                        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
                          <h2 className="text-base font-bold text-slate-900">Review & Confirm Schedule</h2>
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-400 font-semibold">Mode:</span>
                              <span className="font-bold text-slate-900">{interviewMode} Session</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-400 font-semibold">Candidate:</span>
                              <span className="font-bold text-[#00a884]">{candidate}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-400 font-semibold">Focus:</span>
                              <span className="font-bold text-slate-900">{focus}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-400 font-semibold">Launch Window:</span>
                              <span className="font-bold text-slate-900">{launchWindow}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Navigation buttons */}
                      <div className="flex items-center justify-between pt-2">
                        <button
                          type="button"
                          disabled={currentStep === 1}
                          onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                          className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold disabled:opacity-30 cursor-pointer bg-white"
                        >
                          Back
                        </button>
                        {currentStep < 5 ? (
                          <button
                            type="button"
                            onClick={() => setCurrentStep((prev) => Math.min(5, prev + 1))}
                            className="px-6 py-2.5 rounded-xl bg-[#00a884] hover:bg-[#009272] text-white text-xs font-bold flex items-center gap-1.5 border-none cursor-pointer"
                          >
                            Next Step <ChevronRight className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleScheduleSubmit}
                            className="px-6 py-2.5 rounded-xl bg-[#00a884] hover:bg-[#009272] text-white text-xs font-bold flex items-center gap-1.5 border-none cursor-pointer"
                          >
                            Confirm & Schedule ✨
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Right Review Summary Sidebar */}
                    <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-6">
                      <div>
                        <span className="text-[0.62rem] font-bold text-slate-400 uppercase tracking-widest block">
                          REVIEW SUMMARY
                        </span>
                        <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                          {interviewMode} Session
                        </h3>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-8 h-8 rounded-full bg-teal-50 text-[#00a884] flex items-center justify-center shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[0.62rem] font-bold text-slate-400 uppercase tracking-wider block">CANDIDATE</span>
                            <span onClick={() => setCurrentStep(2)} className="text-xs font-bold text-[#00a884] hover:underline cursor-pointer truncate block">
                              {candidate}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                            <Shield className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[0.62rem] font-bold text-slate-400 uppercase tracking-wider block">PERSONALITY</span>
                            <span className="text-xs font-bold text-slate-800 truncate block">{personality}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                            <Target className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[0.62rem] font-bold text-slate-400 uppercase tracking-wider block">INTERVIEW GOAL</span>
                            <span className="text-xs font-bold text-slate-800 truncate block">{interviewGoal}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                            <BarChart3 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[0.62rem] font-bold text-slate-400 uppercase tracking-wider block">DIFFICULTY</span>
                            <span className="text-xs font-bold text-slate-800 truncate block">{difficulty}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                            <Code className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[0.62rem] font-bold text-slate-400 uppercase tracking-wider block">FOCUS</span>
                            <span className="text-xs font-bold text-slate-800 truncate block">{focus}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[0.62rem] font-bold text-slate-400 uppercase tracking-wider block">LAUNCH WINDOW</span>
                            <span className="text-xs font-bold text-slate-800 truncate block">{launchWindow}</span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-200/80 pt-4 space-y-2.5">
                        <div className="flex justify-between items-center text-[0.68rem] font-medium">
                          <span className="text-slate-400 font-semibold uppercase tracking-wider">MONTHLY INTERVIEWS</span>
                          <span className="font-extrabold text-slate-800">95 left</span>
                        </div>
                        <div className="flex justify-between items-center text-[0.68rem] font-medium">
                          <span className="text-slate-400 font-semibold uppercase tracking-wider">MONTHLY MINUTES</span>
                          <span className="font-extrabold text-slate-800">4365 left</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleScheduleSubmit}
                        className="w-full py-3 rounded-xl bg-[#00a884] hover:bg-[#009272] text-white text-xs font-extrabold tracking-wide transition-all shadow-md shadow-teal-500/15 flex items-center justify-center gap-2 border-none cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Schedule →
                      </button>
                    </div>

                  </div>
                </div>
              ) : (
                /* Interview List Table */
                <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
                  <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Scheduled Interviews</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Manage live sessions, proctor logs, and scorecards</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveMainTab('create')}
                      className="px-4 py-2 rounded-xl bg-[#00a884] hover:bg-[#009272] text-white text-xs font-bold flex items-center gap-1.5 border-none cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Schedule New Session
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/70 text-[0.68rem] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="py-3 px-5">Candidate</th>
                          <th className="py-3 px-5">Role</th>
                          <th className="py-3 px-5">Mode</th>
                          <th className="py-3 px-5">Schedule</th>
                          <th className="py-3 px-5">Status</th>
                          <th className="py-3 px-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-medium">
                        {interviewList.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-4 px-5">
                              <div className="font-bold text-slate-900">{item.candidate}</div>
                              <div className="text-[0.68rem] text-slate-400">{item.focus} Focus</div>
                            </td>
                            <td className="py-4 px-5 text-slate-700">{item.role}</td>
                            <td className="py-4 px-5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold bg-teal-50 text-[#00a884] border border-teal-200/60">
                                {item.mode}
                              </span>
                            </td>
                            <td className="py-4 px-5 font-semibold text-slate-800">{item.dateTime}</td>
                            <td className="py-4 px-5">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                                {item.status}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => copyMeetLink(item.meetUrl)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
                                  title="Copy Link"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <a
                                  href={item.meetUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-[#00a884] font-bold text-xs no-underline"
                                >
                                  <Video className="w-3.5 h-3.5" /> Join
                                </a>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

        </main>
      </div>

      {/* Upgrade to PRO Modal */}
    </div>
  );
}
