export default function EncyclopediePage() {
  return (
    <div className="@container/main flex flex-col gap-6">
      <div>
        <h1 className="font-semibold text-2xl">Encyclopédie</h1>
        <p className="text-muted-foreground text-sm">
          Base de connaissances de référence sur les pratiques associatives et végétales.
        </p>
      </div>

      <div className="flex min-h-64 flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center">
        <p className="font-medium text-sm">Contenu à venir</p>
        <p className="text-muted-foreground text-xs">Cette section listera les entrées de l'encyclopédie.</p>
      </div>
    </div>
  );
}
