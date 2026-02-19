import { useEffect, useState } from "react";
import api from "../../api/axiosClient";
import toast from "react-hot-toast";

const STATUS_OPTIONS = ["processing", "shipped", "delivered", "cancelled"];

const STATUS_COLORS = {
  processing: "bg-yellow-100 text-yellow-700",
  shipped: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  const loadOrders = async (currentPage = 1) => {
    setLoading(true);
    try {
      // Correct endpoint: GET /api/admin/orders (paginated)
      const res = await api.get("/admin/orders", { params: { page: currentPage, limit: LIMIT } });
      setOrders(res.data.orders || []);
      setPage(res.data.page || 1);
      setTotalPages(res.data.pages || 1);
      setTotal(res.data.total || 0);
    } catch (err) {
      toast.error("Failed to load orders");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      // Correct endpoint: PUT /api/orders/:id/status
      await api.put(`/orders/${orderId}/status`, { status });
      toast.success(`Order status updated to "${status}"`);
      // Update locally without refetch
      setOrders(prev =>
        prev.map(o => o._id === orderId ? { ...o, orderStatus: status } : o)
      );
    } catch {
      toast.error("Failed to update order status");
    }
  };

  useEffect(() => { loadOrders(1); }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Orders</h1>
          {!loading && <p className="text-sm text-gray-500 mt-1">{total} orders total</p>}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-xl shadow-md border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left text-gray-700 text-sm">
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Order Status</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Update Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id} className="border-b hover:bg-gray-50 text-sm">
                    <td className="p-3 font-mono text-xs text-gray-500">#{o._id.slice(-8)}</td>
                    <td className="p-3">
                      <div className="font-medium text-gray-900">{o.user?.name || "—"}</div>
                      <div className="text-xs text-gray-500">{o.user?.email}</div>
                    </td>
                    <td className="p-3 font-semibold text-blue-700">₹{o.totalAmount}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${o.paymentStatus === "paid"
                          ? "bg-green-100 text-green-700"
                          : o.paymentStatus === "failed"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[o.orderStatus] || "bg-gray-100 text-gray-700"}`}>
                        {o.orderStatus}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600 text-xs">
                      {new Date(o.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="p-3">
                      <select
                        value={o.orderStatus}
                        onChange={(e) => updateStatus(o._id, e.target.value)}
                        className="text-xs border border-gray-300 rounded-lg px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500"
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {orders.length === 0 && (
              <p className="text-center text-gray-500 py-10">No orders found.</p>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => { const p = page - 1; setPage(p); loadOrders(p); }}
                  disabled={page <= 1}
                  className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40"
                >← Prev</button>
                <button
                  onClick={() => { const p = page + 1; setPage(p); loadOrders(p); }}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40"
                >Next →</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminOrders;
