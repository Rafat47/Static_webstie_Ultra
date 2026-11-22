import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to resolve the storage file paths across local dev, Netlify functions, and production build
function resolveDataFilePaths() {
  const candidates = [
    path.resolve(__dirname, 'data', 'website-data.json'),
    path.resolve(__dirname, '..', 'data', 'website-data.json'),
    path.resolve(__dirname, '..', '..', 'public', 'data', 'website-data.json'),
    path.resolve(__dirname, '..', 'public', 'data', 'website-data.json'),
    path.resolve(process.cwd(), 'public', 'data', 'website-data.json'),
    path.resolve(process.cwd(), 'netlify', 'functions', 'data', 'website-data.json'),
    path.resolve(process.cwd(), 'dist', 'data', 'website-data.json')
  ];

  let primaryPath = candidates[0];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      primaryPath = c;
      break;
    }
  }

  const primaryDir = path.dirname(primaryPath);

  // Also support dist directory in production if it exists
  const distCandidates = [
    path.resolve(process.cwd(), 'dist', 'data', 'website-data.json'),
    path.resolve(__dirname, '..', '..', 'dist', 'data', 'website-data.json')
  ];
  let distPath = null;
  for (const dc of distCandidates) {
    const parentDir = path.dirname(path.dirname(dc));
    if (fs.existsSync(parentDir)) {
      distPath = dc;
      break;
    }
  }

  return { primaryPath, distPath };
}

// Fallback baseline config if JSON file not yet created
export const defaultWebsiteConfig = {
  _id: "main",
  siteSettings: {
    siteName: "Hair Shurokkha Bangladesh",
    logoText: "Hair Shurokkha",
    logoUrl: "/hair-shurokkha-logo-transparent.png",
    tagline: "Science-Backed Hair Restoration & Scalp Wellness",
    currency: "৳",
    contactPhone: "+880 1711-234567",
    contactEmail: "support@hairshurokkha.bd",
    whatsappNumber: "+8801711234567",
    address: "House 42, Road 11, Banani, Dhaka-1213, Bangladesh",
    socialLinks: {
      facebook: "https://facebook.com/hairshurokkhabd",
      instagram: "https://instagram.com/hairshurokkhabd",
      youtube: "https://youtube.com/@hairshurokkhabd"
    }
  },
  navigation: {
    items: [
      { label: "Home", href: "#hero", isSection: true },
      { label: "Shop", href: "/shop", isSection: false },
      { label: "Hair Thinning", href: "#hair-thinning", isSection: true },
      { label: "How It Works", href: "#how-it-works", isSection: true },
      { label: "Progress", href: "#progress", isSection: true },
      { label: "How to Use", href: "#how-to-use", isSection: true },
      { label: "Contact", href: "#contact", isSection: true }
    ]
  },
  hero: {
    badge: "100% Authentic Guaranteed",
    title: "Your Hair Care Journey Starts Here.",
    subtitle: "Reactivate dormant hair follicles, increase scalp blood microcirculation, and reclaim thicker hair with dermatologically proven Minoxidil 5% and micro-needling systems.",
    primaryBtnText: "Shop Now",
    primaryBtnLink: "/shop",
    secondaryBtnText: "How to Use",
    secondaryBtnLink: "#how-to-use",
    desktopImage: "https://lh3.googleusercontent.com/d/13PtOiqhb4WpcmgIh0t1J4KFnUTlSlo3R",
    heroImage: "https://lh3.googleusercontent.com/d/13PtOiqhb4WpcmgIh0t1J4KFnUTlSlo3R",
    mobileImage: "https://lh3.googleusercontent.com/d/13PtOiqhb4WpcmgIh0t1J4KFnUTlSlo3R",
    rating: "4.9 / 5.0 Rating across Bangladesh",
    trustBadges: [
      { label: "Authentic Sourced", sub: "100% Genuine USA Formulation" },
      { label: "Fast Cash on Delivery", sub: "Inside & Outside Dhaka" },
      { label: "7-Day Inspection", sub: "Check package before payment" }
    ]
  },
  deliverySettings: {
    insideDhakaFee: 70,
    outsideDhakaFee: 130,
    estimatedDeliveryDaysInside: "2-3 Days",
    estimatedDeliveryDaysOutside: "3-5 Days",
    freeDeliveryThreshold: 5000,
    cashOnDeliveryEnabled: true
  },
  metaSettings: {
    isPixelEnabled: true,
    isCapiEnabled: true,
    isLoggingEnabled: true,
    logRetentionDays: 7,
    testEventCode: ""
  }
};

