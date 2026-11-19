import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

import {
  defaultWebsiteConfig,
  defaultCategories,
  defaultProducts
} from '../netlify/functions/db.js';

import WebsiteConfig from '../netlify/functions/models/WebsiteConfig.js';
import Product from '../netlify/functions/models/Product.js';
import Category from '../netlify/functions/models/Category.js';
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

    // 1. Seed or Update Website Config
    console.log('📝 Seeding Website Configuration document...');
    await WebsiteConfig.findOneAndUpdate(
      { _id: 'main' },
      { $setOnInsert: { _id: 'main', ...defaultWebsiteConfig } },
      { upsert: true, returnDocument: 'after' }
    );
    console.log('✅ Website Configuration seeded.');

    // 2. Seed Categories
    console.log('📝 Seeding Categories...');
    for (const cat of defaultCategories) {
      await Category.findOneAndUpdate(
        { slug: cat.slug },
        { $set: cat },
        { upsert: true, returnDocument: 'after' }
      );
    }
    console.log(`✅ ${defaultCategories.length} Categories seeded.`);

    // 3. Seed Products
    console.log('📝 Seeding Products...');
    for (const prod of defaultProducts) {
      await Product.findOneAndUpdate(
        { slug: prod.slug },
        { $set: prod },
        { upsert: true, returnDocument: 'after' }
      );
    }
    console.log(`✅ ${defaultProducts.length} Products seeded.`);

    // 4. Seed Admin
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'Admin@HairCare2026';
    console.log(`🔐 Creating Admin account (${username})...`);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await Admin.findOneAndUpdate(
      { username },
      {
        $set: {
          username,
          password: hashedPassword,
          name: 'Store Administrator',
          role: 'superadmin'
        }
      },
      { upsert: true, returnDocument: 'after' }
    );
    console.log('✅ Admin account configured successfully.');

    console.log('\n🎉 Database Seeding Complete!');
    console.log(`Admin Username: ${username}`);
    console.log(`Admin Password: ${password}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Database seeding failed:', err.message);
    process.exit(1);
  }
}

seedDatabase();

