import api from './api';

export const discussionApi = {
  getDiscussionBoard: (projectId) => api.get(`/discussions/projects/${projectId}`),
  createPost: (projectId, postData) => api.post(`/discussions/projects/${projectId}`, postData),
  updatePost: (postId, updates) => api.put(`/discussions/${postId}`, updates),
  deletePost: (postId) => api.delete(`/discussions/${postId}`),
};

export default discussionApi;
