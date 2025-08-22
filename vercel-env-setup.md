# Vercel Environment Variables Kurulumu

Vercel Dashboard'da şu environment variables'ları ayarlamanız gerekiyor:

## 1. Vercel Dashboard'a gidin
https://vercel.com/dashboard → teppek projesi → Settings → Environment Variables

## 2. Gerekli Variables'lar

### Supabase (PostgreSQL) Bağlantısı
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
```

### Adzuna API Keys (5 adet)
```
ADZUNA_APP_ID_1=a19dd595
ADZUNA_APP_KEY_1=0ca6f72f3a5cafae1643cfae18100181

ADZUNA_APP_ID_2=a19dd595
ADZUNA_APP_KEY_2=0f8160edaa39c3dcac3962d77b32236b

ADZUNA_APP_ID_3=a19dd595
ADZUNA_APP_KEY_3=1a2a55f9ad16c54c2b2e8efa67151f39

ADZUNA_APP_ID_4=a19dd595
ADZUNA_APP_KEY_4=739d1471fef22292b75f15b401556bdb

ADZUNA_APP_ID_5=a19dd595
ADZUNA_APP_KEY_5=b7e0a6d929446aa1b9610dc3f8d22dd8
```

## 3. Supabase DATABASE_URL Nasıl Bulunur

1. Supabase Dashboard → Settings → Database
2. Connection string'i kopyalayın
3. [YOUR-PASSWORD] kısmını gerçek password ile değiştirin

Örnek:
```
postgresql://postgres:your_password@db.rjtzvcykmqquozppdbeg.supabase.co:5432/postgres
```

## 4. Database Kurulumu

1. Supabase Dashboard → SQL Editor
2. `database-setup.sql` dosyasını çalıştırın
3. Tables oluşturulduğunu kontrol edin

## 5. Test Etme

Environment variables ayarladıktan sonra:
- https://teppek.com/api/test → Sistem durumunu kontrol et
- https://teppek.com/test-clean-api.html → Tam test süiti

## 6. Deployment

Variables ayarladıktan sonra:
```bash
git add .
git commit -m "Add environment setup docs"
git push
```

Vercel otomatik deploy edecek.