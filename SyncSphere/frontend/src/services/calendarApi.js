import api from './api';

export const calendarApi = {
  getPersonalEvents: () => api.get('/calendar/personal'),
  createPersonalEvent: (eventData) => api.post('/calendar/personal', eventData),
  updatePersonalEvent: (id, updates) => api.put(`/calendar/personal/${id}`, updates),
  deletePersonalEvent: (id) => api.delete(`/calendar/personal/${id}`),
  getSharedCalendarEvents: (teamId) => api.get(`/calendar/shared/${teamId}`),
};

export default calendarApi;
