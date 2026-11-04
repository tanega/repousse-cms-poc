"use client";

import { useEffect, useState } from "react";

import { useLiveQuery } from "@tanstack/react-db";
import { MapPin, Pencil, Plus, Sprout, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  addNurseryPlant,
  archiveNursery,
  createNursery,
  depositNurseryPlant,
  fetchMyDeposits,
  givePlantDirectly,
  removeNurseryPlant,
  updateNursery,
  type CleDesChampsDeposit,
} from "@/lib/api/nurseries";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import type { Nursery, NurseryAttrs } from "@/types/nursery";

import { nurseryCollection, taxonOptionsCollection } from "./collection";
import { NurseryForm } from "./nursery-form";
import { NurseryPlants } from "./nursery-plants";

export function MesNurseriesView() {
  const { user } = useCurrentUser();
  const { data: nurseries = [] } = useLiveQuery((q) => q.from({ nursery: nurseryCollection }));
  const { data: taxa = [] } = useLiveQuery((q) => q.from({ taxon: taxonOptionsCollection }));

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Nursery | null>(null);
  const [pendingArchive, setPendingArchive] = useState<Nursery | null>(null);
  const [deposits, setDeposits] = useState<CleDesChampsDeposit[]>([]);

  useEffect(() => {
    fetchMyDeposits()
      .then(setDeposits)
      .catch(() => setDeposits([]));
  }, []);

  async function refresh() {
    await nurseryCollection.utils.refetch();
    setDeposits(await fetchMyDeposits());
  }

  async function handleSubmit(attrs: NurseryAttrs) {
    if (editing) {
      await updateNursery(editing.id, attrs);
    } else {
      await createNursery(attrs);
    }
    await refresh();
  }

  async function handleArchive(nursery: Nursery) {
    try {
      await archiveNursery(nursery.id);
      await refresh();
      toast.success("Nurserie archivée.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'archivage.");
    } finally {
      setPendingArchive(null);
    }
  }

  async function ensureNursery(): Promise<Nursery> {
    const existing = nurseries[0];
    if (existing) return existing;
    const profile = user?.profiles.find((item) => item.profile_type === "host_family");
    return createNursery({
      name: "Ma nurserie",
      address: profile?.hosting_address ?? null,
      lat: profile?.hosting_lat ?? null,
      lng: profile?.hosting_lng ?? null,
      plants: [],
    });
  }

  async function handleAdd(nursery: Nursery | null, taxonId: string, quantity: number) {
    const target = nursery ?? (await ensureNursery());
    if (nursery) {
      await addNurseryPlant(target.id, taxonId, quantity);
    } else {
      await updateNursery(target.id, {
        name: target.name,
        notes: target.notes,
        address: target.address,
        lat: target.lat,
        lng: target.lng,
        plants: [{ taxon_id: taxonId, quantity }],
      });
    }
    await refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          Nouvelle nurserie
        </Button>
      </div>

      {nurseries.length === 0 ? (
        <Card>
          <CardContent className="space-y-4 py-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <Sprout className="size-8 text-muted-foreground" />
              <p className="font-medium text-sm">Ajoutez votre premier arbre</p>
              <p className="max-w-md text-muted-foreground text-sm">
                Choisissez l'espèce et la quantité. Un lieu « Ma nurserie » est créé pour vous.
              </p>
            </div>
            <NurseryPlants
              nursery={null}
              taxa={taxa}
              onAdd={(taxonId, quantity) => handleAdd(null, taxonId, quantity)}
              onRemove={async () => undefined}
              onDeposit={async () => undefined}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {nurseries.map((nursery) => {
            const total = nursery.plants.reduce((sum, plant) => sum + plant.quantity, 0);
            return (
            <Card key={nursery.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{nursery.name}</CardTitle>
                    <p className="text-muted-foreground text-xs">
                      {total} plant{total > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Modifier ${nursery.name}`}
                      onClick={() => {
                        setEditing(nursery);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Archiver ${nursery.name}`}
                      onClick={() => setPendingArchive(nursery)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                {nursery.address && (
                  <p className="flex items-center gap-1 text-muted-foreground text-xs">
                    <MapPin className="size-3 shrink-0" />
                    <span className="truncate">{nursery.address}</span>
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <NurseryPlants
                  nursery={nursery}
                  taxa={taxa}
                  onAdd={(taxonId, quantity) => handleAdd(nursery, taxonId, quantity)}
                  onRemove={async (plantId) => {
                    await removeNurseryPlant(nursery.id, plantId);
                    await refresh();
                  }}
                  onDeposit={async (plantId) => {
                    await depositNurseryPlant(nursery.id, plantId);
                    await refresh();
                  }}
                  onGive={async (plantId, projectId, quantity) => {
                    await givePlantDirectly(nursery.id, plantId, projectId, quantity);
                    await refresh();
                  }}
                />
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

      {deposits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Déjà déposés à la clé des champs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {deposits.map((deposit) => (
              <p key={deposit.id}>
                {deposit.quantity} {deposit.common_name ?? "arbre"}
                {deposit.allocated_at ? " — pris en distribution" : " — en stock"}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      {formOpen && (
        <NurseryForm open={formOpen} onOpenChange={setFormOpen} nursery={editing} taxa={taxa} onSubmit={handleSubmit} />
      )}

      <AlertDialog open={pendingArchive !== null} onOpenChange={(open) => !open && setPendingArchive(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archiver « {pendingArchive?.name} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              La nurserie disparaît de votre liste et de votre profil. Son historique est conservé et reste consultable
              par les coordinateurs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => pendingArchive && handleArchive(pendingArchive)}>
              Archiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
