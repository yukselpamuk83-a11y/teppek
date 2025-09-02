// Batch API restore - process in smaller chunks
import fs from 'fs';

async function batchApiRestore() {
  try {
    console.log('📖 Reading backup file...');
    const backupPath = 'D:\\Yeni klasör\\map-data.geojson';
    const backupContent = fs.readFileSync(backupPath, 'utf8');
    const backupData = JSON.parse(backupContent);

    const batchSize = 500; // Process 500 jobs at a time
    const features = backupData.features;
    const totalBatches = Math.ceil(features.length / batchSize);
    
    console.log(`📊 Total features: ${features.length}`);
    console.log(`📦 Processing in ${totalBatches} batches of ${batchSize}`);
    console.log('🚀 Starting batch restore...');

    let totalRestored = 0;
    let totalErrors = 0;

    for (let i = 0; i < features.length; i += batchSize) {
      const batch = features.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      
      console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} records)...`);

      const batchData = {
        type: "FeatureCollection",
        features: batch
      };

      try {
        const response = await fetch('https://teppek-rkbltcwtt-yuksels-projects-5a72b11a.vercel.app/api/restore-jobs-from-backup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            backupData: batchData
          })
        });

        if (response.ok) {
          const result = await response.json();
          const restored = result.summary?.jobs_restored || 0;
          const errors = result.summary?.errors || 0;
          
          totalRestored += restored;
          totalErrors += errors;
          
          console.log(`✅ Batch ${batchNumber}: ${restored} restored, ${errors} errors`);
        } else {
          const errorText = await response.text();
          console.log(`❌ Batch ${batchNumber} failed: ${response.status} - ${errorText.substring(0, 100)}`);
          totalErrors += batch.length;
        }

        // Small delay between batches to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (batchError) {
        console.log(`❌ Batch ${batchNumber} error: ${batchError.message}`);
        totalErrors += batch.length;
      }
    }

    console.log('');
    console.log('🎉 Batch restore completed!');
    console.log(`✅ Total restored: ${totalRestored} jobs`);
    console.log(`❌ Total errors: ${totalErrors}`);
    console.log(`📊 Success rate: ${Math.round((totalRestored / features.length) * 100)}%`);
    console.log('');
    console.log('🔗 Check results at: https://supabase.com/dashboard/project/fcsggaggjtxqwatimplk/database/tables/18667');

  } catch (error) {
    console.error('❌ Batch restore failed:', error.message);
  }
}

batchApiRestore();