import http from './http.js';

export const getBooks = () => http.get('/books').then(({ data }) => data);
export const getBook = (id) => http.get(`/books/${id}`).then(({ data }) => data);
export const createBook = (book) => http.post('/books', book).then(({ data }) => data);
export const updateBook = (id, book) => http.put(`/books/${id}`, book).then(({ data }) => data);
export const deleteBook = (id) => http.delete(`/books/${id}`);
export const adjustAvailability = (id, change) => http.post(`/books/${id}/availability`, null, { params: { change } }).then(({ data }) => data);