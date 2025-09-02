// Test API restore with small batch first
import fs from 'fs';

async function testApiRestore() {
  try {
    console.log('📖 Reading backup file...');
    const backupPath = 'D:\\Yeni klasör\\map-data.geojson';
    const backupContent = fs.readFileSync(backupPath, 'utf8');
    const backupData = JSON.parse(backupContent);

    console.log(`📊 Total features: ${backupData.features.length}`);

    // Test with only first 100 features to see if it works
    const testData = {
      type: "FeatureCollection",
      features: backupData.features.slice(0, 100)
    };

    console.log(`🧪 Testing with first 100 features...`);

    const response = await fetch('https://teppek-rkbltcwtt-yuksels-projects-5a72b11a.vercel.app/api/restore-jobs-from-backup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        backupData: testData
      })
    });

    const result = await response.text();
    console.log('📋 API Response:');
    console.log(result);

    if (response.ok) {
      console.log('✅ Small batch test successful! Ready for full restore.');
    } else {
      console.log('❌ API test failed');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testApiRestore();