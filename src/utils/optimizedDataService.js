// OPTIMIZE EDİLMİŞ VERİ SERVİSİ
// CSV analizinde belirlenen performans sorunlarını çözüyor
import { supabase } from '../lib/supabase.js'
import logger from './logger.js'

class OptimizedDataService {
  constructor() {
    this.cache = new Map()
    this.queryCache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5 dakika
  }

  /**
   * OPTIMIZE EDİLMİŞ TEK İÇERİK SORGULAMA (25,615 çağrı → optimize)
   * Önbellek + optimize edilmiş sorgu
   */
  async fetchSingleItem(itemId, useCache = true) {
    const cacheKey = `item_${itemId}`
    
    // Önbellek kontrolü
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        logger.debug('🎯 Önbellekten döndürülüyor:', itemId)
        return cached.data
      }
    }

    try {
      // OPTIMIZE EDİLMİŞ SORGU - sadece gerekli alanlar
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          id, title, company, lat, lon, city, country,
          salary_min, salary_max, currency, url, contact,
          source, remote, created_at
        `)
        .eq('id', itemId)
        .single()

      if (error) throw error

      // Önbelleğe kaydet
      if (data) {
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        })
        logger.debug('✅ Tek içerik getirildi:', itemId)
      }

      return data

    } catch (error) {
      logger.error('❌ Tek içerik getirme hatası:', error)
      return null
    }
  }

  /**
   * OPTIMIZE EDİLMİŞ LİSTE SORGULAMA (126 çağrı → optimize)
   * Sayfalama + filtreli sorgu optimizasyonu
   */
  async fetchJobsList({
    bounds = null,
    source = null,
    limit = 100,
    offset = 0,
    orderBy = 'created_at',
    orderDirection = 'desc'
  } = {}) {
    
    const queryKey = JSON.stringify({ bounds, source, limit, offset, orderBy, orderDirection })
    
    // Sorgu önbelleği kontrolü
    if (this.queryCache.has(queryKey)) {
      const cached = this.queryCache.get(queryKey)
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        logger.debug('🎯 Sorgu önbelleğinden döndürülüyor')
        return cached.data
      }
    }

    try {
      let query = supabase
        .from('jobs')
        .select(`
          id, title, company, lat, lon, city, country,
          salary_min, salary_max, currency, source,
          remote, created_at
        `, { count: 'exact' })

      // KONUM SINIRLAMA (optimize edilmiş spatial query)
      if (bounds) {
        query = query
          .gte('lat', bounds.minLat)
          .lte('lat', bounds.maxLat)
          .gte('lon', bounds.minLng)
          .lte('lon', bounds.maxLng)
      }

      // KAYNAK FİLTRELEME
      if (source) {
        query = query.eq('source', source)
      }

      // SIRALAMA VE SAYFALAMA
      query = query
        .order(orderBy, { ascending: orderDirection === 'asc' })
        .range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) throw error

      const result = {
        data: data || [],
        total: count || 0,
        hasMore: (offset + limit) < count
      }

      // Sorgu önbelleğine kaydet
      this.queryCache.set(queryKey, {
        data: result,
        timestamp: Date.now()
      })

      logger.debug(`✅ Liste getirildi: ${data?.length} kayıt, toplam: ${count}`)
      return result

    } catch (error) {
      logger.error('❌ Liste getirme hatası:', error)
      return { data: [], total: 0, hasMore: false }
    }
  }

  /**
   * OPTIMIZE EDİLMİŞ BULK İNSERT (356 çağrı → optimize)
   * Batch insert performans optimizasyonu
   */
  async insertJobsBatch(jobs, batchSize = 100) {
    if (!jobs || jobs.length === 0) {
      return { success: true, inserted: 0 }
    }

    let totalInserted = 0
    const errors = []

    try {
      // Büyük veri setlerini küçük batch'lere böl
      for (let i = 0; i < jobs.length; i += batchSize) {
        const batch = jobs.slice(i, i + batchSize)
        
        try {
          const { data, error } = await supabase
            .from('jobs')
            .insert(batch)
            .select('id')

          if (error) throw error

          totalInserted += batch.length
          logger.debug(`✅ Batch eklendi: ${batch.length} kayıt`)

          // Database'i rahatlat
          await new Promise(resolve => setTimeout(resolve, 50))

        } catch (batchError) {
          logger.error(`❌ Batch ekleme hatası (${i}-${i + batchSize}):`, batchError)
          errors.push({
            batchIndex: i,
            error: batchError.message
          })
        }
      }

      return {
        success: errors.length === 0,
        inserted: totalInserted,
        total: jobs.length,
        errors
      }

    } catch (error) {
      logger.error('❌ Bulk insert genel hatası:', error)
      return {
        success: false,
        inserted: totalInserted,
        total: jobs.length,
        errors: [...errors, { error: error.message }]
      }
    }
  }

  /**
   * OPTIMIZE EDİLMİŞ YAKINDAKI İŞLER SORGULAMA
   * Distance-based queries için optimize edilmiş
   */
  async fetchNearbyJobs(userLat, userLng, radiusKm = 50, limit = 50) {
    const cacheKey = `nearby_${userLat}_${userLng}_${radiusKm}_${limit}`
    
    // Önbellek kontrolü
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        logger.debug('🎯 Yakındaki işler önbellekten döndürülüyor')
        return cached.data
      }
    }

    try {
      // Basit bounding box hesaplama (performans için)
      const latDelta = radiusKm / 111 // Yaklaşık 1 derece = 111 km
      const lngDelta = radiusKm / (111 * Math.cos(userLat * Math.PI / 180))

      const { data, error } = await supabase
        .from('jobs')
        .select(`
          id, title, company, lat, lon, city, country,
          salary_min, salary_max, currency, source, created_at
        `)
        .gte('lat', userLat - latDelta)
        .lte('lat', userLat + latDelta)
        .gte('lon', userLng - lngDelta)
        .lte('lon', userLng + lngDelta)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      // Gerçek mesafe hesaplama ve sıralama
      const jobsWithDistance = (data || []).map(job => {
        const distance = this.calculateDistance(userLat, userLng, job.lat, job.lon)
        return {
          ...job,
          distance: Math.round(distance * 10) / 10 // 1 ondalık basamak
        }
      }).filter(job => job.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance)

      // Önbelleğe kaydet
      this.cache.set(cacheKey, {
        data: jobsWithDistance,
        timestamp: Date.now()
      })

      logger.debug(`✅ Yakındaki işler: ${jobsWithDistance.length} kayıt`)
      return jobsWithDistance

    } catch (error) {
      logger.error('❌ Yakındaki işler getirme hatası:', error)
      return []
    }
  }

  /**
   * MESAFE HESAPLAMA (optimize edilmiş)
   * Haversine formülü - hızlı implementasyon
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371 // Dünya yarıçapı (km)
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  /**
   * REALTİME GÜNCELLEMELER İÇİN OPTİMİZE EDİLMİŞ
   * Sadece manuel girişleri dinle
   */
  setupOptimizedRealtime(callback) {
    const channel = supabase
      .channel('optimized_jobs')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'jobs',
        filter: 'source=eq.manual'
      }, (payload) => {
        logger.debug('🔄 Yeni manuel iş eklendi:', payload.new.id)
        
        // Önbellekleri temizle
        this.clearCacheForNewJob(payload.new)
        
        // Callback'i çağır
        if (callback) {
          callback(payload.new)
        }
      })
      .subscribe()

    return channel
  }

  /**
   * YENİ İŞ EKLENDİĞİNDE İLGİLİ ÖNBELLEKLERİ TEMİZLE
   */
  clearCacheForNewJob(job) {
    // Konum tabanlı önbellekleri temizle
    const keysToDelete = []
    for (const [key] of this.cache) {
      if (key.startsWith('nearby_') || key.startsWith('list_')) {
        keysToDelete.push(key)
      }
    }
    
    keysToDelete.forEach(key => {
      this.cache.delete(key)
    })

    // Sorgu önbelleklerini temizle  
    this.queryCache.clear()
    
    logger.debug('🧹 Yeni iş için önbellekler temizlendi')
  }

  /**
   * ÖNBELLEKLERİ TEMİZLE
   */
  clearAllCaches() {
    this.cache.clear()
    this.queryCache.clear()
    logger.debug('🧹 Tüm önbellekler temizlendi')
  }

  /**
   * ÖNBELLEK İSTATİSTİKLERİ
   */
  getCacheStats() {
    return {
      itemCache: this.cache.size,
      queryCache: this.queryCache.size,
      totalMemoryEstimate: (this.cache.size + this.queryCache.size) * 2048 // Yaklaşık bytes
    }
  }

  /**
   * PERFORMANS METRİKLERİNİ İZLE
   */
  async getPerformanceMetrics() {
    try {
      const { data, error } = await supabase.rpc('get_table_stats', {
        table_name: 'jobs'
      })

      if (error) throw error

      return {
        totalRows: data?.live_rows || 0,
        tableSize: data?.table_size || 0,
        indexCount: data?.index_count || 0,
        cacheStats: this.getCacheStats()
      }
    } catch (error) {
      logger.error('❌ Performans metrikleri alınamadı:', error)
      return null
    }
  }
}

// Singleton instance
export const optimizedDataService = new OptimizedDataService()
export default optimizedDataService