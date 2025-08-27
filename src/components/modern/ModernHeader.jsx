// DENEYSEL PROJE - Modern Header Component
import { useState } from 'react'
import { Button } from '../ui/Button'
import { AuthModal } from '../auth/AuthModal'
import { useAuthStore } from '../../stores/authStore'
import { analytics } from '../../lib/analytics'
import { 
  LogIn, 
  UserPlus, 
  User, 
  Building,
  LogOut,
  Settings,
  BarChart3
} from 'lucide-react'

export function ModernHeader() {
  const [authModal, setAuthModal] = useState({ isOpen: false, mode: 'signin' })
  const { user, signOut, isAuthenticated } = useAuthStore()

  const handleAuthClick = (mode) => {
    setAuthModal({ isOpen: true, mode })
    analytics.events.authAction('modal_open', mode)
  }

  const handleSignOut = async () => {
    await signOut()
    analytics.events.authAction('sign_out', user?.user_metadata?.user_type)
  }

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm z-[1000] sticky top-0">
        {/* Logo & Title */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Teppek Dev
            </h1>
          </div>
          <div className="hidden sm:block">
            <span className="text-sm text-gray-500 bg-yellow-100 px-2 py-1 rounded-full">
              🧪 Deneysel Versiyon
            </span>
          </div>
        </div>
        
        {/* Navigation */}
        <div className="flex items-center space-x-3">
          {isAuthenticated() ? (
            // Authenticated User Menu
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 hidden sm:block">
                Merhaba, {user?.user_metadata?.first_name || 'Kullanıcı'}!
              </span>
              
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Ayarlar</span>
              </Button>
              
              <Button variant="ghost" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">İstatistikler</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Çıkış
              </Button>
            </div>
          ) : (
            // Guest User Menu
            <>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => handleAuthClick('signin')}
                className="hidden sm:flex"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Giriş Yap
              </Button>
              
              <Button 
                variant="teppek"
                size="sm"
                onClick={() => handleAuthClick('signup')}
                className="shadow-lg hover:shadow-xl transition-shadow"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Kayıt Ol</span>
                <span className="sm:hidden">Kayıt</span>
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModal.isOpen}
        onClose={() => setAuthModal({ isOpen: false, mode: 'signin' })}
        defaultMode={authModal.mode}
      />
    </>
  )
}