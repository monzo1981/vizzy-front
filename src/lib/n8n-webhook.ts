// lib/n8n-webhook.ts
// Direct communication with N8N webhook - no backend needed

interface N8NRequest {
  message?: string;
  audio_data?: string;
  image_data?: string;
  user_id: string;
  user_email?: string;
  timestamp: string;
}

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

interface N8NResponse {
  response?: string;
  output?: string;
  visual?: string;
  images?: string[];
  error?: string;
  service_type?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export class N8NWebhook {
  private webhookUrl: string;
  private userId: string;
  private userEmail: string;

  constructor(webhookUrl: string = 'https://monzology.app.n8n.cloud/webhook-test/2fe03fcd-7ff3-4a55-9d38-064722b844ab', userId?: string, userEmail?: string) {
    this.webhookUrl = webhookUrl;
    // Get user info from localStorage if not provided
    if (userId) {
      this.userId = userId;
      this.userEmail = userEmail || '';
    } else {
      const user = localStorage.getItem('user');
      const userData = user ? JSON.parse(user) : null;
      this.userId = userData?.id || 'anonymous';
      this.userEmail = userData?.email || '';
    }
  }

  async sendMessage(message: string): Promise<N8NResponse> {
    try {
      console.log('📤 Sending message to N8N:', message);
      
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          message,
          user_id: this.userId,
          user_email: this.userEmail,
          timestamp: new Date().toISOString(),
        } as N8NRequest),
      });

      if (!response.ok) {
        console.error('❌ HTTP error:', response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📥 Raw response from N8N:', data);
      
      return this.normalizeResponse(data);
    } catch (error) {
      console.error('🔥 Error sending message to N8N:', error);
      return { error: 'Failed to send message. Please try again.' };
    }
  }

  async sendVoiceMessage(audioData: string): Promise<N8NResponse> {
    try {
      console.log('🎤 Sending voice message to N8N');
      
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio_data: audioData,
          user_id: this.userId,
          user_email: this.userEmail,
          timestamp: new Date().toISOString(),
        } as N8NRequest),
      });

      if (!response.ok) {
        console.error('❌ HTTP error:', response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📥 Raw voice response from N8N:', data);
      
      return this.normalizeResponse(data);
    } catch (error) {
      console.error('🔥 Error sending voice to N8N:', error);
      return { error: 'Failed to process voice message. Please try again.' };
    }
  }

  async sendImageMessage(imageData: string, text?: string): Promise<N8NResponse> {
    try {
      console.log('🖼️ Sending image message to N8N with text:', text);
      
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          image_data: imageData,
          user_id: this.userId,
          user_email: this.userEmail,
          timestamp: new Date().toISOString(),
        } as N8NRequest),
      });

      if (!response.ok) {
        console.error('❌ HTTP error:', response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📥 Raw image response from N8N:', data);
      
      return this.normalizeResponse(data);
    } catch (error) {
      console.error('🔥 Error sending image to N8N:', error);
      return { error: 'Failed to upload image. Please try again.' };
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private normalizeResponse(data: any): N8NResponse {
    console.log('🔄 Normalizing N8N response...');
    
    // If data is null or undefined
    if (!data) {
      console.warn('⚠️ Empty response from N8N');
      return { response: 'No response received from service' };
    }

    // If data is already in expected format
    if (typeof data === 'object' && !Array.isArray(data)) {
      console.log('✅ Response is already an object');
      
      // Create normalized response preserving all fields
      const normalized: N8NResponse = {
        response: data.response || data.output || data.message || data.content || data.text || '',
        output: data.output || data.content || data.text || '',
        visual: data.visual || data.image_url || data.image || data.url || (data.images && data.images[0]),
        images: data.images || (data.visual ? [data.visual] : []) || (data.image_url ? [data.image_url] : []),
        service_type: data.service_type || data.service,
        error: data.error,
        // Preserve any additional fields
        ...data
      };
      
      console.log('📦 Normalized object response:', normalized);
      return normalized;
    }

    // If data is an array (N8N often returns arrays)
    if (Array.isArray(data)) {
      console.log('📚 Response is an array with length:', data.length);
      
      if (data.length === 0) {
        return { response: 'Empty response from service' };
      }
      
      // Process first item
      const firstItem = data[0];
      console.log('📝 Processing first array item:', firstItem);
      
      if (typeof firstItem === 'string') {
        return { response: firstItem, output: firstItem };
      }
      
      if (typeof firstItem === 'object') {
        // Recursively normalize the first item
        return this.normalizeResponse(firstItem);
      }
    }

    // If data is a string
    if (typeof data === 'string') {
      console.log('📝 Response is a string');
      return { response: data, output: data };
    }

    // Fallback
    console.warn('⚠️ Unknown response format, converting to string');
    return { 
      response: String(data), 
      output: String(data) 
    };
  }

  getUserId(): string {
    return this.userId;
  }

  getUserEmail(): string {
    return this.userEmail;
  }

  updateUser(userId: string, userEmail?: string): void {
    this.userId = userId;
    this.userEmail = userEmail || '';
  }
}