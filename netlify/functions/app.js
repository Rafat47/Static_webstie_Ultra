import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

import {
  connectToDatabase,
  memoryStore,
  defaultWebsiteConfig,
  defaultCategories,
  defaultProducts,
  defaultWebsiteData
} from './db.js';

import WebsiteData from './models/WebsiteData.js';
import WebsiteConfig from './models/WebsiteConfig.js';
import Product from './models/Product.js';
import Category from './models/Category.js';
import Order from './models/Order.js';
import Admin from './models/Admin.js';
import MetaEventLog from './models/MetaEventLog.js';
import { sendMetaCapiEvent, retryMetaCapiEvent, extractClientIp } from './utils/metaCapi.js';

dotenv.config();

const app = express();

// Configure Cloudinary if credentials are provided
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_haircare_jwt_key_min_32_characters_long_2026';

// Helper: Ensure DB connection and determine if MongoDB or memory store should be used
async function getDbStatus() {
  const status = await connectToDatabase();
  return status;
}

// Helper: Sanitize public website data - ensure sensitive server credentials/tokens are never exposed
function sanitizePublicWebsiteData(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : JSON.parse(JSON.stringify(doc));
  if (obj.metaSettings) {
    delete obj.metaSettings.capiAccessToken;
  }
  return obj;
}

// Admin Auth Middleware
function generateOrderId() {
  const now = new Date();
  const datePrefix = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `HAIR-${datePrefix}-${randomSuffix}`;
}

const requireAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please login as admin.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session. Please login again.' });
  }
};

// =========================================================================
// 1. PUBLIC ROUTES
// =========================================================================

// Health check / API status
app.get('/api/health', async (req, res) => {
  const dbStatus = await getDbStatus();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    databaseMode: dbStatus.mode,
    version: '1.0.0'
  });
});

// GET /api/website-data - Retrieve complete consolidated public website dataset in ONE request & ONE DB read
app.get('/api/website-data', async (req, res) => {
  try {
    const dbStatus = await getDbStatus();
    let websiteData = null;

    if (dbStatus.isConnected) {
      websiteData = await WebsiteData.findById('main').lean();
      if (!websiteData) {
        // Auto-seed if document not yet created
        const created = await WebsiteData.create(defaultWebsiteData);
        websiteData = created.toObject ? created.toObject() : created;
      }
    } else {
      websiteData = await memoryStore.getWebsiteData();
    }

    const version = websiteData.version || 1;
    const updatedAtTime = new Date(websiteData.updatedAt || Date.now()).getTime();
    const etag = `W/"${version}-${updatedAtTime}"`;

    res.set({
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60, s-maxage=120, stale-while-revalidate=300',
      'ETag': etag
    });

    if (req.headers['if-none-match'] === etag) {
      return res.status(304).end();
    }

    const sanitized = sanitizePublicWebsiteData(websiteData);
    return res.json({
      success: true,
      version,
      updatedAt: websiteData.updatedAt,
      data: sanitized
    });
  } catch (err) {
    console.error('Error fetching centralized website data:', err);
    return res.json({
      success: true,
      version: 1,
      data: sanitizePublicWebsiteData(defaultWebsiteData)
    });
  }
});

// GET /api/site-config - Retrieve full website configuration for public rendering (backed by website_data)
app.get('/api/site-config', async (req, res) => {
  try {
    res.set('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=300');
    const dbStatus = await getDbStatus();
    let websiteData = null;
    if (dbStatus.isConnected) {
      websiteData = await WebsiteData.findById('main').lean();
      if (!websiteData) {
        websiteData = await WebsiteData.create(defaultWebsiteData);
      }
    } else {
      websiteData = await memoryStore.getWebsiteData();
    }
    const sanitized = sanitizePublicWebsiteData(websiteData);
    return res.json({ success: true, data: sanitized });
  } catch (err) {
    console.error('Error fetching site config:', err);
    return res.json({ success: true, data: sanitizePublicWebsiteData(defaultWebsiteData) });
  }
});

// GET /api/categories - Retrieve active product categories (backed by website_data)
app.get('/api/categories', async (req, res) => {
  try {
    res.set('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=300');
    const dbStatus = await getDbStatus();
    let categories = [];
    if (dbStatus.isConnected) {
      const doc = await WebsiteData.findById('main', { categories: 1 }).lean();
      categories = (doc && doc.categories) || defaultWebsiteData.categories;
    } else {
      categories = await memoryStore.getCategories();
    }
    const active = categories.filter(c => c.isActive !== false).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    return res.json({ success: true, data: active });
  } catch (err) {
    console.error('Error fetching categories:', err);
    return res.json({ success: true, data: defaultCategories });
  }
});

