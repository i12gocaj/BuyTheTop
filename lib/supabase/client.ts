import { createBrowserClient } from "@supabase/ssr"

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if Supabase environment variables are available
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// Client instance
let supabaseClient: any = null

// Helper function to get Supabase client with proper error handling
export const getSupabaseClient = () => {
  // Only work on client side
  if (typeof window === 'undefined') {
    return null
  }
  
  // Check configuration
  if (!isSupabaseConfigured) {
    console.warn("Supabase is not properly configured. Check your environment variables.")
    return null
  }
  
  // Return existing client if available
  if (supabaseClient) {
    return supabaseClient
  }
  
  // Create new client
  try {
    supabaseClient = createBrowserClient(
      supabaseUrl!,
      supabaseAnonKey!,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          flowType: 'pkce'
        }
      }
    )
    
    return supabaseClient
  } catch (error) {
    console.error('Failed to create Supabase client:', error)
    return null
  }
}

// Legacy export for backward compatibility
export const supabase = typeof window !== 'undefined' ? getSupabaseClient() : null
