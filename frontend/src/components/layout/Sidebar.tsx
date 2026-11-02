import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Users,
  ClipboardList,
  CheckSquare,
  Award,
  FileBarChart,
  Settings,
  LogOut,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const { user, logout, switchDemoRole } = useAuth();
  const role = user?.role || 'volunteer';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'organizer', 'volunteer', 'coordinator'] },
    { id: 'events', label: 'Events Hub', icon: Calendar, roles: ['admin', 'organizer', 'volunteer', 'coordinator'] },
    { id: 'registrations', label: 'Registrations', icon: ClipboardList, roles: ['admin', 'organizer', 'volunteer', 'coordinator'] },
    { id: 'allocations', label: 'Duty Allocation', icon: Users, roles: ['admin', 'organizer', 'coordinator'] },
    { id: 'attendance', label: 'Attendance', icon: CheckSquare, roles: ['admin', 'organizer', 'coordinator', 'volunteer'] },
    { id: 'certificates', label: 'Certificates', icon: Award, roles: ['admin', 'organizer', 'volunteer', 'coordinator'] },
    { id: 'reports', label: 'Reports & Analytics', icon: FileBarChart, roles: ['admin', 'organizer', 'coordinator'] },
    { id: 'profile', label: 'Profile & Settings', icon: Settings, roles: ['admin', 'organizer', 'volunteer', 'coordinator'] },
  ];

  const allowedNav = navItems.filter(item => item.roles.includes(role));

  const roleBadgeColors: Record<string, string> = {
    admin: 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    organizer: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    coordinator: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    volunteer: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
  };

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between h-screen sticky top-0 select-none transition-colors">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
              Community<span className="text-indigo-600 dark:text-indigo-400">Connect</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">SR University • 2026</p>
          </div>
        </div>

        {/* Role Demo Switcher pill (Crucial for B.Tech project presentation) */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
            Switch Role View (Demo)
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {(['admin', 'organizer', 'volunteer', 'coordinator'] as const).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => switchDemoRole(r)}
                className={`text-[11px] font-medium py-1 px-2 rounded-md transition-all capitalize border ${
                  role === r
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {allowedNav.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 shadow-sm border-l-4 border-indigo-600'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Footer Card */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img
              src={user?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'User'}`}
              alt={user?.name}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/20"
            />
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user?.name}</p>
              <span className={`inline-block text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${roleBadgeColors[role] || ''}`}>
                {role}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors border border-rose-200 dark:border-rose-900/40"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
