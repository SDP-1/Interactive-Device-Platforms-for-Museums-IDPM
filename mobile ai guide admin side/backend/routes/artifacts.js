import express from "express";
import Artifact from "../models/Artifact.js";

const router = express.Router();

// Helper function to generate artifact ID
async function generateArtifactId() {
  const lastArtifact = await Artifact.findOne({})
    .sort({ created_at: -1 })
    .select("artifact_id");

  if (!lastArtifact || !lastArtifact.artifact_id) {
    return "ART001";
  }

  const lastNumber = parseInt(lastArtifact.artifact_id.replace("ART", ""));
  const newNumber = lastNumber + 1;
  return `ART${String(newNumber).padStart(3, "0")}`;
}

// Get all artifacts
router.get("/artifacts", async (req, res) => {
  try {
    const artifacts = await Artifact.find().sort({ created_at: -1 });
    res.json({
      success: true,
      data: artifacts,
      total: artifacts.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching artifacts",
      error: error.message,
    });
  }
});

// Get single artifact by ID
router.get("/artifacts/:id", async (req, res) => {
  try {
    const artifact = await Artifact.findById(req.params.id);
    if (!artifact) {
      return res.status(404).json({
        success: false,
        message: "Artifact not found",
      });
    }
    res.json({
      success: true,
      data: artifact,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching artifact",
      error: error.message,
    });
  }
});

// Get single artifact by artifact_id
router.get("/artifacts/by-artifact-id/:artifact_id", async (req, res) => {
  try {
    const artifact = await Artifact.findOne({
      artifact_id: req.params.artifact_id,
    });
    if (!artifact) {
      return res.status(404).json({
        success: false,
        message: "Artifact not found",
      });
    }
    res.json({
      success: true,
      data: artifact,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching artifact",
      error: error.message,
    });
  }
});

// Create artifact
router.post("/artifacts", async (req, res) => {
  try {
    const {
      title_en,
      title_si,
      origin_en,
      origin_si,
      year,
      category_en,
      category_si,
      description_en,
      description_si,
      material_en,
      material_si,
      dimensions_en,
      dimensions_si,
      culturalSignificance_en,
      culturalSignificance_si,
      gallery_en,
      gallery_si,
      imageUrls,
    } = req.body;

    // Validate required fields
    if (
      !title_en ||
      !title_si ||
      !origin_en ||
      !origin_si ||
      !year ||
      !category_en ||
      !category_si ||
      !description_en ||
      !description_si ||
      !imageUrls ||
      imageUrls.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const artifact_id = await generateArtifactId();

    const artifact = new Artifact({
      artifact_id,
      title_en,
      title_si,
      origin_en,
      origin_si,
      year,
      category_en,
      category_si,
      description_en,
      description_si,
      material_en: material_en || null,
      material_si: material_si || null,
      dimensions_en: dimensions_en || null,
      dimensions_si: dimensions_si || null,
      culturalSignificance_en: culturalSignificance_en || null,
      culturalSignificance_si: culturalSignificance_si || null,
      gallery_en: gallery_en || null,
      gallery_si: gallery_si || null,
      imageUrls,
    });

    const saved = await artifact.save();
    res.status(201).json({
      success: true,
      message: "Artifact created successfully",
      data: saved,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating artifact",
      error: error.message,
    });
  }
});

// Update artifact
router.put("/artifacts/:id", async (req, res) => {
  try {
    const {
      title_en,
      title_si,
      origin_en,
      origin_si,
      year,
      category_en,
      category_si,
      description_en,
      description_si,
      material_en,
      material_si,
      dimensions_en,
      dimensions_si,
      culturalSignificance_en,
      culturalSignificance_si,
      gallery_en,
      gallery_si,
      imageUrls,
    } = req.body;

    const updateData = {
      title_en: title_en || undefined,
      title_si: title_si || undefined,
      origin_en: origin_en || undefined,
      origin_si: origin_si || undefined,
      year: year || undefined,
      category_en: category_en || undefined,
      category_si: category_si || undefined,
      description_en: description_en || undefined,
      description_si: description_si || undefined,
      material_en: material_en || null,
      material_si: material_si || null,
      dimensions_en: dimensions_en || null,
      dimensions_si: dimensions_si || null,
      culturalSignificance_en: culturalSignificance_en || null,
      culturalSignificance_si: culturalSignificance_si || null,
      gallery_en: gallery_en || null,
      gallery_si: gallery_si || null,
      imageUrls: imageUrls || undefined,
      updated_at: new Date(),
    };

    // Remove undefined values
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    const artifact = await Artifact.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!artifact) {
      return res.status(404).json({
        success: false,
        message: "Artifact not found",
      });
    }

    res.json({
      success: true,
      message: "Artifact updated successfully",
      data: artifact,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating artifact",
      error: error.message,
    });
  }
});

// Delete artifact
router.delete("/artifacts/:id", async (req, res) => {
  try {
    const artifact = await Artifact.findByIdAndDelete(req.params.id);
    if (!artifact) {
      return res.status(404).json({
        success: false,
        message: "Artifact not found",
      });
    }
    res.json({
      success: true,
      message: "Artifact deleted successfully",
      data: artifact,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting artifact",
      error: error.message,
    });
  }
});

export default router;
