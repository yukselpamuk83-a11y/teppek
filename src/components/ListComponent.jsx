import { getDistance } from '../utils/distance'

function ListComponent({ data, onRowClick, isSubscribed, userLocation, onPremiumClick }) {
    return (
        <div className="flex-grow overflow-y-auto">
            {data.length === 0 ? (
                <p className="text-center text-gray-500 mt-4">Filtrelerinize uygun sonuç bulunamadı.</p>
            ) : (
                <div className="w-full overflow-x-auto">
                    <table className="min-w-full bg-white text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-3 text-left font-semibold text-gray-600 whitespace-nowrap">Tür</th>
                                <th className="p-3 text-left font-semibold text-gray-600 whitespace-nowrap">Başlık / Ünvan</th>
                                <th className="p-3 text-left font-semibold text-gray-600 whitespace-nowrap">Firma / Aday</th>
                                <th className="p-3 text-left font-semibold text-gray-600 whitespace-nowrap">Uzaklık</th>
                                <th className="p-3 text-left font-semibold text-gray-600 whitespace-nowrap">Konum</th>
                                <th className="p-3 text-left font-semibold text-gray-600 whitespace-nowrap">Aksiyonlar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(item => {
                                const distance = getDistance(userLocation.lat, userLocation.lng, item.location.lat, item.location.lng)
                                const isPremiumContent = distance > 50
                                const canView = isSubscribed || !isPremiumContent
                                return (
                                    <tr key={item.id} className={`border-b align-top ${canView ? 'cursor-pointer' : 'opacity-70'} ${item.isSponsored ? 'bg-yellow-50 hover:bg-yellow-100' : (canView ? 'hover:bg-gray-100' : '')}`} onClick={() => canView ? onRowClick(item.location) : onPremiumClick()}>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${item.type === 'job' ? 'bg-ilan' : 'bg-cv'}`}>{item.type === 'job' ? 'İLAN' : 'Aday'}</span>
                                                {item.isSponsored && <span className="px-2 py-1 rounded-full text-xs font-semibold text-yellow-800 bg-yellow-200">Sponsorlu</span>}
                                            </div>
                                        </td>
                                        <td className="p-3"><p className="font-bold">{item.title}</p><p className={`text-gray-600 text-xs mt-1 ${!canView && 'blur-sm'}`}>{item.company || 'Şirket bilgisi mevcut değil'}</p></td>
                                        <td className={`p-3 text-gray-700 ${!canView && 'blur-sm'}`}>{item.company || item.name}</td>
                                        <td className={`p-3 text-gray-700 font-medium whitespace-nowrap ${!canView && 'blur-sm'}`}>{distance.toFixed(1)} km</td>
                                        <td className="p-3 text-gray-600">{item.address}</td>
                                        <td className="p-3">
                                            <div className="flex justify-start gap-2 text-xs font-semibold">
                                                {item.isOwner && (
                                                    <>
                                                        <button className="px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200">Düzenle</button>
                                                        <button className="px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200">Sil</button>
                                                    </>
                                                )}
                                                <button className="px-2 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Şikayet</button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

export default ListComponent