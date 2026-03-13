import { createContext, useState, useEffect } from "react";
import api from "../api/axiosClient";

const AuthContext = createContext();
export { AuthContext };

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load logged-in user on page refresh.
  // SECURITY: No localStorage check needed — the HttpOnly cookie is sent
  // automatically by the browser. We just try to fetch the profile.
  const loadUser = async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data);
    } catch {
      // Cookie absent or expired — user is not logged in.
      // The axiosClient interceptor would have tried a silent refresh
      // already, so if we still fail, the user genuinely has no session.
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  // Handle Login — cookies are set by the server automatically
  const login = async (email, password) => {
    await api.post("/auth/login", { email, password });
    // After login, fetch user profile (cookies are now set)
    const userRes = await api.get("/auth/me");
    const userData = userRes.data;
    setUser(userData);
    return userData;
  };

  // Handle Register — cookies are set by the server automatically
  const register = async (data) => {
    await api.post("/auth/register", data);
    // After register, fetch user profile (cookies are now set)
    const userRes = await api.get("/auth/me");
    const userData = userRes.data;
    setUser(userData);
    return userData;
  };

  // Handle Logout — call backend to clear all HttpOnly cookies
  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Even if the request fails, clear local state
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};