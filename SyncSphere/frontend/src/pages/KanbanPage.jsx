import React, { useState, useEffect } from 'react';
import { 
  KanbanSquare, 
  Plus, 
  Calendar, 
  MessageSquare, 
  Paperclip, 
  Trash2, 
  Send, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  Users,
  Briefcase
} from 'lucide-react';
import taskApi from '../services/taskApi';
import projectApi from '../services/projectApi';
import teamApi from '../services/teamApi';
import { useAuth } from '../context/AuthContext';
import KanbanBoard from '../components/kanban/KanbanBoard';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

const priorityOptions = [
  { value: 'LOW', label: 'Low', color: 'text-emerald-700 bg-emerald-50' },
  { value: 'MEDIUM', label: 'Medium', color: 'text-amber-700 bg-amber-50' },
  { value: 'HIGH', label: 'High', color: 'text-rose-700 bg-rose-50' },
];

const KanbanPage = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Task Creation Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  // Task Inspection & Detail Modal state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeTaskDetail, setActiveTaskDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [actionError, setActionError] = useState('');

  // 1. Initial Load: Fetch User Teams & First Team's Projects
  useEffect(() => {
    const initializeData = async () => {
      try {
        const teamsRes = await teamApi.getMyTeams();
        const userTeams = teamsRes.data.teams || [];
        setTeams(userTeams);

        if (userTeams.length > 0) {
          // Fetch projects for first team
          const projRes = await projectApi.getProjects(userTeams[0].id);
          const userProjects = projRes.data.projects || [];
          setProjects(userProjects);

          if (userProjects.length > 0) {
            setSelectedProjectId(String(userProjects[0].id));
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to initialize Kanban workspace.');
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // 2. Fetch Tasks & Project Details whenever selectedProjectId changes
  const fetchTasksForProject = async (projId) => {
    if (!projId) return;
    try {
      setLoading(true);
      setError('');

      // Fetch tasks
      const res = await taskApi.getTasks(projId);
      setTasks(res.data.tasks || []);

      // Fetch project details for team members
      const pRes = await projectApi.getProjectById(projId);
      setSelectedProject(pRes.data.project);

      // Fetch team members for task assignment
      if (pRes.data.project?.teamId) {
        const tRes = await teamApi.getTeamById(pRes.data.project.teamId);
        setTeamMembers(tRes.data.team?.members || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load project tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      fetchTasksForProject(selectedProjectId);
    }
  }, [selectedProjectId]);

  // Handle Drag-and-Drop or direct status transition
  const handleStatusChange = async (taskId, newStatus) => {
    // Optimistic UI update
    const previousTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await taskApi.updateTaskStatus(taskId, newStatus);
    } catch (err) {
      // Rollback on network failure
      setTasks(previousTasks);
      setError(err.response?.data?.message || 'Failed to persist status change.');
    }
  };

  // Create Task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || !dueDate || !selectedProjectId) return;

    setIsSubmittingTask(true);
    setError('');
    try {
      await taskApi.createTask({
        projectId: selectedProjectId,
        title: taskTitle.trim(),
        desc: taskDesc.trim(),
        priority,
        dueDate,
        assigneeIds: selectedAssignees,
      });

      setTaskTitle('');
      setTaskDesc('');
      setDueDate('');
      setSelectedAssignees([]);
      setIsCreateModalOpen(false);
      setSuccess('Task created and added to Kanban board.');
      await fetchTasksForProject(selectedProjectId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task.');
    } finally {
      setIsSubmittingTask(false);
    }
  };

  // Open Task Inspection Modal
  const openTaskDetail = async (task) => {
    setIsDetailModalOpen(true);
    setActionError('');
    try {
      setDetailLoading(true);
      const res = await taskApi.getTaskById(task.id);
      setActiveTaskDetail(res.data.task);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to load task details.');
    } finally {
      setDetailLoading(false);
    }
  };

  // Add Comment to active task
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || !activeTaskDetail) return;

    try {
      await taskApi.addComment(activeTaskDetail.id, newCommentText.trim());
      setNewCommentText('');
      const res = await taskApi.getTaskById(activeTaskDetail.id);
      setActiveTaskDetail(res.data.task);
      // Refresh board cards
      await fetchTasksForProject(selectedProjectId);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to post comment.');
    }
  };

  // Upload Attachment
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeTaskDetail) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingFile(true);
    try {
      await taskApi.uploadAttachment(activeTaskDetail.id, formData);
      const res = await taskApi.getTaskById(activeTaskDetail.id);
      setActiveTaskDetail(res.data.task);
      await fetchTasksForProject(selectedProjectId);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to upload attachment.');
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  // Delete Attachment
  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm('Remove this attachment?')) return;
    try {
      await taskApi.deleteAttachment(activeTaskDetail.id, attachmentId);
      const res = await taskApi.getTaskById(activeTaskDetail.id);
      setActiveTaskDetail(res.data.task);
      await fetchTasksForProject(selectedProjectId);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to remove attachment.');
    }
  };

  // Delete Task
  const handleDeleteTask = async () => {
    if (!window.confirm('Delete this task from the board?')) return;
    try {
      await taskApi.deleteTask(activeTaskDetail.id);
      setIsDetailModalOpen(false);
      setSuccess('Task deleted.');
      await fetchTasksForProject(selectedProjectId);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to delete task.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Project Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kanban Task Board</h1>
            {selectedProject && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                {selectedProject.title}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Drag cards between To Do → In Progress → Completed to persist updates directly to PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Project Switcher */}
          {projects.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:inline">
                Project:
              </span>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => setIsCreateModalOpen(true)}
            disabled={!selectedProjectId}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors shadow-2xs disabled:opacity-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Task
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

      {/* Main Kanban Content */}
      {projects.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No Projects Available"
          description="Create a project first before organizing tasks on the Kanban board."
          actionLabel="Create Project"
          onAction={() => (window.location.href = '/projects')}
        />
      ) : loading ? (
        <LoadingSpinner size="lg" text="Loading tasks from PostgreSQL..." />
      ) : (
        <KanbanBoard
          tasks={tasks}
          onStatusChange={handleStatusChange}
          onSelectTask={openTaskDetail}
        />
      )}

      {/* Task Creation Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Task"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Task Title
            </label>
            <input
              type="text"
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g., Implement bcrypt password hashing"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              placeholder="Task details and technical requirements..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Due Date
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Assignees Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Assign Team Members
            </label>
            {teamMembers.length === 0 ? (
              <p className="text-xs text-slate-400">No members found in this team.</p>
            ) : (
              <div className="max-h-32 overflow-y-auto space-y-1.5 border border-slate-200 rounded-lg p-2.5 bg-slate-50">
                {teamMembers.map((m) => {
                  const isChecked = selectedAssignees.includes(m.user.id);
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
                            setSelectedAssignees([...selectedAssignees, m.user.id]);
                          } else {
                            setSelectedAssignees(selectedAssignees.filter((id) => id !== m.user.id));
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
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingTask}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50"
            >
              {isSubmittingTask ? 'Creating...' : 'Save Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Task Inspection & Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={activeTaskDetail?.title || 'Task Details'}
        maxWidth="max-w-2xl"
      >
        {detailLoading ? (
          <LoadingSpinner size="md" text="Loading task details..." />
        ) : activeTaskDetail ? (
          <div className="space-y-6">
            {actionError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs font-medium flex items-center">
                <AlertCircle className="w-4 h-4 mr-1.5 shrink-0" />
                {actionError}
              </div>
            )}

            {/* Task Overview Attributes */}
            <div className="space-y-3 pb-4 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="font-semibold text-slate-500">Status:</span>
                <select
                  value={activeTaskDetail.status}
                  onChange={(e) => {
                    handleStatusChange(activeTaskDetail.id, e.target.value);
                    setActiveTaskDetail({ ...activeTaskDetail, status: e.target.value });
                  }}
                  className="px-2 py-1 border border-slate-300 rounded bg-white font-semibold text-slate-800"
                >
                  <option value="TO_DO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>

                <span className="font-semibold text-slate-500 ml-2">Priority:</span>
                <span
                  className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                    priorityOptions.find((p) => p.value === activeTaskDetail.priority)?.color || ''
                  }`}
                >
                  {activeTaskDetail.priority}
                </span>

                <span className="font-semibold text-slate-500 ml-2">Due Date:</span>
                <span className="text-slate-700 font-medium">
                  {new Date(activeTaskDetail.dueDate).toLocaleDateString()}
                </span>
              </div>

              {activeTaskDetail.desc && (
                <div className="pt-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Description
                  </p>
                  <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {activeTaskDetail.desc}
                  </p>
                </div>
              )}

              {/* Assignees */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Assignees
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {activeTaskDetail.assignees?.map((a) => (
                    <span
                      key={a.id}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-slate-100 text-slate-700 font-medium"
                    >
                      {a.user.fullName}
                    </span>
                  ))}
                  {(!activeTaskDetail.assignees || activeTaskDetail.assignees.length === 0) && (
                    <span className="text-xs text-slate-400 italic">No assigned members.</span>
                  )}
                </div>
              </div>
            </div>

            {/* File Attachments Section */}
            <div className="space-y-3 pb-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center">
                  <Paperclip className="w-3.5 h-3.5 mr-1.5 text-brand-600" />
                  Attachments ({activeTaskDetail.files?.length || 0})
                </h4>

                {/* Upload Trigger */}
                <label className="cursor-pointer inline-flex items-center px-2.5 py-1 text-xs font-medium text-brand-700 bg-brand-50 border border-brand-200 rounded-md hover:bg-brand-100 transition-colors">
                  <Upload className="w-3 h-3 mr-1" />
                  {uploadingFile ? 'Uploading...' : 'Attach File'}
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploadingFile}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="space-y-1.5">
                {activeTaskDetail.files?.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">{file.filename}</span>
                      <span className="text-[10px] text-slate-400">
                        ({Math.round(file.fileSize / 1024)} KB)
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <a
                        href={`http://localhost:5000${file.url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-600 hover:text-brand-700 p-1"
                        title="Download file"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => handleDeleteAttachment(file.id)}
                        className="text-slate-400 hover:text-red-600 p-1"
                        title="Delete attachment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comments Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center">
                <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-brand-600" />
                Comments & Discussions ({activeTaskDetail.comments?.length || 0})
              </h4>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Post a comment or technical note..."
                  className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors flex items-center shrink-0"
                >
                  <Send className="w-3 h-3 mr-1" />
                  Post
                </button>
              </form>

              {/* Comments Stream */}
              <div className="space-y-2 max-h-48 overflow-y-auto pt-1">
                {activeTaskDetail.comments?.map((c) => (
                  <div key={c.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-800">{c.author?.fullName}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(c.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{c.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer: Delete Task Option */}
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleDeleteTask}
                className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Delete Task
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default KanbanPage;
