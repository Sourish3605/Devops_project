import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { registrationsApi, eventsApi } from '../../services/api';
import { VolunteerRegistration } from '../../types';
import {
  ClipboardList,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Search,
  Calendar,
  MapPin,
  AlertTriangle
} from 'lucide-react';

export const RegistrationsScreen: React.FC = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<VolunteerRegistration[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const [regsRes, eventsRes] = await Promise.all([
        registrationsApi.getAll({
          event_id: selectedEventId || undefined,
          status: selectedStatus || undefined
        }),
        eventsApi.getAll()
      ]);

      if (regsRes.success) setRegistrations(regsRes.data);
      if (eventsRes.success) setEvents(eventsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [selectedEventId, selectedStatus]);

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const res = await registrationsApi.updateStatus(id, status);
      setActionFeedback(res.message);
      setTimeout(() => setActionFeedback(null), 3000);
      fetchRegistrations();
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const handleCancelRegistration = async (id: number) => {
    if (!confirm('Cancel this volunteer application?')) return;
    try {
      await registrationsApi.cancel(id);
      fetchRegistrations();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const canApprove = ['admin', 'organizer', 'coordinator'].includes(user?.role || '');

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Volunteer Registrations & Applications
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {user?.role === 'volunteer'
              ? 'Track all your submitted event applications, approval status, and preferences.'
              : 'Review volunteer applications, approve candidates, and monitor event capacity.'}
          </p>
        </div>
      </div>

      {actionFeedback && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Filter toolbar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">Filter by Event</label>
          <select
            value={selectedEventId}
            onChange={e => setSelectedEventId(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Community Events</option>
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">Filter by Status</label>
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="waitlisted">Waitlisted</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-400">Loading registrations...</p>
          </div>
        ) : registrations.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">No registrations found</h3>
            <p className="text-xs text-slate-400 mt-1">No applications matching the selected criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Volunteer</th>
                  <th className="py-3.5 px-6">Event</th>
                  <th className="py-3.5 px-6">Preferred / Assigned Duty</th>
                  <th className="py-3.5 px-6">Availability Note</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {registrations.map(reg => {
                  const statusColors: Record<string, string> = {
                    approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200',
                    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200',
                    waitlisted: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200',
                    rejected: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200',
                    cancelled: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300'
                  };

                  return (
                    <tr key={reg.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={reg.volunteer_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${reg.volunteer_name}`}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{reg.volunteer_name}</p>
                            <p className="text-[11px] text-slate-500">{reg.volunteer_email}</p>
                            {reg.contact_phone && (
                              <p className="text-[10px] text-slate-400">{reg.contact_phone}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{reg.event_title}</p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-indigo-500" />
                          <span>{reg.start_date}</span>
                        </p>
                      </td>

                      <td className="py-4 px-6">
                        {reg.assigned_duty_name ? (
                          <span className="inline-block px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800 text-[11px]">
                            Assigned: {reg.assigned_duty_name}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">
                            Prefers: {reg.preferred_duty_name || 'General Team'}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 max-w-xs truncate text-slate-600 dark:text-slate-400">
                        {reg.availability_note || '—'}
                      </td>

                      <td className="py-4 px-6">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border ${statusColors[reg.status] || ''}`}>
                          {reg.status}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        {canApprove ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {reg.status !== 'approved' && (
                              <button
                                onClick={() => handleStatusChange(reg.id, 'approved')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px]"
                              >
                                Approve
                              </button>
                            )}
                            {reg.status !== 'rejected' && (
                              <button
                                onClick={() => handleStatusChange(reg.id, 'rejected')}
                                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[11px]"
                              >
                                Reject
                              </button>
                            )}
                          </div>
                        ) : (
                          reg.status !== 'cancelled' && (
                            <button
                              onClick={() => handleCancelRegistration(reg.id)}
                              className="text-xs text-rose-600 hover:underline"
                            >
                              Cancel Application
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
