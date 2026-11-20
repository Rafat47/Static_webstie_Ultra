import mongoose from 'mongoose';

const MetaEventLogSchema = new mongoose.Schema({
  eventId: {
    type: String,
    required: true,
    index: true
  },
  eventName: {
    type: String,
    required: true,
    index: true
  },
  orderId: {
    type: String,
    index: true,
    default: ''
  },
  eventSource: {
    type: String,
    enum: ['server_order', 'browser_forwarded', 'manual_retry'],
    default: 'server_order'
  },
  eventSourceUrl: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'partial_success', 'failed', 'timeout', 'invalid_payload', 'retrying'],
    default: 'pending',
    index: true
  },
  request: {
    endpoint: { type: String, default: 'https://graph.facebook.com/v19.0/{pixelId}/events' },
    method: { type: String, default: 'POST' },
    eventCount: { type: Number, default: 1 },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  response: {
    httpStatus: { type: Number, default: null },
    eventsReceived: { type: Number, default: null },
    messages: { type: [String], default: [] },
    fbtraceId: { type: String, default: null },
    errorCode: { type: mongoose.Schema.Types.Mixed, default: null },
    errorMessage: { type: String, default: null },
    rawBody: { type: mongoose.Schema.Types.Mixed, default: null }
  },
  attempts: {
    type: Number,
    default: 1
  },
  durationMs: {
    type: Number,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // MongoDB TTL index: automatically deletes document when expiresAt timestamp is reached
  }
}, {
  timestamps: true
});

// Compound indexes for optimal admin query performance
MetaEventLogSchema.index({ createdAt: -1 });
MetaEventLogSchema.index({ eventName: 1, status: 1, createdAt: -1 });
MetaEventLogSchema.index({ orderId: 1, eventName: 1 });

export default mongoose.models.MetaEventLog || mongoose.model('MetaEventLog', MetaEventLogSchema);
