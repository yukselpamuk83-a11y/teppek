import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, authHelpers } from '../lib/supabase'
import { useToastStore } from '../stores/toastStore'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(true)
  
  const { addToast } = useToastStore()

  // Initialize auth state
  useEffect(() => {
    let isMounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (isMounted) {
          if (error) {
            console.error('Error getting session:', error)
          } else {
            setSession(session)
            setUser(session?.user ?? null)
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
          setInitializing(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (isMounted) {
          console.log('🔐 Auth state change:', event, session?.user?.email)
          
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false)

          // Handle different auth events
          switch (event) {
            case 'SIGNED_IN':
              addToast({
                title: 'Başarıyla giriş yaptınız',
                description: `Hoş geldiniz, ${session?.user?.email}`,
                type: 'success'
              })
              break
            case 'SIGNED_OUT':
              addToast({
                title: 'Çıkış yapıldı',
                description: 'Güvenli bir şekilde çıkış yaptınız',
                type: 'info'
              })
              break
            case 'TOKEN_REFRESHED':
              console.log('🔄 Token refreshed')
              break
            case 'USER_UPDATED':
              console.log('👤 User updated')
              break
          }
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [addToast])

  // Auth methods
  const signInWithEmail = async (email, password) => {
    setLoading(true)
    try {
      const { data, error } = await authHelpers.signIn(email, password)
      
      if (error) {
        addToast({
          title: 'Giriş hatası',
          description: error.message,
          type: 'error'
        })
        return { error }
      }

      return { data }
    } catch (error) {
      addToast({
        title: 'Beklenmeyen hata',
        description: error.message,
        type: 'error'
      })
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const signUpWithEmail = async (email, password, metadata = {}) => {
    setLoading(true)
    try {
      const { data, error } = await authHelpers.signUp(email, password, metadata)
      
      if (error) {
        addToast({
          title: 'Kayıt hatası',
          description: error.message,
          type: 'error'
        })
        return { error }
      }

      if (data.user && !data.session) {
        addToast({
          title: 'Kayıt başarılı',
          description: 'E-posta adresinizi kontrol edin ve hesabınızı doğrulayın',
          type: 'success'
        })
      }

      return { data }
    } catch (error) {
      addToast({
        title: 'Beklenmeyen hata',
        description: error.message,
        type: 'error'
      })
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const signInWithProvider = async (provider) => {
    try {
      let result
      
      switch (provider) {
        case 'google':
          result = await authHelpers.signInWithGoogle()
          break
        case 'github':
          result = await authHelpers.signInWithGitHub()
          break
        case 'facebook':
          result = await authHelpers.signInWithFacebook()
          break
        case 'twitter':
          result = await authHelpers.signInWithTwitter()
          break
        case 'linkedin':
          result = await authHelpers.signInWithLinkedIn()
          break
        case 'discord':
          result = await authHelpers.signInWithDiscord()
          break
        default:
          throw new Error(`Desteklenmeyen provider: ${provider}`)
      }

      if (result.error) {
        addToast({
          title: 'Giriş hatası',
          description: result.error.message,
          type: 'error'
        })
        return { error: result.error }
      }

      // OAuth redirect will handle the rest
      return { data: result.data }
    } catch (error) {
      addToast({
        title: 'Sosyal medya girişi hatası',
        description: error.message,
        type: 'error'
      })
      return { error }
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      const { error } = await authHelpers.signOut()
      
      if (error) {
        addToast({
          title: 'Çıkış hatası',
          description: error.message,
          type: 'error'
        })
        return { error }
      }

      return { success: true }
    } catch (error) {
      addToast({
        title: 'Beklenmeyen hata',
        description: error.message,
        type: 'error'
      })
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    session,
    loading,
    initializing,
    signInWithEmail,
    signUpWithEmail,
    signInWithProvider,
    signOut,
    // Helper computed properties
    isAuthenticated: !!user,
    userEmail: user?.email,
    userMetadata: user?.user_metadata,
    userId: user?.id
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}