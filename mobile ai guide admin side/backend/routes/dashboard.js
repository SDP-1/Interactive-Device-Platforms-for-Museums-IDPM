import express from "express";
import Artifact from "../models/Artifact.js";
import King from "../models/King.js";
import UserSession from "../models/UserSession.js";
import FeaturedExhibit from "../models/FeaturedExhibit.js";
import Tour from "../models/Tour.js";

const router = express.Router();

function toMonthKey(dateValue) {
  const d = new Date(dateValue);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  // Return short month name only (no year) to avoid showing dates
  return new Date(year, month - 1, 1).toLocaleString("en-US", {
    month: "short",
  });
}

router.get("/dashboard/overview", async (req, res) => {
  try {
    const [
      artifactCount,
      kingCount,
      sessions,
      featuredCount,
      tourCount,
      featuredList,
      toursList,
    ] = await Promise.all([
      Artifact.countDocuments(),
      King.countDocuments(),
      UserSession.find().sort({ createdAt: -1 }).lean(),
      FeaturedExhibit.countDocuments(),
      Tour.countDocuments(),
      FeaturedExhibit.find().sort({ created_at: -1 }).lean(),
      Tour.find().sort({ created_at: -1 }).lean(),
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

    const monthMap = new Map();

    for (const key of recentMonths) {
      const [yearStr, monthStr] = key.split("-");
      const year = Number(yearStr);
      const month = Number(monthStr); // 1-based
      const daysInMonth = new Date(year, month, 0).getDate();
      const days = Array.from({ length: daysInMonth }, (_, i) => ({
        day: i + 1,
        sessions: 0,
        sales: 0,
      }));

      monthMap.set(key, {
        month: monthLabel(key),
        sessions: 0,
        sales: 0,
        days,
      });
    }

    for (const s of sessions) {
      const date = new Date(s.createdAt || s.start_time || now);
      const key = toMonthKey(date);
      if (monthMap.has(key)) {
        const item = monthMap.get(key);
        item.sessions += 1;
        const sale = Number(s.price || 0);
        item.sales += sale;
        const dayIndex = date.getDate() - 1;
        if (item.days && item.days[dayIndex]) {
          item.days[dayIndex].sessions += 1;
          item.days[dayIndex].sales += sale;
        }
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

    const featuredItems = Array.isArray(featuredList)
      ? featuredList.map((f) => ({
          id: f._id,
          name: f.name,
          artifact_count: Array.isArray(f.artifacts) ? f.artifacts.length : 0,
          estimated_visit_minutes: Number(f.estimated_visit_minutes || 0),
        }))
      : [];

    const tourItems = Array.isArray(toursList)
      ? toursList.map((t) => ({
          id: t._id,
          name: t.name,
          duration_minutes: Number(t.duration_minutes || 0),
          points: Array.isArray(t.points) ? t.points.length : 0,
          is_active: !!t.is_active,
        }))
      : [];

    const activeTours = tourItems.filter((t) => t.is_active).length;
    const avgTourDuration = tourItems.length
      ? tourItems.reduce((s, t) => s + t.duration_minutes, 0) / tourItems.length
      : 0;

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
          featured_exhibits: featuredCount,
          tours: tourCount,
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
          recent_feedbacks: recentFeedbacks,
        },
        featured_exhibits: {
          total: featuredCount,
          items: featuredItems,
        },
        tours: {
          total: tourCount,
          active: activeTours,
          average_duration: avgTourDuration,
          items: tourItems,
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
