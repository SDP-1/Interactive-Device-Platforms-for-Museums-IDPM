import mongoose from "mongoose";

const artifactSchema = new mongoose.Schema({
  artifact_id: {
    type: String,
    unique: true,
    required: true,
  },
  title_en: {
    type: String,
    required: true,
  },
  title_si: {
    type: String,
    required: true,
  },
  origin_en: {
    type: String,
    required: true,
  },
  origin_si: {
    type: String,
    required: true,
  },
  year: {
    type: String,
    required: true,
  },
  category_en: {
    type: String,
    required: true,
  },
  category_si: {
    type: String,
    required: true,
  },
  description_en: {
    type: String,
    required: true,
  },
  description_si: {
    type: String,
    required: true,
  },
  material_en: {
    type: String,
    default: null,
  },
  material_si: {
    type: String,
    default: null,
  },
  dimensions_en: {
    type: String,
    default: null,
  },
  dimensions_si: {
    type: String,
    default: null,
  },
  culturalSignificance_en: {
    type: String,
    default: null,
  },
  culturalSignificance_si: {
    type: String,
    default: null,
  },
  gallery_en: {
    type: String,
    default: null,
  },
  gallery_si: {
    type: String,
    default: null,
  },
  imageUrls: [
    {
      type: String,
      required: true,
    },
  ],
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

const Artifact = mongoose.model("Artifact", artifactSchema);
export default Artifact;
