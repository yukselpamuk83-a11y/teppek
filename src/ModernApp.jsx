// MODERN TEPPEK APP - Basit ve Çalışan Versiyon
import React, { useState, useEffect } from 'react'
import { ModernHeader } from './components/modern/ModernHeader'
import { UserDashboard } from './components/modern/UserDashboard'
import { SimpleAuthCallback } from './components/auth/SimpleAuthCallback'
import { SimpleAuthProvider, useSimpleAuth } from './hooks/useSimpleAuth.jsx'
import { useToastStore } from './stores/toastStore'

// Original components (gradual migration yapacağız)
import MapComponent from './components/MapComponent'
import FilterComponent from './components/FilterComponent'
import ListComponent from './components/ListComponent'
import PaginationComponent from './components/PaginationComponent'
import EntryFormComponent from './components/EntryFormComponent'
import { getDistance } from './utils/distance'

function ModernAppContent() {
  // Auth state (basit)
  const { user, loading, isAuthenticated } = useSimpleAuth()
  
  // App state  
  const [currentView, setCurrentView] = useState('map') // 'map', 'dashboard'
  const [data, setData] = useState([])
  const [activeFilters, setActiveFilters] = useState({ type: 'all', keyword: '' })
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [userLocation, setUserLocation] = useState(null)
  
  const itemsPerPage = 75

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

  // Fetch jobs data - Real API call
  useEffect(() => {
    if (!userLocation?.lat || !userLocation?.lng) return
    
    const fetchJobs = async () => {
      const measureDataLoad = speedInsights.measureDataLoad('jobs')
      
      try {
        console.log('🔄 Modern App: İş ilanları yükleniyor...')
        
        // Real API call
        const response = await fetch('/api/get-jobs?limit=100000&page=1')
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text()
          console.warn('Non-JSON response:', text.substring(0, 100))
          throw new Error('API returned non-JSON response')
        }
        
        const result = await response.json()
        
        if (result.success && result.jobs?.length > 0) {
          const formattedJobs = result.jobs.map(job => ({
            id: `modern-${job.id}`,
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
            applyUrl: job.source === 'manual' ? null : job.url,
            contact: job.source === 'manual' ? job.contact : null,
            source: job.source || 'unknown',
            postedDate: job.created_at,
            distance: userLocation ? getDistance(
              userLocation.lat, 
              userLocation.lng, 
              parseFloat(job.lat), 
              parseFloat(job.lon)
            ) : 0
          })).filter(job => job.location.lat && job.location.lng)
          
          setData(formattedJobs)
          
          measureDataLoad(formattedJobs.length)
          analytics.track('jobs_loaded', { 
            count: formattedJobs.length,
            source: 'api_real_data' 
          })
          
          console.log(`✅ Modern App: ${formattedJobs.length} ilan yüklendi`)
        }
      } catch (error) {
        console.error('Modern App: Veri yükleme hatası:', error)
        analytics.track('data_load_error', { error: error.message })
      }
    }
    
    fetchJobs()
  }, [userLocation])

  // Filter data
  const processedData = data.filter(item => {
    if (activeFilters.type !== 'all' && item.type !== activeFilters.type) return false
    
    if (activeFilters.keyword) {
      const keyword = activeFilters.keyword.toLowerCase()
      const titleMatch = item.title?.toLowerCase().includes(keyword)
      const companyMatch = item.company?.toLowerCase().includes(keyword)
      
      if (!titleMatch && !companyMatch) return false
    }
    
    return true
  }).sort((a, b) => a.distance - b.distance)

  // Pagination
  const paginatedData = processedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  const totalPages = Math.ceil(processedData.length / itemsPerPage)

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

  const handleAddEntry = (newEntry) => {
    setData(prev => [{ ...newEntry, id: `user-${Date.now()}` }, ...prev])
    analytics.track('job_added', { source: 'user', type: newEntry.type })
  }

  // Auth Callback Route
  if (isAuthCallback) {
    return <AuthCallback />
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Modern Teppek yükleniyor...</p>
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
          <MapComponent 
            data={processedData} 
            selectedLocation={selectedLocation} 
            userLocation={userLocation} 
          />
          
          {/* Mobile Controls */}
          <div className="absolute bottom-4 left-4 right-4 z-[1001] bg-white rounded-2xl shadow-lg p-4">
            <FilterComponent 
              onFilterChange={handleFilterChange}
              setCurrentPage={setCurrentPage}
            />
            <div className="mt-4 max-h-48 overflow-y-auto">
              <ListComponent 
                data={paginatedData.slice(0, 5)} // Mobile'da sadece 5 göster
                onRowClick={handleRowClick} 
                userLocation={userLocation} 
              />
            </div>
          </div>
        </div>
      ) : (
        // Desktop View  
        <div className="max-w-7xl mx-auto">
          {/* Map & Form Row */}
          <div className="flex h-[70vh] bg-white mx-4 rounded-lg shadow-sm overflow-hidden">
            <div className="w-[35%] h-full p-4 bg-gray-50 flex flex-col">
              <EntryFormComponent onAddEntry={handleAddEntry} userLocation={userLocation} />
            </div>
            <div className="w-[65%] h-full">
              <MapComponent 
                data={processedData} 
                selectedLocation={selectedLocation} 
                userLocation={userLocation} 
              />
            </div>
          </div>
          
          {/* Filter & List Section */}
          <div className="bg-white mx-4 mt-4 rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <FilterComponent 
                onFilterChange={handleFilterChange}
                setCurrentPage={setCurrentPage}
              />
            </div>
            
            <div className="p-4">
              <div className="mb-4 text-sm text-gray-600">
                <span className="font-medium">{processedData.length}</span> sonuç bulundu
                {userLocation && <span className="ml-2">• Konumunuza göre sıralandı</span>}
              </div>
              
              <ListComponent 
                data={paginatedData} 
                onRowClick={handleRowClick} 
                userLocation={userLocation} 
              />
              
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