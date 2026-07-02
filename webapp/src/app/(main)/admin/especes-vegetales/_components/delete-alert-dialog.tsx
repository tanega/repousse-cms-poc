"use client";

import { AlertTriangle, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

import type { Taxon } from "./data";

export interface DeleteTarget {
  taxon: Taxon;
  hasChildren: boolean;
  isUsed: boolean;
}

interface DeleteAlertDialogProps {
  target: DeleteTarget | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

export function DeleteAlertDialog({ target, onClose, onConfirm }: DeleteAlertDialogProps) {
  const open = !!target;
  const taxon = target?.taxon;
  const blocked = (target?.hasChildren || target?.isUsed) ?? false;

  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="size-5 text-destructive" />
            Supprimer «&nbsp;{taxon?.nomCommun}&nbsp;» ?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm">
              {blocked ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-destructive">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    <div className="space-y-1.5">
                      <p className="font-medium">Suppression bloquée</p>
                      {target?.isUsed && (
                        <p className="text-destructive/80">
                          Ce taxon est référencé dans{" "}
                          {(taxon?.nbDistributions ?? 0) > 0 &&
                            `${taxon!.nbDistributions} distribution(s)`}
                          {(taxon?.nbDistributions ?? 0) > 0 &&
                            (taxon?.nbProjets ?? 0) > 0 &&
                            " et "}
                          {(taxon?.nbProjets ?? 0) > 0 &&
                            `${taxon!.nbProjets} projet(s) de plantation`}
                          . Retirez-le d'abord de ces ressources.
                        </p>
                      )}
                      {target?.hasChildren && (
                        <p className="text-destructive/80">
                          Ce taxon possède des taxons enfants. Supprimez-les d'abord.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Cette action est irréversible. Le taxon{" "}
                  {taxon?.nomScientifique ? (
                    <em>{taxon.nomScientifique}</em>
                  ) : (
                    <strong>{taxon?.nomCommun}</strong>
                  )}{" "}
                  sera définitivement supprimé du catalogue.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Annuler</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={blocked}
            onClick={() => {
              if (taxon) onConfirm(taxon.id);
              onClose();
            }}
          >
            Supprimer définitivement
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
