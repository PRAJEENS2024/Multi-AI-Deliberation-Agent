import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Server, Lock, User, CheckCircle, XCircle, Loader2, Save, Send } from 'lucide-react';

const API_URL = 'http://localhost:8000/api';

export default function EmailSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [senderName, setSenderName] = useState('Veritas AI');


  const [useTls, setUseTls] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await axios.get(`${API_URL}/email-config`);
        if (res.data) {
          setSmtpHost(res.data.smtp_host || 'smtp.gmail.com');
          setSmtpPort(res.data.smtp_port || 587);
          setSmtpUser(res.data.smtp_user || '');
          setSmtpPass(res.data.smtp_pass || '');
          setSenderName(res.data.sender_name || 'AI Jury');
          setUseTls(res.data.use_tls !== false);
        }
      } catch (err) {
        // Default config
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      await axios.post(`${API_URL}/email-config`, {
        smtp_host: smtpHost,
        smtp_port: smtpPort,
        smtp_user: smtpUser,
        smtp_pass: smtpPass,
        sender_name: senderName,
        use_tls: useTls,
      });
      setStatus({ type: 'success', message: 'Email configuration saved successfully!' });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.response?.data?.detail || 'Failed to save config' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setStatus(null);
    try {
      const res = await axios.post(`${API_URL}/email-config/test`, {
        smtp_host: smtpHost,
        smtp_port: smtpPort,
        smtp_user: smtpUser,
        smtp_pass: smtpPass,
        sender_name: senderName,
        use_tls: useTls,
      });
      setStatus({ type: 'success', message: res.data.message });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.response?.data?.detail || 'SMTP test failed' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="border-t border-dark-border">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-dark-surface-hover transition-colors text-sm text-gray-400 cursor-pointer"
      >
        <Mail size={18} />
        <span>Email Settings</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-500 flex items-center gap-1"><Server size={12} /> SMTP Host</label>
                <input
                  type="text"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg p-2 text-xs text-white outline-none focus:border-brand-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Port</label>
                  <input
                    type="number"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(parseInt(e.target.value) || 587)}
                    className="w-full bg-dark-bg border border-dark-border rounded-lg p-2 text-xs text-white outline-none focus:border-brand-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 flex items-center gap-1"><Lock size={12} /> TLS</label>
                  <button
                    onClick={() => setUseTls(!useTls)}
                    className={`w-full p-2 rounded-lg text-xs border transition-colors cursor-pointer ${
                      useTls ? 'bg-brand-primary/20 border-brand-primary text-brand-primary' : 'bg-dark-bg border-dark-border text-gray-500'
                    }`}
                  >
                    {useTls ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-500 flex items-center gap-1"><User size={12} /> Sender Name</label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg p-2 text-xs text-white outline-none focus:border-brand-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-500 flex items-center gap-1"><Mail size={12} /> Email</label>
                <input
                  type="email"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-dark-bg border border-dark-border rounded-lg p-2 text-xs text-white outline-none focus:border-brand-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-500 flex items-center gap-1"><Lock size={12} /> Password / App Password</label>
                <input
                  type="password"
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-dark-bg border border-dark-border rounded-lg p-2 text-xs text-white outline-none focus:border-brand-primary"
                />
              </div>

              <AnimatePresence>
                {status && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex items-center gap-1.5 text-xs p-2 rounded-lg ${
                      status.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    {status.type === 'success' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                    {status.message}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-1.5 p-2 bg-brand-primary rounded-lg text-xs font-medium hover:bg-brand-secondary transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  Save
                </button>
                <button
                  onClick={handleTest}
                  disabled={testing || !smtpUser}
                  className="flex items-center justify-center gap-1.5 p-2 bg-dark-surface border border-dark-border rounded-lg text-xs font-medium hover:bg-dark-surface-hover transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {testing ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  Test
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
