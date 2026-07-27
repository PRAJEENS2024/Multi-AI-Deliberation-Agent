import { useState, useEffect } from 'react';
import { MessageSquare, Plus, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export default function Sidebar() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<any[]>([]);

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
  }, []);

  return (
    <div className="w-64 h-full bg-dark-bg/95 border-r border-dark-border flex flex-col z-20 hidden md:flex">
      <div className="p-4">
        <button
          onClick={() => navigate('/chat')}
          className="w-full flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-secondary text-white py-3 px-4 rounded-xl transition-all shadow-lg shadow-brand-glow cursor-pointer"
        >
          <Plus size={18} />
          <span className="font-medium">New Session</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 mt-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">Recent Sessions</h3>
        {sessions.map((session) => (
          <button 
            key={session.session_id}
            onClick={() => navigate(`/chat/${session.session_id}`)}
            className="w-full flex items-center gap-3 text-left p-3 rounded-lg hover:bg-dark-surface-hover transition-colors text-sm text-gray-300 cursor-pointer"
          >
            <MessageSquare size={16} className="text-gray-500 shrink-0" />
            <span className="truncate">{session.prompt}</span>
          </button>
        ))}
        {sessions.length === 0 && (
          <p className="text-xs text-gray-500 px-2 italic">No past sessions yet.</p>
        )}
      </div>

      <div className="p-4 border-t border-dark-border">
        <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-dark-surface-hover transition-colors text-sm text-gray-400 cursor-pointer">
          <Settings size={18} />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
}
