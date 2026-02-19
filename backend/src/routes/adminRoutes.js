import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
    getAdminStats,
    getAllUsers,
    getAllOrdersAdmin,
    getLowStockMedicines,
    createUserByAdmin,
    updateUserByAdmin,
    deleteUserByAdmin
} from "../controllers/adminController.js";

// Import medicine request controllers
import {
    getAllRequests,
    updateRequestStatus,
    getRequestStats,
    bulkUpdateRequests
} from "../controllers/medicineRequestController.js";

const router = express.Router();

// =====================================================
// ADMIN DASHBOARD ROUTES
// =====================================================
router.get("/stats", protect, adminOnly, getAdminStats);
router.get("/users", protect, adminOnly, getAllUsers);
router.get("/orders", protect, adminOnly, getAllOrdersAdmin);
router.get("/low-stock", protect, adminOnly, getLowStockMedicines);

// =====================================================
// ADMIN USER MANAGEMENT ROUTES
// =====================================================
router.post("/users", protect, adminOnly, createUserByAdmin);
router.put("/users/:id", protect, adminOnly, updateUserByAdmin);
router.delete("/users/:id", protect, adminOnly, deleteUserByAdmin);

// =====================================================
// ADMIN MEDICINE REQUEST ROUTES
// =====================================================
// Get all medicine requests (with pagination and filtering)
router.get("/medicine-requests", protect, adminOnly, getAllRequests);

// Get medicine request statistics
router.get("/medicine-requests/stats", protect, adminOnly, getRequestStats);

// Update single request status
router.put("/medicine-requests/:id", protect, adminOnly, updateRequestStatus);

// Bulk update multiple requests (e.g., mark multiple as approved)
router.post("/medicine-requests/bulk-update", protect, adminOnly, bulkUpdateRequests);

export default router;