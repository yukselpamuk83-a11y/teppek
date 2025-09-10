import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    { auth: { persistSession: false } }
)

async function testDatabaseConnection() {
    console.log('🔍 Supabase bağlantısını test ediyoruz...')
    
    try {
        // 1. Basit sorgu testi
        console.log('📊 Tablo bilgilerini alıyoruz...')
        const { data: tableInfo, error: tableError } = await supabase
            .from('jobs')
            .select('count', { count: 'exact', head: true })
        
        if (tableError) {
            console.error('❌ Tablo sorgu hatası:', tableError)
            return
        }
        
        console.log(`✅ jobs tablosunda ${tableInfo} kayıt bulundu`)
        
        // 2. Örnek kayıt testi
        console.log('🔍 Örnek kayıt getiriliyor...')
        const { data: sampleJobs, error: sampleError } = await supabase
            .from('jobs')
            .select('id, title, company, lat, lon')
            .limit(3)
        
        if (sampleError) {
            console.error('❌ Örnek kayıt hatası:', sampleError)
            return
        }
        
        console.log('✅ Örnek kayıtlar:')
        sampleJobs?.forEach((job, i) => {
            console.log(`  ${i + 1}. ${job.title} - ${job.company}`)
        })
        
        // 3. Performans testi - tek kayıt
        console.log('\n⚡ Performans testi başlıyor...')
        const startTime = performance.now()
        
        const testQueries = []
        for (let i = 0; i < 10; i++) {
            const randomId = Math.floor(Math.random() * 50000) + 1
            const queryPromise = supabase
                .from('jobs')
                .select('id, title, company')
                .eq('id', randomId)
                .single()
            testQueries.push(queryPromise)
        }
        
        const results = await Promise.all(testQueries)
        const endTime = performance.now()
        const totalTime = endTime - startTime
        
        const successCount = results.filter(r => !r.error).length
        console.log(`📊 10 sorgu sonucu: ${successCount} başarılı`)
        console.log(`⏱️ Toplam süre: ${totalTime.toFixed(2)}ms`)
        console.log(`📈 Ortalama: ${(totalTime / 10).toFixed(2)}ms/sorgu`)
        
        // 4. Index durumu kontrol (eğer varsa)
        console.log('\n🔍 Index bilgilerini alıyoruz...')
        try {
            const { data: indexes, error: indexError } = await supabase.rpc('get_table_indexes', {
                table_name: 'jobs'
            })
            
            if (indexError) {
                console.log('ℹ️ Index bilgisi alınamadı (normal)')
            } else {
                console.log(`📇 Bulunan index sayısı: ${indexes?.length || 0}`)
            }
        } catch (indexErr) {
            console.log('ℹ️ Index RPC fonksiyonu bulunamadı')
        }
        
        console.log('\n🎉 Test tamamlandı!')
        
    } catch (error) {
        console.error('💥 Test sırasında hata:', error)
    }
}

async function quickPerformanceTest() {
    console.log('🚀 Hızlı Performans Testi')
    console.log('=' + '='.repeat(40))
    
    const tests = [
        {
            name: 'Tek Kayıt Lookup',
            test: async () => {
                const randomId = Math.floor(Math.random() * 50000) + 1
                const { data, error } = await supabase
                    .from('jobs')
                    .select('id, title, company')
                    .eq('id', randomId)
                    .single()
                return !error
            },
            count: 20
        },
        {
            name: 'Sayfalama',
            test: async () => {
                const { data, error } = await supabase
                    .from('jobs')
                    .select('id, title, created_at')
                    .order('created_at', { ascending: false })
                    .range(0, 49)
                return !error && data?.length > 0
            },
            count: 5
        },
        {
            name: 'Konum Arama',
            test: async () => {
                const { data, error } = await supabase
                    .from('jobs')
                    .select('id, title, lat, lon')
                    .gte('lat', 40.5)
                    .lte('lat', 41.5)
                    .gte('lon', 28.5)
                    .lte('lon', 29.5)
                    .limit(25)
                return !error
            },
            count: 10
        }
    ]
    
    for (const { name, test, count } of tests) {
        console.log(`\n⏳ ${name} testi (${count} iterasyon)...`)
        
        const times = []
        let successCount = 0
        
        for (let i = 0; i < count; i++) {
            const start = performance.now()
            const success = await test()
            const duration = performance.now() - start
            
            times.push(duration)
            if (success) successCount++
            
            if ((i + 1) % 5 === 0) {
                process.stdout.write(`${i + 1}/${count} `)
            }
        }
        
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length
        const minTime = Math.min(...times)
        const maxTime = Math.max(...times)
        
        console.log(`\n✅ ${name}:`)
        console.log(`   Başarı: ${successCount}/${count}`)
        console.log(`   Ortalama: ${avgTime.toFixed(2)}ms`)
        console.log(`   Min: ${minTime.toFixed(2)}ms | Max: ${maxTime.toFixed(2)}ms`)
    }
    
    console.log('\n🎯 Test tamamlandı!')
}

// Ana test fonksiyonu
async function main() {
    await testDatabaseConnection()
    console.log('\n' + '='.repeat(50))
    await quickPerformanceTest()
}

main().catch(console.error)