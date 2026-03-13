// src/controllers/medicineController.js
import Medicine from "../models/Medicine.js";
import { cacheGet, cacheSet, cacheDel, cacheDelPattern } from "../utils/cache.js";
import logger from "../utils/logger.js";

// Cache TTLs (seconds)
const LIST_TTL = 300;   // 5 min for list/search results
const SINGLE_TTL = 600; // 10 min for individual medicines

export const getMedicines = async (req, res) => {
  try {
    const { search, category } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build a deterministic cache key from query params
    const cacheKey = `medicines:list:${search || ""}:${category || ""}:${page}:${limit}`;

    // Try cache first
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const query = {};
    if (search) query.name = { $regex: search, $options: "i" };
    if (category) query.category = category;

    const [total, medicines] = await Promise.all([
      Medicine.countDocuments(query),
      Medicine.find(query).skip(skip).limit(limit)
    ]);

    const result = {
      medicines,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    };

    // Cache the result
    await cacheSet(cacheKey, result, LIST_TTL);

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch medicines", error: error.message });
  }
};

export const getSuggestions = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);

    const suggestions = await Medicine.find({
      name: { $regex: q, $options: "i" },
      stock: { $gt: 0 }
    })
      .select("_id name category price")
      .limit(6);

    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch suggestions" });
  }
};

export const getMedicineById = async (req, res) => {
  try {
    const cacheKey = `medicines:id:${req.params.id}`;

    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const med = await Medicine.findById(req.params.id);
    if (!med) return res.status(404).json({ message: "Medicine not found" });

    await cacheSet(cacheKey, med, SINGLE_TTL);

    res.json(med);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch medicine", error: error.message });
  }
};

export const createMedicine = async (req, res) => {
  try {
    const med = await Medicine.create(req.body);

    // Invalidate list caches since a new medicine was added
    await cacheDelPattern("medicines:list:*");

    res.status(201).json(med);
  } catch (error) {
    res.status(500).json({ message: "Failed to create medicine", error: error.message });
  }
};

export const updateMedicine = async (req, res) => {
  try {
    const med = await Medicine.findByIdAndUpdate(req.params.id, req.body, {
      new: true
    });
    if (!med) return res.status(404).json({ message: "Medicine not found" });

    // Invalidate this medicine's cache + all list caches
    await cacheDel(`medicines:id:${req.params.id}`);
    await cacheDelPattern("medicines:list:*");

    res.json(med);
  } catch (error) {
    res.status(500).json({ message: "Failed to update medicine", error: error.message });
  }
};

export const deleteMedicine = async (req, res) => {
  try {
    const med = await Medicine.findByIdAndDelete(req.params.id);
    if (!med) return res.status(404).json({ message: "Medicine not found" });

    // Invalidate both individual and list caches
    await cacheDel(`medicines:id:${req.params.id}`);
    await cacheDelPattern("medicines:list:*");

    res.json({ message: "Medicine deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete medicine", error: error.message });
  }
};
