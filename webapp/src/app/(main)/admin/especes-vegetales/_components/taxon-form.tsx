"use client";

import { useEffect } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useLiveQuery } from "@tanstack/react-db";
import { useForm } from "@tanstack/react-form";
import { ArrowLeft, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  EXTERNAL_LINK_SOURCES,
  TAXONOMIC_LEVEL_LABELS,
  TAXONOMIC_LEVELS,
  type Taxon,
  type TaxonExternalLink,
} from "@/types/taxon";

import { taxonCategoryCollection, taxonCollection } from "./collection";

const URL_RE = /^https?:\/\//;

const externalLinkSchema = z.object({
  source_name: z.string().min(1, "Source requise"),
  url: z.string().trim().regex(URL_RE, "URL invalide (http/https)"),
});

const taxonFormSchema = z
  .object({
    common_name: z.string().trim().min(1, "Le nom commun est requis").max(200),
    scientific_name: z.string().trim(),
    taxonomic_level: z.enum(["genus", "species", "variety"]),
    category_id: z.string().min(1, "La catégorie est requise"),
    parent_id: z.string(),
    is_non_taxonomic: z.boolean(),
    image_url: z.string().trim(),
    external_links: z.array(externalLinkSchema),
  })
  .refine((v) => v.is_non_taxonomic || v.scientific_name.length > 0, {
    message: "Le nom scientifique est requis sauf pour une entrée non-taxonomique",
    path: ["scientific_name"],
  })
  .refine((v) => v.image_url === "" || URL_RE.test(v.image_url), {
    message: "URL invalide (http/https)",
    path: ["image_url"],
  });

type TaxonFormValues = z.infer<typeof taxonFormSchema>;

function emptyValues(defaultParentId?: string): TaxonFormValues {
  return {
    common_name: "",
    scientific_name: "",
    taxonomic_level: "species",
    category_id: "",
    parent_id: defaultParentId ?? "",
    is_non_taxonomic: false,
    image_url: "",
    external_links: [],
  };
}

function valuesFromTaxon(taxon: Taxon): TaxonFormValues {
  return {
    common_name: taxon.common_name,
    scientific_name: taxon.scientific_name ?? "",
    taxonomic_level: taxon.taxonomic_level,
    category_id: taxon.category_id ?? "",
    parent_id: taxon.parent_id ?? "",
    is_non_taxonomic: taxon.is_non_taxonomic,
    image_url: taxon.image_url ?? "",
    external_links: (taxon.external_links ?? []).map((l) => ({ source_name: l.source_name, url: l.url })),
  };
}

function optimisticExternalLink(l: { source_name: string; url: string }, taxonId: string): TaxonExternalLink {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    taxon_id: taxonId,
    source_name: l.source_name,
    url: l.url,
    inserted_at: now,
    updated_at: now,
  };
}

export interface TaxonFormProps {
  mode: "create" | "edit";
  taxon?: Taxon;
  defaultParentId?: string;
}

