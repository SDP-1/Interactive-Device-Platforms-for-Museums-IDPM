export interface Artifact {
  _id?: string;
  artifact_id?: string;
  title_en: string;
  title_si: string;
  origin_en: string;
  origin_si: string;
  year: string;
  category_en: string;
  category_si: string;
  description_en: string;
  description_si: string;
  material_en?: string | null;
  material_si?: string | null;
  dimensions_en?: string | null;
  dimensions_si?: string | null;
  culturalSignificance_en?: string | null;
  culturalSignificance_si?: string | null;
  gallery_en?: string | null;
  gallery_si?: string | null;
  imageUrls: string[];
  created_at?: string;
  updated_at?: string;
}
