import { useState, memo, useCallback } from 'react'

const FilterComponent = memo(({ onFilterChange, setCurrentPage, isSubscribed, onSubscribeToggle }) => {
    const [localKeyword, setLocalKeyword] = useState('')
    const [localFilterType, setLocalFilterType] = useState('all')

    const handleFilter = useCallback(() => {
        console.log('🔍 Frontend filtre uygulanıyor...')
        onFilterChange({ type: localFilterType, keyword: localKeyword })
        setCurrentPage(1)
    }, [localFilterType, localKeyword, onFilterChange, setCurrentPage])

    const handleClear = useCallback(() => {
        console.log('🧹 TEMIZLE - Cache\'den ilk veri yükleniyor')
        setLocalKeyword('')
        setLocalFilterType('all')
        setCurrentPage(1)
        
        // İlk açılışta gelen DB verisini restore et
        onFilterChange({ type: 'all', keyword: '', restoreInitialData: true })
    }, [onFilterChange, setCurrentPage])

    return (
        <div className="mb-4">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="grid grid-cols-3 gap-2 flex-shrink-0">
                    <button onClick={() => { setLocalFilterType('all'); onFilterChange({ type: 'all', keyword: localKeyword }) }} className={`p-3 rounded-lg font-semibold text-sm ${localFilterType === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-200'}`}>Tümü</button>
                    <button onClick={() => { setLocalFilterType('job'); onFilterChange({ type: 'job', keyword: localKeyword }) }} className={`p-3 rounded-lg font-semibold text-sm ${localFilterType === 'job' ? 'bg-ilan text-white' : 'bg-gray-200'}`}>İş İlanları</button>
                    <button onClick={() => { setLocalFilterType('cv'); onFilterChange({ type: 'cv', keyword: localKeyword }) }} className={`p-3 rounded-lg font-semibold text-sm ${localFilterType === 'cv' ? 'bg-cv text-white' : 'bg-gray-200'}`}>Adaylar</button>
                </div>
                <div className="flex-grow flex gap-2">
                    <div className="relative flex-grow">
                        <input type="text" placeholder="Anahtar kelime ile ara..." value={localKeyword} onChange={e => setLocalKeyword(e.target.value)} className="w-full h-full p-3 pl-10 border rounded-lg" />
                        <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    </div>
                    <button onClick={handleFilter} className="bg-blue-600 text-white font-semibold px-4 rounded-lg hover:bg-blue-700">Filtrele</button>
                    <button onClick={handleClear} className="bg-gray-200 text-gray-700 font-semibold px-4 rounded-lg hover:bg-gray-300">Temizle</button>
                </div>
                {/* Abonelik Test Butonu */}
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={isSubscribed} onChange={onSubscribeToggle} className="w-5 h-5" />
                    <span className="text-sm font-medium">Abone Olundu</span>
                </label>
            </div>
        </div>
    )
})

export default FilterComponent