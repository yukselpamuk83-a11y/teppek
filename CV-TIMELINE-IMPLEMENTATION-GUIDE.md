# CV Timeline & Dual Layer Map System - Implementation Guide

Bu guide, Teppek.com projesine **CV Timeline sistemi** ve **çift katmanlı harita** (Jobs + CVs) entegrasyonunu anlatır.

## 🚀 Özellikler

### ✅ Tamamlanan Özellikler
- 📊 **Timeline Data Schema**: PostgreSQL JSONB ile esnek timeline yapısı
- 🗂️ **Layer Management**: React Context ile jobs/CVs layer kontrolü
- 🎯 **CV Markers**: Tıklanabilir CV marker'ları + popup'lar
- 📈 **Interactive Timeline**: vis-timeline ile profesyonel timeline görünümü
- 🎨 **Color-coded Periods**: Eğitim, staj, askerlik, iş deneyimi renk kodları
- 🔍 **Detail Views**: Timeline dönemleri için detaylı bilgi modülü
- 🎛️ **Dual Filters**: Jobs ve CVs için ayrı filtreleme sistemleri
- ⚡ **Performance**: 500k+ CV için viewport filtering ve chunking
- 📱 **Mobile Responsive**: Touch-friendly timeline ve responsive tasarım

### 🎯 Sistem Mimarisi
```
EnhancedMapComponent (Ana Bileşen)
├── LayerContext (State Management)
├── JobMarkers (Mevcut İş İlanları)
├── CVMarkers (Yeni CV Marker'ları)
├── TimelineModal (vis-timeline Entegrasyonu)
├── DualFilterSystem (İkili Filtreleme)
├── LayerControls (Katman Kontrolü)
└── Performance Hooks (Optimizasyonlar)
```

## 📋 Kurulum Adımları

### 1. Package Kurulumu
```bash
npm install vis-timeline vis-data
```

### 2. Database Schema Uygulaması
```sql
-- Timeline field ekle
ALTER TABLE cvs ADD COLUMN timeline_data JSONB DEFAULT '[]';
ALTER TABLE cvs ADD COLUMN is_timeline_public BOOLEAN DEFAULT TRUE;
ALTER TABLE cvs ADD COLUMN profile_photo_url TEXT;

-- Indexing (performans için)
CREATE INDEX idx_cvs_timeline_data ON cvs USING GIN (timeline_data);
CREATE INDEX idx_cvs_location_timeline ON cvs (lat, lon, is_timeline_public);
```

### 3. Context Provider Ekleme
```jsx
// App.jsx veya ModernApp.jsx
import { LayerProvider } from './src/contexts/LayerContext'

function App() {
  return (
    <LayerProvider>
      {/* Existing app content */}
      <EnhancedMapComponent 
        userLocation={userLocation}
        isSubscribed={isSubscribed}
        onPremiumClick={handlePremiumClick}
      />
    </LayerProvider>
  )
}
```

### 4. CSS Imports
```jsx
// Ana komponente ekle
import './src/styles/timeline-responsive.css'
```

## 🗃️ Database Timeline Data Formatı

### Timeline JSON Schema
```json
{
  "timeline_data": [
    {
      "id": "timeline_1",
      "type": "education|internship|military|work|gap|current_work",
      "title": "Senior Software Developer",
      "organization": "Tech Company",
      "location": "Istanbul, Turkey",
      "start_date": "2020-03-01",
      "end_date": "2023-12-31", // null if current
      "is_current": false,
      "description": "Led development team...",
      "skills": ["React", "Node.js", "PostgreSQL"],
      "achievements": ["Team leadership", "Performance optimization"],
      "color": "#3B82F6", // Timeline block rengi
      "display_order": 1
    }
  ]
}
```

### Timeline Type Colors
```javascript
const TIMELINE_COLORS = {
  education: '#8B5CF6',      // Mor - Eğitim
  internship: '#06B6D4',     // Açık Mavi - Staj  
  military: '#F59E0B',       // Turuncu - Askerlik
  work: '#3B82F6',           // Mavi - İş Deneyimi
  gap: '#6B7280',            // Gri - Boşta
  current_work: '#10B981'    // Yeşil - Mevcut İş
}
```

## 🔌 API Endpoints

### GET /api/get-cv-data
CV verilerini timeline desteği ile döner.

**Query Parameters:**
```
q: string              // Arama terimi
country: string        // Ülke filtresi  
city: string           // Şehir filtresi
remote: string         // "true"|"false"|"all"
skills: string         // Comma-separated skills
experience_min: number // Min deneyim yılı
experience_max: number // Max deneyim yılı  
education_level: string// Comma-separated levels
timeline_types: string // Comma-separated types
page: number           // Sayfa numarası
limit: number          // Sayfa başına kayıt
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cv-123",
      "type": "cv", 
      "name": "John Doe",
      "title": "Senior Developer",
      "location": {"lat": 41.01, "lng": 28.97},
      "timeline_data": [...],
      "timeline_items_count": 6,
      "profile_photo_url": "https://...",
      "skills": ["React", "Node.js"],
      "experience_years": 8
    }
  ],
  "stats": {
    "total_items": 1247,
    "timeline_enabled_count": 892,
    "avg_experience": 5.2
  }
}
```

## 🎨 UI Bileşenleri

