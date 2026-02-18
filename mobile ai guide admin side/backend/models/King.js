import mongoose from "mongoose";

const kingSchema = new mongoose.Schema({
  king_id: {
    type: String,
    unique: true,
    required: true,
  },
  name_en: {
    type: String,
    required: true,
  },
  name_si: {
    type: String,
    required: true,
  },
  capital_en: {
    type: String,
    default: null,
  },
  capital_si: {
    type: String,
    default: null,
  },
  biography_en: {
    type: String,
    default: null,
  },
  biography_si: {
    type: String,
    default: null,
  },
  imageUrls: [
    {
      type: String,
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

const King = mongoose.model("King", kingSchema);
export default King;
