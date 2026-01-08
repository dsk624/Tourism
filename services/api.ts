
import { Attraction, AuthResponse, User, Schedule } from '../types';
import { ATTRACTIONS } from '../constants';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FavoriteItem extends Attraction {
  note?: string;
}

export interface Notification {
  id: number;
  content: string;
  is_active: number;
  priority: number;
  created_at: string;
}

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
  notifications: {
    getActive: () => fetchClient<Notification[]>('/api/notifications'),
    getAll: () => fetchClient<Notification[]>('/api/notifications?all=true'),
    create: (data: { content: string, priority?: number }) => fetchClient<any>('/api/notifications', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: { is_active: number, priority: number }) => fetchClient<any>(`/api/notifications?id=${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchClient<any>(`/api/notifications?id=${id}`, { method: 'DELETE' }),
  },
  attractions: {
    getAll: async (params: { page?: number, limit?: number, province?: string, search?: string } = {}) => {
      const query = new URLSearchParams();
      if (params.page) query.append('page', params.page.toString());
      if (params.limit) query.append('limit', params.limit.toString());
      if (params.province) query.append('province', params.province);
      if (params.search) query.append('search', params.search);
      
      try {
        return await fetchClient<PaginatedResponse<Attraction>>(`/api/attractions?${query.toString()}`);
      } catch (e) {
        return { data: ATTRACTIONS, total: ATTRACTIONS.length, page: 1, limit: 9, totalPages: 1 };
      }
    },
    create: (data: any) => fetchClient<any>('/api/attractions', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchClient<any>(`/api/attractions?id=${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchClient<any>(`/api/attractions?id=${id}`, { method: 'DELETE' }),
  },
  favorites: {
    getAll: () => fetchClient<FavoriteItem[]>('/api/favorites'),
    add: (attractionId: string, note?: string) => fetchClient<any>('/api/favorites', { method: 'POST', body: JSON.stringify({ attractionId, note }) }),
    updateNote: (attractionId: string, note: string) => fetchClient<any>('/api/favorites', { method: 'PUT', body: JSON.stringify({ attractionId, note }) }),
    remove: (attractionId: string) => fetchClient<any>('/api/favorites', { method: 'DELETE', body: JSON.stringify({ attractionId }) }),
  },
  schedules: {
    getAll: () => fetchClient<Schedule[]>('/api/schedules'),
    create: (data: any) => fetchClient<any>('/api/schedules', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: number) => fetchClient<any>(`/api/schedules?id=${id}`, { method: 'DELETE' }),
  },
  feedback: {
    submit: (content: string) => fetchClient<any>('/api/feedback', { method: 'POST', body: JSON.stringify({ content }) }),
    getAll: (page: number = 1, limit: number = 9) => fetchClient<PaginatedResponse<{ content: string, created_at: string }>>(`/api/feedback?page=${page}&limit=${limit}`),
  },
};
