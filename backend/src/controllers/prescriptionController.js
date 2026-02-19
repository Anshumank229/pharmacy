import Prescription from "../models/Prescription.js";
import { sendPrescriptionStatus, sendPrescriptionStatusEmail } from "../services/emailService.js";
import { isCloudinaryConfigured, uploadToCloudinary } from "../services/cloudinaryService.js";
import fs from "fs";
import path from "path";

// USER: Upload Prescription
export const uploadPrescription = async (req, res) => {
  try {
    console.log("Upload Prescription - User:", req.user._id);

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    let imageUrl;
    let cloudinaryPublicId = null;
    let fileName = req.file.filename;

    if (isCloudinaryConfigured() && req.file.buffer) {
      // ── Cloudinary path ──────────────────────────────────────────────────────
      console.log("☁️ Uploading prescription to Cloudinary...");
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: "medstore/prescriptions",
        resource_type: "auto", // handles both images and PDFs
      });
      imageUrl = result.secure_url;
      cloudinaryPublicId = result.public_id;
      console.log("✅ Prescription uploaded to Cloudinary:", imageUrl);
    } else {
      // ── Local disk fallback ──────────────────────────────────────────────────
      // FIX: Don't expose local path directly, will be served via protected route
      imageUrl = null; // Don't store public URL for local files
      fileName = req.file.filename;
      console.log("📁 Prescription saved locally:", fileName);
    }

    // FIX: Include fileName and other fields
    const pres = await Prescription.create({
      user: req.user._id,
      imageUrl, // Will be null for local files
      cloudinaryPublicId,
      fileName: fileName,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      status: "pending",
      uploadedAt: new Date()
    });

    console.log("Prescription record created:", pres._id);
    
    // FIX: Don't return imageUrl for local files (security)
    res.status(201).json({
      success: true,
      message: "Prescription uploaded successfully",
      prescription: {
        _id: pres._id,
        status: pres.status,
        originalName: pres.originalName,
        uploadedAt: pres.uploadedAt,
        // Only return imageUrl if it's from Cloudinary
        ...(pres.imageUrl && { imageUrl: pres.imageUrl })
      }
    });
  } catch (error) {
    console.error("Upload failed:", error.message);
    
    // FIX: Clean up file if database creation failed
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log("🧹 Cleaned up orphaned file:", req.file.path);
      } catch (unlinkError) {
        console.error("Failed to clean up file:", unlinkError.message);
      }
    }
    
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
};

// USER: Get My Prescriptions
export const getUserPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('-__v'); // Exclude version field
    
    // FIX: Don't expose local file paths
    const sanitizedPrescriptions = prescriptions.map(p => {
      const pres = p.toObject();
      // Only include imageUrl if it's from Cloudinary (starts with http)
      if (pres.imageUrl && !pres.imageUrl.startsWith('http')) {
        delete pres.imageUrl;
      }
      return pres;
    });
    
    res.json({
      success: true,
      count: sanitizedPrescriptions.length,
      prescriptions: sanitizedPrescriptions
    });
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({ message: "Failed to fetch prescriptions", error: error.message });
  }
};

// ADMIN: Get Pending Prescriptions — with pagination
export const getPendingPrescriptions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [total, prescriptions] = await Promise.all([
      Prescription.countDocuments({ status: "pending" }),
      Prescription.find({ status: "pending" })
        .populate("user", "name email phone")
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit),
    ]);

    res.json({ 
      success: true,
      prescriptions, 
      page, 
      limit, 
      total, 
      pages: Math.ceil(total / limit) 
    });
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({ message: "Failed to fetch pending prescriptions", error: error.message });
  }
};

// ADMIN: Get All Prescriptions (all statuses) — for history tab
export const getAllPrescriptions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const { status } = req.query;
    
    const query = {};
    if (status) query.status = status;

    const [total, prescriptions] = await Promise.all([
      Prescription.countDocuments(query),
      Prescription.find(query)
        .populate("user", "name email phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    res.json({ 
      success: true,
      prescriptions, 
      page, 
      limit, 
      total, 
      pages: Math.ceil(total / limit) 
    });
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({ message: "Failed to fetch prescriptions", error: error.message });
  }
};

