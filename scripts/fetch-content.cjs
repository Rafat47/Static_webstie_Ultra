const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const { MongoClient } = require('mongodb');

// Load environment variables (supports .env locally and Netlify Build environment variables)
dotenv.config();
if (fs.existsSync(path.join(__dirname, '..', '.env'))) {
  dotenv.config({ path: path.join(__dirname, '..', '.env') });
}

const uri = process.env.MONGODB_URI_BUILD || process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'hair_shurokkha';

if (!uri) {
  console.error('\n[BUILD FATAL ERROR] MONGODB_URI_BUILD (or MONGODB_URI) is not set!');
  console.error('The storefront build requires read-only MongoDB access to fetch site_ui.');
  console.error('Ensure MONGODB_URI_BUILD is configured in Netlify environment variables (Builds scope).\n');
  process.exit(1);
}

const rootDir = path.resolve(__dirname, '..');
const schemaPath = path.join(rootDir, 'content-schema.json');
const publicDest = path.join(rootDir, 'public', 'data', 'website-data.json');
const functionDest = path.join(rootDir, 'netlify', 'functions', 'data', 'website-data.json');

async function buildContent() {
  console.log('===============================================================');
  console.log('🚀 Storefront Build-Time Content Fetcher Starting...');
  console.log('===============================================================');

  if (!fs.existsSync(schemaPath)) {
    console.error(`[BUILD FATAL ERROR] Missing schema file at: ${schemaPath}`);
    process.exit(1);
  }

  const contentSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  const validateUi = ajv.compile(contentSchema);

  let client;
  try {
    console.log('Connecting to MongoDB Atlas (read-only site_ui access)...');
    client = new MongoClient(uri, {
      connectTimeoutMS: 8000,
      serverSelectionTimeoutMS: 8000
    });
    await client.connect();
  } catch (connErr) {
    console.error('\n[BUILD FATAL ERROR] Unable to connect to MongoDB Atlas!');
    console.error(`Connection error: ${connErr.message}`);
    console.error('Aborting build safely without modifying existing public assets.\n');
    process.exit(1);
  }

  try {
    const db = client.db(dbName);
    const siteUiCol = db.collection('site_ui');

    console.log('Fetching site_ui document (_id: "main") with projection...');
    const doc = await siteUiCol.findOne(
      { _id: 'main' },
      { projection: { ui: 1, schemaVersion: 1, updatedAt: 1, publishedAt: 1 } }
    );

    if (!doc || !doc.ui || typeof doc.ui !== 'object' || Object.keys(doc.ui).length === 0) {
      console.error('\n[BUILD FATAL ERROR] site_ui document is missing or empty in database!');
      console.error('Aborting build safely without modifying existing public assets.\n');
      process.exit(1);
    }

    console.log('Validating fetched UI content against content-schema.json...');
    const isValid = validateUi(doc.ui);
    if (!isValid) {
      console.error('\n[BUILD FATAL ERROR] Fetched site_ui content failed schema validation:');
      console.error(JSON.stringify(validateUi.errors, null, 2));
      console.error('Aborting build safely without modifying existing public assets.\n');
      process.exit(1);
    }
    console.log('✓ Schema validation passed cleanly.');

    // Prepare JSON payload string
    const jsonPayload = JSON.stringify(doc.ui, null, 2);

    // Atomically write to public/data/website-data.json
    fs.mkdirSync(path.dirname(publicDest), { recursive: true });
    const publicTmp = `${publicDest}.tmp.${process.pid}.${Date.now()}`;
    fs.writeFileSync(publicTmp, jsonPayload, 'utf8');
    fs.renameSync(publicTmp, publicDest);
    console.log(`✓ Atomically updated public storefront data: ${publicDest}`);

    // Atomically write identical copy for Netlify Functions order bundle
    fs.mkdirSync(path.dirname(functionDest), { recursive: true });
    const functionTmp = `${functionDest}.tmp.${process.pid}.${Date.now()}`;
    fs.writeFileSync(functionTmp, jsonPayload, 'utf8');
    fs.renameSync(functionTmp, functionDest);
    console.log(`✓ Atomically updated function bundle data: ${functionDest}`);

    console.log('===============================================================');
    console.log('🎉 Storefront content successfully synchronized from MongoDB!');
    console.log('===============================================================');
  } catch (err) {
    console.error('\n[BUILD FATAL ERROR] Error during content synchronization:', err);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

buildContent();

