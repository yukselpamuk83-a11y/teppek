// DENEYSEL PROJE - Auth Callback Page
import { useEffect, useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { supabase } from '../../lib/supabase'
import { analytics } from '../../lib/analytics'

export function AuthCallback() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { initializeAuth } = useAuthStore()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 Auth callback handling started...')
        console.log('🔍 Full URL:', window.location.href)
        console.log('🔍 Hash:', window.location.hash)
        console.log('🔍 Search:', window.location.search)
        
        // First try to handle the session from URL hash/search
        const { data, error } = await supabase.auth.getSession()
        
        console.log('🔍 Session data:', data)
        console.log('🔍 Session error:', error)
        
        if (error) {
          console.error('❌ Session error:', error)
          throw error
        }

        if (data.session) {
          console.log('✅ Auth callback successful:', data.session.user.email)
          console.log('👤 User data:', data.session.user)
          
          // Track successful social login
          analytics.events.authAction('social_login_success', data.session.user.app_metadata?.provider)
          
          // Initialize auth state
          await initializeAuth()
          
          // Redirect to home page after successful auth
          setTimeout(() => {
            window.location.href = '/'
          }, 2000)
        } else {
          // Try to exchange URL params for session
          console.log('🔄 No session found, trying to exchange params...')
          
          const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(window.location.search)
          
          if (sessionError) {
            console.error('❌ Code exchange error:', sessionError)
            throw sessionError
          }
          
          if (sessionData.session) {
            console.log('✅ Code exchange successful')
            await initializeAuth()
            setTimeout(() => {
              window.location.href = '/'
            }, 2000)
          } else {
            throw new Error('Unable to establish session')
          }
        }
      } catch (error) {
        console.error('❌ Auth callback error:', error)
        analytics.track('auth_callback_error', { error: error.message })
        setError(error.message)
        
        // Redirect to home even on error
        setTimeout(() => {
          window.location.href = '/?auth_error=true'
        }, 3000)
      } finally {
        setLoading(false)
      }
    }

    handleAuthCallback()
  }, [initializeAuth])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Giriş İşleminiz Tamamlanıyor...</h2>
          <p className="text-gray-600">Lütfen bekleyin, kısa sürede yönlendirileceksiniz.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Giriş İşleminde Sorun Oluştu</h2>
          <p className="text-gray-600 mb-4">
            {error === 'Invalid JWT' || error.includes('session') 
              ? 'Giriş oturumunuz geçersiz. Lütfen tekrar deneyin.'
              : `Hata: ${error}`
            }
          </p>
          <p className="text-sm text-gray-500">3 saniye içinde ana sayfaya yönlendirileceksiniz...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-green-600 text-5xl mb-4">✅</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Giriş İşlemi Tamamlandı!</h2>
        <p className="text-gray-600">Ana sayfaya yönlendiriliyorsunuz...</p>
      </div>
    </div>
  )
}