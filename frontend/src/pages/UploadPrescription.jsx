import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosClient';
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  File,
  X,
  AlertCircle,
  Clock,
  Eye,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

const UploadPrescription = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedPrescriptions, setUploadedPrescriptions] = useState([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoadingPrescriptions(true);
      const res = await api.get('/prescriptions/my-prescriptions');
      
      // FIX: Handle different response structures
      let prescriptions = [];
      if (Array.isArray(res.data)) {
        prescriptions = res.data;
      } else if (res.data?.prescriptions && Array.isArray(res.data.prescriptions)) {
        prescriptions = res.data.prescriptions;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        prescriptions = res.data.data;
      }
      
      setUploadedPrescriptions(prescriptions);
    } catch (error) {
      console.error('Fetch prescriptions error:', error);
      toast.error('Failed to load prescriptions');
      setUploadedPrescriptions([]); // Always set to array on error
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (!selectedFile) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error('Please upload an image (JPG, PNG, GIF) or PDF file');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (selectedFile.size > maxSize) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setFile(selectedFile);

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null); // PDF - no preview
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];

    if (droppedFile) {
      // Simulate file input change
      const fakeEvent = {
        target: {
          files: [droppedFile]
        }
      };
      handleFileChange(fakeEvent);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      // FIX: Use 'file' field name to match backend
      formData.append('file', file);

      const res = await api.post('/prescriptions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Prescription uploaded successfully!');
      clearFile();
      fetchPrescriptions(); // Refresh list
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload prescription. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const deletePrescription = async (id) => {
    if (!window.confirm('Are you sure you want to delete this prescription?')) {
      return;
    }

    try {
      await api.delete(`/prescriptions/${id}`);
      toast.success('Prescription deleted');
      fetchPrescriptions();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete prescription');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        icon: <Clock className="h-4 w-4" />,
        color: 'bg-yellow-100 text-yellow-800',
        label: 'Pending Review'
      },
      approved: {
        icon: <CheckCircle className="h-4 w-4" />,
        color: 'bg-green-100 text-green-800',
        label: 'Approved'
      },
      rejected: {
        icon: <XCircle className="h-4 w-4" />,
        color: 'bg-red-100 text-red-800',
        label: 'Rejected'
      }
    };

    const statusKey = status?.toLowerCase?.() || 'pending';
    return statusConfig[statusKey] || statusConfig.pending;
  };

  // FIX: Safe image URL generation
  const getImageUrl = (prescription) => {
    if (!prescription?.imageUrl) return null;
    
    if (prescription.imageUrl.startsWith('http')) {
      return prescription.imageUrl;
    }
    
    // For local files, use the protected endpoint
    if (prescription.fileName) {
      return `/api/prescriptions/${prescription._id}/file`;
    }
    
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Prescription</h1>
          <p className="text-gray-600">
            Upload your prescription to order medicines that require a valid prescription
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">New Prescription</h2>

          <form onSubmit={handleUpload}>
            {/* Drag and Drop Area */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${file
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                }`}
            >
              {!file ? (
                <div>
                  <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    Drop your prescription here or click to browse
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Accepted formats: JPG, PNG, GIF, PDF (Max 5MB)
                  </p>
                  <label className="inline-block">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept="image/*,.pdf"
                      className="hidden"
                    />
                    <span className="cursor-pointer bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-block font-medium">
                      Choose File
                    </span>
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Preview */}
                  {preview ? (
                    <div className="max-w-md mx-auto">
                      <img
                        src={preview}
                        alt="Prescription preview"
                        className="rounded-lg border border-gray-300"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <File className="h-12 w-12 text-blue-600" />
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  )}

                  {/* File Info & Actions */}
                  <div className="flex items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={clearFile}
                      className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4" />
                      Remove
                    </button>
                    <label className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer">
                      <input
                        type="file"
                        onChange={handleFileChange}
                        accept="image/*,.pdf"
                        className="hidden"
                      />
                      <Upload className="h-4 w-4" />
                      Change File
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Upload Button */}
            {file && (
              <div className="mt-6">
                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      Upload Prescription
                    </>
                  )}
                </button>
              </div>
            )}
          </form>

          {/* Upload Guidelines */}
          <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-2">Upload Guidelines:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Prescription must be issued by a registered medical practitioner</li>
                  <li>Ensure the prescription is clear and readable</li>
                  <li>Include patient name, date, and doctor's signature</li>
                  <li>File size should not exceed 5MB</li>
                  <li>Accepted formats: JPG, PNG, GIF, PDF</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Uploaded Prescriptions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            My Prescriptions ({Array.isArray(uploadedPrescriptions) ? uploadedPrescriptions.length : 0})
          </h2>

          {loadingPrescriptions ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : !Array.isArray(uploadedPrescriptions) || uploadedPrescriptions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No prescriptions uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {uploadedPrescriptions.map((prescription) => {
                const status = getStatusBadge(prescription?.status);
                const imageUrl = getImageUrl(prescription);
                const isPdf = prescription?.imageUrl?.endsWith('.pdf') || prescription?.mimeType === 'application/pdf';

                return (
                  <div
                    key={prescription?._id || Math.random()}
                    className="border border-gray-200 rounded-xl overflow-hidden"
                  >
                    {/* Status Banner */}
                    {prescription?.status === 'approved' && (
                      <div className="bg-green-50 border-b border-green-200 px-4 py-3 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <div>
                          <p className="text-green-800 font-semibold text-sm">✓ Approved — You can now order your medicines</p>
                          {prescription?.notes && <p className="text-green-700 text-xs mt-0.5">Note: {prescription.notes}</p>}
                        </div>
                      </div>
                    )}
                    {prescription?.status === 'rejected' && (
                      <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex items-start gap-2">
                        <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-red-800 font-semibold text-sm">Prescription Not Approved</p>
                          {prescription?.notes && (
                            <p className="text-red-700 text-xs mt-1">
                              <span className="font-medium">Reason: </span>{prescription.notes}
                            </p>
                          )}
                          <p className="text-red-600 text-xs mt-1">Please upload a clearer prescription or contact support.</p>
                        </div>
                      </div>
                    )}

                    <div className="p-4 flex items-start gap-4">
                      {/* Thumbnail */}
                      <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {imageUrl && !isPdf ? (
                          <img
                            src={imageUrl}
                            alt="Prescription"
                            className="w-full h-full object-cover"
                            onError={e => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <File className="h-10 w-10 text-gray-400" />
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <p className="font-medium text-gray-900">
                              Prescription #{prescription?._id?.slice(-6) || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-600">
                              Uploaded: {prescription?.createdAt ? new Date(prescription.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              }) : 'N/A'}
                            </p>
                          </div>
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${status.color}`}>
                            {status.icon}
                            <span className="text-sm font-medium">{status.label}</span>
                          </div>
                        </div>

                        {/* Status Timeline */}
                        <div className="flex items-center gap-1 mt-3 mb-3">
                          {[
                            { key: 'uploaded', label: 'Uploaded', done: true },
                            { key: 'review', label: 'Under Review', done: true },
                            { key: 'decision', label: prescription?.status === 'approved' ? 'Approved' : prescription?.status === 'rejected' ? 'Rejected' : 'Pending', done: prescription?.status !== 'pending' },
                          ].map((step, i, arr) => (
                            <div key={step.key} className="flex items-center">
                              <div className={`flex flex-col items-center`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step.done
                                    ? prescription?.status === 'rejected' && i === arr.length - 1
                                      ? 'bg-red-500 text-white'
                                      : 'bg-green-500 text-white'
                                    : 'bg-gray-200 text-gray-500'
                                  }`}>
                                  {step.done ? '✓' : i + 1}
                                </div>
                                <span className="text-xs text-gray-500 mt-1 whitespace-nowrap">{step.label}</span>
                              </div>
                              {i < arr.length - 1 && (
                                <div className={`h-0.5 w-8 mx-1 mb-4 ${step.done ? 'bg-green-400' : 'bg-gray-200'}`} />
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                          {imageUrl && (
                            <a
                              href={imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </a>
                          )}
                          <button
                            onClick={() => deletePrescription(prescription?._id)}
                            className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-gray-100 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
          <p className="text-sm text-gray-700 mb-3">
            If you have questions about uploading prescriptions or need assistance, our support team is here to help.
          </p>
          <button
            onClick={() => navigate('/support')}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Contact Support →
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadPrescription;