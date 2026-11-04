"use client";

import { useState } from "react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { searchAdoptants } from "@/lib/api/nurseries";
import { plantDisplayName, type Nursery } from "@/types/nursery";
import type { Taxon } from "@/types/taxon";

export function NurseryPlants({
  nursery,
  taxa,
  onAdd,
  onRemove,
  onDeposit,
  onGive,
}: {
  nursery: Nursery | null;
  taxa: Taxon[];
  onAdd: (taxonId: string, quantity: number) => Promise<void>;
  onRemove: (plantId: string) => Promise<void>;
  onDeposit: (plantId: string) => Promise<void>;
  onGive?: (plantId: string, projectId: string, quantity: number) => Promise<void>;
}) {
  const [taxonId, setTaxonId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [busy, setBusy] = useState(false);
  const plants = nursery?.plants ?? [];
  const used = new Set(plants.map((plant) => plant.taxon_id).filter(Boolean));
  const available = taxa.filter((taxon) => !used.has(taxon.id));

  async function add() {
    const qty = Number(quantity);
    if (!taxonId || !Number.isInteger(qty) || qty < 1) {
      toast.error("Choisissez une espèce et une quantité d'au moins 1.");
      return;
    }
    setBusy(true);
    try {
      await onAdd(taxonId, qty);
      setTaxonId("");
      setQuantity("1");
      toast.success("Arbre ajouté.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible d'ajouter cet arbre.");
    } finally {
      setBusy(false);
    }
  }

  async function run(action: () => Promise<void>, success: string) {
    setBusy(true);
    try {
      await action();
      toast.success(success);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "L'action a échoué.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {plants.length === 0 && <p className="text-muted-foreground text-sm">Aucun arbre pour l'instant.</p>}
      <ul className="space-y-2">
        {plants.map((plant) => {
          const name = plantDisplayName(plant, taxa);
          const pending = plant.taxon_id === null;
          return (
            <li key={plant.id} className="flex flex-wrap items-center gap-2 rounded-lg border p-2">
              <span className="min-w-0 flex-1 text-sm">
                <span className="font-medium">{name}</span>
                <span className="ml-2 tabular-nums text-muted-foreground">{plant.quantity}</span>
              </span>
              <Button
                type="button"
                size="sm"
                disabled={busy || pending || plant.quantity < 1}
                onClick={() => run(() => onDeposit(plant.id), "Déposé à la clé des champs.")}
              >
                Déposé à la clé des champs
              </Button>
              {nursery && onGive && !pending && (
                <DirectGift
                  quantity={plant.quantity}
                  disabled={busy}
                  onGive={(projectId, qty) => run(() => onGive(plant.id, projectId, qty), "Don enregistré sur le projet.")}
                />
              )}
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => run(() => onRemove(plant.id), "Arbre retiré.")}
              >
                Retirer
              </Button>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-48 flex-1">
          <Select value={taxonId} onValueChange={setTaxonId}>
            <SelectTrigger aria-label="Espèce à ajouter">
              <SelectValue placeholder="Ajouter un arbre…" />
            </SelectTrigger>
            <SelectContent>
              {available.map((taxon) => (
                <SelectItem key={taxon.id} value={taxon.id}>
                  {taxon.common_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Input
          type="number"
          min={1}
          aria-label="Quantité"
          className="w-24"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
        />
        <Button type="button" disabled={busy} onClick={add}>
          Ajouter
        </Button>
      </div>
    </div>
  );
}

function DirectGift({
  quantity,
  disabled,
  onGive,
}: {
  quantity: number;
  disabled: boolean;
  onGive: (projectId: string, quantity: number) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [projects, setProjects] = useState<{ id: string; name: string; owner: string }[]>([]);

  async function lookup() {
    const people = await searchAdoptants(query);
    setProjects(
      people.flatMap((person) =>
        person.projects.map((project) => ({
          id: project.id,
          name: project.name,
          owner: [person.first_name, person.last_name].filter(Boolean).join(" ") || "Adoptant",
        })),
      ),
    );
  }

  if (!open) {
    return (
      <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => setOpen(true)}>
        Donné en direct
      </Button>
    );
  }

  return (
    <div className="flex w-full flex-wrap items-center gap-2">
      <Input aria-label="Chercher un adoptant" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom de l'adoptant" />
      <Button type="button" size="sm" variant="outline" onClick={lookup}>
        Chercher
      </Button>
      {projects.map((project) => (
        <Button key={project.id} type="button" size="sm" disabled={disabled} onClick={() => onGive(project.id, quantity)}>
          {project.owner} — {project.name}
        </Button>
      ))}
    </div>
  );
}
