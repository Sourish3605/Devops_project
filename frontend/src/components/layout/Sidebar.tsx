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
  ChevronRight,
  Shield,
  UserCheck,
  HeartHandshake,
  Compass
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const { user, logout } = useAuth();
  const role = user?.role || 'volunteer';

  const navItems = [
    { id: 'dashboard', label: 'Analytics Dashboard', icon: LayoutDashboard, roles: ['admin', 'organizer', 'volunteer', 'coordinator'] },
    { id: 'users', label: 'User Governance', icon: Shield, roles: ['admin'] },
    { id: 'events', label: 'Events Hub', icon: Calendar, roles: ['admin', 'organizer', 'volunteer', 'coordinator'] },
    { id: 'registrations', label: 'Registrations', icon: ClipboardList, roles: ['admin', 'organizer', 'volunteer', 'coordinator'] },
    { id: 'allocations', label: 'Duty Allocation', icon: Users, roles: ['admin', 'organizer', 'coordinator'] },
    { id: 'attendance', label: 'Attendance Desk', icon: CheckSquare, roles: ['admin', 'organizer', 'coordinator', 'volunteer'] },
    { id: 'certificates', label: 'Certificates Hub', icon: Award, roles: ['admin', 'organizer', 'volunteer', 'coordinator'] },
    { id: 'reports', label: 'Reports & Analytics', icon: FileBarChart, roles: ['admin', 'organizer', 'coordinator'] },
    { id: 'profile', label: 'Profile & Settings', icon: Settings, roles: ['admin', 'organizer', 'volunteer', 'coordinator'] },
  ];

  const allowedNav = navItems.filter(item => item.roles.includes(role));

  const roleStyles: Record<string, { label: string; badge: string; icon: any }> = {
    admin: { label: 'Administrator', badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900', icon: Shield },
    organizer: { label: 'Event Organizer', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900', icon: Compass },
    coordinator: { label: 'Field Coordinator', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900', icon: UserCheck },
    volunteer: { label: 'Community Volunteer', badge: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900', icon: HeartHandshake }
  };

  const currentRoleInfo = roleStyles[role] || roleStyles.volunteer;
  const RoleIcon = currentRoleInfo.icon;

  return (
    <aside className="w-64 liquid-glass bg-white/70 dark:bg-slate-900/80 border-r border-slate-200/60 dark:border-slate-800/60 flex flex-col justify-between h-screen sticky top-0 select-none backdrop-blur-xl transition-all">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="font-bold text-base text-slate-950 dark:text-white tracking-tight flex items-center gap-1">
              Community<span className="text-indigo-600 dark:text-indigo-400">Connect</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Enterprise SaaS</p>
          </div>
        </div>

        {/* Current Active Role Capsule */}
        <div className="px-4 py-3 border-b border-slate-200/40 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-white dark:bg-slate-800 shadow-sm border border-slate-200/60 dark:border-slate-700/60">
              <RoleIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">Authorized Scope</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{currentRoleInfo.label}</span>
            </div>
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
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Footer Card */}
      <div className="p-4 border-t border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center gap-3 mb-3 p-2 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/40">
          <img
            src={user?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'User'}`}
            alt={user?.name}
            className="w-9 h-9 rounded-xl object-cover ring-2 ring-indigo-500/20"
          />
          <div className="truncate flex-1">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
            <span className={`inline-block text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full border ${currentRoleInfo.badge}`}>
              {role}
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors border border-rose-200/60 dark:border-rose-900/40"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
