import React, { useState, useEffect, Suspense } from 'react'
import { useJobs } from './hooks/useJobs'
import { useApiState } from './hooks/useApiState'
import HeaderComponent from './components/HeaderComponent'
import MapComponent from './components/MapComponent'
import FilterComponent from './components/FilterComponent'
import ListComponent from './components/ListComponent'
import PaginationComponent from './components/PaginationComponent'
import { EnhancedJobForm } from './components/forms/EnhancedJobForm'
import { LoadingSpinner, LoadingOverlay, InlineLoader, JobCardSkeleton } from './components/ui/LoadingSpinner'
import { ErrorAlert, SuccessAlert, NetworkError, EmptyState } from './components/ui/ErrorAlert'

// Lazy load heavy components for better performance
const LazyMapComponent = React.lazy(() => import('./components/MapComponent'))

function EnhancedApp() {
  // State management
  const [activeFilters, setActiveFilters] = useState({ 
    type: 'all', 
    keyword: '',
    country: '',
    city: '',
    remote: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(50)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [userLocation, setUserLocation] = useState(null)
  const [showJobForm, setShowJobForm] = useState(false)
  const [notification, setNotification] = useState(null)

  // Enhanced API state management
  const { loading, error, success, reset } = useApiState()
  
  // Use TanStack Query for data fetching
  const {
    data: jobsData,
    isLoading: jobsLoading,
    isError: jobsError,
    error: jobsErrorData,
    refetch: refetchJobs,
    isFetching: jobsRefetching
  } = useJobs({
    ...activeFilters,
    page: currentPage,
    limit: itemsPerPage
  })

  // Get user location on mount
  useEffect(() => {
    const getUserLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            })
          },
          (error) => {
            console.error("Konum alınamadı:", error)
            // Default to Istanbul coordinates
            setUserLocation({ lat: 41.01, lng: 28.97 })
          }
        )
      } else {
        setUserLocation({ lat: 41.01, lng: 28.97 })
      }
    }

    getUserLocation()
  }, [])

  // Handle screen size changes
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setActiveFilters(newFilters)
    setCurrentPage(1) // Reset to first page when filters change
  }

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page)
    // Smooth scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Handle job form success
  const handleJobFormSuccess = () => {
    setShowJobForm(false)
    setNotification({
      type: 'success',
      message: 'İş ilanınız başarıyla oluşturuldu ve inceleme için gönderildi!'
    })
    refetchJobs() // Refresh the job list
  }

  // Clear notifications
  const clearNotification = () => {
    setNotification(null)
  }

  // Calculate processed data for map and list
  const processedJobs = React.useMemo(() => {
    if (!jobsData?.jobs || !userLocation) return []

    return jobsData.jobs.map(job => ({
      ...job,
      id: `db-${job.id}`,
      type: 'job',
      location: {
        lat: parseFloat(job.lat),
        lng: parseFloat(job.lon)
      },
      address: `${job.city || ''}, ${job.country || ''}`.replace(/^,\s*|,\s*$/g, ''),
    })).filter(job => job.location.lat && job.location.lng)
  }, [jobsData?.jobs, userLocation])

  // Handle network errors
  if (jobsError && !jobsData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderComponent />
        <div className="container mx-auto px-4 py-8">
          <NetworkError 
            onRetry={refetchJobs}
            className="max-w-md mx-auto"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Loading overlay for heavy operations */}
      <LoadingOverlay 
        visible={loading} 
        message="İşlem yapılıyor..." 
      />

      {/* Header */}
      <HeaderComponent 
        onCreateJob={() => setShowJobForm(true)}
        showCreateButton={true}
      />

      {/* Global notifications */}
      {notification && (
        <div className="container mx-auto px-4 pt-4">
          {notification.type === 'success' ? (
            <SuccessAlert 
              message={notification.message}
              onClose={clearNotification}
            />
          ) : (
            <ErrorAlert 
              error={notification.message}
              onClose={clearNotification}
            />
          )}
        </div>
      )}

      {/* Job Creation Form Modal/Overlay */}
      {showJobForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <EnhancedJobForm
                onSuccess={handleJobFormSuccess}
                onCancel={() => setShowJobForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Filters */}
        <div className="mb-6">
          <FilterComponent
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
            isLoading={jobsLoading || jobsRefetching}
          />
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Map Section */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="h-96 lg:h-[500px] relative">
              <Suspense 
                fallback={
                  <div className="h-full flex items-center justify-center bg-gray-100">
                    <LoadingSpinner size="lg" />
                    <span className="ml-3 text-gray-600">Harita yükleniyor...</span>
                  </div>
                }
              >
                <InlineLoader 
                  loading={!userLocation}
                  fallback={
                    <div className="h-full flex items-center justify-center bg-gray-100">
                      <div className="text-center">
                        <LoadingSpinner size="lg" />
                        <p className="mt-2 text-gray-600">Konum bilgisi alınıyor...</p>
                      </div>
                    </div>
                  }
                >
                  <LazyMapComponent
                    data={processedJobs}
                    userLocation={userLocation}
                    isLoading={jobsLoading}
                  />
                </InlineLoader>
              </Suspense>
            </div>
          </div>

          {/* Jobs List Section */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  İş İlanları
                  {jobsData?.total && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({jobsData.total.toLocaleString()} ilan)
                    </span>
                  )}
                </h2>
                {(jobsLoading || jobsRefetching) && (
                  <LoadingSpinner size="sm" />
                )}
              </div>
            </div>

            <div className="h-96 lg:h-[400px] overflow-y-auto">
              <InlineLoader
                loading={jobsLoading}
                fallback={<JobCardSkeleton count={5} className="p-4" />}
              >
                {processedJobs.length > 0 ? (
                  <ListComponent
                    data={processedJobs}
                    userLocation={userLocation}
                    isLoading={jobsRefetching}
                  />
                ) : (
                  <EmptyState
                    title="İş ilanı bulunamadı"
                    description="Arama kriterlerinize uygun iş ilanı bulunmadı. Filtrelerinizi değiştirmeyi deneyin."
                    action={
                      <button
                        onClick={() => handleFilterChange({ type: 'all', keyword: '', country: '', city: '', remote: '' })}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
                      >
                        Filtreleri Temizle
                      </button>
                    }
                  />
                )}
              </InlineLoader>
            </div>

            {/* Pagination */}
            {jobsData?.stats && processedJobs.length > 0 && (
              <div className="p-4 border-t border-gray-200">
                <PaginationComponent
                  currentPage={currentPage}
                  totalPages={jobsData.stats.total_pages || 1}
                  onPageChange={handlePageChange}
                  isLoading={jobsLoading || jobsRefetching}
                />
              </div>
            )}
          </div>
        </div>

        {/* Stats Section */}
        {jobsData?.stats && (
          <div className="mt-6 bg-white rounded-lg shadow-sm p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {jobsData.stats.total_jobs?.toLocaleString() || '0'}
                </div>
                <div className="text-sm text-gray-600">Toplam İlan</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {processedJobs.length.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Gösterilen</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {jobsData.stats.current_page || 1}
                </div>
                <div className="text-sm text-gray-600">Sayfa</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {jobsData.stats.total_pages || 1}
                </div>
                <div className="text-sm text-gray-600">Toplam Sayfa</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EnhancedApp