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
    return null;
  }
  return ip.trim();
}

// Build standard user_data payload per Meta documentation
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
}) {
  const userData = {};

  // 1. Unhashed parameters
  if (clientIp) userData.client_ip_address = clientIp;
  if (clientUserAgent) userData.client_user_agent = clientUserAgent;
  if (fbp && typeof fbp === 'string' && fbp.startsWith('fb.')) userData.fbp = fbp.trim();
  if (fbc && typeof fbc === 'string' && fbc.startsWith('fb.')) userData.fbc = fbc.trim();

  // 2. SHA-256 Hashed parameters (normalized, arrays of single hash per Meta spec)
  if (email) {
    const hashedEmail = hashValue(email);
    if (hashedEmail) userData.em = [hashedEmail];
  }

  if (phone) {
    const normPhone = normalizePhone(phone);
    if (normPhone) {
      const hashedPhone = hashValue(normPhone);
      if (hashedPhone) userData.ph = [hashedPhone];
    }
  }

  if (firstName) {
    const hashedFn = hashValue(firstName);
    if (hashedFn) userData.fn = [hashedFn];
  }

  if (lastName) {
    const hashedLn = hashValue(lastName);
    if (hashedLn) userData.ln = [hashedLn];
  }

  if (city) {
    // lowercase, remove spaces and punctuation
    const normCity = city.trim().toLowerCase().replace(/[\s\-_,.]/g, '');
    if (normCity) {
      const hashedCity = hashValue(normCity);
      if (hashedCity) userData.ct = [hashedCity];
    }
  }

  if (country) {
    const normCountry = country.trim().toLowerCase();
    if (normCountry) {
      const hashedCountry = hashValue(normCountry);
      if (hashedCountry) userData.country = [hashedCountry];
    }
  }

  if (externalId) {
    const hashedExtId = hashValue(externalId);
    if (hashedExtId) userData.external_id = [hashedExtId];
  }

  return userData;
}

// Build standard custom_data payload
export function buildCustomData({
  contentIds = [],
  contents = [],
  contentName,
  contentCategory,
  value,
  currency = 'BDT',
  numItems,
  orderId,
  inStock
}) {
  const customData = {};

  if (contentIds && contentIds.length > 0) customData.content_ids = contentIds.map(String);
  if (contents && contents.length > 0) {
    customData.contents = contents.map(item => ({
      id: String(item.id || item.productId || item.slug),
      quantity: Number(item.quantity) || 1,
      item_price: Number(item.item_price ?? item.price ?? item.unitPrice) || 0
    }));
  }
  if (contentName) customData.content_name = contentName;
  if (contentCategory) customData.content_category = contentCategory;
  if (typeof value === 'number') customData.value = value;
  if (currency) customData.currency = currency;
  if (numItems !== undefined) customData.num_items = Number(numItems);
  if (orderId) customData.order_id = String(orderId);

  // Custom property: Note: Stock availability is not used by Meta for delivery optimization.
  if (inStock !== undefined) {
    customData.in_stock = Boolean(inStock);
  }

  return customData;
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
    event_source_url: eventSourceUrl || 'https://hairshurokkha.com',
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
    responseData = err.response?.data || null;
    errorMsg = err.message;
    console.warn(`[Meta CAPI] Error dispatching event ${eventName} (${eventId}):`, errorMsg);
  }

  // Compact, non-blocking logging to event_logs
  try {
    const db = await getDb();
    await db.collection('event_logs').insertOne({
      eventId,
      eventName,
      eventTime: new Date(timeInSeconds * 1000),
      status: responseStatus >= 200 && responseStatus < 300 ? 'delivered' : 'failed',
      metaResponseStatus: responseStatus,
      metaEventsReceived: responseData?.events_received || 0,
      metaFbTraceId: responseData?.fbtrace_id || null,
      errorMessage: errorMsg,
      createdAt: new Date()
    });
  } catch (logErr) {
    // Non-blocking log failure
  }

  return {
    success: responseStatus >= 200 && responseStatus < 300,
    status: responseStatus,
    eventId
  };
}
