import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  FileText,
  Award,
  Code,
  Upload,
  Camera,
  Link,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { TimelineBuilder } from './TimelineBuilder'

// CV Creation Multi-Step Form Steps
export const cvCreationSteps = [
  {
    id: 'personal',
    title: 'Kişisel Bilgiler',
    shortTitle: 'Kişisel',
    description: 'Temel kişisel bilgilerinizi girin',
    component: PersonalInfoStep,
    fields: [
      { name: 'full_name', label: 'Ad Soyad', required: true, type: 'text' },
      { name: 'email', label: 'E-posta', required: true, type: 'email' },
      { name: 'phone', label: 'Telefon', required: false, type: 'tel' }
    ]
  },
  {
    id: 'location',
    title: 'Konum & İletişim',
    shortTitle: 'Konum',
    description: 'Bulunduğunuz konum ve iletişim tercihleri',
    component: LocationStep,
    fields: [
      { name: 'city', label: 'Şehir', required: true, type: 'text' },
      { name: 'country', label: 'Ülke', required: true, type: 'text' },
      { name: 'lat', label: 'Enlem', required: true, type: 'number' },
      { name: 'lng', label: 'Boylam', required: true, type: 'number' }
    ]
  },
  {
    id: 'profile',
    title: 'Profil & Özet',
    shortTitle: 'Profil',
    description: 'Profesyonel başlık ve özet bilgileriniz',
    component: ProfileStep,
    fields: [
      { name: 'title', label: 'Profesyonel Başlık', required: true, type: 'text' },
      { name: 'description', label: 'Kısa Özet', required: true, type: 'textarea' }
    ]
  },
  {
    id: 'timeline',
    title: 'Kariyer Timeline\'ı',
    shortTitle: 'Timeline',
    description: 'Eğitim ve iş deneyimlerinizi ekleyin',
    component: TimelineStep,
    fields: [
      { name: 'timeline_data', label: 'Timeline Verileri', required: false, type: 'custom' }
    ]
  },
  {
    id: 'skills',
    title: 'Yetenekler',
    shortTitle: 'Yetenekler',
    description: 'Teknik ve kişisel yetenekleriniz',
    component: SkillsStep,
    fields: [
      { name: 'skills', label: 'Yetenekler', required: false, type: 'array' }
    ]
  },
  {
    id: 'preferences',
    title: 'İş Tercihleri',
    shortTitle: 'Tercihler',
    description: 'Maaş beklentisi ve çalışma tercihleri',
    component: PreferencesStep,
    fields: [
      { name: 'remote_available', label: 'Uzaktan Çalışma', required: false, type: 'checkbox' },
      { name: 'salary_expectation_min', label: 'Min Maaş Beklentisi', required: false, type: 'number' }
    ]
  }
]

