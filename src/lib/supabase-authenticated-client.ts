import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getUser } from './auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and anonymous key are required.')
}

class AuthenticatedSupabaseClient {
  private client: SupabaseClient
  private authToken: string | null = null

  constructor() {
    this.client = createClient(supabaseUrl, supabaseAnonKey)
    this.initializeAuth()
  }

  private async initializeAuth() {
    // Get Django JWT token and use it to create a custom Supabase session
    const token = localStorage.getItem('access_token')
    const user = getUser()
    
    if (token && user) {
      try {
        // Create a minimal Supabase session using the Django JWT
        // This is a workaround since we're using Django auth instead of Supabase auth
        const session = {
          access_token: token,
          refresh_token: localStorage.getItem('refresh_token') || '',
          expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
          expires_in: 3600,
          token_type: 'bearer',
          user: {
            id: user.id,
            email: user.email,
            app_metadata: {},
            user_metadata: {
              user_type: user.user_type,
              first_name: user.first_name,
              last_name: user.last_name
            },
            aud: 'authenticated',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            email_confirmed_at: new Date().toISOString(),
            last_sign_in_at: new Date().toISOString(),
            role: 'authenticated'
          }
        }

        // Set the session - this will make Supabase think the user is authenticated
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await this.client.auth.setSession(session as any)
        this.authToken = token
        console.log('✅ Supabase authenticated with Django JWT')
        
      } catch (error) {
        console.error('❌ Failed to authenticate Supabase:', error)
      }
    }
  }

  getClient(): SupabaseClient {
    return this.client
  }

  async ensureAuthenticated(): Promise<boolean> {
    const token = localStorage.getItem('access_token')
    if (!token) {
      console.warn('⚠️ No Django auth token found')
      return false
    }

    if (this.authToken !== token) {
      // Token changed, re-authenticate
      await this.initializeAuth()
    }

    return true
  }
}

// Create singleton instance
const authenticatedSupabase = new AuthenticatedSupabaseClient()

// Export the authenticated client
export const supabase = authenticatedSupabase.getClient()
export const ensureSupabaseAuth = () => authenticatedSupabase.ensureAuthenticated()

// Database structure interfaces (keep existing)
export interface ChatMessageDB {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  visual?: string;
  service_type?: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant' | 'system';
  timestamp: Date;
  visual?: string;
  isProcessing?: boolean;
  isVoice?: boolean;
  serviceType?: string;
}
