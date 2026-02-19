import { useEffect, useState } from "react";
import api from "../../api/axiosClient";
import toast from "react-hot-toast";
import { Plus, X, User, Mail, Lock, Phone, MapPin, UserCog } from "lucide-react";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  const loadUsers = async (currentPage = 1) => {
    try {
      setLoading(true);
      // Correct endpoint: GET /api/admin/users (paginated)
      const res = await api.get("/admin/users", { params: { page: currentPage, limit: LIMIT } });
      setUsers(res.data.users || []);
      setPage(res.data.page || 1);
      setTotalPages(res.data.pages || 1);
      setTotal(res.data.total || 0);
    } catch (error) {
      console.error("Failed to load users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(1); }, []);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Manage Users</h1>
          {!loading && <p className="text-sm text-gray-500 mt-1">{total} users total</p>}
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Add New User
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p className="mt-2 text-gray-600">Loading users...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12">
                      <div className="flex flex-col items-center">
                        <User className="w-12 h-12 text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium mb-2">No users found</p>
                        <p className="text-sm text-gray-400">Click "Add New User" to create one</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                            {u.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <span className="font-medium text-gray-900">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{u.email}</td>
                      <td className="px-6 py-4 text-gray-700">{u.phone || "N/A"}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${u.role === "admin"
                            ? "bg-purple-100 text-purple-700 border border-purple-200"
                            : "bg-blue-100 text-blue-700 border border-blue-200"
                          }`}>
                          {u.role === "admin" ? "🛡️" : "👤"} {(u.role || 'user').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN") : "N/A"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => { const p = page - 1; loadUsers(p); }}
              disabled={page <= 1}
              className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
            >← Prev</button>
            <button
              onClick={() => { const p = page + 1; loadUsers(p); }}
              disabled={page >= totalPages}
              className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
            >Next →</button>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showModal && (
        <CreateUserModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { loadUsers(1); setShowModal(false); }}
        />
      )}
    </div>
  );
};

// ── Create User Modal ─────────────────────────────────────────────────────────
const CreateUserModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ name: "", email: "", password: "", phone: "", address: "", role: "user" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!formData.name.trim()) e.name = "Name is required";
    if (!formData.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = "Email is invalid";
    if (!formData.password) e.password = "Password is required";
    else if (formData.password.length < 6) e.password = "Min 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return toast.error("Please fix the errors");
    setLoading(true);
    try {
      // FIX: Use admin endpoint instead of auth/register
      // This prevents the admin session from being overwritten
      await api.post("/admin/users", formData);
      toast.success("User created successfully!");
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const Field = ({ label, icon: Icon, name, type = "text", placeholder }) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        <Icon className="w-4 h-4 inline mr-1" />{label}
      </label>
      <input
        type={type} name={name} value={formData[name]}
        onChange={handleChange} placeholder={placeholder}
        className={`w-full px-4 py-2.5 border ${errors[name] ? "border-red-500" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 transition-all`}
      />
      {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2"><UserCog className="w-5 h-5" /> Create New User</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Field label="Full Name *" icon={User} name="name" placeholder="John Doe" />
          <Field label="Email *" icon={Mail} name="email" type="email" placeholder="john@example.com" />
          <Field label="Password *" icon={Lock} name="password" type="password" placeholder="Min 6 characters" />
          <Field label="Phone" icon={Phone} name="phone" type="tel" placeholder="9876543210" />
          <Field label="Address" icon={MapPin} name="address" placeholder="123 Main St, City" />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <UserCog className="w-4 h-4 inline mr-1" />Role
            </label>
            <select name="role" value={formData.role} onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="user">👤 Regular User</option>
              <option value="admin">🛡️ Administrator</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={loading}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
              {loading ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminUsers;