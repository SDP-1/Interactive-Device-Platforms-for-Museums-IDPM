export interface UserSession {
  _id?: string;
  session_id: string;
  duration_hours: number;
  start_time: string; // ISO
  end_time: string; // ISO
  language: 'en' | 'si';
  price: number;
  is_active: boolean;
  star_rating?: number;
  feedbacks: string[];
  extended_time_hours?: number;
  extended_until?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
