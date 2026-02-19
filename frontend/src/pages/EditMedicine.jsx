import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axiosClient";
import toast from "react-hot-toast";

const CATEGORIES = [
  "Pain Relief", "Antibiotics", "Diabetes", "Cold & Flu",
  "Vitamins", "Skin Care", "Heart Care", "Digestive Health", "Other"
];

const EditMedicine = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [form, setForm] = useState({
    name: "",
    brand: "",
    price: "",
    stock: "",
    category: "",
    description: "",
    requiresPrescription: false,
    imageUrl: "",
  });

  // Pre-fill form on mount
  useEffect(() => {
    const loadMed = async () => {
      try {
        const res = await api.get(`/medicines/${id}`);
        const med = res.data;
        setForm({
          name: med.name || "",
          brand: med.brand || "",
          price: med.price || "",
          stock: med.stock ?? "",
          category: med.category || "",
          description: med.description || "",
          requiresPrescription: med.requiresPrescription || false,
          imageUrl: med.imageUrl || "",
        });
        if (med.imageUrl) setImagePreview(med.imageUrl);
      } catch {
        toast.error("Failed to load medicine");
        navigate("/admin/medicines");
      } finally {
        setFetching(false);
      }
    };
    loadMed();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async () => {
    if (!imageFile) return null;
    const formData = new FormData();
    formData.append("file", imageFile);
    const res = await api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.brand || !form.price || !form.category) {
      return toast.error("Name, brand, price, and category are required");
    }
    setLoading(true);
    try {
      let imageUrl = form.imageUrl;
      if (imageFile) {
        imageUrl = await uploadImage();
        if (!imageUrl) throw new Error("Image upload failed");
      }
      await api.put(`/medicines/${id}`, {
        ...form,
        imageUrl,
        price: Number(form.price),
        stock: Number(form.stock) || 0,
      });
      toast.success("Medicine updated successfully!");
      navigate("/admin/medicines");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update medicine");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">✏️ Edit Medicine</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Product Image</label>
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-xl border" />
                ) : (
                  <div className="w-24 h-24 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">
                    No image
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-400 mt-1">Or update the URL below</p>
                  <input
                    type="url"
                    name="imageUrl"
                    value={form.imageUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Name & Brand */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Medicine Name *</label>
                <input name="name" value={form.name} onChange={handleChange} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Brand *</label>
                <input name="brand" value={form.brand} onChange={handleChange} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {/* Price & Stock */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Price (₹) *</label>
                <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Stock (units)</label>
                <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Category *</label>
              <select name="category" value={form.category} onChange={handleChange} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Select a category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>

            {/* Requires Prescription */}
            <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <input type="checkbox" id="requiresPrescription" name="requiresPrescription"
                checked={form.requiresPrescription} onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded" />
              <label htmlFor="requiresPrescription" className="text-sm font-medium text-gray-700">
                🩺 Requires Prescription
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => navigate("/admin/medicines")}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50">
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditMedicine;
