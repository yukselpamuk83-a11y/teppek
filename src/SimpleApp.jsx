// BASIT TEPPEK APP - Çalışan Versiyon
import { useState, useEffect } from 'react'
import { SimpleAuthProvider, useSimpleAuth } from './hooks/useSimpleAuth'
import { SimpleAuthModal } from './components/auth/SimpleAuthModal'
import { SimpleAuthCallback } from './components/auth/SimpleAuthCallback'

// Original components
import MapComponent from './components/MapComponent'
import FilterComponent from './components/FilterComponent'
import ListComponent from './components/ListComponent'
import PaginationComponent from './components/PaginationComponent'
import EntryFormComponent from './components/EntryFormComponent'
import { getDistance } from './utils/distance'

function SimpleAppContent() {
  const { user, loading, signOut, isAuthenticated } = useSimpleAuth()
  
  // App state
  const [data, setData] = useState([])
  const [activeFilters, setActiveFilters] = useState({ type: 'all', keyword: '' })
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [userLocation, setUserLocation] = useState(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  
  const itemsPerPage = 25

  // Check for auth callback
  const isAuthCallback = window.location.pathname === '/auth/callback'
  
  // Auth callback route
  if (isAuthCallback) {
    return <SimpleAuthCallback />
  }

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

  // Fetch jobs data
  useEffect(() => {
    if (!userLocation?.lat || !userLocation?.lng) return
    
    const fetchJobs = async () => {
      try {
        console.log('🔄 İş ilanları yükleniyor...')
        
        const response = await fetch('/api/get-jobs?limit=1000&page=1')
        const result = await response.json()
        
        if (result.success && result.jobs?.length > 0) {
          const formattedJobs = result.jobs.map(job => ({
            id: `job-${job.id}`,
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
          console.log(`✅ ${formattedJobs.length} ilan yüklendi`)
        }
      } catch (error) {
        console.error('Veri yükleme hatası:', error)
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
  }

  const handleRowClick = (item) => {
    setSelectedLocation(item.location)
  }

  const handleAddEntry = (newEntry) => {
    setData(prev => [{ ...newEntry, id: `user-${Date.now()}` }, ...prev])
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Teppek yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Basit Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-blue-600">Teppek</h1>
            <span className="ml-2 text-sm text-gray-500">İş Arama Platformu</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <span className="text-gray-700">
                  Hoş geldin, {user?.user_metadata?.first_name || user?.email}
                </span>
                <button
                  onClick={signOut}
                  className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded text-sm"
                >
                  Çıkış
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Giriş Yap
              </button>
            )}
          </div>
        </div>
      </header>

      {isMobile ? (
        // Mobile View
        <div className="h-[calc(100vh-80px)] w-full relative">
          <MapComponent 
            data={processedData} 
            selectedLocation={selectedLocation} 
            userLocation={userLocation} 
          />
          
          {/* Mobile Controls */}
          <div className="absolute bottom-4 left-4 right-4 z-[1001] bg-white rounded-lg shadow-lg p-4">
            <FilterComponent 
              onFilterChange={handleFilterChange}
              setCurrentPage={setCurrentPage}
            />
            <div className="mt-4 max-h-48 overflow-y-auto">
              <ListComponent 
                data={paginatedData.slice(0, 3)} // Mobile'da 3 göster
                onRowClick={handleRowClick} 
                userLocation={userLocation} 
              />
            </div>
          </div>
        </div>
      ) : (
        // Desktop View  
        <div className="max-w-7xl mx-auto p-4">
          {/* Map & Form Row */}
          <div className="flex h-[60vh] bg-white rounded-lg shadow-sm overflow-hidden mb-4">
            {isAuthenticated && (
              <div className="w-[30%] h-full p-4 bg-gray-50 border-r">
                <EntryFormComponent onAddEntry={handleAddEntry} userLocation={userLocation} />
              </div>
            )}
            <div className={`${isAuthenticated ? 'w-[70%]' : 'w-full'} h-full`}>
              <MapComponent 
                data={processedData} 
                selectedLocation={selectedLocation} 
                userLocation={userLocation} 
              />
            </div>
          </div>
          
          {/* Filter & List Section */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 bg-gray-50 border-b">
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
      
      {/* Auth Modal */}
      <SimpleAuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  )
}

// Main App with Provider
function SimpleApp() {
  return (
    <SimpleAuthProvider>
      <SimpleAppContent />
    </SimpleAuthProvider>
  )
}

export default SimpleApp