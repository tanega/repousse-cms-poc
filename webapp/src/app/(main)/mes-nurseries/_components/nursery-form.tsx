"use client";

import { useState } from "react";

import { useForm } from "@tanstack/react-form";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { toast } from "sonner";
import * as z from "zod";

import { AdresseSearchBox } from "@/app/(main)/admin/projets-plantation/_components/adresse-search-box";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import type { Nursery, NurseryAttrs } from "@/types/nursery";
import type { Taxon } from "@/types/taxon";
import { type TaxonRequest, taxonRequestLabel } from "@/types/taxon-request";

import { TaxonRequestDialog } from "./taxon-request-dialog";

// A line is either a reference taxon (`taxon_id`) or a plant awaiting an
// admin's decision (`taxon_request_id`, shown under `label`). Empty strings
// stand for "not set" so the form values stay plain.
const plantSchema = z
  .object({
    taxon_id: z.string(),
    taxon_request_id: z.string(),
    label: z.string(),
    quantity: z.number().int().min(0, "La quantité ne peut pas être négative"),
    note: z.string(),
  })
  .refine((p) => p.taxon_id || p.taxon_request_id, { message: "Choisissez une espèce", path: ["taxon_id"] });

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
      taxon_id: p.taxon_id ?? "",
      taxon_request_id: p.taxon_request_id ?? "",
      label: p.taxon_request ? taxonRequestLabel(p.taxon_request) : "",
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
      taxon_id: p.taxon_id || null,
      taxon_request_id: p.taxon_id ? null : p.taxon_request_id || null,
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

const lineKey = (line: NurseryFormValues["plants"][number]) => line.taxon_id || `request-${line.taxon_request_id}`;

function PlantLines({ field, taxa }: { field: PlantsField; taxa: Taxon[] }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [requestOpen, setRequestOpen] = useState(false);
  const lines = field.state.value;
  const usedIds = new Set(lines.map((l) => l.taxon_id));
  const available = taxa.filter((t) => !usedIds.has(t.id));

  function addLine(taxonId: string) {
    field.pushValue({ taxon_id: taxonId, taxon_request_id: "", label: "", quantity: 0, note: "" });
    setPickerOpen(false);
    setSearch("");
  }

  function addRequestedLine(request: TaxonRequest) {
    // An open request with the same name is shared between members: don't add it twice.
    if (lines.some((l) => l.taxon_request_id === request.id)) return;
    field.pushValue({
      taxon_id: "",
      taxon_request_id: request.id,
      label: taxonRequestLabel(request),
      quantity: 0,
      note: "",
    });
  }

  return (
    <div className="space-y-2">
      {lines.length === 0 && <p className="text-muted-foreground text-xs">Aucune plante déclarée pour l'instant.</p>}

      {lines.map((line, index) => {
        const name = line.taxon_id
          ? (taxa.find((t) => t.id === line.taxon_id)?.common_name ?? line.taxon_id)
          : line.label || "Plante en attente";
        return (
          <div key={lineKey(line)} className="flex flex-wrap items-center gap-2 rounded-lg border p-2">
            <span className="flex min-w-0 flex-1 items-center gap-2 text-sm">
              <span className="truncate">{name}</span>
              {!line.taxon_id && (
                <Badge variant="outline" className="shrink-0 text-[10px] text-amber-600 dark:text-amber-400">
                  En attente de validation
                </Badge>
              )}
            </span>
            <Input
              type="number"
              min={0}
              aria-label={`Quantité pour ${name}`}
              className="w-24"
              value={line.quantity}
              onChange={(e) => field.replaceValue(index, { ...line, quantity: Number(e.target.value) || 0 })}
            />
            <Input
              aria-label={`Note pour ${name}`}
              className="w-full sm:w-48"
              placeholder="Note"
              value={line.note}
              onChange={(e) => field.replaceValue(index, { ...line, note: e.target.value })}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Retirer ${name}`}
              onClick={() => field.removeValue(index)}
            >
              <X className="size-4" />
            </Button>
          </div>
        );
      })}

      <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={pickerOpen}
            className="w-full justify-between font-normal text-muted-foreground"
          >
            Ajouter une espèce…
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-0">
          <Command>
            <CommandInput placeholder="Rechercher une plante…" value={search} onValueChange={setSearch} />
            <CommandList>
              <CommandEmpty>Aucune plante ne correspond.</CommandEmpty>
              <CommandGroup>
                {available.map((t) => (
                  <CommandItem
                    key={t.id}
                    value={`${t.common_name} ${t.scientific_name ?? ""}`}
                    onSelect={() => addLine(t.id)}
                  >
                    <Check className="size-4 opacity-0" />
                    <span className="truncate">{t.common_name}</span>
                    {t.scientific_name && (
                      <span className="ml-auto truncate pl-2 text-muted-foreground text-xs italic">
                        {t.scientific_name}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            <div className="border-t p-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  setPickerOpen(false);
                  setRequestOpen(true);
                }}
              >
                <Plus className="size-4" />
                Demander l'ajout d'une plante
              </Button>
            </div>
          </Command>
        </PopoverContent>
      </Popover>

      {requestOpen && (
        <TaxonRequestDialog
          open={requestOpen}
          onOpenChange={setRequestOpen}
          initialName={search}
          onCreated={(request) => {
            addRequestedLine(request);
            setSearch("");
          }}
        />
      )}
    </div>
  );
}
