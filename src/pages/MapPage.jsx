import React, { Suspense, lazy } from 'react'
import { ComponentErrorBoundary } from '../components/ui/ComponentErrorBoundary'

// Map-specific lazy loading - sadece bu sayfada yüklenecek
const MapComponent = lazy(() => import('../components/MapComponent'))
const FilterComponent = lazy(() => import('../components/FilterComponent'))
const ListComponent = lazy(() => import('../components/ListComponent'))
const PaginationComponent = lazy(() => import('../components/PaginationComponent'))

// Loading component for map page
const MapPageLoader = () => (
  <div className="map-container-critical">
    <div className="map-loading">
      <div className="fa-spinner fa-spin"></div>
      <span>Loading map...</span>
    </div>
  </div>
)

export default function MapPage({
  data,
  activeFilters,
  setActiveFilters,
  selectedLocation,
  setSelectedLocation,
  currentPage,
  setCurrentPage,
  userLocation,
  isMobile,
  showMobileSearch,
  setShowMobileSearch,
  itemsPerPage
}) {
  return (
    <ComponentErrorBoundary>
      <div className="flex flex-col lg:flex-row h-full">
        {/* Map Section */}
        <div className="flex-1 relative">
          <Suspense fallback={<MapPageLoader />}>
            <MapComponent
              data={data}
              selectedLocation={selectedLocation}
              onLocationSelect={setSelectedLocation}
              userLocation={userLocation}
              filters={activeFilters}
            />
          </Suspense>
        </div>

        {/* Sidebar - Mobile collapsible */}
        <div className={`
          ${isMobile ? 
            `fixed inset-0 z-[2000] bg-white transform transition-transform duration-300 ${
              showMobileSearch ? 'translate-x-0' : 'translate-x-full'
            }` : 
            'w-96 border-l border-gray-200 bg-white'
          }
        `}>
          <div className="flex flex-col h-full">
            {/* Mobile header */}
            {isMobile && (
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold">Search & Filter</h2>
                <button
                  onClick={() => setShowMobileSearch(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Filters */}
            <div className="p-4 border-b border-gray-200">
              <Suspense fallback={<div className="h-16 bg-gray-100 animate-pulse rounded" />}>
                <FilterComponent
                  filters={activeFilters}
                  onFiltersChange={setActiveFilters}
                />
              </Suspense>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-hidden">
              <Suspense fallback={<div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-20 bg-gray-100 animate-pulse rounded" />
                ))}
              </div>}>
                <ListComponent
                  data={data}
                  onItemSelect={setSelectedLocation}
                  selectedItem={selectedLocation}
                  userLocation={userLocation}
                  filters={activeFilters}
                  currentPage={currentPage}
                  itemsPerPage={itemsPerPage}
                />
              </Suspense>
            </div>

            {/* Pagination */}
            <div className="border-t border-gray-200 p-4">
              <Suspense fallback={<div className="h-8 bg-gray-100 animate-pulse rounded" />}>
                <PaginationComponent
                  currentPage={currentPage}
                  totalItems={data.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </ComponentErrorBoundary>
  )
}