import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosClient';
import toast from 'react-hot-toast';
import {
  ShoppingCart,
  ArrowLeft,
  Package,
  Shield,
  FileText,
  AlertCircle,
  Minus,
  Plus,
  CheckCircle
} from 'lucide-react';
import WishlistButton from '../components/WishlistButton';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [similarMedicines, setSimilarMedicines] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch current medicine
        const res = await api.get(`/medicines/${id}`);
        setMedicine(res.data);

        // Fetch similar medicines from same category
        setLoadingSimilar(true);
        try {
          const allMedicinesRes = await api.get('/medicines');
          const similar = allMedicinesRes.data
            .filter(med =>
              med.category === res.data.category &&
              med._id !== id
            )
            .slice(0, 6); // Limit to 6 items
          setSimilarMedicines(similar);
        } catch (err) {
          console.error('Failed to fetch similar medicines:', err);
        } finally {
          setLoadingSimilar(false);
        }
      } catch (error) {
        console.error('Failed to fetch medicine:', error);
        toast.error('Failed to load medicine details');
        navigate('/shop');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    window.scrollTo(0, 0); // Scroll to top on navigation
  }, [id, navigate]);

  const handleAddToCart = async () => {
    if (!medicine || medicine.stock === 0) {
      toast.error('This item is out of stock');
      return;
    }

    try {
      await api.post('/cart/add', { medicineId: medicine._id, quantity });
      toast.success(`Added ${quantity} item(s) to cart!`);
      setQuantity(1); // Reset quantity after adding
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    }
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (isNaN(value) || value < 1) {
      setQuantity(1);
    } else if (value > medicine.stock) {
      toast.error(`Only ${medicine.stock} available in stock!`);
      setQuantity(medicine.stock);
    } else {
      setQuantity(value);
    }
  };

  const incrementQuantity = () => {
    if (quantity < medicine.stock) {
      setQuantity(q => q + 1);
    } else {
      toast.error(`Maximum stock limit reached (${medicine.stock} available)`);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!medicine) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-xl text-gray-700">Medicine not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ============================================ */}
        {/* BACK NAVIGATION */}
        {/* ============================================ */}
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-6 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Shop
        </Link>

        {/* ============================================ */}
        {/* MAIN PRODUCT SECTION - Grid Layout */}
        {/* ============================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
          {/* LEFT: Product Image */}
          <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8">
            <div className="relative group">
              <img
                src={medicine.imageUrl || 'https://via.placeholder.com/500'}
                alt={medicine.name}
                className="w-full h-auto max-h-[500px] object-contain rounded-lg transition-transform duration-300 group-hover:scale-105"
              />
              {/* Image Border Decoration */}
              <div className="absolute inset-0 border-2 border-gray-200 rounded-lg pointer-events-none"></div>
            </div>
          </div>

          {/* RIGHT: Product Information */}
          <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8">
            {/* Product Name */}
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3 leading-tight">
              {medicine.name}
            </h1>

            {/* Brand and Category */}
            <div className="flex items-center gap-3 text-gray-600 mb-6">
              <span className="font-semibold">{medicine.brand}</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500">{medicine.category}</span>
            </div>

            {/* Description */}
            <p className="text-gray-700 leading-relaxed mb-6 text-base lg:text-lg">
              {medicine.description}
            </p>

            {/* Divider */}
            <div className="border-t border-gray-200 my-6"></div>

            {/* Price */}
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-1">Price</p>
              <p className="text-4xl lg:text-5xl font-bold text-blue-600">
                ₹{medicine.price}
              </p>
            </div>

            {/* Stock Badge */}
            <div className="mb-6">
              {medicine.stock === 0 ? (
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full font-semibold">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Out of Stock
                </span>
              ) : medicine.stock < 10 ? (
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-full font-semibold">
                  <AlertCircle className="w-4 h-4" />
                  Only {medicine.stock} left in stock!
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full font-semibold">
                  <CheckCircle className="w-4 h-4" />
                  In Stock ({medicine.stock} available)
                </span>
              )}
            </div>

            {/* Prescription Required Badge */}
            {medicine.requiresPrescription && (
              <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3">
                <FileText className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-orange-800 mb-1">Prescription Required</p>
                  <p className="text-sm text-orange-700">
                    This medicine requires a valid prescription. Please upload your prescription during checkout.
                  </p>
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-gray-200 my-6"></div>

            {/* Quantity Selector */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Quantity
              </label>
              <div className="flex items-center gap-4">
                {/* Quantity Controls */}
                <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={decrementQuantity}
                    disabled={quantity <= 1 || medicine.stock === 0}
                    className="px-4 py-3 bg-gray-50 hover:bg-gray-100 disabled:bg-gray-200 disabled:cursor-not-allowed transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-5 h-5 text-gray-700" />
                  </button>

                  <input
                    type="number"
                    value={quantity}
                    onChange={handleQuantityChange}
                    disabled={medicine.stock === 0}
                    className="w-20 text-center text-lg font-semibold border-x-2 border-gray-300 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    min="1"
                    max={medicine.stock}
                  />

                  <button
                    onClick={incrementQuantity}
                    disabled={quantity >= medicine.stock || medicine.stock === 0}
                    className="px-4 py-3 bg-gray-50 hover:bg-gray-100 disabled:bg-gray-200 disabled:cursor-not-allowed transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-5 h-5 text-gray-700" />
                  </button>
                </div>

                {/* Stock Indicator */}
                <span className="text-sm text-gray-600">
                  {medicine.stock > 0 ? `Max: ${medicine.stock} available` : 'Not available'}
                </span>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={medicine.stock === 0}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 ${medicine.stock === 0
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-2xl hover:scale-105 active:scale-95'
                }`}
            >
              <ShoppingCart className="w-6 h-6" />
              {medicine.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <div className="mt-4 flex justify-center">
              <WishlistButton medicine={medicine} size={30} className="p-3 bg-gray-100 hover:bg-gray-200" />
              <span className="ml-2 self-center text-gray-600 font-medium">Add to Wishlist</span>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* ADDITIONAL DETAILS SECTION - Cards Grid */}
        {/* ============================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Product Details Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Product Details</h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Brand</span>
                <span className="font-semibold text-gray-900">{medicine.brand}</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Category</span>
                <span className="font-semibold text-gray-900">{medicine.category}</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Prescription</span>
                <span className={`font-semibold ${medicine.requiresPrescription ? 'text-orange-600' : 'text-green-600'}`}>
                  {medicine.requiresPrescription ? (
                    <span className="flex items-center gap-1">
                      Required <AlertCircle className="w-4 h-4" />
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      Not Required <CheckCircle className="w-4 h-4" />
                    </span>
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center py-3">
                <span className="text-gray-600 font-medium">Stock Status</span>
                <span className={`font-semibold ${medicine.stock === 0 ? 'text-red-600' :
                  medicine.stock < 10 ? 'text-orange-600' :
                    'text-green-600'
                  }`}>
                  {medicine.stock === 0 ? 'Out of Stock' :
                    medicine.stock < 10 ? `Low Stock (${medicine.stock})` :
                      `In Stock (${medicine.stock})`}
                </span>
              </div>
            </div>
          </div>

          {/* Description Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Description</h3>
            </div>

            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed text-base">
                {medicine.description}
              </p>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-800 font-medium mb-2">
                  ✓ 100% Genuine Medicine
                </p>
                <p className="text-sm text-blue-700">
                  All medicines are sourced directly from verified manufacturers and distributors.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* SIMILAR MEDICINES SECTION */}
        {/* ============================================ */}
        <div className="border-t border-gray-200 pt-12 mt-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Similar Medicines
              </h2>
              <p className="text-gray-600">
                More options in {medicine.category}
              </p>
            </div>
          </div>

          {/* Loading State */}
          {loadingSimilar ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-100 rounded-lg h-80 animate-pulse"></div>
              ))}
            </div>
          ) : similarMedicines.length === 0 ? (
            /* Empty State */
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-4">No similar medicines available</p>
              <button
                onClick={() => navigate('/shop')}
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
              >
                Browse All Medicines
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </button>
            </div>
          ) : (
            /* Medicine Cards Grid */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {similarMedicines.map((med) => (
                <div
                  key={med._id}
                  onClick={() => navigate(`/product/${med._id}`)}
                  className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  {/* Medicine Image */}
                  <div className="h-40 sm:h-48 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
                    <img
                      src={med.imageUrl || 'https://via.placeholder.com/200'}
                      alt={med.name}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>

                  {/* Medicine Info */}
                  <div className="p-4">
                    <h4 className="font-bold text-base sm:text-lg text-gray-900 mb-1 line-clamp-2 min-h-[3rem]">
                      {med.name}
                    </h4>
                    <p className="text-sm text-gray-500 mb-3">{med.brand}</p>

                    {/* Price and Stock */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xl sm:text-2xl font-bold text-blue-600">
                        ₹{med.price}
                      </span>
                      {med.stock > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          In Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          Out of Stock
                        </span>
                      )}
                    </div>

                    {/* View Details Button */}
                    <button
                      className="w-full py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/product/${med._id}`);
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
