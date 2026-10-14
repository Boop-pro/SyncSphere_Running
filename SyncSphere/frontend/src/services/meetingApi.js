import api from './api';

export const meetingApi = {
  getMeetings: (teamId) => api.get(`/meetings?teamId=${teamId}`),
  createMeeting: (meetingData) => api.post('/meetings', meetingData),
  updateMeeting: (id, updates) => api.put(`/meetings/${id}`, updates),
  cancelMeeting: (id) => api.delete(`/meetings/${id}`),
};

export default meetingApi;