// GET /api/products - Retrieve products with search, category filtering & sorting (backed by website_data)
app.get('/api/products', async (req, res) => {
  try {
    res.set('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=300');
    const { category, search, featured, sort } = req.query;
    const dbStatus = await getDbStatus();
    let allProducts = [];

    if (dbStatus.isConnected) {
      const doc = await WebsiteData.findById('main', { products: 1 }).lean();
      allProducts = (doc && doc.products) || defaultWebsiteData.products;
    } else {
      allProducts = (await memoryStore.getWebsiteData())?.products || [];
    }

    let filtered = allProducts.filter(p => p.isActive !== false);

    if (category && category !== 'All Products' && category !== 'All') {
      filtered = filtered.filter(p => p.category && p.category.toLowerCase() === category.toLowerCase());
    }
    if (featured === 'true') {
      filtered = filtered.filter(p => p.isFeatured);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.shortDescription && p.shortDescription.toLowerCase().includes(q))
      );
    }

    if (sort === 'price-low') filtered.sort((a, b) => a.salePrice - b.salePrice);
    else if (sort === 'price-high') filtered.sort((a, b) => b.salePrice - a.salePrice);
    else if (sort === 'newest') filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else filtered.sort((a, b) => (a.carouselOrder || 0) - (b.carouselOrder || 0));

    return res.json({ success: true, data: filtered, count: filtered.length });
  } catch (err) {
    console.error('Error fetching products:', err);
    return res.json({ success: true, data: defaultProducts, count: defaultProducts.length });
  }
});

// GET /api/products/:slug - Retrieve single product details (backed by website_data)
app.get('/api/products/:slug', async (req, res) => {
  try {
    res.set('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=300');
    const { slug } = req.params;
    const dbStatus = await getDbStatus();
    let allProducts = [];

    if (dbStatus.isConnected) {
      const doc = await WebsiteData.findById('main', { products: 1 }).lean();
      allProducts = (doc && doc.products) || defaultWebsiteData.products;
    } else {
      allProducts = (await memoryStore.getWebsiteData())?.products || [];
    }

    const product = allProducts.find(p => p.slug === slug || String(p._id) === slug);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.json({ success: true, data: product });
  } catch (err) {
    console.error('Error fetching product by slug:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch product' });
  }
});

