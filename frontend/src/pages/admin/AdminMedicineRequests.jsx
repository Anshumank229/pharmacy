import React, { useState, useEffect } from 'react';
import api from '../../api/axiosClient';
import toast from 'react-hot-toast';
import {
  Clock,
  CheckCircle,
  XCircle,
  Package,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  MessageSquare,
  Calendar,
  Pill,
  Send,
  Download,
  CheckSquare,
  Square,
  Phone,      // Added
  Mail,       // Added
  User        // Added
} from 'lucide-react';

const AdminMedicineRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    pending: 0,
    total: 0,
    recent: 0
  });
  const [showModal, setShowModal] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [modalData, setModalData] = useState({
    status: '',
    adminNotes: '',
    estimatedArrival: '',
    alternativeMedicineId: ''
  });

  const LIMIT = 10;

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, [filter, page, searchTerm]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/medicine-requests', {
        params: {
          status: filter !== 'all' ? filter : undefined,
          page,
          limit: LIMIT,
          search: searchTerm || undefined
        }
      });
      setRequests(res.data.requests || []);
      setTotalPages(res.data.pages || 1);
    } catch (error) {
      console.error('Fetch requests error:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/medicine-requests/stats');
      setStats(res.data);
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(requests.map(r => r._id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectRequest = (id) => {
    if (selectedRequests.includes(id)) {
      setSelectedRequests(selectedRequests.filter(reqId => reqId !== id));
      setSelectAll(false);
    } else {
      setSelectedRequests([...selectedRequests, id]);
    }
  };

  const handleBulkUpdate = async (status) => {
    if (selectedRequests.length === 0) {
      toast.error('No requests selected');
      return;
    }

    if (!window.confirm(`Mark ${selectedRequests.length} requests as ${status}?`)) {
      return;
    }

    try {
      await api.post('/admin/medicine-requests/bulk-update', {
        ids: selectedRequests,
        status,
        adminNotes: `Bulk updated to ${status}`
      });
      toast.success(`Updated ${selectedRequests.length} requests`);
      setSelectedRequests([]);
      setSelectAll(false);
      fetchRequests();
      fetchStats();
    } catch (error) {
      toast.error('Bulk update failed');
    }
  };

  const openUpdateModal = (request) => {
    setCurrentRequest(request);
    setModalData({
      status: request.status,
      adminNotes: request.adminNotes || '',
      estimatedArrival: request.estimatedArrival ? new Date(request.estimatedArrival).toISOString().split('T')[0] : '',
      alternativeMedicineId: request.alternativeOffered?._id || ''
    });
    setShowModal(true);
  };

  const handleUpdateRequest = async (e) => {
    e.preventDefault();
    if (!currentRequest) return;

    try {
      await api.put(`/admin/medicine-requests/${currentRequest._id}`, modalData);
      toast.success('Request updated');
      setShowModal(false);
      fetchRequests();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { icon: <Clock className="h-4 w-4" />, color: 'bg-yellow-100 text-yellow-800' },
      approved: { icon: <CheckCircle className="h-4 w-4" />, color: 'bg-green-100 text-green-800' },
      rejected: { icon: <XCircle className="h-4 w-4" />, color: 'bg-red-100 text-red-800' },
      available: { icon: <Package className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800' },
      ordered: { icon: <CheckCircle className="h-4 w-4" />, color: 'bg-purple-100 text-purple-800' },
      cancelled: { icon: <XCircle className="h-4 w-4" />, color: 'bg-gray-100 text-gray-800' }
    };
    return config[status] || config.pending;
  };

  const exportToCSV = () => {
    const headers = ['Medicine Name', 'Manufacturer', 'Dosage', 'Quantity', 'User', 'Email', 'Phone', 'Status', 'Requested Date'];
    const rows = requests.map(r => [
      r.medicineName,
      r.manufacturer || '',
      r.dosage || '',
      r.quantity,
      r.user?.name || '',
      r.user?.email || '',
      r.phone || '', // Added phone to CSV export
      r.status,
      new Date(r.createdAt).toLocaleDateString()
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medicine-requests-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Medicine Requests</h1>
          <div className="flex gap-4 mt-2 text-sm">
            <span className="text-yellow-600 font-semibold">{stats.pending} pending</span>
            <span className="text-gray-600">{stats.total} total</span>
            <span className="text-blue-600">{stats.recent} this week</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by medicine name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'pending', 'approved', 'rejected', 'available'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedRequests.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-3">
            <span className="text-sm text-gray-600">{selectedRequests.length} selected</span>
            <button
              onClick={() => handleBulkUpdate('approved')}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
            >
              Approve Selected
            </button>
            <button
              onClick={() => handleBulkUpdate('rejected')}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
            >
              Reject Selected
            </button>
            <button
              onClick={() => setSelectedRequests([])}
              className="px-3 py-1.5 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <Pill className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No requests found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">
                    <button onClick={handleSelectAll} className="text-gray-500">
                      {selectAll ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Medicine</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">User Details</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Contact Info</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Details</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Requested</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {requests.map((req) => {
                  const status = getStatusBadge(req.status);
                  return (
                    <tr key={req._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <button onClick={() => handleSelectRequest(req._id)} className="text-gray-500">
                          {selectedRequests.includes(req._id) ? (
                            <CheckSquare className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Square className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{req.medicineName}</div>
                        {req.manufacturer && (
                          <div className="text-xs text-gray-500">{req.manufacturer}</div>
                        )}
                        {req.dosage && (
                          <div className="text-xs text-gray-400 mt-1">Dosage: {req.dosage}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{req.user?.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-600">{req.user?.email}</span>
                          </div>
                          {/* NEW: Display phone number */}
                          {req.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-600">{req.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <span className="text-gray-600">Qty: {req.quantity}</span>
                          {req.prescriptionRequired && (
                            <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                              Rx
                            </span>
                          )}
                          {req.purpose && (
                            <div className="mt-1 text-xs text-gray-500 bg-gray-50 p-1 rounded max-w-[200px] truncate" title={req.purpose}>
                              "{req.purpose.substring(0, 30)}..."
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium ${status.color}`}>
                          {status.icon}
                          {req.status}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openUpdateModal(req)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Update Request"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-600">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 border rounded-lg disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 border rounded-lg disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Update Modal */}
      {showModal && currentRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Update Request: {currentRequest.medicineName}
              </h2>

              {/* User Contact Info */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="font-medium text-gray-900 mb-2">User Contact</h3>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {currentRequest.user?.email}
                </p>
                {currentRequest.phone && (
                  <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4" />
                    {currentRequest.phone}
                  </p>
                )}
              </div>

              <form onSubmit={handleUpdateRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={modalData.status}
                    onChange={(e) => setModalData({ ...modalData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="available">Available</option>
                    <option value="ordered">Ordered</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes
                  </label>
                  <textarea
                    value={modalData.adminNotes}
                    onChange={(e) => setModalData({ ...modalData, adminNotes: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Add notes for the user..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Arrival Date
                  </label>
                  <input
                    type="date"
                    value={modalData.estimatedArrival}
                    onChange={(e) => setModalData({ ...modalData, estimatedArrival: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMedicineRequests;