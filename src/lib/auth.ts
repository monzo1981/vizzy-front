// Authentication utilities with automatic token refresh
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone_number: string;  // Required phone number field
  company_name: string;
  industry: string;
}

export interface User {
  id: string;
  email: string;
  user_type: string;
  first_name: string;
  last_name: string;
  email_verified: boolean;
  phone_number?: string | null;  // Phone number in user data
  profile_picture_url?: string | null;
  company_profile?: {
    company_name: string;
    industry: string;
    company_website_url: string;
    job_title: string;
  } | null;
}

interface AuthResponse {
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

// Token refresh manager singleton
class TokenRefreshManager {
  private refreshTimer: NodeJS.Timeout | null = null;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];
  
  constructor() {
    // Start monitoring on page load if user is logged in
    if (typeof window !== 'undefined') {
      this.initializeOnPageLoad();
      
      // Listen for storage events to sync across tabs
      window.addEventListener('storage', this.handleStorageChange);
      
      // Cleanup on page unload
      window.addEventListener('beforeunload', () => this.cleanup());
    }
  }
  
  private initializeOnPageLoad() {
    const token = localStorage.getItem('access_token');
    if (token) {
      console.log('[TokenRefresh] Initializing auto-refresh on page load');
      this.scheduleRefresh(token);
    }
  }
  
  private handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'access_token' && e.newValue) {
      console.log('[TokenRefresh] Token updated in another tab, rescheduling refresh');
      this.scheduleRefresh(e.newValue);
    } else if (e.key === 'access_token' && !e.newValue) {
      console.log('[TokenRefresh] Token removed in another tab, stopping refresh');
      this.stopRefreshCycle();
    }
  };
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private parseJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('[TokenRefresh] Failed to parse JWT:', error);
      return null;
    }
  }
  
  scheduleRefresh(token: string) {
    // Clear any existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    
    const payload = this.parseJwt(token);
    if (!payload || !payload.exp) {
      console.error('[TokenRefresh] Invalid token payload, cannot schedule refresh');
      return;
    }
    
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const timeUntilExpiry = expirationTime - currentTime;
    
    // Refresh 30 seconds before expiry (for 2-minute tokens, this means refresh at 1:30)
    const refreshTime = Math.max(timeUntilExpiry - 30000, 1000);
    
    if (refreshTime <= 1000) {
      console.log('[TokenRefresh] Token expires soon, refreshing immediately');
      this.executeRefresh();
    } else {
      const refreshInSeconds = Math.floor(refreshTime / 1000);
      console.log(`[TokenRefresh] Scheduled refresh in ${refreshInSeconds} seconds`);
      
      this.refreshTimer = setTimeout(() => {
        console.log('[TokenRefresh] Timer triggered, executing refresh');
        this.executeRefresh();
      }, refreshTime);
    }
  }
  
  private async executeRefresh() {
    if (this.isRefreshing) {
      console.log('[TokenRefresh] Already refreshing, skipping duplicate request');
      return;
    }
    
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      console.error('[TokenRefresh] No refresh token available');
      this.handleRefreshFailure();
      return;
    }
    
    this.isRefreshing = true;
    console.log('[TokenRefresh] Starting token refresh...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const newAccessToken = data.access;
        
        // Store new token
        localStorage.setItem('access_token', newAccessToken);
        
        // Notify all subscribers
        this.refreshSubscribers.forEach(callback => callback(newAccessToken));
        this.refreshSubscribers = [];
        
        // Dispatch event for WebSocket reconnection
        window.dispatchEvent(new Event('token-refreshed'));
        
        console.log('[TokenRefresh] Token refreshed successfully');
        
        // Schedule next refresh
        this.scheduleRefresh(newAccessToken);
      } else {
        console.error('[TokenRefresh] Refresh failed with status:', response.status);
        this.handleRefreshFailure();
      }
    } catch (error) {
      console.error('[TokenRefresh] Refresh failed with error:', error);
      this.handleRefreshFailure();
    } finally {
      this.isRefreshing = false;
    }
  }
  
  private handleRefreshFailure() {
    console.error('[TokenRefresh] Token refresh failed, logging out user');
    this.cleanup();
    logout();
    // Redirect to login page
    window.location.href = '/';
  }
  
  stopRefreshCycle() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
      console.log('[TokenRefresh] Refresh cycle stopped');
    }
  }
  
  cleanup() {
    this.stopRefreshCycle();
    this.refreshSubscribers = [];
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageChange);
    }
  }
  
  // Subscribe to token refresh events (for handling concurrent requests)
  subscribeToRefresh(callback: (token: string) => void) {
    this.refreshSubscribers.push(callback);
  }
}

