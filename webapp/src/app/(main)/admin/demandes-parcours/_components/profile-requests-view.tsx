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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  approveProfileRequest,
  fetchProfileRequests,
  PROFILE_REQUESTS_CHANGED_EVENT,
  type ProfileRequest,
  rejectProfileRequest,
} from "@/lib/api/profile-requests";
import type { ProfileStatus, ProfileType } from "@/types/user";

const PROFILE_LABELS: Record<ProfileType, string> = {
  volunteer: "Bénévole",
  adoptant: "Adoptant",
  host_family: "Famille d'accueil",
};

const dateFormat = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });

const EMPTY_LABELS: Record<ProfileStatus, string> = {
  pending: "Aucune demande en attente.",
  active: "Aucune demande acceptée.",
  rejected: "Aucune demande refusée.",
};

function memberName(user: ProfileRequest["user"]) {
  return [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email;
}

export function ProfileRequestsView() {
  const [status, setStatus] = useState<ProfileStatus>("pending");
  const [requests, setRequests] = useState<ProfileRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<ProfileRequest | null>(null);
  const [reason, setReason] = useState("");

  const load = useCallback(async (next: ProfileStatus) => {
    setLoading(true);
    try {
      setRequests(await fetchProfileRequests(next));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible de charger les demandes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(status);
  }, [load, status]);

  async function decide(request: ProfileRequest, action: () => Promise<unknown>, success: string) {
    setBusyId(request.id);
    try {
      await action();
      toast.success(success);
      window.dispatchEvent(new Event(PROFILE_REQUESTS_CHANGED_EVENT));
      await load(status);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec du traitement de la demande.");
      await load(status);
    } finally {
      setBusyId(null);
    }
  }

  async function confirmReject() {
    if (!rejecting) return;
    const target = rejecting;
    setRejecting(null);
    await decide(target, () => rejectProfileRequest(target.id, reason), "Demande refusée, le membre est notifié.");
    setReason("");
  }

  return (
    <div className="@container/main flex flex-col gap-6">
      <div>
        <h1 className="font-semibold text-2xl">Demandes de parcours</h1>
        <p className="text-muted-foreground text-sm">
          Validez les demandes des membres qui souhaitent rejoindre un parcours (Adoptant, Famille d'accueil). Le membre
          est notifié de votre décision.
        </p>
      </div>

      <Tabs value={status} onValueChange={(v) => setStatus(v as ProfileStatus)}>
        <TabsList>
          <TabsTrigger value="pending">En attente</TabsTrigger>
          <TabsTrigger value="active">Acceptées</TabsTrigger>
          <TabsTrigger value="rejected">Refusées</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {status === "pending"
              ? "À traiter"
              : status === "active"
                ? "Historique des acceptations"
                : "Historique des refus"}
          </CardTitle>
          <CardDescription>{loading ? "Chargement…" : `${requests.length} demande(s)`}</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {!loading && requests.length === 0 ? (
            <p className="px-6 py-10 text-center text-muted-foreground text-sm">{EMPTY_LABELS[status]}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Membre</TableHead>
                  <TableHead>Parcours</TableHead>
                  <TableHead>{status === "pending" ? "Demandé le" : "Décidé le"}</TableHead>
                  {status === "rejected" && <TableHead>Motif</TableHead>}
                  {status === "pending" && <TableHead className="pr-6 text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => {
                  const when = status === "pending" ? r.requested_at : r.decided_at;
                  return (
                    <TableRow key={r.id} data-testid="profile-request-row">
                      <TableCell className="pl-6">
                        <div className="font-medium text-sm">{memberName(r.user)}</div>
                        <div className="text-muted-foreground text-xs">{r.user.email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{PROFILE_LABELS[r.profile_type]}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{when ? dateFormat.format(new Date(when)) : "—"}</TableCell>
                      {status === "rejected" && (
                        <TableCell className="max-w-xs text-muted-foreground text-sm">
                          {r.rejection_reason ?? "—"}
                        </TableCell>
                      )}
                      {status === "pending" && (
                        <TableCell className="pr-6">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              disabled={busyId === r.id}
                              onClick={() =>
                                decide(r, () => approveProfileRequest(r.id), "Demande acceptée, le membre est notifié.")
                              }
                            >
                              <Check className="size-4" />
                              Accepter
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busyId === r.id}
                              onClick={() => {
                                setReason("");
                                setRejecting(r);
                              }}
                            >
                              <X className="size-4" />
                              Refuser
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={rejecting !== null} onOpenChange={(open) => !open && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser la demande</DialogTitle>
            <DialogDescription>
              {rejecting && `${memberName(rejecting.user)} · ${PROFILE_LABELS[rejecting.profile_type]}. `}
              Le motif (facultatif) sera communiqué au membre, qui pourra effectuer une nouvelle demande.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motif du refus (facultatif)"
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmReject}>
              Refuser la demande
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
