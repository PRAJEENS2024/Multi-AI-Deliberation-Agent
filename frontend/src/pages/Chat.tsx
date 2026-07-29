import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, AlertTriangle, User, Bot, ChevronDown, ChevronUp, ArrowLeft, BarChart3, GitBranch, Mail, XCircle, CheckCircle, X, SendHorizonal } from 'lucide-react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import AgentFlowDiagram from '../components/AgentFlowDiagram';
import ConfidenceTimeline from '../components/ConfidenceTimeline';


const API_URL = 'http://localhost:8000/api';

function ToastNotification({ message, type, onClose }: { message: string; type: 'error' | 'success' | 'info'; onClose: () => void }) {
  const bgColor = type === 'error' ? 'bg-red-500/90' : type === 'success' ? 'bg-green-500/90' : 'bg-blue-500/90';
  const borderColor = type === 'error' ? 'border-red-500/50' : type === 'success' ? 'border-green-500/50' : 'border-blue-500/50';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      exit={{ opacity: 0, y: -20, x: '-50%' }}
      className={`fixed top-4 left-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border ${bgColor} ${borderColor} backdrop-blur-md max-w-lg`}
    >
      {type === 'error' ? <XCircle size={18} className="text-white shrink-0" /> : type === 'success' ? <CheckCircle size={18} className="text-white shrink-0" /> : <AlertTriangle size={18} className="text-white shrink-0" />}
      <span className="text-sm text-white font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 p-0.5 hover:bg-white/10 rounded transition-colors cursor-pointer">
        <X size={14} className="text-white/70" />
      </button>
    </motion.div>
  );
}

