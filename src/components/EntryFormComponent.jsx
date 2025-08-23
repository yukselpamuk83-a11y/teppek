import { useState } from 'react'

function EntryFormComponent({ onAddEntry, userLocation }) {
    const [entryType, setEntryType] = useState('job')
    const [title, setTitle] = useState('')
    const [companyOrName, setCompanyOrName] = useState('')
    const [minSalary, setMinSalary] = useState('')
    const [maxSalary, setMaxSalary] = useState('')
    const [description, setDescription] = useState('')
    const [contactInfo, setContactInfo] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        // Koordinatları gerçek adrese çevir
        let address = `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLocation.lat}&lon=${userLocation.lng}&zoom=18&addressdetails=1`)
            const data = await response.json()
            if (data.display_name) {
                // Şehir, ülke formatında kısa adres
                const parts = data.display_name.split(',').map(p => p.trim())
                address = parts.length > 2 ? 
                    `${parts[0]}, ${parts[parts.length-1]}` : 
                    data.display_name.substring(0, 50)
            }
        } catch (error) {
            console.log('Adres çekilemedi, koordinat kullanılıyor')
        }
        
        const newEntry = {
            id: `manual-${Date.now()}`,
            type: entryType,
            title,
            description,
            location: { lat: userLocation.lat, lng: userLocation.lng }, 
            address: address,
            source: 'manual', // Manuel eklenen
            postedDate: new Date().toISOString(),
            // Popup için ortak alanlar
            applyUrl: null, // Manuel ilanlarda başvuru linki yok
            contact: contactInfo, // Sadece manuel ilanlarda var
        }
        if (entryType === 'job') {
            newEntry.company = companyOrName
            newEntry.salary_min = parseInt(minSalary)
            newEntry.salary_max = parseInt(maxSalary)
            // Adzuna ile uyumlu ek alanlar
            newEntry.salary = {
                min: parseInt(minSalary),
                max: parseInt(maxSalary),
                currency: 'TRY',
                period: 'Aylık'
            }
            newEntry.employmentType = 'Tam zamanlı'
            newEntry.category = 'Genel'
        } else {
            newEntry.name = companyOrName
        }
        onAddEntry(newEntry)
        setTitle(''); setCompanyOrName(''); setMinSalary(''); setMaxSalary(''); setDescription(''); setContactInfo('')
    }

    return (
        <div className="flex flex-col h-full">
            <div className="grid grid-cols-2 gap-2 mb-4">
                <button onClick={() => setEntryType('job')} className={`p-3 rounded-lg font-semibold ${entryType === 'job' ? 'bg-ilan text-white' : 'bg-gray-200'}`}>İş İlanı</button>
                <button onClick={() => setEntryType('cv')} className={`p-3 rounded-lg font-semibold ${entryType === 'cv' ? 'bg-cv text-white' : 'bg-gray-200'}`}>Özgeçmiş</button>
            </div>
            <form onSubmit={handleSubmit} className="flex-grow flex flex-col">
                <div className="space-y-3">
                    {entryType === 'job' ? (
                        <>
                            <input type="text" placeholder="İlan Başlığı (örn: Yazılım Geliştiricisi)" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border rounded-md" required />
                            <textarea placeholder="Açıklama" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 border rounded-md h-24" required></textarea>
                            <div className="flex gap-2">
                                <input type="number" placeholder="Min Maaş" value={minSalary} onChange={e => setMinSalary(e.target.value)} className="w-1/2 p-2 border rounded-md" required />
                                <input type="number" placeholder="Max Maaş" value={maxSalary} onChange={e => setMaxSalary(e.target.value)} className="w-1/2 p-2 border rounded-md" required />
                            </div>
                            <input type="text" placeholder="Şirket Adı" value={companyOrName} onChange={e => setCompanyOrName(e.target.value)} className="w-full p-2 border rounded-md" required />
                            <input type="text" placeholder="İletişim Bilgileri (E-posta veya Telefon)" value={contactInfo} onChange={e => setContactInfo(e.target.value)} className="w-full p-2 border rounded-md" required />
                        </>
                    ) : (
                        <>
                            <input type="text" placeholder="Ad Soyad" value={companyOrName} onChange={e => setCompanyOrName(e.target.value)} className="w-full p-2 border rounded-md" required />
                            <input type="text" placeholder="Ünvan (örn: Proje Yöneticisi)" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border rounded-md" required />
                            <textarea placeholder="Açıklama / Yetenek Özeti" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 border rounded-md h-40" required></textarea>
                            <input type="text" placeholder="İletişim Bilgileri (E-posta veya Telefon)" value={contactInfo} onChange={e => setContactInfo(e.target.value)} className="w-full p-2 border rounded-md" required />
                        </>
                    )}
                </div>
                <button type="submit" className="w-full p-3 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 mt-auto">Ekle</button>
            </form>
        </div>
    )
}

export default EntryFormComponent