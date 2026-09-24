import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar, Clock, Video, Users, CheckCircle2, AlertCircle,
  ExternalLink, Building2, User, ChevronRight, Plus, Copy,
  Check, Sparkles, X, ShieldCheck, ArrowUpRight, MessageSquare,
  HelpCircle, RefreshCw, FileText, CheckCheck, Mic, Camera,
  Loader2, Trash2, Phone, MapPin, Search, Award, XCircle, Star,
  Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';

const parseInterviewDateTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return null;
  const isPending = (str) => {
    if (!str || typeof str !== 'string') return true;
    const s = str.toLowerCase();
    return s.includes('scheduled') || s.includes('needed') || s.includes('pending') || s.includes('check');
  };
  if (isPending(dateStr) || isPending(timeStr)) return null;

  try {
    let timePart = '12:00 PM';
    if (timeStr) {
      const match = timeStr.match(/(\d{1,2}:\d{2}(?:\s*(?:AM|PM|am|pm))?)/i);
      if (match) timePart = match[1];
    }
    const cleanDate = dateStr.replace(/^[A-Za-z]+,\s*/, '').trim();
    const parsed = new Date(`${cleanDate} ${timePart}`);
    if (!isNaN(parsed.getTime())) return parsed;
    const dOnly = new Date(cleanDate);
    if (!isNaN(dOnly.getTime())) return dOnly;
  } catch {}
  return null;
};

const getInterviewDiffMinutes = (dateStr, timeStr) => {
  const d = parseInterviewDateTime(dateStr, timeStr);
  if (!d) return null;
  const now = new Date();
  return Math.round((d.getTime() - now.getTime()) / 60000);
};

const getReminderSetting = (interviewId, candidateName) => {
  try {
    const raw = localStorage.getItem('uptrix_interview_reminders');
    if (raw) {
      const data = JSON.parse(raw);
      if (interviewId && data[interviewId]) return data[interviewId];
      if (candidateName) {
        const found = Object.values(data).find(
          r => r.candidateName && r.candidateName.toLowerCase() === candidateName.toLowerCase()
        );
        if (found) return found;
      }
    }
  } catch {}
  return { reminderMinutes: 10 };
};

const getInterviewFeedback = (item) => {
  if (!item) return null;
  // 1. Check local storage
  let localData = null;
  try {
    const raw = localStorage.getItem('uptrix_candidate_feedbacks');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (item.applicationId && parsed[item.applicationId]) {
        localData = parsed[item.applicationId];
      } else if (item.candidateName) {
        const found = Object.values(parsed).find(f =>
          f.candidateName && f.candidateName.toLowerCase() === item.candidateName.toLowerCase()
        );
        if (found) localData = found;
      }
    }
  } catch { }

  // 2. Parse from item.notes
  const notesText = item.notes || '';
  let parsedRec = null;
  let parsedTech = null;
  let parsedComm = null;
  let notesBody = notesText;
  let parsedRound = item.round;
  let parsedSubject = null;

  if (notesText) {
    if (notesText.includes('Strong Hire / Offer')) parsedRec = 'HIRE';
    else if (notesText.includes('Do Not Hire')) parsedRec = 'PASS';
    else if (notesText.includes('Next Round')) parsedRec = 'ADVANCE';

    const techMatch = notesText.match(/Tech:\s*(\d+)\/5/);
    if (techMatch) parsedTech = parseInt(techMatch[1], 10);

    const commMatch = notesText.match(/Comm:\s*(\d+)\/5/);
    if (commMatch) parsedComm = parseInt(commMatch[1], 10);

    const roundMatch = notesText.match(/Next Round:\s*([^|]+)\s*-\s*([^|]+)/);
    if (roundMatch) {
      parsedRound = roundMatch[1]?.trim();
      parsedSubject = roundMatch[2]?.trim();
    }

    const bracketEnd = notesText.indexOf(']');
    if (bracketEnd !== -1) {
      notesBody = notesText.substring(bracketEnd + 1).trim();
    }
  }

  const recommendation = localData?.recommendation || parsedRec;
  if (!recommendation && !notesBody && !localData) {
    return null;
  }

  return {
    recommendation: recommendation || (item.status === 'COMPLETED' ? 'COMPLETED' : null),
    notes: localData?.notes || notesBody || 'Evaluation completed.',
    roundLevel: localData?.roundLevel || parsedRound || item.round,
    subject: localData?.subject || parsedSubject,
    interviewer: localData?.interviewer || item.interviewer || 'Hiring Lead',
    submittedAt: localData?.submittedAt
  };
};

