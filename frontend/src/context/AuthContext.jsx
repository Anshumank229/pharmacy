import { createContext, useState, useEffect } from "react";
import api from "../api/axiosClient";

export const AuthContext = createContext();

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
      // Cookie absent or expired — user is not logged in
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  // Handle Login — cookie is set by the server automatically
  const login = async (email, password) => {
    await api.post("/auth/login", { email, password });
    // After login, fetch user profile (cookie is now set)
    const userRes = await api.get("/auth/me");
    setUser(userRes.data);
  };

  // Handle Register — cookie is set by the server automatically
  const register = async (data) => {
    await api.post("/auth/register", data);
    // After register, fetch user profile (cookie is now set)
    const userRes = await api.get("/auth/me");
    setUser(userRes.data);
  };

  // Handle Logout — call backend to clear the HttpOnly cookie
  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Even if the request fails, clear local state
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
