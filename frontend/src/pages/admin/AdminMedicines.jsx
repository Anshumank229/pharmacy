import { useEffect, useState } from "react";
import api from "../../api/axiosClient";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const AdminMedicines = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  const loadMedicines = async (currentPage = 1) => {
    setLoading(true);
    try {
      // API now returns { medicines, page, limit, total, pages }
      const res = await api.get("/medicines", { params: { page: currentPage, limit: LIMIT } });
      setMedicines(res.data.medicines || []);
      setPage(res.data.page || 1);
      setTotalPages(res.data.pages || 1);
      setTotal(res.data.total || 0);
    } catch (err) {
      toast.error("Failed to load medicines");
    } finally {
      setLoading(false);
    }
  };

  const deleteMedicine = async (id) => {
    if (!window.confirm("Are you sure you want to delete this medicine?")) return;
    try {
      await api.delete(`/medicines/${id}`);
      toast.success("Medicine deleted");
      loadMedicines(page);
    } catch {
      toast.error("Failed to delete medicine");
    }
  };

  useEffect(() => { loadMedicines(1); }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Medicines</h1>
          {!loading && <p className="text-sm text-gray-500 mt-1">{total} medicines total</p>}
        </div>
        <Link
          to="/admin/add-medicine"
          className="bg-blue-600 text-white px-4 py-2 rounded-xl shadow hover:bg-blue-700 font-semibold"
        >
          ➕ Add Medicine
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white rounded-xl shadow-md">
              <thead>
                <tr className="bg-gray-100 text-left text-gray-700 text-sm">
                  <th className="p-3">Image</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {medicines.map((m) => (
                  <tr key={m._id} className="border-b hover:bg-gray-50 text-sm">
                    <td className="p-3">
                      <img
                        src={m.imageUrl || "https://via.placeholder.com/64"}
                        alt={m.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    </td>
                    <td className="p-3 font-medium">{m.name}</td>
                    <td className="p-3 text-gray-600">{m.category}</td>
                    <td className="p-3 font-semibold text-blue-700">₹{m.price}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.stock === 0 ? "bg-red-100 text-red-700" :
                          m.stock <= 10 ? "bg-orange-100 text-orange-700" :
                            "bg-green-100 text-green-700"
                        }`}>
                        {m.stock === 0 ? "Out of Stock" : `${m.stock} left`}
                      </span>
                    </td>
                    <td className="p-3 space-x-2">
                      <Link
                        to={`/admin/edit-medicine/${m._id}`}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => deleteMedicine(m._id)}
                        className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {medicines.length === 0 && (
              <p className="text-center text-gray-500 py-10">No medicines found.</p>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => { const p = page - 1; setPage(p); loadMedicines(p); }}
                  disabled={page <= 1}
                  className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40"
                >← Prev</button>
                <button
                  onClick={() => { const p = page + 1; setPage(p); loadMedicines(p); }}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40"
                >Next →</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminMedicines;
