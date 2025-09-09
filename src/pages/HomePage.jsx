import React, { useEffect } from 'react'

// Minimal home page - sadece hoş geldin mesajı ve navigation
export default function HomePage({ onViewChange }) {
  
  // Background'da map sayfasını preload et (3 saniye sonra)
  useEffect(() => {
    const timer = setTimeout(() => {
      // MapPage'i background'da yükle
      import('./MapPage').then(() => {
        console.log('🚀 MapPage preloaded in background')
      })
    }, 3000)
    
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center max-w-2xl px-4">
        {/* Hero Section */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Welcome to <span className="text-blue-600">Teppek</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8">
            Discover job opportunities worldwide with our interactive map-based platform
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => onViewChange?.('map')}
            className="btn-critical btn-primary px-8 py-3 text-lg font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            🗺️ Explore Jobs on Map
          </button>
          
          <button
            onClick={() => onViewChange?.('dashboard')}
            className="btn-critical px-8 py-3 text-lg font-semibold bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:border-blue-400 transition-all"
          >
            📊 View Dashboard
          </button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="text-center p-6">
            <div className="text-3xl mb-3">🌍</div>
            <h3 className="font-semibold mb-2">Global Opportunities</h3>
            <p className="text-sm text-gray-600">Find jobs from companies worldwide</p>
          </div>
          
          <div className="text-center p-6">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-semibold mb-2">Lightning Fast</h3>
            <p className="text-sm text-gray-600">Optimized for speed and performance</p>
          </div>
          
          <div className="text-center p-6">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="font-semibold mb-2">Smart Matching</h3>
            <p className="text-sm text-gray-600">AI-powered job recommendations</p>
          </div>
        </div>
      </div>
    </div>
  )
}