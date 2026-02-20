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
  Sparkles,
  Star,
  Clock,
  CreditCard,
  Heart,
  TrendingUp,
  Award,
  Users,
  Phone,
  Mail
} from 'lucide-react';
import toast from 'react-hot-toast';

const Home = () => {
  const [featuredMedicines, setFeaturedMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState({});
  const [testimonials, setTestimonials] = useState([
    {
      id: 1,
      name: "Priya Sharma",
      rating: 5,
      comment: "Excellent service! Got my medicines delivered within 24 hours. Highly recommended!",
      date: "2 days ago"
    },
    {
      id: 2,
      name: "Rajesh Kumar",
      rating: 5,
      comment: "Genuine medicines at best prices. The prescription upload feature is very convenient.",
      date: "1 week ago"
    },
    {
      id: 3,
      name: "Anita Desai",
      rating: 4,
      comment: "Great customer support. They helped me find a medicine that was out of stock everywhere else.",
      date: "3 days ago"
    }
  ]);

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

  const addToCart = async (medicineId) => {
    setAddingToCart(prev => ({ ...prev, [medicineId]: true }));
    
    try {
      await api.post('/cart/add', { medicineId, quantity: 1 });
      toast.success('Added to cart!');
      
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

  const categories = [
    { name: "Pain Relief", icon: "💊", color: "bg-red-100", count: 45 },
    { name: "Antibiotics", icon: "💉", color: "bg-blue-100", count: 32 },
    { name: "Diabetes Care", icon: "🩸", color: "bg-purple-100", count: 28 },
    { name: "Heart Health", icon: "❤️", color: "bg-pink-100", count: 23 },
    { name: "Vitamins", icon: "🍊", color: "bg-orange-100", count: 56 },
    { name: "Skin Care", icon: "🧴", color: "bg-green-100", count: 34 },
  ];

  const stats = [
    { icon: Users, value: "10K+", label: "Happy Customers", color: "blue" },
    { icon: Package, value: "5000+", label: "Medicines", color: "green" },
    { icon: Truck, value: "24/7", label: "Delivery", color: "purple" },
    { icon: Award, value: "100%", label: "Genuine", color: "orange" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ============================================ */}
      {/* HERO SECTION - Enhanced with more impact */}
      {/* ============================================ */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-300 rounded-full mix-blend-overlay filter blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32">
          <div className="text-center">
            {/* Badge with animation */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 sm:mb-8 animate-fade-in-up">
              <Sparkles className="w-4 h-4 animate-spin-slow" />
              <span className="text-sm font-medium">Trusted by 10,000+ customers across India</span>
            </div>

            {/* Main Headline with gradient text */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-4 sm:mb-6 animate-fade-in-up delay-200">
              Your Health, Our
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">
                Priority
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-8 sm:mb-10 animate-fade-in-up delay-400">
              100% genuine medicines delivered to your doorstep. 
              <span className="block sm:inline mt-2 sm:mt-0"> Free delivery on orders above ₹500.</span>
            </p>

            {/* CTA Buttons with hover effects */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-600">
              <Link
                to="/shop"
                className="group w-full sm:w-auto px-8 py-4 bg-white text-blue-700 font-bold rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 hover:rotate-1 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5 group-hover:animate-bounce" />
                Browse Medicines
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </Link>

              <Link
                to="/upload-prescription"
                className="group w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-blue-700 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <FileText className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                Upload Prescription
              </Link>
            </div>

            {/* Trust Indicators with icons */}
            <div className="mt-12 sm:mt-16 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-sm sm:text-base animate-fade-in-up delay-800">
              <div className="flex items-center gap-2 hover:scale-110 transition-transform">
                <CheckCircle className="w-5 h-5 text-green-300" />
                <span>Licensed Pharmacy</span>
              </div>
              <div className="flex items-center gap-2 hover:scale-110 transition-transform">
                <CheckCircle className="w-5 h-5 text-green-300" />
                <span>Verified Medicines</span>
              </div>
              <div className="flex items-center gap-2 hover:scale-110 transition-transform">
                <CheckCircle className="w-5 h-5 text-green-300" />
                <span>Secure Checkout</span>
              </div>
              <div className="flex items-center gap-2 hover:scale-110 transition-transform">
                <Clock className="w-5 h-5 text-green-300" />
                <span>24/7 Support</span>
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
      {/* STATS SECTION - New */}
      {/* ============================================ */}
      <section className="py-12 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              const colors = {
                blue: "bg-blue-100 text-blue-600",
                green: "bg-green-100 text-green-600",
                purple: "bg-purple-100 text-purple-600",
                orange: "bg-orange-100 text-orange-600"
              };
              return (
                <div key={index} className="text-center group hover:scale-105 transition-transform">
                  <div className={`inline-flex p-4 rounded-full ${colors[stat.color]} mb-3 group-hover:animate-bounce`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* CATEGORIES SECTION - New */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Shop by Category
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Find what you need faster with our organized categories
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat, index) => (
              <Link
                key={index}
                to={`/shop?category=${cat.name}`}
                className="group bg-white rounded-xl p-6 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className={`text-4xl mb-3 group-hover:scale-110 transition-transform`}>
                  {cat.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{cat.name}</h3>
                <p className="text-sm text-gray-500">{cat.count} items</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FEATURES SECTION - Enhanced */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Why Choose Us</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mt-2 mb-4">
              We Care About Your Health
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Your well-being is our mission. Here's why thousands trust us with their health.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="group bg-gradient-to-br from-green-50 to-white rounded-2xl p-6 sm:p-8 shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-green-100">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform group-hover:rotate-3">
                <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-green-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                100% Genuine
              </h3>
              <p className="text-gray-600 leading-relaxed">
                All medicines sourced directly from verified manufacturers with proper licensing and quality checks.
              </p>
            </div>

            <div className="group bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 sm:p-8 shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-blue-100">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform group-hover:rotate-3">
                <Truck className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                Lightning Fast Delivery
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Same-day delivery in select cities. Free delivery on all orders above ₹500. Track your order in real-time.
              </p>
            </div>

            <div className="group bg-gradient-to-br from-purple-50 to-white rounded-2xl p-6 sm:p-8 shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-purple-100">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform group-hover:rotate-3">
                <CreditCard className="w-7 h-7 sm:w-8 sm:h-8 text-purple-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                Secure Payments
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Multiple payment options with 100% secure checkout. Your data is encrypted and never shared.
              </p>
            </div>

            <div className="group bg-gradient-to-br from-orange-50 to-white rounded-2xl p-6 sm:p-8 shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-orange-100">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform group-hover:rotate-3">
                <FileText className="w-7 h-7 sm:w-8 sm:h-8 text-orange-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                Easy Prescription Upload
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Upload your prescription and get medicines delivered. Our pharmacists verify every prescription.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FEATURED MEDICINES - Enhanced */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-10 sm:mb-12">
            <div>
              <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Best Sellers</span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mt-2 mb-2">
                Popular Medicines
              </h2>
              <p className="text-lg text-gray-600">
                Trusted by thousands of customers across India
              </p>
            </div>
            <Link
              to="/shop"
              className="mt-4 sm:mt-0 group flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors bg-blue-50 px-4 py-2 rounded-full hover:bg-blue-100"
            >
              View All Medicines
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-200 rounded-2xl h-80 animate-pulse"></div>
              ))}
            </div>
          ) : featuredMedicines.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl">
              <div className="text-5xl mb-4">💊</div>
              <p className="text-xl font-semibold text-gray-700 mb-2">No medicines available yet</p>
              <p className="text-gray-500">Check back soon — our catalogue is being stocked!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredMedicines.map((medicine) => (
                <div
                  key={medicine._id}
                  className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 relative"
                >
                  {/* Discount Badge */}
                  {medicine.discount > 0 && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                      {medicine.discount}% OFF
                    </div>
                  )}

                  {/* Wishlist Button */}
                  <button className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors z-10">
                    <Heart className="w-4 h-4 text-gray-400 hover:text-red-500" />
                  </button>

                  {/* Product Image */}
                  <Link to={`/product/${medicine._id}`}>
                    <div className="h-48 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-6 relative overflow-hidden">
                      <img
                        src={medicine.imageUrl || 'https://via.placeholder.com/200'}
                        alt={medicine.name}
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    </div>
                  </Link>

                  {/* Product Info */}
                  <div className="p-5">
                    <Link to={`/product/${medicine._id}`}>
                      <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2 min-h-[3.5rem] hover:text-blue-600 transition-colors">
                        {medicine.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-500 mb-3">{medicine.brand}</p>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                      ))}
                      <span className="text-xs text-gray-500 ml-1">(124)</span>
                    </div>

                    {/* Stock Badge */}
                    {medicine.stock > 0 ? (
                      <div className="flex items-center justify-between mb-3">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                          In Stock
                        </span>
                        {medicine.stock <= 10 && (
                          <span className="text-xs text-orange-600">Only {medicine.stock} left!</span>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 mb-3">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        Out of Stock
                      </span>
                    )}

                    {/* Price and Button */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-blue-600">₹{medicine.price}</span>
                        {medicine.mrp && (
                          <span className="text-sm text-gray-400 line-through ml-2">₹{medicine.mrp}</span>
                        )}
                      </div>
                      <button
                        onClick={() => addToCart(medicine._id)}
                        disabled={medicine.stock === 0 || addingToCart[medicine._id]}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${
                          addingToCart[medicine._id]
                            ? 'bg-green-600 text-white scale-95'
                            : medicine.stock === 0
                            ? 'bg-gray-400 cursor-not-allowed text-white'
                            : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95'
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
      {/* TESTIMONIALS SECTION - New */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Testimonials</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Real stories from real customers who trust us with their health
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="bg-gray-50 rounded-2xl p-6 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-5 h-5 ${i < testimonial.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">"{testimonial.comment}"</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.date}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* HOW IT WORKS - Enhanced */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Simple Process</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mt-2 mb-4">
              How It Works
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Get your medicines in 3 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            <div className="relative text-center group">
              <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl mb-6 shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Search className="w-10 h-10 sm:w-12 sm:h-12" />
              </div>
              <div className="absolute top-10 left-1/2 w-full h-1 bg-gradient-to-r from-blue-200 to-purple-200 hidden md:block" style={{ transform: 'translateX(50%)' }}></div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                1. Browse or Search
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Find your medicines from our verified catalog of 5000+ products
              </p>
            </div>

            <div className="relative text-center group">
              <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl mb-6 shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <ShoppingCart className="w-10 h-10 sm:w-12 sm:h-12" />
              </div>
              <div className="absolute top-10 left-1/2 w-full h-1 bg-gradient-to-r from-purple-200 to-pink-200 hidden md:block" style={{ transform: 'translateX(50%)' }}></div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors">
                2. Add to Cart & Checkout
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Apply coupons, upload prescription if required, and choose payment method
              </p>
            </div>

            <div className="relative text-center group">
              <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl mb-6 shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Package className="w-10 h-10 sm:w-12 sm:h-12" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">
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
      {/* NEWSLETTER SECTION - New */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Stay Healthy with MedStore
          </h2>
          <p className="text-lg text-blue-100 mb-8">
            Subscribe to get health tips, medicine reminders, and exclusive offers
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-6 py-4 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-300"
            />
            <button className="px-8 py-4 bg-white text-blue-700 font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105">
              Subscribe
            </button>
          </div>
          <p className="text-sm text-blue-200 mt-4">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>
      </section>

      {/* ============================================ */}
      {/* CALL TO ACTION BANNER - Enhanced */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Ready to Order Your Medicines?
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust MedStore for their healthcare needs. 
            Fast delivery, genuine medicines, and secure payments.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/shop"
              className="group inline-flex items-center gap-3 px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg rounded-xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
            >
              <ShoppingCart className="w-6 h-6" />
              Shop Now
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </Link>
            <Link
              to="/contact"
              className="group inline-flex items-center gap-3 px-8 sm:px-10 py-4 sm:py-5 bg-gray-100 text-gray-900 font-bold text-lg rounded-xl hover:bg-gray-200 transform hover:scale-105 transition-all duration-300"
            >
              <Phone className="w-6 h-6" />
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;