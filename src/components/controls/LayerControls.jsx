import React from 'react'
import { useLayerControls } from '../../contexts/LayerContext'
import { useTranslation } from 'react-i18next'

// Layer visibility controls component
export function LayerControls({ className = '' }) {
  const { t } = useTranslation()
  const {
    jobsVisible,
    cvsVisible,
    toggleJobs,
    toggleCVs,
    totalItems,
    showAll,
    hideAll
  } = useLayerControls()

  return (
    <div className={`layer-controls bg-white rounded-lg shadow-lg p-4 ${className}`}>
      <div className="layer-controls-header mb-3">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          {t('layerControls.title', 'Harita Katmanları')}
        </h3>
        <div className="text-xs text-gray-500">
          {t('layerControls.totalItems', { count: totalItems }, `Toplam ${totalItems} öğe`)}
        </div>
      </div>

      {/* Individual layer toggles */}
      <div className="layer-toggles space-y-3">
        {/* Jobs layer */}
        <div className="layer-toggle-item">
          <label className="flex items-center space-x-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={jobsVisible}
                onChange={toggleJobs}
                className="sr-only"
              />
              <div className={`
                w-10 h-6 rounded-full transition-colors duration-200
                ${jobsVisible ? 'bg-blue-500' : 'bg-gray-300'}
              `}>
                <div className={`
                  absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full 
                  transition-transform duration-200 transform
                  ${jobsVisible ? 'translate-x-4' : 'translate-x-0'}
                `} />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <i className="fa-solid fa-briefcase text-blue-600" />
              <span className="text-sm font-medium text-gray-700">
                {t('layerControls.jobs', 'İş İlanları')}
              </span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {/* Count will be updated from context */}
                0
              </span>
            </div>
          </label>
        </div>

        {/* CVs layer */}
        <div className="layer-toggle-item">
          <label className="flex items-center space-x-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={cvsVisible}
                onChange={toggleCVs}
                className="sr-only"
              />
              <div className={`
                w-10 h-6 rounded-full transition-colors duration-200
                ${cvsVisible ? 'bg-green-500' : 'bg-gray-300'}
              `}>
                <div className={`
                  absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full 
                  transition-transform duration-200 transform
                  ${cvsVisible ? 'translate-x-4' : 'translate-x-0'}
                `} />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <i className="fa-solid fa-user-tie text-green-600" />
              <span className="text-sm font-medium text-gray-700">
                {t('layerControls.cvs', 'CV\'ler')}
              </span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {/* Count will be updated from context */}
                0
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Bulk controls */}
      <div className="layer-bulk-controls mt-4 pt-3 border-t border-gray-200">
        <div className="flex space-x-2">
          <button
            onClick={showAll}
            className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 
                       hover:bg-gray-200 rounded-md transition-colors duration-150"
          >
            {t('layerControls.showAll', 'Tümünü Göster')}
          </button>
          <button
            onClick={hideAll}
            className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 
                       hover:bg-gray-200 rounded-md transition-colors duration-150"
          >
            {t('layerControls.hideAll', 'Tümünü Gizle')}
          </button>
        </div>
      </div>
    </div>
  )
}

// Compact layer controls for mobile/small screens
export function CompactLayerControls({ className = '' }) {
  const { t } = useTranslation()
  const {
    jobsVisible,
    cvsVisible,
    toggleJobs,
    toggleCVs,
    totalItems
  } = useLayerControls()

  return (
    <div className={`compact-layer-controls bg-white rounded-lg shadow-lg p-2 ${className}`}>
      <div className="flex items-center space-x-3">
        {/* Jobs toggle */}
        <button
          onClick={toggleJobs}
          className={`
            flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium
            transition-colors duration-150
            ${jobsVisible 
              ? 'bg-blue-100 text-blue-700 border border-blue-200' 
              : 'bg-gray-100 text-gray-600 border border-gray-200'
            }
          `}
        >
          <i className="fa-solid fa-briefcase text-xs" />
          <span>{t('layerControls.jobs', 'İş İlanları')}</span>
        </button>

        {/* CVs toggle */}
        <button
          onClick={toggleCVs}
          className={`
            flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium
            transition-colors duration-150
            ${cvsVisible 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-gray-100 text-gray-600 border border-gray-200'
            }
          `}
        >
          <i className="fa-solid fa-user-tie text-xs" />
          <span>{t('layerControls.cvs', 'CV\'ler')}</span>
        </button>

        {/* Total count */}
        <div className="text-xs text-gray-500 ml-auto">
          {totalItems} {t('layerControls.items', 'öğe')}
        </div>
      </div>
    </div>
  )
}

// Layer status indicator
export function LayerStatusIndicator({ className = '' }) {
  const { jobsVisible, cvsVisible, totalItems } = useLayerControls()

  const getStatusColor = () => {
    if (jobsVisible && cvsVisible) return 'bg-green-500'
    if (jobsVisible || cvsVisible) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getStatusText = () => {
    if (jobsVisible && cvsVisible) return 'Her iki katman aktif'
    if (jobsVisible) return 'Sadece iş ilanları'
    if (cvsVisible) return 'Sadece CV\'ler'
    return 'Hiçbir katman görünmüyor'
  }

  return (
    <div className={`layer-status-indicator flex items-center space-x-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
      <span className="text-xs text-gray-600">
        {getStatusText()} ({totalItems})
      </span>
    </div>
  )
}