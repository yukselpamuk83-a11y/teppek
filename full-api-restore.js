// Full API restore - all 20,544 records
import fs from 'fs';

async function fullApiRestore() {
  try {
    console.log('📖 Reading backup file...');
    const backupPath = 'D:\\Yeni klasör\\map-data.geojson';
    const backupContent = fs.readFileSync(backupPath, 'utf8');
    const backupData = JSON.parse(backupContent);

    console.log(`📊 Total features to restore: ${backupData.features.length}`);
    console.log('🚀 Starting FULL restore...');
    console.log('⏱️  This may take several minutes...');

    const startTime = Date.now();

    const response = await fetch('https://teppek-rkbltcwtt-yuksels-projects-5a72b11a.vercel.app/api/restore-jobs-from-backup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        backupData: backupData
      })
    });

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    console.log(`⏱️  Restore completed in ${duration} seconds`);

    const result = await response.json();
    console.log('');
    console.log('📋 Final Result:');
    console.log(`✅ Status: ${response.ok ? 'SUCCESS' : 'FAILED'}`);
    console.log(`📊 Jobs restored: ${result.summary?.jobs_restored || 0}`);
    console.log(`❌ Errors: ${result.summary?.errors || 0}`);
    
    if (result.summary?.error_details?.length > 0) {
      console.log('');
      console.log('⚠️  Error samples:');
      result.summary.error_details.slice(0, 5).forEach(error => {
        console.log(`   ${error}`);
      });
    }

    console.log('');
    console.log('🔗 Check results at: https://supabase.com/dashboard/project/fcsggaggjtxqwatimplk/database/tables/18667');

  } catch (error) {
    console.error('❌ Full restore failed:', error.message);
  }
}

fullApiRestore();