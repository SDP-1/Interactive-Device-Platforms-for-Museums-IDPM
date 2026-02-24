import mongoose from "mongoose";

const UserSessionSchema = new mongoose.Schema(
  {
    session_id: { type: String, required: true, unique: true },
    duration_hours: { type: Number, required: true },
    start_time: { type: Date, required: true },
    end_time: { type: Date, required: true },
    language: { type: String, enum: ["en", "si"], default: "en" },
    price: { type: Number, default: 0 },
    // whether the session is currently active
    is_active: { type: Boolean, default: true },
    // star rating for the session (0-5)
    star_rating: { type: Number, min: 0, max: 5 },
    // feedbacks as plain strings (one or more)
    feedbacks: { type: [String], default: [] },
    // extended time added to session (in hours)
    extended_time_hours: { type: Number, default: 0 },
    // optional extended end time when extension applied
    extended_until: { type: Date, default: null },
  },
  { timestamps: true },
);

const UserSession = mongoose.model("UserSession", UserSessionSchema);
export default UserSession;
