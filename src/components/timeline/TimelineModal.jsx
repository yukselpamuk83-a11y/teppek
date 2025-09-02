import React, { useState } from 'react'
import { useTimelineModal } from '../../contexts/LayerContext'
import { useTranslation } from 'react-i18next'
import { X, Calendar, MapPin, Building, Award, ChevronLeft, ChevronRight, Briefcase, GraduationCap, Code } from 'lucide-react'
import { TIMELINE_COLORS, TIMELINE_ICONS, TIMELINE_LABELS } from '../../utils/cvPopupGenerator'

// CSP-Safe Timeline Modal Component (without vis-timeline)
export function TimelineModal() {
  const { t } = useTranslation()
  const { isOpen, selectedCV, close } = useTimelineModal()
  const [selectedPeriod, setSelectedPeriod] = useState(null)
  const [currentView, setCurrentView] = useState('timeline') // 'timeline' or 'list'

  if (!isOpen || !selectedCV) return null

  const timelineData = selectedCV.timeline_data || []

  // Sort timeline data by start date
  const sortedTimeline = [...timelineData].sort((a, b) => {
    const dateA = new Date(a.start_date)
    const dateB = new Date(b.start_date)
    return dateB - dateA // Most recent first
  })

  const getIconByType = (type) => {
    switch (type) {
      case 'work':
        return <Briefcase className="w-4 h-4" />
      case 'education':
        return <GraduationCap className="w-4 h-4" />
      case 'project':
        return <Code className="w-4 h-4" />
      case 'certificate':
        return <Award className="w-4 h-4" />
      default:
        return <Calendar className="w-4 h-4" />
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long'
    })
  }

  const formatDuration = (startDate, endDate) => {
    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : new Date()
    const months = ((end.getFullYear() - start.getFullYear()) * 12) + (end.getMonth() - start.getMonth())
    
    if (months < 12) {
      return `${months} ay`
    } else {
      const years = Math.floor(months / 12)
      const remainingMonths = months % 12
      return remainingMonths > 0 ? `${years} yıl ${remainingMonths} ay` : `${years} yıl`
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {selectedCV.first_name} {selectedCV.last_name}
                </h2>
                <p className="text-blue-100">Kariyer Timeline'ı</p>
              </div>
            </div>
            
            <button
              onClick={close}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* CV Summary */}
          <div className="bg-white bg-opacity-10 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>{selectedCV.city || 'Konum belirtilmemiş'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Briefcase className="w-4 h-4" />
                <span>{selectedCV.title || 'Pozisyon belirtilmemiş'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4" />
                <span>{selectedCV.experience_years || 0} yıl deneyim</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {sortedTimeline.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                Henüz timeline verisi yok
              </h3>
              <p className="text-gray-500">
                Bu kullanıcı henüz kariyer timeline'ını oluşturmamış.
              </p>
            </div>
          ) : (
            <div className="timeline-container">
              {/* Timeline Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Kariyer Geçmişi ({sortedTimeline.length} dönem)
                </h3>
                
                {/* View Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setCurrentView('timeline')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentView === 'timeline'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Timeline
                  </button>
                  <button
                    onClick={() => setCurrentView('list')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentView === 'list'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Liste
                  </button>
                </div>
              </div>

              {/* Timeline View */}
              {currentView === 'timeline' ? (
                <div className="space-y-6">
                  {sortedTimeline.map((period, index) => (
                    <div key={period.id || index} className="timeline-item relative">
                      {/* Timeline Line */}
                      {index < sortedTimeline.length - 1 && (
                        <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200"></div>
                      )}
                      
                      <div className="flex items-start space-x-4">
                        {/* Timeline Dot */}
                        <div 
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-white flex-shrink-0`}
                          style={{ backgroundColor: TIMELINE_COLORS[period.type] || '#6B7280' }}
                        >
                          {getIconByType(period.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-bold text-gray-900 text-lg">
                                {period.title}
                              </h4>
                              <p className="text-blue-600 font-medium">
                                {period.organization}
                              </p>
                            </div>
                            
                            <div className="text-right text-sm text-gray-500">
                              <div className="font-medium">
                                {formatDate(period.start_date)}
                                {period.end_date ? ` - ${formatDate(period.end_date)}` : ' - Devam ediyor'}
                              </div>
                              <div className="text-xs">
                                {formatDuration(period.start_date, period.end_date)}
                              </div>
                            </div>
                          </div>

                          {period.location && (
                            <div className="flex items-center text-gray-600 text-sm mb-2">
                              <MapPin className="w-4 h-4 mr-1" />
                              {period.location}
                            </div>
                          )}

                          {period.description && (
                            <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                              {period.description}
                            </p>
                          )}

                          {/* Skills */}
                          {period.skills && period.skills.length > 0 && (
                            <div className="mb-3">
                              <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                Teknolojiler & Beceriler
                              </h5>
                              <div className="flex flex-wrap gap-1">
                                {period.skills.map((skill, skillIndex) => (
                                  <span 
                                    key={skillIndex}
                                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Achievements */}
                          {period.achievements && period.achievements.length > 0 && (
                            <div>
                              <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                Başarılar
                              </h5>
                              <ul className="space-y-1">
                                {period.achievements.map((achievement, achIndex) => (
                                  <li key={achIndex} className="text-sm text-gray-700 flex items-start">
                                    <Award className="w-3 h-3 text-yellow-500 mr-2 mt-1 flex-shrink-0" />
                                    {achievement}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* List View */
                <div className="space-y-4">
                  {sortedTimeline.map((period, index) => (
                    <div 
                      key={period.id || index}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedPeriod(selectedPeriod === index ? null : index)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                            style={{ backgroundColor: TIMELINE_COLORS[period.type] || '#6B7280' }}
                          >
                            {getIconByType(period.type)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{period.title}</h4>
                            <p className="text-blue-600 text-sm">{period.organization}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-700">
                            {formatDate(period.start_date)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDuration(period.start_date, period.end_date)}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {selectedPeriod === index && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          {period.location && (
                            <div className="flex items-center text-gray-600 text-sm mb-2">
                              <MapPin className="w-4 h-4 mr-2" />
                              {period.location}
                            </div>
                          )}
                          
                          {period.description && (
                            <p className="text-gray-700 text-sm mb-3">{period.description}</p>
                          )}

                          {period.skills && period.skills.length > 0 && (
                            <div className="mb-3">
                              <h6 className="text-xs font-semibold text-gray-500 mb-2">BECERILER</h6>
                              <div className="flex flex-wrap gap-1">
                                {period.skills.map((skill, skillIndex) => (
                                  <span key={skillIndex} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}