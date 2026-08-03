import { redirect } from "next/navigation";

import { APP_CONFIG } from "@/config/app-config";
import { requireRole } from "@/lib/auth/require-role";
import { hasMinRole } from "@/lib/auth/roles";
import { getCurrentUserServer } from "@/server/current-user";

export default async function Page() {
  const user = requireRole(await getCurrentUserServer(), "member");
  redirect(hasMinRole(user.role, "admin") ? APP_CONFIG.defaultPath : "/dashboard/me");
}
