"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { CheckCircle2, Sprout, UserRound, X } from "lucide-react";

import { type GuestIdentity, GuestIdentityStep } from "@/components/guest-account/guest-identity-step";
import { StepperHeader, type StepperStep } from "@/components/guest-account/stepper-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useHankoSession } from "@/lib/auth/use-hanko-session";

import { taxons } from "../../admin/especes-vegetales/_components/data";
import { projetPlantationCollection } from "../../admin/projets-plantation/_components/collection";
import { CURRENT_USER } from "../../admin/projets-plantation/_components/current-user";
import { NATURES_GESTION, type NatureGestion, slugify } from "../../admin/projets-plantation/_components/data";

type FormValues = {
  nom: string;
  description: string;
  natureGestion: NatureGestion;
  adresse: string;
  surfaceM2: string;
  natureSol: string;
  especeIds: string[];
};

const STEPPER_STEPS: StepperStep[] = [
  { id: "projet", label: "Projet", description: "Informations générales", icon: <Sprout className="size-4" /> },
  { id: "identite", label: "Coordonnées", description: "E-mail et compte", icon: <UserRound className="size-4" /> },
];

export function ProjetPlantationPublicForm() {
  const router = useRouter();
  const { isAuthenticated } = useHankoSession();

  const [step, setStep] = useState<"projet" | "identite" | "confirmation">("projet");
  const [values, setValues] = useState<FormValues>({
    nom: "",
    description: "",
    natureGestion: "Individuelle",
    adresse: "",
    surfaceM2: "",
    natureSol: "",
    especeIds: [],
  });

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function addEspece(taxonId: string) {
    if (!taxonId || values.especeIds.includes(taxonId)) return;
    set("especeIds", [...values.especeIds, taxonId]);
  }

  function removeEspece(taxonId: string) {
    set(
      "especeIds",
      values.especeIds.filter((id) => id !== taxonId),
    );
  }

  const canSubmit = values.nom.trim().length > 0;

  function createProjet(identity: { nom: string; email: string }) {
    const record = {
      nom: values.nom.trim(),
      description: values.description.trim(),
      natureGestion: values.natureGestion,
      adresse: values.adresse.trim(),
      surfaceM2: values.surfaceM2 === "" ? null : Number(values.surfaceM2),
      natureSol: values.natureSol.trim(),
      especeIds: values.especeIds,
    };
    const id = slugify(record.nom) || crypto.randomUUID();
    projetPlantationCollection.insert({
      id,
      lat: null,
      lng: null,
      statut: "Privé",
      createurNom: identity.nom,
      membres: [{ id: crypto.randomUUID(), nom: identity.nom, email: identity.email, role: "Administrateur" }],
      invitations: [],
      medias: [],
      journal: [],
      createdAt: new Date().toISOString().slice(0, 10),
      publishedAt: null,
      ...record,
    });
    return id;
  }

  function handleContinue() {
    if (!canSubmit) return;
    if (isAuthenticated === false) {
      setStep("identite");
      return;
    }
    // Authenticated (or session status not yet known): keep the previous
    // one-step behavior, identical to the admin create form.
    const id = createProjet(CURRENT_USER);
    router.push(`/projets-plantation/${id}`);
  }

  function handleGuestIdentityReady(identity: GuestIdentity) {
    const id = createProjet(identity);
    if (identity.viaLogin) {
      // A real Hanko session now exists — the (gated) project page is reachable.
      router.push(`/projets-plantation/${id}`);
    } else {
      setStep("confirmation");
    }
  }

  const availableTaxons = taxons.filter((t) => t.niveau !== "Genre" && !values.especeIds.includes(t.id));

  if (step === "confirmation") {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="size-4 text-green-600" />
              Projet créé
            </CardTitle>
            <CardDescription className="text-xs">
              Votre projet « {values.nom.trim()} » a été enregistré en statut Privé. Un compte Repousse a été créé
              automatiquement — vous recevrez un e-mail avec la marche à suivre pour vous connecter et gérer votre
              projet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/auth/v2/login">Aller à la connexion</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-semibold text-2xl">Proposer un projet de plantation</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Documentez une nouvelle initiative de plantation. Le projet est créé en Privé.
        </p>
      </div>

      {isAuthenticated === false && <StepperHeader steps={STEPPER_STEPS} activeId={step} />}

      {step === "projet" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informations générales</CardTitle>
              <CardDescription className="text-xs">Nom, description et nature de la gestion du projet.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nom">
                  Nom du projet
                  <span className="ml-1 text-destructive">*</span>
                </Label>
                <Input
                  id="nom"
                  placeholder="ex : Verger partagé des Coteaux"
                  value={values.nom}
                  onChange={(e) => set("nom", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Présentation du projet, objectifs, contexte…"
                  rows={4}
                  value={values.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Nature de la gestion</Label>
                <RadioGroup
                  value={values.natureGestion}
                  onValueChange={(v) => set("natureGestion", v as NatureGestion)}
                  className="flex gap-4"
                >
                  {NATURES_GESTION.map((n) => (
                    <Label
                      key={n}
                      htmlFor={`nature-${n}`}
                      className="flex cursor-pointer items-center gap-1.5 font-normal text-sm"
                    >
                      <RadioGroupItem id={`nature-${n}`} value={n} />
                      {n}
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Localisation & terrain</CardTitle>
              <CardDescription className="text-xs">Adresse, surface et nature du sol du projet.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adresse">Adresse</Label>
                <Input
                  id="adresse"
                  placeholder="ex : 12 chemin des Coteaux, 69008 Lyon"
                  value={values.adresse}
                  onChange={(e) => set("adresse", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="surfaceM2">Surface approximative (m²)</Label>
                  <Input
                    id="surfaceM2"
                    type="number"
                    min={0}
                    placeholder="ex : 850"
                    value={values.surfaceM2}
                    onChange={(e) => set("surfaceM2", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="natureSol">Nature du sol</Label>
                  <Input
                    id="natureSol"
                    placeholder="ex : Argilo-calcaire"
                    value={values.natureSol}
                    onChange={(e) => set("natureSol", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Espèces préférentielles</CardTitle>
              <CardDescription className="text-xs">
                Sélection multiple depuis la liste administrable des taxons.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {values.especeIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {values.especeIds.map((id) => {
                    const taxon = taxons.find((t) => t.id === id);
                    return (
                      <Badge key={id} variant="secondary" className="gap-1 py-1 pr-1 pl-2.5 font-normal">
                        {taxon?.nomCommun ?? id}
                        <button
                          type="button"
                          onClick={() => removeEspece(id)}
                          className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                          aria-label={`Retirer ${taxon?.nomCommun ?? id}`}
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
              <Select value="" onValueChange={addEspece} disabled={availableTaxons.length === 0}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Ajouter une espèce…" />
                </SelectTrigger>
                <SelectContent>
                  {availableTaxons.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nomCommun}
                      {t.nomScientifique ? ` · ${t.nomScientifique}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            <Button className="w-full" disabled={!canSubmit} onClick={handleContinue}>
              {isAuthenticated === false ? "Continuer" : "Créer le projet"}
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/">Annuler</Link>
            </Button>
          </div>
        </div>
      )}

      {step === "identite" && (
        <div className="space-y-3">
          <GuestIdentityStep
            description="L'adresse e-mail est nécessaire pour créer votre projet. Un compte Repousse est créé automatiquement — vous recevrez un e-mail avec la marche à suivre pour vous connecter et le gérer par la suite."
            submitLabel="Créer mon projet"
            onIdentityReady={handleGuestIdentityReady}
          />
          <Button variant="ghost" size="sm" onClick={() => setStep("projet")}>
            ← Modifier les informations du projet
          </Button>
        </div>
      )}
    </div>
  );
}
