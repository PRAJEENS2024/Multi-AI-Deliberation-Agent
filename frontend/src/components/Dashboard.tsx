import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BarChart3, BrainCircuit, FileText, Shield, TrendingUp, Users, ArrowRight, Loader2, MessageSquare } from 'lucide-react';

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

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await axios.get(`${API_URL}/metrics`);
        setMetrics(res.data);
      } catch (err) {
        console.error('Failed to fetch metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-500">No analytics available yet. Start a session to see metrics.</p>
          <button
            onClick={() => navigate('/chat')}
            className="mt-4 px-4 py-2 bg-brand-primary rounded-lg text-sm font-medium hover:bg-brand-secondary transition-colors cursor-pointer"
          >
            Start First Session
          </button>
        </div>
      </div>
    );
  }

  const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-4 flex items-start gap-4 hover:border-brand-primary/30 transition-colors"
    >
      <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${color}15`, color }}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
      </div>
    </motion.div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of your AI Jury deliberation performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<BarChart3 size={20} />}
            label="Total Sessions"
            value={metrics.total_sessions}
            color="#8b5cf6"
          />
          <StatCard
            icon={<TrendingUp size={20} />}
            label="Avg Confidence"
            value={`${metrics.avg_confidence}%`}
            color="#10b981"
          />
          <StatCard
            icon={<Shield size={20} />}
            label="Claims Verified"
            value={metrics.total_claims_verified}
            color="#3b82f6"
          />
          <StatCard
            icon={<BrainCircuit size={20} />}
            label="Disputes Resolved"
            value={metrics.total_disputes_resolved}
            color="#f59e0b"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Agent Performance */}
          <div className="glass-panel p-5">
            <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <Users size={16} className="text-brand-primary" />
              Agent Performance
            </h2>
            <div className="space-y-3">
              {metrics.agent_performance.map((agent, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-lg">{agent.avatar}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-xs font-medium text-gray-300">{agent.agent_name}</span>
                      <span className="text-xs text-gray-500">
                        {agent.completed_runs}/{agent.total_runs} runs
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${agent.avg_confidence || 0}%`,
                          backgroundColor: agent.color,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-bold" style={{ color: agent.color }}>
                    {Math.round(agent.avg_confidence || 0)}%
                  </span>
                </div>
              ))}
              {metrics.agent_performance.length === 0 && (
                <p className="text-xs text-gray-600 italic">No agent data yet.</p>
              )}
            </div>
          </div>

          {/* Recent Sessions */}
          <div className="glass-panel p-5">
            <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <FileText size={16} className="text-brand-secondary" />
              Recent Sessions
            </h2>
            <div className="space-y-2">
              {metrics.recent_sessions.slice(0, 8).map((session) => (
                <button
                  key={session.session_id}
                  onClick={() => navigate(`/chat/${session.session_id}`)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-dark-surface-hover transition-colors text-left cursor-pointer"
                >
                  <MessageSquare size={14} className="text-gray-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-300 truncate">{session.prompt}</p>
                    <p className="text-[10px] text-gray-600 mt-0.5">
                      {session.status} {session.confidence_score ? `| ${session.confidence_score}% confidence` : ''}
                    </p>
                  </div>
                  <ArrowRight size={14} className="text-gray-600 shrink-0" />
                </button>
              ))}
              {metrics.recent_sessions.length === 0 && (
                <p className="text-xs text-gray-600 italic">No sessions yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
