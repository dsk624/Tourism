import { Attraction, AuthResponse, User } from '../types';

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

  try {
    const response = await fetch(endpoint, config);
    
    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error: any) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

export const api = {
  // --- Authentication ---
  auth: {
    me: () => fetchClient<{ authenticated: boolean; user?: User }>('/api/me'),
    
    login: (credentials: { username?: string; email?: string; password: string; fingerprint?: string; rememberMe?: boolean }) => 
      fetchClient<AuthResponse>('/api/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),

    register: (data: { username: string; password: string; fingerprint?: string; deviceName?: string; email?: string }) => 
      fetchClient<AuthResponse>('/api/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    logout: () => fetchClient<{ success: boolean }>('/api/logout', { method: 'POST' }),
  },

  // --- Attractions ---
  attractions: {
    getAll: () => fetchClient<Attraction[]>('/api/attractions'),
    
    getById: (id: string) => fetchClient<Attraction>(`/api/attractions?id=${id}`),
    
    create: (data: Partial<Attraction>) => 
      fetchClient<{ success: boolean; id: string }>('/api/attractions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    update: (id: string, data: Partial<Attraction>) => 
      fetchClient<{ success: boolean }>('/api/attractions?id=' + id, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    delete: (id: string) => 
      fetchClient<{ success: boolean }>('/api/attractions?id=' + id, {
        method: 'DELETE',
      }),
  },

  // --- Favorites ---
  favorites: {
    getAll: () => fetchClient<{ favorites: string[] }>('/api/favorites'),
    
    add: (attractionId: string) => 
      fetchClient<{ success: boolean }>('/api/favorites', {
        method: 'POST',
        body: JSON.stringify({ attractionId }),
      }),
    
    remove: (attractionId: string) => 
      fetchClient<{ success: boolean }>('/api/favorites', {
        method: 'DELETE',
        body: JSON.stringify({ attractionId }),
      }),
  },

  // --- Feedback ---
  feedback: {
    submit: (content: string) => 
      fetchClient<{ success: boolean }>('/api/feedback', {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
  },
};
