import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { useAuth } from '../../contexts/AuthContext'
import { 
  Mail, 
  Eye, 
  EyeOff, 
  Apple, 
  Github, 
  Chrome as Google,
  Facebook,
  Twitter,
  Linkedin,
  Building2 as Microsoft
} from 'lucide-react'

const AuthModal = ({ isOpen, onClose, defaultMode = 'signin' }) => {
  const { t } = useTranslation()
  const [mode, setMode] = useState(defaultMode) // 'signin', 'signup'
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  })
  const [localLoading, setLocalLoading] = useState(false)

  const { signInWithEmail, signUpWithEmail, signInWithProvider, loading } = useAuth()

  const isLoading = loading || localLoading

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleEmailAuth = async (e) => {
    e.preventDefault()
    setLocalLoading(true)

    try {
      if (mode === 'signup') {
        if (formData.password !== formData.confirmPassword) {
          return // Toast will be shown by context
        }

        const { error } = await signUpWithEmail(
          formData.email,
          formData.password,
          { name: formData.name }
        )

        if (!error) {
          onClose()
        }
      } else {
        const { error } = await signInWithEmail(formData.email, formData.password)
        
        if (!error) {
          onClose()
        }
      }
    } finally {
      setLocalLoading(false)
    }
  }

  const handleSocialAuth = async (provider) => {
    setLocalLoading(true)
    try {
      const { error } = await signInWithProvider(provider)
      // OAuth will redirect, so we don't close modal here
    } finally {
      setLocalLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      name: ''
    })
  }

  const switchMode = (newMode) => {
    setMode(newMode)
    resetForm()
  }

  const socialProviders = [
    {
      id: 'google',
      name: 'Google',
      icon: Google,
      color: 'bg-red-500 hover:bg-red-600',
      available: true
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: Github,
      color: 'bg-gray-800 hover:bg-gray-900',
      available: false
    },
    {
      id: 'apple',
      name: 'Apple',
      icon: Apple,
      color: 'bg-black hover:bg-gray-800',
      available: false
    },
    {
      id: 'microsoft',
      name: 'Microsoft',
      icon: Microsoft,
      color: 'bg-blue-600 hover:bg-blue-700',
      available: false
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      available: false
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: Twitter,
      color: 'bg-sky-500 hover:bg-sky-600',
      available: false
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-blue-700 hover:bg-blue-800',
      available: false
    }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {mode === 'signin' ? t('auth.signIn') : t('auth.signUp')}
          </DialogTitle>
          <DialogDescription className="text-center">
            {mode === 'signin' 
              ? t('auth.signInDescription') 
              : t('auth.signUpDescription')
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Social Login Buttons */}
          <div className="space-y-3">
            <p className="text-sm text-gray-600 text-center">
              {t('auth.signInWithSocial')}
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              {socialProviders.map((provider) => {
                const IconComponent = provider.icon
                
                return (
                  <Button
                    key={provider.id}
                    variant="outline"
                    className={`${provider.available ? provider.color + ' text-white border-transparent' : 'bg-gray-200 text-gray-400 cursor-not-allowed'} relative`}
                    onClick={() => provider.available && handleSocialAuth(provider.id)}
                    disabled={isLoading || !provider.available}
                  >
                    <IconComponent className="h-4 w-4 mr-2" />
                    {provider.name}
                    {!provider.available && (
                      <span className="absolute top-0 right-0 text-xs bg-yellow-500 text-white px-1 rounded-bl">
                        {t('auth.soon')}
                      </span>
                    )}
                  </Button>
                )
              })}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">
                {t('auth.orWithEmail')}
              </span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <Input
                  name="name"
                  type="text"
                  placeholder={t('auth.fullName')}
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
              </div>
            )}

            <div>
              <Input
                name="email"
                type="email"
                placeholder={t('auth.emailPlaceholder')}
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={isLoading}
                className="pl-10"
              />
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>

            <div className="relative">
              <Input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('auth.password')}
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={isLoading}
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>

            {mode === 'signup' && (
              <div>
                <Input
                  name="confirmPassword"
                  type="password"
                  placeholder={t('auth.confirmPassword')}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <LoadingSpinner className="h-4 w-4 mr-2" />
              ) : null}
              {mode === 'signin' ? t('auth.signIn') : t('auth.signUp')}
            </Button>
          </form>

          {/* Mode Switch */}
          <div className="text-center text-sm">
            {mode === 'signin' ? (
              <>
                {t('auth.noAccount')}{' '}
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                  onClick={() => switchMode('signup')}
                  disabled={isLoading}
                >
                  {t('auth.createAccount')}
                </button>
              </>
            ) : (
              <>
                {t('auth.haveAccount')}{' '}
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                  onClick={() => switchMode('signin')}
                  disabled={isLoading}
                >
                  {t('auth.signInHere')}
                </button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AuthModal