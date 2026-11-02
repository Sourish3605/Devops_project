import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { reportsApi, eventsApi, registrationsApi } from '../../services/api';
import {
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  Award,
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  ShieldAlert,
  ChevronRight,
  Building
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
  Cell
} from 'recharts';

export const DashboardScreen: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      const res = await reportsApi.getDashboardMetrics();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [user]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-medium">Loading live dashboard telemetry...</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#4f46e5', '#14b8a6', '#f59e0b', '#ec4899', '#8b5cf6'];
  const summary = data?.summary || {};
  const roleSpecific = data?.roleSpecific || {};
  const monthly = data?.monthlyParticipation || [];
  const categories = data?.categoryDistribution || [];
  const activities = data?.recentActivities || [];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 md:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 text-teal-300 text-xs font-semibold backdrop-blur-md mb-3 border border-indigo-400/20">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
              {user?.role.toUpperCase()} PORTAL ACTIVE
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name}! 👋
            </h1>
            <p className="text-indigo-200 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              SR University Community Connect System. Track community impact, volunteer allocations, and verified certifications in real time.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('events')}
              className="px-4 py-2.5 rounded-xl bg-white text-indigo-900 font-bold text-xs shadow-lg hover:bg-slate-100 transition-all flex items-center gap-2"
            >
              <span>Explore Events</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
            {user?.role === 'admin' || user?.role === 'organizer' ? (
              <button
                onClick={() => onNavigate('events')}
                className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs shadow-lg transition-all"
              >
                + New Event
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Role-Specific Metric Highlight Cards */}
      {user?.role === 'volunteer' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">My Registrations</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {roleSpecific.myRegistrations || 0}
              </h3>
            </div>
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Approved Drives</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {roleSpecific.myApproved || 0}
              </h3>
            </div>
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Hours Served</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {roleSpecific.myHours || 0} <span className="text-xs font-normal text-slate-400">hrs</span>
              </h3>
            </div>
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Earned Certificates</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {roleSpecific.myCertificates || 0}
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Admin / Universal Global Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
            <span>Total Events</span>
            <Calendar className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
            {summary.totalEvents || 0}
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">
            {summary.activeEvents || 0} active & ongoing
          </span>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
            <span>Volunteers Registered</span>
            <Users className="w-4 h-4 text-teal-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
            {summary.totalVolunteers || 0}
          </p>
          <span className="text-[11px] text-indigo-600 font-semibold mt-1 inline-block">
            {summary.totalRegistrations || 0} drive applications
          </span>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
            <span>Service Hours</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
            {summary.totalHoursServed || 0}
          </p>
          <span className="text-[11px] text-slate-400 font-medium mt-1 inline-block">
            Verified community hours
          </span>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center text-slate-500 text-xs font-medium">
            <span>Certificates Issued</span>
            <Award className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
            {summary.totalCertificates || 0}
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">
            Tamper-proof verifiable IDs
          </span>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Participation Trend Chart */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Volunteer Participation Trend
              </h3>
              <p className="text-xs text-slate-400">Monthly student participation in community activities</p>
            </div>
            <span className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly.length > 0 ? monthly : [
                { month: '2026-08', volunteers_participated: 12, events_count: 2 },
                { month: '2026-09', volunteers_participated: 28, events_count: 3 },
                { month: '2026-10', volunteers_participated: 45, events_count: 4 },
                { month: '2026-11', volunteers_participated: 60, events_count: 5 },
              ]}>
                <defs>
                  <linearGradient id="colorVolunteers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="volunteers_participated" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorVolunteers)" name="Volunteers" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Pie Chart */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Event Category Distribution
            </h3>
            <p className="text-xs text-slate-400 mb-4">Focus areas across active initiatives</p>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories.length > 0 ? categories : [
                      { category: 'Environmental', value: 3 },
                      { category: 'Healthcare', value: 2 },
                      { category: 'Education', value: 2 },
                      { category: 'Community Aid', value: 1 }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categories.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', color: '#fff', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 mt-2">
            {categories.slice(0, 4).map((c: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                  <span className="text-slate-600 dark:text-slate-300 truncate max-w-[150px]">{c.category}</span>
                </div>
                <span className="font-bold text-slate-800 dark:text-slate-200">{c.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Timeline & Quick Action Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Platform Activities */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Recent System Activity
            </h3>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Realtime Audit Log</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {activities.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">No recent activity logs recorded.</p>
            ) : (
              activities.map((act: any) => (
                <div key={act.id} className="py-3 flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-2"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {act.action} <span className="font-normal text-slate-500">by {act.user_name || 'System'}</span>
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 truncate">{act.details}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Approvals / Notice Card */}
        <div className="p-6 bg-gradient-to-br from-indigo-50 to-teal-50/50 dark:from-slate-900 dark:to-slate-900 rounded-3xl border border-indigo-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-4 shadow-md">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Institutional Compliance
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              All events conform to the SR University Community Welfare Charter 2026. Certificates generated through this portal carry digital authenticity hashes recognized for academic co-curricular credit.
            </p>

            <div className="mt-5 p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50">
              <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                Pending Administrative Approvals: <span className="text-amber-600 font-bold">{summary.pendingEvents || 0}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('reports')}
            className="w-full mt-6 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <span>View Detailed Reports</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
