import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Environment variables için dotenv kullan  
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    { auth: { persistSession: false } }
)

async function applyPerformanceIndexes() {
    console.log('🚀 Starting database performance optimization...')
    
    try {
        // Read the SQL file
        const sqlPath = path.join(process.cwd(), 'database-schema', 'performance-optimization-indexes.sql')
        const indexSQL = fs.readFileSync(sqlPath, 'utf8')
        
        // Extract individual CREATE INDEX statements
        const indexStatements = indexSQL
            .split('\n')
            .filter(line => line.trim().startsWith('CREATE'))
            .filter(line => line.includes('INDEX'))
        
        console.log(`📋 Found ${indexStatements.length} index creation statements`)
        
        let successCount = 0
        let errorCount = 0
        const errors = []
        
        // Apply each index individually for better error tracking
        for (let i = 0; i < indexStatements.length; i++) {
            const statement = indexStatements[i]
            const indexName = statement.match(/idx_\w+/)?.[0] || `index_${i + 1}`
            
            try {
                console.log(`⏳ Creating ${indexName}...`)
                
                const { data, error } = await supabase.rpc('execute_sql', {
                    sql_query: statement
                })
                
                if (error) {
                    throw error
                }
                
                console.log(`✅ ${indexName} created successfully`)
                successCount++
                
                // Small delay to avoid overwhelming the database
                await new Promise(resolve => setTimeout(resolve, 100))
                
            } catch (error) {
                console.error(`❌ Failed to create ${indexName}:`, error.message)
                errors.push({ indexName, error: error.message })
                errorCount++
                
                // Continue with other indexes even if one fails
                continue
            }
        }
        
        console.log('\n📊 Performance Index Creation Summary:')
        console.log(`✅ Successful: ${successCount}`)
        console.log(`❌ Failed: ${errorCount}`)
        
        if (errors.length > 0) {
            console.log('\n🔍 Error Details:')
            errors.forEach(({ indexName, error }) => {
                console.log(`  • ${indexName}: ${error}`)
            })
        }
        
        // Run ANALYZE to update table statistics
        console.log('\n📈 Updating table statistics...')
        try {
            await supabase.rpc('execute_sql', {
                sql_query: 'ANALYZE jobs;'
            })
            console.log('✅ Table statistics updated')
        } catch (error) {
            console.log('⚠️ Failed to update statistics:', error.message)
        }
        
        // Check index status
        console.log('\n🔍 Checking index status...')
        const { data: indexStats } = await supabase.rpc('execute_sql', {
            sql_query: `
                SELECT 
                    indexname, 
                    indexdef,
                    tablename
                FROM pg_indexes 
                WHERE tablename = 'jobs' 
                AND indexname LIKE 'idx_%'
                ORDER BY indexname;
            `
        })
        
        if (indexStats) {
            console.log(`📋 Total indexes on jobs table: ${indexStats.length}`)
            indexStats.forEach(idx => {
                console.log(`  • ${idx.indexname}`)
            })
        }
        
        console.log('\n🎉 Database performance optimization completed!')
        console.log('\n💡 Next steps:')
        console.log('  1. Monitor query performance in Supabase dashboard')
        console.log('  2. Run EXPLAIN ANALYZE on slow queries to verify index usage')
        console.log('  3. Review pg_stat_user_indexes for index utilization')
        
    } catch (error) {
        console.error('💥 Critical error in performance optimization:', error)
        process.exit(1)
    }
}

// Helper function to check current performance
async function checkCurrentPerformance() {
    console.log('📊 Checking current database performance...')
    
    try {
        // Check table size and statistics
        const { data: tableStats } = await supabase.rpc('execute_sql', {
            sql_query: `
                SELECT 
                    pg_size_pretty(pg_total_relation_size('jobs')) as table_size,
                    n_live_tup as live_rows,
                    n_dead_tup as dead_rows
                FROM pg_stat_user_tables 
                WHERE relname = 'jobs';
            `
        })
        
        if (tableStats && tableStats.length > 0) {
            const stats = tableStats[0]
            console.log(`📏 Table size: ${stats.table_size}`)
            console.log(`📊 Live rows: ${stats.live_rows?.toLocaleString()}`)
            console.log(`🗑️ Dead rows: ${stats.dead_rows?.toLocaleString()}`)
        }
        
        // Check existing indexes
        const { data: existingIndexes } = await supabase.rpc('execute_sql', {
            sql_query: `
                SELECT COUNT(*) as index_count
                FROM pg_indexes 
                WHERE tablename = 'jobs';
            `
        })
        
        if (existingIndexes && existingIndexes.length > 0) {
            console.log(`📇 Existing indexes: ${existingIndexes[0].index_count}`)
        }
        
    } catch (error) {
        console.log('⚠️ Could not check current performance:', error.message)
    }
}

// Run the optimization
async function main() {
    await checkCurrentPerformance()
    await applyPerformanceIndexes()
}

// Handle different execution contexts
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error)
}

export { applyPerformanceIndexes, checkCurrentPerformance }