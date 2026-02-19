import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosClient';
import {
  ShoppingCart,
  Truck,
  Shield,
  FileText,
  Search,
  Package,
  CheckCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

const Home = () => {
  const [featuredMedicines, setFeaturedMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState({});

  useEffect(() => {
    const fetchFeaturedMedicines = async () => {
      try {
        const res = await api.get('/medicines', { params: { page: 1, limit: 8 } });
        setFeaturedMedicines(res.data.medicines || []);
      } catch (error) {
        console.error('Failed to fetch medicines:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedMedicines();
  }, []);

  // FIX: Updated addToCart function with exact toast message
  const addToCart = async (medicineId) => {
    setAddingToCart(prev => ({ ...prev, [medicineId]: true }));
    
    try {
      await api.post('/cart/add', { medicineId, quantity: 1 });
      
      // Show exactly the same toast as the screenshot
      toast.success('Added to cart!');
      
      // Reset button state after 1 second
      setTimeout(() => {
        setAddingToCart(prev => ({ ...prev, [medicineId]: false }));
      }, 1000);
      
    } catch (error) {
      setAddingToCart(prev => ({ ...prev, [medicineId]: false }));
      
      if (error.response?.status === 401) {
        toast.error('Please log in to add items to cart');
      } else {
        toast.error('Failed to add to cart. Please try again');
      }
      console.error('Failed to add to cart:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ============================================ */}
      {/* HERO SECTION - Modern gradient with CTAs */}
      {/* ============================================ */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 sm:mb-8">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Trusted by 10,000+ customers</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-4 sm:mb-6">
              Get Your Medicines
              <br />
              <span className="text-blue-200">Delivered Fast & Safely</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-8 sm:mb-10">
              100% genuine medicines at your doorstep. Upload prescription, order online, and get free delivery on orders above ₹500.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/shop"
                className="group w-full sm:w-auto px-8 py-4 bg-white text-blue-700 font-bold rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Browse Medicines
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/upload-prescription"
                className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-blue-700 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <FileText className="w-5 h-5" />
                Upload Prescription
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 sm:mt-16 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-sm sm:text-base">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-300" />
                <span>Licensed Pharmacy</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-300" />
                <span>Verified Medicines</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-300" />
                <span>Secure Checkout</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" className="w-full h-12 sm:h-16 md:h-20">
            <path
              fill="#F9FAFB"
              d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
            ></path>
          </svg>
        </div>
      </section>

      {/* ============================================ */}
      {/* FEATURES SECTION - Why Choose Us */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Choose MedStore?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Your health is our priority. We ensure quality, speed, and trust in every order.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* Feature 1: Genuine Medicines */}
            <div className="group bg-white rounded-2xl p-6 sm:p-8 shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-green-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                100% Genuine
              </h3>
              <p className="text-gray-600 leading-relaxed">
                All medicines sourced directly from verified manufacturers with proper licensing.
              </p>
            </div>

            {/* Feature 2: Fast Delivery */}
            <div className="group bg-white rounded-2xl p-6 sm:p-8 shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <Truck className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                Fast & Free Delivery
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Same-day delivery in select cities. Free delivery on all orders above ₹500.
              </p>
            </div>

            {/* Feature 3: Secure Payments */}
            <div className="group bg-white rounded-2xl p-6 sm:p-8 shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-purple-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                Secure Payments
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Multiple payment options with 100% secure checkout and data encryption.
              </p>
            </div>

            {/* Feature 4: Prescription Upload */}
            <div className="group bg-white rounded-2xl p-6 sm:p-8 shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <FileText className="w-7 h-7 sm:w-8 sm:h-8 text-orange-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                Easy Prescription Upload
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Upload your prescription and get medicines delivered right to your doorstep.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FEATURED MEDICINES - Product Showcase */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between mb-10 sm:mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                Popular Medicines
              </h2>
              <p className="text-lg text-gray-600">
                Trusted by thousands of customers
              </p>
            </div>
            <Link
              to="/shop"
              className="mt-4 sm:mt-0 group flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
            >
              View All Medicines
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-100 rounded-2xl h-80 animate-pulse"></div>
              ))}
            </div>
          ) : featuredMedicines.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">💊</div>
              <p className="text-xl font-semibold text-gray-700 mb-2">No medicines available yet</p>
              <p className="text-gray-500">Check back soon — our catalogue is being stocked!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredMedicines.map((medicine) => (
                <div
                  key={medicine._id}
                  className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  {/* Product Image */}
                  <div className="h-48 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-6">
                    <img
                      src={medicine.imageUrl || 'https://via.placeholder.com/200'}
                      alt={medicine.name}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="p-5">
                    <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2 min-h-[3.5rem]">
                      {medicine.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">{medicine.brand}</p>

                    {/* Stock Badge */}
                    {medicine.stock > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 mb-3">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        In Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 mb-3">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        Out of Stock
                      </span>
                    )}

                    {/* Price and Button - FIXED BUTTON */}
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-blue-600">
                        ₹{medicine.price}
                      </span>
                      <button
                        onClick={() => addToCart(medicine._id)}
                        disabled={medicine.stock === 0 || addingToCart[medicine._id]}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${
                          addingToCart[medicine._id]
                            ? 'bg-green-600 text-white'
                            : medicine.stock === 0
                            ? 'bg-gray-400 cursor-not-allowed text-white'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {addingToCart[medicine._id] ? (
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Adding...
                          </span>
                        ) : medicine.stock === 0 ? (
                          'Out of Stock'
                        ) : (
                          'Quick Add'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============================================ */}
      {/* HOW IT WORKS - Process Steps */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Get your medicines in 3 simple steps
            </p>
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {/* Step 1 */}
            <div className="relative text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-blue-600 text-white rounded-full mb-6 shadow-xl">
                <Search className="w-10 h-10 sm:w-12 sm:h-12" />
              </div>
              <div className="absolute top-10 left-1/2 w-full h-1 bg-blue-200 hidden md:block" style={{ transform: 'translateX(50%)' }}></div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                1. Browse or Search
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Find your medicines from our verified catalog of 5000+ products
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-purple-600 text-white rounded-full mb-6 shadow-xl">
                <ShoppingCart className="w-10 h-10 sm:w-12 sm:h-12" />
              </div>
              <div className="absolute top-10 left-1/2 w-full h-1 bg-purple-200 hidden md:block" style={{ transform: 'translateX(50%)' }}></div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                2. Add to Cart & Checkout
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Apply coupons, upload prescription if required, and choose payment method
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-green-600 text-white rounded-full mb-6 shadow-xl">
                <Package className="w-10 h-10 sm:w-12 sm:h-12" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                3. Fast Delivery
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Get medicines delivered to your doorstep with real-time tracking
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* CALL TO ACTION BANNER */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
            Start Ordering Your Medicines Today
          </h2>
          <p className="text-lg sm:text-xl text-blue-100 mb-8 sm:mb-10">
            Join thousands of satisfied customers who trust MedStore for their healthcare needs
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-3 px-8 sm:px-10 py-4 sm:py-5 bg-white text-blue-700 font-bold text-lg rounded-xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
          >
            <ShoppingCart className="w-6 h-6" />
            Get Started Now
            <ArrowRight className="w-6 h-6" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;