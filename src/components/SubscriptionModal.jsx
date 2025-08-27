import { Crown, X } from 'lucide-react'
import { toast } from '../lib/utils'

function SubscriptionModal({ onClose }) {
    
    const handleSubscribe = () => {
        // Development modunda simüle et
        toast.success('Geliştirme modunda tüm özellikler açık! 🚀')
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[10000]">
            <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-md mx-4">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
                
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Crown className="w-8 h-8 text-white" />
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Premium Özellik</h2>
                <p className="text-gray-600 mb-6">
                    50 km dışındaki iş fırsatlarına erişmek ve tüm detayları görmek için premium'a geçin.
                </p>
                
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg mb-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Premium Avantajları:</h3>
                    <ul className="text-sm text-gray-600 text-left space-y-1">
                        <li>• Sınırsız mesafe erişimi</li>
                        <li>• Tüm ilan detayları</li>
                        <li>• Öncelikli destek</li>
                        <li>• Gelişmiş filtreler</li>
                    </ul>
                </div>
                
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={handleSubscribe}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
                    >
                        Premium'a Geç - ₺29/ay
                    </button>
                    <button 
                        onClick={onClose} 
                        className="w-full bg-gray-100 text-gray-700 font-medium py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Şimdilik Devam Et
                    </button>
                </div>
            </div>
        </div>
    )
}

export default SubscriptionModal