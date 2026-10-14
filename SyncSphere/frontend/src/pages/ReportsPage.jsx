import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  Users, 
  TrendingUp, 
  FileText, 
  Layers, 
  Briefcase,
  AlertCircle
} from 'lucide-react';
import reportApi from '../services/reportApi';
import teamApi from '../services/teamApi';
import projectApi from '../services/projectApi';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('PROGRESS');
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');

  const [progressReport, setProgressReport] = useState(null);
  const [taskReport, setTaskReport] = useState(null);
  const [usageReport, setUsageReport] = useState(null);
  const [savedReports, setSavedReports] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 1. Initial Load: Fetch User Teams & First Team's Projects
  useEffect(() => {
    const initialize = async () => {
      try {
        const teamsRes = await teamApi.getMyTeams();
        const userTeams = teamsRes.data.teams || [];
        setTeams(userTeams);

        if (userTeams.length > 0) {
          const firstTeamId = String(userTeams[0].id);
          setSelectedTeamId(firstTeamId);

          const projRes = await projectApi.getProjects(firstTeamId);
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
        setError(err.response?.data?.message || 'Failed to initialize reports.');
        setLoading(false);
      }
    };
    initialize();
  }, []);

  // 2. Fetch Report Data according to activeTab and selected project/team
  const loadReports = async () => {
    setError('');
    try {
      setLoading(true);

      if (activeTab === 'PROGRESS' && selectedProjectId) {
        const res = await reportApi.getProgressReport(selectedProjectId);
        setProgressReport(res.data.report);
      } else if (activeTab === 'TASKS' && selectedProjectId) {
        const res = await reportApi.getTaskCompletionReport(selectedProjectId);
        setTaskReport(res.data.report);
      } else if (activeTab === 'USAGE' && selectedTeamId) {
        const res = await reportApi.getTeamUsageReport(selectedTeamId);
        setUsageReport(res.data.report);
      }

      // Also fetch saved snapshots
      if (selectedProjectId) {
        const savedRes = await reportApi.getSavedReports(selectedProjectId);
        setSavedReports(savedRes.data.reports || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId || selectedTeamId) {
      loadReports();
    }
  }, [activeTab, selectedProjectId, selectedTeamId]);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">
            Empirical progress metrics, task completion rates, and team performance data from PostgreSQL.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('PROGRESS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'PROGRESS'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Project Progress
          </button>
          <button
            onClick={() => setActiveTab('TASKS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'TASKS'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Task Completion
          </button>
          <button
            onClick={() => setActiveTab('USAGE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'USAGE'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Team Usage
          </button>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        {teams.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Team:
            </span>
            <select
              value={selectedTeamId}
              onChange={async (e) => {
                const newTeamId = e.target.value;
                setSelectedTeamId(newTeamId);
                const projRes = await projectApi.getProjects(newTeamId);
                const list = projRes.data.projects || [];
                setProjects(list);
                if (list.length > 0) setSelectedProjectId(String(list[0].id));
                else setSelectedProjectId('');
              }}
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

        {projects.length > 0 && activeTab !== 'USAGE' && (
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
          onClick={loadReports}
          className="ml-auto px-3 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200 rounded-lg hover:bg-brand-100 transition-colors"
        >
          Refresh Empirical Data
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* Tab 1: Project Progress Report */}
      {activeTab === 'PROGRESS' && (
        loading ? (
          <LoadingSpinner size="lg" text="Computing empirical progress metrics..." />
        ) : !progressReport ? (
          <EmptyState
            icon={BarChart3}
            title="No project selected"
            description="Select an active project above to compute progress and milestone velocity."
          />
        ) : (
          <div className="space-y-6">
            {/* KPI Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Empirical Completion Rate
                </span>
                <div className="flex items-baseline space-x-2 mt-2">
                  <span className="text-3xl font-bold text-slate-900">{progressReport.progress}%</span>
                  <span className="text-xs font-medium text-emerald-600 flex items-center">
                    <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                    {progressReport.progress === 100 ? 'Completed' : 'Active'}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 mt-3">
                  <div
                    className="bg-brand-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressReport.progress}%` }}
                  />
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Tasks Finalized
                </span>
                <div className="flex items-baseline space-x-2 mt-2">
                  <span className="text-3xl font-bold text-slate-900">
                    {progressReport.tasksDistribution?.completed} / {progressReport.tasksDistribution?.total}
                  </span>
                  <span className="text-xs font-medium text-slate-500">Tasks</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  {progressReport.tasksDistribution?.todo} in To Do, {progressReport.tasksDistribution?.inProgress} in Progress
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Milestones Completed
                </span>
                <div className="flex items-baseline space-x-2 mt-2">
                  <span className="text-3xl font-bold text-slate-900">
                    {progressReport.milestonesSummary?.completed} / {progressReport.milestonesSummary?.total}
                  </span>
                  <span className="text-xs font-medium text-slate-500">Milestones</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  {progressReport.milestonesSummary?.pending} pending deliverables
                </p>
              </div>
            </div>

            {/* Milestones List Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Milestone Deliverable Audit</h3>
              </div>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <th className="p-3.5">Milestone</th>
                    <th className="p-3.5">Due Date</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {progressReport.milestonesSummary?.list?.map((m) => (
                    <tr key={m.id}>
                      <td className="p-3.5 font-semibold text-slate-800">{m.title}</td>
                      <td className="p-3.5 text-slate-500">
                        {new Date(m.dueDate).toLocaleDateString()}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            m.completed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {m.completed ? 'Completed' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!progressReport.milestonesSummary?.list || progressReport.milestonesSummary.list.length === 0) && (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-slate-400 italic">
                        No milestones defined yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Tab 2: Individual Task Completion Report */}
      {activeTab === 'TASKS' && (
        loading ? (
          <LoadingSpinner size="lg" text="Computing individual task completion rates..." />
        ) : !taskReport ? (
          <EmptyState
            icon={BarChart3}
            title="No project selected"
            description="Select an active project above to view individual task completion reports."
          />
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Team Member Task Completion Breakdown
              </h3>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <th className="p-3.5">Team Member</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Assigned Tasks</th>
                  <th className="p-3.5">Completed</th>
                  <th className="p-3.5">Pending</th>
                  <th className="p-3.5">Completion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {taskReport.memberStats?.map((m) => (
                  <tr key={m.userId} className="hover:bg-slate-50/60">
                    <td className="p-3.5">
                      <p className="font-semibold text-slate-900">{m.fullName}</p>
                      <p className="text-[11px] text-slate-400">{m.email}</p>
                    </td>
                    <td className="p-3.5 text-slate-500">{m.role?.replace('_', ' ')}</td>
                    <td className="p-3.5 font-bold text-slate-800">{m.totalAssigned}</td>
                    <td className="p-3.5 font-semibold text-emerald-600">{m.completed}</td>
                    <td className="p-3.5 font-semibold text-amber-600">{m.pending}</td>
                    <td className="p-3.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{m.completionRate}%</span>
                        <div className="w-16 bg-slate-100 rounded-full h-1.5">
                          <div
                            className="bg-brand-600 h-1.5 rounded-full"
                            style={{ width: `${m.completionRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Tab 3: Team Usage & Activity Log */}
      {activeTab === 'USAGE' && (
        loading ? (
          <LoadingSpinner size="lg" text="Aggregating team activity logs..." />
        ) : !usageReport ? (
          <EmptyState
            icon={BarChart3}
            title="No team selected"
            description="Select a team above to view its operational activity log."
          />
        ) : (
          <div className="space-y-6">
            {/* Overview cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Team Members
                </span>
                <p className="text-2xl font-bold text-slate-900 mt-1">{usageReport.totalMembers}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Total Projects
                </span>
                <p className="text-2xl font-bold text-slate-900 mt-1">{usageReport.totalProjects}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Tasks Finalized
                </span>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {usageReport.completedTasks} / {usageReport.totalTasks}
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Meetings Held
                </span>
                <p className="text-2xl font-bold text-slate-900 mt-1">{usageReport.totalMeetings}</p>
              </div>
            </div>

            {/* Audit Log */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">
                  Empirical Workspace Activity Audit
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Actual operations derived from stored PostgreSQL tasks, meetings, and announcements.
                </p>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {usageReport.recentActivities?.map((act, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-slate-50/50">
                    <span className="font-medium text-slate-800">{act.title}</span>
                    <span className="text-slate-400">
                      {new Date(act.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
                {(!usageReport.recentActivities || usageReport.recentActivities.length === 0) && (
                  <div className="p-6 text-center text-slate-400 italic">
                    No logged activity in this team yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      )}

      {/* Historical Report Snapshots */}
      {savedReports.length > 0 && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center">
            <FileText className="w-4 h-4 mr-2 text-brand-600" />
            Persisted Report Snapshots in PostgreSQL
          </h3>
          <div className="divide-y divide-slate-100 text-xs">
            {savedReports.map((r) => (
              <div key={r.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 uppercase">{r.type} REPORT</span>
                  <span className="text-slate-400 ml-2">Snapshot ID: #{r.id}</span>
                </div>
                <span className="text-slate-400">
                  Generated {new Date(r.generated).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
