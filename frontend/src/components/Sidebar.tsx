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
      if (!userId) {
        setSessions([]);
        return;
      }
      try {
        const res = await axios.get(`${API_URL}/sessions`, {
          params: { user_id: userId },
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
      className={`h-full bg-[#1A0933] border-r border-white/10 flex flex-col z-20 transition-all duration-300 relative font-sans ${
        isCollapsed ? 'w-16' : 'w-64 md:w-72'
      }`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 bg-[#250E45] border border-white/20 text-gray-300 hover:text-white p-1 rounded-full shadow-lg z-30 transition-colors cursor-pointer"
        title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Brand Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-500 to-purple-600 flex items-center justify-center font-black text-gray-950 shadow-lg shadow-amber-500/20 text-base shrink-0 border border-white/30">
            V
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h2 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                Veritas AI
                <span className="text-[9px] font-mono font-bold bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-400/30 uppercase">
                  v2.5
                </span>
              </h2>
              <p className="text-[10px] text-purple-200/70 truncate">Multi-Agent Engine</p>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <button
            onClick={() => navigate('/chat')}
            className="w-full mt-4 flex items-center justify-center gap-2 byjus-btn-primary py-2.5 px-4 rounded-xl transition-all shadow-lg text-xs font-black cursor-pointer uppercase tracking-wider"
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
          className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-xs font-bold cursor-pointer ${
            location.pathname === '/'
              ? 'bg-gradient-to-r from-purple-600 to-purple-800 text-white shadow-lg shadow-purple-900/40 border border-purple-400/40'
              : 'text-gray-300 hover:bg-white/5 hover:text-white'
          }`}
          title="Main Page"
        >
          <LayoutDashboard size={16} className="shrink-0 text-amber-400" />
          {!isCollapsed && <span>Main Page (Home)</span>}
        </button>

        <button
          onClick={() => navigate('/chat')}
          className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-xs font-bold cursor-pointer ${
            location.pathname.startsWith('/chat')
              ? 'bg-gradient-to-r from-purple-600 to-purple-800 text-white shadow-lg shadow-purple-900/40 border border-purple-400/40'
              : 'text-gray-300 hover:bg-white/5 hover:text-white'
          }`}
          title="Chat Section"
        >
          <MessageSquare size={16} className="shrink-0 text-cyan-300" />
          {!isCollapsed && <span>Chat Section</span>}
        </button>

        <button
          onClick={() => navigate('/dashboard')}
          className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-xs font-bold cursor-pointer ${
            location.pathname === '/dashboard'
              ? 'bg-gradient-to-r from-purple-600 to-purple-800 text-white shadow-lg shadow-purple-900/40 border border-purple-400/40'
              : 'text-gray-300 hover:bg-white/5 hover:text-white'
          }`}
          title="Dashboard"
        >
          <BarChart3 size={16} className="shrink-0 text-pink-400" />
          {!isCollapsed && <span>Dashboard</span>}
        </button>

        <button
          onClick={() => navigate('/profile')}
          className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-xs font-bold cursor-pointer ${
            location.pathname === '/profile'
              ? 'bg-gradient-to-r from-purple-600 to-purple-800 text-white shadow-lg shadow-purple-900/40 border border-purple-400/40'
              : 'text-gray-300 hover:bg-white/5 hover:text-white'
          }`}
          title="Profile"
        >
          <User size={16} className="shrink-0 text-emerald-400" />
          {!isCollapsed && <span>Profile & Settings</span>}
        </button>
      </div>

      {/* Session History & Search */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {/* Search Box */}
          <div className="relative mb-3">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your sessions..."
              className="w-full bg-[#250E45] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-gray-200 outline-none focus:border-amber-400 placeholder-gray-500"
            />
          </div>

          {/* Pinned Sessions */}
          {pinnedList.length > 0 && (
            <div className="mb-3">
              <h3 className="text-[10px] font-bold text-amber-300 uppercase tracking-wider mb-1.5 px-1 flex items-center gap-1">
                <Pin size={10} /> Pinned
              </h3>
              {pinnedList.map((session) => (
                <div
                  key={session.session_id}
                  onClick={() => navigate(`/chat/${session.session_id}`)}
                  className={`group flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                    location.pathname === `/chat/${session.session_id}`
                      ? 'bg-purple-600/30 text-amber-300 border border-amber-400/40'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MessageSquare size={12} className="shrink-0 text-cyan-300" />
                    <span className="truncate">{session.prompt}</span>
                  </div>
                  <button onClick={(e) => togglePin(e, session.session_id)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-amber-300">
                    <Pin size={10} className="fill-amber-400 text-amber-400" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Recent Sessions */}
          <div>
            <h3 className="text-[10px] font-bold text-purple-300 uppercase tracking-wider mb-1.5 px-1">
              Your Sessions ({recentList.length})
            </h3>
            {recentList.map((session) => (
              <div
                key={session.session_id}
                onClick={() => navigate(`/chat/${session.session_id}`)}
                className={`group flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                  location.pathname === `/chat/${session.session_id}`
                    ? 'bg-purple-600/30 text-amber-300 border border-amber-400/40'
                    : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare size={12} className="shrink-0 text-purple-300" />
                  <span className="truncate">{session.prompt}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {session.confidence_score && (
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">{session.confidence_score}%</span>
                  )}
                  <button onClick={(e) => togglePin(e, session.session_id)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-amber-300">
                    <Pin size={10} />
                  </button>
                </div>
              </div>
            ))}

            {recentList.length === 0 && (
              <p className="text-[11px] text-purple-300/70 px-1 italic">
                {searchQuery ? 'No matching sessions.' : 'No sessions created yet.'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Bottom User Card & SMTP Config */}
      {!isCollapsed && (
        <div className="p-3 border-t border-white/10 space-y-2 bg-[#120526]">
          <EmailSettings />

          {/* Logged in User Profile Card */}
          <div className="bg-[#250E45] border border-white/10 rounded-xl p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-amber-400 text-gray-950 flex items-center justify-center font-black text-xs shrink-0">
                {username[0]?.toUpperCase() || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{username}</p>
                <p className="text-[10px] text-purple-200/70 truncate">{userEmail || 'Veritas Workspace'}</p>
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
              className="p-1.5 hover:bg-red-500/20 text-gray-300 hover:text-red-400 rounded-lg transition-colors text-xs font-medium cursor-pointer shrink-0"
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
