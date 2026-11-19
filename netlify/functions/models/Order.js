import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  slug: { type: String, required: true },
  image: { type: String },
  unitPrice: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  itemTotal: { type: Number, required: true }
});

const StatusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  note: { type: String },
  updatedBy: { type: String, default: 'System' }
});

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true, index: true },
  customer: {
    fullName: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    deliveryArea: {
      type: String,
      enum: ['inside_dhaka', 'outside_dhaka'],
      required: true
    },
    address: { type: String, required: true, trim: true },
    notes: { type: String, default: "" }
  },
  items: [OrderItemSchema],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  deliveryCharge: { type: Number, required: true },
  finalTotal: { type: Number, required: true },
  paymentMethod: { type: String, default: 'COD' },
  orderStatus: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Rejected'],
    default: 'Pending',
    index: true
  },
  statusHistory: [StatusHistorySchema],
  internalNotes: { type: String, default: "" },
  attribution: {
    fbclid: { type: String, default: "" },
    utmSource: { type: String, default: "" },
    utmMedium: { type: String, default: "" },
    utmCampaign: { type: String, default: "" },
    utmContent: { type: String, default: "" },
    utmTerm: { type: String, default: "" },
    landingPage: { type: String, default: "" },
    referrer: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    ip: { type: String, default: "" }
  },
  metaEventId: { type: String, default: "" }
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
