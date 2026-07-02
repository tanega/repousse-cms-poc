"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeft, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { taxons } from "../../especes-vegetales/_components/data";
import { projetPlantationCollection } from "./collection";
import { CURRENT_USER } from "./current-user";
import { NATURES_GESTION, type NatureGestion, STATUT_COLORS, type StatutPublication, slugify } from "./data";

type FormValues = {
  nom: string;
  description: string;
  natureGestion: NatureGestion;
  adresse: string;
  surfaceM2: string;
  natureSol: string;
  especeIds: string[];
};

export interface ProjetFormProps {
  mode: "create" | "edit";
  defaultValues?: Partial<FormValues>;
  projetId?: string;
  statut?: StatutPublication;
}

export function ProjetForm({ mode, defaultValues, projetId, statut }: ProjetFormProps) {
  const isEdit = mode === "edit";
  const router = useRouter();

  const [values, setValues] = useState<FormValues>({
    nom: defaultValues?.nom ?? "",
    description: defaultValues?.description ?? "",
    natureGestion: defaultValues?.natureGestion ?? "Individuelle",
    adresse: defaultValues?.adresse ?? "",
    surfaceM2: defaultValues?.surfaceM2 ?? "",
    natureSol: defaultValues?.natureSol ?? "",
    especeIds: defaultValues?.especeIds ?? [],
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

  function handleSubmit() {
    if (!canSubmit) return;
    const record = {
      nom: values.nom.trim(),
      description: values.description.trim(),
      natureGestion: values.natureGestion,
      adresse: values.adresse.trim(),
      surfaceM2: values.surfaceM2 === "" ? null : Number(values.surfaceM2),
      natureSol: values.natureSol.trim(),
      especeIds: values.especeIds,
    };
    if (isEdit && projetId) {
      projetPlantationCollection.update(projetId, (draft) => Object.assign(draft, record));
      router.push(`/admin/projets-plantation/${projetId}`);
    } else {
      const id = slugify(record.nom) || crypto.randomUUID();
      projetPlantationCollection.insert({
        id,
        lat: null,
        lng: null,
        statut: "Privé",
        createurNom: CURRENT_USER.nom,
        membres: [
          { id: crypto.randomUUID(), nom: CURRENT_USER.nom, email: CURRENT_USER.email, role: "Administrateur" },
        ],
        invitations: [],
        medias: [],
        journal: [],
        createdAt: new Date().toISOString().slice(0, 10),
        publishedAt: null,
        ...record,
      });
      router.push(`/admin/projets-plantation/${id}`);
    }
  }

  const availableTaxons = taxons.filter((t) => t.niveau !== "Genre" && !values.especeIds.includes(t.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/admin/projets-plantation" aria-label="Retour à la liste des projets">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{isEdit ? "Modifier le projet" : "Créer un projet de plantation"}</h1>
          <p className="text-muted-foreground text-sm">
            {isEdit
              ? "Modifiez les informations de ce projet de plantation."
              : "Documentez une nouvelle initiative de plantation. Le projet est créé en Privé."}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2/3 */}
        <div className="space-y-6 lg:col-span-2">
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
        </div>

        {/* Right 1/3 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Statut</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Statut actuel</span>
                <Badge
                  variant="outline"
                  className={cn("border-0 px-2 py-0.5 text-xs font-normal", STATUT_COLORS[statut ?? "Privé"])}
                >
                  {statut ?? "Privé"}
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs">
                {isEdit
                  ? "Changez le statut depuis la fiche du projet une fois les modifications enregistrées."
                  : "Le projet est créé en Privé. Publiez-le depuis sa fiche pour le rendre visible aux membres connectés."}
              </p>
              {isEdit && projetId && (
                <>
                  <Separator />
                  <div className="flex justify-between text-muted-foreground">
                    <span>Identifiant</span>
                    <code className="font-mono text-xs text-foreground">{projetId}</code>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            <Button className="w-full" disabled={!canSubmit} onClick={handleSubmit}>
              {isEdit ? "Enregistrer les modifications" : "Créer le projet"}
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/admin/projets-plantation">Annuler</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
