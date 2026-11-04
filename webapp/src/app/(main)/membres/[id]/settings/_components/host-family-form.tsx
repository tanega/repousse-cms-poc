"use client";

import { useEffect, useMemo, useState } from "react";

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
import { useEngagementProfiles } from "@/lib/engagement/use-engagement-profiles";
import { formatPhone, isPlausiblePhone } from "@/lib/phone";
import { useCurrentUserStore } from "@/stores/current-user/current-user-store";
import type { Taxon } from "@/types/taxon";
import type { HostingEquipment, UserProfile } from "@/types/user";

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
  hosting_phone: z.string().refine((value) => !value.trim() || isPlausiblePhone(value), "Numéro de téléphone invalide"),
  hosted_species: z.array(z.string()),
  answers: z.record(z.string(), z.boolean()),
});

// Asking to join needs the basics an admin reviews before deciding.
const requestSchema = schema.superRefine((value, ctx) => {
  if (!(Number(value.hosting_capacity) > 0)) {
    ctx.addIssue({ code: "custom", path: ["hosting_capacity"], message: "Indiquez votre capacité d'accueil" });
  }
  if (!value.hosting_address.trim()) {
    ctx.addIssue({ code: "custom", path: ["hosting_address"], message: "Indiquez une adresse ou une zone d'accueil" });
  }
  if (!value.hosting_phone.trim()) {
    ctx.addIssue({ code: "custom", path: ["hosting_phone"], message: "Indiquez un téléphone" });
  }
  for (const key of REQUIRED_ANSWERS) {
    if (!value.answers[key]) {
      ctx.addIssue({ code: "custom", path: ["answers"], message: "Confirmez les conditions d'accueil" });
      break;
    }
  }
});

const REQUIRED_ANSWERS = ["dept_44", "waters", "shade", "ground", "updates_list", "cares", "rgpd", "not_saturated"] as const;

const ANSWER_LABELS: Record<string, string> = {
  dept_44: "Je vis dans le département 44",
  waters: "Je vis sur place et peux arroser pendant les canicules, ou me faire remplacer",
  shade: "J'ai un jardin ombragé (haie ou arbres)",
  ground: "Les arbres pourront être stockés à même le sol, pas sur une terrasse",
  updates_list: "Je m'engage à mettre à jour la liste des arbres que j'ai chez moi",
  cares: "Je m'engage à prendre soin de chaque arbre et à demander de l'aide si certains vont mal",
  gauge: "Optionnel : je dispose d'une jauge",
  bare_root: "Optionnel : j'accepte qu'on dépose chez moi des arbres en racines nues, que je rempoterai",
  map_consent: "J'accepte de diffuser sur la carte mon prénom, mon téléphone et ma ville",
  rgpd: "J'accepte que Repousse conserve ces informations",
  not_saturated: "Je n'habite pas un secteur qui a déjà assez de familles d'accueil",
};

type HostFamilyValues = z.infer<typeof schema>;

const EMPTY: HostFamilyValues = {
  hosting_capacity: "",
  hosting_surface_m2: "",
  hosting_address: "",
  hosting_lat: null,
  hosting_lng: null,
  hosting_availability: "",
  hosting_equipment: [],
  hosting_phone: "",
  hosted_species: [],
  answers: {},
};

/** Empty string means "not filled in" — send null rather than 0. */
function toNumberOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function toFormValues(profile: UserProfile | undefined): HostFamilyValues {
  if (!profile) return EMPTY;
  return {
    hosting_capacity: profile.hosting_capacity?.toString() ?? "",
    hosting_surface_m2: profile.hosting_surface_m2?.toString() ?? "",
    hosting_address: profile.hosting_address ?? "",
    hosting_lat: profile.hosting_lat,
    hosting_lng: profile.hosting_lng,
    hosting_availability: profile.hosting_availability ?? "",
    hosting_equipment: profile.hosting_equipment ?? [],
    hosting_phone: formatPhone(profile.hosting_phone),
    hosted_species: (profile.hosted_species ?? []).map((s) => s.taxon_id),
    answers: profile.hosting_answers ?? {},
  };
}

export interface HostFamilyFormProps {
  /**
   * `edit` (default) saves the details of a profile the member already has.
   * `request` is the "Rejoindre" step: it saves them and sends the request to the admins.
   */
  mode?: "edit" | "request";
  onRequested?: () => void;
}

