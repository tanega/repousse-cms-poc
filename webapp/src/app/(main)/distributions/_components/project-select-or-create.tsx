"use client";

import { useState } from "react";

import { useLiveQuery } from "@tanstack/react-db";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createProject } from "@/lib/api/projects";
import { MANAGEMENT_TYPE_LABELS, MANAGEMENT_TYPES, type ManagementType } from "@/types/project";

import { projectCollection } from "../../admin/projets-plantation/_components/project-collection";

const NEW_PROJECT_VALUE = "__new__";

/**
 * Shared "pick one of my projects or create one on the fly" field for the
 * distribution reservation form. `GET /api/v1/projects` is already scoped
 * server-side to the current user's own memberships, so no client-side
 * filtering is needed here — unlike the old mock, which matched a visitor's
 * e-mail against a flat `membres` array by hand.
 */
export function ProjectSelectOrCreate({ value, onChange }: { value: string; onChange: (projectId: string) => void }) {
  const { data: projects } = useLiveQuery(projectCollection);

  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newManagementType, setNewManagementType] = useState<ManagementType>("individual");
  const [error, setError] = useState<string | null>(null);

  function handleSelectChange(v: string) {
    if (v === NEW_PROJECT_VALUE) {
      setCreating(true);
      return;
    }
    setCreating(false);
    onChange(v);
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await createProject({
        name: newName.trim(),
        description: newDescription.trim() || null,
        management_type: newManagementType,
      });
      // Same reasoning as the admin distribution form: the id is
      // server-generated, so seed the collection's cache directly instead
      // of an optimistic insert with a throwaway client id.
      projectCollection.utils.writeInsert(created);
      setCreating(false);
      setNewName("");
      setNewDescription("");
      onChange(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la création du projet.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <Select value={creating ? NEW_PROJECT_VALUE : value} onValueChange={handleSelectChange}>
        <SelectTrigger id="projet" className="w-full">
          <SelectValue placeholder="Sélectionnez ou créez un projet" />
        </SelectTrigger>
        <SelectContent>
          {(projects ?? []).map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
          <SelectItem value={NEW_PROJECT_VALUE}>+ Créer un nouveau projet</SelectItem>
        </SelectContent>
      </Select>

      {creating && (
        <Card className="border-dashed">
          <CardContent className="space-y-3 pt-4">
            <div className="space-y-2">
              <Label htmlFor="new-projet-nom">
                Nom du projet
                <span className="ml-1 text-destructive">*</span>
              </Label>
              <Input
                id="new-projet-nom"
                placeholder="ex : Verger partagé des Coteaux"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-projet-description">Description</Label>
              <Textarea
                id="new-projet-description"
                rows={2}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Nature de la gestion</Label>
              <RadioGroup
                value={newManagementType}
                onValueChange={(v) => setNewManagementType(v as ManagementType)}
                className="flex gap-4"
              >
                {MANAGEMENT_TYPES.map((n) => (
                  <Label
                    key={n}
                    htmlFor={`new-nature-${n}`}
                    className="flex cursor-pointer items-center gap-1.5 font-normal text-sm"
                  >
                    <RadioGroupItem id={`new-nature-${n}`} value={n} />
                    {MANAGEMENT_TYPE_LABELS[n]}
                  </Label>
                ))}
              </RadioGroup>
            </div>
            <p className="text-muted-foreground text-xs">
              Le projet est créé en statut Privé. Vous pourrez compléter son adresse, sa surface et ses espèces depuis
              sa page une fois créé.
            </p>
            {error && <p className="text-destructive text-xs">{error}</p>}
            <Button type="button" size="sm" disabled={!newName.trim() || submitting} onClick={handleCreate}>
              {submitting ? "Création…" : "Créer le projet"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
