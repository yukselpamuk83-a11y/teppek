import React, { useRef, useEffect, useState } from 'react'
import { Timeline, DataSet } from 'vis-timeline/standalone'
import { useTimelineModal } from '../../contexts/LayerContext'
import { useTranslation } from 'react-i18next'
import { TIMELINE_COLORS, TIMELINE_ICONS, TIMELINE_LABELS } from '../../utils/cvPopupGenerator'

// Timeline Modal Component with vis-timeline integration
export function TimelineModal() {
  const { t } = useTranslation()
  const { isOpen, selectedCV, close } = useTimelineModal()
  const timelineRef = useRef(null)
  const timelineInstance = useRef(null)
  const [selectedPeriod, setSelectedPeriod] = useState(null)
  const [timelineOptions, setTimelineOptions] = useState({
    zoomable: true,
    moveable: true,
    responsive: true
  })

  // Initialize timeline when modal opens
  useEffect(() => {
    if (!isOpen || !selectedCV || !timelineRef.current) return

    // Cleanup previous instance
    if (timelineInstance.current) {
      timelineInstance.current.destroy()
      timelineInstance.current = null
    }

    const createTimeline = () => {
      const { timeline_data = [] } = selectedCV

      if (timeline_data.length === 0) return

      // Convert timeline data to vis-timeline format
      const items = timeline_data.map((item, index) => {
        const startDate = new Date(item.start_date)
        const endDate = item.end_date ? new Date(item.end_date) : new Date()
        
        return {
          id: item.id || index,
          content: generateTimelineItemContent(item),
          start: startDate,
          end: item.is_current ? null : endDate,
          type: item.is_current ? 'point' : 'range',
          className: `timeline-item-${item.type}`,
          style: `background-color: ${item.color || TIMELINE_COLORS[item.type]}`,
          title: generateTooltipContent(item)
        }
      })

      // Timeline configuration
      const options = {
        width: '100%',
        height: '300px',
        margin: {
          axis: 20,
          item: {
            horizontal: 10,
            vertical: 5
          }
        },
        orientation: 'top',
        stack: false,
        showCurrentTime: true,
        showMajorLabels: true,
        showMinorLabels: true,
        zoomable: true,
        moveable: true,
        selectable: true,
        multiselect: false,
        tooltip: {
          followMouse: false,
          overflowMethod: 'cap'
        },
        format: {
          minorLabels: {
            month: 'MMM',
            year: 'YYYY'
          },
          majorLabels: {
            year: 'YYYY'
          }
        },
        locale: 'tr',
        ...timelineOptions
      }

      // Create timeline instance
      const dataset = new DataSet(items)
      timelineInstance.current = new Timeline(timelineRef.current, dataset, options)

      // Handle item selection
      timelineInstance.current.on('select', (properties) => {
        if (properties.items.length > 0) {
          const itemId = properties.items[0]
          const selectedItem = timeline_data.find(item => 
            (item.id || timeline_data.indexOf(item)) == itemId
          )
          setSelectedPeriod(selectedItem)
        } else {
          setSelectedPeriod(null)
        }
      })

      // Handle double click for detail view
      timelineInstance.current.on('doubleClick', (properties) => {
        if (properties.item) {
          const selectedItem = timeline_data.find(item => 
            (item.id || timeline_data.indexOf(item)) == properties.item
          )
          if (selectedItem) {
            openDetailView(selectedItem)
          }
        }
      })

      // Auto-fit timeline to show all items
      setTimeout(() => {
        timelineInstance.current.fit()
      }, 100)
    }

    createTimeline()

    // Cleanup on unmount
    return () => {
      if (timelineInstance.current) {
        timelineInstance.current.destroy()
        timelineInstance.current = null
      }
    }
  }, [isOpen, selectedCV, timelineOptions])

  // Generate timeline item content HTML
  const generateTimelineItemContent = (item) => {
    const icon = TIMELINE_ICONS[item.type] || 'fa-circle'
    const startYear = new Date(item.start_date).getFullYear()
    const endYear = item.end_date ? new Date(item.end_date).getFullYear() : 'Devam'
    
    return `
      <div class="timeline-item-content">
        <div class="timeline-item-header">
          <i class="fa-solid ${icon}"></i>
          <span class="timeline-item-title">${item.title}</span>
        </div>
        <div class="timeline-item-org">${item.organization}</div>
        <div class="timeline-item-period">${startYear} - ${endYear}</div>
      </div>
    `
  }

  // Generate tooltip content
  const generateTooltipContent = (item) => {
    const startDate = new Date(item.start_date).toLocaleDateString('tr-TR')
    const endDate = item.end_date 
      ? new Date(item.end_date).toLocaleDateString('tr-TR')
      : 'Devam ediyor'

    return `
      <div class="timeline-tooltip">
        <strong>${item.title}</strong><br/>
        ${item.organization}<br/>
        ${item.location}<br/>
        ${startDate} - ${endDate}
        ${item.skills?.length > 0 ? `<br/><small>Yetenekler: ${item.skills.slice(0, 3).join(', ')}</small>` : ''}
      </div>
    `
  }

  // Open detail view for a timeline period
  const openDetailView = (item) => {
    setSelectedPeriod(item)
  }

  // Timeline control functions
  const handleZoomIn = () => {
    if (timelineInstance.current) {
      timelineInstance.current.zoomIn(0.2)
    }
  }

  const handleZoomOut = () => {
    if (timelineInstance.current) {
      timelineInstance.current.zoomOut(0.2)
    }
  }

  const handleFitToWindow = () => {
    if (timelineInstance.current) {
      timelineInstance.current.fit()
    }
  }

  const handleToggleOrientation = () => {
    setTimelineOptions(prev => ({
      ...prev,
      orientation: prev.orientation === 'top' ? 'bottom' : 'top'
    }))
  }

  if (!isOpen) return null

  return (
    <>
      {/* Modal overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          {/* Modal header */}
          <div className="timeline-modal-header bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                {selectedCV?.profile_photo_url ? (
                  <img 
                    src={selectedCV.profile_photo_url} 
                    alt={selectedCV.full_name}
                    className="w-16 h-16 rounded-full border-3 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <i className="fa-solid fa-user-tie text-2xl" />
                  </div>
                )}
                
                <div>
                  <h2 className="text-2xl font-bold mb-2">{selectedCV?.full_name}</h2>
                  <p className="text-lg opacity-90 mb-1">{selectedCV?.title}</p>
                  <div className="flex items-center space-x-4 text-sm opacity-75">
                    <span>
                      <i className="fa-solid fa-location-dot mr-2" />
                      {selectedCV?.city}, {selectedCV?.country}
                    </span>
                    <span>
                      <i className="fa-solid fa-briefcase mr-2" />
                      {selectedCV?.experience_years} yıl deneyim
                    </span>
                    <span>
                      <i className="fa-solid fa-timeline mr-2" />
                      {selectedCV?.timeline_data?.length || 0} dönem
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={close}
                className="text-white hover:text-gray-200 p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              >
                <i className="fa-solid fa-times text-xl" />
              </button>
            </div>
          </div>

          {/* Timeline controls */}
          <div className="timeline-controls bg-gray-50 px-6 py-4 border-b flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleZoomIn}
                className="control-btn"
                title="Yakınlaştır"
              >
                <i className="fa-solid fa-magnifying-glass-plus" />
              </button>
              <button
                onClick={handleZoomOut}
                className="control-btn"
                title="Uzaklaştır"
              >
                <i className="fa-solid fa-magnifying-glass-minus" />
              </button>
              <button
                onClick={handleFitToWindow}
                className="control-btn"
                title="Tümünü Görüntüle"
              >
                <i className="fa-solid fa-expand" />
              </button>
              <button
                onClick={handleToggleOrientation}
                className="control-btn"
                title="Yön Değiştir"
              >
                <i className="fa-solid fa-arrows-up-down" />
              </button>
            </div>

            <div className="timeline-legend flex items-center space-x-4">
              {Object.entries(TIMELINE_COLORS).map(([type, color]) => (
                <div key={type} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm text-gray-600">
                    {TIMELINE_LABELS[type]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline container */}
          <div className="timeline-container p-6">
            <div ref={timelineRef} className="timeline-visualization" />
            
            {selectedCV?.timeline_data?.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <i className="fa-solid fa-timeline text-4xl mb-4" />
                <h3 className="text-xl font-semibold mb-2">Timeline bulunamadı</h3>
                <p>Bu CV için henüz timeline bilgisi eklenmemiş.</p>
              </div>
            )}
          </div>

          {/* Selected period detail */}
          {selectedPeriod && (
            <TimelinePeriodDetail 
              period={selectedPeriod} 
              onClose={() => setSelectedPeriod(null)}
            />
          )}
        </div>
      </div>

      {/* Timeline styles */}
      <style jsx>{`
        .control-btn {
          @apply px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors;
        }

        .timeline-visualization {
          min-height: 300px;
        }

        /* vis-timeline custom styles */
        :global(.vis-timeline) {
          border: none !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }

        :global(.vis-item) {
          border-radius: 6px !important;
          border: none !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
          transition: all 0.2s ease !important;
        }

        :global(.vis-item:hover) {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15) !important;
          transform: translateY(-1px) !important;
        }

        :global(.vis-item.vis-selected) {
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4) !important;
          border: 2px solid #3B82F6 !important;
        }

        :global(.timeline-item-content) {
          padding: 8px 12px;
          font-size: 13px;
        }

        :global(.timeline-item-header) {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        :global(.timeline-item-org) {
          color: #6b7280;
          font-size: 12px;
          margin-bottom: 2px;
        }

        :global(.timeline-item-period) {
          color: #9ca3af;
          font-size: 11px;
          font-weight: 500;
        }

        :global(.vis-tooltip) {
          background: rgba(0, 0, 0, 0.8) !important;
          color: white !important;
          border-radius: 6px !important;
          padding: 8px 12px !important;
          font-size: 12px !important;
          max-width: 250px !important;
        }

        /* Timeline type specific styles */
        :global(.timeline-item-education) {
          background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%) !important;
          color: white !important;
        }

        :global(.timeline-item-internship) {
          background: linear-gradient(135deg, #06B6D4 0%, #0891B2 100%) !important;
          color: white !important;
        }

        :global(.timeline-item-military) {
          background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%) !important;
          color: white !important;
        }

        :global(.timeline-item-work) {
          background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%) !important;
          color: white !important;
        }

        :global(.timeline-item-gap) {
          background: linear-gradient(135deg, #6B7280 0%, #4B5563 100%) !important;
          color: white !important;
        }

        :global(.timeline-item-current_work) {
          background: linear-gradient(135deg, #10B981 0%, #059669 100%) !important;
          color: white !important;
        }
      `}</style>
    </>
  )
}

