import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';
import { Sparkles, ArrowRight, ShieldCheck, UserCheck, HeartHandshake, Compass } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, switchDemoRole } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('admin@communityconnect.edu');
  const [password, setPassword] = useState('Password@123');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'organizer' | 'volunteer' | 'coordinator'>('volunteer');
  const [phone, setPhone] = useState('');
  const [skills, setSkills] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        const res = await authApi.register({
          name,
          email,
          password,
          role,
          phone,
          skills
        });
        if (res.success) {
          login(res.token, res.user);
        }
      } else {
        const res = await authApi.login(email, password);
        if (res.success) {
          login(res.token, res.user);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Operation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { role: 'admin' as const, email: 'admin@communityconnect.edu', title: 'System Admin', icon: ShieldCheck, color: 'text-rose-600 bg-rose-50 border-rose-200' },
    { role: 'organizer' as const, email: 'organizer@communityconnect.edu', title: 'Event Organizer', icon: Compass, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { role: 'volunteer' as const, email: 'volunteer@communityconnect.edu', title: 'Volunteer (Sneha)', icon: HeartHandshake, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { role: 'coordinator' as const, email: 'coordinator@communityconnect.edu', title: 'Field Coordinator', icon: UserCheck, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-800 text-slate-800 dark:text-slate-100">
        
        {/* Left Side: Brand & Quick Demo Access */}
        <div className="p-8 md:p-10 bg-gradient-to-b from-indigo-900 via-slate-900 to-slate-950 text-white flex flex-col justify-between border-b md:border-b-0 md:border-r border-indigo-950/50">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">CommunityConnect</h1>
                <p className="text-xs text-indigo-300">SR University • Dept. of CSE</p>
              </div>
            </div>

            <h2 className="text-2xl font-extrabold text-white leading-tight mb-3">
              Community Event Management & Volunteer Portal
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              B.Tech IV Year Capstone Project. A production-ready role-based platform powering campus drives, duty assignments, live attendance, and verified credential certificates.
            </p>

            {/* Quick 1-Click Role Login for Grading Panel */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-teal-400">
                ⚡ 1-Click Quick Demo Sign-in:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {demoAccounts.map(demo => {
                  const Icon = demo.icon;
                  return (
                    <button
                      key={demo.role}
                      type="button"
                      onClick={() => switchDemoRole(demo.role)}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/80 hover:bg-indigo-900/60 border border-slate-700/60 hover:border-indigo-400 text-left transition-all group"
                    >
                      <Icon className="w-4 h-4 text-teal-300 group-hover:scale-110 transition-transform" />
                      <div className="truncate">
                        <div className="text-xs font-semibold text-white capitalize">{demo.role}</div>
                        <div className="text-[10px] text-slate-400 truncate">{demo.title}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between items-center">
            <span>Academic Year 2026–2027</span>
            <span>Password: Password@123</span>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-8 md:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {isRegistering ? 'Create Volunteer Account' : 'Welcome Back'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isRegistering
                ? 'Join thousands of SR University volunteers today'
                : 'Enter your credentials to access your dashboard'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Sneha Patel"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Role
                    </label>
                    <select
                      value={role}
                      onChange={e => setRole(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="volunteer">Volunteer</option>
                      <option value="organizer">Event Organizer</option>
                      <option value="coordinator">Coordinator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                {role === 'volunteer' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Skills & Expertise
                    </label>
                    <input
                      type="text"
                      value={skills}
                      onChange={e => setSkills(e.target.value)}
                      placeholder="e.g. First Aid, Crowd Management, Photography"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Institutional Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@communityconnect.edu"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              <span>{loading ? 'Processing...' : isRegistering ? 'Register Account' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
              }}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              {isRegistering
                ? 'Already have an account? Sign In'
                : "Don't have an account? Register as Volunteer"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
