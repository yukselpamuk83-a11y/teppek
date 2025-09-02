# Teppek.com - Kapsamlı API ve Sistem Dokümantasyonu

## 🏗️ Sistem Mimarisi

### **Genel Yapı**
- **Frontend**: React + Vite (SPA)
- **Backend**: Vercel Serverless Functions
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (GeoJSON dosyaları)
- **Map Library**: Leaflet.js + MarkerCluster
- **Data Source**: Adzuna API (20 ülke)

---

## 🔌 API Endpoints Detay Analizi

### **1. /api/get-map-data** (Ana Veri Çekme API)
**Method**: `GET`
**Purpose**: Harita için filtrelenmiş job ve CV verilerini döner

#### Request Parameters
```typescript
interface GetMapDataParams {
  q?: string           // Arama terimi (title, company)
  country?: string     // Ülke kodu (GB, US, DE, vb.)
  city?: string        // Şehir adı
  remote?: string      // "true" | "false" | "all"
  type?: string        // "jobs" | "cvs" | "all"
  page?: string        // Sayfa numarası (default: 1)
  limit?: string       // Sayfa başına kayıt (max: 1000, default: 50)
  clear?: string       // Filtreleri temizle ("true")
}
```

#### Response Schema
```typescript
interface GetMapDataResponse {
  success: boolean
  data: Array<JobOrCV>
  stats: {
    total_items: number
    total_jobs: number
    total_cvs: number
    current_page: number
    total_pages: number
    items_per_page: number
    has_next_page: boolean
    has_prev_page: boolean
  }
  filters: {
    search_query: string
    country: string
    city: string
    remote: string
    type: string
  }
}
```

#### İç Çalışma Mantığı
1. **Validation**: Query parametrelerini sanitize et
2. **Database Query**: Jobs ve CVs tablolarından veri çek
3. **Filtering**: 
   - Text search: `title.ilike.%term%,company.ilike.%term%`
   - Country: Exact match uppercase
   - City: Case-insensitive like
   - Remote: Boolean match
4. **Pagination**: Client-side (Supabase max 1000 limit)
5. **Data Transform**: Unified format'a çevir

---

### **2. /api/generate-map-data** (GeoJSON Bucket Generator)
**Method**: `GET/POST`
**Purpose**: Tüm job verilerini GeoJSON formatında Supabase Storage'a yükler

#### Çalışma Mantığı
1. **Data Fetch**: Jobs tablosundan tüm kayıtları çek (1000'li batch'ler)
2. **GeoJSON Transform**:
   ```json
   {
     "type": "FeatureCollection",
     "features": [
       {
         "type": "Feature",
         "geometry": {"type": "Point", "coordinates": [lon, lat]},
         "properties": {
           "id": 123,
           "title": "Job Title",
           "company": "Company Name",
           "salary_min": 50000,
           "salary_max": 70000,
           "currency": "USD",
           "source": "adzuna",
           "type": "job"
         }
       }
     ]
   }
   ```
3. **Storage Upload**: `public-assets/map-data.geojson` olarak kaydet
4. **Cache Control**: 1 saat TTL

