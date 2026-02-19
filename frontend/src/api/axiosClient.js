import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  // SECURITY: withCredentials sends HttpOnly cookies automatically on every request.
  // This replaces the previous localStorage token approach, eliminating XSS risk.
  withCredentials: true,
});

// No Authorization header interceptor needed — cookies are sent automatically
// by the browser when withCredentials is true.

export default api;
