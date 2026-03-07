import express from "express";
import Artifact from "../models/Artifact.js";
import King from "../models/King.js";
import UserSession from "../models/UserSession.js";

const router = express.Router();

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "that",
  "with",
  "this",
  "was",
  "are",
  "very",
  "have",
  "from",
  "your",
  "you",
  "but",
  "not",
  "had",
  "has",
  "were",
  "they",
  "them",
  "their",
  "our",
  "too",
  "can",
  "all",
  "its",
  "about",
  "into",
  "museum",
  "session",
]);

function toMonthKey(dateValue) {
  const d = new Date(dateValue);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleString("en-US", {
    month: "short",
    year: "2-digit",
  });
}

function summarizeKeywords(feedbackItems, take = 8) {
  const counts = new Map();

  for (const text of feedbackItems) {
    const words = String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));

    for (const word of words) {
      counts.set(word, (counts.get(word) || 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, take)
    .map(([keyword, count]) => ({ keyword, count }));
}

router.get("/dashboard/overview", async (req, res) => {
  try {
    const [artifactCount, kingCount, sessions] = await Promise.all([
      Artifact.countDocuments(),
      King.countDocuments(),
      UserSession.find().sort({ createdAt: -1 }).lean(),
    ]);

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    const totalSessions = sessions.length;
    const activeSessions = sessions.filter((s) => s.is_active).length;
    const endedSessions = totalSessions - activeSessions;

    const todaySessions = sessions.filter((s) => {
      const base = new Date(s.start_time || s.createdAt || now);
      return base >= startOfToday && base < endOfToday;
    });

    const todaySessionCount = todaySessions.length;
    const todaySales = todaySessions.reduce(
      (sum, s) => sum + Number(s.price || 0),
      0,
    );

    const totalRevenue = sessions.reduce(
      (sum, s) => sum + Number(s.price || 0),
      0,
    );
    const avgSessionValue = totalSessions ? totalRevenue / totalSessions : 0;

    const revenueByLanguage = sessions.reduce(
      (acc, s) => {
        const lang = s.language === "si" ? "si" : "en";
        acc[lang] += Number(s.price || 0);
        return acc;
      },
      { en: 0, si: 0 },
    );

    const recentMonths = [];
    const cursor = new Date(now.getFullYear(), now.getMonth(), 1);
    for (let i = 0; i < 6; i += 1) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
      recentMonths.unshift(key);
      cursor.setMonth(cursor.getMonth() - 1);
    }

    const monthMap = new Map(
      recentMonths.map((key) => [
        key,
        { month: monthLabel(key), sessions: 0, sales: 0 },
      ]),
    );

    for (const s of sessions) {
      const key = toMonthKey(s.createdAt || s.start_time || now);
      if (monthMap.has(key)) {
        const item = monthMap.get(key);
        item.sessions += 1;
        item.sales += Number(s.price || 0);
      }
    }

    const monthly = Array.from(monthMap.values());

    const ratingBreakdownBase = [1, 2, 3, 4, 5].map((rating) => ({
      rating,
      count: 0,
    }));

    let ratedCount = 0;
    let ratingSum = 0;

    sessions.forEach((s) => {
      const star = Number(s.star_rating);
      if (!Number.isNaN(star) && star > 0) {
        const bucket = Math.max(1, Math.min(5, Math.round(star)));
        ratingBreakdownBase[bucket - 1].count += 1;
        ratedCount += 1;
        ratingSum += star;
      }
    });

    const allFeedbackEntries = [];
    const feedbackDetails = [];

    sessions.forEach((s) => {
      const feedbacks = Array.isArray(s.feedbacks) ? s.feedbacks : [];
      if (!feedbacks.length) return;

      feedbackDetails.push({
        session_id: s.session_id,
        is_active: !!s.is_active,
        star_rating: s.star_rating ?? null,
        language: s.language || "en",
        start_time: s.start_time,
        end_time: s.end_time,
        price: Number(s.price || 0),
        feedbacks,
        feedback_count: feedbacks.length,
      });

      feedbacks.forEach((f) => {
        allFeedbackEntries.push(String(f));
      });
    });

    const topKeywords = summarizeKeywords(allFeedbackEntries, 8);

    const recentFeedbacks = feedbackDetails
      .flatMap((item) =>
        item.feedbacks.map((feedback) => ({
          session_id: item.session_id,
          feedback,
          star_rating: item.star_rating,
          is_active: item.is_active,
        })),
      )
      .slice(-12)
      .reverse();

    const avgRating = ratedCount ? ratingSum / ratedCount : 0;

    return res.json({
      success: true,
      data: {
        counts: {
          artifacts: artifactCount,
          kings: kingCount,
          sessions: totalSessions,
          active_sessions: activeSessions,
          ended_sessions: endedSessions,
          today_sessions: todaySessionCount,
        },
        sales: {
          total_revenue: totalRevenue,
          average_session_value: avgSessionValue,
          today_sales: todaySales,
          revenue_by_language: revenueByLanguage,
          monthly,
        },
        feedback: {
          total_feedbacks: allFeedbackEntries.length,
          sessions_with_feedback: feedbackDetails.length,
          average_rating: avgRating,
          rating_breakdown: ratingBreakdownBase,
          top_keywords: topKeywords,
          recent_feedbacks: recentFeedbacks,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error generating dashboard overview",
      error: error.message,
    });
  }
});

router.get("/dashboard/feedbacks", async (req, res) => {
  try {
    const sessions = await UserSession.find({
      feedbacks: { $exists: true, $not: { $size: 0 } },
    })
      .sort({ createdAt: -1 })
      .lean();

    const feedbackItems = sessions.map((s) => ({
      session_id: s.session_id,
      language: s.language || "en",
      is_active: !!s.is_active,
      star_rating: s.star_rating ?? null,
      feedback_count: Array.isArray(s.feedbacks) ? s.feedbacks.length : 0,
      feedbacks: Array.isArray(s.feedbacks) ? s.feedbacks : [],
      start_time: s.start_time,
      end_time: s.end_time,
      price: Number(s.price || 0),
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));

    return res.json({
      success: true,
      data: {
        total_sessions_with_feedback: feedbackItems.length,
        total_feedback_entries: feedbackItems.reduce(
          (sum, item) => sum + item.feedback_count,
          0,
        ),
        items: feedbackItems,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching feedback details",
      error: error.message,
    });
  }
});

export default router;
