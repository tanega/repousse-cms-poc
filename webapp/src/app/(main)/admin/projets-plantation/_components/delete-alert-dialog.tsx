"use client";

import { Trash2 } from "lucide-react";

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

import type { ProjetPlantation } from "./data";

export interface DeleteTarget {
  projet: ProjetPlantation;
}

interface DeleteAlertDialogProps {
  target: DeleteTarget | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

export function DeleteAlertDialog({ target, onClose, onConfirm }: DeleteAlertDialogProps) {
  const open = !!target;
  const projet = target?.projet;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="size-5 text-destructive" />
            Supprimer «&nbsp;{projet?.nom}&nbsp;» ?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-1.5 text-sm">
              <p className="text-muted-foreground">
                Cette action est irréversible. Le projet <strong>{projet?.nom}</strong>, sa description et ses médias
                seront définitivement supprimés.
              </p>
              <p className="text-muted-foreground text-xs">
                Les données d'impact (espèces et quantités distribuées associées) seront anonymisées et conservées.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Annuler</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={() => {
              if (projet) onConfirm(projet.id);
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
