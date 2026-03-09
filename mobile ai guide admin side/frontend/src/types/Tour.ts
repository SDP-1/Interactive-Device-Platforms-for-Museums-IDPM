export type TourArtifactLink = {
  artifact_id: string;
  title_en?: string | null;
  title_si?: string | null;
  description_en?: string | null;
  description_si?: string | null;
  imageUrl?: string | null;
};

export type TourPoint = {
  artifact_id: string;
  order: number;
  floor?: string | null;
  section?: string | null;
  guidance?: string | null;
  notes?: string | null;
  visited?: boolean;
  artifact?: TourArtifactLink | null;
};

export type TourPathNode = {
  order: number;
  artifact_id: string;
  label: string;
};

export type Tour = {
  _id: string;
  name: string;
  duration_minutes: number;
  floor?: string | null;
  section?: string | null;
  guidance?: string | null;
  is_active?: boolean;
  points: TourPoint[];
  path?: TourPathNode[];
  created_at?: string;
  updated_at?: string;
};

export type NewTour = {
  name: string;
  duration_minutes: number;
  floor?: string;
  section?: string;
  guidance?: string;
  is_active?: boolean;
  points?: TourPoint[];
};
