// BASIT AUTH HOOK - State management  
import React, { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export function SimpleAuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isPremiumUser, setIsPremiumUser] = useState(false)

  useEffect(() => {
    // Mevcut session'ı kontrol et
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Auth değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
        
        // Premium durumunu kontrol et (user metadata'dan)
        if (session?.user) {
          const premiumStatus = session.user.user_metadata?.premium_active || false
          setIsPremiumUser(premiumStatus)
        } else {
          setIsPremiumUser(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setIsPremiumUser(false)
  }

  // Premium activate function (simulates subscription)
  const activatePremium = async (planName) => {
    if (!user) return false
    
    try {
      // Update user metadata with premium status
      const { error } = await supabase.auth.updateUser({
        data: { 
          premium_active: true,
          premium_plan: planName,
          premium_activated_at: new Date().toISOString()
        }
      })
      
      if (!error) {
        setIsPremiumUser(true)
        return true
      }
    } catch (error) {
      console.error('Premium activation error:', error)
    }
    return false
  }

  const value = {
    user,
    loading,
    isPremiumUser,
    signOut,
    activatePremium,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useSimpleAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useSimpleAuth must be used within SimpleAuthProvider')
  }
  return context
}