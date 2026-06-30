export type UserStatus = "active" | "suspended";
export type ProfileType = "volunteer" | "adoptant" | "host_family" | "admin";
export type EventStatus = "draft" | "published" | "closed";
export type ReservationStatus = "confirmed" | "cancelled" | "no_show" | "validated";
export type PublicationStatus = "private" | "public" | "unpublished";
export type ProjectRole = "admin" | "editor" | "reader";

export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  membership_year: number | null;
  status: UserStatus;
  last_seen_at: string | null;
}

export interface UserProfile {
  id: string;
  user_id: string;
  profile_type: ProfileType;
  hosting_capacity: number | null;
  hosting_address: string | null;
}

export interface DistributionEvent {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  status: EventStatus;
  location: string | null;
  published_at: string | null;
  closed_at: string | null;
}

export interface DistributionSlot {
  id: string;
  event_id: string;
  date: string;
  start_time: string;
  end_time: string;
}

export interface Stock {
  id: string;
  event_id: string;
  taxon_id: string;
  quantity: number | null;
  reserved_quantity: number;
}

export interface Reservation {
  id: string;
  user_id: string;
  event_id: string;
  slot_id: string;
  status: ReservationStatus;
  notes: string | null;
}

export interface Project {
  id: string;
  title: string;
  description: string | null;
  address: string | null;
  area_sqm: number | null;
  publication_status: PublicationStatus;
  inserted_at: string;
}

export interface TaxonCategory {
  id: string;
  name: string;
  slug: string;
}

export interface Taxon {
  id: string;
  scientific_name: string | null;
  common_name: string | null;
  is_non_taxonomic: boolean;
  level: "genus" | "species" | "variety";
  category_id: string;
  parent_id: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

export interface ApiError {
  error: string;
  details?: Record<string, string[]>;
}
