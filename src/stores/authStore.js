// DENEYSEL PROJE - Modern Auth Store with Zustand
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { authHelpers } from '../lib/supabase'

export const useAuthStore = create(
  subscribeWithSelector((set, get) => ({
    // State
    user: null,
    session: null,
    loading: true,
    error: null,
    
    // Actions
    signUp: async (email, password, metadata) => {
      set({ loading: true, error: null })
      try {
        const { data, error } = await authHelpers.signUp(email, password, metadata)
        if (error) throw error
        
        set({ 
          user: data.user,
          session: data.session,
          loading: false 
        })
        return { success: true, data }
      } catch (error) {
        set({ error: error.message, loading: false })
        return { success: false, error }
      }
    },
    
    signIn: async (email, password) => {
      set({ loading: true, error: null })
      try {
        const { data, error } = await authHelpers.signIn(email, password)
        if (error) throw error
        
        set({ 
          user: data.user,
          session: data.session,
          loading: false 
        })
        return { success: true, data }
      } catch (error) {
        set({ error: error.message, loading: false })
        return { success: false, error }
      }
    },
    
    // Social Login Methods
    signInWithGoogle: async () => {
      set({ loading: true, error: null })
      try {
        const { data, error } = await authHelpers.signInWithGoogle()
        if (error) throw error
        
        // OAuth redirects, so we don't need to set user here
        set({ loading: false })
        return { success: true, data }
      } catch (error) {
        set({ error: error.message, loading: false })
        return { success: false, error }
      }
    },
    
    signInWithFacebook: async () => {
      set({ loading: true, error: null })
      try {
        const { data, error } = await authHelpers.signInWithFacebook()
        if (error) throw error
        
        set({ loading: false })
        return { success: true, data }
      } catch (error) {
        set({ error: error.message, loading: false })
        return { success: false, error }
      }
    },
    
    signInWithLinkedIn: async () => {
      set({ loading: true, error: null })
      try {
        const { data, error } = await authHelpers.signInWithLinkedIn()
        if (error) throw error
        
        set({ loading: false })
        return { success: true, data }
      } catch (error) {
        set({ error: error.message, loading: false })
        return { success: false, error }
      }
    },
    
    signInWithTwitter: async () => {
      set({ loading: true, error: null })
      try {
        const { data, error } = await authHelpers.signInWithTwitter()
        if (error) throw error
        
        set({ loading: false })
        return { success: true, data }
      } catch (error) {
        set({ error: error.message, loading: false })
        return { success: false, error }
      }
    },
    
    signInWithGitHub: async () => {
      set({ loading: true, error: null })
      try {
        const { data, error } = await authHelpers.signInWithGitHub()
        if (error) throw error
        
        set({ loading: false })
        return { success: true, data }
      } catch (error) {
        set({ error: error.message, loading: false })
        return { success: false, error }
      }
    },
    
    signInWithDiscord: async () => {
      set({ loading: true, error: null })
      try {
        const { data, error } = await authHelpers.signInWithDiscord()
        if (error) throw error
        
        set({ loading: false })
        return { success: true, data }
      } catch (error) {
        set({ error: error.message, loading: false })
        return { success: false, error }
      }
    },
    
    signOut: async () => {
      set({ loading: true })
      try {
        await authHelpers.signOut()
        set({ 
          user: null, 
          session: null, 
          loading: false,
          error: null 
        })
        return { success: true }
      } catch (error) {
        set({ error: error.message, loading: false })
        return { success: false, error }
      }
    },
    
    initializeAuth: async () => {
      try {
        const { user, error } = await authHelpers.getCurrentUser()
        
        // Development mode: Session missing hatası normal
        if (error) {
          if (error.message?.includes('Auth session missing') || 
              error.message?.includes('Invalid JWT')) {
            console.log('🧪 Development mode: Auth session not found (normal)')
          } else {
            console.error('Auth initialization error:', error)
          }
        }
        
        set({ 
          user: user || null, 
          loading: false,
          error: null // Development'ta error gösterme
        })
        
        // Listen to auth changes
        authHelpers.onAuthStateChange((event, session) => {
          set({ 
            user: session?.user ?? null,
            session: session,
            loading: false 
          })
        })
        
      } catch (error) {
        console.log('🧪 Auth initialization skipped in development mode')
        set({ 
          user: null, 
          session: null, 
          loading: false,
          error: null // Development'ta error gösterme
        })
      }
    },
    
    clearError: () => set({ error: null }),
    
    // Computed values
    isAuthenticated: () => !!get().user,
    isLoading: () => get().loading,
    getUser: () => get().user,
    getSession: () => get().session,
    getError: () => get().error
  }))
)

// Initialize auth on store creation
useAuthStore.getState().initializeAuth()

console.log('🧪 Modern Zustand Auth Store başlatıldı')