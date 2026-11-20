import dotenv from 'dotenv';
dotenv.config();
import { connectToDatabase, defaultWebsiteConfig } from '../netlify/functions/db.js';
import WebsiteConfig from '../netlify/functions/models/WebsiteConfig.js';

async function main() {
  const db = await connectToDatabase();
  if (!db.isConnected) {
    console.log('Using memory store or DB not connected.');
    process.exit(0);
  }

  const existing = await WebsiteConfig.findById('main');
  if (existing) {
    existing.siteSettings = existing.siteSettings || {};
    existing.siteSettings.logoUrl = '/images/hair-shurokkha-logo-transparent.png';
    existing.siteSettings.logoText = 'Hair Shurokkha';
    existing.siteSettings.siteName = 'Hair Shurokkha Bangladesh';
    await existing.save();
    console.log('Updated existing WebsiteConfig with logoUrl and Hair Shurokkha branding in MongoDB Atlas.');
  } else {
    await WebsiteConfig.create({
      _id: 'main',
      ...defaultWebsiteConfig
    });
    console.log('Created main WebsiteConfig with logoUrl in MongoDB Atlas.');
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Error syncing logo in DB:', err);
  process.exit(1);
});

