
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
    
    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    // Read text first to avoid "Unexpected token..." errors on non-JSON responses
    text = await response.text();

    // Try to parse JSON if text exists
    let data: any = {};
    if (text && text.trim().length > 0) {
      try {
        data = JSON.parse(text);
      } catch (e) {
        // If parsing fails but response was not OK, we use the text as error message below
        // If response was OK but parsing failed, that's a real issue
        if (response.ok) {
           console.error(`JSON Parse Error for ${endpoint}. Raw response:`, text);
           throw new Error('Received invalid JSON from server');
        }
      }
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || `Request failed with status ${response.status}: ${text.substring(0, 100)}`);
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
        // Fallback for dev mode without backend
        return { authenticated: false };
      }
    },
    
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
    getAll: async () => {
      try {
        return await fetchClient<Attraction[]>('/api/attractions');
      } catch (e) {
        console.warn('Backend API unavailable, falling back to local data.');
        // Fallback to local constants if API fails (e.g., 404 in dev)
        return ATTRACTIONS;
      }
    },
    
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
    getAll: () => fetchClient<{ favorites: string[], notes?: Record<string, string> }>('/api/favorites'),
    
    add: (attractionId: string, note?: string) => 
      fetchClient<{ success: boolean }>('/api/favorites', {
        method: 'POST',
        body: JSON.stringify({ attractionId, note }),
      }),
    
    updateNote: (attractionId: string, note: string) => 
      fetchClient<{ success: boolean }>('/api/favorites', {
        method: 'PUT',
        body: JSON.stringify({ attractionId, note }),
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
