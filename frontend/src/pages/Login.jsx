import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import toast from "react-hot-toast";

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Get user data after login
      const userData = await login(email, password);
      
      console.log("Login successful - User data:", userData); // Debug log
      
      toast.success("Login successful!");
      
      // FIX: Check user role and redirect accordingly
      // Check both role and isAdmin properties
      if (userData?.role === 'admin' || userData?.isAdmin === true) {
        console.log("Redirecting admin to /admin/dashboard");
        navigate('/admin/dashboard', { replace: true });
      } else {
        console.log("Redirecting user to:", from);
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[75vh] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h1>
        <p className="text-sm text-gray-500 mb-6">
          Login to continue ordering your medicines.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
            <input
              className="w-full border border-gray-300 rounded-xl p-2 text-sm"
              placeholder="you@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-gray-700">Password</label>
              <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              className="w-full border border-gray-300 rounded-xl p-2 text-sm"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-gray-500">
          New here?{" "}
          <Link to="/register" className="text-blue-600 hover:underline">
            Create an account
          </Link>

          <div className="mt-2">
            <span className="text-gray-400">•</span>
          </div>

          <div className="mt-2">
            <Link to="/admin-login" className="text-red-600 font-semibold hover:underline">
              Admin Login →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Login;