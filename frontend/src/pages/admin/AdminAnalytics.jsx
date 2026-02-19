import { useEffect, useState } from "react";
import api from "../../api/axiosClient";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#2563eb", "#16a34a", "#f97316", "#a855f7", "#e11d48", "#0f766e"];

const AdminAnalytics = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
  });

  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [paymentSplit, setPaymentSplit] = useState([]);
  const [topMedicines, setTopMedicines] = useState([]);

  const [dateFilter, setDateFilter] = useState("30d"); // 7d | 30d | 90d | all | custom
  const [customRange, setCustomRange] = useState({ from: "", to: "" });

  // 1) Load all orders (admin) - FIXED ENDPOINT
  const loadOrders = async () => {
    try {
      setLoading(true);
      // FIX: Use /admin/orders instead of /orders/admin
      const res = await api.get("/admin/orders");
      setOrders(res.data.orders || res.data || []);
    } catch (err) {
      console.error("Failed to load orders", err);
      toast.error("Failed to load analytics data");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // 2) Apply date filter whenever orders or filter changes
  useEffect(() => {
    if (!orders.length) {
      setFilteredOrders([]);
      return;
    }

    let fromDate = null;
    let toDate = null;

    const now = new Date();

    if (dateFilter === "7d") {
      fromDate = new Date(now);
      fromDate.setDate(fromDate.getDate() - 7);
      fromDate.setHours(0, 0, 0, 0);
    } else if (dateFilter === "30d") {
      fromDate = new Date(now);
      fromDate.setDate(fromDate.getDate() - 30);
      fromDate.setHours(0, 0, 0, 0);
    } else if (dateFilter === "90d") {
      fromDate = new Date(now);
      fromDate.setDate(fromDate.getDate() - 90);
      fromDate.setHours(0, 0, 0, 0);
    } else if (dateFilter === "custom") {
      if (customRange.from) {
        fromDate = new Date(customRange.from);
        fromDate.setHours(0, 0, 0, 0);
      }
      if (customRange.to) {
        toDate = new Date(customRange.to);
        toDate.setHours(23, 59, 59, 999);
      }
    } // else "all" -> no filter

    const filtered = orders.filter((o) => {
      const d = new Date(o.createdAt);
      if (fromDate && d < fromDate) return false;
      if (toDate && d > toDate) return false;
      return true;
    });

    setFilteredOrders(filtered);
  }, [orders, dateFilter, customRange]);

  // 3) Aggregate stats (summary, monthly, category, payment, top medicines)
  useEffect(() => {
    if (!filteredOrders.length) {
      setSummary({ totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 });
      setMonthlyData([]);
      setCategoryData([]);
      setPaymentSplit([]);
      setTopMedicines([]);
      return;
    }

    // ---- Summary: revenue, orders, AOV (only paid) ----
    const paidOrders = filteredOrders.filter((o) => o.paymentStatus === "paid");
    const totalRevenue = paidOrders.reduce(
      (sum, o) => sum + (o.totalAmount || 0),
      0
    );
    const totalOrders = paidOrders.length;
    const avgOrderValue =
      totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0;

    setSummary({
      totalRevenue,
      totalOrders,
      avgOrderValue,
    });

    // ---- Monthly aggregation ----
    const monthMap = new Map(); // "MMM YYYY" -> { month, revenue, orders }

    paidOrders.forEach((o) => {
      const d = new Date(o.createdAt);
      const key = d.toLocaleString("en-US", { month: "short", year: "numeric" });

      if (!monthMap.has(key)) {
        monthMap.set(key, { month: key, revenue: 0, orders: 0 });
      }
      const entry = monthMap.get(key);
      entry.revenue += o.totalAmount || 0;
      entry.orders += 1;
      monthMap.set(key, entry);
    });

    const monthlyArr = Array.from(monthMap.values()).sort((a, b) => {
      const [am, ay] = a.month.split(" ");
      const [bm, by] = b.month.split(" ");
      const aDate = new Date(`${am} 1, ${ay}`);
      const bDate = new Date(`${bm} 1, ${by}`);
      return aDate - bDate;
    });
    setMonthlyData(monthlyArr);

    // ---- Category-wise revenue (Pie) ----
    const catMap = new Map(); // category -> revenue
    paidOrders.forEach((o) => {
      (o.items || []).forEach((item) => {
        // assumes each item has medicine populated with category & price
        const med = item.medicine || {};
        const cat = med.category || "Other";
        const price = item.price ?? med.price ?? 0;
        const qty = item.quantity ?? 1;
        const amount = price * qty;

        if (!catMap.has(cat)) catMap.set(cat, 0);
        catMap.set(cat, catMap.get(cat) + amount);
      });
    });

    const catArr = Array.from(catMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));
    setCategoryData(catArr);

    // ---- Payment method split (Pie) ----
    const payMap = new Map(); // method -> count
    paidOrders.forEach((o) => {
      const method = o.paymentMethod || "Unknown";
      if (!payMap.has(method)) payMap.set(method, 0);
      payMap.set(method, payMap.get(method) + 1);
    });

    const payArr = Array.from(payMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));
    setPaymentSplit(payArr);

    // ---- Top 5 medicines by revenue ----
    const medMap = new Map(); // name -> { name, revenue, qty }

    paidOrders.forEach((o) => {
      (o.items || []).forEach((item) => {
        const med = item.medicine || {};
        const name = med.name || "Unknown";
        const price = item.price ?? med.price ?? 0;
        const qty = item.quantity ?? 1;
        const amount = price * qty;

        if (!medMap.has(name)) {
          medMap.set(name, { name, revenue: 0, qty: 0 });
        }
        const entry = medMap.get(name);
        entry.revenue += amount;
        entry.qty += qty;
        medMap.set(name, entry);
      });
    });

    const medArr = Array.from(medMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    setTopMedicines(medArr);
  }, [filteredOrders]);

  // Initial load
  useEffect(() => {
    loadOrders();
  }, []);

  // 4) Export CSV for filteredOrders
  const exportCSV = () => {
    if (!filteredOrders.length) {
      alert("No data to export for selected range.");
      return;
    }

    const header = [
      "OrderID",
      "User",
      "Amount",
      "PaymentStatus",
      "PaymentMethod",
      "CreatedAt",
    ];

    const rows = filteredOrders.map((o) => [
      o._id,
      o.user?.name || "",
      o.totalAmount || 0,
      o.paymentStatus || "",
      o.paymentMethod || "",
      new Date(o.createdAt).toLocaleDateString("en-IN"),
    ]);

    const csv =
      [header, ...rows]
        .map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(","))
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-report-${dateFilter}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Analytics & Reports
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredOrders.length} orders in selected period
          </p>
        </div>

        {/* Date range filter + export */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-xl border border-gray-200">
          {/* Preset filters */}
          <div className="flex gap-1 text-xs">
            {["7d", "30d", "90d", "all"].map((key) => (
              <button
                key={key}
                onClick={() => setDateFilter(key)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  dateFilter === key
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {key === "7d" && "7 Days"}
                {key === "30d" && "30 Days"}
                {key === "90d" && "90 Days"}
                {key === "all" && "All Time"}
              </button>
            ))}
          </div>

          {/* Custom range */}
          <button
            onClick={() => setDateFilter("custom")}
            className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all ${
              dateFilter === "custom"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Custom
          </button>

          {dateFilter === "custom" && (
            <div className="flex items-center gap-2 text-xs ml-2">
              <input
                type="date"
                className="border border-gray-300 rounded-lg px-2 py-1.5"
                value={customRange.from}
                onChange={(e) =>
                  setCustomRange((prev) => ({ ...prev, from: e.target.value }))
                }
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                className="border border-gray-300 rounded-lg px-2 py-1.5"
                value={customRange.to}
                onChange={(e) =>
                  setCustomRange((prev) => ({ ...prev, to: e.target.value }))
                }
              />
            </div>
          )}

          <button
            onClick={exportCSV}
            className="ml-2 px-4 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-black transition-colors flex items-center gap-1"
          >
            <span>⬇</span> Export CSV
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6">
          <p className="text-xs text-blue-700 font-semibold mb-2 uppercase tracking-wider">
            Total Revenue
          </p>
          <p className="text-3xl font-bold text-blue-900">
            ₹{summary.totalRevenue.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-blue-600 mt-2">From {summary.totalOrders} orders</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-6">
          <p className="text-xs text-green-700 font-semibold mb-2 uppercase tracking-wider">
            Total Orders
          </p>
          <p className="text-3xl font-bold text-green-900">
            {summary.totalOrders}
          </p>
          <p className="text-xs text-green-600 mt-2">Paid orders only</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-6">
          <p className="text-xs text-purple-700 font-semibold mb-2 uppercase tracking-wider">
            Avg Order Value
          </p>
          <p className="text-3xl font-bold text-purple-900">
            ₹{summary.avgOrderValue.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-purple-600 mt-2">Per paid order</p>
        </div>
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Line Chart */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Monthly Revenue Trend
          </h2>
          {monthlyData.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500">
                Not enough data to show chart
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#2563eb" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Orders Bar Chart */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Monthly Orders Count
          </h2>
          {monthlyData.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500">
                Not enough data to show chart
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="orders" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Category + Payment split */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Category Pie */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Revenue by Category
          </h2>
          {categoryData.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500">
                Not enough data to show chart
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }) => 
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Payment Method Pie */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Payment Methods
          </h2>
          {paymentSplit.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500">
                Not enough data to show chart
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={paymentSplit}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }) => 
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {paymentSplit.map((entry, index) => (
                    <Cell
                      key={`cell2-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Top Medicines */}
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Top 5 Medicines by Revenue
        </h2>
        {topMedicines.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-500">No data available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topMedicines.map((m, idx) => (
              <div
                key={m.name}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="font-medium text-gray-800">{m.name}</span>
                    <p className="text-xs text-gray-500">Quantity sold: {m.qty}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    ₹{m.revenue.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminAnalytics;