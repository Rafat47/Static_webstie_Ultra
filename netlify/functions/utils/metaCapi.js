import crypto from 'crypto';
import axios from 'axios';
import MetaEventLog from '../models/MetaEventLog.js';

// Helper to hash normalized values with SHA-256
export function hashValue(value) {
  if (!value || typeof value !== 'string') return '';
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

// Bangladesh & International Phone Normalizer for Meta CAPI
export function normalizePhone(rawPhone) {
  if (!rawPhone || typeof rawPhone !== 'string') return '';
  // Strip all non-digit characters
  let digits = rawPhone.replace(/\D/g, '');

  // Strip international prefix '00'
  if (digits.startsWith('00')) {
    digits = digits.substring(2);
  }

  // Handle Bangladeshi format
  if (digits.startsWith('880')) {
    // Already in 8801XXXXXXXX format
    return digits;
  }
  if (digits.startsWith('01') && digits.length === 11) {
    // Standard BD mobile: 01XXXXXXXXX -> 8801XXXXXXXXX
    return '88' + digits;
  }
  if (digits.startsWith('1') && digits.length === 10) {
    // BD mobile without leading zero: 1XXXXXXXXX -> 8801XXXXXXXXX
    return '880' + digits;
  }

  return digits;
}

// Sanitize user data to ensure only hashed/standard fields are stored in logs
export function sanitizeUserDataForLog(userData = {}) {
  const sanitized = {};
  if (userData.em) sanitized.em = userData.em; // already hashed array
  if (userData.ph) sanitized.ph = userData.ph; // already hashed array
  if (userData.fn) sanitized.fn = userData.fn; // already hashed array
  if (userData.ln) sanitized.ln = userData.ln; // already hashed array
  if (userData.ct) sanitized.ct = userData.ct; // already hashed array
  if (userData.country) sanitized.country = userData.country; // already hashed array
  if (userData.fbp) sanitized.fbp = userData.fbp;
  if (userData.fbc) sanitized.fbc = userData.fbc;
  if (userData.client_ip_address) sanitized.client_ip_address = userData.client_ip_address;
  if (userData.client_user_agent) sanitized.client_user_agent = userData.client_user_agent;
  return sanitized;
}

// Bounded storage protection: ensure metaEventLogs collection never exceeds 5000 records
async function enforceStorageCap() {
  try {
    const MAX_LOG_RECORDS = 5000;
    const count = await MetaEventLog.countDocuments();
    if (count > MAX_LOG_RECORDS) {
      const excess = count - MAX_LOG_RECORDS;
      // Delete the oldest excess records
      const oldestLogs = await MetaEventLog.find()
        .sort({ createdAt: 1 })
        .limit(excess)
        .select('_id');
      const idsToDelete = oldestLogs.map(l => l._id);
      await MetaEventLog.deleteMany({ _id: { $in: idsToDelete } });
    }
  } catch (e) {
    // Non-blocking background safeguard
  }
}

/**
 * Dispatches a server-side Meta Conversions API (CAPI) event with:
 * - Two-step audit logging (pre-request 'pending' & post-request update)
 * - Strict SHA-256 data normalization
 * - Access token protected in Authorization headers (never in URL)
 * - Independent enable/disable logging control
 * - Response validation (checking events_received and warnings)
 */
export async function sendMetaCapiEvent({
  pixelId,
  accessToken,
  testEventCode,
  isLoggingEnabled = true,
  logRetentionDays = 7,
  eventName,
  eventId,
  eventSourceUrl,
  orderId = '',
  eventSource = 'server_order',
  userData = {},
  customData = {},
  req
}) {
  const finalPixelId = pixelId || process.env.META_PIXEL_ID;
  const finalToken = accessToken || process.env.META_CAPI_ACCESS_TOKEN;
  const finalTestCode = testEventCode || process.env.META_TEST_EVENT_CODE;

  // Validation
  if (!eventName || !eventId) {
    return { success: false, reason: 'Missing required eventName or eventId' };
  }

  if (!finalPixelId || !finalToken) {
    return { success: false, reason: 'Meta Pixel ID or CAPI Access Token not configured' };
  }

  // 1. Customer Data Normalization & SHA-256 Hashing
  const normalizedUserData = {};

  if (userData.email) {
    normalizedUserData.em = [hashValue(userData.email)];
  }
  if (userData.phone) {
    const formattedPhone = normalizePhone(userData.phone);
    if (formattedPhone) {
      normalizedUserData.ph = [hashValue(formattedPhone)];
    }
  }
  if (userData.firstName) {
    normalizedUserData.fn = [hashValue(userData.firstName)];
  }
  if (userData.lastName) {
    normalizedUserData.ln = [hashValue(userData.lastName)];
  }
  if (userData.city) {
    normalizedUserData.ct = [hashValue(userData.city)];
  }
  // Default country to Bangladesh if phone is BD or city is provided
  if (userData.country) {
    normalizedUserData.country = [hashValue(userData.country)];
  } else if (userData.phone && normalizePhone(userData.phone).startsWith('880')) {
    normalizedUserData.country = [hashValue('bd')];
  }

  // Unhashed client identifiers
  const clientIp = userData.clientIpAddress || (req && (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : req.socket?.remoteAddress));
  if (clientIp && clientIp !== '::1' && clientIp !== '127.0.0.1') {
    normalizedUserData.client_ip_address = clientIp;
  }

  const clientUserAgent = userData.clientUserAgent || (req && req.headers['user-agent']);
  if (clientUserAgent) {
    normalizedUserData.client_user_agent = clientUserAgent;
  }

  if (userData.fbp) {
    normalizedUserData.fbp = userData.fbp;
  }
  if (userData.fbc) {
    normalizedUserData.fbc = userData.fbc;
  }

  // 2. Prepare Outgoing CAPI Payload
  const eventData = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    event_source_url: eventSourceUrl || '',
    action_source: 'website',
    user_data: normalizedUserData,
    custom_data: customData
  };

  const payload = {
    data: [eventData]
  };

  if (finalTestCode) {
    payload.test_event_code = finalTestCode;
  }

  // 3. Step 1 of Logging: Pre-transmission Log (Status: 'pending')
  let logRecord = null;
  const startTime = Date.now();
  const retentionDays = Math.max(1, parseInt(logRetentionDays) || 7);
  const expiresAt = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000);

  if (isLoggingEnabled !== false) {
    try {
      const sanitizedPayload = {
        data: [
          {
            ...eventData,
            user_data: sanitizeUserDataForLog(normalizedUserData)
          }
        ]
      };
      if (finalTestCode) sanitizedPayload.test_event_code = finalTestCode;

      logRecord = await MetaEventLog.create({
        eventId,
        eventName,
        orderId: orderId || customData?.order_id || '',
        eventSource,
        eventSourceUrl: eventSourceUrl || '',
        status: 'pending',
        request: {
          endpoint: `https://graph.facebook.com/v19.0/${finalPixelId}/events`,
          method: 'POST',
          eventCount: 1,
          payload: sanitizedPayload
        },
        attempts: 1,
        expiresAt
      });
    } catch (logErr) {
      console.warn('[Meta CAPI Log Error] Failed to create pending log:', logErr.message);
    }
  }

  // 4. Send HTTP Request to Meta Graph API
  // Access token passed securely via Authorization header to prevent query param exposure
  const url = `https://graph.facebook.com/v19.0/${finalPixelId}/events`;

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${finalToken}`
      },
      timeout: 8000
    });

    const durationMs = Date.now() - startTime;
    const resData = response.data || {};
    const eventsReceived = typeof resData.events_received === 'number' ? resData.events_received : 0;
    const messages = Array.isArray(resData.messages) ? resData.messages : [];
    const fbtraceId = resData.fbtrace_id || null;

    // Determine clean delivery status
    let status = 'success';
    if (eventsReceived === 0) {
      status = 'failed';
    } else if (messages.length > 0) {
      status = 'partial_success'; // Events received, but Meta flagged diagnostic warnings
    }

    // 5. Step 2 of Logging: Post-transmission Log Update
    if (logRecord) {
      try {
        logRecord.status = status;
        logRecord.response = {
          httpStatus: response.status,
          eventsReceived,
          messages,
          fbtraceId,
          rawBody: resData
        };
        logRecord.durationMs = durationMs;
        logRecord.completedAt = new Date();
        await logRecord.save();

        // 1 in 20 requests runs storage cap check
        if (Math.random() < 0.05) {
          enforceStorageCap();
        }
      } catch (logUpdateErr) {
        console.warn('[Meta CAPI Log Error] Failed to update success log:', logUpdateErr.message);
      }
    }

    return {
      success: status !== 'failed',
      status,
      eventsReceived,
      messages,
      fbtraceId,
      logId: logRecord?._id
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const httpStatus = error.response?.status || null;
    const errorData = error.response?.data?.error || {};
    const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
    const isInvalid = httpStatus === 400;

    let finalStatus = 'failed';
    if (isTimeout) finalStatus = 'timeout';
    else if (isInvalid) finalStatus = 'invalid_payload';

    if (logRecord) {
      try {
        logRecord.status = finalStatus;
        logRecord.response = {
          httpStatus,
          eventsReceived: 0,
          messages: [],
          fbtraceId: errorData.fbtrace_id || null,
          errorCode: errorData.code || error.code || null,
          errorMessage: errorData.message || error.message
        };
        logRecord.durationMs = durationMs;
        logRecord.completedAt = new Date();
        await logRecord.save();
      } catch (logUpdateErr) {
        console.warn('[Meta CAPI Log Error] Failed to update error log:', logUpdateErr.message);
      }
    }

    console.warn(`[Meta CAPI] Dispatch error for ${eventName}:`, errorData.message || error.message);
    return {
      success: false,
      status: finalStatus,
      httpStatus,
      error: errorData.message || error.message,
      logId: logRecord?._id
    };
  }
}

/**
 * Retries a previously failed or timed-out CAPI event using its exact original eventId
 */
export async function retryMetaCapiEvent(logId) {
  const logRecord = await MetaEventLog.findById(logId);
  if (!logRecord) {
    return { success: false, message: 'Log record not found' };
  }

  const siteMeta = process.env.META_PIXEL_ID ? {
    pixelId: process.env.META_PIXEL_ID,
    accessToken: process.env.META_CAPI_ACCESS_TOKEN,
    testEventCode: process.env.META_TEST_EVENT_CODE
  } : {};

  const payload = logRecord.request?.payload;
  if (!payload || !payload.data?.[0]) {
    return { success: false, message: 'No payload stored in log record to retry' };
  }

  const eventData = payload.data[0];
  const startTime = Date.now();
  const url = `https://graph.facebook.com/v19.0/${siteMeta.pixelId || process.env.META_PIXEL_ID}/events`;

  logRecord.attempts = (logRecord.attempts || 1) + 1;
  logRecord.status = 'retrying';
  await logRecord.save();

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${siteMeta.accessToken || process.env.META_CAPI_ACCESS_TOKEN}`
      },
      timeout: 8000
    });

    const resData = response.data || {};
    const eventsReceived = typeof resData.events_received === 'number' ? resData.events_received : 0;
    const messages = Array.isArray(resData.messages) ? resData.messages : [];

    let status = 'success';
    if (eventsReceived === 0) status = 'failed';
    else if (messages.length > 0) status = 'partial_success';

    logRecord.status = status;
    logRecord.response = {
      httpStatus: response.status,
      eventsReceived,
      messages,
      fbtraceId: resData.fbtrace_id || null,
      rawBody: resData
    };
    logRecord.durationMs = Date.now() - startTime;
    logRecord.completedAt = new Date();
    await logRecord.save();

    return { success: status !== 'failed', status, logRecord };
  } catch (error) {
    const httpStatus = error.response?.status || null;
    const errorData = error.response?.data?.error || {};
    logRecord.status = 'failed';
    logRecord.response = {
      httpStatus,
      eventsReceived: 0,
      messages: [],
      fbtraceId: errorData.fbtrace_id || null,
      errorCode: errorData.code || error.code || null,
      errorMessage: errorData.message || error.message
    };
    logRecord.durationMs = Date.now() - startTime;
    logRecord.completedAt = new Date();
    await logRecord.save();

    return { success: false, status: 'failed', error: errorData.message || error.message, logRecord };
  }
}
