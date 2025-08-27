// DENEYSEL PROJE - Modern Auth Modal
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useAuthStore } from '../../stores/authStore'
import { toast } from '../../lib/utils'
import { validators } from '../../lib/utils'
import { 
  LogIn, 
  UserPlus, 
  Mail, 
  Lock, 
  User, 
  Building,
  Chrome
} from 'lucide-react'

export function AuthModal({ isOpen, onClose, defaultMode = 'signin' }) {
  const [mode, setMode] = useState(defaultMode) // 'signin', 'signup'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    userType: 'user' // 'user', 'company'
  })
  const [errors, setErrors] = useState({})
  
  const { 
    signIn, 
    signUp, 
    signInWithGoogle,
    signInWithFacebook,
    signInWithLinkedIn,
    signInWithTwitter,
    signInWithGitHub,
    loading 
  } = useAuthStore()

  const validateForm = () => {
    const newErrors = {}
    
    if (!validators.email(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz'
    }
    
    if (!validators.password(formData.password)) {
      newErrors.password = 'Şifre en az 6 karakter olmalıdır'
    }
    
    if (mode === 'signup') {
      if (!validators.required(formData.firstName)) {
        newErrors.firstName = 'Ad alanı gereklidir'
      }
      if (!validators.required(formData.lastName)) {
        newErrors.lastName = 'Soyad alanı gereklidir'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    try {
      let result
      
      if (mode === 'signin') {
        result = await signIn(formData.email, formData.password)
      } else {
        result = await signUp(formData.email, formData.password, {
          first_name: formData.firstName,
          last_name: formData.lastName,
          user_type: formData.userType
        })
      }
      
      if (result.success) {
        toast.success(mode === 'signin' ? 'Giriş başarılı!' : 'Kayıt başarılı!')
        onClose()
        setFormData({ email: '', password: '', firstName: '', lastName: '', userType: 'user' })
      } else {
        toast.error(result.error?.message || 'İşlem başarısız')
      }
    } catch (error) {
      toast.error('Beklenmeyen bir hata oluştu')
    }
  }

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
    setErrors({})
  }

  const handleSocialLogin = async (provider) => {
    try {
      // Now with correct API keys, let's try social login
      console.log(`🔄 Attempting ${provider} login...`)

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
        case 'twitter':
          result = await signInWithTwitter()
          break
        case 'github':
          result = await signInWithGitHub()
          break
        default:
          throw new Error('Desteklenmeyen sosyal medya platformu')
      }
      
      if (result.success) {
        toast.success(`${provider} ile giriş başlatıldı!`)
        // OAuth will redirect, so we don't close modal here
      } else {
        toast.error(result.error?.message || 'Sosyal medya girişi başarısız')
      }
    } catch (error) {
      console.error(`${provider} login error:`, error)
      
      // More user-friendly error messages
      if (error.message?.includes('provider is not enabled')) {
        toast.error(`${provider} girişi henüz aktif değil. Lütfen e-posta ile giriş yapın.`)
      } else {
        toast.error('Sosyal medya girişi sırasında hata oluştu')
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md modal-content">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            {mode === 'signin' ? (
              <>
                <LogIn className="h-5 w-5 text-blue-600" />
                <span className="text-gray-900">Teppek'e Giriş Yap</span>
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5 text-green-600" />
                <span className="text-gray-900">Teppek'e Kayıt Ol</span>
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Social Login Section */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialLogin('google')}
              disabled={loading}
              className="flex items-center justify-center gap-2 hover:bg-red-50 hover:border-red-200 text-gray-900"
            >
              <Chrome className="h-4 w-4 text-red-600" />
              <span className="hidden sm:inline text-gray-900">Google</span>
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialLogin('facebook')}
              disabled={loading}
              className="flex items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-200 text-gray-900"
            >
              <div className="w-4 h-4 bg-blue-600 rounded text-white flex items-center justify-center text-xs font-bold">f</div>
              <span className="hidden sm:inline text-gray-900">Facebook</span>
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialLogin('linkedin')}
              disabled={loading}
              className="flex items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-300 text-xs text-gray-900"
            >
              <div className="w-4 h-4 bg-blue-700 rounded text-white flex items-center justify-center text-xs font-bold">in</div>
              <span className="hidden sm:inline text-gray-900">LinkedIn</span>
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialLogin('twitter')}
              disabled={loading}
              className="flex items-center justify-center gap-2 hover:bg-sky-50 hover:border-sky-200 text-xs text-gray-900"
            >
              <div className="w-4 h-4 bg-sky-500 rounded-full text-white flex items-center justify-center text-xs font-bold">𝕏</div>
              <span className="hidden sm:inline text-gray-900">Twitter</span>
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialLogin('github')}
              disabled={loading}
              className="flex items-center justify-center gap-2 hover:bg-gray-50 hover:border-gray-300 text-xs text-gray-900"
            >
              <div className="w-4 h-4 bg-gray-800 rounded-full text-white flex items-center justify-center text-xs font-bold">⚡</div>
              <span className="hidden sm:inline text-gray-900">GitHub</span>
            </Button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-600 font-medium">veya e-posta ile</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              {/* User Type Selection */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={formData.userType === 'user' ? 'teppek' : 'outline'}
                  size="sm"
                  className={`flex-1 ${formData.userType !== 'user' ? 'text-gray-900' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, userType: 'user' }))}
                >
                  <User className="h-4 w-4 mr-2" />
                  <span>İş Arayan</span>
                </Button>
                <Button
                  type="button"
                  variant={formData.userType === 'company' ? 'teppek' : 'outline'}
                  size="sm"
                  className={`flex-1 ${formData.userType !== 'company' ? 'text-gray-900' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, userType: 'company' }))}
                >
                  <Building className="h-4 w-4 mr-2" />
                  <span>İşveren</span>
                </Button>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Input
                    placeholder="Ad"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className={errors.firstName ? 'border-red-500' : ''}
                  />
                  {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <Input
                    placeholder="Soyad"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className={errors.lastName ? 'border-red-500' : ''}
                  />
                  {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="email"
                placeholder="E-posta adresiniz"
                className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="password"
                placeholder="Şifreniz"
                className={`pl-10 ${errors.password ? 'border-red-500' : ''}`}
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            variant="teppek"
            disabled={loading}
          >
            {loading ? 'İşleniyor...' : (mode === 'signin' ? 'Giriş Yap' : 'Kayıt Ol')}
          </Button>

          {/* Switch Mode */}
          <div className="text-center">
            <Button
              type="button"
              variant="link"
              onClick={switchMode}
              className="text-sm text-gray-700 hover:text-gray-900"
            >
              <span className="text-gray-700 hover:text-gray-900">
                {mode === 'signin' 
                  ? 'Hesabınız yok mu? Kayıt olun' 
                  : 'Zaten hesabınız var mı? Giriş yapın'
                }
              </span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}