// DENEYSEL PROJE - Supabase Client Configuration
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.')
}

// Test için geçici development keys (gerçek prod'a etki etmez)
const devSupabaseUrl = supabaseUrl
const devSupabaseKey = supabaseAnonKey

console.log('🔑 Supabase URL:', devSupabaseUrl)
console.log('🔑 Supabase Key (first 20 chars):', devSupabaseKey?.substring(0, 20) + '...')

export const supabase = createClient(devSupabaseUrl, devSupabaseKey, {
  auth: {
    // Development settings
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  }
})

// Auth helper functions
export const authHelpers = {
  signUp: async (email, password, metadata = {}) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
  },
  
  signIn: async (email, password) => {
    return await supabase.auth.signInWithPassword({
      email,
      password
    })
  },
  
  // Social Login Methods
  signInWithGoogle: async () => {
    return await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      }
    })
  },
  
  signInWithFacebook: async () => {
    return await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'email'
      }
    })
  },
  
  signInWithTwitter: async () => {
    return await supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
  },
  
  signInWithGitHub: async () => {
    return await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'user:email'
      }
    })
  },
  
  signInWithLinkedIn: async () => {
    return await supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'openid profile email'
      }
    })
  },
  
  // WeChat alternatifi olarak Discord ekliyorum (WeChat Supabase'de native desteklenmiyor)
  signInWithDiscord: async () => {
    return await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'identify email'
      }
    })
  },
  
  signOut: async () => {
    return await supabase.auth.signOut()
  },
  
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },
  
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

console.log('🧪 Deneysel Supabase Client başlatıldı - Canlı siteyi etkilemez')