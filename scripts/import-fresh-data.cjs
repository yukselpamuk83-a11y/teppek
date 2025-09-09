#!/usr/bin/env node

/**
 * FRESH DATA IMPORTER 
 * 
 * Adzuna 14-day JSON verisini Supabase'e import eder
 * Batch processing ile performanslı import
 * Progress tracking ve error handling
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Batch size (PostgreSQL performansı için)
const BATCH_SIZE = 100;

// Supabase connection
function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and SERVICE KEY required');
  }
  
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });
}

// Batch import fonksiyonu
async function importJobsBatch(supabase, jobs, batchNumber, totalBatches) {
  const startIdx = (batchNumber - 1) * BATCH_SIZE;
  const batch = jobs.slice(startIdx, startIdx + BATCH_SIZE);
  
  console.log(`📦 Batch ${batchNumber}/${totalBatches}: ${batch.length} jobs`);
  
  try {
    const { data, error } = await supabase
      .from('jobs')
      .insert(batch);
    
    if (error) {
      console.error(`❌ Batch ${batchNumber} error:`, error.message);
      return { success: false, error: error.message };
    }
    
    console.log(`✅ Batch ${batchNumber} completed successfully`);
    return { success: true, count: batch.length };
    
  } catch (error) {
    console.error(`❌ Batch ${batchNumber} exception:`, error.message);
    return { success: false, error: error.message };
  }
}

// Progress bar
function printProgress(current, total, errors = 0) {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round(percentage / 2);
  const empty = 50 - filled;
  
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  const stats = errors > 0 ? ` (${errors} errors)` : '';
  
  process.stdout.write(`\r📊 Progress: [${bar}] ${percentage}%${stats}`);
}

// Ana import fonksiyonu
async function importFreshData(jsonFilePath) {
  console.log('🎯 FRESH DATA IMPORT TO SUPABASE');
  console.log('================================');
  
  // JSON dosyasını oku
  if (!fs.existsSync(jsonFilePath)) {
    throw new Error(`JSON file not found: ${jsonFilePath}`);
  }
  
  const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
  console.log(`📄 JSON file loaded: ${jsonData.length} jobs`);
  
  // Supabase bağlantısı
  const supabase = getSupabaseClient();
  console.log('✅ Supabase connection established');
  
  // Batch hesaplaması
  const totalBatches = Math.ceil(jsonData.length / BATCH_SIZE);
  console.log(`📦 Batches: ${totalBatches} (${BATCH_SIZE} jobs per batch)`);
  console.log('');
  
  // Import istatistikleri
  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  
  const startTime = Date.now();
  
  // Batch import
  for (let batchNum = 1; batchNum <= totalBatches; batchNum++) {
    const result = await importJobsBatch(supabase, jsonData, batchNum, totalBatches);
    
    if (result.success) {
      successCount += result.count;
    } else {
      errorCount++;
      errors.push(`Batch ${batchNum}: ${result.error}`);
    }
    
    // Progress update
    printProgress(batchNum, totalBatches, errorCount);
    
    // Rate limiting (Supabase için)
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n');
  console.log('📊 IMPORT SUMMARY');
  console.log('=================');
  console.log(`Total jobs: ${jsonData.length}`);
  console.log(`Successfully imported: ${successCount}`);
  console.log(`Failed batches: ${errorCount}`);
  console.log(`Success rate: ${((successCount / jsonData.length) * 100).toFixed(1)}%`);
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`Duration: ${duration} seconds`);
  
  if (errors.length > 0) {
    console.log('\n❌ ERRORS:');
    errors.forEach(error => console.log(`   ${error}`));
  }
  
  // Final verification
  try {
    const { count } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'adzuna');
    
    console.log(`\n✅ Verification: ${count} Adzuna jobs in database`);
    
  } catch (verifyError) {
    console.log(`\n⚠️  Could not verify import: ${verifyError.message}`);
  }
  
  console.log('\n🎉 Import completed!');
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Run: curl "your-domain/api/generate-map-data"');
  console.log('2. Check optimized bucket size');
  console.log('3. Test job-details API');
  
  return {
    total: jsonData.length,
    success: successCount,
    errors: errorCount,
    duration: duration
  };
}

// CLI kullanımı
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node import-fresh-data.js <json-file>');
    console.log('Example: node import-fresh-data.js adzuna-14day-fresh-2024-12-07.json');
    process.exit(1);
  }
  
  const jsonFile = args[0];
  
  try {
    const result = await importFreshData(jsonFile);
    console.log(`\n📊 Final Result: ${result.success}/${result.total} jobs imported in ${result.duration}s`);
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n⚠️  Import interrupted by user');
  process.exit(0);
});

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { importFreshData };