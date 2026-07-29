import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  BarChart3,
  BrainCircuit,
  FileText,
  Shield,
  TrendingUp,
  Users,
  ArrowRight,
  Loader2,
  MessageSquare,
  Sparkles,
  Zap,
} from 'lucide-react';

const API_URL = 'http://localhost:8000/api';

interface AgentMetric {
  agent_name: string;
  avatar: string;
  color: string;
  total_runs: number;
  completed_runs: number;
  avg_confidence: number;
}

interface SessionSummary {
  session_id: string;
  prompt: string;
  status: string;
  confidence_score: number | null;
  created_at: string | null;
}

interface Metrics {
  total_sessions: number;
  avg_confidence: number;
  total_claims_verified: number;
  total_disputes_resolved: number;
  agent_performance: AgentMetric[];
  recent_sessions: SessionSummary[];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem('user_id') || localStorage.getItem('auth_token')?.replace('token-', '') || '';

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await axios.get(`${API_URL}/metrics`, {
          params: { user_id: userId || undefined },
        });
        setMetrics(res.data);
      } catch (err) {
        console.error('Failed to fetch user-isolated metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#070A14] min-h-screen">
        <Loader2 size={36} className="animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#070A14] min-h-screen p-6">
        <div className="text-center glass-panel p-8 max-w-md border border-white/10">
          <BarChart3 size={48} className="mx-auto text-purple-400 mb-4" />
          <h2 className="text-lg font-bold text-white mb-2">No Workspace Analytics Yet</h2>
          <p className="text-xs text-gray-400 mb-6">
            Start a multi-agent deliberation session to track live verification metrics and agent performance.
          </p>
          <button
            onClick={() => navigate('/chat')}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
          >
            Start Deliberation
          </button>
        </div>
      </div>
    );
  }

  const StatCard = ({
    icon,
    label,
    value,
    color,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-5 flex items-start gap-4 border border-white/10 hover:border-purple-500/30 transition-all"
    >
      <div className="p-3 rounded-xl border border-white/10" style={{ backgroundColor: `${color}15`, color }}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-2xl font-bold text-white mt-1 font-mono">{value}</p>
      </div>
    </motion.div>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-[#070A14] p-6 md:p-10 font-sans min-h-screen">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono font-semibold text-cyan-400 uppercase tracking-wider">
                Personalized Deliberation Workspace
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white">Analytics & Performance Dashboard</h1>
            <p className="text-xs text-gray-400 mt-1">
              Isolated metric analytics for logged-in workspace ({localStorage.getItem('username') || 'User'})
            </p>
          </div>

          <button
            onClick={() => navigate('/chat')}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-lg shadow-purple-900/30 transition-all cursor-pointer self-start sm:self-auto border border-white/10"
          >
            <Zap className="w-4 h-4" />
            New Deliberation
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<BarChart3 size={22} />}
            label="Total User Queries"
            value={metrics.total_sessions}
            color="#8B5CF6"
          />
          <StatCard
            icon={<TrendingUp size={22} />}
            label="Avg Confidence Score"
            value={`${metrics.avg_confidence}%`}
            color="#10B981"
          />
          <StatCard
            icon={<Shield size={22} />}
            label="Claims Verified"
            value={metrics.total_claims_verified}
            color="#06B6D4"
          />
          <StatCard
            icon={<BrainCircuit size={22} />}
            label="Disputes Resolved"
            value={metrics.total_disputes_resolved}
            color="#F59E0B"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Agent Performance */}
          <div className="glass-panel p-6 border border-white/10">
            <h2 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2 uppercase tracking-wider">
              <Users size={16} className="text-purple-400" />
              Agent Pipeline Execution Rates
            </h2>
            <div className="space-y-4">
              {metrics.agent_performance.map((agent, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-xl p-1.5 rounded-lg bg-gray-900 border border-white/10">
                    {agent.avatar}
                  </span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-gray-200">{agent.agent_name}</span>
                      <span className="text-[11px] font-mono text-gray-400">
                        {agent.completed_runs}/{agent.total_runs} runs completed
                      </span>
                    </div>
                    <div className="w-full bg-gray-950 rounded-full h-2 overflow-hidden border border-white/5">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${agent.avg_confidence || 0}%`,
                          backgroundColor: agent.color,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold" style={{ color: agent.color }}>
                    {Math.round(agent.avg_confidence || 0)}%
                  </span>
                </div>
              ))}
              {metrics.agent_performance.length === 0 && (
                <p className="text-xs text-gray-500 italic">No agent execution history logged yet.</p>
              )}
            </div>
          </div>

          {/* Recent Workspace Sessions */}
          <div className="glass-panel p-6 border border-white/10">
            <h2 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2 uppercase tracking-wider">
              <FileText size={16} className="text-cyan-400" />
              Isolated Workspace Deliberations
            </h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {metrics.recent_sessions.map((session) => (
                <button
                  key={session.session_id}
                  onClick={() => navigate(`/chat/${session.session_id}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-950/40 hover:bg-white/5 border border-white/5 transition-all text-left cursor-pointer group"
                >
                  <MessageSquare size={14} className="text-cyan-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-200 font-medium truncate group-hover:text-purple-300 transition-colors">
                      {session.prompt}
                    </p>
                    <p className="text-[10px] font-mono text-gray-500 mt-0.5 flex items-center gap-2">
                      <span>Status: {session.status}</span>
                      {session.confidence_score && (
                        <span className="text-emerald-400">Score: {session.confidence_score}%</span>
                      )}
                    </p>
                  </div>
                  <ArrowRight size={14} className="text-gray-500 group-hover:text-white shrink-0 transition-colors" />
                </button>
              ))}
              {metrics.recent_sessions.length === 0 && (
                <p className="text-xs text-gray-500 italic">No sessions created in your workspace yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
