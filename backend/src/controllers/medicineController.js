// src/controllers/medicineController.js
import Medicine from "../models/Medicine.js";

export const getMedicines = async (req, res) => {
  try {
    const { search, category } = req.query;

    // Pagination params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    if (category) {
      query.category = category;
    }

    // Run count and data fetch in parallel for performance
    const [total, medicines] = await Promise.all([
      Medicine.countDocuments(query),
      Medicine.find(query).skip(skip).limit(limit)
    ]);

    res.json({
      medicines,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    });
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
    const med = await Medicine.findById(req.params.id);
    if (!med) return res.status(404).json({ message: "Medicine not found" });
    res.json(med);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch medicine", error: error.message });
  }
};

export const createMedicine = async (req, res) => {
  try {
    const med = await Medicine.create(req.body);
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
    res.json(med);
  } catch (error) {
    res.status(500).json({ message: "Failed to update medicine", error: error.message });
  }
};

export const deleteMedicine = async (req, res) => {
  try {
    const med = await Medicine.findByIdAndDelete(req.params.id);
    if (!med) return res.status(404).json({ message: "Medicine not found" });
    res.json({ message: "Medicine deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete medicine", error: error.message });
  }
};
