import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
  FileText,
  Layers,
  LineChart,
  ShieldCheck,
  Search,
} from 'lucide-react';
import type { AgentPipelineItem } from './PipelineGraph';


export interface AgentThoughtItem {
  persona_id: string;
  persona_name: string;
  phase: string;
  thought: string;
  timestamp: string;
}

export interface DebateTurnItem {
  turn_number: number;
  speaker_persona: string;
  target_persona?: string;
  argument: string;
  evidence?: string;
}

export interface ClaimItem {
  claim: string;
  category: string;
  confidence: string;
  model: string;
}

export interface DisputedClaimItem {
  claim: string;
  supporting_models: string[];
  opposing_models: string[];
  status: string;
  evidence?: string;
  confidence_score?: number;
}

interface AgentExecutionPanelProps {
  pipeline: AgentPipelineItem[];
  thoughts: AgentThoughtItem[];
  responses: Record<string, string>;
  debateTurns: DebateTurnItem[];
  claims: ClaimItem[];
  disputedClaims: DisputedClaimItem[];
}

export const AgentExecutionPanel: React.FC<AgentExecutionPanelProps> = ({
  pipeline,
  thoughts,
  responses,
  debateTurns,
  claims,
  disputedClaims,
}) => {

  const [activeTab, setActiveTab] = useState<'flow' | 'timeline' | 'deepdive'>('flow');
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  const toggleExpand = (agentId: string) => {
    setExpandedAgent((prev) => (prev === agentId ? null : agentId));
  };

  return (
    <div className="w-full glass-panel border border-white/10 mb-6 overflow-hidden">
      {/* Header View Selector */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-950/60 border-b border-white/10 gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">
            Agent Execution & Reasoning Deliberation
          </h3>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center bg-gray-900/80 p-1 rounded-xl border border-white/10 text-xs font-medium">
          <button
            onClick={() => setActiveTab('flow')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'flow'
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Flow View
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'timeline'
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <LineChart className="w-3.5 h-3.5" />
            Timeline View
          </button>
          <button
            onClick={() => setActiveTab('deepdive')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'deepdive'
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Agent Details
          </button>
        </div>
      </div>

      {/* TAB 1: FLOW VIEW */}
      {activeTab === 'flow' && (
        <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
          {pipeline.map((agent) => {
            const outputText = responses[agent.agent_name];
            const agentThoughts = thoughts.filter((t) => t.persona_id === agent.agent_id || t.persona_name === agent.agent_name);
            const isCompleted = agent.status === 'completed' || !!outputText;
            const isRunning = agent.status === 'running';
            const isExpanded = expandedAgent === agent.agent_id;

            return (
              <div
                key={agent.agent_id}
                className={`rounded-xl border transition-all duration-300 ${
                  isRunning
                    ? 'bg-cyan-950/20 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                    : isCompleted
                    ? 'bg-gray-900/40 border-white/10 hover:border-white/20'
                    : 'bg-gray-950/30 border-white/5 opacity-50'
                }`}
              >
                {/* Agent Header */}
                <div
                  onClick={() => toggleExpand(agent.agent_id)}
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl p-2 rounded-lg bg-gray-800/80 border border-white/10">
                      {agent.avatar}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-200">{agent.agent_name}</span>
                        {isRunning && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 animate-pulse">
                            Deliberating...
                          </span>
                        )}
                        {isCompleted && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Completed
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {isRunning ? 'Gathering evidence & synthesizing output...' : isCompleted ? 'Agent reasoning output available' : 'Waiting for prior agent output'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {agent.confidence_at_stage !== undefined && (
                      <span className="text-xs font-mono font-medium text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2 py-1 rounded-md">
                        {agent.confidence_at_stage}% Confidence
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Output & Reasoning Preview */}
                {(isCompleted || isRunning) && (
                  <div className="px-4 pb-4 pt-1 border-t border-white/5">
                    {/* Live Running Indicator */}
                    {isRunning && (
                      <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono py-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating agent reasoning & evidence...</span>
                      </div>
                    )}

                    {/* Reasoning Thoughts */}
                    {agentThoughts.length > 0 && (
                      <div className="mb-3 space-y-1">
                        {agentThoughts.map((t, tidx) => (
                          <div key={tidx} className="text-xs text-purple-300 font-mono bg-purple-950/30 p-2 rounded-lg border border-purple-500/20">
                            <span className="text-purple-400 font-bold">[{t.phase}]:</span> {t.thought}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Agent Output Text */}
                    {outputText && (
                      <div className={`text-xs text-gray-300 leading-relaxed font-sans bg-gray-950/60 p-3 rounded-lg border border-white/5 ${!isExpanded ? 'line-clamp-4' : ''}`}>
                        {outputText}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: TIMELINE VIEW */}
      {activeTab === 'timeline' && (
        <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
          {debateTurns.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-500">No debate turns logged yet. Start a query to observe timeline evolution.</div>
          ) : (
            debateTurns.map((turn) => (
              <div key={turn.turn_number} className="flex gap-3 p-3 bg-gray-900/50 rounded-xl border border-white/10">
                <div className="flex flex-col items-center">
                  <span className="w-6 h-6 rounded-full bg-purple-600/30 border border-purple-500/50 text-purple-300 text-xs font-mono flex items-center justify-center font-bold">
                    {turn.turn_number}
                  </span>
                  <div className="w-0.5 h-full bg-white/10 mt-1" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-purple-300">{turn.speaker_persona}</span>
                    {turn.target_persona && <span className="text-gray-500 text-[10px]">targeting {turn.target_persona}</span>}
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed bg-gray-950/50 p-2.5 rounded-lg border border-white/5">{turn.argument}</p>
                  {turn.evidence && (
                    <div className="mt-2 text-[11px] text-cyan-300 bg-cyan-950/30 p-2 rounded border border-cyan-500/20 font-mono">
                      <span className="font-bold">Web Evidence:</span> {turn.evidence}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: AGENT DETAILS VIEW */}
      {activeTab === 'deepdive' && (
        <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Verified Claims Card */}
            <div className="bg-gray-900/60 p-4 rounded-xl border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-3 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                Verified Consensus Claims ({claims.length})
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {claims.length === 0 ? (
                  <p className="text-xs text-gray-500">No consensus claims extracted yet.</p>
                ) : (
                  claims.map((c, idx) => (
                    <div key={idx} className="p-2 rounded bg-emerald-950/20 border border-emerald-500/20 text-xs text-gray-300">
                      <span className="text-emerald-400 font-mono font-bold">[{c.confidence}]</span> {c.claim}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Disputed Claims Card */}
            <div className="bg-gray-900/60 p-4 rounded-xl border border-amber-500/20">
              <div className="flex items-center gap-2 mb-3 text-amber-400 font-semibold text-xs uppercase tracking-wider">
                <Search className="w-4 h-4" />
                Disputed Claims & Web Evidence ({disputedClaims.length})
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {disputedClaims.length === 0 ? (
                  <p className="text-xs text-gray-500">No disputed claims found in this query.</p>
                ) : (
                  disputedClaims.map((d, idx) => (
                    <div key={idx} className="p-2 rounded bg-amber-950/20 border border-amber-500/20 text-xs text-gray-300">
                      <div className="font-semibold text-amber-300">{d.claim}</div>
                      {d.evidence && <div className="text-[10px] text-gray-400 mt-1 font-mono">{d.evidence}</div>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
