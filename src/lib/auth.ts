// Authentication utilities
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  user_type: string;
  first_name: string;
  last_name: string;
}

interface LoginResponse {
  success: boolean;
  data?: {
    user: User;
    tokens: {
      access: string;
      refresh: string;
    };
  };
  error?: string;
}

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Store tokens in localStorage
      localStorage.setItem('access_token', data.data.tokens.access);
      localStorage.setItem('refresh_token', data.data.tokens.refresh);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      
      return { success: true, data: data.data };
    } else {
      return { success: false, error: data.message || 'Login failed' };
    }
  } catch {
    return { success: false, error: 'Network error' };
  }
};

export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

export const getAccessToken = (): string | null => {
  return localStorage.getItem('access_token');
};

export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};

export const refreshToken = async (): Promise<boolean> => {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    logout();
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('access_token', data.access);
      return true;
    } else {
      logout();
      return false;
    }
  } catch (error) {
    logout();
    return false;
  }
};
