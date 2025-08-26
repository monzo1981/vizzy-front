import { getAccessToken, refreshToken, logout, isAuthenticated } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Queue for managing concurrent requests during token refresh
class RequestQueue {
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (token: string) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reject: (error: any) => void;
  }> = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach(prom => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token!);
      }
    });
    
    this.failedQueue = [];
  }

  async handleTokenRefresh(): Promise<string> {
    if (this.isRefreshing) {
      // If already refreshing, queue this request
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;

    try {
      const refreshed = await refreshToken();
      if (refreshed) {
        const newToken = getAccessToken();
        if (newToken) {
          this.processQueue(null, newToken);
          return newToken;
        }
      }
      
      throw new Error('Token refresh failed');
    } catch (error) {
      this.processQueue(error, null);
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }
}

const requestQueue = new RequestQueue();

export const fetchWithAuth = async (
  url: string, 
  options: RequestInit = {},
  retryCount = 0
): Promise<Response> => {
  // Check authentication before making request
  if (!isAuthenticated()) {
    console.log('[API] User not authenticated, redirecting to login');
    logout();
    window.location.href = '/login';
    throw new Error('User not authenticated');
  }

  const token = getAccessToken();
  
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Add request ID for debugging
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  headers.set('X-Request-Id', requestId);
  
  options.headers = headers;
  
  const fullUrl = `${API_BASE_URL}${url}`;
  
  console.log(`[API] Request ${requestId}: ${options.method || 'GET'} ${url}`);
  
  let response: Response;
  
  try {
    response = await fetch(fullUrl, options);
  } catch (error) {
    console.error(`[API] Network error for request ${requestId}:`, error);
    throw error;
  }
  
  // Handle 401 Unauthorized
  if (response.status === 401) {
    console.log(`[API] Request ${requestId} got 401, attempting token refresh...`);
    
    try {
      const newToken = await requestQueue.handleTokenRefresh();
      
      // Retry the request with new token
      headers.set('Authorization', `Bearer ${newToken}`);
      options.headers = headers;
      
      console.log(`[API] Retrying request ${requestId} with new token`);
      response = await fetch(fullUrl, options);
      
      // If still unauthorized after refresh, logout
      if (response.status === 401) {
        console.error(`[API] Request ${requestId} still unauthorized after refresh`);
        logout();
        window.location.href = '/login';
        throw new Error('Authentication failed');
      }
    } catch (refreshError) {
      console.error(`[API] Token refresh failed for request ${requestId}:`, refreshError);
      logout();
      window.location.href = '/login';
      throw refreshError;
    }
  }
  
  // Handle 403 Forbidden (expired token that somehow passed initial check)
  if (response.status === 403) {
    console.log(`[API] Request ${requestId} got 403, token might be expired`);
    
    if (retryCount === 0) {
      // Try refreshing token once
      try {
        const newToken = await requestQueue.handleTokenRefresh();
        
        // Retry with new token
        return fetchWithAuth(url, options, retryCount + 1);
      } catch (error) {
        console.error(`[API] Unable to recover from 403:`, error);
        logout();
        window.location.href = '/login';
        throw error;
      }
    }
  }
  
  // Log response status for debugging
  console.log(`[API] Request ${requestId} completed with status ${response.status}`);
  
  return response;
};

// Helper function for JSON requests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetchJSON = async <T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  const response = await fetchWithAuth(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }
  
  return response.json();
};

// Helper function for file uploads
export const uploadFile = async (
  url: string,
  file: File,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  additionalData?: Record<string, any>
): Promise<Response> => {
  const formData = new FormData();
  formData.append('file', file);
  
  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }
  
  return fetchWithAuth(url, {
    method: 'POST',
    body: formData,
  });
};

// Export request queue for debugging
export const getRequestQueue = () => requestQueue;