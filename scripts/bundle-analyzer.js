import fs from 'fs'
import path from 'path'

/**
 * Bundle analizi ve optimizasyon önerileri
 */
class BundleAnalyzer {
    constructor() {
        this.distPath = './dist/assets'
        this.unusedBytes = [
            { name: 'vendor--VmSrYX8.js', size: 32.1, type: 'vendor' },
            { name: 'leaflet-CUh7953q.js', size: 27.3, type: 'leaflet' },
            { name: 'supabase-BIT4qnKH.js', size: 25.9, type: 'supabase' },
            { name: 'ui-components-L_jkU097.js', size: 11.0, type: 'ui' },
            { name: 'index-BxaS_oxt.js', size: 7.6, type: 'main' },
            { name: 'i18n-j2xYFb1k.js', size: 7.1, type: 'i18n' },
            { name: 'MapComponent-BaGVMzhI.js', size: 2.4, type: 'component' },
            { name: 'ui-libs-CVTzVvMp.js', size: 0.178, type: 'ui-libs' }
        ]
        this.totalUnused = this.unusedBytes.reduce((sum, item) => sum + item.size, 0)
    }

    /**
     * Kullanılmayan kod analizi
     */
    analyzeUnusedCode() {
        console.log('📊 Bundle Analizi - Kullanılmayan Kodlar')
        console.log('=' + '='.repeat(50))
        
        console.log(`🔴 Toplam kullanılmayan: ${this.totalUnused.toFixed(1)} KiB`)
        console.log()
        
        // Kategorilere göre grupla
        const byCategory = this.groupByCategory()
        
        Object.entries(byCategory).forEach(([category, items]) => {
            const categoryTotal = items.reduce((sum, item) => sum + item.size, 0)
            console.log(`📁 ${category.toUpperCase()}: ${categoryTotal.toFixed(1)} KiB`)
            items.forEach(item => {
                console.log(`   • ${item.name}: ${item.size} KiB`)
            })
            console.log()
        })
        
        return byCategory
    }

    groupByCategory() {
        const categories = {}
        this.unusedBytes.forEach(item => {
            if (!categories[item.type]) {
                categories[item.type] = []
            }
            categories[item.type].push(item)
        })
        return categories
    }

    /**
     * Optimizasyon stratejileri oluştur
     */
    generateOptimizationStrategies() {
        console.log('🎯 OPTİMİZASYON STRATEJİLERİ')
        console.log('=' + '='.repeat(50))
        
        const strategies = {
            vendor: {
                impact: 'HIGH',
                savings: '15-20 KiB',
                actions: [
                    'React.lazy() kullanarak gereksiz vendor kodlarını ayır',
                    'Bundle analyzer ile React DevTools\'u production\'dan çıkar',
                    'Zustand store\'ları optimize et'
                ]
            },
            leaflet: {
                impact: 'HIGH', 
                savings: '10-15 KiB',
                actions: [
                    'Kullanılmayan Leaflet kontrolleri çıkar (Scale, Attribution)',
                    'Gereksiz handler\'ları kaldır (TouchZoom, BoxZoom)',
                    'WMS layer desteğini kaldır'
                ]
            },
            supabase: {
                impact: 'MEDIUM',
                savings: '8-12 KiB',
                actions: [
                    'Sadece kullanılan Supabase modüllerini import et',
                    'Auth provider\'ları selective import',
                    'Realtime features treeshaking'
                ]
            },
            ui: {
                impact: 'MEDIUM',
                savings: '5-8 KiB',
                actions: [
                    'Radix UI components selective import',
                    'Kullanılmayan ikonları kaldır',
                    'CSS-in-JS optimizasyonu'
                ]
            }
        }

        Object.entries(strategies).forEach(([category, strategy]) => {
            console.log(`🔥 ${category.toUpperCase()} (${strategy.impact} IMPACT)`)
            console.log(`   💾 Potansiyel kazanım: ${strategy.savings}`)
            strategy.actions.forEach((action, i) => {
                console.log(`   ${i + 1}. ${action}`)
            })
            console.log()
        })

        return strategies
    }

