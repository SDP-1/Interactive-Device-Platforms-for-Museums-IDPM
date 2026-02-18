import express from "express";
import King from "../models/King.js";

const router = express.Router();

// Helper to generate king ID like KIN001
async function generateKingId() {
  const last = await King.findOne({})
    .sort({ created_at: -1 })
    .select("king_id");
  if (!last || !last.king_id) return "KIN001";
  const lastNumber = parseInt(last.king_id.replace(/[^0-9]/g, ""));
  const newNumber = lastNumber + 1;
  return `KIN${String(newNumber).padStart(3, "0")}`;
}

// Get all kings
router.get("/kings", async (req, res) => {
  try {
    const kings = await King.find().sort({ created_at: -1 });
    res.json({ success: true, data: kings, total: kings.length });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching kings",
      error: error.message,
    });
  }
});

// Get king by DB _id
router.get("/kings/:id", async (req, res) => {
  try {
    const king = await King.findById(req.params.id);
    if (!king)
      return res
        .status(404)
        .json({ success: false, message: "King not found" });
    res.json({ success: true, data: king });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching king",
      error: error.message,
    });
  }
});

// Get king by king_id
router.get("/kings/by-king-id/:king_id", async (req, res) => {
  try {
    const king = await King.findOne({ king_id: req.params.king_id });
    if (!king)
      return res
        .status(404)
        .json({ success: false, message: "King not found" });
    res.json({ success: true, data: king });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching king",
      error: error.message,
    });
  }
});

// Create king
router.post("/kings", async (req, res) => {
  try {
    const {
      name_en,
      name_si,
      imageUrls,
      capital_en,
      capital_si,
      biography_en,
      biography_si,
    } = req.body;

    // Require names and biographies; imageUrls and capitals are optional
    if (!name_en || !name_si || !biography_en || !biography_si) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Missing required fields: names and biographies are required",
        });
    }

    const king_id = await generateKingId();

    const DEFAULT_IMAGE = "https://i.redd.it/7anoyl7niksa1.jpg";

    // Normalize imageUrls to an array and apply default if empty
    let normalizedImages = [];
    if (Array.isArray(imageUrls)) normalizedImages = imageUrls.filter(Boolean);
    else if (typeof imageUrls === "string" && imageUrls.trim() !== "")
      normalizedImages = [imageUrls.trim()];

    if (normalizedImages.length === 0) normalizedImages = [DEFAULT_IMAGE];

    const king = new King({
      king_id,
      name_en,
      name_si,
      capital_en: capital_en || null,
      capital_si: capital_si || null,
      biography_en,
      biography_si,
      imageUrls: normalizedImages,
    });

    const saved = await king.save();
    res.status(201).json({
      success: true,
      message: "King created successfully",
      data: saved,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating king",
      error: error.message,
    });
  }
});

// Update king
router.put("/kings/:id", async (req, res) => {
  try {
    const {
      name_en,
      name_si,
      imageUrls,
      capital_en,
      capital_si,
      biography_en,
      biography_si,
    } = req.body;

    const DEFAULT_IMAGE = "https://i.redd.it/7anoyl7niksa1.jpg";

    // Normalize imageUrls only if provided in request
    let normalizedImages = undefined;
    if (typeof imageUrls !== "undefined") {
      if (Array.isArray(imageUrls))
        normalizedImages = imageUrls.filter(Boolean);
      else if (typeof imageUrls === "string" && imageUrls.trim() !== "")
        normalizedImages = [imageUrls.trim()];
      else normalizedImages = [];

      if (normalizedImages.length === 0) normalizedImages = [DEFAULT_IMAGE];
    }

    const updateData = {
      name_en: name_en || undefined,
      name_si: name_si || undefined,
      capital_en: capital_en || null,
      capital_si: capital_si || null,
      biography_en: biography_en || null,
      biography_si: biography_si || null,
      imageUrls:
        typeof normalizedImages !== "undefined" ? normalizedImages : undefined,
      updated_at: new Date(),
    };

    Object.keys(updateData).forEach(
      (k) => updateData[k] === undefined && delete updateData[k],
    );

    const king = await King.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!king)
      return res
        .status(404)
        .json({ success: false, message: "King not found" });
    res.json({
      success: true,
      message: "King updated successfully",
      data: king,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating king",
      error: error.message,
    });
  }
});

// Delete king
router.delete("/kings/:id", async (req, res) => {
  try {
    const king = await King.findByIdAndDelete(req.params.id);
    if (!king)
      return res
        .status(404)
        .json({ success: false, message: "King not found" });
    res.json({
      success: true,
      message: "King deleted successfully",
      data: king,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting king",
      error: error.message,
    });
  }
});

export default router;