export default function InterviewsView({ setActiveTab }) {
  const { user } = useAuth();
  const role = user?.role || 'CANDIDATE';
  const isAdmin = role === 'ADMIN';
  const isRecruiter = role === 'RECRUITER';
  const isHiringManager = role === 'HIRING_MANAGER';
  const isStaff = isAdmin || isRecruiter || isHiringManager;

  // ── Interviews State (server-persisted) ──
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(false);

  // ── Filters & Search ────────────────────────────────────────────────
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'confirmed', 'scheduled', 'completed'
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [activeReminderToast, setActiveReminderToast] = useState(null);

  // ── Modal State ─────────────────────────────────────────────────────
  const [selectedInterviewDetails, setSelectedInterviewDetails] = useState(null);
  const [selectedFeedbackModal, setSelectedFeedbackModal] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Candidate Date, Slot & Reminder scheduling modal state
  const [schedulingInterview, setSchedulingInterview] = useState(null);
  const [slotDate, setSlotDate] = useState('');
  const [slotTime, setSlotTime] = useState('02:00 PM - 02:45 PM IST');
  const [slotCustomTime, setSlotCustomTime] = useState('');
  const [slotReminder, setSlotReminder] = useState('10');
  const [slotRound, setSlotRound] = useState('');
  const [savingSlot, setSavingSlot] = useState(false);

  // New Interview Form
  const [newTitle, setNewTitle] = useState('');
  const [newCandidateName, setNewCandidateName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newRound, setNewRound] = useState('Round 1: Technical Discovery & Core Skills');
  const [newReminder, setNewReminder] = useState('10');
  const [newInterviewer, setNewInterviewer] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Track already notified interviews to avoid duplicate toasts
  const alertedRef = useRef(new Set());

  // ── Helper: map server interview object to the UI shape ──
  const mapServerInterview = (iv) => {
    const isSlotPending = !iv.interview_date ||
      iv.interview_date === 'To Be Scheduled' ||
      iv.interview_date === 'Not Scheduled' ||
      iv.interview_date === 'Pending Schedule' ||
      !iv.interview_time ||
      iv.interview_time === 'Slot Needed' ||
      iv.interview_time === 'To Be Scheduled' ||
      iv.interview_time === 'Pending';

    const reminderInfo = getReminderSetting(iv.id, iv.candidate_name);
    const diffMin = isSlotPending ? null : getInterviewDiffMinutes(iv.interview_date, iv.interview_time);
    return {
      id: iv.id,
      applicationId: iv.application_id,
      jobTitle: iv.job_title,
      candidateName: iv.candidate_name,
      partnerName: isStaff ? iv.candidate_name : (iv.interviewer_name || 'Hiring Lead'),
      partnerRole: isStaff ? 'Candidate • Interviewing' : 'Interviewer • Technical Lead',
      companyName: iv.company_name || 'Uptrix Partner',
      interviewer: iv.interviewer_name,
      date: iv.interview_date,
      time: iv.interview_time,
      isSlotPending,
      duration: iv.duration || '45 mins',
      round: iv.round || 'Round 1: Technical Discovery & Core Skills',
      mode: iv.mode || 'Google Meet',
      meetingProvider: iv.meeting_provider,
      meetingUrl: iv.meeting_url || iv.meet_url,
      meetingCode: iv.meeting_code,
      googleSpaceName: iv.google_space_name,
      meetingCreatedAt: iv.meeting_created_at,
      meetUrl: iv.meeting_url || iv.meet_url,
      meetingLink: iv.meeting_url || iv.meet_url,
      notes: iv.notes,
      status: isSlotPending ? 'NEEDS_SCHEDULING' : (iv.status || 'CONFIRMED'),
      countdown: isSlotPending ? 'Slot Needed' : (iv.status === 'SCHEDULED' ? 'Rescheduled' : 'Upcoming'),
      reminderMinutes: reminderInfo?.reminderMinutes || 10,
      diffMinutes: diffMin,
      avatarColor: 'bg-[#00a884]',
      initials: ((isStaff ? iv.candidate_name : (iv.interviewer_name || iv.company_name)) || 'HL')
        .split(' ')
        .filter(Boolean)
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    };
  };

  const loadInterviews = async () => {
    setLoading(true);
    try {
      const data = await api.getInterviews();
      const mapped = (Array.isArray(data) ? data : []).map(mapServerInterview);
      setInterviews(mapped);
    } catch {
      setInterviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInterviews();
    const handleFeedbackUpdate = () => {
      loadInterviews();
    };
    window.addEventListener('storage', handleFeedbackUpdate);
    window.addEventListener('uptrix_feedback_updated', handleFeedbackUpdate);
    return () => {
      window.removeEventListener('storage', handleFeedbackUpdate);
      window.removeEventListener('uptrix_feedback_updated', handleFeedbackUpdate);
    };
  }, [user?.role]);

  // ── Periodic Checker: Toast when interview is within 10 minutes ──
  useEffect(() => {
    const checkUpcomingReminders = () => {
      if (!interviews || interviews.length === 0) return;

      interviews.forEach((item) => {
        if (item.isSlotPending) return;
        const diff = getInterviewDiffMinutes(item.date, item.time);
        const threshold = item.reminderMinutes || 10;

        // If interview starts within reminder threshold (e.g. <= 10 mins and not concluded)
        if (diff !== null && diff <= threshold && diff >= -5) {
          if (!alertedRef.current.has(item.id)) {
            alertedRef.current.add(item.id);
            setActiveReminderToast({
              id: item.id,
              candidateName: item.partnerName || item.candidateName || 'Candidate',
              jobTitle: item.jobTitle || 'Interview Session',
              round: item.round || 'Round 1',
              time: item.time,
              date: item.date,
              meetUrl: item.meetUrl,
              reminderMinutes: threshold,
              diffMinutes: diff,
              message: `You have an interview at this time (before ${threshold} min of interview)`
            });
          }
        }
      });
    };

    checkUpcomingReminders();
    const timer = setInterval(checkUpcomingReminders, 15000);
    return () => clearInterval(timer);
  }, [interviews]);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleTriggerReminderToast = (item) => {
    const threshold = item.reminderMinutes || 10;
    const diff = getInterviewDiffMinutes(item.date, item.time);
    setActiveReminderToast({
      id: item.id,
      candidateName: item.partnerName || item.candidateName || 'Candidate',
      jobTitle: item.jobTitle || 'Interview Session',
      round: item.round || 'Round 1',
      time: item.time,
      date: item.date,
      meetUrl: item.meetUrl,
      reminderMinutes: threshold,
      diffMinutes: diff !== null ? diff : threshold,
      message: `You have an interview at this time (before ${threshold} min of interview)`
    });
  };

  const handleCopyMeetLink = (id, url) => {
    if (!url) return;
    navigator.clipboard?.writeText(url);
    setCopiedId(id);
    triggerToast('Meeting link copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenScheduleModal = () => {
    if (!isRecruiter) return;
    setNewTitle('');
    setNewCandidateName('');
    setNewCompany(user?.company_name || 'Uptrix Partner');

    // Pre-populate with current date and time ~10 mins from now for immediate testing
    const today = new Date();
    const todayStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const tenMinLater = new Date(today.getTime() + 10 * 60000);
    const timeStr = tenMinLater.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    setNewDate(todayStr);
    setNewTime(`${timeStr} IST`);
    setNewRound('Round 1: Technical Discovery & Core Skills');
    setNewReminder('10');
    setNewInterviewer(user?.full_name || 'Hiring Lead');
    setNewNotes('');
    setShowScheduleModal(true);
  };

  const handleCreateInterview = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const candidateName = newCandidateName.trim() || 'Candidate';
    const defaultDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const chosenDate = newDate.trim() || defaultDate;
    const chosenTime = newTime.trim() || '2:30 PM - 3:15 PM IST';
    const reminderVal = parseInt(newReminder, 10) || 10;

    try {
      const created = await api.createInterview({
        job_title: newTitle.trim(),
        candidate_name: candidateName,
        interviewer_name: newInterviewer || (user?.full_name || 'Hiring Lead'),
        interview_date: chosenDate,
        interview_time: chosenTime,
        duration: '45 mins',
        round: newRound,
        mode: 'Interview',
        meet_url: null,
        notes: newNotes || null,
        status: 'CONFIRMED'
      });

      // Persist reminder settings
      const interviewId = created?.id || `iv_${Date.now()}`;
      try {
        const raw = localStorage.getItem('uptrix_interview_reminders') || '{}';
        const parsed = JSON.parse(raw);
        parsed[interviewId] = {
          reminderMinutes: reminderVal,
          candidateName: candidateName,
          jobTitle: newTitle.trim(),
          round: newRound,
          time: chosenTime,
          date: chosenDate
        };
        parsed[candidateName.toLowerCase()] = {
          reminderMinutes: reminderVal,
          candidateName: candidateName,
          jobTitle: newTitle.trim(),
          round: newRound,
          time: chosenTime,
          date: chosenDate
        };
        localStorage.setItem('uptrix_interview_reminders', JSON.stringify(parsed));
      } catch (err) {
        console.error('Error saving reminder setting:', err);
      }

      await loadInterviews();
      setShowScheduleModal(false);
      triggerToast(`✨ Interview scheduled! ${reminderVal}-minute reminder alert active.`);

      // Trigger toaster notification preview
      setActiveReminderToast({
        id: interviewId,
        candidateName: candidateName,
        jobTitle: newTitle.trim(),
        round: newRound,
        time: chosenTime,
        date: chosenDate,
        reminderMinutes: reminderVal,
        diffMinutes: reminderVal,
        message: `You have an interview at this time (before ${reminderVal} min of interview)`
      });
    } catch (err) {
      triggerToast(`Error scheduling interview: ${err.message}`);
    }
  };

  const handleOpenCandidateScheduler = (item) => {
    if (!isRecruiter) return;
    setSchedulingInterview(item);

    const tomorrow = new Date(Date.now() + 86400000);
    const tomorrowISO = tomorrow.toISOString().split('T')[0];

    let dateDefault = tomorrowISO;
    if (item.date && !item.isSlotPending) {
      try {
        const parsed = parseInterviewDateTime(item.date, item.time);
        if (parsed && !isNaN(parsed.getTime())) {
          dateDefault = parsed.toISOString().split('T')[0];
        } else {
          const direct = new Date(item.date);
          if (!isNaN(direct.getTime())) {
            dateDefault = direct.toISOString().split('T')[0];
          }
        }
      } catch {
        dateDefault = tomorrowISO;
      }
    }
    setSlotDate(dateDefault);

    const popularSlots = [
      '10:00 AM - 10:45 AM IST',
      '11:30 AM - 12:15 PM IST',
      '02:00 PM - 02:45 PM IST',
      '03:30 PM - 04:15 PM IST',
      '05:00 PM - 05:45 PM IST'
    ];

    if (item.time && popularSlots.includes(item.time)) {
      setSlotTime(item.time);
      setSlotCustomTime('');
    } else if (item.time && !item.isSlotPending) {
      setSlotTime('custom');
      setSlotCustomTime(item.time);
    } else {
      setSlotTime('02:00 PM - 02:45 PM IST');
      setSlotCustomTime('');
    }

    const currentRem = getReminderSetting(item.id, item.candidateName);
    setSlotReminder(String(currentRem?.reminderMinutes || item.reminderMinutes || 10));
    setSlotRound(item.round || 'Round 2 - Performance Marketing, Paid Ads & ROAS Optimization');
  };

  const handleSaveCandidateSchedule = async (e) => {
    e.preventDefault();
    if (!schedulingInterview) return;

    if (!slotDate) {
      triggerToast('Please pick an interview date');
      return;
    }

    const rawTime = slotTime === 'custom' ? slotCustomTime : slotTime;
    if (!rawTime || !rawTime.trim()) {
      triggerToast('Please specify a time slot (IST)');
      return;
    }

    setSavingSlot(true);
    try {
      let formattedDate = slotDate;
      if (slotDate.includes('-')) {
        const [y, m, d] = slotDate.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        if (!isNaN(dt.getTime())) {
          formattedDate = dt.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
        }
      }

      let formattedTime = rawTime.trim();
      if (!formattedTime.toUpperCase().includes('IST')) {
        formattedTime = `${formattedTime} IST`;
      }

      const reminderVal = parseInt(slotReminder, 10) || 10;

      // 1. Call backend updateInterview
      await api.updateInterview(schedulingInterview.id, {
        interview_date: formattedDate,
        interview_time: formattedTime,
        round: slotRound || schedulingInterview.round,
        status: 'CONFIRMED'
      });

      // 2. Persist reminder in localStorage
      try {
        const raw = localStorage.getItem('uptrix_interview_reminders') || '{}';
        const parsed = JSON.parse(raw);
        const remObj = {
          reminderMinutes: reminderVal,
          candidateName: schedulingInterview.candidateName,
          jobTitle: schedulingInterview.jobTitle,
          round: slotRound || schedulingInterview.round,
          time: formattedTime,
          date: formattedDate
        };
        parsed[schedulingInterview.id] = remObj;
        if (schedulingInterview.candidateName) {
          parsed[schedulingInterview.candidateName.toLowerCase()] = remObj;
        }
        localStorage.setItem('uptrix_interview_reminders', JSON.stringify(parsed));
        window.dispatchEvent(new Event('storage'));
      } catch (err) {
        console.error('Error saving reminder setting:', err);
      }

      // 3. Reload interviews
      await loadInterviews();

      // 4. Toast
      triggerToast(`✨ Scheduled for ${schedulingInterview.candidateName}: ${formattedDate} at ${formattedTime} (${reminderVal}m reminder active)`);

      // 5. Trigger toast preview
      setActiveReminderToast({
        id: schedulingInterview.id,
        candidateName: schedulingInterview.candidateName,
        jobTitle: schedulingInterview.jobTitle,
        round: slotRound || schedulingInterview.round,
        time: formattedTime,
        date: formattedDate,
        meetUrl: slotMeetUrl?.trim() || null,
        reminderMinutes: reminderVal,
        diffMinutes: reminderVal,
        message: `You have an interview at this time (before ${reminderVal} min of interview)`
      });

      // 6. Close modal
      setSchedulingInterview(null);
    } catch (err) {
      triggerToast(`Error scheduling interview: ${err.message || 'Failed to save'}`);
    } finally {
      setSavingSlot(false);
    }
  };

  const handleDeleteInterview = async (id) => {
    if (!isRecruiter) return;
    try {
      await api.deleteInterview(id);
      await loadInterviews();
      triggerToast('Interview removed from pipeline.');
    } catch (err) {
      triggerToast(`Error deleting interview: ${err.message}`);
    }
  };

  const pendingSlotCount = interviews.filter(i => i.isSlotPending).length;
  const confirmedCount = interviews.filter(i => !i.isSlotPending && i.status === 'CONFIRMED').length;
  const scheduledCount = interviews.filter(i => i.isSlotPending || i.status === 'SCHEDULED').length;
  const completedCount = interviews.filter(i => i.status === 'COMPLETED').length;

  const validScheduledInterviews = interviews.filter(i => !i.isSlotPending);
  const nextInterview = validScheduledInterviews[0];
  const nextSessionTitle = nextInterview
    ? `${nextInterview.date || 'Upcoming'}${nextInterview.time ? ` · ${nextInterview.time}` : ''}`
    : (pendingSlotCount > 0 ? `${pendingSlotCount} Slot(s) Pending` : 'None Scheduled');
  const nextSessionSub = nextInterview
    ? `${nextInterview.mode || 'Meeting'} Room Ready (${nextInterview.partnerName || 'Candidate'})`
    : (pendingSlotCount > 0 ? 'Awaiting recruiter date & slot entry' : 'Awaiting scheduled sessions');

  const readinessTitle = interviews.length > 0
    ? (pendingSlotCount > 0 ? `${pendingSlotCount} Slot(s) Needed` : (confirmedCount === interviews.length ? '100% Confirmed' : `${confirmedCount} of ${interviews.length} Confirmed`))
    : 'Pipeline Clear';
  const readinessSub = interviews.length > 0
    ? (pendingSlotCount > 0 ? 'Enter date & slot in table below' : 'Meeting links verified & ready')
    : 'Awaiting candidate scheduling';

  const filteredInterviews = interviews.filter(item => {
    if (activeFilter === 'confirmed' && (item.isSlotPending || item.status !== 'CONFIRMED')) return false;
    if (activeFilter === 'scheduled' && (!item.isSlotPending && item.status !== 'SCHEDULED')) return false;
    if (activeFilter === 'completed' && item.status !== 'COMPLETED') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchCandidate = (item.partnerName || '').toLowerCase().includes(q);
      const matchRole = (item.jobTitle || '').toLowerCase().includes(q);
      const matchCompany = (item.companyName || '').toLowerCase().includes(q);
      const matchRound = (item.round || '').toLowerCase().includes(q);
      const matchInterviewer = (item.interviewer || '').toLowerCase().includes(q);
      const matchMode = (item.mode || '').toLowerCase().includes(q);
      if (!matchCandidate && !matchRole && !matchCompany && !matchRound && !matchInterviewer && !matchMode) {
        return false;
      }
    }
    return true;
  });

  const inputClass = 'w-full px-3 py-2 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 bg-white placeholder:text-slate-400 focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)]';
  const selectClass = 'w-full px-3 py-2 rounded-xl border border-slate-200/90 text-xs font-semibold text-slate-700 bg-white focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)] cursor-pointer';

  return (
    <div
      className="p-4 sm:p-7 max-w-7xl mx-auto space-y-6 bg-[#F7F8FB] min-h-full antialiased text-slate-800"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
    >

      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-[28px] font-semibold text-slate-900 leading-tight tracking-tight m-0">
              {isRecruiter
                ? 'Candidate Interview Pipeline'
                : isAdmin
                  ? 'Candidate Interview Pipeline'
                  : isHiringManager
                    ? 'Scheduled Interviews'
                    : 'My Scheduled Interviews'}
            </h1>

            {isAdmin && (
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-semibold">
                Admin · Read Only
              </span>
            )}
            {isHiringManager && (
              <span className="px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-semibold">
                Hiring Manager · Read & Join
              </span>
            )}
          </div>

          <p className="text-sm text-slate-500 mt-1.5 m-0">
            {isRecruiter
              ? 'Coordinate live technical evaluations, track scheduled video sessions, and record candidate assessment scores.'
              : isAdmin
                ? 'Organization-wide read-only view of all scheduled candidate interviews and assessment rounds.'
                : isHiringManager
                  ? 'Review candidate evaluation rounds and directly join your scheduled live video interview sessions.'
                  : 'View your scheduled interview sessions and join your upcoming video conference rounds.'}
          </p>
        </div>

        {isRecruiter && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenScheduleModal}
              className="px-4 py-2.5 rounded-lg bg-[#FF7043] hover:bg-[#E65B30] text-white text-xs font-semibold shadow-[0_1px_2px_rgba(255,112,67,0.3)] transition-colors flex items-center gap-1.5 cursor-pointer border-none"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Interview</span>
            </button>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 px-4 rounded-xl bg-slate-900 text-white text-xs font-medium flex items-center justify-between shadow-lg animate-in fade-in">
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white border-none bg-transparent cursor-pointer ml-4 p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Floating 10-Minute Upcoming Interview Reminder Toaster Alert ── */}
      {activeReminderToast && (
        <div className="fixed top-5 right-5 z-[9999] max-w-md w-[calc(100%-2.5rem)] sm:w-96 p-4 rounded-2xl bg-slate-900/95 backdrop-blur-md text-white shadow-2xl border-2 border-amber-500/80 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 animate-bounce text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <span>Upcoming Interview Alert</span>
                  {activeReminderToast.diffMinutes !== undefined && activeReminderToast.diffMinutes !== null && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-mono text-[10px]">
                      {activeReminderToast.diffMinutes <= 0 ? 'LIVE NOW' : `in ~${activeReminderToast.diffMinutes}m`}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveReminderToast(null)}
                  className="text-slate-400 hover:text-white bg-transparent border-none cursor-pointer p-0"
                  title="Close notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs font-bold text-white mt-1 leading-snug">
                {activeReminderToast.message || "You have an interview at this time (before 10 min of interview)"}
              </p>

              <div className="mt-2.5 p-2.5 rounded-xl bg-slate-800/90 border border-slate-700/60 text-xs text-slate-300 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Candidate:</span>
                  <span className="font-semibold text-white truncate max-w-[170px]">{activeReminderToast.candidateName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Target Role:</span>
                  <span className="font-medium text-slate-200 truncate max-w-[170px]">{activeReminderToast.jobTitle}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Round:</span>
                  <span className="font-medium text-indigo-300 truncate max-w-[170px]">{activeReminderToast.round}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Scheduled:</span>
                  <span className="font-mono text-amber-300">{activeReminderToast.time} · {activeReminderToast.date}</span>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const found = interviews.find(iv => iv.id === activeReminderToast.id);
                    if (found) setSelectedInterviewDetails(found);
                    setActiveReminderToast(null);
                  }}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-[#5C59E8] hover:bg-[#4845D2] text-white font-semibold text-xs flex items-center justify-center gap-1.5 border-none cursor-pointer shadow-xs transition-colors"
                >
                  <span>View Session Details</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveReminderToast(null)}
                  className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border-none cursor-pointer transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Metrics Bar (Compact) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)] px-4 py-3 transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Upcoming Rounds
            </span>
            <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-500 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-none">
            {interviews.length} Scheduled
          </div>
          <p className="text-[11px] text-slate-400 mt-1 m-0">Active pipeline sessions</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)] px-4 py-3 transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">
              Next Session
            </span>
            <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-none truncate" title={nextSessionTitle}>
            {nextSessionTitle}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 m-0 truncate">{nextSessionSub}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)] px-4 py-3 transition-all">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-[#00a884] uppercase tracking-wider">
              Readiness & Status
            </span>
            <div className="w-6 h-6 rounded-md bg-teal-50 text-[#00a884] flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-none truncate">
            {readinessTitle}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 m-0 truncate">{readinessSub}</p>
        </div>
      </div>

      {/* ── In-Page Segmented Tab Filter & Quick Search Bar ── */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="inline-flex p-1 bg-slate-100/80 rounded-xl overflow-x-auto no-scrollbar shrink-0 gap-1">
          {[
            { id: 'all', label: 'All Interviews', count: interviews.length },
            { id: 'confirmed', label: 'Confirmed', count: confirmedCount },
            { id: 'scheduled', label: 'Scheduled', count: scheduledCount },
            { id: 'completed', label: 'Completed', count: completedCount }
          ].map(tab => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border-none cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                    isActive ? 'bg-slate-100 text-slate-900' : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input & Timezone Notice */}
        <div className="flex items-center gap-3 flex-1 justify-end">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search candidate, role, round..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-2 bg-white focus:bg-white border border-slate-200/90 focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 rounded-xl text-xs text-slate-800 outline-none transition-all placeholder:text-slate-400 shadow-[0_1px_2px_rgba(15,23,42,0.02)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer p-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="hidden lg:block text-[11px] text-slate-400 font-medium whitespace-nowrap px-1">
            Times displayed in <span className="font-semibold text-slate-700">IST</span>
          </div>
        </div>
      </div>

      {/* ── Candidate Interview Pipeline Table / Empty State ── */}
      {filteredInterviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-10 sm:p-14 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#5C59E8] flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6" />
          </div>
          {interviews.length === 0 ? (
            <>
              <h3 className="text-sm font-semibold text-slate-900">
                {isRecruiter
                  ? 'No Candidate Interviews Scheduled'
                  : isAdmin
                    ? 'No Candidate Interviews Scheduled'
                    : isHiringManager
                      ? 'No Scheduled Interviews'
                      : 'No Scheduled Interviews Yet'}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                {isRecruiter
                  ? 'When you schedule an interview from the Application Status & Hiring Funnel or schedule one directly, it will appear here in this table with one-click Google Meet, Zoom, or Teams links.'
                  : isAdmin
                    ? 'There are currently no candidate interview sessions scheduled across the organization. Scheduled interviews will appear here in read-only mode.'
                    : isHiringManager
                      ? 'There are currently no candidate interview rounds scheduled. When interviews are booked, they will appear here with direct conference links for you to join.'
                      : 'You do not have any scheduled interviews right now. When a recruiter schedules an interview round for your application, it will appear here with your conference link.'}
              </p>
              {isRecruiter ? (
                <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                  <button
                    type="button"
                    onClick={handleOpenScheduleModal}
                    className="px-4 py-2 rounded-lg bg-[#FF7043] hover:bg-[#E65B30] text-white text-xs font-semibold border-none cursor-pointer shadow-[0_1px_2px_rgba(255,112,67,0.3)] flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Schedule Interview</span>
                  </button>
                  {typeof setActiveTab === 'function' && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('application_status')}
                      className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border-none cursor-pointer flex items-center gap-1.5 transition-colors"
                    >
                      <span>Go to Hiring Funnel</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : !isStaff ? (
                typeof setActiveTab === 'function' && (
                  <div className="flex items-center justify-center gap-2.5 mt-4 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setActiveTab('my_applications')}
                      className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold border-none cursor-pointer shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      <span>View My Applications</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              ) : null}
            </>
          ) : (
            <>
              <h3 className="text-sm font-semibold text-slate-900">No matching interviews found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No interviews match the current filter "{activeFilter}" {searchQuery ? `or search "${searchQuery}"` : ''}.
              </p>
              <button
                type="button"
                onClick={() => { setActiveFilter('all'); setSearchQuery(''); }}
                className="mt-4 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border-none cursor-pointer transition-colors"
              >
                Clear Filter & Search ({interviews.length})
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">{isStaff ? 'Candidate & Target Role' : 'Interviewer & Role'}</th>
                  <th className="py-3.5 px-5">Round of Interview</th>
                  <th className="py-3.5 px-5">Date & Slot (IST)</th>
                  <th className="py-3.5 px-5 text-center">Reminder Alert</th>
                  <th className="py-3.5 px-5 text-center">Status</th>
                  <th className="py-3.5 px-5 text-right">{isAdmin ? 'Access' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-normal">
                {filteredInterviews.map((item) => {
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Candidate & Role */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-semibold flex items-center justify-center text-xs shrink-0 ring-1 ring-slate-200/70">
                            {item.initials || 'CA'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 truncate flex items-center gap-1.5 text-xs sm:text-sm">
                              <span>{item.partnerName || (isRecruiter ? 'Candidate' : 'Interviewer')}</span>
                              {item.partnerRole && (
                                <span className="text-[11px] font-normal text-slate-400">({item.partnerRole})</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5 truncate">
                              <button
                                type="button"
                                onClick={() => setSelectedInterviewDetails(item)}
                                className="font-semibold text-slate-800 hover:text-[#5C59E8] hover:underline truncate inline-flex items-center gap-1 cursor-pointer no-underline group border-none bg-transparent p-0 text-left transition-colors"
                                title="View interview details"
                              >
                                <span>{item.jobTitle}</span>
                                <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-[#5C59E8] group-hover:translate-x-0.5 transition-all shrink-0" />
                              </button>
                              {item.companyName && (
                                <>
                                  <span className="text-slate-300">·</span>
                                  <span className="text-slate-400 flex items-center gap-1 truncate">
                                    <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                                    {item.companyName}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Assessment Round & Topics */}
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-slate-800 text-xs truncate max-w-[200px]" title={item.round}>
                          {item.round}
                        </div>
                        {item.topics && item.topics.length > 0 ? (
                          <div className="flex items-center gap-1 flex-wrap mt-1">
                            {item.topics.slice(0, 3).map((t, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.2 rounded bg-slate-100 text-[10px] font-medium text-slate-600"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        ) : (
                          item.interviewer && (
                            <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                              Lead: <span className="font-medium text-slate-600">{item.interviewer}</span>
                            </div>
                          )
                        )}

                        {/* Interview Feedback Message Chip if feedback is recorded */}
                        {(() => {
                          const fb = getInterviewFeedback(item);
                          if (!fb) return null;
                          if (fb.recommendation === 'HIRE') {
                            return (
                              <button
                                type="button"
                                onClick={() => setSelectedFeedbackModal({ item, feedback: fb })}
                                className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-all cursor-pointer shadow-2xs"
                              >
                                <Award className="w-3 h-3 text-emerald-600" />
                                <span>Strong Hire / Offer</span>
                              </button>
                            );
                          }
                          if (fb.recommendation === 'PASS') {
                            return (
                              <button
                                type="button"
                                onClick={() => setSelectedFeedbackModal({ item, feedback: fb })}
                                className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 transition-all cursor-pointer shadow-2xs"
                              >
                                <XCircle className="w-3 h-3 text-rose-600" />
                                <span>Do Not Hire · Feedback</span>
                              </button>
                            );
                          }
                          if (fb.recommendation === 'ADVANCE') {
                            return (
                              <button
                                type="button"
                                onClick={() => setSelectedFeedbackModal({ item, feedback: fb })}
                                className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-all cursor-pointer shadow-2xs"
                              >
                                <RefreshCw className="w-3 h-3 text-amber-600" />
                                <span>Next Round Feedback</span>
                              </button>
                            );
                          }
                          return (
                            <button
                              type="button"
                              onClick={() => setSelectedFeedbackModal({ item, feedback: fb })}
                              className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 transition-all cursor-pointer shadow-2xs"
                            >
                              <MessageSquare className="w-3 h-3 text-purple-600" />
                              <span>View Feedback</span>
                            </button>
                          );
                        })()}
                      </td>

                      {/* Date & Time (IST) */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        {item.isSlotPending ? (
                          <div className="flex flex-col items-start gap-1.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 font-semibold text-[11px] shadow-2xs">
                              <AlertCircle className="w-3 h-3 text-amber-600 animate-pulse shrink-0" />
                              <span>Slot Not Scheduled</span>
                            </span>
                            {isRecruiter && (
                              <button
                                type="button"
                                onClick={() => handleOpenCandidateScheduler(item)}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5C59E8] hover:underline cursor-pointer bg-transparent border-none p-0"
                              >
                                <Calendar className="w-3 h-3 text-[#5C59E8]" />
                                <span>Enter Date & Slot (IST) →</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5 font-semibold text-slate-900 text-xs">
                                <Calendar className="w-3.5 h-3.5 text-[#00a884] shrink-0" />
                                <span>{item.date}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                                <div className="flex items-center gap-1 font-medium text-slate-600">
                                  <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{item.time}</span>
                                </div>
                                {item.countdown && (
                                  <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">
                                    {item.countdown}
                                  </span>
                                )}
                              </div>
                            </div>
                            {isRecruiter && (
                              <button
                                type="button"
                                onClick={() => handleOpenCandidateScheduler(item)}
                                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-[#5C59E8] cursor-pointer border-none bg-transparent transition-colors"
                                title="Reschedule Date, Slot & Reminder"
                              >
                                <Calendar className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Reminder Alert */}
                      <td className="py-3.5 px-5 text-center whitespace-nowrap">
                        <div className="inline-flex flex-col items-center gap-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                            <Bell className="w-3 h-3 text-amber-600 animate-pulse" />
                            <span>{item.reminderMinutes || 10}m before</span>
                          </span>
                          {isRecruiter ? (
                            <button
                              type="button"
                              onClick={() => handleOpenCandidateScheduler(item)}
                              className="text-[10px] font-semibold text-[#5C59E8] hover:underline border-none bg-transparent cursor-pointer inline-flex items-center gap-0.5"
                              title="Set or change reminder alert"
                            >
                              <span>Set Reminder</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleTriggerReminderToast(item)}
                              className="text-[10px] font-semibold text-[#5C59E8] hover:underline border-none bg-transparent cursor-pointer inline-flex items-center gap-0.5"
                              title="Trigger interview reminder toaster preview"
                            >
                              <span>🔔 Test Toast</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-5 text-center whitespace-nowrap">
                        {(() => {
                          if (item.isSlotPending) {
                            return (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                <span>Slot Needed</span>
                              </span>
                            );
                          }
                          const diff = getInterviewDiffMinutes(item.date, item.time);
                          const threshold = item.reminderMinutes || 10;
                          if (diff !== null && diff <= threshold && diff >= 0) {
                            return (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-xs animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                <span>In ~{diff}m (Upcoming)</span>
                              </span>
                            );
                          }
                          if (diff !== null && diff < 0 && diff >= -60) {
                            return (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                <span>Live Now</span>
                              </span>
                            );
                          }
                          if (item.status === 'COMPLETED' || (diff !== null && diff < -60)) {
                            return (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                <span>Completed</span>
                              </span>
                            );
                          }
                          return (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>Upcoming ({item.status})</span>
                            </span>
                          );
                        })()}
                      </td>

                      {/* Actions / Access */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Administrator: Strict Read-Only */}
                          {isAdmin && (
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/80 text-slate-500 text-[10px] font-semibold">
                              Read-Only
                            </span>
                          )}

                          {/* Hiring Manager: View Details */}
                          {isHiringManager && (
                            <button
                              type="button"
                              onClick={() => setSelectedInterviewDetails(item)}
                              className="py-1.5 px-2.5 rounded-lg border border-slate-200/80 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
                            >
                              Details
                            </button>
                          )}

                          {/* Recruiter: Management */}
                          {isRecruiter && (
                            <>
                              {item.isSlotPending ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenCandidateScheduler(item)}
                                  className="py-1.5 px-3 rounded-lg bg-[#5C59E8] hover:bg-[#4845D2] text-white text-xs font-semibold transition-all cursor-pointer border-none shadow-xs flex items-center gap-1.5"
                                  title="Enter interview date, slot and reminder"
                                >
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span>Enter Slot & Reminder</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenCandidateScheduler(item)}
                                  className="py-1.5 px-2.5 rounded-lg border border-indigo-200/80 bg-indigo-50/70 hover:bg-indigo-100 text-[#4845D2] text-xs font-semibold transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                                  title="Reschedule / Edit Date, Slot & Reminder"
                                >
                                  <Calendar className="w-3.5 h-3.5 text-[#5C59E8]" />
                                  <span>Edit Slot</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setSelectedInterviewDetails(item)}
                                className="py-1.5 px-2.5 rounded-lg border border-slate-200/80 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
                              >
                                Details
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteInterview(item.id)}
                                className="p-1.5 rounded-lg border border-slate-200/80 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
                                title="Remove interview from pipeline"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {/* Candidate: View Details & Feedback */}
                          {!isStaff && (
                            <div className="flex items-center gap-1.5 justify-end">
                              <button
                                type="button"
                                onClick={() => setSelectedInterviewDetails(item)}
                                className="py-1.5 px-2.5 rounded-lg border border-slate-200/80 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
                              >
                                Details
                              </button>
                              {(() => {
                                const fb = getInterviewFeedback(item);
                                if (!fb) return null;
                                return (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedFeedbackModal({ item, feedback: fb })}
                                    className="px-2.5 py-1.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-semibold transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                                    title="View interviewer feedback & evaluation notes"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                                    <span>Feedback</span>
                                  </button>
                                );
                              })()}
                            </div>
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

      {/* ── MODAL: SCHEDULE CANDIDATE DATE, SLOT & REMINDER ── */}
      {schedulingInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in select-text">
          <div className="w-full max-w-xl bg-white rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-200/80 text-slate-800 relative max-h-[92vh] overflow-y-auto no-scrollbar">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#5C59E8] flex items-center justify-center font-bold text-sm shadow-2xs">
                  {schedulingInterview.initials || 'CA'}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <span>Enter Date, Slot & Reminder</span>
                    {schedulingInterview.isSlotPending && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                        Slot Needed
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    For: <strong className="text-slate-800">{schedulingInterview.candidateName}</strong> · {schedulingInterview.jobTitle}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSchedulingInterview(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCandidateSchedule} className="space-y-4 text-xs">
              {/* Round of Interview */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Round of Interview *
                </label>
                <select
                  value={slotRound}
                  onChange={e => setSlotRound(e.target.value)}
                  className={selectClass}
                >
                  <option value="Round 1 - Digital Marketing Fundamentals & Channel Screening">Round 1 - Digital Marketing Fundamentals & Channel Screening</option>
                  <option value="Round 2 - Performance Marketing, Paid Ads & ROAS Optimization">Round 2 - Performance Marketing, Paid Ads & ROAS Optimization</option>
                  <option value="Round 3 - Growth Marketing, Funnel Strategy & Conversion Optimization">Round 3 - Growth Marketing, Funnel Strategy & Conversion Optimization</option>
                  <option value="Round 4 - Brand Strategy & Marketing Campaign Leadership">Round 4 - Brand Strategy & Marketing Campaign Leadership</option>
                  <option value="Final Round - Head of Marketing / Executive & Culture Fit">Final Round - Head of Marketing / Executive & Culture Fit</option>
                  <option value="HR Discussion & Offer Negotiation">HR Discussion & Offer Negotiation</option>
                </select>
              </div>

              {/* Date Selection */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-slate-700">
                    Interview Date (IST) *
                  </label>
                  {/* Quick Date Presets */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSlotDate(new Date().toISOString().split('T')[0])}
                      className="px-2 py-1 rounded-lg text-[10px] font-medium bg-white border border-slate-200 text-slate-600 hover:text-[#5C59E8] hover:border-indigo-300 cursor-pointer shadow-2xs"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setSlotDate(new Date(Date.now() + 86400000).toISOString().split('T')[0])}
                      className="px-2 py-1 rounded-lg text-[10px] font-medium bg-white border border-slate-200 text-slate-600 hover:text-[#5C59E8] hover:border-indigo-300 cursor-pointer shadow-2xs"
                    >
                      Tomorrow
                    </button>
                    <button
                      type="button"
                      onClick={() => setSlotDate(new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0])}
                      className="px-2 py-1 rounded-lg text-[10px] font-medium bg-white border border-slate-200 text-slate-600 hover:text-[#5C59E8] hover:border-indigo-300 cursor-pointer shadow-2xs"
                    >
                      +2 Days
                    </button>
                  </div>
                </div>

                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={slotDate}
                  onChange={e => setSlotDate(e.target.value)}
                  className={inputClass}
                />

                {slotDate && (
                  <div className="text-[11px] text-[#5C59E8] font-medium flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#5C59E8]" />
                    <span>
                      Selected: {(() => {
                        try {
                          const [y, m, d] = slotDate.split('-').map(Number);
                          return new Date(y, m - 1, d).toLocaleDateString('en-US', {
                            weekday: 'long', month: 'short', day: 'numeric', year: 'numeric'
                          });
                        } catch { return slotDate; }
                      })()}
                    </span>
                  </div>
                )}
              </div>

              {/* Time Slot (IST) Selection */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <label className="block font-semibold text-slate-700">
                  Select Time Slot (IST) *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    '10:00 AM - 10:45 AM IST',
                    '11:30 AM - 12:15 PM IST',
                    '02:00 PM - 02:45 PM IST',
                    '03:30 PM - 04:15 PM IST',
                    '05:00 PM - 05:45 PM IST',
                    'Custom Slot'
                  ].map(slot => {
                    const isSelected = slot === 'Custom Slot' ? slotTime === 'custom' : slotTime === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => {
                          if (slot === 'Custom Slot') {
                            setSlotTime('custom');
                            if (!slotCustomTime) setSlotCustomTime('04:00 PM - 04:45 PM IST');
                          } else {
                            setSlotTime(slot);
                          }
                        }}
                        className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                          isSelected
                            ? 'bg-[#5C59E8] text-white border-[#5C59E8] shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>

                {slotTime === 'custom' && (
                  <div className="pt-2">
                    <label className="block font-medium text-slate-600 text-xs mb-1">
                      Enter Custom Slot (IST)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 04:30 PM - 05:15 PM IST"
                      value={slotCustomTime}
                      onChange={e => setSlotCustomTime(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                )}
              </div>

              {/* Reminder Alert Interval */}
              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-2">
                <label className="block font-semibold text-slate-800 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-amber-600" />
                  <span>Interview Reminder Alert *</span>
                </label>
                <select
                  value={slotReminder}
                  onChange={e => setSlotReminder(e.target.value)}
                  className={selectClass}
                >
                  <option value="5">🔔 5 minutes before interview</option>
                  <option value="10">🔔 10 minutes before interview (Default & Recommended)</option>
                  <option value="15">🔔 15 minutes before interview</option>
                  <option value="30">🔔 30 minutes before interview</option>
                  <option value="60">🔔 1 hour before interview</option>
                  <option value="1440">🔔 1 day before interview</option>
                </select>
                <p className="text-[11px] text-slate-500 font-normal">
                  Recruiter and candidate will receive notification badges and toaster alerts before this interview begins.
                </p>
              </div>

              {/* Form Actions */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSchedulingInterview(null)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 border-none bg-transparent cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSlot}
                  className="px-4 py-2 rounded-lg bg-[#5C59E8] hover:bg-[#4845D2] text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer border-none disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{savingSlot ? 'Saving Schedule...' : 'Save Date, Slot & Reminder'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── SCHEDULE MODAL ── */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in select-text">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-200/80 text-slate-800 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#00a884] flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Schedule Candidate Interview
                  </h3>
                  <p className="text-xs text-slate-400">Enter interview details and meeting link</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInterview} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Candidate Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={newCandidateName}
                    onChange={(e) => setNewCandidateName(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Role / Requisition *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Full Stack Engineer"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company / Organization
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acme Innovations"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="text"
                    placeholder="e.g. Sep 18, 2026"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time Slot (IST)</label>
                  <input
                    type="text"
                    placeholder="e.g. 2:30 PM - 3:15 PM IST"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <span>Round of Interview *</span>
                  </label>
                  <select
                    value={newRound}
                    onChange={(e) => setNewRound(e.target.value)}
                    className={selectClass}
                  >
                    <option value="Round 1: Technical Discovery & Core Skills">Round 1: Technical Discovery & Core Skills</option>
                    <option value="Round 2: System Architecture & Coding">Round 2: System Architecture & Coding</option>
                    <option value="Round 3: Behavioral & Culture Fit">Round 3: Behavioral & Culture Fit</option>
                    <option value="Round 4: Executive & Leadership Review">Round 4: Executive & Leadership Review</option>
                    <option value="HR Round: Screening & Fitment">HR Round: Screening & Fitment</option>
                    <option value="Final Round: Offer Discussion">Final Round: Offer Discussion</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-amber-500" />
                    <span>Interview Reminder Alert *</span>
                  </label>
                  <select
                    value={newReminder}
                    onChange={(e) => setNewReminder(e.target.value)}
                    className={selectClass}
                  >
                    <option value="10">🔔 10 minutes before interview (Recommended)</option>
                    <option value="15">🔔 15 minutes before interview</option>
                    <option value="30">🔔 30 minutes before interview</option>
                    <option value="60">🔔 1 hour before interview</option>
                    <option value="0">🔔 At exact time of interview (0 min)</option>
                  </select>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Recruiter receives a toaster alert before interview starts.
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 border-none bg-transparent cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#FF7043] hover:bg-[#E65B30] text-white text-xs font-semibold border-none cursor-pointer shadow-[0_1px_2px_rgba(255,112,67,0.3)] transition-colors"
                >
                  Confirm & Schedule Interview
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── GOOGLE MEET DETAILS MODAL ── */}
      {selectedInterviewDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in select-text">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-200/80 text-slate-800 relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{selectedInterviewDetails.jobTitle}</h3>
                <p className="text-xs text-slate-400 truncate">{selectedInterviewDetails.partnerName} • {selectedInterviewDetails.round}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInterviewDetails(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Inline Feedback Card in Details Modal if available */}
            {(() => {
              const fb = getInterviewFeedback(selectedInterviewDetails);
              if (!fb) return null;
              return (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-purple-600" />
                      <span>Interview Feedback & Notes</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const it = selectedInterviewDetails;
                        setSelectedInterviewDetails(null);
                        setSelectedFeedbackModal({ item: it, feedback: fb });
                      }}
                      className="text-[#5C59E8] font-semibold text-xs hover:underline bg-transparent border-none cursor-pointer"
                    >
                      View Full Feedback →
                    </button>
                  </div>
                  {fb.notes && (
                    <p className="italic text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200/80 m-0">
                      "{fb.notes}"
                    </p>
                  )}
                </div>
              );
            })()}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedInterviewDetails(null)}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all cursor-pointer border-none shadow-xs"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── INTERVIEW FEEDBACK & EVALUATION SCORECARD MODAL ── */}
      {selectedFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in select-text">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-200/80 text-slate-800 relative space-y-4 max-h-[92vh] overflow-y-auto no-scrollbar">

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold shadow-2xs shrink-0">
                  <MessageSquare className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Interview Evaluation & Feedback
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedFeedbackModal.item.jobTitle} • {selectedFeedbackModal.item.round}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedFeedbackModal(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Recommendation Banner */}
            {selectedFeedbackModal.feedback.recommendation === 'HIRE' && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1.5 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                  <Award className="w-4.5 h-4.5 text-emerald-600" />
                  <span>🎉 Strong Hire / Offer Extended</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed font-normal">
                  The hiring lead and interview panel have given a <strong>Strong Hire</strong> recommendation. An official offer has been extended!
                </p>
              </div>
            )}

            {selectedFeedbackModal.feedback.recommendation === 'PASS' && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 space-y-1.5 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-sm text-rose-800">
                  <XCircle className="w-4.5 h-4.5 text-rose-600" />
                  <span>Interview Outcome · Application Concluded</span>
                </div>
                <p className="text-xs text-rose-800 leading-relaxed font-normal">
                  Interview round completed. The team has recorded feedback and concluded evaluation for this requisition.
                </p>
              </div>
            )}

            {selectedFeedbackModal.feedback.recommendation === 'ADVANCE' && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1.5 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
                  <RefreshCw className="w-4.5 h-4.5 text-amber-600" />
                  <span>🚀 Advanced to Next Round!</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed font-normal">
                  Candidate successfully passed this round and is advanced to the next stage in the hiring pipeline.
                </p>
              </div>
            )}

            {/* Next Round Details if ADVANCE */}
            {(selectedFeedbackModal.feedback.roundLevel || selectedFeedbackModal.feedback.subject) && (
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs space-y-1">
                {selectedFeedbackModal.feedback.roundLevel && (
                  <div className="font-semibold text-slate-800">
                    Next Round: <span className="text-amber-800 font-bold">{selectedFeedbackModal.feedback.roundLevel}</span>
                  </div>
                )}
                {selectedFeedbackModal.feedback.subject && (
                  <div className="font-normal text-slate-600">
                    Subject / Focus: <span className="text-slate-900 font-semibold">{selectedFeedbackModal.feedback.subject}</span>
                  </div>
                )}
              </div>
            )}

            {/* Summary Notes */}
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Evaluation Feedback & Summary Notes
              </span>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed font-normal whitespace-pre-line">
                {selectedFeedbackModal.feedback.notes || 'No written notes provided.'}
              </div>
            </div>

            {/* Metadata Footer */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
              <span>Interviewer: <strong className="text-slate-700">{selectedFeedbackModal.feedback.interviewer || selectedFeedbackModal.item.interviewer || 'Hiring Lead'}</strong></span>
              <button
                type="button"
                onClick={() => setSelectedFeedbackModal(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border-none cursor-pointer transition-colors"
              >
                Close Feedback
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
