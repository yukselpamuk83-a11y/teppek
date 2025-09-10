import React, { useState, useEffect } from 'react'

/**
 * 🚀 SMART LOADING INDICATOR
 * Shows intelligent loading phases to user
 * Provides feedback during parallel loading
 */
function SmartLoadingIndicator() {
  const [currentPhase, setCurrentPhase] = useState(1)
  const [networkSpeed, setNetworkSpeed] = useState('good')
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Detect network condition
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    if (connection) {
      const speed = connection.effectiveType === '4g' ? 'fast' : 
                   connection.effectiveType === '3g' ? 'slow' : 'medium'
      setNetworkSpeed(speed)
    }

    // Listen to smart loading events
    const handleSmartLoadingProgress = (event) => {
      const { phase, progress } = event.detail
      setCurrentPhase(phase)
      setLoadingProgress(progress)
      
      if (progress >= 100) {
        setTimeout(() => setIsVisible(false), 500)
      }
    }

    // Custom event listener for smart loader
    window.addEventListener('smartLoadingProgress', handleSmartLoadingProgress)

    // Simulate progress for demo (remove in production)
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        const newProgress = prev + (networkSpeed === 'fast' ? 15 : networkSpeed === 'slow' ? 5 : 10)
        
        if (newProgress >= 33 && currentPhase === 1) {
          setCurrentPhase(2)
        } else if (newProgress >= 66 && currentPhase === 2) {
          setCurrentPhase(3)
        }
        
        return Math.min(newProgress, 100)
      })
    }, networkSpeed === 'fast' ? 200 : networkSpeed === 'slow' ? 800 : 400)

    return () => {
      window.removeEventListener('smartLoadingProgress', handleSmartLoadingProgress)
      clearInterval(interval)
    }
  }, [currentPhase, networkSpeed])

  if (!isVisible) return null

  const getPhaseInfo = () => {
    switch (currentPhase) {
      case 1:
        return {
          title: 'Temel Sistem Yükleniyor',
          description: 'React ve Harita motoru hazırlanıyor...',
          color: 'bg-blue-600',
          icon: '⚡'
        }
      case 2:
        return {
          title: 'Veri Bağlantıları',
          description: 'Veritabanı ve harita eklentileri yükleniyor...',
          color: 'bg-green-600',
          icon: '🔗'
        }
      case 3:
        return {
          title: 'Son Dokunuşlar',
          description: 'Dil paketi ve görsel bileşenler hazırlanıyor...',
          color: 'bg-purple-600',
          icon: '✨'
        }
      default:
        return {
          title: 'Yükleniyor',
          description: 'Sistem hazırlanıyor...',
          color: 'bg-gray-600',
          icon: '🔄'
        }
    }
  }

  const phaseInfo = getPhaseInfo()
  const networkIcon = networkSpeed === 'fast' ? '🚀' : networkSpeed === 'slow' ? '🐌' : '📶'

  return (
    <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50">
      <div className="max-w-md mx-auto text-center p-8">
        {/* Loading Icon */}
        <div className="mb-6">
          <div className="text-6xl mb-4 animate-pulse">
            {phaseInfo.icon}
          </div>
        </div>

        {/* Phase Information */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {phaseInfo.title}
          </h2>
          <p className="text-gray-600 text-sm">
            {phaseInfo.description}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${phaseInfo.color}`}
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Aşama {currentPhase}/3</span>
            <span>%{Math.round(loadingProgress)}</span>
          </div>
        </div>

        {/* Network Indicator */}
        <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
          <span>{networkIcon}</span>
          <span>
            {networkSpeed === 'fast' ? 'Hızlı bağlantı' : 
             networkSpeed === 'slow' ? 'Yavaş bağlantı' : 'Normal bağlantı'}
          </span>
        </div>

        {/* Phase Indicators */}
        <div className="flex justify-center space-x-2 mt-4">
          {[1, 2, 3].map((phase) => (
            <div
              key={phase}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                phase <= currentPhase 
                  ? phaseInfo.color.replace('bg-', 'bg-') 
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default SmartLoadingIndicator