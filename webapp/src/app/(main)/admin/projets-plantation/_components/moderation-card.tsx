"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { ShieldAlert } from "lucide-react";

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

import { projetPlantationCollection } from "./collection";
import type { ProjetPlantation } from "./data";

/**
 * Platform-moderation actions (US-PROJET-13/14/15). Distinct from the
 * project's own admin controls (Privé ⇄ Public toggle, plain delete):
 * dépublication and moderation-delete require a motif, shown here as the
 * "Administrateur plateforme" surface within the same /admin section since
 * this app has no separate platform-admin role/route yet.
 */
export function ModerationCard({ projet }: { projet: ProjetPlantation }) {
  const router = useRouter();
  const [depublierOpen, setDepublierOpen] = useState(false);
  const [supprimerOpen, setSupprimerOpen] = useState(false);
  const [motif, setMotif] = useState("");

  function depublier() {
    if (!motif.trim()) return;
    projetPlantationCollection.update(projet.id, (draft) => {
      draft.statut = "Dépublié";
      draft.motifDepublication = motif.trim();
    });
    setDepublierOpen(false);
    setMotif("");
  }

  function republier() {
    projetPlantationCollection.update(projet.id, (draft) => {
      draft.statut = "Public";
      draft.motifDepublication = undefined;
    });
  }

  function supprimerModeration() {
    if (!motif.trim()) return;
    projetPlantationCollection.delete([projet.id]);
    router.push("/admin/projets-plantation");
  }

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-base">
          <ShieldAlert className="size-4 text-destructive" />
          Modération plateforme
        </CardTitle>
        <CardDescription className="text-xs">
          Actions réservées aux administrateurs plateforme, distinctes de la gestion du projet par ses membres.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {projet.statut === "Dépublié" && projet.motifDepublication && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-destructive text-xs">
            <p className="font-medium">Motif de dépublication</p>
            <p className="text-destructive/80">{projet.motifDepublication}</p>
          </div>
        )}
        <div className="flex flex-col gap-2">
          {projet.statut === "Public" && (
            <Button variant="outline" size="sm" onClick={() => setDepublierOpen(true)}>
              Dépublier
            </Button>
          )}
          {projet.statut === "Dépublié" && (
            <Button variant="outline" size="sm" onClick={republier}>
              Republier
            </Button>
          )}
          <Button variant="destructive" size="sm" onClick={() => setSupprimerOpen(true)}>
            Supprimer (modération)
          </Button>
        </div>
      </CardContent>

      <AlertDialog open={depublierOpen} onOpenChange={setDepublierOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dépublier « {projet.nom} »</AlertDialogTitle>
            <AlertDialogDescription>
              Le projet ne sera plus visible par les autres membres connectés. Le propriétaire est notifié avec le motif
              ci-dessous ; il peut contacter rgpd@repousse.org pour contester.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Motif de la dépublication…"
            rows={3}
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMotif("")}>Annuler</AlertDialogCancel>
            <AlertDialogAction disabled={!motif.trim()} onClick={depublier}>
              Dépublier
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={supprimerOpen} onOpenChange={setSupprimerOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer définitivement « {projet.nom} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Violation grave des règles de la plateforme. Le contenu descriptif et les médias sont supprimés ; les
              données d'impact sont anonymisées et conservées. Le propriétaire est notifié avec le motif ci-dessous.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Motif de la suppression…"
            rows={3}
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMotif("")}>Annuler</AlertDialogCancel>
            <AlertDialogAction disabled={!motif.trim()} onClick={supprimerModeration}>
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
