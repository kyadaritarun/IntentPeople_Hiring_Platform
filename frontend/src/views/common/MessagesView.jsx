import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Search, Send, Video,
  CheckCheck, ShieldCheck, Sparkles, Building2,
  Users, Lock, RefreshCw, AlertCircle, Hash
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
      // Append immediately if not received already via websocket
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
      <div className="h-full flex items-center justify-center p-6 bg-[#F6F7FB]">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/80 p-8 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-1.5">Internal Staff Workspace</h2>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            Workspace messaging is restricted exclusively to verified organization staff (Administrators, Recruiters, and Hiring Managers).
          </p>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.7rem] font-semibold bg-slate-100 text-slate-600">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00a884]" /> Strict Organization Multi-Tenant Security
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
    <div className="h-full flex flex-col bg-[#F6F7FB] select-text">

      {/* Main Messages Shell */}
      <div className="flex-1 flex overflow-hidden bg-white border border-slate-200/80 rounded-2xl shadow-xs m-3 sm:m-4 min-h-[calc(100vh-7.5rem)]">

        {/* ── Left Sidebar: Internal Channels & Colleagues ── */}
        <div className="w-80 sm:w-96 border-r border-slate-200/80 flex flex-col bg-white shrink-0">

          {/* Header */}
          <div className="p-4 border-b border-slate-200/80 space-y-3 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#00a884] flex items-center justify-center font-bold shadow-2xs">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900">Internal Messages</h2>
                  <p className="text-[0.68rem] text-slate-500 font-semibold truncate max-w-[170px]">
                    {companyName} Staff Workspace
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[0.62rem] font-extrabold bg-[#00a884]/10 text-[#00a884] border border-[#00a884]/20 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Staff Only
              </span>
            </div>

            {/* Confidentiality notice */}
            <div className="p-2 rounded-xl bg-slate-100/70 border border-slate-200/60 text-[0.65rem] text-slate-600 flex items-center gap-1.5 leading-snug">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00a884] shrink-0" />
              <span>Isolated to <strong>{companyName}</strong> staff. Zero candidate access.</span>
            </div>

            {/* Search Colleagues */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search staff members..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 no-scrollbar">
            
            {/* Team Channel */}
            <div className="p-2 bg-slate-50/70 text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-400 px-4">
              Workspace Channels
            </div>
            <div
              onClick={() => handleSelectChannel('team-sync', {
                id: 'team-sync',
                name: 'Hiring Team Sync',
                type: 'CHANNEL',
                subtitle: 'All internal staff (Admin, Recruiters, Hiring Managers)'
              })}
              className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                activeChannel === 'team-sync' ? 'bg-[#F6F7FB] border-l-4 border-l-black' : 'hover:bg-slate-50'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-black text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                <Hash className="w-5 h-5 text-amber-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h4 className="text-xs font-bold text-slate-900 truncate">#hiring-team-sync</h4>
                  <span className="text-[0.62rem] text-slate-400 font-bold">Channel</span>
                </div>
                <p className="text-[0.68rem] text-slate-500 truncate">
                  General internal alignment & requisition reviews
                </p>
              </div>
            </div>

            {/* Direct Staff Members */}
            <div className="p-2 bg-slate-50/70 text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-400 px-4 mt-1">
              Colleagues ({filteredColleagues.length})
            </div>

            {/* Current Staff User Card */}
            <div className="px-3.5 py-2.5 flex items-center gap-2.5 bg-teal-50/50 border-b border-teal-100/40">
              <div className="w-7 h-7 rounded-full bg-[#00a884] text-white text-[0.65rem] font-black flex items-center justify-center shrink-0">
                {(user?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[0.72rem] font-bold text-slate-900 truncate flex items-center gap-1">
                  <span>You ({user?.role?.replace('_', ' ')})</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </div>
                <div className="text-[0.65rem] text-slate-500 truncate">{user?.email}</div>
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
                    isActive ? 'bg-[#F6F7FB] border-l-4 border-l-black' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center">
                      {(member.name || 'TM').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{member.name}</h4>
                      <span className="text-[0.62rem] text-slate-400 font-medium">Internal</span>
                    </div>

                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`px-1.5 py-0.2 rounded text-[0.6rem] font-extrabold ${
                        member.role === 'ADMIN'
                          ? 'bg-slate-900 text-amber-300'
                          : member.role === 'RECRUITER'
                          ? 'bg-blue-50 text-blue-700'
                          : member.role === 'HIRING_MANAGER'
                          ? 'bg-purple-50 text-purple-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {member.role?.replace('_', ' ')}
                      </span>
                      <span className="text-[0.65rem] text-slate-400 truncate">{member.title || 'Staff'}</span>
                    </div>

                    <p className="text-[0.68rem] text-slate-500 truncate">
                      {member.email || 'Click to open internal chat'}
                    </p>
                  </div>
                </div>
              );
            })}

            {filteredColleagues.length === 0 && (
              <div className="p-6 text-center text-slate-400 text-xs">
                No other staff colleagues found in your organization directory yet.
              </div>
            )}
          </div>
        </div>

        {/* ── Right Panel: Active Internal Chat Stream ── */}
        <div className="flex-1 flex flex-col bg-slate-50/50 min-w-0">

          {/* Active Chat Header */}
          <div className="h-16 px-5 bg-white border-b border-slate-200/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-black text-white font-bold text-sm flex items-center justify-center shrink-0">
                {activeChannelMeta.type === 'CHANNEL' ? (
                  <Hash className="w-5 h-5 text-amber-300" />
                ) : (
                  (activeChannelMeta.name || 'TM').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                    {activeChannelMeta.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[0.6rem] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                    {companyName}
                  </span>
                </div>
                <p className="text-[0.65rem] text-slate-400 truncate flex items-center gap-1.5">
                  <Lock className="w-2.5 h-2.5 text-[#00a884]" />
                  <span>{activeChannelMeta.subtitle}</span>
                </p>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2.5">
              {isWsConnected ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.62rem] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Live Real-time
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.62rem] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                  Live Polling
                </span>
              )}

              <button
                type="button"
                onClick={() => fetchMessages(activeChannel)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border-none flex items-center justify-center"
                title="Refresh messages"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingMessages ? 'animate-spin' : ''}`} />
              </button>

              <a
                href="https://meet.google.com/new"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border-none flex items-center justify-center no-underline"
                title="Start Internal Team Video Meeting"
              >
                <Video className="w-4 h-4 text-[#00a884]" />
              </a>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            
            {/* Encryption & Isolation notice */}
            <div className="text-center py-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.65rem] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                <Lock className="w-3 h-3 text-[#00a884]" />
                Internal staff discussion for {companyName}. Never accessible to candidates or other companies.
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
                    <div className="w-7 h-7 rounded-full bg-slate-800 text-white text-[0.65rem] font-black flex items-center justify-center shrink-0">
                      {(msg.sender_name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className={`max-w-md sm:max-w-lg rounded-2xl px-4 py-2.5 text-xs shadow-xs ${
                    isMe
                      ? 'bg-black text-white rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                  }`}>
                    {!isMe && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-extrabold text-slate-900 text-[0.7rem]">{msg.sender_name}</span>
                        <span className="px-1.5 py-0.2 rounded text-[0.58rem] font-bold bg-slate-100 text-slate-600">
                          {msg.sender_role?.replace('_', ' ')}
                        </span>
                      </div>
                    )}

                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                    <div className={`flex items-center justify-end gap-1 mt-1 text-[0.62rem] ${
                      isMe ? 'text-slate-400' : 'text-slate-400'
                    }`}>
                      <span>{timeFormatted}</span>
                      {isMe && <CheckCheck className="w-3 h-3 text-[#00a884]" />}
                    </div>
                  </div>
                </div>
              );
            })}

            {messages.length === 0 && !loadingMessages && (
              <div className="text-center py-12 text-slate-400 text-xs">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-slate-700">No messages in this internal channel yet</p>
                <p className="text-[0.7rem] text-slate-400 mt-1">
                  Start the discussion with your hiring team below.
                </p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies Bar */}
          <div className="px-5 py-2 bg-white/70 border-t border-slate-200/60 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#00a884]" /> Internal Quick Reply:
            </span>
            {INTERNAL_QUICK_REPLIES.map((reply, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setInputMessage(reply)}
                className="px-2.5 py-1 rounded-full text-[0.68rem] font-medium bg-slate-100 hover:bg-slate-200/80 text-slate-700 whitespace-nowrap transition-colors border-none cursor-pointer"
              >
                {reply}
              </button>
            ))}
          </div>

          {/* Chat Input Box */}
          <form
            onSubmit={handleSendMessage}
            className="p-3.5 sm:p-4 bg-white border-t border-slate-200/80 flex items-center gap-2.5 shrink-0"
          >
            <input
              type="text"
              placeholder={`Post internal message to ${activeChannelMeta.name}...`}
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100/90 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-black focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || sending}
              className="px-4 py-2.5 rounded-xl bg-black hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 transition-all border-none cursor-pointer shadow-xs"
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
