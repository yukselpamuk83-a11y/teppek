import React, { useState } from 'react'
import { useSimpleAuth } from '../../hooks/useSimpleAuth'
import { toast } from '../../stores/toastStore'

export function PremiumModal({ isOpen, onClose }) {
  const { user, isAuthenticated } = useSimpleAuth()
  const [loading, setLoading] = useState(false)
  
  if (!isOpen) return null

  const handleSubscribe = async (plan) => {
    setLoading(true)
    
    try {
      // Simulated subscription process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success(`${plan} planına başarıyla abone oldunuz! 🎉`, {
        duration: 5000
      })
      
      // Analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'subscription', {
          event_category: 'premium',
          event_label: plan,
          value: plan === 'Pro' ? 29 : 9
        })
      }
      
      onClose()
    } catch (error) {
      toast.error('Abonelik işlemi başarısız. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  const plans = [
    {
      name: 'Basic',
      price: '₺29',
      period: '/ay',
      features: [
        '100km mesafe limiti kaldırılır',
        '500+ ek iş ilanına erişim',
        'Temel filtreler',
        'E-posta destek'
      ],
      popular: false
    },
    {
      name: 'Pro',
      price: '₺49',
      period: '/ay',
      features: [
        'Sınırsız mesafe erişimi',
        'Tüm iş ilanları ve CV\'ler',
        'Gelişmiş filtreler',
        'Öncelikli destek',
        'Profil öne çıkarma',
        'İlan bildirimler'
      ],
      popular: true
    }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[10000] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 text-2xl"
          >
            ×
          </button>
          <div className="text-center">
            <div className="text-4xl mb-2">⭐</div>
            <h2 className="text-2xl font-bold mb-2">Premium'a Geçin</h2>
            <p className="text-white/90">50km'den uzak iş ilanlarını görüntüleyin ve daha fazlasına erişin</p>
          </div>
        </div>

        {/* Plans */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-xl border-2 p-6 ${
                  plan.popular
                    ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold">
                      EN POPÜLER
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center">
                    <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 ml-1">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.name)}
                  disabled={loading}
                  className={`w-full py-3 px-6 rounded-lg font-bold text-white transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-lg'
                      : 'bg-gray-600 hover:bg-gray-700'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      İşleniyor...
                    </div>
                  ) : (
                    `${plan.name} Planını Seç`
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-600">
            <p className="mb-2">💳 Güvenli ödeme • 🔄 İstediğiniz zaman iptal edin</p>
            <p>Tüm planlar 7 gün ücretsiz deneme ile başlar</p>
          </div>
        </div>
      </div>
    </div>
  )
}