import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { attendanceApi, eventsApi, certificatesApi } from '../../services/api';
import { AttendanceRecord, EventItem } from '../../types';
import {
  CheckSquare,
  Clock,
  UserCheck,
  CheckCircle,
  XCircle,
  Award,
  Calendar,
  AlertCircle
} from 'lucide-react';

export const AttendanceScreen: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [myHistory, setMyHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Load events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await eventsApi.getAll();
        if (res.success && res.data.length > 0) {
          setEvents(res.data);
          setSelectedEventId(String(res.data[0].id));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchEvents();
  }, []);

  // Fetch Attendance by event
  const fetchAttendance = async () => {
    if (!selectedEventId) return;
    setLoading(true);
    try {
      const res = await attendanceApi.getByEvent(selectedEventId);
      if (res.success) setRecords(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch personal volunteer history
  const fetchMyHistory = async () => {
    if (user?.role === 'volunteer') {
      try {
        const res = await attendanceApi.getMyHistory();
        if (res.success) setMyHistory(res.data);
      } catch (err) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedEventId]);

  useEffect(() => {
    fetchMyHistory();
  }, [user]);

  const handleMarkAttendance = async (
    volunteerId: number,
    status: 'present' | 'absent' | 'late',
    hours: number = 6.0
  ) => {
    if (!selectedEventId) return;
    try {
      const res = await attendanceApi.mark({
        event_id: parseInt(selectedEventId, 10),
        volunteer_id: volunteerId,
        status,
        check_in_time: status === 'absent' ? '—' : '09:00 AM',
        check_out_time: status === 'absent' ? '—' : '03:00 PM',
        hours_served: status === 'absent' ? 0 : hours,
        notes: `Attendance verified by ${user?.name}`
      });
      setActionFeedback(res.message);
      setTimeout(() => setActionFeedback(null), 3000);
      fetchAttendance();
    } catch (err: any) {
      alert(`Attendance mark failed: ${err.message}`);
    }
  };

  const handleGenerateCertificate = async (volunteerId: number) => {
    if (!selectedEventId) return;
    try {
      const res = await certificatesApi.generate(parseInt(selectedEventId, 10), volunteerId);
      setActionFeedback(res.message);
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err: any) {
      alert(`Certificate issue failed: ${err.message}`);
    }
  };

  const canMarkAttendance = ['admin', 'organizer', 'coordinator'].includes(user?.role || '');

  // Calculate statistics
  const totalApproved = records.length;
  const presentCount = records.filter(r => r.attendance_status === 'present' || r.attendance_status === 'late').length;
  const absentCount = records.filter(r => r.attendance_status === 'absent').length;
  const pendingCount = totalApproved - (presentCount + absentCount);
  const attendanceRate = totalApproved > 0 ? Math.round((presentCount / totalApproved) * 100) : 0;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Attendance & Participation Tracking
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Log live check-in timestamps, service hours, and qualify volunteers for certificates.
          </p>
        </div>

        {canMarkAttendance && (
          <div className="w-full md:w-80">
            <select
              value={selectedEventId}
              onChange={e => setSelectedEventId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold shadow-sm outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {actionFeedback && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Coordinator / Admin Attendance View */}
      {canMarkAttendance && (
        <>
          {/* Summary Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Approved Roster</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalApproved}</p>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-xs text-emerald-600 font-medium">Present / Verified</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{presentCount}</p>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-xs text-rose-600 font-medium">Absent</span>
              <p className="text-2xl font-bold text-rose-600 mt-1">{absentCount}</p>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-xs text-indigo-600 font-medium">Attendance Turnout</span>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{attendanceRate}%</p>
            </div>
          </div>

          {/* Roster Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Volunteer Roll Call</h3>
                <p className="text-xs text-slate-500">
                  {events.find(e => String(e.id) === selectedEventId)?.title || 'Current Event'}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-xs text-slate-400">Loading roster...</p>
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-12">
                <CheckSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-semibold">No approved volunteers for this event.</p>
                <p className="text-[11px] text-slate-400">Approve registrations in the Registrations tab first.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-6">Volunteer</th>
                      <th className="py-3.5 px-6">Duty Role</th>
                      <th className="py-3.5 px-6">Attendance Status</th>
                      <th className="py-3.5 px-6">Check-in / Check-out</th>
                      <th className="py-3.5 px-6">Hours Credited</th>
                      <th className="py-3.5 px-6 text-right">Mark Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {records.map(rec => {
                      const isPresent = rec.attendance_status === 'present';
                      const isAbsent = rec.attendance_status === 'absent';
                      const isLate = rec.attendance_status === 'late';

                      return (
                        <tr key={rec.volunteer_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="py-4 px-6">
                            <p className="font-bold text-slate-900 dark:text-white">{rec.volunteer_name}</p>
                            <p className="text-[11px] text-slate-500">{rec.volunteer_email}</p>
                          </td>

                          <td className="py-4 px-6">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {rec.assigned_duty_name || 'General Operations'}
                            </span>
                          </td>

                          <td className="py-4 px-6">
                            {rec.attendance_status ? (
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] uppercase font-bold border ${
                                isPresent
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                  : isLate
                                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                                  : 'bg-rose-100 text-rose-800 border-rose-200'
                              }`}>
                                {rec.attendance_status}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Pending Mark</span>
                            )}
                          </td>

                          <td className="py-4 px-6 text-slate-600 dark:text-slate-400">
                            {rec.check_in_time && rec.check_out_time ? (
                              <span>{rec.check_in_time} – {rec.check_out_time}</span>
                            ) : (
                              '—'
                            )}
                          </td>

                          <td className="py-4 px-6">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {rec.hours_served || 0} hrs
                            </span>
                          </td>

                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleMarkAttendance(rec.volunteer_id, 'present', 6.0)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                                  isPresent
                                    ? 'bg-emerald-700 text-white ring-2 ring-emerald-500'
                                    : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                }`}
                              >
                                Present
                              </button>
                              <button
                                onClick={() => handleMarkAttendance(rec.volunteer_id, 'late', 4.5)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                                  isLate
                                    ? 'bg-amber-700 text-white ring-2 ring-amber-500'
                                    : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                }`}
                              >
                                Late
                              </button>
                              <button
                                onClick={() => handleMarkAttendance(rec.volunteer_id, 'absent', 0)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                                  isAbsent
                                    ? 'bg-rose-700 text-white ring-2 ring-rose-500'
                                    : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                                }`}
                              >
                                Absent
                              </button>
                              {isPresent && (
                                <button
                                  onClick={() => handleGenerateCertificate(rec.volunteer_id)}
                                  className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 text-[11px] font-semibold flex items-center gap-1.5 shrink-0"
                                  title="Issue Certificate"
                                >
                                  <Award className="w-3.5 h-3.5 shrink-0" />
                                  <span>Issue Cert</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Volunteer Personal Attendance History */}
      {user?.role === 'volunteer' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">My Attendance Log</h3>
            <p className="text-xs text-slate-500">Your verified community participation hours</p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {myHistory.length === 0 ? (
              <p className="p-8 text-center text-xs text-slate-400">No attendance records logged yet.</p>
            ) : (
              myHistory.map(h => (
                <div key={h.id} className="p-5 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{h.event_title}</h4>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                      <span>Date: {h.start_date}</span>
                      <span>Venue: {h.venue}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {h.status}
                    </span>
                    <p className="text-xs font-bold text-indigo-600 mt-1">{h.hours_served} Service Hours</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
