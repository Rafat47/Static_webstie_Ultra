import crypto from 'crypto';
import axios from 'axios';
import { getDb, getMetaCredentials } from './mongo.js';
import bundledData from '../data/website-data.json' with { type: 'json' };

// Meta Graph API Version (VERIFY IN META DOCS: v21.0 is current stable)
export const META_GRAPH_API_VERSION = 'v21.0';

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
export function extractClientIp(headers) {
  if (!headers) return null;
  const ip =
    headers['x-nf-client-connection-ip'] ||
    (headers['x-forwarded-for'] ? headers['x-forwarded-for'].split(',')[0].trim() : null) ||
    headers['client-ip'] ||
    headers['x-real-ip'];

  if (!ip || ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') {
    // When testing locally or behind dev proxy, fallback to development mock IP so Meta CAPI pre-checkout events aren't rejected
    return process.env.NODE_ENV === 'production' ? null : '103.145.132.5';
  }
  return ip.trim();
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

// Send event to Meta Conversions API
export async function sendMetaCapiEvent({
  eventName,
  eventId,
  eventTime,
  eventSourceUrl,
  userData = {},
  customData = {}
}) {
  // Resolve Pixel ID: Primary from bundled UI content (editable via admin in MongoDB), fallback to env
  const pixelId = bundledData?.metaSettings?.pixelId || process.env.META_PIXEL_ID;
  if (!pixelId) {
    console.warn('[Meta CAPI] Skipping CAPI event: No pixelId configured in UI content or environment.');
    return { success: false, reason: 'NO_PIXEL_ID' };
  }

  const { capiToken, testEventCode } = await getMetaCredentials();
  if (!capiToken || capiToken.includes('PLACEHOLDER')) {
    console.warn('[Meta CAPI] Skipping CAPI event: Missing or placeholder META_CAPI_TOKEN.');
    return { success: false, reason: 'NO_ACCESS_TOKEN' };
  }

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

  const requestBody = {
    data: [eventPayload]
  };

  if (testEventCode) {
    requestBody.test_event_code = testEventCode;
  }

  const endpoint = `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${pixelId}/events?access_token=${capiToken}`;

  let responseStatus = 0;
  let responseData = null;
  let errorMsg = null;

  try {
    const res = await axios.post(endpoint, requestBody, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    });
    responseStatus = res.status;
    responseData = res.data;
  } catch (err) {
    responseStatus = err.response?.status || 500;
    responseData = err.response?.data || {
      error: {
        message: err.message,
        code: err.code || 'UNKNOWN_ERROR'
      }
    };
    const metaError = responseData?.error;
    errorMsg = metaError
      ? `Meta Error [${metaError.code || 'UNKNOWN'}${metaError.error_subcode ? ` / subcode ${metaError.error_subcode}` : ''}]: ${metaError.error_user_msg || metaError.message}`
      : err.message;
    console.warn(`[Meta CAPI] Error dispatching event ${eventName} (${eventId}):`, errorMsg);
  }

  // Save full event log to MongoDB collection 'event_logs'
  try {
    const db = await getDb();
    await db.collection('event_logs').insertOne({
      eventId,
      eventName,
      eventTime: new Date(timeInSeconds * 1000),
      status: responseStatus >= 200 && responseStatus < 300 ? 'delivered' : 'failed',
      metaResponseStatus: responseStatus,
      metaResponse: responseData,
      metaResponseData: responseData,
      response: responseData,
      metaEventsReceived: responseData?.events_received || 0,
      metaFbTraceId: responseData?.fbtrace_id || responseData?.error?.fbtrace_id || null,
      errorMessage: errorMsg,
      payload: requestBody,
      data: requestBody.data,
      user_data: eventPayload.user_data,
      custom_data: eventPayload.custom_data,
      event_source_url: eventPayload.event_source_url,
      createdAt: new Date()
    });
  } catch (logErr) {
    // Non-blocking log failure
  }

  return {
    success: responseStatus >= 200 && responseStatus < 300,
    status: responseStatus,
    eventId,
    response: responseData,
    metaResponse: responseData
  };
}
