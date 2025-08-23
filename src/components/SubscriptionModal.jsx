function SubscriptionModal({ onClose }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[2000]">
            <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-sm">
                <i className="fa-solid fa-lock text-5xl text-yellow-500 mb-4"></i>
                <h2 className="text-2xl font-bold mb-2">Premium Özellik</h2>
                <p className="text-gray-600 mb-6">Bu kaydın tüm detaylarını görmek ve 50 km dışındaki tüm fırsatlara erişmek için abonelik planlarımızı inceleyin.</p>
                <div className="flex flex-col gap-3">
                    <button className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600">Abonelik Seçeneklerini Gör</button>
                    <button onClick={onClose} className="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg hover:bg-gray-300">Kapat</button>
                </div>
            </div>
        </div>
    )
}

export default SubscriptionModal