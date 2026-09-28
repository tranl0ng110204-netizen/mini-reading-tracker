import api from './index';

export const searchBooks = (keyword, page = 1) =>
  api.get('/books/search', { params: { q: keyword, page } });

export const getBookDetail = (workId) => api.get(`/books/${workId}`);
