import crypto from 'crypto';
import axios from 'axios';
import { localJsonStore } from '../db.js';

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

// Helper to mask sensitive identifier for safe display/logs
export function maskIdentifier(value, prefixLen = 5, suffixLen = 4) {
  if (!value || typeof value !== 'string') return '';
  if (value.length <= prefixLen + suffixLen) return '***';
  return `${value.substring(0, prefixLen)}...${value.substring(value.length - suffixLen)}`;
}

// Mask IP address (e.g. 103.205.123.45 -> 103.205.***.***)
export function maskIp(ip) {
  if (!ip || typeof ip !== 'string') return '';
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.***.***`;
  }
  if (ip.includes(':')) {
    return `${ip.split(':')[0]}:***:***`;
  }
  return '***';
}

// Robust visitor IP extractor for Netlify Functions, reverse proxies, and local connections
export function extractClientIp(req) {
  if (!req) return '';
  const headerIp =
    req.headers?.['x-nf-client-connection-ip'] || // Official Netlify direct visitor IP
    (req.headers?.['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null) ||
    req.headers?.['client-ip'] ||
    req.headers?.['x-real-ip'] ||
    req.ip ||
    req.socket?.remoteAddress ||
    '';

  const trimmed = typeof headerIp === 'string' ? headerIp.trim() : '';
  if (trimmed === '::1' || trimmed === '127.0.0.1' || trimmed === 'localhost') {
    return '';
  }
  return trimmed;
}

// Sanitize user data to ensure only hashed/standard fields are stored in logs
export function sanitizeUserDataForLog(userData = {}) {
  const sanitized = {};
  if (userData.em) sanitized.em = userData.em; // already hashed array
  if (userData.ph) sanitized.ph = userData.ph; // already hashed array
  if (userData.fn) sanitized.fn = userData.fn; // already hashed array
  if (userData.ln) sanitized.ln = userData.ln; // already hashed array
  if (userData.ct) sanitized.ct = userData.ct; // already hashed array
  if (userData.st) sanitized.st = userData.st; // already hashed array
  if (userData.zp) sanitized.zp = userData.zp; // already hashed array
  if (userData.country) sanitized.country = userData.country; // already hashed array
  if (userData.external_id) sanitized.external_id = userData.external_id; // already hashed array
  if (userData.fbp) sanitized.fbp = userData.fbp;
  if (userData.fbc) sanitized.fbc = userData.fbc;
  if (userData.client_ip_address) sanitized.client_ip_address = userData.client_ip_address;
  if (userData.client_user_agent) sanitized.client_user_agent = userData.client_user_agent;
  return sanitized;
}

// Bounded storage protection: localJsonStore already enforces 5000 max logs
async function enforceStorageCap() {
  // Handled automatically in localJsonStore
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
  if (userData.state) {
    normalizedUserData.st = [hashValue(userData.state)];
  }
  if (userData.zip) {
    normalizedUserData.zp = [hashValue(userData.zip)];
  }
  // Default country to Bangladesh if phone is BD or city is provided
  if (userData.country) {
    normalizedUserData.country = [hashValue(userData.country)];
  } else if (userData.phone && normalizePhone(userData.phone).startsWith('880')) {
    normalizedUserData.country = [hashValue('bd')];
  }

  // Stable external_id if available (hashed as required by Meta)
  if (userData.externalId || userData.external_id) {
    const rawExternalId = String(userData.externalId || userData.external_id).trim();
    if (rawExternalId) {
      normalizedUserData.external_id = [hashValue(rawExternalId)];
    }
  }

  // Unhashed client IP address (exclude loopbacks and internal local dev IPs)
  const clientIp = (userData.clientIpAddress && userData.clientIpAddress !== '::1' && userData.clientIpAddress !== '127.0.0.1' && userData.clientIpAddress !== 'localhost')
    ? userData.clientIpAddress.trim()
    : extractClientIp(req);
  if (clientIp) {
    normalizedUserData.client_ip_address = clientIp;
  }

  // Unhashed client User-Agent
  const clientUserAgent = userData.clientUserAgent || (req && req.headers?.['user-agent']);
  if (clientUserAgent && typeof clientUserAgent === 'string' && clientUserAgent.trim().length > 0) {
    normalizedUserData.client_user_agent = clientUserAgent.trim();
  }

  // FBP: Validate and include ONLY if valid string starting with 'fb.', otherwise omit
  if (userData.fbp && typeof userData.fbp === 'string') {
    const trimmedFbp = userData.fbp.trim();
    if (trimmedFbp.startsWith('fb.') && trimmedFbp.length > 5) {
      normalizedUserData.fbp = trimmedFbp;
    }
  }

  // FBC: Validate and include ONLY if valid string starting with 'fb.', otherwise omit
  if (userData.fbc && typeof userData.fbc === 'string') {
    const trimmedFbc = userData.fbc.trim();
    if (trimmedFbc.startsWith('fb.') && trimmedFbc.length > 10) {
      normalizedUserData.fbc = trimmedFbc;
    }
  }

  // Matching Diagnostics for Verification & Audit
  const hasFbp = Boolean(normalizedUserData.fbp);
  const hasFbc = Boolean(normalizedUserData.fbc);
  const fbcSource = userData.fbcSource || (hasFbc ? 'fbc_cookie' : 'none');
  const hasIp = Boolean(normalizedUserData.client_ip_address);
  const hasUserAgent = Boolean(normalizedUserData.client_user_agent);
  const hasPhone = Boolean(normalizedUserData.ph);
  const hasEmail = Boolean(normalizedUserData.em);
  const hasCity = Boolean(normalizedUserData.ct);
  const hasCountry = Boolean(normalizedUserData.country);
  const hasExternalId = Boolean(normalizedUserData.external_id);

  const presentParameters = [];
  if (hasFbp) presentParameters.push('fbp');
  if (hasFbc) presentParameters.push('fbc');
  if (hasIp) presentParameters.push('client_ip_address');
  if (hasUserAgent) presentParameters.push('client_user_agent');
  if (hasPhone) presentParameters.push('ph');
  if (hasEmail) presentParameters.push('em');
  if (hasCity) presentParameters.push('ct');
  if (hasCountry) presentParameters.push('country');
  if (hasExternalId) presentParameters.push('external_id');

  const standardParameters = ['fbp', 'fbc', 'client_ip_address', 'client_user_agent', 'ph', 'em', 'ct', 'country'];
  const missingParameters = standardParameters.filter(p => !presentParameters.includes(p));

  const matchingDiagnostics = {
    hasFbp,
    hasFbc,
    fbcSource,
    hasIp,
    hasUserAgent,
    hasPhone,
    hasEmail,
    hasCity,
    hasCountry,
    hasExternalId,
    presentParameters,
    missingParameters
  };

  // 2. Prepare Outgoing CAPI Payload
  // Clean customData non-destructively: remove nested attribution if present
  let metaCustomData = undefined;
  if (customData && typeof customData === 'object' && !Array.isArray(customData)) {
    const { attribution, ...rest } = customData;
    if (Object.keys(rest).length > 0) {
      metaCustomData = { ...rest };
    }
  }

  const eventData = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    event_source_url: eventSourceUrl || '',
    action_source: 'website',
    user_data: normalizedUserData
  };

  // If custom_data has valid parameters after removing attribution, include it.
  // If attribution was the only property, omit custom_data entirely.
  if (metaCustomData) {
    eventData.custom_data = metaCustomData;
  }

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

      logRecord = await localJsonStore.addMetaLog({
        eventId,
        eventName,
        orderId: orderId || customData?.order_id || '',
        eventSource,
        eventSourceUrl: eventSourceUrl || '',
        status: 'pending',
        matching: matchingDiagnostics,
        request: {
          endpoint: `https://graph.facebook.com/v19.0/META_PIXEL_ID/events`,
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
  // Access token passed securely via Authorization header to prevent query param or log exposure
  const url = `https://graph.facebook.com/v19.0/${finalPixelId}/events`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${finalToken}`
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000)
    });

    const durationMs = Date.now() - startTime;
    const httpStatus = response.status;
    const httpStatusText = response.statusText;

    // Read response body stream exactly once
    let rawText = '';
    try {
      rawText = await response.text();
    } catch (readErr) {
      console.warn('[Meta CAPI] Error reading response body:', readErr.message);
    }

    let parsedBody = null;
    let responseParseStatus = 'empty';
    let parseError = null;

    if (rawText && rawText.trim().length > 0) {
      try {
        parsedBody = JSON.parse(rawText);
        responseParseStatus = 'success';
      } catch (jsonErr) {
        responseParseStatus = 'failed';
        parseError = jsonErr.message;
      }
    }

    // Extract diagnostic info from parsedBody if available
    const eventsReceived = typeof parsedBody?.events_received === 'number' ? parsedBody.events_received : 0;
    const messages = Array.isArray(parsedBody?.messages) ? parsedBody.messages : [];
    const fbtraceId = parsedBody?.fbtrace_id || parsedBody?.error?.fbtrace_id || response.headers.get('x-fb-trace-id') || null;
    const errorObj = parsedBody?.error || null;
    const errorCode = errorObj?.code || (response.ok ? null : httpStatus);
    const errorMessage = errorObj?.message || (response.ok ? null : (httpStatusText || 'HTTP Error'));

    // Determine clean delivery status
    let status = 'success';
    if (!response.ok) {
      status = httpStatus === 400 ? 'invalid_payload' : 'failed';
    } else if (eventsReceived === 0) {
      status = 'failed';
    } else if (messages.length > 0) {
      status = 'partial_success'; // Events received, but Meta flagged diagnostic warnings
    }

    // 5. Step 2 of Logging: Post-transmission Log Update
    if (logRecord) {
      try {
        logRecord.status = status;
        logRecord.response = {
          httpStatus,
          httpStatusText,
          eventsReceived,
          messages,
          fbtraceId,
          errorCode,
          errorMessage,
          rawBody: rawText,
          metaResponseBody: parsedBody,
          responseParseStatus,
          parseError
        };
        logRecord.durationMs = durationMs;
        logRecord.completedAt = new Date();
        await localJsonStore.updateMetaLog(logRecord._id, logRecord);

        // 1 in 20 requests runs storage cap check
        if (Math.random() < 0.05) {
          enforceStorageCap();
        }
      } catch (logUpdateErr) {
        console.warn('[Meta CAPI Log Error] Failed to update success log:', logUpdateErr.message);
      }
    }

    if (!response.ok) {
      console.warn(`[Meta CAPI] Dispatch HTTP error ${httpStatus} for ${eventName}:`, errorMessage);
      return {
        success: false,
        status,
        httpStatus,
        httpStatusText,
        error: errorMessage,
        response: parsedBody || rawText,
        fbtraceId,
        logId: logRecord?._id
      };
    }

    return {
      success: status !== 'failed',
      status,
      httpStatus,
      httpStatusText,
      eventsReceived,
      messages,
      fbtraceId,
      response: parsedBody,
      logId: logRecord?._id
    };
  } catch (networkError) {
    const durationMs = Date.now() - startTime;
    const isTimeout = networkError.name === 'TimeoutError' || networkError.message?.includes('timeout') || networkError.code === 'ECONNABORTED';
    const finalStatus = isTimeout ? 'timeout' : 'failed';

    if (logRecord) {
      try {
        logRecord.status = finalStatus;
        logRecord.response = {
          httpStatus: null,
          httpStatusText: networkError.name || 'NetworkError',
          eventsReceived: 0,
          messages: [],
          fbtraceId: null,
          errorCode: networkError.code || networkError.name || 'NETWORK_ERROR',
          errorMessage: networkError.message,
          rawBody: null,
          metaResponseBody: null,
          responseParseStatus: 'network_error',
          parseError: networkError.message
        };
        logRecord.durationMs = durationMs;
        logRecord.completedAt = new Date();
        await localJsonStore.updateMetaLog(logRecord._id, logRecord);
      } catch (logUpdateErr) {
        console.warn('[Meta CAPI Log Error] Failed to update error log:', logUpdateErr.message);
      }
    }

    console.warn(`[Meta CAPI] Network error for ${eventName}:`, networkError.message);
    return {
      success: false,
      status: finalStatus,
      httpStatus: null,
      error: networkError.message,
      logId: logRecord?._id
    };
  }
}

/**
 * Retries a previously failed or timed-out CAPI event using its exact original eventId
 */
export async function retryMetaCapiEvent(logId) {
  const logRecord = await localJsonStore.getMetaLogById(logId);
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

  const rawEventData = payload.data[0];
  const outgoingEventData = { ...rawEventData };

  // Sanitize nested attribution from custom_data non-destructively if present in stored retry payload
  if (outgoingEventData.custom_data && typeof outgoingEventData.custom_data === 'object' && !Array.isArray(outgoingEventData.custom_data)) {
    const { attribution, ...rest } = outgoingEventData.custom_data;
    if (Object.keys(rest).length > 0) {
      outgoingEventData.custom_data = { ...rest };
    } else {
      delete outgoingEventData.custom_data;
    }
  }

  const outgoingPayload = {
    ...payload,
    data: [outgoingEventData]
  };

  const startTime = Date.now();
  const pixelId = siteMeta.pixelId || process.env.META_PIXEL_ID;
  const token = siteMeta.accessToken || process.env.META_CAPI_ACCESS_TOKEN;
  const url = `https://graph.facebook.com/v19.0/${pixelId}/events`;

  logRecord.attempts = (logRecord.attempts || 1) + 1;
  logRecord.status = 'retrying';
  await localJsonStore.updateMetaLog(logRecord._id, logRecord);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(outgoingPayload),
      signal: AbortSignal.timeout(10000)
    });

    const durationMs = Date.now() - startTime;
    const httpStatus = response.status;
    const httpStatusText = response.statusText;

    let rawText = '';
    try {
      rawText = await response.text();
    } catch (readErr) {
      console.warn('[Meta CAPI Retry] Error reading response body:', readErr.message);
    }

    let parsedBody = null;
    let responseParseStatus = 'empty';
    let parseError = null;

    if (rawText && rawText.trim().length > 0) {
      try {
        parsedBody = JSON.parse(rawText);
        responseParseStatus = 'success';
      } catch (jsonErr) {
        responseParseStatus = 'failed';
        parseError = jsonErr.message;
      }
    }

    const eventsReceived = typeof parsedBody?.events_received === 'number' ? parsedBody.events_received : 0;
    const messages = Array.isArray(parsedBody?.messages) ? parsedBody.messages : [];
    const fbtraceId = parsedBody?.fbtrace_id || parsedBody?.error?.fbtrace_id || response.headers.get('x-fb-trace-id') || null;
    const errorObj = parsedBody?.error || null;
    const errorCode = errorObj?.code || (response.ok ? null : httpStatus);
    const errorMessage = errorObj?.message || (response.ok ? null : (httpStatusText || 'HTTP Error'));

    let status = 'success';
    if (!response.ok) {
      status = httpStatus === 400 ? 'invalid_payload' : 'failed';
    } else if (eventsReceived === 0) {
      status = 'failed';
    } else if (messages.length > 0) {
      status = 'partial_success';
    }

    logRecord.status = status;
    logRecord.response = {
      httpStatus,
      httpStatusText,
      eventsReceived,
      messages,
      fbtraceId,
      errorCode,
      errorMessage,
      rawBody: rawText,
      metaResponseBody: parsedBody,
      responseParseStatus,
      parseError
    };
    logRecord.durationMs = durationMs;
    logRecord.completedAt = new Date();
    await localJsonStore.updateMetaLog(logRecord._id, logRecord);

    return {
      success: status !== 'failed',
      status,
      httpStatus,
      httpStatusText,
      eventsReceived,
      fbtraceId,
      response: parsedBody,
      logRecord
    };
  } catch (networkError) {
    const durationMs = Date.now() - startTime;
    const isTimeout = networkError.name === 'TimeoutError' || networkError.message?.includes('timeout') || networkError.code === 'ECONNABORTED';
    const finalStatus = isTimeout ? 'timeout' : 'failed';

    logRecord.status = finalStatus;
    logRecord.response = {
      httpStatus: null,
      httpStatusText: networkError.name || 'NetworkError',
      eventsReceived: 0,
      messages: [],
      fbtraceId: null,
      errorCode: networkError.code || networkError.name || 'NETWORK_ERROR',
      errorMessage: networkError.message,
      rawBody: null,
      metaResponseBody: null,
      responseParseStatus: 'network_error',
      parseError: networkError.message
    };
    logRecord.durationMs = durationMs;
    logRecord.completedAt = new Date();
    await localJsonStore.updateMetaLog(logRecord._id, logRecord);

    return { success: false, status: finalStatus, error: networkError.message, logRecord };
  }
}