// POST /api/orders - Public Order Creation with Server-Side Price & Stock Verification against website_data
app.post('/api/orders', async (req, res) => {
  try {
    const { customer, items, attribution, metaEventId } = req.body;

    if (!customer || !customer.fullName || !customer.phoneNumber || !customer.address || !customer.deliveryArea) {
      return res.status(400).json({
        success: false,
        message: 'Please complete all required customer information (Name, Phone, Delivery Area, Address).'
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Your shopping cart is empty.'
      });
    }

    const dbStatus = await getDbStatus();

    // 1. Fetch current delivery fee settings & product stock from centralized website_data
    let websiteData = null;
    if (dbStatus.isConnected) {
      websiteData = await WebsiteData.findById('main');
      if (!websiteData) {
        websiteData = await WebsiteData.create(defaultWebsiteData);
      }
    } else {
      websiteData = await memoryStore.getWebsiteData();
    }

    const deliverySettings = websiteData.deliverySettings || defaultWebsiteConfig.deliverySettings;
    const siteMeta = websiteData.metaSettings || defaultWebsiteConfig.metaSettings;
    const availableProducts = websiteData.products || [];

    const deliveryFee = customer.deliveryArea === 'inside_dhaka'
      ? (deliverySettings.insideDhakaFee ?? 70)
      : (deliverySettings.outsideDhakaFee ?? 130);

    // 2. Fetch official product details from website_data and calculate verified subtotal
    let verifiedItems = [];
    let calculatedSubtotal = 0;

    for (const item of items) {
      const productDoc = availableProducts.find(p =>
        (item.slug && p.slug === item.slug) ||
        (item.productId && (String(p._id) === String(item.productId) || p.slug === item.productId))
      );

      if (!productDoc) {
        return res.status(400).json({
          success: false,
          message: `Product "${item.productName || item.productId}" is currently unavailable.`
        });
      }

      const requestedQty = Math.max(1, parseInt(item.quantity) || 1);
      const verifiedUnitPrice = productDoc.salePrice;
      const itemTotal = verifiedUnitPrice * requestedQty;
      calculatedSubtotal += itemTotal;

      const resolvedName = productDoc.name || productDoc.title || item.productName || 'Product';
      const resolvedSlug = productDoc.slug || item.slug || resolvedName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      verifiedItems.push({
        productId: String(productDoc._id || resolvedSlug),
        productName: resolvedName,
        slug: resolvedSlug,
        image: productDoc.images?.[0] || '',
        unitPrice: verifiedUnitPrice,
        quantity: requestedQty,
        itemTotal: itemTotal
      });

      // Safely decrement stock in website_data document
      if (dbStatus.isConnected && productDoc.stock > 0) {
        await WebsiteData.updateOne(
          { _id: 'main' },
          {
            $inc: { 'products.$[elem].stock': -requestedQty },
            $set: { updatedAt: new Date() }
          },
          {
            arrayFilters: [{ $or: [{ 'elem._id': productDoc._id }, { 'elem.slug': productDoc.slug }] }]
          }
        );
      } else if (!dbStatus.isConnected && productDoc.stock > 0) {
        productDoc.stock -= requestedQty;
      }
    }

    const discount = 0;
    const finalTotal = calculatedSubtotal + deliveryFee - discount;

    // 3. Generate unique memorable order ID (e.g. HAIR-2611-X48A)
    const datePrefix = new Date().toISOString().slice(2, 7).replace('-', '');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderId = `HAIR-${datePrefix}-${randomSuffix}`;

    const orderPayload = {
      orderId,
      orderNumber: orderId,
      customer: {
        fullName: customer.fullName.trim(),
        phoneNumber: customer.phoneNumber.trim(),
        district: customer.district ? customer.district.trim() : (customer.deliveryArea === 'inside_dhaka' ? 'Dhaka' : 'Outside Dhaka'),
        deliveryArea: customer.deliveryArea,
        address: customer.address.trim(),
        notes: customer.notes || ''
      },
      items: verifiedItems,
      subtotal: calculatedSubtotal,
      discount: discount,
      deliveryCharge: deliveryFee,
      finalTotal: finalTotal,
      paymentMethod: 'COD',
      orderStatus: 'Pending',
      statusHistory: [
        {
          status: 'Pending',
          timestamp: new Date(),
          note: 'Order placed by customer via Cash on Delivery',
          updatedBy: 'System'
        }
      ],
      attribution: {
        fbp: (attribution?.fbp && typeof attribution.fbp === 'string' && attribution.fbp.startsWith('fb.')) ? attribution.fbp.trim() : '',
        fbc: (attribution?.fbc && typeof attribution.fbc === 'string' && attribution.fbc.startsWith('fb.')) ? attribution.fbc.trim() : '',
        fbcSource: attribution?.fbcSource || (attribution?.fbc ? 'fbc_cookie' : 'none'),
        fbclid: attribution?.fbclid || '',
        utmSource: attribution?.utmSource || '',
        utmMedium: attribution?.utmMedium || '',
        utmCampaign: attribution?.utmCampaign || '',
        utmContent: attribution?.utmContent || '',
        utmTerm: attribution?.utmTerm || '',
        landingPage: attribution?.landingPage || '',
        referrer: attribution?.referrer || '',
        userAgent: req.headers['user-agent'] || '',
        ip: extractClientIp(req)
      },
      metaEventId: metaEventId || `order_${orderId}`
    };

    let createdOrder = null;
    if (dbStatus.isConnected) {
      createdOrder = await Order.create(orderPayload);
    } else {
      createdOrder = await memoryStore.addOrder(orderPayload);
    }

    // 4. Trigger Server-Side Meta Conversions API (CAPI) Purchase Event
    const isCapiActive = siteMeta?.isCapiEnabled !== false;
    if (isCapiActive) {
      sendMetaCapiEvent({
        pixelId: siteMeta?.pixelId || process.env.META_PIXEL_ID,
        accessToken: siteMeta?.capiAccessToken || process.env.META_CAPI_ACCESS_TOKEN,
        testEventCode: siteMeta?.testEventCode || process.env.META_TEST_EVENT_CODE,
        isLoggingEnabled: siteMeta?.isLoggingEnabled !== false,
        logRetentionDays: siteMeta?.logRetentionDays || 7,
        eventName: 'Purchase',
        eventId: orderPayload.metaEventId,
        orderId: orderId,
        eventSource: 'server_order',
        eventSourceUrl: attribution?.landingPage || req.headers['referer'] || '',
        userData: {
          phone: customer.phoneNumber,
          firstName: customer.fullName.split(' ')[0],
          lastName: customer.fullName.split(' ').slice(1).join(' ') || '',
          city: orderPayload.customer.district,
          clientIpAddress: orderPayload.attribution.ip,
          clientUserAgent: orderPayload.attribution.userAgent,
          fbp: orderPayload.attribution.fbp || undefined,
          fbc: orderPayload.attribution.fbc || undefined,
          fbcSource: orderPayload.attribution.fbcSource
        },
        customData: {
          currency: 'BDT',
          value: finalTotal,
          order_id: orderId,
          content_type: 'product',
          contents: verifiedItems.map(i => ({
            id: i.productId || i.slug,
            quantity: i.quantity,
            item_price: i.unitPrice
          })),
          num_items: verifiedItems.reduce((acc, i) => acc + i.quantity, 0)
        },
        req
      }).catch(err => console.warn('Background CAPI Purchase error:', err.message));
    }

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      orderId: orderId,
      data: createdOrder
    });
  } catch (err) {
    console.error('Error placing order:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to place order. Please try again or contact support.'
    });
  }
});

// GET /api/orders/:orderId - Retrieve order summary for confirmation & status page
app.get('/api/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const dbStatus = await getDbStatus();

    let order = null;
    if (dbStatus.isConnected) {
      order = await Order.findOne({ orderId });
    } else {
      order = await memoryStore.getOrderById(orderId);
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    return res.json({ success: true, data: order });
  } catch (err) {
    console.error('Error fetching order by ID:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch order details' });
  }
});

