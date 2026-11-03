import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { reportsApi, eventsApi, registrationsApi, usersApi } from '../../services/api';
import {
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  Award,
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  Shield,
  Briefcase,
  ChevronRight,
  Plus,
  FileText,
  UserCheck,
  CheckSquare,
  BarChart3,
  Layers,
  Sparkles,
  ArrowRight,
  Filter,
  Activity,
  Check
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

interface DashboardScreenProps {
  onNavigate: (tab: string) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      const res = await reportsApi.getDashboardMetrics();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Telemetry error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [user]);

  const showNotification = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-semibold tracking-wide">Syncing Telemetry Metrics...</p>
        </div>
      </div>
    );
  }

  const role = user?.role || 'volunteer';
  const summary = data?.summary || {};
  const roleSpecific = data?.roleSpecific || {};
  const monthly = data?.monthlyParticipation || [];
  const categories = data?.categoryDistribution || [];
  const activities = data?.recentActivities || [];

  const CHART_COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Toast Notification Alert */}
      {actionSuccess && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-2xl liquid-glass bg-emerald-500/90 text-white font-medium text-xs flex items-center gap-2 shadow-xl animate-fadeIn">
          <Check className="w-4 h-4 stroke-[2.5]" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* ================= HERO LIQUID GLASS BANNER ================= */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-7 md:p-9 shadow-xl border border-white/10">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-60 h-60 rounded-full bg-teal-500/15 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-teal-300 text-[11px] font-semibold backdrop-blur-md border border-white/15">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span>{role.toUpperCase()} PORTAL ACTIVE</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Welcome back, {user?.name}
            </h1>
            <p className="text-slate-300 text-xs md:text-sm max-w-2xl leading-relaxed">
              Enterprise Community Management Platform. Real-time telemetry, duty stations, verified check-ins, and performance credentials.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('events')}
              className="px-4 py-2.5 rounded-xl bg-white text-slate-950 font-bold text-xs shadow-lg hover:bg-slate-100 transition-all flex items-center gap-2"
            >
              <span>Explore Events</span>
              <ArrowUpRight className="w-4 h-4 stroke-[2.2]" />
            </button>

            {(role === 'admin' || role === 'organizer') && (
              <button
                onClick={() => onNavigate('events')}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4 stroke-[2.2]" />
                <span>Create Event</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================= ROLE-SPECIFIC SPECIALIZED SECTIONS ================= */}

      {/* 1. ADMIN DASHBOARD */}
      {role === 'admin' && (
        <div className="space-y-8">
          {/* Admin KPI Ribbon */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="p-5 rounded-2xl liquid-glass-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Users</span>
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                {summary.totalVolunteers || 0}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> System Wide
              </span>
            </div>

            <div className="p-5 rounded-2xl liquid-glass-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Events</span>
                <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                {summary.activeEvents || 0}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {summary.completedEvents || 0} completed
              </span>
            </div>

            <div className="p-5 rounded-2xl liquid-glass-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Registrations</span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                {summary.totalRegistrations || 0}
              </div>
              <span className="text-[11px] text-amber-600 font-semibold mt-1 inline-flex items-center gap-1">
                Active pipeline
              </span>
            </div>

            <div className="p-5 rounded-2xl liquid-glass-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Hours Credited</span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                {summary.totalHoursServed || 0} hrs
              </div>
              <span className="text-[11px] text-purple-600 font-semibold mt-1 inline-flex items-center gap-1">
                {summary.totalCertificates || 0} certificates issued
              </span>
            </div>
          </div>

          {/* Quick Action Hub for Admin */}
          <div className="p-6 rounded-3xl liquid-glass-card">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Governance & Quick Controls</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => onNavigate('events')}
                className="p-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 transition-all text-left flex items-center justify-between group"
              >
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">Event Directory</span>
                  <span className="text-[11px] text-slate-500">Inspect & regulate</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => onNavigate('reports')}
                className="p-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 transition-all text-left flex items-center justify-between group"
              >
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">Institutional Reports</span>
                  <span className="text-[11px] text-slate-500">PDF & Data Exports</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => onNavigate('certificates')}
                className="p-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 transition-all text-left flex items-center justify-between group"
              >
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">Certificates Hub</span>
                  <span className="text-[11px] text-slate-500">Batch credentials</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => onNavigate('allocations')}
                className="p-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 transition-all text-left flex items-center justify-between group"
              >
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">Duty Stations</span>
                  <span className="text-[11px] text-slate-500">Cross-team dispatch</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. ORGANIZER DASHBOARD */}
      {role === 'organizer' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl liquid-glass-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500">Created Initiatives</span>
                <Calendar className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                {roleSpecific.myEvents || 0}
              </div>
              <span className="text-xs text-slate-500 mt-1 block">Active community drives</span>
            </div>

            <div className="p-6 rounded-3xl liquid-glass-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500">Pending Applications</span>
                <Users className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                {roleSpecific.pendingApplications || 0}
              </div>
              <button
                onClick={() => onNavigate('registrations')}
                className="text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline mt-2 inline-flex items-center gap-1"
              >
                <span>Review applications</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-6 rounded-3xl liquid-glass-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500">Confirmed Volunteers</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                {roleSpecific.totalVolunteersAllocated || 0}
              </div>
              <span className="text-xs text-emerald-600 font-medium mt-1 block">Rostered for duty</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. COORDINATOR DASHBOARD */}
      {role === 'coordinator' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl liquid-glass-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500">Assigned Drives</span>
                <Briefcase className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                {roleSpecific.assignedEvents || 0}
              </div>
              <span className="text-xs text-slate-500 mt-1 block">Operational events under management</span>
            </div>

            <div className="p-6 rounded-3xl liquid-glass-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500">Attendance Awaiting Check-in</span>
                <CheckSquare className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                {roleSpecific.pendingAttendance || 0}
              </div>
              <button
                onClick={() => onNavigate('attendance')}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline mt-2 inline-flex items-center gap-1"
              >
                <span>Open check-in desk</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. VOLUNTEER DASHBOARD */}
      {role === 'volunteer' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            <div className="p-5 rounded-2xl liquid-glass-card">
              <span className="text-xs font-semibold text-slate-500 block mb-2">My Applications</span>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                {roleSpecific.myRegistrations || 0}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Registered</span>
            </div>

            <div className="p-5 rounded-2xl liquid-glass-card">
              <span className="text-xs font-semibold text-slate-500 block mb-2">Approved Status</span>
              <div className="text-2xl font-extrabold text-emerald-600 font-mono">
                {roleSpecific.myApproved || 0}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Ready for service</span>
            </div>

            <div className="p-5 rounded-2xl liquid-glass-card">
              <span className="text-xs font-semibold text-slate-500 block mb-2">Hours Credited</span>
              <div className="text-2xl font-extrabold text-indigo-600 font-mono">
                {roleSpecific.myHours || 0} hrs
              </div>
              <span className="text-[11px] text-indigo-600 font-semibold mt-1 block">Verified community service</span>
            </div>

            <div className="p-5 rounded-2xl liquid-glass-card">
              <span className="text-xs font-semibold text-slate-500 block mb-2">My Certificates</span>
              <div className="text-2xl font-extrabold text-purple-600 font-mono">
                {roleSpecific.myCertificates || 0}
              </div>
              <button
                onClick={() => onNavigate('certificates')}
                className="text-[11px] text-purple-600 dark:text-purple-400 font-bold hover:underline mt-1 block"
              >
                View credentials →
              </button>
            </div>
          </div>

          {/* Upcoming Station Notice if any */}
          {roleSpecific.upcomingDuty && (
            <div className="p-6 rounded-3xl liquid-glass bg-gradient-to-r from-indigo-50 to-teal-50 dark:from-indigo-950/40 dark:to-teal-950/30 border border-indigo-200/60 dark:border-indigo-800/40">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    Upcoming Assigned Duty Station
                  </span>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                    {roleSpecific.upcomingDuty.duty_name} • {roleSpecific.upcomingDuty.event_title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Date: {roleSpecific.upcomingDuty.start_date} | Venue: {roleSpecific.upcomingDuty.venue}
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('attendance')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition-all shrink-0"
                >
                  View Desk
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TELEMETRY ANALYTICS CHARTS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Participation Flow Area Chart */}
        <div className="lg:col-span-8 p-6 md:p-8 rounded-3xl liquid-glass-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Participation Velocity</h3>
              <p className="text-xs text-slate-500">Monthly volunteer engagement index</p>
            </div>
            <button
              onClick={() => onNavigate('reports')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>Detailed Report</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="volunteers_participated"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#velocityGrad)"
                  name="Volunteers"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share Donut */}
        <div className="lg:col-span-4 p-6 md:p-8 rounded-3xl liquid-glass-card space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Domain Distribution</h3>
            <p className="text-xs text-slate-500">Initiatives across social pillars</p>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="value"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {categories.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {categories.map((c: any, i: number) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                <span>{c.category}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ================= REAL-TIME ACTIVITY AUDIT LOG ================= */}
      <div className="p-6 md:p-8 rounded-3xl liquid-glass-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Real-Time Operational Audit</h3>
            <p className="text-xs text-slate-500">Live transaction timestamps and user logs</p>
          </div>
          <span className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {activities.length} Recorded
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {activities.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">No activity recorded yet.</p>
          ) : (
            activities.map((act: any) => (
              <div key={act.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {act.action} <span className="font-normal text-slate-500">— {act.details}</span>
                    </p>
                    <span className="text-[10px] text-slate-400">
                      Operator: {act.user_name || 'System Auto'}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                  {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
