import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Repousse</h1>
        <p className="text-muted-foreground text-lg max-w-md">
          Plateforme de gestion des distributions végétales et des projets de plantation.
        </p>
      </div>

      <div className="flex gap-4">
        <Link
          href="/auth/login"
          className="bg-primary text-primary-foreground rounded-md px-6 py-3 font-medium hover:opacity-90 transition-opacity"
        >
          Se connecter
        </Link>
        <Link
          href="https://www.helloasso.com"
          target="_blank"
          rel="noopener noreferrer"
          className="border border-border rounded-md px-6 py-3 font-medium hover:bg-accent transition-colors"
        >
          Adhérer à Repousse
        </Link>
      </div>
    </main>
  );
}
