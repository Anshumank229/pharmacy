import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosClient';
import {
  Package, CheckCircle, Clock, XCircle, Truck,
  ChevronDown, ChevronUp, Calendar, MapPin, CreditCard,
  AlertCircle, Filter, Search, Download, Printer
} from 'lucide-react';
import toast from 'react-hot-toast';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/orders/my-orders");
      setOrders(Array.isArray(res.data) ? res.data : res.data.orders || []);
    } catch (error) {
      console.error('Fetch orders error:', error);
      toast.error('Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedOrderId(prev => prev === id ? null : id);
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order? This cannot be undone.')) return;
    setCancellingId(orderId);
    try {
      await api.put(`/orders/${orderId}/cancel`);
      toast.success('Order cancelled successfully');
      setOrders(prev =>
        prev.map(o => o._id === orderId ? { ...o, orderStatus: 'cancelled' } : o)
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancellingId(null);
    }
  };

  // ── Invoice Generator ────────────────────────────────────────────────────────
  const downloadInvoice = (order) => {
    const orderId = order._id.slice(-8).toUpperCase();
    const date = new Date(order.createdAt).toLocaleDateString('en-IN');

    // Address formatting
    const address = typeof order.shippingAddress === 'string'
      ? order.shippingAddress
      : `${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}`;

    const itemsRows = order.items.map((item, i) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${i + 1}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.medicine?.name || 'Unknown Medicine'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${orderId}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
          .logo { font-size: 28px; font-weight: bold; color: #2563eb; }
          .invoice-title { font-size: 24px; color: #555; text-align: right; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; }
          .label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
          .value { font-size: 16px; font-weight: 500; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { text-align: left; padding: 12px 8px; background: #f8f9fa; font-weight: 600; font-size: 14px; border-bottom: 2px solid #ddd; }
          .total-section { text-align: right; margin-top: 20px; }
          .total-row { display: flex; justify-content: flex-end; gap: 40px; margin-bottom: 10px; }
          .grand-total { font-size: 20px; font-weight: bold; color: #2563eb; }
          .footer { margin-top: 60px; text-align: center; font-size: 14px; color: #888; border-top: 1px solid #eee; padding-top: 20px; }
          @media print { .no-print { display: none; } body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">MedStore</div>
          <div class="invoice-title">TAX INVOICE</div>
        </div>

        <div class="info-grid">
          <div>
            <div class="label">Billed To</div>
            <div class="value">${order.user?.name || 'Customer'}</div>
            <div style="font-size: 14px; color: #555; margin-top: 5px; line-height: 1.4;">${address}</div>
          </div>
          <div style="text-align: right;">
            <div class="label">Invoice Details</div>
            <div class="value">No: #${orderId}</div>
            <div class="value">Date: ${date}</div>
            <div class="value">Method: ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th width="5%">#</th>
              <th width="50%">Item</th>
              <th width="10%" style="text-align: center;">Qty</th>
              <th width="15%" style="text-align: right;">Rate</th>
              <th width="20%" style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div class="total-section">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>₹${order.totalAmount.toFixed(2)}</span>
          </div>
          ${order.coupon ? `
          <div class="total-row" style="color: #16a34a;">
            <span>Discount:</span>
            <span>- Included</span>
          </div>` : ''}
          <div class="total-row grand-total">
            <span>Total:</span>
            <span>₹${order.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for choosing MedStore!</p>
          <p>For support, email us at support@medstore.com</p>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 40px;">
          <button onclick="window.print()" style="background: #2563eb; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; cursor: pointer;">
            Print / Save as PDF
          </button>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([invoiceHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const getStatusStep = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 0;
      case 'processing': return 1;
      case 'shipped': return 2;
      case 'delivered': return 3;
      default: return 0;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'shipped': return 'text-blue-600 bg-blue-100';
      case 'processing': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // ── Filter Logic ─────────────────────────────────────────────────────────────
  const filteredOrders = orders.filter(order => {
    const status = order.orderStatus?.toLowerCase() || '';
    const matchesStatus = filterStatus === 'all' || status === filterStatus;
    const matchesSearch = !searchQuery ||
      order._id?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const orderStats = {
    total: orders.length,
    delivered: orders.filter(o => o.orderStatus?.toLowerCase() === 'delivered').length,
    processing: orders.filter(o => ['processing', 'pending', 'shipped'].includes(o.orderStatus?.toLowerCase())).length,
    cancelled: orders.filter(o => o.orderStatus?.toLowerCase() === 'cancelled').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">Track and manage your orders</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Orders', value: orderStats.total, color: 'border-blue-600', icon: <Package className="h-6 w-6 text-blue-600" /> },
            { label: 'Delivered', value: orderStats.delivered, color: 'border-green-600', icon: <CheckCircle className="h-6 w-6 text-green-600" /> },
            { label: 'In Progress', value: orderStats.processing, color: 'border-yellow-600', icon: <Clock className="h-6 w-6 text-yellow-600" /> },
            { label: 'Cancelled', value: orderStats.cancelled, color: 'border-red-600', icon: <XCircle className="h-6 w-6 text-red-600" /> },
          ].map(s => (
            <div key={s.label} className={`bg-white rounded-lg shadow-sm p-4 border-l-4 ${s.color}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                </div>
                {s.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All Orders</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <Package className="h-20 w-20 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              {orders.length === 0 ? 'No orders yet' : 'No orders found'}
            </h2>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              {orders.length === 0 ? "Looks like you haven't placed any orders yet. Start shopping to fill this page!" : "Try adjusting your filters or search query to find what you're looking for."}
            </p>
            {orders.length === 0 && (
              <button onClick={() => navigate('/shop')}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-lg shadow-blue-200">
                Start Shopping
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const isExpanded = expandedOrderId === order._id;
              const status = order.orderStatus?.toLowerCase();
              const currentStep = getStatusStep(status);
              const isCancelled = status === 'cancelled';
              const orderId = order._id.slice(-8).toUpperCase();

              return (
                <div key={order._id} className={`bg-white rounded-xl border transition-all duration-300 ${isExpanded ? 'shadow-md border-blue-200 ring-1 ring-blue-100' : 'shadow-sm border-gray-100 hover:border-blue-200'}`}>

                  {/* Collapsed Summary Row */}
                  <div
                    onClick={() => toggleExpand(order._id)}
                    className="p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4 cursor-pointer group"
                  >
                    <div className="flex items-center gap-4 sm:gap-8">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">ORDER ID</p>
                        <p className="font-bold text-gray-900 font-mono">#{orderId}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">DATE</p>
                        <div className="flex items-center gap-1 font-medium text-gray-900">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-xs text-gray-500 mb-1">TOTAL</p>
                        <p className="font-bold text-blue-600">₹{order.totalAmount?.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6 ml-auto">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(status)}`}>
                        {order.orderStatus}
                      </span>
                      <div className="flex items-center gap-2 text-gray-400 group-hover:text-blue-600 transition-colors">
                        <span className="text-sm font-medium hidden sm:inline">{isExpanded ? 'Hide Details' : 'View Details'}</span>
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail View */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50/50 p-4 sm:p-6 animate-in slide-in-from-top-2 duration-200">

                      {/* 1. Timeline */}
                      <div className="mb-8 relative px-2">
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 rounded-full z-0" />
                        <div className="relative z-10 flex justify-between">
                          {['Placed', 'Processing', 'Shipped', 'Delivered'].map((stepLabel, index) => {
                            let isActive = index <= currentStep;
                            let isCurrent = index === currentStep;

                            // Handle Cancelled State UI
                            if (isCancelled) {
                              isActive = false; // All grey
                              isCurrent = false;
                            }

                            return (
                              <div key={stepLabel} className="flex flex-col items-center gap-2 bg-gray-50/0">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${isActive
                                    ? 'bg-blue-600 border-blue-600 text-white'
                                    : isCancelled && index === currentStep // Show red X if this was the step it failed at? No, keep simple
                                      ? 'bg-gray-200 border-gray-200 text-gray-400'
                                      : 'bg-white border-gray-200 text-gray-300'
                                  }`}>
                                  {isActive && <CheckCircle className="w-4 h-4" />}
                                  {/* Pulse for current active step */}
                                  {isCurrent && !isCancelled && (
                                    <span className="absolute w-8 h-8 bg-blue-400 rounded-full animate-ping opacity-75" />
                                  )}
                                </div>
                                <span className={`text-xs font-bold ${isActive ? 'text-blue-700' : 'text-gray-400'
                                  }`}>{stepLabel}</span>
                                {isActive && isCurrent && (
                                  <span className="text-[10px] text-gray-500 font-medium">
                                    {new Date(order.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                  </span>
                                )}
                              </div>
                            );
                          })}

                          {/* Cancelled Badge Override */}
                          {isCancelled && (
                            <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/4 bg-red-100 text-red-700 font-bold px-3 py-1 rounded-full border border-red-200 shadow-sm z-20 flex items-center gap-1">
                              <XCircle className="w-4 h-4" /> Cancelled
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Info Box: Shipped */}
                      {status === 'shipped' && (
                        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3 text-blue-800">
                          <Truck className="w-5 h-5" />
                          <p className="text-sm font-medium">Your order is on the way! Expected delivery in 2–3 business days.</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* 2. Items Table */}
                        <div className="lg:col-span-2">
                          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <table className="w-full text-sm text-left">
                              <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-medium border-b border-gray-200">
                                <tr>
                                  <th className="px-4 py-3">Medicine</th>
                                  <th className="px-4 py-3 text-center">Qty</th>
                                  <th className="px-4 py-3 text-right">Price</th>
                                  <th className="px-4 py-3 text-right">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {order.items.map((item, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-gray-900">{item.medicine?.name || 'Unknown Item'}</td>
                                    <td className="px-4 py-3 text-center text-gray-600">{item.quantity}</td>
                                    <td className="px-4 py-3 text-right text-gray-600">₹{item.price}</td>
                                    <td className="px-4 py-3 text-right font-medium text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot className="bg-gray-50 border-t border-gray-200">
                                <tr>
                                  <td colSpan="3" className="px-4 py-2 text-right text-gray-500">Subtotal</td>
                                  <td className="px-4 py-2 text-right font-medium text-gray-900">
                                    ₹{order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                                  </td>
                                </tr>
                                {order.coupon && (
                                  <tr>
                                    <td colSpan="3" className="px-4 py-2 text-right text-green-600">Coupon Discount</td>
                                    <td className="px-4 py-2 text-right font-medium text-green-600">
                                      - ₹{(order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) - order.totalAmount).toFixed(2)}
                                    </td>
                                  </tr>
                                )}
                                <tr>
                                  <td colSpan="3" className="px-4 py-3 text-right font-bold text-gray-900 text-base">Total</td>
                                  <td className="px-4 py-3 text-right font-bold text-blue-600 text-base">₹{order.totalAmount.toFixed(2)}</td>
                                </tr>
                                <tr>
                                  <td colSpan="4" className="px-4 py-2 border-t border-gray-200">
                                    <div className="flex justify-end items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                      {order.paymentMethod === 'cod' ? (
                                        <>🤝 Cash on Delivery</>
                                      ) : (
                                        <>💳 Online Payment</>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>

                        {/* 3. Address & Actions */}
                        <div className="space-y-6">
                          {/* Address Card */}
                          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-blue-600" /> Shipping Address
                            </h3>
                            <div className="text-sm text-gray-600 leading-relaxed">
                              {/* Handling object vs string address for potential legacy data */}
                              {typeof order.shippingAddress === 'string' ? (
                                <p>{order.shippingAddress}</p>
                              ) : (
                                <>
                                  <p className="font-medium text-gray-900 mb-1">{order.user?.name || 'Customer'}</p>
                                  <p>{order.shippingAddress?.address}</p>
                                  <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}</p>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Invoice Button */}
                          <button
                            onClick={() => downloadInvoice(order)}
                            className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
                          >
                            <Download className="w-4 h-4" /> Download Invoice
                          </button>

                          {/* Cancel Logic */}
                          {['pending', 'processing'].includes(status) && (
                            <div className="pt-4 border-t border-gray-200">
                              <p className="text-xs text-center text-gray-500 mb-3">
                                Need to change something?
                              </p>
                              <button
                                onClick={() => handleCancelOrder(order._id)}
                                disabled={loading || cancellingId === order._id}
                                className="w-full flex items-center justify-center gap-2 border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300 py-2.5 rounded-lg font-medium transition-colors text-sm"
                              >
                                {cancellingId === order._id ? (
                                  <>
                                    <span className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></span>
                                    Cancelling...
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-4 h-4" /> Cancel Order
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
