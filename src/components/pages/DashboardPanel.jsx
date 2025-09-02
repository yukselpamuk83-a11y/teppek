import React from 'react'
import { Button } from '../ui/Button'
import { Briefcase, User, ArrowLeft, Plus } from 'lucide-react'

export function DashboardPanel({ onBackToMap }) {

  const handleJobCreation = () => {
    // Şimdilik alert, sonra form modal açacağız
    alert('İş İlanı Oluşturma formu yakında açılacak!')
  }

  const handleCVCreation = () => {
    // Şimdilik alert, sonra form modal açacağız  
    alert('CV Oluşturma formu yakında açılacak!')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button
              variant="outline" 
              size="sm"
              onClick={() => onBackToMap && onBackToMap()}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Ana Sayfa
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Panel</h1>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* İş İlanı Oluştur */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6">
              <div className="flex items-center text-white">
                <Briefcase className="w-10 h-10 mr-4" />
                <h2 className="text-2xl font-bold">İş İlanı Ver</h2>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-6">
                Şirketiniz için yetenekli adayları bulun. İş ilanınızı yayınlayın ve binlerce iş arayanla buluşun.
              </p>
              <ul className="text-sm text-gray-500 mb-6 space-y-2">
                <li>• Detaylı iş tanımı oluşturun</li>
                <li>• Harita üzerinde konum belirleyin</li>
                <li>• Uygun adaylarla hızlıca eşleşin</li>
              </ul>
              <Button 
                onClick={handleJobCreation}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 text-lg"
              >
                İş İlanı Oluştur
              </Button>
            </div>
          </div>

          {/* CV Oluştur */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-6">
              <div className="flex items-center text-white">
                <User className="w-10 h-10 mr-4" />
                <h2 className="text-2xl font-bold">CV Oluştur</h2>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-6">
                Profesyonel CV'nizi oluşturun ve işverenlerle buluşun. Deneyimlerinizi ve becerilerinizi öne çıkarın.
              </p>
              <ul className="text-sm text-gray-500 mb-6 space-y-2">
                <li>• Kişisel bilgiler ve iletişim</li>
                <li>• Zaman çizelgesi ile deneyim</li>
                <li>• Beceriler ve tercihler</li>
              </ul>
              <Button 
                onClick={handleCVCreation}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 text-lg"
              >
                CV Oluştur
              </Button>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            İş ilanı veya CV oluşturduktan sonra harita üzerinde görünür olacak ve eşleşmeler başlayacak.
          </p>
        </div>
      </div>
    </div>
  )
}