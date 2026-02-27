import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email, password) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    const response = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }
    return response.data;
  },
  
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },
};

export const treeService = {
  getTrees: async () => {
    const response = await api.get('/trees/');
    return response.data;
  },
  
  getTree: async (treeId) => {
    const response = await api.get(`/trees/${treeId}`);
    return response.data;
  },
};

export const skillService = {
  getSkillsByTree: async (treeId) => {
    const response = await api.get(`/skills/tree/${treeId}`);
    return response.data;
  },
  
  createSkill: async (skillData) => {
    const response = await api.post('/skills/', skillData);
    return response.data;
  },
  
  updateSkill: async (skillId, skillData) => {
    const response = await api.put(`/skills/${skillId}`, skillData);
    return response.data;
  },
  
  deleteSkill: async (skillId) => {
    const response = await api.delete(`/skills/${skillId}`);
    return response.data;
  },
  
  createDependency: async (dependencyData) => {
    const response = await api.post('/skills/dependencies', dependencyData);
    return response.data;
  },
};

export const tokenService = {
  submitToken: async (tokenString) => {
    const response = await api.post('/tokens/submit', { token_string: tokenString });
    return response.data;
  },
  
  createToken: async (tokenData) => {
    const response = await api.post('/tokens/', tokenData);
    return response.data;
  },
  
  getTokens: async () => {
    const response = await api.get('/tokens/');
    return response.data;
  },
  
  getTokensBySkill: async (skillId) => {
    const response = await api.get(`/tokens/skill/${skillId}`);
    return response.data;
  },
};

export const userService = {
  getProgress: async () => {
    const response = await api.get('/users/progress');
    return response.data;
  },
  
  getUsers: async () => {
    const response = await api.get('/users/');
    return response.data;
  },
  
  getUserProgress: async (userId) => {
    const response = await api.get(`/users/${userId}/progress`);
    return response.data;
  },
};

export const classService = {
  getClasses: async () => {
    const response = await api.get('/classes/');
    return response.data;
  },
  
  createClass: async (classData) => {
    const response = await api.post('/classes/', classData);
    return response.data;
  },
  
  deleteClass: async (classId) => {
    const response = await api.delete(`/classes/${classId}`);
    return response.data;
  },
};

export default api;
