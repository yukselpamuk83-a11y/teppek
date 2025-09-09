#!/usr/bin/env node

/**
 * COORDINATE ANALYSIS - Aynı koordinatlardaki ilanları analiz et
 * 
 * 15+ aynı koordinata sahip ilanları groupla ve analiz et
 */

const fs = require('fs');

function main() {
  if (process.argv.length !== 3) {
    console.log('📋 Usage: node analyze-coordinates.cjs <merged-file.json>');
    console.log('📋 Example: node analyze-coordinates.cjs adzuna-merged-49859-2025-09-09.json');
    process.exit(1);
  }

  const filename = process.argv[2];

  if (!fs.existsSync(filename)) {
    console.error(`❌ File not found: ${filename}`);
    process.exit(1);
  }

  try {
    console.log('📊 COORDINATE DUPLICATION ANALYSIS');
    console.log('=================================');
    console.log(`📄 File: ${filename}`);

    // Read jobs data
    console.log('\n📖 Reading job data...');
    const jobs = JSON.parse(fs.readFileSync(filename, 'utf8'));
    console.log(`📊 Total jobs: ${jobs.length.toLocaleString()}`);

    // Group by coordinates
    console.log('\n🗺️ Grouping by coordinates...');
    const coordinateGroups = new Map();

    jobs.forEach((job, index) => {
      if (!job.lat || !job.lon) {
        console.log(`⚠️  Job ${job.adzuna_id} missing coordinates`);
        return;
      }

      // Round coordinates to 6 decimal places for grouping
      const lat = parseFloat(job.lat).toFixed(6);
      const lon = parseFloat(job.lon).toFixed(6);
      const coordKey = `${lat},${lon}`;

      if (!coordinateGroups.has(coordKey)) {
        coordinateGroups.set(coordKey, []);
      }
      
      coordinateGroups.get(coordKey).push({
        adzuna_id: job.adzuna_id,
        title: job.title,
        company: job.company,
        city: job.city,
        country: job.country,
        lat: job.lat,
        lon: job.lon
      });
    });

    console.log(`📍 Unique coordinate locations: ${coordinateGroups.size.toLocaleString()}`);

    // Analyze duplicates
    const duplicateStats = new Map(); // count -> how many locations have that count
    const locationsByCount = new Map(); // count -> array of locations with that count
    
    coordinateGroups.forEach((jobsAtLocation, coordKey) => {
      const count = jobsAtLocation.length;
      
      // Update stats
      if (!duplicateStats.has(count)) {
        duplicateStats.set(count, 0);
        locationsByCount.set(count, []);
      }
      duplicateStats.set(count, duplicateStats.get(count) + 1);
      locationsByCount.get(count).push({
        coordinate: coordKey,
        jobs: jobsAtLocation
      });
    });

    // Show overall distribution
    console.log('\n📊 COORDINATE DUPLICATION DISTRIBUTION');
    console.log('====================================');
    
    const sortedCounts = Array.from(duplicateStats.keys()).sort((a, b) => a - b);
    let totalLocationsWithDuplicates = 0;
    let totalJobsInDuplicateLocations = 0;

    sortedCounts.forEach(count => {
      const locationCount = duplicateStats.get(count);
      const totalJobs = count * locationCount;
      
      if (count > 1) {
        totalLocationsWithDuplicates += locationCount;
        totalJobsInDuplicateLocations += totalJobs;
      }
      
      console.log(`${count.toString().padStart(3)} jobs per location: ${locationCount.toLocaleString().padStart(6)} locations (${totalJobs.toLocaleString().padStart(7)} total jobs)`);
    });

    console.log('\n📈 DUPLICATION SUMMARY');
    console.log('=====================');
    console.log(`Unique locations: ${coordinateGroups.size.toLocaleString()}`);
    console.log(`Locations with duplicates (2+ jobs): ${totalLocationsWithDuplicates.toLocaleString()}`);
    console.log(`Jobs in duplicate locations: ${totalJobsInDuplicateLocations.toLocaleString()}`);
    console.log(`Duplication rate: ${((totalJobsInDuplicateLocations / jobs.length) * 100).toFixed(1)}%`);

    // Focus on 15+ duplicates
    console.log('\n🎯 LOCATIONS WITH 15+ JOBS (HIGH CONCENTRATION)');
    console.log('===============================================');

    let totalHighConcentrationLocations = 0;
    let totalHighConcentrationJobs = 0;
    const highConcentrationDetails = [];

    for (let count = 15; count <= Math.max(...sortedCounts); count++) {
      if (duplicateStats.has(count)) {
        const locationCount = duplicateStats.get(count);
        const totalJobs = count * locationCount;
        
        totalHighConcentrationLocations += locationCount;
        totalHighConcentrationJobs += totalJobs;
        
        console.log(`📍 ${count} jobs per location: ${locationCount} locations (${totalJobs} jobs total)`);
        
        // Store details for later analysis
        locationsByCount.get(count).forEach(location => {
          highConcentrationDetails.push({
            count: count,
            coordinate: location.coordinate,
            jobs: location.jobs
          });
        });
      }
    }

    console.log(`\n📊 HIGH CONCENTRATION SUMMARY (15+ jobs per location):`);
    console.log(`Locations: ${totalHighConcentrationLocations}`);
    console.log(`Total jobs: ${totalHighConcentrationJobs.toLocaleString()}`);
    console.log(`Percentage of all jobs: ${((totalHighConcentrationJobs / jobs.length) * 100).toFixed(1)}%`);

    // Show details of highest concentration locations
    if (highConcentrationDetails.length > 0) {
      console.log('\n🔍 DETAILED ANALYSIS OF HIGH CONCENTRATION LOCATIONS');
      console.log('===================================================');

      // Sort by count descending
      highConcentrationDetails.sort((a, b) => b.count - a.count);

      // Show top 10 highest concentration locations
      const topLocations = highConcentrationDetails.slice(0, 10);
      
      topLocations.forEach((location, index) => {
        const [lat, lon] = location.coordinate.split(',');
        console.log(`\n${index + 1}. 📍 Coordinate: ${lat}, ${lon} (${location.count} jobs)`);
        
        // Sample jobs at this location
        const sampleJobs = location.jobs.slice(0, 5);
        sampleJobs.forEach(job => {
          console.log(`   • ${job.title} - ${job.company || 'Unknown'} (${job.city}, ${job.country})`);
        });
        
        if (location.jobs.length > 5) {
          console.log(`   ... and ${location.jobs.length - 5} more jobs`);
        }

        // Analyze companies at this location
        const companies = new Map();
        location.jobs.forEach(job => {
          const company = job.company || 'Unknown';
          companies.set(company, (companies.get(company) || 0) + 1);
        });

        console.log(`   Companies: ${companies.size} different companies`);
        const topCompanies = Array.from(companies.entries())
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3);
        
        topCompanies.forEach(([company, count]) => {
          console.log(`   - ${company}: ${count} jobs`);
        });
      });
    }

    // Generate distribution breakdown for 15-50 range
    console.log('\n📋 BREAKDOWN FOR COORDINATE CONCENTRATIONS (15-50)');
    console.log('=================================================');
    
    let total15Plus = 0;
    let locations15Plus = 0;
    
    for (let i = 15; i <= 50; i++) {
      if (duplicateStats.has(i)) {
        const locationCount = duplicateStats.get(i);
        const jobCount = i * locationCount;
        total15Plus += jobCount;
        locations15Plus += locationCount;
        console.log(`${i.toString().padStart(2)} jobs: ${locationCount.toString().padStart(3)} locations = ${jobCount.toString().padStart(5)} total jobs`);
      }
    }

    // Check for extreme concentrations (50+)
    const extremeCounts = sortedCounts.filter(count => count > 50);
    if (extremeCounts.length > 0) {
      console.log('\n🚨 EXTREME CONCENTRATIONS (50+ jobs per location)');
      console.log('================================================');
      
      let extremeTotal = 0;
      let extremeLocations = 0;
      
      extremeCounts.forEach(count => {
        const locationCount = duplicateStats.get(count);
        const jobCount = count * locationCount;
        extremeTotal += jobCount;
        extremeLocations += locationCount;
        console.log(`${count} jobs: ${locationCount} locations = ${jobCount} total jobs`);
      });
      
      console.log(`\nExtreme concentration summary:`);
      console.log(`Locations: ${extremeLocations}`);
      console.log(`Jobs: ${extremeTotal.toLocaleString()}`);
      console.log(`Percentage: ${((extremeTotal / jobs.length) * 100).toFixed(1)}%`);
    }

    console.log('\n✅ Coordinate analysis completed!');
    console.log('\n📋 RECOMMENDATIONS:');
    console.log('- Consider coordinate spreading for locations with 20+ jobs');
    console.log('- Investigate if high concentrations are legitimate (office buildings, etc.)');
    console.log('- May need coordinate jittering for better map visualization');

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };