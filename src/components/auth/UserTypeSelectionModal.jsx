import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { 
  User, 
  Building, 
  Briefcase, 
  UserPlus,
  Chrome,
  Github,
  Linkedin
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { toast } from '../../lib/utils'

export function UserTypeSelectionModal({ isOpen, onClose, onUserTypeSelect }) {
  const {
    signInWithGoogle,
    signInWithFacebook,
    signInWithLinkedIn,
    signInWithGitHub,
    loading
  } = useAuthStore()

  const handleUserTypeSelect = (userType) => {
    onUserTypeSelect(userType)
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
        onClose()
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-gray-900 mb-2">
            Teppek'e Katıl
          </DialogTitle>
          <p className="text-center text-gray-600 text-sm">
            Hangi kullanıcı türü olarak kayıt olmak istiyorsunuz?
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Type Selection */}
          <div className="grid grid-cols-1 gap-4">
            <Button
              onClick={() => handleUserTypeSelect('candidate')}
              variant="outline"
              className="h-20 flex-col space-y-2 hover:bg-blue-50 hover:border-blue-300 group"
              disabled={loading}
            >
              <User className="h-8 w-8 text-blue-600 group-hover:text-blue-700" />
              <div className="text-center">
                <div className="font-semibold text-gray-900">İş Arayan</div>
                <div className="text-sm text-gray-500">Kariyer fırsatları keşfedin</div>
              </div>
            </Button>
            
            <Button
              onClick={() => handleUserTypeSelect('company')}
              variant="outline"
              className="h-20 flex-col space-y-2 hover:bg-green-50 hover:border-green-300 group"
              disabled={loading}
            >
              <Building className="h-8 w-8 text-green-600 group-hover:text-green-700" />
              <div className="text-center">
                <div className="font-semibold text-gray-900">İşveren</div>
                <div className="text-sm text-gray-500">Yetenekleri keşfedin, ekip kurun</div>
              </div>
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-600 font-medium">veya hızlı giriş</span>
            </div>
          </div>

          {/* Social Login Options */}
          <div className="space-y-3">
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
            
            <div className="grid grid-cols-2 gap-3">
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

          <div className="text-center text-xs text-gray-500">
            Kayıt olarak <a href="#" className="text-blue-600 hover:underline">Kullanım Şartları</a> ve{' '}
            <a href="#" className="text-blue-600 hover:underline">Gizlilik Politikası</a>'nı kabul edersiniz.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}