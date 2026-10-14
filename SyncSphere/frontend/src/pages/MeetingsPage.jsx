import React, { useState, useEffect } from 'react';
import { 
  Video, 
  Plus, 
  Calendar, 
  Clock, 
  Users, 
  XCircle, 
  CheckCircle2, 
  AlertCircle,
  Layers 
} from 'lucide-react';
import meetingApi from '../services/meetingApi';
import teamApi from '../services/teamApi';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

const MeetingsPage = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Meeting Creation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [description, setDescription] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Initial Load: Fetch User Teams
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
        setError(err.response?.data?.message || 'Failed to retrieve teams.');
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  // 2. Fetch Meetings & Members whenever selectedTeamId changes
  const fetchMeetingsForTeam = async (teamId) => {
    if (!teamId) return;
    try {
      setLoading(true);
      setError('');

      const [meetingsRes, teamRes] = await Promise.all([
        meetingApi.getMeetings(teamId),
        teamApi.getTeamById(teamId),
      ]);

      setMeetings(meetingsRes.data.meetings || []);
      setTeamMembers(teamRes.data.team?.members || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load team meetings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTeamId) {
      fetchMeetingsForTeam(selectedTeamId);
    }
  }, [selectedTeamId]);

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    if (!title.trim() || !dateTime || !selectedTeamId) return;

    setIsSubmitting(true);
    setError('');
    try {
      await meetingApi.createMeeting({
        teamId: selectedTeamId,
        title: title.trim(),
        description: description.trim(),
        dateTime,
        durationMinutes: parseInt(durationMinutes, 10),
        participantUserIds: selectedParticipants,
      });

      setTitle('');
      setDescription('');
      setDateTime('');
      setDurationMinutes(60);
      setSelectedParticipants([]);
      setIsModalOpen(false);
      setSuccess('Meeting scheduled and participants notified.');
      await fetchMeetingsForTeam(selectedTeamId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule meeting.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelMeeting = async (meetingId) => {
    if (!window.confirm('Are you sure you want to cancel this meeting? Participants will be notified.')) return;
    try {
      await meetingApi.cancelMeeting(meetingId);
      setSuccess('Meeting cancelled.');
      await fetchMeetingsForTeam(selectedTeamId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel meeting.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team Meetings</h1>
          <p className="text-sm text-slate-500 mt-1">
            Coordinate synchronous sessions, agenda details, participant tracking, and shared calendar sync.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Team Switcher */}
          {teams.length > 0 && (
            <div className="flex items-center space-x-2">
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

          <button
            onClick={() => setIsModalOpen(true)}
            disabled={!selectedTeamId}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors shadow-2xs disabled:opacity-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Schedule Meeting
          </button>
        </div>
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

      {/* Meetings List */}
      {teams.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No Teams Established"
          description="Create or join a team to organize meetings."
          actionLabel="Go to Teams"
          onAction={() => (window.location.href = '/teams')}
        />
      ) : loading ? (
        <LoadingSpinner size="lg" text="Loading team meetings from PostgreSQL..." />
      ) : meetings.length === 0 ? (
        <EmptyState
          icon={Video}
          title="No meetings scheduled"
          description="Schedule a team meeting to align on milestones and coordinate deliverables."
          actionLabel="Schedule Meeting"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {meetings.map((m) => {
            const isOrganizer = m.organizerId === user?.id || user?.role === 'ADMIN';
            const isPast = new Date(m.dateTime).getTime() + m.durationMinutes * 60000 < Date.now();
            return (
              <div
                key={m.id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        isPast
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}
                    >
                      {isPast ? 'Concluded' : 'Scheduled'}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-medium text-slate-500">
                      Organized by {m.organizer?.fullName}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{m.title}</h3>
                  {m.description && (
                    <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                      {m.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                    <span className="flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {new Date(m.dateTime).toLocaleDateString()}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {new Date(m.dateTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      ({m.durationMinutes} min)
                    </span>
                    <span className="flex items-center">
                      <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {m.participants?.length || 0} participant
                      {m.participants?.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Attendees Chips */}
                  {m.participants?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {m.participants.map((p) => (
                        <span
                          key={p.id}
                          className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700"
                        >
                          {p.user?.fullName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {isOrganizer && !isPast && (
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => handleCancelMeeting(m.id)}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors flex items-center"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Cancel Meeting
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Meeting Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Team Meeting"
      >
        <form onSubmit={handleCreateMeeting} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Meeting Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Sprint Planning & Milestone Review"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Date & Time
            </label>
            <input
              type="datetime-local"
              required
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Duration (Minutes)
            </label>
            <input
              type="number"
              min="15"
              step="15"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Agenda & Notes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key topics to discuss..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Participant Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Team Attendees
            </label>
            {teamMembers.length === 0 ? (
              <p className="text-xs text-slate-400">No members in this team.</p>
            ) : (
              <div className="max-h-32 overflow-y-auto space-y-1.5 border border-slate-200 rounded-lg p-2.5 bg-slate-50">
                {teamMembers.map((m) => {
                  const isChecked = selectedParticipants.includes(m.user.id);
                  return (
                    <label
                      key={m.id}
                      className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedParticipants([...selectedParticipants, m.user.id]);
                          } else {
                            setSelectedParticipants(
                              selectedParticipants.filter((id) => id !== m.user.id)
                            );
                          }
                        }}
                        className="rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                      />
                      <span>{m.user.fullName} ({m.user.email})</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

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
              {isSubmitting ? 'Scheduling...' : 'Schedule Meeting'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MeetingsPage;
