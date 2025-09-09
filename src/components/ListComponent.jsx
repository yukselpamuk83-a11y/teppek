import { memo, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
// import { getDistance } from '../utils/distance' // MESAFE HESAPLAMASI KALDIRILDI
import logger from '../utils/logger.js'

// Action SVG Icons
const EditIcon = () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
)

const DeleteIcon = () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
)

const ReportIcon = () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
)

const ContactIcon = () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
)

// Virtual row component - her satır için optimize edilmiş component (memoized)
const VirtualJobRow = memo(({ index, style, data }) => {
    const { t } = useTranslation()
    const { items, userLocation, onRowClick, isSubscribed, onPremiumClick, onEdit, onDelete, onReport } = data
    const item = items[index]
    
    // Mesafe hesaplamasi kaldırıldı - performans optimizasyonu
    // const distance = 0 // Kullanılmıyor artık
    // Tüm veriyi açık göster - premium kaldırıldı
    const canView = true
    
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
                        {item.type === 'job' ? t('list.job') : t('list.candidate')}
                    </span>
                    {item.isSponsored && (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold text-yellow-800 bg-yellow-200">
                            {t('list.sponsored')}
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
                    {item.company || item.name || t('list.noCompanyInfo')}
                </p>
                {item.description?.text && (
                  <p className="text-xs text-gray-500 mt-1 font-normal">
                    {item.description.text.substring(0, 100)}...
                  </p>
                )}
            </div>
            
            {/* Uzaklık kolonu kaldırıldı - performans optimizasyonu */}
            
            {/* Konum kolonu - genişletildi */}
            <div className="w-40 px-3 py-3 flex-shrink-0">
                <span className="text-xs text-gray-600 truncate block">
                    {item.address}
                </span>
            </div>
            
            {/* Aksiyonlar kolonu - genişletildi */}
            <div className="w-36 px-3 py-3 flex-shrink-0">
                <div className="flex gap-1 items-center">
                    {/* Contact button for jobs with contact info */}
                    {item.type === 'job' && !item.isOwner && canView && item.contact && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                window.location.href = `mailto:${item.contact}`
                            }}
                            className="p-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                            title={t('list.contact')}
                        >
                            <ContactIcon />
                        </button>
                    )}
                    
                    {/* Owner actions - Edit & Delete */}
                    {item.isOwner && (
                        <>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onEdit && onEdit(item)
                                }}
                                className="p-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                title="Edit"
                            >
                                <EditIcon />
                            </button>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onDelete && onDelete(item)
                                }}
                                className="p-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                title="Delete"
                            >
                                <DeleteIcon />
                            </button>
                        </>
                    )}
                    
                    {/* Report button for all non-owner items */}
                    {!item.isOwner && (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation()
                                onReport && onReport(item)
                            }}
                            className="p-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                            title="Report"
                        >
                            <ReportIcon />
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
})

// Ana List componenti - Sayfalama ile optimize edildi
function ListComponent({ data, onRowClick, isSubscribed, userLocation, onPremiumClick }) {
    const { t } = useTranslation()
    
    // Action handlers
    const handleEdit = (item) => {
        logger.debug('🖊️ Edit item:', item.id)
        // TODO: Open edit modal/form
        alert(`Edit ${item.title}`) // Temporary placeholder
    }
    
    const handleDelete = (item) => {
        logger.debug('🗑️ Delete item:', item.id)
        if (window.confirm(`Are you sure you want to delete "${item.title}"?`)) {
            // TODO: Call delete API
            alert(`Delete ${item.title}`) // Temporary placeholder
        }
    }
    
    const handleReport = (item) => {
        logger.debug('⚠️ Report item:', item.id)
        if (window.confirm(`Report "${item.title}" for inappropriate content?`)) {
            // TODO: Call report API
            alert(`Reported ${item.title}`) // Temporary placeholder
        }
    }
    
    if (data.length === 0) {
        return (
            <div className="flex-grow flex items-center justify-center">
                <p className="text-center text-gray-500">{t('messages.noResults')}</p>
            </div>
        )
    }

    logger.debug(`📋 ListComponent render: ${data.length} kayıt gösterilecek`)

    return (
        <div className="flex-grow flex flex-col bg-white">
            {/* Tablo header - sabit */}
            <div className="border-b bg-gray-100 flex items-center text-sm font-semibold text-gray-600">
                <div className="w-24 px-3 py-3 flex-shrink-0">{t('list.type')}</div>
                <div className="flex-grow px-3 py-3 min-w-0">{t('list.titlePosition')}</div>
                {/* Mesafe kolonu kaldırıldı */}
                <div className="w-40 px-3 py-3 flex-shrink-0">{t('list.location')}</div>
                <div className="w-36 px-3 py-3 flex-shrink-0">{t('list.actions')}</div>
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
                            onEdit: handleEdit,
                            onDelete: handleDelete,
                            onReport: handleReport
                        }}
                    />
                ))}
            </div>
            
            {/* İstatistik footer */}
            <div className="border-t bg-gray-50 px-4 py-2 text-xs text-gray-600">
                {t('list.showingResults', { count: data.length.toLocaleString() })}
            </div>
            
        </div>
    )
}

export default memo(ListComponent)