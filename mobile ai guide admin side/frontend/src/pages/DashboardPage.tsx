import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getDashboardOverview } from "../services/dashboardService";

const currency = (value: number) => `₨${Math.round(value).toLocaleString()}`;

const DashboardPage: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: getDashboardOverview,
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return <div className="p-4 text-gray-600">Loading dashboard...</div>;
  }

  if (error || !data) {
    return (
      <div className="p-4 text-red-600">Failed to load dashboard data</div>
    );
  }

  const maxMonthlySales = Math.max(
    1,
    ...data.sales.monthly.map((m) => m.sales),
  );
  const ratedSessions = data.feedback.rating_breakdown.reduce(
    (sum, item) => sum + item.count,
    0,
  );
  const positiveRatings = data.feedback.rating_breakdown
    .filter((item) => item.rating >= 4)
    .reduce((sum, item) => sum + item.count, 0);
  const neutralRatings = data.feedback.rating_breakdown
    .filter((item) => item.rating === 3)
    .reduce((sum, item) => sum + item.count, 0);
  const lowRatings = data.feedback.rating_breakdown
    .filter((item) => item.rating <= 2)
    .reduce((sum, item) => sum + item.count, 0);
  const feedbackCoverage = data.counts.sessions
    ? (data.feedback.sessions_with_feedback / data.counts.sessions) * 100
    : 0;

  const stats = [
    {
      label: "Artifacts",
      value: data.counts.artifacts,
      tone: "bg-blue-50 text-blue-700",
    },
    {
      label: "Kings",
      value: data.counts.kings,
      tone: "bg-purple-50 text-purple-700",
    },
    {
      label: "Active Sessions",
      value: data.counts.active_sessions,
      tone: "bg-green-100 text-green-700",
    },
    {
      label: "Today Sessions",
      value: data.counts.today_sessions,
      tone: "bg-cyan-100 text-cyan-700",
    },
    {
      label: "Today Sales",
      value: currency(data.sales.today_sales),
      tone: "bg-amber-100 text-amber-700",
    },
  ];

  const ratingPieData = [...data.feedback.rating_breakdown].sort(
    (a, b) => b.rating - a.rating,
  );
  const totalRated = ratingPieData.reduce((sum, item) => sum + item.count, 0);
  const ratingColors: Record<number, string> = {
    5: "#10B981",
    4: "#22C55E",
    3: "#F59E0B",
    2: "#F97316",
    1: "#EF4444",
  };

  const pieGradient =
    totalRated === 0
      ? "conic-gradient(#E5E7EB 0 100%)"
      : (() => {
          let start = 0;
          const parts = ratingPieData.map((item) => {
            const pct = (item.count / totalRated) * 100;
            const end = start + pct;
            const segment = `${ratingColors[item.rating] || "#9CA3AF"} ${start}% ${end}%`;
            start = end;
            return segment;
          });
          return `conic-gradient(${parts.join(", ")})`;
        })();

  return (
    <div className="px-3 sm:px-4 lg:px-6 py-4 space-y-4">
      <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500">
          Live platform snapshot: sessions, sales, feedback and rating trends.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-xl p-4 ${s.tone}`}>
            <div className="text-xs uppercase tracking-wide opacity-80">
              {s.label}
            </div>
            <div className="text-2xl font-bold mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold mb-3 text-gray-900">
            Monthly Sales Chart
          </h3>
          <div className="space-y-2">
            {data.sales.monthly.map((m) => {
              const width = (m.sales / maxMonthlySales) * 100;
              return (
                <div key={m.month}>
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>{m.month}</span>
                    <span>
                      {currency(m.sales)} · {m.sessions} sessions
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#071428] to-amber-500"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold mb-3 text-gray-900">
            Ratings & Feedback
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg bg-amber-50 p-3">
              <div className="text-xs text-gray-600">Average Rating</div>
              <div className="text-xl font-bold text-amber-700">
                {data.feedback.average_rating.toFixed(1)} / 5
              </div>
            </div>
            <div className="rounded-lg bg-blue-50 p-3">
              <div className="text-xs text-gray-600">Feedback Coverage</div>
              <div className="text-xl font-bold text-blue-700">
                {feedbackCoverage.toFixed(0)}%
              </div>
            </div>
            <div className="rounded-lg bg-red-50 p-3">
              <div className="text-xs text-gray-600">Low Rating Alerts</div>
              <div className="text-xl font-bold text-red-700">{lowRatings}</div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Positive (4★-5★)</span>
                <span>{positiveRatings}</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{
                    width: `${ratedSessions ? (positiveRatings / ratedSessions) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Neutral (3★)</span>
                <span>{neutralRatings}</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500"
                  style={{
                    width: `${ratedSessions ? (neutralRatings / ratedSessions) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Low (1★-2★)</span>
                <span>{lowRatings}</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500"
                  style={{
                    width: `${ratedSessions ? (lowRatings / ratedSessions) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div className="text-xs text-gray-500 pt-1">
              Rated sessions: {ratedSessions} · Feedback entries:{" "}
              {data.feedback.total_feedbacks}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold mb-3 text-gray-900">
            Revenue by Language
          </h3>
          <div className="space-y-3">
            {[
              { label: "English", key: "en" as const, color: "bg-blue-500" },
              { label: "Sinhala", key: "si" as const, color: "bg-indigo-500" },
            ].map((item) => {
              const value = data.sales.revenue_by_language[item.key];
              const total = Math.max(1, data.sales.total_revenue);
              const width = (value / total) * 100;
              return (
                <div key={item.key}>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>{item.label}</span>
                    <span>{currency(value)}</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`${item.color} h-full`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold mb-3 text-gray-900">
            Feedback Summaries
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="flex justify-center">
              <div
                className="w-44 h-44 rounded-full relative"
                style={{ background: pieGradient }}
                aria-label="Feedback star distribution pie chart"
              >
                <div className="absolute inset-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-center">
                  <div>
                    <div className="text-xs text-gray-500">Rated</div>
                    <div className="text-xl font-bold text-gray-900">
                      {totalRated}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {ratingPieData.map((item) => {
                const pct = totalRated
                  ? ((item.count / totalRated) * 100).toFixed(0)
                  : "0";
                return (
                  <div
                    key={item.rating}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor:
                            ratingColors[item.rating] || "#9CA3AF",
                        }}
                      />
                      <span className="text-gray-700">{item.rating} Star</span>
                    </div>
                    <span className="text-gray-500">
                      {item.count} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
