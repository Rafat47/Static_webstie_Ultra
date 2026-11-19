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
        setCategories(res.data);
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
      displayOrder: cat.displayOrder || 0
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
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-brand-accent flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    cat.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {cat.isActive ? 'Active' : 'Hidden'}
                  </span>
                </div>
                <h3 className="font-bold text-base text-brand-dark">{cat.name}</h3>
                <p className="text-xs text-brand-muted line-clamp-2">{cat.description || 'No description provided.'}</p>
                <p className="text-[10px] font-mono text-gray-400">Slug: {cat.slug}</p>
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
