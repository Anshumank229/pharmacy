import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosClient';
import {
  Pill,
  Send,
  AlertCircle,
  Package,
  Weight,
  FileText,
  Phone
} from 'lucide-react';
import toast from 'react-hot-toast';

const RequestMedicine = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    medicineName: '',
    manufacturer: '',
    dosage: '',
    quantity: 1,
    purpose: '',
    prescriptionRequired: false,
    phone: '' // NEW: Add phone field
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!formData.medicineName.trim()) {
      e.medicineName = 'Medicine name is required';
    }
    if (formData.quantity < 1) {
      e.quantity = 'Quantity must be at least 1';
    }
    // NEW: Validate phone number
    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) {
      e.phone = 'Please enter a valid 10-digit mobile number';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await api.post('/medicine-requests', formData);
      toast.success('Request submitted successfully!');
      
      if (res.data.existingMedicine) {
        toast((t) => (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <span>This medicine might be available as "{res.data.existingMedicine.name}"</span>
          </div>
        ), { duration: 5000 });
      }
      
      navigate('/my-requests');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Request Medicine</h1>
          <p className="text-gray-600">
            Can't find what you're looking for? Let us know and we'll try to source it for you.
          </p>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Medicine Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Pill className="inline h-4 w-4 mr-1" />
                Medicine Name *
              </label>
              <input
                type="text"
                name="medicineName"
                value={formData.medicineName}
                onChange={handleChange}
                placeholder="e.g., Paracetamol 500mg"
                className={`w-full px-4 py-2.5 border ${
                  errors.medicineName ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-blue-500`}
              />
              {errors.medicineName && (
                <p className="text-red-500 text-xs mt-1">{errors.medicineName}</p>
              )}
            </div>

            {/* Manufacturer & Dosage */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Manufacturer (Optional)
                </label>
                <input
                  type="text"
                  name="manufacturer"
                  value={formData.manufacturer}
                  onChange={handleChange}
                  placeholder="e.g., Cipla, Sun Pharma"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Weight className="inline h-4 w-4 mr-1" />
                  Dosage (Optional)
                </label>
                <input
                  type="text"
                  name="dosage"
                  value={formData.dosage}
                  onChange={handleChange}
                  placeholder="e.g., 500mg, 10ml"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Quantity and Phone - Two columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Quantity */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Package className="inline h-4 w-4 mr-1" />
                  Quantity Required
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  min="1"
                  className={`w-full px-4 py-2.5 border ${
                    errors.quantity ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-blue-500`}
                />
                {errors.quantity && (
                  <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>
                )}
              </div>

              {/* NEW: Phone Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Phone className="inline h-4 w-4 mr-1" />
                  Mobile Number (Optional)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  maxLength="10"
                  className={`w-full px-4 py-2.5 border ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-blue-500`}
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  We'll notify you via SMS when status updates
                </p>
              </div>
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <FileText className="inline h-4 w-4 mr-1" />
                Purpose / Notes (Optional)
              </label>
              <textarea
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                rows="3"
                placeholder="Tell us why you need this medicine or any specific requirements..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Prescription Required */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="prescriptionRequired"
                id="prescriptionRequired"
                checked={formData.prescriptionRequired}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="prescriptionRequired" className="text-sm text-gray-700">
                This medicine requires a prescription
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Submit Request
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">What happens next?</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Our team will review your request within 24-48 hours</li>
                <li>We'll check with our suppliers for availability</li>
                <li>You'll receive an email/SMS notification when status changes</li>
                <li>Once approved, you can order the medicine directly</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestMedicine;