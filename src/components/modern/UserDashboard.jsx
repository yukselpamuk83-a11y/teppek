// DENEYSEL PROJE - Modern User Dashboard
import { useState, useEffect } from 'react'
import { useAuthStore } from '../../stores/authStore'
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
  X
} from 'lucide-react'

export function UserDashboard() {
  const { user } = useAuthStore()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [stats, setStats] = useState({
    savedJobs: 12,
    applications: 8,
    profileViews: 45,
    lastLogin: new Date()
  })
  
  const [profileData, setProfileData] = useState({
    firstName: user?.user_metadata?.first_name || '',
    lastName: user?.user_metadata?.last_name || '',
    email: user?.email || '',
    phone: '',
    location: '',
    bio: '',
    skills: ''
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

  const userType = user.user_metadata?.user_type || 'user'
  const isCompany = userType === 'company'

  return (
    <>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                Hoş geldin, {user.user_metadata?.first_name || 'Kullanıcı'}! 👋
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
                <p className="text-2xl font-semibold text-gray-900">24</p>
                <p className="text-gray-600">Günlük Aktivite</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Hızlı İşlemler</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start h-auto p-4">
              <MapPin className="h-5 w-5 mr-3 text-blue-600" />
              <div className="text-left">
                <div className="font-medium">Konum Güncelle</div>
                <div className="text-sm text-gray-500">Yakınımdaki işleri göster</div>
              </div>
            </Button>
            
            <Button variant="outline" className="justify-start h-auto p-4">
              <Briefcase className="h-5 w-5 mr-3 text-green-600" />
              <div className="text-left">
                <div className="font-medium">{isCompany ? 'İlan Yayınla' : 'CV Güncelle'}</div>
                <div className="text-sm text-gray-500">{isCompany ? 'Yeni pozisyon ekle' : 'Profilini güncel tut'}</div>
              </div>
            </Button>
            
            <Button variant="outline" className="justify-start h-auto p-4">
              <TrendingUp className="h-5 w-5 mr-3 text-purple-600" />
              <div className="text-left">
                <div className="font-medium">İstatistikler</div>
                <div className="text-sm text-gray-500">Detaylı analiz görüntüle</div>
              </div>
            </Button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Son Aktiviteler</h2>
          <div className="space-y-3">
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
                <p className="font-medium">Profil fotoğrafını güncelledin</p>
                <p className="text-sm text-gray-500">3 gün önce</p>
              </div>
            </div>
          </div>
        </div>
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