### Timeline Modal Kullanımı
```jsx
import { useTimelineModal } from './contexts/LayerContext'

function CVPopup() {
  const { open } = useTimelineModal()
  
  const handleTimelineClick = (cvData) => {
    open(cvData) // Timeline modal açılır
  }
  
  return (
    <button onClick={() => handleTimelineClick(cvData)}>
      Timeline Görüntüle
    </button>
  )
}
```

### Layer Controls
```jsx
import { LayerControls, CompactLayerControls } from './components/controls/LayerControls'

// Desktop
<LayerControls className="absolute top-4 left-4 z-[1000]" />

// Mobile  
<CompactLayerControls className="absolute top-4 left-4 right-4 z-[1000]" />
```

### Dual Filter System
```jsx
import { DualFilterSystem, CompactDualFilters } from './components/filters/DualFilterSystem'

// Desktop
<DualFilterSystem className="absolute top-4 right-4 z-[1000] max-w-md" />

// Mobile
<CompactDualFilters className="absolute bottom-20 left-4 right-4 z-[1000]" />
```

## ⚡ Performance Optimizasyonları

### Viewport Filtering (500k+ CV için)
```jsx
import { useMapPerformance } from './hooks/useMapPerformance'

const { visibleData, metrics, controls } = useMapPerformance(
  mapInstance, 
  cvData, 
  {
    chunkSize: 100,           // Render chunk boyutu
    maxMarkersInView: 1000,   // Maksimum marker sayısı
    viewportPadding: 0.2,     // Viewport padding
    enableProgressiveLoading: true
  }
)
```

### Marker Pooling
```jsx
import { useMarkerPool } from './hooks/useMapPerformance'

const { getMarker, releaseMarker, releaseAllMarkers } = useMarkerPool(L)

// Marker'ları yeniden kullan
const marker = getMarker(lat, lng, icon)
// ...kullanım sonrası
releaseMarker(marker)
```

## 📱 Mobile Responsive

### Timeline Modal Mobile Görünümü
- **Full-screen modal** çok küçük ekranlarda
- **Touch-optimized** kontroller (min 44px)
- **Swipe gestures** timeline üzerinde 
- **Collapsible** detay panelleri

### Mobile CSS Media Queries
```css
@media (max-width: 768px) {
  .vis-timeline { height: 250px !important; }
  .timeline-item-content { padding: 6px 8px !important; }
}

@media (max-width: 480px) {
  .fixed.inset-0 > div { 
    margin: 0 !important; 
    height: 100vh !important; 
  }
}
```

## 🔧 Yapılandırma

### Layer Context Options
```jsx
const initialLayerState = {
  jobs: {
    visible: true,
    filters: { /* job filters */ }
  },
  cvs: {
    visible: true, 
    filters: { /* cv filters */ }
  }
}
```

### Performance Mode
```jsx
<EnhancedMapComponent 
  performanceMode="balanced" // 'performance'|'balanced'|'quality'
/>
```

### Timeline Options
```jsx
const timelineOptions = {
  orientation: 'top',        // 'top'|'bottom'
  zoomable: true,
  moveable: true,
  selectable: true,
  stack: false,              // Overlap dönemleri
  showCurrentTime: true      // Bugünün tarihini göster
}
```

## 🚦 Test Senaryoları

### 1. Temel Functionality
- ✅ CV marker'ları doğru konumlarda görünüyor
- ✅ Timeline modal açılıyor/kapanıyor
- ✅ Dönem blokları renk kodlu
- ✅ Layer toggle çalışıyor
- ✅ Filtreleme jobs/cvs için ayrı

### 2. Performance
- ✅ 1000+ CV ile smooth performans
- ✅ Viewport filtering aktif
- ✅ Memory usage kontrol altında
- ✅ Mobile'da 60fps timeline

### 3. Mobile UX
- ✅ Touch interactions çalışıyor
- ✅ Modal responsive
- ✅ Filter accordion açılır/kapanır
- ✅ Timeline zoom/pan mobile'da sorunsuz

## 🔮 Future Enhancements

### Phase 2 (Gelecek Sürüm)
- **PDF CV Export**: Timeline'dan PDF oluşturma
- **Timeline Sharing**: Link ile timeline paylaşımı
- **Advanced Analytics**: CV timeline istatistikleri
- **Video Timeline**: Video introductions
- **Skills Timeline**: Yetenek gelişim grafiği

### Phase 3 (Uzun Vadeli)
- **AI Timeline Suggestions**: Otomatik timeline önerileri  
- **Career Path Prediction**: AI ile kariyer öngörüsü
- **Company Timeline**: Şirket gelişim timeline'ları
- **Industry Benchmarks**: Sektörel karşılaştırmalar

## 📞 Support & Issues

Bu implementation guide ile beraber tam çalışan bir **CV Timeline & Dual Layer Map System** hazır! 

**Teknik Destek:** 
- React Performance: useMapPerformance hook
- Timeline Issues: vis-timeline documentation
- Mobile UX: Responsive CSS guide
- Database: PostgreSQL JSONB best practices

**Next Steps:**
1. Database schema'yı uygula
2. LayerProvider'ı ekle  
3. EnhancedMapComponent'i render et
4. CV data API'ını test et
5. Mobile responsive testleri yap

🎉 **Başarılı bir şekilde modern, performanslı ve kullanıcı dostu CV-Job platform sistemi hazır!**