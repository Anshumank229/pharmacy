import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout.jsx";
// Layouts
import MainLayout from "./layouts/MainLayout";

// Components
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminRoute from "./components/AdminRoute.jsx";

// User Pages
import Home from "./pages/Home.jsx";
import Shop from "./pages/Shop.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import Orders from "./pages/Orders.jsx";
import UploadPrescription from "./pages/UploadPrescription.jsx";

// Medicine Request Pages
import RequestMedicine from "./pages/RequestMedicine.jsx";
import MyRequests from "./pages/MyRequests.jsx";

// Auth Pages
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import RegisterWithOTP from "./pages/RegisterWithOTP.jsx"; // ADD THIS
import Profile from "./pages/Profile.jsx";
import Support from "./pages/Support.jsx";
import Wishlist from "./pages/Wishlist.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import TwoFactorVerify from "./pages/TwoFactorVerify.jsx";

// Legal Pages
import TermsOfService from "./pages/TermsOfService.jsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.jsx";
import MedicalDisclaimer from "./pages/MedicalDisclaimer.jsx";

// Contact Page
import Contact from "./pages/Contact.jsx";

// Admin Pages
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AddMedicine from "./pages/AddMedicine.jsx";
import EditMedicine from "./pages/EditMedicine.jsx";
import AdminMedicines from "./pages/admin/AdminMedicines.jsx";
import AdminOrders from "./pages/admin/AdminOrders.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import AdminAnalytics from "./pages/admin/AdminAnalytics.jsx";
import AdminPrescriptions from "./pages/admin/AdminPrescriptions.jsx";
import AdminSupport from "./pages/admin/AdminSupport.jsx";
import AdminMedicineRequests from "./pages/admin/AdminMedicineRequests.jsx";
import AdminCoupons from "./pages/admin/AdminCoupons.jsx"; // FIX C7: was imported nowhere

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ================= ALL ROUTES WITH MAIN NAVBAR ================= */}
        <Route element={<MainLayout />}>

          {/* ===== PUBLIC ROUTES ===== */}
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register-otp" element={<RegisterWithOTP />} /> {/* ADD THIS */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/2fa-verify" element={<TwoFactorVerify />} />

          {/* ===== LEGAL PAGES ===== */}
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/disclaimer" element={<MedicalDisclaimer />} />

          {/* ===== CONTACT PAGE ===== */}
          <Route path="/contact" element={<Contact />} />

          {/* ===== ADMIN LOGIN PAGE ===== */}
          <Route path="/admin-login" element={<AdminLogin />} />

          {/* ===== PROTECTED USER ROUTES ===== */}
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
          <Route path="/upload-prescription" element={<ProtectedRoute><UploadPrescription /></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />

          {/* ===== MEDICINE REQUEST ROUTES ===== */}
          <Route path="/request-medicine" element={<ProtectedRoute><RequestMedicine /></ProtectedRoute>} />
          <Route path="/my-requests" element={<ProtectedRoute><MyRequests /></ProtectedRoute>} />

          {/* ===== ADMIN ROUTES — all share AdminLayout sidebar ===== */}
          {/* M10: Wrapped in AdminLayout so every admin page gets the sidebar nav */}
        </Route>

        <Route
          element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            </ProtectedRoute>
          }
        >
          {/* Redirect /admin → /admin/dashboard */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/medicines" element={<AdminMedicines />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/prescriptions" element={<AdminPrescriptions />} />
          <Route path="/admin/medicine-requests" element={<AdminMedicineRequests />} />
          <Route path="/admin/support" element={<AdminSupport />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/add-medicine" element={<AddMedicine />} />
          <Route path="/admin/edit-medicine/:id" element={<EditMedicine />} />
          {/* C7+M10: AdminCoupons — registered and using AdminLayout */}
          <Route path="/admin/coupons" element={<AdminCoupons />} />

          {/* ===== 404 FALLBACK ===== */}
          <Route
            path="*"
            element={
              <div className="text-center py-32 text-2xl text-gray-600 font-medium">
                404 - Page Not Found
              </div>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;