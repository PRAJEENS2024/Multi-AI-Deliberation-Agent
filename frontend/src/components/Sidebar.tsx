import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Plus,
  BarChart3,
  LayoutDashboard,
  Search,
  User,
  LogOut,
  Pin,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import EmailSettings from './EmailSettings';


const API_URL = 'http://localhost:8000/api';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sessions, setSessions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pinnedSessions, setPinnedSessions] = useState<string[]>([]);

  const userId = localStorage.getItem('user_id') || localStorage.getItem('auth_token')?.replace('token-', '') || '';
  const username = localStorage.getItem('username') || localStorage.getItem('auth_token')?.replace('token-', '') || 'Guest User';
  const userEmail = localStorage.getItem('user_email') || '';

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await axios.get(`${API_URL}/sessions`, {
          params: { user_id: userId || undefined },
        });
        setSessions(res.data);
      } catch (err) {
        console.error('Failed to fetch user-isolated sessions:', err);
      }
    };
    fetchSessions();
    const interval = setInterval(fetchSessions, 4000);
    return () => clearInterval(interval);
  }, [userId]);

  const togglePin = (e: React.MouseEvent, sid: string) => {
    e.stopPropagation();
    setPinnedSessions((prev) =>
      prev.includes(sid) ? prev.filter((id) => id !== sid) : [...prev, sid]
    );
  };

  const filteredSessions = searchQuery
    ? sessions.filter((s) => s.prompt?.toLowerCase().includes(searchQuery.toLowerCase()))
    : sessions;

  const pinnedList = filteredSessions.filter((s) => pinnedSessions.includes(s.session_id));
  const recentList = filteredSessions.filter((s) => !pinnedSessions.includes(s.session_id));

  return (
    <div
      className={`h-full bg-[#070A14] border-r border-white/10 flex flex-col z-20 transition-all duration-300 relative ${
        isCollapsed ? 'w-16' : 'w-64 md:w-72'
      }`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 bg-gray-900 border border-white/20 text-gray-400 hover:text-white p-1 rounded-full shadow-lg z-30 transition-colors cursor-pointer"
        title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Brand Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-500 flex items-center justify-center font-extrabold text-white shadow-lg shadow-purple-900/30 text-sm shrink-0 border border-white/20">
            AJ
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                AI Jury Pro
                <span className="text-[9px] font-mono font-semibold bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/30 uppercase">
                  v2.5
                </span>
              </h2>
              <p className="text-[11px] text-gray-400 truncate">Isolated Workspace</p>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <button
            onClick={() => navigate('/chat')}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-purple-900/30 text-xs font-semibold cursor-pointer border border-white/10"
          >
            <Plus size={16} />
            <span>New Deliberation</span>
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="px-3 py-2 border-b border-white/10 space-y-1">
        <button
          onClick={() => navigate('/')}
          className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-xs font-medium cursor-pointer ${
            location.pathname === '/'
              ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
              : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
          }`}
          title="Home"
        >
          <LayoutDashboard size={16} className="shrink-0 text-cyan-400" />
          {!isCollapsed && <span>Home</span>}
        </button>

        <button
          onClick={() => navigate('/dashboard')}
          className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-xs font-medium cursor-pointer ${
            location.pathname === '/dashboard'
              ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
              : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
          }`}
          title="Dashboard"
        >
          <BarChart3 size={16} className="shrink-0 text-purple-400" />
          {!isCollapsed && <span>Dashboard</span>}
        </button>

        <button
          onClick={() => navigate('/profile')}
          className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-xs font-medium cursor-pointer ${
            location.pathname === '/profile'
              ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
              : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
          }`}
          title="Account Profile"
        >
          <User size={16} className="shrink-0 text-emerald-400" />
          {!isCollapsed && <span>Account & Settings</span>}
        </button>
      </div>

      {/* Session History & Search */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {/* Search Box */}
          <div className="relative mb-3">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user sessions..."
              className="w-full bg-gray-950/60 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-gray-200 outline-none focus:border-purple-500 placeholder-gray-600"
            />
          </div>

          {/* Pinned Sessions */}
          {pinnedList.length > 0 && (
            <div className="mb-3">
              <h3 className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider mb-1.5 px-1 flex items-center gap-1">
                <Pin size={10} /> Pinned
              </h3>
              {pinnedList.map((session) => (
                <div
                  key={session.session_id}
                  onClick={() => navigate(`/chat/${session.session_id}`)}
                  className={`group flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                    location.pathname === `/chat/${session.session_id}`
                      ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30'
                      : 'text-gray-400 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MessageSquare size={12} className="shrink-0 text-cyan-400" />
                    <span className="truncate">{session.prompt}</span>
                  </div>
                  <button onClick={(e) => togglePin(e, session.session_id)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-purple-300">
                    <Pin size={10} className="fill-purple-400 text-purple-400" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Recent Sessions */}
          <div>
            <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 px-1">
              Your Deliberations ({recentList.length})
            </h3>
            {recentList.map((session) => (
              <div
                key={session.session_id}
                onClick={() => navigate(`/chat/${session.session_id}`)}
                className={`group flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                  location.pathname === `/chat/${session.session_id}`
                    ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30'
                    : 'text-gray-400 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare size={12} className="shrink-0" />
                  <span className="truncate">{session.prompt}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {session.confidence_score && (
                    <span className="text-[10px] text-emerald-400 font-mono">{session.confidence_score}%</span>
                  )}
                  <button onClick={(e) => togglePin(e, session.session_id)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-purple-300">
                    <Pin size={10} />
                  </button>
                </div>
              </div>
            ))}

            {recentList.length === 0 && (
              <p className="text-[11px] text-gray-500 px-1 italic">
                {searchQuery ? 'No matching sessions.' : 'No sessions recorded yet.'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Bottom User Card & SMTP Config */}
      {!isCollapsed && (
        <div className="p-3 border-t border-white/10 space-y-2 bg-gray-950/40">
          <EmailSettings />

          {/* Logged in User Profile Card */}
          <div className="bg-gray-900/80 border border-white/10 rounded-xl p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-purple-600/40 border border-purple-500/50 flex items-center justify-center font-bold text-purple-200 text-xs shrink-0">
                {username[0]?.toUpperCase() || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-gray-200 truncate">{username}</p>
                <p className="text-[10px] text-gray-400 truncate">{userEmail || 'Isolated Session'}</p>
              </div>
            </div>

            <button
              onClick={() => {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_email');
                localStorage.removeItem('username');
                localStorage.removeItem('user_id');
                navigate('/login');
              }}
              className="p-1.5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors text-xs font-medium cursor-pointer shrink-0"
              title="Sign Out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
