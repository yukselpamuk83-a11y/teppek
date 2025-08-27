import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { useAuthStore } from '../../stores/authStore'
import { supabase } from '../../lib/supabase'
import { toast } from '../../lib/utils'
import { 
  User, 
  Building, 
  CheckCircle
} from 'lucide-react'

export function PostRegistrationUserTypeModal({ isOpen, onClose }) {
  const [selectedType, setSelectedType] = useState(null)
  const [loading, setLoading] = useState(false)
  const { user } = useAuthStore()

  const handleUserTypeSelect = async (userType) => {
    if (!user) return
    
    setLoading(true)
    try {
      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { user_type: userType }
      })

      if (updateError) throw updateError

      // Create appropriate profile record
      if (userType === 'candidate') {
        const { error } = await supabase
          .from('candidate_profiles')
          .insert([{
            user_id: user.id,
            full_name: `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || user.email?.split('@')[0] || 'Kullanıcı'
          }])
        
        if (error && error.code !== '23505') { // 23505 = duplicate key error (already exists)
          throw error
        }
      } else {
        const { error } = await supabase
          .from('company_profiles')
          .insert([{
            user_id: user.id,
            company_name: `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || user.email?.split('@')[0] || 'Şirket',
            contact_email: user.email
          }])
        
        if (error && error.code !== '23505') { // 23505 = duplicate key error (already exists)
          throw error
        }
      }

      toast.success(`${userType === 'candidate' ? 'İş arayan' : 'İşveren'} hesabınız oluşturuldu!`)
      onClose()
      
    } catch (error) {
      console.error('User type selection error:', error)
      toast.error('Hesap tipi seçilirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => !loading && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            <div className="flex items-center justify-center mb-3">
              <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
              <span className="text-xl font-bold text-gray-900">Kayıt Başarılı!</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-4">
              Hoş geldiniz! Lütfen hesap tipinizi seçin:
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Button
              onClick={() => handleUserTypeSelect('candidate')}
              variant="outline"
              disabled={loading}
              className="h-20 flex-col space-y-2 hover:bg-blue-50 hover:border-blue-300 group transition-all"
            >
              <User className="h-8 w-8 text-blue-600 group-hover:text-blue-700" />
              <div className="text-center">
                <div className="font-semibold text-gray-900">İş Arayan</div>
                <div className="text-sm text-gray-500">Kariyer fırsatları keşfedin</div>
              </div>
              {loading && selectedType === 'candidate' && (
                <div className="absolute inset-0 flex items-center justify-center bg-blue-50 bg-opacity-75 rounded">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              )}
            </Button>
            
            <Button
              onClick={() => handleUserTypeSelect('company')}
              variant="outline"
              disabled={loading}
              className="h-20 flex-col space-y-2 hover:bg-green-50 hover:border-green-300 group transition-all"
            >
              <Building className="h-8 w-8 text-green-600 group-hover:text-green-700" />
              <div className="text-center">
                <div className="font-semibold text-gray-900">İşveren</div>
                <div className="text-sm text-gray-500">Yetenekleri keşfedin, ekip kurun</div>
              </div>
              {loading && selectedType === 'company' && (
                <div className="absolute inset-0 flex items-center justify-center bg-green-50 bg-opacity-75 rounded">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                </div>
              )}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Bu seçimi daha sonra profil ayarlarınızdan değiştirebilirsiniz.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}