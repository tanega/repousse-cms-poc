import { redirect } from "next/navigation";

export default function Home() {
  // /dashboard sends each role to its own landing page.
  redirect("/dashboard");
}
