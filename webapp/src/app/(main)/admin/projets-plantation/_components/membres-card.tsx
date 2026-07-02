"use client";

import { useState } from "react";

import { Mail, Send, Shield, UserMinus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { projetPlantationCollection } from "./collection";
import { type ProjetPlantation, ROLE_COLORS, ROLES_ASSIGNABLES, type RoleMembre } from "./data";

export function MembresCard({ projet, canManage }: { projet: ProjetPlantation; canManage: boolean }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RoleMembre>("Lecteur");

  const admins = projet.membres.filter((m) => m.role === "Administrateur");

  function invite() {
    if (!email.trim()) return;
    projetPlantationCollection.update(projet.id, (draft) => {
      draft.invitations.push({
        id: crypto.randomUUID(),
        destinataire: email.trim(),
        role,
        statut: "En attente",
        envoyeeLe: new Date().toISOString().slice(0, 10),
      });
    });
    setEmail("");
  }

  function changeRole(membreId: string, nextRole: RoleMembre) {
    projetPlantationCollection.update(projet.id, (draft) => {
      const membre = draft.membres.find((m) => m.id === membreId);
      if (membre) membre.role = nextRole;
    });
  }

  function removeMembre(membreId: string) {
    const target = projet.membres.find((m) => m.id === membreId);
    if (target?.role === "Administrateur" && admins.length <= 1) return;
    projetPlantationCollection.update(projet.id, (draft) => {
      draft.membres = draft.membres.filter((m) => m.id !== membreId);
    });
  }

  function cancelInvitation(invitationId: string) {
    projetPlantationCollection.update(projet.id, (draft) => {
      draft.invitations = draft.invitations.filter((i) => i.id !== invitationId);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Membres</CardTitle>
        <CardDescription className="text-xs">
          {projet.membres.length} membre{projet.membres.length > 1 ? "s" : ""} · Au moins un administrateur requis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {projet.membres.map((membre) => {
            const isSoleAdmin = membre.role === "Administrateur" && admins.length <= 1;
            return (
              <div key={membre.id} className="flex items-center justify-between gap-2 rounded-md border p-2.5 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium">{membre.nom}</div>
                  <div className="truncate text-muted-foreground text-xs">{membre.email}</div>
                </div>
                {canManage ? (
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Select value={membre.role} onValueChange={(v) => changeRole(membre.id, v as RoleMembre)}>
                      <SelectTrigger size="sm" className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Administrateur">Administrateur</SelectItem>
                        <SelectItem value="Éditeur">Éditeur</SelectItem>
                        <SelectItem value="Lecteur">Lecteur</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={isSoleAdmin}
                      title={isSoleAdmin ? "Impossible de retirer le seul administrateur" : "Retirer ce membre"}
                      onClick={() => removeMembre(membre.id)}
                    >
                      <UserMinus className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <Badge
                    variant="outline"
                    className={cn("border-0 px-2 py-0.5 text-xs font-normal", ROLE_COLORS[membre.role])}
                  >
                    <Shield className="mr-1 size-3" />
                    {membre.role}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>

        {projet.invitations.length > 0 && (
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Invitations en attente</p>
            {projet.invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between gap-2 rounded-md border border-dashed p-2.5 text-sm"
              >
                <div className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                  <Mail className="size-3.5 shrink-0" />
                  <span className="truncate">{invitation.destinataire}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="outline" className="font-normal text-xs">
                    {invitation.role}
                  </Badge>
                  {canManage && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => cancelInvitation(invitation.id)}>
                      Annuler
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {canManage && (
          <div className="flex gap-2 rounded-md border p-3">
            <Input
              placeholder="email@exemple.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-w-0 flex-1"
            />
            <Select value={role} onValueChange={(v) => setRole(v as RoleMembre)}>
              <SelectTrigger size="default" className="w-32 shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES_ASSIGNABLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" size="icon" onClick={invite} disabled={!email.trim()} aria-label="Inviter">
              <Send className="size-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
