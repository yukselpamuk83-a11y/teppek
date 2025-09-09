import { useState, memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import logger from '../utils/logger.js'

const FilterComponent = memo(({ onFilterChange, setCurrentPage, isSubscribed, onSubscribeToggle }) => {
    const { t } = useTranslation()
    const [localKeyword, setLocalKeyword] = useState('')
    const [localFilterType, setLocalFilterType] = useState('all')

    const handleFilter = useCallback(() => {
        logger.debug('🔍 Frontend filtre uygulanıyor...')
        onFilterChange({ type: localFilterType, keyword: localKeyword })
        setCurrentPage(1)
    }, [localFilterType, localKeyword, onFilterChange, setCurrentPage])

    const handleClear = useCallback(() => {
        logger.debug('🧹 TEMIZLE - Cache\'den ilk veri yükleniyor')
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
                    <button onClick={() => { setLocalFilterType('all'); onFilterChange({ type: 'all', keyword: localKeyword }) }} className={`p-3 rounded-lg font-semibold text-sm ${localFilterType === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-200'}`}>{t('filters.all', 'Tümü')}</button>
                    <button onClick={() => { setLocalFilterType('job'); onFilterChange({ type: 'job', keyword: localKeyword }) }} className={`p-3 rounded-lg font-semibold text-sm ${localFilterType === 'job' ? 'bg-ilan text-white' : 'bg-gray-200'}`}>{t('filters.jobs', 'İş İlanları')}</button>
                    <button onClick={() => { setLocalFilterType('cv'); onFilterChange({ type: 'cv', keyword: localKeyword }) }} className={`p-3 rounded-lg font-semibold text-sm ${localFilterType === 'cv' ? 'bg-cv text-white' : 'bg-gray-200'}`}>{t('filters.candidates', 'Adaylar')}</button>
                </div>
                <div className="flex-grow flex gap-2">
                    <div className="relative flex-grow">
                        <input type="text" placeholder={t('forms.searchPlaceholder')} value={localKeyword} onChange={e => setLocalKeyword(e.target.value)} className="w-full h-full p-3 pl-10 border rounded-lg" />
                        <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <button onClick={handleFilter} className="bg-blue-600 text-white font-semibold px-4 rounded-lg hover:bg-blue-700">{t('buttons.filter')}</button>
                    <button onClick={handleClear} className="bg-gray-200 text-gray-700 font-semibold px-4 rounded-lg hover:bg-gray-300">{t('filters.clearAll')}</button>
                </div>
            </div>
        </div>
    )
})

export default FilterComponent