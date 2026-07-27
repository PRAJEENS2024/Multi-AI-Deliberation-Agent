import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, BrainCircuit, MessageSquareText, Sparkles } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-12 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="space-y-6 max-w-3xl"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20 mb-4">
          <Sparkles size={18} />
          <span className="text-sm font-medium">Next-Generation Multi-LLM Truth Engine</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
          Where AI Models <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent">
            Debate Before Answering
          </span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Don't rely on a single biased model. <strong>Veritas AI</strong> orchestrates multiple frontier AI models to extract claims, debate conflicts, verify web evidence, and deliver one bulletproof verdict.
        </p>
        
        <div className="pt-8">
          <button 
            onClick={() => navigate('/chat')}
            className="px-8 py-4 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl font-semibold text-lg transition-all shadow-lg shadow-brand-primary/25 hover:shadow-brand-primary/40 hover:-translate-y-1 cursor-pointer"
          >
            Launch Veritas AI
          </button>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-16"
      >
        <FeatureCard 
          icon={<BrainCircuit className="text-brand-primary" size={32} />}
          title="Multi-LLM Orchestration"
          desc="Routes queries across Meta Llama 3.3 70B, Llama 3.1 8B, and Qwen 2.5/3.6 in parallel."
        />
        <FeatureCard 
          icon={<MessageSquareText className="text-brand-secondary" size={32} />}
          title="Agentic Deliberation"
          desc="Models extract claims and debate contradictions in an automated consensus process."
        />
        <FeatureCard 
          icon={<ShieldCheck className="text-brand-accent" size={32} />}
          title="Live Evidence Search"
          desc="Disputed claims are cross-checked against real-time web search results to ensure zero hallucinations."
        />
      </motion.div>
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
