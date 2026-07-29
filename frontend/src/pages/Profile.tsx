import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Key,
  Shield,
  Bell,
  Save,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Camera,
  Lock,
} from 'lucide-react';

interface UserProfileData {
  user_id: string;
  username: string;
  email: string;
  full_name: string;
  avatar_url: string;
  theme_preference: string;
  groq_api_key: string;
  notifications_enabled: boolean;
  email_reports_enabled: boolean;
}

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfileData>({
    user_id: localStorage.getItem('user_id') || 'user-1',
    username: localStorage.getItem('auth_token')?.replace('token-', '') || 'User',
    email: localStorage.getItem('user_email') || 'user@example.com',
    full_name: (localStorage.getItem('auth_token')?.replace('token-', '') || 'User').toUpperCase(),
    avatar_url: '',
    theme_preference: 'dark',
    groq_api_key: '',
    notifications_enabled: true,
    email_reports_enabled: true,
  });

  const [fullName, setFullName] = useState(profile.full_name);
  const [email, setEmail] = useState(profile.email);
  const [groqKey, setGroqKey] = useState('');
  const [password, setPassword] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [emailReports, setEmailReports] = useState(true);

  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const username = localStorage.getItem('auth_token')?.replace('token-', '');
      if (!username) return;

      try {
        const res = await fetch(`http://localhost:8000/api/profile/${username}`);
        if (res.ok) {
          const data: UserProfileData = await res.json();
          setProfile(data);
          setFullName(data.full_name || username.toUpperCase());
          setEmail(data.email || '');
          setGroqKey(data.groq_api_key || '');
          setNotifications(data.notifications_enabled ?? true);
          setEmailReports(data.email_reports_enabled ?? true);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    const username = profile.username;
    try {
      const res = await fetch(`http://localhost:8000/api/profile/${username}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email: email,
          groq_api_key: groqKey,
          password: password || undefined,
          notifications_enabled: notifications,
          email_reports_enabled: emailReports,
        }),
      });

      if (res.ok) {
        const updated: UserProfileData = await res.json();
        setProfile(updated);
        localStorage.setItem('user_email', email);
        setStatusMessage({ type: 'success', text: 'Profile & delivery preferences saved!' });
      } else {
        setStatusMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Network error updating profile.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-[#070A14] text-gray-100 p-6 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-xs font-bold text-gray-300 hover:text-white transition-colors bg-gray-900/80 border border-white/10 px-3.5 py-2 rounded-xl cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home Page
          </button>

          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              Veritas Account Settings
            </span>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`p-4 rounded-xl border flex items-center gap-3 text-sm font-semibold ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                : 'bg-red-950/40 border-red-500/30 text-red-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Profile Card Header */}
        <div className="byjus-card p-6 border border-purple-500/30 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#8028A3] via-purple-600 to-[#00F5D4] flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-purple-900/30 border-2 border-white/20">
                {profile.username[0]?.toUpperCase() || 'V'}
              </div>
              <div className="absolute -bottom-1 -right-1 p-1 bg-yellow-400 rounded-full border-2 border-gray-950">
                <Camera className="w-3 h-3 text-gray-950" />
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                {fullName || profile.username}
                <span className="text-xs font-mono byjus-badge-gold px-2.5 py-0.5 rounded-full">
                  Pro License
                </span>
              </h1>
              <p className="text-sm text-gray-300 mt-1 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                {email || 'No email registered'}
              </p>
              <div className="flex items-center gap-4 mt-3 text-xs font-mono text-gray-400">
                <span>User ID: {profile.user_id.slice(0, 12)}...</span>
                <span className="text-emerald-400 font-bold">100% Isolated Workspace</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Edit Form */}
        <form onSubmit={handleSave} className="space-y-6">
          <div className="byjus-card p-6 border border-purple-500/30">
            <h2 className="text-sm font-bold uppercase tracking-wider text-purple-300 mb-4 flex items-center gap-2">
              <User className="w-4 h-4" /> Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-gray-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">Registered Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="user@example.com"
                />
              </div>
            </div>
          </div>

          <div className="byjus-card p-6 border border-purple-500/30">
            <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-300 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Security & Custom Keys
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center justify-between uppercase tracking-wider">
                  <span>Custom Groq API Key (Optional)</span>
                  <span className="text-[10px] text-gray-400 font-mono">Overlays default key for high-throughput queries</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={groqKey}
                    onChange={(e) => setGroqKey(e.target.value)}
                    className="w-full bg-gray-950/80 border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500 transition-colors"
                    placeholder="gsk_..."
                  />
                  <Key className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">Account Password</label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-950/80 border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    placeholder="Leave blank to keep existing password"
                  />
                  <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                </div>
              </div>
            </div>
          </div>

          <div className="byjus-card p-6 border border-purple-500/30">
            <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-300 mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4" /> Dual File Delivery Preferences
            </h2>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3.5 rounded-xl bg-gray-950/60 border border-white/10 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-gray-200">Automated Dual Email Dispatch</div>
                  <div className="text-[11px] text-gray-400">Receive PDF (.pdf) and Word Document (.docx) reports automatically after agent deliberation</div>
                </div>
                <input
                  type="checkbox"
                  checked={emailReports}
                  onChange={(e) => setEmailReports(e.target.checked)}
                  className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl bg-gray-950/60 border border-white/10 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-gray-200">In-App Deliberation Notifications</div>
                  <div className="text-[11px] text-gray-400">Show live status updates when jury agents complete verification stages</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-gradient-to-r from-[#8028A3] via-purple-600 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-xl shadow-purple-900/40 transition-all disabled:opacity-50 cursor-pointer border border-white/10"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
