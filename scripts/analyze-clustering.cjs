#!/usr/bin/env node

/**
 * CLUSTERING ANALYSIS - Yakın koordinatları analiz et
 * 
 * En yakın noktaların kaç km mesafede olduğunu ve kaç tane cluster olduğunu analiz et
 */

const fs = require('fs');

// Calculate distance between two coordinates in km
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Find clusters within a given radius
function findClusters(coordinates, maxDistanceKm = 1) {
  const clusters = [];
  const visited = new Set();
  
  coordinates.forEach((coord, index) => {
    if (visited.has(index)) return;
    
    const cluster = [index];
    visited.add(index);
    
    // Find all points within maxDistance of this point
    for (let i = index + 1; i < coordinates.length; i++) {
      if (visited.has(i)) continue;
      
      const distance = calculateDistance(
        coord.lat, coord.lon,
        coordinates[i].lat, coordinates[i].lon
      );
      
      if (distance <= maxDistanceKm) {
        cluster.push(i);
        visited.add(i);
      }
    }
    
    clusters.push({
      size: cluster.size || cluster.length,
      indices: cluster,
      center: coord,
      jobs: cluster.map(idx => coordinates[idx].jobs).flat()
    });
  });
  
  return clusters;
}

function main() {
  if (process.argv.length !== 3) {
    console.log('📋 Usage: node analyze-clustering.cjs <merged-file.json>');
    console.log('📋 Example: node analyze-clustering.cjs adzuna-merged-49859-2025-09-09.json');
    process.exit(1);
  }

  const filename = process.argv[2];

  if (!fs.existsSync(filename)) {
    console.error(`❌ File not found: ${filename}`);
    process.exit(1);
  }

  try {
    console.log('🔍 CLUSTERING ANALYSIS');
    console.log('=====================');
    console.log(`📄 File: ${filename}`);

    // Read jobs data
    console.log('\n📖 Reading job data...');
    const jobs = JSON.parse(fs.readFileSync(filename, 'utf8'));
    console.log(`📊 Total jobs: ${jobs.length.toLocaleString()}`);

    // Extract unique coordinates with job counts
    console.log('\n📍 Extracting unique coordinates...');
    const coordinateMap = new Map();

    jobs.forEach(job => {
      if (!job.lat || !job.lon) return;
      
      const lat = parseFloat(job.lat);
      const lon = parseFloat(job.lon);
      const key = `${lat.toFixed(6)},${lon.toFixed(6)}`;
      
      if (!coordinateMap.has(key)) {
        coordinateMap.set(key, {
          lat: lat,
          lon: lon,
          jobs: []
        });
      }
      
      coordinateMap.get(key).jobs.push(job);
    });

    const coordinates = Array.from(coordinateMap.values());
    console.log(`📊 Unique coordinates: ${coordinates.length.toLocaleString()}`);

    // Analyze nearest neighbors
    console.log('\n🔍 Analyzing nearest neighbor distances...');
    const nearestDistances = [];
    const veryCloseCoords = [];

    coordinates.forEach((coord1, i) => {
      let minDistance = Infinity;
      let nearestCoord = null;
      
      coordinates.forEach((coord2, j) => {
        if (i === j) return;
        
        const distance = calculateDistance(coord1.lat, coord1.lon, coord2.lat, coord2.lon);
        if (distance < minDistance) {
          minDistance = distance;
          nearestCoord = coord2;
        }
      });
      
      nearestDistances.push({
        coordinate: coord1,
        nearestDistance: minDistance,
        nearestCoord: nearestCoord,
        jobCount: coord1.jobs.length
      });
      
      // Track very close coordinates (< 100m)
      if (minDistance < 0.1) {
        veryCloseCoords.push({
          coord1: coord1,
          coord2: nearestCoord,
          distance: minDistance,
          totalJobs: coord1.jobs.length + nearestCoord.jobs.length
        });
      }
    });

    // Distance statistics
    nearestDistances.sort((a, b) => a.nearestDistance - b.nearestDistance);
    
    console.log('\n📊 NEAREST NEIGHBOR STATISTICS');
    console.log('=============================');
    console.log(`Minimum distance: ${nearestDistances[0].nearestDistance.toFixed(3)} km`);
    console.log(`Maximum distance: ${nearestDistances[nearestDistances.length - 1].nearestDistance.toFixed(3)} km`);
    console.log(`Average distance: ${(nearestDistances.reduce((sum, d) => sum + d.nearestDistance, 0) / nearestDistances.length).toFixed(3)} km`);
    console.log(`Median distance: ${nearestDistances[Math.floor(nearestDistances.length / 2)].nearestDistance.toFixed(3)} km`);

    // Distance distribution
    const distanceBuckets = {
      '0-50m': 0,
      '50-100m': 0, 
      '100-500m': 0,
      '500m-1km': 0,
      '1-5km': 0,
      '5-10km': 0,
      '10km+': 0
    };

    nearestDistances.forEach(d => {
      const dist = d.nearestDistance;
      if (dist < 0.05) distanceBuckets['0-50m']++;
      else if (dist < 0.1) distanceBuckets['50-100m']++;
      else if (dist < 0.5) distanceBuckets['100-500m']++;
      else if (dist < 1) distanceBuckets['500m-1km']++;
      else if (dist < 5) distanceBuckets['1-5km']++;
      else if (dist < 10) distanceBuckets['5-10km']++;
      else distanceBuckets['10km+']++;
    });

    console.log('\n📏 DISTANCE DISTRIBUTION');
    console.log('=======================');
    Object.entries(distanceBuckets).forEach(([range, count]) => {
      const percentage = ((count / nearestDistances.length) * 100).toFixed(1);
      console.log(`${range.padEnd(12)}: ${count.toString().padStart(5)} coordinates (${percentage}%)`);
    });

    // Show very close coordinates
    if (veryCloseCoords.length > 0) {
      console.log('\n🎯 VERY CLOSE COORDINATES (< 100m)');
      console.log('=================================');
      console.log(`Found ${veryCloseCoords.length} coordinate pairs within 100m`);
      
      veryCloseCoords
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 20)
        .forEach((pair, index) => {
          console.log(`${(index + 1).toString().padStart(2)}. Distance: ${(pair.distance * 1000).toFixed(0)}m`);
          console.log(`    Point 1: ${pair.coord1.lat.toFixed(6)}, ${pair.coord1.lon.toFixed(6)} (${pair.coord1.jobs.length} jobs)`);
          console.log(`    Point 2: ${pair.coord2.lat.toFixed(6)}, ${pair.coord2.lon.toFixed(6)} (${pair.coord2.jobs.length} jobs)`);
          console.log(`    Total jobs: ${pair.totalJobs}`);
        });
    }

    // Cluster analysis at different radii
    console.log('\n🗂️ CLUSTER ANALYSIS AT DIFFERENT RADII');
    console.log('====================================');
    
    const radii = [0.1, 0.5, 1, 2, 5]; // km
    
    radii.forEach(radius => {
      console.log(`\n📍 Clustering at ${radius}km radius:`);
      const clusters = findClusters(coordinates, radius);
      
      const singletons = clusters.filter(c => c.indices.length === 1).length;
      const smallClusters = clusters.filter(c => c.indices.length >= 2 && c.indices.length <= 5).length;
      const mediumClusters = clusters.filter(c => c.indices.length >= 6 && c.indices.length <= 20).length;
      const largeClusters = clusters.filter(c => c.indices.length > 20).length;
      
      console.log(`   Total clusters: ${clusters.length}`);
      console.log(`   Singletons (1 point): ${singletons}`);
      console.log(`   Small clusters (2-5 points): ${smallClusters}`);
      console.log(`   Medium clusters (6-20 points): ${mediumClusters}`);
      console.log(`   Large clusters (20+ points): ${largeClusters}`);
      
      // Show largest clusters
      const topClusters = clusters
        .filter(c => c.indices.length > 5)
        .sort((a, b) => b.indices.length - a.indices.length)
        .slice(0, 5);
        
      if (topClusters.length > 0) {
        console.log(`   Top clusters:`);
        topClusters.forEach((cluster, index) => {
          const totalJobs = cluster.jobs.length;
          console.log(`   ${index + 1}. ${cluster.indices.length} locations, ${totalJobs} jobs at ${cluster.center.lat.toFixed(4)}, ${cluster.center.lon.toFixed(4)}`);
        });
      }
    });

    // Recommendations
    console.log('\n💡 CLUSTERING RECOMMENDATIONS');
    console.log('=============================');
    
    const veryClose = nearestDistances.filter(d => d.nearestDistance < 0.1).length;
    const closeish = nearestDistances.filter(d => d.nearestDistance < 0.5).length;
    
    console.log(`📊 ${veryClose} coordinates (${((veryClose/nearestDistances.length)*100).toFixed(1)}%) have neighbors within 100m`);
    console.log(`📊 ${closeish} coordinates (${((closeish/nearestDistances.length)*100).toFixed(1)}%) have neighbors within 500m`);
    
    if (veryClose > coordinates.length * 0.05) {
      console.log(`\n⚠️  HIGH CLUSTERING DETECTED:`);
      console.log(`- Consider spreading coordinates < 100m apart`);
      console.log(`- Use 200-500m minimum spacing for better visualization`);
    }
    
    if (closeish > coordinates.length * 0.2) {
      console.log(`\n🎯 MODERATE CLUSTERING:`);
      console.log(`- Some coordinates are quite close (< 500m)`);
      console.log(`- This may be acceptable for city-level granularity`);
    }

    console.log('\n✅ Clustering analysis completed!');

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };