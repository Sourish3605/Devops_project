import React, { useState, useEffect } from 'react';
import { usersApi } from '../../services/api';
import {
  Users,
  Shield,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Trash2,
  Edit2,
  UserCheck,
  AlertCircle,
  Clock,
  Sparkles,
  Award,
  RefreshCw,
  UserPlus,
  Check,
  X
} from 'lucide-react';

interface UserRecord {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatar_url?: string | null;
  role: 'admin' | 'organizer' | 'coordinator' | 'volunteer';
  role_id: number;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  total_hours: number | null;
  skills: string | null;
}

export const UsersManagementScreen: React.FC = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const cleanParams: Record<string, string> = {};
      if (search.trim()) cleanParams.search = search.trim();
      if (roleFilter) cleanParams.role = roleFilter;
      if (statusFilter) cleanParams.status = statusFilter;

      const res = await usersApi.getAll(cleanParams);
      if (res.success) {
        setUsers(res.data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load user directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const showNotification = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(null), 3000);
  };

  // 1-Click Administrator Account Approval
  const handleApproveUser = async (userId: number, userName: string) => {
    try {
      await usersApi.update(userId, { status: 'active' });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'active' } : u));
      showNotification(`Volunteer account "${userName}" approved successfully! They can now log in.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to approve account');
    }
  };

  // Reject / Remove Account
  const handleRejectUser = async (userId: number, userName: string) => {
    if (!window.confirm(`Reject and delete registration application for "${userName}"?`)) {
      return;
    }
    try {
      await usersApi.delete(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      showNotification(`Application for "${userName}" rejected and removed.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reject account');
    }
  };

  const handleUpdateStatus = async (userId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await usersApi.update(userId, { status: newStatus });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus as any } : u));
      showNotification(`User account marked as ${newStatus.toUpperCase()}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update user status');
    }
  };

  const handleUpdateRole = async (userId: number, newRoleId: number, newRoleName: string) => {
    try {
      await usersApi.update(userId, { role_id: newRoleId });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role_id: newRoleId, role: newRoleName as any } : u));
      showNotification(`User role updated to ${newRoleName.toUpperCase()}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update role');
    }
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete user account "${userName}"?`)) {
      return;
    }
    try {
      await usersApi.delete(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      showNotification(`User "${userName}" was removed from the system`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete user');
    }
  };

  const roleBadges: Record<string, string> = {
    admin: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    organizer: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    coordinator: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    volunteer: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
  };

  const pendingCount = users.filter(u => u.status === 'pending').length;
  const activeCount = users.filter(u => u.status === 'active').length;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Toast Feedback */}
      {actionMsg && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-2xl liquid-glass bg-emerald-500/90 text-white font-medium text-xs flex items-center gap-2 shadow-xl animate-fadeIn">
          <CheckCircle className="w-4 h-4 stroke-[2.5]" />
          <span>{actionMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-xs font-bold underline">Dismiss</button>
        </div>
      )}

      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-[11px] font-semibold border border-rose-500/20 mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>ADMINISTRATOR GOVERNANCE SCOPE</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            User Directory & Access Control
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Review volunteer registration requests, approve new accounts, assign roles, and manage system permissions.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="px-4 py-2.5 rounded-xl bg-white/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 flex items-center gap-2 self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Directory</span>
        </button>
      </div>

      {/* KPI Cards / Quick Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          onClick={() => setStatusFilter('')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === ''
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
              : 'liquid-glass-card hover:bg-white/90'
          }`}
        >
          <span className="text-[11px] block font-medium opacity-80">Total Users</span>
          <span className="text-2xl font-extrabold font-mono">{users.length}</span>
        </button>

        <button
          onClick={() => setStatusFilter('pending')}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
            statusFilter === 'pending'
              ? 'bg-amber-500 text-black border-amber-500 shadow-lg'
              : 'liquid-glass-card hover:border-amber-400/50'
          }`}
        >
          {pendingCount > 0 && (
            <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          )}
          <span className="text-[11px] block font-medium opacity-80">Pending Approvals</span>
          <span className="text-2xl font-extrabold font-mono text-amber-500 dark:text-amber-400">
            {pendingCount}
          </span>
          <span className="text-[10px] block opacity-75 mt-0.5">Awaiting Admin action</span>
        </button>

        <button
          onClick={() => setStatusFilter('active')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === 'active'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
              : 'liquid-glass-card hover:bg-white/90'
          }`}
        >
          <span className="text-[11px] block font-medium opacity-80">Active Accounts</span>
          <span className="text-2xl font-extrabold font-mono text-emerald-500 dark:text-emerald-400">{activeCount}</span>
        </button>

        <button
          onClick={() => setRoleFilter('volunteer')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            roleFilter === 'volunteer'
              ? 'bg-purple-600 text-white border-purple-600 shadow-md'
              : 'liquid-glass-card hover:bg-white/90'
          }`}
        >
          <span className="text-[11px] block font-medium opacity-80">Volunteers</span>
          <span className="text-2xl font-extrabold font-mono text-purple-500 dark:text-purple-400">
            {users.filter(u => u.role === 'volunteer').length}
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl liquid-glass-card flex flex-col md:flex-row items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by user name or email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-900 dark:text-white"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Roles</option>
            <option value="admin">Administrator</option>
            <option value="organizer">Event Organizer</option>
            <option value="coordinator">Field Coordinator</option>
            <option value="volunteer">Volunteer</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending Approval</option>
            <option value="active">Active Accounts</option>
            <option value="inactive">Suspended / Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="rounded-3xl liquid-glass-card overflow-hidden shadow-xl border border-slate-200/60 dark:border-slate-800/60">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-4 px-6">User / Identity</th>
                <th className="py-4 px-6">Role Assignment</th>
                <th className="py-4 px-6">Account Status</th>
                <th className="py-4 px-6">Registered On</th>
                <th className="py-4 px-6">Volunteer Hours</th>
                <th className="py-4 px-6 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading registered users...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No users found matching current filters.
                  </td>
                </tr>
              ) : (
                users.map(u => {
                  const isPending = u.status === 'pending';

                  return (
                    <tr
                      key={u.id}
                      className={`transition-colors ${
                        isPending
                          ? 'bg-amber-500/5 hover:bg-amber-500/10 dark:bg-amber-500/10'
                          : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${u.name}`}
                            alt={u.name}
                            className="w-9 h-9 rounded-xl object-cover ring-2 ring-indigo-500/20"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900 dark:text-white">{u.name}</p>
                              {isPending && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 text-[9px] font-bold uppercase tracking-wider animate-pulse">
                                  New Request
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-mono">{u.email}</p>
                            {u.phone && <p className="text-[10px] text-slate-400">{u.phone}</p>}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <select
                          value={u.role_id}
                          onChange={e => {
                            const id = parseInt(e.target.value, 10);
                            const nameMap: Record<number, string> = {
                              1: 'admin',
                              2: 'organizer',
                              3: 'volunteer',
                              4: 'coordinator'
                            };
                            handleUpdateRole(u.id, id, nameMap[id]);
                          }}
                          className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border focus:outline-none bg-transparent cursor-pointer ${
                            roleBadges[u.role] || ''
                          }`}
                        >
                          <option value={1} className="bg-slate-900 text-white">Admin</option>
                          <option value={2} className="bg-slate-900 text-white">Organizer</option>
                          <option value={4} className="bg-slate-900 text-white">Coordinator</option>
                          <option value={3} className="bg-slate-900 text-white">Volunteer</option>
                        </select>
                      </td>

                      <td className="py-4 px-6">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/30">
                            <Clock className="w-3 h-3" />
                            <span>Pending Review</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(u.id, u.status)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                              u.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-rose-500/20 hover:text-rose-400'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-emerald-500/20 hover:text-emerald-400'
                            }`}
                            title="Click to toggle status"
                          >
                            {u.status === 'active' ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                <span>Active</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" />
                                <span>Suspended</span>
                              </>
                            )}
                          </button>
                        )}
                      </td>

                      <td className="py-4 px-6 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'System Seed'}
                      </td>

                      <td className="py-4 px-6">
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {u.total_hours ? `${u.total_hours} hrs` : '0 hrs'}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        {isPending ? (
                          /* Quick 1-Click Approve / Reject for Admin */
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApproveUser(u.id, u.name)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm transition-all flex items-center gap-1.5"
                              title="Accept & activate volunteer account"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Accept</span>
                            </button>

                            <button
                              onClick={() => handleRejectUser(u.id, u.name)}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold text-[11px] transition-all flex items-center gap-1"
                              title="Reject application"
                            >
                              <X className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                            title="Delete User Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
