import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Loader2,
  AlertTriangle,
  User,
  ArrowLeft,
  BarChart3,
  XCircle,
  CheckCircle,
  X,
  SendHorizonal,
  Sparkles,
} from 'lucide-react';
import axios from 'axios';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { PipelineGraph } from '../components/PipelineGraph';
import { AgentExecutionPanel } from '../components/AgentExecutionPanel';

const API_URL = 'http://localhost:8000/api';

function ToastNotification({
  message,
  type,
  onClose,
}: {
  message: string;
  type: 'error' | 'success' | 'info';
  onClose: () => void;
}) {
  const bgColor = type === 'error' ? 'bg-red-500/90' : type === 'success' ? 'bg-emerald-500/90' : 'bg-cyan-500/90';
  const borderColor = type === 'error' ? 'border-red-500/50' : type === 'success' ? 'border-emerald-500/50' : 'border-cyan-500/50';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      exit={{ opacity: 0, y: -20, x: '-50%' }}
      className={`fixed top-4 left-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border ${bgColor} ${borderColor} backdrop-blur-md max-w-lg`}
    >
      {type === 'error' ? (
        <XCircle size={18} className="text-white shrink-0" />
      ) : type === 'success' ? (
        <CheckCircle size={18} className="text-white shrink-0" />
      ) : (
        <AlertTriangle size={18} className="text-white shrink-0" />
      )}
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
  const location = useLocation();

  const [prompt, setPrompt] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(routeSessionId || null);
  const [sessionState, setSessionState] = useState<any>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [userEmail, setUserEmail] = useState(localStorage.getItem('user_email') || 'abhinavkumaran2006@gmail.com');
  const [pendingMessages, setPendingMessages] = useState<{ role: string; content: string }[]>([]);

  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userId = localStorage.getItem('user_id') || localStorage.getItem('auth_token')?.replace('token-', '') || '';

  const showToast = useCallback((message: string, type: 'error' | 'success' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 6000);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const savedEmail = localStorage.getItem('user_email');
    if (savedEmail) {
      setUserEmail(savedEmail);
    }
  }, []);

  // Handle initial prompt passed from Landing page
  useEffect(() => {
    const initialPrompt = location.state?.initialPrompt;
    if (initialPrompt && !sessionId && !isPolling) {
      setPrompt(initialPrompt);
      // Automatically trigger query
      sendQuery(initialPrompt);
    }
  }, [location.state]);

  useEffect(() => {
    if (routeSessionId && routeSessionId !== sessionId) {
      setSessionId(routeSessionId);
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
      showToast('Please register an email address in your profile settings.', 'info');
      return;
    }

    setSendingEmail(true);
    try {
      const res = await axios.post(`${API_URL}/send-report`, {
        session_id: sessionId,
        email: userEmail,
      });
      showToast(res.data.message || `PDF & Word Document reports sent to ${userEmail}!`, 'success');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to send email report.', 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  const sendQuery = async (queryText: string) => {
    if (!queryText.trim() || isPolling) return;

    setPrompt('');

    if (!sessionState) {
      setPendingMessages((prev) => [...prev, { role: 'user', content: queryText }]);
    } else {
      setSessionState((prev: any) => ({
        ...prev,
        history: [...(prev.history || []), { role: 'user', content: queryText }],
        status: 'Initializing',
        verdict: null,
        agent_pipeline: [],
        confidence_timeline: [],
      }));
    }

    try {
      const res = await axios.post(`${API_URL}/query`, {
        prompt: queryText,
        session_id: sessionId,
        user_id: userId || undefined,
        email: userEmail || undefined,
        send_email: !!userEmail,
      });
      if (!sessionId) {
        setSessionId(res.data.session_id);
        navigate(`/chat/${res.data.session_id}`, { replace: true });
      }
      setIsPolling(true);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.detail || err.message || 'Failed to connect to Veritas AI backend. Make sure server is running.';
      showToast(errorMsg, 'error');
      if (!sessionId) {
        setPendingMessages([]);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendQuery(prompt);
  };

  useEffect(() => {
    let interval: any;
    if (isPolling && sessionId) {
      const fetchState = async () => {
        try {
          const res = await axios.get(`${API_URL}/session/${sessionId}`);
          if (res.data) {
            setSessionState(res.data);
            setPendingMessages([]);
            if (res.data.status === 'Completed' || res.data.status === 'Error') {
              setIsPolling(false);
              if (res.data.status === 'Error') {
                showToast('An error occurred during deliberation. Please try again.', 'error');
              }
            }
          }
        } catch (err) {
          console.error(err);
          setIsPolling(false);
        }
      };

      fetchState();
      interval = setInterval(fetchState, 1200);
    }
    return () => clearInterval(interval);
  }, [isPolling, sessionId, showToast]);


  const displayMessages = [];
  if (pendingMessages.length > 0 && !sessionState) {
    displayMessages.push(...pendingMessages);
  }
  if (sessionState?.history) {
    displayMessages.push(...sessionState.history);
  }
  if (sessionState?.prompt && !sessionState.history?.find((m: any) => m.content === sessionState.prompt && m.role === 'user')) {
    displayMessages.push({ role: 'user', content: sessionState.prompt });
    if (sessionState.status === 'Completed' && sessionState.verdict) {
      displayMessages.push({ role: 'assistant', content: sessionState.verdict.final_answer, verdict: sessionState.verdict });
    }
  }

  const isProcessing = isPolling && sessionState && sessionState.status !== 'Completed';

  return (
    <div className="flex-1 flex flex-col bg-[#070A14] h-full font-sans overflow-hidden">
      <AnimatePresence>
        {toast && (
          <ToastNotification message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </AnimatePresence>

      {/* Header Bar */}
      <header className="h-16 border-b border-white/10 bg-[#0B1020]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-white cursor-pointer"
            title="Return to Landing Page (Home)"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              Veritas AI Workspace
              <span className="text-[10px] font-mono font-bold byjus-badge-gold px-2 py-0.5 rounded-full">
                7 Agents
              </span>
            </h1>
            {sessionId && (
              <p className="text-[10px] text-gray-400 font-mono">
                Session ID: {sessionId.slice(0, 12)}...
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 border border-white/10 text-gray-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
          >
            <BarChart3 size={14} className="text-purple-400" />
            <span className="hidden sm:inline">Analytics</span>
          </button>

          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 border border-white/10 text-gray-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
          >
            <User size={14} className="text-emerald-400" />
            <span className="hidden sm:inline">Profile</span>
          </button>
        </div>
      </header>

      {/* Scrollable Main Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-6xl mx-auto w-full">
        {/* Real-time Pipeline Diagram */}
        <PipelineGraph
          pipeline={sessionState?.agent_pipeline}
          currentStatus={sessionState?.status}
        />

        {/* Empty State */}
        {!sessionState && pendingMessages.length === 0 && (
          <div className="py-12 px-6 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#8028A3] via-purple-600 to-[#00F5D4] flex items-center justify-center text-3xl font-bold text-white mx-auto shadow-xl shadow-purple-900/40 border border-white/20">
              ✨
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Ask Veritas AI Anything</h2>
              <p className="text-xs text-gray-400 max-w-md mx-auto mt-1">
                7 autonomous agents cross-examine evidence, audit bias, and deliver verified verdicts.
              </p>
            </div>

            {/* Prompt Suggestions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto text-left">
              <button
                onClick={() => sendQuery('What are the environmental and scientific impacts of acid rain?')}
                className="p-3.5 rounded-xl bg-gray-900/80 hover:bg-white/5 border border-white/10 transition-all text-xs text-gray-300 hover:text-white cursor-pointer"
              >
                <div className="font-bold text-purple-300 mb-1">🔬 Environmental Science</div>
                Explain cause and environmental impacts of acid rain.
              </button>

              <button
                onClick={() => sendQuery('What are the main advantages of solar power over fossil fuels?')}
                className="p-3.5 rounded-xl bg-gray-900/80 hover:bg-white/5 border border-white/10 transition-all text-xs text-gray-300 hover:text-white cursor-pointer"
              >
                <div className="font-bold text-cyan-300 mb-1">⚡ Renewable Energy</div>
                Economic & environmental benefits of solar energy.
              </button>

              <button
                onClick={() => sendQuery('Compare quantum computing against classical RSA cryptography security.')}
                className="p-3.5 rounded-xl bg-gray-900/80 hover:bg-white/5 border border-white/10 transition-all text-xs text-gray-300 hover:text-white cursor-pointer"
              >
                <div className="font-bold text-emerald-300 mb-1">🛡️ Cybersecurity</div>
                How quantum computing threatens RSA encryption.
              </button>
            </div>
          </div>
        )}

        {/* Real-time Agent Execution & Deliberation Panel */}
        {sessionState && (
          <AgentExecutionPanel
            pipeline={sessionState.agent_pipeline || []}
            thoughts={sessionState.agent_thoughts || []}
            responses={sessionState.responses || {}}
            debateTurns={sessionState.debate_turns || []}
            claims={sessionState.extracted_claims || []}
            disputedClaims={sessionState.disputed_claims || []}
          />
        )}

        {/* Conversation Message Stream */}
        {displayMessages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#8028A3] to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0 border border-white/20">
                ✨
              </div>
            )}

            <div
              className={`max-w-3xl rounded-2xl p-5 border ${
                msg.role === 'user'
                  ? 'bg-purple-950/50 border-purple-500/40 text-purple-100'
                  : 'glass-panel border-white/10 text-gray-200'
              }`}
            >
              <div className="prose prose-invert prose-xs leading-relaxed max-w-none">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>

              {msg.verdict && (
                <div className="mt-6 pt-4 border-t border-white/10 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-950/80 p-3.5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold">
                      <Sparkles size={16} />
                      Consensus Confidence Score: {msg.verdict.confidence_score}%
                    </div>

                    <button
                      onClick={handleSendEmail}
                      disabled={sendingEmail}
                      className="flex items-center gap-2 bg-gradient-to-r from-[#8028A3] via-purple-600 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-purple-900/30 transition-all cursor-pointer disabled:opacity-50 border border-white/10"
                    >
                      {sendingEmail ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Generating & Sending Files...</span>
                        </>
                      ) : (
                        <>
                          <SendHorizonal size={14} />
                          <span>Send PDF & Word Document to {userEmail}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-gray-800 border border-white/10 flex items-center justify-center text-gray-300 text-xs font-bold shrink-0">
                <User size={14} />
              </div>
            )}
          </motion.div>
        ))}

        <div ref={messagesEndRef} />
      </main>

      {/* Floating Prompt Input Footer */}
      <footer className="p-4 md:p-6 bg-[#070A14]/95 border-t border-white/10 sticky bottom-0 z-30 backdrop-blur-md shrink-0">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={isProcessing ? 'Veritas AI deliberation in progress...' : 'Ask Veritas AI a question to trigger the 7-agent pipeline...'}
              disabled={isProcessing}
              className="w-full bg-gray-950/90 border border-white/15 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-purple-500 placeholder-gray-500 disabled:opacity-50 transition-colors shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={!prompt.trim() || isProcessing}
            className="bg-gradient-to-r from-[#8028A3] via-purple-600 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white p-3.5 rounded-2xl transition-all shadow-xl shadow-purple-900/40 disabled:opacity-50 cursor-pointer border border-white/10 shrink-0"
          >
            {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      </footer>
    </div>
  );
}
