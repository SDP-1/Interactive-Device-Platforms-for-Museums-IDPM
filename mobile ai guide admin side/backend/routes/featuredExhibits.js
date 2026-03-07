import express from "express";
import FeaturedExhibit from "../models/FeaturedExhibit.js";
import Artifact from "../models/Artifact.js";

const router = express.Router();

// Helper to load artifact docs for a list of artifact_id strings
async function loadArtifactsByArtifactId(ids = []) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const docs = await Artifact.find({ artifact_id: { $in: ids } });
  const byArtifactId = {};
  docs.forEach((d) => {
    byArtifactId[d.artifact_id] = d;
  });
  return { docs, byArtifactId };
}

// Get all featured exhibits (return artifacts populated by artifact_id and respect explicit order when present)
router.get("/featured-exhibits", async (req, res) => {
  try {
    const exhibits = await FeaturedExhibit.find().sort({ created_at: -1 });

    const normalized = await Promise.all(
      exhibits.map(async (ex) => {
        const obj = ex.toObject();
        const artifactIds = obj.artifacts || [];
        const { docs: artifactDocs, byArtifactId } =
          await loadArtifactsByArtifactId(artifactIds);

        // build orderedArtifacts from `order` (which are artifact_id strings) if present
        let orderedArtifacts = artifactDocs;
        if (Array.isArray(obj.order) && obj.order.length > 0) {
          orderedArtifacts = obj.order
            .map((aid) => byArtifactId[aid])
            .filter(Boolean);
          const orderedSet = new Set(obj.order);
          artifactDocs.forEach((a) => {
            if (!orderedSet.has(a.artifact_id)) orderedArtifacts.push(a);
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
      }),
    );

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
    const exhibit = await FeaturedExhibit.findById(req.params.id);
    if (!exhibit)
      return res
        .status(404)
        .json({ success: false, message: "Exhibit not found" });

    const obj = exhibit.toObject();
    const artifactIds = obj.artifacts || [];
    const { docs: artifactDocs, byArtifactId } =
      await loadArtifactsByArtifactId(artifactIds);

    let orderedArtifacts = artifactDocs;
    if (Array.isArray(obj.order) && obj.order.length > 0) {
      orderedArtifacts = obj.order
        .map((aid) => byArtifactId[aid])
        .filter(Boolean);
      const orderedSet = new Set(obj.order);
      artifactDocs.forEach((a) => {
        if (!orderedSet.has(a.artifact_id)) orderedArtifacts.push(a);
      });
    }

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

    // Validate artifact identifiers by artifact_id field
    let validatedArtifacts = [];
    if (Array.isArray(artifacts) && artifacts.length > 0) {
      validatedArtifacts = await Artifact.find({
        artifact_id: { $in: artifacts },
      }).select("artifact_id imageUrls title_en title_si imageUrls");
    }

    // choose exhibit image: explicit imageUrl or first artifact image if available
    let imageUrl = req.body.imageUrl || null;
    if (!imageUrl && Array.isArray(artifacts) && artifacts.length > 0) {
      try {
        const first = await Artifact.findOne({
          artifact_id: artifacts[0],
        }).select("imageUrls");
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
      // store artifact_id strings
      artifacts: validatedArtifacts.map((a) => a.artifact_id),
      order: Array.isArray(order)
        ? order
        : validatedArtifacts.map((a) => a.artifact_id),
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
      updated_at: new Date(),
    };

    // If client provided artifacts array (of artifact_id strings), validate and store artifact_id strings
    if (typeof artifacts !== "undefined" && Array.isArray(artifacts)) {
      const validated = await Artifact.find({
        artifact_id: { $in: artifacts },
      }).select("artifact_id");
      updateData.artifacts = validated.map((a) => a.artifact_id);
      // if order not explicitly provided, keep artifacts order
      updateData.order = validated.map((a) => a.artifact_id);
    }

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
    const { order } = req.body; // array of artifact_id strings
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

    // Optionally validate that provided order values exist
    const validated = await Artifact.find({
      artifact_id: { $in: order },
    }).select("artifact_id");
    const validIds = validated.map((a) => a.artifact_id);
    exhibit.order = order.filter((o) => validIds.includes(o));
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
