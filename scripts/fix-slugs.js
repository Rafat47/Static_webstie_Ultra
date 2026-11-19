import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../netlify/functions/models/Product.js';

dotenv.config();

async function fixSlugs() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to Atlas...');

  const products = await Product.find();
  for (const p of products) {
    const name = p.name || p.title || 'Kirkland Minoxidil 5%';
    const slug = p.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    await Product.updateOne(
      { _id: p._id },
      {
        $set: {
          name,
          title: name,
          slug,
          stock: p.stock > 0 ? p.stock : 50
        }
      }
    );
    console.log(`Updated product: ${name} -> slug: ${slug}`);
  }

  await mongoose.disconnect();
  console.log('Finished updating products in MongoDB Atlas!');
}

fixSlugs();
