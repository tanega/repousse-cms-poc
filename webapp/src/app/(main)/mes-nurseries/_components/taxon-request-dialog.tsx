"use client";

import { useEffect, useState } from "react";

import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fetchTaxonCategories } from "@/lib/api/taxa";
import { createTaxonRequest } from "@/lib/api/taxon-requests";
import type { TaxonCategory } from "@/types/taxon";
import type { TaxonRequest } from "@/types/taxon-request";

const NO_CATEGORY = "none";

const requestSchema = z
  .object({
    common_name: z.string(),
    scientific_name: z.string(),
    category_id: z.string(),
    comment: z.string(),
  })
  .refine((v) => v.common_name.trim() || v.scientific_name.trim(), {
    message: "Indiquez au moins un nom commun ou un nom scientifique",
    path: ["common_name"],
  });

export interface TaxonRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** What the member had typed in the species search: prefilled as the common name. */
  initialName?: string;
  onCreated: (request: TaxonRequest) => void;
}

/** "Demander l'ajout d'une plante": asks admins to add a plant missing from the reference list. */
export function TaxonRequestDialog({ open, onOpenChange, initialName = "", onCreated }: TaxonRequestDialogProps) {
  const [categories, setCategories] = useState<TaxonCategory[]>([]);

  useEffect(() => {
    if (!open) return;
    fetchTaxonCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, [open]);

  const form = useForm({
    defaultValues: { common_name: initialName, scientific_name: "", category_id: NO_CATEGORY, comment: "" },
    validators: { onChange: requestSchema },
    onSubmit: async ({ value }) => {
      try {
        const request = await createTaxonRequest({
          common_name: value.common_name.trim() || undefined,
          scientific_name: value.scientific_name.trim() || undefined,
          category_id: value.category_id === NO_CATEGORY ? null : value.category_id,
          comment: value.comment.trim() || undefined,
        });
        toast.success("Demande envoyée aux administrateurs.");
        onCreated(request);
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Échec de l'envoi de la demande.");
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Demander l'ajout d'une plante</DialogTitle>
          <DialogDescription>
            Cette plante n'est pas dans la liste de référence de l'association. Les administrateurs étudieront votre
            demande ; en attendant, elle apparaît dans votre nurserie comme « en attente ».
          </DialogDescription>
        </DialogHeader>

        <form
          id="taxon-request-form"
          onSubmit={(e) => {
            // This dialog is portaled out of the nursery form but React still
            // bubbles the submit event up to it — keep the two forms apart.
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field name="common_name">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor="request-common-name">Nom commun</FieldLabel>
                    <Input
                      id="request-common-name"
                      placeholder="Poirier sauvage"
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

            <form.Field name="scientific_name">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="request-scientific-name">Nom scientifique</FieldLabel>
                  <Input
                    id="request-scientific-name"
                    placeholder="Pyrus pyraster"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldDescription>Au moins un des deux noms est nécessaire.</FieldDescription>
                </Field>
              )}
            </form.Field>

            <form.Field name="category_id">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="request-category">Catégorie (facultatif)</FieldLabel>
                  <Select value={field.state.value} onValueChange={field.handleChange}>
                    <SelectTrigger id="request-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_CATEGORY}>Je ne sais pas</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </form.Field>

            <form.Field name="comment">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="request-comment">Précisions (facultatif)</FieldLabel>
                  <Textarea
                    id="request-comment"
                    rows={3}
                    placeholder="Variété, provenance, lien utile…"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
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
              <Button type="submit" form="taxon-request-form" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? "Envoi…" : "Envoyer la demande"}
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
