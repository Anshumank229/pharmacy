// frontend/src/pages/admin/AdminCoupons.jsx
import { useEffect, useState } from "react";
import api from "../../api/axiosClient";
import toast from "react-hot-toast";
import {
  Plus,
  X,
  Tag,
  Calendar,
  Percent,
  IndianRupee,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Copy,
  Search
} from "lucide-react";

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all"); // all, active, expired

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const res = await api.get("/coupons");
      setCoupons(res.data.coupons || res.data || []);
    } catch (error) {
      console.error("Failed to load coupons:", error);
      toast.error("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  // Filter coupons based on search and filter
  const filteredCoupons = coupons.filter(coupon => {
    // Search filter
    const matchesSearch = coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (coupon.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    // Status filter
    const now = new Date();
    const isExpired = coupon.validUntil && new Date(coupon.validUntil) < now;
    const isActive = coupon.isActive && !isExpired;
    
    if (filter === "active") return matchesSearch && isActive;
    if (filter === "expired") return matchesSearch && isExpired;
    return matchesSearch; // all
  });

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Are you sure you want to delete coupon "${code}"?`)) {
      return;
    }

    try {
      await api.delete(`/coupons/${id}`);
      toast.success("Coupon deleted successfully");
      loadCoupons();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete coupon");
    }
  };

  const handleDuplicate = (coupon) => {
    setEditingCoupon({
      ...coupon,
      code: `${coupon.code}-COPY`,
      _id: undefined
    });
    setShowModal(true);
  };

  const formatDate = (date) => {
    if (!date) return "No expiry";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const isExpired = (coupon) => {
    if (!coupon.validUntil) return false;
    return new Date(coupon.validUntil) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Coupon Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredCoupons.length} coupons {filter !== 'all' && `(${filter})`}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCoupon(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Create New Coupon
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search coupons by code or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {["all", "active", "expired"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  filter === f
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Coupons Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No coupons found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm ? "Try adjusting your search" : "Create your first coupon to get started"}
          </p>
          {!searchTerm && (
            <button
              onClick={() => {
                setEditingCoupon(null);
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Coupon
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCoupons.map((coupon) => {
            const expired = isExpired(coupon);
            const active = coupon.isActive && !expired;

            return (
              <div
                key={coupon._id}
                className={`bg-white rounded-xl shadow-sm border-2 transition-all hover:shadow-md ${
                  expired
                    ? "border-gray-200 opacity-75"
                    : active
                    ? "border-green-200"
                    : "border-yellow-200"
                }`}
              >
                {/* Card Header */}
                <div className={`p-4 border-b ${
                  expired
                    ? "bg-gray-50 border-gray-200"
                    : active
                    ? "bg-green-50 border-green-200"
                    : "bg-yellow-50 border-yellow-200"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className={`w-5 h-5 ${
                        expired
                          ? "text-gray-500"
                          : active
                          ? "text-green-600"
                          : "text-yellow-600"
                      }`} />
                      <span className="font-mono font-bold text-lg">{coupon.code}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {active && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                          Active
                        </span>
                      )}
                      {expired && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                          Expired
                        </span>
                      )}
                      {!coupon.isActive && !expired && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3">
                  {/* Discount */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Discount</span>
                    <span className="font-bold text-lg text-blue-600">
                      {coupon.discountPercent}% OFF
                    </span>
                  </div>

                  {/* Min Order */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Min. Order</span>
                    <span className="font-semibold">
                      ₹{coupon.minOrderAmount?.toLocaleString('en-IN') || 0}
                    </span>
                  </div>

                  {/* Max Discount */}
                  {coupon.maxDiscount && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Max Discount</span>
                      <span className="font-semibold">₹{coupon.maxDiscount}</span>
                    </div>
                  )}

                  {/* Usage */}
                  {coupon.usageLimit && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Usage</span>
                      <span className="font-semibold">
                        {coupon.usedCount || 0} / {coupon.usageLimit}
                      </span>
                    </div>
                  )}

                  {/* Valid Period */}
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {coupon.validFrom ? formatDate(coupon.validFrom) : "No start"} 
                        {' → '}
                        {coupon.validUntil ? formatDate(coupon.validUntil) : "No expiry"}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {coupon.description && (
                    <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      {coupon.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => handleDuplicate(coupon)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Duplicate coupon"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingCoupon(coupon);
                        setShowModal(true);
                      }}
                      className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Edit coupon"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(coupon._id, coupon.code)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete coupon"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Coupon Modal */}
      {showModal && (
        <CouponModal
          coupon={editingCoupon}
          onClose={() => {
            setShowModal(false);
            setEditingCoupon(null);
          }}
          onSuccess={() => {
            loadCoupons();
            setShowModal(false);
            setEditingCoupon(null);
          }}
        />
      )}
    </div>
  );
};

// =====================================================
// COUPON MODAL COMPONENT
// =====================================================
const CouponModal = ({ coupon, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    code: coupon?.code || "",
    discountPercent: coupon?.discountPercent || "",
    minOrderAmount: coupon?.minOrderAmount || 0,
    maxDiscount: coupon?.maxDiscount || "",
    validFrom: coupon?.validFrom ? new Date(coupon.validFrom).toISOString().split('T')[0] : "",
    validUntil: coupon?.validUntil ? new Date(coupon.validUntil).toISOString().split('T')[0] : "",
    usageLimit: coupon?.usageLimit || "",
    isActive: coupon?.isActive !== undefined ? coupon.isActive : true,
    description: coupon?.description || ""
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};

    if (!formData.code.trim()) {
      e.code = "Coupon code is required";
    } else if (!/^[A-Z0-9_-]+$/.test(formData.code.toUpperCase())) {
      e.code = "Code can only contain letters, numbers, underscores and hyphens";
    }

    if (!formData.discountPercent) {
      e.discountPercent = "Discount percentage is required";
    } else if (formData.discountPercent < 1 || formData.discountPercent > 100) {
      e.discountPercent = "Discount must be between 1 and 100";
    }

    if (formData.minOrderAmount < 0) {
      e.minOrderAmount = "Minimum order amount cannot be negative";
    }

    if (formData.maxDiscount && formData.maxDiscount < 0) {
      e.maxDiscount = "Max discount cannot be negative";
    }

    if (formData.validFrom && formData.validUntil) {
      if (new Date(formData.validFrom) > new Date(formData.validUntil)) {
        e.validUntil = "End date must be after start date";
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const data = {
        ...formData,
        code: formData.code.toUpperCase().trim(),
        discountPercent: Number(formData.discountPercent),
        minOrderAmount: Number(formData.minOrderAmount),
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null
      };

      if (coupon?._id) {
        // Update existing coupon
        await api.put(`/coupons/${coupon._id}`, data);
        toast.success("Coupon updated successfully");
      } else {
        // Create new coupon
        await api.post("/coupons", data);
        toast.success("Coupon created successfully");
      }
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save coupon");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Tag className="w-5 h-5" />
            {coupon ? "Edit Coupon" : "Create New Coupon"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Coupon Code */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Coupon Code *
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="e.g., SAVE20, WELCOME10"
                className={`w-full px-4 py-2.5 border ${
                  errors.code ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase`}
                maxLength="20"
              />
              {errors.code && (
                <p className="text-red-500 text-xs mt-1">{errors.code}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Letters, numbers, underscores and hyphens only
              </p>
            </div>

            {/* Discount Percent */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Percent className="w-4 h-4 inline mr-1" />
                Discount % *
              </label>
              <input
                type="number"
                name="discountPercent"
                value={formData.discountPercent}
                onChange={handleChange}
                min="1"
                max="100"
                className={`w-full px-4 py-2.5 border ${
                  errors.discountPercent ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:ring-2 focus:ring-blue-500`}
              />
              {errors.discountPercent && (
                <p className="text-red-500 text-xs mt-1">{errors.discountPercent}</p>
              )}
            </div>

            {/* Min Order Amount */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <IndianRupee className="w-4 h-4 inline mr-1" />
                Min Order Amount
              </label>
              <input
                type="number"
                name="minOrderAmount"
                value={formData.minOrderAmount}
                onChange={handleChange}
                min="0"
                className={`w-full px-4 py-2.5 border ${
                  errors.minOrderAmount ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:ring-2 focus:ring-blue-500`}
              />
              {errors.minOrderAmount && (
                <p className="text-red-500 text-xs mt-1">{errors.minOrderAmount}</p>
              )}
            </div>

            {/* Max Discount */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <IndianRupee className="w-4 h-4 inline mr-1" />
                Max Discount (Optional)
              </label>
              <input
                type="number"
                name="maxDiscount"
                value={formData.maxDiscount}
                onChange={handleChange}
                min="0"
                className={`w-full px-4 py-2.5 border ${
                  errors.maxDiscount ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:ring-2 focus:ring-blue-500`}
              />
              {errors.maxDiscount && (
                <p className="text-red-500 text-xs mt-1">{errors.maxDiscount}</p>
              )}
            </div>

            {/* Usage Limit */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Usage Limit (Optional)
              </label>
              <input
                type="number"
                name="usageLimit"
                value={formData.usageLimit}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited</p>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Valid From
              </label>
              <input
                type="date"
                name="validFrom"
                value={formData.validFrom}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Valid Until
              </label>
              <input
                type="date"
                name="validUntil"
                value={formData.validUntil}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border ${
                  errors.validUntil ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:ring-2 focus:ring-blue-500`}
              />
              {errors.validUntil && (
                <p className="text-red-500 text-xs mt-1">{errors.validUntil}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter coupon description or terms..."
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="isActive"
              id="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Coupon is active
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                coupon ? "Update Coupon" : "Create Coupon"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminCoupons;