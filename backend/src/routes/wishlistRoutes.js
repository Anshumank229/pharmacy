import express from "express";
import { getWishlist, toggleWishlist } from "../controllers/wishlistController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getWishlist);
router.post("/:medicineId", protect, toggleWishlist);

export default router;
