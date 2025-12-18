// api.ts
import axios from 'axios';

const API_BASE_URL = 'https://nonimpregnated-turner-acknowledgingly.ngrok-free.dev';

let accessToken: string | null = null;

export const setAccessToken = (token: string) => {
    accessToken = token;
};

const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use(config => {
    if (accessToken) {
        config.headers!['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
});

export default api;