import React, { useState } from 'react'
import { MultiStepForm } from '../forms/MultiStepForm'
import { JobPostingForm } from '../forms/JobPostingForm'
import { CVCreationSteps } from '../forms/CVCreationSteps'
import { TimelineBuilder } from '../forms/TimelineBuilder'

export function FormManager({ activeForm, onClose }) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const jobSteps = [
    {
      title: "İş İlanı Bilgileri",
      description: "Temel iş bilgilerini girin",
      component: JobPostingForm
    }
  ]

  const cvSteps = [
    {
      title: "Kişisel Bilgiler",
      description: "Temel kişisel bilgilerinizi girin",
      fields: [
        { name: 'firstName', label: 'Ad', type: 'text', required: true },
        { name: 'lastName', label: 'Soyad', type: 'text', required: true },
        { name: 'email', label: 'E-posta', type: 'email', required: true },
        { name: 'phone', label: 'Telefon', type: 'text', required: true }
      ]
    },
    {
      title: "Konum Bilgileri",
      description: "Çalışmak istediğiniz konumu belirtin",
      fields: [
        { name: 'city', label: 'Şehir', type: 'text', required: true },
        { name: 'district', label: 'İlçe', type: 'text' },
        { name: 'address', label: 'Adres', type: 'textarea', rows: 3 }
      ]
    },
    {
      title: "Profil Bilgileri",
      description: "Kendinizi tanıtın",
      fields: [
        { name: 'title', label: 'Meslek Unvanı', type: 'text', required: true },
        { name: 'summary', label: 'Özet', type: 'textarea', rows: 4, required: true },
        { name: 'experience', label: 'Deneyim (Yıl)', type: 'number', required: true }
      ]
    },
    {
      title: "Kariyer Zaman Çizelgesi",
      description: "İş deneyimlerinizi ve eğitim geçmişinizi ekleyin",
      component: TimelineBuilder
    },
    {
      title: "Yetenekler",
      description: "Beceri ve yeteneklerinizi ekleyin",
      fields: [
        { name: 'skills', label: 'Yetenekler', type: 'textarea', 
          placeholder: 'Yetenekleri virgülle ayırarak yazın', rows: 3 },
        { name: 'languages', label: 'Diller', type: 'textarea', 
          placeholder: 'Bildiğiniz dilleri virgülle ayırarak yazın', rows: 2 }
      ]
    },
    {
      title: "Tercihler",
      description: "İş tercihlerinizi belirtin",
      fields: [
        { name: 'preferredSalary', label: 'Beklenen Maaş', type: 'number' },
        { name: 'workType', label: 'Çalışma Türü', type: 'select', 
          options: [
            { value: 'full-time', label: 'Tam Zamanlı' },
            { value: 'part-time', label: 'Yarı Zamanlı' },
            { value: 'freelance', label: 'Serbest Çalışma' },
            { value: 'remote', label: 'Uzaktan Çalışma' }
          ]
        },
        { name: 'availability', label: 'Uygunluk', type: 'select',
          options: [
            { value: 'immediately', label: 'Hemen Başlayabilirim' },
            { value: '1-week', label: '1 Hafta İçinde' },
            { value: '2-weeks', label: '2 Hafta İçinde' },
            { value: '1-month', label: '1 Ay İçinde' }
          ]
        }
      ]
    }
  ]

  const handleJobSubmit = async (formData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('İş ilanı kaydedilemedi')
      }

      const result = await response.json()
      console.log('Job posted successfully:', result)
      
      // Show success message or redirect
      alert('İş ilanınız başarıyla yayınlandı!')
      onClose()
      
    } catch (error) {
      console.error('Error submitting job:', error)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCVSubmit = async (formData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/cvs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          timeline_data: formData.timeline || []
        })
      })

      if (!response.ok) {
        throw new Error('Özgeçmiş kaydedilemedi')
      }

      const result = await response.json()
      console.log('CV created successfully:', result)
      
      // Show success message or redirect
      alert('Özgeçmişiniz başarıyla oluşturuldu!')
      onClose()
      
    } catch (error) {
      console.error('Error submitting CV:', error)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveDraft = async (formData, type) => {
    try {
      const endpoint = type === 'job' ? '/api/jobs/draft' : '/api/cvs/draft'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          draft_data: formData,
          type: type
        })
      })

      if (!response.ok) {
        throw new Error('Taslak kaydedilemedi')
      }

      console.log('Draft saved successfully')
      
    } catch (error) {
      console.error('Error saving draft:', error)
    }
  }

  return (
    <>
      {/* Job Posting Form */}
      <MultiStepForm
        isOpen={activeForm === 'job'}
        onClose={onClose}
        onSubmit={handleJobSubmit}
        steps={jobSteps}
        formType="job"
        onSaveDraft={(data) => handleSaveDraft(data, 'job')}
      />

      {/* CV Creation Form */}
      <MultiStepForm
        isOpen={activeForm === 'cv'}
        onClose={onClose}
        onSubmit={handleCVSubmit}
        steps={cvSteps}
        formType="cv"
        onSaveDraft={(data) => handleSaveDraft(data, 'cv')}
      />
    </>
  )
}

export function useFormManager() {
  const [activeForm, setActiveForm] = useState(null)
  
  const openJobForm = () => setActiveForm('job')
  const openCVForm = () => setActiveForm('cv')
  const closeForm = () => setActiveForm(null)
  
  return {
    activeForm,
    openJobForm,
    openCVForm,
    closeForm,
    FormManager: () => (
      <FormManager 
        activeForm={activeForm}
        setActiveForm={setActiveForm}
      />
    )
  }
}