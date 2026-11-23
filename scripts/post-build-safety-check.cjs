const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '..', 'dist');

if (!fs.existsSync(distDir)) {
  console.error('[SECURITY ERROR] dist directory not found! Run build first.');
  process.exit(1);
}

console.log('===============================================================');
console.log('🔒 Running Post-Build Static Output Safety Check...');
console.log('===============================================================');

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  });
  return fileList;
}

const allFiles = getAllFiles(distDir);
const sensitivePatterns = [
  /mongodb(?:\+srv)?:\/\/[^\s"']+/gi,
  /EAAB[a-zA-Z0-9_-]+/g,
  /passwordHash/gi,
  /capiAccessToken/gi,
  /autoLockoutAttempts/gi,
  /lockoutDurationMinutes/gi,
  /admin_users/gi,
  /site_admin/gi
];

let leaksFound = 0;

for (const filePath of allFiles) {
  const ext = path.extname(filePath).toLowerCase();
  if (!['.js', '.html', '.json', '.css', '.map'].includes(ext)) continue;

  const content = fs.readFileSync(filePath, 'utf8');

  // Verify website-data.json specifically
  if (filePath.endsWith('website-data.json')) {
    try {
      const parsed = JSON.parse(content);
      if (parsed.orders || parsed.admins || parsed.metaEventLogs || parsed.admin || parsed.capiAccessToken) {
        console.error(`[SECURITY VIOLATION] website-data.json contains sensitive keys!`);
        leaksFound++;
      }
    } catch (e) {
      console.error(`[SECURITY ERROR] Invalid JSON in website-data.json: ${e.message}`);
      leaksFound++;
    }
  }

  for (const pattern of sensitivePatterns) {
    const matches = content.match(pattern);
    if (matches) {
      console.error(`[SECURITY VIOLATION] Leak detected in ${path.relative(distDir, filePath)}:`);
      console.error(`  Matched sensitive pattern: ${pattern}`);
      console.error(`  Sample: ${matches[0].substring(0, 30)}...`);
      leaksFound++;
    }
  }
}

if (leaksFound > 0) {
  console.error(`\n[FATAL] Security check FAILED with ${leaksFound} leak(s)! Aborting deploy.`);
  process.exit(1);
} else {
  console.log('✓ Zero sensitive credentials, Mongo URIs, CAPI tokens, or admin keys found in static build.');
  console.log('✓ All public files verified 100% clean and safe.');
  console.log('===============================================================');
  process.exit(0);
}

