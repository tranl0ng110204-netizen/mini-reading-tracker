import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api`,
  timeout: 15000,
});

// Backend luon tra ve { success, data, message, errors }
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      (error.code === 'ECONNABORTED'
        ? 'Yeu cau qua thoi gian, vui long thu lai'
        : 'Khong the ket noi den server');
    return Promise.reject(new Error(message));
  }
);

export default api;
