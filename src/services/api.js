import axios from 'axios';

// Base API URL uses relative path /api so it works locally and on Netlify
const API_BASE = '/api';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to inject Admin JWT token if present in localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('regrow_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const api = {
  // Public APIs
  getSiteConfig: async () => {
    const res = await apiClient.get('/site-config');
    return res.data;
  },

  getCategories: async () => {
    const res = await apiClient.get('/categories');
    return res.data;
  },

  getProducts: async (params = {}) => {
    const res = await apiClient.get('/products', { params });
    return res.data;
  },

  getProductBySlug: async (slug) => {
    const res = await apiClient.get(`/products/${slug}`);
    return res.data;
  },

  createOrder: async (orderPayload) => {
    const res = await apiClient.post('/orders', orderPayload);
    return res.data;
  },

  getOrderById: async (orderId) => {
    const res = await apiClient.get(`/orders/${orderId}`);
    return res.data;
  },

  // Admin APIs
  adminLogin: async (credentials) => {
    const res = await apiClient.post('/admin/login', credentials);
    return res.data;
  },

  getAdminMe: async () => {
    const res = await apiClient.get('/admin/me');
    return res.data;
  },

  getAdminDashboard: async () => {
    const res = await apiClient.get('/admin/dashboard');
    return res.data;
  },

  // Admin Products
  getAdminProducts: async () => {
    const res = await apiClient.get('/admin/products');
    return res.data;
  },

  createAdminProduct: async (productData) => {
    const res = await apiClient.post('/admin/products', productData);
    return res.data;
  },

  updateAdminProduct: async (id, productData) => {
    const res = await apiClient.put(`/admin/products/${id}`, productData);
    return res.data;
  },

  deleteAdminProduct: async (id) => {
    const res = await apiClient.delete(`/admin/products/${id}`);
    return res.data;
  },

  // Admin Categories
  getAdminCategories: async () => {
    const res = await apiClient.get('/admin/categories');
    return res.data;
  },

  createAdminCategory: async (categoryData) => {
    const res = await apiClient.post('/admin/categories', categoryData);
    return res.data;
  },

  updateAdminCategory: async (id, categoryData) => {
    const res = await apiClient.put(`/admin/categories/${id}`, categoryData);
    return res.data;
  },

  deleteAdminCategory: async (id) => {
    const res = await apiClient.delete(`/admin/categories/${id}`);
    return res.data;
  },

  // Admin Orders
  getAdminOrders: async (params = {}) => {
    const res = await apiClient.get('/admin/orders', { params });
    return res.data;
  },

  getAdminOrderById: async (id) => {
    const res = await apiClient.get(`/admin/orders/${id}`);
    return res.data;
  },

  updateAdminOrderStatus: async (id, statusData) => {
    const res = await apiClient.put(`/admin/orders/${id}/status`, statusData);
    return res.data;
  },

  createAdminOrder: async (orderData) => {
    const res = await apiClient.post('/admin/orders', orderData);
    return res.data;
  },

  deleteAdminOrder: async (id) => {
    const res = await apiClient.delete(`/admin/orders/${id}`);
    return res.data;
  },

  // Admin Site Config (Homepage & CMS Editor)
  getAdminSiteConfig: async () => {
    const res = await apiClient.get('/admin/site-config');
    return res.data;
  },

  updateAdminSiteConfig: async (configData) => {
    const res = await apiClient.put('/admin/site-config', configData);
    return res.data;
  },

  // Image Upload
  uploadImage: async (imagePayload) => {
    const res = await apiClient.post('/upload', imagePayload);
    return res.data;
  }
};

export default api;