// Step 1: Personal Information
function PersonalInfoStep({ data, onChange, errors }) {
  const { t } = useTranslation()
  const [photoPreview, setPhotoPreview] = useState(data.profile_photo_url || null)

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      // In a real app, you'd upload to cloud storage
      const reader = new FileReader()
      reader.onload = (e) => {
        const photoUrl = e.target.result
        setPhotoPreview(photoUrl)
        onChange('profile_photo_url', photoUrl)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="personal-info-step space-y-6">
      {/* Profile Photo */}
      <div className="photo-upload-section text-center">
        <div className="relative inline-block">
          {photoPreview ? (
            <div className="w-32 h-32 rounded-full overflow-hidden mx-auto border-4 border-blue-200">
              <img 
                src={photoPreview} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-100 mx-auto border-4 border-gray-200 flex items-center justify-center">
              <User className="w-16 h-16 text-gray-400" />
            </div>
          )}
          
          <label className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-2 cursor-pointer hover:bg-blue-600 transition-colors">
            <Camera className="w-5 h-5" />
            <input 
              type="file" 
              accept="image/*" 
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </label>
        </div>
        
        <p className="text-sm text-gray-500 mt-2">
          Profil fotoğrafınızı yükleyin (opsiyonel)
        </p>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ad Soyad *
          </label>
          <Input
            value={data.full_name || ''}
            onChange={(e) => onChange('full_name', e.target.value)}
            placeholder="John Doe"
            className={errors.full_name ? 'border-red-300' : ''}
          />
          {errors.full_name && (
            <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            E-posta Adresi *
          </label>
          <Input
            type="email"
            value={data.email || ''}
            onChange={(e) => onChange('email', e.target.value)}
            placeholder="john@example.com"
            className={errors.email ? 'border-red-300' : ''}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefon Numarası
          </label>
          <Input
            type="tel"
            value={data.phone || ''}
            onChange={(e) => onChange('phone', e.target.value)}
            placeholder="+90 555 123 45 67"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Doğum Tarihi
          </label>
          <Input
            type="date"
            value={data.birth_date || ''}
            onChange={(e) => onChange('birth_date', e.target.value)}
          />
        </div>
      </div>

      {/* Social Links */}
      <div className="social-links-section">
        <h4 className="text-md font-medium text-gray-900 mb-3">
          Sosyal Medya & Portfolio
        </h4>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Link className="w-5 h-5 text-blue-600" />
            </div>
            <Input
              value={data.linkedin_url || ''}
              onChange={(e) => onChange('linkedin_url', e.target.value)}
              placeholder="https://linkedin.com/in/johndoe"
              className="flex-1"
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Code className="w-5 h-5 text-gray-600" />
            </div>
            <Input
              value={data.github_url || ''}
              onChange={(e) => onChange('github_url', e.target.value)}
              placeholder="https://github.com/johndoe"
              className="flex-1"
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <Input
              value={data.portfolio_url || ''}
              onChange={(e) => onChange('portfolio_url', e.target.value)}
              placeholder="https://johndoe.com"
              className="flex-1"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Step 2: Location
function LocationStep({ data, onChange, errors }) {
  const [mapRef, setMapRef] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  const searchLocation = async (query) => {
    if (!query.trim()) {
      setSuggestions([])
      return
    }

    setIsSearching(true)
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      )
      const results = await response.json()
      setSuggestions(results.map(r => ({
        display_name: r.display_name,
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon)
      })))
    } catch (error) {
      console.error('Location search error:', error)
      setSuggestions([])
    } finally {
      setIsSearching(false)
    }
  }

  const selectLocation = (suggestion) => {
    const parts = suggestion.display_name.split(',')
    onChange('city', parts[0]?.trim() || '')
    onChange('country', parts[parts.length - 1]?.trim() || '')
    onChange('lat', suggestion.lat)
    onChange('lng', suggestion.lng)
    onChange('address', suggestion.display_name)
    setSuggestions([])
  }

  return (
    <div className="location-step space-y-6">
      <div className="location-search">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Konum Ara *
        </label>
        <div className="relative">
          <Input
            value={data.address || ''}
            onChange={(e) => {
              onChange('address', e.target.value)
              searchLocation(e.target.value)
            }}
            placeholder="Şehrinizi veya tam adresinizi yazın..."
            className={errors.address ? 'border-red-300' : ''}
          />
          {isSearching && (
            <div className="absolute right-3 top-3">
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
          )}
        </div>

        {suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => selectLocation(suggestion)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
              >
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-900 truncate">
                    {suggestion.display_name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Şehir *
          </label>
          <Input
            value={data.city || ''}
            onChange={(e) => onChange('city', e.target.value)}
            placeholder="İstanbul"
            className={errors.city ? 'border-red-300' : ''}
          />
          {errors.city && (
            <p className="mt-1 text-sm text-red-600">{errors.city}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ülke *
          </label>
          <Input
            value={data.country || ''}
            onChange={(e) => onChange('country', e.target.value)}
            placeholder="Turkey"
            className={errors.country ? 'border-red-300' : ''}
          />
          {errors.country && (
            <p className="mt-1 text-sm text-red-600">{errors.country}</p>
          )}
        </div>
      </div>

      {data.lat && data.lng && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-green-800 font-medium">Konum Seçildi</span>
          </div>
          <p className="text-green-700 text-sm mt-1">
            {data.city}, {data.country}
          </p>
        </div>
      )}

      {/* Privacy Settings */}
      <div className="privacy-section bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-md font-medium text-blue-900 mb-3">Gizlilik Ayarları</h4>
        
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={data.location_public !== false}
              onChange={(e) => onChange('location_public', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">
              Konumum haritada görüntülenebilir
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={data.contact_public !== false}
              onChange={(e) => onChange('contact_public', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">
              İletişim bilgilerim işverenlere gösterilebilir
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

// Step 3: Profile
function ProfileStep({ data, onChange, errors }) {
  return (
    <div className="profile-step space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Profesyonel Başlık *
        </label>
        <Input
          value={data.title || ''}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="Senior Software Developer"
          className={errors.title ? 'border-red-300' : ''}
        />
        <p className="mt-1 text-sm text-gray-500">
          Uzmanlık alanınızı özetleyen kısa bir başlık
        </p>
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Profesyonel Özet *
        </label>
        <textarea
          value={data.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
          rows={5}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
            errors.description ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Kısa profesyonel özetinizi yazın. Uzmanlık alanlarınız, deneyiminiz ve kariyer hedeflerinizden bahsedin..."
        />
        <p className="mt-1 text-sm text-gray-500">
          2-3 cümlelik öz ve etkili bir açıklama yazın
        </p>
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Toplam Deneyim (Yıl)
        </label>
        <Input
          type="number"
          value={data.experience_years || ''}
          onChange={(e) => onChange('experience_years', parseInt(e.target.value) || 0)}
          placeholder="5"
          min="0"
          max="50"
        />
      </div>
    </div>
  )
}

// Step 4: Timeline
function TimelineStep({ data, onChange, errors }) {
  return (
    <div className="timeline-step">
      <TimelineBuilder
        data={data}
        onChange={onChange}
        errors={errors}
      />
    </div>
  )
}

// Step 5: Skills
function SkillsStep({ data, onChange, errors }) {
  const [skillInput, setSkillInput] = useState('')
  const skills = data.skills || []

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      onChange('skills', [...skills, skillInput.trim()])
      setSkillInput('')
    }
  }

  const removeSkill = (index) => {
    onChange('skills', skills.filter((_, i) => i !== index))
  }

  const popularSkills = [
    'JavaScript', 'React', 'Node.js', 'Python', 'Java',
    'TypeScript', 'Vue.js', 'Angular', 'PHP', 'C#',
    'AWS', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL',
    'Git', 'Agile', 'Scrum', 'Project Management', 'Leadership'
  ]

  return (
    <div className="skills-step space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Yeteneklerinizi Ekleyin
        </label>
        
        <div className="flex space-x-2 mb-4">
          <Input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            placeholder="Yetenek adını yazın..."
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            className="flex-1"
          />
          <Button onClick={addSkill} disabled={!skillInput.trim()}>
            Ekle
          </Button>
        </div>

        {skills.length > 0 && (
          <div className="selected-skills mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Eklenen Yetenekler ({skills.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full flex items-center"
                >
                  {skill}
                  <button
                    onClick={() => removeSkill(index)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Popüler Yetenekler
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {popularSkills.filter(skill => !skills.includes(skill)).map((skill) => (
            <button
              key={skill}
              onClick={() => onChange('skills', [...skills, skill])}
              className="text-left px-3 py-2 text-sm border border-gray-300 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              {skill}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Step 6: Preferences
function PreferencesStep({ data, onChange, errors }) {
  return (
    <div className="preferences-step space-y-6">
      {/* Work Preferences */}
      <div className="work-preferences">
        <h3 className="text-md font-medium text-gray-900 mb-4">Çalışma Tercihleri</h3>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={data.remote_available || false}
              onChange={(e) => onChange('remote_available', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">
              Uzaktan çalışmaya açığım
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={data.relocation_available || false}
              onChange={(e) => onChange('relocation_available', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">
              Taşınmaya açığım
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={data.available_for_work !== false}
              onChange={(e) => onChange('available_for_work', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">
              Aktif olarak iş arıyorum
            </label>
          </div>
        </div>
      </div>

      {/* Salary Expectations */}
      <div className="salary-expectations">
        <h3 className="text-md font-medium text-gray-900 mb-4">Maaş Beklentisi</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Beklenti
            </label>
            <Input
              type="number"
              value={data.salary_expectation_min || ''}
              onChange={(e) => onChange('salary_expectation_min', parseInt(e.target.value) || null)}
              placeholder="50000"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maksimum Beklenti
            </label>
            <Input
              type="number"
              value={data.salary_expectation_max || ''}
              onChange={(e) => onChange('salary_expectation_max', parseInt(e.target.value) || null)}
              placeholder="80000"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Para Birimi
            </label>
            <select
              value={data.currency || 'TRY'}
              onChange={(e) => onChange('currency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="TRY">TRY (Türk Lirası)</option>
              <option value="USD">USD (Amerikan Doları)</option>
              <option value="EUR">EUR (Euro)</option>
              <option value="GBP">GBP (İngiliz Sterlini)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Privacy & Visibility */}
      <div className="privacy-settings bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-md font-medium text-gray-900 mb-4">Gizlilik ve Görünürlük</h3>
        
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={data.is_timeline_public !== false}
              onChange={(e) => onChange('is_timeline_public', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">
              Timeline'ım herkese açık olsun
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={data.searchable !== false}
              onChange={(e) => onChange('searchable', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">
              Profilim arama sonuçlarında görünebilir
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={data.allow_contact || false}
              onChange={(e) => onChange('allow_contact', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">
              İşverenler benimle iletişime geçebilir
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

// Export all step components
export { 
  PersonalInfoStep,
  LocationStep, 
  ProfileStep,
  TimelineStep,
  SkillsStep,
  PreferencesStep
}