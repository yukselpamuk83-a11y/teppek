#!/usr/bin/env node

/**
 * MERGE JOB FILES - İki Adzuna JSON dosyasını birleştir
 * 
 * Maaşlı + Maaşsız ilanları unique ID'ler ile birleştir
 * Duplicate kontrol ve statistics
 */

const fs = require('fs');
const path = require('path');

function main() {
  if (process.argv.length !== 4) {
    console.log('📋 Usage: node merge-job-files.cjs <file1.json> <file2.json>');
    console.log('📋 Example: node merge-job-files.cjs adzuna-50k-complete-2025-09-09.json adzuna-zero-salary-50k-2025-09-09.json');
    process.exit(1);
  }

  const file1 = process.argv[2];
  const file2 = process.argv[3];

  console.log('🔄 MERGING ADZUNA JOB FILES');
  console.log('==========================');
  console.log(`📄 File 1: ${file1}`);
  console.log(`📄 File 2: ${file2}`);

  // Check if files exist
  if (!fs.existsSync(file1)) {
    console.error(`❌ File not found: ${file1}`);
    process.exit(1);
  }

  if (!fs.existsSync(file2)) {
    console.error(`❌ File not found: ${file2}`);
    process.exit(1);
  }

  try {
    // Read both files
    console.log('\n📖 Reading files...');
    const jobs1 = JSON.parse(fs.readFileSync(file1, 'utf8'));
    const jobs2 = JSON.parse(fs.readFileSync(file2, 'utf8'));

    console.log(`📊 File 1: ${jobs1.length.toLocaleString()} jobs`);
    console.log(`📊 File 2: ${jobs2.length.toLocaleString()} jobs`);

    // Merge with duplicate detection
    console.log('\n🔄 Merging with duplicate detection...');
    const mergedJobs = [];
    const seenIds = new Set();
    const duplicates = [];

    // Add jobs from first file
    for (const job of jobs1) {
      if (!seenIds.has(job.adzuna_id)) {
        seenIds.add(job.adzuna_id);
        mergedJobs.push(job);
      } else {
        duplicates.push(`Duplicate in file1: ${job.adzuna_id}`);
      }
    }

    // Add jobs from second file (check for duplicates)
    for (const job of jobs2) {
      if (!seenIds.has(job.adzuna_id)) {
        seenIds.add(job.adzuna_id);
        mergedJobs.push(job);
      } else {
        duplicates.push(`Duplicate across files: ${job.adzuna_id}`);
      }
    }

    // Statistics
    console.log('\n📊 MERGE STATISTICS');
    console.log('==================');
    console.log(`Total input jobs: ${(jobs1.length + jobs2.length).toLocaleString()}`);
    console.log(`Unique jobs: ${mergedJobs.length.toLocaleString()}`);
    console.log(`Duplicates found: ${duplicates.length.toLocaleString()}`);
    console.log(`Merge efficiency: ${((mergedJobs.length / (jobs1.length + jobs2.length)) * 100).toFixed(1)}%`);

    // Analyze by source characteristics
    const stats = {
      withSalary: 0,
      withoutSalary: 0,
      byCountry: {},
      byCurrency: {},
      withDescription: 0,
      remoteJobs: 0
    };

    mergedJobs.forEach(job => {
      // Salary analysis
      if (job.salary_min || job.salary_max) {
        stats.withSalary++;
      } else {
        stats.withoutSalary++;
      }

      // Country stats
      stats.byCountry[job.country] = (stats.byCountry[job.country] || 0) + 1;

      // Currency stats
      stats.byCurrency[job.currency] = (stats.byCurrency[job.currency] || 0) + 1;

      // Description and remote
      if (job.description) stats.withDescription++;
      if (job.remote) stats.remoteJobs++;
    });

    console.log('\n💰 SALARY BREAKDOWN');
    console.log('==================');
    console.log(`Jobs with salary: ${stats.withSalary.toLocaleString()} (${((stats.withSalary/mergedJobs.length)*100).toFixed(1)}%)`);
    console.log(`Jobs without salary: ${stats.withoutSalary.toLocaleString()} (${((stats.withoutSalary/mergedJobs.length)*100).toFixed(1)}%)`);

    console.log('\n🌍 TOP 10 COUNTRIES');
    console.log('==================');
    Object.entries(stats.byCountry)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([country, count]) => {
        console.log(`${country}: ${count.toLocaleString()}`);
      });

    console.log('\n💱 TOP 10 CURRENCIES');
    console.log('===================');
    Object.entries(stats.byCurrency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([currency, count]) => {
        console.log(`${currency}: ${count.toLocaleString()}`);
      });

    console.log('\n📋 ADDITIONAL STATS');
    console.log('==================');
    console.log(`Jobs with description: ${stats.withDescription.toLocaleString()} (${((stats.withDescription/mergedJobs.length)*100).toFixed(1)}%)`);
    console.log(`Remote jobs: ${stats.remoteJobs.toLocaleString()} (${((stats.remoteJobs/mergedJobs.length)*100).toFixed(1)}%)`);

    // Generate output filename
    const timestamp = new Date().toISOString().split('T')[0];
    const outputFile = `adzuna-merged-${mergedJobs.length}-${timestamp}.json`;

    // Save merged file
    console.log(`\n💾 Saving merged file: ${outputFile}`);
    fs.writeFileSync(outputFile, JSON.stringify(mergedJobs, null, 2), 'utf8');

    const fileSize = (fs.statSync(outputFile).size / 1024 / 1024).toFixed(2);
    console.log(`📦 File size: ${fileSize} MB`);

    // Show duplicates if any
    if (duplicates.length > 0) {
      console.log(`\n⚠️  DUPLICATES (first 10):`);
      duplicates.slice(0, 10).forEach(dup => console.log(`- ${dup}`));
      if (duplicates.length > 10) {
        console.log(`... and ${duplicates.length - 10} more`);
      }
    }

    console.log('\n✅ Merge completed successfully!');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Import merged file to database:');
    console.log(`   POST /api/import-bulk-jobs`);
    console.log(`   Body: {"filename": "${outputFile}", "clear_existing": true}`);
    console.log('2. Generate new bucket data');
    console.log('3. Test the system');

  } catch (error) {
    console.error('❌ Merge failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };