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
      await login(email, password);

      // We need to check the role *after* login. 
      // However, context 'user' state might not update instantly in this function scope.
      // But Since 'login' awaited the 'getMe' call, the cookie is set.
      // We can redirect to /admin, and AdminRoute will verify the role.
      // If the user is NOT an admin, AdminRoute will kick them out (to /).

      // Let's assume login validates credentials. 
      // Ideally, the backend login response handles role check or we fetch user.
      // Context.login fetches user. AdminRoute checks user.role.
      // So we just navigate to /admin.

      navigate("/admin", { replace: true });
      toast.success("Welcome back, Admin!");

    } catch (err) {
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
