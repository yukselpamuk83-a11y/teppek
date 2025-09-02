import React, { useState } from 'react'
import { useLayer } from '../../contexts/LayerContext'
import { useTranslation } from 'react-i18next'
import { TIMELINE_LABELS } from '../../utils/cvPopupGenerator'

// Dual Filter System for Jobs and CVs
export function DualFilterSystem({ className = '' }) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('jobs') // 'jobs' | 'cvs'

  return (
    <div className={`dual-filter-system bg-white rounded-lg shadow-lg ${className}`}>
      {/* Filter tabs */}
      <div className="filter-tabs border-b border-gray-200">
        <nav className="flex">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`
              flex-1 py-3 px-4 text-sm font-medium text-center border-b-2 transition-colors
              ${activeTab === 'jobs' 
                ? 'border-blue-500 text-blue-600 bg-blue-50' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <i className="fa-solid fa-briefcase mr-2" />
            {t('filters.jobs', 'İş İlanları')}
          </button>
          <button
            onClick={() => setActiveTab('cvs')}
            className={`
              flex-1 py-3 px-4 text-sm font-medium text-center border-b-2 transition-colors
              ${activeTab === 'cvs' 
                ? 'border-green-500 text-green-600 bg-green-50' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <i className="fa-solid fa-user-tie mr-2" />
            {t('filters.cvs', 'CV\'ler')}
          </button>
        </nav>
      </div>

      {/* Filter content */}
      <div className="filter-content p-4">
        {activeTab === 'jobs' ? <JobFilters /> : <CVFilters />}
      </div>
    </div>
  )
}