// Timeline Period Detail Component
function TimelinePeriodDetail({ period, onClose }) {
  const { t } = useTranslation()
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long'
    })
  }

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : new Date()
    const diffTime = Math.abs(end - start)
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44))
    
    if (diffMonths < 12) {
      return `${diffMonths} ay`
    } else {
      const years = Math.floor(diffMonths / 12)
      const months = diffMonths % 12
      return months > 0 ? `${years} yıl ${months} ay` : `${years} yıl`
    }
  }

  return (
    <div className="timeline-detail-panel border-t bg-gray-50 p-6">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Dönem Detayları
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-1"
        >
          <i className="fa-solid fa-times" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic info */}
        <div className="space-y-4">
          <div className="detail-item">
            <div className="detail-label">Pozisyon</div>
            <div className="detail-value">{period.title}</div>
          </div>
          
          <div className="detail-item">
            <div className="detail-label">Kurum</div>
            <div className="detail-value">{period.organization}</div>
          </div>
          
          <div className="detail-item">
            <div className="detail-label">Konum</div>
            <div className="detail-value">{period.location}</div>
          </div>
          
          <div className="detail-item">
            <div className="detail-label">Dönem</div>
            <div className="detail-value">
              {formatDate(period.start_date)} - {period.end_date ? formatDate(period.end_date) : 'Devam ediyor'}
              <span className="text-sm text-gray-500 ml-2">
                ({calculateDuration(period.start_date, period.end_date)})
              </span>
            </div>
          </div>

          <div className="detail-item">
            <div className="detail-label">Tür</div>
            <div className="detail-value flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: period.color || TIMELINE_COLORS[period.type] }}
              />
              {TIMELINE_LABELS[period.type]}
              {period.is_current && (
                <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  Devam Ediyor
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description and skills */}
        <div className="space-y-4">
          {period.description && (
            <div className="detail-item">
              <div className="detail-label">Açıklama</div>
              <div className="detail-value text-sm leading-relaxed">
                {period.description}
              </div>
            </div>
          )}
          
          {period.skills?.length > 0 && (
            <div className="detail-item">
              <div className="detail-label">Yetenekler</div>
              <div className="detail-value">
                <div className="flex flex-wrap gap-2">
                  {period.skills.map((skill, index) => (
                    <span 
                      key={index}
                      className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {period.achievements?.length > 0 && (
            <div className="detail-item">
              <div className="detail-label">Başarılar</div>
              <div className="detail-value">
                <ul className="text-sm space-y-1">
                  {period.achievements.map((achievement, index) => (
                    <li key={index} className="flex items-start">
                      <i className="fa-solid fa-trophy text-yellow-500 mr-2 mt-1 text-xs" />
                      {achievement}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .detail-item {
          @apply space-y-1;
        }
        
        .detail-label {
          @apply text-sm font-medium text-gray-500 uppercase tracking-wide;
        }
        
        .detail-value {
          @apply text-sm text-gray-900;
        }
      `}</style>
    </div>
  )
}