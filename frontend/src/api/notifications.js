import http from './http.js';

export const getNotificationsForUser = (userId) => http.get(`/notifications/user/${userId}`).then(({ data }) => data);