import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { eventsApi, registrationsApi, usersApi } from '../../services/api';
import { EventItem, EventCategory, EventDuty } from '../../types';
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Search,
  Filter,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
  Edit3,
  ExternalLink,
  Tag
} from 'lucide-react';

export const EventsScreen: React.FC<{ onSelectEvent?: (eventId: number) => void }> = ({ onSelectEvent }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [coordinators, setCoordinators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modal Create/Edit
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: 1,
    coordinator_id: '',
    venue: '',
    start_date: '',
    end_date: '',
    start_time: '09:00',
    end_time: '17:00',
    capacity: 60,
    required_volunteers: 20,
    image_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800',
  });

  // Volunteer Registration Modal State
  const [registerModalEvent, setRegisterModalEvent] = useState<EventItem | null>(null);
  const [regData, setRegData] = useState({
    preferred_duty_id: '',
    availability_note: 'Available for full schedule and eager to contribute!',
    contact_phone: user?.phone || ''
  });
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regFeedback, setRegFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const [eventsRes, catsRes] = await Promise.all([
        eventsApi.getAll({
          search: search || undefined,
          category: selectedCategory || undefined,
          status: selectedStatus || undefined
        }),
        eventsApi.getCategories()
      ]);

      if (eventsRes.success) setEvents(eventsRes.data);
      if (catsRes.success) setCategories(catsRes.data);

      if (user?.role === 'admin' || user?.role === 'organizer') {
        const coordRes = await usersApi.getByRole('coordinator');
        if (coordRes.success) setCoordinators(coordRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [search, selectedCategory, selectedStatus]);

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEvent) {
        await eventsApi.update(editingEvent.id, formData);
      } else {
        await eventsApi.create(formData);
      }
      setShowModal(false);
      setEditingEvent(null);
      fetchEvents();
    } catch (err: any) {
      alert(`Error saving event: ${err.message}`);
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (!confirm('Are you sure you want to delete this event? This will also remove registrations.')) return;
    try {
      await eventsApi.delete(id);
      fetchEvents();
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await eventsApi.updateStatus(id, status);
      fetchEvents();
    } catch (err: any) {
      alert(`Failed to change status: ${err.message}`);
    }
  };

  const handleRegisterVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerModalEvent) return;
    setRegSubmitting(true);
    setRegFeedback(null);

    try {
      const res = await registrationsApi.register({
        event_id: registerModalEvent.id,
        preferred_duty_id: regData.preferred_duty_id ? parseInt(regData.preferred_duty_id, 10) : undefined,
        availability_note: regData.availability_note,
        contact_phone: regData.contact_phone
      });

      setRegFeedback({
        type: 'success',
        message: res.message || 'Registration submitted successfully!'
      });
      fetchEvents();
      setTimeout(() => {
        setRegisterModalEvent(null);
        setRegFeedback(null);
      }, 1800);
    } catch (err: any) {
      setRegFeedback({
        type: 'error',
        message: err.message || 'Registration failed.'
      });
    } finally {
      setRegSubmitting(false);
    }
  };

  const canManageEvents = user?.role === 'admin' || user?.role === 'organizer';

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header with Search and Create button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Community Events Hub</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Browse upcoming service initiatives, register as a volunteer, or manage event allocations.
          </p>
        </div>

        {canManageEvents && (
          <button
            onClick={() => {
              setEditingEvent(null);
              setFormData({
                title: '',
                description: '',
                category_id: categories[0]?.id || 1,
                coordinator_id: '',
                venue: '',
                start_date: new Date().toISOString().split('T')[0],
                end_date: new Date().toISOString().split('T')[0],
                start_time: '09:00',
                end_time: '17:00',
                capacity: 60,
                required_volunteers: 20,
                image_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800'
              });
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Event</span>
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search events by title, venue..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="approved">Approved & Active</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Event Cards Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-400">Loading events catalog...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">No events found</h3>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => {
            const isFull = (event.approved_volunteers_count || 0) >= event.capacity;
            const statusColors: Record<string, string> = {
              approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200',
              pending_approval: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200',
              completed: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200',
              rejected: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200',
              cancelled: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300'
            };

            return (
              <div
                key={event.id}
                className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Image Container */}
                  <div className="relative h-44 overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={event.image_url || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800'}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                    {/* Status Pill */}
                    <span className={`absolute top-3 right-3 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border shadow-sm ${statusColors[event.status] || ''}`}>
                      {event.status.replace('_', ' ')}
                    </span>

                    {/* Category */}
                    <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-medium">
                      <Tag className="w-3 h-3 text-teal-400" />
                      {event.category_name || 'Community Outreach'}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-5">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {event.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>

                    <div className="mt-4 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>{new Date(event.start_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span>•</span>
                        <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>{event.start_time} - {event.end_time}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                        <span className="truncate">{event.venue}</span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[11px] text-slate-500">
                          Capacity: <strong>{event.approved_volunteers_count || 0}</strong> / {event.capacity}
                        </span>
                        <span className={`text-[10px] font-bold ${isFull ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {isFull ? 'CAPACITY FULL' : 'SPOTS AVAILABLE'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-4 bg-slate-50/70 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  {/* Volunteer Register Button */}
                  {user?.role === 'volunteer' && (
                    <button
                      onClick={async () => {
                        const detailRes = await eventsApi.getById(event.id);
                        setRegisterModalEvent(detailRes.data);
                      }}
                      disabled={event.status === 'completed' || event.status === 'rejected'}
                      className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-all disabled:opacity-50"
                    >
                      {isFull ? 'Join Waitlist' : 'Register as Volunteer'}
                    </button>
                  )}

                  {/* Admin Approval Controls */}
                  {user?.role === 'admin' && event.status === 'pending_approval' && (
                    <div className="flex items-center gap-2 w-full">
                      <button
                        onClick={() => handleUpdateStatus(event.id, 'approved')}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(event.id, 'rejected')}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {/* Organizer / Admin Edit & Delete buttons */}
                  {canManageEvents && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingEvent(event);
                          setFormData({
                            title: event.title,
                            description: event.description,
                            category_id: event.category_id,
                            coordinator_id: event.coordinator_id ? String(event.coordinator_id) : '',
                            venue: event.venue,
                            start_date: event.start_date,
                            end_date: event.end_date,
                            start_time: event.start_time,
                            end_time: event.end_time,
                            capacity: event.capacity,
                            required_volunteers: event.required_volunteers,
                            image_url: event.image_url || ''
                          });
                          setShowModal(true);
                        }}
                        className="p-2 text-slate-600 hover:text-indigo-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                        title="Edit Event"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-2 text-slate-600 hover:text-rose-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                        title="Delete Event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create/Edit Event */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
              {editingEvent ? 'Edit Community Event' : 'Create Community Event'}
            </h2>
            <p className="text-xs text-slate-500 mb-6">SR University Event Management Workflow</p>

            <form onSubmit={handleSaveEvent} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Campus Clean-up & Tree Plantation 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Detailed Description *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Explain event objectives, itinerary, and volunteer expectations..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={formData.category_id}
                    onChange={e => setFormData({ ...formData, category_id: parseInt(e.target.value, 10) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Assigned Coordinator</label>
                  <select
                    value={formData.coordinator_id}
                    onChange={e => setFormData({ ...formData, coordinator_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Coordinator (Optional)</option>
                    {coordinators.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Venue / Campus Location *</label>
                  <input
                    type="text"
                    required
                    value={formData.venue}
                    onChange={e => setFormData({ ...formData, venue: e.target.value })}
                    placeholder="e.g. Botanical Gardens, Block-D"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Image URL</label>
                  <input
                    type="text"
                    value={formData.image_url}
                    onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">End Time</label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Max Volunteer Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value, 10) || 50 })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Required Volunteers</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.required_volunteers}
                    onChange={e => setFormData({ ...formData, required_volunteers: parseInt(e.target.value, 10) || 20 })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-600/30"
                >
                  {editingEvent ? 'Save Changes' : 'Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Volunteer Register Form */}
      {registerModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Register for {registerModalEvent.title}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Date: {registerModalEvent.start_date} • Venue: {registerModalEvent.venue}
            </p>

            {regFeedback && (
              <div className={`p-3 rounded-xl text-xs mb-4 ${
                regFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {regFeedback.message}
              </div>
            )}

            <form onSubmit={handleRegisterVolunteer} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Preferred Volunteer Duty / Team
                </label>
                <select
                  value={regData.preferred_duty_id}
                  onChange={e => setRegData({ ...regData, preferred_duty_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">No preference / Assign where needed</option>
                  {registerModalEvent.duties?.map(d => (
                    <option key={d.id} value={d.id}>{d.name} (Need: {d.required_count})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={regData.contact_phone}
                  onChange={e => setRegData({ ...regData, contact_phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Availability Note & Relevant Experience
                </label>
                <textarea
                  rows={3}
                  value={regData.availability_note}
                  onChange={e => setRegData({ ...regData, availability_note: e.target.value })}
                  placeholder="Specify available shifts or prior experience..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setRegisterModalEvent(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={regSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-600/30 disabled:opacity-50"
                >
                  {regSubmitting ? 'Submitting...' : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
