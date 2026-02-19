import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosClient';
import { User, Mail, Phone, MapPin, Lock, Package, CheckCircle, Clock, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'orders'

    // Profile form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    });

    // Password change state
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        fetchProfile();
        fetchOrders();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get("/auth/me");
            // FIX: Handle response properly - extract user data
            const userData = res.data.user || res.data;
            setUser(userData);
            setFormData({
                name: userData.name || '',
                email: userData.email || '',
                phone: userData.phone || '',
                address: userData.address || ''
            });
        } catch (error) {
            console.error('Failed to load profile:', error);
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const fetchOrders = async () => {
        try {
            const res = await api.get("/orders/my-orders");
            // FIX: Handle orders response properly
            setOrders(res.data.orders || res.data || []);
        } catch (error) {
            console.error('Failed to load orders:', error);
            toast.error('Failed to load orders');
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();

        try {
            const res = await api.put("/auth/profile", {
                name: formData.name,
                phone: formData.phone,
                address: formData.address
            });

            // FIX: Handle response properly - extract user from res.data.user
            const updatedUser = res.data.user || res.data;
            setUser(updatedUser);
            toast.success('Profile updated successfully');
        } catch (error) {
            console.error('Update error:', error);
            toast.error(error.response?.data?.message || 'Failed to update profile');
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        try {
            await api.put("/auth/change-password", {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            toast.success('Password changed successfully');
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setShowPasswordChange(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to change password');
        }
    };

    const getOrderStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'delivered':
                return <CheckCircle className="h-5 w-5 text-green-600" />;
            case 'processing':
            case 'pending':
                return <Clock className="h-5 w-5 text-yellow-600" />;
            case 'cancelled':
                return <XCircle className="h-5 w-5 text-red-600" />;
            default:
                return <Package className="h-5 w-5 text-blue-600" />;
        }
    };

    const getOrderStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'delivered':
                return 'bg-green-100 text-green-800';
            case 'processing':
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-blue-100 text-blue-800';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-2xl font-bold">
                                {user?.name?.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
                            <p className="text-gray-600">{user?.email}</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-sm mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'profile'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                                    }`}
                            >
                                Profile Settings
                            </button>
                            <button
                                onClick={() => setActiveTab('orders')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'orders'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                                    }`}
                            >
                                My Orders ({orders.length})
                            </button>
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === 'profile' ? (
                            // Profile Settings Tab
                            <div className="space-y-6">
                                {/* Personal Information */}
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                        Personal Information
                                    </h2>
                                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Full Name */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    <User className="inline h-4 w-4 mr-1" />
                                                    Full Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    required
                                                />
                                            </div>

                                            {/* Email (Read-only) */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    <Mail className="inline h-4 w-4 mr-1" />
                                                    Email Address
                                                </label>
                                                <input
                                                    type="email"
                                                    value={formData.email}
                                                    disabled
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                                            </div>
                                        </div>

                                        {/* Phone Number */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                <Phone className="inline h-4 w-4 mr-1" />
                                                Phone Number
                                            </label>
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Enter your phone number"
                                            />
                                        </div>

                                        {/* Address */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                <MapPin className="inline h-4 w-4 mr-1" />
                                                Address
                                            </label>
                                            <textarea
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                rows="3"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Enter your complete address"
                                            />
                                        </div>

                                        {/* Save Button */}
                                        <button
                                            type="submit"
                                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                        >
                                            Save Changes
                                        </button>
                                    </form>
                                </div>

                                {/* Password Change Section */}
                                <div className="border-t pt-6">
                                    <button
                                        onClick={() => setShowPasswordChange(!showPasswordChange)}
                                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        <Lock className="h-4 w-4" />
                                        {showPasswordChange ? 'Hide' : 'Change'} Password
                                    </button>

                                    {showPasswordChange && (
                                        <form onSubmit={handlePasswordChange} className="mt-4 space-y-4 max-w-md">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Current Password
                                                </label>
                                                <input
                                                    type="password"
                                                    value={passwordData.currentPassword}
                                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    New Password
                                                </label>
                                                <input
                                                    type="password"
                                                    value={passwordData.newPassword}
                                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    minLength="6"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Confirm New Password
                                                </label>
                                                <input
                                                    type="password"
                                                    value={passwordData.confirmPassword}
                                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    minLength="6"
                                                    required
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                            >
                                                Change Password
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </div>
                        ) : (
                            // Orders Tab
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order History</h2>

                                {orders.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600 mb-4">No orders yet</p>
                                        <button
                                            onClick={() => navigate('/shop')}
                                            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Start Shopping
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {orders.map((order) => (
                                            <div key={order._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                                                    <div>
                                                        <p className="font-semibold text-gray-900">
                                                            Order #{order.orderId || order._id?.slice(-8).toUpperCase()}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                                day: 'numeric',
                                                                month: 'long',
                                                                year: 'numeric'
                                                            })}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {getOrderStatusIcon(order.status)}
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                                                            {order.status || 'Pending'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="border-t pt-3">
                                                    <p className="text-sm text-gray-600 mb-2">
                                                        {order.items?.length || 0} item(s)
                                                    </p>
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-lg font-bold text-gray-900">
                                                            ₹{order.totalAmount?.toFixed(2) || '0.00'}
                                                        </p>
                                                        <button
                                                            onClick={() => navigate(`/orders/${order._id}`)}
                                                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                                        >
                                                            View Details →
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;