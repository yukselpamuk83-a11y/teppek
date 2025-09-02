import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Save, 
  X,
  AlertCircle,
  ChevronRight
} from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog'

// Multi-Step Form Framework
export function MultiStepForm({
  isOpen,
  onClose,
  onSubmit,
  steps,
  formType, // 'job' | 'cv'
  initialData = {},
  onSaveDraft
}) {
  const { t } = useTranslation()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState(initialData)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [isDraftSaved, setIsDraftSaved] = useState(false)

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!isOpen) return

    const autoSaveInterval = setInterval(() => {
      if (Object.keys(formData).length > 0) {
        handleSaveDraft()
      }
    }, 30000)

    return () => clearInterval(autoSaveInterval)
  }, [formData, isOpen])

  const handleNext = () => {
    const currentStepData = steps[currentStep]
    const stepErrors = validateStep(currentStepData, formData)
    
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }

    setErrors({})
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear field error if it exists
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }))
    }
  }

  const handleSaveDraft = async () => {
    if (onSaveDraft) {
      await onSaveDraft(formData)
      setIsDraftSaved(true)
      setTimeout(() => setIsDraftSaved(false), 2000)
    }
  }

  const handleSubmit = async () => {
    // Validate all steps
    let allErrors = {}
    steps.forEach((step, index) => {
      const stepErrors = validateStep(step, formData)
      allErrors = { ...allErrors, ...stepErrors }
    })

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors)
      return
    }

    setIsLoading(true)
    try {
      await onSubmit(formData)
      onClose()
    } catch (error) {
      console.error('Form submission error:', error)
      setErrors({ submit: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  const validateStep = (step, data) => {
    const errors = {}
    
    // Skip validation if step has no fields (uses custom component)
    if (!step.fields || !Array.isArray(step.fields)) {
      return errors
    }
    
    step.fields.forEach(field => {
      if (field.required && (!data[field.name] || data[field.name].toString().trim() === '')) {
        errors[field.name] = `${field.label} alanı zorunludur`
      }
      
      if (data[field.name] && field.validation) {
        const validationResult = field.validation(data[field.name])
        if (validationResult !== true) {
          errors[field.name] = validationResult
        }
      }
    })
    
    return errors
  }

  const currentStepData = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1
  const completedSteps = currentStep

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center">
              {formType === 'job' ? (
                <div className="bg-blue-100 p-2 rounded-lg mr-3">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M10 2L8 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-4l-2-2h-8z"/>
                  </svg>
                </div>
              ) : (
                <div className="bg-green-100 p-2 rounded-lg mr-3">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold">
                  {formType === 'job' ? 'İş İlanı Oluştur' : 'Özgeçmiş Oluştur'}
                </h2>
                <p className="text-sm text-gray-500">
                  Adım {currentStep + 1} / {steps.length}: {currentStepData.title}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                className={`${isDraftSaved ? 'border-green-300 bg-green-50' : ''}`}
              >
                <Save className="w-4 h-4 mr-1" />
                {isDraftSaved ? 'Kaydedildi' : 'Taslak Kaydet'}
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6 px-6">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${index <= completedSteps
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-500'
                }
                ${index === currentStep ? 'ring-2 ring-blue-300' : ''}
              `}>
                {index < completedSteps ? (
                  <Check className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`
                  w-12 h-0.5 mx-2
                  ${index < completedSteps ? 'bg-blue-500' : 'bg-gray-200'}
                `} />
              )}
            </div>
          ))}
        </div>

        {/* Form Content */}
        <div className="form-content px-6 pb-6 max-h-96 overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {currentStepData.title}
            </h3>
            {currentStepData.description && (
              <p className="text-gray-600 text-sm mb-4">
                {currentStepData.description}
              </p>
            )}
          </div>

          {/* Render Current Step Component */}
          <div className="space-y-4">
            {currentStepData.component ? (
              <currentStepData.component
                data={formData}
                onChange={handleFieldChange}
                errors={errors}
              />
            ) : currentStepData.fields ? (
              <DefaultStepRenderer
                fields={currentStepData.fields}
                data={formData}
                onChange={handleFieldChange}
                errors={errors}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Bu adım için özel bir bileşen tanımlanmalı</p>
              </div>
            )}
          </div>

          {/* Error Messages */}
          {Object.keys(errors).length > 0 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <h4 className="text-sm font-medium text-red-800">
                  Lütfen aşağıdaki hataları düzeltin:
                </h4>
              </div>
              <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                {Object.entries(errors).map(([field, error]) => (
                  <li key={field}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {Math.round(((currentStep + 1) / steps.length) * 100)}% tamamlandı
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="px-4"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Geri
            </Button>
            
            {isLastStep ? (
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-6 bg-green-500 hover:bg-green-600"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    {formType === 'job' ? 'İlanı Yayınla' : 'CV\'yi Oluştur'}
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="px-4"
              >
                İleri
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Default Step Renderer
function DefaultStepRenderer({ fields, data, onChange, errors }) {
  return (
    <>
      {fields.map((field, index) => (
        <div key={index} className="form-field">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          
          {field.type === 'text' || field.type === 'email' || field.type === 'number' ? (
            <Input
              type={field.type}
              value={data[field.name] || ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className={errors[field.name] ? 'border-red-300' : ''}
            />
          ) : field.type === 'textarea' ? (
            <textarea
              value={data[field.name] || ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              rows={field.rows || 3}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                errors[field.name] ? 'border-red-300' : 'border-gray-300'
              }`}
            />
          ) : field.type === 'select' ? (
            <select
              value={data[field.name] || ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                errors[field.name] ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">{field.placeholder}</option>
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {typeof option.label === 'string' ? option.label : JSON.stringify(option.label)}
                </option>
              ))}
            </select>
          ) : field.type === 'checkbox' ? (
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={data[field.name] || false}
                onChange={(e) => onChange(field.name, e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-600">{field.checkboxLabel}</span>
            </div>
          ) : null}
          
          {field.help && (
            <p className="mt-1 text-sm text-gray-500">{field.help}</p>
          )}
          
          {errors[field.name] && (
            <p className="mt-1 text-sm text-red-600">{errors[field.name]}</p>
          )}
        </div>
      ))}
    </>
  )
}

// Form Step Navigation Component
export function FormStepNavigation({ 
  steps, 
  currentStep, 
  onStepClick,
  completedSteps = []
}) {
  return (
    <div className="form-step-navigation">
      <div className="flex items-center justify-between mb-6">
        {steps.map((step, index) => (
          <button
            key={index}
            onClick={() => onStepClick(index)}
            disabled={index > Math.max(...completedSteps, currentStep)}
            className={`
              flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors
              ${index === currentStep 
                ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                : completedSteps.includes(index)
                  ? 'bg-green-50 text-green-700 hover:bg-green-100'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }
              ${index > Math.max(...completedSteps, currentStep) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
            `}
          >
            <div className={`
              w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
              ${index === currentStep
                ? 'bg-blue-500 text-white'
                : completedSteps.includes(index)
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }
            `}>
              {completedSteps.includes(index) ? (
                <Check className="w-3 h-3" />
              ) : (
                index + 1
              )}
            </div>
            <span className="text-sm font-medium hidden sm:block">
              {step.shortTitle || step.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}