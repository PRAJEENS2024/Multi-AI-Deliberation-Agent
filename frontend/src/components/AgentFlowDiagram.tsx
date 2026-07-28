import { CheckCircle, Loader2, ArrowRight, XCircle } from 'lucide-react';

interface AgentNode {
  agent_id: string;
  agent_name: string;
  avatar: string;
  color: string;
  status: string;
  confidence_at_stage?: number | null;
}

interface AgentFlowDiagramProps {
  agents: AgentNode[];
  isProcessing: boolean;
}

const AGENT_ORDER = [
  { key: 'researcher', label: 'Research Agent', color: '#3B82F6', avatar: '🔬' },
  { key: 'critic', label: 'Critic Agent', color: '#EC4899', avatar: '⚡' },
  { key: 'fact_checker', label: 'Fact Checker', color: '#F59E0B', avatar: '🔎' },
  { key: 'bias_detector', label: 'Bias Detector', color: '#8B5CF6', avatar: '🧭' },
  { key: 'synthesizer', label: 'Synthesis Agent', color: '#10B981', avatar: '👑' },
  { key: 'report_formatter', label: 'Report Formatter', color: '#06B6D4', avatar: '📋' },
  { key: 'email_agent', label: 'Email Dispatch', color: '#F97316', avatar: '📧' },
];

export default function AgentFlowDiagram({ agents, isProcessing }: AgentFlowDiagramProps) {
  if (agents.length === 0 && !isProcessing) return null;

  const getAgentStatus = (agentKey: string): { status: string; confidence?: number | null } => {
    const found = agents.find(a => a.agent_id === agentKey);
    if (found) return { status: found.status, confidence: found.confidence_at_stage };
    return { status: 'pending' };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} className="text-green-400" />;
      case 'running': return <Loader2 size={16} className="text-blue-400 animate-spin" />;
      case 'error': return <XCircle size={16} className="text-red-400" />;
      default: return <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-600" />;
    }
  };

  const getStatusBar = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'running': return 'bg-blue-500 animate-pulse';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-700';
    }
  };

  return (
    <div className="glass-panel p-4 border-brand-primary/20">
      <h3 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
        <span>Agent Pipeline Flow</span>
        {isProcessing && <Loader2 size={14} className="animate-spin text-brand-primary" />}
      </h3>

      <div className="flex flex-col gap-2">
        {AGENT_ORDER.map((agentDef, idx) => {
          const { status, confidence } = getAgentStatus(agentDef.key);
          const isActive = status === 'running';
          const isDone = status === 'completed';

          return (
            <div key={agentDef.key}>
              <div className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                isActive ? 'bg-brand-primary/10 border border-brand-primary/30' : 
                isDone ? 'bg-green-500/5 border border-green-500/10' : 
                'bg-transparent border border-transparent'
              }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${
                  isDone ? 'bg-green-500/20' : isActive ? 'bg-blue-500/20' : 'bg-gray-800'
                }`}>
                  <span>{agentDef.avatar}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium truncate ${
                      isDone ? 'text-green-400' : isActive ? 'text-blue-400' : 'text-gray-500'
                    }`}>
                      {agentDef.label}
                    </span>
                    <span className="ml-2">{getStatusIcon(status)}</span>
                  </div>
                  
                  <div className="mt-1 w-full bg-gray-800 rounded-full h-1 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${getStatusBar(status)}`}
                      style={{ width: isDone ? '100%' : isActive ? '60%' : '0%' }}
                    />
                  </div>

                  {confidence && (
                    <span className="text-[10px] text-gray-500 mt-0.5 block">
                      Confidence: {confidence}%
                    </span>
                  )}
                </div>
              </div>
              
              {idx < AGENT_ORDER.length - 1 && (
                <div className="flex justify-center py-0.5">
                  <ArrowRight size={12} className="text-gray-700" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
