import { Artifact } from "./Artifact";

export interface FeaturedExhibit {
  _id?: string;
  name: string;
  description?: string | null;
  estimated_visit_minutes?: number;
  artifacts?: Artifact[] | string[];
  order?: string[];
  imageUrl?: string | null;
  created_at?: string;
  updated_at?: string;
}
