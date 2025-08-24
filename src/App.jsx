import { useState, useEffect, useMemo, useCallback } from 'react'
import HeaderComponent from './components/HeaderComponent'
import LoginModal from './components/LoginModal'
import MapComponent from './components/MapComponent'
import FilterComponent from './components/FilterComponent'
import ListComponent from './components/ListComponent'
import PaginationComponent from './components/PaginationComponent'
import EntryFormComponent from './components/EntryFormComponent'
import SubscriptionModal from './components/SubscriptionModal'
import { getDistance } from './utils/distance'

// Başlangıç verileri
const initialData = []

function App() {
    const [data, setData] = useState(initialData)
    const [activeFilters, setActiveFilters] = useState({ type: 'all', keyword: '' })
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    const [selectedLocation, setSelectedLocation] = useState(null)
    const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false)
    const [isMobileFormOpen, setIsMobileFormOpen] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
    const [showFirmaLogin, setShowFirmaLogin] = useState(false)
    const [showAdayLogin, setShowAdayLogin] = useState(false)
    
    const itemsPerPage = 50
    const [userLocation, setUserLocation] = useState(null)

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                })
            },
            (error) => {
                console.error("Konum alınamadı:", error)
                setUserLocation({ lat: 41.01, lng: 28.97 })
            }
        )
    }, [])

    // Ortak job mapping fonksiyonu
    const mapJobData = useCallback((jobs) => {
        return jobs.map(job => ({
            id: `db-${job.id}`,
            type: 'job',
            title: job.title,
            company: job.company || 'Şirket Belirtilmemiş',
            name: job.company,
            location: {
                lat: parseFloat(job.lat),
                lng: parseFloat(job.lon)
            },
            address: `${job.city || ''}, ${job.country || ''}`.replace(/^,\s*|,\s*$/g, ''),
            salary_min: job.salary_min,
            salary_max: job.salary_max,
            currency: job.currency,
            applyUrl: job.source === 'manual' ? null : job.url,
            contact: job.source === 'manual' ? job.contact : null,
            source: job.source || 'unknown',
            postedDate: job.created_at
        })).filter(job => job.location.lat && job.location.lng)
    }, [])

    // API'den veri çek (tek seferlik)
    useEffect(() => {
        if (!userLocation?.lat || !userLocation?.lng) return
        
        const fetchListings = async () => {
            try {
                console.log('🌍 Database\'den iş ilanları yükleniyor...')
                
                const response = await fetch('/api/get-jobs?limit=100000&page=1')
                const result = await response.json()
                
                if (result.success && result.jobs?.length > 0) {
                    console.log(`✅ ${result.jobs.length} adet iş ilanı yüklendi!`)
                    console.log(`📊 Database İstatistikleri:`, result.stats)
                    
                    const formattedJobs = mapJobData(result.jobs)
                    
                    console.log(`🗺️ Haritada gösterilecek: ${formattedJobs.length} ilan`)
                    
                    // Ülkelere göre dağılım
                    const countryStats = {}
                    formattedJobs.forEach(job => {
                        const country = job.address.split(',').pop().trim()
                        countryStats[country] = (countryStats[country] || 0) + 1
                    })
                    console.log(`🌍 Ülke dağılımı:`, countryStats)
                    
                    // TEK SEFERLİK SET - concat değil replace
                    setData(formattedJobs)
                } else {
                    console.log('⚠️ Database\'de henüz veri yok.')
                    setData([])
                }
            } catch (error) {
                console.error('Database API hatası:', error)
                setData([])
            }
        }
        
        fetchListings()
    }, [userLocation, mapJobData])

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768)
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])
    
    const processedData = useMemo(() => {
        if (!userLocation || data.length === 0) return []

        const startTime = performance.now()
        console.log('🔄 Veri işleme başlıyor:', { 
            totalData: data.length, 
            filters: activeFilters, 
            isSubscribed 
        })
        
        // Keyword filtrelemesi için sadece gerekli olduğunda toLowerCase yap
        const lowerKeyword = activeFilters.keyword ? activeFilters.keyword.toLowerCase() : ''
        
        const filtered = data.filter(item => {
            // Type filter - daha hızlı karşılaştırma
            if (activeFilters.type !== 'all' && item.type !== activeFilters.type) return false
            
            // Keyword filter - sadece keyword varsa kontrol et
            if (lowerKeyword) {
                const titleMatch = item.title?.toLowerCase().includes(lowerKeyword)
                const companyMatch = item.company?.toLowerCase().includes(lowerKeyword)
                const nameMatch = item.name?.toLowerCase().includes(lowerKeyword)
                
                if (!titleMatch && !companyMatch && !nameMatch) return false
            }
            
            return true
        })
        
        // Mesafe hesaplamalarını önbelleğe al
        const itemsWithDistance = filtered.map(item => {
            const distance = getDistance(userLocation.lat, userLocation.lng, item.location.lat, item.location.lng)
            return {
                ...item,
                distance,
                canView: isSubscribed || distance <= 50
            }
        })
        
        // Sıralama - önce sponsorlu, sonra mesafe
        itemsWithDistance.sort((a, b) => {
            // Sponsorlu önceliği
            if (a.isSponsored && !b.isSponsored) return -1
            if (!a.isSponsored && b.isSponsored) return 1
            
            // Görünebilirlik önceliği
            if (a.canView && !b.canView) return -1
            if (!a.canView && b.canView) return 1
            
            // Mesafe sıralaması
            return a.distance - b.distance
        })

        const endTime = performance.now()
        console.log(`⚡ İşlem tamamlandı: ${itemsWithDistance.length} sonuç (${(endTime - startTime).toFixed(2)}ms)`)
        return itemsWithDistance
    }, [data, activeFilters, isSubscribed, userLocation])
    
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return processedData.slice(startIndex, endIndex)
    }, [currentPage, processedData])
    
    const totalPages = Math.ceil(processedData.length / itemsPerPage)

    const handleAddEntry = useCallback((entry) => {
        const newEntry = { ...entry, id: Date.now(), isOwner: true, isSponsored: false }
        setData(prevData => [newEntry, ...prevData])
        if(isMobile) setIsMobileFormOpen(false)
    }, [isMobile])

    const handleRowClick = useCallback((location) => {
        setSelectedLocation(location)
        if(isMobile) setIsMobilePanelOpen(false)
    }, [isMobile])

    const handleFilterChange = useCallback((filters) => {
        if (filters.clearData) {
            // Ortak mapping fonksiyonunu kullan
            const formattedJobs = mapJobData(filters.clearData)
            setData(formattedJobs)
            setActiveFilters({ type: 'all', keyword: '' })
        } else {
            // Sadece filtreleri güncelle - cache otomatik olarak devreye girecek
            setActiveFilters(filters)
        }
    }, [mapJobData])
    
    const handlePremiumClick = useCallback(() => setShowSubscriptionModal(true), [])

    if (!userLocation) {
        return (
            <div className="h-full w-full flex justify-center items-center bg-gray-100">
                <div className="text-center">
                    <i className="fa-solid fa-spinner fa-spin text-4xl text-blue-600"></i>
                    <p className="mt-4 text-gray-700">Konumunuz alınıyor...</p>
                </div>
            </div>
        )
    }

    return (
        <>
            {showSubscriptionModal && <SubscriptionModal onClose={() => setShowSubscriptionModal(false)} />}
            
            {/* Login Modals */}
            <LoginModal 
                isOpen={showFirmaLogin}
                onClose={() => setShowFirmaLogin(false)}
                userType="company"
                title="Firma Girişi"
                color="ilan"
            />
            <LoginModal 
                isOpen={showAdayLogin}
                onClose={() => setShowAdayLogin(false)}
                userType="individual"
                title="Aday Girişi"
                color="cv"
            />
            
            {/* Header Navigation */}
            <HeaderComponent 
                onFirmaLogin={() => setShowFirmaLogin(true)}
                onAdayLogin={() => setShowAdayLogin(true)}
            />
            
            {isMobile ? (
                // --- MOBİL GÖRÜNÜM ---
                <div className="h-[calc(100vh-60px)] w-full relative">
                    <MapComponent 
                        data={processedData} 
                        selectedLocation={selectedLocation} 
                        isSubscribed={isSubscribed} 
                        userLocation={userLocation} 
                        onPremiumClick={handlePremiumClick} 
                    />
                    
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] flex gap-4">
                        <button onClick={() => setIsMobilePanelOpen(true)} className="bg-white text-gray-800 font-bold py-3 px-6 rounded-full shadow-lg flex items-center gap-2">
                            <i className="fa-solid fa-list"></i> Filtrele & Listele
                        </button>
                    </div>
                    <div className="absolute top-4 right-4 z-[1000]">
                        <button onClick={() => setIsMobileFormOpen(true)} className="bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl">
                            <i className="fa-solid fa-plus"></i>
                        </button>
                    </div>

                    <div className={`absolute bottom-0 left-0 right-0 z-[1001] bg-white rounded-t-2xl shadow-2xl p-4 bottom-sheet ${isMobilePanelOpen ? 'transform translate-y-0' : 'transform translate-y-full'}`}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Sonuçlar</h2>
                            <button onClick={() => setIsMobilePanelOpen(false)} className="text-gray-500 text-2xl">&times;</button>
                        </div>
                        <FilterComponent 
                            onFilterChange={handleFilterChange}
                            setCurrentPage={setCurrentPage} 
                            isSubscribed={isSubscribed} 
                            onSubscribeToggle={() => setIsSubscribed(!isSubscribed)} 
                        />
                        <ListComponent 
                            data={paginatedData} 
                            onRowClick={handleRowClick} 
                            isSubscribed={isSubscribed} 
                            userLocation={userLocation} 
                            onPremiumClick={handlePremiumClick} 
                        />
                        <PaginationComponent 
                            currentPage={currentPage} 
                            totalPages={totalPages} 
                            onPageChange={setCurrentPage} 
                        />
                    </div>
                    
                    {isMobileFormOpen && (
                       <div className="absolute top-0 left-0 w-full h-full bg-gray-100 z-[1002] p-4 overflow-y-auto">
                            <div className="flex justify-end items-center mb-4">
                                <button onClick={() => setIsMobileFormOpen(false)} className="text-gray-500 text-2xl">&times;</button>
                            </div>
                            <EntryFormComponent onAddEntry={handleAddEntry} userLocation={userLocation} />
                       </div>
                    )}
                </div>
            ) : (
                // --- WEB/MASAÜSTÜ GÖRÜNÜM ---
                <div className="w-full">
                    {/* Harita ve Form - Normal scroll */}
                    <div className="flex h-[70vh] bg-white">
                        <div className="w-[35%] h-full p-4 bg-gray-50 flex flex-col">
                            <EntryFormComponent onAddEntry={handleAddEntry} userLocation={userLocation} />
                        </div>
                        <div className="w-[65%] h-full">
                            <MapComponent 
                                data={processedData} 
                                selectedLocation={selectedLocation} 
                                isSubscribed={isSubscribed} 
                                userLocation={userLocation} 
                                onPremiumClick={handlePremiumClick} 
                            />
                        </div>
                    </div>
                    
                    {/* Filter ve İlan Listesi */}
                    <div className="bg-white border-t">
                        <div className="p-4 bg-gray-50 border-b">
                            <FilterComponent 
                                onFilterChange={handleFilterChange}
                                setCurrentPage={setCurrentPage} 
                                isSubscribed={isSubscribed} 
                                onSubscribeToggle={() => setIsSubscribed(!isSubscribed)} 
                            />
                        </div>
                        
                        <div className="p-4">
                            <ListComponent 
                                data={paginatedData} 
                                onRowClick={handleRowClick} 
                                isSubscribed={isSubscribed} 
                                userLocation={userLocation} 
                                onPremiumClick={handlePremiumClick} 
                            />
                            <div className="mt-6 mb-8">
                                <PaginationComponent 
                                    currentPage={currentPage} 
                                    totalPages={totalPages} 
                                    onPageChange={setCurrentPage} 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default App