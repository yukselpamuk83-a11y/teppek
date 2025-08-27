import { memo, useState } from 'react'
import { getDistance } from '../utils/distance'
import { JobApplicationModal } from './jobs/JobApplicationModal'

// Virtual row component - her satır için optimize edilmiş component (memoized)
const VirtualJobRow = memo(({ index, style, data }) => {
    const { items, userLocation, onRowClick, isSubscribed, onPremiumClick, onJobApply } = data
    const item = items[index]
    
    const distance = getDistance(userLocation.lat, userLocation.lng, item.location.lat, item.location.lng)
    const isPremiumContent = distance > 50
    // Development modunda tüm ilanları göster
    const isDevelopment = import.meta.env.DEV
    const canView = isDevelopment || isSubscribed || !isPremiumContent
    
    return (
        <div 
            style={style} 
            className={`border-b bg-white flex items-center hover:bg-gray-50 transition-colors ${
                canView ? 'cursor-pointer' : 'opacity-70'
            } ${item.isSponsored ? 'bg-yellow-50' : ''}`}
            onClick={() => canView ? onRowClick(item.location) : onPremiumClick()}
        >
            {/* Tür kolonu */}
            <div className="w-24 px-3 py-3 flex-shrink-0">
                <div className="flex flex-col gap-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${
                        item.type === 'job' ? 'bg-ilan' : 'bg-cv'
                    }`}>
                        {item.type === 'job' ? 'İLAN' : 'Aday'}
                    </span>
                    {item.isSponsored && (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold text-yellow-800 bg-yellow-200">
                            Sponsorlu
                        </span>
                    )}
                </div>
            </div>
            
            {/* Başlık/Şirket kolonu */}
            <div className="flex-grow px-3 py-3 min-w-0">
                <p className="font-bold text-sm truncate">{item.title}</p>
                <p className={`text-gray-600 text-xs mt-1 truncate ${
                    !canView && 'blur-sm'
                }`}>
                    {item.company || item.name || 'Şirket bilgisi mevcut değil'}
                </p>
            </div>
            
            {/* Uzaklık kolonu */}
            <div className="w-20 px-3 py-3 text-right flex-shrink-0">
                <span className={`text-sm font-medium text-gray-700 ${
                    !canView && 'blur-sm'
                }`}>
                    {distance.toFixed(1)} km
                </span>
            </div>
            
            {/* Konum kolonu */}
            <div className="w-32 px-3 py-3 flex-shrink-0">
                <span className="text-xs text-gray-600 truncate block">
                    {item.address}
                </span>
            </div>
            
            {/* Aksiyonlar kolonu */}
            <div className="w-32 px-3 py-3 flex-shrink-0">
                <div className="flex gap-1 text-xs">
                    {item.type === 'job' && !item.isOwner && canView && (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation()
                                onJobApply(item)
                            }}
                            className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-medium"
                        >
                            Başvur
                        </button>
                    )}
                    {item.isOwner && (
                        <>
                            <button className="px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-xs">
                                ✏️
                            </button>
                            <button className="px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 text-xs">
                                🗑️
                            </button>
                        </>
                    )}
                    <button className="px-2 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-xs">
                        ⚠️
                    </button>
                </div>
            </div>
        </div>
    )
})

// Ana List componenti - Sayfalama ile optimize edildi
function ListComponent({ data, onRowClick, isSubscribed, userLocation, onPremiumClick }) {
    const [selectedJob, setSelectedJob] = useState(null)
    const [showApplicationModal, setShowApplicationModal] = useState(false)

    const handleJobApply = (job) => {
        setSelectedJob(job)
        setShowApplicationModal(true)
    }

    const closeApplicationModal = () => {
        setShowApplicationModal(false)
        setSelectedJob(null)
    }
    if (data.length === 0) {
        return (
            <div className="flex-grow flex items-center justify-center">
                <p className="text-center text-gray-500">Filtrelerinize uygun sonuç bulunamadı.</p>
            </div>
        )
    }

    console.log(`📋 ListComponent render: ${data.length} kayıt gösterilecek`)

    return (
        <div className="flex-grow flex flex-col bg-white">
            {/* Tablo header - sabit */}
            <div className="border-b bg-gray-100 flex items-center text-sm font-semibold text-gray-600">
                <div className="w-24 px-3 py-3 flex-shrink-0">Tür</div>
                <div className="flex-grow px-3 py-3 min-w-0">Başlık / Ünvan</div>
                <div className="w-20 px-3 py-3 text-right flex-shrink-0">Uzaklık</div>
                <div className="w-32 px-3 py-3 flex-shrink-0">Konum</div>
                <div className="w-32 px-3 py-3 flex-shrink-0">Aksiyonlar</div>
            </div>
            
            {/* Normal list - Ana sayfa scroll kullan */}
            <div className="flex-grow">
                {data.map((item, index) => (
                    <VirtualJobRow
                        key={item.id}
                        index={index}
                        style={{}} // Boş style - virtual scrolling yok
                        data={{
                            items: data,
                            userLocation,
                            onRowClick,
                            isSubscribed,
                            onPremiumClick,
                            onJobApply: handleJobApply
                        }}
                    />
                ))}
            </div>
            
            {/* İstatistik footer */}
            <div className="border-t bg-gray-50 px-4 py-2 text-xs text-gray-600">
                Toplam {data.length.toLocaleString()} ilan gösteriliyor
            </div>
            
            {/* Job Application Modal */}
            <JobApplicationModal 
                job={selectedJob}
                isOpen={showApplicationModal}
                onClose={closeApplicationModal}
            />
        </div>
    )
}

export default memo(ListComponent)