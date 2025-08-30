// lib/n8n-webhook.ts
// Direct communication with N8N webhook - no backend needed

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

interface N8NRequest {
  message?: string;
  audio_data?: string;
  image_data?: string;
  user_id: string;
  user_email?: string;
  first_name?: string;
  last_name?: string;
  timestamp: string;
  quota: string;
  session_id?: string;
  remaining_images?: number | null;
  remaining_videos?: number | null;
  is_first_time_user?: boolean;
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

interface UserLimits {
    remaining_images: number;
    remaining_videos: number;
    is_first_time_user: boolean;
}

export class N8NWebhook {
  private webhookUrl: string;
  private userId: string;
  private userEmail: string;
  private firstName: string = '';
  private lastName: string = '';

  constructor(webhookUrl: string = 'https://monzology.app.n8n.cloud/webhook/2fe03fcd-7ff3-4a55-9d38-064722b844ab', userId?: string, userEmail?: string) {
    this.webhookUrl = webhookUrl;
    // Always get name fields from localStorage if available
    const user = localStorage.getItem('user');
    const userData = user ? JSON.parse(user) : null;
    if (userId) {
      this.userId = userId;
      this.userEmail = userEmail || '';
    } else {
      this.userId = userData?.id || 'anonymous';
      this.userEmail = userData?.email || '';
    }
    this.firstName = userData?.first_name || '';
    this.lastName = userData?.last_name || '';
  }


    private async getUserLimits(): Promise<Partial<UserLimits> | null> {
    if (!this.userId || this.userId === 'anonymous') {
        console.log('No user ID, skipping limits fetch.');
        return null;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
        console.warn('Authentication token not found. Cannot fetch user limits.');
        return null;
    }

    const url = `${API_BASE_URL}/user-limits/${this.userId}/`;
    console.log(`Fetching user limits from: ${url}`);

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.status === 401 || response.status === 403) {
            console.error(`Authentication error fetching user limits: ${response.status}`);
            return null;
        }

        if (!response.ok) {
            console.error(`Failed to fetch user limits. Status: ${response.status}`);
            return null;
        }

        const responseData = await response.json();
        console.log('API Response:', responseData);
        
        // Extract the actual data from the response structure
        const limitsData = responseData.data || responseData;
        
        const limits: Partial<UserLimits> = {
            remaining_images: limitsData.remaining_images ?? null,
            remaining_videos: limitsData.remaining_videos ?? null,
            is_first_time_user: limitsData.is_first_time_user ?? false,
        };
        
        console.log('Successfully extracted user limits:', limits);
        return limits;
    } catch (error) {
        console.error('An error occurred while fetching user limits:', error);
        return null;
    }
  }


  async sendMessage(message: string, sessionId?: string): Promise<N8NResponse> {
    try {
      console.log('📤 Sending message to N8N:', message);

      const userLimits = await this.getUserLimits();

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          '_method': 'POST',
          'key': 'RdMguPBDn8_a60TKTsTh06HnLIJ3To3TY0u_rCWggEU'
        },
        body: JSON.stringify({
          message: message,
          user_id: this.userId,
          session_id: sessionId,
          user_email: this.userEmail,
          name: `${this.firstName} ${this.lastName}`,
          quota: "paid",
          timestamp: new Date().toISOString(),
          remaining_images: userLimits?.remaining_images ?? null,
          remaining_videos: userLimits?.remaining_videos ?? null,
          is_first_time_user: userLimits?.is_first_time_user ?? false,
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

  async sendVoiceMessage(audioData: string, sessionId?: string): Promise<N8NResponse> {
    try {
      console.log('🎤 Sending voice message to N8N');

      const userLimits = await this.getUserLimits();

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          '_method': 'POST'
        },
        body: JSON.stringify({
          audio_data: audioData,
          user_id: this.userId,
          user_email: this.userEmail,
          session_id: sessionId,
          name: `${this.firstName} ${this.lastName}`,
          quota: "paid",
          timestamp: new Date().toISOString(),
          remaining_images: userLimits?.remaining_images ?? null,
          remaining_videos: userLimits?.remaining_videos ?? null,
          is_first_time_user: userLimits?.is_first_time_user ?? false,
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

  async sendImageMessage(imageData: string, text?: string, sessionId?: string): Promise<N8NResponse> {
    try {
      console.log('🖼️ Sending image message to N8N with text:', text);

      const userLimits = await this.getUserLimits();

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          '_method': 'POST'
        },
        body: JSON.stringify({
          message: text,
          image_data: imageData,
          user_id: this.userId,
          session_id: sessionId,
          user_email: this.userEmail,
          name: `${this.firstName} ${this.lastName}`,
          quota: "paid",
          timestamp: new Date().toISOString(),
          remaining_images: userLimits?.remaining_images ?? null,
          remaining_videos: userLimits?.remaining_videos ?? null,
          is_first_time_user: userLimits?.is_first_time_user ?? false,
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