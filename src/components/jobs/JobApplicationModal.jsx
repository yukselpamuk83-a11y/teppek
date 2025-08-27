// DENEYSEL PROJE - Job Application Modal
import { useState } from 'react'
import { Send, Upload, FileText, X, CheckCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { useAuthStore } from '../../stores/authStore'
import { toast } from '../../lib/utils'

export function JobApplicationModal({ job, isOpen, onClose }) {
  const { user, isAuthenticated } = useAuthStore()
  const [step, setStep] = useState(1) // 1: form, 2: success
  const [loading, setLoading] = useState(false)
  
  const [applicationData, setApplicationData] = useState({
    coverLetter: '',
    resume: null,
    experience: '',
    expectedSalary: '',
    availableFrom: '',
    motivation: '',
    portfolio: '',
    linkedIn: '',
    github: ''
  })

  const handleInputChange = (field, value) => {
    setApplicationData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Dosya boyutu 5MB\'dan küçük olmalıdır!')
        return
      }
      
      if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
        toast.error('Sadece PDF, DOC, DOCX formatları kabul edilir!')
        return
      }
      
      setApplicationData(prev => ({
        ...prev,
        resume: file
      }))
      toast.success('CV başarıyla yüklendi!')
    }
  }

  const handleSubmit = async () => {
    if (!isAuthenticated()) {
      toast.error('Başvuru yapabilmek için giriş yapmalısınız!')
      return
    }

    if (!applicationData.coverLetter.trim()) {
      toast.error('Başvuru mektubu boş olamaz!')
      return
    }

    setLoading(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In a real app, you would send this to your API:
      const applicationPayload = {
        jobId: job.id,
        userId: user.id,
        userEmail: user.email,
        userName: user.user_metadata?.full_name || 'İsimsiz',
        coverLetter: applicationData.coverLetter,
        experience: applicationData.experience,
        expectedSalary: applicationData.expectedSalary,
        availableFrom: applicationData.availableFrom,
        motivation: applicationData.motivation,
        portfolio: applicationData.portfolio,
        linkedIn: applicationData.linkedIn,
        github: applicationData.github,
        hasResume: !!applicationData.resume,
        appliedAt: new Date().toISOString()
      }
      
      console.log('📝 Job Application Submitted:', applicationPayload)
      
      setStep(2)
      toast.success('Başvurunuz başarıyla gönderildi!')
      
    } catch (error) {
      console.error('Application submission error:', error)
      toast.error('Başvuru gönderilirken hata oluştu!')
    } finally {
      setLoading(false)
    }
  }

  const resetAndClose = () => {
    setStep(1)
    setApplicationData({
      coverLetter: '',
      resume: null,
      experience: '',
      expectedSalary: '',
      availableFrom: '',
      motivation: '',
      portfolio: '',
      linkedIn: '',
      github: ''
    })
    onClose()
  }

  if (!job) return null

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gray-900">
            {step === 1 ? 'İş Başvurusu' : 'Başvuru Tamamlandı!'}
          </DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-6 py-4">
            {/* Job Info */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 text-lg">{job.title}</h3>
              <p className="text-blue-700">{job.company}</p>
              <p className="text-blue-600 text-sm">{job.address}</p>
              {job.salary_min && job.salary_max && (
                <p className="text-blue-600 text-sm mt-1">
                  Maaş: {job.salary_min} - {job.salary_max} {job.currency || 'TRY'}
                </p>
              )}
            </div>

            {/* Application Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Başvuru Mektubu *
                </label>
                <textarea
                  value={applicationData.coverLetter}
                  onChange={(e) => handleInputChange('coverLetter', e.target.value)}
                  rows="6"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="Neden bu pozisyon için uygun olduğunuzu açıklayın..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CV Yükle
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label
                    htmlFor="resume-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    {applicationData.resume ? (
                      <>
                        <CheckCircle className="w-8 h-8 text-green-600 mb-2" />
                        <p className="text-green-700 font-medium">{applicationData.resume.name}</p>
                        <p className="text-sm text-gray-500">Değiştirmek için tıklayın</p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-gray-700">CV Yükle (PDF, DOC, DOCX)</p>
                        <p className="text-sm text-gray-500">Maksimum 5MB</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deneyim (Yıl)
                  </label>
                  <input
                    type="text"
                    value={applicationData.experience}
                    onChange={(e) => handleInputChange('experience', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="Örn: 3 yıl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beklenen Maaş
                  </label>
                  <input
                    type="text"
                    value={applicationData.expectedSalary}
                    onChange={(e) => handleInputChange('expectedSalary', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="Örn: 15.000 TRY"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  İşe Başlayabilme Tarihi
                </label>
                <input
                  type="date"
                  value={applicationData.availableFrom}
                  onChange={(e) => handleInputChange('availableFrom', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivasyon
                </label>
                <textarea
                  value={applicationData.motivation}
                  onChange={(e) => handleInputChange('motivation', e.target.value)}
                  rows="3"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="Bu şirkette neden çalışmak istiyorsunuz?"
                />
              </div>

              {/* Additional Links */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Ek Linkler (İsteğe Bağlı)</h4>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Portfolio/Website
                  </label>
                  <input
                    type="url"
                    value={applicationData.portfolio}
                    onChange={(e) => handleInputChange('portfolio', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="https://portfolio.com"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      LinkedIn
                    </label>
                    <input
                      type="url"
                      value={applicationData.linkedIn}
                      onChange={(e) => handleInputChange('linkedIn', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      GitHub
                    </label>
                    <input
                      type="url"
                      value={applicationData.github}
                      onChange={(e) => handleInputChange('github', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      placeholder="https://github.com/..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button onClick={resetAndClose} variant="outline">
                İptal
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || !applicationData.coverLetter.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4 mr-2" />
                {loading ? 'Gönderiliyor...' : 'Başvuru Gönder'}
              </Button>
            </div>
          </div>
        ) : (
          // Success Step
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Başvurunuz Alındı!
              </h3>
              <p className="text-gray-600 mb-4">
                <strong>{job.company}</strong> firmasına <strong>{job.title}</strong> pozisyonu için başvurunuz başarıyla gönderildi.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg text-left text-sm text-blue-800">
                <p className="font-medium mb-2">Sonraki Adımlar:</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• Başvurunuz şirket tarafından incelenecek</li>
                  <li>• Uygun görülürse e-posta ile iletişime geçilecek</li>
                  <li>• Başvuru durumunuzu profilinizden takip edebilirsiniz</li>
                </ul>
              </div>
            </div>
            
            <div className="flex justify-center gap-3 pt-4">
              <Button onClick={resetAndClose} className="bg-blue-600 hover:bg-blue-700">
                Tamam
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}