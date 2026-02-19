import { Link, NavLink, useNavigate } from "react-router-dom";
import { useContext, useState, useEffect, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { WishlistContext } from "../context/WishlistContext";
import { Menu, X, Settings, Package, FileText, HelpCircle, LogOut, Heart, Pill, ClipboardList } from "lucide-react";
import MobileMenu from "./MobileMenu";
import toast from "react-hot-toast";

// =====================================================
// ProfileDropdown component with proper positioning
// =====================================================
const ProfileDropdown = ({ dropdownRef, onClose, user, handleLogout }) => (
  <div
    ref={dropdownRef}
    className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50"
    style={{
      position: 'absolute',
      top: '100%',
      right: '0',
      marginTop: '0.5rem',
      zIndex: 9999
    }}
  >
    {/* User Info Header */}
    <div className="px-4 py-3 border-b border-gray-200">
      <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
      <p className="text-xs text-gray-600 truncate">{user?.email}</p>
    </div>

    {/* Menu Items */}
    <div className="py-2">
      <Link
        to="/profile"
        onClick={onClose}
        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Settings className="h-4 w-4" />
        <span>Profile Settings</span>
      </Link>

      <Link
        to="/orders"
        onClick={onClose}
        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Package className="h-4 w-4" />
        <span>My Orders</span>
      </Link>

      <Link
        to="/upload-prescription"
        onClick={onClose}
        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <FileText className="h-4 w-4" />
        <span>Prescriptions</span>
      </Link>

      {/* FIX: Only show medicine request links for regular users, not admins */}
      {user?.role !== "admin" && (
        <>
          <Link
            to="/request-medicine"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Pill className="h-4 w-4" />
            <span>Request Medicine</span>
          </Link>

          <Link
            to="/my-requests"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ClipboardList className="h-4 w-4" />
            <span>My Requests</span>
          </Link>
        </>
      )}

      <Link
        to="/support"
        onClick={onClose}
        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <HelpCircle className="h-4 w-4" />
        <span>Support</span>
      </Link>
    </div>

    {/* Logout */}
    <div className="border-t border-gray-200 pt-2">
      <button
        onClick={() => {
          handleLogout();
          onClose();
        }}
        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
      >
        <LogOut className="h-4 w-4" />
        <span>Logout</span>
      </button>
    </div>
  </div>
);

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { wishlistCount } = useContext(WishlistContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const navLinkClass = ({ isActive }) =>
    `px-3 py-2 text-sm font-medium rounded-lg transition ${isActive
      ? "text-blue-700 bg-blue-100"
      : "text-gray-600 hover:text-blue-700 hover:bg-gray-100"
    }`;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.name) return 'U';
    const names = user.name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <>
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-200">
        <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
              M
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-lg text-gray-900">MedStore</span>
              <span className="text-xs text-gray-500 hidden sm:block">Online Pharmacy</span>
            </div>
          </Link>

          {/* Desktop Nav Links - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-2">
            <NavLink to="/" className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/shop" className={navLinkClass}>
              Shop
            </NavLink>
            {/* Protected user links - Only show when logged in */}
            {user && (
              <>
                <NavLink to="/cart" className={navLinkClass}>
                  Cart
                </NavLink>
                <NavLink to="/wishlist" className={navLinkClass}>
                  Wishlist
                  {wishlistCount > 0 && <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">{wishlistCount}</span>}
                </NavLink>
                <NavLink to="/orders" className={navLinkClass}>
                  Orders
                </NavLink>
                <NavLink to="/upload-prescription" className={navLinkClass}>
                  Prescription
                </NavLink>
                {/* FIX: Only show Request link for regular users in desktop nav too */}
                {user?.role !== "admin" && (
                  <NavLink to="/request-medicine" className={navLinkClass}>
                    Request
                  </NavLink>
                )}
              </>
            )}
            {/* Admin Dashboard Link - Only for admin users */}
            {user?.role === "admin" && (
              <Link
                to="/admin/dashboard"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
              >
                🛡️ Admin
              </Link>
            )}
          </div>

          {/* Auth Buttons + Mobile Menu Button */}
          <div className="flex items-center gap-3">
            {/* Desktop Auth Buttons */}
            {user ? (
              <div className="hidden md:flex items-center gap-3">
                <span className="hidden lg:inline text-sm text-gray-600">
                  Hi, <span className="font-semibold">{user.name?.split(' ')[0]}</span>
                </span>

                {/* Profile Avatar with Dropdown */}
                <div 
                  className="relative" 
                  style={{ position: 'relative', zIndex: 1000 }}
                >
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label="User menu"
                  >
                    {getUserInitials()}
                  </button>

                  {/* Dropdown Menu - Using the external component */}
                  {profileDropdownOpen && (
                    <ProfileDropdown
                      dropdownRef={dropdownRef}
                      onClose={() => setProfileDropdownOpen(false)}
                      user={user}
                      handleLogout={handleLogout}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-700" />
              ) : (
                <Menu className="h-6 w-6 text-gray-700" />
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  );
};

export default Navbar;