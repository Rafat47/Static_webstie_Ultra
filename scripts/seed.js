import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

import {
  defaultWebsiteConfig,
  defaultCategories,
  defaultProducts,
  defaultWebsiteData
} from '../netlify/functions/db.js';

import WebsiteData from '../netlify/functions/models/WebsiteData.js';
import Admin from '../netlify/functions/models/Admin.js';

async function seedDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('example.mongodb.net') || uri.trim() === '') {
    console.error('❌ MONGODB_URI is not configured in .env');
    console.log('Please provide a valid MongoDB Atlas connection string in your .env file before seeding.');
    process.exit(1);
  }

  console.log('🔄 Connecting to MongoDB Atlas...');
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB.');

    // 1. Seed Consolidated Website Data Document (_id: 'main' in 'website_data')
    console.log('📝 Seeding Consolidated website_data document...');
    const existingWebsiteData = await WebsiteData.findById('main');
    if (!existingWebsiteData) {
      await WebsiteData.create(defaultWebsiteData);
      console.log('✅ website_data primary document seeded with default config, categories, and products.');
    } else {
      console.log(`ℹ️  website_data already exists (version ${existingWebsiteData.version}, ${existingWebsiteData.products?.length || 0} products). Preserving existing data.`);
    }

    // 2. Seed Admin in modular 'admins' collection
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'Admin@HairCare2026';
    console.log(`🔐 Verifying Admin account (${username})...`);

    const existingAdmin = await Admin.findOne({ username });
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      await Admin.create({
        username,
        password: hashedPassword,
        name: 'Store Administrator',
        role: 'superadmin'
      });
      console.log('✅ Admin account configured successfully.');
    } else {
      console.log(`ℹ️  Admin account "${username}" already exists. Preserving.`);
    }

    console.log('\n🎉 Database Seeding / Verification Complete!');
    console.log(`Public Content Collection: website_data (_id: "main")`);
    console.log(`Admin Authentication Collection: admins`);
    console.log(`Admin Username: ${username}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Database seeding failed:', err.message);
    process.exit(1);
  }
}

seedDatabase();
