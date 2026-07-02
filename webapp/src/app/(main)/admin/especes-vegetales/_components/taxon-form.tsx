"use client";

import { useState } from "react";

import Link from "next/link";

import { ArrowLeft, Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import {
  CATEGORIES,
  flattenTaxons,
  NIVEAUX,
  SOURCES_LIENS,
  taxons,
  type Categorie,
  type LienExterne,
  type NiveauTaxonomique,
} from "./data";

type FormValues = {
  nomCommun: string;
  nomScientifique: string;
  niveau: NiveauTaxonomique;
  categorie: Categorie;
  parentId: string;
  nonTaxonomique: boolean;
  imageUrl: string;
  liens: LienExterne[];
};

const allTaxons = flattenTaxons(taxons);

function LienRow({
  lien,
  onChange,
  onRemove,
}: {
  lien: LienExterne;
  onChange: (l: LienExterne) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Select value={lien.source} onValueChange={(v) => onChange({ ...lien, source: v })}>
        <SelectTrigger className="w-44 shrink-0">
          <SelectValue placeholder="Source" />
        </SelectTrigger>
        <SelectContent>
          {SOURCES_LIENS.map((s) => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        placeholder="https://…"
        value={lien.url}
        onChange={(e) => onChange({ ...lien, url: e.target.value })}
        className="flex-1"
      />
      <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove}>
        <Minus className="size-4" />
      </Button>
    </div>
  );
}

export interface TaxonFormProps {
  mode: "create" | "edit";
  defaultValues?: Partial<FormValues>;
  especeId?: string;
}

export function TaxonForm({ mode, defaultValues, especeId }: TaxonFormProps) {
  const isEdit = mode === "edit";

  const [values, setValues] = useState<FormValues>({
    nomCommun: defaultValues?.nomCommun ?? "",
    nomScientifique: defaultValues?.nomScientifique ?? "",
    niveau: defaultValues?.niveau ?? "Espèce",
    categorie: defaultValues?.categorie ?? "Arbre",
    parentId: defaultValues?.parentId ?? "",
    nonTaxonomique: defaultValues?.nonTaxonomique ?? false,
    imageUrl: defaultValues?.imageUrl ?? "",
    liens: defaultValues?.liens ?? [],
  });

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function addLien() {
    set("liens", [...values.liens, { source: "Wikipedia", url: "" }]);
  }

  function updateLien(i: number, l: LienExterne) {
    const next = [...values.liens];
    next[i] = l;
    set("liens", next);
  }

  function removeLien(i: number) {
    set("liens", values.liens.filter((_, idx) => idx !== i));
  }

  const parentOptions = allTaxons.filter(
    (t) => t.id !== especeId && t.niveau !== "Variété/Cultivar",
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/admin/especes-vegetales">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">
            {isEdit ? "Modifier le taxon" : "Ajouter un taxon"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isEdit
              ? "Modifiez les informations de ce taxon végétal."
              : "Créez une nouvelle entrée dans le catalogue des espèces végétales."}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2/3 */}
        <div className="space-y-6 lg:col-span-2">
          {/* Image */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Image de référence</CardTitle>
              <CardDescription className="text-xs">
                URL d'une photo représentative (Wikimedia Commons, etc.). Champ optionnel.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                {values.imageUrl && (
                  <img
                    src={values.imageUrl}
                    alt="Aperçu"
                    className="size-20 shrink-0 rounded-md border object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}
                <div className="flex-1 space-y-2">
                  <Label htmlFor="imageUrl">
                    URL de l'image
                    <span className="ml-1.5 text-muted-foreground text-xs font-normal">(facultatif)</span>
                  </Label>
                  <Input
                    id="imageUrl"
                    placeholder="https://upload.wikimedia.org/…"
                    value={values.imageUrl}
                    onChange={(e) => set("imageUrl", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Identification */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Identification botanique</CardTitle>
              <CardDescription className="text-xs">
                Noms de référence du taxon dans le catalogue.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 rounded-md border bg-muted/30 px-3 py-2.5">
                <Checkbox
                  id="nonTaxonomique"
                  checked={values.nonTaxonomique}
                  onCheckedChange={(v) => set("nonTaxonomique", !!v)}
                  className="mt-0.5"
                />
                <div>
                  <Label htmlFor="nonTaxonomique" className="cursor-pointer font-medium text-sm">
                    Entrée non-taxonomique
                  </Label>
                  <p className="mt-0.5 text-muted-foreground text-xs">
                    Cochez si le taxon n'a pas de nom latin (ex : "Plante grimpante non identifiée").
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nomCommun">
                  Nom commun de référence
                  <span className="ml-1 text-destructive">*</span>
                </Label>
                <Input
                  id="nomCommun"
                  placeholder="ex : Chêne pédonculé"
                  value={values.nomCommun}
                  onChange={(e) => set("nomCommun", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nomScientifique">
                  Nom scientifique (latin)
                  {!values.nonTaxonomique && (
                    <span className="ml-1 text-destructive">*</span>
                  )}
                  {values.nonTaxonomique && (
                    <span className="ml-1.5 text-muted-foreground text-xs font-normal">(facultatif)</span>
                  )}
                </Label>
                <Input
                  id="nomScientifique"
                  placeholder="ex : Quercus robur"
                  className="italic"
                  value={values.nomScientifique}
                  onChange={(e) => set("nomScientifique", e.target.value)}
                  disabled={values.nonTaxonomique && !values.nomScientifique}
                />
              </div>
            </CardContent>
          </Card>

          {/* Classification */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Classification</CardTitle>
              <CardDescription className="text-xs">
                Position dans la hiérarchie taxonomique et catégorie fonctionnelle.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="niveau">Niveau taxonomique</Label>
                  <Select
                    value={values.niveau}
                    onValueChange={(v) => set("niveau", v as NiveauTaxonomique)}
                  >
                    <SelectTrigger id="niveau">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NIVEAUX.map((n) => (
                        <SelectItem key={n} value={n}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categorie">Catégorie</Label>
                  <Select
                    value={values.categorie}
                    onValueChange={(v) => set("categorie", v as Categorie)}
                  >
                    <SelectTrigger id="categorie">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentId">
                  Taxon parent
                  <span className="ml-1.5 text-muted-foreground text-xs font-normal">(facultatif)</span>
                </Label>
                <Select
                  value={values.parentId || "none"}
                  onValueChange={(v) => set("parentId", v === "none" ? "" : v)}
                >
                  <SelectTrigger id="parentId">
                    <SelectValue placeholder="Aucun (taxon racine)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Aucun (taxon racine) —</SelectItem>
                    {parentOptions.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.nomCommun}
                        {t.nomScientifique ? ` · ${t.nomScientifique}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">
                  Hiérarchie maximale de 3 niveaux : Genre → Espèce → Variété/Cultivar
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Liens externes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Liens vers bases de connaissance</CardTitle>
              <CardDescription className="text-xs">
                Floriscope, Wikipedia, Encyclopedia of Life, DoPI, etc.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {values.liens.map((lien, i) => (
                <LienRow
                  key={i}
                  lien={lien}
                  onChange={(l) => updateLien(i, l)}
                  onRemove={() => removeLien(i)}
                />
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={addLien}
              >
                <Plus className="size-4" />
                Ajouter un lien
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right 1/3 */}
        <div className="space-y-6">
          {isEdit && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Identifiant</span>
                  <code className="font-mono text-xs text-foreground">{especeId}</code>
                </div>
                <Separator />
                <div className="flex justify-between text-muted-foreground">
                  <span>Distributions</span>
                  <span className="font-medium text-foreground tabular-nums">—</span>
                </div>
                <Separator />
                <div className="flex justify-between text-muted-foreground">
                  <span>Projets</span>
                  <span className="font-medium text-foreground tabular-nums">—</span>
                </div>
                <Separator />
                <div className="flex justify-between text-muted-foreground">
                  <span>Dernière modification</span>
                  <span className="font-medium text-foreground">—</span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col gap-2">
            <Button className="w-full">
              {isEdit ? "Enregistrer les modifications" : "Créer le taxon"}
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/admin/especes-vegetales">Annuler</Link>
            </Button>
            {isEdit && (
              <>
                <Separator />
                <Button variant="destructive" className="w-full">
                  Supprimer ce taxon
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