export default function Chat() {
  const { sessionId: routeSessionId } = useParams();
  const navigate = useNavigate();
  
  const [prompt, setPrompt] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(routeSessionId || null);
  const [sessionState, setSessionState] = useState<any>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [expandedVerdict, setExpandedVerdict] = useState<number | null>(null);
  const [showFlow, setShowFlow] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [userEmail, setUserEmail] = useState(localStorage.getItem('user_email') || 'prajeen114@gmail.com');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<{ role: string; content: string }[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((message: string, type: 'error' | 'success' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 6000);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto-fill email from localStorage (set during login)
  useEffect(() => {
    const savedEmail = localStorage.getItem('user_email');
    if (savedEmail) {
      setUserEmail(savedEmail);
    } else {
      setUserEmail('prajeen114@gmail.com');
    }
  }, []);


  useEffect(() => {
    if (routeSessionId && routeSessionId !== sessionId) {
      setSessionId(routeSessionId);
      setPendingMessages([]);
      setIsPolling(true);
    } else if (!routeSessionId) {
      setSessionId(null);
      setSessionState(null);
      setIsPolling(false);
      setPendingMessages([]);
    }
  }, [routeSessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [sessionState, pendingMessages]);

  const handleSendEmail = async () => {
    if (!sessionId || !sessionState?.verdict) return;
    if (!userEmail) {
      setShowEmailInput(true);
      showToast('Please enter your email address in the field above.', 'info');
      return;
    }
    setSendingEmail(true);
    try {
      const res = await axios.post(`${API_URL}/send-report`, {
        session_id: sessionId,
        email: userEmail,
      });
      showToast(res.data.message || `PDF report is being generated and sent to ${userEmail}!`, 'success');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to send email report.', 'error');
    } finally {
      setSendingEmail(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isPolling) return;
    
    const currentPrompt = prompt;
    setPrompt('');
    
    // Add optimistic message immediately
    if (!sessionState) {
      setPendingMessages(prev => [...prev, { role: 'user', content: currentPrompt }]);
    } else {
      setSessionState((prev: any) => ({
        ...prev,
        history: [...(prev.history || []), { role: 'user', content: currentPrompt }],
        status: 'Initializing',
        verdict: null,
        agent_pipeline: [],
        confidence_timeline: [],
      }));
    }
    
    try {
      const res = await axios.post(`${API_URL}/query`, { 
        prompt: currentPrompt,
        session_id: sessionId,
        email: userEmail || undefined,
        send_email: !!userEmail,
      });
      if (!sessionId) {
        setSessionId(res.data.session_id);
        navigate(`/chat/${res.data.session_id}`, { replace: true });
      }
      setIsPolling(true);
    } catch (err: any) {
      // Show user-friendly error
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to connect to AI Jury backend. Make sure the server is running.';
      showToast(errorMsg, 'error');
      // Remove pending message if it was for a new session (no sessionId yet)
      if (!sessionId) {
        setPendingMessages([]);
      }
    }
  };

  useEffect(() => {
    let interval: number;
    if (isPolling && sessionId) {
      interval = setInterval(async () => {
        try {
          const res = await axios.get(`${API_URL}/session/${sessionId}`);
          setSessionState(res.data);
          setPendingMessages([]); // Clear pending once we get session state
          if (res.data.status === 'Completed' || res.data.status === 'Error') {
            setIsPolling(false);
            if (res.data.status === 'Error') {
              showToast('An error occurred during processing. Please try again.', 'error');
            }
          }
        } catch (err) {
          console.error(err);
          setIsPolling(false);
          showToast('Lost connection to the server. Please refresh.', 'error');
        }
      }, 1000) as unknown as number;
    }
    return () => clearInterval(interval);
  }, [isPolling, sessionId, showToast]);

  const toggleVerdict = (idx: number) => {
    setExpandedVerdict(expandedVerdict === idx ? null : idx);
  };

  const displayMessages = [];
  // First, show any pending messages (optimistically added before session creation)
  if (pendingMessages.length > 0 && !sessionState) {
    displayMessages.push(...pendingMessages);
  }
  // Then show session history messages
  if (sessionState?.history) {
    displayMessages.push(...sessionState.history);
  }
  // Next, add the current prompt if not already in history
  if (sessionState?.prompt && !sessionState.history?.find((m: any) => m.content === sessionState.prompt && m.role === 'user')) {
    displayMessages.push({ role: 'user', content: sessionState.prompt });
    if (sessionState.status === 'Completed' && sessionState.verdict) {
      displayMessages.push({ role: 'assistant', content: sessionState.verdict.final_answer, verdict: sessionState.verdict });
    }
  }

  const isProcessing = isPolling && sessionState && sessionState.status !== 'Completed';

  return (
    <div className="flex flex-col h-full bg-dark-bg relative">
      {/* Header */}
      <header className="h-16 border-b border-dark-border bg-dark-bg/80 backdrop-blur-md flex items-center justify-between px-4 md:px-6 shrink-0 z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-white bg-dark-surface hover:bg-dark-surface-hover px-3 py-1.5 rounded-lg border border-dark-border transition-all cursor-pointer"
            title="Back to Landing Page"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Home</span>
          </button>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center font-bold text-white shadow-lg shadow-brand-glow">AJ</div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">AI Jury</h1>
            {sessionId && <p className="text-xs text-gray-500 font-mono">Session: {sessionId.split('-')[0]}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {sessionState?.verdict && (
            <>
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail || !userEmail}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  userEmail ? 'bg-brand-accent/20 text-brand-accent border-brand-accent/30 hover:bg-brand-accent/30' : 'bg-dark-surface text-gray-400 border-dark-border hover:text-white'
                }`}
                title={userEmail ? `Send PDF report to ${userEmail}` : 'No email configured'}
              >
                {sendingEmail ? <Loader2 size={14} className="animate-spin" /> : <SendHorizonal size={14} />}
                <span className="hidden sm:inline">{userEmail ? 'Send Email' : 'No Email'}</span>
              </button>
              <button
                onClick={() => setShowFlow(!showFlow)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  showFlow ? 'bg-brand-primary/20 text-brand-primary border-brand-primary/30' : 'bg-dark-surface text-gray-400 border-dark-border hover:text-white'
                }`}
                title="Agent Pipeline Flow"
              >
                <GitBranch size={14} />
                <span className="hidden sm:inline">Flow</span>
              </button>
              <button
                onClick={() => setShowTimeline(!showTimeline)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  showTimeline ? 'bg-brand-accent/20 text-brand-accent border-brand-accent/30' : 'bg-dark-surface text-gray-400 border-dark-border hover:text-white'
                }`}
                title="Confidence Timeline"
              >
                <BarChart3 size={14} />
                <span className="hidden sm:inline">Timeline</span>
              </button>
            </>
          )}

        </div>
      </header>

      {/* Toast Notifications */}
      <AnimatePresence>
        {toast && (
          <ToastNotification 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
      </AnimatePresence>

      {/* Email Input Panel */}
      <AnimatePresence>
        {showEmailInput && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-dark-border"
          >
            <div className="p-4 md:px-6 bg-dark-surface/80 backdrop-blur-sm">
              <div className="max-w-4xl mx-auto flex items-center gap-3">
                <Mail size={18} className="text-brand-accent shrink-0" />
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="Enter your email to receive the PDF report..."
                  className="flex-1 bg-dark-bg border border-dark-border outline-none rounded-lg px-4 py-2 text-sm text-white placeholder-gray-600 focus:border-brand-accent transition-colors"
                />
                {userEmail && (
                  <span className="text-xs text-brand-accent font-medium">Report will be sent to this email</span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {!sessionState && !isPolling && (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-3xl mb-6 shadow-2xl shadow-brand-glow">
                AJ
              </div>
              <h2 className="text-2xl font-bold mb-2">Welcome to AI Jury</h2>
              <p className="max-w-md text-gray-500 text-sm">
                7 specialized AI agents will research, critique, fact-check, detect bias, synthesize, and deliver a verified verdict.
              </p>
            </div>
          )}

          {displayMessages.map((msg, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg ${
                msg.role === 'user' ? 'bg-dark-surface border border-dark-border' : 'bg-gradient-to-br from-brand-primary to-brand-secondary'
              }`}>
                {msg.role === 'user' ? <User size={20} className="text-gray-400" /> : <Bot size={20} className="text-white" />}
              </div>
              
              <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                {msg.role === 'user' ? (
                  <div className="bg-dark-surface border border-dark-border px-6 py-4 rounded-2xl rounded-tr-sm shadow-xl text-[15px] leading-relaxed">
                    {msg.content}
                  </div>
                ) : (
                  <div className="bg-transparent w-full space-y-4">
                    <div className="glass-panel p-6 border-brand-primary/30 rounded-2xl rounded-tl-sm w-full">
                      <div className="prose prose-invert prose-brand max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                      
                      {msg.verdict && (
                        <div className="mt-6 border-t border-dark-border pt-4">
                          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                            <button 
                              onClick={() => toggleVerdict(idx)}
                              className="flex items-center gap-2 text-sm text-brand-secondary hover:text-brand-primary transition-colors font-medium cursor-pointer"
                            >
                              {expandedVerdict === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              {expandedVerdict === idx ? 'Hide Deliberation Details' : 'View Deliberation Details & Agent Debate'}
                            </button>

                            <button
                              onClick={handleSendEmail}
                              disabled={sendingEmail}
                              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 text-white rounded-xl text-xs font-semibold shadow-lg shadow-brand-glow transition-all cursor-pointer disabled:opacity-50"
                              title={userEmail ? `Send PDF & Word Document to ${userEmail}` : 'Send PDF & Word Document to email'}
                            >
                              {sendingEmail ? <Loader2 size={14} className="animate-spin" /> : <SendHorizonal size={14} />}
                              <span>{userEmail ? `Send PDF & Document to ${userEmail}` : 'Send PDF & Document to Email'}</span>
                            </button>
                          </div>

                          
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

                                {sessionState?.debate_turns?.length > 0 && (
                                  <div className="bg-dark-surface/80 border border-dark-border rounded-xl p-4 space-y-3">
                                    <h4 className="font-semibold text-brand-primary text-sm flex items-center gap-2">
                                      Courtroom Cross-Examination Dialogue
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
                                  <h4 className="font-semibold text-green-400 mb-3 flex items-center gap-2 text-sm"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg> Consensus Claims</h4>
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

          {/* Processing Indicator */}
          {isProcessing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 max-w-4xl mx-auto">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center shrink-0 shadow-lg shadow-brand-glow">
                <Loader2 size={20} className="text-white animate-spin" />
              </div>
              <div className="glass-panel p-4 border-brand-primary/30 rounded-2xl rounded-tl-sm flex items-center gap-4 min-w-[280px]">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-brand-primary mb-1">{sessionState?.status || 'Processing...'}</h3>
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

        {/* Side Panels */}
        <AnimatePresence>
          {showFlow && sessionState && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-dark-border overflow-hidden hidden lg:block"
            >
              <div className="w-[260px] h-full overflow-y-auto p-4">
                <AgentFlowDiagram 
                  agents={sessionState.agent_pipeline || []} 
                  isProcessing={isProcessing} 
                />
              </div>
            </motion.div>
          )}

          {showTimeline && sessionState && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-dark-border overflow-hidden hidden lg:block"
            >
              <div className="w-[260px] h-full overflow-y-auto p-4">
                <ConfidenceTimeline timeline={sessionState.confidence_timeline || []} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-gradient-to-t from-dark-bg via-dark-bg/95 to-transparent shrink-0">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
          <div className="relative flex items-end glass-panel p-2 rounded-2xl">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask AI Jury anything..."
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
          <p className="text-center text-xs text-gray-500 mt-3">AI Jury synthesizes verified consensus answers using 7-agent multi-model deliberation pipeline.</p>
        </form>
      </div>
    </div>
  );
}
