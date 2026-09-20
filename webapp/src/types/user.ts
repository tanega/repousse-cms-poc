export type UserRole = "member" | "admin" | "superadmin";
export type UserStatus = "active" | "suspended";
export type ProfileType = "volunteer" | "adoptant" | "host_family";
export type ProfileVisibility = "public" | "private";

/** Equipment a Famille d'accueil can declare (mirrors UserProfile.equipment backend-side). */
export type HostingEquipment =
  | "greenhouse"
  | "tarp"
  | "auto_watering"
  | "artificial_light"
  | "cold_frame"
  | "outdoor_ground";

export interface HostedSpecies {
  id: string;
  user_profile_id: string;
  taxon_id: string;
}

export interface UserProfile {
  id: string;
  profile_type: ProfileType;
  engagement_note: string | null;
  address: string | null;
  avatar_url: string | null;
  notification_prefs: Record<string, unknown> | null;
  hosting_capacity: number | null;
  hosting_address: string | null;
  hosting_lat: number | null;
  hosting_lng: number | null;
  hosting_availability: string | null;
  hosting_surface_m2: number | null;
  hosting_equipment: HostingEquipment[];
  hosted_species: HostedSpecies[];
}

export interface CurrentUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: UserRole;
  status: UserStatus;
  taxon_editor: boolean;
  avatar_url: string | null;
  profile_visibility: ProfileVisibility;
  adhesion_active: boolean;
  membership_year: number | null;
  last_seen_at: string | null;
  profiles: UserProfile[];
}
