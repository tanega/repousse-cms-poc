export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  /** Webapp-relative path the notification points to. */
  link: string | null;
  payload: Record<string, unknown>;
  read_at: string | null;
  inserted_at: string;
}
