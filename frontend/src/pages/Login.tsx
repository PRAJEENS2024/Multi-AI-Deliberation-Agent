import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Loader2, UserPlus, LogIn, ShieldCheck, Zap, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import { API_URL } from '../config';


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
          let userEmail = res.data.email || '';
          if (!userEmail) {
            try {
              const detail = JSON.parse(res.data.detail || '{}');
              userEmail = detail.email || '';
            } catch {}
          }
          if (userEmail) {
            localStorage.setItem('user_email', userEmail);
          }
          localStorage.setItem('username', username);
          localStorage.setItem('user_id', res.data.user_id || username);

          // Flow requirement: Login -> Main Landing Page (Home)
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
          setSuccessMsg('Account registered successfully! Loading Home Page...');
          setTimeout(() => navigate('/'), 800);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || (isLoginMode ? 'Invalid username or password' : 'Registration failed'));
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
    <div className="w-full min-h-screen bg-[#070A14] flex items-center justify-center p-4 relative overflow-y-auto font-sans">
      {/* BYJU'S Vibrant Background Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md my-8 relative z-10"
      >
        <div className="byjus-card p-8 relative overflow-hidden border border-purple-500/30">
          {/* Top Brand Banner */}
          <div className="flex flex-col items-center justify-center mb-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#8028A3] via-purple-600 to-[#00F5D4] flex items-center justify-center font-black text-white shadow-xl shadow-purple-900/40 mb-4 border border-white/20 float-element">
              <Sparkles size={32} />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white mb-1 flex items-center gap-2">
              Veritas AI
              <span className="text-xs font-mono font-bold byjus-badge-gold px-2 py-0.5 rounded-full">
                v2.5
              </span>
            </h1>
            <p className="text-gray-400 text-xs mt-1">Multi-Agent Intelligence & Deliberation Platform</p>
          </div>

          {/* BYJU'S Interactive Tab Selector */}
          <div className="flex bg-gray-950 p-1.5 rounded-2xl mb-6 border border-white/10">
            <button
              type="button"
              onClick={() => {
                if (!isLoginMode) toggleMode();
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                isLoginMode
                  ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-lg shadow-purple-900/30'
                  : 'text-gray-400 hover:text-gray-200'
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
                  ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-lg shadow-purple-900/30'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <UserPlus size={15} /> Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full bg-gray-950/80 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-purple-500 transition-colors placeholder-gray-600"
                autoFocus
              />
            </div>

            {!isLoginMode && (
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. user@example.com"
                  className="w-full bg-gray-950/80 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-purple-500 transition-colors placeholder-gray-600"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-gray-950/80 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-purple-500 transition-colors placeholder-gray-600"
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-red-400 text-xs text-center font-semibold bg-red-950/30 p-2.5 rounded-xl border border-red-500/30"
                >
                  {error}
                </motion.p>
              )}
              {successMsg && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-emerald-400 text-xs text-center font-semibold bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-500/30"
                >
                  {successMsg}
                </motion.p>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isLoading || !username || !password || (!isLoginMode && !email)}
              className="w-full mt-4 bg-gradient-to-r from-[#8028A3] via-purple-600 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white font-bold p-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-xl shadow-purple-900/40 cursor-pointer border border-white/10"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <span>{isLoginMode ? 'Sign In & Enter Home' : 'Create Account & Continue'}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* BYJU'S Feature Badges Footer */}
          <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-3 gap-2 text-center text-[10px] text-gray-400 font-mono">
            <div className="flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-cyan-400" />
              <span>Isolated</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <Zap className="w-3 h-3 text-yellow-400" />
              <span>7 AI Agents</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <Layers className="w-3 h-3 text-purple-400" />
              <span>LangGraph</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
