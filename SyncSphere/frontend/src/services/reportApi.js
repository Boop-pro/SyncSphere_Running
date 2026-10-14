import api from './api';

export const reportApi = {
  getDashboardMetrics: () => api.get('/reports/dashboard'),
  getProgressReport: (projectId) => api.get(`/reports/projects/${projectId}/progress`),
  getTaskCompletionReport: (projectId) => api.get(`/reports/projects/${projectId}/tasks`),
  getTeamUsageReport: (teamId) => api.get(`/reports/teams/${teamId}/usage`),
  getSavedReports: (projectId) => api.get(`/reports/projects/${projectId}/saved`),
};

export default reportApi;
