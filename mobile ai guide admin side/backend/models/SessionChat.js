import mongoose from "mongoose";

const SessionChatSchema = new mongoose.Schema(
  {
    session_id: { type: String, required: true, index: true },
    reference_type: {
      type: String,
      enum: ["general", "king", "artifact"],
      default: "general",
      index: true,
    },
    reference_id: { type: String, default: null, index: true },
    question: { type: String, required: true, trim: true },
    reply: { type: String, required: true, trim: true },
    question_time: { type: Date, default: Date.now, index: true },
    reply_time: { type: Date, default: Date.now },
    language: { type: String, enum: ["en", "si"], default: "en" },
  },
  { timestamps: true },
);

const SessionChat = mongoose.model("SessionChat", SessionChatSchema);
export default SessionChat;
