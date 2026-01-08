
import { Attraction, AuthResponse, User, Schedule } from '../types';
import { ATTRACTIONS } from '../constants';

const fetchClient = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const defaultHeaders = { 'Content-Type': 'application/json' };
  const config = { ...options, headers: { ...defaultHeaders, ...options.headers } };
  try {
    const response = await fetch(endpoint, config);
    if (response.status === 204) return {} as T;
    const text = await response.text();
    let data: any = {};
    if (text) {
      try { data = JSON.parse(text); } catch (e) { if (response.ok) throw new Error('Invalid JSON'); }
    }
    if (!response.ok) throw new Error(data.message || data.error || `Failed ${response.status}`);
    return data as T;
  } catch (error: any) {
    console.warn(`API Error (${endpoint}):`, error.message);
    throw error;
  }
};

export const api = {
  auth: {
    me: async () => { try { return await fetchClient<{ authenticated: boolean; user?: User }>('/api/me'); } catch (e) { return { authenticated: false }; } },
    login: (credentials: any) => fetchClient<AuthResponse>('/api/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (data: any) => fetchClient<AuthResponse>('/api/register', { method: 'POST', body: JSON.stringify(data) }),
    logout: () => fetchClient<{ success: boolean }>('/api/logout', { method: 'POST' }),
  },
  stats: {
    getViews: () => fetchClient<{ views: number }>('/api/stats'),
    incrementViews: () => fetchClient<{ views: number }>('/api/stats', { method: 'POST' }),
  },
  attractions: {
    getAll: async () => { try { return await fetchClient<Attraction[]>('/api/attractions'); } catch (e) { return ATTRACTIONS; } },
    create: (data: any) => fetchClient<any>('/api/attractions', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchClient<any>(`/api/attractions?id=${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchClient<any>(`/api/attractions?id=${id}`, { method: 'DELETE' }),
  },
  favorites: {
    getAll: () => fetchClient<{ favorites: string[], notes?: Record<string, string> }>('/api/favorites'),
    add: (attractionId: string, note?: string) => fetchClient<any>('/api/favorites', { method: 'POST', body: JSON.stringify({ attractionId, note }) }),
    updateNote: (attractionId: string, note: string) => fetchClient<any>('/api/favorites', { method: 'PUT', body: JSON.stringify({ attractionId, note }) }),
    remove: (attractionId: string) => fetchClient<any>('/api/favorites', { method: 'DELETE', body: JSON.stringify({ attractionId }) }),
  },
  // Fix: Add schedules API definition to support旅程记事 functionality
  schedules: {
    getAll: () => fetchClient<Schedule[]>('/api/schedules'),
    create: (data: any) => fetchClient<any>('/api/schedules', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: number) => fetchClient<any>(`/api/schedules?id=${id}`, { method: 'DELETE' }),
  },
  feedback: {
    submit: (content: string) => fetchClient<any>('/api/feedback', { method: 'POST', body: JSON.stringify({ content }) }),
  },
};
