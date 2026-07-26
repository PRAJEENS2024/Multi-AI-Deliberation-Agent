import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, CheckCircle, AlertTriangle, ShieldAlert } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export default function Chat() {
  const [prompt, setPrompt] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<any>(null);
  const [isPolling, setIsPolling] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    try {
      const res = await axios.post(`${API_URL}/query`, { prompt });
      setSessionId(res.data.session_id);
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

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      
      {!sessionId && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[50vh] space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">What would you like to ask the Jury?</h2>
            <p className="text-gray-400">Enter a complex prompt for the models to debate.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="w-full relative">
            <div className="glass-panel p-2 flex items-center shadow-2xl shadow-brand-primary/10">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Should we use microservices or a monolith for a new startup?"
                className="w-full bg-transparent border-none outline-none resize-none p-4 min-h-[100px] text-lg"
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
              />
              <button 
                type="submit" 
                disabled={!prompt.trim()}
                className="p-4 bg-brand-primary rounded-xl hover:bg-brand-primary/90 transition-colors disabled:opacity-50 h-full flex items-center justify-center m-2"
              >
                <Send size={24} />
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {sessionState && (
        <div className="space-y-8">
          {/* Prompt Header */}
          <div className="glass-panel p-6">
            <h3 className="text-sm text-brand-primary font-semibold mb-2">Original Prompt</h3>
            <p className="text-lg">{sessionState.prompt}</p>
          </div>

          {/* Workflow Status Tracker */}
          <div className="glass-panel p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Loader2 className={`animate-spin text-brand-secondary ${isPolling ? 'block' : 'hidden'}`} size={20} />
                Current Status: {sessionState.status}
              </h3>
            </div>
            <div className="w-full bg-dark-bg rounded-full h-2 overflow-hidden">
              <motion.div 
                className="bg-gradient-to-r from-brand-primary to-brand-accent h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: sessionState.status === 'Completed' ? '100%' : '50%' }} // Mock progress for visual
                transition={{ duration: 0.5 }}
              />
            </div>
            
            {/* Logs Preview */}
            <div className="bg-dark-bg p-4 rounded-lg font-mono text-xs text-gray-400 h-32 overflow-y-auto">
              {sessionState.logs?.map((log: any, i: number) => (
                <div key={i} className="mb-1">
                  <span className="text-brand-secondary">[{new Date().toLocaleTimeString()}]</span> {log.message}
                </div>
              ))}
            </div>
          </div>

          {/* Verdict synthesis section */}
          <AnimatePresence>
            {sessionState.verdict && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-8 border-brand-accent/50 border-2"
              >
                <div className="flex items-center gap-3 mb-6">
                  <ShieldAlert className="text-brand-accent" size={32} />
                  <h2 className="text-3xl font-bold">Final Verdict</h2>
                  <div className="ml-auto flex items-center gap-2 px-4 py-2 bg-dark-bg rounded-full">
                    <span className="text-sm font-semibold text-gray-400">Confidence Score:</span>
                    <span className="text-xl font-bold text-brand-accent">{sessionState.verdict.confidence_score}%</span>
                  </div>
                </div>
                
                <div className="prose prose-invert max-w-none">
                  <h3 className="text-xl font-semibold text-white mb-2">Executive Summary</h3>
                  <p className="text-gray-300 text-lg leading-relaxed mb-6">{sessionState.verdict.executive_summary}</p>
                  
                  <h3 className="text-xl font-semibold text-white mb-2">Detailed Answer</h3>
                  <div className="p-6 bg-dark-bg rounded-xl mb-6">
                    {sessionState.verdict.final_answer}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-panel p-6 bg-green-500/5 border-green-500/20">
                      <h4 className="font-semibold text-green-400 mb-4 flex items-center gap-2"><CheckCircle size={18}/> Consensus Claims</h4>
                      <ul className="space-y-2">
                        {sessionState.verdict.consensus_claims?.slice(0, 3).map((c: any, i: number) => (
                          <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-green-400 shrink-0"></span>
                            {c.claim}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="glass-panel p-6 bg-yellow-500/5 border-yellow-500/20">
                      <h4 className="font-semibold text-yellow-400 mb-4 flex items-center gap-2"><AlertTriangle size={18}/> Disputed Claims</h4>
                      <ul className="space-y-4">
                        {sessionState.verdict.disputed_claims?.map((d: any, i: number) => (
                          <li key={i} className="text-sm text-gray-300">
                            <p className="font-medium text-white mb-1">{d.claim}</p>
                            <p className="text-xs text-brand-accent">Verified: {d.evidence}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
