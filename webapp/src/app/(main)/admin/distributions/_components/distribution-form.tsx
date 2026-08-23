"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useLiveQuery } from "@tanstack/react-db";
import { useForm } from "@tanstack/react-form";
import { ArrowLeft, Minus, Plus, X } from "lucide-react";
import { toast } from "sonner";
import * as z from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { Dropzone, DropzoneEmptyState, DropzoneRejectionError, DropzoneZone } from "@/components/ui/dropzone";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  createEvent,
  createSlot,
  createStock,
  deleteSlot,
  deleteStock,
  updateSlot,
  updateStock,
  uploadEventCoverImage,
} from "@/lib/api/distributions";
import { cn } from "@/lib/utils";
import type { DistributionSlot, DistributionStock } from "@/types/distribution";
import { EVENT_STATUS_COLORS, EVENT_STATUS_LABELS, type EventStatus } from "@/types/distribution";

import { taxonCollection } from "../../especes-vegetales/_components/collection";
import { distributionEventCollection, queryClient } from "./collection";

const COVER_IMAGE_MAX_BYTES = 5_000_000;
const COVER_IMAGE_ACCEPT = {
  "image/jpeg": [],
  "image/png": [],
  "image/webp": [],
  "image/gif": [],
};

// Distribution slots are always future/current events, unlike the shared
// DatePicker's birthdate-oriented default range (2010 → today).
const SLOT_DATE_START_MONTH = new Date();
const SLOT_DATE_END_MONTH = new Date(new Date().getFullYear() + 3, 11);

/** Client-only row for the in-progress form; `isNew` decides create vs. update on submit. */
type DraftSlot = Pick<
  DistributionSlot,
  "location_name" | "address" | "date" | "start_time" | "end_time" | "contact"
> & {
  clientId: string;
  id?: string;
  isNew: boolean;
};

type DraftStock = Pick<DistributionStock, "quantity" | "quantity_unknown" | "taxon_id"> & {
  clientId: string;
  id?: string;
  isNew: boolean;
};

const formSchema = z.object({
  title: z.string().trim().min(1, "L'intitulé est requis"),
  description: z.string().trim(),
  general_contact: z.string().trim(),
  slots: z.array(
    z.object({
      clientId: z.string(),
      id: z.string().optional(),
      isNew: z.boolean(),
      location_name: z.string().trim().min(1, "Le lieu est requis"),
      address: z.string().trim().nullable(),
      date: z.string().min(1, "La date est requise"),
      start_time: z.string().min(1, "L'heure de début est requise"),
      end_time: z.string().min(1, "L'heure de fin est requise"),
      contact: z.string().trim().nullable(),
    }),
  ),
  stocks: z.array(
    z.object({
      clientId: z.string(),
      id: z.string().optional(),
      isNew: z.boolean(),
      taxon_id: z.string().min(1),
      quantity: z.number().nullable(),
      quantity_unknown: z.boolean(),
    }),
  ),
});

type FormValues = z.infer<typeof formSchema>;

