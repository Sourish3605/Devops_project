import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dutiesApi, eventsApi, registrationsApi } from '../../services/api';
import { VolunteerAllocation, EventDuty, EventItem } from '../../types';
import {
  Users,
  Shield,
  Plus,
  Trash2,
  Calendar,
  CheckCircle,
  AlertCircle,
  Briefcase,
  UserCheck
} from 'lucide-react';

export const DutyAllocationScreen: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [duties, setDuties] = useState<EventDuty[]>([]);
  const [allocations, setAllocations] = useState<VolunteerAllocation[]>([]);
  const [approvedVolunteers, setApprovedVolunteers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // New Duty Form
  const [newDutyName, setNewDutyName] = useState('');
  const [newDutyCount, setNewDutyCount] = useState(5);
  const [newDutyDesc, setNewDutyDesc] = useState('');

  // Assign form
  const [assignVolunteerId, setAssignVolunteerId] = useState('');
  const [assignDutyId, setAssignDutyId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

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

  // Load duties, allocations, and approved volunteers for selected event
  const fetchEventData = async () => {
    if (!selectedEventId) return;
    setLoading(true);
    try {
      const [dutiesRes, allocRes, regRes] = await Promise.all([
        dutiesApi.getByEvent(selectedEventId),
        dutiesApi.getAllocations({ event_id: selectedEventId }),
        registrationsApi.getAll({ event_id: selectedEventId, status: 'approved' })
      ]);

      if (dutiesRes.success) setDuties(dutiesRes.data);
      if (allocRes.success) setAllocations(allocRes.data);
      if (regRes.success) setApprovedVolunteers(regRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventData();
  }, [selectedEventId]);

  const handleCreateDuty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDutyName || !selectedEventId) return;
    try {
      await dutiesApi.create(selectedEventId, {
        name: newDutyName,
        description: newDutyDesc,
        required_count: newDutyCount
      });
      setNewDutyName('');
      setNewDutyDesc('');
      fetchEventData();
      setFeedback('New duty role created!');
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      alert(`Failed to create duty: ${err.message}`);
    }
  };

  const handleAssignVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !assignVolunteerId || !assignDutyId) return;
    try {
      await dutiesApi.assign({
        event_id: parseInt(selectedEventId, 10),
        volunteer_id: parseInt(assignVolunteerId, 10),
        duty_id: parseInt(assignDutyId, 10),
        notes: assignNotes
      });
      setAssignVolunteerId('');
      setAssignNotes('');
      fetchEventData();
      setFeedback('Volunteer assigned to duty team successfully!');
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      alert(`Assignment failed: ${err.message}`);
    }
  };

  const handleDeleteAllocation = async (id: number) => {
    if (!confirm('Remove this duty allocation?')) return;
    try {
      await dutiesApi.deleteAllocation(id);
      fetchEventData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Volunteer Duty Allocation
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Map approved volunteers to specialized task stations and track team quotas.
          </p>
        </div>

        {/* Event Selector */}
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
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Grid: Duty Management & Allocation Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Form 1: Assign Volunteer */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
            <UserCheck className="w-4 h-4" />
            <span>Allocate Volunteer to Duty</span>
          </div>

          <form onSubmit={handleAssignVolunteer} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Approved Volunteer</label>
              <select
                required
                value={assignVolunteerId}
                onChange={e => setAssignVolunteerId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">Choose volunteer...</option>
                {approvedVolunteers.map(v => (
                  <option key={v.volunteer_id} value={v.volunteer_id}>
                    {v.volunteer_name} ({v.volunteer_email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Assign Duty Team</label>
              <select
                required
                value={assignDutyId}
                onChange={e => setAssignDutyId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">Select duty station...</option>
                {duties.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} (Assigned: {d.assigned_count || 0}/{d.required_count})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Coordinator Notes</label>
              <input
                type="text"
                value={assignNotes}
                onChange={e => setAssignNotes(e.target.value)}
                placeholder="e.g. Lead morning desk shift"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all"
            >
              Confirm Duty Assignment
            </button>
          </form>
        </div>

        {/* Left Form 2: Create New Duty Station */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-teal-600 font-bold text-sm">
            <Briefcase className="w-4 h-4" />
            <span>Add Event Duty Role</span>
          </div>

          <form onSubmit={handleCreateDuty} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Role Name</label>
              <input
                type="text"
                required
                value={newDutyName}
                onChange={e => setNewDutyName(e.target.value)}
                placeholder="e.g. Medical First Aid Station"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Volunteers Required</label>
              <input
                type="number"
                min="1"
                required
                value={newDutyCount}
                onChange={e => setNewDutyCount(parseInt(e.target.value, 10) || 5)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
              <input
                type="text"
                value={newDutyDesc}
                onChange={e => setNewDutyDesc(e.target.value)}
                placeholder="Responsibility details..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md shadow-teal-600/30 transition-all"
            >
              Add Duty to Event
            </button>
          </form>
        </div>

        {/* Duties Quotas Summary Card */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Active Duties & Quotas</h3>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {duties.length === 0 ? (
              <p className="text-xs text-slate-400">No duties created yet for this event.</p>
            ) : (
              duties.map(d => {
                const assigned = d.assigned_count || 0;
                const pct = Math.min(100, Math.round((assigned / d.required_count) * 100));
                return (
                  <div key={d.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{d.name}</span>
                      <span className="text-[11px] font-bold text-indigo-600">{assigned} / {d.required_count}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Allocations Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Confirmed Duty Allocations</h3>
            <p className="text-xs text-slate-500">Live roster for {events.find(e => String(e.id) === selectedEventId)?.title || 'Current Event'}</p>
          </div>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
            {allocations.length} Volunteers Allocated
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-400">Loading duty assignments...</p>
          </div>
        ) : allocations.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-semibold">No volunteers allocated yet for this event.</p>
            <p className="text-[11px] text-slate-400">Use the form above to assign approved volunteers.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Volunteer</th>
                  <th className="py-3.5 px-6">Assigned Duty</th>
                  <th className="py-3.5 px-6">Volunteer Skills</th>
                  <th className="py-3.5 px-6">Assigned By</th>
                  <th className="py-3.5 px-6">Notes</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {allocations.map(alloc => (
                  <tr key={alloc.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-6">
                      <p className="font-bold text-slate-900 dark:text-white">{alloc.volunteer_name}</p>
                      <p className="text-[11px] text-slate-500">{alloc.volunteer_email}</p>
                    </td>

                    <td className="py-3.5 px-6">
                      <span className="inline-block px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800 text-[11px]">
                        {alloc.duty_name}
                      </span>
                    </td>

                    <td className="py-3.5 px-6 text-slate-600 dark:text-slate-400">
                      {alloc.volunteer_skills || 'General Support'}
                    </td>

                    <td className="py-3.5 px-6 text-slate-600 dark:text-slate-400">
                      {alloc.assigned_by_name || 'Coordinator'}
                    </td>

                    <td className="py-3.5 px-6 text-slate-500 italic max-w-xs truncate">
                      {alloc.notes || '—'}
                    </td>

                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => handleDeleteAllocation(alloc.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                        title="Remove allocation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
