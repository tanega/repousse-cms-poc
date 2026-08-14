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
import type { DistributionEvent } from "@/types/distribution";

export interface DeleteTarget {
  event: DistributionEvent;
}

interface DeleteAlertDialogProps {
  target: DeleteTarget | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

export function DeleteAlertDialog({ target, onClose, onConfirm }: DeleteAlertDialogProps) {
  const open = !!target;
  const event = target?.event;
  const blocked = (event?.reservations_count ?? 0) > 0;

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
            Supprimer «&nbsp;{event?.title}&nbsp;» ?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm">
              {blocked ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-destructive">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    <div className="space-y-1.5">
                      <p className="font-medium">Suppression bloquée</p>
                      <p className="text-destructive/80">
                        Cet événement compte {event?.reservations_count} inscription(s) active(s). Clôturez-le plutôt
                        que de le supprimer.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Cette action est irréversible. L'événement <strong>{event?.title}</strong> et ses créneaux seront
                  définitivement supprimés.
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
              if (event) onConfirm(event.id);
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
