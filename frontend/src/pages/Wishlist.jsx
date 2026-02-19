import { useContext } from "react";
import { Link } from "react-router-dom";
import { WishlistContext } from "../context/WishlistContext";
import WishlistButton from "../components/WishlistButton";
import { Package, ShoppingCart, ArrowRight } from "lucide-react";
import api from "../api/axiosClient";
import toast from "react-hot-toast";

const Wishlist = () => {
    const { wishlistMedicines, loading } = useContext(WishlistContext);

    const addToCart = async (id, stock) => {
        if (stock === 0) return;
        try {
            await api.post("/cart/add", { medicineId: id, quantity: 1 });
            toast.success("Added to cart!");
        } catch (err) {
            toast.error("Failed to add to cart");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                    <span className="bg-red-100 p-2 rounded-lg text-red-600">
                        ❤️
                    </span>
                    My Wishlist
                </h1>

                {wishlistMedicines.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Package className="w-10 h-10 text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Your wishlist is empty
                        </h2>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto">
                            Save items you love to your wishlist so you can easily find them later.
                        </p>
                        <Link
                            to="/shop"
                            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition shadow-md hover:shadow-lg"
                        >
                            Browse Shop <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {wishlistMedicines.map((med) => (
                            <div
                                key={med._id}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition duration-300 flex flex-col relative group"
                            >
                                {/* Wishlist Button (Remove) */}
                                <div className="absolute top-3 right-3 z-10">
                                    <WishlistButton medicine={med} />
                                </div>

                                <Link to={`/product/${med._id}`} className="flex-1">
                                    <div className="h-48 bg-gray-50 rounded-t-2xl p-6 flex items-center justify-center">
                                        <img
                                            src={med.imageUrl || "https://via.placeholder.com/300"}
                                            alt={med.name}
                                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                    <div className="p-5">
                                        <div className="mb-2">
                                            <span className="text-xs font-medium bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                                                {med.category}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">
                                            {med.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 mb-3">{med.brand}</p>

                                        <div className="flex items-center justify-between mt-4">
                                            <span className="text-xl font-bold text-blue-600">
                                                ₹{med.price}
                                            </span>
                                            <span className={`text-xs font-semibold ${med.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                {med.stock > 0 ? 'In Stock' : 'Out of Stock'}
                                            </span>
                                        </div>
                                    </div>
                                </Link>

                                <div className="p-5 pt-0 mt-auto">
                                    <button
                                        onClick={() => addToCart(med._id, med.stock)}
                                        disabled={med.stock === 0}
                                        className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                                    >
                                        <ShoppingCart className="w-5 h-5" />
                                        {med.stock === 0 ? "Out of Stock" : "Add to Cart"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Wishlist;
