// DENEYSEL PROJE - Modern User Dashboard
import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/Button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog'
import { Input } from '../ui/Input'
import { analytics } from '../../lib/analytics'
import { 
  User, 
  MapPin, 
  Briefcase, 
  Heart,
  TrendingUp,
  Calendar,
  Mail,
  Phone,
  Edit,
  Save,
  X,
  Building,
  Plus,
  Eye,
  Settings
} from 'lucide-react'
import { DashboardActions } from '../dashboard/DashboardActions'

export function UserDashboard() {
  const { user, userMetadata } = useAuth()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [stats, setStats] = useState({
    savedJobs: 12,
    applications: 8,
    profileViews: 45,
    lastLogin: new Date()
  })
  
  const [profileData, setProfileData] = useState({
    firstName: userMetadata?.first_name || userMetadata?.name?.split(' ')[0] || '',
    lastName: userMetadata?.last_name || userMetadata?.name?.split(' ')[1] || '',
    email: user?.email || '',
    phone: userMetadata?.phone || '',
    location: userMetadata?.location || '',
    bio: userMetadata?.bio || '',
    skills: userMetadata?.skills || ''
  })

  useEffect(() => {
    if (user) {
      analytics.events.pageView('dashboard')
    }
  }, [user])

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    // Profile update logic buraya gelecek
    analytics.track('profile_update', { 
      user_id: user?.id,
      fields_updated: Object.keys(profileData) 
    })
    setIsProfileOpen(false)
  }

  const handleLocationUpdate = () => {
    // Location update functionality
    console.log('🗺️ Konum güncelleme başlatılıyor...')
    // Geolocation API ile konum al
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('📍 Yeni konum:', position.coords)
        // Toast notification göster
      },
      (error) => {
        console.error('❌ Konum alınamadı:', error)
      }
    )
  }

  const handleCVUpdate = () => {
    if (isCompany) {
      console.log('🏢 İlan yayınlama başlatılıyor...')
      // İlan yayınlama modal'ını aç
    } else {
      console.log('📄 CV güncelleme başlatılıyor...')
      // CV güncelleme modal'ını aç
    }
  }

  const handleStatsView = () => {
    console.log('📊 İstatistikler görüntüleniyor...')
    // İstatistikler sayfasına yönlendir
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            Dashboard'a erişim için giriş yapın
          </h2>
          <p className="text-gray-500">
            İş başvurularınızı, kayıtlı ilanlarınızı ve profilinizi yönetebilirsiniz.
          </p>
        </div>
      </div>
    )
  }

  const userType = userMetadata?.user_type || 'user'
  const isCompany = userType === 'company'

  return (
    <>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                Hoş geldin, {userMetadata?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Kullanıcı'}! 👋
              </h1>
              <p className="opacity-90">
                {isCompany ? 'İşveren Paneli' : 'İş Arayan Paneli'} - Son giriş: {stats.lastLogin.toLocaleDateString('tr-TR')}
              </p>
            </div>
            <Button 
              variant="secondary" 
              onClick={() => setIsProfileOpen(true)}
              className="bg-white/20 hover:bg-white/30 text-white border-white/20"
            >
              <Edit className="h-4 w-4 mr-2" />
              Profili Düzenle
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isCompany ? (
            // Firma Dashboard İstatistikleri
            <>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Briefcase className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-semibold text-gray-900">5</p>
                    <p className="text-gray-600">Aktif İlan</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-full">
                    <User className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-semibold text-gray-900">23</p>
                    <p className="text-gray-600">Başvuru</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-semibold text-gray-900">156</p>
                    <p className="text-gray-600">İlan Görüntüleme</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="bg-red-100 p-3 rounded-full">
                    <Calendar className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-semibold text-gray-900">3</p>
                    <p className="text-gray-600">Mülakatlar</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Aday Dashboard İstatistikleri
            <>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="bg-red-100 p-3 rounded-full">
                    <Heart className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-semibold text-gray-900">{stats.savedJobs}</p>
                    <p className="text-gray-600">Kayıtlı İlan</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-full">
                    <Briefcase className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-semibold text-gray-900">{stats.applications}</p>
                    <p className="text-gray-600">Başvuru</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-semibold text-gray-900">{stats.profileViews}</p>
                    <p className="text-gray-600">Profil Görüntüleme</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-semibold text-gray-900">2</p>
                    <p className="text-gray-600">Mülakatlar</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Dashboard Actions - İş İlanı ve CV Oluşturma */}
        <DashboardActions 
          userStats={{
            jobPosts: isCompany ? 5 : 0,
            cvViews: isCompany ? 0 : stats.profileViews,
            applications: stats.applications,
            profileCompletion: 75
          }}
        />

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Son Aktiviteler</h2>
          <div className="space-y-3">
            {isCompany ? (
              // Firma Aktiviteleri
              <>
                <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                  <Briefcase className="h-5 w-5 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium">Yeni iş ilanı yayınladın</p>
                    <p className="text-sm text-gray-500">3 saat önce</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-green-50 rounded-lg">
                  <User className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium">5 yeni başvuru aldın</p>
                    <p className="text-sm text-gray-500">6 saat önce</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-600 mr-3" />
                  <div>
                    <p className="font-medium">Mülakat programın güncellendi</p>
                    <p className="text-sm text-gray-500">1 gün önce</p>
                  </div>
                </div>
              </>
            ) : (
              // Aday Aktiviteleri
              <>
                <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                  <Briefcase className="h-5 w-5 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium">Frontend Developer pozisyonuna başvurdun</p>
                    <p className="text-sm text-gray-500">2 saat önce</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-green-50 rounded-lg">
                  <Heart className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium">3 yeni iş ilanını kaydettin</p>
                    <p className="text-sm text-gray-500">1 gün önce</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                  <User className="h-5 w-5 text-purple-600 mr-3" />
                  <div>
                    <p className="font-medium">CV'ni güncelledin</p>
                    <p className="text-sm text-gray-500">3 gün önce</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Firma için İlan Yönetimi */}
        {isCompany && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                <Building className="h-5 w-5 mr-2 text-blue-600" />
                İlan Yönetimi
              </h2>
              <Button variant="teppek" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Yeni İlan
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <h3 className="font-medium">Senior React Developer</h3>
                  <p className="text-sm text-gray-500">Yayınlandı: 2 gün önce • 12 başvuru</p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <h3 className="font-medium">UX/UI Designer</h3>
                  <p className="text-sm text-gray-500">Yayınlandı: 1 hafta önce • 8 başvuru</p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Aday için Başvurularım */}
        {!isCompany && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Briefcase className="h-5 w-5 mr-2 text-green-600" />
              Başvurularım
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium">Frontend Developer</h3>
                  <p className="text-sm text-gray-500">ABC Teknoloji • Başvuru: 2 gün önce</p>
                </div>
                <div className="flex items-center">
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                    İnceleniyor
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium">React Native Developer</h3>
                  <p className="text-sm text-gray-500">XYZ Yazılım • Başvuru: 1 hafta önce</p>
                </div>
                <div className="flex items-center">
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                    Mülakat
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium">Full Stack Developer</h3>
                  <p className="text-sm text-gray-500">Tech Startup • Başvuru: 2 hafta önce</p>
                </div>
                <div className="flex items-center">
                  <span className="px-3 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                    Reddedildi
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Profile Edit Modal */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Profil Bilgilerini Düzenle</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Ad</label>
                <Input
                  value={profileData.firstName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Adınız"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Soyad</label>
                <Input
                  value={profileData.lastName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Soyadınız"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                E-posta
              </label>
              <Input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="E-posta adresiniz"
              />
            </div>

            <div>
              <label className="text-sm font-medium flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                Telefon
              </label>
              <Input
                value={profileData.phone}
                onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Telefon numaranız"
              />
            </div>

            <div>
              <label className="text-sm font-medium flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Konum
              </label>
              <Input
                value={profileData.location}
                onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Şehir, Ülke"
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" variant="teppek" className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Kaydet
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsProfileOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}