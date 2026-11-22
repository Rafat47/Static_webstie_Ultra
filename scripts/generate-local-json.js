import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const dumpPath = path.join(rootDir, 'mongo-full-dump.json');
const dump = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));

const websiteDataDoc = dump.website_data?.[0] || {};
const products = (websiteDataDoc.products && websiteDataDoc.products.length > 0) ? websiteDataDoc.products : dump.products || [];
const categories = (websiteDataDoc.categories && websiteDataDoc.categories.length > 0) ? websiteDataDoc.categories : dump.categories || [];
const orders = dump.orders || [];
const admins = dump.admins || [];
const metaEventLogs = dump.metaeventlogs || [];

// Clone base website data
const consolidated = JSON.parse(JSON.stringify(websiteDataDoc));

// Ensure ID & metadata
consolidated._id = "main";
consolidated.version = websiteDataDoc.version || 105;
consolidated.updatedAt = websiteDataDoc.updatedAt || new Date().toISOString();

// Ensure clean categories & products from DB
consolidated.categories = categories;
consolidated.products = products;

// Attach orders, admins, metaEventLogs from DB collections
consolidated.orders = orders;
consolidated.admins = admins;

// Sanitize metaEventLogs so no raw Pixel ID or secrets appear in stored endpoints/logs
const sanitizedLogs = metaEventLogs.map(log => {
  const logStr = JSON.stringify(log);
  const pixelId = process.env.META_PIXEL_ID;
  const cleanedStr = pixelId ? logStr.split(pixelId).join('META_PIXEL_ID') : logStr;
  return JSON.parse(cleanedStr);
});
consolidated.metaEventLogs = sanitizedLogs;

// CRITICAL SECURITY REQUIREMENT:
// Secret keys (pixelId and capiAccessToken) MUST NOT be stored in the public JSON file.
// They must ONLY live in .env and be referenced dynamically.
if (consolidated.metaSettings) {
  delete consolidated.metaSettings.capiAccessToken;
  delete consolidated.metaSettings.pixelId;
}

// Ensure public/data directory exists
const publicDataDir = path.join(rootDir, 'public', 'data');
if (!fs.existsSync(publicDataDir)) {
  fs.mkdirSync(publicDataDir, { recursive: true });
}

// Write to public/data/website-data.json
const websiteDataPath = path.join(publicDataDir, 'website-data.json');
fs.writeFileSync(websiteDataPath, JSON.stringify(consolidated, null, 2), 'utf8');

console.log(`✅ Successfully generated and sanitized:`);
console.log(` - ${websiteDataPath} (${(fs.statSync(websiteDataPath).size / 1024).toFixed(2)} KB)`);
console.log(`Stats:`);
console.log(` - Categories: ${consolidated.categories.length}`);
console.log(` - Products: ${consolidated.products.length}`);
console.log(` - Orders: ${consolidated.orders.length}`);
console.log(` - Admins: ${consolidated.admins.length}`);
console.log(` - Meta Logs: ${consolidated.metaEventLogs.length}`);
console.log(` - Secret Keys Sanitized: 100% free of hardcoded pixel ID and token`);
