import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ArrowRight, Loader2, UserPlus, LogIn, Sparkles, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export default function Login() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (isLoginMode) {
        const res = await axios.post(`${API_URL}/auth/login`, { username, password });
        if (res.data.success) {
          localStorage.setItem('auth_token', res.data.token);
          localStorage.setItem('user_email', res.data.email || '');
          localStorage.setItem('username', res.data.username || username);
          localStorage.setItem('user_id', res.data.user_id || username);
          navigate('/');
        }
      } else {
        if (!email || !email.includes('@')) {
          setError('Please enter a valid email address');
          setIsLoading(false);
          return;
        }
        const res = await axios.post(`${API_URL}/auth/signup`, { username, password, email });
        if (res.data.success) {
          localStorage.setItem('auth_token', res.data.token || `token-${username}`);
          localStorage.setItem('user_email', email);
          localStorage.setItem('username', username);
          localStorage.setItem('user_id', res.data.user_id || username);
          setSuccessMsg('Account created successfully! Welcome to Veritas AI.');
          setTimeout(() => navigate('/'), 600); // Redirect to Main Home Page after signup
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || (isLoginMode ? 'Invalid credentials' : 'Registration failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError('');
    setSuccessMsg('');
    setEmail('');
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-[#0D051D] p-4 relative overflow-hidden font-sans">
      {/* Background Glowing BYJU'S Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/30 rounded-full blur-[120px] pointer-events-none floating-decoration" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-[120px] pointer-events-none floating-decoration" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="glass-panel p-8 relative z-10 border border-white/15 shadow-2xl">
          {/* Header Brand */}
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-700 via-purple-600 to-amber-400 flex items-center justify-center font-black text-white shadow-xl shadow-purple-900/50 mb-4 border-2 border-white/20">
              <ShieldCheck size={36} className="text-yellow-300" />
            </div>
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h1 className="text-3xl font-extrabold tracking-tight text-white">Veritas AI</h1>
            </div>
            <p className="text-amber-300/80 text-xs font-semibold uppercase tracking-widest text-center">
              Autonomous Multi-Agent Deliberation Engine
            </p>
          </div>

          {/* Toggle Tabs */}
          <div className="flex bg-[#1A0933] p-1.5 rounded-2xl mb-6 border border-white/10">
            <button
              type="button"
              onClick={() => {
                if (!isLoginMode) toggleMode();
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                isLoginMode
                  ? 'bg-gradient-to-r from-purple-600 to-purple-800 text-white shadow-lg shadow-purple-900/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <LogIn size={15} /> Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                if (isLoginMode) toggleMode();
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                !isLoginMode
                  ? 'bg-gradient-to-r from-purple-600 to-purple-800 text-white shadow-lg shadow-purple-900/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <UserPlus size={15} /> Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full bg-[#1A0933] border border-white/10 outline-none rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-amber-400 transition-colors"
                autoFocus
              />
            </div>

            {!isLoginMode && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. prajeen114@gmail.com"
                  className="w-full bg-[#1A0933] border border-white/10 outline-none rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-amber-400 transition-colors"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-[#1A0933] border border-white/10 outline-none rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-amber-400 transition-colors"
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-red-400 text-xs text-center font-semibold mt-2 bg-red-950/40 p-2 rounded-lg border border-red-500/30"
                >
                  {error}
                </motion.p>
              )}
              {successMsg && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-emerald-300 text-xs text-center font-semibold mt-2 bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/30"
                >
                  {successMsg}
                </motion.p>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isLoading || !username || !password || (!isLoginMode && !email)}
              className="w-full mt-4 byjus-btn-primary py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer text-sm font-bold shadow-lg"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin text-purple-950" />
              ) : (
                <>
                  <span>{isLoginMode ? 'Authenticate Account' : 'Create Veritas AI Account'}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Footer Badge */}
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-center gap-2 text-[11px] text-amber-300/80 font-semibold">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Veritas AI v2.5 Enterprise Edition</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
