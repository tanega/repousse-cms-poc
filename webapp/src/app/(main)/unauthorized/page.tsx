import { redirect } from "next/navigation";

// Old route, replaced by /non-autorise. Kept as a redirect for any stale
// links/bookmarks instead of a hard delete (blocked by sandbox permissions).
export default function Page() {
  redirect("/non-autorise");
}
