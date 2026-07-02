import { Taxons } from "./_components/taxons";

export default function EspecesVegétalesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-semibold text-2xl">Espèces végétales</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Catalogue de référence des genres, espèces et variétés gérés par l'association.
        </p>
      </div>
      <Taxons />
    </div>
  );
}
