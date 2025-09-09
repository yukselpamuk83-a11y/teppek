import React, { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/Button'
import { 
  Layers, 
  Map, 
  Satellite, 
  Eye, 
  EyeOff, 
  Settings, 
  Briefcase, 
  User,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

/**
 * LayerControls - Manages map layers, tile providers, and layer visibility
 * Handles: Tile layer switching, layer visibility, layer settings
 */
function LayerControls({
  onTileProviderChange,
  onLayerVisibilityChange,
  layerVisibility = { jobs: true, cvs: true },
  currentTileProvider = 'street',
  layerCounts = { jobs: 0, cvs: 0 },
  isCompact = false,
  className = ''
}) {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(!isCompact)
  const [showSettings, setShowSettings] = useState(false)

  // Tile provider options
  const tileProviders = [
    {
      key: 'street',
      label: t('map.tileProviders.street', 'Street Map'),
      icon: Map,
      description: t('map.tileProviders.streetDesc', 'Standard street map view')
    },
    {
      key: 'satellite',
      label: t('map.tileProviders.satellite', 'Satellite'),
      icon: Satellite,
      description: t('map.tileProviders.satelliteDesc', 'Satellite imagery view')
    }
  ]

  // Layer configurations
  const layers = [
    {
      key: 'jobs',
      label: t('layers.jobs', 'Job Listings'),
      icon: Briefcase,
      color: '#3b82f6',
      count: layerCounts.jobs,
      visible: layerVisibility.jobs
    },
    {
      key: 'cvs',
      label: t('layers.cvs', 'CV Profiles'),
      icon: User,
      color: '#10b981',
      count: layerCounts.cvs,
      visible: layerVisibility.cvs
    }
  ]

  // Handle tile provider change
  const handleTileProviderChange = useCallback((providerKey) => {
    if (onTileProviderChange) {
      onTileProviderChange(providerKey)
    }
  }, [onTileProviderChange])

  // Handle layer visibility toggle
  const handleLayerToggle = useCallback((layerKey) => {
    if (onLayerVisibilityChange) {
      onLayerVisibilityChange(layerKey, !layerVisibility[layerKey])
    }
  }, [layerVisibility, onLayerVisibilityChange])

  if (isCompact && !isExpanded) {
    return (
      <div className={`layer-controls-compact ${className}`}>
        <div className="bg-white rounded-lg shadow-sm border p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-2"
          >
            <Layers className="w-4 h-4" />
            <span className="text-xs">
              {layers.filter(l => l.visible).length}/{layers.length}
            </span>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`layer-controls ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">
              {t('layers.title', 'Layers')}
            </h3>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4" />
            </Button>
            {isCompact && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Tile Provider Selection */}
        {showSettings && (
          <div className="p-3 border-b bg-gray-50">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('map.tileProvider', 'Map Style')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {tileProviders.map((provider) => {
                const Icon = provider.icon
                return (
                  <Button
                    key={provider.key}
                    variant={currentTileProvider === provider.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTileProviderChange(provider.key)}
                    className="flex items-center gap-2 justify-start text-left p-2 h-auto"
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-xs">{provider.label}</div>
                      <div className="text-xs text-gray-500">{provider.description}</div>
                    </div>
                  </Button>
                )
              })}
            </div>
          </div>
        )}

        {/* Layer List */}
        <div className="p-3">
          <div className="space-y-2">
            {layers.map((layer) => {
              const Icon = layer.icon
              return (
                <div
                  key={layer.key}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: layer.visible ? layer.color : '#e5e7eb' }}
                    />
                    <Icon className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-sm text-gray-900">
                        {layer.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {layer.count} {t('layers.items', 'items')}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLayerToggle(layer.key)}
                    className="flex items-center gap-1"
                  >
                    {layer.visible ? (
                      <Eye className="w-4 h-4 text-green-600" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              )
            })}
          </div>

          {/* Layer Statistics */}
          <div className="mt-3 pt-3 border-t text-xs text-gray-500">
            <div className="flex justify-between">
              <span>{t('layers.visible', 'Visible')}</span>
              <span>
                {layers.filter(l => l.visible).length} / {layers.length}
              </span>
            </div>
            <div className="flex justify-between mt-1">
              <span>{t('layers.totalItems', 'Total Items')}</span>
              <span>
                {layers.reduce((sum, l) => sum + (l.visible ? l.count : 0), 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LayerControls