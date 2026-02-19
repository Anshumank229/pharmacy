import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosClient';
import {
  Clock,
  CheckCircle,
  XCircle,
  Package,
  Eye,
  AlertCircle,
  Send,
  Calendar,
  FileText,
  Pill,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/medicine-requests/my-requests');
      setRequests(res.data.requests || []);
    } catch (error) {
      console.error('Fetch requests error:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const cancelRequest = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this request?')) {
      return;
    }

    try {
      await api.put(`/medicine-requests/${id}/cancel`);
      toast.success('Request cancelled');
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel request');
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: {
        icon: <Clock className="h-4 w-4" />,
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        label: 'Pending Review'
      },
      approved: {
        icon: <CheckCircle className="h-4 w-4" />,
        color: 'bg-green-100 text-green-800 border-green-200',
        label: 'Approved'
      },
      rejected: {
        icon: <XCircle className="h-4 w-4" />,
        color: 'bg-red-100 text-red-800 border-red-200',
        label: 'Rejected'
      },
      available: {
        icon: <Package className="h-4 w-4" />,
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        label: 'Available'
      },
      ordered: {
        icon: <CheckCircle className="h-4 w-4" />,
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        label: 'Ordered'
      },
      cancelled: {
        icon: <XCircle className="h-4 w-4" />,
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        label: 'Cancelled'
      }
    };
    return config[status] || config.pending;
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Medicine Requests</h1>
            <p className="text-gray-600">
              Track the status of your medicine requests
            </p>
          </div>
          <button
            onClick={() => navigate('/request-medicine')}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            <Send className="h-5 w-5" />
            New Request
          </button>
        </div>

        {requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Pill className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No requests yet</h3>
            <p className="text-gray-500 mb-6">
              Haven't found a medicine? Request it and we'll try to source it for you.
            </p>
            <button
              onClick={() => navigate('/request-medicine')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Send className="h-4 w-4" />
              Request Medicine
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => {
              const status = getStatusBadge(req.status);
              
              return (
                <div
                  key={req._id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Status Banner */}
                  <div className={`px-4 py-2 border-b flex items-center justify-between ${status.color}`}>
                    <div className="flex items-center gap-2">
                      {status.icon}
                      <span className="font-medium text-sm">{status.label}</span>
                    </div>
                    <span className="text-xs">
                      Requested on {new Date(req.createdAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>

                  {/* Main Content */}
                  <div className="p-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      {/* Medicine Details */}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {req.medicineName}
                        </h3>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          {req.manufacturer && (
                            <div>
                              <p className="text-gray-500">Manufacturer</p>
                              <p className="font-medium text-gray-900">{req.manufacturer}</p>
                            </div>
                          )}
                          {req.dosage && (
                            <div>
                              <p className="text-gray-500">Dosage</p>
                              <p className="font-medium text-gray-900">{req.dosage}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-gray-500">Quantity</p>
                            <p className="font-medium text-gray-900">{req.quantity}</p>
                          </div>
                          {req.prescriptionRequired && (
                            <div>
                              <p className="text-gray-500">Prescription</p>
                              <p className="font-medium text-amber-600">Required</p>
                            </div>
                          )}
                        </div>

                        {req.purpose && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Purpose:</span> {req.purpose}
                            </p>
                          </div>
                        )}

                        {req.adminNotes && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="text-sm text-blue-800">
                              <span className="font-medium">Admin Response:</span> {req.adminNotes}
                            </p>
                          </div>
                        )}

                        {req.estimatedArrival && (
                          <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
                            <Calendar className="h-4 w-4" />
                            <span>Estimated arrival: {new Date(req.estimatedArrival).toLocaleDateString('en-IN')}</span>
                          </div>
                        )}

                        {req.alternativeOffered && (
                          <div className="mt-3 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-blue-600">
                              Alternative medicine offered: <button 
                                onClick={() => navigate(`/product/${req.alternativeOffered._id}`)}
                                className="font-semibold hover:underline"
                              >
                                {req.alternativeOffered.name}
                              </button>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex md:flex-col gap-2">
                        {req.status === 'pending' && (
                          <button
                            onClick={() => cancelRequest(req._id)}
                            className="flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                          >
                            <XCircle className="h-4 w-4" />
                            Cancel
                          </button>
                        )}
                        {req.status === 'approved' && (
                          <button
                            onClick={() => navigate('/shop')}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <Package className="h-4 w-4" />
                            Shop Now
                          </button>
                        )}
                        {req.status === 'available' && req.alternativeOffered && (
                          <button
                            onClick={() => navigate(`/product/${req.alternativeOffered._id}`)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                            View Medicine
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRequests;