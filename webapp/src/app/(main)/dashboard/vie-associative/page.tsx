import { AdherentsParAnnee } from "./_components/adherents-par-annee";
import { AdherentsParProfil } from "./_components/adherents-par-profil";
import { Arbres2025 } from "./_components/arbres-2025";
import { ArbresCumules } from "./_components/arbres-cumules";
import { ArbresParAnnee } from "./_components/arbres-par-annee";
import { Co2Banner, KpiCards } from "./_components/kpi-cards";
import { ParCategorie } from "./_components/par-categorie";
import { Retention } from "./_components/retention";

export default function VieAssociativePage() {
  return (
    <div className="@container/main flex flex-col gap-8">
      <div>
        <h1 className="font-semibold text-2xl">Vie associative</h1>
        <p className="text-muted-foreground text-sm">Vue d'ensemble de l'activité et de l'impact de l'association</p>
      </div>

      <KpiCards />
      <Co2Banner />

      {/* Section Arbres */}
      <section className="flex flex-col gap-4">
        <div className="border-b border-border pb-3">
          <h2 className="font-semibold text-lg">Arbres plantés</h2>
          <p className="text-muted-foreground text-sm">
            Suivi de l'impact environnemental — évolution des plants distribués dans le temps et par catégorie végétale.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <ArbresCumules />
          <ArbresParAnnee />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Arbres2025 />
          <ParCategorie />
        </div>
      </section>

      {/* Section Adhérents */}
      <section className="flex flex-col gap-4">
        <div className="border-b border-border pb-3">
          <h2 className="font-semibold text-lg">Adhérents</h2>
          <p className="text-muted-foreground text-sm">
            Dynamique du réseau associatif — évolution du nombre de membres, répartition par profil d'engagement et taux de renouvellement.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <AdherentsParAnnee />
          <AdherentsParProfil />
        </div>
        <Retention />
      </section>

      <p className="pb-2 text-center text-muted-foreground text-xs">Données de démonstration — rafraîchissement quotidien automatique (à venir)</p>
    </div>
  );
}
