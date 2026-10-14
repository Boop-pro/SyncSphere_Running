import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Briefcase, 
  Plus, 
  Calendar, 
  ArrowRight, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Layers 
} from 'lucide-react';
import projectApi from '../services/projectApi';
import teamApi from '../services/teamApi';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ProjectsPage = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create Project modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [modalTeamId, setModalTeamId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch user teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await teamApi.getMyTeams();
        const list = res.data.teams || [];
        setTeams(list);
        if (list.length > 0) {
          setSelectedTeamId(String(list[0].id));
          setModalTeamId(String(list[0].id));
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch your teams.');
      }
    };
    fetchTeams();
  }, []);

  // 2. Fetch projects when selectedTeamId changes
  const fetchProjects = async (teamId) => {
    if (!teamId) {
      setProjects([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await projectApi.getProjects(teamId);
      setProjects(res.data.projects || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTeamId) {
      fetchProjects(selectedTeamId);
    }
  }, [selectedTeamId]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!title.trim() || !modalTeamId || !deadline) return;

    setIsSubmitting(true);
    setError('');
    try {
      await projectApi.createProject({
        teamId: modalTeamId,
        title: title.trim(),
        desc: desc.trim(),
        deadline,
        status,
      });

      setTitle('');
      setDesc('');
      setDeadline('');
      setIsModalOpen(false);
      setSuccess('Project established successfully.');

      // Refresh current project view if created in current selected team
      if (modalTeamId === selectedTeamId) {
        await fetchProjects(selectedTeamId);
      } else {
        setSelectedTeamId(modalTeamId);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project and all associated deliverables?')) return;
    try {
      await projectApi.deleteProject(projectId);
      setSuccess('Project deleted.');
      await fetchProjects(selectedTeamId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete project.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Projects Directory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track deliverables, manage milestones, and monitor completion rates across team workspaces.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Team Switcher Filter */}
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
            disabled={teams.length === 0}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors shadow-2xs disabled:opacity-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
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

      {/* Projects Grid */}
      {teams.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No Teams Found"
          description="Projects must belong to a team. Please create or join a team first."
          actionLabel="Go to Teams Directory"
          onAction={() => (window.location.href = '/teams')}
        />
      ) : loading ? (
        <LoadingSpinner size="lg" text="Loading team projects..." />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No active projects for this team"
          description="Establish your first project to define milestones, manage tasks, and calculate velocity."
          actionLabel="Create Project"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate max-w-[150px]">
                    {proj.team?.name}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        proj.status === 'ACTIVE'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : proj.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {proj.status}
                    </span>
                    <button
                      onClick={() => handleDeleteProject(proj.id)}
                      className="text-slate-400 hover:text-red-600 transition-colors p-1"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <Link
                  to={`/projects/${proj.id}`}
                  className="text-base font-bold text-slate-900 hover:text-brand-600 transition-colors block"
                >
                  {proj.title}
                </Link>
                <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{proj.desc}</p>
              </div>

              <div className="mt-5 space-y-3">
                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                    <span>Empirical Progress</span>
                    <span className="font-bold">{proj.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-brand-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${proj.progress}%` }}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    Due {new Date(proj.deadline).toLocaleDateString()}
                  </span>
                  <Link
                    to={`/projects/${proj.id}`}
                    className="font-medium text-brand-600 hover:text-brand-700 flex items-center"
                  >
                    Milestones ({proj._count?.milestones || 0}) <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Project"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Team
            </label>
            <select
              value={modalTeamId}
              onChange={(e) => setModalTeamId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Project Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Client Portal Overhaul"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows={3}
              required
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Objectives, deliverables, and technical scope..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Deadline
              </label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="ACTIVE">Active</option>
                <option value="PLANNING">Planning</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
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
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectsPage;
