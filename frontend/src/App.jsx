import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"; // Make sure Navigate is imported

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
import Profile from "./pages/Profile.jsx";
import Support from "./pages/Support.jsx";
import Wishlist from "./pages/Wishlist.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";

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
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

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

          {/* ===== ADMIN ROUTES ===== */}
          
          {/* FIX: Add redirect from /admin to /admin/dashboard */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminRoute>
                <Navigate to="/admin/dashboard" replace />
              </AdminRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/dashboard" element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/medicines" element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminMedicines />
              </AdminRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/orders" element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminOrders />
              </AdminRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/users" element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/prescriptions" element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminPrescriptions />
              </AdminRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/medicine-requests" element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminMedicineRequests />
              </AdminRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/support" element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminSupport />
              </AdminRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/analytics" element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminAnalytics />
              </AdminRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/add-medicine" element={
            <ProtectedRoute>
              <AdminRoute>
                <AddMedicine />
              </AdminRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/edit-medicine/:id" element={
            <ProtectedRoute>
              <AdminRoute>
                <EditMedicine />
              </AdminRoute>
            </ProtectedRoute>
          } />

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