#### Performance Optimizations
- Popup HTML kaldırıldı (dynamic generation)
- Chunked processing (1000'li gruplar)
- Memory efficient streaming

---

### **3. /api/generate-map-data-v2** (Optimized Version)
**Purpose**: V1'in optimize edilmiş versiyonu

#### Optimizasyonlar
- **Field Selection**: Sadece gerekli alanları çek
- **No HTML Generation**: Frontend'de dynamic popup
- **Better Error Handling**: Detailed error reporting
- **Compression**: JSON minification

---

### **4. /api/daily-refresh** (Adzuna Sync)
**Method**: `GET`
**Purpose**: Son 24 saatteki job ilanlarını Adzuna'dan çekip database'e ekler

#### API Key Management
```javascript
function getAdzunaKeys() {
  const keys = [];
  for (let i = 1; i <= 5; i++) {
    const app_id = process.env[`ADZUNA_APP_ID_${i}`];
    const app_key = process.env[`ADZUNA_APP_KEY_${i}`];
    if (app_id && app_key) {
      keys.push({ app_id, app_key });
    }
  }
  return keys;
}
```

#### Desteklenen Ülkeler
```javascript
const COUNTRIES = [
  'gb', 'us', 'de', 'fr', 'ca', 'au', 'nl', 'it', 
  'es', 'sg', 'at', 'be', 'br', 'ch', 'in', 'mx', 
  'nz', 'pl', 'ru', 'za'
];
```

#### Çalışma Mantığı
1. **Rate Limiting**: Her ülke arası 500ms bekle
2. **API Calls**: `max_days_old=1` ile son 24 saat
3. **Data Validation**:
   - Required fields: id, title, redirect_url, lat, lon, salary
   - Quality filters: Min 5 karakter title, spam detection
4. **Database Upsert**: `ON CONFLICT (adzuna_id) DO UPDATE`
5. **Cleanup**: 30 günlük rolling window (eski kayıtları sil)

#### Response Format
```json
{
  "success": true,
  "message": "Daily refresh completed: 1,247 new jobs added, 856 jobs deleted",
  "summary": {
    "started_at": "2025-01-26T10:00:00Z",
    "new_jobs": 1247,
    "deleted_jobs": 856,
    "by_country": {
      "gb": 345,
      "us": 289,
      "de": 167
    },
    "errors": []
  }
}
```

---

### **5. /api/create-job** (Manuel Job Ekleme)
**Method**: `POST`
**Purpose**: Kullanıcıların manuel olarak job ilanı eklemesi

#### Request Body
```typescript
interface CreateJobRequest {
  title: string          // Required, min 1 char
  company: string        // Required
  city?: string          // Optional
  country?: string       // Optional
  lat: number           // Required, -90 to 90
  lon: number           // Required, -180 to 180
  contact?: string       // Optional
  remote?: boolean       // Default: false
  salary_min?: number    // Optional
  salary_max?: number    // Optional
  currency?: string      // Default: "USD", max 3 chars
}
```

#### Validation Logic
1. **Required Fields**: title, company, lat, lon
2. **Coordinate Validation**: Valid range check
3. **Data Sanitization**: Trim strings, parse numbers
4. **Unique ID Generation**: `manual_${timestamp}_${random}`

#### Database Schema Mapping
```sql
INSERT INTO jobs (
  adzuna_id, title, company, city, country, lat, lon, 
  url, contact, salary_min, salary_max, currency, 
  source, user_id, remote, created_at
) VALUES (...)
```

---

### **6. /api/create-cv** (CV Ekleme)
**Method**: `POST`
**Purpose**: Kullanıcıların CV profili oluşturması

#### Request Body
```typescript
interface CreateCVRequest {
  full_name: string           // Required
  title: string               // Required (job title)
  description: string         // Required
  lat: number                 // Required
  lon: number                 // Required
  country?: string            // Default: "Turkey"
  city?: string               // Optional
  contact: string             // Required
  skills?: string[]           // Array of skills
  experience_years?: number   // Default: 0
  remote_available?: boolean  // Default: false
  salary_expectation_min?: number
  salary_expectation_max?: number
}
```

#### Special Features
- **Auto-activation**: `available_for_work = true`
- **Anonymous Support**: `user_id = 'anonymous'`
- **Currency Default**: TRY (Turkish Lira)

---

## 🗄️ Database Schema

### **Jobs Table**
```sql
CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    adzuna_id VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    company VARCHAR(100),
    city VARCHAR(50),
    country CHAR(2),
    lat DECIMAL(10,8) NOT NULL,
    lon DECIMAL(11,8) NOT NULL,
    url TEXT,
    contact TEXT,
    salary_min INTEGER,
    salary_max INTEGER,
    currency CHAR(3) DEFAULT 'USD',
    remote BOOLEAN DEFAULT FALSE,
    source VARCHAR(20) DEFAULT 'adzuna',
    user_id VARCHAR(50),
    icon_type VARCHAR(20) DEFAULT 'job',
    created_at TIMESTAMP DEFAULT NOW()
);
```

### **CVs Table**
```sql
CREATE TABLE cvs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    lat DECIMAL(10,8) NOT NULL,
    lon DECIMAL(11,8) NOT NULL,
    country VARCHAR(50) DEFAULT 'Turkey',
    city VARCHAR(50),
    contact TEXT NOT NULL,
    skills JSONB DEFAULT '[]',
    experience_years INTEGER DEFAULT 0,
    remote_available BOOLEAN DEFAULT FALSE,
    salary_expectation_min INTEGER,
    salary_expectation_max INTEGER,
    currency CHAR(3) DEFAULT 'TRY',
    available_for_work BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎯 Frontend-Backend Data Flow

### **1. App Initialization Flow**
```
1. App.jsx loads
2. getUserLocation() → Geolocation API
3. fetchMapData() → /api/get-map-data
4. MapComponent receives data
5. Leaflet map initialization
6. Marker clustering setup
```

### **2. Data Caching Strategy**
```javascript
// useDataCache.js
const memoryCache = new Map()

export function useDataCache(key, fetchFunction, options = {}) {
  const { memoryTTL = 300000, staleWhileRevalidate = true } = options
  
  // 1. Check memory cache first
  // 2. If stale, show stale while fetching fresh
  // 3. Update cache with fresh data
}
```

### **3. Map Performance Optimizations**
```javascript
// mapPerformance.js utilities
- chunkData(): Büyük veriyi parçalara böl
- filterDataByViewport(): Sadece görünür alan
- MarkerPool: Marker yeniden kullanımı
- progressiveLoadMarkers(): Kademeli yükleme
```

### **4. Real-time Features**
```javascript
// useRealtimeData.jsx
- Supabase real-time subscriptions
- Job/CV ekleme/silme events
- Automatic map refresh
```

---

## 🔧 Environment Configuration

### **Required Environment Variables**
```env
# Database
DATABASE_URL=postgresql://...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Adzuna API (5 keys for rate limiting)
ADZUNA_APP_ID_1=xxx
ADZUNA_APP_KEY_1=xxx
ADZUNA_APP_ID_2=xxx
ADZUNA_APP_KEY_2=xxx
# ... up to 5

# Novu (Notifications)
NOVU_SECRET_KEY=xxx
VITE_NOVU_APP_ID=xxx
VITE_NOVU_SUBSCRIBER_ID=xxx
```

---

## 📊 Performance Metrics

### **API Response Times**
- `/api/get-map-data`: ~200-500ms (depends on filters)
- `/api/generate-map-data`: ~5-15s (bulk processing)
- `/api/daily-refresh`: ~2-5 minutes (20 countries)

### **Data Volume**
- **Jobs Table**: ~16,000+ records
- **Daily Refresh**: ~1,000-2,000 new jobs/day
- **Retention**: 30-day rolling window
- **GeoJSON File Size**: ~2-5MB

### **Frontend Optimizations**
- **Leaflet Dynamic Loading**: CDN yükleme
- **Marker Clustering**: 50px radius
- **Viewport Filtering**: Sadece görünür alanı render
- **Memory Caching**: 5 dakika TTL

---

## 🔍 Error Handling & Monitoring

### **Common Error Scenarios**
1. **Database Connection**: Pool exhaustion
2. **Adzuna Rate Limits**: 429 responses
3. **Invalid Coordinates**: Out of range lat/lng
4. **Supabase Storage**: Upload failures

### **Error Response Format**
```json
{
  "success": false,
  "error": "Human readable error message",
  "code": "ERROR_CODE_CONSTANT",
  "details": "Technical details (dev only)"
}
```

### **Monitoring Points**
- API success/failure rates
- Database query performance
- Memory cache hit ratios
- Map render performance

---

## 🚀 Deployment & DevOps

### **Vercel Configuration**
```json
{
  "functions": {
    "api/**/*.js": {
      "maxDuration": 300
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {"key": "Access-Control-Allow-Origin", "value": "*"}
      ]
    }
  ]
}
```

### **Build Process**
1. `npm run build` → Vite production build
2. API functions → Vercel serverless deploy
3. Static assets → Vercel Edge Network
4. Environment variables → Vercel project settings

---

## 📈 Future Improvements

### **Planned Features**
1. **User Authentication**: Full login system
2. **Premium Subscriptions**: Payment integration
3. **Advanced Filters**: Skills, experience, industry
4. **Mobile App**: React Native version
5. **Analytics Dashboard**: Usage metrics

### **Technical Debt**
1. **API Versioning**: Breaking changes management
2. **Database Migrations**: Schema evolution
3. **Test Coverage**: Unit + integration tests
4. **Documentation**: OpenAPI/Swagger specs

---

*Bu dokümantasyon, Teppek.com sisteminin tam bir teknik analizi ve API çalışma mantıklarını içermektedir. Sistem sürekli geliştirildiği için güncel tutulmalıdır.*