# 🌍 Teppek - Global İş İlanları Platformu

Haritada görselleştirilen küresel iş ilanları platformu. Adzuna API'sini kullanarak 100,000+ iş ilanını gerçek zamanlı olarak sunar.

## ✨ Özellikler

- 🗺️ **Harita Tabanlı Görünüm**: Leaflet.js ile interaktif harita
- 🌍 **20+ Ülke Desteği**: Tüm Adzuna destekli ülkelerden veri
- 📊 **100,000+ İlan**: Paralel API çağrıları ile hızlı veri çekme
- 🔄 **Otomatik Güncelleme**: Günlük cron job ile veri yenileme
- 💾 **Supabase Entegrasyonu**: PostgreSQL + PostGIS ile veri saklama
- ⚡ **Vercel Deployment**: Serverless functions ile hızlı API

## 🚀 Canlı Demo

**🌐 Ana Site**: [https://teppek.com](https://teppek.com)

**🔧 Test Araçları**:
- [API Test Sayfası](https://teppek.com/test-api.html)
- [Veri Yükleme Aracı](https://teppek.com/load-countries-massive.html)

## 📋 API Endpoints

### 🔍 Test API'leri
```bash
GET https://teppek.com/api/test-simple
# Basit API test endpoint'i
```

### 📊 İlan API'leri
```bash
GET https://teppek.com/api/listings-simple
# 20 adet örnek ilan döner

GET https://teppek.com/api/adzuna-massive-simple?country=gb&page=1
# Belirli ülkeden sayfalı ilan çekme

GET https://teppek.com/api/adzuna-massive?mode=fetch&country=gb&initial=true
# Büyük veri seti çekme (Supabase gerekli)
```

## 🏗️ Teknik Yapı

### Frontend
- **React**: CDN üzerinden yüklenen React 18
- **Leaflet.js**: Harita görselleştirme
- **HTML/CSS/JS**: Sade ve hızlı arayüz

### Backend  
- **Vercel Functions**: Node.js serverless functions
- **Adzuna API**: 5 paralel API key ile veri çekme
- **Supabase**: PostgreSQL + PostGIS veritabanı

### DevOps
- **GitHub**: Kaynak kod yönetimi
- **Vercel**: Otomatik deployment
- **Cron Jobs**: Günlük veri güncelleme

## 🔧 Kurulum

### 1. Projeyi Klonla
```bash
git clone https://github.com/yukselpamuk83-a11y/teppek.git
cd teppek
```

### 2. Bağımlılıkları Yükle (Opsiyonel)
```bash
npm install @supabase/supabase-js
# Sadece Supabase kullanacaksanız
```

### 3. Environment Variables (.env)
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
```

### 4. Vercel Deploy
```bash
vercel --prod
```

## 📂 Dosya Yapısı

```
teppek/
├── 📄 index.html              # Ana uygulama
├── 📁 api/
│   ├── 🔧 test-simple.js      # Test API
│   ├── 📊 listings-simple.js  # Basit ilanlar API
│   ├── 🌍 adzuna-massive.js   # Büyük veri API (Supabase)
│   └── 🌍 adzuna-massive-simple.js # Basit büyük veri API
├── 📁 test/
│   ├── 🔍 test-api.html       # API test sayfası
│   └── 📊 load-countries-massive.html # Veri yükleme aracı
├── ⚙️ vercel.json            # Vercel konfigürasyonu
├── 📋 create-tables.sql      # Supabase tablo yapısı
└── 📖 README.md              # Bu dosya
```

## 🔐 API Keys

### Adzuna API Keys (5 adet)
```javascript
const API_KEYS = [
  { app_id: 'a19dd595', app_key: '0ca6f72f3a5cafae1643cfae18100181' },
  { app_id: 'a19dd595', app_key: '0f8160edaa39c3dcac3962d77b32236b' },
  { app_id: 'a19dd595', app_key: '1a2a55f9ad16c54c2b2e8efa67151f39' },
  { app_id: 'a19dd595', app_key: '739d1471fef22292b75f15b401556bdb' },
  { app_id: 'a19dd595', app_key: 'b7e0a6d929446aa1b9610dc3f8d22dd8' }
];
```

## 🌍 Desteklenen Ülkeler

| Ülke | Kod | Status |
|------|-----|--------|
| 🇬🇧 İngiltere | `gb` | ✅ Aktif |
| 🇺🇸 Amerika | `us` | ✅ Aktif |
| 🇩🇪 Almanya | `de` | ✅ Aktif |
| 🇫🇷 Fransa | `fr` | ✅ Aktif |
| 🇨🇦 Kanada | `ca` | ✅ Aktif |
| 🇦🇺 Avustralya | `au` | ✅ Aktif |
| 🇳🇱 Hollanda | `nl` | ⚠️ İsteğe Bağlı |
| 🇮🇹 İtalya | `it` | ⚠️ İsteğe Bağlı |
| 🇪🇸 İspanya | `es` | ⚠️ İsteğe Bağlı |
| 🇸🇬 Singapur | `sg` | ⚠️ İsteğe Bağlı |

*Toplam 20 ülke desteklenmektedir*

## ⏰ Otomatik Güncellemeler

```json
{
  "crons": [
    {
      "path": "/api/daily-update",
      "schedule": "0 3 * * *"
    }
  ]
}
```

Her gece saat 03:00'da otomatik veri güncellemesi yapılır.

## 🧪 Test Etme

### 1. API Testi
[https://teppek.com/test-api.html](https://teppek.com/test-api.html) adresinden tüm API'leri test edin.

### 2. Veri Yükleme
[https://teppek.com/load-countries-massive.html](https://teppek.com/load-countries-massive.html) ile çoklu ülke verisi yükleyin.

### 3. Doğrudan API Testi
```bash
# Test API
curl https://teppek.com/api/test-simple

# İlan API
curl "https://teppek.com/api/adzuna-massive-simple?country=gb&page=1"
```

## 🛠️ Geliştirme

### Yeni Özellik Eklemek
1. `api/` klasörüne yeni endpoint ekleyin
2. `vercel.json`'da gerekli ayarları yapın
3. Test sayfasında yeni endpoint'i test edin
4. GitHub'a push yapın (otomatik deploy)

### Yeni Ülke Eklemek
`ADZUNA_COUNTRIES` array'ine yeni ülke ekleyin:
```javascript
{ code: 'tr', name: 'Turkey' }
```

## 📊 Performans

- **API Response**: ~200-500ms
- **Veri Çekme**: 50 ilan/istek
- **Rate Limiting**: 500ms bekleme süreleri
- **Paralel İşlem**: 5 API key ile eşzamanlı çekme

## 🔧 Sorun Giderme

### API Çalışmıyor
1. [Vercel Dashboard](https://vercel.com/dashboard)'dan function loglarını kontrol edin
2. `test-api.html` ile endpoint'leri tek tek test edin
3. API key limitlerini kontrol edin

### Veri Yüklenmiyor
1. Network sekmesinden HTTP hatalarını kontrol edin
2. Supabase bağlantı ayarlarını doğrulayın
3. Rate limiting nedeniyle yavaş yükleme normal

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı altında yayınlanmıştır.

## 🙏 Teşekkürler

- [Adzuna](https://www.adzuna.com/) - İş ilanları API'si
- [Supabase](https://supabase.com/) - Veritabanı servisi  
- [Vercel](https://vercel.com/) - Hosting ve deployment
- [Leaflet.js](https://leafletjs.com/) - Harita kütüphanesi
- [OpenStreetMap](https://www.openstreetmap.org/) - Harita verileri

## 📧 İletişim

Sorularınız için [GitHub Issues](https://github.com/yukselpamuk83-a11y/teppek/issues) kullanabilirsiniz.

---

**🚀 [Teppek](https://teppek.com) ile küresel iş fırsatlarını keşfedin!**