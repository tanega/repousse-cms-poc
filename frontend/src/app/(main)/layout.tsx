import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("hanko")?.value;
  if (!token) {
    redirect("/auth/login");
  }
  return <>{children}</>;
}
