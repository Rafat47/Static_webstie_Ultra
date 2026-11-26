import crypto from 'crypto';
import axios from 'axios';
import { getDb, getMetaCredentials } from './mongo.js';
import bundledData from '../data/website-data.json' with { type: 'json' };

// Meta Graph API Version (VERIFY IN META DOCS: v21.0 is current stable)
export const META_GRAPH_API_VERSION = 'v21.0';

// ---- Time budget (Netlify free plan stops synchronous functions at 10s) ----
export const FN_BUDGET_MS = 8000;   // total time planned from function start
const LOG_RESERVE_MS = 1500;        // kept free for writing logs and responding
const ATTEMPT_TIMEOUT_MS = 5000;    // max wait for one request to Meta
const QUICK_FAIL_MS = 3000;         // only failures faster than this are retried
const MIN_ATTEMPT_MS = 1000;        // don't start an attempt with less time than this

// Helper to hash normalized values with SHA-256
export function hashValue(value) {
  if (!value || typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

// Bangladesh & International Phone Normalizer for Meta CAPI
// Strictly formats to digits only: 880XXXXXXXXXX (no plus)
export function normalizePhone(rawPhone) {
  if (!rawPhone || typeof rawPhone !== 'string') return null;
  let digits = rawPhone.replace(/\D/g, '');
  if (!digits) return null;

  if (digits.startsWith('00')) {
    digits = digits.substring(2);
  }

  if (digits.startsWith('880')) {
    return digits;
  }
  if (digits.startsWith('01') && digits.length === 11) {
    return '88' + digits;
  }
  if (digits.startsWith('1') && digits.length === 10) {
    return '880' + digits;
  }
  return digits;
}

// Extract client IP address from Netlify proxy headers
// Extract client IP address from Netlify proxy headers
export function extractClientIp(headers) {
  if (!headers) return null;
  const ip =
    headers['x-nf-client-connection-ip'] ||
    (headers['x-forwarded-for'] ? headers['x-forwarded-for'].split(',')[0].trim() : null) ||
    headers['client-ip'] ||
    headers['x-real-ip'];

  if (!ip) return null;
  const cleaned = ip.trim();

  // Local addresses are not real customer IPs, so send nothing for them
  if (cleaned === '::1' || cleaned === '127.0.0.1' || cleaned === 'localhost') return null;

  return cleaned;
}

// Build standard user_data payload strictly following requested structure
export function buildUserData({
  email,
  phone,
  firstName,
  lastName,
  city,
  country = 'bd',
  externalId,
  clientIp,
  clientUserAgent,
  fbp,
  fbc
} = {}) {
  // 1. Phone hashing
  let hashedPh = null;
  if (phone) {
    const normPhone = normalizePhone(phone);
    if (normPhone) {
      const h = hashValue(normPhone);
      if (h) hashedPh = [h];
    }
  }

  // 2. First name hashing
  let hashedFn = null;
  if (firstName && typeof firstName === 'string' && firstName.trim()) {
    const h = hashValue(firstName);
    if (h) hashedFn = [h];
  }

  // 3. Last name hashing
  let hashedLn = null;
  if (lastName && typeof lastName === 'string' && lastName.trim()) {
    const h = hashValue(lastName);
    if (h) hashedLn = [h];
  }

  // 4. City hashing
  let hashedCt = null;
  if (city && typeof city === 'string' && city.trim()) {
    const normCity = city.trim().toLowerCase().replace(/[\s\-_,.]/g, '');
    if (normCity) {
      const h = hashValue(normCity);
      if (h) hashedCt = [h];
    }
  }

  // 5. Country hashing (default 'bd' if not explicitly null)
  let hashedCountry = null;
  const rawCountry = country !== undefined ? country : 'bd';
  if (rawCountry && typeof rawCountry === 'string' && rawCountry.trim()) {
    const normCountry = rawCountry.trim().toLowerCase();
    if (normCountry) {
      const h = hashValue(normCountry);
      if (h) hashedCountry = [h];
    }
  }

  // Exact 6 user_data fields required by user template (null if not present)
  const userData = {
    ph: hashedPh,
    fn: hashedFn,
    ln: hashedLn,
    ct: hashedCt,
    country: hashedCountry,
    client_user_agent: clientUserAgent || null
  };

  // Additional Meta attribution parameters (if available)
  if (clientIp) userData.client_ip_address = clientIp;

  // Resolve Facebook Browser ID (fbp)
  let resolvedFbp = (fbp && typeof fbp === 'string' && fbp.startsWith('fb.')) ? fbp.trim() : null;
  if (!resolvedFbp && !hashedPh && !hashedFn && !hashedCt && !email && !externalId) {
    // For anonymous pre-checkout events without PII, generate fallback fbp so Meta does not reject with subcode 2804050
    resolvedFbp = `fb.1.${Date.now()}.${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  }
  if (resolvedFbp) userData.fbp = resolvedFbp;

  if (fbc && typeof fbc === 'string' && fbc.startsWith('fb.')) userData.fbc = fbc.trim();
  if (email && typeof email === 'string' && email.trim()) {
    const hashedEmail = hashValue(email);
    if (hashedEmail) userData.em = [hashedEmail];
  }
  if (externalId && typeof externalId === 'string' && externalId.trim()) {
    const hashedExtId = hashValue(externalId);
    if (hashedExtId) userData.external_id = [hashedExtId];
  }

  return userData;
}

// Build standard custom_data payload strictly following requested structure
export function buildCustomData({
  contentIds,
  contents,
  contentName,
  contentType,
  contentCategory,
  contentCategories,
  value,
  currency,
  numItems,
  orderId,
  inStock
} = {}) {
  // Resolve category
  const resolvedCategory = contentCategory || (contents && contents[0]?.category) || null;
  const resolvedCategories = (contentCategories && Array.isArray(contentCategories) && contentCategories.length > 0)
    ? contentCategories
    : (resolvedCategory ? [resolvedCategory] : null);

  // Format contents array
  const formattedContents = (contents && Array.isArray(contents) && contents.length > 0)
    ? contents.map(item => ({
        id: String(item.id || item.productId || item.slug || ''),
        quantity: Number(item.quantity) || 1,
        item_price: Number(item.item_price ?? item.price ?? item.unitPrice ?? 0),
        category: item.category || resolvedCategory || 'Minoxidil'
      }))
    : null;

  // Resolve numeric value
  const resolvedValue = (value !== undefined && value !== null && !isNaN(Number(value)))
    ? Number(value)
    : null;

  // Resolve currency
  const resolvedCurrency = currency || (resolvedValue !== null ? 'BDT' : null);

  // Resolve num_items
  const resolvedNumItems = (numItems !== undefined && numItems !== null && !isNaN(Number(numItems)))
    ? Number(numItems)
    : (formattedContents ? formattedContents.reduce((sum, item) => sum + item.quantity, 0) : null);

  // Resolve content_type
  const resolvedContentType = contentType || (formattedContents ? 'product' : null);

  return {
    currency: resolvedCurrency,
    value: resolvedValue,
    order_id: orderId ? String(orderId) : null,
    content_name: contentName || null,
    content_type: resolvedContentType,
    content_category: resolvedCategory,
    content_categories: resolvedCategories,
    contents: formattedContents,
    num_items: resolvedNumItems
  };
}

// One HTTP request to Meta. Never throws; returns a result object.
async function postToMeta({ pixelId, capiToken, body, timeoutMs }) {
  const startedAt = Date.now();
  const endpoint = `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${pixelId}/events?access_token=${capiToken}`;

  try {
    const res = await axios.post(endpoint, body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: timeoutMs
    });
    return {
      ok: true,
      status: res.status,
      data: res.data,
      error: null,
      timedOut: false,
      retryable: false,
      durationMs: Date.now() - startedAt
    };
  } catch (err) {
    const status = err.response?.status || 0;
    const data = err.response?.data || {
      error: { message: err.message, code: err.code || 'NETWORK_ERROR' }
    };
    const metaError = data?.error;
    const timedOut = err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT' || /timeout/i.test(err.message || '');
    const error = metaError
      ? `Meta Error [${metaError.code || 'UNKNOWN'}${metaError.error_subcode ? ` / subcode ${metaError.error_subcode}` : ''}]: ${metaError.error_user_msg || metaError.message}`
      : err.message;

    return {
      ok: false,
      status,
      data,
      error,
      timedOut,
      // Retry only network errors, rate limits and server errors; never timeouts or bad requests
      retryable: !timedOut && (status === 0 || status === 429 || status >= 500),
      durationMs: Date.now() - startedAt
    };
  }
}

// Send one event to Meta with time budget, one quick retry, and logging.
// Never throws. Returns a result object the caller can use for the response.
export async function dispatchEvent({
  eventName,
  eventId,
  eventTime,
  eventSourceUrl,
  userData = {},
  customData = {},
  startedAt = Date.now(),
  failedRecord = null // Purchase only: extra fields saved to failed_purchase_events on failure
}) {
  const deadline = startedAt + FN_BUDGET_MS - LOG_RESERVE_MS;
  const timeInSeconds = eventTime || Math.floor(Date.now() / 1000);

  const eventPayload = {
    event_name: eventName,
    event_time: timeInSeconds,
    event_id: eventId,
    event_source_url: eventSourceUrl || 'https://hairshurokkha.netlify.app',
    action_source: 'website',
    user_data: userData,
    custom_data: customData
  };

  const requestBody = { data: [eventPayload] };
  const attempts = [];
  let final = null;

  const pixelId = bundledData?.metaSettings?.pixelId || process.env.META_PIXEL_ID;

  if (!pixelId) {
    final = { ok: false, status: 0, reason: 'NO_PIXEL_ID', error: 'No pixel ID configured' };
  } else {
    const creds = await getMetaCredentials();

    if (!creds.capiToken || creds.capiToken.includes('PLACEHOLDER')) {
      final = { ok: false, status: 0, reason: 'NO_ACCESS_TOKEN', error: 'Missing or placeholder Meta CAPI token' };
    } else {
      if (creds.testEventCode) requestBody.test_event_code = creds.testEventCode;

      for (let attemptNo = 1; attemptNo <= 2; attemptNo++) {
        const remaining = deadline - Date.now();
        if (remaining < MIN_ATTEMPT_MS) {
          final = final || { ok: false, status: 0, reason: 'NO_TIME_LEFT', error: 'Not enough time left to call Meta' };
          break;
        }

        const result = await postToMeta({
          pixelId,
          capiToken: creds.capiToken,
          body: requestBody,
          timeoutMs: Math.min(ATTEMPT_TIMEOUT_MS, remaining)
        });

        attempts.push({
          attempt: attemptNo,
          status: result.status,
          durationMs: result.durationMs,
          timedOut: result.timedOut,
          error: result.error,
          response: result.data
        });
        final = result;

        // Stop on success, on non-retryable failure, or on a slow failure
        if (result.ok || !result.retryable || result.durationMs >= QUICK_FAIL_MS) break;
      }
    }
  }

  const ok = !!final?.ok;
  const response = final?.data ?? null;

  const logDoc = {
    eventId,
    eventName,
    eventTime: new Date(timeInSeconds * 1000),
    status: ok ? 'delivered' : 'failed',
    reason: final?.reason || null,
    attemptCount: attempts.length,
    attempts,
    metaResponseStatus: final?.status || 0,
    metaResponse: response,
    metaResponseData: response,
    response,
    metaEventsReceived: response?.events_received || 0,
    metaFbTraceId: response?.fbtrace_id || response?.error?.fbtrace_id || null,
    errorMessage: final?.error || null,
    payload: requestBody,
    data: requestBody.data,
    user_data: eventPayload.user_data,
    custom_data: eventPayload.custom_data,
    event_source_url: eventPayload.event_source_url,
    createdAt: new Date()
  };

  const failedDoc = (!ok && failedRecord)
    ? {
        ...failedRecord,
        eventId,
        eventName,
        eventTime: new Date(timeInSeconds * 1000),
        payload: requestBody,
        attempts,
        finalStatus: final?.status || 0,
        finalResponse: response,
        reason: final?.reason || null,
        errorMessage: final?.error || null,
        status: 'pending_retry',
        retryCount: 0,
        createdAt: new Date()
      }
    : null;

  let logged = false;
  try {
    const db = await getDb();
    const writes = [db.collection('event_logs').insertOne(logDoc)];
    if (failedDoc) writes.push(db.collection('failed_purchase_events').insertOne(failedDoc));

    const results = await Promise.allSettled(writes);
    results.forEach(r => {
      if (r.status === 'rejected') console.error('[Meta CAPI] DB write failed:', r.reason?.message);
    });
    logged = results.every(r => r.status === 'fulfilled');
  } catch (err) {
    console.error('[Meta CAPI] Could not connect to write logs:', err.message);
  }

  // Last resort: if the database was unreachable, keep the record in the function logs
  if (!logged) {
    console.error('[Meta CAPI LOG FALLBACK]', JSON.stringify({ logDoc, failedDoc }));
  }

  if (!ok) {
    console.warn(`[Meta CAPI] ${eventName} (${eventId}) failed: ${final?.reason || final?.error}`);
  }

  return {
    success: ok,
    status: final?.status || 0,
    reason: final?.reason || null,
    errorMessage: final?.error || null,
    metaResponse: response,
    eventId,
    logged,
    attempts: attempts.length
  };
}