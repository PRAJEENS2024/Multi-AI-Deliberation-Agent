import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, CheckCircle, AlertTriangle, ShieldAlert, User, Bot, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

const API_URL = 'http://localhost:8000/api';

export default function Chat() {
  const { sessionId: routeSessionId } = useParams();
  const navigate = useNavigate();
  
  const [prompt, setPrompt] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(routeSessionId || null);
  const [sessionState, setSessionState] = useState<any>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [expandedVerdict, setExpandedVerdict] = useState<number | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (routeSessionId && routeSessionId !== sessionId) {
      setSessionId(routeSessionId);
      setIsPolling(true);
    } else if (!routeSessionId) {
      setSessionId(null);
      setSessionState(null);
      setIsPolling(false);
    }
  }, [routeSessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [sessionState]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isPolling) return;
    
    const currentPrompt = prompt;
    setPrompt('');
    
    // Optimistic UI update for current question if in an active session
    if (sessionState) {
        setSessionState((prev: any) => ({
            ...prev,
            history: [...(prev.history || []), { role: 'user', content: currentPrompt }],
            status: 'Initializing',
            verdict: null
        }));
    }
    
    try {
      const res = await axios.post(`${API_URL}/query`, { 
          prompt: currentPrompt,
          session_id: sessionId 
      });
      if (!sessionId) {
          setSessionId(res.data.session_id);
          navigate(`/chat/${res.data.session_id}`, { replace: true });
      }
      setIsPolling(true);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let interval: number;
    if (isPolling && sessionId) {
      interval = setInterval(async () => {
        try {
          const res = await axios.get(`${API_URL}/session/${sessionId}`);
          setSessionState(res.data);
          if (res.data.status === 'Completed' || res.data.status === 'Error') {
            setIsPolling(false);
          }
        } catch (err) {
          console.error(err);
          setIsPolling(false);
        }
      }, 1000) as unknown as number;
    }
    return () => clearInterval(interval);
  }, [isPolling, sessionId]);

  const toggleVerdict = (idx: number) => {
      setExpandedVerdict(expandedVerdict === idx ? null : idx);
  };

  // Compile full message list
  const displayMessages = [];
  if (sessionState?.history) {
      displayMessages.push(...sessionState.history);
  }
  
  // If we are currently processing a prompt, or have completed one that hasn't been pushed to history yet
  if (sessionState?.prompt && !sessionState.history?.find((m: any) => m.content === sessionState.prompt && m.role === 'user')) {
      displayMessages.push({ role: 'user', content: sessionState.prompt });
      
      if (sessionState.status === 'Completed' && sessionState.verdict) {
          displayMessages.push({ role: 'assistant', content: sessionState.verdict.final_answer, verdict: sessionState.verdict });
      }
  }

  return (
    <div className="flex flex-col h-full bg-dark-bg relative">
        
      {/* Header with Back Button & Persona Badge Bar */}
      <header className="h-16 border-b border-dark-border bg-dark-bg/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-10 sticky top-0">
          <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/')}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-white bg-dark-surface hover:bg-dark-surface-hover px-3 py-1.5 rounded-lg border border-dark-border transition-all cursor-pointer mr-2"
                title="Back to Landing Page"
              >
                  <ArrowLeft size={16} />
                  <span>Home</span>
              </button>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center font-bold text-white shadow-lg shadow-brand-glow">V</div>
              <div>
                  <h1 className="text-lg font-semibold tracking-tight">Veritas AI</h1>
                  {sessionId && <p className="text-xs text-gray-500 font-mono">Session: {sessionId.split('-')[0]}</p>}
              </div>
          </div>

          {/* Persona Agents Active Panel */}
          <div className="hidden lg:flex items-center gap-2 bg-dark-surface/60 border border-dark-border px-3 py-1.5 rounded-xl text-xs">
              <span className="text-gray-400 font-medium mr-1">Active Jury:</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">🔍 Dr. Vance</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-pink-500/10 text-pink-400 border border-pink-500/20 font-medium">⚡ Cipher</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">⚖️ Aura</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">👑 Veritas Chief</span>
          </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        {!sessionState && !isPolling && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                <ShieldAlert size={64} className="mb-6 text-brand-primary/50" />
                <h2 className="text-2xl font-bold mb-2">Welcome to Veritas AI Courtroom</h2>
                <p className="max-w-md">Start a deliberation by entering a prompt below. 4 autonomous persona agents will cross-examine evidence and synthesize a verified verdict.</p>
            </div>
        )}

        {displayMessages.map((msg, idx) => (
            <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-dark-surface border border-dark-border' : 'bg-gradient-to-br from-brand-primary to-brand-secondary'}`}>
                    {msg.role === 'user' ? <User size={20} className="text-gray-400" /> : <Bot size={20} className="text-white" />}
                </div>
                
                <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                    {msg.role === 'user' ? (
                        <div className="bg-dark-surface border border-dark-border px-6 py-4 rounded-2xl rounded-tr-sm shadow-xl text-[15px] leading-relaxed">
                            {msg.content}
                        </div>
                    ) : (
                        <div className="bg-transparent w-full space-y-4">
                            {/* Verdict Summary & Answer */}
                            <div className="glass-panel p-6 border-brand-primary/30 rounded-2xl rounded-tl-sm w-full">
                                <div className="prose prose-invert prose-brand max-w-none">
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                                
                                {msg.verdict && (
                                    <div className="mt-6 border-t border-dark-border pt-4">
                                        <button 
                                            onClick={() => toggleVerdict(idx)}
                                            className="flex items-center gap-2 text-sm text-brand-secondary hover:text-brand-primary transition-colors font-medium cursor-pointer"
                                        >
                                            {expandedVerdict === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            {expandedVerdict === idx ? 'Hide Deliberation Details' : 'View Deliberation Details & Agent Debate'}
                                        </button>
                                        
                                        <AnimatePresence>
                                            {expandedVerdict === idx && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden mt-4 space-y-4"
                                                >
                                                    <div className="p-4 bg-dark-surface rounded-xl border border-dark-border">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-sm text-gray-400">Confidence Score</span>
                                                            <span className="text-lg font-bold text-brand-accent">{msg.verdict.confidence_score}%</span>
                                                        </div>
                                                        <div className="w-full bg-dark-bg rounded-full h-1.5 overflow-hidden">
                                                            <div className="bg-brand-accent h-full rounded-full" style={{ width: `${msg.verdict.confidence_score}%` }}></div>
                                                        </div>
                                                    </div>

                                                    {/* Multi-Turn Courtroom Debate Transcripts */}
                                                    {sessionState?.debate_turns?.length > 0 && (
                                                        <div className="bg-dark-surface/80 border border-dark-border rounded-xl p-4 space-y-3">
                                                            <h4 className="font-semibold text-brand-primary text-sm flex items-center gap-2">
                                                                ⚔️ Courtroom Cross-Examination Dialogue
                                                            </h4>
                                                            <div className="space-y-2">
                                                                {sessionState.debate_turns.map((turn: any, i: number) => (
                                                                    <div key={i} className="text-xs bg-dark-bg/60 p-3 rounded-lg border border-dark-border/50">
                                                                        <div className="flex items-center justify-between text-gray-400 mb-1">
                                                                            <span className="font-semibold text-brand-secondary">Turn {turn.turn_number}: {turn.speaker_persona}</span>
                                                                            {turn.target_persona && <span>targeting {turn.target_persona}</span>}
                                                                        </div>
                                                                        <p className="text-gray-200">{turn.argument}</p>
                                                                        {turn.evidence && (
                                                                            <p className="text-emerald-400 mt-1 font-mono text-[11px]">Verified Web Evidence: {turn.evidence}</p>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
                                                            <h4 className="font-semibold text-green-400 mb-3 flex items-center gap-2 text-sm"><CheckCircle size={16}/> Consensus Claims</h4>
                                                            <ul className="space-y-2">
                                                                {msg.verdict.consensus_claims?.map((c: any, i: number) => (
                                                                    <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                                                                        <span className="mt-1 w-1 h-1 rounded-full bg-green-400 shrink-0"></span>
                                                                        <span><strong>[{c.model}]</strong> {c.claim}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
                                                            <h4 className="font-semibold text-yellow-400 mb-3 flex items-center gap-2 text-sm"><AlertTriangle size={16}/> Disputed Claims</h4>
                                                            {msg.verdict.disputed_claims?.length > 0 ? (
                                                                <ul className="space-y-3">
                                                                    {msg.verdict.disputed_claims.map((d: any, i: number) => (
                                                                        <li key={i} className="text-xs text-gray-300">
                                                                            <p className="font-medium text-white mb-1">{d.claim}</p>
                                                                            <p className="text-yellow-500/80">Evidence: {d.evidence}</p>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            ) : (
                                                                <p className="text-xs text-gray-500 italic">No disputed claims found.</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        ))}

        {/* Polling Indicator */}
        {isPolling && sessionState && sessionState.status !== 'Completed' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 max-w-4xl mx-auto">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center shrink-0 shadow-lg shadow-brand-glow">
                    <Loader2 size={20} className="text-white animate-spin" />
                </div>
                <div className="glass-panel p-4 border-brand-primary/30 rounded-2xl rounded-tl-sm flex items-center gap-4 min-w-[300px]">
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-brand-primary mb-1">{sessionState.status}...</h3>
                        <div className="w-full bg-dark-bg rounded-full h-1 overflow-hidden">
                            <motion.div 
                                className="bg-brand-primary h-full rounded-full"
                                initial={{ width: '0%' }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        </div>
                    </div>
                </div>
            </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-gradient-to-t from-dark-bg via-dark-bg/95 to-transparent shrink-0">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative flex items-end glass-panel p-2 rounded-2xl">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ask Veritas AI..."
                    className="w-full bg-transparent border-none outline-none resize-none p-4 max-h-[200px] min-h-[60px] text-[15px]"
                    rows={1}
                    onKeyDown={(e) => { 
                        if (e.key === 'Enter' && !e.shiftKey) { 
                            e.preventDefault(); 
                            handleSubmit(e); 
                        } 
                    }}
                  />
                  <button 
                    type="submit" 
                    disabled={!prompt.trim() || isPolling}
                    className="p-3 bg-brand-primary rounded-xl hover:bg-brand-primary/90 transition-all disabled:opacity-50 disabled:hover:bg-brand-primary mb-1 mr-1 flex items-center justify-center shadow-lg hover:shadow-brand-glow cursor-pointer"
                  >
                    <Send size={20} className="text-white" />
                  </button>
              </div>
              <p className="text-center text-xs text-gray-500 mt-3">Veritas AI synthesizes verified consensus answers using multi-model agentic deliberation.</p>
          </form>
      </div>
    </div>
  );
}
