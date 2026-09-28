import api from './index';

export const getLibrary = (status) =>
  api.get('/library', { params: status ? { status } : {} });

export const addBookToLibrary = (workId, status) =>
  api.post('/library', { work_id: workId, status });

export const updateBook = (id, payload) => api.patch(`/library/${id}`, payload);

export const deleteBook = (id) => api.delete(`/library/${id}`);
