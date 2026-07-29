import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, ArrowRight, Loader2, UserPlus, LogIn } from 'lucide-react';
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
          navigate('/chat');
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
          setSuccessMsg('Account created successfully! Redirecting...');
          setTimeout(() => navigate('/chat'), 800);
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
    <div className="w-full min-h-screen flex items-center justify-center bg-dark-bg p-4 relative overflow-hidden">
      {/* Background glowing orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-primary/20 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass-panel p-8 relative z-10">
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center font-bold text-white shadow-lg shadow-brand-glow mb-4">
              <ShieldAlert size={32} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">AI Jury</h1>
            <p className="text-gray-400 text-sm text-center">Secure Multi-Agent Intelligence System</p>
          </div>

          {/* Toggle Tabs */}
          <div className="flex bg-dark-surface p-1 rounded-xl mb-6 border border-dark-border">
            <button 
              type="button"
              onClick={() => { if (!isLoginMode) toggleMode(); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${isLoginMode ? 'bg-dark-bg text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <LogIn size={16} /> Sign In
            </button>
            <button 
              type="button"
              onClick={() => { if (isLoginMode) toggleMode(); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${!isLoginMode ? 'bg-dark-bg text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <UserPlus size={16} /> Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full bg-dark-surface border border-dark-border outline-none rounded-xl p-4 text-white placeholder-gray-600 focus:border-brand-primary transition-colors"
                autoFocus
              />
            </div>

            {/* Email field - only shown for signup */}
            {!isLoginMode && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. prajeen114@gmail.com"
                  className="w-full bg-dark-surface border border-dark-border outline-none rounded-xl p-4 text-white placeholder-gray-600 focus:border-brand-primary transition-colors"
                />

              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-dark-surface border border-dark-border outline-none rounded-xl p-4 text-white placeholder-gray-600 focus:border-brand-primary transition-colors"
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-red-400 text-sm text-center font-medium mt-2">
                  {error}
                </motion.p>
              )}
              {successMsg && (
                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-green-400 text-sm text-center font-medium mt-2">
                  {successMsg}
                </motion.p>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isLoading || !username || !password || (!isLoginMode && !email)}
              className="w-full mt-4 bg-brand-primary hover:bg-brand-primary/90 text-white font-medium p-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:hover:bg-brand-primary shadow-lg shadow-brand-glow cursor-pointer"
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : (
                <>
                  {isLoginMode ? 'Authenticate' : 'Create Account'} <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
