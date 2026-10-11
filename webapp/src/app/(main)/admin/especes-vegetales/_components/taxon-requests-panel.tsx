"use client";

import { useCallback, useEffect, useState } from "react";

import { Check, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { fetchTaxa, fetchTaxonCategories } from "@/lib/api/taxa";
import {
  approveTaxonRequest,
  fetchTaxonRequests,
  rejectTaxonRequest,
  TAXON_REQUESTS_CHANGED_EVENT,
} from "@/lib/api/taxon-requests";
import {
  TAXONOMIC_LEVEL_LABELS,
  TAXONOMIC_LEVELS,
  type Taxon,
  type TaxonCategory,
  type TaxonomicLevel,
} from "@/types/taxon";
import { type AdminTaxonRequest, type TaxonRequestStatus, taxonRequestLabel } from "@/types/taxon-request";

const NO_CATEGORY = "none";
const dateFormat = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });

const EMPTY_LABELS: Record<TaxonRequestStatus, string> = {
  pending: "Aucune demande en attente.",
  approved: "Aucune demande acceptée.",
  rejected: "Aucune demande refusée.",
};

function askerName(user: AdminTaxonRequest["requested_by"]) {
  return [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email;
}

function notifyChanged() {
  window.dispatchEvent(new Event(TAXON_REQUESTS_CHANGED_EVENT));
}

export function TaxonRequestsPanel() {
  const [status, setStatus] = useState<TaxonRequestStatus>("pending");
  const [requests, setRequests] = useState<AdminTaxonRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<AdminTaxonRequest | null>(null);
  const [rejecting, setRejecting] = useState<AdminTaxonRequest | null>(null);

  const load = useCallback(async (next: TaxonRequestStatus) => {
    setLoading(true);
    try {
      setRequests(await fetchTaxonRequests(next));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible de charger les demandes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(status);
  }, [load, status]);

  async function onDecided(message: string) {
    toast.success(message);
    notifyChanged();
    await load(status);
  }

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={status} onValueChange={(v) => setStatus(v as TaxonRequestStatus)}>
        <TabsList>
          <TabsTrigger value="pending">En attente</TabsTrigger>
          <TabsTrigger value="approved">Acceptées</TabsTrigger>
          <TabsTrigger value="rejected">Refusées</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Demandes d'ajout de plante</CardTitle>
          <CardDescription>
            {loading ? "Chargement…" : `${requests.length} demande(s)`} — le membre est notifié de votre décision.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {!loading && requests.length === 0 ? (
            <p className="px-6 py-10 text-center text-muted-foreground text-sm">{EMPTY_LABELS[status]}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Plante demandée</TableHead>
                  <TableHead>Demandeur</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Date</TableHead>
                  {status === "rejected" && <TableHead>Motif</TableHead>}
                  {status === "pending" && <TableHead className="pr-6 text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => (
                  <TableRow key={r.id} data-testid="taxon-request-row">
                    <TableCell className="pl-6">
                      <div className="font-medium text-sm">{r.common_name ?? "—"}</div>
                      {r.scientific_name && (
                        <div className="text-muted-foreground text-xs italic">{r.scientific_name}</div>
                      )}
                      {r.comment && <div className="mt-1 max-w-sm text-muted-foreground text-xs">{r.comment}</div>}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{askerName(r.requested_by)}</div>
                      <div className="text-muted-foreground text-xs">{r.requested_by.email}</div>
                    </TableCell>
                    <TableCell>
                      {r.category_name ? (
                        <Badge variant="outline">{r.category_name}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {dateFormat.format(
                        new Date(status === "pending" ? r.inserted_at : (r.decided_at ?? r.inserted_at)),
                      )}
                    </TableCell>
                    {status === "rejected" && (
                      <TableCell className="max-w-xs text-muted-foreground text-sm">
                        {r.rejection_reason ?? "—"}
                      </TableCell>
                    )}
                    {status === "pending" && (
                      <TableCell className="pr-6">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" onClick={() => setApproving(r)}>
                            <Check className="size-4" />
                            Accepter
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setRejecting(r)}>
                            <X className="size-4" />
                            Refuser
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {approving && (
        <ApproveDialog
          request={approving}
          onClose={() => setApproving(null)}
          onDone={async () => {
            setApproving(null);
            await onDecided("Plante ajoutée à la liste, le demandeur est notifié.");
          }}
        />
      )}
      {rejecting && (
        <RejectDialog
          request={rejecting}
          onClose={() => setRejecting(null)}
          onDone={async () => {
            setRejecting(null);
            await onDecided("Demande refusée, le demandeur est notifié.");
          }}
        />
      )}
    </div>
  );
}

function ApproveDialog({
  request,
  onClose,
  onDone,
}: {
  request: AdminTaxonRequest;
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const [mode, setMode] = useState<"create" | "link">("create");
  const [commonName, setCommonName] = useState(request.common_name ?? "");
  const [scientificName, setScientificName] = useState(request.scientific_name ?? "");
  const [level, setLevel] = useState<TaxonomicLevel>("species");
  const [categoryId, setCategoryId] = useState(request.category_id ?? NO_CATEGORY);
  const [existingId, setExistingId] = useState("");
  const [categories, setCategories] = useState<TaxonCategory[]>([]);
  const [taxa, setTaxa] = useState<Taxon[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchTaxonCategories().then(setCategories, () => undefined);
    fetchTaxa().then(setTaxa, () => undefined);
  }, []);

  const canSubmit = mode === "create" ? commonName.trim().length > 0 : existingId !== "";

  async function submit() {
    setBusy(true);
    try {
      await approveTaxonRequest(
        request.id,
        mode === "link"
          ? { taxonId: existingId }
          : {
              taxon: {
                common_name: commonName.trim(),
                scientific_name: scientificName.trim() || null,
                taxonomic_level: level,
                category_id: categoryId === NO_CATEGORY ? null : categoryId,
              },
            },
      );
      await onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'acceptation.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Accepter « {taxonRequestLabel(request)} »</DialogTitle>
          <DialogDescription>
            Complétez la fiche : la plante rejoint la liste de référence et est rattachée aux nurseries des membres qui
            l'ont demandée.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as "create" | "link")}>
          <TabsList className="w-full">
            <TabsTrigger value="create">Créer une espèce</TabsTrigger>
            <TabsTrigger value="link">Lier à une espèce existante</TabsTrigger>
          </TabsList>
        </Tabs>

        {mode === "create" ? (
          <div className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="approve-common">Nom commun</FieldLabel>
              <Input id="approve-common" value={commonName} onChange={(e) => setCommonName(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="approve-scientific">Nom scientifique</FieldLabel>
              <Input
                id="approve-scientific"
                value={scientificName}
                onChange={(e) => setScientificName(e.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="approve-level">Niveau</FieldLabel>
                <Select value={level} onValueChange={(v) => setLevel(v as TaxonomicLevel)}>
                  <SelectTrigger id="approve-level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TAXONOMIC_LEVELS.map((l) => (
                      <SelectItem key={l} value={l}>
                        {TAXONOMIC_LEVEL_LABELS[l]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="approve-category">Catégorie</FieldLabel>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger id="approve-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_CATEGORY}>Aucune</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </div>
        ) : (
          <Field>
            <FieldLabel htmlFor="approve-existing">Espèce existante</FieldLabel>
            <Select value={existingId} onValueChange={setExistingId}>
              <SelectTrigger id="approve-existing">
                <SelectValue placeholder="Choisir une espèce…" />
              </SelectTrigger>
              <SelectContent>
                {taxa.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.common_name}
                    {t.scientific_name ? ` · ${t.scientific_name}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={!canSubmit || busy} onClick={submit}>
            {busy ? "Enregistrement…" : "Accepter la demande"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RejectDialog({
  request,
  onClose,
  onDone,
}: {
  request: AdminTaxonRequest;
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await rejectTaxonRequest(request.id, reason);
      await onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec du refus.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Refuser « {taxonRequestLabel(request)} »</DialogTitle>
          <DialogDescription>
            Le motif (facultatif) est communiqué au demandeur. La plante est retirée de sa nurserie.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Motif du refus (facultatif)"
          rows={4}
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="destructive" disabled={busy} onClick={submit}>
            Refuser la demande
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
