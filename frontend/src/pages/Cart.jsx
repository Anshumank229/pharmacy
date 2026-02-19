import { useEffect, useState, useContext } from "react";
import api from "../api/axiosClient";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Trash2, Plus, Minus, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";

const Cart = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useContext(AuthContext);
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [updatingItem, setUpdatingItem] = useState(null);

  // Remove localStorage check - use AuthContext instead
  const isLoggedIn = !!user;

  const loadCart = async () => {
    try {
      const res = await api.get("/cart");
      setCart(res.data || { items: [] });
    } catch (error) {
      console.error('Failed to load cart:', error);
      setCart({ items: [] });
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (medicineId, newQuantity) => {
    if (newQuantity < 1) return;

    // Optimistic update
    const oldCart = { ...cart };
    setCart(prevCart => ({
      ...prevCart,
      items: prevCart.items.map(item =>
        item.medicine?._id === medicineId
          ? { ...item, quantity: newQuantity }
          : item
      )
    }));

    try {
      setUpdatingItem(medicineId);
      await api.post("/cart/update", { medicineId, quantity: newQuantity });
      toast.success('Cart updated');
    } catch (error) {
      console.error('Update quantity error:', error);
      toast.error('Failed to update quantity');
      // Revert optimistic update
      setCart(oldCart);
    } finally {
      setUpdatingItem(null);
    }
  };

  const removeItem = async (medicineId) => {
    // Optimistic update
    const oldCart = { ...cart };
    setCart(prevCart => ({
      ...prevCart,
      items: prevCart.items.filter(item => item.medicine?._id !== medicineId)
    }));

    try {
      await api.post("/cart/remove", { medicineId });
      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Remove item error:', error);
      toast.error('Failed to remove item');
      // Revert optimistic update
      setCart(oldCart);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadCart();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn]);

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const subtotal = cart.items?.reduce(
    (acc, item) => acc + (item.medicine?.price || 0) * (item.quantity || 0),
    0
  ) || 0;

  const delivery = 0; // Free delivery
  const total = subtotal + delivery;

  // Image component with inline SVG fallback (no external URLs)
  const ProductImage = ({ src, alt }) => {
    const [imageError, setImageError] = useState(false);

    const imageSrc = (!src || imageError)
      ? 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23e5e7eb" width="150" height="150"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="18" fill="%239ca3af"%3EMedicine%3C/text%3E%3C/svg%3E'
      : src;

    return (
      <img
        src={imageSrc}
        alt={alt}
        className="w-full h-full object-cover rounded-lg bg-gray-100"
        onError={() => setImageError(true)}
      />
    );
  };

  // Show login prompt if not logged in
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md w-full border border-gray-100">
          <div className="mb-6 flex justify-center">
            <div className="p-4 bg-blue-50 rounded-full">
              <ShoppingCart className="w-16 h-16 text-blue-600" />
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Your Cart is Waiting
          </h2>

          <p className="text-gray-600 mb-8 leading-relaxed">
            Please login to view your cart and continue shopping for medicines
          </p>

          <button
            onClick={() => navigate('/login', { state: { from: { pathname: '/cart' } } })}
            className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl mb-4"
          >
            Login to View Cart
          </button>

          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors"
            >
              Sign up for free
            </button>
          </p>

          <div className="my-6 border-t border-gray-200"></div>

          <button
            onClick={() => navigate('/shop')}
            className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors"
          >
            ← Continue browsing medicines
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading your cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8 pb-32 lg:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Your Cart</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            {cart.items?.length || 0} {cart.items?.length === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        {!cart.items?.length ? (
          // Empty Cart State
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center">
            <ShoppingCart className="h-16 w-16 sm:h-20 sm:w-20 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-6">
              Add some medicines to get started!
            </p>
            <button
              onClick={() => navigate('/shop')}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-semibold shadow-lg hover:shadow-xl"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          // Cart with Items
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Cart Items - Left Side (2 columns on desktop) */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => {
                const medicine = item.medicine || {};
                const isUpdating = updatingItem === medicine._id;

                return (
                  <div
                    key={medicine._id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Product Image */}
                      <div className="w-full sm:w-24 h-48 sm:h-24 flex-shrink-0">
                        <ProductImage
                          src={medicine.imageUrl}
                          alt={medicine.name || 'Medicine'}
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        {/* Product Name & Price */}
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                          <div className="flex-1">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                              {medicine.name || 'Unknown Medicine'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {medicine.brand || medicine.manufacturer || 'Unknown Brand'} • {medicine.category || 'Medicine'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              ₹{medicine.price || 0} × {item.quantity}
                            </p>
                          </div>
                          <div className="text-xl sm:text-2xl font-bold text-blue-700">
                            ₹{((medicine.price || 0) * (item.quantity || 0)).toFixed(2)}
                          </div>
                        </div>

                        {/* Quantity Controls & Remove Button */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          {/* Quantity Controls */}
                          <div className="flex items-center">
                            <span className="text-sm text-gray-700 mr-3 font-medium">
                              Quantity:
                            </span>
                            <div className="flex items-center border border-gray-300 rounded-lg shadow-sm">
                              <button
                                onClick={() => updateQuantity(medicine._id, item.quantity - 1)}
                                disabled={item.quantity <= 1 || isUpdating}
                                className="p-2 sm:p-2.5 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-l-lg"
                                style={{ minWidth: '44px', minHeight: '44px' }}
                              >
                                <Minus className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                              </button>

                              <span className="px-4 sm:px-6 py-2 text-base sm:text-lg font-semibold text-gray-900 border-x border-gray-300 min-w-[60px] text-center">
                                {isUpdating ? (
                                  <div className="w-4 h-4 mx-auto border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  item.quantity
                                )}
                              </span>

                              <button
                                onClick={() => updateQuantity(medicine._id, item.quantity + 1)}
                                disabled={item.quantity >= (medicine.stock || 999) || isUpdating}
                                className="p-2 sm:p-2.5 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-r-lg"
                                style={{ minWidth: '44px', minHeight: '44px' }}
                              >
                                <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                              </button>
                            </div>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => removeItem(medicine._id)}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium border border-red-200 hover:border-red-300"
                            style={{ minHeight: '44px' }}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Remove</span>
                          </button>
                        </div>

                        {/* Stock Warning */}
                        {medicine.stock < 10 && medicine.stock > 0 && (
                          <p className="mt-2 text-xs text-amber-600 font-medium">
                            ⚠️ Only {medicine.stock} left in stock
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary - Right Side (1 column on desktop) */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sticky top-4">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Order Summary
                </h2>

                {/* Summary Details */}
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-gray-700">
                    <span>Delivery</span>
                    <span className="font-semibold text-green-600">
                      {delivery === 0 ? 'Free' : `₹${delivery}`}
                    </span>
                  </div>

                  <div className="border-t pt-4 flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-blue-700">₹{total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 sm:py-3.5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl"
                  style={{ minHeight: '44px' }}
                >
                  Proceed to Checkout
                </button>

                {/* Continue Shopping Link */}
                <button
                  onClick={() => navigate('/shop')}
                  className="w-full mt-3 text-blue-600 hover:text-blue-700 py-2 font-medium text-sm transition-colors"
                >
                  ← Continue Shopping
                </button>

                {/* Additional Info */}
                <div className="mt-6 pt-6 border-t space-y-3">
                  <div className="flex items-start gap-3 text-sm text-gray-600">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Free delivery on all orders</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-gray-600">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Secure payment processing</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-gray-600">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Easy returns within 7 days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Sticky Checkout Button */}
      {cart.items?.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl p-4 z-30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-700 font-medium">Total:</span>
            <span className="text-2xl font-bold text-gray-900">₹{total.toFixed(2)}</span>
          </div>
          <button
            onClick={() => navigate('/checkout')}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold text-base shadow-lg"
            style={{ minHeight: '44px' }}
          >
            Proceed to Checkout ({cart.items.length} items)
          </button>
        </div>
      )}
    </div>
  );
};

export default Cart;