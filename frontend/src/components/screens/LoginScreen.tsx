import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';
import {
  Sparkles,
  ArrowRight,
  Shield,
  Calendar,
  Users,
  CheckCircle2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  User,
  Phone,
  Briefcase,
  AlertCircle,
  Loader2,
  KeyRound
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'organizer' | 'coordinator' | 'volunteer'>('admin');
  
  // Credentials
  const [email, setEmail] = useState('admin@communityconnect.edu');
  const [password, setPassword] = useState('Password@123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Registration specifics
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [skills, setSkills] = useState('');

  // States
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Pre-configured role quick-access options with real credentials
  const roleCards = [
    {
      id: 'admin' as const,
      title: 'Administrator',
      description: 'System governance, role policies, and telemetry',
      defaultEmail: 'admin@communityconnect.edu',
      icon: Shield,
      accent: 'from-blue-500/20 to-indigo-500/20 text-indigo-400 border-indigo-500/30'
    },
    {
      id: 'organizer' as const,
      title: 'Event Organizer',
      description: 'Event creation, quotas, and volunteer reviews',
      defaultEmail: 'organizer@communityconnect.edu',
      icon: Calendar,
      accent: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30'
    },
    {
      id: 'coordinator' as const,
      title: 'Field Coordinator',
      description: 'Station duty allocation and live roll-call',
      defaultEmail: 'coordinator@communityconnect.edu',
      icon: Users,
      accent: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30'
    },
    {
      id: 'volunteer' as const,
      title: 'Volunteer',
      description: 'Opportunity enrollment and verified certificates',
      defaultEmail: 'volunteer@communityconnect.edu',
      icon: CheckCircle2,
      accent: 'from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30'
    }
  ];

  const handleRoleSelect = (roleId: 'admin' | 'organizer' | 'coordinator' | 'volunteer', defaultMail: string) => {
    setSelectedRole(roleId);
    setError('');
    if (!isRegistering) {
      setEmail(defaultMail);
      setPassword('Password@123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isRegistering) {
        if (!name.trim()) throw new Error('Please enter your full name');
        if (!email.trim()) throw new Error('Please enter your email');
        if (!password || password.length < 6) throw new Error('Password must be at least 6 characters long');

        const res = await authApi.register({
          name: name.trim(),
          email: email.trim(),
          password,
          role: selectedRole === 'admin' ? 'volunteer' : selectedRole,
          phone: phone.trim(),
          skills: skills.trim()
        });

        if (res.success) {
          setSuccessMsg('Registration submitted! Your volunteer account is awaiting review and approval by an Administrator. Once approved, you can sign in with your credentials.');
          setIsRegistering(false);
          setEmail(email.trim());
          setSelectedRole('volunteer');
        }
      } else {
        const res = await authApi.login(email.trim(), password, selectedRole);
        if (res.success) {
          if (res.user.role.toLowerCase() !== selectedRole.toLowerCase()) {
            throw new Error(`Access Denied: This account is registered as ${res.user.role.toUpperCase()}, not ${selectedRole.toUpperCase()}. Please select the correct role.`);
          }
          login(res.token, res.user);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setError('Please provide your registered email address.');
      return;
    }
    setForgotSent(true);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#070913] text-white flex items-center justify-center p-4 sm:p-6 lg:p-10 font-sans antialiased selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      
      {/* Background radial gradient flares */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[160px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[160px]" />

      {/* Main Glassmorphic Container */}
      <div className="relative z-10 w-full max-w-5xl rounded-[36px] bg-[#0c1022]/90 border border-white/[0.08] shadow-[0_30px_90px_rgba(0,0,0,0.8)] backdrop-blur-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* ================= LEFT BRAND & ROLE SELECTOR (Span 5) ================= */}
        <div className="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/[0.06] bg-gradient-to-b from-[#111630]/60 to-transparent">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <Sparkles className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-white">
                  Community<span className="text-indigo-400">Connect</span>
                </span>
                <span className="block text-[10px] font-semibold text-slate-400 tracking-wider uppercase mt-0.5">
                  Enterprise Platform
                </span>
              </div>
            </div>

            {/* Headline */}
            <div className="space-y-3 mb-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                Empowering Community Action with Verifiable Impact.
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Single sign-on gateway for event logistics, volunteer registration quotas, real-time attendance validation, and automated certificates.
              </p>
            </div>

            {/* Role Cards */}
            <div className="space-y-2 mb-6">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Select Sign-in Role
              </label>
              <div className="space-y-2.5">
                {roleCards.map(role => {
                  const Icon = role.icon;
                  const isSelected = selectedRole === role.id;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => handleRoleSelect(role.id, role.defaultEmail)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center gap-3.5 ${
                        isSelected
                          ? 'bg-[#182042] border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.25)] ring-1 ring-indigo-400'
                          : 'bg-[#10152e]/60 border-white/[0.06] hover:bg-[#151c3d] hover:border-white/10'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br ${role.accent} border border-white/10`}>
                        <Icon className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                            {role.title}
                          </span>
                          {isSelected && <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {role.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>CommunityConnect Core</span>
            <span>v2.4.0</span>
          </div>
        </div>

        {/* ================= RIGHT FORM PANEL (Span 7) ================= */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center bg-[#090d1c]/40">
          
          {showForgotPassword ? (
            /* Forgot Password */
            <div className="max-w-md mx-auto w-full space-y-6">
              <button
                type="button"
                onClick={() => { setShowForgotPassword(false); setForgotSent(false); }}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1.5"
              >
                ← Back to Sign In
              </button>
              
              <div>
                <h3 className="text-2xl font-bold text-white">Reset Account Password</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Enter your registered email address to receive recovery instructions.
                </p>
              </div>

              {forgotSent ? (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-3">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Recovery instructions dispatched</span>
                  </div>
                  <p className="text-slate-300">
                    A password reset link has been dispatched to <strong>{forgotEmail}</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setShowForgotPassword(false); setForgotSent(false); }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors"
                  >
                    Return to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Email Address
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)}
                        placeholder="user@communityconnect.edu"
                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#141a35] border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Send Reset Instructions</span>
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* Main Sign In Form */
            <div className="max-w-md mx-auto w-full space-y-7">
              
              {/* Header Title with clean Action Switcher */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-extrabold text-white tracking-tight">
                    {isRegistering ? 'Create Account' : 'Welcome Back'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {isRegistering
                      ? `Register as ${selectedRole.toUpperCase()}`
                      : `Signing in to ${selectedRole.toUpperCase()} Portal`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(!isRegistering);
                    setError('');
                    setSuccessMsg('');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#171f42] hover:bg-[#1e2857] text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all shrink-0"
                >
                  {isRegistering ? 'Sign In Instead' : 'Create Account'}
                </button>
              </div>

              {/* Error & Success Feedback */}
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Registration only fields */}
                {isRegistering && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 block">
                        Full Name <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <User className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                        <input
                          type="text"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="e.g. Dr. Rajesh Sharma"
                          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#141a35] border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 block">Phone</label>
                        <div className="relative flex items-center">
                          <Phone className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                          <input
                            type="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            placeholder="+91 98765 43210"
                            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#141a35] border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 block">Skills</label>
                        <div className="relative flex items-center">
                          <Briefcase className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                          <input
                            type="text"
                            value={skills}
                            onChange={e => setSkills(e.target.value)}
                            placeholder="Coordination, First Aid"
                            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#141a35] border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="name@communityconnect.edu"
                      className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#141a35] border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Password Field with comfortable visibility toggle */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">
                      Password <span className="text-rose-400">*</span>
                    </label>
                    {!isRegistering && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(true);
                          setForgotEmail(email);
                        }}
                        className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-11 pr-12 py-3 rounded-2xl bg-[#141a35] border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 p-1.5 text-slate-400 hover:text-white transition-colors focus:outline-none rounded-lg"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="pt-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-500 bg-[#141a35] border-white/20 focus:ring-indigo-500 focus:ring-offset-0"
                    />
                    <span className="text-xs text-slate-400">Remember credentials on this device</span>
                  </label>
                </div>

                {/* Submit Action Button with gradient glow */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-teal-400 hover:opacity-95 text-white font-bold text-xs sm:text-sm tracking-wide shadow-[0_8px_25px_rgba(99,102,241,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>{isRegistering ? 'Complete Registration' : `Authorize as ${selectedRole.toUpperCase()}`}</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.2]" />
                    </>
                  )}
                </button>
              </form>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
