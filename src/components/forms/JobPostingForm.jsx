import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  MapPin, 
  Building, 
  DollarSign, 
  Users, 
  Clock,
  Target,
  FileText,
  Search,
  Home,
  Briefcase,
  Calendar,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

// Job Posting Form with Map Integration
export function JobPostingForm({ data, onChange, errors = {} }) {
  const { t } = useTranslation()
  const mapRef = useRef(null)
  const [map, setMap] = useState(null)
  const [marker, setMarker] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [isLocationSearching, setIsLocationSearching] = useState(false)

  // Initialize map
  useEffect(() => {
    initializeMap()
  }, [])

  // Update marker when location changes
  useEffect(() => {
    if (map && data.lat && data.lng) {
      updateMapMarker(data.lat, data.lng)
    }
  }, [map, data.lat, data.lng])

  const initializeMap = async () => {
    if (typeof window !== 'undefined' && !window.L) {
      // Load Leaflet
      await loadLeafletLibrary()
    }

    if (window.L && mapRef.current && !map) {
      const leafletMap = window.L.map(mapRef.current).setView([41.01, 28.97], 10)
      
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(leafletMap)

      // Handle map clicks
      leafletMap.on('click', (e) => {
        const { lat, lng } = e.latlng
        updateLocation(lat, lng)
        reverseGeocode(lat, lng)
      })

      setMap(leafletMap)
    }
  }

  const loadLeafletLibrary = async () => {
    return new Promise((resolve) => {
      if (window.L) {
        resolve()
        return
      }

      // Load CSS
      const cssLink = document.createElement('link')
      cssLink.rel = 'stylesheet'
      cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(cssLink)

      // Load JS
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = resolve
      document.head.appendChild(script)
    })
  }

  const updateMapMarker = (lat, lng) => {
    if (!map) return

    // Remove existing marker
    if (marker) {
      map.removeLayer(marker)
    }

    // Add new marker
    const jobIcon = window.L.divIcon({
      html: `
        <div class="job-location-marker">
          <div class="marker-pin">
            <i class="fa-solid fa-briefcase"></i>
          </div>
          <div class="marker-label">İş Konumu</div>
        </div>
      `,
      className: '',
      iconSize: [40, 50],
      iconAnchor: [20, 50]
    })

    const newMarker = window.L.marker([lat, lng], { icon: jobIcon }).addTo(map)
    setMarker(newMarker)
    map.setView([lat, lng], 15)
  }

  const updateLocation = (lat, lng) => {
    onChange('lat', lat)
    onChange('lng', lng)
  }

  const searchLocation = async (query) => {
    if (!query.trim()) {
      setSuggestions([])
      return
    }

    setIsLocationSearching(true)
    
    try {
      // Use Nominatim for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=tr,us,gb,de,fr,it,es`
      )
      const results = await response.json()
      
      const formattedSuggestions = results.map(result => ({
        display_name: result.display_name,
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        type: result.type,
        importance: result.importance
      }))
      
      setSuggestions(formattedSuggestions)
    } catch (error) {
      console.error('Geocoding error:', error)
      setSuggestions([])
    } finally {
      setIsLocationSearching(false)
    }
  }

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      )
      const result = await response.json()
      
      if (result.display_name) {
        const addressParts = result.display_name.split(',')
        onChange('city', addressParts[0]?.trim() || '')
        onChange('country', result.address?.country || '')
        onChange('address', result.display_name)
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error)
    }
  }

  const selectSuggestion = (suggestion) => {
    updateLocation(suggestion.lat, suggestion.lng)
    onChange('address', suggestion.display_name)
    
    const addressParts = suggestion.display_name.split(',')
    onChange('city', addressParts[0]?.trim() || '')
    
    setSuggestions([])
    updateMapMarker(suggestion.lat, suggestion.lng)
  }

  // Employment types
  const employmentTypes = [
    { value: 'full_time', label: 'Tam Zamanlı' },
    { value: 'part_time', label: 'Yarı Zamanlı' },
    { value: 'contract', label: 'Sözleşmeli' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'internship', label: 'Staj' }
  ]

  // Experience levels
  const experienceLevels = [
    { value: 'entry', label: 'Yeni Başlayan (0-1 yıl)' },
    { value: 'junior', label: 'Junior (1-3 yıl)' },
    { value: 'mid', label: 'Orta Düzey (3-5 yıl)' },
    { value: 'senior', label: 'Senior (5-8 yıl)' },
    { value: 'lead', label: 'Lead (8+ yıl)' },
    { value: 'executive', label: 'Yönetici' }
  ]

  // Industries
  const industries = [
    'Teknoloji', 'Finans', 'Sağlık', 'Eğitim', 'Perakende',
    'Üretim', 'İnşaat', 'Turizm', 'Medya', 'Danışmanlık'
  ]

  return (
    <div className="job-posting-form space-y-6">
      {/* Basic Information */}
      <div className="form-section">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Briefcase className="w-5 h-5 mr-2" />
          Temel Bilgiler
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              İş Başlığı *
            </label>
            <Input
              value={data.title || ''}
              onChange={(e) => onChange('title', e.target.value)}
              placeholder="örn. Senior React Developer"
              className={errors.title ? 'border-red-300' : ''}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Şirket Adı *
            </label>
            <Input
              value={data.company || ''}
              onChange={(e) => onChange('company', e.target.value)}
              placeholder="örn. TechCorp"
              className={errors.company ? 'border-red-300' : ''}
            />
            {errors.company && (
              <p className="mt-1 text-sm text-red-600">{errors.company}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Çalışma Şekli
            </label>
            <select
              value={data.employment_type || ''}
              onChange={(e) => onChange('employment_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Seçiniz</option>
              {employmentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deneyim Seviyesi
            </label>
            <select
              value={data.experience_level || ''}
              onChange={(e) => onChange('experience_level', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Seçiniz</option>
              {experienceLevels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sektör
            </label>
            <select
              value={data.industry || ''}
              onChange={(e) => onChange('industry', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Seçiniz</option>
              {industries.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={data.remote || false}
                onChange={(e) => onChange('remote', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                Uzaktan çalışma mümkün
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Job Description */}
      <div className="form-section">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          İş Tanımı
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            İş Açıklaması *
          </label>
          <textarea
            value={data.description || ''}
            onChange={(e) => onChange('description', e.target.value)}
            rows={6}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="İş tanımı, sorumluluklar, beklentiler..."
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Aranan Nitelikler
          </label>
          <textarea
            value={data.requirements || ''}
            onChange={(e) => onChange('requirements', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Gerekli beceriler, eğitim durumu, deneyim..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Şirket Hakkında
          </label>
          <textarea
            value={data.company_description || ''}
            onChange={(e) => onChange('company_description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Şirketiniz hakkında kısa bilgi..."
          />
        </div>
      </div>

      {/* Salary Information */}
      <div className="form-section">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <DollarSign className="w-5 h-5 mr-2" />
          Maaş Bilgileri
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Maaş
            </label>
            <Input
              type="number"
              value={data.salary_min || ''}
              onChange={(e) => onChange('salary_min', e.target.value)}
              placeholder="0"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maksimum Maaş
            </label>
            <Input
              type="number"
              value={data.salary_max || ''}
              onChange={(e) => onChange('salary_max', e.target.value)}
              placeholder="0"
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
              <option value="TRY">TRY</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </div>

        <div className="flex items-center mt-4">
          <input
            type="checkbox"
            checked={data.salary_negotiable || false}
            onChange={(e) => onChange('salary_negotiable', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-2 text-sm text-gray-700">
            Maaş pazarlığa açık
          </label>
        </div>
      </div>

      {/* Location with Map */}
      <div className="form-section">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MapPin className="w-5 h-5 mr-2" />
          Konum Bilgileri
        </h3>
        
        <div className="space-y-4">
          {/* Location Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adres Arayın *
            </label>
            <div className="relative">
              <Input
                value={data.address || ''}
                onChange={(e) => {
                  onChange('address', e.target.value)
                  searchLocation(e.target.value)
                }}
                placeholder="Şehir, bölge veya tam adres yazın..."
                className={errors.address ? 'border-red-300' : ''}
              />
              {isLocationSearching && (
                <div className="absolute right-3 top-3">
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                </div>
              )}
            </div>
            
            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => selectSuggestion(suggestion)}
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
            
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">{errors.address}</p>
            )}
          </div>

          {/* Map */}
          <div className="bg-gray-100 rounded-lg overflow-hidden">
            <div ref={mapRef} className="w-full h-64" />
            <div className="p-3 bg-gray-50 text-sm text-gray-600">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                Haritada işaretlemek istediğiniz konuma tıklayın veya yukarıdaki arama kutusunu kullanın
              </div>
            </div>
          </div>

          {/* Selected Coordinates Display */}
          {data.lat && data.lng && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">Konum Seçildi</span>
              </div>
              <p className="text-green-700 text-sm mt-1">
                Koordinatlar: {Number(data.lat).toFixed(6)}, {Number(data.lng).toFixed(6)}
              </p>
              {data.city && (
                <p className="text-green-700 text-sm">
                  Şehir: {data.city}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Contact Information */}
      <div className="form-section">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2" />
          İletişim Bilgileri
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              İletişim E-posta
            </label>
            <Input
              type="email"
              value={data.contact_email || ''}
              onChange={(e) => onChange('contact_email', e.target.value)}
              placeholder="hr@company.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              İletişim Telefon
            </label>
            <Input
              type="tel"
              value={data.contact_phone || ''}
              onChange={(e) => onChange('contact_phone', e.target.value)}
              placeholder="+90 555 123 45 67"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Başvuru Talimatları
          </label>
          <textarea
            value={data.application_instructions || ''}
            onChange={(e) => onChange('application_instructions', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Başvuru yapmak isteyenler için özel talimatlar..."
          />
        </div>
      </div>

      {/* Publication Settings */}
      <div className="form-section">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Yayın Ayarları
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              İlan Süresi (Gün)
            </label>
            <select
              value={data.duration_days || 30}
              onChange={(e) => onChange('duration_days', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={7}>7 Gün</option>
              <option value={14}>14 Gün</option>
              <option value={30}>30 Gün</option>
              <option value={60}>60 Gün</option>
              <option value={90}>90 Gün</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={data.is_featured || false}
                onChange={(e) => onChange('is_featured', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                Öne çıkarılsın (+%50 görünürlük)
              </label>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .job-location-marker {
          position: relative;
          text-align: center;
        }
        
        .marker-pin {
          width: 30px;
          height: 30px;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }
        
        .marker-label {
          position: absolute;
          top: 35px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          white-space: nowrap;
        }
      `}</style>
    </div>
  )
}