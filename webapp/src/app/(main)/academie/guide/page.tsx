export default function GuidePage() {
  return (
    <div className="@container/main flex flex-col gap-6">
      <div>
        <h1 className="font-semibold text-2xl">Guide</h1>
        <p className="text-muted-foreground text-sm">
          Guides pratiques pour accompagner les membres dans leurs activités.
        </p>
      </div>

      <div className="flex min-h-64 flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center">
        <p className="font-medium text-sm">Contenu à venir</p>
        <p className="text-muted-foreground text-xs">Cette section listera les guides disponibles.</p>
      </div>
    </div>
  );
}
