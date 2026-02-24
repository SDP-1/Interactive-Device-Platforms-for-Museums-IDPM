import express from "express";
import King from "../models/King.js";

const router = express.Router();

// Helper to format king response according to language
function formatKingResponse(king, language = "en") {
  if (!king) return null;
  if (language === "si") {
    return {
      king_id: king.king_id,
      name: king.name_si || king.name_en || null,
      capital: king.capital_si || king.capital_en || null,
      biography: king.biography_si || king.biography_en || null,
      period: king.period_si || king.period_en || null,
      aiKnowlageBase: king.aiKnowlageBase_si || king.aiKnowlageBase_en || null,
      imageUrls: king.imageUrls || [],
    };
  }
  return {
    king_id: king.king_id,
    name: king.name_en || king.name_si || null,
    capital: king.capital_en || king.capital_si || null,
    biography: king.biography_en || king.biography_si || null,
    period: king.period_en || king.period_si || null,
    aiKnowlageBase: king.aiKnowlageBase_en || king.aiKnowlageBase_si || null,
    imageUrls: king.imageUrls || [],
  };
}
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

// Get king by DB _id (supports language query param: ?language=si|en)
router.get("/kings/:id", async (req, res) => {
  try {
    const language = (req.query.language || "en").toString();
    const king = await King.findById(req.params.id);
    if (!king)
      return res
        .status(404)
        .json({ success: false, message: "King not found" });
    const payload = formatKingResponse(king, language);
    res.json({ success: true, data: payload });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching king",
      error: error.message,
    });
  }
});

// Get king by king_id
// Get king by king_id (supports language query param: ?language=si|en)
router.get("/kings/by-king-id/:king_id", async (req, res) => {
  try {
    const language = (req.query.language || "en").toString();
    const king = await King.findOne({ king_id: req.params.king_id });
    if (!king)
      return res
        .status(404)
        .json({ success: false, message: "King not found" });
    const payload = formatKingResponse(king, language);
    res.json({ success: true, data: payload });
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
      period_en,
      period_si,
      aiKnowlageBase_en,
      aiKnowlageBase_si,
    } = req.body;

    // Require names, biographies and AI knowledge bases; imageUrls and capitals are optional
    if (
      !name_en ||
      !name_si ||
      !biography_en ||
      !biography_si ||
      !period_en ||
      !period_si ||
      !aiKnowlageBase_en ||
      !aiKnowlageBase_si
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: names and biographies are required",
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
      aiKnowlageBase_en: aiKnowlageBase_en || null,
      aiKnowlageBase_si: aiKnowlageBase_si || null,
      period_en: period_en || null,
      period_si: period_si || null,
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
      period_en,
      period_si,
      aiKnowlageBase_en,
      aiKnowlageBase_si,
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
      aiKnowlageBase_en:
        typeof aiKnowlageBase_en !== "undefined"
          ? aiKnowlageBase_en
          : undefined,
      aiKnowlageBase_si:
        typeof aiKnowlageBase_si !== "undefined"
          ? aiKnowlageBase_si
          : undefined,
      period_en: typeof period_en !== "undefined" ? period_en : undefined,
      period_si: typeof period_si !== "undefined" ? period_si : undefined,
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
