import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
)

class PerformanceMonitor {
    constructor() {
        this.testResults = []
        this.startTime = null
    }

    /**
     * PERFORMANS TESTLERI - CSV'de tespit edilen sorgu tiplerini test et
     */
    async runPerformanceTests() {
        console.log('🚀 Supabase performans testleri başlıyor...')
        this.startTime = Date.now()

        const tests = [
            { name: 'Tek Kayıt Lookup', test: this.testSingleItemLookup.bind(this), iterations: 50 },
            { name: 'Sayfalama Sorgusu', test: this.testPaginationQuery.bind(this), iterations: 10 },
            { name: 'Konum Tabanlı Arama', test: this.testLocationBasedQuery.bind(this), iterations: 20 },
            { name: 'Filtreli Liste Sorgusu', test: this.testFilteredListQuery.bind(this), iterations: 15 },
            { name: 'Bulk Insert', test: this.testBulkInsert.bind(this), iterations: 5 }
        ]

        console.log(`📋 ${tests.length} farklı test kategorisi çalıştırılacak\n`)

        for (const { name, test, iterations } of tests) {
            await this.runTestCategory(name, test, iterations)
        }

        await this.generatePerformanceReport()
    }

    /**
     * TEST KATEGORİSİ ÇALIŞTIR
     */
    async runTestCategory(name, testFunc, iterations) {
        console.log(`⏳ ${name} testi başlıyor (${iterations} iterasyon)...`)
        
        const results = []
        let successCount = 0
        let errorCount = 0

        for (let i = 0; i < iterations; i++) {
            try {
                const startTime = performance.now()
                await testFunc()
                const duration = performance.now() - startTime
                
                results.push(duration)
                successCount++
                
                // Progress indicator
                if ((i + 1) % 5 === 0) {
                    process.stdout.write(`${i + 1}/${iterations} `)
                }
                
            } catch (error) {
                console.error(`❌ ${name} test ${i + 1} hatası:`, error.message)
                errorCount++
            }
        }

        const avgTime = results.length > 0 ? results.reduce((a, b) => a + b, 0) / results.length : 0
        const minTime = results.length > 0 ? Math.min(...results) : 0
        const maxTime = results.length > 0 ? Math.max(...results) : 0

        console.log(`\n✅ ${name} tamamlandı:`)
        console.log(`   Ortalama: ${avgTime.toFixed(2)}ms`)
        console.log(`   Min: ${minTime.toFixed(2)}ms | Max: ${maxTime.toFixed(2)}ms`)
        console.log(`   Başarı: ${successCount}/${iterations} | Hata: ${errorCount}`)
        console.log()

        this.testResults.push({
            testName: name,
            iterations,
            successCount,
            errorCount,
            avgTime: Math.round(avgTime * 100) / 100,
            minTime: Math.round(minTime * 100) / 100,
            maxTime: Math.round(maxTime * 100) / 100,
            totalTime: Math.round((results.reduce((a, b) => a + b, 0)) * 100) / 100
        })
    }

    /**
     * TEK KAYIT LOOKUP TESTİ (CSV'de 25,615 çağrı)
     */
    async testSingleItemLookup() {
        // Rastgele bir ID seç (gerçek verilerden)
        const randomId = Math.floor(Math.random() * 50000) + 1

        const { data, error } = await supabase
            .from('jobs')
            .select('id, title, company, lat, lon, city, country')
            .eq('id', randomId)
            .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 = not found, kabul edilebilir
            throw error
        }

