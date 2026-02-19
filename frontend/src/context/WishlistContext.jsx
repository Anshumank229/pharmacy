import { createContext, useState, useEffect, useContext } from "react";
import api from "../api/axiosClient";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [wishlistIds, setWishlistIds] = useState(new Set()); // IDs for O(1) lookup
    const [wishlistMedicines, setWishlistMedicines] = useState([]); // Full objects
    const [loading, setLoading] = useState(false);

    // Fetch wishlist when user logs in
    useEffect(() => {
        if (user) {
            fetchWishlist();
        } else {
            setWishlistIds(new Set());
            setWishlistMedicines([]);
        }
    }, [user]);

    const fetchWishlist = async () => {
        setLoading(true);
        try {
            const res = await api.get("/wishlist");
            const meds = res.data.medicines || [];

            setWishlistMedicines(meds);
            setWishlistIds(new Set(meds.map((m) => m._id)));
        } catch (err) {
            console.error("Failed to fetch wishlist:", err);
        } finally {
            setLoading(false);
        }
    };

    const isInWishlist = (medicineId) => {
        return wishlistIds.has(medicineId);
    };

    const toggleWishlist = async (medicine) => {
        if (!user) {
            toast.error("Please login to save items");
            return false; // Indicating action not taken
        }

        const medicineId = medicine._id;
        const isAdded = !wishlistIds.has(medicineId);

        // Optimistic Update
        setWishlistIds((prev) => {
            const newSet = new Set(prev);
            if (isAdded) newSet.add(medicineId);
            else newSet.delete(medicineId);
            return newSet;
        });

        // Also update full list optimistically (approximate)
        if (isAdded) {
            setWishlistMedicines((prev) => [...prev, medicine]);
        } else {
            setWishlistMedicines((prev) => prev.filter((m) => m._id !== medicineId));
        }

        try {
            const res = await api.post(`/wishlist/${medicineId}`);
            if (res.data.added !== isAdded) {
                // Server returned different state? Revert/Sync
                // But usually we just trust our optimistic update or refetch if critical
            }
            toast.success(res.data.message, { icon: isAdded ? "❤️" : "💔" });
        } catch (err) {
            // Revert on error
            console.error("Wishlist toggle failed", err);
            toast.error("Failed to update wishlist");

            setWishlistIds((prev) => {
                const newSet = new Set(prev);
                if (isAdded) newSet.delete(medicineId); // Revert add
                else newSet.add(medicineId); // Revert remove
                return newSet;
            });

            // Revert full list
            if (isAdded) {
                setWishlistMedicines((prev) => prev.filter((m) => m._id !== medicineId));
            } else {
                // Can't easily put it back in correct order/data without refetch, 
                // but we can try or just fetchWishlist()
                fetchWishlist();
            }
        }
    };

    return (
        <WishlistContext.Provider
            value={{
                wishlistIds,
                wishlistMedicines,
                isInWishlist,
                toggleWishlist,
                loading,
                wishlistCount: wishlistIds.size,
            }}
        >
            {children}
        </WishlistContext.Provider>
    );
};
