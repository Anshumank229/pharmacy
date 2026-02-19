import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
    createTicket,
    getMyTickets,
    getAllTickets,
    replyToTicket,
    closeTicket,
    getOpenTicketCount
} from "../controllers/supportController.js";

const router = express.Router();

// User routes
router.post("/", protect, createTicket);
router.get("/my", protect, getMyTickets);

// Admin routes
router.get("/admin", protect, adminOnly, getAllTickets);
router.get("/admin/count", protect, adminOnly, getOpenTicketCount);
router.put("/:id/reply", protect, adminOnly, replyToTicket);
router.put("/:id/close", protect, adminOnly, closeTicket);

export default router;
