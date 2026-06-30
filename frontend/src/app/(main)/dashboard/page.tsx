import { LogoutButton } from "@/components/logout-button";

export default function DashboardPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground mt-1">Bienvenue sur la plateforme Repousse.</p>
        </div>
        <LogoutButton />
      </div>
    </div>
  );
}