        return data
    }

    /**
     * SAYFALAMA SORGUSU TESTİ (CSV'de 126 çağrı)
     */
    async testPaginationQuery() {
        const randomOffset = Math.floor(Math.random() * 1000)

        const { data, error } = await supabase
            .from('jobs')
            .select('id, title, company, lat, lon, created_at')
            .order('created_at', { ascending: false })
            .range(randomOffset, randomOffset + 99) // 100 kayıt

        if (error) throw error
        return data
    }

    /**
     * KONUM TABANLI ARAMA TESTİ
     */
    async testLocationBasedQuery() {
        // Istanbul etrafında rastgele bir bounding box
        const baseLat = 41.01
        const baseLng = 28.97
        const delta = 0.5

        const minLat = baseLat - delta + Math.random() * delta
        const maxLat = minLat + delta
        const minLng = baseLng - delta + Math.random() * delta
        const maxLng = minLng + delta

        const { data, error } = await supabase
            .from('jobs')
            .select('id, title, lat, lon, city')
            .gte('lat', minLat)
            .lte('lat', maxLat)
            .gte('lon', minLng)
            .lte('lon', maxLng)
            .limit(50)

        if (error) throw error
        return data
    }

    /**
     * FİLTRELİ LİSTE SORGUSU TESTİ  
     */
    async testFilteredListQuery() {
        const sources = ['adzuna', 'manual']
        const randomSource = sources[Math.floor(Math.random() * sources.length)]

        const { data, error } = await supabase
            .from('jobs')
            .select('id, title, company, source, created_at')
            .eq('source', randomSource)
            .order('created_at', { ascending: false })
            .limit(25)

        if (error) throw error
        return data
    }

    /**
     * BULK INSERT TESTİ
     */
    async testBulkInsert() {
        // Test verileri oluştur
        const testJobs = Array.from({ length: 10 }, (_, i) => ({
            title: `Test Job ${Date.now()}-${i}`,
            company: 'Test Company',
            lat: 41.01 + (Math.random() - 0.5) * 0.1,
            lon: 28.97 + (Math.random() - 0.5) * 0.1,
            country: 'TR',
            city: 'Istanbul',
            url: 'https://example.com',
            source: 'performance_test',
            adzuna_id: `test_${Date.now()}_${i}`
        }))

        // Insert et
        const { data, error } = await supabase
            .from('jobs')
            .insert(testJobs)
            .select('id')

        if (error) throw error

        // Test verilerini temizle (cleanup)
        if (data && data.length > 0) {
            const ids = data.map(item => item.id)
            await supabase
                .from('jobs')
                .delete()
                .in('id', ids)
        }

        return data
    }

    /**
     * VERİTABANI İSTATİSTİKLERİNİ AL
     */
    async getDatabaseStats() {
        try {
            // Tablo boyutu ve istatistikleri
            const { data: tableStats } = await supabase.rpc('execute_sql', {
                sql_query: `
                    SELECT 
                        pg_size_pretty(pg_total_relation_size('jobs')) as table_size,
                        n_live_tup as live_rows,
                        n_dead_tup as dead_rows,
                        n_tup_ins as inserts,
                        n_tup_upd as updates,
                        n_tup_del as deletes
                    FROM pg_stat_user_tables 
                    WHERE relname = 'jobs';
                `
            })

            // Index kullanım istatistikleri
            const { data: indexStats } = await supabase.rpc('execute_sql', {
                sql_query: `
                    SELECT 
                        indexname, 
                        idx_scan as scans,
                        idx_tup_read as tuples_read,
                        idx_tup_fetch as tuples_fetched
                    FROM pg_stat_user_indexes 
                    WHERE tablename = 'jobs' 
                    ORDER BY idx_scan DESC
                    LIMIT 10;
                `
            })

            return {
                table: tableStats?.[0] || {},
                indexes: indexStats || []
            }

        } catch (error) {
            console.error('⚠️ Veritabanı istatistikleri alınamadı:', error)
            return { table: {}, indexes: [] }
        }
    }

    /**
     * PERFORMANS RAPORU OLUŞTUR
     */
    async generatePerformanceReport() {
        const totalTime = Date.now() - this.startTime
        const dbStats = await this.getDatabaseStats()

        console.log('\n' + '='.repeat(60))
        console.log('📊 SUPABASE PERFORMANS TEST RAPORU')
        console.log('='.repeat(60))
        
        console.log(`📅 Test Tarihi: ${new Date().toLocaleString('tr-TR')}`)
        console.log(`⏱️ Toplam Test Süresi: ${(totalTime / 1000).toFixed(2)} saniye`)
        console.log()

        // Test sonuçları tablosu
        console.log('📋 Test Sonuçları:')
        console.log('-'.repeat(80))
        console.log('Test Adı'.padEnd(25) + 
                   'Iter.'.padEnd(8) + 
                   'Başarı'.padEnd(10) + 
                   'Ort. (ms)'.padEnd(12) + 
                   'Min (ms)'.padEnd(12) + 
                   'Max (ms)'.padEnd(12))
        console.log('-'.repeat(80))

        this.testResults.forEach(result => {
            console.log(
                result.testName.padEnd(25) +
                result.iterations.toString().padEnd(8) +
                `${result.successCount}/${result.iterations}`.padEnd(10) +
                result.avgTime.toString().padEnd(12) +
                result.minTime.toString().padEnd(12) +
                result.maxTime.toString().padEnd(12)
            )
        })

        console.log('-'.repeat(80))

        // Veritabanı istatistikleri
        console.log('\n📊 Veritabanı İstatistikleri:')
        console.log(`📏 Tablo Boyutu: ${dbStats.table.table_size || 'Bilinmiyor'}`)
        console.log(`📋 Aktif Satır: ${dbStats.table.live_rows?.toLocaleString('tr-TR') || 'Bilinmiyor'}`)
        console.log(`🗑️ Ölü Satır: ${dbStats.table.dead_rows?.toLocaleString('tr-TR') || 'Bilinmiyor'}`)

        if (dbStats.indexes.length > 0) {
            console.log('\n📇 En Çok Kullanılan İndeksler:')
            dbStats.indexes.slice(0, 5).forEach((idx, i) => {
                console.log(`${i + 1}. ${idx.indexname}: ${idx.scans || 0} tarama`)
            })
        }

        // Sonuç analizi
        console.log('\n🎯 Performans Değerlendirmesi:')
        const avgResponseTime = this.testResults.reduce((sum, r) => sum + r.avgTime, 0) / this.testResults.length
        
        if (avgResponseTime < 10) {
            console.log('🟢 Mükemmel: Ortalama yanıt süresi 10ms altında')
        } else if (avgResponseTime < 50) {
            console.log('🟡 İyi: Ortalama yanıt süresi kabul edilebilir seviyede')
        } else {
            console.log('🔴 Dikkat: Ortalama yanıt süresi yüksek, optimizasyon gerekli')
        }

        // Raporu dosyaya kaydet
        await this.saveReportToFile()
    }

    /**
     * RAPORU DOSYAYA KAYDET
     */
    async saveReportToFile() {
        const reportData = {
            timestamp: new Date().toISOString(),
            totalTestTime: Date.now() - this.startTime,
            testResults: this.testResults,
            databaseStats: await this.getDatabaseStats()
        }

        const fileName = `performance-test-${Date.now()}.json`
        const filePath = `./claudedocs/${fileName}`

        try {
            fs.writeFileSync(filePath, JSON.stringify(reportData, null, 2))
            console.log(`💾 Detaylı rapor kaydedildi: ${filePath}`)
        } catch (error) {
            console.error('⚠️ Rapor kaydetme hatası:', error)
        }
    }
}

// Ana test fonksiyonu
async function runPerformanceTest() {
    const monitor = new PerformanceMonitor()
    await monitor.runPerformanceTests()
}

// Eğer direkt olarak çalıştırılıyorsa test et
if (import.meta.url === `file://${process.argv[1]}`) {
    runPerformanceTest().catch(console.error)
}

export default PerformanceMonitor