import React, { useState, useEffect } from 'react';
import { reportsApi, eventsApi } from '../../services/api';
import {
  FileBarChart,
  Download,
  Printer,
  Calendar,
  Filter,
  Users,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const ReportsScreen: React.FC = () => {
  const [activeReport, setActiveReport] = useState<'participation' | 'allocation' | 'attendance' | 'completion'>('participation');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [filterEventId, setFilterEventId] = useState('');

  // Load events for filter
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await eventsApi.getAll();
        if (res.success) setEvents(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchEvents();
  }, []);

  // Fetch report data
  const fetchReport = async () => {
    setLoading(true);
    try {
      let res;
      if (activeReport === 'participation') {
        res = await reportsApi.getEventParticipation({ event_id: filterEventId || undefined });
      } else if (activeReport === 'allocation') {
        res = await reportsApi.getVolunteerAllocation({ event_id: filterEventId || undefined });
      } else if (activeReport === 'attendance') {
        res = await reportsApi.getAttendanceReport({ event_id: filterEventId || undefined });
      } else {
        res = await reportsApi.getEventCompletion();
      }

      if (res && res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeReport, filterEventId]);

  // Export to CSV
  const exportCSV = () => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers.map(fieldName => JSON.stringify(row[fieldName] ?? '')).join(',')
      )
    ];
    const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CommunityConnect_${activeReport}_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export to PDF
  const exportPDF = () => {
    if (data.length === 0) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`CommunityConnect: ${activeReport.toUpperCase()} REPORT`, 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`SR University • Generated on: ${new Date().toLocaleString()}`, 14, 22);

    let head: string[][] = [];
    let body: any[][] = [];

    if (activeReport === 'participation') {
      head = [['Event Title', 'Category', 'Date', 'Capacity', 'Registrations', 'Approved', 'Turnout']];
      body = data.map(r => [r.event_title, r.category_name, r.start_date, r.capacity, r.total_registrations, r.approved_count, r.attended_count]);
    } else if (activeReport === 'allocation') {
      head = [['Volunteer', 'Event', 'Assigned Duty', 'Coordinator', 'Status']];
      body = data.map(r => [r.volunteer_name, r.event_title, r.assigned_duty, r.coordinator_name, r.allocation_status]);
    } else if (activeReport === 'attendance') {
      head = [['Volunteer', 'Event', 'Status', 'Check-In', 'Check-Out', 'Hours']];
      body = data.map(r => [r.volunteer_name, r.event_title, r.attendance_status, r.check_in_time || '—', r.check_out_time || '—', `${r.hours_served} hrs`]);
    } else {
      head = [['Event Title', 'Date', 'Registrations', 'Present', 'Absent', 'Total Hours']];
      body = data.map(r => [r.event_title, r.start_date, r.total_registrations, r.volunteers_present, r.volunteers_absent, `${r.total_hours_served} hrs`]);
    }

    (doc as any).autoTable({
      head,
      body,
      startY: 28,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [79, 70, 229] }
    });

    doc.save(`CommunityConnect_${activeReport}_Report.pdf`);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Institutional Reports & Analytics Engine
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Realtime database telemetry with CSV, PDF, and Print export capabilities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-50 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={exportPDF}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-50 transition-colors no-print"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* 4 Mandatory Report Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'participation' as const, label: '1. Event Participation Report' },
          { id: 'allocation' as const, label: '2. Volunteer Allocation Report' },
          { id: 'attendance' as const, label: '3. Attendance Report' },
          { id: 'completion' as const, label: '4. Event Completion Report' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id)}
            className={`px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
              activeReport === tab.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Toolbar */}
      {activeReport !== 'completion' && (
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-500">Filter Event:</label>
          <select
            value={filterEventId}
            onChange={e => setFilterEventId(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
          >
            <option value="">All Events</option>
            {events.map(e => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
        </div>
      )}

      {/* Report Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-400">Querying institutional records...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs">
            No records found for this report criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            {activeReport === 'participation' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-3 px-6">Event Title</th>
                    <th className="py-3 px-6">Category</th>
                    <th className="py-3 px-6">Event Date</th>
                    <th className="py-3 px-6">Capacity</th>
                    <th className="py-3 px-6">Registrations</th>
                    <th className="py-3 px-6">Approved</th>
                    <th className="py-3 px-6">Verified Present</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.map(r => (
                    <tr key={r.event_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-6 font-bold text-slate-900 dark:text-white">{r.event_title}</td>
                      <td className="py-3.5 px-6 text-slate-600 dark:text-slate-300">{r.category_name}</td>
                      <td className="py-3.5 px-6 text-slate-500">{r.start_date}</td>
                      <td className="py-3.5 px-6 font-mono">{r.capacity}</td>
                      <td className="py-3.5 px-6 font-mono font-bold text-indigo-600">{r.total_registrations}</td>
                      <td className="py-3.5 px-6 font-mono text-emerald-600 font-bold">{r.approved_count}</td>
                      <td className="py-3.5 px-6 font-mono text-teal-600 font-bold">{r.attended_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeReport === 'allocation' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-3 px-6">Volunteer Name</th>
                    <th className="py-3 px-6">Event Title</th>
                    <th className="py-3 px-6">Assigned Duty</th>
                    <th className="py-3 px-6">Assigned By</th>
                    <th className="py-3 px-6">Allocation Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.map(r => (
                    <tr key={r.allocation_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-6 font-bold text-slate-900 dark:text-white">{r.volunteer_name}</td>
                      <td className="py-3.5 px-6 text-slate-700 dark:text-slate-300">{r.event_title}</td>
                      <td className="py-3.5 px-6 font-semibold text-indigo-600">{r.assigned_duty}</td>
                      <td className="py-3.5 px-6 text-slate-500">{r.coordinator_name}</td>
                      <td className="py-3.5 px-6">
                        <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-emerald-100 text-emerald-800">
                          {r.allocation_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeReport === 'attendance' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-3 px-6">Volunteer Name</th>
                    <th className="py-3 px-6">Event Title</th>
                    <th className="py-3 px-6">Duty Role</th>
                    <th className="py-3 px-6">Attendance Status</th>
                    <th className="py-3 px-6">Check-in / Check-out</th>
                    <th className="py-3 px-6">Hours Credited</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.map(r => (
                    <tr key={r.attendance_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-6 font-bold text-slate-900 dark:text-white">{r.volunteer_name}</td>
                      <td className="py-3.5 px-6 text-slate-700 dark:text-slate-300">{r.event_title}</td>
                      <td className="py-3.5 px-6">{r.duty_name || 'General Support'}</td>
                      <td className="py-3.5 px-6">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                          r.attendance_status === 'present'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {r.attendance_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-slate-500">{r.check_in_time} – {r.check_out_time}</td>
                      <td className="py-3.5 px-6 font-bold text-indigo-600">{r.hours_served} hrs</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeReport === 'completion' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-3 px-6">Event Details</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6">Total Regs</th>
                    <th className="py-3 px-6">Present</th>
                    <th className="py-3 px-6">Absent</th>
                    <th className="py-3 px-6">Cumulative Service Hours</th>
                    <th className="py-3 px-6">Outcomes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.map(r => (
                    <tr key={r.event_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-6">
                        <p className="font-bold text-slate-900 dark:text-white">{r.event_title}</p>
                        <p className="text-[11px] text-slate-500">{r.start_date} • {r.venue}</p>
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-indigo-100 text-indigo-800">
                          {r.event_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 font-mono font-bold text-slate-700 dark:text-slate-300">{r.total_registrations}</td>
                      <td className="py-3.5 px-6 font-mono font-bold text-emerald-600">{r.volunteers_present}</td>
                      <td className="py-3.5 px-6 font-mono text-rose-600">{r.volunteers_absent}</td>
                      <td className="py-3.5 px-6 font-bold text-indigo-600">{r.total_hours_served} hrs</td>
                      <td className="py-3.5 px-6 text-slate-600 dark:text-slate-400 max-w-xs truncate">{r.outcomes || 'Impact objectives accomplished.'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
