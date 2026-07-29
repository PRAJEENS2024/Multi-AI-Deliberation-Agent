import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, BrainCircuit, MessageSquareText, Sparkles, Mail, Download, BarChart3, GitBranch } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('auth_token');

  const handleStart = () => {
    if (isLoggedIn) {
      navigate('/chat');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto relative">
      {/* Top Navbar */}
      <div className="w-full flex items-center justify-end p-4 md:px-8 border-b border-dark-border/40">
        {isLoggedIn ? (
          <button
            onClick={() => navigate('/chat')}
            className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl font-medium text-sm transition-all cursor-pointer shadow-md"
          >
            Go to Chat →
          </button>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-dark-surface hover:bg-dark-surface-hover border border-dark-border text-white rounded-xl font-medium text-sm transition-all cursor-pointer"
          >
            Sign In / Register
          </button>
        )}
      </div>

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-8 px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6 max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20 mb-4">
            <Sparkles size={18} />
            <span className="text-sm font-medium">7-Agent Deliberation Platform</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Where AI Models <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent">
              Debate Before Answering
            </span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Don't rely on a single biased model. <strong>AI Jury</strong> orchestrates 7 specialized AI agents to research, critique, fact-check, detect bias, and deliver one bulletproof verdict with explainable confidence.
          </p>
          
          <div className="flex items-center justify-center gap-4 pt-4">
            <button 
              onClick={handleStart}
              className="px-8 py-4 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl font-semibold text-lg transition-all shadow-lg shadow-brand-primary/25 hover:shadow-brand-primary/40 hover:-translate-y-1 cursor-pointer"
            >
              {isLoggedIn ? 'Go to Chat Dashboard' : 'Sign In to Try AI Jury'}
            </button>
          </div>
        </motion.div>


        {/* Feature Cards */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-8"
        >
          <FeatureCard 
            icon={<BrainCircuit className="text-brand-primary" size={32} />}
            title="7-Agent Pipeline"
            desc="Research Agent → Critic Agent → Fact Checker → Bias Detector → Synthesis → Report → Email. Each feeds the next."
          />
          <FeatureCard 
            icon={<MessageSquareText className="text-brand-secondary" size={32} />}
            title="Agentic Deliberation"
            desc="Agents extract claims, debate contradictions, detect bias, and run a structured consensus process for every query."
          />
          <FeatureCard 
            icon={<ShieldCheck className="text-brand-accent" size={32} />}
            title="Live Evidence Search"
            desc="Disputed claims are cross-checked against real-time web search results to ensure zero hallucinations."
          />
        </motion.div>
      </div>

      {/* New Features Grid */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Enterprise-Grade Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: <Download size={24} />, title: 'Multi-Format Export', desc: 'Download reports as PDF, JSON, or Markdown with one click.' },
            { icon: <Mail size={24} />, title: 'Email Dispatch', desc: 'Automatically email formatted PDF reports to any address via SMTP.' },
            { icon: <GitBranch size={24} />, title: 'Agent Flow Visualization', desc: 'Watch agents execute in real-time with an interactive pipeline diagram.' },
            { icon: <BarChart3 size={24} />, title: 'Confidence Timeline', desc: 'Track confidence score evolution across all 7 agent stages.' },
            { icon: <BrainCircuit size={24} />, title: 'Bias Detection', desc: 'AI-powered bias audit flags confirmation bias, framing, and cultural assumptions.' },
            { icon: <ShieldCheck size={24} />, title: 'Explainable Verdicts', desc: 'Every answer shows agreed claims, disputed points, and confidence indicators.' },
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx }}
              className="glass-panel p-5 hover:border-brand-primary/30 transition-all"
            >
              <div className="p-3 bg-dark-bg rounded-xl inline-flex mb-3 text-brand-primary">
                {feature.icon}
              </div>
              <h3 className="text-base font-semibold mb-1">{feature.title}</h3>
              <p className="text-sm text-gray-500">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-dark-border py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center font-bold text-white text-xs">AJ</div>
            <span className="text-sm text-gray-500">AI Jury</span>
          </div>
          <p className="text-xs text-gray-700">7-Agent Deliberation Pipeline · {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="glass-panel p-6 flex flex-col items-center text-center space-y-4 hover:border-brand-primary/50 transition-colors">
      <div className="p-4 bg-dark-bg rounded-2xl">
        {icon}
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
