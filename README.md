# 🌍 Teppek - Küresel İş İlanı Platformu

Teppek, Adzuna API'sinden ve manuel kullanıcı girişlerinden gelen iş ilanlarını interaktif bir harita üzerinde görselleştiren modern bir web uygulamasıdır. Proje, Vercel üzerinde sunucusuz (serverless) fonksiyonlarla çalışır ve verileri Supabase (PostgreSQL) veritabanında saklar.

## ✨ Canlı Demo

**[https://teppek.com/](https://teppek.com/)**

## 🚀 Temel Özellikler

-   🗺️ **İnteraktif Harita:** Leaflet.js ve MarkerCluster ile on binlerce ilanı akıcı bir şekilde gösterir.
-   🔄 **Otomatik Veri Güncelleme:** Vercel Cron Job ile her gün yeni ilanlar otomatik olarak çekilir ve eski ilanlar temizlenir.
-   ⚡ **Hızlı API:** Vercel Serverless Functions ile oluşturulmuş, filtreleme ve sayfalama destekli hızlı bir API.
-   💾 **Güçlü Veritabanı:** PostgreSQL ve PostGIS uzantısı sayesinde coğrafi sorgularda yüksek performans.
-   🔍 **Gelişmiş Filtreleme:** Anahtar kelime, ülke, şehir ve "uzaktan çalışma" seçeneklerine göre ilanları filtreleme.
-   ➕ **Manuel İlan Ekleme:** Kullanıcıların harita üzerinde kendi iş ilanlarını veya aday profillerini oluşturabilmesi.

## 🛠️ Teknoloji Mimarisi

-   **Frontend:**
    -   **React:** CDN üzerinden yüklenmiş, modern bir arayüz için.
    -   **Leaflet.js:** İnteraktif harita görselleştirmesi.
    -   **Tailwind CSS:** Hızlı ve modern stilendirme.
    -   **Font Awesome:** İkonlar.
-   **Backend:**
    -   **Vercel Serverless Functions:** Node.js tabanlı, ölçeklenebilir API endpoint'leri.
-   **Veritabanı:**
    -   **Supabase:** PostgreSQL veritabanı, PostGIS eklentisi ile coğrafi veri desteği.
-   **Veri Kaynağı:**
    -   **Adzuna API:** 20'den fazla ülkeden zengin iş ilanı verisi.

## ⚙️ API Endpointleri

Proje, tüm işlemleri Vercel üzerinde çalışan aşağıdaki API'ler üzerinden yönetir:

### `GET /api/test`

Sistemin genel durumunu, Node.js sürümünü, bellek kullanımını ve ortam değişkenlerinin (environment variables) yapılandırılıp yapılandırılmadığını kontrol eden bir sağlık kontrolü (health check) endpoint'i.

### `GET /api/get-jobs`

Frontend'in veritabanından iş ilanlarını çekmek için kullandığı ana endpoint.

**Query Parametreleri:**

-   `q` (string): İlan başlığı veya şirket adında arama yapmak için anahtar kelime.
-   `country` (string): Ülke koduna göre filtreleme (örn: `GB`, `US`).
-   `city` (string): Şehir adına göre filtreleme.
-   `remote` (boolean): `true` veya `false` değeri ile uzaktan çalışma ilanlarını filtreleme.
-   `page` (number): Sayfa numarası (varsayılan: `1`).
-   `limit` (number): Sayfa başına ilan sayısı (varsayılan: `20`).
-   `clear` (boolean): `true` yapıldığında tüm filtreleri yok sayar ve veritabanındaki tüm ilanları hızlıca döner.

### `GET /api/load-data`

Adzuna API'sinden toplu veri çekip veritabanını doldurmak için kullanılan bir araç. Genellikle ilk kurulumda kullanılır.

**Query Parametreleri:**

-   `countries` (string): Virgülle ayrılmış ülke kodları (örn: `gb,us,de`).
-   `days` (number): Son kaç günlük ilanların çekileceği (varsayılan: `7`).
-   `pages` (number): Her ülke için kaç sayfa veri çekileceği (1 sayfa = 50 ilan, varsayılan: `10`).

### `GET /api/daily-refresh`

Her gün otomatik olarak çalışan (cron job) ve veritabanını güncel tutan endpoint.

-   Son 24 saat içinde yayınlanan yeni ilanları çeker.
-   30 günden eski ilanları veritabanından siler.

## 🗄️ Veritabanı Şeması

Veriler, `jobs` adında tek bir tabloda saklanır.

**Önemli Alanlar:**

-   `adzuna_id`: Adzuna'dan gelen ilanlar için benzersiz ID (mükerrer kaydı önler).
-   `title`, `company`, `description`: Temel ilan bilgileri.
-   `lat`, `lon`: Harita gösterimi için enlem ve boylam (üzerinde coğrafi indeks bulunur).
-   `country`, `city`, `remote`: Filtreleme için kullanılan alanlar.
-   `source`: Verinin kaynağını belirtir (`adzuna` veya `manual`).
-   `marker_html`, `popup_html`: Performansı artırmak için sunucu tarafında önceden oluşturulmuş harita işaretçi HTML'leri.

Tablo, hızlı sorgular için `lat/lon`, `country`, `city`, `salary` gibi birçok alanda **indekslere** sahiptir.

## 📦 Kurulum ve Çalıştırma

1.  **Projeyi klonlayın:**
    ```bash
    git clone https://github.com/yukselpamuk83-a11y/teppek.git
    cd teppek
    ```

2.  **Bağımlılıkları yükleyin:**
    ```bash
    npm install
    ```

3.  **Ortam Değişkenlerini Ayarlayın:**
    Proje kök dizininde `.env.local` adında bir dosya oluşturun ve aşağıdaki değişkenleri kendi Supabase ve Adzuna bilgilerinizle doldurun.
    ```env
    # Supabase Veritabanı URL'si
    DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-DB-HOST]:5432/postgres"

    # Adzuna API Anahtarları (En az 1 tane gereklidir)
    ADZUNA_APP_ID_1="YOUR_ADZUNA_APP_ID"
    ADZUNA_APP_KEY_1="YOUR_ADZUNA_APP_KEY"
    # ... 5 adede kadar ekleyebilirsiniz (ADZUNA_APP_ID_5)
    ```

4.  **Yerel Geliştirme Ortamını Başlatın:**
    ```bash
    vercel dev
    ```

## 🚀 Dağıtım (Deployment)

Proje, **Vercel** ile otomatik olarak dağıtılmak üzere yapılandırılmıştır. GitHub deposuna yapılan her `push` işlemi, yeni bir dağıtımı tetikler.

### Otomatik Güncellemeler (Cron Job)

`vercel.json` dosyasında tanımlanan kurala göre, `/api/daily-refresh` endpoint'i her gün **UTC 06:00'da** otomatik olarak çalıştırılır.

```json
{
  "crons": [
    {
      "path": "/api/daily-refresh",
      "schedule": "0 6 * * *"
    }
  ]
}
```