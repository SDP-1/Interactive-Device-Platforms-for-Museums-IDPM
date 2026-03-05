import express from "express";
import FeaturedExhibit from "../models/FeaturedExhibit.js";
import Artifact from "../models/Artifact.js";

const router = express.Router();

// Get all featured exhibits (populate artifacts and respect explicit order when present)
router.get("/featured-exhibits", async (req, res) => {
  try {
    const exhibits = await FeaturedExhibit.find()
      .sort({ created_at: -1 })
      .populate("artifacts");

    const normalized = exhibits.map((ex) => {
      const obj = ex.toObject();
      let orderedArtifacts = obj.artifacts || [];
      if (obj.order && obj.order.length > 0) {
        const artifactsById = {};
        (obj.artifacts || []).forEach(
          (a) => (artifactsById[a._id.toString()] = a),
        );
        orderedArtifacts = obj.order
          .map((id) => artifactsById[id.toString()])
          .filter(Boolean);
        const orderedIds = new Set(obj.order.map((i) => i.toString()));
        (obj.artifacts || []).forEach((a) => {
          if (!orderedIds.has(a._id.toString())) orderedArtifacts.push(a);
        });
      }
      const displayImage =
        obj.imageUrl ||
        (orderedArtifacts &&
          orderedArtifacts[0] &&
          orderedArtifacts[0].imageUrls &&
          orderedArtifacts[0].imageUrls[0]) ||
        null;
      return { ...obj, artifacts: orderedArtifacts, imageUrl: displayImage };
    });

    res.json({ success: true, data: normalized, total: normalized.length });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching exhibits",
      error: error.message,
    });
  }
});

// Get single exhibit with populated artifacts (ordered)
router.get("/featured-exhibits/:id", async (req, res) => {
  try {
    const exhibit = await FeaturedExhibit.findById(req.params.id).populate(
      "artifacts",
    );
    if (!exhibit)
      return res
        .status(404)
        .json({ success: false, message: "Exhibit not found" });

    // If an explicit order exists, map artifacts to that order
    let orderedArtifacts = exhibit.artifacts || [];
    if (exhibit.order && exhibit.order.length > 0) {
      const artifactsById = {};
      (exhibit.artifacts || []).forEach(
        (a) => (artifactsById[a._id.toString()] = a),
      );
      orderedArtifacts = exhibit.order
        .map((id) => artifactsById[id.toString()])
        .filter(Boolean);
      // append any artifacts not in order at the end
      const orderedIds = new Set(exhibit.order.map((i) => i.toString()));
      (exhibit.artifacts || []).forEach((a) => {
        if (!orderedIds.has(a._id.toString())) orderedArtifacts.push(a);
      });
    }

    const obj = exhibit.toObject();
    const displayImage =
      obj.imageUrl ||
      (orderedArtifacts &&
        orderedArtifacts[0] &&
        orderedArtifacts[0].imageUrls &&
        orderedArtifacts[0].imageUrls[0]) ||
      null;
    res.json({
      success: true,
      data: { ...obj, artifacts: orderedArtifacts, imageUrl: displayImage },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching exhibit",
      error: error.message,
    });
  }
});

// Create exhibit
router.post("/featured-exhibits", async (req, res) => {
  try {
    const { name, description, estimated_visit_minutes, artifacts, order } =
      req.body;
    if (!name)
      return res
        .status(400)
        .json({ success: false, message: "Missing exhibit name" });

    // Validate artifact ids (optional)
    let validatedArtifacts = [];
    if (Array.isArray(artifacts) && artifacts.length > 0) {
      validatedArtifacts = await Artifact.find({
        _id: { $in: artifacts },
      }).select("_id");
    }

    // choose exhibit image: explicit imageUrl or first artifact image if available
    let imageUrl = req.body.imageUrl || null;
    if (!imageUrl && Array.isArray(artifacts) && artifacts.length > 0) {
      try {
        const first = await Artifact.findById(artifacts[0]).select("imageUrls");
        if (first && first.imageUrls && first.imageUrls.length > 0)
          imageUrl = first.imageUrls[0];
      } catch (err) {
        // ignore
      }
    }

    const exhibit = new FeaturedExhibit({
      name,
      description: description || null,
      imageUrl: imageUrl || null,
      estimated_visit_minutes: estimated_visit_minutes || 30,
      artifacts: validatedArtifacts.map((a) => a._id),
      order: Array.isArray(order)
        ? order
        : validatedArtifacts.map((a) => a._id),
    });

    const saved = await exhibit.save();
    res
      .status(201)
      .json({ success: true, message: "Exhibit created", data: saved });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating exhibit",
      error: error.message,
    });
  }
});

// Update exhibit metadata
router.put("/featured-exhibits/:id", async (req, res) => {
  try {
    const { name, description, estimated_visit_minutes, artifacts } = req.body;
    const updateData = {
      ...(typeof name !== "undefined" ? { name } : {}),
      ...(typeof description !== "undefined" ? { description } : {}),
      ...(typeof estimated_visit_minutes !== "undefined"
        ? { estimated_visit_minutes }
        : {}),
      ...(typeof req.body.imageUrl !== "undefined"
        ? { imageUrl: req.body.imageUrl }
        : {}),
      ...(typeof artifacts !== "undefined" ? { artifacts } : {}),
      updated_at: new Date(),
    };

    const exhibit = await FeaturedExhibit.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true },
    );
    if (!exhibit)
      return res
        .status(404)
        .json({ success: false, message: "Exhibit not found" });
    res.json({ success: true, message: "Exhibit updated", data: exhibit });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating exhibit",
      error: error.message,
    });
  }
});

// Update ordering of artifacts within an exhibit
router.put("/featured-exhibits/:id/order", async (req, res) => {
  try {
    const { order } = req.body; // array of artifact ids
    if (!Array.isArray(order))
      return res.status(400).json({
        success: false,
        message: "Order must be an array of artifact IDs",
      });

    const exhibit = await FeaturedExhibit.findById(req.params.id);
    if (!exhibit)
      return res
        .status(404)
        .json({ success: false, message: "Exhibit not found" });

    exhibit.order = order;
    exhibit.updated_at = new Date();
    await exhibit.save();

    res.json({ success: true, message: "Order updated", data: exhibit });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating order",
      error: error.message,
    });
  }
});

// Delete exhibit
router.delete("/featured-exhibits/:id", async (req, res) => {
  try {
    const exhibit = await FeaturedExhibit.findByIdAndDelete(req.params.id);
    if (!exhibit)
      return res
        .status(404)
        .json({ success: false, message: "Exhibit not found" });
    res.json({ success: true, message: "Exhibit deleted", data: exhibit });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting exhibit",
      error: error.message,
    });
  }
});

export default router;
