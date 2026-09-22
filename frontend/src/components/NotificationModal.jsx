import React, { useState, useEffect } from 'react';
import {
  Bell, CheckCircle2, X, Clock, UserPlus,
  Calendar, Sparkles, CheckCheck, Inbox, Trash2
} from 'lucide-react';
import { api } from '../api';

export default function NotificationModal({ onClose, isDropdown = true, onUpdateUnreadCount }) {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [readIds, setReadIds] = useState(new Set());

  useEffect(() => {
    api.getNotifications()
      .then(list => {
        const raw = list || [];
        setNotifs(raw);
        // Initialize read IDs from DB status
        const alreadyRead = new Set(raw.filter(n => n.is_read).map(n => n.id));
        setReadIds(alreadyRead);
        const unread = raw.filter(n => !alreadyRead.has(n.id)).length;
        onUpdateUnreadCount?.(unread);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [onUpdateUnreadCount]);

  const markAllRead = () => {
    const allIds = new Set(notifs.map(n => n.id));
    setReadIds(allIds);
    onUpdateUnreadCount?.(0);
  };

  const handleClearAll = async () => {
    setNotifs([]);
    setReadIds(new Set());
    onUpdateUnreadCount?.(0);
    try {
      await api.clearNotifications();
    } catch (e) {
      console.error('Failed to clear notifications:', e);
    }
  };

  const handleDeleteOne = async (id) => {
    const remaining = notifs.filter(n => n.id !== id);
    setNotifs(remaining);
    const unreadRemaining = remaining.filter(n => !readIds.has(n.id)).length;
    onUpdateUnreadCount?.(unreadRemaining);
    try {
      await api.deleteNotification(id);
    } catch (e) {
      console.error('Failed to delete notification:', e);
    }
  };

  const getNotifMeta = (title = '', message = '') => {
    const lower = `${title} ${message}`.toLowerCase();
    if (lower.includes('applicant') || lower.includes('applied') || lower.includes('candidate')) {
      return {
        icon: UserPlus,
        bgColor: 'bg-teal-50 text-[#00a884] border-teal-200/70',
        badge: 'Applicant',
        badgeColor: 'bg-teal-50 text-[#00a884] border-teal-200'
      };
    }
    if (lower.includes('interview') || lower.includes('scheduled') || lower.includes('round') || lower.includes('meeting')) {
      return {
        icon: Calendar,
        bgColor: 'bg-purple-50 text-purple-600 border-purple-200/70',
        badge: 'Interview',
        badgeColor: 'bg-purple-50 text-purple-600 border-purple-200'
      };
    }
    if (lower.includes('offer') || lower.includes('hired') || lower.includes('accepted')) {
      return {
        icon: CheckCircle2,
        bgColor: 'bg-emerald-50 text-emerald-600 border-emerald-200/70',
        badge: 'Placement',
        badgeColor: 'bg-emerald-50 text-emerald-600 border-emerald-200'
      };
    }
    return {
      icon: Sparkles,
      bgColor: 'bg-blue-50 text-blue-600 border-blue-200/70',
      badge: 'System',
      badgeColor: 'bg-blue-50 text-blue-600 border-blue-200'
    };
  };

  const formatTime = (isoString) => {
    if (!isoString) return 'Just now';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recently';
    }
  };

  const filteredNotifs = notifs.filter(n => {
    if (activeFilter === 'UNREAD') return !readIds.has(n.id);
    return true;
  });

  const unreadCount = notifs.filter(n => !readIds.has(n.id)).length;

  const content = (
    <div className={`bg-white border border-slate-200/90 shadow-2xl text-slate-800 overflow-hidden flex flex-col ${
      isDropdown
        ? 'w-[350px] sm:w-[390px] rounded-2xl max-h-[480px] animate-in fade-in slide-in-from-top-2 duration-150 ring-1 ring-black/5'
        : 'w-full max-w-lg rounded-2xl sm:rounded-3xl max-h-[85vh]'
    }`}>
      {/* ─── Header ─── */}
      <div className="p-4 sm:p-4.5 border-b border-slate-100 flex items-center justify-between gap-3 bg-white shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#00a884] border border-teal-200/70 flex items-center justify-center shrink-0 shadow-2xs">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Notifications
              </h3>
              {unreadCount > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full text-[0.62rem] font-bold bg-[#00a884] text-white">
                  {unreadCount} new
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded-full text-[0.62rem] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                  Caught up
                </span>
              )}
            </div>
            <p className="text-[0.68rem] text-slate-400">
              Live updates & applicant alerts
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors border-none bg-transparent cursor-pointer"
          title="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ─── Subheader Filter & Actions bar ─── */}
      <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-[0.72rem] transition-all border-none cursor-pointer ${
              activeFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200 font-bold'
                : 'bg-transparent text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            All ({notifs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('UNREAD')}
            className={`px-2.5 py-1 rounded-lg text-[0.72rem] transition-all border-none cursor-pointer ${
              activeFilter === 'UNREAD'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200 font-bold'
                : 'bg-transparent text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="text-[0.68rem] font-semibold text-[#00a884] hover:text-[#008f6f] flex items-center gap-1 border-none bg-transparent cursor-pointer transition-colors"
              title="Mark all as read"
            >
              <CheckCheck className="w-3 h-3" />
              Mark read
            </button>
          )}

          {notifs.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[0.68rem] font-semibold text-slate-400 hover:text-rose-600 flex items-center gap-1 border-none bg-transparent cursor-pointer transition-colors"
              title="Clear all notifications"
            >
              <Trash2 className="w-3 h-3" />
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* ─── Notification List ─── */}
      <div className="p-3 overflow-y-auto flex-1 space-y-2 max-h-[300px]">
        {loading ? (
          <div className="py-8 text-center">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-[#00a884] rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-400">Loading alerts...</p>
          </div>
        ) : filteredNotifs.length === 0 ? (
          <div className="py-8 px-3 text-center">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#00a884] flex items-center justify-center mx-auto mb-2 border border-teal-200/60 shadow-2xs">
              <Inbox className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-700">No notifications</h4>
            <p className="text-[0.68rem] text-slate-400 max-w-xs mx-auto mt-0.5">
              {activeFilter === 'UNREAD'
                ? 'All unread notifications have been reviewed.'
                : 'All notifications have been cleared.'}
            </p>
          </div>
        ) : (
          filteredNotifs.map((n) => {
            const meta = getNotifMeta(n.title, n.message);
            const MetaIcon = meta.icon;
            const isRead = readIds.has(n.id);

            return (
              <div
                key={n.id}
                onClick={() => {
                  setReadIds(prev => {
                    const next = new Set(prev);
                    next.add(n.id);
                    const unreadRemaining = notifs.filter(item => !next.has(item.id)).length;
                    onUpdateUnreadCount?.(unreadRemaining);
                    return next;
                  });
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 group relative ${
                  isRead
                    ? 'bg-white border-slate-100 hover:border-slate-200'
                    : 'bg-white border-slate-200/90 hover:border-teal-300 shadow-2xs hover:shadow-xs'
                }`}
              >
                {/* Icon Badge */}
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${meta.bgColor}`}>
                  <MetaIcon className="w-3.5 h-3.5" />
                </div>

                {/* Body Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-bold text-xs text-slate-900 group-hover:text-[#00a884] transition-colors truncate">
                        {n.title}
                      </span>
                      <span className={`px-1 py-0.2 rounded text-[0.58rem] font-bold border uppercase tracking-wider shrink-0 ${meta.badgeColor}`}>
                        {meta.badge}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[0.65rem] text-slate-400 flex items-center gap-0.5 font-medium">
                        <Clock className="w-2.5 h-2.5 text-slate-300" />
                        {formatTime(n.created_at)}
                      </span>
                      {!isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] ring-2 ring-teal-100" />
                      )}
                      {/* Delete Individual Notification */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteOne(n.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all border-none bg-transparent cursor-pointer ml-0.5"
                        title="Dismiss notification"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[0.72rem] text-slate-600 leading-snug break-words">
                    {n.message}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ─── Footer ─── */}
      <div className="px-4 py-2.5 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between text-[0.68rem] text-slate-500 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium">Live Feed</span>
        </div>

        <div className="flex items-center gap-2">
          {notifs.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="px-2.5 py-1 rounded-lg hover:bg-rose-50 text-slate-500 hover:text-rose-600 font-medium transition-all cursor-pointer border-none bg-transparent flex items-center gap-1 text-[0.68rem]"
              title="Clear all notifications"
            >
              <Trash2 className="w-3 h-3" />
              Clear all
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 transition-all cursor-pointer shadow-2xs text-[0.68rem]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  if (isDropdown) {
    return (
      <>
        {/* Invisible Click-away Backdrop */}
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={onClose}
        />
        {/* Floating Dropdown anchored right under the header control */}
        <div className="absolute right-0 top-full mt-2.5 z-50">
          {content}
        </div>
      </>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {content}
    </div>
  );
}
