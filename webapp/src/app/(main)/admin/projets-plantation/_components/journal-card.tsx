"use client";

import { useState } from "react";

import { Check, Pencil, Send, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

import { projetPlantationCollection } from "./collection";
import type { ProjetPlantation } from "./data";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export function JournalCard({
  projet,
  currentUserNom,
  canPost,
  isProjectAdmin,
}: {
  projet: ProjetPlantation;
  currentUserNom: string;
  canPost: boolean;
  isProjectAdmin: boolean;
}) {
  const [contenu, setContenu] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContenu, setEditingContenu] = useState("");

  const entries = [...projet.journal].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  function postNote() {
    if (!contenu.trim()) return;
    projetPlantationCollection.update(projet.id, (draft) => {
      draft.journal.push({
        id: crypto.randomUUID(),
        contenu: contenu.trim(),
        auteurNom: currentUserNom,
        createdAt: new Date().toISOString().slice(0, 10),
      });
    });
    setContenu("");
  }

  function startEdit(id: string, current: string) {
    setEditingId(id);
    setEditingContenu(current);
  }

  function saveEdit(id: string) {
    if (!editingContenu.trim()) return;
    projetPlantationCollection.update(projet.id, (draft) => {
      const note = draft.journal.find((n) => n.id === id);
      if (note) {
        note.contenu = editingContenu.trim();
        note.updatedAt = new Date().toISOString().slice(0, 10);
      }
    });
    setEditingId(null);
  }

  function deleteNote(id: string) {
    projetPlantationCollection.update(projet.id, (draft) => {
      draft.journal = draft.journal.filter((n) => n.id !== id);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Journal d'actions</CardTitle>
        <CardDescription className="text-xs">
          Historique des actions de plantation, ordre chronologique inversé.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {canPost && (
          <div className="space-y-2">
            <Textarea
              placeholder="Consigner une action, une observation…"
              rows={2}
              value={contenu}
              onChange={(e) => setContenu(e.target.value)}
            />
            <Button type="button" size="sm" onClick={postNote} disabled={!contenu.trim()}>
              <Send className="size-4" />
              Publier la note
            </Button>
          </div>
        )}

        {entries.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucune note pour l'instant.</p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => {
              const canEditNote = entry.auteurNom === currentUserNom;
              const canDeleteNote = canEditNote || isProjectAdmin;
              const isEditing = editingId === entry.id;
              return (
                <div key={entry.id} className="rounded-md border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-muted-foreground text-xs">
                      <span className="font-medium text-foreground">{entry.auteurNom}</span> ·{" "}
                      {dateFormatter.format(new Date(entry.createdAt))}
                      {entry.updatedAt && " · modifiée"}
                    </div>
                    {!isEditing && (canEditNote || canDeleteNote) && (
                      <div className="flex shrink-0 gap-1">
                        {canEditNote && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => startEdit(entry.id, entry.contenu)}
                            aria-label="Modifier la note"
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                        )}
                        {canDeleteNote && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => deleteNote(entry.id)}
                            aria-label="Supprimer la note"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  {isEditing ? (
                    <div className="mt-2 space-y-2">
                      <Textarea rows={2} value={editingContenu} onChange={(e) => setEditingContenu(e.target.value)} />
                      <div className="flex gap-1.5">
                        <Button
                          type="button"
                          size="icon-sm"
                          onClick={() => saveEdit(entry.id)}
                          aria-label="Enregistrer"
                        >
                          <Check className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setEditingId(null)}
                          aria-label="Annuler"
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1 whitespace-pre-wrap">{entry.contenu}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
