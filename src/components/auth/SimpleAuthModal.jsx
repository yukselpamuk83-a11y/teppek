// BASIT AUTH MODAL - Çalışan Versiyon
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { supabase } from '../../lib/supabase'
import { LogIn, UserPlus, Mail, Lock, User, Building } from 'lucide-react'

export function SimpleAuthModal({ isOpen, onClose, defaultMode = 'signin' }) {
  const [mode, setMode] = useState(defaultMode)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    userType: 'candidate'
  })

  // Basit e-posta/şifre girişi
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === 'signin') {
        // Giriş yap
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })
        
        if (error) throw error
        
        console.log('✅ Giriş başarılı:', data.user.email)
        onClose()
        
      } else {
        // Kayıt ol
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              first_name: formData.firstName,
              last_name: formData.lastName,
              user_type: formData.userType
            }
          }
        })
        
        if (error) throw error
        
        // Kullanıcı profili oluştur
        if (data.user) {
          await createUserProfile(data.user.id, formData)
        }
        
        console.log('✅ Kayıt başarılı:', data.user?.email)
        alert('Kayıt başarılı! E-posta adresinizi kontrol edin.')
        onClose()
      }
      
    } catch (error) {
      console.error('Auth error:', error)
      alert(error.message || 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  // Kullanıcı profili oluştur
  const createUserProfile = async (userId, data) => {
    try {
      // users tablosuna ekle
      await supabase.from('users').upsert({
        id: userId,
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        user_type: data.userType
      })

      // Profile tablosuna ekle
      if (data.userType === 'candidate') {
        await supabase.from('candidate_profiles').insert({
          user_id: userId
        })
      } else {
        await supabase.from('company_profiles').insert({
          user_id: userId
        })
      }
      
      console.log('✅ Profil oluşturuldu')
    } catch (error) {
      console.error('Profile creation error:', error)
    }
  }

  // Google OAuth
  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) throw error
    } catch (error) {
      console.error('Google OAuth error:', error)
      alert('Google girişi başarısız')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'signin' ? (
              <>
                <LogIn className="h-5 w-5 text-blue-600" />
                Giriş Yap
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5 text-green-600" />
                Kayıt Ol
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Google OAuth */}
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full mb-4"
        >
          🔍 Google ile {mode === 'signin' ? 'Giriş Yap' : 'Kayıt Ol'}
        </Button>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">veya</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              {/* Kullanıcı Tipi */}
              <div className="flex gap-2 mb-4">
                <Button
                  type="button"
                  variant={formData.userType === 'candidate' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setFormData(prev => ({ ...prev, userType: 'candidate' }))}
                >
                  <User className="h-4 w-4 mr-2" />
                  İş Arayan
                </Button>
                <Button
                  type="button"
                  variant={formData.userType === 'company' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setFormData(prev => ({ ...prev, userType: 'company' }))}
                >
                  <Building className="h-4 w-4 mr-2" />
                  İşveren
                </Button>
              </div>

              {/* Ad Soyad */}
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Ad"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                />
                <Input
                  placeholder="Soyad"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
            </>
          )}

          {/* E-posta */}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="email"
              placeholder="E-posta"
              className="pl-10"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          {/* Şifre */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="password"
              placeholder="Şifre"
              className="pl-10"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              required
            />
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'İşleniyor...' : (mode === 'signin' ? 'Giriş Yap' : 'Kayıt Ol')}
          </Button>

          {/* Mode Switch */}
          <div className="text-center">
            <button
              type="button"
              className="text-sm text-blue-600 hover:underline"
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            >
              {mode === 'signin' 
                ? 'Hesabınız yok mu? Kayıt olun' 
                : 'Zaten hesabınız var mı? Giriş yapın'
              }
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}