export function HostFamilyForm({ mode = "edit", onRequested }: HostFamilyFormProps = {}) {
  const { user } = useCurrentUser();
  const { join } = useEngagementProfiles();
  const requesting = mode === "request";
  const profile = user?.profiles.find((p) => p.profile_type === "host_family");
  const [taxa, setTaxa] = useState<Taxon[]>([]);

  useEffect(() => {
    fetchPublicTaxa()
      .then(setTaxa)
      .catch(() => toast.error("Impossible de charger la liste des espèces."));
  }, []);

  const initialValues = useMemo(() => toFormValues(profile), [profile]);

  const form = useForm({
    // Must track the profile: useForm re-applies `defaultValues` on every render, so a
    // constant EMPTY would silently undo the reset below and blank the form on save.
    defaultValues: initialValues,
    validators: { onChange: requesting ? requestSchema : schema },
    onSubmit: async ({ value }) => {
      try {
        const attrs = {
          hosting_capacity: toNumberOrNull(value.hosting_capacity),
          hosting_surface_m2: toNumberOrNull(value.hosting_surface_m2),
          hosting_address: value.hosting_address.trim() || null,
          hosting_lat: value.hosting_lat,
          hosting_lng: value.hosting_lng,
          hosting_availability: value.hosting_availability.trim() || null,
          hosting_equipment: value.hosting_equipment as HostingEquipment[],
          hosting_phone: value.hosting_phone.trim() || null,
          hosting_answers: value.answers,
          hosted_species: value.hosted_species.map((taxon_id) => ({ taxon_id })),
        };

        if (requesting) {
          await join("Famille d'accueil", attrs);
          toast.success("Demande envoyée aux administrateurs.");
          onRequested?.();
          return;
        }

        const updated = await updateHostFamilyProfile(attrs);

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

  // The profile can arrive (or change) after mount.
  useEffect(() => {
    form.reset(initialValues);
  }, [initialValues, form.reset]);

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
              {field.state.meta.isTouched && !field.state.meta.isValid && (
                <FieldError errors={field.state.meta.errors} />
              )}
              <p className="text-muted-foreground text-xs">
                Peut différer de votre adresse personnelle. Visible des coordinateurs.
              </p>
            </Field>
          )}
        </form.Field>

        <form.Field name="hosting_phone">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Téléphone</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="tel"
                  autoComplete="tel"
                  placeholder="06 12 34 56 78"
                  value={field.state.value}
                  aria-invalid={isInvalid}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
                <p className="text-muted-foreground text-xs">
                  Facultatif. Visible uniquement des coordinateurs, pour organiser les distributions.
                </p>
              </Field>
            );
          }}
        </form.Field>

        {requesting && (
          <form.Field name="answers">
            {(field) => (
              <Field>
                <FieldLabel>Conditions d'accueil</FieldLabel>
                <div className="space-y-2">
                  {Object.entries(ANSWER_LABELS).map(([key, label]) => (
                    <div key={key} className="flex items-start gap-2">
                      <Checkbox
                        id={`answer-${key}`}
                        checked={Boolean(field.state.value[key])}
                        onCheckedChange={(next) => field.handleChange({ ...field.state.value, [key]: next === true })}
                      />
                      <Label htmlFor={`answer-${key}`} className="font-normal text-sm leading-snug">
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-muted-foreground text-xs">
                  Pour vérifier s'il y a déjà une famille d'accueil près de chez vous :{" "}
                  <a className="underline" href="https://www.repousse.org" target="_blank" rel="noreferrer">
                    repousse.org
                  </a>
                </p>
                {field.state.meta.isTouched && !field.state.meta.isValid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )}
          </form.Field>
        )}

        <div className={requesting ? "" : "grid gap-4 sm:grid-cols-2"}>
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

          {!requesting && (
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
          )}
        </div>

        {!requesting && (
        <>
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
        </>
        )}
      </FieldGroup>

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          <Button
            type="submit"
            size="sm"
            className="mt-4"
            disabled={(!requesting && !profile) || !canSubmit || isSubmitting}
          >
            {isSubmitting
              ? "Enregistrement…"
              : requesting
                ? "Envoyer ma demande"
                : "Enregistrer mes capacités d'accueil"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