// POST /api/meta/events - Dual dispatch endpoint for CAPI event forwarding from browser
app.post('/api/meta/events', async (req, res) => {
  try {
    const { eventName, eventId, eventSourceUrl, userData, customData } = req.body;

    if (!eventName || !eventId) {
      return res.status(400).json({ success: false, message: 'eventName and eventId are required' });
    }

    // Deduplication guard: Purchase events are dispatched directly by the server order creation.
    // Prevent redundant secondary server dispatch from browser forwarder
    if (eventName === 'Purchase') {
      return res.json({ success: true, message: 'Purchase event already handled on server order creation' });
    }

    const dbStatus = await getDbStatus();
    let siteMeta = defaultWebsiteConfig.metaSettings;
    if (dbStatus.isConnected) {
      const cfg = await WebsiteConfig.findById('main');
      if (cfg && cfg.metaSettings) siteMeta = cfg.metaSettings;
    } else {
      const cfg = await memoryStore.getWebsiteConfig();
      if (cfg && cfg.metaSettings) siteMeta = cfg.metaSettings;
    }

    if (siteMeta?.isCapiEnabled === false) {
      return res.json({ success: true, message: 'CAPI is disabled in settings' });
    }

    const result = await sendMetaCapiEvent({
      pixelId: siteMeta?.pixelId || process.env.META_PIXEL_ID,
      accessToken: siteMeta?.capiAccessToken || process.env.META_CAPI_ACCESS_TOKEN,
      testEventCode: siteMeta?.testEventCode || process.env.META_TEST_EVENT_CODE,
      isLoggingEnabled: siteMeta?.isLoggingEnabled !== false,
      logRetentionDays: siteMeta?.logRetentionDays || 7,
      eventName,
      eventId,
      eventSource: 'browser_forwarded',
      eventSourceUrl,
      orderId: customData?.order_id || '',
      userData: userData || {},
      customData: customData || {},
      req
    });

    return res.json({ success: true, capiResult: result });
  } catch (err) {
    console.error('Error in meta events endpoint:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// 2. ADMIN AUTHENTICATION & DASHBOARD
// =========================================================================

// POST /api/admin/login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required' });
    }

    const envUser = process.env.ADMIN_USERNAME || 'admin';
    const envPass = process.env.ADMIN_PASSWORD || 'Admin@HairCare2026';

    const dbStatus = await getDbStatus();
    let adminRecord = null;

    if (dbStatus.isConnected) {
      adminRecord = await Admin.findOne({ username });
      if (!adminRecord && username === envUser) {
        // Auto-initialize default admin in MongoDB if not exists
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(envPass, salt);
        adminRecord = await Admin.create({
          username: envUser,
          password: hashedPassword,
          name: 'Store Administrator',
          role: 'superadmin'
        });
      }
    }

    let isMatch = false;

    if (adminRecord) {
      isMatch = await adminRecord.comparePassword(password);
    } else {
      // Memory store / fallback validation against env
      if (username === envUser && password === envPass) {
        isMatch = true;
        adminRecord = {
          _id: 'admin_1',
          username: envUser,
          name: 'Store Administrator',
          role: 'superadmin'
        };
      }
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    const token = jwt.sign(
      { id: adminRecord._id, username: adminRecord.username, role: adminRecord.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        id: adminRecord._id,
        username: adminRecord.username,
        name: adminRecord.name || 'Store Administrator',
        role: adminRecord.role || 'admin'
      }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ success: false, message: 'Authentication server error' });
  }
});

// GET /api/admin/me
app.get('/api/admin/me', requireAdmin, async (req, res) => {
  res.json({ success: true, admin: req.admin });
});

