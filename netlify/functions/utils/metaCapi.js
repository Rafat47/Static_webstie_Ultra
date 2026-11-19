import crypto from 'crypto';
import axios from 'axios';

function hashValue(value) {
  if (!value || typeof value !== 'string') return '';
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

export async function sendMetaCapiEvent({
  pixelId,
  accessToken,
  testEventCode,
  eventName,
  eventId,
  eventSourceUrl,
  userData = {},
  customData = {},
  req
}) {
  const finalPixelId = pixelId || process.env.META_PIXEL_ID;
  const finalToken = accessToken || process.env.META_CAPI_ACCESS_TOKEN;
  const finalTestCode = testEventCode || process.env.META_TEST_EVENT_CODE;

  if (!finalPixelId || !finalToken) {
    // Meta CAPI is not configured; return silent success
    return { success: false, reason: "Meta Pixel ID or Access Token not configured" };
  }

  // Normalize user data with sha256 hashing as required by Meta CAPI
  const normalizedUserData = {};

  if (userData.email) {
    normalizedUserData.em = [hashValue(userData.email)];
  }
  if (userData.phone) {
    // Format phone: remove spaces and dashes, add +880 if BD number
    let cleanPhone = userData.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('01')) {
      cleanPhone = '88' + cleanPhone;
    }
    normalizedUserData.ph = [hashValue(cleanPhone)];
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
  if (userData.clientIpAddress || (req && (req.headers['x-forwarded-for'] || req.socket?.remoteAddress))) {
    normalizedUserData.client_ip_address = userData.clientIpAddress || (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : req.socket?.remoteAddress);
  }
  if (userData.clientUserAgent || (req && req.headers['user-agent'])) {
    normalizedUserData.client_user_agent = userData.clientUserAgent || req.headers['user-agent'];
  }
  if (userData.fbp) {
    normalizedUserData.fbp = userData.fbp;
  }
  if (userData.fbc) {
    normalizedUserData.fbc = userData.fbc;
  }

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        event_source_url: eventSourceUrl || "",
        action_source: "website",
        user_data: normalizedUserData,
        custom_data: customData
      }
    ]
  };

  if (finalTestCode) {
    payload.test_event_code = finalTestCode;
  }

  try {
    const url = `https://graph.facebook.com/v19.0/${finalPixelId}/events?access_token=${finalToken}`;
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    return { success: true, response: response.data };
  } catch (error) {
    console.warn("Meta CAPI dispatch error:", error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

