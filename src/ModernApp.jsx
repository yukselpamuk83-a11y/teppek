// MODERN TEPPEK APP - Basit ve Çalışan Versiyon
import React, { useState, useEffect, useMemo } from 'react'
import { ModernHeader } from './components/modern/ModernHeader'
import { UserDashboard } from './components/modern/UserDashboard'
import { SimpleAuthCallback } from './components/auth/SimpleAuthCallback'
import { SimpleAuthProvider, useSimpleAuth } from './hooks/useSimpleAuth.jsx'
import { useToastStore } from './stores/toastStore'
import { ToastContainer } from './components/ui/Toast'
import { ComponentErrorBoundary } from './components/ui/ComponentErrorBoundary'
import { analytics, speedInsights } from './lib/analytics'

// Original components (gradual migration yapacağız)
import MapComponent from './components/MapComponent'
import FilterComponent from './components/FilterComponent'
import ListComponent from './components/ListComponent'
import PaginationComponent from './components/PaginationComponent'
import { useRealtimeData } from './hooks/useRealtimeData'
import { getDistance } from './utils/distance'

function ModernAppContent() {
  // Auth state (basit)
  const { user, loading, isAuthenticated } = useSimpleAuth()
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

  // Fetch jobs data - Development'ta fake data kullan
  useEffect(() => {
    if (!userLocation?.lat || !userLocation?.lng) return
    
    const fetchJobs = async () => {
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
              
              jobs.push({
                id: i + 1,
                title: titles[Math.floor(Math.random() * titles.length)],
                company: companies[Math.floor(Math.random() * companies.length)],
                city: cities[Math.floor(Math.random() * cities.length)],
                country: countries[Math.floor(Math.random() * countries.length)],
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
          
          setData(formattedJobs)
          measureDataLoad(formattedJobs.length)
          analytics.track('jobs_loaded', { 
            count: formattedJobs.length,
            source: 'fake_data_dev' 
          })
          
          console.log(`✅ Modern App: ${formattedJobs.length} fake ilan yüklendi`)
          return
        }
        
        // Production'da gerçek API call - statik GeoJSON dosyası
        try {
          const response = await fetch('https://fcsggaggjtxqwatimplk.supabase.co/storage/v1/object/public/public-assets/map-data.geojson')
          
          const geoJsonData = await response.json()
          
          if (geoJsonData.type === 'FeatureCollection' && geoJsonData.features?.length > 0) {
            const formattedData = geoJsonData.features.map(feature => ({
              id: feature.properties.id,
              type: feature.properties.type,
              title: feature.properties.title,
              company: feature.properties.company || feature.properties.user || 'Belirtilmemiş',
              name: feature.properties.company || feature.properties.user,
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
              skills: feature.properties.skills,
              experience_years: feature.properties.experience_years,
              remote: feature.properties.remote,
              postedDate: feature.properties.postedDate,
              distance: userLocation ? getDistance(
                userLocation.lat, 
                userLocation.lng, 
                feature.geometry.coordinates[1], 
                feature.geometry.coordinates[0]
              ) : 0
            })).filter(item => item.location.lat && item.location.lng)
            
            setData(formattedData)
            
            measureDataLoad(formattedData.length)
            analytics.track('data_loaded', { 
              count: formattedData.length,
              jobs: formattedData.filter(item => item.type === 'job').length,
              cvs: formattedData.filter(item => item.type === 'cv').length,
              source: 'static_geojson' 
            })
            
            console.log(`✅ Modern App: ${formattedData.length} kayıt yüklendi (${formattedData.filter(item => item.type === 'job').length} iş ilanı, ${formattedData.filter(item => item.type === 'cv').length} CV)`)
          }
        } catch (staticError) {
          console.error('Static GeoJSON yükleme hatası:', staticError)
          analytics.track('static_geojson_error', { error: staticError.message })
        }
      } catch (error) {
        console.error('Modern App: Veri yükleme hatası:', error)
        analytics.track('data_load_error', { error: error.message })
      }
    }
    
    fetchJobs()
    
    // Auth state değişiklikleri için veri yeniden yükleme GEREKSİZ
    // Static data zaten mevcut, sadece UI state güncellemesi yeterli
    console.log('✅ Static data kullanıldığı için auth state değişikliği veri yeniden yüklemiyor')
  }, [userLocation]) // Sadece konum değiştikçe veri yükle, auth state değişikliği etkilemesin

  // Tüm veri üzerinde filtreleme (harita için) - static + realtime birleştir
  const allFilteredData = useMemo(() => {
    const combinedData = [...data, ...realtimeData]
    
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

  // Event handlers
  const handleFilterChange = (newFilters) => {
    setActiveFilters(newFilters)
    setCurrentPage(1)
    analytics.events.filterUsage('combined', newFilters)
  }

  const handleRowClick = (item) => {
    setSelectedLocation(item.location)
    analytics.events.jobClick(item.id, 'list')
  }

  const handlePremiumClick = () => {
    // Premium kaldırıldı - boş fonksiyon
  }


  // Auth Callback Route
  if (isAuthCallback) {
    return <SimpleAuthCallback />
  }

  // Loading state - reduced loading time for production
  if (loading && Date.now() - startTime > 5000) { // 5 saniye sonra loading'i atlat
    console.log('Loading timeout - showing app anyway')
    setLoading(false)
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Teppek yükleniyor...</p>
          <p className="text-gray-400 text-sm mt-2">Eğer uzun süre bekliyorsa sayfayı yenileyin</p>
        </div>
      </div>
    )
  }

  // Show main auth section if not authenticated - REMOVED
  // Ana sayfa her zaman gösterilecek, sadece header'da auth butonları olacak

  // Show dashboard if authenticated and dashboard view selected
  if (isAuthenticated && currentView === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50">
        <ModernHeader />
        <div className="pt-4">
          <div className="max-w-7xl mx-auto px-4 mb-6">
            <div className="flex space-x-4">
              <button
                onClick={() => setCurrentView('map')}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
              >
                🗺️ Harita
              </button>
              <button
                onClick={() => setCurrentView('dashboard')}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white"
              >
                📊 Dashboard
              </button>
            </div>
          </div>
          <UserDashboard />
        </div>
      </div>
    )
  }

  // Main map view (default)
  return (
    <div className="min-h-screen bg-gray-50">
      <ModernHeader />
      
      {/* Auth Form removed - not needed */}
      
      {/* View Toggle */}
      {isAuthenticated && (
        <div className="max-w-7xl mx-auto px-4 py-4">
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
        </div>
      )}

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
            <MapComponent 
              data={allFilteredData} 
              selectedLocation={selectedLocation} 
              userLocation={userLocation} 
            />
          </ComponentErrorBoundary>
          
          {/* Mobile Controls */}
          <div className="absolute bottom-4 left-4 right-4 z-[1001] bg-white rounded-2xl shadow-lg p-4">
            <ComponentErrorBoundary componentName="Filter">
              <FilterComponent 
                onFilterChange={handleFilterChange}
                setCurrentPage={setCurrentPage}
              />
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

// Main App wrapper with auth provider
export default function ModernApp() {
  return (
    <SimpleAuthProvider>
      <ModernAppContent />
    </SimpleAuthProvider>
  )
}