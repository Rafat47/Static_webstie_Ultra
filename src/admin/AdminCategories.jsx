import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Layers, X, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../services/api';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
    isActive: true,
    displayOrder: 0
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminCategories();
      if (res && res.success) {
        const sorted = (res.data || []).sort((a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0));
        setCategories(sorted);
      }
    } catch (err) {
      console.warn('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      image: '',
      isActive: true,
      displayOrder: categories.length + 1
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name || '',
      slug: cat.slug || '',
      description: cat.description || '',
      image: cat.image || '',
      isActive: cat.isActive !== false,
      displayOrder: cat.displayOrder ?? 0
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleNameChange = (name) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setFormData(prev => ({
      ...prev,
      name,
      slug: editingCategory ? prev.slug : slug
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setModalError('Category name is required.');
      return;
    }

    try {
      setModalLoading(true);
      if (editingCategory) {
        await api.updateAdminCategory(editingCategory._id, formData);
      } else {
        await api.createAdminCategory(formData);
      }
      setIsModalOpen(false);
      loadCategories();
    } catch (err) {
      setModalError(err.response?.data?.message || err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (cat) => {
    if (window.confirm(`Are you sure you want to delete category "${cat.name}"? Products in this category will not be deleted.`)) {
      try {
        await api.deleteAdminCategory(cat._id);
        loadCategories();
      } catch (err) {
        alert('Failed to delete category: ' + err.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-dark">Category Management</h1>
          <p className="text-xs text-brand-muted mt-0.5">
            Organize products into customer-facing departments (Minoxidil, Rollers, Combos).
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-brand-dark hover:bg-brand-navy text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-brand-accent animate-spin" />
          <p className="text-xs font-semibold text-brand-muted">Loading categories...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div
              key={cat._id || cat.slug}
              className="bg-white rounded-2xl border border-brand-border p-5 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-brand-dark text-white shadow-2xs">
                      Serial: #{cat.displayOrder ?? 0}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      cat.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {cat.isActive ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-brand-accent flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>

                {/* Category Image Thumbnail */}
                <div className="flex items-center gap-3">
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-16 h-12 rounded-lg object-cover border border-gray-200 bg-gray-50 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-12 rounded-lg bg-gray-100 border border-dashed border-gray-300 text-gray-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      No Image
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-base text-brand-dark truncate">{cat.name}</h3>
                    <p className="text-[10px] font-mono text-gray-400">/{cat.slug}</p>
                  </div>
                </div>

                <p className="text-xs text-brand-muted line-clamp-2">{cat.description || 'No description provided.'}</p>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEditModal(cat)}
                  className="p-1.5 text-gray-500 hover:text-brand-dark text-xs font-semibold flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(cat)}
                  className="p-1.5 text-gray-400 hover:text-red-600 text-xs font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-brand-dark/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-brand-border p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-brand-dark">
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-brand-dark">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Minoxidil"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">Slug *</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 font-mono"
                />
              </div>

              {/* Serial Number / Display Order */}
              <div>
                <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">
                  Display Serial Number (Order) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  placeholder="e.g. 1"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 font-bold"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Controls the order on the homepage, navbar, and carousel. Smaller numbers appear first (e.g. 1 appears before 2).
                </p>
              </div>

              {/* Category Image URL (Navbar Hover & Carousel) */}
              <div>
                <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">
                  Category Image URL (Navbar Hover Preview & Carousel)
                </label>
                <input
                  type="text"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://example.com/category.webp"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 font-mono text-xs"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  This image is shown when hovering over the category in Navbar and inside the Category Carousel cards.
                </p>
                {formData.image && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3">
                    <img
                      src={formData.image}
                      alt="Category Preview"
                      className="h-16 w-24 object-cover rounded-lg border border-gray-200 bg-white"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div className="text-[11px] text-gray-500">
                      <p className="font-bold text-gray-700">Image Preview</p>
                      <p className="text-[10px] text-gray-400">Used for Navbar hover preview and homepage carousel card.</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Short description for storefront filter..."
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="catActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded text-brand-accent focus:ring-brand-accent"
                />
                <label htmlFor="catActive" className="font-bold text-brand-dark cursor-pointer">
                  Visible in Store Filters
                </label>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 font-bold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 rounded-xl bg-brand-dark text-white font-bold disabled:opacity-50"
                >
                  {modalLoading ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

