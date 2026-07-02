"use client";

import { useState } from "react";

import { FileText, ImageIcon, Plus, Trash2, Video } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { projetPlantationCollection } from "./collection";
import { MAX_MEDIAS, type ProjetPlantation, TYPES_MEDIA, type TypeMedia } from "./data";

const TYPE_ICONS: Record<TypeMedia, typeof ImageIcon> = {
  Photo: ImageIcon,
  Vidéo: Video,
  PDF: FileText,
};

export function MediasCard({ projet, canEdit }: { projet: ProjetPlantation; canEdit: boolean }) {
  const [type, setType] = useState<TypeMedia>("Photo");
  const [url, setUrl] = useState("");
  const [titre, setTitre] = useState("");
  const [removeId, setRemoveId] = useState<string | null>(null);

  const atLimit = projet.medias.length >= MAX_MEDIAS;

  function addMedia() {
    if (!url.trim() || atLimit) return;
    projetPlantationCollection.update(projet.id, (draft) => {
      draft.medias.push({
        id: crypto.randomUUID(),
        type,
        url: url.trim(),
        titre: titre.trim() || undefined,
        ajouteLe: new Date().toISOString().slice(0, 10),
      });
    });
    setUrl("");
    setTitre("");
  }

  function removeMedia(id: string) {
    projetPlantationCollection.update(projet.id, (draft) => {
      draft.medias = draft.medias.filter((m) => m.id !== id);
    });
    setRemoveId(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Médias</CardTitle>
        <CardDescription className="text-xs">
          Photos, vidéos et documents illustrant le projet · {projet.medias.length}/{MAX_MEDIAS}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {projet.medias.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucun média pour l'instant.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {projet.medias.map((media) => {
              const Icon = TYPE_ICONS[media.type];
              return (
                <div key={media.id} className="group relative overflow-hidden rounded-md border">
                  {media.type === "Photo" ? (
                    <img src={media.url} alt={media.titre ?? "Média du projet"} className="h-24 w-full object-cover" />
                  ) : (
                    <div className="flex h-24 w-full flex-col items-center justify-center gap-1 bg-muted text-muted-foreground">
                      <Icon className="size-6" />
                      <span className="text-xs">{media.type}</span>
                    </div>
                  )}
                  {media.titre && <div className="truncate bg-background/90 px-2 py-1 text-xs">{media.titre}</div>}
                  {canEdit && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon-sm"
                      className="absolute top-1 right-1 size-6 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => setRemoveId(media.id)}
                      aria-label="Supprimer ce média"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {canEdit && (
          <div className="space-y-2 rounded-md border p-3">
            {atLimit ? (
              <p className="text-destructive text-xs">
                Limite de {MAX_MEDIAS} fichiers atteinte. Supprimez un média pour en ajouter un nouveau.
              </p>
            ) : (
              <>
                <div className="flex gap-2">
                  <Select value={type} onValueChange={(v) => setType(v as TypeMedia)}>
                    <SelectTrigger className="w-28 shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES_MEDIA.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Titre / légende (facultatif)"
                    value={titre}
                    onChange={(e) => setTitre(e.target.value)}
                  />
                  <Button type="button" size="sm" onClick={addMedia} disabled={!url.trim()}>
                    <Plus className="size-4" />
                    Ajouter
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>

      <AlertDialog open={!!removeId} onOpenChange={(o) => !o && setRemoveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce média ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => removeId && removeMedia(removeId)}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
