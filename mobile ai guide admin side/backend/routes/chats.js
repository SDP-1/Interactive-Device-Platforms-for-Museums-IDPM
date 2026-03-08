import express from "express";
import UserSession from "../models/UserSession.js";
import King from "../models/King.js";
import Artifact from "../models/Artifact.js";
import SessionChat from "../models/SessionChat.js";

const router = express.Router();

const CHAT_REFERENCE_TYPES = ["general", "king", "artifact"];
const CHAT_CONTEXT_TYPES = ["artifact", "persona", "king"];

function toValidDate(value, fallback = new Date()) {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function mapContextTypeToReferenceType(contextType) {
  if (contextType === "persona") return "king";
  return contextType;
}

// Save one chat interaction (question + reply) for a session
router.post("/sessions/:session_id/chat", async (req, res) => {
  try {
    const {
      question,
      reply,
      reference_type = "general",
      reference_id = null,
      language,
      question_time,
      reply_time,
    } = req.body;

    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: "question (non-empty string) is required",
      });
    }

    if (!reply || typeof reply !== "string" || !reply.trim()) {
      return res.status(400).json({
        success: false,
        message: "reply (non-empty string) is required",
      });
    }

    if (!CHAT_REFERENCE_TYPES.includes(reference_type)) {
      return res.status(400).json({
        success: false,
        message: "reference_type must be one of: general, king, artifact",
      });
    }

    if (
      (reference_type === "king" || reference_type === "artifact") &&
      (!reference_id || typeof reference_id !== "string")
    ) {
      return res.status(400).json({
        success: false,
        message: "reference_id is required when reference_type is king/artifact",
      });
    }

    const session = await UserSession.findOne({
      session_id: req.params.session_id,
    });
    if (!session)
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });

    if (reference_type === "king") {
      const king = await King.findOne({ king_id: reference_id }).select("_id");
      if (!king) {
        return res.status(404).json({
          success: false,
          message: "Referenced king not found",
        });
      }
    }

    if (reference_type === "artifact") {
      const artifact = await Artifact.findOne({ artifact_id: reference_id }).select(
        "_id",
      );
      if (!artifact) {
        return res.status(404).json({
          success: false,
          message: "Referenced artifact not found",
        });
      }
    }

    const interaction = new SessionChat({
      session_id: session.session_id,
      reference_type,
      reference_id: reference_type === "general" ? null : reference_id,
      question: question.trim(),
      reply: reply.trim(),
      question_time: toValidDate(question_time),
      reply_time: toValidDate(reply_time),
      language:
        language && ["en", "si"].includes(language)
          ? language
          : session.language || "en",
    });

    await interaction.save();
    const totalQuestions = await SessionChat.countDocuments({
      session_id: session.session_id,
    });

    return res.status(201).json({
      success: true,
      data: {
        session_id: session.session_id,
        interaction,
        total_questions: totalQuestions,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error saving chat interaction",
      error: error.message,
    });
  }
});

// Get chat history for a session (optionally filter by king/artifact)
router.get("/sessions/:session_id/chat", async (req, res) => {
  try {
    const { reference_type, reference_id } = req.query;

    const session = await UserSession.findOne({
      session_id: req.params.session_id,
    });
    if (!session)
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });

    const query = { session_id: session.session_id };

    if (reference_type) {
      if (!CHAT_REFERENCE_TYPES.includes(reference_type)) {
        return res.status(400).json({
          success: false,
          message: "reference_type must be one of: general, king, artifact",
        });
      }
      query.reference_type = reference_type;
    }

    if (reference_id) {
      query.reference_id = reference_id;
    }

    const interactions = await SessionChat.find(query).sort({ question_time: 1 });

    return res.json({
      success: true,
      data: {
        session_id: session.session_id,
        total_interactions: interactions.length,
        interactions,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching chat history",
      error: error.message,
    });
  }
});

// Get full chat history for one session + one artifact/persona(king)
router.get(
  "/sessions/:session_id/chat/context/:context_type/:context_id",
  async (req, res) => {
    try {
      const { session_id, context_type, context_id } = req.params;

      if (!CHAT_CONTEXT_TYPES.includes(context_type)) {
        return res.status(400).json({
          success: false,
          message: "context_type must be one of: artifact, persona, king",
        });
      }

      const referenceType = mapContextTypeToReferenceType(context_type);

      const session = await UserSession.findOne({ session_id });
      if (!session) {
        return res
          .status(404)
          .json({ success: false, message: "Session not found" });
      }

      if (referenceType === "king") {
        const king = await King.findOne({ king_id: context_id }).select("_id");
        if (!king) {
          return res.status(404).json({
            success: false,
            message: "Referenced persona/king not found",
          });
        }
      }

      if (referenceType === "artifact") {
        const artifact = await Artifact.findOne({ artifact_id: context_id }).select(
          "_id",
        );
        if (!artifact) {
          return res.status(404).json({
            success: false,
            message: "Referenced artifact not found",
          });
        }
      }

      const interactions = await SessionChat.find({
        session_id: session.session_id,
        reference_type: referenceType,
        reference_id: context_id,
      }).sort({ question_time: 1 });

      return res.json({
        success: true,
        data: {
          session_id: session.session_id,
          context_type,
          context_id,
          total_interactions: interactions.length,
          interactions,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error fetching context chat history",
        error: error.message,
      });
    }
  },
);

export default router;
