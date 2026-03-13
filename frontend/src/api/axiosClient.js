import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  // SECURITY: withCredentials sends HttpOnly cookies automatically on every request.
  // This replaces the previous localStorage token approach, eliminating XSS risk.
  withCredentials: true,
});

// ─── Silent Token Refresh Interceptor ────────────────────────────────────────
// When any request receives a 401 with code "TOKEN_EXPIRED", this interceptor
// calls POST /auth/refresh (which reads the refresh-token cookie) to obtain a
// new access-token cookie, then retries the original request exactly once.
// If the refresh itself fails, the user is redirected to /login.

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    // UPGRADE 2: If login returns 206 with requiresTwoFactor flag,
    // redirect to /2fa-verify. Do NOT attempt token refresh.
    if (response.status === 206 && response.data?.requiresTwoFactor) {
      window.location.href = "/2fa-verify";
      return response;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // UPGRADE 1: TOKEN_BLACKLISTED — token was intentionally invalidated on logout.
    // Do NOT attempt refresh; redirect to login immediately.
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === "TOKEN_BLACKLISTED"
    ) {
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // Only attempt refresh for TOKEN_EXPIRED errors, and only once per request
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === "TOKEN_EXPIRED" &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Queue this request until the ongoing refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      isRefreshing = true;

      try {
        await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        // Refresh failed — session is dead, redirect to login
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