// Create singleton instance
const tokenRefreshManager = new TokenRefreshManager();

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
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
      
      // Start automatic refresh cycle
      tokenRefreshManager.scheduleRefresh(data.data.tokens.access);
      
      return { success: true, data: data.data };
    } else {
      return { success: false, error: data.message || 'Login failed' };
    }
  } catch (error) {
    console.error('[Login] Network error:', error);
    return { success: false, error: 'Network error' };
  }
};

export const register = async (userData: RegisterData): Promise<AuthResponse> => {
  try {
    console.log('[Register] Sending registration data:', {
      ...userData,
      password: '[HIDDEN]' // Don't log the password
    });

    const response = await fetch(`${API_BASE_URL}/auth/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();
    console.log('[Register] Response received:', {
      ...data,
      data: data.data ? {
        ...data.data,
        tokens: data.data.tokens ? { access: '[HIDDEN]', refresh: '[HIDDEN]' } : undefined
      } : undefined
    });

    if (response.ok && data.success) {
      // Store tokens in localStorage
      localStorage.setItem('access_token', data.data.tokens.access);
      localStorage.setItem('refresh_token', data.data.tokens.refresh);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      
      // Start automatic refresh cycle
      tokenRefreshManager.scheduleRefresh(data.data.tokens.access);
      
      console.log('[Register] Registration successful, tokens stored');
      return { success: true, data: data.data };
    } else {
      console.error('[Register] Registration failed:', data);
      return { success: false, error: data.message || data.errors || 'Registration failed' };
    }
  } catch (error) {
    console.error('[Register] Network error:', error);
    return { success: false, error: 'Network error' };
  }
};

export const logout = () => {
  // Stop refresh cycle
  tokenRefreshManager.stopRefreshCycle();
  
  // Clear tokens
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  
  // Clear company profile cache
  localStorage.removeItem('company_profile');
  
  // Clear any cached user limits (should not be stored, but cleanup just in case)
  localStorage.removeItem('user_limits');
  
  console.log('[Auth] User logged out');
};

export const getAccessToken = (): string | null => {
  return localStorage.getItem('access_token');
};

export const getUser = (): User | null => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const updateUser = (updatedUser: User): void => {
  localStorage.setItem('user', JSON.stringify(updatedUser));
  // Clean up any old userData key for consistency
  localStorage.removeItem('userData');
};

export const isAuthenticated = (): boolean => {
  const token = getAccessToken();
  if (!token) return false;
  
  // Check if token is expired
  try {
    const payload = tokenRefreshManager['parseJwt'](token);
    if (payload && payload.exp) {
      const isExpired = Date.now() >= payload.exp * 1000;
      if (isExpired) {
        console.log('[Auth] Token is expired');
        return false;
      }
    }
  } catch (error) {
    console.error('[Auth] Error checking token expiration:', error);
  }
  
  return true;
};

export const refreshToken = async (): Promise<boolean> => {
  const refreshTokenValue = localStorage.getItem('refresh_token');
  if (!refreshTokenValue) {
    logout();
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshTokenValue }),
    });

    const data = await response.json();

    if (response.ok) {
      const newAccessToken = data.access;
      localStorage.setItem('access_token', newAccessToken);
      
      // Reschedule automatic refresh
      tokenRefreshManager.scheduleRefresh(newAccessToken);
      
      // Dispatch event for WebSocket reconnection
      window.dispatchEvent(new Event('token-refreshed'));
      
      return true;
    } else {
      logout();
      return false;
    }
  } catch (error) {
    console.error('[RefreshToken] Error:', error);
    logout();
    return false;
  }
};

// Google OAuth login function
export const googleLogin = async (googleToken: string): Promise<AuthResponse> => {
  try {
    console.log('[GoogleLogin] Sending token to backend:', googleToken.substring(0, 50) + '...');
    console.log('[GoogleLogin] API URL:', `${API_BASE_URL}/auth/google/`);
    
    const response = await fetch(`${API_BASE_URL}/auth/google/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: googleToken }),
    });

    console.log('[GoogleLogin] Response status:', response.status);
    const data = await response.json();
    console.log('[GoogleLogin] Response data:', data);

    if (response.ok && data.success) {
      // Store tokens in localStorage
      localStorage.setItem('access_token', data.data.tokens.access);
      localStorage.setItem('refresh_token', data.data.tokens.refresh);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      
      // Start automatic refresh cycle
      tokenRefreshManager.scheduleRefresh(data.data.tokens.access);
      
      return { success: true, data: data.data };
    } else {
      console.error('[GoogleLogin] Backend returned error:', data);
      return { success: false, error: data.message || 'Google login failed' };
    }
  } catch (error) {
    console.error('[GoogleLogin] Network error:', error);
    return { success: false, error: 'Network error' };
  }
};

// Export the manager for debugging purposes
export const getTokenRefreshManager = () => tokenRefreshManager;