export const defaultCategories = [];
export const defaultProducts = [];
export const defaultWebsiteData = {
  ...defaultWebsiteConfig,
  categories: [],
  products: [],
  orders: [],
  admins: [
    {
      _id: "6b0072b9ca8f2dea4a890e9e",
      username: "admin",
      password: "$2b$10$xWNdzRLx0KXEz.WRW2FWeurqcgrp73izWEBtS9L9ddIntw1nrMDxC",
      name: "Store Administrator",
      role: "superadmin"
    }
  ],
  metaEventLogs: [],
  version: 1,
  updatedAt: new Date().toISOString()
};

/**
 * Local File-Backed JSON Store
 * - Reads from public/data/website-data.json
 * - Synchronously/atomically writes any updates back to disk
 * - Replaces external MongoDB completely with 0ms local latency
 */
class LocalJsonStore {
  constructor() {
    const { primaryPath, distPath } = resolveDataFilePaths();
    this.filePath = primaryPath;
    this.distPath = distPath;
    this.data = this.loadFromDisk();
  }

  loadFromDisk() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const parsed = JSON.parse(raw);
        // Ensure all collections are arrays
        if (!Array.isArray(parsed.categories)) parsed.categories = [];
        if (!Array.isArray(parsed.products)) parsed.products = [];
        if (!Array.isArray(parsed.orders)) parsed.orders = [];
        if (!Array.isArray(parsed.admins)) parsed.admins = [];
        if (!Array.isArray(parsed.metaEventLogs)) parsed.metaEventLogs = [];
        return parsed;
      }
    } catch (e) {
      console.warn(`Failed to read data from ${this.filePath}:`, e.message);
    }
    return JSON.parse(JSON.stringify(defaultWebsiteData));
  }

  saveToDisk() {
    try {
      this.data.updatedAt = new Date().toISOString();
      const content = JSON.stringify(this.data, null, 2);

      // 1. Ensure directory exists
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // 2. Write primary file
      fs.writeFileSync(this.filePath, content, 'utf8');

      // 3. Also mirror to dist if dist exists (production build sync)
      if (this.distPath) {
        const distDir = path.dirname(this.distPath);
        if (fs.existsSync(path.dirname(distDir))) {
          if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
          fs.writeFileSync(this.distPath, content, 'utf8');
        }
      }
    } catch (e) {
      console.error(`Error saving data to ${this.filePath}:`, e);
    }
  }

  // --- Website Data & Config ---
  async getWebsiteData() {
    return this.data;
  }

  async updateWebsiteData(updateData, reqVersion = null) {
    if (reqVersion !== null && typeof reqVersion === 'number') {
      const currentVer = this.data.version || 1;
      if (currentVer !== reqVersion) {
        const conflictErr = new Error(`Concurrency conflict: expected version ${reqVersion}, current version ${currentVer}`);
        conflictErr.conflict = true;
        conflictErr.currentVersion = currentVer;
        throw conflictErr;
      }
    }

    const { _id, ...rest } = updateData;
    this.data = {
      ...this.data,
      ...rest,
      _id: "main",
      version: (this.data.version || 1) + 1,
      updatedAt: new Date().toISOString()
    };

    // Ensure collections remain arrays if not overwritten
    if (!Array.isArray(this.data.categories)) this.data.categories = [];
    if (!Array.isArray(this.data.products)) this.data.products = [];
    if (!Array.isArray(this.data.orders)) this.data.orders = [];
    if (!Array.isArray(this.data.admins)) this.data.admins = [];
    if (!Array.isArray(this.data.metaEventLogs)) this.data.metaEventLogs = [];

    this.saveToDisk();
    return this.data;
  }

  async getWebsiteConfig() {
    return this.data;
  }

  async updateWebsiteConfig(updateData) {
    const { _id, ...rest } = updateData;
    this.data = {
      ...this.data,
      ...rest,
      _id: "main",
      version: (this.data.version || 1) + 1,
      updatedAt: new Date().toISOString()
    };
    this.saveToDisk();
    return this.data;
  }

  // --- Categories ---
  async getCategories() {
    return this.data.categories || [];
  }

  async addCategory(cat) {
    const newCat = {
      _id: cat._id || `cat_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...cat
    };
    this.data.categories.push(newCat);
    this.data.version = (this.data.version || 1) + 1;
    this.saveToDisk();
    return newCat;
  }

  async updateCategory(idOrSlug, catData) {
    const categories = this.data.categories || [];
    const idx = categories.findIndex(c => String(c._id) === String(idOrSlug) || c.slug === idOrSlug || c.name === idOrSlug);
    if (idx !== -1) {
      categories[idx] = {
        ...categories[idx],
        ...catData,
        updatedAt: new Date().toISOString()
      };
      this.data.version = (this.data.version || 1) + 1;
      this.saveToDisk();
      return categories[idx];
    }
    return null;
  }

  async deleteCategory(idOrSlug) {
    const categories = this.data.categories || [];
    this.data.categories = categories.filter(c => String(c._id) !== String(idOrSlug) && c.slug !== idOrSlug && c.name !== idOrSlug);
    this.data.version = (this.data.version || 1) + 1;
    this.saveToDisk();
    return true;
  }

  // --- Products ---
  async getProducts(filter = {}) {
    let list = [...(this.data.products || [])];
    if (filter.category && filter.category !== 'All Products' && filter.category !== 'All') {
      list = list.filter(p => p.category && p.category.toLowerCase() === filter.category.toLowerCase());
    }
    if (filter.isFeatured !== undefined) {
      list = list.filter(p => Boolean(p.isFeatured) === Boolean(filter.isFeatured));
    }
    if (filter.isActive !== undefined) {
      list = list.filter(p => Boolean(p.isActive) === Boolean(filter.isActive));
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.shortDescription && p.shortDescription.toLowerCase().includes(q))
      );
    }
    return list;
  }

  async getProductBySlug(slugOrId) {
    const products = this.data.products || [];
    return products.find(p => p.slug === slugOrId || String(p._id) === String(slugOrId)) || null;
  }

  async addProduct(prod) {
    const newProd = {
      _id: prod._id || `prod_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...prod
    };
    this.data.products.unshift(newProd);
    this.data.version = (this.data.version || 1) + 1;
    this.saveToDisk();
    return newProd;
  }

  async updateProduct(idOrSlug, prodData) {
    const products = this.data.products || [];
    const idx = products.findIndex(p => String(p._id) === String(idOrSlug) || p.slug === idOrSlug);
    if (idx !== -1) {
      products[idx] = {
        ...products[idx],
        ...prodData,
        updatedAt: new Date().toISOString()
      };
      this.data.version = (this.data.version || 1) + 1;
      this.saveToDisk();
      return products[idx];
    }
    return null;
  }

  async deleteProduct(idOrSlug) {
    const products = this.data.products || [];
    this.data.products = products.filter(p => String(p._id) !== String(idOrSlug) && p.slug !== idOrSlug);
    this.data.version = (this.data.version || 1) + 1;
    this.saveToDisk();
    return true;
  }

  async decrementStock(productIdOrSlug, qty) {
    const p = await this.getProductBySlug(productIdOrSlug);
    if (p && typeof p.stock === 'number') {
      p.stock = Math.max(0, p.stock - qty);
      p.updatedAt = new Date().toISOString();
      this.saveToDisk();
    }
  }

  // --- Orders ---
  async getOrders(filter = {}) {
    let list = [...(this.data.orders || [])];
    if (filter.status && filter.status !== 'All') {
      list = list.filter(o => o.orderStatus === filter.status);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(o =>
        (o.orderId && o.orderId.toLowerCase().includes(q)) ||
        (o.customer?.phoneNumber && o.customer.phoneNumber.includes(q)) ||
        (o.customer?.fullName && o.customer.fullName.toLowerCase().includes(q))
      );
    }
    return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  async getOrderById(orderIdOrDbId) {
    const orders = this.data.orders || [];
    return orders.find(o => o.orderId === orderIdOrDbId || String(o._id) === String(orderIdOrDbId)) || null;
  }

  async addOrder(order) {
    const newOrder = {
      _id: order._id || `ord_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusHistory: [
        {
          status: order.orderStatus || 'Pending',
          timestamp: new Date().toISOString(),
          note: 'Order placed via Cash on Delivery',
          updatedBy: 'Customer'
        }
      ],
      ...order
    };
    this.data.orders.unshift(newOrder);
    this.saveToDisk();
    return newOrder;
  }

  async updateOrderStatus(orderIdOrDbId, status, note, adminUser = 'Admin', internalNotes) {
    const order = await this.getOrderById(orderIdOrDbId);
    if (!order) return null;

    order.orderStatus = status;
    order.updatedAt = new Date().toISOString();
    if (internalNotes !== undefined) {
      order.internalNotes = internalNotes;
    }
    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({
      status,
      timestamp: new Date().toISOString(),
      note: note || `Status updated to ${status}`,
      updatedBy: adminUser
    });
    this.saveToDisk();
    return order;
  }

  async deleteOrder(orderIdOrDbId) {
    const orders = this.data.orders || [];
    this.data.orders = orders.filter(o => o.orderId !== orderIdOrDbId && String(o._id) !== String(orderIdOrDbId));
    this.saveToDisk();
    return true;
  }

  // --- Admins ---
  async getAdmins() {
    return this.data.admins || [];
  }

  async getAdminByUsername(username) {
    if (!username) return null;
    const clean = String(username).trim().toLowerCase();
    const admins = this.data.admins || [];
    return admins.find(a => a.username?.toLowerCase() === clean) || null;
  }

  // --- Meta CAPI Event Logs ---
  async getMetaLogs(filter = {}, page = 1, limit = 20) {
    let logs = [...(this.data.metaEventLogs || [])];

    if (filter.eventName && filter.eventName !== 'ALL') {
      logs = logs.filter(l => l.eventName === filter.eventName);
    }
    if (filter.status && filter.status !== 'ALL') {
      logs = logs.filter(l => l.status === filter.status);
    }
    if (filter.search) {
      const s = filter.search.toLowerCase();
      logs = logs.filter(l =>
        (l.eventId && l.eventId.toLowerCase().includes(s)) ||
        (l.orderId && l.orderId.toLowerCase().includes(s))
      );
    }
    if (filter.orderId) {
      const o = filter.orderId.toLowerCase();
      logs = logs.filter(l => l.orderId && l.orderId.toLowerCase().includes(o));
    }
    if (filter.eventId) {
      const e = filter.eventId.toLowerCase();
      logs = logs.filter(l => l.eventId && l.eventId.toLowerCase().includes(e));
    }

    logs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const totalCount = logs.length;
    const skip = (page - 1) * limit;
    const paginated = logs.slice(skip, skip + limit);

    const stats = {
      total: totalCount,
      success: 0,
      partial_success: 0,
      failed: 0,
      pending: 0,
      timeout: 0,
      invalid_payload: 0
    };
    (this.data.metaEventLogs || []).forEach(l => {
      if (stats[l.status] !== undefined) {
        stats[l.status]++;
      }
    });

    return { logs: paginated, totalCount, stats };
  }

  async getMetaLogById(id) {
    const logs = this.data.metaEventLogs || [];
    return logs.find(l => String(l._id) === String(id) || l.eventId === id) || null;
  }

  async addMetaLog(log) {
    const MAX_LOGS = 5000;
    const newLog = {
      _id: log._id || `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...log
    };
    this.data.metaEventLogs.unshift(newLog);
    if (this.data.metaEventLogs.length > MAX_LOGS) {
      this.data.metaEventLogs = this.data.metaEventLogs.slice(0, MAX_LOGS);
    }
    this.saveToDisk();
    return newLog;
  }

  async updateMetaLog(id, updateData) {
    const log = await this.getMetaLogById(id);
    if (!log) return null;
    Object.assign(log, updateData, { updatedAt: new Date().toISOString() });
    this.saveToDisk();
    return log;
  }

  async deleteMetaLogs(filter = {}) {
    let logs = this.data.metaEventLogs || [];
    const initialCount = logs.length;
    if (filter.olderThanDays) {
      const cutoff = new Date(Date.now() - filter.olderThanDays * 24 * 60 * 60 * 1000);
      logs = logs.filter(l => new Date(l.createdAt || 0) >= cutoff);
    } else {
      logs = [];
    }
    this.data.metaEventLogs = logs;
    this.saveToDisk();
    return { deletedCount: initialCount - logs.length };
  }
}

export const localJsonStore = new LocalJsonStore();
export const memoryStore = localJsonStore;

// Resilient DB status indicator (pure local JSON store, zero external DB dependencies)
export async function connectToDatabase() {
  return {
    isConnected: false,
    mode: 'local_json',
    filePath: localJsonStore.filePath
  };
}
