import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true, index: true },
  shortDescription: { type: String, trim: true },
  description: { type: String, trim: true },
  images: [{ type: String }],
  category: { type: String, required: true, index: true },
  regularPrice: { type: Number, required: true },
  salePrice: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  productType: {
    type: String,
    enum: ['minoxidil', 'derma_roller', 'combo', 'shampoo', 'other'],
    default: 'minoxidil'
  },
  comboItems: [
    {
      name: String,
      quantity: Number,
      description: String
    }
  ],
  badge: { type: String, default: "" },
  keyBenefits: [{ type: String }],
  specifications: [
    {
      label: String,
      value: String
    }
  ],
  carouselOrder: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
