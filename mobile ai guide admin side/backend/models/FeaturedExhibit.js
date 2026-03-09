import mongoose from "mongoose";

const featuredExhibitSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: null },
  imageUrl: { type: String, default: null },
  estimated_visit_minutes: { type: Number, default: 0 },
  // referenced artifacts in this exhibit
  // referenced artifacts in this exhibit (store artifact.artifact_id strings)
  artifacts: [
    {
      type: String,
    },
  ],
  // explicit ordering of artifact IDs (artifact_id strings)
  order: [
    {
      type: String,
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
