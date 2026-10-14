import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { 
  CalendarDays, 
  Video, 
  AlertCircle, 
  Flag, 
  Users, 
  Filter, 
  Layers, 
  Clock, 
  CheckCircle2 
} from 'lucide-react';
import calendarApi from '../services/calendarApi';
import teamApi from '../services/teamApi';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

const SharedCalendarPage = () => {
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [allEvents, setAllEvents] = useState([]);
  const [filterType, setFilterType] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Event Inspection Modal
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // 1. Fetch user teams on mount
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await teamApi.getMyTeams();
        const list = res.data.teams || [];
        setTeams(list);
        if (list.length > 0) {
          setSelectedTeamId(String(list[0].id));
        } else {
          setLoading(false);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load teams.');
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  // 2. Fetch shared calendar events whenever selectedTeamId changes
  const fetchSharedEvents = async (teamId) => {
    if (!teamId) return;
    try {
      setLoading(true);
      setError('');
      const res = await calendarApi.getSharedCalendarEvents(teamId);
      setAllEvents(res.data.events || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load team shared calendar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTeamId) {
      fetchSharedEvents(selectedTeamId);
    }
  }, [selectedTeamId]);

  const filteredEvents =
    filterType === 'ALL'
      ? allEvents
      : allEvents.filter((e) => e.category === filterType);

  const handleEventClick = (clickInfo) => {
    setSelectedEvent(clickInfo.event);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Shared Team Calendar</h1>
          <p className="text-sm text-slate-500 mt-1">
            Aggregated workspace schedules, collaborative meetings, project milestones, and task deadlines.
          </p>
        </div>

        {/* Team Selector & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {teams.length > 0 && (
            <div className="flex items-center space-x-2 mr-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:inline">
                Team:
              </span>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filter Pills */}
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'ALL'
                ? 'bg-slate-800 text-white'
                : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            All ({allEvents.length})
          </button>
          <button
            onClick={() => setFilterType('MEETING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center ${
              filterType === 'MEETING'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-50'
            }`}
          >
            <Video className="w-3.5 h-3.5 mr-1" />
            Meetings
          </button>
          <button
            onClick={() => setFilterType('TASK_DEADLINE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center ${
              filterType === 'TASK_DEADLINE'
                ? 'bg-rose-600 text-white'
                : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 mr-1" />
            Deadlines
          </button>
          <button
            onClick={() => setFilterType('MILESTONE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center ${
              filterType === 'MILESTONE'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            <Flag className="w-3.5 h-3.5 mr-1" />
            Milestones
          </button>
          <button
            onClick={() => setFilterType('TEAM_EVENT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center ${
              filterType === 'TEAM_EVENT'
                ? 'bg-brand-600 text-white'
                : 'bg-white text-brand-700 border border-brand-200 hover:bg-brand-50'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 mr-1" />
            Events
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* Main Calendar View */}
      {teams.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No Teams Established"
          description="Create or join a team to view its aggregated shared calendar."
          actionLabel="Go to Teams"
          onAction={() => (window.location.href = '/teams')}
        />
      ) : loading ? (
        <LoadingSpinner size="lg" text="Aggregating shared team calendar..." />
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
            editable={false}
            dayMaxEvents={true}
            events={filteredEvents}
            eventClick={handleEventClick}
            height="auto"
          />
        </div>
      )}

      {/* Event Inspection Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedEvent?.title || 'Calendar Entry Details'}
      >
        <div className="space-y-4">
          <div className="text-xs text-slate-600 space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-semibold text-slate-500 uppercase tracking-wider">
                Category:
              </span>
              <span className="font-bold text-slate-800">
                {selectedEvent?.extendedProps?.category?.replace('_', ' ') || 'CALENDAR ENTRY'}
              </span>
            </div>

            <p className="flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              Date: {selectedEvent?.start ? new Date(selectedEvent.start).toLocaleString() : 'N/A'}
            </p>

            {selectedEvent?.extendedProps?.projectTitle && (
              <p>
                <span className="font-semibold text-slate-500">Project:</span>{' '}
                {selectedEvent.extendedProps.projectTitle}
              </p>
            )}

            {selectedEvent?.extendedProps?.organizer && (
              <p>
                <span className="font-semibold text-slate-500">Organizer:</span>{' '}
                {selectedEvent.extendedProps.organizer}
              </p>
            )}

            {selectedEvent?.extendedProps?.creator && (
              <p>
                <span className="font-semibold text-slate-500">Scheduled by:</span>{' '}
                {selectedEvent.extendedProps.creator}
              </p>
            )}

            {selectedEvent?.extendedProps?.description && (
              <div>
                <span className="font-semibold text-slate-500">Description:</span>
                <p className="mt-1 p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-slate-700 leading-relaxed">
                  {selectedEvent.extendedProps.description}
                </p>
              </div>
            )}

            {selectedEvent?.extendedProps?.attendees?.length > 0 && (
              <div>
                <span className="font-semibold text-slate-500">Attendees:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedEvent.extendedProps.attendees.map((name, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-semibold"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedEvent?.extendedProps?.assignees?.length > 0 && (
              <div>
                <span className="font-semibold text-slate-500">Task Assignees:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedEvent.extendedProps.assignees.map((name, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-semibold"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
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

export default SharedCalendarPage;
