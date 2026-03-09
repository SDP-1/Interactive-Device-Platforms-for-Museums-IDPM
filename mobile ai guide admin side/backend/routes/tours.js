import express from "express";
import Tour from "../models/Tour.js";
import Artifact from "../models/Artifact.js";

const router = express.Router();

function normalizePoints(points = []) {
  if (!Array.isArray(points)) return [];
  return points
    .filter((point) => point && point.artifact_id)
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
    .map((point, index) => ({
      artifact_id: String(point.artifact_id),
      order: index + 1,
      floor: point.floor || null,
      section: point.section || null,
      guidance: point.guidance || null,
      notes: point.notes || null,
      visited: Boolean(point.visited),
    }));
}

async function mapTourWithArtifactLinks(tour) {
  const base = tour.toObject();
  const points = normalizePoints(base.points || []);
  const artifactIds = Array.from(new Set(points.map((p) => p.artifact_id)));

  const artifacts = await Artifact.find({ artifact_id: { $in: artifactIds } })
    .select(
      "artifact_id title_en title_si description_en description_si imageUrls",
    )
    .lean();

  const artifactMap = artifacts.reduce((acc, artifact) => {
    acc[artifact.artifact_id] = artifact;
    return acc;
  }, {});

  const linkedPoints = points.map((point) => ({
    ...point,
    artifact: artifactMap[point.artifact_id]
      ? {
          artifact_id: artifactMap[point.artifact_id].artifact_id,
          title_en: artifactMap[point.artifact_id].title_en || null,
          title_si: artifactMap[point.artifact_id].title_si || null,
          description_en: artifactMap[point.artifact_id].description_en || null,
          description_si: artifactMap[point.artifact_id].description_si || null,
          imageUrl: artifactMap[point.artifact_id].imageUrls?.[0] || null,
        }
      : null,
  }));

  return {
    ...base,
    points: linkedPoints,
    path: linkedPoints.map((point) => ({
      order: point.order,
      artifact_id: point.artifact_id,
      label:
        point.artifact?.title_en ||
        point.artifact?.title_si ||
        point.artifact_id,
    })),
  };
}

router.get("/tours", async (req, res) => {
  try {
    const tours = await Tour.find().sort({ created_at: -1 });
    const mapped = await Promise.all(tours.map(mapTourWithArtifactLinks));
    res.json({ success: true, data: mapped, total: mapped.length });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching tours",
      error: error.message,
    });
  }
});

router.get("/tours/:id", async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    if (!tour) {
      return res
        .status(404)
        .json({ success: false, message: "Tour not found" });
    }
    const mapped = await mapTourWithArtifactLinks(tour);
    res.json({ success: true, data: mapped });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching tour",
      error: error.message,
    });
  }
});

router.post("/tours", async (req, res) => {
  try {
    const {
      name,
      duration_minutes,
      floor,
      section,
      guidance,
      points,
      is_active,
    } = req.body;

    if (!name || !duration_minutes) {
      return res.status(400).json({
        success: false,
        message: "Name and duration_minutes are required",
      });
    }

    const normalizedPoints = normalizePoints(points || []);
    const artifactIds = normalizedPoints.map((point) => point.artifact_id);
    if (artifactIds.length > 0) {
      const found = await Artifact.find({
        artifact_id: { $in: artifactIds },
      }).select("artifact_id");
      const foundSet = new Set(found.map((artifact) => artifact.artifact_id));
      const missingIds = artifactIds.filter((id) => !foundSet.has(id));
      if (missingIds.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Some artifact_ids do not exist",
          missing_artifact_ids: Array.from(new Set(missingIds)),
        });
      }
    }

    const tour = new Tour({
      name,
      duration_minutes,
      floor: floor || null,
      section: section || null,
      guidance: guidance || null,
      points: normalizedPoints,
      is_active: typeof is_active === "boolean" ? is_active : true,
    });

    const saved = await tour.save();
    const mapped = await mapTourWithArtifactLinks(saved);
    res.status(201).json({
      success: true,
      message: "Tour created successfully",
      data: mapped,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating tour",
      error: error.message,
    });
  }
});

router.put("/tours/:id", async (req, res) => {
  try {
    const {
      name,
      duration_minutes,
      floor,
      section,
      guidance,
      points,
      is_active,
    } = req.body;

    const updateData = {
      ...(typeof name !== "undefined" ? { name } : {}),
      ...(typeof duration_minutes !== "undefined" ? { duration_minutes } : {}),
      ...(typeof floor !== "undefined" ? { floor } : {}),
      ...(typeof section !== "undefined" ? { section } : {}),
      ...(typeof guidance !== "undefined" ? { guidance } : {}),
      ...(typeof is_active !== "undefined"
        ? { is_active: Boolean(is_active) }
        : {}),
      updated_at: new Date(),
    };

    if (typeof points !== "undefined") {
      const normalizedPoints = normalizePoints(points || []);
      const artifactIds = normalizedPoints.map((point) => point.artifact_id);
      if (artifactIds.length > 0) {
        const found = await Artifact.find({
          artifact_id: { $in: artifactIds },
        }).select("artifact_id");
        const foundSet = new Set(found.map((artifact) => artifact.artifact_id));
        const missingIds = artifactIds.filter((id) => !foundSet.has(id));
        if (missingIds.length > 0) {
          return res.status(400).json({
            success: false,
            message: "Some artifact_ids do not exist",
            missing_artifact_ids: Array.from(new Set(missingIds)),
          });
        }
      }
      updateData.points = normalizedPoints;
    }

    const updated = await Tour.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Tour not found" });
    }

    const mapped = await mapTourWithArtifactLinks(updated);
    res.json({
      success: true,
      message: "Tour updated successfully",
      data: mapped,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating tour",
      error: error.message,
    });
  }
});

router.put("/tours/:id/points", async (req, res) => {
  try {
    const { points } = req.body;
    const normalizedPoints = normalizePoints(points || []);
    const artifactIds = normalizedPoints.map((point) => point.artifact_id);

    if (artifactIds.length > 0) {
      const found = await Artifact.find({
        artifact_id: { $in: artifactIds },
      }).select("artifact_id");
      const foundSet = new Set(found.map((artifact) => artifact.artifact_id));
      const missingIds = artifactIds.filter((id) => !foundSet.has(id));
      if (missingIds.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Some artifact_ids do not exist",
          missing_artifact_ids: Array.from(new Set(missingIds)),
        });
      }
    }

    const updated = await Tour.findByIdAndUpdate(
      req.params.id,
      { points: normalizedPoints, updated_at: new Date() },
      { new: true, runValidators: true },
    );

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Tour not found" });
    }

    const mapped = await mapTourWithArtifactLinks(updated);
    res.json({
      success: true,
      message: "Tour path updated successfully",
      data: mapped,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating tour points",
      error: error.message,
    });
  }
});

router.delete("/tours/:id", async (req, res) => {
  try {
    const deleted = await Tour.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Tour not found" });
    }

    res.json({
      success: true,
      message: "Tour deleted successfully",
      data: deleted,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting tour",
      error: error.message,
    });
  }
});

export default router;
