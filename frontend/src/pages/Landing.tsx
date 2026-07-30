import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Zap,
  TrendingUp,
  Award,
} from 'lucide-react';


export default function Landing() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'Explorer';

  return (
    <div className="flex-1 overflow-y-auto bg-[#0D051D] text-gray-100 font-sans p-4 sm:p-8 md:p-12 relative min-h-screen">
      {/* Background Glowing Decorative Elements */}
      <div className="absolute top-10 left-1/3 w-96 h-96 bg-purple-600/30 rounded-full blur-[140px] pointer-events-none floating-decoration" />
      <div className="absolute top-1/2 right-10 w-96 h-96 bg-amber-500/20 rounded-full blur-[140px] pointer-events-none floating-decoration" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-cyan-500/20 rounded-full blur-[140px] pointer-events-none floating-decoration" />

      <div className="max-w-6xl mx-auto space-y-16 relative z-10">
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-center justify-between p-6 rounded-3xl bg-gradient-to-r from-purple-900/60 via-purple-800/40 to-amber-900/40 border border-white/15 shadow-2xl backdrop-blur-xl gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-gray-950 font-black text-2xl shadow-lg shadow-amber-500/30 border border-white/30 shrink-0">
              V
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
                  Logged in as {username}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5">Welcome to Veritas AI Deliberation Engine</h2>
            </div>
          </div>

          <button
            onClick={() => navigate('/chat')}
            className="byjus-btn-primary px-6 py-3 rounded-2xl flex items-center gap-2 text-xs uppercase tracking-wider font-extrabold shadow-xl shrink-0 cursor-pointer"
          >
            <span>Launch Chat Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Hero Section */}
        <div className="text-center space-y-6 max-w-4xl mx-auto pt-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-950/80 border border-purple-500/40 text-amber-300 text-xs font-bold shadow-lg shadow-purple-900/40"
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>Autonomous AI Deliberation & Truth Synthesis Platform</span>
          </motion.div>


          <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight tracking-tight">
            Where <span className="byjus-gradient-text">7 Autonomous AI Agents</span> Cross-Examine Evidence to Discover Truth
          </h1>

          <p className="text-sm sm:text-base text-purple-200/80 leading-relaxed max-w-2xl mx-auto font-medium">
            Stop relying on single LLM outputs. Veritas AI orchestrates seven specialized agents in sequence—verifying claims against web sources, purging bias, and delivering verified verdicts directly to your inbox.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => navigate('/chat')}
              className="byjus-btn-primary w-full sm:w-auto px-8 py-4 rounded-2xl flex items-center justify-center gap-3 text-sm font-black uppercase tracking-wider shadow-2xl cursor-pointer"
            >
              <Zap className="w-5 h-5 fill-amber-950" />
              <span>Start Deliberation Section</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className="byjus-btn-purple w-full sm:w-auto px-8 py-4 rounded-2xl flex items-center justify-center gap-3 text-sm font-bold shadow-xl border border-white/10 cursor-pointer"
            >
              <TrendingUp className="w-5 h-5 text-cyan-300" />
              <span>View Workspace Analytics</span>
            </button>
          </div>
        </div>

        {/* BYJU'S Style Feature Cards Grid */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">Interactive 7-Agent Architecture</h2>
            <p className="text-xs text-purple-300 mt-1">Multi-perspective cross-examination pipeline powered by Llama 3.3 & Qwen</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Agent Card 1 */}
            <div className="glass-card p-5 border border-purple-500/20 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-xl mb-3">
                  🔬
                </div>
                <h3 className="text-sm font-bold text-white">1. Research Agent</h3>
                <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">
                  Extracts core claims, formulates hypotheses, and queries multi-angle perspectives.
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-white/10 text-[10px] font-mono text-cyan-300">
                Model: Llama 3.3 70B
              </div>
            </div>

            {/* Agent Card 2 */}
            <div className="glass-card p-5 border border-pink-500/20 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-pink-600/30 border border-pink-400/40 flex items-center justify-center text-xl mb-3">
                  ⚡
                </div>
                <h3 className="text-sm font-bold text-white">2. Critic Agent</h3>
                <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">
                  Challenges initial claims with aggressive counter-arguments & logical fallacy checks.
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-white/10 text-[10px] font-mono text-pink-300">
                Model: Llama 3.1 8B
              </div>
            </div>

            {/* Agent Card 3 */}
            <div className="glass-card p-5 border border-amber-500/20 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-600/30 border border-amber-400/40 flex items-center justify-center text-xl mb-3">
                  🔎
                </div>
                <h3 className="text-sm font-bold text-white">3. Fact Checker</h3>
                <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">
                  Executes live DuckDuckGo web searches to verify disputable empirical statements.
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-white/10 text-[10px] font-mono text-amber-300">
                Model: Llama 3.3 70B + Web
              </div>
            </div>

            {/* Agent Card 4 */}
            <div className="glass-card p-5 border border-purple-500/20 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-xl mb-3">
                  🧭
                </div>
                <h3 className="text-sm font-bold text-white">4. Bias Auditor</h3>
                <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">
                  Identifies political, emotional, or institutional bias to ensure total neutrality.
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-white/10 text-[10px] font-mono text-purple-300">
                Model: Qwen 3.6 27B
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Agent Card 5 */}
            <div className="glass-card p-5 border border-emerald-500/20 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center text-xl mb-3">
                  👑
                </div>
                <h3 className="text-sm font-bold text-white">5. Synthesis Agent</h3>
                <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">
                  Weighs evidence across all previous 4 agents to formulate a unified, objective verdict.
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-white/10 text-[10px] font-mono text-emerald-300">
                Model: Llama 3.3 70B
              </div>
            </div>

            {/* Agent Card 6 */}
            <div className="glass-card p-5 border border-cyan-500/20 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-cyan-600/30 border border-cyan-400/40 flex items-center justify-center text-xl mb-3">
                  📋
                </div>
                <h3 className="text-sm font-bold text-white">6. Report Formatter</h3>
                <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">
                  Structures findings into executive summary, key findings, and action recommendations.
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-white/10 text-[10px] font-mono text-cyan-300">
                Model: Llama 3.1 8B
              </div>
            </div>

            {/* Agent Card 7 */}
            <div className="glass-card p-5 border border-orange-500/20 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-orange-600/30 border border-orange-400/40 flex items-center justify-center text-xl mb-3">
                  📧
                </div>
                <h3 className="text-sm font-bold text-white">7. Dual Email Dispatch</h3>
                <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">
                  Dispatches dual PDF (`.pdf`) and Microsoft Word (`.docx`) report files directly to your inbox.
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-white/10 text-[10px] font-mono text-amber-300">
                SMTP Multi-Attachment
              </div>
            </div>
          </div>
        </div>

        {/* CTA Card Footer */}
        <div className="glass-panel p-8 md:p-10 border border-white/20 text-center space-y-6 bg-gradient-to-br from-purple-950/80 via-purple-900/60 to-amber-950/60">
          <h2 className="text-2xl sm:text-3xl font-black text-white">Ready to Experience Unbiased Intelligence?</h2>
          <p className="text-xs sm:text-sm text-purple-200/80 max-w-xl mx-auto font-medium">
            Jump into the Chat Section to submit complex queries, watch live agent deliberation, and receive instant dual document exports.
          </p>

          <button
            onClick={() => navigate('/chat')}
            className="byjus-btn-primary px-10 py-4 rounded-2xl text-sm font-black uppercase tracking-wider shadow-2xl inline-flex items-center gap-3 cursor-pointer"
          >
            <Zap className="w-5 h-5 fill-amber-950" />
            <span>Go to Chat Section Now</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
