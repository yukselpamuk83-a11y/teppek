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
          
          setStatus('Giriş başarılı! Ana sayfaya yönlendiriliyor...')
          
          // State refresh için ana sayfaya yumuşak geçiş
          setTimeout(() => {
            // History API kullanarak sayfa yenilenmeden navigation
            window.history.replaceState({}, '', '/')
            // Custom event göndererek app'in state'ini refresh et
            window.dispatchEvent(new CustomEvent('auth-state-changed'))
            // Fallback olarak sayfa yenile
            window.location.reload()
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
      // Kullanıcı profili var mı kontrol et
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!existingProfile) {
        // Profiles tablosuna ekle (RLS trigger otomatik oluşturacak)
        const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Kullanıcı'
        
        await supabase.from('profiles').upsert({
          id: user.id,
          email: user.email,
          full_name: fullName,
          user_type: 'job_seeker' // OAuth için varsayılan
        })
        
        console.log('✅ OAuth profil oluşturuldu')
      }
    } catch (error) {
      console.error('Profile creation error:', error)
      // Profil oluşturulamasa bile callback başarısız sayılmasın
      console.log('⚠️ Profil oluşturulamadı ama giriş devam ediyor')
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