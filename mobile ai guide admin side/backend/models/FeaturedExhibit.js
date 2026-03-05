import mongoose from "mongoose";

const featuredExhibitSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: null },
  imageUrl: { type: String, default: null },
  estimated_visit_minutes: { type: Number, default: 30 },
  // referenced artifacts in this exhibit
  artifacts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artifact",
    },
  ],
  // explicit ordering of artifact IDs (may match `artifacts` order)
  order: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artifact",
    },
  ],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const FeaturedExhibit = mongoose.model(
  "FeaturedExhibit",
  featuredExhibitSchema,
);
export default FeaturedExhibit;
