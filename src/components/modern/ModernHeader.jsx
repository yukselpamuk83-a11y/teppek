// BASIT HEADER - Auth ile
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/Button'
import { Settings, BarChart3, LogIn, Globe, Home, LayoutDashboard } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import UserAvatar from '../auth/UserAvatar'
import AuthModal from '../auth/AuthModal'

export function ModernHeader({ currentView = 'map', onViewChange }) {
  const { isAuthenticated, loading } = useAuth()
  const { t, i18n } = useTranslation()
  const [showAuthModal, setShowAuthModal] = useState(false)
  
  const toggleLanguage = () => {
    const newLang = i18n.language === 'tr' ? 'en' : 'tr'
    i18n.changeLanguage(newLang)
  }

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm z-[1000] sticky top-0">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {/* Logo */}
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            
            {/* Brand Name and Tagline */}
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-gray-900 leading-none">Teppek</h1>
              <p className="text-xs text-gray-500 leading-none">{t('brand.tagline')}</p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <div className="flex items-center space-x-3">
          {/* View Navigation - Show if authenticated */}
          {isAuthenticated && (
            <div className="flex items-center space-x-2">
              <Button 
                variant={currentView === 'map' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewChange && onViewChange('map')}
              >
                <Home className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Harita</span>
              </Button>
              
              <Button 
                variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewChange && onViewChange('dashboard')}
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Panel</span>
              </Button>
            </div>
          )}
          
          {/* Language Switcher */}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={toggleLanguage}
            title={i18n.language === 'tr' ? 'Switch to English' : 'Türkçe\'ye geç'}
          >
            <Globe className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">
              {i18n.language === 'tr' ? 'EN' : 'TR'}
            </span>
          </Button>
          
          {isAuthenticated ? (
            <>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{t('profile.settings')}</span>
              </Button>
              
              <Button variant="ghost" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{t('navigation.profile')}</span>
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
              {t('buttons.login', 'Giriş Yap')}
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