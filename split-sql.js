// Split large SQL file into 10 smaller parts
import fs from 'fs';

const sqlFilePath = 'C:\\Users\\seher\\Desktop\\geoo\\restore-jobs.sql';
const outputDir = 'C:\\Users\\seher\\Desktop\\geoo\\sql-parts\\';

// Create output directory
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('📖 Reading SQL file...');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// Split by INSERT statements
const lines = sqlContent.split('\n');
const insertStartLines = [];
const headerLines = [];
let isHeader = true;

// Find INSERT statement positions
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.startsWith('INSERT INTO jobs')) {
    insertStartLines.push(i);
    isHeader = false;
  } else if (isHeader && !line.startsWith('--') && line.trim()) {
    headerLines.push(line);
  }
}

console.log(`📊 Found ${insertStartLines.length} INSERT statements`);

// Split into 10 parts
const partsCount = 10;
const statementsPerPart = Math.ceil(insertStartLines.length / partsCount);

for (let part = 0; part < partsCount; part++) {
  const startIdx = part * statementsPerPart;
  const endIdx = Math.min((part + 1) * statementsPerPart, insertStartLines.length);
  
  if (startIdx >= insertStartLines.length) break;
  
  console.log(`📝 Creating part ${part + 1}: statements ${startIdx + 1}-${endIdx}`);
  
  let partContent = [];
  
  // Add header
  partContent.push(`-- Restore jobs from backup - Part ${part + 1}/${partsCount}`);
  partContent.push(`-- Statements ${startIdx + 1}-${endIdx}`);
  partContent.push('-- Generated on: ' + new Date().toISOString());
  partContent.push('');
  
  // Add INSERT statements for this part
  for (let i = startIdx; i < endIdx; i++) {
    if (i >= insertStartLines.length) break;
    
    const insertStartLine = insertStartLines[i];
    let insertEndLine;
    
    // Find end of this INSERT statement
    if (i + 1 < insertStartLines.length) {
      insertEndLine = insertStartLines[i + 1];
    } else {
      // Last statement, find by looking for the verification query
      for (let j = insertStartLine; j < lines.length; j++) {
        if (lines[j].startsWith('-- Verify the restore') || 
            lines[j].startsWith('SELECT COUNT(*)')) {
          insertEndLine = j;
          break;
        }
      }
      if (!insertEndLine) insertEndLine = lines.length;
    }
    
    // Extract the INSERT statement
    const insertLines = lines.slice(insertStartLine, insertEndLine);
    partContent.push(...insertLines);
    partContent.push(''); // Add blank line between statements
  }
  
  // Add verification query only to the last part
  if (part === partsCount - 1) {
    partContent.push('-- Verify the restore');
    partContent.push('SELECT COUNT(*) as total_jobs, source FROM jobs GROUP BY source;');
  }
  
  // Write part file
  const partFileName = `restore-jobs-part-${String(part + 1).padStart(2, '0')}.sql`;
  const partFilePath = outputDir + partFileName;
  
  fs.writeFileSync(partFilePath, partContent.join('\n'), 'utf8');
  
  const fileSize = Math.round(fs.statSync(partFilePath).size / 1024 / 1024 * 100) / 100;
  console.log(`✅ Part ${part + 1} created: ${partFileName} (${fileSize} MB)`);
}

console.log('');
console.log('🎉 SQL splitting completed!');
console.log(`📁 Files created in: ${outputDir}`);
console.log('');
console.log('📋 Next steps:');
console.log('1. Open each part file in order (part-01, part-02, etc.)');
console.log('2. Copy and paste into Supabase SQL Editor');
console.log('3. Execute each part sequentially');
console.log('4. Each part has "ON CONFLICT DO NOTHING" - safe to run multiple times');
console.log('');
console.log('🔗 Supabase SQL Editor: https://supabase.com/dashboard/project/fcsggaggjtxqwatimplk/sql');