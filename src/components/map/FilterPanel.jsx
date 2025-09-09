import React, { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { X, Filter, Search, MapPin, Briefcase, User, Eye, EyeOff } from 'lucide-react'

/**
 * FilterPanel - Unified filtering system for jobs and CVs
 * Handles: Search, type filtering, location filtering, layer visibility
 */
function FilterPanel({
  onFiltersChange,
  onLayerToggle,
  layerVisibility = { jobs: true, cvs: true },
  initialFilters = { type: 'all', keyword: '', location: '' },
  isCompact = false,
  className = ''
}) {
  const { t } = useTranslation()
  
  // Filter state
  const [filters, setFilters] = useState(initialFilters)
  const [isExpanded, setIsExpanded] = useState(!isCompact)
  
  // Filter options
  const typeOptions = [
    { value: 'all', label: t('filters.all'), icon: MapPin },
    { value: 'job', label: t('filters.jobs'), icon: Briefcase },
    { value: 'cv', label: t('filters.cvs'), icon: User }
  ]

  // Handle filter changes
  const handleFilterChange = useCallback((key, value) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    
    if (onFiltersChange) {
      onFiltersChange(newFilters)
    }
  }, [filters, onFiltersChange])

  // Handle layer visibility toggle
  const handleLayerToggle = useCallback((layer) => {
    if (onLayerToggle) {
      onLayerToggle(layer, !layerVisibility[layer])
    }
  }, [layerVisibility, onLayerToggle])

  // Clear all filters
  const clearFilters = useCallback(() => {
    const clearedFilters = { type: 'all', keyword: '', location: '' }
    setFilters(clearedFilters)
    
    if (onFiltersChange) {
      onFiltersChange(clearedFilters)
    }
  }, [onFiltersChange])

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.type !== 'all') count++
    if (filters.keyword?.trim()) count++
    if (filters.location?.trim()) count++
    return count
  }, [filters])

  if (isCompact && !isExpanded) {
    return (
      <div className={`filter-panel-compact ${className}`}>
        <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm border p-2">
          {/* Toggle button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>

          {/* Layer visibility toggles */}
          <div className="flex gap-1">
            <Button
              variant={layerVisibility.jobs ? "default" : "outline"}
              size="sm"
              onClick={() => handleLayerToggle('jobs')}
              className="flex items-center gap-1 px-2 py-1 text-xs"
            >
              <Briefcase className="w-3 h-3" />
              {layerVisibility.jobs ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </Button>
            <Button
              variant={layerVisibility.cvs ? "default" : "outline"}
              size="sm"
              onClick={() => handleLayerToggle('cvs')}
              className="flex items-center gap-1 px-2 py-1 text-xs"
            >
              <User className="w-3 h-3" />
              {layerVisibility.cvs ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`filter-panel ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">
              {t('filters.title', 'Filters')}
            </h3>
            {activeFilterCount > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {activeFilterCount} {t('filters.active', 'active')}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs"
              >
                {t('filters.clear', 'Clear')}
              </Button>
            )}
            {isCompact && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('filters.search', 'Search')}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder={t('filters.searchPlaceholder', 'Search jobs, companies, skills...')}
                value={filters.keyword}
                onChange={(e) => handleFilterChange('keyword', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('filters.type', 'Type')}
            </label>
            <div className="flex gap-2">
              {typeOptions.map((option) => {
                const Icon = option.icon
                return (
                  <Button
                    key={option.value}
                    variant={filters.type === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFilterChange('type', option.value)}
                    className="flex items-center gap-1"
                  >
                    <Icon className="w-3 h-3" />
                    {option.label}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('filters.location', 'Location')}
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder={t('filters.locationPlaceholder', 'City, country...')}
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Layer Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('filters.layers', 'Layers')}
            </label>
            <div className="flex gap-2">
              <Button
                variant={layerVisibility.jobs ? "default" : "outline"}
                size="sm"
                onClick={() => handleLayerToggle('jobs')}
                className="flex items-center gap-2"
              >
                <Briefcase className="w-4 h-4" />
                {t('filters.jobs', 'Jobs')}
                {layerVisibility.jobs ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>
              <Button
                variant={layerVisibility.cvs ? "default" : "outline"}
                size="sm"
                onClick={() => handleLayerToggle('cvs')}
                className="flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                {t('filters.cvs', 'CVs')}
                {layerVisibility.cvs ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FilterPanel