// ADMIN: Update Prescription Status
export const updatePrescriptionStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const validStatuses = ["pending", "approved", "rejected"];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      { 
        status, 
        adminNotes: notes,
        reviewedAt: new Date(),
        reviewedBy: req.user._id
      },
      { new: true }
    ).populate("user", "name email");

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    // Send email notification (fire-and-forget)
    if (prescription.user?.email) {
      sendPrescriptionStatusEmail(
        prescription.user.email,
        prescription.user.name || "Customer",
        status,
        notes || ""
      ).catch(err => console.error("Prescription status email failed:", err.message));
    }

    res.json({
      success: true,
      message: `Prescription ${status}`,
      prescription
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: "Failed to update prescription status", error: error.message });
  }
};

// =====================================================
// NEW FUNCTIONS FOR DELETE AND FILE ACCESS
// =====================================================

// USER/ADMIN: Delete Prescription
export const deletePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    
    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    // Check ownership (user can delete their own, admin can delete any)
    const isAdmin = req.user.isAdmin;
    const isOwner = prescription.user.toString() === req.user._id.toString();
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this prescription" });
    }

    // Delete from Cloudinary if configured
    if (prescription.cloudinaryPublicId && isCloudinaryConfigured()) {
      try {
        const cloudinary = (await import('cloudinary')).v2;
        await cloudinary.uploader.destroy(prescription.cloudinaryPublicId);
        console.log("✅ Deleted from Cloudinary:", prescription.cloudinaryPublicId);
      } catch (cloudinaryError) {
        console.error("Failed to delete from Cloudinary:", cloudinaryError);
      }
    }

    // Delete local file if exists
    if (prescription.fileName) {
      const filePath = path.join(process.cwd(), "uploads", "prescriptions", prescription.fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("✅ Deleted local file:", filePath);
      }
    }

    await prescription.deleteOne();

    res.json({
      success: true,
      message: "Prescription deleted successfully"
    });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Failed to delete prescription", error: error.message });
  }
};

// USER/ADMIN: Get Prescription File (Protected Download)
export const getPrescriptionFile = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    
    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    // Check ownership
    const isAdmin = req.user.isAdmin;
    const isOwner = prescription.user.toString() === req.user._id.toString();
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to access this prescription" });
    }

    // If Cloudinary, redirect to signed URL
    if (prescription.cloudinaryPublicId && isCloudinaryConfigured()) {
      try {
        const cloudinary = (await import('cloudinary')).v2;
        // Generate a signed URL that expires in 1 hour
        const signedUrl = cloudinary.url(prescription.cloudinaryPublicId, {
          secure: true,
          sign_url: true,
          type: 'authenticated',
          expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour
        });
        return res.json({ 
          success: true, 
          url: signedUrl 
        });
      } catch (cloudinaryError) {
        console.error("Failed to generate signed URL:", cloudinaryError);
        return res.status(500).json({ message: "Failed to generate file URL" });
      }
    }

    // Serve local file
    if (!prescription.fileName) {
      return res.status(404).json({ message: "File not found" });
    }

    const filePath = path.join(process.cwd(), "uploads", "prescriptions", prescription.fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    // Set proper headers for file download
    res.setHeader('Content-Type', prescription.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${prescription.originalName}"`);
    
    res.sendFile(filePath);
  } catch (error) {
    console.error("File access error:", error);
    res.status(500).json({ message: "Failed to access file", error: error.message });
  }
};

// ADMIN: Bulk Delete Prescriptions
export const bulkDeletePrescriptions = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No prescription IDs provided" });
    }

    const prescriptions = await Prescription.find({ _id: { $in: ids } });
    let deletedCount = 0;
    let failedCount = 0;

    for (const prescription of prescriptions) {
      try {
        // Delete from Cloudinary
        if (prescription.cloudinaryPublicId && isCloudinaryConfigured()) {
          const cloudinary = (await import('cloudinary')).v2;
          await cloudinary.uploader.destroy(prescription.cloudinaryPublicId);
        }

        // Delete local file
        if (prescription.fileName) {
          const filePath = path.join(process.cwd(), "uploads", "prescriptions", prescription.fileName);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }

        await prescription.deleteOne();
        deletedCount++;
      } catch (err) {
        console.error(`Failed to delete prescription ${prescription._id}:`, err);
        failedCount++;
      }
    }

    res.json({
      success: true,
      message: `Deleted ${deletedCount} prescriptions${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
      deletedCount,
      failedCount
    });
  } catch (error) {
    console.error("Bulk delete error:", error);
    res.status(500).json({ message: "Failed to delete prescriptions", error: error.message });
  }
};