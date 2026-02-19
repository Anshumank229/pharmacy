import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosClient";
import {
  Users, ShoppingBag, Package, TrendingUp, FileText, Tag,
  PlusCircle, AlertTriangle, BarChart, ArrowRight, Clock // Added Clock icon
} from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ users: 0, orders: 0, medicines: 0, revenue: 0 });
  const [lowStockMedicines, setLowStockMedicines] = useState([]);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [pendingPrescriptions, setPendingPrescriptions] = useState(0);
  const [activeCoupons, setActiveCoupons] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0); // NEW: Medicine requests state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const [statsRes, lowStockRes, ordersRes, couponsRes, prescRes, requestsRes] = await Promise.allSettled([
          api.get("/admin/stats"),
          api.get("/admin/low-stock"),
          api.get("/admin/orders", { params: { page: 1, limit: 100 } }),
          api.get("/coupons"),
          api.get("/prescriptions/pending"),
          api.get("/admin/medicine-requests/stats"), // NEW: Fetch medicine requests stats
        ]);

        if (statsRes.status === "fulfilled") setStats(statsRes.value.data);

        if (lowStockRes.status === "fulfilled") {
          setLowStockMedicines(lowStockRes.value.data.medicines || []);
        }

        if (ordersRes.status === "fulfilled") {
          const orders = ordersRes.value.data.orders || [];
          setPendingOrders(orders.filter(o => o.orderStatus === "processing").length);
        }

        if (couponsRes.status === "fulfilled") {
          const coupons = Array.isArray(couponsRes.value.data) ? couponsRes.value.data : [];
          setActiveCoupons(coupons.filter(c => c.isActive !== false).length);
        }

        if (prescRes.status === "fulfilled") {
          const data = prescRes.value.data;
          const list = Array.isArray(data) ? data : (data.prescriptions || []);
          setPendingPrescriptions(list.length);
        }

        // NEW: Handle medicine requests stats
        if (requestsRes.status === "fulfilled") {
          setPendingRequests(requestsRes.value.data.pending || 0);
        }

      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  const ActionCard = ({ icon: Icon, title, description, badge, badgeColor = "red", buttonText, onClick, color = "blue" }) => {
    const colorMap = {
      blue: "bg-blue-100 text-blue-600", green: "bg-green-100 text-green-600",
      purple: "bg-purple-100 text-purple-600", orange: "bg-orange-100 text-orange-600",
      pink: "bg-pink-100 text-pink-600", indigo: "bg-indigo-100 text-indigo-600",
      red: "bg-red-100 text-red-600", teal: "bg-teal-100 text-teal-600"
    };
    const badgeMap = {
      red: "bg-red-100 text-red-700 border-red-200", orange: "bg-orange-100 text-orange-700 border-orange-200",
      green: "bg-green-100 text-green-700 border-green-200", blue: "bg-blue-100 text-blue-700 border-blue-200"
    };
    return (
      <div className="bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 hover:scale-105 p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${colorMap[color]}`}><Icon className="w-8 h-8" /></div>
          {badge !== undefined && badge > 0 && (
            <span className={`px-3 py-1 rounded-full text-sm font-bold border ${badgeMap[badgeColor]}`}>{badge}</span>
          )}
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{description}</p>
        <button onClick={onClick}
          className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-2 font-semibold">
          {buttonText} <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your medicine store from one place</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
          {[
            { label: "Total Users", value: stats.users, icon: <Users className="w-8 h-8 opacity-80" />, from: "from-blue-500", to: "to-blue-600", text: "blue-100", path: "/admin/users" },
            { label: "Total Orders", value: stats.orders, icon: <ShoppingBag className="w-8 h-8 opacity-80" />, from: "from-green-500", to: "to-green-600", text: "green-100", path: "/admin/orders" },
            { label: "Medicines", value: stats.medicines, icon: <Package className="w-8 h-8 opacity-80" />, from: "from-purple-500", to: "to-purple-600", text: "purple-100", path: "/admin/medicines" },
            { label: "Total Revenue", value: `₹${stats.revenue || 0}`, icon: <TrendingUp className="w-8 h-8 opacity-80" />, from: "from-orange-500", to: "to-orange-600", text: "orange-100", path: "/admin/analytics" },
          ].map(s => (
            <div
              key={s.label}
              onClick={() => navigate(s.path)}
              className={`bg-gradient-to-br ${s.from} ${s.to} text-white p-6 rounded-xl shadow-lg cursor-pointer transform transition hover:scale-105`}
            >
              <div className="flex items-center justify-between mb-2">{s.icon}</div>
              <p className={`text-${s.text} text-sm mb-1`}>{s.label}</p>
              <h2 className="text-4xl font-bold">{loading ? "—" : s.value}</h2>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Quick Actions</h2>
          <p className="text-gray-600 mb-6">Manage all aspects of your store</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <ActionCard icon={Package} title="Manage Medicines" description="View, add, edit, or delete medicines from inventory"
              badge={stats.medicines} badgeColor="blue" buttonText="Manage Medicines" onClick={() => navigate("/admin/medicines")} color="blue" />
            <ActionCard icon={ShoppingBag} title="Manage Orders" description="View and update order status and tracking"
              badge={pendingOrders} badgeColor={pendingOrders > 0 ? "orange" : "green"} buttonText="View Orders" onClick={() => navigate("/admin/orders")} color="green" />
            <ActionCard icon={FileText} title="Prescription Approvals" description="Review and approve pending prescriptions"
              badge={pendingPrescriptions} badgeColor={pendingPrescriptions > 0 ? "red" : "green"} buttonText="Review Prescriptions" onClick={() => navigate("/admin/prescriptions")} color="purple" />
            
            {/* NEW: Medicine Requests Card */}
            <ActionCard icon={Clock} title="Medicine Requests" description="Review and respond to customer medicine requests"
              badge={pendingRequests} badgeColor={pendingRequests > 0 ? "orange" : "green"} buttonText="View Requests" onClick={() => navigate("/admin/medicine-requests")} color="orange" />
            
            <ActionCard icon={Tag} title="Manage Coupons" description="Create and manage discount coupons"
              badge={activeCoupons} badgeColor="blue" buttonText="Manage Coupons" onClick={() => navigate("/admin/coupons")} color="pink" />
            <ActionCard icon={Users} title="Manage Users" description="View and manage user accounts"
              badge={stats.users} badgeColor="blue" buttonText="View Users" onClick={() => navigate("/admin/users")} color="indigo" />
            <ActionCard icon={PlusCircle} title="Add New Medicine" description="Quickly add a new product to inventory"
              buttonText="Add Medicine" onClick={() => navigate("/admin/add-medicine")} color="green" />
            <ActionCard icon={AlertTriangle} title="Low Stock Alert" description="View items running low on stock"
              badge={lowStockMedicines.length} badgeColor={lowStockMedicines.length > 0 ? "red" : "green"}
              buttonText="View Stock" onClick={() => navigate("/admin/medicines")} color={lowStockMedicines.length > 0 ? "red" : "orange"} />
            <ActionCard icon={BarChart} title="View Analytics" description="Sales reports and business insights"
              buttonText="View Reports" onClick={() => navigate("/admin/analytics")} color="teal" />
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border-l-4 border-orange-500">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900">
            <AlertTriangle className="w-6 h-6 text-orange-600" /> Stock Alerts
          </h2>

          {/* Banners */}
          {!loading && lowStockMedicines.some(m => m.stock === 0) && (
            <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-r shadow-sm flex items-center">
              <span className="text-2xl mr-3">🚨</span>
              <div>
                <p className="font-bold">OUT OF STOCK</p>
                <p>{lowStockMedicines.filter(m => m.stock === 0).length} medicines are completely out of stock.</p>
              </div>
            </div>
          )}

          {!loading && lowStockMedicines.some(m => m.stock > 0 && m.stock <= 10) && (
            <div className="mb-6 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-r shadow-sm flex items-center">
              <span className="text-2xl mr-3">⚠️</span>
              <div>
                <p className="font-bold">Low Stock Warning</p>
                <p>{lowStockMedicines.filter(m => m.stock > 0 && m.stock <= 10).length} medicines are running low (≤ 10 units).</p>
              </div>
            </div>
          )}
          {loading ? (
            <div className="text-center py-8"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : lowStockMedicines.length === 0 ? (
            <div className="text-center py-8 bg-green-50 rounded-lg border border-green-200">
              <p className="text-green-700 font-semibold text-lg mb-1">✅ All medicines well stocked!</p>
              <p className="text-green-600 text-sm">No items below 10 units</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockMedicines.map(med => (
                <div key={med._id} className="flex justify-between items-center p-4 rounded-lg border border-gray-200 hover:shadow-md bg-gray-50">
                  <div>
                    <span className="font-semibold text-gray-800">{med.name}</span>
                    <p className="text-sm text-gray-500">{med.brand}</p>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-bold ${med.stock <= 3 ? "bg-red-100 text-red-700 border border-red-300" : "bg-orange-100 text-orange-700 border border-orange-300"
                    }`}>
                    {med.stock} left {med.stock <= 3 ? "🔴" : "⚠️"}
                  </span>
                </div>
              ))}
              <button onClick={() => navigate("/admin/medicines")}
                className="w-full text-center text-blue-600 hover:text-blue-800 font-semibold mt-4 py-3 hover:bg-blue-50 rounded-lg border border-blue-200">
                View All Medicines →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;