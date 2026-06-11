import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password })
};

export const procesamientoAPI = {
  uploadContratantes: (files: FileList) => {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    return api.post('/procesamiento/upload-contratantes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  uploadRecaudaciones: (files: FileList) => {
    const formData = new FormData();
    let directoryName = '';
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const webkitRelativePath = (file as any).webkitRelativePath || '';
      if (i === 0 && webkitRelativePath) {
        directoryName = webkitRelativePath.split('/')[0];
      }
      formData.append('files', file);
      formData.append('paths', webkitRelativePath);
    }
    formData.append('directoryName', directoryName);
    return api.post('/procesamiento/upload-recaudaciones', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  setRecaudacionesDir: (directory: string) =>
    api.post('/procesamiento/set-recaudaciones-dir', { directory }),

  validateContratantesLoaded: () =>
    api.post('/procesamiento/validate-contratantes-loaded'),

  validateRecaudacionesLoaded: () =>
    api.post('/procesamiento/validate-recaudaciones-loaded'),

  procesarEnvio: () =>
    api.post('/procesamiento/procesar-envio'),

  getLogs: () =>
    api.get('/procesamiento/logs'),

  clearLogs: () =>
    api.delete('/procesamiento/logs'),

  reset: () =>
    api.post('/procesamiento/reset')
};

export default api;
