// MODERN TEPPEK APP - Basit ve Çalışan Versiyon
import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react'
import { useTranslation } from 'react-i18next'
import { ModernHeader } from './components/modern/ModernHeader'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useToastStore } from './stores/toastStore'
import { ToastContainer } from './components/ui/Toast'
import { ComponentErrorBoundary } from './components/ui/ComponentErrorBoundary'
import { analytics, speedInsights } from './lib/analytics'
import { useRealtimeData } from './hooks/useRealtimeData'
import { useDataCache } from './hooks/useDataCache'
import { getDistance } from './utils/distance'
import NotificationInbox from './components/ui/inbox/NotificationInbox'
import logger from './utils/logger.js'

// Lazy loaded components - performans için
const AuthCallback = lazy(() => import('./components/auth/AuthCallback'))
const MapComponent = lazy(() => import('./components/MapComponent'))
const FilterComponent = lazy(() => import('./components/FilterComponent'))
const ListComponent = lazy(() => import('./components/ListComponent'))
const PaginationComponent = lazy(() => import('./components/PaginationComponent'))
const DashboardPanel = lazy(() => import('./components/pages/DashboardPanel'))

function ModernAppContent() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const { t } = useTranslation()
  const [startTime] = useState(Date.now())
  
  // Toast state
  const { toasts, removeToast } = useToastStore()
  
  // App state  
  const [data, setData] = useState([])
  const [activeFilters, setActiveFilters] = useState({ type: 'all', keyword: '' })
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [userLocation, setUserLocation] = useState(null)
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [currentView, setCurrentView] = useState('map') // 'map' or 'dashboard'
  
  // Realtime data disabled to reduce database load
  // const realtimeData = useRealtimeData(userLocation)
  const realtimeData = [] // Empty array for now
  
  const itemsPerPage = 100 // İlk 100 ilan performans için

  // Check for auth callback
  const isAuthCallback = window.location.pathname === '/auth/callback'

  // Get user location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setUserLocation(location)
        logger.debug('✅ Konum alındı:', location)
      },
      (error) => {
        logger.warn("Konum alınamadı:", error)
        const fallbackLocation = { lat: 41.01, lng: 28.97 } // Istanbul
        setUserLocation(fallbackLocation)
      }
    )
  }, [])

  // Responsive handling
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Cached data fetching function - DÜZELTME: setData çağrısını kaldır, sadece data return et
  const fetchJobsData = useCallback(async () => {
    if (!userLocation?.lat || !userLocation?.lng) return []
      const measureDataLoad = speedInsights.measureDataLoad('jobs')
      
      try {
        logger.debug('🔄 Modern App: İş ilanları yükleniyor...')
        
        
        // Production'da gerçek API call - statik GeoJSON dosyası
        try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
          const response = await fetch(`${supabaseUrl}/storage/v1/object/public/public-assets/map-data.geojson`)
          
          const geoJsonData = await response.json()
          
          if (geoJsonData.type === 'FeatureCollection' && geoJsonData.features?.length > 0) {
            const formattedData = geoJsonData.features.map(feature => ({
              id: feature.properties.id,
              type: feature.properties.type,
              title: feature.properties.title,
              company: feature.properties.company || feature.properties.user || 'Belirtilmemiş',
              name: feature.properties.company || feature.properties.user || feature.properties.name,
              city: feature.properties.city,
              country: feature.properties.country,
              address: feature.properties.city ? 
                (feature.properties.country ? `${feature.properties.city}, ${feature.properties.country}` : feature.properties.city) :
                (feature.properties.country || 'Lokasyon bilgisi yok'),
              location: {
                lat: feature.geometry.coordinates[1], // GeoJSON: [lon, lat]
                lng: feature.geometry.coordinates[0]
              },
              salary_min: feature.properties.salary_min,
              salary_max: feature.properties.salary_max,
              currency: feature.properties.currency,
              applyUrl: feature.properties.applyUrl,
              contact: feature.properties.contact,
              source: feature.properties.source || 'manual',
              popup_html: feature.properties.popup_html, // ← EN ÖNEMLİSİ! DB'den gelen popup HTML
              url: feature.properties.url, // Apply URL for Adzuna
              skills: feature.properties.skills,
              experience_years: feature.properties.experience_years,
              remote: feature.properties.remote,
              full_name: feature.properties.name || feature.properties.user,
              postedDate: feature.properties.postedDate,
              distance: userLocation ? getDistance(
                userLocation.lat, 
                userLocation.lng, 
                feature.geometry.coordinates[1], 
                feature.geometry.coordinates[0]
              ) : 0
            }))
            // Filter kaldırıldı - tüm veriler gelsin
            
            // DÜZELTME: setData kaldırıldı, sadece data return ediyoruz
            measureDataLoad(formattedData.length)
            analytics && analytics.track && analytics.track('data_loaded', { 
              count: formattedData.length,
              jobs: formattedData.filter(item => item.type === 'job').length,
              cvs: formattedData.filter(item => item.type === 'cv').length,
              source: 'static_geojson' 
            })
            
            logger.info(`✅ Modern App: ${formattedData.length} kayıt yüklendi (${formattedData.filter(item => item.type === 'job').length} iş ilanı, ${formattedData.filter(item => item.type === 'cv').length} CV)`)
            
            // DEBUG: İlk kayıtın field'larını kontrol et
            if (formattedData.length > 0) {
              logger.debug('🔍 Frontend\'e gelen field\'lar:', Object.keys(formattedData[0]))
              logger.debug('🔍 İlk kayıt örneği:', {
                title: formattedData[0].title,
                source: formattedData[0].source,
                city: formattedData[0].city,
                country: formattedData[0].country,
                address: formattedData[0].address,
                popup_html: formattedData[0].popup_html ? 'VAR' : 'YOK'
              })
            }
            
            return formattedData
          }
        } catch (staticError) {
          logger.error('Static GeoJSON yükleme hatası:', staticError)
          analytics && analytics.track && analytics.track('static_geojson_error', { error: staticError.message })
          return [] // Static yükleme başarısız olursa boş array dön
        }
      } catch (error) {
        logger.error('Modern App: Veri yükleme hatası:', error)
        analytics && analytics.track && analytics.track('data_load_error', { error: error.message })
        return [] // Genel hata durumunda boş array dön
      }
    }, [userLocation])

  // Use cached data
  const { data: cachedData, loading: dataLoading } = useDataCache(
    `jobs-${userLocation?.lat}-${userLocation?.lng}`,
    fetchJobsData,
    {
      memoryTTL: 300000, // 5 dakika
      persistentTTL: 3600000, // 1 saat
      staleWhileRevalidate: true
    }
  )
  
  // Set data from cache - artık useDataCache'den gelen veriyi direkt kullanıyoruz
  useEffect(() => {
    if (cachedData && Array.isArray(cachedData)) {
      setData(cachedData)
    }
  }, [cachedData])

  // Tüm veri üzerinde filtreleme (harita için) - static + realtime birleştir
  const allFilteredData = useMemo(() => {
    // Duplicate ID'leri önlemek için Map kullan
    const uniqueDataMap = new Map()
    
    // Önce data'yı ekle
    data.forEach(item => {
      uniqueDataMap.set(item.id, item)
    })
    
    // Sonra realtime data'yı ekle (aynı ID varsa üzerine yazmasın)
    realtimeData.forEach(item => {
      if (!uniqueDataMap.has(item.id)) {
        uniqueDataMap.set(item.id, item)
      }
    })
    
    const combinedData = Array.from(uniqueDataMap.values())
    
    return combinedData.filter(item => {
      if (activeFilters.type !== 'all' && item.type !== activeFilters.type) return false
      
      if (activeFilters.keyword) {
        const keyword = activeFilters.keyword.toLowerCase()
        const titleMatch = item.title?.toLowerCase().includes(keyword)
        const companyMatch = item.company?.toLowerCase().includes(keyword)
        
        if (!titleMatch && !companyMatch) return false
      }
      
      return true
    })
  }, [data, realtimeData, activeFilters])

  // Mesafeye göre sıralı veri (liste için)
  const sortedData = useMemo(() => {
    return [...allFilteredData].sort((a, b) => a.distance - b.distance)
  }, [allFilteredData])

  // Pagination (sadece liste için)
  const paginatedData = useMemo(() => {
    return sortedData.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    )
  }, [sortedData, currentPage, itemsPerPage])

  const totalPages = Math.ceil(sortedData.length / itemsPerPage)

  // Event handlers - memoized
  const handleFilterChange = useCallback((newFilters) => {
    setActiveFilters(newFilters)
    setCurrentPage(1)
    // Analytics güvenli çağrı
    if (analytics && analytics.events && analytics.events.filterUsage) {
      analytics.events.filterUsage('combined', newFilters)
    }
  }, [])

  const handleRowClick = useCallback((location) => {
    setSelectedLocation(location)
    // Analytics güvenli çağrı
    if (analytics && analytics.events && analytics.events.jobClick) {
      analytics.events.jobClick(location, 'list')
    }
  }, [])

  const handlePremiumClick = () => {
    // Premium kaldırıldı - boş fonksiyon
  }


  // Auth Callback Route
  if (isAuthCallback) {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }>
        <AuthCallback />
      </Suspense>
    )
  }

  // Loading removed - auth context will handle loading


  // Show main auth section if not authenticated - REMOVED
  // Ana sayfa her zaman gösterilecek, sadece header'da auth butonları olacak

  // Dashboard view removed - only map/list view for now

  // Handle view changes
  const handleViewChange = useCallback((view) => {
    setCurrentView(view)
    // Analytics güvenli çağrı
    if (analytics && analytics.events && analytics.events.viewChange) {
      analytics.events.viewChange(view)
    }
  }, [])

  // Dashboard view
  if (currentView === 'dashboard' && isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ModernHeader 
          currentView={currentView} 
          onViewChange={handleViewChange} 
        />
        
        <Suspense fallback={
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Panel yükleniyor...</p>
            </div>
          </div>
        }>
          <DashboardPanel onBackToMap={() => setCurrentView('map')} />
        </Suspense>
        
        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    )
  }

  // Main map view (default)
  return (
    <div className="min-h-screen bg-gray-50">
      <ModernHeader 
        currentView={currentView} 
        onViewChange={handleViewChange} 
      />
      
      {/* Auth Form removed - not needed */}
      
      {/* Clean interface - no extra buttons */}

      {isMobile ? (
        // Mobile View
        <div className="h-[calc(100vh-120px)] w-full relative">
          <ComponentErrorBoundary 
            componentName="Harita" 
            fallback={(error, retry) => (
              <div className="h-full flex items-center justify-center bg-gray-100">
                <div className="text-center p-4">
                  <div className="text-4xl mb-4">🗺️</div>
                  <h3 className="font-medium mb-2">Harita yüklenemedi</h3>
                  <button 
                    onClick={retry}
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
                  >
                    Tekrar Dene
                  </button>
                </div>
              </div>
            )}
          >
            <Suspense fallback={
              <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">🚀 Hızlı harita yükleniyor...</p>
                </div>
              </div>
            }>
                <MapComponent 
                  data={allFilteredData} 
                  selectedLocation={selectedLocation} 
                  userLocation={userLocation} 
                  onPremiumClick={handlePremiumClick}
                  isSubscribed={true}
                />
            </Suspense>
          </ComponentErrorBoundary>
          
          {/* Mobile Search Button */}
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="fixed bottom-6 right-6 z-[1002] bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200"
            aria-label="Arama ve filtre panelini aç"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          
          {/* Mobile Controls - Show/Hide based on search button */}
          {showMobileSearch && (
            <div className="fixed inset-x-4 bottom-24 z-[1001] bg-white rounded-2xl shadow-lg p-4 max-h-[60vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-800">Arama ve Filtrele</h3>
                <button 
                  onClick={() => setShowMobileSearch(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <ComponentErrorBoundary componentName="Filter">
                <Suspense fallback={<div className="h-16 animate-pulse bg-gray-200 rounded"></div>}>
                  <FilterComponent 
                    onFilterChange={handleFilterChange}
                    setCurrentPage={setCurrentPage}
                  />
                </Suspense>
              </ComponentErrorBoundary>
              
              <div className="flex-1 mt-4 overflow-y-auto">
                <div className="mb-2 text-xs text-gray-600">
                  {t('list.foundResults', { count: allFilteredData.length })}
                </div>
                <ComponentErrorBoundary componentName="İş Listesi">
                  <ListComponent 
                    data={paginatedData.slice(0, 50)} 
                    onRowClick={(location) => {
                      handleRowClick(location);
                      setShowMobileSearch(false); // Close search when item selected
                    }} 
                    onPremiumClick={handlePremiumClick}
                    isSubscribed={true}
                    userLocation={userLocation} 
                  />
                </ComponentErrorBoundary>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Desktop View  
        <div className="max-w-7xl mx-auto">
          {/* Map Only Row */}
          <div className="h-[70vh] bg-white mx-4 rounded-lg shadow-sm overflow-hidden">
            <ComponentErrorBoundary 
              componentName="Harita"
              fallback={(error, retry) => (
                <div className="h-full flex items-center justify-center bg-gray-100">
                  <div className="text-center p-6">
                    <div className="text-gray-500 mb-4">🗺️</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Harita yüklenemedi</h3>
                    <p className="text-sm text-gray-600 mb-4">Harita bileşeni hata verdi. Tekrar deneyin.</p>
                    <button 
                      onClick={retry}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    >
                      Haritayı Yenile
                    </button>
                  </div>
                </div>
              )}
            >
                <MapComponent 
                  data={allFilteredData} 
                  selectedLocation={selectedLocation} 
                  userLocation={userLocation}
                  onPremiumClick={handlePremiumClick}
                  isSubscribed={true}
                />
            </ComponentErrorBoundary>
          </div>
          
          {/* Filter & List Section */}
          <div className="bg-white mx-4 mt-4 rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <ComponentErrorBoundary componentName="Filter">
                <FilterComponent 
                  onFilterChange={handleFilterChange}
                  setCurrentPage={setCurrentPage}
                />
              </ComponentErrorBoundary>
            </div>
            
            <div className="p-4">
              <div className="mb-4 text-sm text-gray-600">
                {t('list.foundResults', { count: allFilteredData.length })}
                {userLocation && <span className="ml-2">• {t('list.sortedByLocation')}</span>}
              </div>
              
              <ComponentErrorBoundary componentName="İş Listesi">
                <ListComponent 
                  data={paginatedData} 
                  onRowClick={handleRowClick}
                  onPremiumClick={handlePremiumClick}
                  isSubscribed={true}
                  userLocation={userLocation} 
                />
              </ComponentErrorBoundary>
              
              {totalPages > 1 && (
                <div className="mt-6">
                  <PaginationComponent 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}

// Main App - AuthProvider wrapper
export default function ModernApp() {
  return (
    <AuthProvider>
      <ModernAppContent />
    </AuthProvider>
  )
}