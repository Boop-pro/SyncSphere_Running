import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  UserPlus, 
  Shield, 
  Trash2, 
  UserX, 
  CheckCircle2, 
  AlertCircle,
  Briefcase
} from 'lucide-react';
import teamApi from '../services/teamApi';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';

const TeamsPage = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create Team modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manage Members modal state
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamDetails, setTeamDetails] = useState(null);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('TEAM_MEMBER');
  const [memberActionError, setMemberActionError] = useState('');

  const fetchTeams = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await teamApi.getMyTeams();
      setTeams(res.data.teams || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve your teams.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    setIsSubmitting(true);
    setError('');
    try {
      await teamApi.createTeam({ name: teamName, description });
      setTeamName('');
      setDescription('');
      setIsCreateModalOpen(false);
      setSuccess('Team created successfully.');
      await fetchTeams();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to establish team.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openManageMembers = async (team) => {
    setSelectedTeam(team);
    setIsMembersModalOpen(true);
    setMemberActionError('');
    try {
      setMembersLoading(true);
      const res = await teamApi.getTeamById(team.id);
      setTeamDetails(res.data.team);
    } catch (err) {
      setMemberActionError(err.response?.data?.message || 'Could not load team members.');
    } finally {
      setMembersLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberEmail.trim() || !selectedTeam) return;

    setMemberActionError('');
    try {
      await teamApi.addMember(selectedTeam.id, {
        email: memberEmail.trim(),
        role: memberRole,
      });
      setMemberEmail('');
      // Refresh member list
      const res = await teamApi.getTeamById(selectedTeam.id);
      setTeamDetails(res.data.team);
      await fetchTeams();
    } catch (err) {
      setMemberActionError(err.response?.data?.message || 'Failed to add member.');
    }
  };

  const handleUpdateRole = async (targetUserId, newRole) => {
    setMemberActionError('');
    try {
      await teamApi.updateMemberRole(selectedTeam.id, targetUserId, newRole);
      const res = await teamApi.getTeamById(selectedTeam.id);
      setTeamDetails(res.data.team);
      await fetchTeams();
    } catch (err) {
      setMemberActionError(err.response?.data?.message || 'Failed to update member role.');
    }
  };

  const handleRemoveMember = async (targetUserId) => {
    if (!window.confirm('Are you sure you want to remove this member from the team?')) return;
    setMemberActionError('');
    try {
      await teamApi.removeMember(selectedTeam.id, targetUserId);
      const res = await teamApi.getTeamById(selectedTeam.id);
      setTeamDetails(res.data.team);
      await fetchTeams();
    } catch (err) {
      setMemberActionError(err.response?.data?.message || 'Failed to remove member.');
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('Are you sure you want to delete this team? All associated projects and tasks will be removed.')) return;
    try {
      await teamApi.deleteTeam(teamId);
      setSuccess('Team deleted.');
      await fetchTeams();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete team.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Teams Directory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Collaborate in teams, assign leaders, and organize project workspaces.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors shadow-2xs"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Team
        </button>
      </div>

      {/* Notifications / Alerts */}
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

      {/* Content Area */}
      {loading ? (
        <LoadingSpinner size="lg" text="Loading teams from PostgreSQL..." />
      ) : teams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No teams established"
          description="Create your first team to invite colleagues, launch projects, and assign roles."
          actionLabel="Create First Team"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {teams.map((team) => {
            const isLeader = team.userRole === 'TEAM_LEADER' || user?.role === 'ADMIN';
            return (
              <div
                key={team.id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        team.userRole === 'TEAM_LEADER'
                          ? 'bg-brand-50 text-brand-700 border border-brand-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {team.userRole === 'TEAM_LEADER' ? 'Team Leader' : 'Team Member'}
                    </span>

                    {isLeader && (
                      <button
                        onClick={() => handleDeleteTeam(team.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors p-1"
                        title="Delete team"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mt-3">{team.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {team.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center space-x-4 text-xs text-slate-500">
                    <span className="flex items-center">
                      <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {team.membersCount} member{team.membersCount !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center">
                      <Briefcase className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {team.projectsCount} project{team.projectsCount !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => openManageMembers(team)}
                      className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center"
                    >
                      <UserPlus className="w-3.5 h-3.5 mr-1" />
                      Manage Members
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Team Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Team"
      >
        <form onSubmit={handleCreateTeam} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Team Name
            </label>
            <input
              type="text"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g., Core Engineering, Operations"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Primary mission and collaboration domain..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Establishing...' : 'Establish Team'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Manage Members Modal */}
      <Modal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        title={`Manage Members: ${selectedTeam?.name || ''}`}
        maxWidth="max-w-xl"
      >
        <div className="space-y-5">
          {memberActionError && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs font-medium flex items-center">
              <AlertCircle className="w-4 h-4 mr-1.5 shrink-0" />
              {memberActionError}
            </div>
          )}

          {/* Add member form (Available to Team Leaders & Admin) */}
          <form
            onSubmit={handleAddMember}
            className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
          >
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Invite / Add Registered Member
            </h4>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                required
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                placeholder="registered.user@company.com"
                className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              />
              <select
                value={memberRole}
                onChange={(e) => setMemberRole(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="TEAM_MEMBER">Team Member</option>
                <option value="TEAM_LEADER">Team Leader</option>
              </select>
              <button
                type="submit"
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors shrink-0"
              >
                Add Member
              </button>
            </div>
          </form>

          {/* Current Members List */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Active Members ({teamDetails?.members?.length || 0})
            </h4>

            {membersLoading ? (
              <LoadingSpinner size="sm" text="Retrieving member list..." />
            ) : (
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {teamDetails?.members?.map((m) => (
                  <div key={m.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-xs">
                        {m.user.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{m.user.fullName}</p>
                        <p className="text-[11px] text-slate-400">{m.user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <select
                        value={m.role}
                        onChange={(e) => handleUpdateRole(m.userId, e.target.value)}
                        className="px-2 py-1 text-[11px] font-semibold rounded border border-slate-200 bg-white"
                      >
                        <option value="TEAM_LEADER">Team Leader</option>
                        <option value="TEAM_MEMBER">Team Member</option>
                      </select>

                      <button
                        onClick={() => handleRemoveMember(m.userId)}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                        title="Remove member"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TeamsPage;
