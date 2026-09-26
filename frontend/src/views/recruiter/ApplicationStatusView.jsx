 import React, { useState, useEffect } from 'react';
import {
  CheckCircle2, Users, Search, Filter, Clock, ArrowUpRight, ArrowRight,
  ChevronRight, FileText, Download, Mail, Phone, ExternalLink,
  Calendar, RefreshCw, X, ShieldCheck, Sparkles, Building2,
  Briefcase, AlertCircle, Loader2, UserCheck, UserX, Eye, ArrowLeft,
  Video, Check, Award, MessageSquare, Star
} from 'lucide-react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function ApplicationStatusView({ setActiveTab }) {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState('ALL');
  const [selectedJobFilter, setSelectedJobFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [generatingMeet, setGeneratingMeet] = useState(false);

  // Modals
  const [selectedAppModal, setSelectedAppModal] = useState(null);
  const [scheduleModalApp, setScheduleModalApp] = useState(null);
  const [feedbackModalApp, setFeedbackModalApp] = useState(null);
  const [jobsList, setJobsList] = useState([]);
  const [feedbackForm, setFeedbackForm] = useState({
    techScore: 4,
    commScore: 4,
    recommendation: 'ADVANCE',
    subject: 'Technical & Capability Evaluation',
    roundLevel: 'Round 1 - Candidate Screening & Background',
    notes: ''
  });
  const [feedbacks, setFeedbacks] = useState({});
  const [savingFeedback, setSavingFeedback] = useState(false);

  const [interviewForm, setInterviewForm] = useState({
    round: 'Round 1 - Candidate Screening & Background',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time: '14:30',
    mode: 'Google Meet',
    meetingLink: '',
    interviewer: '',
    notes: 'Please prepare relevant portfolio/case studies and review the role requirements.'
  });

  // Helper to resolve the configured interview rounds for an application / job
  const getJobRounds = (app) => {
    if (!app) {
      return [
        'Round 1 - Candidate Screening & Background',
        'Round 2 - Technical Assessment & Capabilities',
        'Round 3 - Hiring Manager & Culture Fit',
        'Final Round - Executive & Leadership Review'
      ];
    }

    const rawRounds = (app.interview_rounds && Array.isArray(app.interview_rounds) && app.interview_rounds.length > 0)
      ? app.interview_rounds
      : (jobsList.find(j => j.id === app.job_id)?.interview_rounds && Array.isArray(jobsList.find(j => j.id === app.job_id)?.interview_rounds) && jobsList.find(j => j.id === app.job_id)?.interview_rounds.length > 0)
        ? jobsList.find(j => j.id === app.job_id)?.interview_rounds
        : null;

    if (rawRounds && rawRounds.length > 0) {
      return rawRounds.map((r, i) => {
        if (typeof r === 'string') return r;
        const num = r.round_number || (i + 1);
        const name = r.name || r.title || `Round ${num}`;
        return name.toLowerCase().startsWith('round') ? name : `Round ${num} - ${name}`;
      });
    }

    return [
      'Round 1 - Candidate Screening & Background',
      'Round 2 - Technical Assessment & Capabilities',
      'Round 3 - Hiring Manager & Culture Fit',
      'Final Round - Executive & Leadership Review'
    ];
  };

  useEffect(() => {
    fetchApplications();
    try {
      const stored = JSON.parse(localStorage.getItem('uptrix_candidate_feedbacks') || '{}');
      setFeedbacks(stored);
    } catch { }
  }, []);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const [list, jobs] = await Promise.all([
        api.getCompanyApplications(),
        (api.getMyJobs ? api.getMyJobs() : api.getJobs()).catch(() => [])
      ]);
      setJobsList(Array.isArray(jobs) ? jobs : []);
      // Sync funnel state and strictly isolate screening rejected candidates
      try {
        const funnelRejectedIds = JSON.parse(localStorage.getItem('uptrix_funnel_rejected_ids') || '[]');
        const screeningRejectedIds = JSON.parse(localStorage.getItem('uptrix_screening_rejected_ids') || '[]');

        // Candidates who are currently REJECTED and not explicitly funnel rejected -> screening rejected
        const screeningRejectedInList = (list || [])
          .filter(a => a.status === 'REJECTED' && !funnelRejectedIds.includes(a.id))
          .map(a => a.id);
        const allScreeningRejected = Array.from(new Set([...screeningRejectedIds, ...screeningRejectedInList]));
        localStorage.setItem('uptrix_screening_rejected_ids', JSON.stringify(allScreeningRejected));

        // Funnel active stages (Shortlisted, Interview Scheduled, Selected, Hired)
        const currentFunnelIds = (list || [])
          .filter(a => ['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'SELECTED', 'HIRED'].includes(a.status))
          .map(a => a.id);

        const existing = JSON.parse(localStorage.getItem('uptrix_shortlisted_ids') || '[]');
        const combined = Array.from(new Set([
          ...existing.filter(id => !allScreeningRejected.includes(id) && !(list || []).some(a => a.id === id && ['APPLIED', 'UNDER_REVIEW'].includes(a.status))),
          ...currentFunnelIds
        ]));
        localStorage.setItem('uptrix_shortlisted_ids', JSON.stringify(combined));
      } catch { }
      setApplications(list || []);
      api.getInterviews().then(ivs => setInterviews(Array.isArray(ivs) ? ivs : [])).catch(() => { });
    } catch (err) {
      console.error('Failed to load applications:', err);
      triggerToast('Error loading application funnel');
    } finally {
      setLoading(false);
    }
  };

  const handleStageChange = async (appId, newStatus, customToast = null) => {
    setUpdatingId(appId);
    try {
      await api.updateApplicationStatus(appId, newStatus);
      // Synchronize funnel status
      try {
        if (newStatus === 'REJECTED') {
          // Rejection originating inside the hiring funnel (post-screening)
          const funnelRejected = JSON.parse(localStorage.getItem('uptrix_funnel_rejected_ids') || '[]');
          if (!funnelRejected.includes(appId)) {
            localStorage.setItem('uptrix_funnel_rejected_ids', JSON.stringify([...funnelRejected, appId]));
          }
          const screeningRejected = JSON.parse(localStorage.getItem('uptrix_screening_rejected_ids') || '[]');
          localStorage.setItem('uptrix_screening_rejected_ids', JSON.stringify(screeningRejected.filter(id => id !== appId)));
        } else if (['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'SELECTED', 'HIRED'].includes(newStatus)) {
          const existing = JSON.parse(localStorage.getItem('uptrix_shortlisted_ids') || '[]');
          if (!existing.includes(appId)) {
            localStorage.setItem('uptrix_shortlisted_ids', JSON.stringify([...existing, appId]));
          }
          const funnelRejected = JSON.parse(localStorage.getItem('uptrix_funnel_rejected_ids') || '[]');
          localStorage.setItem('uptrix_funnel_rejected_ids', JSON.stringify(funnelRejected.filter(id => id !== appId)));
          const screeningRejected = JSON.parse(localStorage.getItem('uptrix_screening_rejected_ids') || '[]');
          localStorage.setItem('uptrix_screening_rejected_ids', JSON.stringify(screeningRejected.filter(id => id !== appId)));
        } else if (newStatus === 'APPLIED' || newStatus === 'UNDER_REVIEW') {
          // Candidate moved back to initial screening pipeline
          const existing = JSON.parse(localStorage.getItem('uptrix_shortlisted_ids') || '[]');
          localStorage.setItem('uptrix_shortlisted_ids', JSON.stringify(existing.filter(id => id !== appId)));
          const funnelRejected = JSON.parse(localStorage.getItem('uptrix_funnel_rejected_ids') || '[]');
          localStorage.setItem('uptrix_funnel_rejected_ids', JSON.stringify(funnelRejected.filter(id => id !== appId)));
          const screeningRejected = JSON.parse(localStorage.getItem('uptrix_screening_rejected_ids') || '[]');
          localStorage.setItem('uptrix_screening_rejected_ids', JSON.stringify(screeningRejected.filter(id => id !== appId)));
        }
      } catch { }
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
      if (selectedAppModal && selectedAppModal.id === appId) {
        setSelectedAppModal(prev => ({ ...prev, status: newStatus }));
      }
      triggerToast(customToast || `Candidate stage moved to ${newStatus.replace(/_/g, ' ')}!`);
    } catch (err) {
      triggerToast(err.message || 'Failed to update application status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleQuickHire = async (app) => {
    const name = app.candidate?.full_name || 'Candidate';
    await handleStageChange(
      app.id,
      'SELECTED',
      `🎉 Congratulations! ${name} has been marked as HIRED / Offer Extended!`
    );
  };

  const handleQuickReject = async (app) => {
    const name = app.candidate?.full_name || 'Candidate';
    try {
      const funnelRejected = JSON.parse(localStorage.getItem('uptrix_funnel_rejected_ids') || '[]');
      if (!funnelRejected.includes(app.id)) {
        localStorage.setItem('uptrix_funnel_rejected_ids', JSON.stringify([...funnelRejected, app.id]));
      }
      const screeningRejected = JSON.parse(localStorage.getItem('uptrix_screening_rejected_ids') || '[]');
      localStorage.setItem('uptrix_screening_rejected_ids', JSON.stringify(screeningRejected.filter(id => id !== app.id)));
    } catch { }
    await handleStageChange(
      app.id,
      'REJECTED',
      `Candidate ${name} marked as Rejected.`
    );
  };

  const openScheduleModal = (app) => {
    setScheduleModalApp(app);
    const existingIv = interviews.find(iv => 
      iv.application_id === app.id || 
      iv.applicationId === app.id || 
      (iv.candidate_name && app.candidate?.full_name && iv.candidate_name.toLowerCase() === app.candidate.full_name.toLowerCase())
    );

    const rounds = getJobRounds(app);
    const defaultRound = rounds[0] || 'Round 1 - Candidate Screening';

    setInterviewForm({
      round: existingIv?.round || defaultRound,
      date: existingIv?.interview_date || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      time: existingIv?.interview_time || '14:30',
      mode: existingIv?.mode || 'Google Meet',
      meetingLink: existingIv?.meeting_url || existingIv?.meet_url || '',
      interviewer: existingIv?.interviewer_name || (app.job_title ? `Hiring Lead (${app.job_title})` : 'Hiring Manager'),
      notes: existingIv?.notes || ''
    });
  };

  const openFeedbackModal = (app) => {
    setFeedbackModalApp(app);
    const existing = feedbacks[app.id] || {};
    const rounds = getJobRounds(app);
    const firstRound = rounds[0] || 'Round 1 - Candidate Screening';

    setFeedbackForm({
      recommendation: existing.recommendation || 'ADVANCE',
      subject: existing.subject || (app.job_title ? `${app.job_title} Assessment` : 'Technical & Capability Evaluation'),
      roundLevel: existing.roundLevel || firstRound,
      notes: existing.notes || ''
    });
  };

  const handleSaveFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackModalApp) return;
    setSavingFeedback(true);

    try {
      const appId = feedbackModalApp.id;
      const candidateName = feedbackModalApp.candidate?.full_name || 'Candidate';
      const updatedFeedbacks = {
        ...feedbacks,
        [appId]: {
          ...feedbackForm,
          candidateName,
          submittedAt: new Date().toISOString(),
          interviewer: user?.name || 'Recruiter / Hiring Lead'
        }
      };
      setFeedbacks(updatedFeedbacks);
      try {
        localStorage.setItem('uptrix_candidate_feedbacks', JSON.stringify(updatedFeedbacks));
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('uptrix_feedback_updated', { detail: { appId, feedback: updatedFeedbacks[appId] } }));
      } catch { }

      // Optionally sync with server interview record
      const matchingIv = interviews.find(iv =>
        iv.application_id === appId ||
        iv.applicationId === appId ||
        (iv.candidate_name && candidateName && iv.candidate_name.toLowerCase() === candidateName.toLowerCase())
      );

      const jobTitle = feedbackModalApp.job_title || feedbackModalApp.job?.title || 'Position';
      const roundText = feedbackForm.roundLevel || (feedbackForm.recommendation === 'HIRE' ? 'Offer Extended & Executive Review' : 'Interview Round');
      const todayDate = new Date().toISOString().split('T')[0];

      if (feedbackForm.recommendation === 'HIRE') {
        const notePayload = `[Strong Hire / Offer] ${feedbackForm.notes || ''}`;
        if (matchingIv?.id) {
          try {
            await api.updateInterview(matchingIv.id, {
              round: 'Final Round - Offer Extended',
              notes: notePayload
            });
          } catch { }
        } else {
          try {
            await api.createInterview({
              application_id: appId,
              job_title: jobTitle,
              candidate_name: candidateName,
              interviewer_name: user?.name || 'Hiring Lead',
              interview_date: todayDate,
              interview_time: 'Completed',
              duration: '45 mins',
              round: 'Final Round - Offer Extended',
              mode: 'Google Meet',
              notes: notePayload,
              status: 'COMPLETED'
            });
          } catch { }
        }
        await handleStageChange(
          appId,
          'SELECTED',
          `🎉 Congratulations! ${candidateName} marked as HIRED / Offer Extended!`
        );
      } else if (feedbackForm.recommendation === 'PASS') {
        const notePayload = `[Do Not Hire] ${feedbackForm.notes || ''}`;
        if (matchingIv?.id) {
          try {
            await api.updateInterview(matchingIv.id, {
              notes: notePayload
            });
          } catch { }
        } else {
          try {
            await api.createInterview({
              application_id: appId,
              job_title: jobTitle,
              candidate_name: candidateName,
              interviewer_name: user?.name || 'Hiring Lead',
              interview_date: todayDate,
              interview_time: 'Completed',
              duration: '45 mins',
              round: 'Interview Round',
              mode: 'Google Meet',
              notes: notePayload,
              status: 'COMPLETED'
            });
          } catch { }
        }
        await handleStageChange(
          appId,
          'REJECTED',
          `Candidate ${candidateName} marked as Rejected.`
        );
      } else {
        // Next Round (ADVANCE)
        const notePayload = `[Next Round: ${roundText} - ${feedbackForm.subject || 'Assessment'}] ${feedbackForm.notes || ''}`;
        if (matchingIv?.id) {
          try {
            await api.updateInterview(matchingIv.id, {
              round: roundText,
              notes: notePayload,
              interview_date: 'To Be Scheduled',
              interview_time: 'Slot Needed',
              status: 'SCHEDULED'
            });
          } catch { }
        } else {
          try {
            await api.createInterview({
              application_id: appId,
              job_title: jobTitle,
              candidate_name: candidateName,
              interviewer_name: user?.name || 'Hiring Lead',
              interview_date: 'To Be Scheduled',
              interview_time: 'Slot Needed',
              duration: '45 mins',
              round: roundText,
              mode: 'Google Meet',
              notes: notePayload,
              status: 'SCHEDULED'
            });
          } catch { }
        }
        await handleStageChange(
          appId,
          'INTERVIEW_SCHEDULED',
          `🚀 ${candidateName} advanced to ${roundText}! Set Date & Slot in Candidate Interview Pipeline.`
        );
      }

      // Refresh interviews list in state
      try {
        const refreshed = await api.getInterviews();
        setInterviews(Array.isArray(refreshed) ? refreshed : []);
      } catch { }

      setFeedbackModalApp(null);
    } catch (err) {
      triggerToast(err.message || 'Failed to save interview evaluation');
    } finally {
      setSavingFeedback(false);
    }
  };

  const handleAutoGenerateMeet = async () => {
    if (generatingMeet) return;
    setGeneratingMeet(true);

    try {
      // 1. Check Google OAuth connection status
      const status = await api.getGoogleOAuthStatus();

      if (!status.connected) {
        const authData = await api.getGoogleOAuthUrl();
        if (authData?.authorizationUrl) {
          const width = 560;
          const height = 660;
          const left = window.screen.width / 2 - width / 2;
          const top = window.screen.height / 2 - height / 2;

          window.open(
            authData.authorizationUrl,
            'GoogleOAuthPopup',
            `width=${width},height=${height},top=${top},left=${left},status=no,toolbar=no,menubar=no`
          );

          const handleMessage = async (event) => {
            if (event.data?.type === 'GOOGLE_OAUTH_SUCCESS') {
              window.removeEventListener('message', handleMessage);
              triggerToast('Google account connected! Generating Google Meet space...');
              try {
                const res = await api.generateGoogleMeetSpace();
                if (res?.meetingUrl) {
                  setInterviewForm(prev => ({ ...prev, meetingLink: res.meetingUrl }));
                  triggerToast(`✨ Real Google Meet space created: ${res.meetingUrl}`);
                }
              } catch (err) {
                triggerToast(err.message || 'Failed to generate meeting space');
              } finally {
                setGeneratingMeet(false);
              }
            }
          };

          window.addEventListener('message', handleMessage);
          return;
        }
      }

      // 2. Already connected: Generate Google Meet space directly
      const res = await api.generateGoogleMeetSpace();
      if (res?.meetingUrl) {
        setInterviewForm(prev => ({ ...prev, meetingLink: res.meetingUrl }));
        triggerToast(`✨ Real Google Meet space created: ${res.meetingUrl}`);
      }
    } catch (err) {
      console.error('Google Meet error:', err);
      triggerToast(err.message || 'Failed to auto-generate Google Meet space');
    } finally {
      setGeneratingMeet(false);
    }
  };

  const handleConfirmSchedule = async (e) => {
    e.preventDefault();
    if (!scheduleModalApp) return;
    const name = scheduleModalApp.candidate?.full_name || 'Candidate';
    const finalLink = interviewForm.meetingLink?.trim() || '';

    await handleStageChange(
      scheduleModalApp.id,
      'INTERVIEW_SCHEDULED',
      `🎙️ ${interviewForm.round} scheduled for ${name}! Added to Candidate Interview Pipeline.`
    );

    // Save scheduled interview record to server for Candidate Interview Pipeline
    try {
      const dateParts = (interviewForm.date || '').split('-');
      let formattedDate = interviewForm.date;
      if (dateParts.length === 3) {
        const d = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        if (!isNaN(d.getTime())) {
          formattedDate = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        }
      }

      let formattedTime = interviewForm.time;
      if (interviewForm.time && interviewForm.time.includes(':')) {
        const [h, m] = interviewForm.time.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const h12 = hour % 12 || 12;
        formattedTime = `${h12}:${m} ${ampm} IST`;
      }

      await api.createInterview({
        application_id: scheduleModalApp.id,
        job_title: scheduleModalApp.job_title || 'Position',
        candidate_name: name,
        interviewer_name: interviewForm.interviewer,
        interview_date: formattedDate,
        interview_time: formattedTime,
        duration: '45 mins',
        round: interviewForm.round,
        mode: interviewForm.mode,
        meet_url: finalLink,
        notes: interviewForm.notes,
        status: 'CONFIRMED'
      });
    } catch (err) {
      console.error('Error saving scheduled interview:', err);
    }

    setScheduleModalApp(null);
  };

  // Only show candidates who were shortlisted (or progressed to interview/hired/funnel rejection)
  // Inbound/Under Review/Screening-rejected candidates stay in Applicant Review & Screening Pipeline
  const funnelApps = applications.filter(app => {
    // 1. Any candidate explicitly flagged as screening rejected MUST NOT appear in the funnel
    try {
      const screeningRejected = JSON.parse(localStorage.getItem('uptrix_screening_rejected_ids') || '[]');
      if (screeningRejected.includes(app.id)) {
        return false;
      }
    } catch { }

    // 2. Active funnel stages: Shortlisted, Interview Scheduled, Selected, Hired
    if (['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'SELECTED', 'HIRED'].includes(app.status)) {
      try {
        const shortlistedIds = JSON.parse(localStorage.getItem('uptrix_shortlisted_ids') || '[]');
        return shortlistedIds.includes(app.id) || ['INTERVIEW_SCHEDULED', 'SELECTED', 'HIRED'].includes(app.status);
      } catch {
        return true;
      }
    }

    // 3. Funnel rejections only (rejected during interview/hiring stages, NEVER initial screening rejections)
    if (app.status === 'REJECTED') {
      try {
        const funnelRejectedIds = JSON.parse(localStorage.getItem('uptrix_funnel_rejected_ids') || '[]');
        return funnelRejectedIds.includes(app.id);
      } catch {
        return false;
      }
    }

    return false;
  });

  // Distinct jobs list for filter dropdown (only from shortlisted funnel candidates)
  const uniqueJobs = Array.from(new Set(funnelApps.map(a => a.job_title).filter(Boolean)));

  // Filtered applications within the hiring funnel
  const filteredApps = funnelApps.filter(app => {
    const cand = app.candidate || {};
    const matchesSearch =
      (cand.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cand.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.job_title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cand.skills || []).some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesJob = selectedJobFilter === 'ALL' || app.job_title === selectedJobFilter;

    let matchesStage = true;
    if (selectedStage === 'SHORTLISTED') matchesStage = app.status === 'SHORTLISTED';
    else if (selectedStage === 'INTERVIEW_SCHEDULED') matchesStage = app.status === 'INTERVIEW_SCHEDULED';
    else if (selectedStage === 'HIRED') matchesStage = ['HIRED', 'SELECTED'].includes(app.status);
    else if (selectedStage === 'REJECTED') matchesStage = app.status === 'REJECTED';

    return matchesSearch && matchesJob && matchesStage;
  });

  // Funnel Metrics based exclusively on shortlisted/funnel candidates
  const totalCount = funnelApps.length;
  const shortlistedCount = funnelApps.filter(a => a.status === 'SHORTLISTED').length;
  const interviewingCount = funnelApps.filter(a => a.status === 'INTERVIEW_SCHEDULED').length;
  const hiredCount = funnelApps.filter(a => ['HIRED', 'SELECTED'].includes(a.status)).length;
  const rejectedCount = funnelApps.filter(a => a.status === 'REJECTED').length;

  const TINTS = {
    indigo: 'bg-[#5C59E8]/8 text-[#4845D2] ring-1 ring-inset ring-[#5C59E8]/15',
    orange: 'bg-[#FF7043]/8 text-[#E15A2C] ring-1 ring-inset ring-[#FF7043]/15',
    emerald: 'bg-[#00A884]/8 text-[#00846A] ring-1 ring-inset ring-[#00A884]/15',
    slate: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200/70',
    sky: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200/80',
    purple: 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200/80',
    rose: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200/80',
    amber: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/80',
  };

  const inputClass = 'w-full px-3 py-2 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white placeholder:text-slate-400 focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)]';
  const selectClass = 'w-full px-3 py-2 rounded-xl border border-slate-200/90 text-xs font-semibold text-slate-700 bg-white focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)] cursor-pointer';

  const getStatusPillStyle = (status) => {
    switch (status) {
      case 'HIRED':
      case 'SELECTED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300/80';
      case 'INTERVIEW_SCHEDULED':
        return 'bg-[#5C59E8]/10 text-[#5C59E8] border-[#5C59E8]/30';
      case 'SHORTLISTED':
        return 'bg-sky-50 text-sky-700 border-sky-300/80';
      case 'UNDER_REVIEW':
        return 'bg-amber-50 text-amber-700 border-amber-300/80';
      case 'REJECTED':
        return 'bg-rose-50 text-rose-700 border-rose-300/80';
      case 'APPLIED':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div
      className="p-4 sm:p-7 max-w-7xl mx-auto space-y-6 bg-[#F7F8FB] min-h-full antialiased text-slate-800"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
    >

      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-semibold text-slate-900 leading-tight tracking-tight m-0">
            Application Status & Hiring Funnel
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 m-0">
            Conduct multi-round candidate interviews, extend job offers, and record final hiring or post-interview outcomes for shortlisted talent.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchApplications}
            className="p-2.5 rounded-xl border border-slate-200/80 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
            title="Refresh candidate submissions"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#5C59E8]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 px-4 rounded-xl bg-slate-900 text-white text-xs font-medium flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white border-none bg-transparent cursor-pointer ml-4 p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── 4 Key Funnel KPI Cards (Compact) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Shortlisted */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)] px-4 py-3 transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-sky-600 uppercase tracking-wider">
              Ready for Interview
            </span>
            <div className="w-6 h-6 rounded-md bg-sky-50 text-sky-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-none">
            {shortlistedCount} Shortlisted
          </div>
          <p className="text-[11px] text-slate-400 mt-1 m-0">Passed initial screening</p>
        </div>

        {/* Interviewing */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)] px-4 py-3 transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-[#5C59E8] uppercase tracking-wider">
              Active Interviewing
            </span>
            <div className="w-6 h-6 rounded-md bg-[#5C59E8]/10 text-[#5C59E8] flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-none">
            {interviewingCount} Scheduled
          </div>
          <p className="text-[11px] text-slate-400 mt-1 m-0">Rounds in progress</p>
        </div>

        {/* Hired / Offers */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)] px-4 py-3 transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">
              Offers & Hires
            </span>
            <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-none">
            {hiredCount} Hired
          </div>
          <p className="text-[11px] text-slate-400 mt-1 m-0">Successful placements</p>
        </div>

        {/* Rejections */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)] px-4 py-3 transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-rose-500 uppercase tracking-wider">
              Post-Interview Rejections
            </span>
            <div className="w-6 h-6 rounded-md bg-rose-50 text-rose-500 flex items-center justify-center">
              <UserX className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-none">
            {rejectedCount} Archived
          </div>
          <p className="text-[11px] text-slate-400 mt-1 m-0">Evaluated & dropped</p>
        </div>
      </div>

      {/* ── Search, Requisition Filter & Funnel Tabs ── */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] space-y-3">
        {/* Top: Search and Requisition Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search candidate name, email, skills, or requisition..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white placeholder:text-slate-400 focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)]"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedJobFilter}
                onChange={(e) => setSelectedJobFilter(e.target.value)}
                className="text-xs font-semibold text-slate-700 bg-transparent border-none outline-none cursor-pointer pr-1"
              >
                <option value="ALL">All Requisitions ({uniqueJobs.length})</option>
                {uniqueJobs.map(job => (
                  <option key={job} value={job}>{job}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Bottom: Funnel Stage Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 border-t border-slate-100">
          {[
            { id: 'ALL', label: 'All Candidates', count: totalCount },
            { id: 'SHORTLISTED', label: '⭐ Ready for Interview', count: shortlistedCount },
            { id: 'INTERVIEW_SCHEDULED', label: '🎙️ Interviewing', count: interviewingCount },
            { id: 'HIRED', label: '🏆 Hired / Offer', count: hiredCount },
            { id: 'REJECTED', label: '❌ Post-Interview Rejected', count: rejectedCount },
          ].map(tab => {
            const isActive = selectedStage === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStage(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border-none cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-[#5C59E8] text-white shadow-xs font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Applications Funnel Pipeline Table ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#5C59E8]" />
            <p className="text-xs font-medium text-slate-500">Loading candidate applications...</p>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-[#5C59E8]/10 text-[#5C59E8] flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No candidates match your criteria</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Only candidates shortlisted from the Applicant Screening page enter this hiring funnel. Inbound, Under Review, and initial screening rejections remain in Applicant Screening.
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSelectedStage('ALL'); setSelectedJobFilter('ALL'); }}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border-none cursor-pointer transition-colors"
              >
                Reset Filters
              </button>
              {setActiveTab && (
                <button
                  type="button"
                  onClick={() => setActiveTab('applicants_view')}
                  className="px-3.5 py-1.5 rounded-lg bg-[#5C59E8] hover:bg-[#4845D2] text-white text-xs font-medium border-none cursor-pointer shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Go to Applicant Screening</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-5">Candidate</th>
                  <th className="py-3 px-5">Applied Requisition</th>
                  <th className="py-3 px-5">Current Funnel Stage</th>
                  <th className="py-3 px-5 text-center">Interviewing & Hiring Actions</th>
                  <th className="py-3 px-5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-normal">
                {filteredApps.map((app) => {
                  const cand = app.candidate || {};
                  const isUpdating = updatingId === app.id;
                  const initials = (cand.full_name || 'C')
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .substring(0, 2);

                  return (
                    <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Candidate Name & Info */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-semibold flex items-center justify-center text-xs shrink-0 ring-1 ring-slate-200/70">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 truncate flex items-center gap-1.5">
                              <span>{cand.full_name || 'Candidate'}</span>
                              {cand.resume_url && (
                                <span title="Resume Attached" className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate mt-0.5">
                              {cand.email || cand.phone || (cand.city ? `${cand.city}, ${cand.state || ''}` : 'Applicant')}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Job Title & Location */}
                      <td className="py-3.5 px-5">
                        <div className="font-medium text-slate-900 truncate max-w-[200px]">
                          {app.job_title}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                          <span>{app.job_location || 'Remote'}</span>
                          {app.job_work_mode && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                              {app.job_work_mode}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Current Funnel Stage */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <div className="relative inline-block">
                          <select
                            disabled={isUpdating}
                            value={app.status}
                            onChange={(e) => handleStageChange(app.id, e.target.value)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer outline-none transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)] ${getStatusPillStyle(app.status)}`}
                          >
                            <option value="SHORTLISTED">⭐ Shortlisted</option>
                            <option value="INTERVIEW_SCHEDULED">🎙️ Interviewing</option>
                            <option value="SELECTED">🏆 Hired / Offer</option>
                            <option value="REJECTED">❌ Rejected</option>
                            <option value="UNDER_REVIEW">Under Review</option>
                            <option value="APPLIED">Applied / New</option>
                          </select>
                        </div>
                      </td>

                      {/* Interviewing & Hiring Actions */}
                      <td className="py-3.5 px-5 text-center">
                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => openFeedbackModal(app)}
                            className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] ${
                              feedbacks[app.id]
                                ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'
                                : 'bg-[#5C59E8] hover:bg-[#4845D2] text-white border-none'
                            }`}
                            title="Open Interview Round Evaluation & Decision"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Interview Round</span>
                            {feedbacks[app.id] && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Feedback Recorded" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Details Button */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedAppModal(app)}
                          className="p-1.5 px-2.5 rounded-lg border border-slate-200/80 hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors cursor-pointer bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)] inline-flex items-center gap-1"
                          title="Inspect Candidate Submission & Profile"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          <span>Dossier</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL 1: SCHEDULE / ADVANCE INTERVIEW MODAL ── */}
      {scheduleModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in select-text">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-200/80 text-slate-800 space-y-4">

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-[#5C59E8]/10 text-[#5C59E8] flex items-center justify-center font-bold">
                  <Calendar className="w-4.5 h-4.5" />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Schedule Candidate Interview
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    For: <strong className="text-slate-800">{scheduleModalApp.candidate?.full_name}</strong> • {scheduleModalApp.job_title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setScheduleModalApp(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmSchedule} className="space-y-3.5 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">Interview Round *</label>
                  {scheduleModalApp && (
                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {getJobRounds(scheduleModalApp).length} Rounds Defined
                    </span>
                  )}
                </div>
                <select
                  value={interviewForm.round}
                  onChange={(e) => setInterviewForm({ ...interviewForm, round: e.target.value })}
                  className={selectClass}
                >
                  {getJobRounds(scheduleModalApp).map((r, idx) => (
                    <option key={idx} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Interview Date</label>
                  <input
                    type="date"
                    required
                    value={interviewForm.date}
                    onChange={(e) => setInterviewForm({ ...interviewForm, date: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Interview Time</label>
                  <input
                    type="time"
                    required
                    value={interviewForm.time}
                    onChange={(e) => setInterviewForm({ ...interviewForm, time: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Meeting Mode *</label>
                  <select
                    value={interviewForm.mode}
                    onChange={(e) => setInterviewForm({ ...interviewForm, mode: e.target.value })}
                    className={selectClass}
                  >
                    <option value="Google Meet">Google Meet (Video)</option>
                    <option value="Zoom">Zoom Meeting</option>
                    <option value="Microsoft Teams">Microsoft Teams</option>
                    <option value="On-site Office">On-site In-Person</option>
                    <option value="Phone Call">Phone Call</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lead Interviewer</label>
                  <input
                    type="text"
                    placeholder="Interviewer name or email"
                    value={interviewForm.interviewer}
                    onChange={(e) => setInterviewForm({ ...interviewForm, interviewer: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Meeting Link / URL Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                  <label className="block font-semibold text-slate-700 text-xs">
                    Meeting Link / Address
                  </label>
                  {interviewForm.mode === 'Google Meet' && (
                    <button
                      type="button"
                      onClick={handleAutoGenerateMeet}
                      disabled={generatingMeet}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#5C59E8] hover:bg-[#4845D2] px-3 py-1 rounded-lg cursor-pointer transition-all shadow-xs border-none"
                    >
                      {generatingMeet ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                          <span>Generating Google Meet...</span>
                        </>
                      ) : (
                        <>
                          <Video className="w-3.5 h-3.5 text-white" />
                          <span>+ Create Google Meet Link</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder={
                      interviewForm.mode === 'Zoom'
                        ? 'https://zoom.us/j/1234567890'
                        : interviewForm.mode === 'Microsoft Teams'
                          ? 'https://teams.microsoft.com/l/meetup-join/...'
                          : interviewForm.mode === 'On-site Office'
                            ? 'Office Address or Conference Room'
                            : interviewForm.mode === 'Phone Call'
                              ? 'Candidate or Dial-in Phone Number'
                              : 'Click "+ Create Google Meet Link" or paste link here'
                    }
                    value={interviewForm.meetingLink}
                    onChange={(e) => setInterviewForm({ ...interviewForm, meetingLink: e.target.value })}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200/90 font-medium text-xs bg-white text-slate-800 outline-none focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)]"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Video className="w-3.5 h-3.5" />
                  </div>
                </div>

                {interviewForm.meetingLink && (
                  <div className="mt-2 flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200/80 text-xs animate-in fade-in">
                    <div className="flex items-center gap-1.5 min-w-0 text-indigo-900 font-mono text-[0.72rem] truncate">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{interviewForm.meetingLink}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(interviewForm.meetingLink);
                          triggerToast('Meeting link copied to clipboard!');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#5C59E8] hover:bg-[#4845D2] text-white text-[0.68rem] font-semibold border-none cursor-pointer shadow-2xs"
                      >
                        Copy Link
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setScheduleModalApp(null)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 border-none bg-transparent cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#00a884] hover:bg-teal-700 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer border-none"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirm & Schedule</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ── MODAL 2: CANDIDATE DETAILS / DOSSIER MODAL ── */}
      {selectedAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in select-text">
          <div className="w-full max-w-2xl bg-white rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-200/80 text-slate-800 relative space-y-5 max-h-[90vh] overflow-y-auto no-scrollbar">

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                  {(selectedAppModal.candidate?.full_name || 'C').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    {selectedAppModal.candidate?.full_name || 'Candidate Profile'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Applied for: <strong className="text-slate-700">{selectedAppModal.job_title}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAppModal(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Contact Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-slate-50/80 p-3 rounded-xl border border-slate-200/70">
              <div className="flex items-center gap-1.5 text-slate-600 truncate">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{selectedAppModal.candidate?.email || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 truncate">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{selectedAppModal.candidate?.phone || 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 truncate">
                <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{selectedAppModal.candidate?.title || 'Applicant'}</span>
              </div>
            </div>

            {/* Funnel Decision Bar */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">Funnel Status & Decision:</span>
                <select
                  value={selectedAppModal.status}
                  onChange={(e) => handleStageChange(selectedAppModal.id, e.target.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer outline-none shadow-[0_1px_2px_rgba(15,23,42,0.02)] ${getStatusPillStyle(selectedAppModal.status)}`}
                >
                  <option value="SHORTLISTED">⭐ Shortlisted</option>
                  <option value="INTERVIEW_SCHEDULED">🎙️ Interviewing</option>
                  <option value="SELECTED">🏆 Hired / Offer</option>
                  <option value="REJECTED">❌ Rejected</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="APPLIED">Applied / New</option>
                </select>
              </div>

              {/* Dedicated Funnel Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => openFeedbackModal(selectedAppModal)}
                  className="flex-1 py-2 px-4 rounded-lg bg-[#5C59E8] hover:bg-[#4845D2] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer border-none"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Interview Round</span>
                  {feedbacks[selectedAppModal.id] && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Feedback Recorded" />
                  )}
                </button>
              </div>
            </div>

            {/* Interview Feedback Card if feedback logged */}
            {feedbacks[selectedAppModal.id] && (
              <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200/70 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-2xs">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-semibold text-purple-950">Interview Evaluation & Feedback</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[0.65rem] font-semibold border ${
                    feedbacks[selectedAppModal.id].recommendation === 'HIRE'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : feedbacks[selectedAppModal.id].recommendation === 'ADVANCE'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300'
                  }`}>
                    {feedbacks[selectedAppModal.id].recommendation === 'HIRE'
                      ? '⭐ Strong Hire / Offer'
                      : feedbacks[selectedAppModal.id].recommendation === 'ADVANCE'
                      ? '🔄 Next Round Recommended'
                      : '❌ Do Not Hire'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[0.72rem]">
                  <div className="bg-white/80 p-2.5 rounded-lg border border-purple-100">
                    <span className="text-slate-500 font-medium block text-[0.65rem]">Domain Expertise</span>
                    <span className="text-purple-900 font-bold text-xs">★ {feedbacks[selectedAppModal.id].techScore} / 5</span>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-lg border border-purple-100">
                    <span className="text-slate-500 font-medium block text-[0.65rem]">Communication & Fit</span>
                    <span className="text-purple-900 font-bold text-xs">★ {feedbacks[selectedAppModal.id].commScore} / 5</span>
                  </div>
                </div>

                {feedbacks[selectedAppModal.id].notes && (
                  <div className="bg-white/80 p-3 rounded-lg border border-purple-100 text-xs text-slate-700 leading-relaxed italic">
                    "{feedbacks[selectedAppModal.id].notes}"
                  </div>
                )}

                <div className="text-[0.65rem] text-purple-800/70 font-semibold flex items-center justify-between pt-1">
                  <span>Logged by: {feedbacks[selectedAppModal.id].interviewer || 'Recruiter'}</span>
                  {feedbacks[selectedAppModal.id].submittedAt && (
                    <span>{new Date(feedbacks[selectedAppModal.id].submittedAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            )}

            {/* Candidate Summary */}
            {selectedAppModal.candidate?.summary && (
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Professional Bio / Pitch
                </span>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/60 p-3 rounded-xl border border-slate-200/70">
                  {selectedAppModal.candidate.summary}
                </p>
              </div>
            )}

            {/* Cover Letter */}
            {selectedAppModal.cover_letter && (
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Cover Letter
                </span>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/60 p-3 rounded-xl border border-slate-200/70 whitespace-pre-wrap">
                  {selectedAppModal.cover_letter}
                </p>
              </div>
            )}

            {/* Skills */}
            {selectedAppModal.candidate?.skills && selectedAppModal.candidate.skills.length > 0 && (
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Verified Skills
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {selectedAppModal.candidate.skills.map((skill, sIdx) => (
                    <span
                      key={sIdx}
                      className="px-2.5 py-1 rounded-lg bg-[#5C59E8]/8 text-[#4845D2] ring-1 ring-inset ring-[#5C59E8]/15 text-xs font-semibold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Document / Resume Links */}
            <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {selectedAppModal.candidate?.resume_url ? (
                  <a
                    href={selectedAppModal.candidate.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all no-underline shadow-xs flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Download Official Resume</span>
                  </a>
                ) : (
                  <span className="text-xs text-slate-400 italic">No resume attached</span>
                )}

                {selectedAppModal.candidate?.portfolio_url && (
                  <a
                    href={selectedAppModal.candidate.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-lg border border-slate-200/80 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-all no-underline flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Live Portfolio</span>
                  </a>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedAppModal(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 border-none bg-transparent cursor-pointer transition-colors"
              >
                Close Window
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── MODAL 3: CANDIDATE INTERVIEW FEEDBACK & EVALUATION SCORECARD ── */}
      {feedbackModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in select-text">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-200/80 text-slate-800 space-y-4 max-h-[92vh] overflow-y-auto no-scrollbar">

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                  <Calendar className="w-4.5 h-4.5" />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Interview Round
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    For: <strong className="text-slate-800">{feedbackModalApp.candidate?.full_name}</strong> • {feedbackModalApp.job_title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFeedbackModalApp(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFeedback} className="space-y-4 text-xs">
              {/* Interview Recommendation * */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Interview Recommendation *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'ADVANCE', label: '🔄 Next Round', active: 'bg-amber-500 text-white border-amber-500 shadow-xs' },
                    { id: 'HIRE', label: '⭐ Strong Hire / Offer', active: 'bg-emerald-600 text-white border-emerald-600 shadow-xs' },
                    { id: 'PASS', label: '❌ Do Not Hire', active: 'bg-rose-600 text-white border-rose-600 shadow-xs' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFeedbackForm(prev => ({ ...prev, recommendation: opt.id }))}
                      className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                        feedbackForm.recommendation === opt.id
                          ? opt.active
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* DYNAMIC SECTION BASED ON INTERVIEW RECOMMENDATION */}
              {/* Option 1: Next Round -> show subject and round level */}
              {feedbackForm.recommendation === 'ADVANCE' && (
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between text-amber-900 font-semibold text-xs">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Next Round Setup</span>
                    </div>
                    {feedbackModalApp && (
                      <span className="text-[10px] font-semibold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-200/60">
                        {getJobRounds(feedbackModalApp).length} Rounds Configured for Job
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 text-xs mb-1">
                        Subject / Focus *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Technical Deep-Dive, Problem Solving, Culture Fit"
                        value={feedbackForm.subject}
                        onChange={e => setFeedbackForm(prev => ({ ...prev, subject: e.target.value }))}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 text-xs mb-1">
                        Round Level *
                      </label>
                      <select
                        value={feedbackForm.roundLevel}
                        onChange={e => setFeedbackForm(prev => ({ ...prev, roundLevel: e.target.value }))}
                        className={selectClass}
                      >
                        {getJobRounds(feedbackModalApp).map((r, idx) => (
                          <option key={idx} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Option 2: Strong Hire / Offer -> show congratulations */}
              {feedbackForm.recommendation === 'HIRE' && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1.5 animate-in fade-in">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                    <Award className="w-4.5 h-4.5 text-emerald-600" />
                    <span>🎉 Congratulations!</span>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed font-normal">
                    Candidate will be extended an official offer and moved to the <strong>Hired / Offer Extended</strong> pipeline stage.
                  </p>
                </div>
              )}

              {/* Option 3: Do Not Hire -> show rejection alert */}
              {feedbackForm.recommendation === 'PASS' && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1 animate-in fade-in">
                  <div className="flex items-center gap-2 font-semibold text-xs text-rose-700">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>Candidate Will Be Dropped</span>
                  </div>
                  <p className="text-[0.72rem] text-rose-700 font-normal">
                    Candidate will be marked as Rejected post-interview and archived from the active hiring funnel.
                  </p>
                </div>
              )}

              {/* Evaluation Feedback & Summary Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Evaluation Feedback & Summary Notes *
                </label>
                <textarea
                  rows={4}
                  required
                  value={feedbackForm.notes}
                  onChange={e => setFeedbackForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder={
                    feedbackForm.recommendation === 'HIRE'
                      ? 'Highlight candidate key strengths, standout marketing capabilities, ROAS track record, and justification for offer extension...'
                      : feedbackForm.recommendation === 'ADVANCE'
                      ? 'Summarize feedback from current round, digital marketing skills tested, and objectives/focus areas for the next round...'
                      : 'Record reasons for rejection, gaps identified in marketing skills or culture fit...'
                  }
                  className="w-full p-3 rounded-xl border border-slate-200/90 font-medium text-slate-800 text-xs focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none leading-relaxed shadow-[0_1px_2px_rgba(15,23,42,0.02)] transition-all"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFeedbackModalApp(null)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 border-none bg-transparent cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingFeedback}
                  className={`px-4 py-2 rounded-lg text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer border-none disabled:opacity-50 ${
                    feedbackForm.recommendation === 'HIRE'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : feedbackForm.recommendation === 'PASS'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    {savingFeedback
                      ? 'Saving...'
                      : feedbackForm.recommendation === 'HIRE'
                      ? 'Confirm Hire & Extend Offer 🎉'
                      : feedbackForm.recommendation === 'PASS'
                      ? 'Confirm & Reject Candidate'
                      : 'Save & Advance to Next Round'}
                  </span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
