import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

console.log('🔧 Supabase Config Debug:')
console.log('URL:', supabaseUrl ? 'Set ✅' : 'Missing ❌')
console.log('Anon Key:', supabaseAnonKey ? 'Set ✅' : 'Missing ❌')

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and anonymous key are required.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false // Disable session persistence for API key issues
  }
})

// Database structure interface - matches exactly what's in Supabase
export interface ChatMessageDB {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  visual?: string
  image_url?: string
  image_url2?: string  // NEW: Second image
  image_url3?: string  // NEW: Third image
  service_type?: string
}

// UI display interface - for frontend components
export interface ChatMessage {
  id: string
  content: string
  sender: 'user' | 'assistant' | 'system'
  timestamp: Date
  visual?: string
  image_url2?: string  // NEW: Second image
  image_url3?: string  // NEW: Third image
  serviceType?: string
  isProcessing?: boolean
  isVoice?: boolean
}