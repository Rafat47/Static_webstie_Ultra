import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  title: { type: String, trim: true }, // Backward compatibility with previous schema
  slug: { type: String, trim: true, index: true },
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
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Normalize name/title so frontend always gets .name
ProductSchema.virtual('displayName').get(function() {
  return this.name || this.title || 'Product';
});

ProductSchema.pre('save', function(next) {
  if (!this.name && this.title) {
    this.name = this.title;
  }
  if (!this.title && this.name) {
    this.title = this.name;
  }
  if (!this.slug) {
    const base = this.name || this.title || 'product';
    this.slug = base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
