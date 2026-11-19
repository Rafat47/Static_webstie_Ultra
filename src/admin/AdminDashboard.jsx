import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  TrendingUp,
  Package,
  ArrowRight,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminDashboard();
      if (res && res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 text-brand-accent animate-spin" />
        <p className="text-xs font-semibold text-brand-muted">Loading live analytics...</p>
      </div>
    );
  }

  const stats = data?.stats || {};
  const topSelling = data?.topSelling || [];
  const recentOrders = data?.recentOrders || [];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-dark">Store Overview</h1>
          <p className="text-xs text-brand-muted mt-0.5">
            Real-time sales, order fulfillment metrics, and product inventory status.
          </p>
        </div>
        <button
          onClick={loadDashboard}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-brand-text hover:bg-gray-50 flex items-center gap-1.5 shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-brand-border shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-muted">Total Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-brand-dark">
            {formatCurrency(stats.totalRevenue || 0, '৳')}
          </p>
          <p className="text-[11px] text-emerald-700 font-semibold">Excludes cancelled orders</p>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-2xl p-5 border border-brand-border shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-muted">Total Orders</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-brand-accent flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-brand-dark">
            {stats.totalOrders || 0}
          </p>
          <p className="text-[11px] text-brand-muted font-medium">All recorded orders</p>
        </div>

        {/* Pending Orders */}
        <div className="bg-white rounded-2xl p-5 border border-brand-border shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Pending Review</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-600">
            {stats.pendingOrders || 0}
          </p>
          <p className="text-[11px] text-amber-700 font-semibold">Needs phone confirmation</p>
        </div>

        {/* Delivered Orders */}
        <div className="bg-white rounded-2xl p-5 border border-brand-border shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Delivered</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-600">
            {stats.deliveredOrders || 0}
          </p>
          <p className="text-[11px] text-emerald-700 font-semibold">Completed COD orders</p>
        </div>
      </div>

      {/* Main Grid: Recent Orders & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Recent Orders Table */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-brand-border shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-brand-dark">Recent Incoming Orders</h3>
            <Link to="/admin/orders" className="text-xs font-bold text-brand-accent hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-10 text-center text-xs text-brand-muted">
              No orders placed yet. Orders will appear here as soon as customers submit checkout.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-brand-muted uppercase font-bold text-[10px] tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {recentOrders.map((order) => (
                    <tr key={order._id || order.orderId} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-brand-dark">
                        {order.orderId}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-brand-text">{order.customer?.fullName}</p>
                        <p className="text-[11px] text-brand-muted">{order.customer?.phoneNumber}</p>
                      </td>
                      <td className="py-3 px-4 font-bold text-brand-dark">
                        {formatCurrency(order.finalTotal, '৳')}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          order.orderStatus === 'Pending' ? 'bg-amber-100 text-amber-800' :
                          order.orderStatus === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                          order.orderStatus === 'Shipped' ? 'bg-purple-100 text-purple-800' :
                          order.orderStatus === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/admin/orders`}
                          className="text-brand-accent hover:underline font-bold"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Selling Products */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-brand-border shadow-xs p-5 space-y-4">
          <h3 className="font-bold text-sm text-brand-dark border-b border-gray-100 pb-3">
            Top Performing Products
          </h3>

          {topSelling.length === 0 ? (
            <p className="text-xs text-brand-muted py-6 text-center">
              Sales rankings will appear here as soon as orders are confirmed.
            </p>
          ) : (
            <div className="space-y-3">
              {topSelling.map((prod, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span className="w-5 h-5 rounded-full bg-gray-100 text-brand-dark font-extrabold flex items-center justify-center text-[10px] flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-brand-dark truncate">{prod.name}</span>
                  </div>
                  <span className="font-bold text-emerald-600 flex-shrink-0 bg-emerald-50 px-2 py-0.5 rounded">
                    {prod.count} sold
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2">
            <Link
              to="/admin/products"
              className="w-full py-2.5 px-3 bg-gray-50 hover:bg-gray-100 text-brand-dark text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Manage All Products</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

