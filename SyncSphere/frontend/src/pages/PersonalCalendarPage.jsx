import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Clock, 
  Repeat, 
  Trash2, 
  Users, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import calendarApi from '../services/calendarApi';
import teamApi from '../services/teamApi';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';

const PersonalCalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Event Creation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState('WEEKLY');
  const [shareWithTeamId, setShareWithTeamId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Event Detail Modal State
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchEventsAndTeams = async () => {
    try {
      setLoading(true);
      setError('');

      const [eventsRes, teamsRes] = await Promise.all([
        calendarApi.getPersonalEvents(),
        teamApi.getMyTeams(),
      ]);

      const rawEvents = eventsRes.data.events || [];
      const formatted = rawEvents.map((e) => ({
        id: String(e.id),
        title: e.recurring ? `[Recurring] ${e.title}` : e.title,
        start: e.date,
        end: e.endDate || undefined,
        backgroundColor: '#0e8ce9',
        borderColor: '#026fc7',
        extendedProps: {
          rawTitle: e.title,
          description: e.description,
          recurring: e.recurring,
          recurrenceRule: e.recurrenceRule,
        },
      }));

      setEvents(formatted);
      setTeams(teamsRes.data.teams || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load personal calendar events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventsAndTeams();
  }, []);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    setIsSubmitting(true);
    setError('');
    try {
      await calendarApi.createPersonalEvent({
        title: title.trim(),
        description: description.trim(),
        date,
        endDate: endDate || null,
        recurring,
        recurrenceRule: recurring ? recurrenceRule : null,
        shareWithTeamId: shareWithTeamId || null,
      });

      setTitle('');
      setDescription('');
      setDate('');
      setEndDate('');
      setRecurring(false);
      setShareWithTeamId('');
      setIsModalOpen(false);
      setSuccess('Event scheduled and persisted.');
      await fetchEventsAndTeams();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateSelect = (selectInfo) => {
    const startIso = selectInfo.startStr.includes('T')
      ? selectInfo.startStr.slice(0, 16)
      : selectInfo.startStr + 'T09:00';
    setDate(startIso);
    setIsModalOpen(true);
  };

  const handleEventClick = (clickInfo) => {
    setSelectedEvent(clickInfo.event);
    setIsDetailOpen(true);
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    if (!window.confirm('Delete this event from your calendar?')) return;
    try {
      await calendarApi.deletePersonalEvent(selectedEvent.id);
      setIsDetailOpen(false);
      setSelectedEvent(null);
      setSuccess('Event removed.');
      await fetchEventsAndTeams();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete event.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Personal Schedule</h1>
          <p className="text-sm text-slate-500 mt-1">
            Organize personal events, recurring routines, and individual time blocks with daily, weekly, and monthly views.
          </p>
        </div>
        <button
          onClick={() => {
            const nowIso = new Date().toISOString().slice(0, 16);
            setDate(nowIso);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors shadow-2xs"
        >
          <Plus className="w-4 h-4 mr-2" />
          Schedule Event
        </button>
      </div>

      {/* Alerts */}
      {success && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 flex items-center justify-between">
          <span className="flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {success}
          </span>
          <button onClick={() => setSuccess('')} className="text-emerald-800 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center justify-between">
          <span className="flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            {error}
          </span>
          <button onClick={() => setError('')} className="text-red-800 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* FullCalendar Container */}
      {loading ? (
        <LoadingSpinner size="lg" text="Loading schedule..." />
      ) : (
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            events={events}
            select={handleDateSelect}
            eventClick={handleEventClick}
            height="auto"
          />
        </div>
      )}

      {/* Schedule Event Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Personal Event"
      >
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Event Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Code Review & Architecture Sync"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Session notes or agenda..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                End Date & Time
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Recurring Option */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={recurring}
                onChange={(e) => setRecurring(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
              />
              <span className="text-sm font-medium text-slate-700 flex items-center">
                <Repeat className="w-4 h-4 mr-1 text-slate-500" />
                Recurring Event
              </span>
            </label>

            {recurring && (
              <div className="mt-3">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Recurrence Frequency
                </label>
                <select
                  value={recurrenceRule}
                  onChange={(e) => setRecurrenceRule(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>
            )}
          </div>

          {/* Share on Shared Team Calendar option */}
          {teams.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Share on Team Calendar (Optional)
              </label>
              <select
                value={shareWithTeamId}
                onChange={(e) => setShareWithTeamId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Keep Private (Personal Only)</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    Share with {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Event'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Event Details / Delete Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedEvent?.extendedProps?.rawTitle || selectedEvent?.title || 'Event Details'}
      >
        <div className="space-y-4">
          {selectedEvent?.extendedProps?.description && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Description
              </p>
              <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                {selectedEvent.extendedProps.description}
              </p>
            </div>
          )}

          <div className="text-xs text-slate-600 space-y-1">
            <p className="flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              Start: {selectedEvent?.start ? new Date(selectedEvent.start).toLocaleString() : 'N/A'}
            </p>
            {selectedEvent?.end && (
              <p className="flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                End: {new Date(selectedEvent.end).toLocaleString()}
              </p>
            )}
            {selectedEvent?.extendedProps?.recurring && (
              <p className="flex items-center text-brand-600 font-semibold">
                <Repeat className="w-3.5 h-3.5 mr-1.5" />
                Repeats {selectedEvent.extendedProps.recurrenceRule?.toLowerCase()}
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-between">
            <button
              type="button"
              onClick={handleDeleteEvent}
              className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Delete Event
            </button>
            <button
              type="button"
              onClick={() => setIsDetailOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PersonalCalendarPage;
