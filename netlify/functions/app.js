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
  defaultProducts
} from './db.js';

import WebsiteConfig from './models/WebsiteConfig.js';
import Product from './models/Product.js';
import Category from './models/Category.js';
import Order from './models/Order.js';
import Admin from './models/Admin.js';
import { sendMetaCapiEvent } from './utils/metaCapi.js';

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

// GET /api/site-config - Retrieve full website configuration for public rendering
app.get('/api/site-config', async (req, res) => {
  try {
    res.set('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=300');
    const dbStatus = await getDbStatus();
    if (dbStatus.isConnected) {
      let config = await WebsiteConfig.findById('main');
      if (!config) {
        config = await WebsiteConfig.create({ _id: 'main', ...defaultWebsiteConfig });
      }
      // Mask any private server tokens from public output
      const sanitized = config.toObject ? config.toObject() : { ...config };
      if (sanitized.metaSettings) {
        delete sanitized.metaSettings.capiAccessToken;
      }
      return res.json({ success: true, data: sanitized });
    } else {
      const config = await memoryStore.getWebsiteConfig();
      const sanitized = { ...config };
      if (sanitized.metaSettings) {
        delete sanitized.metaSettings.capiAccessToken;
      }
      return res.json({ success: true, data: sanitized });
    }
  } catch (err) {
    console.error('Error fetching site config:', err);
    // Return default fallback config
    return res.json({ success: true, data: defaultWebsiteConfig });
  }
});

// GET /api/categories - Retrieve active product categories
app.get('/api/categories', async (req, res) => {
  try {
    res.set('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=300');
    const dbStatus = await getDbStatus();
    if (dbStatus.isConnected) {
      let count = await Category.countDocuments();
      if (count === 0) {
        await Category.insertMany(defaultCategories);
      }
      const categories = await Category.find({ isActive: true }).sort({ displayOrder: 1 });
      return res.json({ success: true, data: categories });
    } else {
      const categories = await memoryStore.getCategories();
      return res.json({ success: true, data: categories.filter(c => c.isActive) });
    }
  } catch (err) {
    console.error('Error fetching categories:', err);
    return res.json({ success: true, data: defaultCategories });
  }
});

// GET /api/products - Retrieve products with search, category filtering & sorting
app.get('/api/products', async (req, res) => {
  try {
    res.set('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=300');
    const { category, search, featured, sort } = req.query;
    const dbStatus = await getDbStatus();

    let products = [];

    if (dbStatus.isConnected) {
      let count = await Product.countDocuments();
      if (count === 0) {
        await Product.insertMany(defaultProducts);
      }

      const query = { isActive: true };
      if (category && category !== 'All Products' && category !== 'All') {
        query.category = { $regex: new RegExp(`^${category}$`, 'i') };
      }
      if (featured === 'true') {
        query.isFeatured = true;
      }
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { shortDescription: { $regex: search, $options: 'i' } }
        ];
      }

      let sortOptions = { carouselOrder: 1, createdAt: -1 };
      if (sort === 'price-low') sortOptions = { salePrice: 1 };
      if (sort === 'price-high') sortOptions = { salePrice: -1 };
      if (sort === 'newest') sortOptions = { createdAt: -1 };

      const rawProducts = await Product.find(query).sort(sortOptions);
      products = rawProducts.map(p => {
        const obj = p.toObject ? p.toObject() : { ...p };
        if (!obj.name && obj.title) obj.name = obj.title;
        if (!obj.slug) obj.slug = (obj.name || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        return obj;
      });
    } else {
      products = await memoryStore.getProducts({
        category,
        search,
        isFeatured: featured === 'true' ? true : undefined,
        isActive: true
      });

      if (sort === 'price-low') products.sort((a, b) => a.salePrice - b.salePrice);
      if (sort === 'price-high') products.sort((a, b) => b.salePrice - a.salePrice);
      if (sort === 'newest') products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return res.json({ success: true, data: products, count: products.length });
  } catch (err) {
    console.error('Error fetching products:', err);
    return res.json({ success: true, data: defaultProducts, count: defaultProducts.length });
  }
});

