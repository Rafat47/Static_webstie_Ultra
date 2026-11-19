import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const AdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  name: { type: String, default: "Store Administrator" },
  role: { type: String, enum: ['admin', 'superadmin'], default: 'admin' },
  lastLogin: { type: Date }
}, { timestamps: true });

AdminSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