export function TaxonForm({ mode, taxon, defaultParentId }: TaxonFormProps) {
  const isEdit = mode === "edit";
  const router = useRouter();
  const { data: allTaxons } = useLiveQuery(taxonCollection);
  const { data: categories } = useLiveQuery(taxonCategoryCollection);

  const form = useForm({
    defaultValues: taxon ? valuesFromTaxon(taxon) : emptyValues(defaultParentId),
    validators: { onChange: taxonFormSchema },
    onSubmit: async ({ value }) => {
      const record = {
        common_name: value.common_name.trim(),
        scientific_name: value.is_non_taxonomic && !value.scientific_name ? null : value.scientific_name.trim() || null,
        taxonomic_level: value.taxonomic_level,
        is_non_taxonomic: value.is_non_taxonomic,
        image_url: value.image_url || null,
        parent_id: value.parent_id || null,
        category_id: value.category_id || null,
        external_links: value.external_links,
      };

      try {
        if (isEdit && taxon) {
          taxonCollection.update(taxon.id, (draft) => {
            Object.assign(draft, record);
            draft.category = categories?.find((c) => c.id === record.category_id) ?? null;
            draft.external_links = record.external_links.map((l) => optimisticExternalLink(l, taxon.id));
            draft.updated_at = new Date().toISOString();
          });
          toast.success("Taxon mis à jour.");
        } else {
          const id = crypto.randomUUID();
          const now = new Date().toISOString();
          taxonCollection.insert({
            id,
            notes: null,
            ...record,
            category: categories?.find((c) => c.id === record.category_id) ?? null,
            external_links: record.external_links.map((l) => optimisticExternalLink(l, id)),
            nb_distributions: 0,
            nb_projets: 0,
            inserted_at: now,
            updated_at: now,
          });
          toast.success("Taxon créé.");
        }
        router.push("/admin/especes-vegetales");
      } catch {
        toast.error(isEdit ? "Échec de la mise à jour." : "Échec de la création.");
      }
    },
  });

  useEffect(() => {
    if (taxon) form.reset(valuesFromTaxon(taxon));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taxon, form.reset]);

  function handleDelete() {
    if (!taxon) return;
    taxonCollection.delete(taxon.id);
    router.push("/admin/especes-vegetales");
  }

  const parentOptions = (allTaxons ?? []).filter((t) => t.id !== taxon?.id && t.taxonomic_level !== "variety");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/admin/especes-vegetales">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{isEdit ? "Modifier le taxon" : "Ajouter un taxon"}</h1>
          <p className="text-muted-foreground text-sm">
            {isEdit
              ? "Modifiez les informations de ce taxon végétal."
              : "Créez une nouvelle entrée dans le catalogue des espèces végétales."}
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
            {/* Image */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Image de référence</CardTitle>
                <CardDescription className="text-xs">
                  URL d'une photo représentative (Wikimedia Commons, etc.). Champ optionnel.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form.Field name="image_url">
                  {(field) => {
                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <div className="flex gap-3">
                        {field.state.value && (
                          <img
                            src={field.state.value}
                            alt="Aperçu"
                            className="size-20 shrink-0 rounded-md border object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        )}
                        <Field data-invalid={isInvalid} className="flex-1">
                          <FieldLabel htmlFor={field.name}>
                            URL de l'image
                            <span className="ml-1.5 text-muted-foreground text-xs font-normal">(facultatif)</span>
                          </FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            placeholder="https://upload.wikimedia.org/…"
                            value={field.state.value}
                            aria-invalid={isInvalid}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                          />
                          {isInvalid && <FieldError errors={field.state.meta.errors} />}
                        </Field>
                      </div>
                    );
                  }}
                </form.Field>
              </CardContent>
            </Card>

            {/* Identification */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Identification botanique</CardTitle>
                <CardDescription className="text-xs">Noms de référence du taxon dans le catalogue.</CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <form.Field name="is_non_taxonomic">
                    {(field) => (
                      <FieldLabel
                        htmlFor={field.name}
                        className="flex-row items-start rounded-md border bg-muted/30 px-3 py-2.5"
                      >
                        <Checkbox
                          id={field.name}
                          checked={field.state.value}
                          onCheckedChange={(v) => field.handleChange(!!v)}
                          className="mt-0.5"
                        />
                        <FieldContent>
                          <FieldTitle>Entrée non-taxonomique</FieldTitle>
                          <FieldDescription>
                            Cochez si le taxon n'a pas de nom latin (ex : "Plante grimpante non identifiée").
                          </FieldDescription>
                        </FieldContent>
                      </FieldLabel>
                    )}
                  </form.Field>

                  <form.Field name="common_name">
                    {(field) => {
                      const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>
                            Nom commun de référence
                            <span className="ml-1 text-destructive">*</span>
                          </FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            placeholder="ex : Chêne pédonculé"
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

                  <form.Subscribe selector={(state) => state.values.is_non_taxonomic}>
                    {(isNonTaxonomic) => (
                      <form.Field name="scientific_name">
                        {(field) => {
                          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                          return (
                            <Field data-invalid={isInvalid}>
                              <FieldLabel htmlFor={field.name}>
                                Nom scientifique (latin)
                                {!isNonTaxonomic && <span className="ml-1 text-destructive">*</span>}
                                {isNonTaxonomic && (
                                  <span className="ml-1.5 text-muted-foreground text-xs font-normal">(facultatif)</span>
                                )}
                              </FieldLabel>
                              <Input
                                id={field.name}
                                name={field.name}
                                placeholder="ex : Quercus robur"
                                className="italic"
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
                    )}
                  </form.Subscribe>
                </FieldGroup>
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
              <CardContent>
                <FieldGroup>
                  <div className="grid grid-cols-2 gap-4">
                    <form.Field name="taxonomic_level">
                      {(field) => (
                        <Field>
                          <FieldLabel htmlFor={field.name}>Niveau taxonomique</FieldLabel>
                          <Select
                            value={field.state.value}
                            onValueChange={(v) => field.handleChange(v as typeof field.state.value)}
                          >
                            <SelectTrigger id={field.name}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TAXONOMIC_LEVELS.map((n) => (
                                <SelectItem key={n} value={n}>
                                  {TAXONOMIC_LEVEL_LABELS[n]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                      )}
                    </form.Field>

                    <form.Field name="category_id">
                      {(field) => {
                        const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel htmlFor={field.name}>Catégorie</FieldLabel>
                            <Select value={field.state.value} onValueChange={field.handleChange}>
                              <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                                <SelectValue placeholder="Choisir…" />
                              </SelectTrigger>
                              <SelectContent>
                                {(categories ?? []).map((c) => (
                                  <SelectItem key={c.id} value={c.id}>
                                    {c.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                          </Field>
                        );
                      }}
                    </form.Field>
                  </div>

                  <form.Field name="parent_id">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>
                          Taxon parent
                          <span className="ml-1.5 text-muted-foreground text-xs font-normal">(facultatif)</span>
                        </FieldLabel>
                        <Select
                          value={field.state.value || "none"}
                          onValueChange={(v) => field.handleChange(v === "none" ? "" : v)}
                        >
                          <SelectTrigger id={field.name}>
                            <SelectValue placeholder="Aucun (taxon racine)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">— Aucun (taxon racine) —</SelectItem>
                            {parentOptions.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.common_name}
                                {t.scientific_name ? ` · ${t.scientific_name}` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldDescription>
                          Hiérarchie maximale de 3 niveaux : Genre → Espèce → Variété/Cultivar
                        </FieldDescription>
                      </Field>
                    )}
                  </form.Field>
                </FieldGroup>
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
                <form.Field name="external_links" mode="array">
                  {(linksField) => (
                    <>
                      {linksField.state.value.map((_, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <form.Field name={`external_links[${i}].source_name`}>
                            {(field) => (
                              <Select value={field.state.value} onValueChange={field.handleChange}>
                                <SelectTrigger className="w-44 shrink-0">
                                  <SelectValue placeholder="Source" />
                                </SelectTrigger>
                                <SelectContent>
                                  {EXTERNAL_LINK_SOURCES.map((s) => (
                                    <SelectItem key={s} value={s}>
                                      {s}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </form.Field>
                          <form.Field name={`external_links[${i}].url`}>
                            {(field) => {
                              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                              return (
                                <Field data-invalid={isInvalid} className="flex-1">
                                  <Input
                                    placeholder="https://…"
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
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="mt-0.5"
                            onClick={() => linksField.removeValue(i)}
                          >
                            <Minus className="size-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => linksField.pushValue({ source_name: "Wikipedia", url: "" })}
                      >
                        <Plus className="size-4" />
                        Ajouter un lien
                      </Button>
                    </>
                  )}
                </form.Field>
              </CardContent>
            </Card>
          </div>

          {/* Right 1/3 */}
          <div className="space-y-6">
            {isEdit && taxon && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Informations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Identifiant</span>
                    <code className="font-mono text-xs text-foreground">{taxon.id}</code>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-muted-foreground">
                    <span>Distributions</span>
                    <span className="font-medium text-foreground tabular-nums">{taxon.nb_distributions}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-muted-foreground">
                    <span>Projets</span>
                    <span className="font-medium text-foreground tabular-nums">{taxon.nb_projets}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-muted-foreground">
                    <span>Dernière modification</span>
                    <span className="font-medium text-foreground">
                      {new Date(taxon.updated_at).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex flex-col gap-2">
              <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
                {([canSubmit, isSubmitting]) => (
                  <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
                    {isSubmitting ? "Enregistrement…" : isEdit ? "Enregistrer les modifications" : "Créer le taxon"}
                  </Button>
                )}
              </form.Subscribe>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/admin/especes-vegetales">Annuler</Link>
              </Button>
              {isEdit && (
                <>
                  <Separator />
                  <Button type="button" variant="destructive" className="w-full" onClick={handleDelete}>
                    Supprimer ce taxon
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
