#!/usr/bin/env node

/**
 * COORDINATE SPREADING - Aynı koordinatlardaki ilanları spread et
 * 
 * 15+ ilan olan koordinatları random spread ile dağıt
 * Map görüntüsünü iyileştir
 */

const fs = require('fs');

// Random distribution in 1-10km radius
function generateRandomOffset(index, total, radiusKm = 5) {
  // Pure random distribution within radius
  const angle = Math.random() * 2 * Math.PI; // Completely random angle
  const minRadius = 1; // Minimum 1km from center
  const maxRadius = radiusKm; // Maximum radius
  
  // Random distance between min and max radius
  const distance = minRadius + Math.random() * (maxRadius - minRadius);
  
  // Convert km to degrees (approximate)
  const latOffset = (distance * Math.cos(angle)) / 111; // 1 degree lat ≈ 111km
  const lonOffset = (distance * Math.sin(angle)) / (111 * Math.cos(Math.PI/180 * 45)); // adjust for longitude
  
  return { latOffset, lonOffset };
}

function main() {
  if (process.argv.length < 3) {
    console.log('📋 Usage: node spread-coordinates.cjs <input-file.json> [min-jobs-to-spread]');
    console.log('📋 Example: node spread-coordinates.cjs adzuna-merged-49859-2025-09-09.json 15');
    process.exit(1);
  }

  const inputFile = process.argv[2];
  const minJobsToSpread = parseInt(process.argv[3] || '15'); // 15+ jobs threshold

  if (!fs.existsSync(inputFile)) {
    console.error(`❌ File not found: ${inputFile}`);
    process.exit(1);
  }

  try {
    console.log('🗺️ COORDINATE SPREADING TOOL');
    console.log('=============================');
    console.log(`📄 Input: ${inputFile}`);
    console.log(`🎯 Spreading locations with ${minJobsToSpread}+ jobs`);

    // Read and parse data
    console.log('\n📖 Reading job data...');
    const jobs = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
    console.log(`📊 Total jobs: ${jobs.length.toLocaleString()}`);

    // Group by coordinates
    console.log('\n🗂️ Grouping by coordinates...');
    const coordinateGroups = new Map();

    jobs.forEach(job => {
      if (!job.lat || !job.lon) return;
      
      const lat = parseFloat(job.lat).toFixed(6);
      const lon = parseFloat(job.lon).toFixed(6);
      const coordKey = `${lat},${lon}`;

      if (!coordinateGroups.has(coordKey)) {
        coordinateGroups.set(coordKey, []);
      }
      
      coordinateGroups.get(coordKey).push(job);
    });

    // Find locations that need spreading
    const locationsToSpread = [];
    coordinateGroups.forEach((jobsAtLocation, coordKey) => {
      if (jobsAtLocation.length >= minJobsToSpread) {
        locationsToSpread.push({
          coordinate: coordKey,
          jobs: jobsAtLocation,
          count: jobsAtLocation.length
        });
      }
    });

    console.log(`📍 Locations needing spread: ${locationsToSpread.length}`);
    console.log(`📋 Jobs to spread: ${locationsToSpread.reduce((sum, loc) => sum + loc.count, 0).toLocaleString()}`);

    // Spread coordinates
    console.log('\n🎯 Applying coordinate spreading...');
    let totalSpread = 0;
    
    locationsToSpread.forEach(location => {
      const [baseLat, baseLon] = location.coordinate.split(',').map(parseFloat);
      
      console.log(`   📍 Spreading ${location.count} jobs at ${baseLat.toFixed(4)}, ${baseLon.toFixed(4)}`);
      
      // Random spread in 1-10km radius based on job count
      let spreadRadius = 5; // Default 5km radius
      if (location.count > 200) spreadRadius = 10;  // 10km for very large concentrations
      else if (location.count > 100) spreadRadius = 8;   // 8km for large concentrations  
      else if (location.count > 50) spreadRadius = 6;    // 6km for medium concentrations
      else spreadRadius = 5;  // 5km for smaller concentrations (15-50 jobs)
      
      location.jobs.forEach((job, index) => {
        if (index === 0) {
          // Keep first job at original location
          return;
        }
        
        const offset = generateRandomOffset(index - 1, location.count - 1, spreadRadius);
        
        // Apply random offset - distribute in 1-10km radius
        job.lat = parseFloat((baseLat + offset.latOffset).toFixed(6));
        job.lon = parseFloat((baseLon + offset.lonOffset).toFixed(6));
        
        // Safety check - ensure we don't move too far (max 15km)
        const maxDistance = 0.135; // ~15km max in degrees as safety
        if (Math.abs(job.lat - baseLat) > maxDistance) {
          job.lat = baseLat + (job.lat > baseLat ? maxDistance : -maxDistance);
        }
        if (Math.abs(job.lon - baseLon) > maxDistance) {
          job.lon = baseLon + (job.lon > baseLon ? maxDistance : -maxDistance);
        }
        
        totalSpread++;
      });
    });

    console.log(`✅ Spread ${totalSpread.toLocaleString()} job coordinates`);

    // Verify spreading worked
    console.log('\n🔍 Verifying spread results...');
    const newGroups = new Map();
    jobs.forEach(job => {
      if (!job.lat || !job.lon) return;
      
      const lat = parseFloat(job.lat).toFixed(6);
      const lon = parseFloat(job.lon).toFixed(6);
      const coordKey = `${lat},${lon}`;

      if (!newGroups.has(coordKey)) {
        newGroups.set(coordKey, 0);
      }
      newGroups.set(coordKey, newGroups.get(coordKey) + 1);
    });

    // Count locations with high concentrations after spreading
    let highConcentrationAfter = 0;
    newGroups.forEach(count => {
      if (count >= minJobsToSpread) {
        highConcentrationAfter++;
      }
    });

    console.log(`📊 High concentration locations before: ${locationsToSpread.length}`);
    console.log(`📊 High concentration locations after: ${highConcentrationAfter}`);
    console.log(`📈 Improvement: ${((locationsToSpread.length - highConcentrationAfter) / locationsToSpread.length * 100).toFixed(1)}%`);

    // Generate output filename
    const timestamp = new Date().toISOString().split('T')[0];
    const outputFile = inputFile.replace('.json', `-spread-${timestamp}.json`);

    // Save spread data
    console.log(`\n💾 Saving spread data: ${outputFile}`);
    fs.writeFileSync(outputFile, JSON.stringify(jobs, null, 2), 'utf8');

    const fileSize = (fs.statSync(outputFile).size / 1024 / 1024).toFixed(2);
    console.log(`📦 File size: ${fileSize} MB`);

    // Show spreading statistics
    console.log('\n📊 SPREADING STATISTICS');
    console.log('======================');
    console.log(`Jobs spread: ${totalSpread.toLocaleString()}`);
    console.log(`Percentage spread: ${((totalSpread / jobs.length) * 100).toFixed(1)}%`);
    console.log(`Locations spread: ${locationsToSpread.length}`);
    
    // Show top locations that were spread
    console.log('\n🎯 TOP 10 LOCATIONS THAT WERE SPREAD');
    console.log('===================================');
    
    locationsToSpread
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .forEach((location, index) => {
        const [lat, lon] = location.coordinate.split(',');
        console.log(`${(index + 1).toString().padStart(2)}. ${lat}, ${lon}: ${location.count} jobs spread`);
        
        // Show sample job titles
        const sampleTitles = location.jobs.slice(0, 3).map(job => job.title);
        console.log(`    Sample: ${sampleTitles.join(' | ')}`);
      });

    console.log('\n✅ Coordinate spreading completed successfully!');
    console.log('\n📋 NEXT STEPS:');
    console.log(`1. Use the spread file: ${outputFile}`);
    console.log('2. Import to database for better map visualization');
    console.log('3. Jobs are now distributed in realistic clusters');
    console.log('4. Map markers will no longer overlap excessively');

  } catch (error) {
    console.error('❌ Spreading failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };