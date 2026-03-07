import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDashboardFeedbacks } from "../services/dashboardService";

function renderStars(value?: number | null) {
  const rating = Math.max(0, Math.min(5, Math.round(Number(value || 0))));
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, idx) => (
        <span
          key={idx}
          className={idx < rating ? "text-amber-500" : "text-gray-300"}
        >
          {idx < rating ? "★" : "☆"}
        </span>
      ))}
    </div>
  );
}

const FeedbackPage: React.FC = () => {
  const [ratingFilter, setRatingFilter] = useState<
    "all" | "below3" | "exact3" | "above3"
  >("all");
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-feedbacks"],
    queryFn: getDashboardFeedbacks,
    refetchInterval: 30_000,
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    if (ratingFilter === "all") return data.items;

    return data.items.filter((item) => {
      const r = Number(item.star_rating || 0);
      if (ratingFilter === "below3") return r < 3;
      if (ratingFilter === "exact3") return r === 3;
      return r > 3;
    });
  }, [data, ratingFilter]);

  if (isLoading)
    return <div className="p-4 text-gray-600">Loading feedback details...</div>;
  if (error || !data)
    return (
      <div className="p-4 text-red-600">Failed to load feedback details</div>
    );

  const below3Count = data.items.filter(
    (i) => Number(i.star_rating || 0) < 3,
  ).length;
  const exact3Count = data.items.filter(
    (i) => Number(i.star_rating || 0) === 3,
  ).length;
  const above3Count = data.items.filter(
    (i) => Number(i.star_rating || 0) > 3,
  ).length;

  const filterCards = [
    {
      key: "below3" as const,
      label: "Below 3 Stars",
      value: below3Count,
      tone: "bg-red-50 text-red-700 border-red-200",
    },
    {
      key: "exact3" as const,
      label: "3 Stars",
      value: exact3Count,
      tone: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      key: "above3" as const,
      label: "More than 3 Stars",
      value: above3Count,
      tone: "bg-green-50 text-green-700 border-green-200",
    },
  ];

  return (
    <div className="px-3 sm:px-4 lg:px-6 py-4 space-y-4">
      <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-900">User Feedback</h2>
        <p className="text-sm text-gray-500 mt-1">
          Sessions with feedback: {data.total_sessions_with_feedback} · Total
          feedback entries: {data.total_feedback_entries}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {filterCards.map((card) => {
          const active = ratingFilter === card.key;
          return (
            <button
              key={card.key}
              onClick={() =>
                setRatingFilter((prev) =>
                  prev === card.key ? "all" : card.key,
                )
              }
              className={`rounded-xl border p-4 text-left shadow-sm transition ${card.tone} ${active ? "ring-2 ring-offset-1 ring-[#071428]" : ""}`}
            >
              <div className="text-xs font-medium opacity-80">{card.label}</div>
              <div className="text-2xl font-bold mt-1">{card.value}</div>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {filtered.map((item) => (
          <div
            key={item.session_id}
            className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <div>
                <h3 className="font-semibold text-gray-900 break-all">
                  Session: {item.session_id}
                </h3>
                <p className="text-xs text-gray-500">
                  {item.language.toUpperCase()} ·{" "}
                  {item.is_active ? "Live" : "Ended"} · {item.feedback_count}{" "}
                  feedback(s)
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {renderStars(item.star_rating)}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
              <div>
                Start:{" "}
                {item.start_time
                  ? new Date(item.start_time).toLocaleString()
                  : "-"}
              </div>
              <div>
                End:{" "}
                {item.end_time ? new Date(item.end_time).toLocaleString() : "-"}
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 p-3 bg-gray-50/60">
              <div className="text-xs text-gray-500 mb-2">
                Feedback Messages
              </div>
              <ul className="space-y-1.5">
                {item.feedbacks.map((f, i) => (
                  <li key={i} className="text-sm text-gray-700">
                    • {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-xl border border-gray-100 bg-white p-6 text-center text-gray-500">
            No feedback records for selected rating filter.
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackPage;