// GET /api/products/:slug - Retrieve single product details (supports Facebook Ad direct linking)
app.get('/api/products/:slug', async (req, res) => {
  try {
    res.set('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=300');
    const { slug } = req.params;
    const dbStatus = await getDbStatus();

    let product = null;

    if (dbStatus.isConnected) {
      product = await Product.findOne({ $or: [{ slug }, { _id: slug.match(/^[0-9a-fA-F]{24}$/) ? slug : null }] });
    } else {
      product = await memoryStore.getProductBySlug(slug);
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const obj = product.toObject ? product.toObject() : { ...product };
    if (!obj.name && obj.title) obj.name = obj.title;
    if (!obj.slug) obj.slug = (obj.name || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    return res.json({ success: true, data: obj });
  } catch (err) {
    console.error('Error fetching product by slug:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch product' });
  }
});

// POST /api/orders - Public Order Creation with Server-Side Price & Stock Verification
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

    // 1. Fetch current delivery fee settings from site config
    let deliverySettings = defaultWebsiteConfig.deliverySettings;
    let siteMeta = defaultWebsiteConfig.metaSettings;

    if (dbStatus.isConnected) {
      const cfg = await WebsiteConfig.findById('main');
      if (cfg && cfg.deliverySettings) {
        deliverySettings = cfg.deliverySettings;
      }
      if (cfg && cfg.metaSettings) {
        siteMeta = cfg.metaSettings;
      }
    } else {
      const cfg = await memoryStore.getWebsiteConfig();
      if (cfg && cfg.deliverySettings) {
        deliverySettings = cfg.deliverySettings;
      }
      if (cfg && cfg.metaSettings) {
        siteMeta = cfg.metaSettings;
      }
    }

    const deliveryFee = customer.deliveryArea === 'inside_dhaka'
      ? (deliverySettings.insideDhakaFee ?? 70)
      : (deliverySettings.outsideDhakaFee ?? 130);

    // 2. Fetch official product details from DB and calculate verified subtotal
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

      // Safely decrement stock if MongoDB
      if (dbStatus.isConnected && productDoc.stock > 0) {
        await Product.findByIdAndUpdate(productDoc._id, { $inc: { stock: -requestedQty } });
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
        fbclid: attribution?.fbclid || '',
        utmSource: attribution?.utmSource || '',
        utmMedium: attribution?.utmMedium || '',
        utmCampaign: attribution?.utmCampaign || '',
        utmContent: attribution?.utmContent || '',
        utmTerm: attribution?.utmTerm || '',
        landingPage: attribution?.landingPage || '',
        referrer: attribution?.referrer || '',
        userAgent: req.headers['user-agent'] || '',
        ip: req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : req.socket?.remoteAddress
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
        accessToken: process.env.META_CAPI_ACCESS_TOKEN,
        testEventCode: siteMeta?.testEventCode || process.env.META_TEST_EVENT_CODE,
        eventName: 'Purchase',
        eventId: orderPayload.metaEventId,
        eventSourceUrl: attribution?.landingPage || req.headers['referer'] || '',
        userData: {
          phone: customer.phoneNumber,
          firstName: customer.fullName.split(' ')[0],
          lastName: customer.fullName.split(' ').slice(1).join(' ') || '',
          city: orderPayload.customer.district,
          clientIpAddress: orderPayload.attribution.ip,
          clientUserAgent: orderPayload.attribution.userAgent
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
      }).catch(err => console.warn('Background CAPI error:', err.message));
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

    const dbStatus = await getDbStatus();
    let siteMeta = defaultWebsiteConfig.metaSettings;
    if (dbStatus.isConnected) {
      const cfg = await WebsiteConfig.findById('main');
      if (cfg && cfg.metaSettings) siteMeta = cfg.metaSettings;
    } else {
      const cfg = await memoryStore.getWebsiteConfig();
      if (cfg && cfg.metaSettings) siteMeta = cfg.metaSettings;
    }

    const result = await sendMetaCapiEvent({
      pixelId: siteMeta?.pixelId || process.env.META_PIXEL_ID,
      accessToken: process.env.META_CAPI_ACCESS_TOKEN,
      testEventCode: siteMeta?.testEventCode || process.env.META_TEST_EVENT_CODE,
      eventName,
      eventId,
      eventSourceUrl,
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
      products = await Product.find();
    } else {
      orders = await memoryStore.getOrders();
      products = await memoryStore.getProducts();
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
// 3. ADMIN PRODUCT MANAGEMENT
// =========================================================================

app.get('/api/admin/products', requireAdmin, async (req, res) => {
  try {
    const dbStatus = await getDbStatus();
    let products = [];
    if (dbStatus.isConnected) {
      products = await Product.find().sort({ createdAt: -1 });
    } else {
      products = await memoryStore.getProducts();
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

    const productPayload = {
      name: name.trim(),
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
      specifications: Array.isArray(specifications) ? specifications : []
    };

    const dbStatus = await getDbStatus();
    let newProduct = null;

    if (dbStatus.isConnected) {
      // Check for duplicate slug
      const existing = await Product.findOne({ slug: productPayload.slug });
      if (existing) {
        productPayload.slug = `${productPayload.slug}-${Date.now().toString().slice(-4)}`;
      }
      newProduct = await Product.create(productPayload);
    } else {
      newProduct = await memoryStore.addProduct(productPayload);
    }

    return res.status(201).json({ success: true, message: 'Product created successfully', data: newProduct });
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
    let updated = null;

    if (dbStatus.isConnected) {
      updated = await Product.findByIdAndUpdate(id, updateData, { new: true });
    } else {
      updated = await memoryStore.updateProduct(id, updateData);
    }

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.json({ success: true, message: 'Product updated successfully', data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const dbStatus = await getDbStatus();

    if (dbStatus.isConnected) {
      await Product.findByIdAndDelete(id);
    } else {
      await memoryStore.deleteProduct(id);
    }

    return res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================================
// 4. ADMIN CATEGORY MANAGEMENT
// =========================================================================

app.get('/api/admin/categories', requireAdmin, async (req, res) => {
  try {
    const dbStatus = await getDbStatus();
    let categories = [];
    if (dbStatus.isConnected) {
      categories = await Category.find().sort({ displayOrder: 1 });
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
      name: name.trim(),
      slug: categorySlug,
      description: description || '',
      image: image || '',
      isActive: isActive !== false,
      displayOrder: Number(displayOrder || 0)
    };

    const dbStatus = await getDbStatus();
    let newCat = null;
    if (dbStatus.isConnected) {
      newCat = await Category.create(catPayload);
    } else {
      newCat = await memoryStore.addCategory(catPayload);
    }

    return res.status(201).json({ success: true, message: 'Category created', data: newCat });
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
    let updated = null;
    if (dbStatus.isConnected) {
      updated = await Category.findByIdAndUpdate(id, updateData, { new: true });
    } else {
      updated = await memoryStore.updateCategory(id, updateData);
    }

    return res.json({ success: true, message: 'Category updated', data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/admin/categories/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const dbStatus = await getDbStatus();
    if (dbStatus.isConnected) {
      await Category.findByIdAndDelete(id);
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
// 6. ADMIN HOMEPAGE & WEBSITE CONFIGURATION (CMS)
// =========================================================================

app.get('/api/admin/site-config', requireAdmin, async (req, res) => {
  try {
    const dbStatus = await getDbStatus();
    if (dbStatus.isConnected) {
      let config = await WebsiteConfig.findById('main');
      if (!config) {
        config = await WebsiteConfig.create({ _id: 'main', ...defaultWebsiteConfig });
      }
      return res.json({ success: true, data: config });
    } else {
      const config = await memoryStore.getWebsiteConfig();
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
      savedConfig = await WebsiteConfig.findByIdAndUpdate(
        'main',
        { $set: updateData },
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

export default app;

