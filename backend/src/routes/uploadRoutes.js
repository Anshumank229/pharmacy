// src/routes/uploadRoutes.js
import express from "express";
import { uploadGeneral, uploadPrescription, handleMulterError } from "../middleware/upload.js";
import { uploadFile, uploadPrescriptionFile } from "../controllers/uploadController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

// ========================
// PUBLIC UPLOADS (Medicine Images, etc.)
// ========================

// POST /api/upload — Generic file upload for medicine images (authenticated users only)
// Uses uploadGeneral middleware that stores in uploads/medicines/
router.post(
  "/", 
  protect, 
  uploadGeneral.single("file"), 
  handleMulterError,  // Add error handling
  uploadFile
);

// ========================
// PRESCRIPTION UPLOADS (Private)
// ========================

// POST /api/upload/prescription — Upload prescription (authenticated users only)
// Uses uploadPrescription middleware that stores in uploads/prescriptions/ (private)
router.post(
  "/prescription", 
  protect, 
  uploadPrescription.single("file"), 
  handleMulterError,  // Add error handling
  uploadPrescriptionFile
);

// ========================
// ADMIN UPLOADS
// ========================

// POST /api/upload/admin/medicine — Admin upload medicine image (admin only)
router.post(
  "/admin/medicine", 
  protect, 
  adminOnly, 
  uploadGeneral.single("file"), 
  handleMulterError,  // Add error handling
  uploadFile
);

// POST /api/upload/admin/bulk — Admin bulk upload (e.g., CSV for medicines)
router.post(
  "/admin/bulk", 
  protect, 
  adminOnly, 
  uploadGeneral.single("file"), 
  handleMulterError,  // Add error handling
  async (req, res) => {
    try {
      // Handle bulk upload logic here
      res.json({ 
        message: "File uploaded successfully for bulk processing",
        file: req.file 
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;