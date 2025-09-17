// lib/n8n-webhook.ts
// Direct communication with N8N webhook - no backend needed

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface N8NRequest {
  current_user_message?: string;
  audio_data?: string;
  image_url?: string;
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
  // New company profile fields
  company_name?: string;
  company_website_url?: string;
  logo_url?: string;
  industry?: string;
  job_title?: string;
  // Chat history
  previous_context?: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: string;
    visual?: string;
  }>;
}



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

interface CompanyProfile {
    company_name: string | null;
    company_website_url: string | null;
    logo_url: string | null;
    industry: string | null;
    job_title: string | null;
    // Asset files
    brand_manual: {file_id: string | null, file_url: string | null} | null;
    company_profile_file: {file_id: string | null, file_url: string | null} | null;
    document: {file_id: string | null, file_url: string | null} | null;
}

export class N8NWebhook {
  private webhookUrl: string;
  private userId: string;
  private userEmail: string;
  private firstName: string = '';
  private lastName: string = '';
  // New company profile fields
  private companyProfile: CompanyProfile | null = null;
  private profileFetched: boolean = false;

  constructor(webhookUrl: string = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL!, userId?: string, userEmail?: string) {
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
    
    // Try to load cached company profile from localStorage
    const cachedProfile = localStorage.getItem('company_profile');
    if (cachedProfile) {
      this.companyProfile = JSON.parse(cachedProfile);
      this.profileFetched = true;
    }
  }

