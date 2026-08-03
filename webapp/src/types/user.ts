export type UserRole = "member" | "admin" | "superadmin";
export type UserStatus = "active" | "suspended";
export type ProfileType = "volunteer" | "adoptant" | "host_family";

export interface UserProfile {
  id: string;
  profile_type: ProfileType;
  engagement_note: string | null;
  address: string | null;
  avatar_url: string | null;
  notification_prefs: Record<string, unknown> | null;
}

export interface CurrentUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: UserRole;
  status: UserStatus;
  taxon_editor: boolean;
  adhesion_active: boolean;
  membership_year: number | null;
  last_seen_at: string | null;
  profiles: UserProfile[];
}
