import React, { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useAuthStore } from '../../stores/authStore'
import { supabase } from '../../lib/supabase'
import { toast } from '../../lib/utils'
import { 
  User, 
  MapPin, 
  Briefcase, 
  Star, 
  ExternalLink,
  Save,
  Edit,
  Mail,
  Phone
} from 'lucide-react'

export function CandidateProfile() {
  const { user } = useAuthStore()
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    location: '',
    phone: '',
    experience_years: '',
    skills: [],
    linkedin_url: '',
    portfolio_url: ''
  })

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('candidate_profiles')
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
        full_name: data.full_name || '',
        bio: data.bio || '',
        location: data.location || '',
        phone: data.phone || '',
        experience_years: data.experience_years || '',
        skills: data.skills || [],
        linkedin_url: data.linkedin_url || '',
        portfolio_url: data.portfolio_url || ''
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
        .from('candidate_profiles')
        .insert([
          {
            user_id: user.id,
            full_name: `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim()
          }
        ])
        .select()
        .single()

      if (error) throw error
      
      setProfile(data)
      setFormData({
        full_name: data.full_name || '',
        bio: '',
        location: '',
        phone: '',
        experience_years: '',
        skills: [],
        linkedin_url: '',
        portfolio_url: ''
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
        .from('candidate_profiles')
        .update(formData)
        .eq('user_id', user.id)

      if (error) throw error

      setProfile({ ...profile, ...formData })
      setEditing(false)
      toast.success('Profil başarıyla güncellendi')
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Profil güncellenirken hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  const handleSkillsChange = (value) => {
    const skills = value.split(',').map(skill => skill.trim()).filter(Boolean)
    setFormData(prev => ({ ...prev, skills }))
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
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {profile?.full_name || 'İş Arayan'}
              </h1>
              <p className="text-gray-600">İş Arayan</p>
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <Mail className="h-4 w-4 mr-1" />
                {user?.email}
              </div>
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
              placeholder="Ad Soyad"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
            />
            <Input
              placeholder="Deneyim (yıl)"
              type="number"
              value={formData.experience_years}
              onChange={(e) => setFormData(prev => ({ ...prev, experience_years: e.target.value }))}
            />
            <Input
              placeholder="Konum (Şehir, Ülke)"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            />
            <Input
              placeholder="Telefon"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
            <Input
              placeholder="LinkedIn URL"
              value={formData.linkedin_url}
              onChange={(e) => setFormData(prev => ({ ...prev, linkedin_url: e.target.value }))}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center text-gray-600">
              <Briefcase className="h-4 w-4 mr-2" />
              {profile?.experience_years ? `${profile.experience_years} yıl deneyim` : 'Deneyim belirtilmemiş'}
            </div>
            <div className="flex items-center text-gray-600">
              <MapPin className="h-4 w-4 mr-2" />
              {profile?.location || 'Konum belirtilmemiş'}
            </div>
            <div className="flex items-center text-gray-600">
              <Phone className="h-4 w-4 mr-2" />
              {profile?.phone || 'Telefon belirtilmemiş'}
            </div>
            {profile?.linkedin_url && (
              <div className="flex items-center text-blue-600">
                <ExternalLink className="h-4 w-4 mr-2" />
                <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  LinkedIn Profili
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bio Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Hakkında</h2>
        {editing ? (
          <textarea
            placeholder="Kendinizden bahsedin..."
            value={formData.bio}
            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        ) : (
          <p className="text-gray-600 whitespace-pre-wrap">
            {profile?.bio || 'Henüz bir açıklama eklenmemiş.'}
          </p>
        )}
      </div>

      {/* Skills Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Yetenekler</h2>
        {editing ? (
          <Input
            placeholder="Yeteneklerinizi virgülle ayırarak yazın (ör: JavaScript, React, Node.js)"
            value={formData.skills.join(', ')}
            onChange={(e) => handleSkillsChange(e.target.value)}
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {profile?.skills && profile.skills.length > 0 ? (
              profile.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {skill}
                </span>
              ))
            ) : (
              <p className="text-gray-500">Henüz yetenek eklenmemiş.</p>
            )}
          </div>
        )}
      </div>

      {/* Portfolio Section */}
      {(editing || profile?.portfolio_url) && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Portföy</h2>
          {editing ? (
            <Input
              placeholder="Portföy URL'niz"
              value={formData.portfolio_url}
              onChange={(e) => setFormData(prev => ({ ...prev, portfolio_url: e.target.value }))}
            />
          ) : (
            <a
              href={profile.portfolio_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:underline"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Portföyü Görüntüle
            </a>
          )}
        </div>
      )}
    </div>
  )
}