import api from './api';

export const taskApi = {
  getTasks: (projectId) => api.get(`/tasks?projectId=${projectId}`),
  getTaskById: (id) => api.get(`/tasks/${id}`),
  createTask: (data) => api.post('/tasks', data),
  updateTask: (id, updates) => api.put(`/tasks/${id}`, updates),
  updateTaskStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }),
  deleteTask: (id) => api.delete(`/tasks/${id}`),

  // Comments
  addComment: (taskId, text) => api.post(`/tasks/${taskId}/comments`, { text }),

  // Attachments
  uploadAttachment: (taskId, formData) =>
    api.post(`/tasks/${taskId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  deleteAttachment: (taskId, attachmentId) =>
    api.delete(`/tasks/${taskId}/attachments/${attachmentId}`),
};

export default taskApi;
