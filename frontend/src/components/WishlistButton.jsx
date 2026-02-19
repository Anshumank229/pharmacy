import { useContext, useState } from "react";
import { WishlistContext } from "../context/WishlistContext";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";

const WishlistButton = ({ medicine, className = "", size = 20 }) => {
    const { isInWishlist, toggleWishlist } = useContext(WishlistContext);
    const navigate = useNavigate();
    const [isAnimating, setIsAnimating] = useState(false);

    const inWishlist = isInWishlist(medicine._id);

    const handleClick = async (e) => {
        e.preventDefault(); // Prevent parent Link clicks
        e.stopPropagation();

        setIsAnimating(true);
        // If not logged in, toggleWishlist handles the check/toast, 
        // but check if we need to redirect manually or if toggleWishlist return value helps.
        // The context returns false if not logged in.
        const result = await toggleWishlist(medicine);

        if (result === false) {
            // Not logged in or failed
            if (!localStorage.getItem('token')) { // Primitive check or rely on Context
                navigate("/login");
            }
        }

        setTimeout(() => setIsAnimating(false), 300);
    };

    return (
        <button
            onClick={handleClick}
            className={`p-2 rounded-full transition-all duration-200 focus:outline-none ${inWishlist
                    ? "bg-red-50 text-red-500 hover:bg-red-100"
                    : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                } ${className} ${isAnimating ? "scale-125" : "scale-100"}`}
            title={inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
        >
            <Heart
                size={size}
                fill={inWishlist ? "currentColor" : "none"}
                strokeWidth={2}
            />
        </button>
    );
};

export default WishlistButton;
