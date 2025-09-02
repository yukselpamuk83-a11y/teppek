import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Plus, 
  Trash2, 
  Edit, 
  GripVertical,
  Calendar,
  MapPin,
  Building,
  Award,
  Code,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { TIMELINE_COLORS, TIMELINE_ICONS, TIMELINE_LABELS } from '../../utils/cvPopupGenerator'

// Timeline Builder Component for CV Creation
export function TimelineBuilder({ data, onChange, errors = {} }) {
  const { t } = useTranslation()
  const [timeline, setTimeline] = useState(data.timeline_data || [])
  const [editingIndex, setEditingIndex] = useState(-1)
  const [draggedIndex, setDraggedIndex] = useState(-1)
  const [previewMode, setPreviewMode] = useState(false)

  // Update parent when timeline changes
  useEffect(() => {
    onChange('timeline_data', timeline)
  }, [timeline, onChange])

  // Add new timeline item
  const addTimelineItem = (type = 'work') => {
    const newItem = {
      id: `timeline_${Date.now()}`,
      type,
      title: '',
      organization: '',
      location: '',
      start_date: '',
      end_date: null,
      is_current: false,
      description: '',
      skills: [],
      achievements: [],
      color: TIMELINE_COLORS[type],
      display_order: timeline.length + 1
    }
    
    setTimeline([...timeline, newItem])
    setEditingIndex(timeline.length)
  }

  // Update timeline item
  const updateTimelineItem = (index, field, value) => {
    const updated = timeline.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value }
        
        // Auto-update color when type changes
        if (field === 'type') {
          updatedItem.color = TIMELINE_COLORS[value] || '#6B7280'
        }
        
        // Handle current position logic
        if (field === 'is_current' && value) {
          updatedItem.end_date = null
        }
        
        return updatedItem
      }
      return item
    })
    
    setTimeline(updated)
  }

  // Delete timeline item
  const deleteTimelineItem = (index) => {
    const filtered = timeline.filter((_, i) => i !== index)
    setTimeline(filtered)
    if (editingIndex === index) setEditingIndex(-1)
  }

  // Sort timeline by start date
  const sortTimeline = () => {
    const sorted = [...timeline].sort((a, b) => {
      return new Date(b.start_date) - new Date(a.start_date)
    })
    setTimeline(sorted)
  }

  // Handle drag and drop reordering
  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (draggedIndex !== index) {
      const reordered = [...timeline]
      const draggedItem = reordered[draggedIndex]
      reordered.splice(draggedIndex, 1)
      reordered.splice(index, 0, draggedItem)
      setTimeline(reordered)
      setDraggedIndex(index)
    }
  }

  const handleDragEnd = () => {
    setDraggedIndex(-1)
  }

  // Timeline type options
  const timelineTypes = [
    { value: 'education', label: 'Eğitim', icon: 'fa-graduation-cap', color: TIMELINE_COLORS.education },
    { value: 'internship', label: 'Staj', icon: 'fa-laptop-code', color: TIMELINE_COLORS.internship },
    { value: 'work', label: 'İş Deneyimi', icon: 'fa-briefcase', color: TIMELINE_COLORS.work },
    { value: 'military', label: 'Askerlik', icon: 'fa-shield-halved', color: TIMELINE_COLORS.military },
    { value: 'current_work', label: 'Mevcut İş', icon: 'fa-play', color: TIMELINE_COLORS.current_work },
    { value: 'gap', label: 'Ara Dönem', icon: 'fa-pause', color: TIMELINE_COLORS.gap }
  ]

  return (
    <div className="timeline-builder">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Kariyer Timeline'ı</h3>
          <p className="text-sm text-gray-500">
            Eğitim ve iş deneyiminizi kronolojik sıraya göre ekleyin
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
            className="px-3"
          >
            {previewMode ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
            {previewMode ? 'Düzenle' : 'Önizle'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={sortTimeline}
            className="px-3"
          >
            <Calendar className="w-4 h-4 mr-1" />
            Tarih Sırala
          </Button>
        </div>
      </div>

      {/* Quick Add Buttons */}
      {!previewMode && (
        <div className="quick-add-section mb-6">
          <p className="text-sm text-gray-600 mb-3">Hızlı Ekle:</p>
          <div className="flex flex-wrap gap-2">
            {timelineTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => addTimelineItem(type.value)}
                className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: type.color }}
                />
                <span className="text-sm font-medium">{type.label}</span>
                <Plus className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Timeline Items */}
      <div className="timeline-items space-y-4">
        {timeline.length === 0 ? (
          <div className="empty-timeline text-center py-12 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-600 mb-2">
              Timeline'ınız henüz boş
            </h4>
            <p className="text-gray-500 mb-4">
              Kariyerinizi görselleştirmek için eğitim ve iş deneyimlerinizi ekleyin
            </p>
            <Button onClick={() => addTimelineItem('work')}>
              <Plus className="w-4 h-4 mr-2" />
              İlk Deneyimi Ekle
            </Button>
          </div>
        ) : (
          timeline.map((item, index) => (
            <TimelineItem
              key={item.id || index}
              item={item}
              index={index}
              isEditing={editingIndex === index}
              isPreview={previewMode}
              onEdit={() => setEditingIndex(editingIndex === index ? -1 : index)}
              onUpdate={(field, value) => updateTimelineItem(index, field, value)}
              onDelete={() => deleteTimelineItem(index)}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              timelineTypes={timelineTypes}
            />
          ))
        )}
      </div>

      {/* Timeline Summary */}
      {timeline.length > 0 && (
        <div className="timeline-summary mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Timeline Özeti</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-700 font-medium">Toplam Dönem:</span>
              <span className="ml-1 text-blue-900">{timeline.length}</span>
            </div>
            <div>
              <span className="text-blue-700 font-medium">İş Deneyimi:</span>
              <span className="ml-1 text-blue-900">
                {timeline.filter(t => t.type === 'work' || t.type === 'current_work').length}
              </span>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Eğitim:</span>
              <span className="ml-1 text-blue-900">
                {timeline.filter(t => t.type === 'education').length}
              </span>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Toplam Yetenek:</span>
              <span className="ml-1 text-blue-900">
                {[...new Set(timeline.flatMap(t => t.skills || []))].length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {errors.timeline_data && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-800 font-medium">Timeline Hatası</span>
          </div>
          <p className="text-red-700 text-sm mt-1">{errors.timeline_data}</p>
        </div>
      )}
    </div>
  )
}

// Individual Timeline Item Component
function TimelineItem({ 
  item, 
  index, 
  isEditing, 
  isPreview,
  onEdit, 
  onUpdate, 
  onDelete, 
  onDragStart, 
  onDragOver, 
  onDragEnd,
  timelineTypes 
}) {
  const [skillInput, setSkillInput] = useState('')
  const [achievementInput, setAchievementInput] = useState('')

  const addSkill = () => {
    if (skillInput.trim()) {
      const currentSkills = item.skills || []
      onUpdate('skills', [...currentSkills, skillInput.trim()])
      setSkillInput('')
    }
  }

  const removeSkill = (skillIndex) => {
    const currentSkills = item.skills || []
    onUpdate('skills', currentSkills.filter((_, i) => i !== skillIndex))
  }

  const addAchievement = () => {
    if (achievementInput.trim()) {
      const currentAchievements = item.achievements || []
      onUpdate('achievements', [...currentAchievements, achievementInput.trim()])
      setAchievementInput('')
    }
  }

  const removeAchievement = (achievementIndex) => {
    const currentAchievements = item.achievements || []
    onUpdate('achievements', currentAchievements.filter((_, i) => i !== achievementIndex))
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('tr-TR', { 
      year: 'numeric', 
      month: 'long' 
    })
  }

  if (isPreview) {
    return (
      <div className="timeline-item-preview bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-start space-x-4">
          <div 
            className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
            style={{ backgroundColor: item.color }}
          />
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-gray-900">{item.title}</h4>
                <p className="text-gray-600">{item.organization}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                  <span>
                    {formatDate(item.start_date)} - {
                      item.is_current ? 'Devam ediyor' : formatDate(item.end_date)
                    }
                  </span>
                  {item.location && (
                    <span className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {item.location}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                {TIMELINE_LABELS[item.type]}
              </span>
            </div>
            
            {item.description && (
              <p className="text-gray-700 text-sm mt-2 leading-relaxed">
                {item.description}
              </p>
            )}
            
            {item.skills && item.skills.length > 0 && (
              <div className="mt-3">
                <div className="flex flex-wrap gap-1">
                  {item.skills.map((skill, idx) => (
                    <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`timeline-item bg-white border rounded-lg transition-all duration-200 ${
        isEditing ? 'border-blue-300 shadow-md' : 'border-gray-200 hover:border-gray-300'
      }`}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      {/* Item Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
          <div 
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <div>
            <h4 className="font-medium text-gray-900">
              {item.title || 'Başlıksız'}
            </h4>
            <p className="text-sm text-gray-500">
              {item.organization || 'Kurum belirtilmemiş'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-600 hover:text-red-700">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Editing Form */}
      {isEditing && (
        <div className="p-4 space-y-4">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dönem Türü
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {timelineTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => onUpdate('type', type.value)}
                  className={`flex items-center space-x-2 p-2 border rounded-lg transition-colors ${
                    item.type === type.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: type.color }}
                  />
                  <span className="text-sm">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pozisyon/Bölüm
              </label>
              <Input
                value={item.title}
                onChange={(e) => onUpdate('title', e.target.value)}
                placeholder="örn. Senior Software Developer"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kurum/Şirket
              </label>
              <Input
                value={item.organization}
                onChange={(e) => onUpdate('organization', e.target.value)}
                placeholder="örn. Google"
              />
            </div>
          </div>

          {/* Dates and Location */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Başlangıç Tarihi
              </label>
              <Input
                type="date"
                value={item.start_date}
                onChange={(e) => onUpdate('start_date', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bitiş Tarihi
              </label>
              <Input
                type="date"
                value={item.end_date || ''}
                onChange={(e) => onUpdate('end_date', e.target.value)}
                disabled={item.is_current}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Konum
              </label>
              <Input
                value={item.location}
                onChange={(e) => onUpdate('location', e.target.value)}
                placeholder="örn. Istanbul, Turkey"
              />
            </div>
          </div>

          {/* Current Position */}
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={item.is_current}
              onChange={(e) => onUpdate('is_current', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">
              Bu pozisyonda halen çalışıyorum
            </label>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Açıklama
            </label>
            <textarea
              value={item.description}
              onChange={(e) => onUpdate('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Bu dönemdeki sorumluluklarınız, projeleriniz ve başarılarınız..."
            />
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Yetenekler
            </label>
            <div className="flex space-x-2 mb-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="örn. React, Python, Proje Yönetimi"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                className="flex-1"
              />
              <Button type="button" onClick={addSkill} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {item.skills && item.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {item.skills.map((skill, idx) => (
                  <span 
                    key={idx} 
                    className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full flex items-center"
                  >
                    {skill}
                    <button
                      onClick={() => removeSkill(idx)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Achievements */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Başarılar
            </label>
            <div className="flex space-x-2 mb-2">
              <Input
                value={achievementInput}
                onChange={(e) => setAchievementInput(e.target.value)}
                placeholder="örn. Yılın Çalışanı, %20 performans artışı"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAchievement())}
                className="flex-1"
              />
              <Button type="button" onClick={addAchievement} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {item.achievements && item.achievements.length > 0 && (
              <div className="space-y-2">
                {item.achievements.map((achievement, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3"
                  >
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4 text-green-600" />
                      <span className="text-green-800 text-sm">{achievement}</span>
                    </div>
                    <button
                      onClick={() => removeAchievement(idx)}
                      className="text-green-600 hover:text-green-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}