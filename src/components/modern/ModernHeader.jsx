// DENEYSEL PROJE - Modern Header Component
import React, { useState } from 'react'
import { Button } from '../ui/Button'
import { SimpleAuthModal } from '../auth/SimpleAuthModal'
import { useAuthStore } from '../../stores/authStore'
import { analytics } from '../../lib/analytics'
import NotificationInbox from '../ui/inbox/NotificationInbox'
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
  const [authModal, setAuthModal] = useState({ isOpen: false, mode: 'signin', userType: 'candidate' })
  // Simple fallback for removed auth components
  const [registrationModal, setRegistrationModal] = useState(false)
  const [postRegistrationModal, setPostRegistrationModal] = useState(false)
  const { user, signOut, isAuthenticated } = useAuthStore()

  const handleRegisterClick = () => {
    setRegistrationModal(true)
  }

  const handleLoginTypeSelect = (userType) => {
    setAuthModal({ isOpen: true, mode: 'signin', userType })
  }

  const handleRegistrationSuccess = () => {
    setRegistrationModal(false)
    setPostRegistrationModal(true)
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
              
              <NotificationInbox 
                userId={user?.id || '68b3af7a3c95e3a7907d87cb'} 
                userEmail={user?.email || 'test@example.com'} 
              />
              
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
            // Guest User Menu - Yeni Renkli Tasarım
            <>
              <Button 
                variant="candidate"
                size="sm"
                onClick={() => handleLoginTypeSelect('candidate')}
                className="hidden sm:flex font-semibold"
              >
                <User className="h-4 w-4 mr-2" />
                İş Arayan
              </Button>
              
              <Button 
                variant="employer"
                size="sm"
                onClick={() => handleLoginTypeSelect('company')}
                className="hidden sm:flex font-semibold"
              >
                <Building className="h-4 w-4 mr-2" />
                İşveren
              </Button>
              
              <Button 
                variant="register"
                size="sm"
                onClick={handleRegisterClick}
                className="shadow-lg hover:shadow-xl font-semibold"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Kayıt Ol</span>
                <span className="sm:hidden">Kayıt</span>
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Auth Modals - Temporarily disabled */}
      {false && (
        <>
          <RegistrationModal
            isOpen={registrationModal}
            onClose={() => setRegistrationModal(false)}
            onRegistrationSuccess={handleRegistrationSuccess}
          />

          <PostRegistrationUserTypeModal
            isOpen={postRegistrationModal}
            onClose={() => setPostRegistrationModal(false)}
          />

          <AuthModal
            isOpen={authModal.isOpen}
            onClose={() => setAuthModal({ isOpen: false, mode: 'signin', userType: 'candidate' })}
            defaultMode={authModal.mode}
            initialUserType={authModal.userType}
          />
        </>
      )}
    </>
  )
}