    /**
     * Bundle boyutlarını kontrol et
     */
    async analyzeBundleSizes() {
        try {
            if (!fs.existsSync(this.distPath)) {
                console.log('⚠️ dist/assets klasörü bulunamadı. Build çalıştır.')
                return null
            }

            const files = fs.readdirSync(this.distPath)
            const jsFiles = files.filter(f => f.endsWith('.js'))
            
            console.log('📦 Mevcut Bundle Boyutları:')
            console.log('-' + '-'.repeat(40))
            
            let totalSize = 0
            const fileStats = []

            jsFiles.forEach(file => {
                const filePath = path.join(this.distPath, file)
                const stats = fs.statSync(filePath)
                const sizeKB = (stats.size / 1024).toFixed(1)
                totalSize += stats.size
                
                fileStats.push({ name: file, size: parseFloat(sizeKB) })
                console.log(`${file}: ${sizeKB} KiB`)
            })

            console.log('-' + '-'.repeat(40))
            console.log(`Toplam JS: ${(totalSize / 1024).toFixed(1)} KiB`)
            console.log()

            return fileStats

        } catch (error) {
            console.error('❌ Bundle analizi hatası:', error.message)
            return null
        }
    }

    /**
     * Optimizasyon önerilerini implementation code olarak ver
     */
    generateImplementationCode() {
        console.log('🛠️ IMPLEMENTATION CODE')
        console.log('=' + '='.repeat(50))
        
        console.log('📝 1. Vite Config Optimizasyonu:')
        console.log(`
// vite.config.js - Aggressive tree-shaking
rollupOptions: {
  external: (id) => {
    // Leaflet unused features
    if (id.includes('leaflet') && (
      id.includes('Control.Scale') ||
      id.includes('Control.Attribution') ||
      id.includes('Handler.TouchZoom') ||
      id.includes('Handler.BoxZoom')
    )) return true
    
    // React DevTools in production
    if (id.includes('react-devtools') || id.includes('@react-devtools')) {
      return true
    }
    
    return false
  }
}`)

        console.log('\n📝 2. Selective Imports:')
        console.log(`
// ❌ Tüm modülü import etme
import * as Supabase from '@supabase/supabase-js'

// ✅ Sadece gerekli olanları import et
import { createClient } from '@supabase/supabase-js'

// ❌ Tüm UI componenti
import * as Dialog from '@radix-ui/react-dialog'

// ✅ Sadece kullanılanlar
import { Dialog, DialogContent, DialogTrigger } from '@radix-ui/react-dialog'`)

        console.log('\n📝 3. Dynamic Imports:')
        console.log(`
// Leaflet'i lazy load et
const MapComponent = lazy(() => import('./components/MapComponent'))
const LeafletMap = lazy(() => 
  import('leaflet').then(module => ({ default: module.Map }))
)`)
    }

    /**
     * Ana analiz fonksiyonu
     */
    async runCompleteAnalysis() {
        console.log('🚀 COMPLETE BUNDLE ANALYSIS')
        console.log('=' + '='.repeat(60))
        console.log()

        // 1. Kullanılmayan kod analizi
        this.analyzeUnusedCode()
        
        // 2. Mevcut boyutları kontrol et
        await this.analyzeBundleSizes()
        
        // 3. Optimizasyon stratejileri
        this.generateOptimizationStrategies()
        
        // 4. Implementation code
        this.generateImplementationCode()
        
        // 5. Özet
        console.log('📊 ÖZET')
        console.log('=' + '='.repeat(30))
        console.log(`🔴 Toplam kullanılmayan: ${this.totalUnused.toFixed(1)} KiB`)
        console.log(`💾 Potansiyel kazanım: 40-55 KiB (%35-45 küçülme)`)
        console.log(`🎯 En kritik: Vendor ve Leaflet optimizasyonları`)
        console.log()
        console.log('✅ Öncelikli adımlar:')
        console.log('  1. React lazy loading uygula')
        console.log('  2. Leaflet selective imports')
        console.log('  3. Supabase tree-shaking')
        console.log('  4. Radix UI optimizasyonu')
    }
}

// Test ve analiz çalıştır
const analyzer = new BundleAnalyzer()
analyzer.runCompleteAnalysis().catch(console.error)