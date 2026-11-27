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

const uri = process.env.MONGODB_URI_BUILD || process.env.MONGODB_URI || process.env.MONGODB_URI_FN;
const dbName = process.env.MONGODB_DB;
if (!dbName) {
  throw new Error('MONGODB_DB environment variable is not set');
}

if (!uri) {
  console.error('\n[BUILD FATAL ERROR] MONGODB_URI_BUILD (or MONGODB_URI) is not set!');
  console.error('The storefront build requires MongoDB access to fetch site_ui.');
  console.error('Ensure MONGODB_URI_BUILD is configured in Netlify environment variables.\n');
  process.exit(1);
}

const rootDir = path.resolve(__dirname, '..');
const schemaPath = path.join(rootDir, 'content-schema.json');
const functionDest = path.join(rootDir, 'netlify', 'functions', 'data', 'website-data.json');
const publicDataDir = path.join(rootDir, 'public', 'data');

async function buildContent() {
  console.log('===============================================================');
  console.log('🚀 Storefront Manual Content Synchronization Starting...');
  console.log('===============================================================');

  // STEP 1: Validate Schema File
  if (!fs.existsSync(schemaPath)) {
    console.error(`[BUILD FATAL ERROR] Missing schema file at: ${schemaPath}`);
    process.exit(1);
  }

  const contentSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  const validateUi = ajv.compile(contentSchema);

  // STEP 2: Connect to MongoDB Atlas first (do NOT delete existing file beforehand)
  let client;
  try {
    console.log('📡 Step 1: Connecting to MongoDB Atlas...');
    client = new MongoClient(uri, {
      connectTimeoutMS: 20000,
      serverSelectionTimeoutMS: 20000
    });
    await client.connect();
    console.log('✓ Connected to MongoDB Atlas successfully.');
  } catch (connErr) {
    console.error('\n[BUILD FATAL ERROR] Unable to connect to MongoDB Atlas!');
    console.error(`Connection error: ${connErr.message}`);
    console.error('Preserving existing local website-data.json intact.');
    process.exit(1);
  }

  try {
    // STEP 3: Fetch site_ui collection
    const db = client.db(dbName);
    const siteUiCol = db.collection('site_ui');

    console.log(`📥 Step 2: Fetching "site_ui" collection from database "${dbName}"...`);
    const doc = await siteUiCol.findOne(
      { _id: 'main' },
      { projection: { ui: 1, schemaVersion: 1, updatedAt: 1, publishedAt: 1 } }
    );

    if (!doc || !doc.ui || typeof doc.ui !== 'object' || Object.keys(doc.ui).length === 0) {
      console.error('\n[BUILD FATAL ERROR] "site_ui" document (_id: "main") is missing or empty in MongoDB!');
      process.exit(1);
    }

    console.log('✓ Fetched site_ui successfully.');

    // STEP 4: Validate fetched UI content
    console.log('🔍 Step 3: Validating fetched UI content against content-schema.json...');
    const isValid = validateUi(doc.ui);
    if (!isValid) {
      console.error('\n[BUILD FATAL ERROR] Fetched site_ui content failed schema validation:');
      console.error(JSON.stringify(validateUi.errors, null, 2));
      process.exit(1);
    }
    console.log('✓ Schema validation passed cleanly.');

    // STEP 5: Replace existing website-data.json with newly fetched data (no delete beforehand)
    console.log('💾 Step 4: Updating netlify/functions/data/website-data.json with fresh data...');
    const jsonPayload = JSON.stringify(doc.ui, null, 2);

    fs.mkdirSync(path.dirname(functionDest), { recursive: true });
    fs.writeFileSync(functionDest, jsonPayload, 'utf8');

    // Ensure public/data folder does not exist (strictly one json file in the project)
    if (fs.existsSync(publicDataDir)) {
      fs.rmSync(publicDataDir, { recursive: true, force: true });
    }

    console.log(`✓ Replaced local website-data.json with fresh MongoDB site_ui data`);
    console.log(`✓ Target: ${functionDest}`);
    console.log(`✓ Site Name: "${doc.ui.siteSettings?.siteName || ''}"`);
    console.log(`✓ Footer About Preview: "${(doc.ui.footer?.aboutText || '').slice(0, 80)}..."`);
    console.log(`✓ Categories: ${doc.ui.categories?.length || 0}, Products: ${doc.ui.products?.length || 0}`);

    console.log('===============================================================');
    console.log('🎉 Storefront website-data.json successfully synchronized from MongoDB!');
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
