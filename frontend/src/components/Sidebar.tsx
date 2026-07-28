import { useState, useEffect } from 'react';
import { MessageSquare, Plus, BarChart3, LayoutDashboard, Search } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import EmailSettings from './EmailSettings';

const API_URL = 'http://localhost:8000/api';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sessions, setSessions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await axios.get(`${API_URL}/sessions`);
        setSessions(res.data);
      } catch (err) {
        console.error('Failed to fetch sessions:', err);
      }
    };
    fetchSessions();
    const interval = setInterval(fetchSessions, 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredSessions = searchQuery
    ? sessions.filter(s => s.prompt?.toLowerCase().includes(searchQuery.toLowerCase()))
    : sessions;

  return (
    <div className="w-64 h-full bg-dark-bg/95 border-r border-dark-border flex flex-col z-20 hidden md:flex">
      {/* Brand */}
      <div className="p-4 border-b border-dark-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center font-bold text-white shadow-lg shadow-brand-glow text-sm">
            AJ
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">AI Jury</h2>
            <p className="text-[10px] text-gray-500">7-Agent Pipeline</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/chat')}
          className="w-full flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-secondary text-white py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-brand-glow text-sm cursor-pointer"
        >
          <Plus size={16} />
          <span className="font-medium">New Session</span>
        </button>
      </div>

      {/* Nav Links */}
      <div className="px-3 py-2 border-b border-dark-border">
        <button
          onClick={() => navigate('/')}
          className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-colors text-sm cursor-pointer ${
            location.pathname === '/' ? 'bg-brand-primary/10 text-brand-primary' : 'text-gray-400 hover:bg-dark-surface-hover'
          }`}
        >
          <LayoutDashboard size={16} />
          <span>Home</span>
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-colors text-sm cursor-pointer ${
            location.pathname === '/dashboard' ? 'bg-brand-primary/10 text-brand-primary' : 'text-gray-400 hover:bg-dark-surface-hover'
          }`}
        >
          <BarChart3 size={16} />
          <span>Dashboard</span>
        </button>
      </div>

      {/* Sessions */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        <div className="relative mb-3">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sessions..."
            className="w-full bg-dark-bg border border-dark-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-white outline-none focus:border-brand-primary placeholder-gray-600"
          />
        </div>
        <h3 className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2 px-1">Recent Sessions</h3>
        {filteredSessions.map((session) => (
          <button 
            key={session.session_id}
            onClick={() => navigate(`/chat/${session.session_id}`)}
            className={`w-full flex items-center gap-2.5 text-left p-2.5 rounded-lg transition-colors text-xs cursor-pointer ${
              location.pathname === `/chat/${session.session_id}` ? 'bg-brand-primary/10 text-brand-primary' : 'text-gray-400 hover:bg-dark-surface-hover'
            }`}
          >
            <MessageSquare size={13} className="shrink-0" />
            <span className="truncate">{session.prompt}</span>
            {session.confidence_score && (
              <span className="text-[10px] text-gray-600 ml-auto shrink-0">{session.confidence_score}%</span>
            )}
          </button>
        ))}
        {filteredSessions.length === 0 && (
          <p className="text-[11px] text-gray-600 px-1 italic">
            {searchQuery ? 'No matching sessions.' : 'No past sessions yet.'}
          </p>
        )}
      </div>

      {/* Bottom: Email Settings */}
      <div className="px-3 pb-3">
        <EmailSettings />
      </div>

      {/* Footer branding */}
      <div className="px-4 py-2 border-t border-dark-border">
        <p className="text-[10px] text-gray-700 text-center">AI Jury v2.0 · 7-Agent Pipeline</p>
      </div>
    </div>
  );
}
