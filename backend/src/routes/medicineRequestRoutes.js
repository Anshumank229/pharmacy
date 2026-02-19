import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createRequest,
  getMyRequests,
  cancelRequest
} from "../controllers/medicineRequestController.js";

const router = express.Router();

// User routes
router.post("/", protect, createRequest);
router.get("/my-requests", protect, getMyRequests);
router.put("/:id/cancel", protect, cancelRequest);

export default router;