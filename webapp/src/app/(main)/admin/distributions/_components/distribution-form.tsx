"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeft, Minus, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { taxons } from "../../especes-vegetales/_components/data";
import { distributionEventCollection } from "./collection";
import { type Creneau, STATUT_COLORS, type StatutEvenement, type StockEspece, slugify } from "./data";

type FormValues = {
  intitule: string;
  description: string;
  contactGeneral: string;
  imageUrl: string;
  creneaux: Creneau[];
  stock: StockEspece[];
};

function CreneauRow({
  creneau,
  onChange,
  onRemove,
}: {
  creneau: Creneau;
  onChange: (c: Creneau) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex items-start gap-2">
        <div className="grid flex-1 grid-cols-2 gap-2">
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs">Lieu</Label>
            <Input
              placeholder="ex : Jardin partagé du Fort"
              value={creneau.lieu}
              onChange={(e) => onChange({ ...creneau, lieu: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Date</Label>
            <Input type="date" value={creneau.date} onChange={(e) => onChange({ ...creneau, date: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Contact du créneau</Label>
            <Input
              placeholder="ex : Camille (06…)"
              value={creneau.contact}
              onChange={(e) => onChange({ ...creneau, contact: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Heure de début</Label>
            <Input
              type="time"
              value={creneau.heureDebut}
              onChange={(e) => onChange({ ...creneau, heureDebut: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Heure de fin</Label>
            <Input
              type="time"
              value={creneau.heureFin}
              onChange={(e) => onChange({ ...creneau, heureFin: e.target.value })}
            />
          </div>
        </div>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove}>
          <Minus className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function StockRow({
  stock,
  usedTaxonIds,
  onChange,
  onRemove,
}: {
  stock: StockEspece;
  usedTaxonIds: string[];
  onChange: (s: StockEspece) => void;
  onRemove: () => void;
}) {
  const options = taxons.filter((t) => t.id === stock.taxonId || !usedTaxonIds.includes(t.id));
  const inconnue = stock.quantite === null;

  return (
    <div className="flex items-center gap-2">
      <Select value={stock.taxonId} onValueChange={(v) => onChange({ ...stock, taxonId: v })}>
        <SelectTrigger className="w-56 shrink-0">
          <SelectValue placeholder="Espèce" />
        </SelectTrigger>
        <SelectContent>
          {options.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.nomCommun}
              {t.nomScientifique ? ` · ${t.nomScientifique}` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="number"
        min={0}
        placeholder="Quantité"
        className="w-28"
        value={inconnue ? "" : (stock.quantite ?? "")}
        disabled={inconnue}
        onChange={(e) => onChange({ ...stock, quantite: e.target.value === "" ? 0 : Number(e.target.value) })}
      />
      <Label
        htmlFor={`quantite-inconnue-${stock.taxonId}`}
        className="flex shrink-0 cursor-pointer items-center gap-1.5 font-normal text-muted-foreground text-xs"
      >
        <Checkbox
          id={`quantite-inconnue-${stock.taxonId}`}
          checked={inconnue}
          onCheckedChange={(v) => onChange({ ...stock, quantite: v ? null : 0 })}
        />
        Quantité inconnue
      </Label>
      <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove} className="ml-auto">
        <Minus className="size-4" />
      </Button>
    </div>
  );
}

export interface DistributionFormProps {
  mode: "create" | "edit";
  defaultValues?: Partial<FormValues>;
  distributionId?: string;
  statut?: StatutEvenement;
}

export function DistributionForm({ mode, defaultValues, distributionId, statut }: DistributionFormProps) {
  const isEdit = mode === "edit";
  const router = useRouter();

  const [values, setValues] = useState<FormValues>({
    intitule: defaultValues?.intitule ?? "",
    description: defaultValues?.description ?? "",
    contactGeneral: defaultValues?.contactGeneral ?? "",
    imageUrl: defaultValues?.imageUrl ?? "",
    creneaux: defaultValues?.creneaux ?? [],
    stock: defaultValues?.stock ?? [],
  });

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function addCreneau() {
    set("creneaux", [
      ...values.creneaux,
      { id: crypto.randomUUID(), lieu: "", date: "", heureDebut: "", heureFin: "", contact: "" },
    ]);
  }

  function updateCreneau(i: number, c: Creneau) {
    const next = [...values.creneaux];
    next[i] = c;
    set("creneaux", next);
  }

  function removeCreneau(i: number) {
    set(
      "creneaux",
      values.creneaux.filter((_, idx) => idx !== i),
    );
  }

  function addStock() {
    const nextTaxon = taxons.find((t) => !values.stock.some((s) => s.taxonId === t.id));
    if (!nextTaxon) return;
    set("stock", [...values.stock, { taxonId: nextTaxon.id, quantite: 0 }]);
  }

  function updateStock(i: number, s: StockEspece) {
    const next = [...values.stock];
    next[i] = s;
    set("stock", next);
  }

  function removeStock(i: number) {
    set(
      "stock",
      values.stock.filter((_, idx) => idx !== i),
    );
  }

  const canSubmit =
    values.intitule.trim().length > 0 &&
    values.creneaux.every((c) => c.lieu.trim() && c.date && c.heureDebut && c.heureFin);

  function handleSubmit() {
    if (!canSubmit) return;
    const record = {
      intitule: values.intitule.trim(),
      description: values.description.trim(),
      contactGeneral: values.contactGeneral.trim(),
      imageUrl: values.imageUrl || undefined,
      creneaux: values.creneaux,
      stock: values.stock,
    };
    if (isEdit && distributionId) {
      distributionEventCollection.update(distributionId, (draft) => Object.assign(draft, record));
      router.push(`/admin/distributions/${distributionId}`);
    } else {
      const id = slugify(record.intitule) || crypto.randomUUID();
      distributionEventCollection.insert({
        id,
        statut: "Brouillon",
        lienPermanent: id,
        nbInscrits: 0,
        createdAt: new Date().toISOString().slice(0, 10),
        ...record,
      });
      router.push(`/admin/distributions/${id}`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/admin/distributions" aria-label="Retour à la liste des distributions">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">
            {isEdit ? "Modifier l'événement" : "Créer un événement de distribution"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isEdit
              ? "Modifiez les informations, créneaux et stock de cet événement."
              : "Structurez une nouvelle campagne de distribution de végétaux. L'événement est créé en Brouillon."}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2/3 */}
        <div className="space-y-6 lg:col-span-2">
          {/* Infos générales */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informations générales</CardTitle>
              <CardDescription className="text-xs">
                Intitulé et description utilisés dans l'email de publication et la page publique.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="intitule">
                  Intitulé
                  <span className="ml-1 text-destructive">*</span>
                </Label>
                <Input
                  id="intitule"
                  placeholder="ex : Distribution d'automne 2026"
                  value={values.intitule}
                  onChange={(e) => set("intitule", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Présentation de l'événement pour les Adoptants…"
                  rows={4}
                  value={values.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactGeneral">Contact général</Label>
                <Input
                  id="contactGeneral"
                  placeholder="ex : distribution@repousse.org"
                  value={values.contactGeneral}
                  onChange={(e) => set("contactGeneral", e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                {values.imageUrl && (
                  <img
                    src={values.imageUrl}
                    alt="Aperçu"
                    className="size-20 shrink-0 rounded-md border object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
                <div className="flex-1 space-y-2">
                  <Label htmlFor="imageUrl">
                    Image
                    <span className="ml-1.5 text-muted-foreground text-xs font-normal">(facultatif)</span>
                  </Label>
                  <Input
                    id="imageUrl"
                    placeholder="https://…"
                    value={values.imageUrl}
                    onChange={(e) => set("imageUrl", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Créneaux */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Créneaux de distribution</CardTitle>
              <CardDescription className="text-xs">
                Un ou plusieurs créneaux (lieu, date, horaires) parmi lesquels les Adoptants choisissent.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {values.creneaux.map((creneau, i) => (
                <CreneauRow
                  key={creneau.id}
                  creneau={creneau}
                  onChange={(c) => updateCreneau(i, c)}
                  onRemove={() => removeCreneau(i)}
                />
              ))}
              <Button type="button" variant="outline" size="sm" className="w-full" onClick={addCreneau}>
                <Plus className="size-4" />
                Ajouter un créneau
              </Button>
            </CardContent>
          </Card>

          {/* Stock */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Stock d'espèces</CardTitle>
              <CardDescription className="text-xs">
                Espèces disponibles pour cet événement. Stock partagé entre tous les créneaux.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {values.stock.map((stock, i) => (
                <StockRow
                  key={stock.taxonId}
                  stock={stock}
                  usedTaxonIds={values.stock.map((s) => s.taxonId)}
                  onChange={(s) => updateStock(i, s)}
                  onRemove={() => removeStock(i)}
                />
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={addStock}
                disabled={values.stock.length >= taxons.length}
              >
                <Plus className="size-4" />
                Ajouter une espèce
              </Button>
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
                  className={cn("border-0 px-2 py-0.5 text-xs font-normal", STATUT_COLORS[statut ?? "Brouillon"])}
                >
                  {statut ?? "Brouillon"}
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs">
                {isEdit
                  ? "Changez le statut depuis la fiche de l'événement une fois les modifications enregistrées."
                  : "L'événement est créé en Brouillon, non visible par les Adoptants. Publiez-le depuis sa fiche."}
              </p>
              {isEdit && distributionId && (
                <>
                  <Separator />
                  <div className="flex justify-between text-muted-foreground">
                    <span>Lien permanent</span>
                    <code className="font-mono text-xs text-foreground">{distributionId}</code>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            <Button className="w-full" disabled={!canSubmit} onClick={handleSubmit}>
              {isEdit ? "Enregistrer les modifications" : "Créer l'événement"}
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/admin/distributions">Annuler</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
