import {
  dispatchEvent,
  extractClientIp,
  buildUserData,
  buildCustomData
} from './utils/metaCapi.js';

// Purchase is NOT allowed here: it is sent by create-order with the order's event ID
const ALLOWED_EVENTS = new Set([
  'PageView',
  'ViewContent',
  'AddToCart',
  'InitiateCheckout',
  'AddPaymentInfo',
  'Contact',
  'Search',
  'Lead'
]);

export const handler = async (event, context) => {
  const startedAt = Date.now();

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };
  }

  // Payload size limit check (approx 64KB)
  if (event.body && event.body.length > 65536) {
    return {
      statusCode: 413,
      headers,
      body: JSON.stringify({ success: false, error: 'Payload too large' })
    };
  }

  try {
    const clientIp = extractClientIp(event.headers);
    const payload = JSON.parse(event.body || '{}');
    const { eventName, eventId, eventSourceUrl, userData = {}, customData = {} } = payload;

    if (!eventName || !ALLOWED_EVENTS.has(eventName)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Invalid or unsupported eventName' })
      };
    }

    if (!eventId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'eventId is required for deduplication' })
      };
    }

    const clientUserAgent = event.headers['user-agent'] || userData.clientUserAgent || userData.client_user_agent || null;

    const normalizedUserData = buildUserData({
      email: userData.email || (Array.isArray(userData.em) ? userData.em[0] : userData.em),
      phone: userData.phone || userData.phoneNumber || (Array.isArray(userData.ph) ? userData.ph[0] : userData.ph),
      firstName: userData.firstName || (Array.isArray(userData.fn) ? userData.fn[0] : userData.fn),
      lastName: userData.lastName || (Array.isArray(userData.ln) ? userData.ln[0] : userData.ln),
      city: userData.city || userData.district || (Array.isArray(userData.ct) ? userData.ct[0] : userData.ct),
      country: userData.country || (Array.isArray(userData.country) ? userData.country[0] : userData.country) || 'bd',
      externalId: userData.externalId || (Array.isArray(userData.external_id) ? userData.external_id[0] : userData.external_id),
      clientIp,
      clientUserAgent,
      fbp: userData.fbp,
      fbc: userData.fbc
    });

    const normalizedCustomData = buildCustomData({
      contentIds: customData.content_ids || customData.contentIds,
      contents: customData.contents,
      contentName: customData.content_name || customData.contentName,
      contentType: customData.content_type || customData.contentType,
      contentCategory: customData.content_category || customData.contentCategory,
      contentCategories: customData.content_categories || customData.contentCategories,
      value: customData.value,
      currency: customData.currency || 'BDT',
      numItems: customData.num_items ?? customData.numItems,
      orderId: customData.order_id || customData.orderId,
      inStock: customData.in_stock
    });

    const result = await dispatchEvent({
      eventName,
      eventId,
      eventTime: Math.floor(Date.now() / 1000),
      eventSourceUrl: eventSourceUrl || event.headers['referer'] || null,
      userData: normalizedUserData,
      customData: normalizedCustomData,
      startedAt
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        eventId,
        status: result.success ? 'delivered' : 'failed'
      })
    };
  } catch (err) {
    console.warn('[Track Function Error]', err.message);
    return {
      statusCode: 200, // Non-breaking failure response for user flow
      headers,
      body: JSON.stringify({ success: false, error: 'Non-fatal tracking dispatch issue' })
    };
  }
};