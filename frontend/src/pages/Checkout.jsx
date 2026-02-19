import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosClient';
import {
  MapPin,
  User,
  Phone,
  Mail,
  CreditCard,
  Truck,
  ShoppingBag,
  Tag,
  CheckCircle,
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';

// Pincode service function
const fetchPincodeDetails = async (pincode) => {
  try {
    if (!/^\d{6}$/.test(pincode)) {
      return { success: false, error: 'Invalid pincode format' };
    }

    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = await response.json();

    if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
      const postOffices = data[0].PostOffice;
      
      const cities = [...new Set(postOffices.map(po => po.District))];
      const states = [...new Set(postOffices.map(po => po.State))];
      
      return {
        success: true,
        cities,
        states,
        postOffices: postOffices.map(po => po.Name)
      };
    } else {
      return { success: false, error: 'Invalid pincode' };
    }
  } catch (error) {
    console.error('Pincode fetch error:', error);
    return { success: false, error: 'Failed to fetch pincode details' };
  }
};

const Checkout = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [user, setUser] = useState(null);

  // Pincode states
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState('');
  const [availableCities, setAvailableCities] = useState([]);
  const [availableStates, setAvailableStates] = useState([]);
  const [cityInputType, setCityInputType] = useState('manual');
  const [stateInputType, setStateInputType] = useState('manual');

  // Form state
  const [shippingDetails, setShippingDetails] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  useEffect(() => {
    fetchUserAndCart();
  }, []);

  const fetchUserAndCart = async () => {
    try {
      setLoading(true);

      const userRes = await api.get('/auth/profile');
      const userData = userRes.data.user || userRes.data;
      setUser(userData);

      setShippingDetails({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || '',
        city: userData.city || '',
        state: userData.state || '',
        postalCode: userData.postalCode || ''
      });

      const cartRes = await api.get('/cart');
      const items = Array.isArray(cartRes.data) ? cartRes.data : cartRes.data.items || [];
      setCartItems(items);

      if (items.length === 0) {
        toast.error('Your cart is empty');
        navigate('/cart');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load checkout details');
    } finally {
      setLoading(false);
    }
  };

  // Handle pincode lookup
  const handlePincodeBlur = async (e) => {
    const pincode = e.target.value;
    
    if (!pincode || pincode.length !== 6) {
      setAvailableCities([]);
      setAvailableStates([]);
      setPincodeError('');
      return;
    }

    setPincodeLoading(true);
    setPincodeError('');
    
    const result = await fetchPincodeDetails(pincode);
    
    if (result.success) {
      setAvailableCities(result.cities);
      setAvailableStates(result.states);
      
      // Auto-switch to dropdown mode
      if (result.cities.length > 0) setCityInputType('select');
      if (result.states.length > 0) setStateInputType('select');
      
      // Auto-select if only one option
      if (result.cities.length === 1) {
        setShippingDetails(prev => ({ ...prev, city: result.cities[0] }));
      }
      if (result.states.length === 1) {
        setShippingDetails(prev => ({ ...prev, state: result.states[0] }));
      }
      
      toast.success('Pincode verified!');
    } else {
      setPincodeError(result.error);
      setAvailableCities([]);
      setAvailableStates([]);
      toast.error(result.error);
    }
    
    setPincodeLoading(false);
  };

  // Calculate totals
  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => {
      const medicine = item.medicine || item;
      const price = medicine.price || 0;
      const quantity = item.quantity || 0;
      return sum + (price * quantity);
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const deliveryCharge = 0;
  const discountAmount = appliedCoupon ? (subtotal * discount / 100) : 0;
  const total = subtotal + deliveryCharge - discountAmount;

  // Apply coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    try {
      const res = await api.post('/coupons/validate', { 
        code: couponCode,
        cartTotal: subtotal 
      });
      
      const discountPercent = res.data.discountPercent || res.data.discount || 0;
      setDiscount(discountPercent);
      setAppliedCoupon(couponCode);
      toast.success(`Coupon applied! ${discountPercent}% off`);
    } catch (error) {
      console.error('Coupon error:', error);
      toast.error(error.response?.data?.message || 'Invalid coupon code');
    }
  };

  const removeCoupon = () => {
    setDiscount(0);
    setAppliedCoupon(null);
    setCouponCode('');
    toast.success('Coupon removed');
  };

  // Form validation
  const validateForm = () => {
    const required = ['name', 'email', 'phone', 'address', 'city', 'postalCode'];
    const empty = required.filter(field => !shippingDetails[field]?.trim());

    if (empty.length > 0) {
      toast.error(`Please fill in: ${empty.join(', ')}`);
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shippingDetails.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(shippingDetails.phone.replace(/\s/g, ''))) {
      toast.error('Please enter a valid 10-digit phone number');
      return false;
    }

    const postalRegex = /^[0-9]{6}$/;
    if (!postalRegex.test(shippingDetails.postalCode)) {
      toast.error('Please enter a valid 6-digit postal code');
      return false;
    }

    return true;
  };

  // Create Razorpay order
  const createRazorpayOrder = async (orderId) => {
    try {
      const res = await api.post('/payments/create-order', {
        amount: total,
        currency: 'INR',
        orderId: orderId
      });
      return res.data;
    } catch (error) {
      console.error('Failed to create Razorpay order:', error);
      throw error;
    }
  };

  // Handle order placement
  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setProcessing(true);

    try {
      const orderData = {
        items: cartItems.map(item => ({
          medicine: item.medicine?._id || item.medicineId || item._id,
          quantity: item.quantity,
          price: item.medicine?.price || item.price
        })),
        shippingAddress: {
          name: shippingDetails.name,
          email: shippingDetails.email,
          phone: shippingDetails.phone,
          address: shippingDetails.address,
          city: shippingDetails.city,
          state: shippingDetails.state || '',
          postalCode: shippingDetails.postalCode
        },
        paymentMethod: paymentMethod,
        totalAmount: total,
        subtotal: subtotal,
        deliveryCharge: deliveryCharge,
        discount: discountAmount,
        couponCode: appliedCoupon
      };

      console.log('Creating order:', orderData);

      const res = await api.post('/orders', orderData);
      console.log('Order response:', res.data);
      
      const createdOrder = res.data.order || res.data;

      if (paymentMethod === 'razorpay') {
        const razorpayOrder = await createRazorpayOrder(createdOrder._id);
        
        await initializeRazorpay({
          ...createdOrder,
          razorpayOrderId: razorpayOrder.id,
          amount: razorpayOrder.amount
        });
      } else {
        toast.success('Order placed successfully!');
        await clearCart();
        setTimeout(() => {
          navigate('/orders');
        }, 1500);
      }
    } catch (error) {
      console.error('Order error:', error);
      toast.error(error.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Initialize Razorpay
  const initializeRazorpay = async (orderData) => {
    try {
      if (!window.Razorpay) {
        toast.error('Payment gateway not loaded. Please refresh and try again.');
        return;
      }

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_dummy',
        amount: orderData.amount || total * 100,
        currency: 'INR',
        name: 'MedStore',
        description: 'Medicine Purchase',
        order_id: orderData.razorpayOrderId,
        handler: async function (response) {
          try {
            const verifyRes = await api.post('/payments/verify', {
              orderId: orderData._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verifyRes.data.success) {
              toast.success('Payment successful! Order placed.');
              await clearCart();
              navigate('/orders');
            } else {
              toast.error('Payment verification failed');
            }
          } catch (error) {
            console.error('Verification error:', error);
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: shippingDetails.name,
          email: shippingDetails.email,
          contact: shippingDetails.phone
        },
        theme: {
          color: '#2563EB'
        },
        modal: {
          ondismiss: function () {
            toast.error('Payment cancelled');
            setProcessing(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Razorpay error:', error);
      toast.error('Failed to start payment. Please try again.');
    }
  };

  // Clear cart after successful order
  const clearCart = async () => {
    try {
      await api.delete('/cart/clear');
    } catch (error) {
      console.error('Clear cart error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 pb-32 sm:pb-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
          <p className="text-gray-600">Complete your purchase</p>
        </div>

        <form onSubmit={handlePlaceOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Details */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-6">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Shipping Details</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <User className="inline h-4 w-4 mr-1" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={shippingDetails.name}
                      onChange={(e) => setShippingDetails({ ...shippingDetails, name: e.target.value })}
                      className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Mail className="inline h-4 w-4 mr-1" />
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={shippingDetails.email}
                      onChange={(e) => setShippingDetails({ ...shippingDetails, email: e.target.value })}
                      className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="your@email.com"
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Phone className="inline h-4 w-4 mr-1" />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={shippingDetails.phone}
                      onChange={(e) => setShippingDetails({ ...shippingDetails, phone: e.target.value })}
                      className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="10-digit mobile number"
                      required
                    />
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address *
                    </label>
                    <textarea
                      value={shippingDetails.address}
                      onChange={(e) => setShippingDetails({ ...shippingDetails, address: e.target.value })}
                      rows="3"
                      className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="House/Flat No., Building Name, Street"
                      required
                    />
                  </div>

                  {/* Postal Code */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postal Code *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={shippingDetails.postalCode}
                        onChange={(e) => setShippingDetails({ ...shippingDetails, postalCode: e.target.value })}
                        onBlur={handlePincodeBlur}
                        className={`w-full px-4 py-3 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          pincodeError ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="6-digit PIN code"
                        maxLength="6"
                        required
                      />
                      {pincodeLoading && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                    </div>
                    {pincodeError && (
                      <p className="text-red-500 text-xs mt-1">{pincodeError}</p>
                    )}
                    {availableCities.length > 0 && (
                      <p className="text-green-600 text-xs mt-1">
                        ✓ Pincode verified for {availableCities.join(', ')}
                      </p>
                    )}
                  </div>

                  {/* City with Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    {availableCities.length > 0 && cityInputType === 'select' ? (
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <select
                            value={shippingDetails.city}
                            onChange={(e) => setShippingDetails({ ...shippingDetails, city: e.target.value })}
                            className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                            required
                          >
                            <option value="">Select City</option>
                            {availableCities.map(city => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setCityInputType('manual')}
                          className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 whitespace-nowrap"
                        >
                          Enter manually
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={shippingDetails.city}
                          onChange={(e) => setShippingDetails({ ...shippingDetails, city: e.target.value })}
                          className="flex-1 px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter city"
                          required
                        />
                        {availableCities.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setCityInputType('select')}
                            className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 whitespace-nowrap"
                          >
                            Choose from list
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* State with Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    {availableStates.length > 0 && stateInputType === 'select' ? (
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <select
                            value={shippingDetails.state}
                            onChange={(e) => setShippingDetails({ ...shippingDetails, state: e.target.value })}
                            className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                          >
                            <option value="">Select State</option>
                            {availableStates.map(state => (
                              <option key={state} value={state}>{state}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setStateInputType('manual')}
                          className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 whitespace-nowrap"
                        >
                          Enter manually
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={shippingDetails.state}
                          onChange={(e) => setShippingDetails({ ...shippingDetails, state: e.target.value })}
                          className="flex-1 px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter state"
                        />
                        {availableStates.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setStateInputType('select')}
                            className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 whitespace-nowrap"
                          >
                            Choose from list
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Coupon Code */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Have a Coupon?</h2>
                </div>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">Coupon Applied!</p>
                        <p className="text-sm text-green-700">Code: {appliedCoupon} ({discount}% off)</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="ENTER COUPON CODE"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-6">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Payment Method</h2>
                </div>

                <div className="space-y-3">
                  <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${paymentMethod === 'cod'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-5 h-5 text-blue-600"
                    />
                    <div className="ml-4 flex-1">
                      <div className="flex items-center gap-2">
                        <Truck className="h-5 w-5 text-gray-600" />
                        <span className="font-semibold text-gray-900">Cash on Delivery</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Pay when your order arrives</p>
                    </div>
                  </label>

                  <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${paymentMethod === 'razorpay'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="razorpay"
                      checked={paymentMethod === 'razorpay'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-5 h-5 text-blue-600"
                    />
                    <div className="ml-4 flex-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-gray-600" />
                        <span className="font-semibold text-gray-900">Pay Online (Razorpay)</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Credit/Debit Card, UPI, Net Banking</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary (unchanged) */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                <div className="flex items-center gap-2 mb-6">
                  <ShoppingBag className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Order Summary</h2>
                </div>

                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {cartItems.map((item, index) => {
                    const medicine = item.medicine || item;
                    return (
                      <div key={index} className="flex gap-3 pb-3 border-b border-gray-200 last:border-0">
                        <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center">
                          {medicine.image ? (
                            <img src={medicine.image} alt={medicine.name} className="w-full h-full object-cover rounded" />
                          ) : (
                            <ShoppingBag className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{medicine.name}</p>
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                          <p className="text-sm font-semibold text-gray-900">
                            ₹{((medicine.price || 0) * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({discount}%)</span>
                      <span className="font-semibold">-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-700">
                    <span>Delivery</span>
                    <span className="font-semibold text-green-600">Free</span>
                  </div>

                  <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-blue-600">₹{total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={processing || cartItems.length === 0}
                  className="hidden sm:flex w-full mt-6 items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Place Order
                    </>
                  )}
                </button>

                <div className="mt-4 flex items-start gap-2 text-xs text-gray-600">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p>Your payment information is secure and encrypted</p>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Mobile Sticky Button */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-700 font-medium">Total:</span>
            <span className="text-xl font-bold text-blue-600">₹{total.toFixed(2)}</span>
          </div>
          <button
            onClick={handlePlaceOrder}
            disabled={processing || cartItems.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                Place Order
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;