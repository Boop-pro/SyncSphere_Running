import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Megaphone, 
  Plus, 
  Pin, 
  User, 
  Clock, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Briefcase,
  Layers 
} from 'lucide-react';
import discussionApi from '../services/discussionApi';
import projectApi from '../services/projectApi';
import teamApi from '../services/teamApi';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

const DiscussionBoardPage = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [boardData, setBoardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create Post Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Initial Load: Fetch User Teams & First Team's Projects
  useEffect(() => {
    const initialize = async () => {
      try {
        const teamsRes = await teamApi.getMyTeams();
        const userTeams = teamsRes.data.teams || [];
        setTeams(userTeams);

        if (userTeams.length > 0) {
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
        setError(err.response?.data?.message || 'Failed to initialize discussion workspace.');
        setLoading(false);
      }
    };
    initialize();
  }, []);

  // 2. Fetch Board Posts when selectedProjectId changes
  const fetchBoard = async (projId) => {
    if (!projId) return;
    try {
      setLoading(true);
      setError('');
      const res = await discussionApi.getDiscussionBoard(projId);
      setBoardData(res.data.board);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load discussion board.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      fetchBoard(selectedProjectId);
    }
  }, [selectedProjectId]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!title.trim() || !text.trim() || !selectedProjectId) return;

    setIsSubmitting(true);
    setError('');
    try {
      await discussionApi.createPost(selectedProjectId, {
        title: title.trim(),
        text: text.trim(),
        isPinned,
      });

      setTitle('');
      setText('');
      setIsPinned(false);
      setIsModalOpen(false);
      setSuccess('Post published to project discussion board.');
      await fetchBoard(selectedProjectId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish post.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this discussion post?')) return;
    try {
      await discussionApi.deletePost(postId);
      setSuccess('Post deleted.');
      await fetchBoard(selectedProjectId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete post.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Project Discussions & News
            </h1>
            {boardData && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                {boardData.projectTitle}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Asynchronous discussion boards and official Team Leader announcements.
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
            onClick={() => setIsModalOpen(true)}
            disabled={!selectedProjectId}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors shadow-2xs disabled:opacity-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Post
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

      {/* Posts Stream */}
      {projects.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No Projects Established"
          description="Create a project to launch its dedicated discussion board."
          actionLabel="Create Project"
          onAction={() => (window.location.href = '/projects')}
        />
      ) : loading ? (
        <LoadingSpinner size="lg" text="Loading discussion board..." />
      ) : !boardData?.posts || boardData.posts.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No discussions yet"
          description="Start the conversation! Publish an announcement or topic to align with your project team."
          actionLabel="Create First Post"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {boardData.posts.map((post) => {
            const isAuthor = post.authorId === user?.id || user?.role === 'ADMIN';

            return (
              <div
                key={post.id}
                className={`p-6 rounded-2xl border transition-all ${
                  post.isPinned
                    ? 'bg-amber-50/40 border-amber-200 shadow-2xs'
                    : 'bg-white border-slate-200 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {post.isPinned && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                        <Pin className="w-3 h-3 mr-1" />
                        Pinned Announcement
                      </span>
                    )}
                    <span className="text-xs font-semibold text-slate-800">
                      {post.author?.fullName}
                    </span>
                    <span className="text-[10px] text-slate-400 capitalize">
                      ({post.author?.role === 'ADMIN' ? 'Admin' : 'Member'})
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-slate-400 flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {new Date(post.timestamp).toLocaleString()}
                    </span>

                    {isAuthor && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                        title="Delete post"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-2">{post.title}</h3>
                <p className="text-sm text-slate-700 mt-2 whitespace-pre-line leading-relaxed">
                  {post.text}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Post Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Publish Announcement or Discussion Post"
      >
        <form onSubmit={handleCreatePost} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Sprint Architecture Standards & Deliverables"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Message Content
            </label>
            <textarea
              rows={4}
              required
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write your announcement details or discussion topic..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
              />
              <span className="text-sm font-medium text-slate-700 flex items-center">
                <Pin className="w-3.5 h-3.5 mr-1 text-amber-600" />
                Pin as Official Announcement (Team Leaders & Admin)
              </span>
            </label>
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
              {isSubmitting ? 'Publishing...' : 'Publish Post'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DiscussionBoardPage;
