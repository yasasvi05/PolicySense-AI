export const USE_MOCK = String(import.meta.env.VITE_USE_MOCK ?? 'true') === 'true'
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')
