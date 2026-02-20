import { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const AdminLogin = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const loginAdmin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use the context login function which sets the cookie and user state
      const userData = await login(email, password);

      console.log("Admin login response:", userData); // Debug log

      // Check if user is admin
      if (userData?.role === 'admin' || userData?.isAdmin === true) {
        // Redirect to admin dashboard, not /admin
        navigate("/admin/dashboard", { replace: true });
        toast.success("Welcome back, Admin!");
      } else {
        // User is not admin - show error and logout
        toast.error("You don't have admin privileges");
        // Optional: logout the user since they're not admin
        // You might want to add a logout function here
      }

    } catch (err) {
      console.error("Admin login error:", err);
      toast.error(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-3xl shadow-lg p-10 max-w-md w-full border border-gray-200">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-black text-blue-700">Admin Panel</h1>
          <p className="text-gray-500 text-sm mt-1">
            Login with your admin credentials
          </p>
        </div>

        <form onSubmit={loginAdmin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admin Email
            </label>
            <input
              className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-400"
              placeholder="admin@medstore.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-400"
              placeholder="•••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            className="w-full bg-blue-700 text-white py-3 rounded-xl font-semibold hover:bg-blue-800 transition shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            type="submit"
            disabled={loading}
          >
            {loading ? "Verifying..." : "Login as Admin"}
          </button>
        </form>
      </div>
    </main>
  );
};

export default AdminLogin;