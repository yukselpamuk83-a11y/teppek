import { useState } from 'react'
import { useSimpleAuth } from '../hooks/useSimpleAuth.jsx'
import { toast } from '../stores/toastStore'

function EntryFormComponent({ onAddEntry, userLocation }) {
    const { user, isAuthenticated } = useSimpleAuth()
    const [entryType, setEntryType] = useState('job')
    const [title, setTitle] = useState('')
    const [companyOrName, setCompanyOrName] = useState('')
    const [minSalary, setMinSalary] = useState('')
    const [maxSalary, setMaxSalary] = useState('')
    const [description, setDescription] = useState('')
    const [contactInfo, setContactInfo] = useState('')
    const [skills, setSkills] = useState('')
    const [experienceYears, setExperienceYears] = useState('')
    const [remoteAvailable, setRemoteAvailable] = useState(false)

    // Kullanıcı tipi kontrolü
    const userType = user?.user_metadata?.user_type || 'job_seeker'
    const isEmployer = userType === 'employer' || userType === 'company'
    const isJobSeeker = userType === 'job_seeker' || userType === 'candidate'

    // Herkes hem iş ilanı hem de CV ekleyebilir
    const canDropCV = true
    
    // Default olarak işverenlerde job, çalışanlarda cv seçili olsun
    useState(() => {
        if (isEmployer) setEntryType('job')
        else if (isJobSeeker) setEntryType('cv')
    }, [userType])

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        // Giriş kontrolü kaldırıldı - herkes kullanabilir

        // Kullanıcı tipi kontrolü kaldırıldı - herkes CV bırakabilir
        
        // Koordinatları gerçek adrese çevir
        let address = `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
        let country = 'Turkey'
        let city = ''
        
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLocation.lat}&lon=${userLocation.lng}&zoom=18&addressdetails=1`)
            const data = await response.json()
            if (data.display_name) {
                // Şehir, ülke formatında kısa adres
                const parts = data.display_name.split(',').map(p => p.trim())
                address = parts.length > 2 ? 
                    `${parts[0]}, ${parts[parts.length-1]}` : 
                    data.display_name.substring(0, 50)
                    
                // Şehir ve ülke bilgilerini ayri
                city = data.address?.city || data.address?.town || data.address?.village || parts[0] || ''
                country = data.address?.country || 'Turkey'
            }
        } catch (error) {
            console.log('Adres çekilemedi, koordinat kullanılıyor')
        }
        
        if (entryType === 'job') {
            // İş ilanı için API çağrısı
            try {
                const response = await fetch('/api/create-job', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('supabase-auth-token')}`
                    },
                    body: JSON.stringify({
                        title,
                        company: companyOrName,
                        description,
                        lat: userLocation.lat,
                        lon: userLocation.lng,
                        country,
                        city,
                        contact: contactInfo,
                        salary_min: parseInt(minSalary) || null,
                        salary_max: parseInt(maxSalary) || null,
                        currency: 'TRY'
                    })
                })
                
                if (!response.ok) {
                    const error = await response.json()
                    throw new Error(error.error || 'API hatası')
                }
                
                const result = await response.json()
                console.log('✅ İş ilanı oluşturuldu:', result)
                toast.success('İş ilanı başarıyla eklendi!')
                
            } catch (error) {
                console.error('İş ilanı hatası:', error)
                toast.error('İş ilanı eklenirken hata oluştu: ' + error.message)
                return
            }
            
        } else {
            // CV için API çağrısı (yeni endpoint)
            try {
                const response = await fetch('/api/create-cv', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('supabase-auth-token')}`
                    },
                    body: JSON.stringify({
                        full_name: companyOrName,
                        title,
                        description,
                        lat: userLocation.lat,
                        lon: userLocation.lng,
                        country,
                        city,
                        contact: contactInfo,
                        skills: skills ? skills.split(',').map(s => s.trim()) : [],
                        experience_years: parseInt(experienceYears) || 0,
                        remote_available: remoteAvailable,
                        salary_expectation_min: parseInt(minSalary) || null,
                        salary_expectation_max: parseInt(maxSalary) || null
                    })
                })
                
                if (!response.ok) {
                    const error = await response.json()
                    throw new Error(error.error || 'API hatası')
                }
                
                const result = await response.json()
                console.log('✅ CV oluşturuldu:', result)
                toast.success('CV başarıyla eklendi!')
                
            } catch (error) {
                console.error('CV hatası:', error)
                toast.error('CV eklenirken hata oluştu: ' + error.message)
                return
            }
        }
        
        // Form temizle
        setTitle(''); setCompanyOrName(''); setMinSalary(''); setMaxSalary(''); 
        setDescription(''); setContactInfo(''); setSkills(''); setExperienceYears(''); 
        setRemoteAvailable(false)
    }

    // Form her zaman görünsün - giriş yapmadan da kullanılabilir

    return (
        <div className="flex flex-col h-full">
            {/* Kullanıcı tipine göre butonlar */}
            <div className="mb-4">
                {isEmployer ? (
                    // İşveren sadece iş ilanı verebilir
                    <div className="bg-blue-100 p-3 rounded-lg text-center">
                        <span className="text-blue-800 font-semibold">
                            🏢 İşveren Paneli - İş İlanı Ver
                        </span>
                    </div>
                ) : (
                    // Çalışan hem iş ilanı hem CV verebilir
                    <>
                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                onClick={() => setEntryType('job')} 
                                className={`p-3 rounded-lg font-semibold transition-colors ${
                                    entryType === 'job' 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                            >
                                💼 İş İlanı
                            </button>
                            <button 
                                onClick={() => setEntryType('cv')} 
                                className={`p-3 rounded-lg font-semibold transition-colors ${
                                    entryType === 'cv' 
                                        ? 'bg-green-600 text-white' 
                                        : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                            >
                                📱 CV Bırak
                            </button>
                        </div>
                        <div className="text-center text-sm text-gray-600 mt-2">
                            {entryType === 'job' 
                                ? '💼 Kendi iş ilanınızı payalaşın' 
                                : '📱 CV\'nizi haritaya bırakın, işverenler sizi bulsun'
                            }
                        </div>
                    </>
                )}
            </div>
            <form onSubmit={handleSubmit} className="flex-grow flex flex-col">
                <div className="space-y-3">
                    {entryType === 'job' ? (
                        // İş İlanı Formu
                        <>
                            <input 
                                type="text" 
                                placeholder="İlan Başlığı (örn: Yazılım Geliştiricisi)" 
                                value={title} 
                                onChange={e => setTitle(e.target.value)} 
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                required 
                            />
                            <input 
                                type="text" 
                                placeholder="Şirket Adı" 
                                value={companyOrName} 
                                onChange={e => setCompanyOrName(e.target.value)} 
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                required 
                            />
                            <textarea 
                                placeholder="Açıklama ve Şartlar" 
                                value={description} 
                                onChange={e => setDescription(e.target.value)} 
                                className="w-full p-3 border rounded-lg h-24 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                required
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <input 
                                    type="number" 
                                    placeholder="Min Maaş (TRY)" 
                                    value={minSalary} 
                                    onChange={e => setMinSalary(e.target.value)} 
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                />
                                <input 
                                    type="number" 
                                    placeholder="Max Maaş (TRY)" 
                                    value={maxSalary} 
                                    onChange={e => setMaxSalary(e.target.value)} 
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                />
                            </div>
                            <input 
                                type="text" 
                                placeholder="İletişim Bilgileri (E-posta veya Telefon)" 
                                value={contactInfo} 
                                onChange={e => setContactInfo(e.target.value)} 
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                required 
                            />
                        </>
                    ) : (
                        // CV Formu
                        <>
                            <input 
                                type="text" 
                                placeholder="Ad Soyad" 
                                value={companyOrName} 
                                onChange={e => setCompanyOrName(e.target.value)} 
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" 
                                required 
                            />
                            <input 
                                type="text" 
                                placeholder="Ünvan (örn: Frontend Developer)" 
                                value={title} 
                                onChange={e => setTitle(e.target.value)} 
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" 
                                required 
                            />
                            <textarea 
                                placeholder="Yetenek Özeti ve Deneyimleriniz" 
                                value={description} 
                                onChange={e => setDescription(e.target.value)} 
                                className="w-full p-3 border rounded-lg h-32 focus:ring-2 focus:ring-green-500 focus:border-green-500" 
                                required
                            />
                            <input 
                                type="text" 
                                placeholder="Yetenekler (virgülle ayırın: React, Node.js, Python)" 
                                value={skills} 
                                onChange={e => setSkills(e.target.value)} 
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" 
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <input 
                                    type="number" 
                                    placeholder="Deneyim (yıl)" 
                                    value={experienceYears} 
                                    onChange={e => setExperienceYears(e.target.value)} 
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" 
                                    min="0" 
                                    max="50"
                                />
                                <div className="flex items-center p-3 border rounded-lg">
                                    <input 
                                        type="checkbox" 
                                        id="remote" 
                                        checked={remoteAvailable} 
                                        onChange={e => setRemoteAvailable(e.target.checked)} 
                                        className="mr-2"
                                    />
                                    <label htmlFor="remote" className="text-sm">
                                        Uzaktan çalışmaya açık
                                    </label>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <input 
                                    type="number" 
                                    placeholder="Beklenen Min Maaş" 
                                    value={minSalary} 
                                    onChange={e => setMinSalary(e.target.value)} 
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" 
                                />
                                <input 
                                    type="number" 
                                    placeholder="Beklenen Max Maaş" 
                                    value={maxSalary} 
                                    onChange={e => setMaxSalary(e.target.value)} 
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" 
                                />
                            </div>
                            <input 
                                type="text" 
                                placeholder="İletişim Bilgileri (E-posta veya Telefon)" 
                                value={contactInfo} 
                                onChange={e => setContactInfo(e.target.value)} 
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" 
                                required 
                            />
                        </>
                    )}
                </div>
                <button 
                    type="submit" 
                    className={`w-full p-3 rounded-lg font-bold text-white mt-auto transition-colors ${
                        entryType === 'job' 
                            ? 'bg-blue-600 hover:bg-blue-700' 
                            : 'bg-green-600 hover:bg-green-700'
                    }`}
                >
                    {entryType === 'job' ? '💼 İlan Yayınla' : '📱 CV Bırak'}
                </button>
            </form>
        </div>
    )
}

export default EntryFormComponent