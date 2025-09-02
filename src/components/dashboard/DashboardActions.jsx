import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Plus, 
  Briefcase, 
  User, 
  FileText, 
  MapPin,
  TrendingUp,
  Clock,
  Edit,
  Eye
} from 'lucide-react'
import { Button } from '../ui/Button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog'
import { FormManager } from './FormManager'

// Dashboard Action Buttons Component
export function DashboardActions({ userStats = {} }) {
  const { t } = useTranslation()
  const [showModal, setShowModal] = useState(false)
  const [selectedAction, setSelectedAction] = useState(null)
  const [activeForm, setActiveForm] = useState(null)

  const handleActionSelect = (action) => {
    setSelectedAction(action)
    setShowModal(true)
  }

  const handleConfirm = () => {
    setActiveForm(selectedAction)
    setShowModal(false)
    setSelectedAction(null)
  }

  return (
    <div className="dashboard-actions">
      {/* Quick Stats */}
      <div className="stats-overview grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="stat-card bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">İş İlanlarım</p>
              <p className="text-2xl font-bold text-blue-900">{userStats.jobPosts || 0}</p>
            </div>
            <Briefcase className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="stat-card bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">CV Görüntülenme</p>
              <p className="text-2xl font-bold text-green-900">{userStats.cvViews || 0}</p>
            </div>
            <Eye className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="stat-card bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Başvurular</p>
              <p className="text-2xl font-bold text-purple-900">{userStats.applications || 0}</p>
            </div>
            <FileText className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="stat-card bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Profil Tamamlanma</p>
              <p className="text-2xl font-bold text-orange-900">{userStats.profileCompletion || 65}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Main Action Cards */}
      <div className="action-cards grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Job Posting Card */}
        <div className="action-card bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center mb-4">
              <div className="bg-white bg-opacity-20 rounded-lg p-3 mr-4">
                <Briefcase className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">İş İlanı Ver</h3>
                <p className="text-blue-100 text-sm">Yetenekli adayları bul</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-blue-100 mb-4">
                • Binlerce aktif iş arayan
                • Detaylı filtreleme seçenekleri
                • Harita üzerinde konum gösterimi
                • Timeline ile aday değerlendirmesi
              </p>
            </div>

            <Button
              onClick={() => handleActionSelect('job')}
              className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-6 py-3 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              <Plus className="w-5 h-5 mr-2" />
              İş İlanı Oluştur
            </Button>
          </div>
          
          {/* Background Pattern */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-10 rounded-full -ml-12 -mb-12"></div>
        </div>

        {/* CV Creation Card */}
        <div className="action-card bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center mb-4">
              <div className="bg-white bg-opacity-20 rounded-lg p-3 mr-4">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Özgeçmiş Oluştur</h3>
                <p className="text-green-100 text-sm">Kariyerini görselleştir</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-green-100 mb-4">
                • İnteraktif kariyer timeline'ı
                • Beceri ve deneyim haritalaması
                • İşveren tarafından keşfedilebilir
                • Profesyonel profil görünümü
              </p>
            </div>

            <Button
              onClick={() => handleActionSelect('cv')}
              className="bg-white text-green-600 hover:bg-green-50 font-semibold px-6 py-3 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              <Plus className="w-5 h-5 mr-2" />
              Özgeçmiş Oluştur
            </Button>
          </div>
          
          {/* Background Pattern */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-10 rounded-full -ml-12 -mb-12"></div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hızlı İşlemler</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button className="quick-action-btn bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group">
            <Edit className="w-6 h-6 text-gray-500 group-hover:text-blue-500 mb-2 mx-auto" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
              Profil Düzenle
            </span>
          </button>

          <button className="quick-action-btn bg-white border border-gray-200 rounded-lg p-4 hover:border-green-300 hover:bg-green-50 transition-all duration-200 group">
            <MapPin className="w-6 h-6 text-gray-500 group-hover:text-green-500 mb-2 mx-auto" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-green-700">
              Konum Ayarla
            </span>
          </button>

          <button className="quick-action-btn bg-white border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 group">
            <Clock className="w-6 h-6 text-gray-500 group-hover:text-purple-500 mb-2 mx-auto" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">
              Son Aktiviteler
            </span>
          </button>

          <button className="quick-action-btn bg-white border border-gray-200 rounded-lg p-4 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200 group">
            <TrendingUp className="w-6 h-6 text-gray-500 group-hover:text-orange-500 mb-2 mx-auto" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-orange-700">
              İstatistikler
            </span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {selectedAction === 'job' ? (
                <>
                  <Briefcase className="w-6 h-6 mr-2 text-blue-500" />
                  İş İlanı Oluştur
                </>
              ) : (
                <>
                  <User className="w-6 h-6 mr-2 text-green-500" />
                  Özgeçmiş Oluştur
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            {selectedAction === 'job' ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">İş ilanınız şunları içerecek:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Pozisyon detayları ve gereksinimler</li>
                    <li>• Harita üzerinde konum gösterimi</li>
                    <li>• Maaş aralığı ve çalışma şekli</li>
                    <li>• Başvuru formu ve değerlendirme sistemi</li>
                  </ul>
                </div>
                <p className="text-gray-600 text-sm">
                  Form doldurma süreci yaklaşık 5-10 dakika sürecektir.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">Özgeçmişiniz şunları içerecek:</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Kişisel bilgiler ve iletişim</li>
                    <li>• İnteraktif kariyer timeline'ı</li>
                    <li>• Beceriler ve yeterlilikler</li>
                    <li>• Eğitim ve sertifikalar</li>
                  </ul>
                </div>
                <p className="text-gray-600 text-sm">
                  Timeline oluşturma süreci adım adım size rehberlik edecektir.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => setShowModal(false)}
              className="px-6"
            >
              İptal
            </Button>
            <Button
              onClick={handleConfirm}
              className={`px-6 ${
                selectedAction === 'job' 
                  ? 'bg-blue-500 hover:bg-blue-600' 
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {selectedAction === 'job' ? 'İlan Ver' : 'CV Oluştur'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Form Manager */}
      <FormManager 
        activeForm={activeForm}
        onClose={() => setActiveForm(null)}
      />
    </div>
  )
}

// Recent Activity Component
export function RecentActivity({ activities = [] }) {
  const { t } = useTranslation()

  const defaultActivities = [
    {
      id: 1,
      type: 'cv_view',
      title: 'Profiliniz görüntülendi',
      description: 'TechCorp şirketi profilinizi inceledi',
      timestamp: '2 saat önce',
      icon: Eye,
      color: 'text-blue-500'
    },
    {
      id: 2,
      type: 'job_application',
      title: 'Yeni başvuru',
      description: 'Senior Developer pozisyonuna başvuru yapıldı',
      timestamp: '5 saat önce',
      icon: FileText,
      color: 'text-green-500'
    },
    {
      id: 3,
      type: 'profile_update',
      title: 'Profil güncellendi',
      description: 'Timeline\'ınıza yeni deneyim eklendi',
      timestamp: '1 gün önce',
      icon: Edit,
      color: 'text-purple-500'
    }
  ]

  const displayActivities = activities.length > 0 ? activities : defaultActivities

  return (
    <div className="recent-activity bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Son Aktiviteler</h3>
      
      <div className="space-y-4">
        {displayActivities.slice(0, 5).map((activity) => {
          const IconComponent = activity.icon
          return (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center`}>
                <IconComponent className={`w-4 h-4 ${activity.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{typeof activity.title === 'string' ? activity.title : JSON.stringify(activity.title)}</p>
                <p className="text-sm text-gray-500">{typeof activity.description === 'string' ? activity.description : JSON.stringify(activity.description)}</p>
                <p className="text-xs text-gray-400 mt-1">{typeof activity.timestamp === 'string' ? activity.timestamp : JSON.stringify(activity.timestamp)}</p>
              </div>
            </div>
          )
        })}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <Button variant="outline" size="sm" className="w-full">
          Tüm Aktiviteleri Görüntüle
        </Button>
      </div>
    </div>
  )
}

// Profile Completion Widget
export function ProfileCompletion({ completionData = {} }) {
  const defaultData = {
    percentage: 65,
    completedSections: [
      'Kişisel Bilgiler',
      'İletişim Bilgileri',
      'Temel Timeline'
    ],
    missingSections: [
      'Profil Fotoğrafı',
      'Beceriler Detayı',
      'Eğitim Geçmişi',
      'Referanslar'
    ]
  }

  const data = { ...defaultData, ...completionData }

  return (
    <div className="profile-completion bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Profil Tamamlanma</h3>
        <span className="text-2xl font-bold text-blue-500">{data.percentage}%</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div 
          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${data.percentage}%` }}
        ></div>
      </div>

      {/* Completed Sections */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Tamamlanan Bölümler</h4>
        <div className="space-y-2">
          {data.completedSections.map((section, index) => (
            <div key={index} className="flex items-center text-sm text-green-600">
              <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              {typeof section === 'string' ? section : JSON.stringify(section)}
            </div>
          ))}
        </div>
      </div>

      {/* Missing Sections */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Eksik Bölümler</h4>
        <div className="space-y-2">
          {data.missingSections.map((section, index) => (
            <div key={index} className="flex items-center text-sm text-gray-500">
              <div className="w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              </div>
              {typeof section === 'string' ? section : JSON.stringify(section)}
            </div>
          ))}
        </div>
      </div>

      <Button className="w-full bg-blue-500 hover:bg-blue-600">
        Profili Tamamla
      </Button>
    </div>
  )
}