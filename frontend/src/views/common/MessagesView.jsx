import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Search, Send,
  CheckCheck, ShieldCheck, Sparkles, Building2,
  Users, Lock, RefreshCw, AlertCircle, Hash,
  User, Mail, ArrowUpRight, Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';

export default function MessagesView() {
  const { user } = useAuth();
  const role = user?.role || 'CANDIDATE';
  const isAdmin = role === 'ADMIN';
  const isRecruiter = role === 'RECRUITER';
  const isHiringManager = role === 'HIRING_MANAGER';
  const isStaff = isAdmin || isRecruiter || isHiringManager;

  const companyName = user?.company_name || user?.profile?.company_name || 'Organization';

  // ── Team Members & Channels State ─────────────────────────────────────
  const [teamMembers, setTeamMembers] = useState([]);
  const [activeChannel, setActiveChannel] = useState('team-sync');
  const [activeChannelMeta, setActiveChannelMeta] = useState({
    id: 'team-sync',
    name: 'Hiring Team Sync',
    type: 'CHANNEL',
    subtitle: 'All internal staff (Admin, Recruiters, Hiring Managers)'
  });

  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const activeChannelRef = useRef(activeChannel);
  activeChannelRef.current = activeChannel;
  const wsRef = useRef(null);

  // ── Load Real Team Members from current company (include Admin for internal staff chat) ──
  useEffect(() => {
    if (!isStaff) return;
    api.getTeamMembers(true)
      .then(members => {
        setTeamMembers(Array.isArray(members) ? members : []);
      })
      .catch(() => setTeamMembers([]));
  }, [isStaff, user?.id, user?.email]);

  // ── WebSocket Real-Time Listener ──────────────────────────────────────
  useEffect(() => {
    if (!isStaff) return;
    const token = localStorage.getItem('uptrix_token');
    if (!token) return;

    let isMounted = true;
    let reconnectTimeout = null;

    const connectWebSocket = () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        let protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        let host = window.location.port === '5173' ? `${window.location.hostname}:8000` : window.location.host;

        if (apiUrl) {
          try {
            const parsed = new URL(apiUrl);
            protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
            host = parsed.host;
          } catch (_) {
            host = apiUrl.replace(/^https?:\/\//, '').split('/')[0];
          }
        }

        const wsUrl = `${protocol}//${host}/api/messages/ws?token=${encodeURIComponent(token)}`;

        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          if (isMounted) setIsWsConnected(true);
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'NEW_MESSAGE' && data.message) {
              const incoming = data.message;
              if (incoming.channel === activeChannelRef.current) {
                setMessages(prev => {
                  if (prev.some(m => m.id === incoming.id)) return prev;
                  return [...prev, incoming];
                });
              }
            }
          } catch (err) {
            console.error('Failed to parse WebSocket message payload:', err);
          }
        };

        socket.onclose = () => {
          if (isMounted) {
            setIsWsConnected(false);
            reconnectTimeout = setTimeout(connectWebSocket, 3000);
          }
        };

        socket.onerror = () => {
          socket.close();
        };
      } catch (err) {
        console.error('WebSocket connection initialization error:', err);
        if (isMounted) {
          setIsWsConnected(false);
          reconnectTimeout = setTimeout(connectWebSocket, 4000);
        }
      }
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isStaff]);

  // ── Load Messages for Active Channel (Isolated by Company) ───────────
  const fetchMessages = async (channelKey) => {
    if (!isStaff) return;
    setLoadingMessages(true);
    try {
      const data = await api.getInternalMessages(channelKey);
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load internal messages:', err);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchMessages(activeChannel);

    // Dynamic background polling fallback (faster if WS not connected)
    const pollInterval = isWsConnected ? 12000 : 2500;
    const interval = setInterval(() => {
      api.getInternalMessages(activeChannel)
        .then(data => {
          if (Array.isArray(data)) {
            setMessages(prev => {
              if (data.length !== prev.length || (data.length > 0 && data[data.length - 1]?.id !== prev[prev.length - 1]?.id)) {
                return data;
              }
              return prev;
            });
          }
        })
        .catch(() => {});
    }, pollInterval);

    return () => clearInterval(interval);
  }, [activeChannel, isStaff, isWsConnected]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send Internal Message ─────────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || sending) return;

    const content = inputMessage.trim();
    setInputMessage('');
    setSending(true);

    try {
      const newMsg = await api.sendInternalMessage({
        channel: activeChannel,
        content
      });
      setMessages(prev => {
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Error sending internal message: ' + (err.message || 'Please retry'));
    } finally {
      setSending(false);
    }
  };

  // Switch channel / direct conversation
  const handleSelectChannel = (channelId, meta) => {
    setActiveChannel(channelId);
    setActiveChannelMeta(meta);
  };

  // Quick replies tailored for internal recruitment coordination
  const INTERNAL_QUICK_REPLIES = [
    'Candidate scorecard submitted and recommended for next round.',
    'Please verify compensation expectations before the offer stage.',
    'Requisition requirements updated for the technical panel.',
    'Candidate is confirmed for the upcoming interview slot.'
  ];

  // Candidates do not have access to internal staff messaging
  if (!isStaff) {
    return (
      <div
        className="h-full flex items-center justify-center p-6 bg-[#F7F8FB]"
        style={{ fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
      >
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/80 p-8 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-1.5">Internal Staff Workspace</h2>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            Workspace messaging is restricted exclusively to verified organization staff (Administrators, Recruiters, and Hiring Managers).
          </p>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Strict Organization Multi-Tenant Security
          </span>
        </div>
      </div>
    );
  }

  // Filter colleague list (excluding self)
  const colleagues = teamMembers.filter(m => {
    if (m.user_id && user?.id && Number(m.user_id) === Number(user?.id)) return false;
    if (m.email && user?.email && m.email.toLowerCase() === user?.email.toLowerCase()) return false;
    return true;
  });
  const filteredColleagues = colleagues.filter(m => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (m.name || '').toLowerCase().includes(q) || (m.role || '').toLowerCase().includes(q);
  });

  return (
    <div
      className="p-4 sm:p-7 max-w-7xl mx-auto space-y-5 bg-[#F7F8FB] min-h-full antialiased text-slate-800 select-text"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
    >
      {/* ── Top Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
            <span>Workspace</span>
            <span>/</span>
            <span>Communications</span>
            <span>/</span>
            <span className="text-slate-600 font-semibold">Internal Messages</span>
          </div>
          <h1 className="text-2xl sm:text-[28px] font-semibold text-slate-900 leading-tight tracking-tight flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-indigo-50 text-[#5C59E8] flex items-center justify-center font-bold">
              <MessageSquare className="w-4 h-4" />
            </span>
            Internal Messages
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">
            Secure hiring coordination and candidate review discussions for {companyName} staff.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isWsConnected ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Live Real-time
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              <span className="h-2 w-2 rounded-full bg-amber-400"></span>
              Live Polling
            </span>
          )}
        </div>
      </div>

      {/* ── Main Messages Shell Card ── */}
      <div className="flex overflow-hidden bg-white border border-slate-200/80 rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04)] h-[calc(100vh-13.5rem)] min-h-[580px]">

        {/* ── Left Sidebar: Internal Channels & Colleagues ── */}
        <div className="w-80 sm:w-88 border-r border-slate-200/80 flex flex-col bg-white shrink-0">

          {/* Header Strip with Search */}
          <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">Directory</span>
                <span className="text-[11px] font-semibold text-slate-400">({filteredColleagues.length + 1})</span>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Staff Only
              </span>
            </div>

            {/* Search Colleagues */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search colleagues..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white border border-slate-200/90 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)]"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 no-scrollbar">
            
            {/* Team Channel Section Header */}
            <div className="px-4 py-2 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Workspace Channels
            </div>

            {/* Team Channel Item */}
            <div
              onClick={() => handleSelectChannel('team-sync', {
                id: 'team-sync',
                name: 'Hiring Team Sync',
                type: 'CHANNEL',
                subtitle: 'All internal staff (Admin, Recruiters, Hiring Managers)'
              })}
              className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                activeChannel === 'team-sync'
                  ? 'bg-indigo-50/70 border-l-4 border-l-[#5C59E8]'
                  : 'hover:bg-slate-50/80'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#5C59E8] font-bold text-sm flex items-center justify-center shrink-0 border border-indigo-100/80">
                <Hash className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h4 className="text-xs font-bold text-slate-900 truncate">#hiring-team-sync</h4>
                  <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded">Channel</span>
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  General internal alignment & requisition reviews
                </p>
              </div>
            </div>

            {/* Direct Staff Members Section Header */}
            <div className="px-4 py-2 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Staff Members ({filteredColleagues.length})
            </div>

            {/* Current User Card */}
            <div className="px-3.5 py-2.5 flex items-center gap-2.5 bg-slate-50/70 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                {(user?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                  <span>You ({user?.role?.replace('_', ' ')})</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </div>
                <div className="text-[11px] text-slate-400 truncate font-mono">{user?.email}</div>
              </div>
            </div>

            {/* Other Staff Members */}
            {filteredColleagues.map(member => {
              const channelKey = `direct-member-${member.id}`;
              const isActive = activeChannel === channelKey;

              return (
                <div
                  key={member.id}
                  onClick={() => handleSelectChannel(channelKey, {
                    id: channelKey,
                    name: member.name || 'Team Colleague',
                    type: 'DIRECT',
                    subtitle: `${member.role?.replace('_', ' ')} • ${companyName}`,
                    role: member.role
                  })}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-indigo-50/70 border-l-4 border-l-[#5C59E8]'
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                      {(member.name || 'TM').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{member.name}</h4>
                      <span className="text-[10px] text-slate-400 font-medium">Internal</span>
                    </div>

                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${
                        member.role === 'ADMIN'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200/80'
                          : member.role === 'RECRUITER'
                          ? 'bg-blue-50 text-blue-700 border-blue-200/80'
                          : member.role === 'HIRING_MANAGER'
                          ? 'bg-purple-50 text-purple-700 border-purple-200/80'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                      }`}>
                        {member.role?.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate">{member.title || 'Staff'}</span>
                    </div>

                    <p className="text-[11px] text-slate-500 truncate">
                      {member.email || 'Click to open internal chat'}
                    </p>
                  </div>
                </div>
              );
            })}

            {filteredColleagues.length === 0 && (
              <div className="p-6 text-center text-slate-400 text-xs">
                No other staff colleagues found in directory yet.
              </div>
            )}
          </div>
        </div>

        {/* ── Right Panel: Active Internal Chat Stream ── */}
        <div className="flex-1 flex flex-col bg-[#FAFBFD] min-w-0">

          {/* Active Chat Header */}
          <div className="h-16 px-5 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#5C59E8] font-bold text-sm flex items-center justify-center shrink-0 border border-indigo-100/80">
                {activeChannelMeta.type === 'CHANNEL' ? (
                  <Hash className="w-4 h-4" />
                ) : (
                  (activeChannelMeta.name || 'TM').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                    {activeChannelMeta.name}
                  </h3>
                  <span className="px-2 py-0.2 rounded-md text-[10.5px] font-semibold bg-slate-100 text-slate-600 border border-slate-200/80">
                    {companyName}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  <span>{activeChannelMeta.subtitle}</span>
                </p>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchMessages(activeChannel)}
                className="p-2 rounded-lg bg-slate-100/80 hover:bg-slate-200/70 text-slate-600 transition-colors cursor-pointer border-none flex items-center justify-center"
                title="Refresh messages"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingMessages ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            
            {/* Encryption & Isolation notice */}
            <div className="text-center py-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-white text-slate-500 border border-slate-200/80 shadow-2xs">
                <Lock className="w-3 h-3 text-emerald-600" />
                Staff discussion isolated for {companyName}. Never accessible to candidates.
              </span>
            </div>

            {messages.map((msg, idx) => {
              const isMe = msg.sender_id === user?.id;
              const timeFormatted = msg.created_at
                ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';

              return (
                <div
                  key={msg.id || idx}
                  className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  {!isMe && (
                    <div className="w-7 h-7 rounded-lg bg-slate-800 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                      {(msg.sender_name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className={`max-w-md sm:max-w-lg rounded-2xl px-4 py-2.5 text-xs shadow-xs ${
                    isMe
                      ? 'bg-[#1E293B] text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                  }`}>
                    {!isMe && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-bold text-slate-900 text-xs">{msg.sender_name}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200/80">
                          {msg.sender_role?.replace('_', ' ')}
                        </span>
                      </div>
                    )}

                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                    <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                      isMe ? 'text-slate-400' : 'text-slate-400'
                    }`}>
                      <span>{timeFormatted}</span>
                      {isMe && <CheckCheck className="w-3 h-3 text-emerald-400" />}
                    </div>
                  </div>
                </div>
              );
            })}

            {messages.length === 0 && !loadingMessages && (
              <div className="text-center py-12 text-slate-400 text-xs">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-2.5">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <p className="font-bold text-slate-700">No messages in this channel yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Start the discussion with your hiring team below.
                </p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies Bar */}
          <div className="px-5 py-2 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#FF7043]" /> Quick reply:
            </span>
            {INTERNAL_QUICK_REPLIES.map((reply, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setInputMessage(reply)}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 whitespace-nowrap transition-colors border border-slate-200/80 shadow-2xs cursor-pointer"
              >
                {reply}
              </button>
            ))}
          </div>

          {/* Chat Input Box */}
          <form
            onSubmit={handleSendMessage}
            className="p-3.5 sm:p-4 bg-white border-t border-slate-100 flex items-center gap-2.5 shrink-0"
          >
            <input
              type="text"
              placeholder={`Post internal message to ${activeChannelMeta.name}...`}
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50/80 border border-slate-200/90 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#5C59E8] focus:ring-2 focus:ring-[#5C59E8]/10 outline-none transition-all shadow-[0_1px_2px_rgba(15,23,42,0.02)]"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || sending}
              className="px-4 py-2.5 rounded-xl bg-[#FF7043] hover:bg-[#E65B30] disabled:opacity-40 text-white font-semibold text-xs flex items-center gap-1.5 transition-all border-none cursor-pointer shadow-[0_1px_2px_rgba(255,112,67,0.3)]"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>

        </div>

      </div>

    </div>
  );
}
