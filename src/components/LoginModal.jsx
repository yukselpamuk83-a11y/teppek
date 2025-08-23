function LoginModal({ isOpen, onClose, userType, title, color }) {
    if (!isOpen) return null
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000]">
            <div className="bg-white rounded-lg p-8 w-full max-w-md mx-4">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className={`text-2xl font-bold text-${color === 'ilan' ? 'cyan' : 'orange'}-600`}>
                        {title}
                    </h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                        ×
                    </button>
                </div>
                
                {/* Social Login Buttons */}
                <div className="space-y-3 mb-6">
                    <button className="w-full bg-red-500 text-white py-3 px-4 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center font-semibold">
                        <i className="fab fa-google mr-3"></i>
                        Google ile Giriş Yap
                    </button>
                    <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center font-semibold">
                        <i className="fab fa-facebook mr-3"></i>
                        Facebook ile Giriş Yap
                    </button>
                </div>
                
                {/* Divider */}
                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">veya</span>
                    </div>
                </div>
                
                {/* Email Login Form */}
                <form className="space-y-4">
                    <input 
                        type="email" 
                        placeholder="E-posta adresiniz"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                    />
                    <input 
                        type="password" 
                        placeholder="Şifreniz"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                    />
                    <button 
                        type="submit"
                        className={`w-full bg-${color} text-white py-3 px-4 rounded-lg hover:opacity-90 transition-all font-semibold`}
                    >
                        Giriş Yap
                    </button>
                </form>
                
                {/* Register Link */}
                <p className="mt-6 text-center text-gray-600">
                    Hesabınız yok mu? 
                    <button className={`ml-1 text-${color === 'ilan' ? 'cyan' : 'orange'}-600 hover:underline font-semibold`}>
                        Kayıt Ol
                    </button>
                </p>
            </div>
        </div>
    )
}

export default LoginModal