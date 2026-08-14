"use client";

import { useEffect } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useLiveQuery } from "@tanstack/react-db";
import { useForm } from "@tanstack/react-form";
import { ArrowLeft, MapPin, X } from "lucide-react";
import { toast } from "sonner";
import * as z from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  MANAGEMENT_TYPE_LABELS,
  MANAGEMENT_TYPES,
  type Project,
  PUBLICATION_STATUS_COLORS,
  PUBLICATION_STATUS_LABELS,
} from "@/types/project";

import { taxonCollection } from "../../especes-vegetales/_components/collection";
import { AdresseSearchBox } from "./adresse-search-box";
import { CarteMini } from "./carte-mini";
import { projectCollection } from "./project-collection";

const projetFormSchema = z.object({
  name: z.string().trim().min(1, "Le nom du projet est requis").max(200),
  description: z.string().trim(),
  management_type: z.enum(["individual", "collective"]),
  address: z.string().trim(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  surface_m2: z.string().trim(),
  soil_type: z.string().trim(),
  preferred_species: z.array(z.string()),
});

type ProjetFormValues = z.infer<typeof projetFormSchema>;

function emptyValues(): ProjetFormValues {
  return {
    name: "",
    description: "",
    management_type: "individual",
    address: "",
    lat: null,
    lng: null,
    surface_m2: "",
    soil_type: "",
    preferred_species: [],
  };
}

function valuesFromProjet(projet: Project): ProjetFormValues {
  return {
    name: projet.name,
    description: projet.description ?? "",
    management_type: projet.management_type,
    address: projet.address ?? "",
    lat: projet.lat,
    lng: projet.lng,
    surface_m2: projet.surface_m2 === null ? "" : String(projet.surface_m2),
    soil_type: projet.soil_type ?? "",
    preferred_species: projet.preferred_species.map((s) => s.taxon_id),
  };
}

export interface ProjetFormProps {
  mode: "create" | "edit";
  projet?: Project;
}

export function ProjetForm({ mode, projet }: ProjetFormProps) {
  const isEdit = mode === "edit";
  const router = useRouter();
  const { data: taxons } = useLiveQuery(taxonCollection);

  const form = useForm({
    defaultValues: projet ? valuesFromProjet(projet) : emptyValues(),
    validators: { onChange: projetFormSchema },
    onSubmit: async ({ value }) => {
      const record = {
        name: value.name.trim(),
        description: value.description.trim() || null,
        management_type: value.management_type,
        address: value.address.trim() || null,
        lat: value.lat,
        lng: value.lng,
        surface_m2: value.surface_m2 === "" ? null : Number(value.surface_m2),
        soil_type: value.soil_type.trim() || null,
        preferred_species: value.preferred_species.map((taxon_id) => ({
          id: crypto.randomUUID(),
          project_id: projet?.id ?? "",
          taxon_id,
          inserted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })),
      };

      try {
        if (isEdit && projet) {
          projectCollection.update(projet.id, (draft) => {
            Object.assign(draft, record);
            draft.updated_at = new Date().toISOString();
          });
          toast.success("Projet mis à jour.");
          router.push(`/admin/projets-plantation/${projet.id}`);
        } else {
          const id = crypto.randomUUID();
          const now = new Date().toISOString();
          projectCollection.insert({
            id,
            publication_status: "private",
            published_at: null,
            archived_at: null,
            owner_id: null,
            ...record,
            inserted_at: now,
            updated_at: now,
          });
          toast.success("Projet créé.");
          router.push("/admin/projets-plantation");
        }
      } catch {
        toast.error(isEdit ? "Échec de la mise à jour." : "Échec de la création.");
      }
    },
  });

  useEffect(() => {
    if (projet) form.reset(valuesFromProjet(projet));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projet, form.reset]);

  function addEspece(taxonId: string, current: string[], onChange: (v: string[]) => void) {
    if (!taxonId || current.includes(taxonId)) return;
    onChange([...current, taxonId]);
  }

  function removeEspece(taxonId: string, current: string[], onChange: (v: string[]) => void) {
    onChange(current.filter((id) => id !== taxonId));
  }

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
                  Nom, description et nature de la gestion du projet.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <form.Field name="name">
                    {(field) => {
                      const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>
                            Nom du projet
                            <span className="ml-1 text-destructive">*</span>
                          </FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            placeholder="ex : Verger partagé des Coteaux"
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
                          placeholder="Présentation du projet, objectifs, contexte…"
                          rows={4}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      </Field>
                    )}
                  </form.Field>

                  <form.Field name="management_type">
                    {(field) => (
                      <Field>
                        <FieldLabel>Nature de la gestion</FieldLabel>
                        <RadioGroup
                          value={field.state.value}
                          onValueChange={(v) => field.handleChange(v as typeof field.state.value)}
                          className="flex gap-4"
                        >
                          {MANAGEMENT_TYPES.map((t) => (
                            <FieldLabel
                              key={t}
                              htmlFor={`management-${t}`}
                              className="flex-row items-center gap-1.5 font-normal text-sm"
                            >
                              <RadioGroupItem id={`management-${t}`} value={t} />
                              {MANAGEMENT_TYPE_LABELS[t]}
                            </FieldLabel>
                          ))}
                        </RadioGroup>
                      </Field>
                    )}
                  </form.Field>
                </FieldGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Localisation & terrain</CardTitle>
                <CardDescription className="text-xs">Adresse, surface et nature du sol du projet.</CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <form.Field name="address">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>Adresse</FieldLabel>
                        <AdresseSearchBox
                          id={field.name}
                          value={field.state.value}
                          placeholder="ex : 12 chemin des Coteaux, 69008 Lyon"
                          onBlur={field.handleBlur}
                          onInputChange={(v) => {
                            field.handleChange(v);
                            if (form.state.values.lat !== null || form.state.values.lng !== null) {
                              form.setFieldValue("lat", null);
                              form.setFieldValue("lng", null);
                            }
                          }}
                          onSelect={(result) => {
                            field.handleChange(result.label);
                            form.setFieldValue("lat", result.lat);
                            form.setFieldValue("lng", result.lng);
                          }}
                        />
                        <FieldDescription>
                          Recherche via la Base Adresse Nationale — sélectionnez une suggestion pour géolocaliser le
                          projet.
                        </FieldDescription>
                      </Field>
                    )}
                  </form.Field>

                  <form.Subscribe selector={(state) => [state.values.lat, state.values.lng] as const}>
                    {([lat, lng]) =>
                      lat !== null && lng !== null ? (
                        <Field>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
                              <MapPin className="size-3.5" />
                              {lat.toFixed(5)}, {lng.toFixed(5)}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-auto py-0.5 text-muted-foreground text-xs"
                              onClick={() => {
                                form.setFieldValue("lat", null);
                                form.setFieldValue("lng", null);
                              }}
                            >
                              Effacer les coordonnées
                            </Button>
                          </div>
                          <CarteMini lat={lat} lng={lng} label={form.state.values.name || "Projet"} />
                        </Field>
                      ) : null
                    }
                  </form.Subscribe>

                  <div className="grid grid-cols-2 gap-4">
                    <form.Field name="surface_m2">
                      {(field) => (
                        <Field>
                          <FieldLabel htmlFor={field.name}>Surface approximative (m²)</FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            type="number"
                            min={0}
                            placeholder="ex : 850"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                          />
                        </Field>
                      )}
                    </form.Field>
                    <form.Field name="soil_type">
                      {(field) => (
                        <Field>
                          <FieldLabel htmlFor={field.name}>Nature du sol</FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            placeholder="ex : Argilo-calcaire"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                          />
                        </Field>
                      )}
                    </form.Field>
                  </div>
                </FieldGroup>
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
                <form.Field name="preferred_species">
                  {(field) => {
                    const available = (taxons ?? []).filter(
                      (t) => t.taxonomic_level !== "genus" && !field.state.value.includes(t.id),
                    );
                    return (
                      <>
                        {field.state.value.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {field.state.value.map((id) => {
                              const taxon = taxons?.find((t) => t.id === id);
                              return (
                                <Badge key={id} variant="secondary" className="gap-1 py-1 pr-1 pl-2.5 font-normal">
                                  {taxon?.common_name ?? id}
                                  <button
                                    type="button"
                                    onClick={() => removeEspece(id, field.state.value, field.handleChange)}
                                    className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                                    aria-label={`Retirer ${taxon?.common_name ?? id}`}
                                  >
                                    <X className="size-3" />
                                  </button>
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                        <Select
                          value=""
                          onValueChange={(v) => addEspece(v, field.state.value, field.handleChange)}
                          disabled={available.length === 0}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Ajouter une espèce…" />
                          </SelectTrigger>
                          <SelectContent>
                            {available.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.common_name}
                                {t.scientific_name ? ` · ${t.scientific_name}` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </>
                    );
                  }}
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
                    className={cn(
                      "border-0 px-2 py-0.5 text-xs font-normal",
                      PUBLICATION_STATUS_COLORS[projet?.publication_status ?? "private"],
                    )}
                  >
                    {PUBLICATION_STATUS_LABELS[projet?.publication_status ?? "private"]}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-xs">
                  {isEdit
                    ? "Changez le statut depuis la fiche du projet une fois les modifications enregistrées."
                    : "Le projet est créé en Privé. Publiez-le depuis sa fiche pour le rendre visible aux membres connectés."}
                </p>
                {isEdit && projet && (
                  <>
                    <Separator />
                    <div className="flex justify-between text-muted-foreground">
                      <span>Identifiant</span>
                      <code className="font-mono text-xs text-foreground">{projet.id}</code>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col gap-2">
              <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
                {([canSubmit, isSubmitting]) => (
                  <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
                    {isSubmitting ? "Enregistrement…" : isEdit ? "Enregistrer les modifications" : "Créer le projet"}
                  </Button>
                )}
              </form.Subscribe>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/admin/projets-plantation">Annuler</Link>
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
