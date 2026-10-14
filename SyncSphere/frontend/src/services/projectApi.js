import api from './api';

export const projectApi = {
  getProjects: (teamId) => api.get(`/projects?teamId=${teamId}`),
  getProjectById: (id) => api.get(`/projects/${id}`),
  createProject: (projectData) => api.post('/projects', projectData),
  updateProject: (id, updates) => api.put(`/projects/${id}`, updates),
  deleteProject: (id) => api.delete(`/projects/${id}`),
  createMilestone: (projectId, data) => api.post(`/projects/${projectId}/milestones`, data),
  updateMilestone: (projectId, milestoneId, updates) =>
    api.put(`/projects/${projectId}/milestones/${milestoneId}`, updates),
  deleteMilestone: (projectId, milestoneId) =>
    api.delete(`/projects/${projectId}/milestones/${milestoneId}`),
};

export default projectApi;
