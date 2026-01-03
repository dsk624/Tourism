
import { Attraction, AuthResponse, User } from '../types';
import { ATTRACTIONS } from '../constants';

// Generic API Client Wrapper
const fetchClient = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  let response: Response | undefined;
  let text = '';

  try {
    response = await fetch(endpoint, config);
    
    if (response.status === 204) {
      return {} as T;
    }

    text = await response.text();

    let data: any = {};
    if (text && text.trim().length > 0) {
      try {
        data = JSON.parse(text);
      } catch (e) {
        if (response.ok) {
           throw new Error('Received invalid JSON from server');
        }
      }
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || `Request failed with status ${response.status}`);
    }

    return data as T;
  } catch (error: any) {
    console.warn(`API Error (${endpoint}):`, error.message);
    throw error;
  }
};

export const api = {
  // --- Authentication ---
  auth: {
    me: async () => {
      try {
        return await fetchClient<{ authenticated: boolean; user?: User }>('/api/me');
      } catch (e) {
        return { authenticated: false };
      }
    },
    login: (credentials: any) => fetchClient<AuthResponse>('/api/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (data: any) => fetchClient<AuthResponse>('/api/register', { method: 'POST', body: JSON.stringify(data) }),
    logout: () => fetchClient<{ success: boolean }>('/api/logout', { method: 'POST' }),
  },

  // --- Stats ---
  stats: {
    getViews: () => fetchClient<{ views: number }>('/api/stats'),
    incrementViews: () => fetchClient<{ views: number }>('/api/stats', { method: 'POST' }),
  },

  // --- Attractions ---
  attractions: {
    getAll: async () => {
      try {
        return await fetchClient<Attraction[]>('/api/attractions');
      } catch (e) {
        return ATTRACTIONS;
      }
    },
    getById: (id: string) => fetchClient<Attraction>(`/api/attractions?id=${id}`),
    create: (data: Partial<Attraction>) => fetchClient<{ success: boolean; id: string }>('/api/attractions', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Attraction>) => fetchClient<{ success: boolean }>('/api/attractions?id=' + id, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchClient<{ success: boolean }>('/api/attractions?id=' + id, { method: 'DELETE' }),
  },

  // --- Favorites ---
  favorites: {
    getAll: () => fetchClient<{ favorites: string[], notes?: Record<string, string> }>('/api/favorites'),
    add: (attractionId: string, note?: string) => fetchClient<{ success: boolean }>('/api/favorites', { method: 'POST', body: JSON.stringify({ attractionId, note }) }),
    updateNote: (attractionId: string, note: string) => fetchClient<{ success: boolean }>('/api/favorites', { method: 'PUT', body: JSON.stringify({ attractionId, note }) }),
    remove: (attractionId: string) => fetchClient<{ success: boolean }>('/api/favorites', { method: 'DELETE', body: JSON.stringify({ attractionId }) }),
  },

  // --- Feedback ---
  feedback: {
    submit: (content: string) => fetchClient<{ success: boolean }>('/api/feedback', { method: 'POST', body: JSON.stringify({ content }) }),
  },
};
