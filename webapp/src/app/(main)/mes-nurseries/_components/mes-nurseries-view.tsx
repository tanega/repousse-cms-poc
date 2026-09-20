"use client";

import { useState } from "react";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { archiveNursery, createNursery, updateNursery } from "@/lib/api/nurseries";
import type { Nursery, NurseryAttrs } from "@/types/nursery";

import { nurseryCollection, taxonOptionsCollection } from "./collection";
import { NurseryForm } from "./nursery-form";

export function MesNurseriesView() {
  const { data: nurseries = [] } = useLiveQuery((q) => q.from({ nursery: nurseryCollection }));
  const { data: taxa = [] } = useLiveQuery((q) => q.from({ taxon: taxonOptionsCollection }));

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Nursery | null>(null);
  const [pendingArchive, setPendingArchive] = useState<Nursery | null>(null);

  async function handleSubmit(attrs: NurseryAttrs) {
    if (editing) {
      await updateNursery(editing.id, attrs);
    } else {
      await createNursery(attrs);
    }
    await nurseryCollection.utils.refetch();
  }

  async function handleArchive(nursery: Nursery) {
    try {
      await archiveNursery(nursery.id);
      await nurseryCollection.utils.refetch();
      toast.success("Nurserie archivée.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'archivage.");
    } finally {
      setPendingArchive(null);
    }
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
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <Sprout className="size-8 text-muted-foreground" />
            <p className="font-medium text-sm">Aucune nurserie pour l'instant</p>
            <p className="max-w-md text-muted-foreground text-sm">
              Déclarez un lieu de réserve et les plants que vous y conservez, pour que les coordinateurs sachent ce qui
              est disponible dans le réseau.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {nurseries.map((nursery) => {
            const total = nursery.plants.reduce((sum, p) => sum + p.quantity, 0);
            return (
              <Card key={nursery.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{nursery.name}</CardTitle>
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
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {nursery.plants.length} espèce{nursery.plants.length > 1 ? "s" : ""}
                    </Badge>
                    <Badge variant="outline">
                      {total} plant{total > 1 ? "s" : ""}
                    </Badge>
                  </div>
                  {nursery.notes && <p className="line-clamp-3 text-muted-foreground text-sm">{nursery.notes}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
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
