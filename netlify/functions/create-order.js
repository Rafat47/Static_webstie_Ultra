import { getDb } from './utils/mongo.js';
import {
  dispatchEvent,
  extractClientIp,
  buildUserData,
  buildCustomData
} from './utils/metaCapi.js';
import bundledData from './data/website-data.json' with { type: 'json' };

// Bangladesh Phone Validation helper
function isValidBDPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('01')) return true;
  if (cleaned.length === 13 && cleaned.startsWith('8801')) return true;
  return false;
}

function generateOrderId() {
  const now = new Date();
  const yearSuffix = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `HAIR-${yearSuffix}${month}-${randomSuffix}`;
}

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

  // Handle GET /orders/:orderId (read-only order confirmation lookup)
  if (event.httpMethod === 'GET') {
    try {
      const orderIdParam = event.queryStringParameters?.id || event.path?.split('/').filter(Boolean).pop();
      if (!orderIdParam || orderIdParam === 'orders' || orderIdParam === 'create-order') {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, message: 'Order ID is required' })
        };
      }

      const db = await getDb();
      const order = await db.collection('orders').findOne(
        { orderId: orderIdParam },
        { projection: { _id: 0, serverMeta: 0, rawPayload: 0 } }
      );

      if (!order) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ success: false, message: 'Order not found' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, data: order })
      };
    } catch (err) {
      console.error('GET order lookup error:', err);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, message: 'Failed to retrieve order' })
      };
    }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
    };
  }

  try {
    const clientIp = extractClientIp(event.headers);
    const body = JSON.parse(event.body || '{}');

    // 1. Honeypot check (anti-bot)
    if (body.website || body.honeypot || body.hp_field) {
      console.warn('[Create Order] Bot submission detected via honeypot field.');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Invalid submission' })
      };
    }

    const { customer = {}, items = [], deliveryArea = 'inside_dhaka', notes = '', attribution = {} } = body;

    // 2. Validate customer fields
    const fullName = (customer.fullName || customer.name || '').trim();
    const phoneNumber = (customer.phoneNumber || customer.phone || '').trim();
    const address = (customer.address || '').trim();

    if (!fullName || fullName.length < 2 || fullName.length > 100) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Please provide a valid full name (2-100 characters).' })
      };
    }

    if (!phoneNumber || !isValidBDPhone(phoneNumber)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Please enter a valid 11-digit Bangladeshi mobile number (e.g. 01712345678).'
        })
      };
    }

    if (!address || address.length < 5 || address.length > 500) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Please enter a full, detailed delivery address.' })
      };
    }

    // 3. Validate items and recompute prices from bundled product data
    if (!Array.isArray(items) || items.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Your cart is empty. Please add items to checkout.' })
      };
    }

    const catalogProducts = bundledData.products || [];
    const verifiedItems = [];
    let serverSubtotal = 0;

    for (const item of items) {
      const prodId = item.productId || item._id || item.slug;
      const product = catalogProducts.find(p => p._id === prodId || p.slug === prodId);

      if (!product || product.isActive === false) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: `Product "${item.productName || prodId}" is currently unavailable.`
          })
        };
      }

      const requestedQty = parseInt(item.quantity, 10);
      if (isNaN(requestedQty) || requestedQty < 1) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: `Invalid quantity for "${product.name}".`
          })
        };
      }

      const verifiedUnitPrice = Number(product.salePrice);
      const lineTotal = verifiedUnitPrice * requestedQty;
      serverSubtotal += lineTotal;

      verifiedItems.push({
        productId: String(product._id),
        slug: product.slug,
        productName: product.name,
        category: product.category || 'Hair Care',
        image: product.images?.[0] || '',
        quantity: requestedQty,
        unitPrice: verifiedUnitPrice,
        regularPrice: Number(product.regularPrice),
        lineTotal
      });
    }

    // 4. Recompute delivery fee and final total from bundled settings
    const isInsideDhaka = deliveryArea === 'inside_dhaka';
    const serverDeliveryFee = isInsideDhaka
      ? (Number(bundledData.deliverySettings?.insideDhakaFee) || 70)
      : (Number(bundledData.deliverySettings?.outsideDhakaFee) || 130);

    const serverFinalTotal = serverSubtotal + serverDeliveryFee;

    // Reject any order with price tampering or mismatch
    if (body.finalTotal !== undefined && Math.abs(Number(body.finalTotal) - serverFinalTotal) > 0.01) {
      console.warn(`[Price Validation Mismatch] Client: ${body.finalTotal}, Server: ${serverFinalTotal}`);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Order total mismatch detected. Please refresh your page and try again.'
        })
      };
    }

    // 5. Generate order and fixed event ID (same ID is sent to the browser Pixel)
    const orderId = generateOrderId();
    const eventId = `purchase_${orderId}`;
    const now = new Date();

    const orderRecord = {
      orderId,
      customer: {
        fullName,
        phoneNumber,
        address,
        deliveryArea: isInsideDhaka ? 'inside_dhaka' : 'outside_dhaka',
        district: isInsideDhaka ? 'Dhaka' : 'Outside Dhaka',
        notes: (notes || '').substring(0, 300)
      },
      items: verifiedItems,
      subtotal: serverSubtotal,
      deliveryFee: serverDeliveryFee,
      total: serverFinalTotal,
      finalTotal: serverFinalTotal,
      currency: bundledData.siteSettings?.currency || '৳',
      status: 'pending',
      paymentMethod: 'cash_on_delivery',
      uiVersion: bundledData.version || 1,
      uiUpdatedAt: bundledData.updatedAt || null,
      tracking: {
        eventId,
        fbp: attribution.fbp || null,
        fbc: attribution.fbc || null,
        fbcSource: attribution.fbcSource || null,
        clientIp,
        userAgent: event.headers['user-agent'] || null,
        sourceUrl: attribution.landingPage || event.headers['referer'] || null,
        utm: {
          source: attribution.utm_source || null,
          medium: attribution.utm_medium || null,
          campaign: attribution.utm_campaign || null,
          content: attribution.utm_content || null,
          term: attribution.utm_term || null
        }
      },
      createdAt: now,
      updatedAt: now
    };

    // 6. Save order first (an order is never lost because of Meta)
    const db = await getDb();
    await db.collection('orders').insertOne(orderRecord);
    console.log(`✓ Order ${orderId} successfully saved to database.`);

    // 7. Build Meta data
    const userAgent = event.headers['user-agent'] || null;
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const capiUserData = buildUserData({
      phone: phoneNumber,
      firstName,
      lastName,
      city: isInsideDhaka ? 'dhaka' : 'bangladesh',
      country: 'bd',
      clientIp,
      clientUserAgent: userAgent,
      fbp: attribution.fbp,
      fbc: attribution.fbc
    });

    const primaryCategory = verifiedItems[0]?.category || 'Minoxidil';

    const capiCustomData = buildCustomData({
      contentIds: verifiedItems.map(i => i.productId),
      contents: verifiedItems.map(i => ({
        id: i.productId,
        quantity: i.quantity,
        item_price: i.unitPrice,
        category: i.category || primaryCategory
      })),
      contentName: 'Order Purchase',
      contentType: 'product',
      contentCategory: primaryCategory,
      contentCategories: [primaryCategory],
      value: serverFinalTotal,
      currency: 'BDT',
      numItems: verifiedItems.reduce((acc, i) => acc + i.quantity, 0),
      orderId: String(orderId)
    });

    // 8. Send Purchase to Meta (awaited, within time budget, logged, retried once if quick failure)
    let metaDelivered = false;
    try {
      const metaResult = await dispatchEvent({
        eventName: 'Purchase',
        eventId,
        eventTime: Math.floor(now.getTime() / 1000),
        eventSourceUrl: attribution.landingPage || event.headers['referer'] || 'https://hairshurokkha.com/checkout',
        userData: capiUserData,
        customData: capiCustomData,
        startedAt,
        failedRecord: { orderId, source: 'create-order', total: serverFinalTotal }
      });
      metaDelivered = metaResult.success;
    } catch (metaErr) {
      // Order is already saved; a failure here must not change the customer's result
      console.error(`[Meta CAPI] Unexpected error for order ${orderId}:`, metaErr.message);
    }

    // 9. Return response
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        orderId,
        eventId,
        metaDelivered,
        data: {
          orderId,
          eventId,
          subtotal: serverSubtotal,
          deliveryFee: serverDeliveryFee,
          total: serverFinalTotal,
          status: 'pending'
        }
      })
    };
  } catch (err) {
    console.error('[Create Order Fatal Error]', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Internal server error while processing your order. Please try again.'
      })
    };
  }
};