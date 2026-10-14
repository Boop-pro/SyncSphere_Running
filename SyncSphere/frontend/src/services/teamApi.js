import api from './api';

export const teamApi = {
  getMyTeams: () => api.get('/teams/my'),
  getTeamById: (id) => api.get(`/teams/${id}`),
  createTeam: (data) => api.post('/teams', data),
  deleteTeam: (id) => api.delete(`/teams/${id}`),
  addMember: (teamId, memberData) => api.post(`/teams/${teamId}/members`, memberData),
  updateMemberRole: (teamId, userId, role) =>
    api.patch(`/teams/${teamId}/members/${userId}/role`, { role }),
  removeMember: (teamId, userId) => api.delete(`/teams/${teamId}/members/${userId}`),
};

export default teamApi;
