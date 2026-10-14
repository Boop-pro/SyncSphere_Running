import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Briefcase, 
  Flag, 
  Calendar, 
  Plus, 
  Trash2, 
  KanbanSquare, 
  MessageSquare, 
  BarChart3, 
  ArrowLeft,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import projectApi from '../services/projectApi';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ProjectDetailsPage = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Milestone modal state
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneDueDate, setMilestoneDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProject = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await projectApi.getProjectById(id);
      setProject(res.data.project);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve project details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProject();
    }
  }, [id]);

  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    if (!milestoneTitle.trim() || !milestoneDueDate) return;

    setIsSubmitting(true);
    try {
      await projectApi.createMilestone(id, {
        title: milestoneTitle.trim(),
        dueDate: milestoneDueDate,
      });
      setMilestoneTitle('');
      setMilestoneDueDate('');
      setIsMilestoneModalOpen(false);
      setSuccess('Milestone added.');
      await fetchProject();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create milestone.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleMilestone = async (milestoneId, currentStatus) => {
    try {
      await projectApi.updateMilestone(id, milestoneId, {
        completed: !currentStatus,
      });
      await fetchProject();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update milestone status.');
    }
  };

  const handleDeleteMilestone = async (milestoneId) => {
    if (!window.confirm('Delete this milestone?')) return;
    try {
      await projectApi.deleteMilestone(id, milestoneId);
      setSuccess('Milestone removed.');
      await fetchProject();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete milestone.');
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading project & milestones..." />;
  }

  if (error && !project) {
    return (
      <div className="space-y-4">
        <Link to="/projects" className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Projects
        </Link>
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/projects"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Projects
        </Link>
      </div>

      {/* Notifications */}
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

      {/* Project Overview Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {project.team?.name}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {project.status}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{project.title}</h1>
            <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">{project.desc}</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Link
              to="/kanban"
              className="inline-flex items-center justify-center px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-2xs"
            >
              <KanbanSquare className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Tasks Kanban
            </Link>
            <Link
              to="/discussions"
              className="inline-flex items-center justify-center px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-2xs"
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Discussions
            </Link>
            <Link
              to="/reports"
              className="inline-flex items-center justify-center px-3.5 py-2 text-xs font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 shadow-2xs"
            >
              <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
              Progress Report
            </Link>
          </div>
        </div>

        {/* Progress summary */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <span className="text-xs text-slate-400 font-medium">Empirical Progress</span>
            <div className="flex items-center space-x-3 mt-1">
              <div className="flex-1 bg-slate-100 rounded-full h-2">
                <div
                  className="bg-brand-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
              <span className="text-xs font-bold text-slate-800">{project.progress}%</span>
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Target Deadline</span>
            <p className="text-sm font-semibold text-slate-800 mt-0.5">
              {new Date(project.deadline).toLocaleDateString()}
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Milestones Completed</span>
            <p className="text-sm font-semibold text-slate-800 mt-0.5">
              {project.milestones?.filter((m) => m.completed).length || 0} of{' '}
              {project.milestones?.length || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Milestones Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Flag className="w-5 h-5 text-brand-600" />
            <h2 className="text-base font-bold text-slate-900">Project Milestones</h2>
          </div>
          <button
            onClick={() => setIsMilestoneModalOpen(true)}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-brand-700 bg-brand-50 border border-brand-200 rounded-lg hover:bg-brand-100 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Milestone
          </button>
        </div>

        {project.milestones?.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 italic text-center">
            No milestones defined for this project yet. Add major deliverables to track velocity.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {project.milestones?.map((m) => (
              <div key={m.id} className="py-3.5 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={m.completed}
                    onChange={() => handleToggleMilestone(m.id, m.completed)}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer"
                  />
                  <span
                    className={`text-sm font-medium ${
                      m.completed ? 'line-through text-slate-400' : 'text-slate-800'
                    }`}
                  >
                    {m.title}
                  </span>
                </div>

                <div className="flex items-center space-x-4">
                  <span className="text-xs text-slate-500 flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    Target: {new Date(m.dueDate).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleDeleteMilestone(m.id)}
                    className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                    title="Delete milestone"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Milestone Modal */}
      <Modal
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
        title="Add Project Milestone"
      >
        <form onSubmit={handleCreateMilestone} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Milestone Title
            </label>
            <input
              type="text"
              required
              value={milestoneTitle}
              onChange={(e) => setMilestoneTitle(e.target.value)}
              placeholder="e.g., Database Models & Integration Tests"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Due Date
            </label>
            <input
              type="date"
              required
              value={milestoneDueDate}
              onChange={(e) => setMilestoneDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsMilestoneModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Milestone'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectDetailsPage;
