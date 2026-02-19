import { X } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';

const MobileMenu = ({ isOpen, onClose, user, logout }) => {
    const navigate = useNavigate();

    const handleLinkClick = (path) => {
        navigate(path);
        onClose();
    };

    const handleLogout = () => {
        logout();
        onClose();
    };

    const navLinkClass = "w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 font-medium touch-manipulation";

    return (
        <>
            {/* Backdrop Overlay */}
            <div
                className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={onClose}
                aria-hidden={!isOpen}
            />

            {/* Slide-in Menu */}
            <div
                className={`fixed top-0 right-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
                role="dialog"
                aria-modal="true"
                aria-label="Mobile navigation menu"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-800">Menu</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        aria-label="Close menu"
                        style={{ minWidth: '44px', minHeight: '44px' }}
                    >
                        <X className="h-5 w-5 text-gray-600" />
                    </button>
                </div>

                {/* User Info Section */}
                {user && (
                    <div className="p-4 bg-blue-50 border-b">
                        <p className="text-sm font-medium text-gray-800 truncate">{user.name}</p>
                        <p className="text-xs text-gray-600 truncate">{user.email}</p>
                    </div>
                )}

                {/* Navigation Links */}
                <nav className="flex flex-col p-4 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
                    <button onClick={() => handleLinkClick('/')} className={navLinkClass}>
                        🏠 Home
                    </button>

                    <button onClick={() => handleLinkClick('/shop')} className={navLinkClass}>
                        🛒 Shop
                    </button>

                    {user ? (
                        <>
                            <button onClick={() => handleLinkClick('/cart')} className={navLinkClass}>
                                🛍️ Cart
                            </button>

                            <button onClick={() => handleLinkClick('/profile')} className={navLinkClass}>
                                👤 Profile
                            </button>

                            <button onClick={() => handleLinkClick('/orders')} className={navLinkClass}>
                                📦 Orders
                            </button>

                            <button onClick={() => handleLinkClick('/upload-prescription')} className={navLinkClass}>
                                📄 Prescription
                            </button>

                            {/* Admin Dashboard Link - Only for admin users */}
                            {user.role === 'admin' && (
                                <button
                                    onClick={() => handleLinkClick('/admin/dashboard')}
                                    className="w-full text-left px-4 py-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors text-indigo-700 font-semibold touch-manipulation border border-indigo-200"
                                >
                                    🛡️ Admin Dashboard
                                </button>
                            )}

                            <div className="pt-4 border-t">
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-3 rounded-lg bg-red-50 hover:bg-red-100 transition-colors text-red-600 font-medium touch-manipulation"
                                    style={{ minHeight: '44px' }}
                                >
                                    🚪 Logout
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => handleLinkClick('/login')}
                                className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 font-medium touch-manipulation"
                                style={{ minHeight: '44px' }}
                            >
                                🔑 Login
                            </button>

                            <button
                                onClick={() => handleLinkClick('/register')}
                                className="w-full text-left px-4 py-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors text-blue-600 font-medium touch-manipulation"
                                style={{ minHeight: '44px' }}
                            >
                                ✨ Register
                            </button>
                        </>
                    )}
                </nav>
            </div>
        </>
    );
};

export default MobileMenu;
