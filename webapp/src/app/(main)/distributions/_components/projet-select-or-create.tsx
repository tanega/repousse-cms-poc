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

import { projetPlantationCollection } from "../../admin/projets-plantation/_components/collection";
import { NATURES_GESTION, type NatureGestion, slugify } from "../../admin/projets-plantation/_components/data";

const NEW_PROJET_VALUE = "__new__";

/**
 * Shared "pick one of my projects or create one on the fly" field for the
 * distribution reservation form. "Own projects" is derived live from
 * `projetPlantationCollection` by matching the visitor's e-mail against
 * `membres` — works the same whether the visitor is a signed-in member or a
 * guest who just registered (see distribution-member-view.tsx).
 */
export function ProjetSelectOrCreate({
  email,
  nom,
  value,
  onChange,
}: {
  email: string;
  nom: string;
  value: string;
  onChange: (projetId: string) => void;
}) {
  const { data: projets } = useLiveQuery(projetPlantationCollection);
  const ownProjets = (projets ?? []).filter((p) => p.membres.some((m) => m.email === email));

  const [creating, setCreating] = useState(false);
  const [newNom, setNewNom] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newNature, setNewNature] = useState<NatureGestion>("Individuelle");

  function handleSelectChange(v: string) {
    if (v === NEW_PROJET_VALUE) {
      setCreating(true);
      return;
    }
    setCreating(false);
    onChange(v);
  }

  function handleCreate() {
    if (!newNom.trim()) return;
    const id = slugify(newNom) || crypto.randomUUID();
    projetPlantationCollection.insert({
      id,
      nom: newNom.trim(),
      description: newDescription.trim(),
      natureGestion: newNature,
      adresse: "",
      lat: null,
      lng: null,
      surfaceM2: null,
      natureSol: "",
      especeIds: [],
      statut: "Privé",
      createurNom: nom,
      membres: [{ id: crypto.randomUUID(), nom, email, role: "Administrateur" }],
      invitations: [],
      medias: [],
      journal: [],
      createdAt: new Date().toISOString().slice(0, 10),
      publishedAt: null,
    });
    setCreating(false);
    setNewNom("");
    setNewDescription("");
    onChange(id);
  }

  return (
    <div className="space-y-3">
      <Select value={creating ? NEW_PROJET_VALUE : value} onValueChange={handleSelectChange}>
        <SelectTrigger id="projet" className="w-full">
          <SelectValue placeholder="Sélectionnez ou créez un projet" />
        </SelectTrigger>
        <SelectContent>
          {ownProjets.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.nom}
            </SelectItem>
          ))}
          <SelectItem value={NEW_PROJET_VALUE}>+ Créer un nouveau projet</SelectItem>
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
                value={newNom}
                onChange={(e) => setNewNom(e.target.value)}
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
                value={newNature}
                onValueChange={(v) => setNewNature(v as NatureGestion)}
                className="flex gap-4"
              >
                {NATURES_GESTION.map((n) => (
                  <Label
                    key={n}
                    htmlFor={`new-nature-${n}`}
                    className="flex cursor-pointer items-center gap-1.5 font-normal text-sm"
                  >
                    <RadioGroupItem id={`new-nature-${n}`} value={n} />
                    {n}
                  </Label>
                ))}
              </RadioGroup>
            </div>
            <p className="text-muted-foreground text-xs">
              Le projet est créé en statut Privé. Vous pourrez compléter son adresse, sa surface et ses espèces depuis
              sa page une fois créé.
            </p>
            <Button type="button" size="sm" disabled={!newNom.trim()} onClick={handleCreate}>
              Créer le projet
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
