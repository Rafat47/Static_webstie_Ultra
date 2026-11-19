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
  MessageCircle
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Selected Order Drawer / Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusNote, setStatusNote] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    loadOrders();
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-dark">Order Management</h1>
          <p className="text-xs text-brand-muted mt-0.5">
            Track customer shipments, update fulfillment stages, and review Cash on Delivery totals.
          </p>
        </div>
        <button
          onClick={loadOrders}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-brand-text hover:bg-gray-50 flex items-center gap-1.5 shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh List</span>
        </button>
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

      {/* Orders Table */}
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
          <div className="overflow-x-auto">
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
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredOrders.map((order) => (
                  <tr key={order._id || order.orderId} className="hover:bg-gray-50/80 transition-colors">
                    {/* Order ID */}
                    <td className="py-3 px-4 font-mono font-bold text-brand-dark">
                      {order.orderId}
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4">
                      <p className="font-bold text-brand-text">{order.customer?.fullName}</p>
                      <p className="text-[11px] text-brand-muted font-mono">{order.customer?.phoneNumber}</p>
                    </td>

                    {/* Area */}
                    <td className="py-3 px-4">
                      <span className="text-[11px] font-semibold text-brand-muted">
                        {order.customer?.deliveryArea === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'}
                      </span>
                    </td>

                    {/* Items Count & Preview */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-brand-dark">
                        {(order.items || []).reduce((acc, i) => acc + i.quantity, 0)} Units
                      </span>
                    </td>

                    {/* Total Amount */}
                    <td className="py-3 px-4 font-black text-brand-dark">
                      {formatCurrency(order.finalTotal, '৳')}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-[11px] text-brand-muted">
                      {formatDate(order.createdAt)}
                    </td>

                    {/* View Action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openOrderDetail(order)}
                        className="px-3 py-1 bg-brand-dark hover:bg-brand-navy text-white text-[11px] font-bold rounded-lg shadow-xs transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
              <a
                href={`https://wa.me/${selectedOrder.customer?.phoneNumber?.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp Customer</span>
              </a>
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
                  <span className="text-brand-muted block">District / City:</span>
                  <span className="font-bold text-brand-dark">{selectedOrder.customer?.district}</span>
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
                    placeholder="e.g. Called customer, confirmedBanani address"
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
                className="w-full py-2.5 bg-brand-dark hover:bg-brand-navy text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
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
