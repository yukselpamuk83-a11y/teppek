import { useState, useEffect, useMemo } from 'react'
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
    
    // Auth states
    const [user, setUser] = useState(null)
    const [userProfile, setUserProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    
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

    // API'den veri çek
    useEffect(() => {
        if (!userLocation || !userLocation.lat || !userLocation.lng) {
            return // Konum bilgisi yoksa bekleme
        }
        
        const fetchListings = async () => {
            try {
                console.log('🌍 Database\'den iş ilanları yükleniyor...')
                
                // Database'den iş ilanlarını çek - Environment variables eklendi
                const response = await fetch('/api/get-jobs?limit=100000&page=1')
                const result = await response.json()
                
                if (result.success && result.jobs && result.jobs.length > 0) {
                    console.log(`✅ ${result.jobs.length} adet iş ilanı yüklendi!`)
                    console.log(`📊 Database İstatistikleri:`, result.stats)
                    console.log(`🌍 Toplam: ${result.stats.total_jobs} ilan`)
                    console.log(`📄 Sayfa: ${result.stats.current_page}/${result.stats.total_pages}`)
                    
                    // Database mapping - API ve Manuel ilanları ayır
                    const formattedJobs = result.jobs.map(job => ({
                        id: `db-${job.id}`,
                        type: 'job',
                        title: job.title,
                        company: job.company || 'Şirket Belirtilmemiş',
                        location: {
                            lat: parseFloat(job.lat),
                            lng: parseFloat(job.lon)
                        },
                        address: `${job.city || ''}, ${job.country || ''}`.replace(/^,\s*|,\s*$/g, ''),
                        salary_min: job.salary_min,
                        salary_max: job.salary_max,
                        currency: job.currency,
                        // İlan türüne göre iletişim/başvuru
                        applyUrl: job.source === 'manual' ? null : job.url,  // API ilanlarında başvuru linki
                        contact: job.source === 'manual' ? job.contact : null, // Manuel ilanlarda iletişim
                        source: job.source || 'unknown',
                        postedDate: job.created_at
                    })).filter(job => job.location.lat && job.location.lng)
                    
                    console.log(`🗺️ Haritada gösterilecek: ${formattedJobs.length} ilan`)
                    
                    // Ülkelere göre dağılım
                    const countryStats = {}
                    formattedJobs.forEach(job => {
                        const country = job.address.split(',').pop().trim()
                        countryStats[country] = (countryStats[country] || 0) + 1
                    })
                    console.log(`🌍 Ülke dağılımı:`, countryStats)
                    
                    // Verileri set et
                    setData(prevData => [...prevData, ...formattedJobs])
                } else {
                    console.log('⚠️ Database\'de henüz veri yok. Önce /api/load-data çağırın.')
                }
            } catch (error) {
                console.error('Database API hatası:', error)
                console.log('💡 Database bağlantısı kurulamadı. Supabase ayarlarını kontrol edin.')
            }
        }
        
        fetchListings()
    }, [userLocation])

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768)
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])
    
    const processedData = useMemo(() => {
        if (!userLocation) return []

        const filtered = data.filter(item => {
            const typeMatch = activeFilters.type === 'all' || item.type === activeFilters.type
            const keywordMatch = activeFilters.keyword === '' || 
                                 item.title.toLowerCase().includes(activeFilters.keyword.toLowerCase()) ||
                                 (item.company && item.company.toLowerCase().includes(activeFilters.keyword.toLowerCase())) ||
                                 (item.name && item.name.toLowerCase().includes(activeFilters.keyword.toLowerCase()))
            return typeMatch && keywordMatch
        })
        
        const sorted = filtered.sort((a, b) => {
            if (a.isSponsored && !b.isSponsored) return -1
            if (!a.isSponsored && b.isSponsored) return 1
            
            const distA = getDistance(userLocation.lat, userLocation.lng, a.location.lat, a.location.lng)
            const distB = getDistance(userLocation.lat, userLocation.lng, b.location.lat, b.location.lng)
            const canViewA = isSubscribed || distA <= 50
            const canViewB = isSubscribed || distB <= 50
            
            if (canViewA && !canViewB) return -1
            if (!canViewA && canViewB) return 1
            
            return distA - distB
        })

        return sorted
    }, [data, activeFilters, isSubscribed, userLocation])
    
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        return processedData.slice(startIndex, endIndex)
    }, [currentPage, processedData])
    
    const totalPages = Math.ceil(processedData.length / itemsPerPage)

    const handleAddEntry = (entry) => {
        setData(prevData => [{ ...entry, id: Date.now(), isOwner: true, isSponsored: false }, ...prevData])
        if(isMobile) setIsMobileFormOpen(false)
    }

    const handleRowClick = (location) => {
        setSelectedLocation(location)
        if(isMobile) setIsMobilePanelOpen(false)
    }

    const handleFilterChange = (filters) => {
        if (filters.clearData) {
            // Temiz veri ile data'yı güncelle
            const formattedJobs = filters.clearData.map(job => ({
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
            
            setData(formattedJobs)
            setActiveFilters({ type: 'all', keyword: '' })
        } else {
            setActiveFilters(filters)
        }
    }

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
                        onPremiumClick={() => setShowSubscriptionModal(true)} 
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
                            onPremiumClick={() => setShowSubscriptionModal(true)} 
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
                <div className="h-[calc(100vh-60px)] w-full flex flex-col">
                    <div className="flex h-2/3">
                        <div className="w-[35%] h-full p-4 bg-gray-50 overflow-y-auto">
                            <EntryFormComponent onAddEntry={handleAddEntry} userLocation={userLocation} />
                        </div>
                        <div className="w-[65%] h-full">
                            <MapComponent 
                                data={processedData} 
                                selectedLocation={selectedLocation} 
                                isSubscribed={isSubscribed} 
                                userLocation={userLocation} 
                                onPremiumClick={() => setShowSubscriptionModal(true)} 
                            />
                        </div>
                    </div>
                    <div className="h-1/3 flex flex-col p-4 border-t bg-white">
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
                            onPremiumClick={() => setShowSubscriptionModal(true)} 
                        />
                        <PaginationComponent 
                            currentPage={currentPage} 
                            totalPages={totalPages} 
                            onPageChange={setCurrentPage} 
                        />
                    </div>
                </div>
            )}
        </>
    )
}

export default App