import http from './http.js';

export const register = (details) => http.post('/auth/register', details);
export const login = (credentials) => http.post('/auth/login', credentials).then(({ data }) => data);
export const getProfile = () => http.get('/auth/me').then(({ data }) => data);
export const updateProfile = (details) => http.put('/auth/me', details).then(({ data }) => data);
export const changePassword = (passwords) => http.post('/auth/change-password', passwords);
export const getUsers = () => http.get('/auth/users').then(({ data }) => data);