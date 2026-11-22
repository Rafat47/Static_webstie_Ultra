import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Package,
  Layers,
  X,
  Check,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Upload
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: 'Minoxidil',
    regularPrice: '',
    salePrice: '',
    stock: 50,
    shortDescription: '',
    description: '',
    images: [''],
    isFeatured: false,
    isActive: true,
    productType: 'minoxidil',
    badge: '',
    displayOrder: 1,
    comboItems: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        api.getAdminProducts(),
        api.getAdminCategories()
      ]);
      if (prodRes && prodRes.success) setProducts(prodRes.data);
      if (catRes && catRes.success) setCategories(catRes.data);
    } catch (err) {
      console.warn('Failed to load products/categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      slug: '',
      category: categories[0]?.name || 'Minoxidil',
      regularPrice: '',
      salePrice: '',
      stock: 50,
      shortDescription: '',
      description: '',
      images: [''],
      isFeatured: false,
      isActive: true,
      productType: 'minoxidil',
      badge: '',
      displayOrder: 1,
      comboItems: []
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const openEditModal = (prod) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name || '',
      slug: prod.slug || '',
      category: prod.category || 'Minoxidil',
      regularPrice: prod.regularPrice || '',
      salePrice: prod.salePrice || '',
      stock: prod.stock ?? 50,
      shortDescription: prod.shortDescription || '',
      description: prod.description || '',
      images: prod.images && prod.images.length > 0 ? prod.images : [''],
      isFeatured: Boolean(prod.isFeatured),
      isActive: prod.isActive !== false,
      productType: prod.productType || 'minoxidil',
      badge: prod.badge || '',
      displayOrder: prod.displayOrder ?? prod.carouselOrder ?? 0,
      comboItems: prod.comboItems || []
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleNameChange = (name) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setFormData(prev => ({
      ...prev,
      name,
      slug: editingProduct ? prev.slug : slug
    }));
  };

  const handleAddImageField = () => {
    setFormData(prev => ({ ...prev, images: [...prev.images, ''] }));
  };

  const handleImageChange = (index, val) => {
    const updated = [...formData.images];
    updated[index] = val;
    setFormData(prev => ({ ...prev, images: updated }));
  };

  const handleRemoveImageField = (index) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  // Combo items handlers
  const handleAddComboItem = () => {
    setFormData(prev => ({
      ...prev,
      comboItems: [...prev.comboItems, { name: '', quantity: 1, description: '' }]
    }));
  };

  const handleComboItemChange = (index, field, value) => {
    const updated = [...formData.comboItems];
    updated[index][field] = value;
    setFormData(prev => ({ ...prev, comboItems: updated }));
  };

  const handleRemoveComboItem = (index) => {
    setFormData(prev => ({
      ...prev,
      comboItems: prev.comboItems.filter((_, i) => i !== index)
    }));
  };

  const handleSubmitModal = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!formData.name.trim() || !formData.regularPrice || !formData.salePrice || !formData.category) {
      setModalError('Product Name, Regular Price, Sale Price, and Category are required.');
      return;
    }

    try {
      setModalLoading(true);
      const payload = {
        ...formData,
        regularPrice: Number(formData.regularPrice),
        salePrice: Number(formData.salePrice),
        stock: Number(formData.stock || 0),
        images: formData.images.filter(img => img.trim() !== '')
      };

      if (editingProduct) {
        const res = await api.updateAdminProduct(editingProduct._id, payload);
        if (res && res.success) {
          setIsModalOpen(false);
          loadData();
        } else {
          setModalError(res?.message || 'Failed to update product');
        }
      } else {
        const res = await api.createAdminProduct(payload);
        if (res && res.success) {
          setIsModalOpen(false);
          loadData();
        } else {
          setModalError(res?.message || 'Failed to create product');
        }
      }
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || 'Error saving product');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (prod) => {
    if (window.confirm(`Are you sure you want to delete "${prod.name}"? Past customer orders will remain completely intact.`)) {
      try {
        await api.deleteAdminProduct(prod._id);
        loadData();
      } catch (err) {
        alert('Failed to delete product: ' + err.message);
      }
    }
  };

  const handleToggleActive = async (prod) => {
    try {
      await api.updateAdminProduct(prod._id, { isActive: !prod.isActive });
      loadData();
    } catch (err) {
      console.warn('Failed to toggle status:', err);
    }
  };

  const handleToggleFeatured = async (prod) => {
    try {
      await api.updateAdminProduct(prod._id, { isFeatured: !prod.isFeatured });
      loadData();
    } catch (err) {
      console.warn('Failed to toggle featured:', err);
    }
  };

  // Filtered Products List with Serial Ordering
  const filteredProducts = products
    .filter(p => {
      const matchesCategory = selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.slug.includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      const catA = (a.category || '').toLowerCase();
      const catB = (b.category || '').toLowerCase();
      if (selectedCategory === 'All' && catA !== catB) return catA.localeCompare(catB);
      return (Number(a.displayOrder ?? a.carouselOrder) || 0) - (Number(b.displayOrder ?? b.carouselOrder) || 0);
    });

  return (
    <div className="space-y-6">
      {/* Top Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-dark">Product Catalog</h1>
          <p className="text-xs text-brand-muted mt-0.5">
            Add, update, and manage your Minoxidil, Derma Roller, and Combo inventory.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-brand-dark hover:bg-brand-navy text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="bg-white rounded-2xl p-4 border border-brand-border shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by product name or slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full sm:w-48 py-2 px-3 rounded-xl border border-gray-200 text-xs font-semibold text-brand-text bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
        >
          <option value="All">All Categories</option>
          {categories.map((c) => (
            <option key={c._id || c.slug} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Products Table (Desktop) & Cards (Mobile) */}
      <div className="bg-white rounded-2xl border border-brand-border shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-brand-accent animate-spin" />
            <p className="text-xs font-semibold text-brand-muted">Loading inventory...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-xs text-brand-muted space-y-3">
            <Package className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="font-semibold text-brand-text">No products match your criteria</p>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-brand-accent text-white font-bold rounded-lg text-xs"
            >
              Add First Product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-brand-muted uppercase font-bold text-[10px] tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Serial / Order</th>
                  <th className="py-3 px-4">Pricing</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Featured</th>
                  <th className="py-3 px-4">Active</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredProducts.map((prod) => (
                  <tr key={prod._id || prod.slug} className="hover:bg-gray-50/80 transition-colors">
                    {/* Item Thumbnail & Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.images?.[0] || ''}
                          alt={prod.name}
                          className="w-10 h-10 rounded-lg object-cover border border-gray-200 bg-gray-50 flex-shrink-0"
                        />
                        <div className="min-w-0 max-w-xs">
                          <p className="font-bold text-brand-dark truncate leading-tight">{prod.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5">{prod.slug}</p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-brand-accent">
                        {prod.category}
                      </span>
                    </td>

                    {/* Serial / Order */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-brand-dark text-white shadow-2xs">
                        Serial #{prod.displayOrder ?? prod.carouselOrder ?? 0}
                      </span>
                    </td>

                    {/* Pricing */}
                    <td className="py-3 px-4">
                      <p className="font-bold text-brand-dark">{formatCurrency(prod.salePrice, '৳')}</p>
                      {prod.regularPrice > prod.salePrice && (
                        <p className="text-[10px] text-gray-400 line-through">
                          {formatCurrency(prod.regularPrice, '৳')}
                        </p>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="py-3 px-4">
                      <span className={`font-bold ${prod.stock > 10 ? 'text-emerald-700' : prod.stock > 0 ? 'text-amber-600' : 'text-red-500'}`}>
                        {prod.stock} units
                      </span>
                    </td>

                    {/* Featured Toggle */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleFeatured(prod)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          prod.isFeatured ? 'bg-amber-100 text-amber-700' : 'text-gray-300 hover:text-amber-500'
                        }`}
                        title="Toggle Featured"
                      >
                        <Star className={`w-4 h-4 ${prod.isFeatured ? 'fill-amber-500' : ''}`} />
                      </button>
                    </td>

                    {/* Active Toggle */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleActive(prod)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${
                          prod.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {prod.isActive ? 'Active' : 'Disabled'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/product/${prod.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-gray-400 hover:text-brand-accent"
                          title="View on Storefront"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => openEditModal(prod)}
                          className="p-1.5 text-gray-500 hover:text-brand-dark"
                          title="Edit Product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(prod)}
                          className="p-1.5 text-gray-400 hover:text-red-600"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-brand-dark/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-brand-border p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h3 className="text-lg font-bold text-brand-dark">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-brand-dark"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitModal} className="space-y-4 text-xs">
              {/* Product Name */}
              <div>
                <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Kirkland Minoxidil 5% (60ml)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent text-xs font-semibold"
                />
              </div>

              {/* URL Slug */}
              <div>
                <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">
                  URL Slug (Used in Facebook Ads & Product Link) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g. kirkland-minoxidil-5"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-brand-accent"
                />
              </div>

              {/* Category, Serial Order & Product Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 font-semibold"
                  >
                    {categories.map((c) => (
                      <option key={c._id || c.slug} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">
                    Serial / Order in Category *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                    placeholder="e.g. 1"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 font-bold"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Lower numbers appear first (1 shows before 2).</p>
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">
                    Product Type
                  </label>
                  <select
                    value={formData.productType}
                    onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 font-semibold"
                  >
                    <option value="minoxidil">Minoxidil Solution</option>
                    <option value="derma_roller">Derma Roller</option>
                    <option value="combo">Combo Package</option>
                    <option value="other">Scalp Care / Other</option>
                  </select>
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">
                    Regular Price (৳) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.regularPrice}
                    onChange={(e) => setFormData({ ...formData, regularPrice: e.target.value })}
                    placeholder="1650"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">
                    Sale Price (৳) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                    placeholder="1350"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 font-bold text-emerald-700"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">
                    Current Stock *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="50"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 font-bold"
                  />
                </div>
              </div>

              {/* Short & Full Description */}
              <div>
                <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">
                  Short Description
                </label>
                <input
                  type="text"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  placeholder="One sentence summary for cards..."
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">
                  Full Description
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Complete clinical overview, directions, and ingredients..."
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200"
                />
              </div>

              {/* Images URLs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold uppercase tracking-wider text-brand-dark">
                    Product Image URLs
                  </label>
                  <button
                    type="button"
                    onClick={handleAddImageField}
                    className="text-brand-accent hover:underline font-bold text-[11px]"
                  >
                    + Add Image URL
                  </button>
                </div>
                {formData.images.map((img, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={img}
                      onChange={(e) => handleImageChange(idx, e.target.value)}
                      placeholder="https://example.com/image.webp"
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200"
                    />
                    {formData.images.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveImageField(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Combo Items (if productType is combo) */}
              {formData.productType === 'combo' && (
                <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-brand-navy">Combo Included Items</span>
                    <button
                      type="button"
                      onClick={handleAddComboItem}
                      className="text-brand-accent font-bold hover:underline"
                    >
                      + Add Item
                    </button>
                  </div>
                  {formData.comboItems.map((cItem, cIdx) => (
                    <div key={cIdx} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-xl border border-gray-200">
                      <input
                        type="text"
                        placeholder="Item name"
                        value={cItem.name}
                        onChange={(e) => handleComboItemChange(cIdx, 'name', e.target.value)}
                        className="col-span-6 px-2 py-1 rounded border border-gray-200"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={cItem.quantity}
                        onChange={(e) => handleComboItemChange(cIdx, 'quantity', Number(e.target.value))}
                        className="col-span-2 px-2 py-1 rounded border border-gray-200"
                      />
                      <input
                        type="text"
                        placeholder="Details"
                        value={cItem.description}
                        onChange={(e) => handleComboItemChange(cIdx, 'description', e.target.value)}
                        className="col-span-3 px-2 py-1 rounded border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveComboItem(cIdx)}
                        className="col-span-1 text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Toggles */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="rounded text-brand-accent focus:ring-brand-accent"
                  />
                  <span className="font-bold text-brand-dark">Featured on Homepage</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded text-brand-accent focus:ring-brand-accent"
                  />
                  <span className="font-bold text-brand-dark">Active for Sale</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-6 py-2.5 rounded-xl bg-brand-dark hover:bg-brand-navy text-white font-bold shadow-md disabled:opacity-50"
                >
                  {modalLoading ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

