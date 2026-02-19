// src/routes/medicineRoutes.js
import express from "express";
import { body } from "express-validator";
import {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  getSuggestions
} from "../controllers/medicineController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import reviewRoutes from "./reviewRoutes.js"; // Import review routes

const router = express.Router();

// Validation rules for medicine create/update
const medicineValidation = [
  body("name").notEmpty().withMessage("Medicine name is required"),
  body("price").isFloat({ min: 0 }).withMessage("Price must be a non-negative number"),
  body("stock").isInt({ min: 0 }).withMessage("Stock must be a non-negative integer"),
  body("category").notEmpty().withMessage("Category is required"),
];

// Public routes
router.get("/", getMedicines);
router.get("/suggestions", getSuggestions);
router.get("/:id", getMedicineById);

// =====================================================
// FIX: Mount review routes for medicine-specific reviews
// This enables routes like:
// GET /api/medicines/:id/reviews
// POST /api/medicines/:id/reviews
// =====================================================
router.use("/:id/reviews", reviewRoutes);

// Admin only routes — with validation
router.post("/", protect, adminOnly, medicineValidation, validate, createMedicine);
router.put("/:id", protect, adminOnly, medicineValidation, validate, updateMedicine);
router.delete("/:id", protect, adminOnly, deleteMedicine);

export default router;