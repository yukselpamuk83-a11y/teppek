// MODERN TEPPEK APP - Basit ve Çalışan Versiyon
import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react'
import { ModernHeader } from './components/modern/ModernHeader'
import { AuthProvider } from './contexts/AuthContext'
import { useToastStore } from './stores/toastStore'
import { ToastContainer } from './components/ui/Toast'
import { ComponentErrorBoundary } from './components/ui/ComponentErrorBoundary'
import { analytics, speedInsights } from './lib/analytics'
import { useRealtimeData } from './hooks/useRealtimeData'
import { useDataCache } from './hooks/useDataCache'
import { getDistance } from './utils/distance'
import NotificationInbox from './components/ui/inbox/NotificationInbox'

// Lazy loaded components - performans için
const UserDashboard = lazy(() => import('./components/modern/UserDashboard'))
const AuthCallback = lazy(() => import('./components/auth/AuthCallback'))
const MapComponent = lazy(() => import('./components/MapComponent'))
const FilterComponent = lazy(() => import('./components/FilterComponent'))
const ListComponent = lazy(() => import('./components/ListComponent'))
const PaginationComponent = lazy(() => import('./components/PaginationComponent'))
const TestNotificationButton = lazy(() => import('./components/TestNotificationButton'))

function ModernAppContent() {
  const [startTime] = useState(Date.now())
  
  // Toast state
  const { toasts, removeToast } = useToastStore()
  
  // App state  
  const [currentView, setCurrentView] = useState('map') // 'map', 'dashboard'
  const [data, setData] = useState([])
  const [activeFilters, setActiveFilters] = useState({ type: 'all', keyword: '' })
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [userLocation, setUserLocation] = useState(null)
  
  // Realtime data from manual entries
  const realtimeData = useRealtimeData(userLocation)
  
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
        console.log('✅ Konum alındı:', location)
      },
      (error) => {
        console.warn("Konum alınamadı:", error)
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
        console.log('🔄 Modern App: İş ilanları yükleniyor...')
        
        // Development'ta fake data, Production'da gerçek API
        if (import.meta.env.MODE === 'development') {
          console.log('🧪 Development mode: Fake data kullanılıyor')
          
          // Fake data generator
          const generateFakeJobs = () => {
            const companies = ['Teknoloji A.Ş.', 'Yazılım Ltd.', 'Digital Corp', 'Tech Solutions', 'Innovation Co.']
            const titles = ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'DevOps Engineer', 'UI/UX Designer']
            const cities = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya']
            const countries = ['Turkey', 'Germany', 'Netherlands', 'UK', 'USA']
            
            const jobs = []
            for (let i = 0; i < 50; i++) {
              const lat = 41.01 + (Math.random() - 0.5) * 0.1
              const lng = 28.97 + (Math.random() - 0.5) * 0.1
              
              const cityName = cities[Math.floor(Math.random() * cities.length)]
              const countryName = countries[Math.floor(Math.random() * countries.length)]
              
              jobs.push({
                id: i + 1,
                title: titles[Math.floor(Math.random() * titles.length)],
                company: companies[Math.floor(Math.random() * companies.length)],
                city: cityName,
                country: countryName,
                lat: lat,
                lon: lng,
                source: 'fake',
                created_at: new Date().toISOString(),
                salary_min: Math.floor(Math.random() * 5000) + 3000,
                salary_max: Math.floor(Math.random() * 10000) + 8000,
                currency: 'TRY',
                remote: Math.random() > 0.7
              })
            }
            return jobs
          }
          
          const fakeJobs = generateFakeJobs()
          
          const formattedJobs = fakeJobs.map(job => ({
            id: `fake-${job.id}`,
            type: 'job',
            title: job.title,
            company: job.company || 'Şirket Belirtilmemiş',
            name: job.company,
            city: job.city,
            country: job.country,
            location: {
              lat: parseFloat(job.lat),
              lng: parseFloat(job.lon)
            },
            address: `${job.city || ''}, ${job.country || ''}`.replace(/^,\s*|,\s*$/g, ''),
            salary_min: job.salary_min,
            salary_max: job.salary_max,
            currency: job.currency,
            source: job.source,
            postedDate: job.created_at,
            distance: userLocation ? getDistance(
              userLocation.lat, 
              userLocation.lng, 
              parseFloat(job.lat), 
              parseFloat(job.lon)
            ) : 0
          }))
          
          // DÜZELTME: setData kaldırıldı, sadece data return ediyoruz
          measureDataLoad(formattedJobs.length)
          analytics && analytics.track && analytics.track('jobs_loaded', { 
            count: formattedJobs.length,
            source: 'fake_data_dev' 
          })
          
          console.log(`✅ Modern App: ${formattedJobs.length} fake ilan yüklendi`)
          return formattedJobs
        }
        
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
            
            console.log(`✅ Modern App: ${formattedData.length} kayıt yüklendi (${formattedData.filter(item => item.type === 'job').length} iş ilanı, ${formattedData.filter(item => item.type === 'cv').length} CV)`)
            
            // DEBUG: İlk kayıtın field'larını kontrol et
            if (formattedData.length > 0) {
              console.log('🔍 Frontend\'e gelen field\'lar:', Object.keys(formattedData[0]))
              console.log('🔍 İlk kayıt örneği:', {
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
          console.error('Static GeoJSON yükleme hatası:', staticError)
          analytics && analytics.track && analytics.track('static_geojson_error', { error: staticError.message })
          return [] // Static yükleme başarısız olursa boş array dön
        }
      } catch (error) {
        console.error('Modern App: Veri yükleme hatası:', error)
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

  // Show dashboard if authenticated and dashboard view selected - removed for now

  // Main map view (default)
  return (
    <div className="min-h-screen bg-gray-50">
      <ModernHeader />
      
      {/* Auth Form removed - not needed */}
      
      {/* View Toggle and Test Button */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            <button
              onClick={() => setCurrentView('map')}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white"
            >
              🗺️ Harita
            </button>
            <button
              onClick={() => setCurrentView('dashboard')}
              className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
            >
              📊 Dashboard
            </button>
          </div>
          
          {/* Test Notification Button - Always visible */}
          <Suspense fallback={<div>Loading...</div>}>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
              <span className="text-xs text-yellow-700 mr-2">Novu Test:</span>
              <TestNotificationButton userId={'68b3af7a3c95e3a7907d87cb'} />
            </div>
          </Suspense>
        </div>
      </div>

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
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Harita yükleniyor...</p>
                </div>
              </div>
            }>
              <MapComponent 
                data={allFilteredData} 
                selectedLocation={selectedLocation} 
                userLocation={userLocation} 
              />
            </Suspense>
          </ComponentErrorBoundary>
          
          {/* Mobile Controls */}
          <div className="absolute bottom-4 left-4 right-4 z-[1001] bg-white rounded-2xl shadow-lg p-4">
            <ComponentErrorBoundary componentName="Filter">
              <Suspense fallback={<div className="h-16 animate-pulse bg-gray-200 rounded"></div>}>
                <FilterComponent 
                  onFilterChange={handleFilterChange}
                  setCurrentPage={setCurrentPage}
                />
              </Suspense>
            </ComponentErrorBoundary>
            <div className="mt-4 max-h-48 overflow-y-auto">
              <ComponentErrorBoundary componentName="İş Listesi">
                <ListComponent 
                  data={paginatedData.slice(0, 50)} // Mobile'da daha fazla göster
                  onRowClick={handleRowClick} 
                  onPremiumClick={handlePremiumClick}
                  isSubscribed={true}
                  userLocation={userLocation} 
                />
              </ComponentErrorBoundary>
            </div>
          </div>
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
                <span className="font-medium">{allFilteredData.length}</span> sonuç bulundu
                {userLocation && <span className="ml-2">• Konumunuza göre sıralandı</span>}
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