// Job Filters Component
function JobFilters() {
  const { t } = useTranslation()
  const { layer, updateFilters, clearFilters, hasActiveFilters } = useLayer('jobs')
  const { filters } = layer

  const handleFilterChange = (key, value) => {
    updateFilters({ [key]: value })
  }

  const handleArrayFilterChange = (key, value, isChecked) => {
    const currentArray = filters[key] || []
    if (isChecked) {
      updateFilters({ [key]: [...currentArray, value] })
    } else {
      updateFilters({ [key]: currentArray.filter(item => item !== value) })
    }
  }

  const handleSalaryChange = (type, value) => {
    updateFilters({ [`salary_${type}`]: value ? parseInt(value) : null })
  }

  return (
    <div className="job-filters space-y-4">
      {/* Search */}
      <div className="filter-group">
        <label className="filter-label">
          <i className="fa-solid fa-magnifying-glass mr-2" />
          {t('filters.search', 'Arama')}
        </label>
        <input
          type="text"
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          placeholder={t('filters.searchPlaceholder', 'İş başlığı veya şirket ara...')}
          className="filter-input"
        />
      </div>

      {/* Location filters */}
      <div className="grid grid-cols-2 gap-3">
        <div className="filter-group">
          <label className="filter-label">
            <i className="fa-solid fa-globe mr-2" />
            {t('filters.country', 'Ülke')}
          </label>
          <select
            value={filters.country}
            onChange={(e) => handleFilterChange('country', e.target.value)}
            className="filter-select"
          >
            <option value="">{t('filters.allCountries', 'Tüm Ülkeler')}</option>
            <option value="GB">United Kingdom</option>
            <option value="US">United States</option>
            <option value="DE">Germany</option>
            <option value="FR">France</option>
            <option value="IT">Italy</option>
            <option value="ES">Spain</option>
            <option value="TR">Turkey</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">
            <i className="fa-solid fa-location-dot mr-2" />
            {t('filters.city', 'Şehir')}
          </label>
          <input
            type="text"
            value={filters.city}
            onChange={(e) => handleFilterChange('city', e.target.value)}
            placeholder={t('filters.cityPlaceholder', 'Şehir adı...')}
            className="filter-input"
          />
        </div>
      </div>

      {/* Remote work */}
      <div className="filter-group">
        <label className="filter-label">
          <i className="fa-solid fa-laptop-house mr-2" />
          {t('filters.remote', 'Uzaktan Çalışma')}
        </label>
        <div className="filter-radio-group">
          {[
            { value: 'all', label: t('filters.all', 'Hepsi') },
            { value: 'true', label: t('filters.remoteOnly', 'Sadece Uzaktan') },
            { value: 'false', label: t('filters.onSiteOnly', 'Sadece Ofis') }
          ].map(option => (
            <label key={option.value} className="filter-radio-option">
              <input
                type="radio"
                name="remote"
                value={option.value}
                checked={filters.remote === option.value}
                onChange={(e) => handleFilterChange('remote', e.target.value)}
                className="filter-radio"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Salary range */}
      <div className="filter-group">
        <label className="filter-label">
          <i className="fa-solid fa-money-bill-wave mr-2" />
          {t('filters.salary', 'Maaş Aralığı')}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            value={filters.salary_min || ''}
            onChange={(e) => handleSalaryChange('min', e.target.value)}
            placeholder={t('filters.minSalary', 'Min maaş')}
            className="filter-input"
            min="0"
          />
          <input
            type="number"
            value={filters.salary_max || ''}
            onChange={(e) => handleSalaryChange('max', e.target.value)}
            placeholder={t('filters.maxSalary', 'Max maaş')}
            className="filter-input"
            min="0"
          />
        </div>
      </div>

      {/* Job sources */}
      <div className="filter-group">
        <label className="filter-label">
          <i className="fa-solid fa-database mr-2" />
          {t('filters.source', 'Kaynak')}
        </label>
        <div className="filter-checkbox-group">
          {[
            { value: 'adzuna', label: 'Adzuna' },
            { value: 'manual', label: t('filters.manual', 'Manuel') },
            { value: 'linkedin', label: 'LinkedIn' }
          ].map(source => (
            <label key={source.value} className="filter-checkbox-option">
              <input
                type="checkbox"
                checked={filters.source?.includes(source.value)}
                onChange={(e) => handleArrayFilterChange('source', source.value, e.target.checked)}
                className="filter-checkbox"
              />
              <span>{source.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="clear-filters-btn"
        >
          <i className="fa-solid fa-filter-circle-xmark mr-2" />
          {t('filters.clearAll', 'Filtreleri Temizle')}
        </button>
      )}
    </div>
  )
}

// CV Filters Component
function CVFilters() {
  const { t } = useTranslation()
  const { layer, updateFilters, clearFilters, hasActiveFilters } = useLayer('cvs')
  const { filters } = layer

  const handleFilterChange = (key, value) => {
    updateFilters({ [key]: value })
  }

  const handleArrayFilterChange = (key, value, isChecked) => {
    const currentArray = filters[key] || []
    if (isChecked) {
      updateFilters({ [key]: [...currentArray, value] })
    } else {
      updateFilters({ [key]: currentArray.filter(item => item !== value) })
    }
  }

  const handleExperienceChange = (type, value) => {
    updateFilters({ [`experience_${type}`]: value ? parseInt(value) : null })
  }

  const popularSkills = [
    'JavaScript', 'React', 'Node.js', 'Python', 'Java',
    'SQL', 'HTML/CSS', 'TypeScript', 'PHP', 'C#',
    '.NET', 'Angular', 'Vue.js', 'MongoDB', 'PostgreSQL'
  ]

  return (
    <div className="cv-filters space-y-4">
      {/* Search */}
      <div className="filter-group">
        <label className="filter-label">
          <i className="fa-solid fa-magnifying-glass mr-2" />
          {t('filters.search', 'Arama')}
        </label>
        <input
          type="text"
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          placeholder={t('filters.cvSearchPlaceholder', 'İsim, pozisyon veya yetenek ara...')}
          className="filter-input"
        />
      </div>

      {/* Location filters */}
      <div className="grid grid-cols-2 gap-3">
        <div className="filter-group">
          <label className="filter-label">
            <i className="fa-solid fa-globe mr-2" />
            {t('filters.country', 'Ülke')}
          </label>
          <select
            value={filters.country}
            onChange={(e) => handleFilterChange('country', e.target.value)}
            className="filter-select"
          >
            <option value="">{t('filters.allCountries', 'Tüm Ülkeler')}</option>
            <option value="Turkey">Turkey</option>
            <option value="Germany">Germany</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="United States">United States</option>
            <option value="France">France</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">
            <i className="fa-solid fa-location-dot mr-2" />
            {t('filters.city', 'Şehir')}
          </label>
          <input
            type="text"
            value={filters.city}
            onChange={(e) => handleFilterChange('city', e.target.value)}
            placeholder={t('filters.cityPlaceholder', 'Şehir adı...')}
            className="filter-input"
          />
        </div>
      </div>

      {/* Remote work */}
      <div className="filter-group">
        <label className="filter-label">
          <i className="fa-solid fa-laptop-house mr-2" />
          {t('filters.remoteAvailable', 'Uzaktan Çalışma')}
        </label>
        <div className="filter-radio-group">
          {[
            { value: 'all', label: t('filters.all', 'Hepsi') },
            { value: 'true', label: t('filters.remoteAvailable', 'Uzaktan çalışabilir') },
            { value: 'false', label: t('filters.onSiteOnly', 'Sadece ofiste') }
          ].map(option => (
            <label key={option.value} className="filter-radio-option">
              <input
                type="radio"
                name="cvRemote"
                value={option.value}
                checked={filters.remote === option.value}
                onChange={(e) => handleFilterChange('remote', e.target.value)}
                className="filter-radio"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Experience range */}
      <div className="filter-group">
        <label className="filter-label">
          <i className="fa-solid fa-clock mr-2" />
          {t('filters.experience', 'Deneyim (Yıl)')}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            value={filters.experience_min || ''}
            onChange={(e) => handleExperienceChange('min', e.target.value)}
            placeholder={t('filters.minExperience', 'Min yıl')}
            className="filter-input"
            min="0"
          />
          <input
            type="number"
            value={filters.experience_max || ''}
            onChange={(e) => handleExperienceChange('max', e.target.value)}
            placeholder={t('filters.maxExperience', 'Max yıl')}
            className="filter-input"
            min="0"
          />
        </div>
      </div>

      {/* Skills */}
      <div className="filter-group">
        <label className="filter-label">
          <i className="fa-solid fa-code mr-2" />
          {t('filters.skills', 'Yetenekler')}
        </label>
        <div className="filter-skills-grid">
          {popularSkills.map(skill => (
            <label key={skill} className="filter-skill-option">
              <input
                type="checkbox"
                checked={filters.skills?.includes(skill)}
                onChange={(e) => handleArrayFilterChange('skills', skill, e.target.checked)}
                className="filter-checkbox"
              />
              <span className="skill-tag">{skill}</span>
            </label>
          ))}
        </div>
        
        {/* Custom skill input */}
        <div className="mt-2">
          <input
            type="text"
            placeholder={t('filters.customSkill', 'Özel yetenek ekle...')}
            className="filter-input text-sm"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                const skill = e.target.value.trim()
                if (!filters.skills?.includes(skill)) {
                  handleArrayFilterChange('skills', skill, true)
                }
                e.target.value = ''
              }
            }}
          />
        </div>

        {/* Selected skills */}
        {filters.skills?.length > 0 && (
          <div className="selected-skills-list mt-2">
            <div className="flex flex-wrap gap-1">
              {filters.skills.map(skill => (
                <span 
                  key={skill}
                  className="selected-skill-tag"
                >
                  {skill}
                  <button
                    onClick={() => handleArrayFilterChange('skills', skill, false)}
                    className="ml-1 text-xs hover:text-red-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Education level */}
      <div className="filter-group">
        <label className="filter-label">
          <i className="fa-solid fa-graduation-cap mr-2" />
          {t('filters.education', 'Eğitim Seviyesi')}
        </label>
        <div className="filter-checkbox-group">
          {[
            { value: 'high_school', label: t('education.highSchool', 'Lise') },
            { value: 'associate', label: t('education.associate', 'Ön Lisans') },
            { value: 'bachelor', label: t('education.bachelor', 'Lisans') },
            { value: 'master', label: t('education.master', 'Yüksek Lisans') },
            { value: 'phd', label: t('education.phd', 'Doktora') }
          ].map(level => (
            <label key={level.value} className="filter-checkbox-option">
              <input
                type="checkbox"
                checked={filters.education_level?.includes(level.value)}
                onChange={(e) => handleArrayFilterChange('education_level', level.value, e.target.checked)}
                className="filter-checkbox"
              />
              <span>{level.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Timeline types */}
      <div className="filter-group">
        <label className="filter-label">
          <i className="fa-solid fa-timeline mr-2" />
          {t('filters.timelineTypes', 'Timeline Türleri')}
        </label>
        <div className="filter-checkbox-group">
          {Object.entries(TIMELINE_LABELS).map(([type, label]) => (
            <label key={type} className="filter-checkbox-option">
              <input
                type="checkbox"
                checked={filters.timeline_types?.includes(type)}
                onChange={(e) => handleArrayFilterChange('timeline_types', type, e.target.checked)}
                className="filter-checkbox"
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="clear-filters-btn"
        >
          <i className="fa-solid fa-filter-circle-xmark mr-2" />
          {t('filters.clearAll', 'Filtreleri Temizle')}
        </button>
      )}
    </div>
  )
}

// Compact Filter System (for mobile)
export function CompactDualFilters({ className = '' }) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('jobs')
  
  const jobLayer = useLayer('jobs')
  const cvLayer = useLayer('cvs')

  const hasAnyFilters = jobLayer.hasActiveFilters || cvLayer.hasActiveFilters

  return (
    <div className={`compact-dual-filters ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          compact-filter-toggle w-full px-4 py-3 bg-white rounded-lg shadow-lg
          flex items-center justify-between transition-colors
          ${hasAnyFilters ? 'border-2 border-blue-500' : 'border border-gray-200'}
        `}
      >
        <div className="flex items-center space-x-2">
          <i className="fa-solid fa-filter" />
          <span className="font-medium">
            {t('filters.title', 'Filtreler')}
          </span>
          {hasAnyFilters && (
            <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
              {t('filters.active', 'Aktif')}
            </span>
          )}
        </div>
        <i className={`fa-solid ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`} />
      </button>

      {isOpen && (
        <div className="compact-filter-content mt-3 bg-white rounded-lg shadow-lg">
          <DualFilterSystem />
        </div>
      )}
    </div>
  )
}

// Filter styles
export const FILTER_STYLES = `
<style>
.filter-label {
  @apply block text-sm font-medium text-gray-700 mb-2;
}

.filter-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
         focus:ring-blue-500 focus:border-blue-500 text-sm;
}

.filter-select {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
         focus:ring-blue-500 focus:border-blue-500 text-sm bg-white;
}

.filter-radio-group {
  @apply space-y-2;
}

.filter-radio-option {
  @apply flex items-center space-x-2 cursor-pointer;
}

.filter-radio {
  @apply text-blue-500 focus:ring-blue-500;
}

.filter-checkbox-group {
  @apply space-y-2;
}

.filter-checkbox-option {
  @apply flex items-center space-x-2 cursor-pointer;
}

.filter-checkbox {
  @apply text-blue-500 focus:ring-blue-500 rounded;
}

.filter-skills-grid {
  @apply grid grid-cols-2 gap-2;
}

.filter-skill-option {
  @apply flex items-center space-x-2 cursor-pointer;
}

.skill-tag {
  @apply text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full;
}

.filter-skill-option input:checked + .skill-tag {
  @apply bg-blue-100 text-blue-800;
}

.selected-skill-tag {
  @apply bg-blue-500 text-white text-xs px-2 py-1 rounded-full 
         flex items-center cursor-default;
}

.clear-filters-btn {
  @apply w-full px-4 py-2 bg-red-50 text-red-700 border border-red-200 
         rounded-md hover:bg-red-100 transition-colors text-sm font-medium
         flex items-center justify-center;
}

.filter-group {
  @apply space-y-2;
}
</style>
`