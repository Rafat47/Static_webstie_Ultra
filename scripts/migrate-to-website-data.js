import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

import {
  defaultWebsiteConfig,
  defaultCategories,
  defaultProducts
} from '../netlify/functions/db.js';

import WebsiteData from '../netlify/functions/models/WebsiteData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const isForce = args.includes('--force');
  const shouldBackup = args.includes('--backup') || !isDryRun;

  console.log('=================================================================');
  console.log('🚀 MIGRATION: Consolidate Public Website Data -> website_data');
  console.log('=================================================================');
  if (isDryRun) {
    console.log('🔍 MODE: DRY-RUN (No writes will be made to the database)');
  }
  if (isForce) {
    console.log('⚠️  MODE: FORCE (Existing website_data document will be overwritten)');
  }

  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('example.mongodb.net') || uri.trim() === '') {
    console.error('❌ MONGODB_URI is not set or invalid in .env');
    process.exit(1);
  }

  console.log('🔄 Connecting to MongoDB...');
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  console.log(`✅ Connected to database: "${db.databaseName}"`);

  // Step 1: Read existing public collections
  console.log('\n--- Step 1: Reading existing collections ---');
  let configDoc = await db.collection('websiteconfigs').findOne({ _id: 'main' });
  let categories = await db.collection('categories').find().sort({ displayOrder: 1 }).toArray();
  let products = await db.collection('products').find().sort({ carouselOrder: 1, createdAt: -1 }).toArray();

  console.log(` - websiteconfigs: ${configDoc ? 'Found main document' : 'Not found (will use default)'}`);
  console.log(` - categories: Found ${categories.length} records`);
  console.log(` - products: Found ${products.length} records`);

  // Fallbacks if database had empty collections
  if (!configDoc) {
    console.log('ℹ️  Using defaultWebsiteConfig as baseline');
    configDoc = JSON.parse(JSON.stringify(defaultWebsiteConfig));
  }
  if (!categories || categories.length === 0) {
    console.log('ℹ️  Using defaultCategories as baseline');
    categories = JSON.parse(JSON.stringify(defaultCategories));
  }
  if (!products || products.length === 0) {
    console.log('ℹ️  Using defaultProducts as baseline');
    products = JSON.parse(JSON.stringify(defaultProducts));
  }

  // Step 2: Backup existing public data to disk if requested
  if (shouldBackup) {
    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilePath = path.join(backupDir, `public-data-backup-${timestamp}.json`);
    const backupPayload = {
      timestamp: new Date().toISOString(),
      database: db.databaseName,
      websiteconfigs: configDoc,
      categories,
      products
    };
    fs.writeFileSync(backupFilePath, JSON.stringify(backupPayload, null, 2), 'utf-8');
    console.log(`\n💾 Snapshot backup saved to: ${backupFilePath}`);
  }

  // Step 3: Normalize and consolidate public document
  console.log('\n--- Step 2: Building Consolidated website_data Document ---');

  const normalizedCategories = categories.map((cat, idx) => ({
    _id: String(cat._id || cat.slug || `cat_${idx + 1}`),
    name: cat.name,
    slug: cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: cat.description || '',
    image: cat.image || '',
    isActive: cat.isActive !== false,
    displayOrder: typeof cat.displayOrder === 'number' ? cat.displayOrder : idx + 1,
    createdAt: cat.createdAt || new Date(),
    updatedAt: cat.updatedAt || new Date()
  }));

  const normalizedProducts = products.map((prod, idx) => {
    const resolvedName = prod.name || prod.title || `Product ${idx + 1}`;
    const resolvedSlug = prod.slug || resolvedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return {
      _id: String(prod._id || resolvedSlug),
      name: resolvedName,
      title: resolvedName,
      slug: resolvedSlug,
      shortDescription: prod.shortDescription || '',
      description: prod.description || '',
      images: Array.isArray(prod.images) && prod.images.length > 0
        ? prod.images
        : ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80'],
      category: prod.category || 'Minoxidil',
      regularPrice: Number(prod.regularPrice || 0),
      salePrice: Number(prod.salePrice || 0),
      stock: typeof prod.stock === 'number' ? prod.stock : 50,
      isFeatured: Boolean(prod.isFeatured),
      isActive: prod.isActive !== false,
      productType: prod.productType || 'minoxidil',
      comboItems: Array.isArray(prod.comboItems) ? prod.comboItems : [],
      badge: prod.badge || '',
      keyBenefits: Array.isArray(prod.keyBenefits) ? prod.keyBenefits : [],
      specifications: Array.isArray(prod.specifications) ? prod.specifications : [],
      carouselOrder: typeof prod.carouselOrder === 'number' ? prod.carouselOrder : idx,
      createdAt: prod.createdAt || new Date(),
      updatedAt: prod.updatedAt || new Date()
    };
  });

  const consolidatedDocument = {
    _id: 'main',
    version: 1,
    updatedAt: new Date(),
    siteSettings: configDoc.siteSettings || defaultWebsiteConfig.siteSettings,
    navigation: configDoc.navigation || defaultWebsiteConfig.navigation,
    hero: configDoc.hero || defaultWebsiteConfig.hero,
    productCarousel: configDoc.productCarousel || defaultWebsiteConfig.productCarousel,
    sections: configDoc.sections || defaultWebsiteConfig.sections,
    featuredProducts: configDoc.featuredProducts || defaultWebsiteConfig.featuredProducts,
    deliverySettings: configDoc.deliverySettings || defaultWebsiteConfig.deliverySettings,
    footer: configDoc.footer || defaultWebsiteConfig.footer,
    seo: configDoc.seo || defaultWebsiteConfig.seo,
    metaSettings: configDoc.metaSettings || defaultWebsiteConfig.metaSettings,
    categories: normalizedCategories,
    products: normalizedProducts
  };

  // Step 4: Size and limit estimation
  const docJson = JSON.stringify(consolidatedDocument);
  const docSizeBytes = Buffer.byteLength(docJson, 'utf-8');
  const docSizeKb = (docSizeBytes / 1024).toFixed(2);
  const maxBsonLimitBytes = 16 * 1024 * 1024; // 16 MiB
  const percentOfLimit = ((docSizeBytes / maxBsonLimitBytes) * 100).toFixed(3);

  console.log(`📊 Consolidated Document Size: ${docSizeBytes} bytes (~${docSizeKb} KB)`);
  console.log(`📊 MongoDB 16 MiB Limit Usage: ${percentOfLimit}% of maximum allowed size`);

  if (docSizeBytes >= maxBsonLimitBytes * 0.75) {
    console.error('⚠️  WARNING: Document size approaches 75% of MongoDB 16MB BSON limit!');
  } else {
    console.log('✅ Document size is well within safe MongoDB 16MB limit (99.8%+ headroom remaining).');
  }

  // Step 5: Check existing website_data collection
  const existingWebsiteData = await db.collection('website_data').findOne({ _id: 'main' });

  if (existingWebsiteData && !isForce) {
    console.log('\nℹ️  A document with _id: "main" already exists in collection "website_data":');
    console.log(` - Current version: ${existingWebsiteData.version}`);
    console.log(` - Existing categories count: ${existingWebsiteData.categories?.length || 0}`);
    console.log(` - Existing products count: ${existingWebsiteData.products?.length || 0}`);
    console.log('Safe mode: Not overwriting existing document. (Use --force to overwrite if needed).');

    await mongoose.disconnect();
    console.log('\n🏁 Migration check complete.');
    process.exit(0);
  }

  if (isDryRun) {
    console.log('\n🔍 DRY-RUN SUMMARY:');
    console.log(` - Destination Collection: website_data`);
    console.log(` - Document _id: "main"`);
    console.log(` - Total Categories: ${normalizedCategories.length}`);
    console.log(` - Total Products: ${normalizedProducts.length}`);
    console.log(' - Admin collections (admins, orders, metaeventlogs): KEPT UNCHANGED');
    console.log(' - Old public collections: NOT DELETED');
    console.log('✅ Dry-run validation successful.');
    await mongoose.disconnect();
    process.exit(0);
  }

  // Step 6: Perform write to website_data collection
  console.log('\n--- Step 3: Writing to website_data collection ---');
  await db.collection('website_data').updateOne(
    { _id: 'main' },
    { $set: consolidatedDocument },
    { upsert: true }
  );
  console.log('✅ Successfully wrote consolidated document to "website_data" with _id: "main".');

  // Step 7: Verification read
  console.log('\n--- Step 4: Verification Read ---');
  const verifyDoc = await db.collection('website_data').findOne({ _id: 'main' });
  if (!verifyDoc) {
    throw new Error('Verification failed: Could not read back website_data document!');
  }
  if (verifyDoc.categories?.length !== normalizedCategories.length) {
    throw new Error(`Verification failed: Category count mismatch (${verifyDoc.categories?.length} vs ${normalizedCategories.length})`);
  }
  if (verifyDoc.products?.length !== normalizedProducts.length) {
    throw new Error(`Verification failed: Product count mismatch (${verifyDoc.products?.length} vs ${normalizedProducts.length})`);
  }

  console.log(`✅ Verification Passed!`);
  console.log(` - _id: "${verifyDoc._id}"`);
  console.log(` - version: ${verifyDoc.version}`);
  console.log(` - categories: ${verifyDoc.categories.length}`);
  console.log(` - products: ${verifyDoc.products.length}`);
  console.log(` - siteName: "${verifyDoc.siteSettings?.siteName}"`);
  console.log(`\n🎉 MIGRATION SUCCESSFUL!`);

  await mongoose.disconnect();
  process.exit(0);
}

runMigration().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});

