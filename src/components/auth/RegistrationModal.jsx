import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useAuthStore } from '../../stores/authStore'
import { toast } from '../../lib/utils'
import { 
  User, 
  Building, 
  UserPlus,
  Chrome,
  Github,
  Linkedin,
  ArrowLeft,
  Mail,
  Lock
} from 'lucide-react'

export function RegistrationModal({ isOpen, onClose, onRegistrationSuccess }) {
  const [step, setStep] = useState('registrationMethod') // 'registrationMethod', 'manualForm'
  const [selectedUserType, setSelectedUserType] = useState(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})

  const {
    signUp,
    signInWithGoogle,
    signInWithFacebook,
    signInWithLinkedIn,
    signInWithGitHub,
    loading
  } = useAuthStore()

  const resetModal = () => {
    setStep('registrationMethod')
    setSelectedUserType(null)
    setFormData({ email: '', password: '', firstName: '', lastName: '', confirmPassword: '' })
    setErrors({})
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  // Removed user type selection - will be done after registration

  const handleRegistrationMethodSelect = (method) => {
    if (method === 'manual') {
      setStep('manualForm')
    } else {
      // Social registration
      handleSocialRegistration(method)
    }
  }

  const handleSocialRegistration = async (provider) => {
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
        toast.success(`${provider} ile kayıt başlatıldı!`)
        handleClose()
        if (onRegistrationSuccess) {
          onRegistrationSuccess()
        }
      } else {
        toast.error(result.error?.message || 'Sosyal medya kaydı başarısız')
      }
    } catch (error) {
      console.error(`${provider} registration error:`, error)
      
      if (error.message?.includes('provider is not enabled')) {
        toast.error(`${provider} kaydı henüz aktif değil.`)
      } else {
        toast.error('Sosyal medya kaydı sırasında hata oluştu')
      }
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.email.trim()) {
      newErrors.email = 'E-posta gereklidir'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta giriniz'
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Şifre gereklidir'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalıdır'
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Şifreler eşleşmiyor'
    }
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Ad gereklidir'
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Soyad gereklidir'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleManualRegistration = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    try {
      const metadata = {
        first_name: formData.firstName,
        last_name: formData.lastName
        // user_type will be selected after registration
      }
      
      const result = await signUp(formData.email, formData.password, metadata)
      
      if (result.success) {
        toast.success('Kayıt başarılı!')
        handleClose()
        if (onRegistrationSuccess) {
          onRegistrationSuccess()
        }
      } else {
        toast.error(result.error?.message || 'Kayıt başarısız')
      }
    } catch (error) {
      toast.error('Beklenmeyen bir hata oluştu')
    }
  }

  // Removed user type selection - will be done after registration

  const renderRegistrationMethod = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Kayıt Ol</h2>
        <p className="text-gray-600 text-sm">Kayıt yönteminizi seçin</p>
      </div>

      {/* Quick Social Registration */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700 text-center">Hızlı Kayıt</p>
        
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => handleRegistrationMethodSelect('google')}
            variant="outline"
            disabled={loading}
            className="flex items-center justify-center gap-2 hover:bg-red-50 hover:border-red-200"
          >
            <Chrome className="h-4 w-4 text-red-600" />
            <span className="text-gray-900">Google</span>
          </Button>
          
          <Button
            onClick={() => handleRegistrationMethodSelect('linkedin')}
            variant="outline"
            disabled={loading}
            className="flex items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-300"
          >
            <Linkedin className="h-4 w-4 text-blue-700" />
            <span className="text-gray-900">LinkedIn</span>
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => handleRegistrationMethodSelect('facebook')}
            variant="outline"
            disabled={loading}
            className="flex items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-200"
          >
            <div className="w-4 h-4 bg-blue-600 rounded text-white flex items-center justify-center text-xs font-bold">f</div>
            <span className="text-gray-900">Facebook</span>
          </Button>
          
          <Button
            onClick={() => handleRegistrationMethodSelect('github')}
            variant="outline"
            disabled={loading}
            className="flex items-center justify-center gap-2 hover:bg-gray-50 hover:border-gray-300"
          >
            <Github className="h-4 w-4 text-gray-800" />
            <span className="text-gray-900">GitHub</span>
          </Button>
        </div>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-600 font-medium">veya</span>
        </div>
      </div>

      {/* Manual Registration */}
      <Button
        onClick={() => handleRegistrationMethodSelect('manual')}
        variant="teppek"
        className="w-full"
        disabled={loading}
      >
        <UserPlus className="h-4 w-4 mr-2" />
        E-posta ile Kayıt Ol
      </Button>

      {/* Removed back button to user type selection */}
    </div>
  )

  const renderManualForm = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Kayıt Bilgileri</h2>
      </div>

      <form onSubmit={handleManualRegistration} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
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

        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="email"
            placeholder="E-posta adresiniz"
            className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="password"
            placeholder="Şifreniz"
            className={`pl-10 ${errors.password ? 'border-red-500' : ''}`}
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          />
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="password"
            placeholder="Şifrenizi tekrar giriniz"
            className={`pl-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
            value={formData.confirmPassword}
            onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
          />
          {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          variant="teppek"
          disabled={loading}
        >
          {loading ? 'Kaydediliyor...' : 'Kayıt Ol'}
        </Button>

        <Button
          type="button"
          onClick={() => setStep('registrationMethod')}
          variant="ghost"
          className="w-full"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri
        </Button>
      </form>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {step === 'registrationMethod' && 'Kayıt Ol'}
            {step === 'manualForm' && 'Kayıt Bilgileri'}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {step === 'registrationMethod' && renderRegistrationMethod()}
          {step === 'manualForm' && renderManualForm()}
        </div>

        <div className="text-center text-xs text-gray-500">
          Kayıt olarak{' '}
          <a href="#" className="text-blue-600 hover:underline">Kullanım Şartları</a>
          {' '}ve{' '}
          <a href="#" className="text-blue-600 hover:underline">Gizlilik Politikası</a>
          'nı kabul edersiniz.
        </div>
      </DialogContent>
    </Dialog>
  )
}