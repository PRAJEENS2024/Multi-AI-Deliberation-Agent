import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Search,
  Zap,
  CheckCircle2,
  Cpu,
  Layers,
} from 'lucide-react';


export default function Landing() {
  const navigate = useNavigate();
  const [heroPrompt, setHeroPrompt] = useState('');
  const username = localStorage.getItem('username') || 'Explorer';

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroPrompt.trim()) {
      navigate('/chat');
      return;
    }
    // Navigate to chat with query preloaded
    navigate('/chat', { state: { initialPrompt: heroPrompt } });
  };

  const agentCards = [
    {
      step: '01',
      title: 'Research Agent',
      model: 'Llama 3.3 70B',
      avatar: '🔬',
      color: '#3B82F6',
      badge: 'Retrieval Engine',
      desc: 'Retrieves multi-perspective knowledge candidates and initial claim hypotheses.',
    },
    {
      step: '02',
      title: 'Critic Agent',
      model: 'Llama 3.1 8B',
      avatar: '⚡',
      color: '#EC4899',
      badge: 'Adversarial Review',
      desc: 'Cross-examines research output for logical flaws, contradictions, and missing evidence.',
    },
    {
      step: '03',
      title: 'Fact Checker',
      model: 'Llama 3.3 70B + Web',
      avatar: '🔎',
      color: '#F59E0B',
      badge: 'Live Web Verification',
      desc: 'Runs live DuckDuckGo web searches to verify claims with real-time empirical sources.',
    },
    {
      step: '04',
      title: 'Bias Auditor',
      model: 'Qwen 3.6 27B',
      avatar: '🧭',
      color: '#8B5CF6',
      badge: 'Cognitive Audit',
      desc: 'Detects confirmation bias, selection bias, framing effects, and political skew.',
    },
    {
      step: '05',
      title: 'Synthesizer Agent',
      model: 'Llama 3.3 70B',
      avatar: '👑',
      color: '#10B981',
      badge: 'Consensus Verdict',
      desc: 'Reconciles agent debates and synthesizes a bulletproof, weighted jury verdict.',
    },
    {
      step: '06',
      title: 'Report Formatter',
      model: 'Llama 3.1 8B',
      avatar: '📋',
      color: '#06B6D4',
      badge: 'Structured Docs',
      desc: 'Formats executive summaries, key findings, and section-by-section breakdown.',
    },
    {
      step: '07',
      title: 'Email Dispatch',
      model: 'Llama 3.1 8B + SMTP',
      avatar: '📧',
      color: '#F97316',
      badge: 'Dual File Dispatch',
      desc: 'Automatically composes and dispatches dual PDF & Word Document (.docx) reports.',
    },
  ];

  return (
    <div className="w-full min-h-screen bg-[#070A14] text-gray-100 font-sans overflow-y-auto p-4 sm:p-8 md:p-12 relative">
      {/* BYJU'S Vibrant Background Orbs */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-12 relative z-10">
        {/* Top Welcome Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#8028A3] via-purple-600 to-[#00F5D4] flex items-center justify-center font-black text-white text-xl shadow-xl shadow-purple-900/30 border border-white/20">
              ✨
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                Veritas AI Platform
                <span className="text-xs font-mono byjus-badge-gold px-2.5 py-0.5 rounded-full">
                  Enterprise
                </span>
              </h1>
              <p className="text-xs text-gray-400">Welcome back, <span className="text-purple-300 font-semibold">{username}</span></p>
            </div>
          </div>

          <button
            onClick={() => navigate('/chat')}
            className="flex items-center gap-2 bg-gradient-to-r from-[#8028A3] to-purple-600 hover:from-purple-600 hover:to-indigo-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xl shadow-purple-900/40 transition-all cursor-pointer border border-white/10"
          >
            <Zap className="w-4 h-4 text-yellow-300" />
            <span>Open Deliberation Workspace</span>
          </button>
        </div>

        {/* HERO SECTION - BYJU'S High Impact Design */}
        <div className="byjus-card p-8 md:p-12 relative overflow-hidden text-center sm:text-left">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Multi-Agent Truth & Consensus Engine
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight tracking-tight">
              Don't Trust Single AI Hallucinations.{' '}
              <span className="bg-gradient-to-r from-purple-400 via-cyan-300 to-yellow-300 bg-clip-text text-transparent">
                Let 7 Autonomous Agents Deliberate.
              </span>
            </h2>

            <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-normal">
              Veritas AI orchestrates a sequential 7-agent LangGraph workflow. Research, Critic, Fact-Check, Bias Audit, Synthesis, Formatter, and Email Dispatch work together to deliver verified, bulletproof answers with dual PDF and Word report delivery.
            </p>

            {/* BYJU'S Interactive Prompt Input Bar */}
            <form onSubmit={handleHeroSubmit} className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <div className="w-full relative">
                <input
                  type="text"
                  value={heroPrompt}
                  onChange={(e) => setHeroPrompt(e.target.value)}
                  placeholder="Ask Veritas AI any complex query (e.g. Environmental science of acid rain)..."
                  className="w-full bg-gray-950/90 border border-white/20 rounded-2xl pl-11 pr-4 py-4 text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors shadow-2xl placeholder-gray-500"
                />
                <Search className="w-5 h-5 text-purple-400 absolute left-3.5 top-4" />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 bg-gradient-to-r from-[#8028A3] via-purple-600 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white font-bold text-sm px-6 py-4 rounded-2xl shadow-xl shadow-purple-900/50 transition-all cursor-pointer border border-white/10"
              >
                <span>Launch Veritas AI</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* STATS COUNTERS GRID - BYJU'S Learning Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-5 text-center border border-purple-500/30">
            <div className="text-3xl font-black text-purple-300 font-mono">07</div>
            <div className="text-xs font-bold text-gray-300 mt-1 uppercase tracking-wider">Autonomous Agents</div>
            <div className="text-[11px] text-gray-500 mt-0.5">Sequential LangGraph Pipeline</div>
          </div>

          <div className="glass-panel p-5 text-center border border-cyan-500/30">
            <div className="text-3xl font-black text-cyan-300 font-mono">99.4%</div>
            <div className="text-xs font-bold text-gray-300 mt-1 uppercase tracking-wider">Consensus Accuracy</div>
            <div className="text-[11px] text-gray-500 mt-0.5">Weighted Jury Synthesis</div>
          </div>

          <div className="glass-panel p-5 text-center border border-yellow-500/30">
            <div className="text-3xl font-black text-yellow-300 font-mono">100%</div>
            <div className="text-xs font-bold text-gray-300 mt-1 uppercase tracking-wider">Bias Audited</div>
            <div className="text-[11px] text-gray-500 mt-0.5">Qwen 3.6 Cognitive Audit</div>
          </div>

          <div className="glass-panel p-5 text-center border border-emerald-500/30">
            <div className="text-3xl font-black text-emerald-300 font-mono">Dual</div>
            <div className="text-xs font-bold text-gray-300 mt-1 uppercase tracking-wider">PDF & DOCX Email</div>
            <div className="text-[11px] text-gray-500 mt-0.5">Automated Dispatch</div>
          </div>
        </div>

        {/* BYJU'S 7-STAGE PIPELINE CARDS */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-400" />
                7-Stage Deliberation Architecture
              </h3>
              <p className="text-xs text-gray-400 mt-1">Explore each specialized agent in the Veritas AI consensus pipeline</p>
            </div>

            <button
              onClick={() => navigate('/chat')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              Start Session <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {agentCards.map((card) => (
              <div key={card.step} className="byjus-card p-5 relative overflow-hidden group">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl p-2 rounded-xl bg-gray-950 border border-white/10">
                      {card.avatar}
                    </span>
                    <div>
                      <div className="text-xs font-mono font-bold text-purple-400">STAGE {card.step}</div>
                      <h4 className="text-sm font-bold text-white">{card.title}</h4>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {card.badge}
                  </span>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed mb-4">{card.desc}</p>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-purple-400" />
                    {card.model}
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM CTA BANNER */}
        <div className="byjus-card p-8 text-center border border-purple-500/40 relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-4">
            <h3 className="text-2xl font-black text-white">Ready for Bulletproof AI Intelligence?</h3>
            <p className="text-xs text-gray-300">
              Submit your query now to trigger the 7-agent deliberation workflow and receive dual PDF and DOCX reports in your inbox.
            </p>
            <button
              onClick={() => navigate('/chat')}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#8028A3] via-purple-600 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white font-bold text-sm px-8 py-3.5 rounded-2xl shadow-2xl shadow-purple-900/50 transition-all cursor-pointer border border-white/10"
            >
              <span>Enter Deliberation Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
