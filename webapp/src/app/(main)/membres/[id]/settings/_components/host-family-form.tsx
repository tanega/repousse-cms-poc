"use client";

import { useEffect, useState } from "react";

import { useForm } from "@tanstack/react-form";
import { X } from "lucide-react";
import { toast } from "sonner";
import * as z from "zod";

import { AdresseSearchBox } from "@/app/(main)/admin/projets-plantation/_components/adresse-search-box";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updateHostFamilyProfile } from "@/lib/api/me";
import { fetchPublicTaxa } from "@/lib/api/taxa";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { useCurrentUserStore } from "@/stores/current-user/current-user-store";
import type { Taxon } from "@/types/taxon";
import type { HostingEquipment } from "@/types/user";

const EQUIPMENT_LABELS: Record<HostingEquipment, string> = {
  greenhouse: "Serre",
  tarp: "Bâche",
  auto_watering: "Arrosage automatique",
  artificial_light: "Lumière artificielle",
  cold_frame: "Châssis froid",
  outdoor_ground: "Pleine terre extérieure",
};

const EQUIPMENT_IDS = Object.keys(EQUIPMENT_LABELS) as HostingEquipment[];

const schema = z.object({
  hosting_capacity: z.string(),
  hosting_surface_m2: z.string(),
  hosting_address: z.string(),
  hosting_lat: z.number().nullable(),
  hosting_lng: z.number().nullable(),
  hosting_availability: z.string(),
  hosting_equipment: z.array(z.string()),
  hosted_species: z.array(z.string()),
});

type HostFamilyValues = z.infer<typeof schema>;

const EMPTY: HostFamilyValues = {
  hosting_capacity: "",
  hosting_surface_m2: "",
  hosting_address: "",
  hosting_lat: null,
  hosting_lng: null,
  hosting_availability: "",
  hosting_equipment: [],
  hosted_species: [],
};

/** Empty string means "not filled in" — send null rather than 0. */
function toNumberOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function HostFamilyForm() {
  const { user } = useCurrentUser();
  const profile = user?.profiles.find((p) => p.profile_type === "host_family");
  const [taxa, setTaxa] = useState<Taxon[]>([]);

  useEffect(() => {
    fetchPublicTaxa()
      .then(setTaxa)
      .catch(() => toast.error("Impossible de charger la liste des espèces."));
  }, []);

  const form = useForm({
    defaultValues: EMPTY,
    validators: { onChange: schema },
    onSubmit: async ({ value }) => {
      try {
        const updated = await updateHostFamilyProfile({
          hosting_capacity: toNumberOrNull(value.hosting_capacity),
          hosting_surface_m2: toNumberOrNull(value.hosting_surface_m2),
          hosting_address: value.hosting_address.trim() || null,
          hosting_lat: value.hosting_lat,
          hosting_lng: value.hosting_lng,
          hosting_availability: value.hosting_availability.trim() || null,
          hosting_equipment: value.hosting_equipment as HostingEquipment[],
          hosted_species: value.hosted_species.map((taxon_id) => ({ taxon_id })),
        });

        const current = useCurrentUserStore.getState().user;
        if (current) {
          useCurrentUserStore.getState().setUser({
            ...current,
            profiles: current.profiles.map((p) => (p.id === updated.id ? updated : p)),
          });
        }
        toast.success("Informations d'accueil enregistrées.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Échec de l'enregistrement.");
      }
    },
  });

  // defaultValues are captured once at useForm() time; the profile arrives later.
  useEffect(() => {
    if (!profile) return;
    form.reset({
      hosting_capacity: profile.hosting_capacity?.toString() ?? "",
      hosting_surface_m2: profile.hosting_surface_m2?.toString() ?? "",
      hosting_address: profile.hosting_address ?? "",
      hosting_lat: profile.hosting_lat,
      hosting_lng: profile.hosting_lng,
      hosting_availability: profile.hosting_availability ?? "",
      hosting_equipment: profile.hosting_equipment ?? [],
      hosted_species: (profile.hosted_species ?? []).map((s) => s.taxon_id),
    });
  }, [profile, form.reset]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <p className="mb-3 font-medium text-xs uppercase tracking-wide text-muted-foreground">Mes capacités d'accueil</p>

      <FieldGroup>
        <form.Field name="hosting_address">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Adresse ou zone d'accueil</FieldLabel>
              <AdresseSearchBox
                id={field.name}
                value={field.state.value}
                placeholder="12 rue des Lilas, 75020 Paris"
                onInputChange={(value) => {
                  field.handleChange(value);
                  form.setFieldValue("hosting_lat", null);
                  form.setFieldValue("hosting_lng", null);
                }}
                onSelect={(suggestion) => {
                  field.handleChange(suggestion.label);
                  form.setFieldValue("hosting_lat", suggestion.lat);
                  form.setFieldValue("hosting_lng", suggestion.lng);
                }}
                onBlur={field.handleBlur}
              />
              <p className="text-muted-foreground text-xs">
                Peut différer de votre adresse personnelle. Visible des coordinateurs.
              </p>
            </Field>
          )}
        </form.Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <form.Field name="hosting_capacity">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Capacité (nombre de plants)</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="number"
                    min={0}
                    placeholder="120"
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

          <form.Field name="hosting_surface_m2">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Surface disponible (m²)</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="number"
                  min={0}
                  step="0.5"
                  placeholder="42"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </Field>
            )}
          </form.Field>
        </div>

        <form.Field name="hosting_availability">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Disponibilités</FieldLabel>
              <Textarea
                id={field.name}
                name={field.name}
                rows={2}
                placeholder="Toute l'année, sauf juillet-août"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </Field>
          )}
        </form.Field>

        <form.Field name="hosting_equipment">
          {(field) => (
            <Field>
              <FieldLabel>Équipements</FieldLabel>
              <div className="grid gap-2 sm:grid-cols-2">
                {EQUIPMENT_IDS.map((id) => {
                  const checked = field.state.value.includes(id);
                  return (
                    <div key={id} className="flex items-center gap-2">
                      <Checkbox
                        id={`equipment-${id}`}
                        checked={checked}
                        onCheckedChange={(next) =>
                          field.handleChange(
                            next ? [...field.state.value, id] : field.state.value.filter((e) => e !== id),
                          )
                        }
                      />
                      <Label htmlFor={`equipment-${id}`} className="font-normal text-sm">
                        {EQUIPMENT_LABELS[id]}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </Field>
          )}
        </form.Field>

        <form.Field name="hosted_species">
          {(field) => {
            const selected = field.state.value;
            const available = taxa.filter((t) => !selected.includes(t.id));
            return (
              <Field>
                <FieldLabel>Espèces pouvant être accueillies</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {selected.map((id) => {
                    const taxon = taxa.find((t) => t.id === id);
                    return (
                      <Badge key={id} variant="secondary" className="gap-1">
                        {taxon?.common_name ?? id}
                        <button
                          type="button"
                          aria-label={`Retirer ${taxon?.common_name ?? id}`}
                          onClick={() => field.handleChange(selected.filter((s) => s !== id))}
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
                <Select
                  value=""
                  onValueChange={(id) => id && field.handleChange([...selected, id])}
                  disabled={available.length === 0}
                >
                  <SelectTrigger>
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
              </Field>
            );
          }}
        </form.Field>
      </FieldGroup>

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          <Button type="submit" size="sm" className="mt-4" disabled={!profile || !canSubmit || isSubmitting}>
            {isSubmitting ? "Enregistrement…" : "Enregistrer mes capacités d'accueil"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
