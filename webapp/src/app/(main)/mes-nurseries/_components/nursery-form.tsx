"use client";

import { useState } from "react";

import { useForm } from "@tanstack/react-form";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import * as z from "zod";

import { AdresseSearchBox } from "@/app/(main)/admin/projets-plantation/_components/adresse-search-box";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Nursery, NurseryAttrs } from "@/types/nursery";
import type { Taxon } from "@/types/taxon";

const plantSchema = z.object({
  taxon_id: z.string().min(1, "Choisissez une espèce"),
  quantity: z.number().int().min(0, "La quantité ne peut pas être négative"),
  note: z.string(),
});

const nurserySchema = z.object({
  name: z.string().trim().min(2, "Le nom doit faire au moins 2 caractères"),
  notes: z.string(),
  address: z.string(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  plants: z.array(plantSchema),
});

type NurseryFormValues = z.infer<typeof nurserySchema>;

function toFormValues(nursery: Nursery | null): NurseryFormValues {
  return {
    name: nursery?.name ?? "",
    notes: nursery?.notes ?? "",
    address: nursery?.address ?? "",
    lat: nursery?.lat ?? null,
    lng: nursery?.lng ?? null,
    plants: (nursery?.plants ?? []).map((p) => ({
      taxon_id: p.taxon_id,
      quantity: p.quantity,
      note: p.note ?? "",
    })),
  };
}

function toAttrs(values: NurseryFormValues): NurseryAttrs {
  return {
    name: values.name.trim(),
    notes: values.notes.trim() || null,
    address: values.address.trim() || null,
    lat: values.lat,
    lng: values.lng,
    plants: values.plants.map((p) => ({
      taxon_id: p.taxon_id,
      quantity: p.quantity,
      note: p.note.trim() || null,
    })),
  };
}

export interface NurseryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = creating a new nursery. */
  nursery: Nursery | null;
  taxa: Taxon[];
  onSubmit: (attrs: NurseryAttrs) => Promise<void> | void;
}

export function NurseryForm({ open, onOpenChange, nursery, taxa, onSubmit }: NurseryFormProps) {
  const form = useForm({
    defaultValues: toFormValues(nursery),
    validators: { onChange: nurserySchema },
    onSubmit: async ({ value }) => {
      try {
        await onSubmit(toAttrs(value));
        toast.success(nursery ? "Nurserie mise à jour." : "Nurserie créée.");
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Échec de l'enregistrement.");
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{nursery ? "Modifier la nurserie" : "Nouvelle nurserie"}</DialogTitle>
          <DialogDescription>
            Un lieu de réserve où vous conservez de jeunes plants avant leur distribution.
          </DialogDescription>
        </DialogHeader>

        <form
          id="nursery-form"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field name="name">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Nom</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      placeholder="Serre du jardin"
                      value={field.state.value}
                      aria-invalid={isInvalid}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="address">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Adresse</FieldLabel>
                  <AdresseSearchBox
                    id={field.name}
                    value={field.state.value}
                    placeholder="12 rue des Lilas, 75020 Paris"
                    onInputChange={(value) => {
                      field.handleChange(value);
                      // Typing over a picked suggestion invalidates its
                      // coordinates — drop them until another is selected.
                      form.setFieldValue("lat", null);
                      form.setFieldValue("lng", null);
                    }}
                    onSelect={(suggestion) => {
                      field.handleChange(suggestion.label);
                      form.setFieldValue("lat", suggestion.lat);
                      form.setFieldValue("lng", suggestion.lng);
                    }}
                    onBlur={field.handleBlur}
                  />
                </Field>
              )}
            </form.Field>

            <form.Field name="notes">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Notes générales</FieldLabel>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    rows={3}
                    placeholder="Exposition, arrosage, contraintes d'accès…"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </Field>
              )}
            </form.Field>

            <form.Field name="plants" mode="array">
              {(field) => (
                <Field>
                  <FieldLabel>Plantes disponibles</FieldLabel>
                  <PlantLines field={field} taxa={taxa} />
                </Field>
              )}
            </form.Field>
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" form="nursery-form" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? "Enregistrement…" : "Enregistrer"}
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type PlantsField = {
  state: { value: NurseryFormValues["plants"] };
  pushValue: (value: NurseryFormValues["plants"][number]) => void;
  removeValue: (index: number) => void;
  replaceValue: (index: number, value: NurseryFormValues["plants"][number]) => void;
};

function PlantLines({ field, taxa }: { field: PlantsField; taxa: Taxon[] }) {
  const [pendingTaxonId, setPendingTaxonId] = useState("");
  const lines = field.state.value;
  const usedIds = new Set(lines.map((l) => l.taxon_id));
  const available = taxa.filter((t) => !usedIds.has(t.id));

  function addLine(taxonId: string) {
    if (!taxonId) return;
    field.pushValue({ taxon_id: taxonId, quantity: 0, note: "" });
    setPendingTaxonId("");
  }

  return (
    <div className="space-y-2">
      {lines.length === 0 && <p className="text-muted-foreground text-xs">Aucune plante déclarée pour l'instant.</p>}

      {lines.map((line, index) => {
        const taxon = taxa.find((t) => t.id === line.taxon_id);
        return (
          <div key={line.taxon_id} className="flex flex-wrap items-center gap-2 rounded-lg border p-2">
            <span className="min-w-0 flex-1 truncate text-sm">{taxon?.common_name ?? line.taxon_id}</span>
            <Input
              type="number"
              min={0}
              aria-label={`Quantité pour ${taxon?.common_name ?? line.taxon_id}`}
              className="w-24"
              value={line.quantity}
              onChange={(e) => field.replaceValue(index, { ...line, quantity: Number(e.target.value) || 0 })}
            />
            <Input
              aria-label={`Note pour ${taxon?.common_name ?? line.taxon_id}`}
              className="w-full sm:w-48"
              placeholder="Note"
              value={line.note}
              onChange={(e) => field.replaceValue(index, { ...line, note: e.target.value })}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Retirer ${taxon?.common_name ?? line.taxon_id}`}
              onClick={() => field.removeValue(index)}
            >
              <X className="size-4" />
            </Button>
          </div>
        );
      })}

      <div className="flex items-center gap-2">
        <Select value={pendingTaxonId} onValueChange={addLine} disabled={available.length === 0}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Ajouter une espèce…" />
          </SelectTrigger>
          <SelectContent>
            {available.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.common_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Plus className="size-4 shrink-0 text-muted-foreground" />
      </div>
    </div>
  );
}
