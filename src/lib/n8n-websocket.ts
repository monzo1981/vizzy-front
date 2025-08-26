// lib/n8n-websocket.ts

export interface N8NUpdate {
  type: string;
  data: {
    message?: string;
    status?: 'processing' | 'completed' | 'error';
    progress?: number;
    visual?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any;
  };
  timestamp: string;
}

import { getAccessToken } from './auth';

export class N8NWebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private messageHandler: (update: N8NUpdate) => void;
  private connectionHandler?: (connected: boolean) => void;
  private isIntentionalDisconnect = false;
  private lastSuccessfulToken: string | null = null;
  
  constructor(
    onMessage: (update: N8NUpdate) => void,
    onConnectionChange?: (connected: boolean) => void
  ) {
    this.messageHandler = onMessage;
    this.connectionHandler = onConnectionChange;
    
    // Listen for token refresh events
    window.addEventListener('token-refreshed', this.handleTokenRefresh);
    
    // Listen for page visibility changes to handle tab switching
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private handleTokenRefresh = () => {
    console.log('[WebSocket] Token refreshed, reconnecting with new token...');
    this.reconnectWithNewToken();
  }
  
  private handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && !this.isConnected()) {
      console.log('[WebSocket] Page became visible, checking connection...');
      const currentToken = getAccessToken();
      
      // Only reconnect if we have a valid token and it's different from last used
      if (currentToken && currentToken !== this.lastSuccessfulToken) {
        console.log('[WebSocket] Token has changed, reconnecting...');
        this.reconnectWithNewToken();
      } else if (!this.ws && currentToken) {
        console.log('[WebSocket] No active connection, attempting to connect...');
        this.connect();
      }
    }
  }

  private reconnectWithNewToken(): void {
    // Reset reconnection attempts when we have a fresh token
    this.reconnectAttempts = 0;
    
    if (this.ws) {
      // Mark as intentional disconnect to avoid triggering auto-reconnect
      this.isIntentionalDisconnect = true;
      
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close(1000, 'Reconnecting with new token');
      } else {
        // If WebSocket is not open, just nullify it
        this.ws = null;
      }
      
      // Small delay to ensure clean disconnect
      setTimeout(() => {
        this.isIntentionalDisconnect = false;
        this.connect();
      }, 100);
    } else {
      this.connect();
    }
  }

  reconnect(): void {
    console.log('[WebSocket] Manual reconnect requested');
    this.reconnectWithNewToken();
  }
  
  connect(): void {
    const token = getAccessToken();
    
    if (!token) {
      console.error('[WebSocket] ❌ No authentication token found');
      this.connectionHandler?.(false);
      return;
    }
    
    // Check if we're already connected with this token
    if (this.ws?.readyState === WebSocket.OPEN && this.lastSuccessfulToken === token) {
      console.log('[WebSocket] Already connected with current token');
      return;
    }
    
    // Clean up existing connection if any
    if (this.ws) {
      this.isIntentionalDisconnect = true;
      this.ws.close();
      this.ws = null;
    }
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NEXT_PUBLIC_WS_URL || 'localhost:8000';
    const wsUrl = `${protocol}//${host}/ws/n8n-updates/?token=${token}`;
    
    console.log('[WebSocket] 🔌 Connecting to WebSocket...');
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('[WebSocket] ✅ Connected to Vizzy updates');
        this.reconnectAttempts = 0;
        this.lastSuccessfulToken = token;
        this.isIntentionalDisconnect = false;
        this.connectionHandler?.(true);
        this.startPingPong();
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'connection':
              console.log('[WebSocket] 🤝 Connection confirmed:', data.message);
              break;
              
            case 'pong':
              // Silently handle pong
              break;
              
            case 'n8n_update':
              console.log('[WebSocket] 📨 N8N update received:', data);
              this.messageHandler(data);
              break;
              
            default:
              console.log('[WebSocket] Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('[WebSocket] ❌ Error:', error);
        this.connectionHandler?.(false);
      };
      
      this.ws.onclose = (event) => {
        console.log(`[WebSocket] 🔌 Disconnected: Code=${event.code}, Reason=${event.reason}`);
        this.connectionHandler?.(false);
        this.stopPingPong();
        this.lastSuccessfulToken = null;
        
        // Only attempt reconnect if:
        // 1. It wasn't an intentional disconnect
        // 2. It wasn't a normal close (1000)
        // 3. We haven't exceeded max attempts
        if (!this.isIntentionalDisconnect && event.code !== 1000) {
          // Check if it's an auth error (usually 1006 or 403-related)
          if (event.code === 1006 || event.reason?.includes('403')) {
            console.log('[WebSocket] Authentication error detected, waiting for token refresh...');
            // Don't attempt immediate reconnect for auth errors
            // The token refresh system will trigger reconnection
          } else {
            // For other errors, attempt reconnection with backoff
            this.attemptReconnect();
          }
        }
        
        this.isIntentionalDisconnect = false;
      };
      
    } catch (error) {
      console.error('[WebSocket] Failed to create WebSocket:', error);
      this.connectionHandler?.(false);
    }
  }
  
  private startPingPong(): void {
    this.stopPingPong(); // Clear any existing interval
    
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'ping',
          timestamp: new Date().toISOString()
        }));
      }
    }, 30000); // Ping every 30 seconds
  }
  
  private stopPingPong(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
  
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] ❌ Max reconnection attempts reached');
      return;
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    // Exponential backoff with jitter
    const baseDelay = 1000;
    const maxDelay = 30000;
    const delay = Math.min(
      baseDelay * Math.pow(2, this.reconnectAttempts) + Math.random() * 1000,
      maxDelay
    );
    
    this.reconnectAttempts++;
    
    console.log(`[WebSocket] 🔄 Reconnecting in ${Math.round(delay / 1000)}s... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      
      // Check if we have a valid token before reconnecting
      const token = getAccessToken();
      if (token) {
        this.connect();
      } else {
        console.log('[WebSocket] No valid token available, waiting for authentication...');
      }
    }, delay);
  }
  
  disconnect(): void {
    console.log('[WebSocket] 👋 Disconnecting WebSocket');
    
    this.isIntentionalDisconnect = true;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.stopPingPong();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.connectionHandler?.(false);
  }

  cleanup(): void {
    console.log('[WebSocket] 🧹 Cleaning up WebSocket client');
    
    // Remove event listeners
    window.removeEventListener('token-refreshed', this.handleTokenRefresh);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    
    // Disconnect WebSocket
    this.disconnect();
  }
  
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
  
  getReadyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
  
  // Get connection stats for debugging
  getConnectionStats() {
    return {
      connected: this.isConnected(),
      readyState: this.getReadyState(),
      reconnectAttempts: this.reconnectAttempts,
      hasToken: !!getAccessToken(),
      lastSuccessfulToken: !!this.lastSuccessfulToken
    };
  }
}