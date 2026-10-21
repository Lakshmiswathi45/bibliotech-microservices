import http from './http.js';

export const getFineForRental = (rentalId) => http.get(`/fines/${rentalId}`).then(({ data }) => data);
export const getAllFines = () => http.get('/fines').then(({ data }) => data);
export const getFinesForUser = (userId) => http.get(`/fines/user/${userId}`).then(({ data }) => data);
export const markDemoPaymentPaid = (rentalId) => http.post(`/fines/${rentalId}/demo-payment`).then(({ data }) => data);