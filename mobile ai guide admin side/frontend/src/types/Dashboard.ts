export interface DashboardMonthlyPoint {
  month: string;
  sessions: number;
  sales: number;
  days?: { day: number; sessions: number; sales: number }[];
}

export interface RatingBreakdownItem {
  rating: number;
  count: number;
}



export interface RecentFeedbackItem {
  session_id: string;
  feedback: string;
  star_rating?: number | null;
  is_active: boolean;
}

export interface DashboardOverview {
  counts: {
    artifacts: number;
    kings: number;
    sessions: number;
    active_sessions: number;
    ended_sessions: number;
    today_sessions: number;
    featured_exhibits?: number;
    tours?: number;
  };
  sales: {
    total_revenue: number;
    average_session_value: number;
    today_sales: number;
    revenue_by_language: {
      en: number;
      si: number;
    };
    monthly: DashboardMonthlyPoint[];
  };
  feedback: {
    total_feedbacks: number;
    sessions_with_feedback: number;
    average_rating: number;
    rating_breakdown: RatingBreakdownItem[];
    recent_feedbacks: RecentFeedbackItem[];
  };
  featured_exhibits?: {
    total: number;
    items: FeaturedExhibitSummary[];
  };
  tours?: {
    total: number;
    active: number;
    average_duration: number;
    items: TourSummary[];
  };
}

export interface FeaturedExhibitSummary {
  id?: string;
  name: string;
  artifact_count: number;
  estimated_visit_minutes: number;
}

export interface TourSummary {
  id?: string;
  name: string;
  duration_minutes: number;
  points: number;
  is_active?: boolean;
}

export interface FeedbackItem {
  session_id: string;
  language: "en" | "si";
  is_active: boolean;
  star_rating?: number | null;
  feedback_count: number;
  feedbacks: string[];
  start_time?: string;
  end_time?: string;
  price: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardFeedbackResponse {
  total_sessions_with_feedback: number;
  total_feedback_entries: number;
  items: FeedbackItem[];
}
