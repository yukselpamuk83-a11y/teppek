import React, { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useAuthStore } from '../../stores/authStore'
import { supabase } from '../../lib/supabase'
import { toast } from '../../lib/utils'
import { 
  Building, 
  MapPin, 
  Users, 
  ExternalLink,
  Save,
  Edit,
  Mail,
  Phone,
  Globe,
  Briefcase
} from 'lucide-react'

export function CompanyProfile() {
  const { user } = useAuthStore()
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    company_name: '',
    company_description: '',
    industry: '',
    company_size: '',
    address: '',
    contact_phone: '',
    website_url: '',
    contact_email: ''
  })

  const companySizeOptions = [
    '1-10 çalışan',
    '11-50 çalışan', 
    '51-200 çalışan',
    '201-1000 çalışan',
    '1000+ çalışan'
  ]

  const industryOptions = [
    'Teknoloji',
    'Finans',
    'E-ticaret',
    'Sağlık',
    'Eğitim',
    'İmalat',
    'İnşaat',
    'Turizm',
    'Medya',
    'Danışmanlık',
    'Diğer'
  ]

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist yet, create one
        await createInitialProfile()
        return
      }

      if (error) throw error

      setProfile(data)
      setFormData({
        company_name: data.company_name || '',
        company_description: data.company_description || '',
        industry: data.industry || '',
        company_size: data.company_size || '',
        address: data.address || '',
        contact_phone: data.contact_phone || '',
        website_url: data.website_url || '',
        contact_email: data.contact_email || ''
      })
    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error('Profil yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const createInitialProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('company_profiles')
        .insert([
          {
            user_id: user.id,
            company_name: user.user_metadata?.company_name || `${user.user_metadata?.first_name || ''} Company`.trim(),
            contact_email: user.email
          }
        ])
        .select()
        .single()

      if (error) throw error
      
      setProfile(data)
      setFormData({
        company_name: data.company_name || '',
        company_description: '',
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        industry: '',
        company_size: '',
        location_city: '',
        location_country: '',
        phone_number: '',
        website_url: ''
      })
    } catch (error) {
      console.error('Error creating profile:', error)
      toast.error('Profil oluşturulurken hata oluştu')
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      const { error } = await supabase
        .from('company_profiles')
        .update(formData)
        .eq('user_id', user.id)

      if (error) throw error

      setProfile({ ...profile, ...formData })
      setEditing(false)
      toast.success('Şirket profili başarıyla güncellendi')
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Profil güncellenirken hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Building className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {profile?.company_name || 'Şirket Adı'}
              </h1>
              <p className="text-gray-600">{profile?.industry || 'Sektör belirtilmemiş'}</p>
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <Mail className="h-4 w-4 mr-1" />
                {user?.email}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                İletişim: {profile?.contact_email || user?.email}
              </p>
            </div>
          </div>
          <Button
            onClick={() => editing ? handleSave() : setEditing(true)}
            disabled={saving}
            className="flex items-center gap-2"
          >
            {editing ? (
              <>
                <Save className="h-4 w-4" />
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </>
            ) : (
              <>
                <Edit className="h-4 w-4" />
                Düzenle
              </>
            )}
          </Button>
        </div>

        {editing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Şirket Adı"
              value={formData.company_name}
              onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
            />
            <Input
              placeholder="Web Sitesi"
              value={formData.website_url}
              onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
            />
            <select
              value={formData.industry}
              onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sektör Seçin</option>
              {industryOptions.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
            <select
              value={formData.company_size}
              onChange={(e) => setFormData(prev => ({ ...prev, company_size: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Şirket Büyüklüğü</option>
              {companySizeOptions.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <Input
              placeholder="Adres"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            />
            <Input
              placeholder="İletişim E-posta"
              value={formData.contact_email}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
            />
            <Input
              placeholder="Telefon"
              value={formData.contact_phone}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center text-gray-600">
              <Users className="h-4 w-4 mr-2" />
              {profile?.company_size || 'Şirket büyüklüğü belirtilmemiş'}
            </div>
            <div className="flex items-center text-gray-600">
              <MapPin className="h-4 w-4 mr-2" />
              {profile?.address || 'Adres belirtilmemiş'}
            </div>
            <div className="flex items-center text-gray-600">
              <Phone className="h-4 w-4 mr-2" />
              {profile?.contact_phone || 'Telefon belirtilmemiş'}
            </div>
            {profile?.website_url && (
              <div className="flex items-center text-blue-600">
                <Globe className="h-4 w-4 mr-2" />
                <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  Web Sitesi
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Company Description */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Şirket Hakkında</h2>
        {editing ? (
          <textarea
            placeholder="Şirketiniz hakkında detaylı bilgi verin..."
            value={formData.company_description}
            onChange={(e) => setFormData(prev => ({ ...prev, company_description: e.target.value }))}
            rows={6}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        ) : (
          <p className="text-gray-600 whitespace-pre-wrap">
            {profile?.company_description || 'Henüz şirket açıklaması eklenmemiş.'}
          </p>
        )}
      </div>

      {/* Company Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Ekip Boyutu</h3>
          <p className="text-gray-600 text-sm mt-1">
            {profile?.company_size || 'Belirtilmemiş'}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Briefcase className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Sektör</h3>
          <p className="text-gray-600 text-sm mt-1">
            {profile?.industry || 'Belirtilmemiş'}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <MapPin className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Lokasyon</h3>
          <p className="text-gray-600 text-sm mt-1">
            {profile?.address || 'Belirtilmemiş'}
          </p>
        </div>
      </div>
    </div>
  )
}