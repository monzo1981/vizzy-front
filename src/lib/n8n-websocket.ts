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

export class N8NWebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private messageHandler: (update: N8NUpdate) => void;
  private connectionHandler?: (connected: boolean) => void;
  
  constructor(
    onMessage: (update: N8NUpdate) => void,
    onConnectionChange?: (connected: boolean) => void
  ) {
    this.messageHandler = onMessage;
    this.connectionHandler = onConnectionChange;
  }
  
  connect(): void {
    // Get JWT token from localStorage
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      console.error('❌ No authentication token found');
      return;
    }
    
    // Determine WebSocket URL (use wss:// for production)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NEXT_PUBLIC_WS_URL || 'localhost:8000';
    const wsUrl = `${protocol}//${host}/ws/n8n-updates/?token=${token}`;
    
    console.log('🔌 Connecting to WebSocket:', wsUrl);
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket connected to Vizzy updates');
        this.reconnectAttempts = 0;
        this.connectionHandler?.(true);
        this.startPingPong();
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', data);
          
          // Handle different message types
          switch (data.type) {
            case 'connection':
              console.log('🤝 Connection confirmed:', data.message);
              break;
              
            case 'pong':
              // Ping response, connection is alive
              break;
              
            case 'n8n_update':
              // N8N update message, pass to handler
              this.messageHandler(data);
              break;
              
            default:
              console.log('Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.connectionHandler?.(false);
      };
      
      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        this.connectionHandler?.(false);
        this.stopPingPong();
        this.attemptReconnect();
      };
      
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.connectionHandler?.(false);
    }
  }
  
  private startPingPong(): void {
    // Send ping every 30 seconds to keep connection alive
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'ping',
          timestamp: new Date().toISOString()
        }));
      }
    }, 30000);
  }
  
  private stopPingPong(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
  
  private attemptReconnect(): void {
    // Don't reconnect if manually disconnected or max attempts reached
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }
    
    // Clear any existing reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    // Calculate delay with exponential backoff
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;
    
    console.log(`🔄 Reconnecting in ${delay / 1000} seconds... (Attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }
  
  disconnect(): void {
    console.log('👋 Disconnecting WebSocket');
    
    // Clear timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.stopPingPong();
    
    // Close WebSocket
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.connectionHandler?.(false);
  }
  
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
  
  getReadyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
}