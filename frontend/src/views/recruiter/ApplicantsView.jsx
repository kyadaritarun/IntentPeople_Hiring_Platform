import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Users, UserCheck, FileText, ExternalLink, Mail, Phone, 
  MapPin, CheckCircle2, ChevronRight, ChevronLeft, Briefcase, Clock,
  ArrowLeft, ArrowRight, Download, ShieldCheck, Filter, RefreshCw, Sparkles, 
  Building2, Printer, X, Eye, Award, GraduationCap, Compass, DollarSign, Calendar,
  Search, LayoutGrid, List, SlidersHorizontal, CheckSquare, Square, 
  ChevronDown, Check, ArrowUpDown, Layers, AlertCircle, ArrowUpRight,
  Trophy, Zap, Target, Brain, TrendingUp, BarChart3, Star, Crown, HelpCircle
} from 'lucide-react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function ApplicantsView({ jobId, setActiveTab, setSelectedJobId, role }) {
  const { user } = useAuth();
  const currentRole = role || user?.role || 'RECRUITER';
  const isAdmin = currentRole === 'ADMIN';
  const isHiringManager = currentRole === 'HIRING_MANAGER';
  const isReadOnly = isAdmin || isHiringManager;
  const [allApplications, setAllApplications] = useState([]);
  const [jobsList, setJobsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobFilter, setSelectedJobFilter] = useState(jobId ? String(jobId) : 'ALL');
  const [selectedApp, setSelectedApp] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);
  
  // High-Volume & Pipeline Navigation State (20+ Jobs & 300+ Candidates)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'name_asc' | 'name_desc'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'split'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [isJobPickerOpen, setIsJobPickerOpen] = useState(false);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState(new Set());
  const [selectedPodFilter, setSelectedPodFilter] = useState('ALL');
  const [podSearchQuery, setPodSearchQuery] = useState('');
  const [isPodPickerOpen, setIsPodPickerOpen] = useState(false);
  
  // AI Ranking State
  const [aiTopN, setAiTopN] = useState(10);
  const [aiTopMode, setAiTopMode] = useState(false); // When true, show only top N candidates
  const [aiTopCandidates, setAiTopCandidates] = useState(null); // Cached top-N results
  const [aiLoading, setAiLoading] = useState(false);
  const [rescoring, setRescoring] = useState(false);
  const [activeScoreApp, setActiveScoreApp] = useState(null); // Applicant whose full AI fit modal is open

  // PDF Preview & Export state
  const [pdfModalData, setPdfModalData] = useState(null); // { type: 'single' | 'all', app: ..., apps: ..., jobTitle: ... }
  const printContainerRef = useRef(null);
  const jobPickerRef = useRef(null);
  const podPickerRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (jobPickerRef.current && !jobPickerRef.current.contains(e.target)) {
        setIsJobPickerOpen(false);
      }
      if (podPickerRef.current && !podPickerRef.current.contains(e.target)) {
        setIsPodPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (jobId) {
      setSelectedJobFilter(String(jobId));
    }
  }, [jobId]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [jobsRes, appsRes] = await Promise.allSettled([
        api.getMyJobs ? api.getMyJobs().catch(() => api.getJobs()) : api.getJobs(),
        api.getCompanyApplications ? api.getCompanyApplications() : Promise.resolve([])
      ]);

      const jobs = jobsRes.status === 'fulfilled' ? (jobsRes.value || []) : [];
      const apps = appsRes.status === 'fulfilled' ? (appsRes.value || []) : [];

      try {
        const screeningRejectedIds = JSON.parse(localStorage.getItem('uptrix_screening_rejected_ids') || '[]');
        const funnelRejectedIds = JSON.parse(localStorage.getItem('uptrix_funnel_rejected_ids') || '[]');

        // Auto-tag any apps currently having REJECTED status that are not in funnelRejectedIds as screening rejected
        const screeningRejectedInApps = (apps || [])
          .filter(a => a.status === 'REJECTED' && !funnelRejectedIds.includes(a.id))
          .map(a => a.id);
        const allScreeningRejected = Array.from(new Set([...screeningRejectedIds, ...screeningRejectedInApps]));
        localStorage.setItem('uptrix_screening_rejected_ids', JSON.stringify(allScreeningRejected));

        // Active funnel apps
        const activeFunnelIds = (apps || [])
          .filter(a => ['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'SELECTED', 'HIRED'].includes(a.status))
          .map(a => a.id);
        const existingShortlisted = JSON.parse(localStorage.getItem('uptrix_shortlisted_ids') || '[]');
        const cleanedShortlisted = Array.from(new Set([
          ...existingShortlisted.filter(id => !allScreeningRejected.includes(id) && !(apps || []).some(a => a.id === id && ['APPLIED', 'UNDER_REVIEW'].includes(a.status))),
          ...activeFunnelIds
        ]));
        localStorage.setItem('uptrix_shortlisted_ids', JSON.stringify(cleanedShortlisted));
      } catch {}

      setJobsList(jobs);
      setAllApplications(apps);

      const filtered = jobId && jobId !== 'ALL'
        ? apps.filter(a => String(a.job_id) === String(jobId))
        : apps;

      if (filtered.length > 0) {
        setSelectedApp(filtered[0]);
      } else {
        setSelectedApp(null);
      }
    } catch (err) {
      console.error('Failed to load applicants view data:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Filter applications based on selected requisition
  const filteredApplicants = allApplications.filter(app => {
    if (selectedJobFilter === 'ALL') return true;
    return String(app.job_id) === String(selectedJobFilter);
  });

  const getSelectedRequisitionTitle = () => {
    if (selectedJobFilter === 'ALL') return 'All Active Requisitions';
    const found = jobsList.find(j => String(j.id) === String(selectedJobFilter));
    return found ? found.title : 'Job Requisition';
  };

  const handleFilterChange = (newVal) => {
    setSelectedJobFilter(newVal);
    setCurrentPage(1);
    setSelectedCandidateIds(new Set());
    if (setSelectedJobId) {
      setSelectedJobId(newVal === 'ALL' ? null : Number(newVal));
    }
    const matching = newVal === 'ALL' 
      ? allApplications 
      : allApplications.filter(a => String(a.job_id) === String(newVal));
    setSelectedApp(matching.length > 0 ? matching[0] : null);
  };

  const handleStatusChange = async (appId, newStatus) => {
    if (isReadOnly) return;
    setStatusUpdating(true);
    try {
      await api.updateApplicationStatus(appId, newStatus);
      if (newStatus === 'SHORTLISTED') {
        try {
          const existing = JSON.parse(localStorage.getItem('uptrix_shortlisted_ids') || '[]');
          if (!existing.includes(appId)) {
            localStorage.setItem('uptrix_shortlisted_ids', JSON.stringify([...existing, appId]));
          }
          const screeningRej = JSON.parse(localStorage.getItem('uptrix_screening_rejected_ids') || '[]');
          localStorage.setItem('uptrix_screening_rejected_ids', JSON.stringify(screeningRej.filter(id => id !== appId)));
          const funnelRej = JSON.parse(localStorage.getItem('uptrix_funnel_rejected_ids') || '[]');
          localStorage.setItem('uptrix_funnel_rejected_ids', JSON.stringify(funnelRej.filter(id => id !== appId)));
        } catch {}
      } else if (newStatus === 'REJECTED') {
        try {
          const existing = JSON.parse(localStorage.getItem('uptrix_shortlisted_ids') || '[]');
          localStorage.setItem('uptrix_shortlisted_ids', JSON.stringify(existing.filter(id => id !== appId)));
          const funnelRej = JSON.parse(localStorage.getItem('uptrix_funnel_rejected_ids') || '[]');
          localStorage.setItem('uptrix_funnel_rejected_ids', JSON.stringify(funnelRej.filter(id => id !== appId)));
          const screeningRej = JSON.parse(localStorage.getItem('uptrix_screening_rejected_ids') || '[]');
          if (!screeningRej.includes(appId)) {
            localStorage.setItem('uptrix_screening_rejected_ids', JSON.stringify([...screeningRej, appId]));
          }
        } catch {}
      } else if (newStatus === 'APPLIED' || newStatus === 'UNDER_REVIEW') {
        try {
          const existing = JSON.parse(localStorage.getItem('uptrix_shortlisted_ids') || '[]');
          localStorage.setItem('uptrix_shortlisted_ids', JSON.stringify(existing.filter(id => id !== appId)));
          const screeningRej = JSON.parse(localStorage.getItem('uptrix_screening_rejected_ids') || '[]');
          localStorage.setItem('uptrix_screening_rejected_ids', JSON.stringify(screeningRej.filter(id => id !== appId)));
          const funnelRej = JSON.parse(localStorage.getItem('uptrix_funnel_rejected_ids') || '[]');
          localStorage.setItem('uptrix_funnel_rejected_ids', JSON.stringify(funnelRej.filter(id => id !== appId)));
        } catch {}
      }
      setAllApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
      if (selectedApp && selectedApp.id === appId) {
        setSelectedApp(prev => ({ ...prev, status: newStatus }));
      }
      showToast(`Candidate stage updated to ${newStatus.replace(/_/g, ' ')}!`);
    } catch (e) {
      showToast(`Error: ${e.message || 'Failed to update status'}`);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (isReadOnly) return;
    if (selectedCandidateIds.size === 0) return;
    setStatusUpdating(true);
    const ids = Array.from(selectedCandidateIds);
    try {
      await Promise.all(ids.map(id => api.updateApplicationStatus(id, newStatus)));
      if (newStatus === 'SHORTLISTED') {
        try {
          const existing = JSON.parse(localStorage.getItem('uptrix_shortlisted_ids') || '[]');
          const updated = Array.from(new Set([...existing, ...ids]));
          localStorage.setItem('uptrix_shortlisted_ids', JSON.stringify(updated));
          const screeningRej = JSON.parse(localStorage.getItem('uptrix_screening_rejected_ids') || '[]');
          localStorage.setItem('uptrix_screening_rejected_ids', JSON.stringify(screeningRej.filter(id => !ids.includes(id))));
          const funnelRej = JSON.parse(localStorage.getItem('uptrix_funnel_rejected_ids') || '[]');
          localStorage.setItem('uptrix_funnel_rejected_ids', JSON.stringify(funnelRej.filter(id => !ids.includes(id))));
        } catch {}
      } else if (newStatus === 'REJECTED') {
        try {
          const existing = JSON.parse(localStorage.getItem('uptrix_shortlisted_ids') || '[]');
          localStorage.setItem('uptrix_shortlisted_ids', JSON.stringify(existing.filter(id => !ids.includes(id))));
          const funnelRej = JSON.parse(localStorage.getItem('uptrix_funnel_rejected_ids') || '[]');
          localStorage.setItem('uptrix_funnel_rejected_ids', JSON.stringify(funnelRej.filter(id => !ids.includes(id))));
          const screeningRej = JSON.parse(localStorage.getItem('uptrix_screening_rejected_ids') || '[]');
          const updatedRej = Array.from(new Set([...screeningRej, ...ids]));
          localStorage.setItem('uptrix_screening_rejected_ids', JSON.stringify(updatedRej));
        } catch {}
      } else if (newStatus === 'APPLIED' || newStatus === 'UNDER_REVIEW') {
        try {
          const existing = JSON.parse(localStorage.getItem('uptrix_shortlisted_ids') || '[]');
          localStorage.setItem('uptrix_shortlisted_ids', JSON.stringify(existing.filter(id => !ids.includes(id))));
          const screeningRej = JSON.parse(localStorage.getItem('uptrix_screening_rejected_ids') || '[]');
          localStorage.setItem('uptrix_screening_rejected_ids', JSON.stringify(screeningRej.filter(id => !ids.includes(id))));
          const funnelRej = JSON.parse(localStorage.getItem('uptrix_funnel_rejected_ids') || '[]');
          localStorage.setItem('uptrix_funnel_rejected_ids', JSON.stringify(funnelRej.filter(id => !ids.includes(id))));
        } catch {}
      }
      setAllApplications(prev => prev.map(a => ids.includes(a.id) ? { ...a, status: newStatus } : a));
      if (selectedApp && ids.includes(selectedApp.id)) {
        setSelectedApp(prev => ({ ...prev, status: newStatus }));
      }
      setSelectedCandidateIds(new Set());
      showToast(`Successfully moved ${ids.length} candidates to ${newStatus.replace(/_/g, ' ')}!`);
    } catch (e) {
      showToast(`Error updating candidates: ${e.message || 'Failed'}`);
    } finally {
      setStatusUpdating(false);
    }
  };

  const getNextStage = (currentStatus) => {
    switch (currentStatus) {
      case 'APPLIED': return 'UNDER_REVIEW';
      case 'UNDER_REVIEW': return 'SHORTLISTED';
      default: return null;
    }
  };

  const getNextStageLabel = (currentStatus) => {
    switch (currentStatus) {
      case 'APPLIED': return 'Move to Review';
      case 'UNDER_REVIEW': return 'Shortlist Candidate ⭐';
      default: return null;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SELECTED':
      case 'HIRED':
        return 'bg-[#00A884]/8 text-[#00846A] ring-1 ring-inset ring-[#00A884]/15 border-none';
      case 'INTERVIEW_SCHEDULED':
        return 'bg-[#5C59E8]/8 text-[#4845D2] ring-1 ring-inset ring-[#5C59E8]/15 border-none';
      case 'SHORTLISTED':
        return 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200/80 border-none';
      case 'UNDER_REVIEW':
        return 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/80 border-none';
      case 'APPLIED':
        return 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200/70 border-none';
      case 'REJECTED':
        return 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200/80 border-none';
      default:
        return 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200/70 border-none';
    }
  };

  // ─── High-Volume Data Filtering & Pagination (20+ Jobs & 300+ Candidates) ───
  const availablePods = useMemo(() => {
    return Array.from(new Set(jobsList.map(j => j.group_name).filter(Boolean)));
  }, [jobsList]);

  const filteredPodsList = useMemo(() => {
    if (!podSearchQuery.trim()) return availablePods;
    const q = podSearchQuery.toLowerCase().trim();
    return availablePods.filter(p => p.toLowerCase().includes(q));
  }, [availablePods, podSearchQuery]);

  // 1. Filter jobs list by pod and search query
  const filteredJobsList = useMemo(() => {
    let list = jobsList;
    if (selectedPodFilter !== 'ALL') {
      list = list.filter(j => j.group_name === selectedPodFilter);
    }
    if (!jobSearchQuery.trim()) return list;
    const q = jobSearchQuery.toLowerCase().trim();
    return list.filter(j => 
      (j.title || '').toLowerCase().includes(q) ||
      (j.location || '').toLowerCase().includes(q) ||
      (j.work_mode || '').toLowerCase().includes(q) ||
      (j.group_name || '').toLowerCase().includes(q)
    );
  }, [jobsList, jobSearchQuery, selectedPodFilter]);

  // 2. Candidates for selected requisition & pod
  const requisitionApplicants = useMemo(() => {
    let list = allApplications;
    if (selectedPodFilter !== 'ALL') {
      const allowedJobIds = new Set(jobsList.filter(j => j.group_name === selectedPodFilter).map(j => String(j.id)));
      list = list.filter(app => allowedJobIds.has(String(app.job_id)));
    }
    if (selectedJobFilter === 'ALL') return list;
    return list.filter(app => String(app.job_id) === String(selectedJobFilter));
  }, [allApplications, selectedJobFilter, selectedPodFilter, jobsList]);

  // 3. Stage counts for selected requisition
  const stageCounts = useMemo(() => {
    return {
      ALL: requisitionApplicants.length,
      APPLIED: requisitionApplicants.filter(a => a.status === 'APPLIED').length,
      UNDER_REVIEW: requisitionApplicants.filter(a => a.status === 'UNDER_REVIEW').length,
      SHORTLISTED: requisitionApplicants.filter(a => a.status === 'SHORTLISTED').length,
      INTERVIEW_SCHEDULED: requisitionApplicants.filter(a => a.status === 'INTERVIEW_SCHEDULED').length,
      SELECTED: requisitionApplicants.filter(a => ['SELECTED', 'HIRED'].includes(a.status)).length,
      REJECTED: requisitionApplicants.filter(a => a.status === 'REJECTED').length,
    };
  }, [requisitionApplicants]);

  // 4. Filter by stage & search query
  const searchAndStageFiltered = useMemo(() => {
    return requisitionApplicants.filter(app => {
      // Stage filter
      if (selectedStageFilter !== 'ALL') {
        if (app.status !== selectedStageFilter) {
          return false;
        }
      }

      // Keyword search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const c = app.candidate || {};
        const matchesName = (c.full_name || '').toLowerCase().includes(q);
        const matchesEmail = (c.email || '').toLowerCase().includes(q);
        const matchesPhone = (c.phone || '').toLowerCase().includes(q);
        const matchesTitle = (c.title || '').toLowerCase().includes(q);
        const matchesJob = (app.job_title || '').toLowerCase().includes(q);
        const matchesCity = (c.city || '').toLowerCase().includes(q);
        const matchesState = (c.state || '').toLowerCase().includes(q);
        const matchesSkills = Array.isArray(c.skills) && c.skills.some(s => (s || '').toLowerCase().includes(q));
        const matchesExp = Array.isArray(c.expertise) && c.expertise.some(e => (e || '').toLowerCase().includes(q));
        if (!matchesName && !matchesEmail && !matchesPhone && !matchesTitle && !matchesJob && !matchesCity && !matchesState && !matchesSkills && !matchesExp) {
          return false;
        }
      }

      return true;
    });
  }, [requisitionApplicants, selectedStageFilter, searchQuery]);

  // 5. Sort candidates
  const sortedApplicants = useMemo(() => {
    // If AI Top Mode is active, use the AI-ranked candidates
    const source = (aiTopMode && aiTopCandidates) ? aiTopCandidates : searchAndStageFiltered;
    return [...source].sort((a, b) => {
      if (sortBy === 'best_match') {
        return (b.fit_score || 0) - (a.fit_score || 0);
      }
      if (sortBy === 'newest') {
        return new Date(b.applied_at || 0) - new Date(a.applied_at || 0);
      }
      if (sortBy === 'oldest') {
        return new Date(a.applied_at || 0) - new Date(b.applied_at || 0);
      }
      if (sortBy === 'name_asc') {
        return (a.candidate?.full_name || '').localeCompare(b.candidate?.full_name || '');
      }
      if (sortBy === 'name_desc') {
        return (b.candidate?.full_name || '').localeCompare(a.candidate?.full_name || '');
      }
      return 0;
    });
  }, [searchAndStageFiltered, sortBy, aiTopMode, aiTopCandidates]);

  // 6. Pagination calculations
  const totalPages = Math.ceil(sortedApplicants.length / pageSize) || 1;
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedApplicants = useMemo(() => {
    return sortedApplicants.slice(startIndex, startIndex + pageSize);
  }, [sortedApplicants, startIndex, pageSize]);

  // Sync selectedApp when filtered list changes
  useEffect(() => {
    if (sortedApplicants.length > 0) {
      if (!selectedApp || !sortedApplicants.some(a => a.id === selectedApp.id)) {
        setSelectedApp(sortedApplicants[0]);
      }
    } else {
      setSelectedApp(null);
    }
  }, [sortedApplicants]);

  const getPageNumbers = (current, total) => {
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 3) {
      return [1, 2, 3, 4, '...', total];
    }
    if (current >= total - 2) {
      return [1, '...', total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  const toggleSelectCandidate = (id) => {
    setSelectedCandidateIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (candidatesOnPage) => {
    setSelectedCandidateIds(prev => {
      const allSelected = candidatesOnPage.every(c => prev.has(c.id));
      const next = new Set(prev);
      if (allSelected) {
        candidatesOnPage.forEach(c => next.delete(c.id));
      } else {
        candidatesOnPage.forEach(c => next.add(c.id));
      }
      return next;
    });
  };

  // ─── PDF Generation and Printable Window Logic ───
  const openPrintableWindow = (title, bodyHtml) => {
    const printWindow = window.open('', '_blank', 'width=920,height=980');
    if (!printWindow) {
      alert('Please allow popups to download and print the candidate PDF dossier.');
      return;
    }

    const docContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <style>
            @page {
              size: A4;
              margin: 14mm 12mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              background: #ffffff;
              margin: 0;
              padding: 20px;
              font-size: 11.5px;
              line-height: 1.45;
            }
            .no-print-bar {
              display: flex;
              justify-content: space-between;
              align-items: center;
              background: #0f172a;
              color: #ffffff;
              padding: 12px 20px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .no-print-bar button {
              background: #00a884;
              color: #ffffff;
              border: none;
              font-weight: 700;
              font-size: 12px;
              padding: 8px 18px;
              border-radius: 6px;
              cursor: pointer;
            }
            .header-bar {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #00a884;
              padding-bottom: 10px;
              margin-bottom: 16px;
            }
            .brand-title {
              font-size: 17px;
              font-weight: 900;
              letter-spacing: -0.5px;
              color: #0f172a;
              margin: 0;
            }
            .brand-sub {
              font-size: 10px;
              font-weight: 700;
              color: #00a884;
              text-transform: uppercase;
              letter-spacing: 0.8px;
              margin-top: 2px;
            }
            .dossier-ref {
              text-align: right;
              font-size: 9.5px;
              color: #64748b;
              font-weight: 600;
            }
            .candidate-identity-card {
              display: flex;
              gap: 16px;
              align-items: center;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 14px 16px;
              margin-bottom: 16px;
              background: #f8fafc;
            }
            .avatar-img {
              width: 76px;
              height: 76px;
              border-radius: 50%;
              object-fit: cover;
              border: 2.5px solid #00a884;
              box-shadow: 0 2px 6px rgba(0,0,0,0.08);
              flex-shrink: 0;
            }
            .avatar-placeholder {
              width: 76px;
              height: 76px;
              border-radius: 50%;
              background: #0f172a;
              color: #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 26px;
              font-weight: 800;
              border: 2.5px solid #00a884;
              flex-shrink: 0;
            }
            .candidate-name {
              font-size: 19px;
              font-weight: 800;
              color: #0f172a;
              margin: 0 0 2px 0;
            }
            .candidate-role {
              font-size: 11.5px;
              font-weight: 700;
              color: #00a884;
              margin: 0;
            }
            .badge {
              display: inline-block;
              padding: 3px 8px;
              border-radius: 9999px;
              font-size: 9.5px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              border: 1px solid #cbd5e1;
              background: #f1f5f9;
            }
            .badge-applied { background: #fef3c7; color: #92400e; border-color: #fde68a; }
            .badge-shortlisted { background: #e0e7ff; color: #3730a3; border-color: #c7d2fe; }
            .badge-selected { background: #d1fae5; color: #065f46; border-color: #a7f3d0; }
            .contact-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 8px;
              background: #f1f5f9;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 10px 14px;
              margin-bottom: 16px;
            }
            .contact-item-label {
              font-size: 8.5px;
              font-weight: 800;
              text-transform: uppercase;
              color: #64748b;
              margin-bottom: 1px;
            }
            .contact-item-val {
              font-size: 10.5px;
              font-weight: 700;
              color: #0f172a;
            }
            .section {
              margin-bottom: 14px;
            }
            .section-heading {
              font-size: 10.5px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.6px;
              color: #334155;
              border-bottom: 1.5px solid #e2e8f0;
              padding-bottom: 3px;
              margin-bottom: 8px;
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
            .quote-box {
              background: #f0fdf4;
              border-left: 3.5px solid #00a884;
              padding: 9px 12px;
              border-radius: 4px;
              font-style: italic;
              color: #166534;
              font-size: 11px;
            }
            .pref-box {
              background: #faf5ff;
              border: 1px solid #e9d5ff;
              border-radius: 6px;
              padding: 10px 12px;
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 8px;
            }
            .pref-item-label {
              font-size: 8.5px;
              font-weight: 800;
              text-transform: uppercase;
              color: #7e22ce;
              margin-bottom: 2px;
            }
            .pref-item-val {
              font-size: 10.5px;
              font-weight: 700;
              color: #581c87;
            }
            .skills-wrap {
              display: flex;
              flex-wrap: wrap;
              gap: 5px;
            }
            .skill-chip {
              background: #f1f5f9;
              border: 1px solid #cbd5e1;
              padding: 3px 7px;
              border-radius: 4px;
              font-size: 9.5px;
              font-weight: 700;
              color: #334155;
            }
            .exp-chip {
              background: #ecfdf5;
              border: 1px solid #a7f3d0;
              padding: 3px 8px;
              border-radius: 4px;
              font-size: 9.5px;
              font-weight: 700;
              color: #047857;
            }
            .item-card {
              border-left: 3px solid #0f172a;
              padding: 6px 12px;
              background: #f8fafc;
              margin-bottom: 8px;
              border-radius: 0 6px 6px 0;
            }
            .item-title {
              font-size: 11px;
              font-weight: 800;
              color: #0f172a;
            }
            .item-sub {
              font-size: 9.5px;
              font-weight: 600;
              color: #64748b;
              margin: 2px 0 4px 0;
            }
            .item-desc {
              font-size: 10.5px;
              color: #334155;
              margin: 0;
              line-height: 1.4;
            }
            .scorecard-box {
              border: 1px dashed #cbd5e1;
              border-radius: 6px;
              padding: 10px 12px;
              background: #ffffff;
              margin-top: 12px;
            }
            .scorecard-title {
              font-size: 9.5px;
              font-weight: 800;
              text-transform: uppercase;
              color: #475569;
              margin-bottom: 6px;
            }
            .scorecard-fields {
              display: flex;
              justify-content: space-between;
              font-size: 9.5px;
              color: #64748b;
              font-weight: 600;
            }
            .page-break {
              page-break-after: always;
              break-after: page;
              height: 20px;
            }
            .footer-info {
              margin-top: 20px;
              padding-top: 6px;
              border-top: 1px solid #e2e8f0;
              display: flex;
              justify-content: space-between;
              font-size: 8.5px;
              color: #94a3b8;
            }
            @media print {
              .no-print-bar { display: none !important; }
              body { padding: 0 !important; }
            }
          </style>
        </head>
        <body>
          <div class="no-print-bar">
            <span>Uptrix Executive Candidate Dossier • Ready for PDF Export</span>
            <button onclick="window.print()">Save as PDF / Print</button>
          </div>
          ${bodyHtml}
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(docContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 450);
  };

  const generateSingleCandidateHtml = (app) => {
    const c = app.candidate || {};
    const appliedDate = app.applied_at ? new Date(app.applied_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Recent submission';
    const skillsList = Array.isArray(c.skills) ? c.skills.filter(Boolean) : [];
    const expertiseList = Array.isArray(c.expertise) ? c.expertise.filter(Boolean) : [];
    const expList = Array.isArray(c.experience) ? c.experience : [];
    const eduList = Array.isArray(c.education) ? c.education : [];
    const certList = Array.isArray(c.certifications) 
      ? c.certifications.filter(cert => 
          cert && cert.name && 
          !cert.name.includes('Meta Certified Front-End') && 
          !cert.name.includes('Full Stack React & Node') &&
          !cert.issuer?.includes('Meta Blueprint')
        ) 
      : [];
    const prefs = c.hiring_preferences || {};

    return `
      <div class="header-bar">
        <div>
          <div class="brand-title">UPTRIX TALENT PLATFORM</div>
          <div class="brand-sub">Official Candidate Application Dossier</div>
        </div>
        <div class="dossier-ref">
          <div>Ref ID: <strong>APP-00${app.id}</strong></div>
          <div>Position: <strong>${app.job_title || 'Requisition'}</strong></div>
          <div>Date: ${appliedDate}</div>
        </div>
      </div>

      <!-- 1. Candidate Full Name, Title, and Stage Badge -->
      <div class="candidate-identity-card">
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h1 class="candidate-name">${c.full_name || 'Candidate Profile'}</h1>
              <p class="candidate-role">${c.title || 'Applicant'}</p>
            </div>
            <span class="badge ${app.status === 'APPLIED' ? 'badge-applied' : (app.status === 'SELECTED' ? 'badge-selected' : 'badge-shortlisted')}">
              ${app.status.replace(/_/g, ' ')}
            </span>
          </div>
          <div style="margin-top: 4px; font-size: 10px; color: #64748b; font-weight: 600;">
            Applied Requisition: <strong style="color: #0f172a;">${app.job_title}</strong> (${app.job_work_mode || 'Flexible'} • ${app.job_location || 'India'})
          </div>
        </div>
      </div>

      <!-- 2. Phone Number, Email, City, State, Resume & Portfolio -->
      <div class="contact-grid">
        <div>
          <div class="contact-item-label">Phone Number:</div>
          <div class="contact-item-val">${c.phone || 'Not specified'}</div>
        </div>
        <div>
          <div class="contact-item-label">Email Address:</div>
          <div class="contact-item-val">${c.email || 'Not specified'}</div>
        </div>
        <div>
          <div class="contact-item-label">City:</div>
          <div class="contact-item-val">${c.city || 'Not specified'}</div>
        </div>
        <div>
          <div class="contact-item-label">State:</div>
          <div class="contact-item-val">${c.state || 'Not specified'}</div>
        </div>
        <div>
          <div class="contact-item-label">Resume Document:</div>
          <div class="contact-item-val" style="color: #00a884;">
            ${c.resume_url ? 'Attached (PDF Uploaded)' : 'Standard Application Profile'}
          </div>
        </div>
        <div>
          <div class="contact-item-label">Portfolio URL:</div>
          <div class="contact-item-val">
            ${c.portfolio_url ? `<a href="${c.portfolio_url}" target="_blank" style="color: #00a884; text-decoration: none;">View Portfolio</a>` : 'Not linked'}
          </div>
        </div>
      </div>

      <!-- 3. Professional Summary -->
      <div class="section">
        <div class="section-heading">Professional Summary</div>
        <p style="font-size: 11px; line-height: 1.55; color: #334155; margin: 0;">
          ${c.summary || 'No professional summary provided by candidate.'}
        </p>
      </div>

      <!-- 4. Candidate Expertise ("cadidte experting") -->
      <div class="section">
        <div class="section-heading">Candidate Core Expertise & Competencies</div>
        ${expertiseList.length > 0 ? `
          <div class="skills-wrap">
            ${expertiseList.map(e => `<span class="exp-chip">★ ${e}</span>`).join('')}
          </div>
        ` : `
          <div style="font-size: 10.5px; color: #64748b; font-style: italic;">No specific areas of expertise listed by candidate.</div>
        `}
      </div>

      <!-- 5. Technical Skills -->
      <div class="section">
        <div class="section-heading">Key Technical & Functional Skills</div>
        ${skillsList.length > 0 ? `
          <div class="skills-wrap">
            ${skillsList.map(s => `<span class="skill-chip">${s}</span>`).join('')}
          </div>
        ` : `
          <div style="font-size: 10.5px; color: #64748b; font-style: italic;">No skills specified by candidate.</div>
        `}
      </div>

      <!-- 6. Hiring Preferences -->
      <div class="section">
        <div class="section-heading">Candidate Hiring Preferences</div>
        <div class="pref-box">
          <div>
            <div class="pref-item-label">Preferred Work Mode:</div>
            <div class="pref-item-val">${prefs.work_mode || prefs.work_setup || 'Not specified'}</div>
          </div>
          <div>
            <div class="pref-item-label">Availability / Notice:</div>
            <div class="pref-item-val">${prefs.availability || 'Not specified'}</div>
          </div>
          <div>
            <div class="pref-item-label">Desired Compensation:</div>
            <div class="pref-item-val">${prefs.desired_salary || prefs.expected_ctc || 'Not specified'}</div>
          </div>
          <div>
            <div class="pref-item-label">Preferred Location:</div>
            <div class="pref-item-val">${prefs.preferred_location || prefs.preferred_city || 'Not specified'}</div>
          </div>
          <div>
            <div class="pref-item-label">Requisition Type:</div>
            <div class="pref-item-val">${prefs.job_type || prefs.target_role || 'Not specified'}</div>
          </div>
          <div>
            <div class="pref-item-label">Relocation Preference:</div>
            <div class="pref-item-val">${prefs.relocation || 'Not specified'}</div>
          </div>
        </div>
      </div>

      <!-- 7. Work Experience & Employment History -->
      <div class="section">
        <div class="section-heading">Work Experience & Employment History</div>
        ${expList.length > 0 ? expList.map(exp => `
          <div class="item-card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div class="item-title">${exp.title || 'Role'} • <span style="color: #00a884;">${exp.company || 'Company'}</span></div>
              <span style="font-size: 9px; font-weight: 700; color: #64748b;">${exp.duration || ''}</span>
            </div>
            <div class="item-sub">${exp.location || ''} ${exp.employment_type ? `• ${exp.employment_type}` : ''}</div>
            <div class="item-desc">
              ${Array.isArray(exp.description) ? exp.description.map(d => `• ${d}`).join('<br>') : (exp.description || '')}
            </div>
            ${exp.technologies && (Array.isArray(exp.technologies) ? exp.technologies.length > 0 : exp.technologies) ? `
              <div style="margin-top: 4px; font-size: 9px; color: #64748b;">
                <strong>Technologies:</strong> ${Array.isArray(exp.technologies) ? exp.technologies.join(', ') : exp.technologies}
              </div>
            ` : ''}
          </div>
        `).join('') : `
          <div style="font-size: 10.5px; color: #64748b; font-style: italic;">No work experience listed by candidate.</div>
        `}
      </div>

      <!-- 8. Academic Qualification (Education) -->
      <div class="section">
        <div class="section-heading">Academic Qualifications & Education</div>
        ${eduList.length > 0 ? eduList.map(edu => `
          <div class="item-card" style="border-left-color: #0284c7;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div class="item-title">${edu.degree || 'Degree'}</div>
              <span style="font-size: 9px; font-weight: 700; color: #64748b;">${edu.duration || ''}</span>
            </div>
            <div class="item-sub" style="color: #0284c7;">${edu.institution || ''} ${edu.grade ? `• Grade: ${edu.grade}%` : ''}</div>
            ${edu.description ? `<div class="item-desc">${edu.description}</div>` : ''}
          </div>
        `).join('') : `
          <div style="font-size: 10.5px; color: #64748b; font-style: italic;">No academic qualifications listed by candidate.</div>
        `}
      </div>

      <!-- 9. Certifications & Credentials -->
      <div class="section">
        <div class="section-heading">Certifications & Accreditations</div>
        ${certList.length > 0 ? certList.map(cert => `
          <div class="item-card" style="border-left-color: #f59e0b;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div class="item-title">🏆 ${cert.name || 'Certification'}</div>
              <span style="font-size: 9px; font-weight: 700; color: #64748b;">${cert.year || ''}</span>
            </div>
            <div class="item-sub" style="color: #d97706;">Issuer: ${cert.issuer || ''}</div>
          </div>
        `).join('') : `
          <div style="font-size: 10.5px; color: #64748b; font-style: italic;">No certifications listed by candidate.</div>
        `}
      </div>

      <!-- 10. Cover Letter Note (if provided) -->
      ${app.cover_letter ? `
      <div class="section">
        <div class="section-heading">Candidate Application Note / Cover Letter</div>
        <div class="quote-box">"${app.cover_letter}"</div>
      </div>` : ''}

      <!-- 11. Recruiter Evaluation Scorecard -->
      <div class="scorecard-box">
        <div class="scorecard-title">Recruiter & Hiring Manager Evaluation Notes</div>
        <div class="scorecard-fields">
          <span>[ &nbsp; ] Advance to Screen</span>
          <span>[ &nbsp; ] Schedule Technical Round</span>
          <span>[ &nbsp; ] Recommend Offer</span>
          <span>[ &nbsp; ] Reject</span>
        </div>
        <div style="margin-top: 12px; border-bottom: 1px dotted #cbd5e1; height: 14px;"></div>
        <div style="margin-top: 8px; border-bottom: 1px dotted #cbd5e1; height: 14px;"></div>
      </div>

      <!-- 12. Official Footer -->
      <div class="footer-info">
        <span>Confidential Candidate Dossier • Uptrix Talent & Recruitment Platform</span>
        <span>Generated: ${new Date().toLocaleString()}</span>
      </div>
    `;
  };

  const generateAllApplicantsHtml = (appsList, jobFilterTitle) => {
    return `
      <div class="header-bar">
        <div>
          <div class="brand-title">UPTRIX TALENT PLATFORM</div>
          <div class="brand-sub">All Requisition Applicants Summary & Complete Dossiers</div>
        </div>
        <div class="dossier-ref">
          <div>Requisition: <strong>${jobFilterTitle}</strong></div>
          <div>Total Candidates: <strong>${appsList.length}</strong></div>
          <div>Date: ${new Date().toLocaleDateString()}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-heading">Requisition Roster Overview (${appsList.length} Applicants)</div>
        <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10px;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1; text-align: left;">
              <th style="padding: 6px 8px;">#</th>
              <th style="padding: 6px 8px;">Candidate</th>
              <th style="padding: 6px 8px;">Applied Position</th>
              <th style="padding: 6px 8px;">Phone & Location</th>
              <th style="padding: 6px 8px;">Status</th>
              <th style="padding: 6px 8px;">Applied Date</th>
            </tr>
          </thead>
          <tbody>
            ${appsList.map((a, idx) => {
              const c = a.candidate || {};
              return `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 6px 8px; font-weight: 700;">${idx + 1}</td>
                  <td style="padding: 6px 8px; font-weight: 700; color: #0f172a;">
                    ${c.full_name || 'Candidate'}<br>
                    <span style="font-size: 9px; color: #64748b;">${c.email || ''}</span>
                  </td>
                  <td style="padding: 6px 8px;">${a.job_title || 'Position'}</td>
                  <td style="padding: 6px 8px;">
                    ${c.phone || '-'}<br>
                    <span style="color: #64748b;">${c.city || ''}${c.state ? `, ${c.state}` : ''}</span>
                  </td>
                  <td style="padding: 6px 8px;"><span class="badge">${a.status}</span></td>
                  <td style="padding: 6px 8px; color: #64748b;">${a.applied_at ? new Date(a.applied_at).toLocaleDateString() : '-'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <div class="page-break"></div>

      ${appsList.map((a, idx) => `
        <div style="margin-top: 10px;">
          <div style="font-size: 11px; font-weight: 800; color: #64748b; margin-bottom: 6px;">
            Candidate Application Dossier (${idx + 1} of ${appsList.length})
          </div>
          ${generateSingleCandidateHtml(a)}
        </div>
        ${idx < appsList.length - 1 ? '<div class="page-break"></div>' : ''}
      `).join('')}
    `;
  };

  const handleSelectApp = (app) => {
    setSelectedApp(app);
    if (app?.candidate?.id) {
      api.recordCandidateView(app.candidate.id).catch(() => {});
    }
  };

  const handleExportCandidatePdf = (app) => {
    if (!app) return;
    if (app.candidate?.id) {
      api.recordCandidateView(app.candidate.id).catch(() => {});
    }
    const title = `Candidate Dossier - ${app.candidate?.full_name || 'Applicant'} - Uptrix`;
    const html = generateSingleCandidateHtml(app);
    openPrintableWindow(title, html);
  };

  const handleExportAllPdf = (appsList, jobFilterTitle) => {
    if (!appsList || appsList.length === 0) {
      showToast('No applicants to export.');
      return;
    }
    const title = `All Applicants Report - ${jobFilterTitle} - Uptrix`;
    const html = generateAllApplicantsHtml(appsList, jobFilterTitle);
    openPrintableWindow(title, html);
  };

  const handleOpenPdfPreviewModal = (type, app = null, customApps = null) => {
    const list = customApps || sortedApplicants;
    const targetApp = app || selectedApp || list[0];
    if (type === 'single' && targetApp?.candidate?.id) {
      api.recordCandidateView(targetApp.candidate.id).catch(() => {});
    }
    setPdfModalData({
      type,
      app: targetApp,
      apps: list,
      jobTitle: getSelectedRequisitionTitle() + (selectedStageFilter !== 'ALL' ? ` • ${selectedStageFilter.replace(/_/g, ' ')}` : '')
    });
  };

  // ── AI Ranking Functions ──────────────────────────────────────────
  const handleShowTopN = async () => {
    if (selectedJobFilter === 'ALL') {
      showToast('Please select a specific job to use AI ranking');
      return;
    }
    setAiLoading(true);
    try {
      const result = await api.getTopCandidates(selectedJobFilter, aiTopN);
      const candidates = result.candidates || result || [];
      setAiTopCandidates(candidates);
      setAiTopMode(true);
      setSortBy('best_match');
      setCurrentPage(1);
      showToast(`AI ranked Top ${candidates.length} candidates out of ${result.total_applicants || '?'} applicants!`);
    } catch (err) {
      showToast(`AI Ranking error: ${err.message || 'Failed to fetch top candidates'}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleRescore = async () => {
    if (selectedJobFilter === 'ALL') {
      showToast('Please select a specific job to rescore');
      return;
    }
    setRescoring(true);
    try {
      const result = await api.rescoreJob(selectedJobFilter);
      showToast(result.message || `Re-scored ${result.scored_count} candidates!`);
      // Reload data to get fresh scores
      await loadData();
      // If in top mode, refresh the top N
      if (aiTopMode) {
        const topResult = await api.getTopCandidates(selectedJobFilter, aiTopN);
        setAiTopCandidates(topResult.candidates || topResult || []);
      }
    } catch (err) {
      showToast(`Rescore error: ${err.message || 'Failed to rescore'}`);
    } finally {
      setRescoring(false);
    }
  };

  const handleExitTopMode = () => {
    setAiTopMode(false);
    setAiTopCandidates(null);
    setSortBy('newest');
    setCurrentPage(1);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300', ring: 'ring-emerald-200', fill: '#059669' };
    if (score >= 60) return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300', ring: 'ring-amber-200', fill: '#d97706' };
    if (score >= 40) return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300', ring: 'ring-orange-200', fill: '#ea580c' };
    return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-300', ring: 'ring-rose-200', fill: '#e11d48' };
  };

  const ScoreBadge = ({ app }) => {
    const score = app.fit_score;
    if (score == null) return null;
    const colors = getScoreColor(score);

    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setActiveScoreApp(app);
        }}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black border cursor-pointer transition-all hover:scale-105 shadow-2xs hover:shadow-sm ${colors.bg} ${colors.text} ${colors.border}`}
        title={`AI Fit Score: ${score}% — Click to view full AI Role-Fit Analysis`}
      >
        <Zap className="w-3 h-3 fill-current" />
        <span>{score}%</span>
      </button>
    );
  };

  return (
    <div
      className="p-4 sm:p-7 max-w-7xl mx-auto space-y-6 bg-[#F7F8FB] min-h-full antialiased select-text text-slate-800"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
    >
      
      {/* ── 1. Clean Top Header Bar ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-[28px] font-semibold text-slate-900 leading-tight tracking-tight m-0">
              Applicant Pipeline
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200/70">
              {allApplications.length} total
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1.5 m-0">
            {selectedPodFilter !== 'ALL' && (
              <span className="font-semibold text-indigo-600 mr-1.5">[{selectedPodFilter}]</span>
            )}
            {selectedJobFilter === 'ALL'
              ? `Reviewing applicants across all ${filteredJobsList.length} requisitions`
              : `Reviewing candidates for ${getSelectedRequisitionTitle()} (${requisitionApplicants.length} applicants)`}
          </p>
        </div>

        {/* Right Side Header Controls: Pod Selector Popover, Requisition Selector, Export, Refresh */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Pod Selector Popover (All Pods Dropdown) */}
          {availablePods.length > 0 && (
            <div className="relative" ref={podPickerRef}>
              <button
                type="button"
                onClick={() => setIsPodPickerOpen(!isPodPickerOpen)}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-800 text-xs font-semibold shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all cursor-pointer max-w-[220px] sm:max-w-[260px]"
              >
                <Layers className="w-3.5 h-3.5 text-[#5C59E8] shrink-0" />
                <span className="truncate">
                  {selectedPodFilter === 'ALL'
                    ? `All Pods (${availablePods.length})`
                    : `Pod: ${selectedPodFilter}`}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isPodPickerOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Pods Search & List Dropdown */}
              {isPodPickerOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-slate-200/80 rounded-2xl shadow-xl z-50 p-2 text-xs animate-in fade-in">
                  {availablePods.length > 3 && (
                    <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50 rounded-xl mb-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input 
                        type="text"
                        placeholder={`Search ${availablePods.length} pods...`}
                        value={podSearchQuery}
                        onChange={(e) => setPodSearchQuery(e.target.value)}
                        className="w-full bg-transparent border-none text-xs outline-none text-slate-800 placeholder-slate-400 font-medium"
                        autoFocus
                      />
                      {podSearchQuery && (
                        <button onClick={() => setPodSearchQuery('')} className="p-0.5 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}

                  <div className="max-h-72 overflow-y-auto py-1 divide-y divide-slate-100">
                    <button
                      type="button"
                      onClick={() => { setSelectedPodFilter('ALL'); setSelectedJobFilter('ALL'); setIsPodPickerOpen(false); }}
                      className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition-colors border-none cursor-pointer ${
                        selectedPodFilter === 'ALL' 
                          ? 'bg-[#5C59E8]/10 text-[#4845D2] font-semibold' 
                          : 'hover:bg-slate-50 text-slate-700 bg-transparent font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#5C59E8]" />
                        <div>
                          <div className="font-semibold text-xs">All Hiring Pods</div>
                          <div className="text-[10px] text-slate-400">All {availablePods.length} pods & groups overview</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-[#5C59E8]/15 text-[#4845D2] font-semibold text-[11px]">
                        {allApplications.length}
                      </span>
                    </button>

                    {filteredPodsList.map(pod => {
                      const podJobs = jobsList.filter(j => j.group_name === pod);
                      const podJobIds = new Set(podJobs.map(j => String(j.id)));
                      const podAppCount = allApplications.filter(a => podJobIds.has(String(a.job_id))).length;
                      const isSelected = selectedPodFilter === pod;

                      return (
                        <button
                          key={pod}
                          type="button"
                          onClick={() => { setSelectedPodFilter(pod); setSelectedJobFilter('ALL'); setIsPodPickerOpen(false); }}
                          className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition-colors border-none cursor-pointer ${
                            isSelected 
                              ? 'bg-[#5C59E8]/10 text-[#4845D2] font-semibold' 
                              : 'hover:bg-slate-50 text-slate-700 bg-transparent font-medium'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="font-semibold text-xs truncate text-slate-900">{pod}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5 truncate">{podJobs.length} requisition{podJobs.length !== 1 ? 's' : ''}</div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                            podAppCount > 0 ? 'bg-[#5C59E8]/15 text-[#4845D2]' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {podAppCount}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick reset pod filter button */}
          {selectedPodFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => { setSelectedPodFilter('ALL'); setSelectedJobFilter('ALL'); }}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
              title="Reset to All Pods"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Requisition Selector Popover */}
          <div className="relative" ref={jobPickerRef}>
            <button
              type="button"
              onClick={() => setIsJobPickerOpen(!isJobPickerOpen)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-800 text-xs font-semibold shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all cursor-pointer max-w-[260px] sm:max-w-[320px]"
            >
              <Briefcase className="w-3.5 h-3.5 text-[#5C59E8] shrink-0" />
              <span className="truncate">
                {selectedJobFilter === 'ALL'
                  ? 'All Requisitions'
                  : getSelectedRequisitionTitle()}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isJobPickerOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Requisitions Search Dropdown */}
            {isJobPickerOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200/80 rounded-2xl shadow-xl z-50 p-2 text-xs animate-in fade-in">
                <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50 rounded-xl mb-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input 
                    type="text"
                    placeholder={`Search ${jobsList.length} roles...`}
                    value={jobSearchQuery}
                    onChange={(e) => setJobSearchQuery(e.target.value)}
                    className="w-full bg-transparent border-none text-xs outline-none text-slate-800 placeholder-slate-400 font-medium"
                    autoFocus
                  />
                  {jobSearchQuery && (
                    <button onClick={() => setJobSearchQuery('')} className="p-0.5 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto py-1 divide-y divide-slate-100">
                  <button
                    type="button"
                    onClick={() => { handleFilterChange('ALL'); setIsJobPickerOpen(false); }}
                    className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition-colors border-none cursor-pointer ${
                      selectedJobFilter === 'ALL' 
                        ? 'bg-[#5C59E8]/10 text-[#4845D2] font-semibold' 
                        : 'hover:bg-slate-50 text-slate-700 bg-transparent font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#5C59E8]" />
                      <div>
                        <div className="font-semibold text-xs">All Requisitions</div>
                        <div className="text-[10px] text-slate-400">All {jobsList.length} roles overview</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#5C59E8]/15 text-[#4845D2] font-semibold text-[11px]">
                      {allApplications.length}
                    </span>
                  </button>

                  {filteredJobsList.map(job => {
                    const count = allApplications.filter(a => String(a.job_id) === String(job.id)).length;
                    const isSelected = String(selectedJobFilter) === String(job.id);
                    return (
                      <button
                        key={job.id}
                        type="button"
                        onClick={() => { handleFilterChange(String(job.id)); setIsJobPickerOpen(false); }}
                        className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition-colors border-none cursor-pointer ${
                          isSelected 
                            ? 'bg-[#5C59E8]/10 text-[#4845D2] font-semibold' 
                            : 'hover:bg-slate-50 text-slate-700 bg-transparent font-medium'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-xs truncate text-slate-900">{job.title}</span>
                            {job.group_name && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
                                {job.group_name}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate">{job.work_mode || 'Full-time'} • {job.location || 'India'}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                          count > 0 ? 'bg-[#5C59E8]/15 text-[#4845D2]' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {selectedJobFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => handleFilterChange('ALL')}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
              title="Reset to All Jobs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Export PDF Button */}
          {sortedApplicants.length > 0 && (
            <button
              type="button"
              onClick={() => handleOpenPdfPreviewModal('all', null, sortedApplicants)}
              className="px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-[0_1px_2px_rgba(15,23,42,0.08)] flex items-center gap-1.5 cursor-pointer border-none"
              title={`Export ${sortedApplicants.length} applicants in PDF format`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF ({sortedApplicants.length})</span>
            </button>
          )}

          {/* Refresh Button */}
          <button
            type="button"
            onClick={loadData}
            title="Refresh pipeline"
            className="p-2.5 rounded-xl border border-slate-200/80 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#5C59E8]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 px-4 rounded-xl bg-slate-900 text-white text-xs font-medium flex items-center justify-between shadow-xl animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage('')} className="text-slate-400 hover:text-white border-none bg-transparent cursor-pointer p-0.5">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── 2. Unified Pipeline & Search Command Card ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] space-y-3.5">
        
        {/* Top Row: Search, Sort & View Modes */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Search Input */}
          <div className="flex items-center gap-2 flex-1 max-w-md bg-white border border-slate-200/90 rounded-xl px-3.5 py-2 focus-within:border-[#5C59E8] focus-within:ring-2 focus-within:ring-[#5C59E8]/10 transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input 
              type="text"
              placeholder="Search by candidate name, skills, title, email..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full bg-transparent border-none text-xs outline-none text-slate-800 placeholder-slate-400 font-medium"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="p-0.5 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="font-semibold text-[10px] uppercase text-slate-400">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200/90 text-xs font-semibold text-slate-700 bg-white cursor-pointer outline-none focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)]"
              >
                <option value="best_match">🏆 Best Match (AI)</option>
                <option value="newest">Newest Applied</option>
                <option value="oldest">Oldest Applied</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
              </select>
            </div>

            {/* View Mode Toggle: Data Grid | Split Review */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/70">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border-none cursor-pointer ${
                  viewMode === 'table' 
                    ? 'bg-white text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.06)]' 
                    : 'text-slate-500 hover:text-slate-800 bg-transparent'
                }`}
                title="Data Grid (Table)"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border-none cursor-pointer ${
                  viewMode === 'split' 
                    ? 'bg-white text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.06)]' 
                    : 'text-slate-500 hover:text-slate-800 bg-transparent'
                }`}
                title="Split Review (Dossier)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Split</span>
              </button>
            </div>

            {/* Page Size */}
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="px-2.5 py-2 rounded-xl border border-slate-200/90 text-xs font-semibold text-slate-600 bg-white cursor-pointer outline-none focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)]"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Subtle Divider */}
        <div className="border-t border-slate-100" />

        {/* Bottom Row: Pipeline Stages & AI Top-Match Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Stage Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {[
              { key: 'ALL', label: 'All', count: stageCounts.ALL },
              { key: 'APPLIED', label: 'Applied', count: stageCounts.APPLIED },
              { key: 'UNDER_REVIEW', label: 'Under Review', count: stageCounts.UNDER_REVIEW },
              { key: 'SHORTLISTED', label: 'Shortlisted', count: stageCounts.SHORTLISTED },
              { key: 'REJECTED', label: 'Rejected', count: stageCounts.REJECTED },
            ].map(st => {
              const isActive = selectedStageFilter === st.key;
              return (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => { setSelectedStageFilter(st.key); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border ${
                    isActive 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.1)]' 
                      : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
                  }`}
                >
                  <span>{st.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : 'bg-slate-200/80 text-slate-700'
                  }`}>
                    {st.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* AI Top Match Widget */}
          {selectedJobFilter !== 'ALL' && (
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
              {aiTopMode ? (
                <div className="flex items-center gap-1.5 bg-[#5C59E8]/10 border border-[#5C59E8]/20 px-2.5 py-1 rounded-xl">
                  <Trophy className="w-3.5 h-3.5 text-[#5C59E8]" />
                  <span className="text-xs font-semibold text-[#4845D2]">
                    Top {aiTopCandidates?.length || 0} Best Fit
                  </span>
                  <button
                    type="button"
                    onClick={handleExitTopMode}
                    className="ml-1 p-0.5 text-slate-400 hover:text-slate-700 border-none bg-transparent cursor-pointer"
                    title="Exit AI Mode"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-[#5C59E8]/8 border border-[#5C59E8]/15 rounded-xl px-2.5 py-1">
                  <Crown className="w-3.5 h-3.5 text-[#5C59E8]" />
                  <span className="text-xs font-semibold text-[#4845D2]">Top</span>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={aiTopN}
                    onChange={(e) => setAiTopN(Math.max(1, Math.min(500, parseInt(e.target.value) || 10)))}
                    className="w-12 text-center bg-white border border-[#5C59E8]/20 rounded-lg text-xs font-semibold text-slate-800 py-0.5 outline-none focus:border-[#5C59E8]"
                  />
                  <button
                    type="button"
                    onClick={handleShowTopN}
                    disabled={aiLoading}
                    className="px-2.5 py-1 rounded-lg bg-[#5C59E8] hover:bg-[#4845D2] text-white text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer border-none disabled:opacity-50"
                  >
                    <Sparkles className={`w-3 h-3 ${aiLoading ? 'animate-spin' : ''}`} />
                    <span>{aiLoading ? 'Ranking...' : 'Rank'}</span>
                  </button>
                </div>
              )}

              {/* Re-Rank All Button */}
              <button
                type="button"
                onClick={handleRescore}
                disabled={rescoring}
                title="Re-calculate AI scores for this requisition"
                className="px-2.5 py-1.5 rounded-xl border border-slate-200/80 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer bg-white disabled:opacity-50 shadow-[0_1px_2px_rgba(15,23,42,0.02)]"
              >
                <RefreshCw className={`w-3 h-3 ${rescoring ? 'animate-spin text-[#5C59E8]' : ''}`} />
                <span className="hidden sm:inline">{rescoring ? 'Scoring...' : 'Re-Score'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── 6. Bulk Actions Bar (Appears when candidates are selected) ── */}
      {selectedCandidateIds.size > 0 && (
        <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2 font-bold text-xs">
            <CheckSquare className="w-4 h-4 text-[#00a884]" />
            <span>{selectedCandidateIds.size} Candidate{selectedCandidateIds.size === 1 ? '' : 's'} Selected</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            {!isReadOnly && (
              <>
                <span className="text-slate-400 text-[0.68rem] font-bold">Screening Decisions:</span>
                <button
                  type="button"
                  disabled={statusUpdating}
                  onClick={() => handleBulkStatusChange('UNDER_REVIEW')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold border border-slate-700 cursor-pointer"
                >
                  Under Review
                </button>
                <button
                  type="button"
                  disabled={statusUpdating}
                  onClick={() => handleBulkStatusChange('SHORTLISTED')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 font-bold border border-slate-700 cursor-pointer"
                >
                  Shortlist Candidates ⭐
                </button>
                <button
                  type="button"
                  disabled={statusUpdating}
                  onClick={() => handleBulkStatusChange('REJECTED')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold border border-slate-700 cursor-pointer"
                >
                  Disqualify / Reject
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => {
                const selectedList = allApplications.filter(a => selectedCandidateIds.has(a.id));
                handleOpenPdfPreviewModal('all', null, selectedList);
              }}
              className="px-3 py-1 rounded-lg bg-[#00a884] hover:bg-teal-600 text-white font-bold border-none cursor-pointer flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Selected ({selectedCandidateIds.size}) PDF</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedCandidateIds(new Set())}
              className="px-2 py-1 text-slate-400 hover:text-white font-semibold border-none bg-transparent cursor-pointer"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* ── 7. Main Pipeline Workspace Content Area ── */}
      {loading ? (
        <div className="py-20 text-center bg-white border border-slate-200/80 rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-[#5C59E8] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500">Loading candidate applications...</p>
        </div>
      ) : sortedApplicants.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="w-12 h-12 rounded-2xl bg-[#5C59E8]/10 text-[#4845D2] flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 m-0">
            {searchQuery 
              ? `No applicants match "${searchQuery}"`
              : (selectedStageFilter !== 'ALL' 
                  ? `No applicants in stage "${selectedStageFilter.replace(/_/g, ' ')}"`
                  : 'No Applicants for this Requisition')}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
            {searchQuery
              ? 'Try adjusting your search terms, clearing filters, or switching requisitions.'
              : 'As candidates apply to this requisition, they will be automatically ingested into this live pipeline.'}
          </p>
          {(searchQuery || selectedStageFilter !== 'ALL' || selectedJobFilter !== 'ALL') && (
            <div className="mt-4 flex items-center justify-center gap-2">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border-none cursor-pointer"
                >
                  Clear Search
                </button>
              )}
              {selectedStageFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setSelectedStageFilter('ALL')}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border-none cursor-pointer"
                >
                  Show All Stages
                </button>
              )}
              {selectedJobFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => handleFilterChange('ALL')}
                  className="px-3 py-1.5 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-bold border-none cursor-pointer"
                >
                  View All Requisitions
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* MODE 1: SPLIT REVIEW VIEW (Left List + Right Detailed Dossier)   */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {viewMode === 'split' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              
              {/* Left Column: Paginated Candidate Roster (4.5 cols) */}
              <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col">
                <div className="px-4 py-3 border-b border-slate-200/80 bg-slate-50/70 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleSelectAll(paginatedApplicants)}
                      className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0"
                      title="Select all on this page"
                    >
                      {paginatedApplicants.every(c => selectedCandidateIds.has(c.id)) ? (
                        <CheckSquare className="w-4 h-4 text-[#00a884]" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                    <span className="text-[0.68rem] font-extrabold text-slate-600 uppercase tracking-wider">
                      Applicants ({sortedApplicants.length})
                    </span>
                  </div>
                  <span className="text-[0.65rem] font-bold text-slate-400">
                    Page {safePage} of {totalPages}
                  </span>
                </div>

                <div className="divide-y divide-slate-100 max-h-[720px] overflow-y-auto">
                  {paginatedApplicants.map(app => {
                    const c = app.candidate || {};
                    const isSelected = selectedApp?.id === app.id;
                    const isChecked = selectedCandidateIds.has(app.id);
                    const nextStage = getNextStage(app.status);
                    const nextStageLabel = getNextStageLabel(app.status);

                    return (
                      <div
                        key={app.id}
                        onClick={() => handleSelectApp(app)}
                        className={`p-3.5 cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-teal-50/70 border-l-4 border-[#00a884]' 
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Checkbox */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelectCandidate(app.id);
                              }}
                              className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0 shrink-0"
                            >
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-[#00a884]" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-300" />
                              )}
                            </button>

                            {/* Avatar */}
                            {c.avatar_url ? (
                              <img src={c.avatar_url} alt={c.full_name} className="w-10 h-10 rounded-full object-cover shrink-0 border border-teal-500" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                                {(c.full_name || 'C').charAt(0).toUpperCase()}
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">
                                {c.full_name || 'Candidate'}
                              </div>
                              <div className="text-[0.68rem] text-[#00a884] font-bold truncate">
                                {c.title || 'Applicant'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <ScoreBadge app={app} />
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[0.62rem] font-extrabold border shrink-0 ${getStatusBadge(app.status)}`}>
                              {app.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>

                        {/* Applied Job & Location */}
                        <div className="mt-2 flex items-center justify-between gap-2 text-[0.68rem] text-slate-500 font-medium">
                          <div className="flex items-center gap-1 truncate">
                            <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{app.job_title || 'Position'}</span>
                          </div>
                          {(c.city || c.state) && (
                            <span className="shrink-0 text-slate-400">
                              {c.city || ''}{c.state ? `, ${c.state}` : ''}
                            </span>
                          )}
                        </div>

                        {/* Candidate Skills Pills */}
                        {Array.isArray(c.skills) && c.skills.length > 0 && (
                          <div className="mt-2 flex gap-1 flex-wrap">
                            {c.skills.slice(0, 3).map((sk, skIdx) => (
                              <span key={skIdx} className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[0.62rem] font-medium">
                                {sk}
                              </span>
                            ))}
                            {c.skills.length > 3 && (
                              <span className="text-[0.62rem] text-slate-400">+{c.skills.length - 3}</span>
                            )}
                          </div>
                        )}

                        {/* Bottom Actions Row: 1-Click Advance & PDF Link */}
                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 text-[0.65rem] text-slate-400 font-medium">
                          <span>{app.applied_at ? `Applied ${new Date(app.applied_at).toLocaleDateString()}` : 'Applied recently'}</span>
                          
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            {!isReadOnly && nextStage && (
                              <button
                                type="button"
                                disabled={statusUpdating}
                                onClick={() => handleStatusChange(app.id, nextStage)}
                                className="text-[0.65rem] font-extrabold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md border border-blue-200 transition-colors cursor-pointer flex items-center gap-1"
                                title={`Advance stage to ${nextStage.replace(/_/g, ' ')}`}
                              >
                                <span>{nextStageLabel}</span>
                                <ArrowRight className="w-2.5 h-2.5" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleOpenPdfPreviewModal('single', app)}
                              className="text-[0.68rem] font-bold text-[#00a884] hover:underline flex items-center gap-1 border-none bg-transparent cursor-pointer p-0"
                              title="View candidate info in official PDF format"
                            >
                              <FileText className="w-3 h-3" />
                              <span>PDF Info</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Full Candidate Dossier & Evaluation (7.5 cols) */}
              {selectedApp ? (
                <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] space-y-6">
                  
                  {/* Candidate Identity Header */}
                  <div className="flex justify-between items-start flex-wrap gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-4 min-w-0">
                      {selectedApp.candidate?.avatar_url ? (
                        <img 
                          src={selectedApp.candidate.avatar_url} 
                          alt={selectedApp.candidate.full_name} 
                          className="w-16 h-16 rounded-full object-cover border-2 border-[#00a884] shadow-xs shrink-0" 
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xl shrink-0 border-2 border-[#00a884]">
                          {(selectedApp.candidate?.full_name || 'C').charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-xl font-black text-slate-900">
                            {selectedApp.candidate?.full_name}
                          </h2>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${getStatusBadge(selectedApp.status)}`}>
                            {selectedApp.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs font-bold text-[#00a884]">
                            {selectedApp.candidate?.title || 'Applicant Profile'}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200/70">
                            <Briefcase className="w-3 h-3 text-slate-400" />
                            Applied: {selectedApp.job_title}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-2 flex-wrap">
                          {selectedApp.candidate?.phone && (
                            <span className="flex items-center gap-1 font-medium">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              {selectedApp.candidate?.phone}
                            </span>
                          )}
                          {selectedApp.candidate?.email && (
                            <span className="flex items-center gap-1 font-medium">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              {selectedApp.candidate?.email}
                            </span>
                          )}
                          {(selectedApp.candidate?.city || selectedApp.candidate?.state) && (
                            <span className="flex items-center gap-1 font-medium">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {selectedApp.candidate?.city}{selectedApp.candidate?.state ? `, ${selectedApp.candidate?.state}` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Pipeline Stage Quick Changer / Read-Only Badge */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                      <label className="block text-[0.65rem] font-extrabold text-slate-500 mb-1 uppercase tracking-wider">
                        Screening Stage {isReadOnly && '(Read-Only)'}
                      </label>
                      {isReadOnly ? (
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${getStatusBadge(selectedApp.status)}`}>
                          <span className="w-2 h-2 rounded-full bg-current opacity-75" />
                          <span>{selectedApp.status.replace(/_/g, ' ')}</span>
                        </div>
                      ) : (
                        <select
                          disabled={statusUpdating}
                          className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold text-xs outline-none focus:border-black cursor-pointer shadow-2xs"
                          value={['INTERVIEW_SCHEDULED', 'SELECTED', 'HIRED'].includes(selectedApp.status) ? selectedApp.status : selectedApp.status}
                          onChange={(e) => handleStatusChange(selectedApp.id, e.target.value)}
                        >
                          <option value="APPLIED">1. Applied / Inflow</option>
                          <option value="UNDER_REVIEW">2. Under Review</option>
                          <option value="SHORTLISTED">3. Shortlisted</option>
                          <option value="REJECTED">4. Disqualified / Not Shortlisted</option>
                          {selectedApp.status === 'INTERVIEW_SCHEDULED' && (
                            <option value="INTERVIEW_SCHEDULED" disabled>5. Interviewing (Managed in Funnel)</option>
                          )}
                          {['SELECTED', 'HIRED'].includes(selectedApp.status) && (
                            <option value="SELECTED" disabled>5. Hired / Offer (Managed in Funnel)</option>
                          )}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* 1-Click Screening Shortcuts (Hidden for Read-Only) */}
                  {!isReadOnly && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2 flex-wrap text-xs">
                      <span className="text-[0.68rem] font-extrabold text-slate-500 uppercase tracking-wider">
                        Screening Decision:
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          disabled={statusUpdating || selectedApp.status === 'UNDER_REVIEW'}
                          onClick={() => handleStatusChange(selectedApp.id, 'UNDER_REVIEW')}
                          className={`px-2.5 py-1 rounded-lg font-bold border transition-colors cursor-pointer text-xs ${
                            selectedApp.status === 'UNDER_REVIEW' 
                              ? 'bg-amber-100 text-amber-900 border-amber-300' 
                              : 'bg-white hover:bg-amber-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          Review
                        </button>
                        <button
                          type="button"
                          disabled={statusUpdating || selectedApp.status === 'SHORTLISTED'}
                          onClick={() => handleStatusChange(selectedApp.id, 'SHORTLISTED')}
                          className={`px-2.5 py-1 rounded-lg font-bold border transition-colors cursor-pointer text-xs ${
                            selectedApp.status === 'SHORTLISTED' 
                              ? 'bg-blue-100 text-blue-900 border-blue-300' 
                              : 'bg-white hover:bg-blue-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          Shortlist ⭐
                        </button>
                        <button
                          type="button"
                          disabled={statusUpdating || selectedApp.status === 'REJECTED'}
                          onClick={() => handleStatusChange(selectedApp.id, 'REJECTED')}
                          className={`px-2.5 py-1 rounded-lg font-bold border transition-colors cursor-pointer text-xs ${
                            selectedApp.status === 'REJECTED' 
                              ? 'bg-rose-100 text-rose-900 border-rose-300' 
                              : 'bg-white hover:bg-rose-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Shortlisted Badge */}
                  {selectedApp.status === 'SHORTLISTED' && (
                    <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200/80 flex items-center gap-3 shadow-2xs">
                      <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Sparkles className="w-4 h-4" />
                      </span>
                      <div>
                        <h4 className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                          <span>Candidate is Shortlisted</span>
                          <span className="px-1.5 py-0.2 rounded bg-blue-200 text-blue-900 text-[0.62rem] font-extrabold uppercase">Qualified</span>
                        </h4>
                        <p className="text-[0.7rem] text-blue-800/90 mt-0.5 leading-relaxed">
                          Initial screening review complete. Candidate is qualified and shortlisted.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* AI Fit Score & Dimensional Analysis Dossier */}
                  {selectedApp.fit_score != null && (() => {
                    const score = selectedApp.fit_score;
                    const breakdown = selectedApp.fit_breakdown?.breakdown || {};
                    const highlights = selectedApp.fit_breakdown?.highlights || [];
                    const gaps = selectedApp.fit_breakdown?.gaps || [];
                    const colors = getScoreColor(score);
                    
                    const tierLabel = 
                      score >= 85 ? 'Outstanding Match' :
                      score >= 70 ? 'Strong Match' :
                      score >= 50 ? 'Moderate Potential' : 'Developing Match';

                    const dimensions = [
                      { label: 'Skills Match', weight: '30%', val: breakdown.skills || 0, icon: Target },
                      { label: 'Experience Depth', weight: '25%', val: breakdown.experience || 0, icon: Briefcase },
                      { label: 'Role Relevance', weight: '20%', val: breakdown.relevance || 0, icon: TrendingUp },
                      { label: 'Education Quality', weight: '10%', val: breakdown.education || 0, icon: GraduationCap },
                      { label: 'Seniority & Growth', weight: '10%', val: breakdown.seniority || 0, icon: Award },
                      { label: 'Profile Completeness', weight: '5%', val: breakdown.completeness || 0, icon: ShieldCheck },
                    ];

                    return (
                      <div className="bg-gradient-to-br from-violet-50/70 via-purple-50/40 to-slate-50 border border-violet-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-violet-100">
                          <div className="flex items-center gap-2.5">
                            <span className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center font-bold shadow-xs">
                              <Brain className="w-5 h-5" />
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-black text-slate-900">AI Role-Fit Analysis</h3>
                                <span className={`px-2 py-0.5 rounded-full text-[0.65rem] font-extrabold border ${colors.bg} ${colors.text} ${colors.border}`}>
                                  {tierLabel}
                                </span>
                              </div>
                              <p className="text-[0.68rem] text-slate-500 mt-0.5">
                                Multi-signal scoring across 6 dimensions vs. job requirements
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider">Overall Fit</div>
                              <div className="text-2xl font-black text-slate-900 flex items-center justify-end gap-1">
                                <Zap className="w-4 h-4 text-violet-600 fill-violet-600" />
                                <span>{score}%</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 6 Dimensions Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {dimensions.map((dim, idx) => {
                            const DimIcon = dim.icon;
                            return (
                              <div key={idx} className="bg-white/80 border border-violet-100/80 rounded-xl p-2.5 shadow-2xs">
                                <div className="flex items-center justify-between text-[0.65rem] mb-1">
                                  <span className="flex items-center gap-1 font-bold text-slate-600">
                                    <DimIcon className="w-3 h-3 text-violet-500" />
                                    {dim.label}
                                  </span>
                                  <span className="font-black text-slate-900">{Math.round(dim.val)}%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="bg-gradient-to-r from-violet-500 to-indigo-600 h-1.5 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, Math.max(0, dim.val))}%` }}
                                  />
                                </div>
                                <div className="text-[0.58rem] text-slate-400 font-semibold mt-1 text-right">
                                  weight {dim.weight}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Highlights & Gaps */}
                        {(highlights.length > 0 || gaps.length > 0) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            {highlights.length > 0 && (
                              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3">
                                <div className="text-[0.68rem] font-black text-emerald-800 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  Key Strengths
                                </div>
                                <ul className="space-y-1">
                                  {highlights.map((h, i) => (
                                    <li key={i} className="text-[0.68rem] text-emerald-900 font-medium flex items-start gap-1.5">
                                      <span className="text-emerald-500 font-bold">•</span>
                                      <span>{h}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {gaps.length > 0 && (
                              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3">
                                <div className="text-[0.68rem] font-black text-amber-800 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                  Identified Gaps
                                </div>
                                <ul className="space-y-1">
                                  {gaps.map((g, i) => (
                                    <li key={i} className="text-[0.68rem] text-amber-900 font-medium flex items-start gap-1.5">
                                      <span className="text-amber-500 font-bold">•</span>
                                      <span>{g}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Professional Summary */}
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                      Professional Summary
                    </h4>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {selectedApp.candidate?.summary || 'Candidate has submitted their profile for consideration.'}
                    </p>
                  </div>

                  {/* Skills & Expertise */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                        Technical & Functional Skills
                      </h4>
                      <div className="flex gap-1.5 flex-wrap">
                        {(selectedApp.candidate?.skills && selectedApp.candidate?.skills.length > 0) ? (
                          selectedApp.candidate.skills.map((sk, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold"
                            >
                              {sk}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No skills listed by candidate.</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                        Candidate Core Expertise
                      </h4>
                      <div className="flex gap-1.5 flex-wrap">
                        {(selectedApp.candidate?.expertise && selectedApp.candidate?.expertise.length > 0) ? (
                          selectedApp.candidate.expertise.map((exp, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-[#00a884] text-xs font-bold"
                            >
                              ★ {exp}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No core expertise specified.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Experience Timeline */}
                  {Array.isArray(selectedApp.candidate?.experience) && selectedApp.candidate?.experience.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                        Professional Work Experience
                      </h4>
                      <div className="space-y-2.5">
                        {selectedApp.candidate.experience.map((exp, i) => (
                          <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                            <div className="flex items-center justify-between font-bold text-slate-900">
                              <span>{exp.title || 'Role'} • {exp.company || 'Company'}</span>
                              <span className="text-[0.68rem] text-slate-500 font-semibold">{exp.duration || ''}</span>
                            </div>
                            <div className="text-[0.68rem] text-slate-500 mt-0.5">{exp.location || ''} {exp.employment_type ? `• ${exp.employment_type}` : ''}</div>
                            {Array.isArray(exp.description) ? (
                              <ul className="list-disc list-inside mt-1.5 space-y-1 text-slate-600 text-[0.68rem]">
                                {exp.description.map((d, dIdx) => (
                                  <li key={dIdx}>{d}</li>
                                ))}
                              </ul>
                            ) : (
                              exp.description && <p className="mt-1 text-slate-600 text-[0.68rem]">{exp.description}</p>
                            )}
                            {Array.isArray(exp.technologies) && exp.technologies.length > 0 && (
                              <div className="flex gap-1 mt-2 flex-wrap">
                                {exp.technologies.map((t, tIdx) => (
                                  <span key={tIdx} className="px-1.5 py-0.2 rounded bg-white text-slate-600 border border-slate-200 text-[0.62rem]">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Academic Qualifications & Certifications */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                        Academic Qualifications
                      </h4>
                      {Array.isArray(selectedApp.candidate?.education) && selectedApp.candidate?.education.length > 0 ? (
                        selectedApp.candidate.education.map((edu, i) => (
                          <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                            <div className="font-bold text-slate-900">{edu.degree || 'Degree'}</div>
                            <div className="text-[0.68rem] text-[#00a884] font-semibold">{edu.institution || ''} {edu.duration ? `• ${edu.duration}` : ''}</div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">No qualifications listed.</p>
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                        Certifications & Accreditations
                      </h4>
                      {(() => {
                        const certs = Array.isArray(selectedApp.candidate?.certifications)
                          ? selectedApp.candidate.certifications.filter(cert => 
                              cert && cert.name &&
                              !cert.name.includes('Meta Certified Front-End') &&
                              !cert.name.includes('Full Stack React & Node') &&
                              !cert.issuer?.includes('Meta Blueprint')
                            )
                          : [];
                        return certs.length > 0 ? (
                          certs.map((cert, i) => (
                            <div key={i} className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/70 text-xs">
                              <div className="font-bold text-slate-900">🏆 {cert.name}</div>
                              <div className="text-[0.68rem] text-amber-800 font-semibold">{cert.issuer} {cert.year ? `• ${cert.year}` : ''}</div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-400 italic">No certifications listed by candidate.</p>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Hiring Preferences Panel */}
                  <div className="bg-purple-50/50 border border-purple-200/80 rounded-xl p-4">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-purple-900 mb-2">
                      Candidate Hiring Preferences
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="block text-[0.65rem] font-bold text-purple-600 uppercase">Work Mode:</span>
                        <span className="font-bold text-purple-950">
                          {selectedApp.candidate?.hiring_preferences?.work_mode || selectedApp.candidate?.hiring_preferences?.work_setup || 'Not specified'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[0.65rem] font-bold text-purple-600 uppercase">Availability:</span>
                        <span className="font-bold text-purple-950">
                          {selectedApp.candidate?.hiring_preferences?.availability || 'Not specified'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[0.65rem] font-bold text-purple-600 uppercase">Desired Compensation:</span>
                        <span className="font-bold text-purple-950">
                          {selectedApp.candidate?.hiring_preferences?.desired_salary || selectedApp.candidate?.hiring_preferences?.expected_ctc || 'Not specified'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cover Letter */}
                  {selectedApp.cover_letter && (
                    <div className="bg-teal-50/50 border border-teal-200/80 rounded-xl p-4">
                      <h4 className="text-[0.65rem] font-extrabold text-teal-800 uppercase tracking-wider mb-1.5">
                        Candidate Note / Cover Letter
                      </h4>
                      <p className="text-xs text-teal-950 italic leading-relaxed">
                        "{selectedApp.cover_letter}"
                      </p>
                    </div>
                  )}

                  {/* Candidate Screening Answers */}
                  {Array.isArray(selectedApp.screening_answers) && selectedApp.screening_answers.length > 0 && (
                    <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-2xl p-4 sm:p-5 space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                            <HelpCircle className="w-3.5 h-3.5" />
                          </span>
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                            Candidate Screening Responses
                          </h4>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                          {selectedApp.screening_answers.length} answered
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {selectedApp.screening_answers.map((ans, idx) => (
                          <div key={idx} className="bg-white border border-indigo-100/90 rounded-xl p-3.5 shadow-2xs space-y-2">
                            <div className="flex items-start gap-2">
                              <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-700 flex items-center justify-center text-[10px] font-extrabold shrink-0 mt-0.5 border border-indigo-200/60">
                                Q{idx + 1}
                              </span>
                              <p className="text-xs font-bold text-slate-800 leading-snug">
                                {ans.question || `Screening Question ${idx + 1}`}
                              </p>
                            </div>
                            <div className="ml-7 p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-xs font-semibold text-slate-900">
                              {ans.answer ? (
                                <span className="text-indigo-950 font-bold">{ans.answer}</span>
                              ) : (
                                <span className="text-slate-400 italic">No answer provided</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions: PDF Export & Resume & Portfolio */}
                  <div className="flex items-center gap-2.5 pt-4 border-t border-slate-100 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleOpenPdfPreviewModal('single', selectedApp)}
                      className="px-4 py-2 bg-[#00a884] hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 border-none cursor-pointer"
                      title="View and download candidate info in official PDF format"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export Dossier (PDF)</span>
                    </button>

                    {selectedApp.candidate?.resume_url ? (
                      <a
                        href={selectedApp.candidate.resume_url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => {
                          if (selectedApp.candidate?.id) {
                            api.recordCandidateView(selectedApp.candidate.id).catch(() => {});
                          }
                        }}
                        className="px-4 py-2 bg-black hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 no-underline"
                      >
                        <FileText className="w-4 h-4" /> View Resume Document
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => showToast('Candidate has not attached a standalone PDF resume yet.')}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 border border-slate-200 cursor-pointer"
                      >
                        <FileText className="w-4 h-4" /> Resume (Standard Profile)
                      </button>
                    )}

                    {selectedApp.candidate?.portfolio_url && (
                      <a
                        href={selectedApp.candidate.portfolio_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 no-underline bg-white shadow-2xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" /> View Portfolio
                      </a>
                    )}
                  </div>

                </div>
              ) : (
                <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-400 text-xs shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                  Select a candidate from the left list to review their complete dossier and qualifications.
                </div>
              )}

            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* MODE 2: HIGH-DENSITY DATA GRID TABLE VIEW                          */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {viewMode === 'table' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-200/70 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                      <th className="p-3.5 w-10 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectAll(paginatedApplicants)}
                          className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0"
                        >
                          {paginatedApplicants.every(c => selectedCandidateIds.has(c.id)) ? (
                            <CheckSquare className="w-4 h-4 text-[#00a884]" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </th>
                      <th className="p-3.5">Candidate</th>
                      <th className="p-3.5">Applied Position</th>
                      <th className="p-3.5 text-center">AI Fit</th>
                      <th className="p-3.5">Skills & Qualifications</th>
                      <th className="p-3.5">Recruitment Stage</th>
                      <th className="p-3.5">Applied Date</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {paginatedApplicants.map(app => {
                      const c = app.candidate || {};
                      const isChecked = selectedCandidateIds.has(app.id);

                      return (
                        <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => toggleSelectCandidate(app.id)}
                              className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0"
                            >
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-[#00a884]" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-300" />
                              )}
                            </button>
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-2.5">
                              {c.avatar_url ? (
                                <img src={c.avatar_url} alt={c.full_name} className="w-8 h-8 rounded-full object-cover shrink-0 border border-teal-500" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                                  {(c.full_name || 'C').charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-extrabold text-slate-900 truncate">
                                  {c.full_name || 'Candidate'}
                                </div>
                                <div className="text-[0.68rem] text-slate-500 truncate">
                                  {c.email || c.phone || 'No direct contact'}
                                </div>
                                {Array.isArray(app.screening_answers) && app.screening_answers.length > 0 && (
                                  <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200/80 w-fit">
                                    <HelpCircle className="w-2.5 h-2.5" />
                                    <span>{app.screening_answers.length} Screening Q&A</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-slate-800">{app.job_title}</div>
                            <div className="text-[0.68rem] text-slate-400">
                              {app.job_location || 'India'} • {app.job_work_mode || 'Full-time'}
                            </div>
                          </td>
                          <td className="p-3.5 text-center">
                            <ScoreBadge app={app} />
                          </td>
                          <td className="p-3.5">
                            <div className="flex gap-1 flex-wrap max-w-xs">
                              {Array.isArray(c.skills) && c.skills.length > 0 ? (
                                c.skills.slice(0, 3).map((sk, idx) => (
                                  <span key={idx} className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[0.62rem] font-semibold">
                                    {sk}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-400 italic text-[0.68rem]">Standard qualifications</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5">
                            {isReadOnly ? (
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusBadge(app.status)}`}>
                                {app.status.replace(/_/g, ' ')}
                              </span>
                            ) : (
                              <select
                                disabled={statusUpdating}
                                value={['INTERVIEW_SCHEDULED', 'SELECTED', 'HIRED'].includes(app.status) ? app.status : app.status}
                                onChange={(e) => handleStatusChange(app.id, e.target.value)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold border outline-none cursor-pointer ${getStatusBadge(app.status)}`}
                              >
                                <option value="APPLIED">Applied</option>
                                <option value="UNDER_REVIEW">Under Review</option>
                                <option value="SHORTLISTED">Shortlisted</option>
                                <option value="REJECTED">Screening Rejected</option>
                                {app.status === 'INTERVIEW_SCHEDULED' && (
                                  <option value="INTERVIEW_SCHEDULED" disabled>Interviewing (Funnel)</option>
                                )}
                                {['SELECTED', 'HIRED'].includes(app.status) && (
                                  <option value="SELECTED" disabled>Hired / Offer (Funnel)</option>
                                )}
                              </select>
                            )}
                          </td>
                          <td className="p-3.5 text-slate-500 text-[0.68rem] font-medium">
                            {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'Recent'}
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => { handleSelectApp(app); setViewMode('split'); }}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors bg-white cursor-pointer"
                                title="View candidate dossier"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenPdfPreviewModal('single', app)}
                                className="p-1.5 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 text-[#00a884] transition-colors cursor-pointer"
                                title="Export candidate info as PDF dossier"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                              {c.resume_url && (
                                <a
                                  href={c.resume_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={() => {
                                    if (c.id) {
                                      api.recordCandidateView(c.id).catch(() => {});
                                    }
                                  }}
                                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors bg-white inline-flex items-center"
                                  title="Download uploaded resume file"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── 8. High-Volume Pagination Controls (For 300+ Applicants) ── */}
          {totalPages > 1 && (
            <div className="bg-white border border-slate-200/80 rounded-2xl px-4 py-3 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-slate-500 font-medium">
                Showing <strong className="text-slate-900">{startIndex + 1}</strong> to <strong className="text-slate-900">{Math.min(startIndex + pageSize, sortedApplicants.length)}</strong> of <strong className="text-slate-900">{sortedApplicants.length}</strong> applicants
                {selectedStageFilter !== 'ALL' && <span className="ml-1 text-slate-400 font-bold">({selectedStageFilter.replace(/_/g, ' ')})</span>}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-slate-700 bg-white flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>

                <div className="flex items-center gap-1">
                  {getPageNumbers(safePage, totalPages).map((p, idx) => (
                    p === '...' ? (
                      <span key={`dots-${idx}`} className="px-1 text-slate-400 font-bold">...</span>
                    ) : (
                      <button
                        key={`page-${p}`}
                        type="button"
                        onClick={() => setCurrentPage(p)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center cursor-pointer border transition-colors ${
                          safePage === p 
                            ? 'bg-[#00a884] text-white border-[#00a884] shadow-xs' 
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  ))}
                </div>

                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-slate-700 bg-white flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

        </>
      )}

      {/* ─── OFFICIAL PDF PREVIEW & DOWNLOAD MODAL ─── */}
      {pdfModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            
            {/* Modal Action Header Bar */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-[#00a884] text-white flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-white">
                    {pdfModalData.type === 'single' 
                      ? `Candidate Application Dossier (PDF)` 
                      : `All Applicants Requisition Dossier (PDF)`}
                  </h3>
                  <p className="text-[0.68rem] text-slate-400">
                    {pdfModalData.type === 'single'
                      ? `${pdfModalData.app?.candidate?.full_name || 'Candidate'} • ${pdfModalData.app?.job_title}`
                      : `${pdfModalData.jobTitle} • ${pdfModalData.apps.length} Total Applicants`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (pdfModalData.type === 'single') {
                      handleExportCandidatePdf(pdfModalData.app);
                    } else {
                      handleExportAllPdf(pdfModalData.apps, pdfModalData.jobTitle);
                    }
                  }}
                  className="px-4 py-2 bg-[#00a884] hover:bg-teal-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 border-none cursor-pointer"
                  title="Save or Print as PDF file"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Save as PDF / Print</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPdfModalData(null)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors border-none bg-transparent cursor-pointer"
                  title="Close PDF preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body - Rendered Document Preview */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-100/70 no-scrollbar scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <div 
                ref={printContainerRef}
                className="max-w-2xl mx-auto bg-white p-8 sm:p-10 rounded-xl border border-slate-200/80 shadow-lg text-slate-800"
              >
                {pdfModalData.type === 'single' ? (
                  <div className="space-y-5">
                    {/* Header */}
                    <div className="flex items-start justify-between pb-4 border-b-2 border-[#00a884]">
                      <div>
                        <div className="text-xl font-black text-slate-900 tracking-tight">UPTRIX TALENT PLATFORM</div>
                        <div className="text-[0.68rem] font-extrabold text-[#00a884] uppercase tracking-wider mt-0.5">
                          Official Candidate Application Dossier
                        </div>
                      </div>
                      <div className="text-right text-[0.68rem] text-slate-400 font-semibold">
                        <div>Ref: APP-00{pdfModalData.app?.id}</div>
                        <div>Date: {pdfModalData.app?.applied_at ? new Date(pdfModalData.app?.applied_at).toLocaleDateString() : 'Recent'}</div>
                      </div>
                    </div>

                    {/* 1. Candidate Full Name, Title, and Badge */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-xl font-extrabold text-slate-900">
                            {pdfModalData.app?.candidate?.full_name || 'Candidate'}
                          </h2>
                          <p className="text-xs font-bold text-[#00a884] mt-0.5">
                            {pdfModalData.app?.candidate?.title || 'Applicant'}
                          </p>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold border ${getStatusBadge(pdfModalData.app?.status)}`}>
                          {pdfModalData.app?.status?.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 mt-1.5 font-medium">
                        Applied: <strong className="text-slate-800">{pdfModalData.app?.job_title}</strong> • {pdfModalData.app?.job_location || 'India'}
                      </div>
                    </div>

                    {/* 2. Contact Information: Phone, Email, City, State, Work Mode */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-3 rounded-xl bg-slate-100/70 border border-slate-200 text-xs">
                      <div>
                        <span className="block text-[0.62rem] font-bold text-slate-400 uppercase">Phone Number:</span>
                        <span className="font-bold text-slate-800">{pdfModalData.app?.candidate?.phone || 'On file'}</span>
                      </div>
                      <div>
                        <span className="block text-[0.62rem] font-bold text-slate-400 uppercase">Email Address:</span>
                        <span className="font-semibold text-slate-800 truncate block">{pdfModalData.app?.candidate?.email || 'On file'}</span>
                      </div>
                      <div>
                        <span className="block text-[0.62rem] font-bold text-slate-400 uppercase">City:</span>
                        <span className="font-semibold text-slate-800">{pdfModalData.app?.candidate?.city || 'Hyderabad'}</span>
                      </div>
                      <div>
                        <span className="block text-[0.62rem] font-bold text-slate-400 uppercase">State:</span>
                        <span className="font-semibold text-slate-800">{pdfModalData.app?.candidate?.state || 'Not specified'}</span>
                      </div>
                      <div>
                        <span className="block text-[0.62rem] font-bold text-slate-400 uppercase">Work Mode:</span>
                        <span className="font-semibold text-slate-800">{pdfModalData.app?.candidate?.hiring_preferences?.work_mode || pdfModalData.app?.job_work_mode || 'Not specified'}</span>
                      </div>
                    </div>

                    {/* 3. Professional Summary */}
                    <div className="space-y-1">
                      <div className="text-[0.68rem] font-extrabold text-slate-400 uppercase tracking-wider">
                        Professional Summary
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {pdfModalData.app?.candidate?.summary || 'No professional summary provided by candidate.'}
                      </p>
                    </div>

                    {/* 4. Candidate Expertise ("cadidte experting") */}
                    <div className="space-y-1">
                      <div className="text-[0.68rem] font-extrabold text-slate-400 uppercase tracking-wider">
                        Candidate Core Expertise
                      </div>
                      {(pdfModalData.app?.candidate?.expertise && pdfModalData.app?.candidate?.expertise.length > 0) ? (
                        <div className="flex gap-1.5 flex-wrap">
                          {pdfModalData.app.candidate.expertise.map((exp, i) => (
                            <span key={i} className="px-2.5 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-[0.7rem] font-bold text-[#00a884]">
                              ★ {exp}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No specific areas of expertise listed by candidate.</p>
                      )}
                    </div>

                    {/* 5. Technical Skills */}
                    <div className="space-y-1">
                      <div className="text-[0.68rem] font-extrabold text-slate-400 uppercase tracking-wider">
                        Technical Skills
                      </div>
                      {(pdfModalData.app?.candidate?.skills && pdfModalData.app?.candidate?.skills.length > 0) ? (
                        <div className="flex gap-1.5 flex-wrap">
                          {pdfModalData.app.candidate.skills.map((sk, i) => (
                            <span key={i} className="px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[0.7rem] font-bold text-slate-700">
                              {sk}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No technical skills specified by candidate.</p>
                      )}
                    </div>

                    {/* 6. Hiring Preferences */}
                    <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-xs space-y-2">
                      <div className="text-[0.65rem] font-extrabold text-purple-700 uppercase tracking-wider">
                        Candidate Hiring Preferences
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <div>
                          <span className="block text-[0.62rem] font-bold text-purple-500 uppercase">Preferred Work Mode:</span>
                          <span className="font-bold text-purple-950">
                            {pdfModalData.app?.candidate?.hiring_preferences?.work_mode || pdfModalData.app?.candidate?.hiring_preferences?.work_setup || 'Not specified'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[0.62rem] font-bold text-purple-500 uppercase">Availability / Notice:</span>
                          <span className="font-bold text-purple-950">
                            {pdfModalData.app?.candidate?.hiring_preferences?.availability || 'Not specified'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[0.62rem] font-bold text-purple-500 uppercase">Desired Compensation:</span>
                          <span className="font-bold text-purple-950">
                            {pdfModalData.app?.candidate?.hiring_preferences?.desired_salary || pdfModalData.app?.candidate?.hiring_preferences?.expected_ctc || 'Not specified'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Screening Questions & Answers in PDF Dossier */}
                    {Array.isArray(pdfModalData.app?.screening_answers) && pdfModalData.app.screening_answers.length > 0 && (
                      <div className="space-y-2 p-3 rounded-lg bg-indigo-50/50 border border-indigo-100">
                        <div className="text-[0.68rem] font-extrabold text-indigo-900 uppercase tracking-wider">
                          Candidate Screening Questions & Answers
                        </div>
                        <div className="space-y-2">
                          {pdfModalData.app.screening_answers.map((ans, idx) => (
                            <div key={idx} className="p-2 rounded bg-white border border-indigo-100/70 text-xs">
                              <div className="font-bold text-slate-800">Q{idx + 1}: {ans.question}</div>
                              <div className="font-semibold text-indigo-950 mt-0.5">{ans.answer || 'No answer'}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 7. Work Experience */}
                    <div className="space-y-2">
                      <div className="text-[0.68rem] font-extrabold text-slate-400 uppercase tracking-wider">
                        Work Experience & History
                      </div>
                      {(pdfModalData.app?.candidate?.experience && pdfModalData.app?.candidate?.experience.length > 0) ? (
                        pdfModalData.app.candidate.experience.map((exp, i) => (
                          <div key={i} className="p-3 rounded-lg bg-slate-50 border-l-4 border-slate-900 text-xs">
                            <div className="font-bold text-slate-900">{exp.title} • <span className="text-[#00a884]">{exp.company}</span></div>
                            <div className="text-[0.68rem] text-slate-500">{exp.duration} • {exp.location}</div>
                            <div className="text-slate-700 mt-1">
                              {Array.isArray(exp.description) ? exp.description.map((d, di) => <div key={di}>• {d}</div>) : exp.description}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">No work experience listed by candidate.</p>
                      )}
                    </div>

                    {/* 8. Academic Qualification (Education) */}
                    <div className="space-y-2">
                      <div className="text-[0.68rem] font-extrabold text-slate-400 uppercase tracking-wider">
                        Academic Qualifications & Education
                      </div>
                      {(pdfModalData.app?.candidate?.education && pdfModalData.app?.candidate?.education.length > 0) ? (
                        pdfModalData.app.candidate.education.map((edu, i) => (
                          <div key={i} className="p-3 rounded-lg bg-slate-50 border-l-4 border-sky-600 text-xs">
                            <div className="font-bold text-slate-900">{edu.degree}</div>
                            <div className="text-[0.68rem] text-sky-700 font-semibold">{edu.institution} {edu.grade ? `• Grade: ${edu.grade}%` : ''}</div>
                            {edu.description && <div className="text-slate-600 mt-0.5">{edu.description}</div>}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">No academic qualifications listed by candidate.</p>
                      )}
                    </div>

                    {/* 9. Certifications */}
                    <div className="space-y-2">
                      <div className="text-[0.68rem] font-extrabold text-slate-400 uppercase tracking-wider">
                        Certifications & Accreditations
                      </div>
                      {(() => {
                        const modalCerts = Array.isArray(pdfModalData.app?.candidate?.certifications)
                          ? pdfModalData.app.candidate.certifications.filter(cert => 
                              cert && cert.name &&
                              !cert.name.includes('Meta Certified Front-End') &&
                              !cert.name.includes('Full Stack React & Node') &&
                              !cert.issuer?.includes('Meta Blueprint')
                            )
                          : [];
                        return modalCerts.length > 0 ? (
                          modalCerts.map((cert, i) => (
                            <div key={i} className="p-2.5 rounded-lg bg-amber-50/70 border-l-4 border-amber-500 text-xs">
                              <div className="font-bold text-slate-900">🏆 {cert.name}</div>
                              <div className="text-[0.68rem] text-amber-700 font-semibold">{cert.issuer} {cert.year ? `• ${cert.year}` : ''}</div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-400 italic">No certifications listed by candidate.</p>
                        );
                      })()}
                    </div>

                    {/* 10. Cover Letter (if present) */}
                    {pdfModalData.app?.cover_letter && (
                      <div className="space-y-1">
                        <div className="text-[0.68rem] font-extrabold text-slate-400 uppercase tracking-wider">
                          Candidate Application Note
                        </div>
                        <div className="p-3 bg-teal-50/60 border-l-4 border-[#00a884] rounded-r-xl text-xs text-teal-900 italic leading-relaxed">
                          "{pdfModalData.app?.cover_letter}"
                        </div>
                      </div>
                    )}

                    {/* 11. Scorecard Box */}
                    <div className="p-3.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 space-y-2.5">
                      <div className="text-[0.65rem] font-extrabold text-slate-500 uppercase tracking-wider">
                        Recruiter Evaluation Checklist & Remarks
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-600 font-medium flex-wrap gap-2">
                        <span>[ &nbsp; ] Advance to Screen</span>
                        <span>[ &nbsp; ] Schedule Technical Round</span>
                        <span>[ &nbsp; ] Offer Role</span>
                        <span>[ &nbsp; ] Reject</span>
                      </div>
                      <div className="pt-2 border-b border-dotted border-slate-300" />
                      <div className="pt-2 border-b border-dotted border-slate-300" />
                    </div>

                    {/* 12. Footer */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[0.65rem] text-slate-400">
                      <span>Uptrix Confidential Applicant Dossier</span>
                      <span>Printed from Uptrix Recruitment Portal</span>
                    </div>
                  </div>
                ) : (
                  /* Multiple Applicants Summary Preview */
                  <div className="space-y-6">
                    <div className="flex items-start justify-between pb-4 border-b-2 border-[#00a884]">
                      <div>
                        <div className="text-xl font-black text-slate-900 tracking-tight">UPTRIX TALENT PLATFORM</div>
                        <div className="text-[0.68rem] font-extrabold text-[#00a884] uppercase tracking-wider mt-0.5">
                          All Requisition Applicants Roster
                        </div>
                      </div>
                      <div className="text-right text-[0.68rem] text-slate-400 font-semibold">
                        <div>Requisition: {pdfModalData.jobTitle}</div>
                        <div>Total Applicants: {pdfModalData.apps.length}</div>
                      </div>
                    </div>

                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-[0.65rem] font-bold uppercase text-slate-500">
                          <th className="py-2 px-2.5">#</th>
                          <th className="py-2 px-2.5">Candidate</th>
                          <th className="py-2 px-2.5">Position</th>
                          <th className="py-2 px-2.5">Phone & Location</th>
                          <th className="py-2 px-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pdfModalData.apps.map((a, i) => (
                          <tr key={a.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-2.5 font-bold">{i + 1}</td>
                            <td className="py-2.5 px-2.5">
                              <div className="font-bold text-slate-900">{a.candidate?.full_name || 'Candidate'}</div>
                              <div className="text-[0.65rem] text-[#00a884] font-medium">{a.candidate?.title}</div>
                            </td>
                            <td className="py-2.5 px-2.5 font-medium">{a.job_title}</td>
                            <td className="py-2.5 px-2.5 text-slate-600">
                              <div>{a.candidate?.phone || '-'}</div>
                              <div className="text-[0.65rem] text-slate-400">{a.candidate?.city || ''}{a.candidate?.state ? `, ${a.candidate?.state}` : ''}</div>
                            </td>
                            <td className="py-2.5 px-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-[0.62rem] font-bold border ${getStatusBadge(a.status)}`}>
                                {a.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="p-4 bg-teal-50 rounded-xl text-xs text-teal-800 font-medium">
                      Click <strong>"Save as PDF / Print"</strong> above to generate and download the full multi-page PDF document containing complete individual dossiers with photos, experience, education, and hiring preferences for all {pdfModalData.apps.length} candidates.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Bottom Footer */}
            <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-400">
                You can save this candidate dossier directly as a PDF file or print to paper.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPdfModalData(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer bg-white"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (pdfModalData.type === 'single') {
                      handleExportCandidatePdf(pdfModalData.app);
                    } else {
                      handleExportAllPdf(pdfModalData.apps, pdfModalData.jobTitle);
                    }
                  }}
                  className="px-5 py-2 bg-[#00a884] hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 border-none cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Download / Print PDF</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── Root-Level AI Role-Fit Analysis Modal (Immune to table overflow/clipping) ── */}
      {activeScoreApp && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setActiveScoreApp(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-5 sm:p-6 border border-slate-200 text-xs max-h-[90vh] overflow-y-auto no-scrollbar scrollbar-none space-y-4 animate-in zoom-in-95"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center font-bold">
                  <Brain className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">AI Role-Fit Analysis</h3>
                  <p className="text-[0.7rem] text-slate-500">
                    {activeScoreApp.candidate?.full_name || 'Candidate'} • Applied for {activeScoreApp.job_title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveScoreApp(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center border-none cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Overall Score Gauge Card */}
            {(() => {
              const score = activeScoreApp.fit_score;
              const colors = getScoreColor(score);
              const breakdown = activeScoreApp.fit_breakdown?.breakdown || {};
              const highlights = activeScoreApp.fit_breakdown?.highlights || [];
              const gaps = activeScoreApp.fit_breakdown?.gaps || [];

              return (
                <>
                  <div className={`flex items-center gap-4 p-4 rounded-2xl ${colors.bg} ${colors.border} border`}>
                    <div className="relative w-16 h-16 shrink-0">
                      <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={colors.fill} strokeWidth="3" strokeDasharray={`${score}, 100`} strokeLinecap="round" />
                      </svg>
                      <span className={`absolute inset-0 flex items-center justify-center text-sm font-black ${colors.text}`}>{score}%</span>
                    </div>
                    <div>
                      <div className="text-base font-black text-slate-900">
                        {score >= 80 ? 'Excellent Match' : score >= 60 ? 'Good Match' : score >= 40 ? 'Partial Match' : 'Low Match'}
                      </div>
                      <div className="text-slate-600 text-xs mt-0.5">
                        Multi-signal weighted fit calculated across 6 profile dimensions
                      </div>
                    </div>
                  </div>

                  {/* 6 Dimension Breakdown Bars */}
                  <div>
                    <h4 className="text-[0.7rem] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                      Dimensional Breakdown
                    </h4>
                    <div className="space-y-2.5">
                      {[
                        { key: 'skills', label: 'Skills Match', icon: Target, weight: '30%' },
                        { key: 'experience', label: 'Experience Depth', icon: Briefcase, weight: '25%' },
                        { key: 'relevance', label: 'Role Relevance', icon: Compass, weight: '20%' },
                        { key: 'education', label: 'Education Quality', icon: GraduationCap, weight: '10%' },
                        { key: 'seniority', label: 'Seniority & Growth', icon: TrendingUp, weight: '10%' },
                        { key: 'completeness', label: 'Profile Completeness', icon: UserCheck, weight: '5%' },
                      ].map(dim => {
                        const val = breakdown[dim.key] || 0;
                        const barColors = getScoreColor(val);
                        const DimIcon = dim.icon;
                        return (
                          <div key={dim.key} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <div className="flex items-center justify-between mb-1 text-xs">
                              <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                                <DimIcon className="w-3.5 h-3.5 text-slate-400" />
                                <span>{dim.label}</span>
                                <span className="text-slate-400 text-[0.65rem]">({dim.weight})</span>
                              </div>
                              <span className={`font-black ${barColors.text}`}>{val}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${val}%`, backgroundColor: barColors.fill }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Highlights & Gaps */}
                  {(highlights.length > 0 || gaps.length > 0) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {highlights.length > 0 && (
                        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3">
                          <div className="text-[0.68rem] font-black text-emerald-800 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Key Strengths
                          </div>
                          <ul className="space-y-1">
                            {highlights.map((h, i) => (
                              <li key={i} className="text-[0.7rem] text-emerald-900 font-medium flex items-start gap-1.5">
                                <span className="text-emerald-500 font-bold">•</span>
                                <span>{h}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {gaps.length > 0 && (
                        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3">
                          <div className="text-[0.68rem] font-black text-amber-800 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            Identified Gaps
                          </div>
                          <ul className="space-y-1">
                            {gaps.map((g, i) => (
                              <li key={i} className="text-[0.7rem] text-amber-900 font-medium flex items-start gap-1.5">
                                <span className="text-amber-500 font-bold">•</span>
                                <span>{g}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer Close Button */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setActiveScoreApp(null)}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer border-none transition-all shadow-xs"
                    >
                      Close Analysis
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

    </div>
  );
}
