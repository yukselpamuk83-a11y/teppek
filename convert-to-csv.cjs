#!/usr/bin/env node

/**
 * JSON'dan CSV'ye çevirme scripti
 * Supabase import için
 */

const fs = require('fs');

function jsonToCsv() {
  const inputFile = 'adzuna-merged-49859-2025-09-09-spread-2025-09-09.json';
  const outputFile = inputFile.replace('.json', '.csv');

  if (!fs.existsSync(inputFile)) {
    console.error(`❌ File not found: ${inputFile}`);
    process.exit(1);
  }

  console.log('🔄 JSON TO CSV CONVERTER');
  console.log('========================');
  console.log(`Input: ${inputFile}`);
  console.log(`Output: ${outputFile}`);

  try {
    // Read JSON
    console.log('\n📖 Reading JSON...');
    const jobs = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
    console.log(`📊 Total jobs: ${jobs.length.toLocaleString()}`);

    // Define CSV headers (matching database columns)
    const headers = [
      'adzuna_id',
      'title', 
      'company',
      'country',
      'city',
      'lat',
      'lon',
      'url',
      'salary_min',
      'salary_max', 
      'currency',
      'remote',
      'source',
      'icon_type',
      'description',
      'created_at',
      'contact'
    ];

    console.log('\n🔄 Converting to CSV...');

    // Helper function to escape CSV fields
    function escapeCsvField(field) {
      if (field === null || field === undefined) {
        return '';
      }
      
      let str = String(field);
      
      // If field contains comma, newline, or quote, wrap in quotes and escape quotes
      if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
        str = str.replace(/"/g, '""'); // Escape quotes by doubling them
        return `"${str}"`;
      }
      
      return str;
    }

    // Create CSV content
    let csvContent = headers.join(',') + '\n';

    jobs.forEach((job, index) => {
      const row = headers.map(header => {
        const value = job[header];
        return escapeCsvField(value);
      });
      
      csvContent += row.join(',') + '\n';
      
      // Progress indicator
      if ((index + 1) % 10000 === 0) {
        console.log(`   📄 Processed: ${(index + 1).toLocaleString()}/${jobs.length.toLocaleString()}`);
      }
    });

    // Write CSV file
    console.log('\n💾 Writing CSV file...');
    fs.writeFileSync(outputFile, csvContent, 'utf8');

    const fileSize = (fs.statSync(outputFile).size / 1024 / 1024).toFixed(2);
    console.log(`📦 File size: ${fileSize} MB`);

    // Show sample data
    console.log('\n🔍 SAMPLE CSV DATA (first 3 rows):');
    console.log('==================================');
    const lines = csvContent.split('\n').slice(0, 4); // header + 3 data rows
    lines.forEach((line, index) => {
      if (line.trim()) {
        console.log(`${index === 0 ? 'Header' : `Row ${index}`}: ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`);
      }
    });

    console.log('\n✅ CSV conversion completed!');
    console.log(`📄 Output file: ${outputFile}`);
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Go to Supabase Dashboard');
    console.log('2. Table Editor → jobs table');
    console.log('3. Import → Upload CSV');
    console.log(`4. Select file: ${outputFile}`);

  } catch (error) {
    console.error('❌ Conversion failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  jsonToCsv();
}

module.exports = { jsonToCsv };