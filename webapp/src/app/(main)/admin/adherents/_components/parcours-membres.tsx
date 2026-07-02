import { ArrowRight, Home, ShieldCheck, TreePine, UserCheck, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Step = {
  label: string;
  detail?: string;
};

type Journey = {
  profile: string;
  description: string;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  steps: Step[];
};

const journeys: Journey[] = [
  {
    profile: "Bénévole",
    description: "Profil par défaut — attribué à tout nouveau compte.",
    icon: Users,
    colorClass: "text-muted-foreground",
    bgClass: "bg-muted/60",
    borderClass: "border-border",
    steps: [
      { label: "Inscription", detail: "Via HelloAsso ou formulaire" },
      { label: "Activation", detail: "Confirmation par email" },
      { label: "Onboarding", detail: "Profil Bénévole pré-coché, complétion facultative" },
      { label: "Espace membre", detail: "Calendrier, ateliers, actualités" },
      { label: "Évolution", detail: "Ajout d'un second profil si souhaité" },
    ],
  },
  {
    profile: "Adoptant",
    description: "Auto-sélectionnable — débloque réservations et projets.",
    icon: TreePine,
    colorClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-500/8",
    borderClass: "border-emerald-500/20",
    steps: [
      { label: "Sélection du profil", detail: "Depuis Paramètres → Profil" },
      { label: "Complétion", detail: "Localisation, type d'espace, espèces souhaitées" },
      { label: "Accès débloqué", detail: "Réservation de plants, création de projets" },
      { label: "Réservation", detail: "Lors d'une distribution (EP-01)" },
      { label: "Cycle de plantation", detail: "Retrait → Plantation → Suivi → Rapport" },
    ],
  },
  {
    profile: "Famille d'accueil",
    description: "Auto-sélectionnable — rôle logistique pour la conservation des plants.",
    icon: Home,
    colorClass: "text-violet-600 dark:text-violet-400",
    bgClass: "bg-violet-500/8",
    borderClass: "border-violet-500/20",
    steps: [
      { label: "Sélection du profil", detail: "Depuis Paramètres → Profil" },
      { label: "Champs spécifiques", detail: "Capacité, espèces acceptées, disponibilités" },
      { label: "Visibilité coordinateurs", detail: "Profil consultable depuis l'admin" },
      { label: "Assignation", detail: "Lot de plants attribué par un coordinateur" },
      { label: "Cycle d'hébergement", detail: "Accueil → Suivi → Remise lors d'un atelier" },
    ],
  },
];

function StepDot({ index, colorClass }: { index: number; colorClass: string }) {
  return (
    <div
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-full border-2 bg-background text-[10px] font-semibold",
        colorClass === "text-muted-foreground"
          ? "border-border text-muted-foreground"
          : colorClass.replace("text-", "border-").replace("dark:", "dark:border-") + " " + colorClass,
      )}
    >
      {index + 1}
    </div>
  );
}

export function ParcoursMembres() {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Parcours utilisateurs
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {journeys.map((journey) => {
          const Icon = journey.icon;
          return (
            <Card key={journey.profile} className={cn("border", journey.borderClass)}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className={cn("flex size-7 items-center justify-center rounded-md", journey.bgClass)}>
                    <Icon className={cn("size-4", journey.colorClass)} />
                  </div>
                  <span>{journey.profile}</span>
                </CardTitle>
                <p className="text-muted-foreground text-xs leading-snug">{journey.description}</p>
              </CardHeader>
              <CardContent className="pt-0">
                <ol className="space-y-2">
                  {journey.steps.map((step, i) => (
                    <li key={step.label}>
                      <div className="flex items-start gap-2.5">
                        <StepDot index={i} colorClass={journey.colorClass} />
                        <div className="min-w-0 pt-0.5">
                          <p className="font-medium text-sm leading-tight">{step.label}</p>
                          {step.detail && (
                            <p className="text-muted-foreground text-xs leading-snug">{step.detail}</p>
                          )}
                        </div>
                      </div>
                      {i < journey.steps.length - 1 && (
                        <div className="ml-2 mt-0.5 flex h-3 items-center">
                          <div className="ml-[8px] h-full w-px bg-border" />
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
