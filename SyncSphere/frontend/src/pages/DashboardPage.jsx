import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Briefcase, 
  KanbanSquare, 
  CalendarDays, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Video
} from 'lucide-react';
import reportApi from '../services/reportApi';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const DashboardPage = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await reportApi.getDashboardMetrics();
        setMetrics(res.data.metrics);
      } catch (err) {
        console.warn('Could not load dashboard metrics:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                SyncSphere Workspace
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">PostgreSQL Relational Core</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 tracking-tight">
              Welcome back, {user?.fullName || 'Colleague'}
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Track your schedules, coordinate with your teams, monitor project milestones, and maintain task velocity across your workspace.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/personal-calendar"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <CalendarDays className="w-4 h-4 mr-2 text-slate-500" />
              My Schedule
            </Link>
            <Link
              to="/kanban"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
            >
              <KanbanSquare className="w-4 h-4 mr-2" />
              View Kanban
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      {loading ? (
        <LoadingSpinner size="md" text="Loading empirical metrics..." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Active Teams
              </span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {metrics?.activeTeamsCount ?? 0}
            </p>
            <p className="text-xs text-slate-400 mt-1">Teams you are collaborating in</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Assigned Pending
              </span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {metrics?.pendingTasksCount ?? 0}
            </p>
            <p className="text-xs text-slate-400 mt-1">Tasks in To Do & In Progress</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Completed Tasks
              </span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {metrics?.completedTasksCount ?? 0}
            </p>
            <p className="text-xs text-slate-400 mt-1">Persisted completed tasks</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Upcoming Deadlines
              </span>
              <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {metrics?.upcomingDeadlinesCount ?? 0}
            </p>
            <p className="text-xs text-slate-400 mt-1">Due within next 48 hours</p>
          </div>
        </div>
      )}

      {/* Projects Overview & Upcoming Meetings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects List */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center">
              <Briefcase className="w-4 h-4 mr-2 text-brand-600" />
              Active Projects & Progress
            </h2>
            <Link to="/projects" className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center">
              View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          {metrics?.projects?.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 italic">
              No active projects yet. Create a team and project to start tracking deliverables.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {metrics?.projects?.map((proj) => (
                <div key={proj.id} className="py-3 flex items-center justify-between">
                  <div className="space-y-1">
                    <Link
                      to={`/projects/${proj.id}`}
                      className="text-sm font-bold text-slate-800 hover:text-brand-600 transition-colors"
                    >
                      {proj.title}
                    </Link>
                    <p className="text-[11px] text-slate-400">Team: {proj.team?.name}</p>
                  </div>

                  <div className="w-40 flex items-center space-x-3">
                    <div className="flex-1 bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-brand-600 h-2 rounded-full"
                        style={{ width: `${proj.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-700">{proj.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Meetings List */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center">
              <Video className="w-4 h-4 mr-2 text-purple-600" />
              Next Meetings
            </h2>
            <Link to="/meetings" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              Schedule →
            </Link>
          </div>

          {metrics?.upcomingMeetings?.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 italic">
              No upcoming meetings scheduled.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {metrics?.upcomingMeetings?.map((m) => (
                <div key={m.id} className="py-2.5 space-y-1">
                  <p className="text-xs font-bold text-slate-800 truncate">{m.title}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{new Date(m.dateTime).toLocaleDateString()}</span>
                    <span>{m.durationMinutes} min</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