function SlotRow({
  slot,
  onChange,
  onRemove,
}: {
  slot: DraftSlot;
  onChange: (s: DraftSlot) => void;
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
              value={slot.location_name}
              onChange={(e) => onChange({ ...slot, location_name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Date</Label>
            <DatePicker
              value={slot.date}
              onChange={(v) => onChange({ ...slot, date: v })}
              startMonth={SLOT_DATE_START_MONTH}
              endMonth={SLOT_DATE_END_MONTH}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Contact du créneau</Label>
            <Input
              placeholder="ex : Camille (06…)"
              value={slot.contact ?? ""}
              onChange={(e) => onChange({ ...slot, contact: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Heure de début</Label>
            <Input
              type="time"
              value={slot.start_time}
              onChange={(e) => onChange({ ...slot, start_time: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Heure de fin</Label>
            <Input
              type="time"
              value={slot.end_time}
              onChange={(e) => onChange({ ...slot, end_time: e.target.value })}
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
  taxonOptions,
  usedTaxonIds,
  onChange,
  onRemove,
}: {
  stock: DraftStock;
  taxonOptions: { id: string; common_name: string; scientific_name: string | null }[];
  usedTaxonIds: string[];
  onChange: (s: DraftStock) => void;
  onRemove: () => void;
}) {
  const options = taxonOptions.filter((t) => t.id === stock.taxon_id || !usedTaxonIds.includes(t.id));
  const inconnue = stock.quantity_unknown;

  return (
    <div className="flex items-center gap-2">
      <Select value={stock.taxon_id} onValueChange={(v) => onChange({ ...stock, taxon_id: v })}>
        <SelectTrigger className="w-56 shrink-0">
          <SelectValue placeholder="Espèce" />
        </SelectTrigger>
        <SelectContent>
          {options.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.common_name}
              {t.scientific_name ? ` · ${t.scientific_name}` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="number"
        min={0}
        placeholder="Quantité"
        className="w-28"
        value={inconnue ? "" : (stock.quantity ?? "")}
        disabled={inconnue}
        onChange={(e) => onChange({ ...stock, quantity: e.target.value === "" ? 0 : Number(e.target.value) })}
      />
      <Label
        htmlFor={`quantite-inconnue-${stock.clientId}`}
        className="flex shrink-0 cursor-pointer items-center gap-1.5 font-normal text-muted-foreground text-xs"
      >
        <Checkbox
          id={`quantite-inconnue-${stock.clientId}`}
          checked={inconnue}
          onCheckedChange={(v) => onChange({ ...stock, quantity_unknown: !!v, quantity: v ? null : 0 })}
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
  distributionId?: string;
  status?: EventStatus;
  defaultValues?: {
    title: string;
    description: string;
    general_contact: string;
    image_url: string | null;
    slots: DistributionSlot[];
    stocks: DistributionStock[];
  };
}

export function DistributionForm({ mode, distributionId, status, defaultValues }: DistributionFormProps) {
  const isEdit = mode === "edit";
  const router = useRouter();
  const { data: taxa } = useLiveQuery(taxonCollection);
  const taxonOptions = (taxa ?? []).filter((t) => t.taxonomic_level !== "genus");

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      general_contact: defaultValues?.general_contact ?? "",
      slots: (defaultValues?.slots ?? []).map(
        (s): DraftSlot => ({
          clientId: s.id,
          id: s.id,
          isNew: false,
          location_name: s.location_name,
          address: s.address,
          date: s.date,
          start_time: s.start_time,
          end_time: s.end_time,
          contact: s.contact,
        }),
      ),
      stocks: (defaultValues?.stocks ?? []).map(
        (s): DraftStock => ({
          clientId: s.id,
          id: s.id,
          isNew: false,
          taxon_id: s.taxon_id,
          quantity: s.quantity,
          quantity_unknown: s.quantity_unknown,
        }),
      ),
    } satisfies FormValues,
    validators: { onChange: formSchema },
    onSubmit: async ({ value }) => {
      const record = {
        title: value.title.trim(),
        description: value.description.trim() || null,
        general_contact: value.general_contact.trim() || null,
      };

      try {
        let eventId: string;

        if (isEdit && distributionId) {
          eventId = distributionId;
          const tx = distributionEventCollection.update(eventId, (draft) => Object.assign(draft, record));
          await tx.isPersisted.promise;

          await Promise.all([
            ...value.slots
              .filter((s) => s.isNew)
              .map((s) =>
                createSlot(eventId, {
                  location_name: s.location_name,
                  address: s.address || null,
                  date: s.date,
                  start_time: s.start_time,
                  end_time: s.end_time,
                  contact: s.contact || null,
                }),
              ),
            ...value.slots
              .filter((s) => !s.isNew && s.id)
              .map((s) =>
                updateSlot(eventId, s.id!, {
                  location_name: s.location_name,
                  address: s.address || null,
                  date: s.date,
                  start_time: s.start_time,
                  end_time: s.end_time,
                  contact: s.contact || null,
                }),
              ),
            // biome-ignore lint/suspicious/noUnnecessaryConditions: defaultValues is optional on the component props; only edit-mode callers pass it, but the type doesn't encode that.
            ...(defaultValues?.slots ?? [])
              .filter((original) => !value.slots.some((s) => s.id === original.id))
              .map((original) => deleteSlot(eventId, original.id)),
            ...value.stocks
              .filter((s) => s.isNew)
              .map((s) =>
                createStock(eventId, {
                  taxon_id: s.taxon_id,
                  quantity: s.quantity,
                  quantity_unknown: s.quantity_unknown,
                }),
              ),
            ...value.stocks
              .filter((s) => !s.isNew && s.id)
              .map((s) =>
                updateStock(eventId, s.id!, {
                  taxon_id: s.taxon_id,
                  quantity: s.quantity,
                  quantity_unknown: s.quantity_unknown,
                }),
              ),
            // biome-ignore lint/suspicious/noUnnecessaryConditions: defaultValues is optional on the component props; only edit-mode callers pass it, but the type doesn't encode that.
            ...(defaultValues?.stocks ?? [])
              .filter((original) => !value.stocks.some((s) => s.id === original.id))
              .map((original) => deleteStock(eventId, original.id)),
          ]);
        } else {
          // Event ids are server-generated (not client-chosen), and slots,
          // stocks and the cover image all need the real id right away — so
          // create the event directly via the API instead of an optimistic
          // `distributionEventCollection.insert`, then seed the collection's
          // cache once we have it.
          const created = await createEvent(record);
          eventId = created.id;
          // Seed the collection's synced store directly — the list page's
          // earlier visit may have already populated it, and invalidating
          // the query wouldn't refetch in time for the redirect below (no
          // observer is watching it while we're on the create page, and
          // even once one mounts, the refetch is async). `writeInsert` is
          // query-db-collection's purpose-built API for exactly this: write
          // server-confirmed data straight into the collection's reactive
          // store, synchronously, no round-trip.
          distributionEventCollection.utils.writeInsert(created);

          await Promise.all([
            ...value.slots.map((s) =>
              createSlot(eventId, {
                location_name: s.location_name,
                address: s.address || null,
                date: s.date,
                start_time: s.start_time,
                end_time: s.end_time,
                contact: s.contact || null,
              }),
            ),
            ...value.stocks.map((s) =>
              createStock(eventId, {
                taxon_id: s.taxon_id,
                quantity: s.quantity,
                quantity_unknown: s.quantity_unknown,
              }),
            ),
          ]);
        }

        if (coverFile) {
          await uploadEventCoverImage(eventId, coverFile);
        }

        await queryClient.invalidateQueries({ queryKey: ["distribution-events"] });
        await queryClient.invalidateQueries({ queryKey: ["distribution-slots", eventId] });
        await queryClient.invalidateQueries({ queryKey: ["distribution-stocks", eventId] });

        toast.success(isEdit ? "Événement mis à jour." : "Événement créé.");
        router.push(`/admin/distributions/${eventId}`);
      } catch {
        toast.error(isEdit ? "Échec de la mise à jour." : "Échec de la création.");
      }
    },
  });

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

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left 2/3 */}
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informations générales</CardTitle>
                <CardDescription className="text-xs">
                  Intitulé et description utilisés dans l'email de publication et la page publique.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <form.Field name="title">
                    {(field) => {
                      const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>
                            Intitulé
                            <span className="ml-1 text-destructive">*</span>
                          </FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            placeholder="ex : Distribution d'automne 2026"
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

                  <form.Field name="description">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                        <Textarea
                          id={field.name}
                          name={field.name}
                          placeholder="Présentation de l'événement pour les Adoptants…"
                          rows={4}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      </Field>
                    )}
                  </form.Field>

                  <form.Field name="general_contact">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>Contact général</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          placeholder="ex : distribution@repousse.org"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      </Field>
                    )}
                  </form.Field>

                  <Field>
                    <FieldLabel>
                      Image
                      <span className="ml-1.5 text-muted-foreground text-xs font-normal">(facultatif)</span>
                    </FieldLabel>
                    {coverPreviewUrl || defaultValues?.image_url ? (
                      <div className="group relative w-fit overflow-hidden rounded-md border">
                        {/* biome-ignore lint/performance/noImgElement: preview of a locally chosen or already-uploaded file, not a Next-optimizable static asset */}
                        <img
                          src={coverPreviewUrl ?? defaultValues?.image_url ?? undefined}
                          alt="Aperçu"
                          className="size-20 shrink-0 object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon-sm"
                          className="absolute top-1 right-1 opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={() => {
                            setCoverFile(null);
                            setCoverPreviewUrl(null);
                          }}
                          aria-label="Retirer l'image"
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <Dropzone
                        accept={COVER_IMAGE_ACCEPT}
                        maxFiles={1}
                        maxSize={COVER_IMAGE_MAX_BYTES}
                        multiple={false}
                        onDropAccepted={([file]) => {
                          setCoverFile(file);
                          setCoverPreviewUrl(URL.createObjectURL(file));
                        }}
                      >
                        <DropzoneZone>
                          <DropzoneEmptyState
                            title="Glissez une image ici"
                            description="ou cliquez pour parcourir · JPEG, PNG, WebP, GIF · 5 Mo max"
                          />
                        </DropzoneZone>
                        <DropzoneRejectionError />
                      </Dropzone>
                    )}
                  </Field>
                </FieldGroup>
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
                <form.Field name="slots">
                  {(field) => (
                    <>
                      {field.state.value.map((slot, i) => (
                        <SlotRow
                          key={slot.clientId}
                          slot={slot}
                          onChange={(s) => {
                            const next = [...field.state.value];
                            next[i] = s;
                            field.handleChange(next);
                          }}
                          onRemove={() => field.handleChange(field.state.value.filter((_, idx) => idx !== i))}
                        />
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() =>
                          field.handleChange([
                            ...field.state.value,
                            {
                              clientId: crypto.randomUUID(),
                              isNew: true,
                              location_name: "",
                              address: null,
                              date: "",
                              start_time: "",
                              end_time: "",
                              contact: null,
                            },
                          ])
                        }
                      >
                        <Plus className="size-4" />
                        Ajouter un créneau
                      </Button>
                    </>
                  )}
                </form.Field>
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
                <form.Field name="stocks">
                  {(field) => (
                    <>
                      {field.state.value.map((stock, i) => (
                        <StockRow
                          key={stock.clientId}
                          stock={stock}
                          taxonOptions={taxonOptions}
                          usedTaxonIds={field.state.value.map((s) => s.taxon_id)}
                          onChange={(s) => {
                            const next = [...field.state.value];
                            next[i] = s;
                            field.handleChange(next);
                          }}
                          onRemove={() => field.handleChange(field.state.value.filter((_, idx) => idx !== i))}
                        />
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          const nextTaxon = taxonOptions.find(
                            (t) => !field.state.value.some((s) => s.taxon_id === t.id),
                          );
                          if (!nextTaxon) return;
                          field.handleChange([
                            ...field.state.value,
                            {
                              clientId: crypto.randomUUID(),
                              isNew: true,
                              taxon_id: nextTaxon.id,
                              quantity: 0,
                              quantity_unknown: false,
                            },
                          ]);
                        }}
                        disabled={taxonOptions.length === 0}
                      >
                        <Plus className="size-4" />
                        Ajouter une espèce
                      </Button>
                    </>
                  )}
                </form.Field>
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
                    className={cn("border-0 px-2 py-0.5 text-xs font-normal", EVENT_STATUS_COLORS[status ?? "draft"])}
                  >
                    {EVENT_STATUS_LABELS[status ?? "draft"]}
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
                      <span>Identifiant</span>
                      <code className="font-mono text-xs text-foreground">{distributionId}</code>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col gap-2">
              <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
                {([canSubmit, isSubmitting]) => (
                  <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
                    {isSubmitting ? "Enregistrement…" : isEdit ? "Enregistrer les modifications" : "Créer l'événement"}
                  </Button>
                )}
              </form.Subscribe>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/admin/distributions">Annuler</Link>
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