// GET /api/admin/dashboard - Comprehensive Analytics & KPIs
app.get('/api/admin/dashboard', requireAdmin, async (req, res) => {
  try {
    const dbStatus = await getDbStatus();
    let orders = [];
    let products = [];

    if (dbStatus.isConnected) {
      orders = await Order.find().sort({ createdAt: -1 });
      const wDoc = await WebsiteData.findById('main', { products: 1 }).lean();
      products = (wDoc && wDoc.products) || [];
    } else {
      orders = await memoryStore.getOrders();
      products = (await memoryStore.getWebsiteData())?.products || [];
    }

    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.orderStatus === 'Pending').length;
    const confirmedOrders = orders.filter(o => o.orderStatus === 'Confirmed' || o.orderStatus === 'Processing').length;
    const deliveredOrders = orders.filter(o => o.orderStatus === 'Delivered').length;
    const cancelledOrders = orders.filter(o => o.orderStatus === 'Cancelled' || o.orderStatus === 'Rejected').length;

    // Calculate revenue from non-cancelled orders
    const totalRevenue = orders
      .filter(o => o.orderStatus !== 'Cancelled' && o.orderStatus !== 'Rejected')
      .reduce((sum, o) => sum + (o.finalTotal || 0), 0);

    // Calculate best selling products
    const productSalesMap = {};
    orders.forEach(o => {
      if (o.orderStatus !== 'Cancelled' && o.orderStatus !== 'Rejected') {
        (o.items || []).forEach(item => {
          const key = item.productName;
          productSalesMap[key] = (productSalesMap[key] || 0) + (item.quantity || 1);
        });
      }
    });

    const topSelling = Object.entries(productSalesMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return res.json({
      success: true,
      data: {
        stats: {
          totalOrders,
          pendingOrders,
          confirmedOrders,
          deliveredOrders,
          cancelledOrders,
          totalRevenue,
          totalProducts: products.length
        },
        topSelling,
        recentOrders: orders.slice(0, 8),
        databaseMode: dbStatus.mode
      }
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return res.status(500).json({ success: false, message: 'Failed to calculate dashboard statistics' });
  }
});

// =========================================================================
// 3. ADMIN PRODUCT MANAGEMENT (Backed by website_data document)
// =========================================================================

app.get('/api/admin/products', requireAdmin, async (req, res) => {
  try {
    const dbStatus = await getDbStatus();
    let products = [];
    if (dbStatus.isConnected) {
      const wDoc = await WebsiteData.findById('main', { products: 1 }).lean();
      products = (wDoc && wDoc.products) || [];
      products.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else {
      products = (await memoryStore.getWebsiteData())?.products || [];
    }
    return res.json({ success: true, data: products });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/products', requireAdmin, async (req, res) => {
  try {
    const { name, slug, regularPrice, salePrice, category, stock, shortDescription, description, images, isFeatured, isActive, productType, comboItems, badge, keyBenefits, specifications } = req.body;

    if (!name || !regularPrice || !salePrice || !category) {
      return res.status(400).json({ success: false, message: 'Name, Category, Regular Price, and Sale Price are required' });
    }

    const generatedSlug = slug
      ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      : name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const newProductId = `prod_${Date.now()}`;
    const productPayload = {
      _id: newProductId,
      name: name.trim(),
      title: name.trim(),
      slug: generatedSlug || `product-${Date.now()}`,
      shortDescription: shortDescription || '',
      description: description || '',
      images: Array.isArray(images) && images.length > 0 ? images : ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80'],
      category: category.trim(),
      regularPrice: Number(regularPrice),
      salePrice: Number(salePrice),
      stock: Number(stock || 0),
      isFeatured: Boolean(isFeatured),
      isActive: isActive !== false,
      productType: productType || 'minoxidil',
      comboItems: Array.isArray(comboItems) ? comboItems : [],
      badge: badge || '',
      keyBenefits: Array.isArray(keyBenefits) ? keyBenefits : [],
      specifications: Array.isArray(specifications) ? specifications : [],
      carouselOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const dbStatus = await getDbStatus();

    if (dbStatus.isConnected) {
      // Check for duplicate slug inside website_data
      const current = await WebsiteData.findById('main');
      if (current && current.products?.some(p => p.slug === productPayload.slug)) {
        productPayload.slug = `${productPayload.slug}-${Date.now().toString().slice(-4)}`;
      }
      await WebsiteData.updateOne(
        { _id: 'main' },
        {
          $push: { products: productPayload },
          $inc: { version: 1 },
          $set: { updatedAt: new Date() }
        },
        { upsert: true }
      );
    } else {
      await memoryStore.addProduct(productPayload);
    }

    return res.status(201).json({ success: true, message: 'Product created successfully', data: productPayload });
  } catch (err) {
    console.error('Error creating product:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    delete updateData._id;

    if (updateData.slug) {
      updateData.slug = updateData.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    const dbStatus = await getDbStatus();

    if (dbStatus.isConnected) {
      const updateSet = {};
      for (const [key, val] of Object.entries(updateData)) {
        updateSet[`products.$[elem].${key}`] = val;
      }
      updateSet['products.$[elem].updatedAt'] = new Date();
      updateSet['updatedAt'] = new Date();

      const updated = await WebsiteData.findOneAndUpdate(
        { _id: 'main' },
        {
          $set: updateSet,
          $inc: { version: 1 }
        },
        {
          arrayFilters: [{ $or: [{ 'elem._id': id }, { 'elem.slug': id }] }],
          returnDocument: 'after'
        }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      const product = updated.products?.find(p => p._id === id || p.slug === id);
      return res.json({ success: true, message: 'Product updated successfully', data: product });
    } else {
      const updated = await memoryStore.updateProduct(id, updateData);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      return res.json({ success: true, message: 'Product updated successfully', data: updated });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const dbStatus = await getDbStatus();

    if (dbStatus.isConnected) {
      await WebsiteData.updateOne(
        { _id: 'main' },
        {
          $pull: { products: { $or: [{ _id: id }, { slug: id }] } },
          $inc: { version: 1 },
          $set: { updatedAt: new Date() }
        }
      );
    } else {
      await memoryStore.deleteProduct(id);
    }

    return res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================================
// 4. ADMIN CATEGORY MANAGEMENT (Backed by website_data document)
// =========================================================================

app.get('/api/admin/categories', requireAdmin, async (req, res) => {
  try {
    const dbStatus = await getDbStatus();
    let categories = [];
    if (dbStatus.isConnected) {
      const wDoc = await WebsiteData.findById('main', { categories: 1 }).lean();
      categories = (wDoc && wDoc.categories) || [];
      categories.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    } else {
      categories = await memoryStore.getCategories();
    }
    return res.json({ success: true, data: categories });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/categories', requireAdmin, async (req, res) => {
  try {
    const { name, slug, description, image, isActive, displayOrder } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const categorySlug = slug
      ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
      : name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const catPayload = {
      _id: `cat_${Date.now()}`,
      name: name.trim(),
      slug: categorySlug,
      description: description || '',
      image: image || '',
      isActive: isActive !== false,
      displayOrder: Number(displayOrder || 0),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const dbStatus = await getDbStatus();

    if (dbStatus.isConnected) {
      await WebsiteData.updateOne(
        { _id: 'main' },
        {
          $push: { categories: catPayload },
          $inc: { version: 1 },
          $set: { updatedAt: new Date() }
        },
        { upsert: true }
      );
    } else {
      await memoryStore.addCategory(catPayload);
    }

    return res.status(201).json({ success: true, message: 'Category created', data: catPayload });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/admin/categories/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    delete updateData._id;

    const dbStatus = await getDbStatus();

    if (dbStatus.isConnected) {
      const updateSet = {};
      for (const [key, val] of Object.entries(updateData)) {
        updateSet[`categories.$[elem].${key}`] = val;
      }
      updateSet['categories.$[elem].updatedAt'] = new Date();
      updateSet['updatedAt'] = new Date();

      const updated = await WebsiteData.findOneAndUpdate(
        { _id: 'main' },
        {
          $set: updateSet,
          $inc: { version: 1 }
        },
        {
          arrayFilters: [{ $or: [{ 'elem._id': id }, { 'elem.slug': id }] }],
          returnDocument: 'after'
        }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      const category = updated.categories?.find(c => c._id === id || c.slug === id);
      return res.json({ success: true, message: 'Category updated', data: category });
    } else {
      const updated = await memoryStore.updateCategory(id, updateData);
      return res.json({ success: true, message: 'Category updated', data: updated });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/admin/categories/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const dbStatus = await getDbStatus();

    if (dbStatus.isConnected) {
      await WebsiteData.updateOne(
        { _id: 'main' },
        {
          $pull: { categories: { $or: [{ _id: id }, { slug: id }] } },
          $inc: { version: 1 },
          $set: { updatedAt: new Date() }
        }
      );
    } else {
      await memoryStore.deleteCategory(id);
    }

    return res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================================
// 5. ADMIN ORDER MANAGEMENT
// =========================================================================

app.get('/api/admin/orders', requireAdmin, async (req, res) => {
  try {
    const { status, search } = req.query;
    const dbStatus = await getDbStatus();

    let orders = [];

    if (dbStatus.isConnected) {
      const query = {};
      if (status && status !== 'All') {
        query.orderStatus = status;
      }
      if (search) {
        query.$or = [
          { orderId: { $regex: search, $options: 'i' } },
          { 'customer.fullName': { $regex: search, $options: 'i' } },
          { 'customer.phoneNumber': { $regex: search, $options: 'i' } }
        ];
      }
      orders = await Order.find(query).sort({ createdAt: -1 });
    } else {
      orders = await memoryStore.getOrders({ status: status === 'All' ? undefined : status, search });
    }

    return res.json({ success: true, data: orders, count: orders.length });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/orders/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const dbStatus = await getDbStatus();

    let order = null;
    if (dbStatus.isConnected) {
      order = await Order.findOne({ $or: [{ orderId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] });
    } else {
      order = await memoryStore.getOrderById(id);
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    return res.json({ success: true, data: order });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/admin/orders/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note, internalNotes } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const validStatuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status code' });
    }

    const dbStatus = await getDbStatus();
    let updatedOrder = null;

    if (dbStatus.isConnected) {
      const order = await Order.findOne({ $or: [{ orderId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] });
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      order.orderStatus = status;
      if (internalNotes !== undefined) {
        order.internalNotes = internalNotes;
      }
      order.statusHistory.push({
        status,
        timestamp: new Date(),
        note: note || `Status changed to ${status}`,
        updatedBy: req.admin?.username || 'Admin'
      });

      updatedOrder = await order.save();
    } else {
      updatedOrder = await memoryStore.updateOrderStatus(id, status, note, req.admin?.username);
      if (updatedOrder && internalNotes !== undefined) {
        updatedOrder.internalNotes = internalNotes;
      }
    }

    return res.json({ success: true, message: `Order status updated to ${status}`, data: updatedOrder });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/admin/orders/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const dbStatus = await getDbStatus();

    if (dbStatus.isConnected) {
      const deleted = await Order.findOneAndDelete({
        $or: [
          { orderId: id },
          { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }
        ]
      });
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
    } else {
      await memoryStore.deleteOrder(id);
    }

    return res.json({ success: true, message: `Order #${id} deleted successfully` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/orders', requireAdmin, async (req, res) => {
  try {
    const { customer, items, orderStatus = 'Confirmed', internalNotes } = req.body;

    if (!customer || !customer.fullName || !customer.phoneNumber || !customer.address) {
      return res.status(400).json({
        success: false,
        message: 'Customer fullName, phoneNumber, and address are required'
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one order item is required'
      });
    }

    const dbStatus = await getDbStatus();

    let deliverySettings = defaultWebsiteConfig.deliverySettings;
    if (dbStatus.isConnected) {
      const cfg = await WebsiteConfig.findById('main');
      if (cfg && cfg.deliverySettings) deliverySettings = cfg.deliverySettings;
    } else {
      const cfg = await memoryStore.getWebsiteConfig();
      if (cfg && cfg.deliverySettings) deliverySettings = cfg.deliverySettings;
    }

    const deliveryFee = customer.deliveryArea === 'inside_dhaka'
      ? (deliverySettings.insideDhakaFee ?? 70)
      : (deliverySettings.outsideDhakaFee ?? 130);

    let verifiedItems = [];
    let calculatedSubtotal = 0;

    for (const item of items) {
      let productDoc = null;
      if (dbStatus.isConnected) {
        productDoc = await Product.findOne({
          $or: [
            { slug: item.slug || item.productId },
            { _id: item.productId?.match(/^[0-9a-fA-F]{24}$/) ? item.productId : null }
          ]
        });
      } else {
        productDoc = await memoryStore.getProductBySlug(item.slug || item.productId);
      }

      const unitPrice = item.unitPrice !== undefined ? Number(item.unitPrice) : (productDoc ? productDoc.salePrice : 0);
      const productName = item.productName || (productDoc ? productDoc.name : 'Custom Hair Care Product');
      const resolvedSlug = item.slug || (productDoc ? productDoc.slug : '') || '';
      const resolvedImage = item.image || (productDoc && productDoc.images?.[0]) || '';
      const quantity = Math.max(1, parseInt(item.quantity) || 1);

      calculatedSubtotal += unitPrice * quantity;

      verifiedItems.push({
        productId: productDoc ? productDoc._id.toString() : (item.productId || resolvedSlug || 'manual-item'),
        slug: resolvedSlug,
        productName,
        quantity,
        unitPrice,
        itemTotal: unitPrice * quantity,
        image: resolvedImage
      });
    }

    const finalTotal = calculatedSubtotal + deliveryFee;
    const orderId = generateOrderId();

    const orderPayload = {
      orderId,
      customer: {
        fullName: customer.fullName.trim(),
        phoneNumber: customer.phoneNumber.trim(),
        district: customer.district || (customer.deliveryArea === 'inside_dhaka' ? 'Dhaka' : 'Outside Dhaka'),
        deliveryArea: customer.deliveryArea || 'inside_dhaka',
        address: customer.address.trim(),
        notes: customer.notes?.trim() || ''
      },
      items: verifiedItems,
      subtotal: calculatedSubtotal,
      deliveryCharge: deliveryFee,
      finalTotal,
      paymentMethod: 'Cash on Delivery',
      paymentStatus: 'Pending',
      orderStatus,
      internalNotes: internalNotes || 'Manually created by Admin',
      statusHistory: [
        {
          status: orderStatus,
          timestamp: new Date(),
          note: 'Order manually created via Admin Panel',
          updatedBy: req.admin?.username || 'Admin'
        }
      ],
      attribution: {
        utmSource: 'admin_manual',
        utmMedium: 'admin_dashboard'
      }
    };

    let createdOrder = null;
    if (dbStatus.isConnected) {
      createdOrder = await Order.create(orderPayload);
    } else {
      createdOrder = await memoryStore.addOrder(orderPayload);
    }

    return res.status(201).json({
      success: true,
      message: `Manual order #${orderId} created successfully`,
      orderId,
      data: createdOrder
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================================
// 6. ADMIN CENTRALIZED WEBSITE DATA & CMS CONFIGURATION
// =========================================================================

// GET /api/admin/website-data - Full document read for Admin CMS / Content Management
app.get('/api/admin/website-data', requireAdmin, async (req, res) => {
  try {
    const dbStatus = await getDbStatus();
    let data = null;
    if (dbStatus.isConnected) {
      data = await WebsiteData.findById('main');
      if (!data) {
        data = await WebsiteData.create(defaultWebsiteData);
      }
    } else {
      data = await memoryStore.getWebsiteData();
    }
    const obj = data.toObject ? data.toObject() : data;
    return res.json({ success: true, version: obj.version || 1, data: obj });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/website-data - Whole-document save with optimistic concurrency control
app.put('/api/admin/website-data', requireAdmin, async (req, res) => {
  try {
    const { version, expectedVersion, ...updateData } = req.body;
    delete updateData._id;

    const reqVersion = typeof version === 'number' ? version : (typeof expectedVersion === 'number' ? expectedVersion : null);
    const dbStatus = await getDbStatus();

    if (dbStatus.isConnected) {
      const current = await WebsiteData.findById('main');
      if (!current) {
        return res.status(404).json({ success: false, message: 'Website data document not found' });
      }

      if (reqVersion !== null && current.version !== reqVersion) {
        return res.status(409).json({
          success: false,
          conflict: true,
          message: `Concurrency conflict: Document has been modified by another admin (expected version ${reqVersion}, current version ${current.version}). Please reload.`,
          currentVersion: current.version
        });
      }

      // Atomic update and version increment
      const updated = await WebsiteData.findByIdAndUpdate(
        'main',
        {
          $set: { ...updateData, updatedAt: new Date() },
          $inc: { version: 1 }
        },
        { returnDocument: 'after', upsert: true }
      );

      return res.json({
        success: true,
        message: 'Website data updated successfully',
        version: updated.version,
        data: updated
      });
    } else {
      const updated = await memoryStore.updateWebsiteData(updateData, reqVersion);
      return res.json({
        success: true,
        message: 'Website data updated successfully (in memory)',
        version: updated.version,
        data: updated
      });
    }
  } catch (err) {
    if (err.conflict) {
      return res.status(409).json({
        success: false,
        conflict: true,
        message: err.message,
        currentVersion: err.currentVersion
      });
    }
    console.error('Error saving website data:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/site-config', requireAdmin, async (req, res) => {
  try {
    const dbStatus = await getDbStatus();
    if (dbStatus.isConnected) {
      let config = await WebsiteData.findById('main');
      if (!config) {
        config = await WebsiteData.create(defaultWebsiteData);
      }
      return res.json({ success: true, data: config });
    } else {
      const config = await memoryStore.getWebsiteData();
      return res.json({ success: true, data: config });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/admin/site-config', requireAdmin, async (req, res) => {
  try {
    const updateData = { ...req.body };
    delete updateData._id;

    const dbStatus = await getDbStatus();
    let savedConfig = null;

    if (dbStatus.isConnected) {
      savedConfig = await WebsiteData.findByIdAndUpdate(
        'main',
        {
          $set: { ...updateData, updatedAt: new Date() },
          $inc: { version: 1 }
        },
        { returnDocument: 'after', upsert: true }
      );
    } else {
      savedConfig = await memoryStore.updateWebsiteConfig(updateData);
    }

    return res.json({
      success: true,
      message: 'Website configuration updated successfully!',
      data: savedConfig
    });
  } catch (err) {
    console.error('Error saving website config:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================================
// 7. IMAGE UPLOAD HANDLER
// =========================================================================

app.post('/api/upload', requireAdmin, async (req, res) => {
  try {
    const { image, folder = 'haircare' } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, message: 'Image data or URL required' });
    }

    // If it's already an HTTP URL, return as-is
    if (typeof image === 'string' && (image.startsWith('http://') || image.startsWith('https://'))) {
      return res.json({ success: true, url: image });
    }

    // If Cloudinary is configured, upload to Cloudinary
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      const uploadResult = await cloudinary.uploader.upload(image, {
        folder: folder,
        resource_type: 'auto'
      });
      return res.json({ success: true, url: uploadResult.secure_url });
    }

    // Fallback: Return the image (e.g. data URI) directly without crashing
    return res.json({
      success: true,
      url: image,
      notice: 'Stored as data URL (configure Cloudinary in .env for CDN hosting)'
    });
  } catch (err) {
    console.error('Image upload error:', err);
    return res.status(500).json({ success: false, message: 'Failed to upload image: ' + err.message });
  }
});

// =========================================================================
// 8. ADMIN META CAPI EVENT LOGS MANAGEMENT
// =========================================================================

// GET /api/admin/meta/logs - Paginated logs with search & filters
app.get('/api/admin/meta/logs', requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.eventName && req.query.eventName !== 'ALL') {
      filter.eventName = req.query.eventName;
    }
    if (req.query.status && req.query.status !== 'ALL') {
      filter.status = req.query.status;
    }
    if (req.query.search) {
      const s = req.query.search.trim();
      filter.$or = [
        { eventId: { $regex: s, $options: 'i' } },
        { orderId: { $regex: s, $options: 'i' } }
      ];
    }
    if (req.query.orderId) {
      filter.orderId = { $regex: req.query.orderId.trim(), $options: 'i' };
    }
    if (req.query.eventId) {
      filter.eventId = { $regex: req.query.eventId.trim(), $options: 'i' };
    }

    const [logs, totalCount, stats] = await Promise.all([
      MetaEventLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-request.payload.user_data.em -request.payload.user_data.ph'),
      MetaEventLog.countDocuments(filter),
      MetaEventLog.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const statusCounts = {
      total: totalCount,
      success: 0,
      partial_success: 0,
      failed: 0,
      pending: 0,
      timeout: 0,
      invalid_payload: 0
    };
    stats.forEach(st => {
      if (statusCounts[st._id] !== undefined) {
        statusCounts[st._id] = st.count;
      }
    });

    return res.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      stats: statusCounts
    });
  } catch (err) {
    console.error('Error fetching Meta CAPI logs:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve CAPI logs: ' + err.message });
  }
});

// GET /api/admin/meta/logs/:id - Full individual log inspection
app.get('/api/admin/meta/logs/:id', requireAdmin, async (req, res) => {
  try {
    const log = await MetaEventLog.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ success: false, message: 'Log record not found' });
    }
    return res.json({ success: true, data: log });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch log details: ' + err.message });
  }
});

// POST /api/admin/meta/logs/:id/retry - Manual retry of a failed or timed-out CAPI event
app.post('/api/admin/meta/logs/:id/retry', requireAdmin, async (req, res) => {
  try {
    const result = await retryMetaCapiEvent(req.params.id);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Retry operation failed: ' + err.message });
  }
});

// DELETE /api/admin/meta/logs - Safe manual cleanup of CAPI logs
app.delete('/api/admin/meta/logs', requireAdmin, async (req, res) => {
  try {
    const { olderThanDays } = req.query;
    let deleteFilter = {};
    if (olderThanDays) {
      const days = parseInt(olderThanDays) || 0;
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      deleteFilter = { createdAt: { $lt: cutoff } };
    }
    const result = await MetaEventLog.deleteMany(deleteFilter);
    return res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} log records`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to clear logs: ' + err.message });
  }
});

export default app;

