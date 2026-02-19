import MedicineRequest from "../models/MedicineRequest.js";
import Medicine from "../models/Medicine.js";
import { sendRequestStatusEmail, notifyAdminNewRequest } from "../services/emailService.js";

// =====================================================
// USER: Create a medicine request
// =====================================================
export const createRequest = async (req, res) => {
  try {
    const { medicineName, manufacturer, dosage, quantity, purpose, prescriptionRequired } = req.body;

    if (!medicineName) {
      return res.status(400).json({ message: "Medicine name is required" });
    }

    // Check if medicine already exists in database
    const existingMedicine = await Medicine.findOne({ 
      name: { $regex: new RegExp(medicineName, 'i') } 
    });

    const request = await MedicineRequest.create({
      user: req.user._id,
      medicineName,
      manufacturer,
      dosage,
      quantity: quantity || 1,
      purpose,
      prescriptionRequired: prescriptionRequired || false,
      status: "pending"
    });

    // Populate user details
    await request.populate("user", "name email phone");

    // Notify admins (fire and forget)
    notifyAdminNewRequest(request).catch(err => 
      console.error("Failed to notify admins:", err)
    );

    res.status(201).json({
      success: true,
      message: "Medicine request submitted successfully",
      request,
      existingMedicine: existingMedicine ? {
        _id: existingMedicine._id,
        name: existingMedicine.name,
        price: existingMedicine.price,
        inStock: existingMedicine.stock > 0
      } : null
    });
  } catch (error) {
    console.error("Create request error:", error);
    res.status(500).json({ message: "Failed to create request", error: error.message });
  }
};

// =====================================================
// USER: Get my requests
// =====================================================
export const getMyRequests = async (req, res) => {
  try {
    const requests = await MedicineRequest.find({ user: req.user._id })
      .populate("alternativeOffered", "name price imageUrl")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    console.error("Fetch requests error:", error);
    res.status(500).json({ message: "Failed to fetch requests" });
  }
};

// =====================================================
// USER: Cancel request
// =====================================================
export const cancelRequest = async (req, res) => {
  try {
    const request = await MedicineRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Check ownership
    if (request.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Only allow cancellation of pending requests
    if (request.status !== "pending") {
      return res.status(400).json({ 
        message: `Cannot cancel request with status: ${request.status}` 
      });
    }

    request.status = "cancelled";
    await request.save();

    res.json({
      success: true,
      message: "Request cancelled successfully"
    });
  } catch (error) {
    console.error("Cancel request error:", error);
    res.status(500).json({ message: "Failed to cancel request" });
  }
};

// =====================================================
// ADMIN: Get all requests
// =====================================================
export const getAllRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status) query.status = status;

    const [total, requests] = await Promise.all([
      MedicineRequest.countDocuments(query),
      MedicineRequest.find(query)
        .populate("user", "name email phone")
        .populate("alternativeOffered", "name price stock")
        .populate("reviewedBy", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
    ]);

    res.json({
      success: true,
      requests,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Fetch all requests error:", error);
    res.status(500).json({ message: "Failed to fetch requests" });
  }
};

// =====================================================
// ADMIN: Update request status
// =====================================================
export const updateRequestStatus = async (req, res) => {
  try {
    const { status, adminNotes, estimatedArrival, alternativeMedicineId } = req.body;
    const validStatuses = ["pending", "approved", "rejected", "available", "ordered"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const request = await MedicineRequest.findById(req.params.id)
      .populate("user", "name email phone");

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // If offering alternative medicine
    let alternativeOffered = request.alternativeOffered;
    if (alternativeMedicineId) {
      const medicine = await Medicine.findById(alternativeMedicineId);
      if (medicine) {
        alternativeOffered = medicine._id;
      }
    }

    request.status = status;
    request.adminNotes = adminNotes || request.adminNotes;
    request.estimatedArrival = estimatedArrival || request.estimatedArrival;
    request.alternativeOffered = alternativeOffered;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();

    await request.save();

    // Send email notification to user
    if (request.user?.email) {
      sendRequestStatusEmail(
        request.user.email,
        request.user.name,
        request.medicineName,
        status,
        adminNotes
      ).catch(err => console.error("Status email failed:", err));
    }

    res.json({
      success: true,
      message: `Request ${status}`,
      request
    });
  } catch (error) {
    console.error("Update request error:", error);
    res.status(500).json({ message: "Failed to update request" });
  }
};

// =====================================================
// ADMIN: Get request statistics
// =====================================================
export const getRequestStats = async (req, res) => {
  try {
    const stats = await MedicineRequest.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const total = await MedicineRequest.countDocuments();
    const pending = await MedicineRequest.countDocuments({ status: "pending" });
    const recent = await MedicineRequest.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    const statsObj = {};
    stats.forEach(s => statsObj[s._id] = s.count);

    res.json({
      success: true,
      stats: statsObj,
      total,
      pending,
      recent
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ message: "Failed to get stats" });
  }
};

// =====================================================
// ADMIN: Bulk update requests
// =====================================================
export const bulkUpdateRequests = async (req, res) => {
  try {
    const { ids, status, adminNotes } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No request IDs provided" });
    }

    const result = await MedicineRequest.updateMany(
      { _id: { $in: ids } },
      {
        status,
        adminNotes,
        reviewedBy: req.user._id,
        reviewedAt: new Date()
      }
    );

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} requests`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error("Bulk update error:", error);
    res.status(500).json({ message: "Failed to bulk update requests" });
  }
};