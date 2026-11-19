import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  Phone,
  MapPin,
  Calendar,
  X,
  FileText,
  Save,
  RefreshCw,
  MessageCircle,
  Trash2,
  Plus,
  ShoppingBag
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Selected Order Drawer / Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusNote, setStatusNote] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Manual Order Creation Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [createFormError, setCreateFormError] = useState('');
  const [newOrderData, setNewOrderData] = useState({
    fullName: '',
    phoneNumber: '',
    address: '',
    district: 'Dhaka',
    deliveryArea: 'inside_dhaka',
    notes: '',
    orderStatus: 'Confirmed',
    internalNotes: 'Manually created by Admin',
    items: []
  });

  useEffect(() => {
    loadOrders();
    loadProducts();
  }, [statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      const res = await api.getAdminOrders(params);
      if (res && res.success) {
        setOrders(res.data);
      }
    } catch (err) {
      console.warn('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await api.getAdminProducts();
      if (res && res.success && res.data) {
        setProducts(res.data);
      }
    } catch (err) {
      console.warn('Failed to load products for manual order:', err);
    }
  };

  const openOrderDetail = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.orderStatus);
    setInternalNotes(order.internalNotes || '');
    setStatusNote('');
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    try {
      setSavingStatus(true);
      const res = await api.updateAdminOrderStatus(selectedOrder.orderId, {
        status: newStatus,
        note: statusNote || `Status updated to ${newStatus}`,
        internalNotes
      });
      if (res && res.success) {
        setSelectedOrder(res.data);
        loadOrders();
      }
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    } finally {
      setSavingStatus(false);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    const confirmDelete = window.confirm(`Are you sure you want to permanently delete Order #${orderId}? This cannot be undone.`);
    if (!confirmDelete) return;

    try {
      setDeletingId(orderId);
      const res = await api.deleteAdminOrder(orderId);
      if (res && res.success) {
        if (selectedOrder && (selectedOrder.orderId === orderId || selectedOrder._id === orderId)) {
          setSelectedOrder(null);
        }
        await loadOrders();
      } else {
        alert(res?.message || 'Failed to delete order');
      }
    } catch (err) {
      alert('Failed to delete order: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Manual Order Creation Helpers
  const openCreateModal = () => {
    setCreateFormError('');
    setNewOrderData({
      fullName: '',
      phoneNumber: '',
      address: '',
      district: 'Dhaka',
      deliveryArea: 'inside_dhaka',
      notes: '',
      orderStatus: 'Confirmed',
      internalNotes: 'Manually created by Admin',
      items: products.length > 0 ? [{ productId: products[0]._id, quantity: 1 }] : []
    });
    setIsCreateModalOpen(true);
  };

  const addManualOrderItem = () => {
    if (products.length === 0) return;
    setNewOrderData(prev => ({
      ...prev,
      items: [...prev.items, { productId: products[0]._id, quantity: 1 }]
    }));
  };

  const updateManualOrderItem = (index, field, value) => {
    setNewOrderData(prev => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, items: updated };
    });
  };

  const removeManualOrderItem = (index) => {
    setNewOrderData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Calculate manual order subtotal & total
  const manualDeliveryFee = newOrderData.deliveryArea === 'inside_dhaka' ? 70 : 130;
  const manualSubtotal = newOrderData.items.reduce((acc, item) => {
    const prod = products.find(p => p._id === item.productId || p.slug === item.productId);
    const price = prod ? prod.salePrice : 0;
    return acc + (price * (parseInt(item.quantity) || 1));
  }, 0);
  const manualFinalTotal = manualSubtotal + manualDeliveryFee;

  const handleCreateOrderSubmit = async (e) => {
    e.preventDefault();
    setCreateFormError('');

    if (!newOrderData.fullName.trim() || !newOrderData.phoneNumber.trim() || !newOrderData.address.trim()) {
      setCreateFormError('Customer Full Name, Phone Number, and Address are required.');
      return;
    }

    if (newOrderData.items.length === 0) {
      setCreateFormError('Please select at least one product for the order.');
      return;
    }

    try {
      setCreatingOrder(true);
      const payload = {
        customer: {
          fullName: newOrderData.fullName.trim(),
          phoneNumber: newOrderData.phoneNumber.trim(),
          address: newOrderData.address.trim(),
          deliveryArea: newOrderData.deliveryArea,
          district: newOrderData.deliveryArea === 'inside_dhaka' ? 'Dhaka' : 'Outside Dhaka',
          notes: newOrderData.notes.trim()
        },
        items: newOrderData.items.map(item => {
          const prod = products.find(p => p._id === item.productId);
          return {
            productId: item.productId,
            slug: prod ? prod.slug : '',
            productName: prod ? prod.name : 'Hair Care Item',
            unitPrice: prod ? prod.salePrice : 0,
            quantity: Math.max(1, parseInt(item.quantity) || 1)
          };
        }),
        orderStatus: newOrderData.orderStatus,
        internalNotes: newOrderData.internalNotes
      };

      const res = await api.createAdminOrder(payload);
      if (res && res.success) {
        setIsCreateModalOpen(false);
        await loadOrders();
      } else {
        setCreateFormError(res?.message || 'Failed to create order.');
      }
    } catch (err) {
      setCreateFormError(err.response?.data?.message || err.message || 'Failed to create order.');
    } finally {
      setCreatingOrder(false);
    }
  };

  // Client-side search filtering
  const filteredOrders = orders.filter(o => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      o.orderId.toLowerCase().includes(q) ||
      o.customer?.fullName?.toLowerCase().includes(q) ||
      o.customer?.phoneNumber?.includes(q)
    );
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Processing': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Shipped': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Delivered': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'Rejected': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header with Manual Order Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-dark">Order Management</h1>
          <p className="text-xs text-brand-muted mt-0.5">
            Track customer shipments, place custom orders, delete mistaken orders, and review COD totals.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-brand-dark hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Manual Order</span>
          </button>
          <button
            onClick={loadOrders}
            className="px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-brand-text hover:bg-gray-50 flex items-center gap-1.5 shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-brand-border shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Order ID (e.g. HAIR-2611), Customer Name, or Phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
          />
        </div>

        {/* Status Dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-48 py-2 px-3 rounded-xl border border-gray-200 text-xs font-semibold text-brand-text bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending (Unconfirmed)</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Processing">Processing</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Orders List / Table */}
      <div className="bg-white rounded-2xl border border-brand-border shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-brand-accent animate-spin" />
            <p className="text-xs font-semibold text-brand-muted">Fetching orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-xs text-brand-muted space-y-2">
            <p className="font-bold text-brand-dark text-sm">No orders found</p>
            <p>Orders matching your filter or search will be listed here.</p>
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-brand-muted uppercase font-bold text-[10px] tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4">Order Ref</th>
                    <th className="py-3 px-4">Customer Details</th>
                    <th className="py-3 px-4">Area</th>
                    <th className="py-3 px-4">Items</th>
                    <th className="py-3 px-4">Payable</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredOrders.map((order) => (
                    <tr key={order._id || order.orderId} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-brand-dark">
                        {order.orderId}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-brand-text">{order.customer?.fullName}</p>
                        <p className="text-[11px] text-brand-muted font-mono">{order.customer?.phoneNumber}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-semibold text-brand-muted">
                          {order.customer?.deliveryArea === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-brand-dark">
                          {(order.items || []).reduce((acc, i) => acc + i.quantity, 0)} Units
                        </span>
                      </td>
                      <td className="py-3 px-4 font-black text-brand-dark">
                        {formatCurrency(order.finalTotal, '৳')}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(order.orderStatus)}`}>
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-brand-muted">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openOrderDetail(order)}
                            className="px-3 py-1 bg-brand-dark hover:bg-black text-white text-[11px] font-bold rounded-lg shadow-xs transition-colors"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(order.orderId)}
                            disabled={deletingId === order.orderId}
                            className="p-1.5 text-red-600 hover:text-white hover:bg-red-600 rounded-lg border border-red-200 transition-colors"
                            title="Delete Order"
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

            {/* Mobile Card View */}
            <div className="sm:hidden divide-y divide-gray-100">
              {filteredOrders.map((order) => (
                <div key={order._id || order.orderId} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-xs text-brand-dark">{order.orderId}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(order.orderStatus)}`}>
                      {order.orderStatus}
                    </span>
                  </div>
                  <div className="text-xs text-gray-700">
                    <p className="font-bold text-brand-dark">{order.customer?.fullName}</p>
                    <p className="text-[11px] text-brand-muted font-mono">{order.customer?.phoneNumber}</p>
                    <p className="text-[11px] text-brand-muted">{order.customer?.address}</p>
                  </div>
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="font-black text-brand-dark">{formatCurrency(order.finalTotal, '৳')}</span>
                    <span className="text-[10px] text-brand-muted">{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => openOrderDetail(order)}
                      className="px-3 py-1.5 bg-brand-dark text-white text-xs font-bold rounded-lg flex-1"
                    >
                      Inspect
                    </button>
                    <button
                      onClick={() => handleDeleteOrder(order.orderId)}
                      disabled={deletingId === order.orderId}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
                      title="Delete Order"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Manual Order Creation Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-brand-dark/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-brand-border p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] text-brand-muted uppercase tracking-widest font-bold">Admin Manual Order</span>
                <h3 className="text-xl font-black text-brand-dark">Create Custom Customer Order</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-brand-dark"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createFormError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                {createFormError}
              </div>
            )}

            <form onSubmit={handleCreateOrderSubmit} className="space-y-4 text-xs">
              {/* Customer Details */}
              <div className="space-y-3">
                <h4 className="font-bold uppercase tracking-wider text-brand-dark border-b border-gray-100 pb-1">
                  1. Customer Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Arif Hossain"
                      value={newOrderData.fullName}
                      onChange={(e) => setNewOrderData({ ...newOrderData, fullName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="017XXXXXXXX"
                      value={newOrderData.phoneNumber}
                      onChange={(e) => setNewOrderData({ ...newOrderData, phoneNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Full Delivery Address *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="House, Road, Area, Thana, District"
                    value={newOrderData.address}
                    onChange={(e) => setNewOrderData({ ...newOrderData, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Delivery Area</label>
                    <select
                      value={newOrderData.deliveryArea}
                      onChange={(e) => setNewOrderData({ ...newOrderData, deliveryArea: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 font-semibold bg-white"
                    >
                      <option value="inside_dhaka">Inside Dhaka (৳70)</option>
                      <option value="outside_dhaka">Outside Dhaka (৳130)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Initial Status</label>
                    <select
                      value={newOrderData.orderStatus}
                      onChange={(e) => setNewOrderData({ ...newOrderData, orderStatus: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 font-semibold bg-white"
                    >
                      <option value="Confirmed">Confirmed</option>
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Order Items Selector */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-gray-100 pb-1">
                  <h4 className="font-bold uppercase tracking-wider text-brand-dark">
                    2. Order Products ({newOrderData.items.length})
                  </h4>
                  <button
                    type="button"
                    onClick={addManualOrderItem}
                    className="text-brand-dark hover:underline font-bold text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                {newOrderData.items.map((item, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-2">
                    <select
                      value={item.productId}
                      onChange={(e) => updateManualOrderItem(idx, 'productId', e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white font-medium text-xs"
                    >
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} — {formatCurrency(p.salePrice, '৳')}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateManualOrderItem(idx, 'quantity', e.target.value)}
                      className="w-16 px-2 py-1.5 rounded-lg border border-gray-200 text-center font-bold"
                    />
                    {newOrderData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeManualOrderItem(idx)}
                        className="p-1.5 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}

                {/* Real-time Order Summary */}
                <div className="p-3 bg-gray-100 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between text-brand-muted">
                    <span>Subtotal:</span>
                    <span className="font-bold text-brand-dark">{formatCurrency(manualSubtotal, '৳')}</span>
                  </div>
                  <div className="flex justify-between text-brand-muted">
                    <span>Delivery Charge:</span>
                    <span className="font-bold text-brand-dark">{formatCurrency(manualDeliveryFee, '৳')}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-brand-dark pt-1 border-t border-gray-300">
                    <span>Total Payable (COD):</span>
                    <span className="text-brand-accent">{formatCurrency(manualFinalTotal, '৳')}</span>
                  </div>
                </div>
              </div>

              {/* Order Notes */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Internal Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Customer confirmed order via Facebook Messenger"
                  value={newOrderData.notes}
                  onChange={(e) => setNewOrderData({ ...newOrderData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={creatingOrder}
                className="w-full py-3 bg-brand-dark hover:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {creatingOrder ? 'Creating Order...' : `Create Order (${formatCurrency(manualFinalTotal, '৳')})`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-brand-dark/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-brand-border p-6 sm:p-8 space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] text-brand-muted uppercase tracking-widest font-bold">Order Inspection</span>
                <h3 className="text-xl font-black text-brand-dark font-mono">
                  {selectedOrder.orderId}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-full text-gray-400 hover:text-brand-dark"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Contact & WhatsApp Action */}
            <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-accent" />
                <span className="font-bold text-brand-dark">{selectedOrder.customer?.phoneNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`https://wa.me/${selectedOrder.customer?.phoneNumber?.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
                <button
                  onClick={() => handleDeleteOrder(selectedOrder.orderId)}
                  className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-600 text-red-600 hover:text-white font-bold flex items-center gap-1.5 border border-red-200 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Order</span>
                </button>
              </div>
            </div>

            {/* Customer & Address Details */}
            <div className="space-y-3 text-xs">
              <h4 className="font-bold uppercase tracking-wider text-brand-dark border-b border-gray-100 pb-2">
                Customer Information
              </h4>
              <div className="grid grid-cols-2 gap-3 text-gray-700">
                <div>
                  <span className="text-brand-muted block">Full Name:</span>
                  <span className="font-bold text-brand-dark text-sm">{selectedOrder.customer?.fullName}</span>
                </div>
                <div>
                  <span className="text-brand-muted block">Delivery Area:</span>
                  <span className="font-bold text-brand-dark">
                    {selectedOrder.customer?.deliveryArea === 'inside_dhaka' ? 'Inside Dhaka City' : 'Outside Dhaka'}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-brand-muted block">Delivery Address:</span>
                  <span className="font-semibold text-brand-dark">{selectedOrder.customer?.address}</span>
                </div>
                {selectedOrder.customer?.notes && (
                  <div className="col-span-2 p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                    <span className="font-bold block">Customer Note:</span>
                    {selectedOrder.customer.notes}
                  </div>
                )}
              </div>
            </div>

            {/* Purchased Items Snapshot */}
            <div className="space-y-3 text-xs">
              <h4 className="font-bold uppercase tracking-wider text-brand-dark border-b border-gray-100 pb-2">
                Ordered Products Snapshot
              </h4>
              <div className="divide-y divide-gray-100">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-brand-dark">{item.productName}</span>
                      <span className="text-brand-muted block text-[11px]">
                        Qty: {item.quantity} × {formatCurrency(item.unitPrice, '৳')}
                      </span>
                    </div>
                    <span className="font-bold text-brand-dark">
                      {formatCurrency(item.unitPrice * item.quantity, '৳')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="pt-2 border-t border-gray-100 space-y-1 text-xs">
                <div className="flex justify-between text-brand-muted">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(selectedOrder.subtotal, '৳')}</span>
                </div>
                <div className="flex justify-between text-brand-muted">
                  <span>Delivery Charge:</span>
                  <span>{formatCurrency(selectedOrder.deliveryCharge, '৳')}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-brand-dark pt-1 border-t border-gray-200">
                  <span>Total Payable (COD):</span>
                  <span className="text-brand-accent">{formatCurrency(selectedOrder.finalTotal, '৳')}</span>
                </div>
              </div>
            </div>

            {/* Status Update Form */}
            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-200 space-y-3 text-xs">
              <h4 className="font-bold uppercase tracking-wider text-brand-navy">
                Update Fulfillment Status
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">New Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 font-semibold bg-white"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Log Note</label>
                  <input
                    type="text"
                    placeholder="e.g. Called customer, confirmed address"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Internal Store Notes</label>
                <input
                  type="text"
                  placeholder="Steadfast / Redx tracking code or rider notes..."
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white"
                />
              </div>

              <button
                type="button"
                onClick={handleUpdateStatus}
                disabled={savingStatus}
                className="w-full py-2.5 bg-brand-dark hover:bg-black text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingStatus ? 'Updating...' : 'Save Status Update'}</span>
              </button>
            </div>

            {/* Status History Logs */}
            {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
              <div className="space-y-2 text-xs">
                <h4 className="font-bold uppercase tracking-wider text-brand-dark border-b border-gray-100 pb-2">
                  Status History Trail
                </h4>
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {selectedOrder.statusHistory.map((h, hIdx) => (
                    <div key={hIdx} className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-start justify-between">
                      <div>
                        <span className="font-bold text-brand-dark">{h.status}</span>
                        {h.note && <p className="text-[11px] text-gray-600 mt-0.5">{h.note}</p>}
                      </div>
                      <div className="text-right text-[10px] text-brand-muted">
                        <p>{formatDate(h.timestamp)}</p>
                        <p className="font-semibold">{h.updatedBy}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
