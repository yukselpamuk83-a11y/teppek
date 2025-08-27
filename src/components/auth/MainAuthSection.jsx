import React, { useState } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { RegistrationModal } from './RegistrationModal'
import { useAuthStore } from '../../stores/authStore'
import { toast } from '../../lib/utils'
import { 
  User, 
  Building, 
  LogIn,
  Chrome,
  Github,
  Linkedin,
  Mail,
  Lock,
  UserPlus
} from 'lucide-react'

export function MainAuthSection() {
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  
  const {
    signIn,
    signInWithGoogle,
    signInWithFacebook,
    signInWithLinkedIn,
    signInWithGitHub,
    loading
  } = useAuthStore()

  const validateLoginForm = () => {
    const newErrors = {}
    
    if (!loginData.email.trim()) {
      newErrors.email = 'E-posta gereklidir'
    } else if (!/\S+@\S+\.\S+/.test(loginData.email)) {
      newErrors.email = 'Geçerli bir e-posta giriniz'
    }
    
    if (!loginData.password.trim()) {
      newErrors.password = 'Şifre gereklidir'
    } else if (loginData.password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalıdır'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async (userType) => {
    if (!validateLoginForm()) return
    
    try {
      const result = await signIn(loginData.email, loginData.password)
      
      if (result.success) {
        toast.success(`${userType === 'company' ? 'İşveren' : 'İş Arayan'} girişi başarılı!`)
        setLoginData({ email: '', password: '' })
      } else {
        toast.error(result.error?.message || 'Giriş başarısız')
      }
    } catch (error) {
      toast.error('Beklenmeyen bir hata oluştu')
    }
  }

  const handleSocialLogin = async (provider) => {
    try {
      let result
      
      switch (provider) {
        case 'google':
          result = await signInWithGoogle()
          break
        case 'facebook':
          result = await signInWithFacebook()
          break
        case 'linkedin':
          result = await signInWithLinkedIn()
          break
        case 'github':
          result = await signInWithGitHub()
          break
        default:
          throw new Error('Desteklenmeyen sosyal medya platformu')
      }
      
      if (result.success) {
        toast.success(`${provider} ile giriş başlatıldı!`)
      } else {
        toast.error(result.error?.message || 'Sosyal medya girişi başarısız')
      }
    } catch (error) {
      console.error(`${provider} login error:`, error)
      
      if (error.message?.includes('provider is not enabled')) {
        toast.error(`${provider} girişi henüz aktif değil.`)
      } else {
        toast.error('Sosyal medya girişi sırasında hata oluştu')
      }
    }
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Teppek
              </h1>
            </div>
            <p className="text-xl text-gray-600 mb-2">Küresel İş Platformu</p>
            <p className="text-gray-500">İş arayanlar ve işverenler için modern platform</p>
          </div>

          {/* Main Auth Section */}
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
            
            {/* Login Type Buttons */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Giriş Yapın</h2>
              
              <div className="grid grid-cols-1 gap-3 mb-6">
                <Button
                  onClick={() => handleLogin('candidate')}
                  variant="outline"
                  className="h-14 flex items-center justify-start space-x-4 px-6 hover:bg-blue-50 hover:border-blue-300 group"
                  disabled={loading}
                >
                  <User className="h-6 w-6 text-blue-600 group-hover:text-blue-700" />
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">İş Arayan Girişi</div>
                    <div className="text-sm text-gray-500">Kariyer fırsatlarını keşfedin</div>
                  </div>
                </Button>
                
                <Button
                  onClick={() => handleLogin('company')}
                  variant="outline"
                  className="h-14 flex items-center justify-start space-x-4 px-6 hover:bg-green-50 hover:border-green-300 group"
                  disabled={loading}
                >
                  <Building className="h-6 w-6 text-green-600 group-hover:text-green-700" />
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">İşveren Girişi</div>
                    <div className="text-sm text-gray-500">Yetenekleri keşfedin</div>
                  </div>
                </Button>
              </div>
            </div>

            {/* Manual Login Form */}
            <div className="mb-6">
              <div className="space-y-4">
                <div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="E-posta adresiniz"
                      className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                      value={loginData.email}
                      onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="password"
                      placeholder="Şifreniz"
                      className={`pl-10 ${errors.password ? 'border-red-500' : ''}`}
                      value={loginData.password}
                      onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                  {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                </div>
              </div>
            </div>

            {/* Quick Social Login */}
            <div className="mb-6">
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-600 font-medium">veya hızlı giriş</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSocialLogin('google')}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 hover:bg-red-50 hover:border-red-200"
                >
                  <Chrome className="h-4 w-4 text-red-600" />
                  <span className="text-gray-900">Google</span>
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSocialLogin('linkedin')}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-300"
                >
                  <Linkedin className="h-4 w-4 text-blue-700" />
                  <span className="text-gray-900">LinkedIn</span>
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSocialLogin('facebook')}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-200"
                >
                  <div className="w-4 h-4 bg-blue-600 rounded text-white flex items-center justify-center text-xs font-bold">f</div>
                  <span className="text-gray-900">Facebook</span>
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSocialLogin('github')}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 hover:bg-gray-50 hover:border-gray-300"
                >
                  <Github className="h-4 w-4 text-gray-800" />
                  <span className="text-gray-900">GitHub</span>
                </Button>
              </div>
            </div>

            {/* Register Button */}
            <div className="text-center">
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-600 font-medium">hesabınız yok mu?</span>
                </div>
              </div>
              
              <Button
                onClick={() => setShowRegisterModal(true)}
                variant="teppek"
                className="w-full h-12 shadow-lg hover:shadow-xl transition-shadow"
                disabled={loading}
              >
                <UserPlus className="h-5 w-5 mr-2" />
                Kayıt Ol
              </Button>
            </div>

            {/* Footer Links */}
            <div className="text-center mt-6 space-y-2">
              <a href="#" className="text-sm text-blue-600 hover:underline block">
                Şifremi Unuttum
              </a>
              <div className="text-xs text-gray-500">
                Kayıt olarak{' '}
                <a href="#" className="text-blue-600 hover:underline">Kullanım Şartları</a>
                {' '}ve{' '}
                <a href="#" className="text-blue-600 hover:underline">Gizlilik Politikası</a>
                'nı kabul edersiniz.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      <RegistrationModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
      />
    </>
  )
}