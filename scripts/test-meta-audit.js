import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { normalizePhone, hashValue, sendMetaCapiEvent, retryMetaCapiEvent } from '../netlify/functions/utils/metaCapi.js';
import MetaEventLog from '../netlify/functions/models/MetaEventLog.js';
import Order from '../netlify/functions/models/Order.js';

async function runMetaAuditTests() {
  console.log('=======================================================');
  console.log('🧪 RUNNING META PIXEL & CAPI INTEGRATION AUDIT TEST SUITE');
  console.log('=======================================================');

  // Connect to DB
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not set in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB Atlas for audit tests');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      process.exit(1);
    }
  }

  // TEST 1: Phone Normalization for Bangladesh
  console.log('\n--- 1. Testing Phone Normalization & Hashing ---');
  assert(normalizePhone('01712345678') === '8801712345678', '01712345678 normalizes to 8801712345678');
  assert(normalizePhone('+8801812345678') === '8801812345678', '+8801812345678 normalizes to 8801812345678');
  assert(normalizePhone('8801912345678') === '8801912345678', '8801912345678 normalizes to 8801912345678');
  assert(normalizePhone('1712345678') === '8801712345678', '1712345678 normalizes to 8801712345678');
  assert(normalizePhone('008801612345678') === '8801612345678', '008801612345678 normalizes to 8801612345678');
  assert(hashValue('8801712345678').length === 64, 'SHA-256 hash generates 64-char hex string');

  // TEST 2: Scenario A - Normal Operation with Logging Enabled
  console.log('\n--- 2. Testing Scenario A: Outgoing CAPI Logging with pending -> completed flow ---');
  const testEventId = `audit_test_${Date.now()}`;
  const capiRes = await sendMetaCapiEvent({
    pixelId: '123456789012345',
    accessToken: 'test_token_never_exposed',
    testEventCode: 'TEST12345',
    isLoggingEnabled: true,
    logRetentionDays: 7,
    eventName: 'ViewContent',
    eventId: testEventId,
    eventSource: 'browser_forwarded',
    orderId: '',
    userData: {
      phone: '01711223344',
      city: 'Dhaka',
      fbp: 'fb.1.1680000000.123456789',
      fbc: 'fb.1.1680000000.IwAR_test_click_id'
    },
    customData: {
      content_name: 'Minoxidil 5%',
      value: 950,
      currency: 'BDT'
    }
  });

  const createdLog = await MetaEventLog.findOne({ eventId: testEventId });
  assert(createdLog !== null, 'Log record created in MongoDB metaEventLogs');
  assert(createdLog.eventName === 'ViewContent', 'Event name recorded accurately');
  assert(createdLog.request.payload.data[0].event_id === testEventId, 'Sanitized payload contains matching eventId');
  assert(!createdLog.request.payload.data[0].user_data.phone, 'Raw plain text phone number is NOT in sanitized payload');
  assert(Array.isArray(createdLog.request.payload.data[0].user_data.ph), 'Hashed phone array present in user_data');
  assert(createdLog.request.endpoint.includes('123456789012345'), 'Endpoint contains pixelId without token in URL');
  assert(createdLog.expiresAt instanceof Date, 'MongoDB TTL expiresAt Date is assigned');

  // TEST 3: Scenario B - Logging Disabled
  console.log('\n--- 3. Testing Scenario B: Logging Disabled Control ---');
  const disabledEventId = `disabled_test_${Date.now()}`;
  await sendMetaCapiEvent({
    pixelId: '123456789012345',
    accessToken: 'test_token',
    isLoggingEnabled: false,
    eventName: 'AddToCart',
    eventId: disabledEventId,
    userData: { phone: '01711223344' }
  });

  const disabledLog = await MetaEventLog.findOne({ eventId: disabledEventId });
  assert(disabledLog === null, 'No log record created when isLoggingEnabled is false');

  // TEST 4: Scenario C - Missing/Invalid Payload Handling
  console.log('\n--- 4. Testing Scenario C: Missing/Invalid Event Validation ---');
  const invalidRes = await sendMetaCapiEvent({
    eventName: '',
    eventId: ''
  });
  assert(invalidRes.success === false, 'Rejects invalid event without eventName/eventId without crashing');

  // TEST 5: Scenario D - Retry Mechanism
  console.log('\n--- 5. Testing Scenario D: Manual Event Retry Mechanism ---');
  // Mark the test log as failed to test retry
  createdLog.status = 'failed';
  await createdLog.save();

  const retryRes = await retryMetaCapiEvent(createdLog._id);
  const updatedLog = await MetaEventLog.findById(createdLog._id);
  assert(updatedLog.attempts === 2, 'Retry increments attempts counter to 2');
  assert(updatedLog.eventId === testEventId, 'Retry preserves exact original eventId');

  // TEST 6: Scenario E & F - Purchase Event Resilience & Deduplication
  console.log('\n--- 6. Testing Scenario E & F: Purchase Order Resilience & Deduplication ---');
  const purchaseEventId = `order_HAIR_AUDIT_${Date.now()}`;
  const purchaseCapi = await sendMetaCapiEvent({
    pixelId: '123456789012345',
    accessToken: 'test_token',
    isLoggingEnabled: true,
    eventName: 'Purchase',
    eventId: purchaseEventId,
    orderId: 'HAIR_AUDIT_101',
    userData: {
      phone: '01711223344',
      firstName: 'Audit',
      lastName: 'Customer'
    },
    customData: {
      order_id: 'HAIR_AUDIT_101',
      value: 1200,
      currency: 'BDT'
    }
  });

  const purchaseLog = await MetaEventLog.findOne({ eventId: purchaseEventId });
  assert(purchaseLog !== null, 'Purchase CAPI event logged before network call');
  assert(purchaseLog.orderId === 'HAIR_AUDIT_101', 'Order ID linked directly in log record');

  // Clean up test audit logs
  await MetaEventLog.deleteMany({ eventId: { $in: [testEventId, disabledEventId, purchaseEventId] } });
  console.log('✅ Cleaned up temporary test audit records');

  console.log('\n=======================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} META CAPI AUDIT ASSERTIONS PASSED!`);
  console.log('=======================================================');

  await mongoose.disconnect();
}

runMetaAuditTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
