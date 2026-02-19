import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../api/axiosClient";
import toast from "react-hot-toast";
import WishlistButton from "../components/WishlistButton";

const CATEGORIES = ["All", "Pain Relief", "Antibiotics", "Diabetes", "Cold & Flu", "Vitamins", "Skin Care"];

const Shop = () => {
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [priceFilter, setPriceFilter] = useState("none");
  const [loading, setLoading] = useState(false);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchContainerRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  const fetchMedicines = useCallback(async (currentPage = 1) => {
    setLoading(true);
    try {
      const params = { page: currentPage, limit: LIMIT };
      if (search) params.search = search;
      if (category !== "All") params.category = category;

      const res = await api.get("/medicines", { params });
      const data = res.data;

      let meds = data.medicines || [];

      // Client-side price sort/filter (since backend doesn't support it yet)
      if (priceFilter === "under100") meds = meds.filter(m => m.price < 100);
      else if (priceFilter === "100-300") meds = meds.filter(m => m.price >= 100 && m.price <= 300);
      else if (priceFilter === "above300") meds = meds.filter(m => m.price > 300);
      else if (priceFilter === "low-high") meds = [...meds].sort((a, b) => a.price - b.price);
      else if (priceFilter === "high-low") meds = [...meds].sort((a, b) => b.price - a.price);

      setMedicines(meds);
      setPage(data.page || 1);
      setTotalPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load medicines");
    } finally {
      setLoading(false);
    }
  }, [search, category, priceFilter]);

  // Debounced Autocomplete Search
  useEffect(() => {
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);

    if (!search || search.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/medicines/suggestions?q=${search}`);
        setSuggestions(res.data);
        setShowSuggestions(true);
        setHighlightedIndex(-1); // Reset highlight on new results
      } catch (err) {
        console.error("Suggestion fetch failed", err);
      }
    }, 300);

    return () => clearTimeout(debounceTimeoutRef.current);
  }, [search]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard Navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[highlightedIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (med) => {
    setSearch(med.name);
    setShowSuggestions(false);
    // The main fetchMedicines effect will trigger automatically due to 'search' dependency
  };

  // Refetch when filters change (reset to page 1)
  useEffect(() => {
    setPage(1);
    fetchMedicines(1);
  }, [search, category, priceFilter]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    fetchMedicines(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addToCart = async (id) => {
    try {
      await api.post("/cart/add", { medicineId: id, quantity: 1 });
      toast.success("Added to cart!");
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Please log in to add items to cart");
      } else {
        toast.error("Failed to add to cart. Please try again");
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-blue-700">All Medicines</h1>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 sm:gap-4 mb-6 sm:mb-8 relative z-50">
        <div className="relative w-full md:w-1/3" ref={searchContainerRef}>
          <input
            type="text"
            placeholder="Search medicines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (search.length >= 2) setShowSuggestions(true); }}
            className="border border-gray-300 rounded-lg px-4 py-3 sm:py-2 shadow-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            style={{ minHeight: "44px" }}
          />

          {/* Autocomplete Dropdown */}
          {showSuggestions && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto z-50">
              {suggestions.length > 0 ? (
                suggestions.map((med, index) => (
                  <div
                    key={med._id}
                    onClick={() => selectSuggestion(med)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`px-4 py-3 cursor-pointer flex justify-between items-center transition-colors ${index === highlightedIndex ? "bg-blue-50" : "hover:bg-gray-50 bg-white"
                      }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="font-semibold text-gray-800 truncate">{med.name}</span>
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {med.category}
                      </span>
                    </div>
                    <span className="font-bold text-blue-600 whitespace-nowrap ml-2">₹{med.price}</span>
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-gray-500 text-sm italic">
                  No medicines found for "{search}"
                </div>
              )}
            </div>
          )}
        </div>

        <select
          className="border px-4 py-3 sm:py-2 rounded-lg shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
          style={{ minHeight: "44px" }}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>)}
        </select>

        <select
          className="border px-4 py-3 sm:py-2 rounded-lg shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
          style={{ minHeight: "44px" }}
          value={priceFilter}
          onChange={(e) => setPriceFilter(e.target.value)}
        >
          <option value="none">Sort / Filter by Price</option>
          <option value="low-high">Price: Low to High</option>
          <option value="high-low">Price: High to Low</option>
          <option value="under100">Under ₹100</option>
          <option value="100-300">₹100 – ₹300</option>
          <option value="above300">Above ₹300</option>
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Product Grid */}
      {!loading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {medicines.map((med) => (
              <div
                key={med._id}
                className="bg-white rounded-xl shadow hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full"
              >
                <Link to={`/product/${med._id}`} className="flex-1">
                  <img
                    src={med.imageUrl || "https://via.placeholder.com/300"}
                    alt={med.name}
                    className="w-full h-48 object-contain p-4 rounded-t-xl bg-gray-50"
                  />
                  {/* Wishlist Button */}
                  <div className="absolute top-3 right-3 z-10">
                    <WishlistButton medicine={med} />
                  </div>
                  <div className="px-4 pb-3">
                    <h2 className="font-semibold text-base sm:text-lg text-gray-800 line-clamp-2 min-h-[3.5rem]">
                      {med.name}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">{med.brand}</p>
                    <p className="text-xs text-gray-500">{med.category}</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-700 mt-3">₹{med.price}</p>
                    {med.stock > 0 ? (
                      med.stock <= 10 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 mt-2">
                          <span className="w-2 h-2 bg-orange-500 rounded-full" />
                          Only {med.stock} left!
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 mt-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full" />
                          In Stock
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 mt-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full" />
                        Out of Stock
                      </span>
                    )}
                  </div>
                </Link>

                <div className="px-4 pb-4">
                  <button
                    onClick={() => addToCart(med._id)}
                    disabled={med.stock === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 sm:py-2 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed touch-manipulation text-sm sm:text-base"
                    style={{ minHeight: "44px" }}
                  >
                    {med.stock === 0 ? "Out of Stock" : "Add to Cart"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {medicines.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">No medicines found matching your criteria.</p>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-10 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Page <span className="font-semibold">{page}</span> of{" "}
                <span className="font-semibold">{totalPages}</span> &middot;{" "}
                <span className="font-semibold">{total}</span> results
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  ← Previous
                </button>
                {/* Page number pills */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${pageNum === page
                        ? "bg-blue-600 text-white"
                        : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Shop;