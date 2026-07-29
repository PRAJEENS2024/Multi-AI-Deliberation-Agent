import React from 'react';
import { CheckCircle2, Loader2, AlertCircle, Clock, Cpu } from 'lucide-react';

export interface AgentPipelineItem {
  agent_id: string;
  agent_name: string;
  avatar: string;
  color: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  started_at?: string;
  completed_at?: string;
  confidence_at_stage?: number;
}


const DEFAULT_PIPELINE: AgentPipelineItem[] = [
  { agent_id: 'researcher', agent_name: 'Research Agent', avatar: '🔬', color: '#3B82F6', status: 'pending' },
  { agent_id: 'critic', agent_name: 'Critic Agent', avatar: '⚡', color: '#EC4899', status: 'pending' },
  { agent_id: 'fact_checker', agent_name: 'Fact Checker', avatar: '🔎', color: '#F59E0B', status: 'pending' },
  { agent_id: 'bias_detector', agent_name: 'Bias Auditor', avatar: '🧭', color: '#8B5CF6', status: 'pending' },
  { agent_id: 'synthesizer', agent_name: 'Synthesizer', avatar: '👑', color: '#10B981', status: 'pending' },
  { agent_id: 'report_formatter', agent_name: 'Report Formatter', avatar: '📋', color: '#06B6D4', status: 'pending' },
  { agent_id: 'email_agent', agent_name: 'Email Dispatch', avatar: '📧', color: '#F97316', status: 'pending' },
];

const MODEL_BADGES: Record<string, string> = {
  researcher: 'Llama 3.3 70B',
  critic: 'Llama 3.1 8B',
  fact_checker: 'Llama 3.3 70B + Web',
  bias_detector: 'Qwen 3.6 27B',
  synthesizer: 'Llama 3.3 70B',
  report_formatter: 'Llama 3.1 8B',
  email_agent: 'Llama 3.1 8B + SMTP',
};

interface PipelineGraphProps {
  pipeline?: AgentPipelineItem[];
  currentStatus?: string;
}

export const PipelineGraph: React.FC<PipelineGraphProps> = ({ pipeline, currentStatus }) => {
  const activePipeline = pipeline && pipeline.length > 0 ? pipeline : DEFAULT_PIPELINE;

  const completedCount = activePipeline.filter((a) => a.status === 'completed').length;
  const isRunning = activePipeline.some((a) => a.status === 'running');
  const progressPercent = Math.round((completedCount / activePipeline.length) * 100);

  return (
    <div className="w-full glass-panel p-5 mb-6 border border-white/10 relative overflow-hidden">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase flex items-center gap-2">
              LangGraph 7-Agent Orchestration Pipeline
            </h3>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {currentStatus || (isRunning ? 'Sequential agent deliberation streaming...' : 'Pipeline ready')}
          </p>
        </div>

        {/* Progress Badge */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-mono text-cyan-400 font-medium">
              {completedCount} / {activePipeline.length} Completed
            </div>
            <div className="text-[10px] text-gray-500 font-mono">{progressPercent}% Completed</div>
          </div>
          <div className="w-16 h-2 bg-gray-800 rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Pipeline Node Flow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 relative">
        {activePipeline.map((agent, idx) => {
          const isCompleted = agent.status === 'completed';
          const isCurrentRunning = agent.status === 'running';
          const isError = agent.status === 'error';
          const modelName = MODEL_BADGES[agent.agent_id] || 'Llama 3.3 70B';

          return (
            <div
              key={agent.agent_id}
              className={`relative flex flex-col justify-between p-3 rounded-xl border transition-all duration-300 ${
                isCurrentRunning
                  ? 'bg-cyan-950/40 border-cyan-500/80 shadow-lg shadow-cyan-500/20 scale-[1.02] running-glow'
                  : isCompleted
                  ? 'bg-gray-900/60 border-emerald-500/30 hover:border-emerald-500/50'
                  : isError
                  ? 'bg-red-950/40 border-red-500/50'
                  : 'bg-gray-900/40 border-white/5 opacity-60'
              }`}
            >
              {/* Connector Arrow (desktop) */}
              {idx < activePipeline.length - 1 && (
                <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-gray-600 font-mono text-xs">
                  →
                </div>
              )}

              {/* Agent Title & Avatar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl p-1.5 rounded-lg bg-gray-800/80 border border-white/10">
                    {agent.avatar}
                  </span>
                  <div>
                    {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {isCurrentRunning && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />}
                    {isError && <AlertCircle className="w-4 h-4 text-red-400" />}
                    {!isCompleted && !isCurrentRunning && !isError && (
                      <Clock className="w-3.5 h-3.5 text-gray-500" />
                    )}
                  </div>
                </div>

                <div className="font-medium text-xs text-gray-200 truncate">{agent.agent_name}</div>
              </div>

              {/* Model & Stage Confidence */}
              <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-400 font-mono">
                <span className="flex items-center gap-1 text-gray-400 truncate">
                  <Cpu className="w-2.5 h-2.5 text-cyan-400" />
                  {modelName.split(' ')[0]}
                </span>
                {agent.confidence_at_stage !== undefined && (
                  <span className="text-emerald-400 font-semibold">{agent.confidence_at_stage}%</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
