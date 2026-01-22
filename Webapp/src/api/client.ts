import axios from 'axios';

export const api = axios.create({
    baseURL: 'http://localhost:3000',
    withCredentials: true // Important for HttpOnly cookies
});

// Interceptor for 401s handled in AuthContext or here.
// For simplicity, let's keep it here if we can access store, or just basic setup.
