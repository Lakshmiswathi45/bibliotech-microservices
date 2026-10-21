import http from './http.js';

export const getRentals = () => http.get('/rentals').then(({ data }) => data);
export const getRentalsForUser = (userId) => http.get(`/rentals/user/${userId}`).then(({ data }) => data);
export const borrowBook = (userId, bookId, loanDays = 14) => http.post('/rentals/borrow', { userId, bookId, loanDays }).then(({ data }) => data);
export const returnBook = (rentalId) => http.post(`/rentals/return/${rentalId}`).then(({ data }) => data);