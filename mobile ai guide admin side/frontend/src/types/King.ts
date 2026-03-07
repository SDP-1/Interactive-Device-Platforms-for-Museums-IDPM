export interface King {
  _id?: string;
  king_id?: string;
  name_en: string;
  name_si: string;
  capital_en?: string | null;
  capital_si?: string | null;
  biography_en?: string | null;
  biography_si?: string | null;
  aiKnowlageBase_en?: string | null;
  aiKnowlageBase_si?: string | null;
  period_en?: string | null;
  period_si?: string | null;
  imageUrls: string[];
  created_at?: string;
  updated_at?: string;
}
