import React, { useState } from 'react'
import { useCreateJob } from '../../hooks/useJobs'
import { useApiState } from '../../hooks/useApiState'
import { LoadingButton } from '../ui/LoadingSpinner'
import { ErrorAlert, SuccessAlert } from '../ui/ErrorAlert'

export function EnhancedJobForm({ onSuccess, onCancel, className = '' }) {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    city: '',
    country: '',
    contact: '',
    lat: '',
    lon: '',
    remote: false,
    description: ''
  })

  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const createJobMutation = useCreateJob()
  const { loading, error, success, execute, reset } = useApiState()

  // Form validation rules
  const validate = (data) => {
    const newErrors = {}

    if (!data.title.trim()) {
      newErrors.title = 'İş başlığı gereklidir'
    } else if (data.title.trim().length < 3) {
      newErrors.title = 'İş başlığı en az 3 karakter olmalıdır'
    }

    if (!data.company.trim()) {
      newErrors.company = 'Şirket adı gereklidir'
    } else if (data.company.trim().length < 2) {
      newErrors.company = 'Şirket adı en az 2 karakter olmalıdır'
    }

    if (!data.lat || !data.lon) {
      newErrors.location = 'Konum bilgileri gereklidir'
    } else {
      const lat = parseFloat(data.lat)
      const lon = parseFloat(data.lon)
      if (isNaN(lat) || isNaN(lon)) {
        newErrors.location = 'Geçersiz konum bilgileri'
      } else if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        newErrors.location = 'Konum bilgileri geçerli aralıkta olmalıdır'
      }
    }

    if (data.contact && data.contact.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.contact)) {
        newErrors.contact = 'Geçerli bir e-posta adresi giriniz'
      }
    }

    return newErrors
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    const newValue = type === 'checkbox' ? checked : value

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleBlur = (e) => {
    const { name } = e.target
    setTouched(prev => ({
      ...prev,
      [name]: true
    }))

    // Validate on blur
    const fieldErrors = validate(formData)
    if (fieldErrors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: fieldErrors[name]
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    reset()

    // Validate all fields
    const validationErrors = validate(formData)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      setTouched(Object.keys(formData).reduce((acc, key) => {
        acc[key] = true
        return acc
      }, {}))
      return
    }

    try {
      await execute(() => createJobMutation.mutateAsync(formData))
      
      // Reset form on success
      setFormData({
        title: '',
        company: '',
        city: '',
        country: '',
        contact: '',
        lat: '',
        lon: '',
        remote: false,
        description: ''
      })
      setErrors({})
      setTouched({})
      
      onSuccess?.()
    } catch (err) {
      // Error is handled by useApiState
    }
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            lat: position.coords.latitude.toString(),
            lon: position.coords.longitude.toString()
          }))
        },
        (error) => {
          console.error('Konum alınamadı:', error)
          setErrors(prev => ({
            ...prev,
            location: 'Konum alınamadı. Lütfen manuel olarak giriniz.'
          }))
        }
      )
    } else {
      setErrors(prev => ({
        ...prev,
        location: 'Tarayıcınız konum özelliğini desteklemiyor.'
      }))
    }
  }

  const getFieldError = (fieldName) => {
    return touched[fieldName] && errors[fieldName]
  }

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Yeni İş İlanı Oluştur
          </h2>

          <ErrorAlert error={error} onClose={reset} />
          {success && (
            <SuccessAlert 
              message="İş ilanı başarıyla oluşturuldu!" 
              onClose={reset}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Job Title */}
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                İş Başlığı *
              </label>
              <input
                type="text"
                name="title"
                id="title"
                required
                value={formData.title}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={loading}
                className={`
                  w-full rounded-md border shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  ${getFieldError('title') ? 'border-red-300' : 'border-gray-300'}
                  ${loading ? 'bg-gray-50 cursor-not-allowed' : ''}
                `}
                placeholder="Örn: Frontend Developer"
              />
              {getFieldError('title') && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Company */}
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                Şirket Adı *
              </label>
              <input
                type="text"
                name="company"
                id="company"
                required
                value={formData.company}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={loading}
                className={`
                  w-full rounded-md border shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  ${getFieldError('company') ? 'border-red-300' : 'border-gray-300'}
                  ${loading ? 'bg-gray-50 cursor-not-allowed' : ''}
                `}
                placeholder="Şirket adı"
              />
              {getFieldError('company') && (
                <p className="mt-1 text-sm text-red-600">{errors.company}</p>
              )}
            </div>

            {/* Remote Work */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="remote"
                id="remote"
                checked={formData.remote}
                onChange={handleChange}
                disabled={loading}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remote" className="ml-2 block text-sm text-gray-700">
                Uzaktan Çalışma
              </label>
            </div>

            {/* City */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                Şehir
              </label>
              <input
                type="text"
                name="city"
                id="city"
                value={formData.city}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={loading}
                className={`
                  w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  ${loading ? 'bg-gray-50 cursor-not-allowed' : ''}
                `}
                placeholder="Şehir"
              />
            </div>

            {/* Country */}
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                Ülke
              </label>
              <input
                type="text"
                name="country"
                id="country"
                value={formData.country}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={loading}
                className={`
                  w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  ${loading ? 'bg-gray-50 cursor-not-allowed' : ''}
                `}
                placeholder="Ülke"
              />
            </div>

            {/* Location Coordinates */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Konum Bilgileri *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="number"
                  name="lat"
                  step="any"
                  value={formData.lat}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  className={`
                    rounded-md border shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${getFieldError('location') ? 'border-red-300' : 'border-gray-300'}
                    ${loading ? 'bg-gray-50 cursor-not-allowed' : ''}
                  `}
                  placeholder="Enlem (Latitude)"
                />
                <input
                  type="number"
                  name="lon"
                  step="any"
                  value={formData.lon}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  className={`
                    rounded-md border shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${getFieldError('location') ? 'border-red-300' : 'border-gray-300'}
                    ${loading ? 'bg-gray-50 cursor-not-allowed' : ''}
                  `}
                  placeholder="Boylam (Longitude)"
                />
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={loading}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Mevcut Konum
                </button>
              </div>
              {getFieldError('location') && (
                <p className="mt-1 text-sm text-red-600">{errors.location}</p>
              )}
            </div>

            {/* Contact */}
            <div className="md:col-span-2">
              <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1">
                İletişim (E-posta veya Telefon)
              </label>
              <input
                type="text"
                name="contact"
                id="contact"
                value={formData.contact}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={loading}
                className={`
                  w-full rounded-md border shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  ${getFieldError('contact') ? 'border-red-300' : 'border-gray-300'}
                  ${loading ? 'bg-gray-50 cursor-not-allowed' : ''}
                `}
                placeholder="E-posta veya telefon numarası"
              />
              {getFieldError('contact') && (
                <p className="mt-1 text-sm text-red-600">{errors.contact}</p>
              )}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                İş Açıklaması
              </label>
              <textarea
                name="description"
                id="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                disabled={loading}
                className={`
                  w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  ${loading ? 'bg-gray-50 cursor-not-allowed' : ''}
                `}
                placeholder="İş pozisyonu hakkında detaylar..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                İptal
              </button>
            )}
            <LoadingButton
              type="submit"
              loading={loading}
              loadingText="Oluşturuluyor..."
              className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              İş İlanı Oluştur
            </LoadingButton>
          </div>
        </div>
      </form>
    </div>
  )
}