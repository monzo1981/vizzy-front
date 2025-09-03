import { createClient } from '@supabase/supabase-js'

// Use service role key for testing (not for production!)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// This would need to be the service role key from Django backend
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL and service key are required.')
}

// Create client with service role key to bypass RLS for testing
export const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Original client for comparison
export const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
})

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