  private async fetchCompanyProfile(): Promise<void> {
    // Only fetch if not already fetched and user is authenticated
    if (this.profileFetched || !this.userId || this.userId === 'anonymous') {
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      console.warn('No auth token for fetching company profile');
      return;
    }

    try {
      // Updated endpoint path to match the new backend URL
      const response = await fetch(`${API_BASE_URL}/client/profile/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Profile API response:', data);
        
        if (data.success && data.data) {
          this.companyProfile = {
            company_name: data.data.company_name || null,
            company_website_url: data.data.company_website_url || null,
            logo_url: data.data.logo_url || null,
            industry: data.data.industry || null,
            job_title: data.data.job_title || null,
            // Add asset files
            brand_manual: data.data.brand_manual || null,
            company_profile_file: data.data.company_profile || null,
            document: data.data.document || null,
          };
          
          // Cache the profile in localStorage
          localStorage.setItem('company_profile', JSON.stringify(this.companyProfile));
          this.profileFetched = true;
          console.log('Company profile fetched and cached:', this.companyProfile);
        } else {
          console.log('No profile data found or empty response');
          // Set empty profile if no data found
          this.companyProfile = {
            company_name: null,
            company_website_url: null,
            logo_url: null,
            industry: null,
            job_title: null,
            brand_manual: null,
            company_profile_file: null,
            document: null,
          };
          this.profileFetched = true;
        }
      } else {
        console.error('Failed to fetch profile:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching company profile:', error);
    }
  }

  public async getUserLimits(): Promise<Partial<UserLimits> | null> {
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
            // Include max values if present in backend response
            ...(limitsData.max_images !== undefined && { max_images: limitsData.max_images }),
            ...(limitsData.max_videos !== undefined && { max_videos: limitsData.max_videos }),
        };
        
        // Note: User limits are NOT stored in localStorage as they change frequently
        // Always fetch fresh data from backend to ensure accuracy
        
        console.log('Successfully extracted user limits:', limits);
        return limits;
    } catch (error) {
        console.error('An error occurred while fetching user limits:', error);
        return null;
    }
  }

  async sendMessage(
    current_user_message: string, 
    sessionId?: string, 
    chatHistory?: Array<{
      role: 'user' | 'assistant' | 'system';
      content: string;
      timestamp?: string;
      visual?: string;
    }>
  ): Promise<N8NResponse> {
    try {
      console.log('Sending message to N8N:', current_user_message);

      // Fetch company profile if not already fetched
      await this.fetchCompanyProfile();
      
      const userLimits = await this.getUserLimits();

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          '_method': 'POST',
          'key': process.env.NEXT_PUBLIC_N8N_WEBHOOK_KEY!
        },
        body: JSON.stringify({
          current_user_message: current_user_message,
          user_id: this.userId,
          session_id: sessionId,
          user_email: this.userEmail,
          name: `${this.firstName} ${this.lastName}`,
          quota: "paid",
          timestamp: new Date().toISOString(),
          remaining_images: userLimits?.remaining_images ?? null,
          remaining_videos: userLimits?.remaining_videos ?? null,
          is_first_time_user: userLimits?.is_first_time_user ?? false,
          // Add company profile data
          company_name: this.companyProfile?.company_name || null,
          company_website_url: this.companyProfile?.company_website_url || null,
          logo_url: this.companyProfile?.logo_url || null,
          industry: this.companyProfile?.industry || null,
          job_title: this.companyProfile?.job_title || null,
          // Add asset files URLs
          brand_manual_url: this.companyProfile?.brand_manual?.file_url || null,
          company_profile_file_url: this.companyProfile?.company_profile_file?.file_url || null,
          client_document_url: this.companyProfile?.document?.file_url || null,
          respond_only_to: 'current_user_message',
          // Add previous context
          previous_context: chatHistory ? chatHistory.slice(-4) : [],
        } as N8NRequest),
      });

      if (!response.ok) {
        console.error('HTTP error:', response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Raw response from N8N:', data);

      return this.normalizeResponse(data);
    } catch (error) {
      console.error('Error sending message to N8N:', error);
      return { error: 'Failed to send message. Please try again.' };
    }
  }

  async sendVoiceMessage(
    audioData: string, 
    sessionId?: string, 
    chatHistory?: Array<{
      role: 'user' | 'assistant' | 'system';
      content: string;
      timestamp?: string;
      visual?: string;
    }>
  ): Promise<N8NResponse> {
    try {
      console.log('Sending voice message to N8N');

      // Fetch company profile if not already fetched
      await this.fetchCompanyProfile();
      
      const userLimits = await this.getUserLimits();

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          '_method': 'POST',
          'key': process.env.NEXT_PUBLIC_N8N_WEBHOOK_KEY!
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
          // Add company profile data
          company_name: this.companyProfile?.company_name || null,
          company_website_url: this.companyProfile?.company_website_url || null,
          logo_url: this.companyProfile?.logo_url || null,
          industry: this.companyProfile?.industry || null,
          job_title: this.companyProfile?.job_title || null,
          // Add asset files URLs
          brand_manual_url: this.companyProfile?.brand_manual?.file_url || null,
          company_profile_file_url: this.companyProfile?.company_profile_file?.file_url || null,
          client_document_url: this.companyProfile?.document?.file_url || null,
          respond_only_to: 'current_user_message',
          // Add previous context
          previous_context: chatHistory ? chatHistory.slice(-4) : [],
        } as N8NRequest),
      });

      if (!response.ok) {
        console.error('HTTP error:', response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Raw voice response from N8N:', data);
      
      return this.normalizeResponse(data);
    } catch (error) {
      console.error('Error sending voice to N8N:', error);
      return { error: 'Failed to process voice message. Please try again.' };
    }
  }

  async sendImageMessage(
    imageData: string, 
    text?: string, 
    sessionId?: string, 
    chatHistory?: Array<{
      role: 'user' | 'assistant' | 'system';
      content: string;
      timestamp?: string;
      visual?: string;
    }>
  ): Promise<N8NResponse> {
    try {
      console.log('Sending image message to N8N with text:', text);

      // Fetch company profile if not already fetched
      await this.fetchCompanyProfile();
      
      const userLimits = await this.getUserLimits();

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          '_method': 'POST',
          'key': process.env.NEXT_PUBLIC_N8N_WEBHOOK_KEY!
        },
        body: JSON.stringify({
          current_user_message: text,
          image_url: imageData,
          user_id: this.userId,
          session_id: sessionId,
          user_email: this.userEmail,
          name: `${this.firstName} ${this.lastName}`,
          quota: "paid",
          timestamp: new Date().toISOString(),
          remaining_images: userLimits?.remaining_images ?? null,
          remaining_videos: userLimits?.remaining_videos ?? null,
          is_first_time_user: userLimits?.is_first_time_user ?? false,
          // Add company profile data
          company_name: this.companyProfile?.company_name || null,
          company_website_url: this.companyProfile?.company_website_url || null,
          logo_url: this.companyProfile?.logo_url || null,
          industry: this.companyProfile?.industry || null,
          job_title: this.companyProfile?.job_title || null,
          // Add asset files URLs
          brand_manual_url: this.companyProfile?.brand_manual?.file_url || null,
          company_profile_file_url: this.companyProfile?.company_profile_file?.file_url || null,
          client_document_url: this.companyProfile?.document?.file_url || null,
          respond_only_to: 'current_user_message',
          // Add previous context
          previous_context: chatHistory ? chatHistory.slice(-4) : [],
        } as N8NRequest),
      });

      if (!response.ok) {
        console.error('HTTP error:', response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Raw image response from N8N:', data);
      
      return this.normalizeResponse(data);
    } catch (error) {
      console.error('Error sending image to N8N:', error);
      return { error: 'Failed to upload image. Please try again.' };
    }
  }
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private normalizeResponse(data: any): N8NResponse {
    console.log('Normalizing N8N response...');

    // If data is null or undefined
    if (!data) {
      console.warn('Empty response from N8N');
      return { response: 'No response received from service' };
    }

    // If data is already in expected format
    if (typeof data === 'object' && !Array.isArray(data)) {
      console.log('Response is already an object');

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

      console.log('Normalized object response:', normalized);
      return normalized;
    }

    // If data is an array (N8N often returns arrays)
    if (Array.isArray(data)) {
      console.log('Response is an array with length:', data.length);

      if (data.length === 0) {
        return { response: 'Empty response from service' };
      }
      
      // Process first item
      const firstItem = data[0];
      console.log('Processing first array item:', firstItem);

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
      console.log('Response is a string');
      return { response: data, output: data };
    }

    // Fallback
    console.warn('Unknown response format, converting to string');
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
    // Clear cached profile when user changes
    this.companyProfile = null;
    this.profileFetched = false;
    localStorage.removeItem('company_profile');
  }
  
  // Method to manually refresh company profile if needed
  async refreshCompanyProfile(): Promise<void> {
    this.profileFetched = false;
    this.companyProfile = null;
    localStorage.removeItem('company_profile');
    await this.fetchCompanyProfile();
  }
  
  // Method to get current company profile
  getCompanyProfile(): CompanyProfile | null {
    return this.companyProfile;
  }

  // Method to manually update the company profile cache
  updateCompanyProfileCache(profile: CompanyProfile): void {
    this.companyProfile = profile;
    this.profileFetched = true;
    localStorage.setItem('company_profile', JSON.stringify(profile));
  }
}