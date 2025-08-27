// BASIT AUTH CALLBACK - OAuth için
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export function SimpleAuthCallback() {
  const [status, setStatus] = useState('İşleniyor...')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // OAuth callback'i işle
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          setStatus('Giriş başarısız: ' + error.message)
          return
        }

        if (data.session) {
          console.log('✅ OAuth başarılı:', data.session.user.email)
          
          // Kullanıcı profili oluştur (eğer yoksa)
          await createUserProfileIfNeeded(data.session.user)
          
          setStatus('Giriş başarılı! Yönlendiriliyor...')
          
          // Ana sayfaya yönlendir
          setTimeout(() => {
            window.location.href = '/'
          }, 1000)
        }
        
      } catch (error) {
        console.error('Callback processing error:', error)
        setStatus('Beklenmeyen hata oluştu')
      }
    }

    handleAuthCallback()
  }, [])

  const createUserProfileIfNeeded = async (user) => {
    try {
      // Kullanıcı var mı kontrol et
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!existingUser) {
        // users tablosuna ekle
        await supabase.from('users').upsert({
          id: user.id,
          email: user.email,
          first_name: user.user_metadata?.full_name?.split(' ')[0] || '',
          last_name: user.user_metadata?.full_name?.split(' ')[1] || '',
          user_type: 'candidate' // OAuth için varsayılan
        })

        // Candidate profile oluştur
        await supabase.from('candidate_profiles').insert({
          user_id: user.id
        })
        
        console.log('✅ OAuth profil oluşturuldu')
      }
    } catch (error) {
      console.error('Profile creation error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  )
}