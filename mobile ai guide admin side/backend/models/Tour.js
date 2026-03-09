import mongoose from "mongoose";

const tourPointSchema = new mongoose.Schema(
  {
    artifact_id: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      required: true,
      min: 1,
    },
    floor: {
      type: String,
      default: null,
    },
    section: {
      type: String,
      default: null,
    },
    guidance: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
    visited: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  duration_minutes: {
    type: Number,
    required: true,
    min: 1,
  },
  floor: {
    type: String,
    default: null,
  },
  section: {
    type: String,
    default: null,
  },
  guidance: {
    type: String,
    default: null,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  points: {
    type: [tourPointSchema],
    default: [],
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

tourSchema.pre("save", function updateTimestamp(next) {
  this.updated_at = new Date();
  if (Array.isArray(this.points)) {
    this.points = this.points
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((point, index) => ({
        ...(point.toObject?.() || point),
        order: index + 1,
      }));
  }
  next();
});

const Tour = mongoose.model("Tour", tourSchema);

export default Tour;
