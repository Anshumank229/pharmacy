import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { uploadPrescription, handleMulterError } from "../middleware/upload.js";
import {
  uploadPrescription as uploadPrescriptionController,
  getUserPrescriptions,
  getPendingPrescriptions,
  getAllPrescriptions,
  updatePrescriptionStatus,
  deletePrescription,
  getPrescriptionFile
} from "../controllers/prescriptionController.js";

const router = express.Router();

// =====================================================
// ALL AUTHENTICATED USER ROUTES
// =====================================================
// Apply protect middleware to all routes below
router.use(protect);

// =====================================================
// USER ROUTES
// =====================================================
// Upload prescription (requires file upload)
// FIX: Use uploadPrescription middleware with proper error handling
router.post(
  "/", 
  uploadPrescription.single("file"), 
  handleMulterError, 
  uploadPrescriptionController
);

// Get logged-in user's prescriptions
router.get("/my-prescriptions", getUserPrescriptions);

// Get specific prescription file (protected download)
// FIX: Add route to securely access prescription files
router.get("/:id/file", getPrescriptionFile);

// Delete user's own prescription
// FIX: Add missing DELETE endpoint
router.delete("/:id", deletePrescription);

// =====================================================
// ADMIN ROUTES
// =====================================================
// Get all pending prescriptions (admin only)
router.get("/pending", adminOnly, getPendingPrescriptions);

// Get all prescriptions — all statuses (admin only, for history tab)
router.get("/all", adminOnly, getAllPrescriptions);

// Update prescription status (admin only)
router.put("/:id", adminOnly, updatePrescriptionStatus);

// Admin delete any prescription
router.delete("/:id/admin", adminOnly, deletePrescription);

export default router;