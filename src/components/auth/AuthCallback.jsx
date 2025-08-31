import React, { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { CheckCircle, XCircle } from 'lucide-react'

const AuthCallback = () => {
  const { user, loading } = useAuth()
  const [callbackState, setCallbackState] = useState('processing') // 'processing', 'success', 'error'
  const [message, setMessage] = useState('Giriş işlemi kontrol ediliyor...')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // URL'den hash parameters'ları al
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const searchParams = new URLSearchParams(window.location.search)
        
        // Error kontrolü
        const error = hashParams.get('error') || searchParams.get('error')
        const errorDescription = hashParams.get('error_description') || searchParams.get('error_description')
        
        if (error) {
          setCallbackState('error')
          setMessage(errorDescription || 'Giriş sırasında bir hata oluştu')
          
          // 3 saniye sonra ana sayfaya yönlendir
          setTimeout(() => {
            window.location.href = '/'
          }, 3000)
          return
        }

        // Access token kontrolü
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        
        if (accessToken) {
          setMessage('Giriş başarılı! Yönlendiriliyorsunuz...')
          
          // Başarılı callback için bekle
          setTimeout(() => {
            setCallbackState('success')
            
            // 2 saniye sonra ana sayfaya yönlendir
            setTimeout(() => {
              window.location.href = '/'
            }, 2000)
          }, 1000)
        } else {
          // Token yoksa bekle
          setTimeout(() => {
            if (user) {
              setCallbackState('success')
              setMessage('Giriş başarılı!')
              
              setTimeout(() => {
                window.location.href = '/'
              }, 2000)
            } else {
              setCallbackState('error')
              setMessage('Giriş doğrulanamadı')
              
              setTimeout(() => {
                window.location.href = '/'
              }, 3000)
            }
          }, 2000)
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        setCallbackState('error')
        setMessage('Beklenmeyen bir hata oluştu')
        
        setTimeout(() => {
          window.location.href = '/'
        }, 3000)
      }
    }

    handleAuthCallback()
  }, [user])

  const getIcon = () => {
    switch (callbackState) {
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
      case 'error':
        return <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
      default:
        return <LoadingSpinner className="h-16 w-16 mx-auto mb-4" />
    }
  }

  const getBgColor = () => {
    switch (callbackState) {
      case 'success':
        return 'bg-green-50'
      case 'error':
        return 'bg-red-50'
      default:
        return 'bg-blue-50'
    }
  }

  return (
    <div className={`min-h-screen ${getBgColor()} flex items-center justify-center px-4`}>
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {getIcon()}
        
        <h1 className="text-2xl font-bold mb-4">
          {callbackState === 'success' && 'Başarılı!'}
          {callbackState === 'error' && 'Hata!'}
          {callbackState === 'processing' && 'İşlem devam ediyor...'}
        </h1>
        
        <p className="text-gray-600 mb-6">
          {message}
        </p>
        
        {callbackState === 'processing' && (
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
            <p className="text-sm text-gray-500">
              Lütfen bekleyin...
            </p>
          </div>
        )}
        
        {callbackState === 'error' && (
          <button
            onClick={() => window.location.href = '/'}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Ana Sayfaya Dön
          </button>
        )}
        
        {callbackState === 'success' && (
          <button
            onClick={() => window.location.href = '/'}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Ana Sayfaya Git
          </button>
        )}
      </div>
    </div>
  )
}

export default AuthCallback