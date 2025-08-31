// BASIT HEADER - Auth ile
import React, { useState } from 'react'
import { Button } from '../ui/Button'
import { Settings, BarChart3, LogIn } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import UserAvatar from '../auth/UserAvatar'
import AuthModal from '../auth/AuthModal'

export function ModernHeader() {
  const { isAuthenticated, loading } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm z-[1000] sticky top-0">
        <div className="flex items-center space-x-4">
        </div>
        
        {/* Navigation */}
        <div className="flex items-center space-x-3">
          {isAuthenticated ? (
            <>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Ayarlar</span>
              </Button>
              
              <Button variant="ghost" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">İstatistikler</span>
              </Button>
              
              <UserAvatar />
            </>
          ) : (
            <Button 
              onClick={() => setShowAuthModal(true)}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Giriş Yap
            </Button>
          )}
        </div>
      </header>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  )
}