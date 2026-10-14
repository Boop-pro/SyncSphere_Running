import api from './api';

export const notificationApi = {
  getNotifications: () => api.get('/notifications'),
  createReminder: (data) => api.post('/notifications/reminders', data),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/mark-all-read'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
};

export default notificationApi;
