function HeaderComponent({ onFirmaLogin, onAdayLogin }) {
    return (
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-[1000]">
            {/* Logo */}
            <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-blue-600">Teppek</h1>
                <span className="text-sm text-gray-500">Global İş Platformu</span>
            </div>
            
            {/* Navigation Buttons */}
            <div className="flex items-center space-x-4">
                <button 
                    onClick={onFirmaLogin}
                    className="bg-ilan text-white px-6 py-2 rounded-lg hover:opacity-90 transition-all font-semibold"
                >
                    <i className="fa-solid fa-building mr-2"></i>
                    Firma Girişi
                </button>
                <button 
                    onClick={onAdayLogin}
                    className="bg-cv text-white px-6 py-2 rounded-lg hover:opacity-90 transition-all font-semibold"
                >
                    <i className="fa-solid fa-user mr-2"></i>
                    Aday Girişi
                </button>
            </div>
        </header>
    )
}

export default HeaderComponent