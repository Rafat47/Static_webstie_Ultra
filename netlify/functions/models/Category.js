import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true, index: true },
  description: { type: String, trim: true },
  image: { type: String, default: "" },
  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.models.Category || mongoose.model('Category', CategorySchema);

