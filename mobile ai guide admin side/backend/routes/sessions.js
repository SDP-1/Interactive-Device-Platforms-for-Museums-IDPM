import express from "express";
import { randomUUID } from "crypto";
import UserSession from "../models/UserSession.js";

const router = express.Router();

// Create a new session
router.post("/sessions", async (req, res) => {
  try {
    const { duration_hours, language = "en", price = 0 } = req.body;

    if (typeof duration_hours === "undefined" || duration_hours <= 0) {
      return res.status(400).json({
        success: false,
        message: "duration_hours is required and must be > 0",
      });
    }

    const start_time = new Date();
    const end_time = new Date(
      start_time.getTime() + duration_hours * 60 * 60 * 1000,
    );

    const session = new UserSession({
      session_id: randomUUID(),
      duration_hours,
      start_time,
      end_time,
      language,
      price,
      is_active: true,
    });

    await session.save();
    return res.status(201).json({ success: true, data: session });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error creating session",
      error: error.message,
    });
  }
});

// Get list of sessions
router.get("/sessions", async (req, res) => {
  try {
    const {
      page = "1",
      limit = "10",
      sort = "createdAt",
      order = "desc",
      search = "",
      status,
      language,
      minPrice,
      maxPrice,
      startFrom,
      startTo,
    } = req.query;

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    const allowedSortFields = new Set([
      "createdAt",
      "price",
      "start_time",
      "end_time",
      "duration_hours",
      "is_active",
      "language",
      "session_id",
    ]);
    const sortField = allowedSortFields.has(String(sort))
      ? String(sort)
      : "createdAt";
    const sortOrder = String(order).toLowerCase() === "asc" ? 1 : -1;

    const query = {};

    if (search && String(search).trim()) {
      query.$or = [
        { session_id: { $regex: String(search).trim(), $options: "i" } },
        { language: { $regex: String(search).trim(), $options: "i" } },
      ];
    }

    if (status === "live") query.is_active = true;
    if (status === "ended") query.is_active = false;

    if (language === "en" || language === "si") {
      query.language = language;
    }

    if (typeof minPrice !== "undefined" || typeof maxPrice !== "undefined") {
      query.price = {};
      if (typeof minPrice !== "undefined" && String(minPrice) !== "") {
        query.price.$gte = Number(minPrice);
      }
      if (typeof maxPrice !== "undefined" && String(maxPrice) !== "") {
        query.price.$lte = Number(maxPrice);
      }
      if (Object.keys(query.price).length === 0) delete query.price;
    }

    if (startFrom || startTo) {
      query.start_time = {};
      if (startFrom) query.start_time.$gte = new Date(String(startFrom));
      if (startTo) {
        const endDate = new Date(String(startTo));
        endDate.setHours(23, 59, 59, 999);
        query.start_time.$lte = endDate;
      }
      if (Object.keys(query.start_time).length === 0) delete query.start_time;
    }

    const total = await UserSession.countDocuments(query);
    const totalPages = Math.max(1, Math.ceil(total / parsedLimit));
    const safePage = Math.min(parsedPage, totalPages);
    const skip = (safePage - 1) * parsedLimit;

    const sessions = await UserSession.find(query)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(parsedLimit);

    return res.json({
      success: true,
      data: sessions,
      pagination: {
        page: safePage,
        limit: parsedLimit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching sessions",
      error: error.message,
    });
  }
});

// Get session by session_id
router.get("/sessions/:session_id", async (req, res) => {
  try {
    const session = await UserSession.findOne({
      session_id: req.params.session_id,
    });
    if (!session)
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    return res.json({ success: true, data: session });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching session",
      error: error.message,
    });
  }
});

// Extend a session by adding hours. If session already ended, extension makes it live: new end = now + add_hours
router.post("/sessions/:session_id/extend", async (req, res) => {
  try {
    const { add_hours } = req.body;
    if (typeof add_hours === "undefined" || add_hours <= 0) {
      return res.status(400).json({
        success: false,
        message: "add_hours is required and must be > 0",
      });
    }

    const session = await UserSession.findOne({
      session_id: req.params.session_id,
    });
    if (!session)
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });

    const now = new Date();
    // Always append add_hours to the existing end_time (fork from end_time + add_hours)
    const baseEnd = session.end_time || now;
    const newEnd = new Date(baseEnd.getTime() + add_hours * 60 * 60 * 1000);

    session.end_time = newEnd;
    session.extended_time_hours =
      (session.extended_time_hours || 0) + add_hours;
    session.extended_until = newEnd;
    // session is active if new end is in the future
    session.is_active = newEnd > now;

    await session.save();
    return res.json({ success: true, data: session });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error extending session",
      error: error.message,
    });
  }
});

// Add feedback (string) and optional star rating
router.post("/sessions/:session_id/feedback", async (req, res) => {
  try {
    const { feedback, star_rating } = req.body;
    if (!feedback || typeof feedback !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "feedback (string) is required" });
    }

    const session = await UserSession.findOne({
      session_id: req.params.session_id,
    });
    if (!session)
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });

    session.feedbacks = session.feedbacks || [];
    session.feedbacks.push(feedback);
    if (typeof star_rating !== "undefined") {
      session.star_rating = star_rating;
    }

    await session.save();
    return res.json({ success: true, data: session });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error adding feedback",
      error: error.message,
    });
  }
});

// Update session (partial). Accepts fields to replace, including `feedbacks` array to overwrite.
router.put("/sessions/:session_id", async (req, res) => {
  try {
    const updates = req.body || {};

    const session = await UserSession.findOne({
      session_id: req.params.session_id,
    });
    if (!session)
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });

    // Only apply known fields to avoid accidental overwrites
    const allowed = new Set([
      "language",
      "price",
      "start_time",
      "end_time",
      "is_active",
      "star_rating",
      "feedbacks",
      "duration_hours",
      "extended_time_hours",
      "extended_until",
    ]);

    Object.keys(updates).forEach((k) => {
      if (!allowed.has(k)) return;
      // coerce types for a couple of fields
      if (k === "feedbacks") {
        // replace feedbacks array; ensure it's an array of strings
        session.feedbacks = Array.isArray(updates.feedbacks)
          ? updates.feedbacks.map((x) => String(x))
          : [];
        return;
      }
      if (k === "star_rating") {
        session.star_rating = Number(updates.star_rating || 0);
        return;
      }
      session[k] = updates[k];
    });

    await session.save();
    return res.json({ success: true, data: session });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error updating session",
      error: error.message,
    });
  }
});

// Clear all feedbacks for a session
router.delete("/sessions/:session_id/feedbacks", async (req, res) => {
  try {
    const session = await UserSession.findOne({
      session_id: req.params.session_id,
    });
    if (!session)
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });

    session.feedbacks = [];
    await session.save();
    return res.json({ success: true, data: session });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error clearing feedbacks",
      error: error.message,
    });
  }
});

export default router;
