import axios from 'axios';

/**
 * Base API URL — sourced from Vite env or relative /api path.
 *
 * - Local dev : Vite proxy rewrites /api/* → http://localhost:8000/* (see vite.config.js)
 * - Production: Vercel routes /api/* → api/index.py serverless function
 *
 * Do NOT hard-code localhost here; it would break the Vercel deployment.
 */
export const API_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Returns Axios config with Authorization header.
 * @param {string} token - JWT bearer token
 */
export function authHeaders(token) {
    return { headers: { Authorization: `Bearer ${token}` } };
}

/**
 * Pre-configured Axios instance with base URL.
 * Use `api.get('/endpoint', authConfig(token))` pattern.
 */
const api = axios.create({ baseURL: API_URL });

export default api;

/**
 * Safely parse JSON with a fallback default.
 * Avoids repetitive try/catch blocks in components.
 * @param {string} value
 * @param {any} defaultValue
 */
export function safeJsonParse(value, defaultValue) {
    if (!value) return defaultValue;
    try {
        const parsed = JSON.parse(value);
        return parsed;
    } catch {
        return defaultValue;
    }
}
