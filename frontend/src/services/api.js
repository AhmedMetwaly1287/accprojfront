import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    'Content-Type': 'application/json',
    Authorization: localStorage.getItem('token')
  }
});

export default {
  getTasks: () => api.get('/tasks'),
  createTask: (task) => api.post('/tasks', task),
  updateTask: (id, update) => api.patch(`/tasks/${id}`, update),
  getEmployees: () => api.get('/employees'),
  // Add other API endpoints
};