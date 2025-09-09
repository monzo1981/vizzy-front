// Google OAuth utilities
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleInitConfig) => void;
          renderButton: (element: HTMLElement, config: GoogleButtonConfig) => void;
          prompt: () => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

interface GoogleInitConfig {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
}

interface GoogleButtonConfig {
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'sign_in_with' | 'sign_up_with' | 'continue_with' | 'sign_in';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: string;
  locale?: string;
}

interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
}

export interface GoogleTokenPayload {
  iss: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  iat: number;
  exp: number;
}

export class GoogleAuthService {
  private static instance: GoogleAuthService;
  private initialized = false;

  private constructor() {}

  public static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Google Auth can only be initialized in browser environment'));
        return;
      }

      // Check if Google Identity Services script is already loaded
      if (window.google?.accounts?.id) {
        this.initialized = true;
        resolve();
        return;
      }

      // Load Google Identity Services script
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        // Wait a bit for the library to be fully available
        setTimeout(() => {
          if (window.google?.accounts?.id) {
            this.initialized = true;
            resolve();
          } else {
            reject(new Error('Google Identity Services failed to load'));
          }
        }, 100);
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Google Identity Services'));
      };

      document.head.appendChild(script);
    });
  }

  public async signInWithPopup(): Promise<GoogleTokenPayload & { credential: string }> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      if (!window.google?.accounts?.id) {
        reject(new Error('Google Identity Services not available'));
        return;
      }

      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) {
        reject(new Error('Google Client ID not configured'));
        return;
      }

    console.log('[GoogleAuth] Initializing with client ID:', clientId);
    console.log('[GoogleAuth] Current origin:', window.location.origin);
    
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: GoogleCredentialResponse) => {
        try {
          console.log('[GoogleAuth] Received response from Google');
          const payload = this.parseJwtToken(response.credential);
          resolve({ ...payload, credential: response.credential });
        } catch (error) {
          console.error('[GoogleAuth] Error parsing token:', error);
          reject(error);
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });      // Trigger the sign-in flow
      window.google.accounts.id.prompt();
    });
  }

  public renderSignInButton(
    element: HTMLElement,
    callback: (payload: GoogleTokenPayload & { credential: string }) => void,
    config: Partial<GoogleButtonConfig> = {}
  ): void {
    if (!this.initialized || !window.google?.accounts?.id) {
      console.error('Google Identity Services not initialized');
      return;
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error('Google Client ID not configured');
      return;
    }

    console.log('[GoogleAuth] Rendering button with client ID:', clientId);
    console.log('[GoogleAuth] Current origin:', window.location.origin);
    
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: GoogleCredentialResponse) => {
        try {
          console.log('[GoogleAuth] Button callback received response');
          const payload = this.parseJwtToken(response.credential);
          callback({ ...payload, credential: response.credential });
        } catch (error) {
          console.error('Error parsing Google token:', error);
        }
      },
    });

    const defaultConfig: GoogleButtonConfig = {
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width: '100%',
      ...config,
    };

    window.google.accounts.id.renderButton(element, defaultConfig);
  }

  private parseJwtToken(token: string): GoogleTokenPayload {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error('Invalid JWT token from Google');
    }
  }

  public async signOut(): Promise<void> {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
  }
}

export const googleAuth = GoogleAuthService.getInstance();
