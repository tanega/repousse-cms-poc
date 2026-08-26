"use client";

import * as React from "react";

import { useLiveQuery } from "@tanstack/react-db";
import { toast } from "sonner";

import { adherentCollection } from "@/app/(main)/admin/adherents/_components/collection";
import { fullName, roleLabels } from "@/app/(main)/admin/adherents/_components/data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateUserRole } from "@/lib/api/admin-users";
import { fetchCurrentUser } from "@/lib/api/me";
import { hasMinRole } from "@/lib/auth/roles";
import { getInitials } from "@/lib/utils";
import type { CurrentUser, UserRole } from "@/types/user";

const ROLE_OPTIONS: UserRole[] = ["member", "admin", "superadmin"];

export function RolesView() {
  const { data: rows } = useLiveQuery(adherentCollection);
  const users = React.useMemo(() => rows ?? [], [rows]);
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [currentUser, setCurrentUser] = React.useState<CurrentUser | null>(null);

  React.useEffect(() => {
    fetchCurrentUser()
      .then(setCurrentUser)
      .catch(() => setCurrentUser(null));
  }, []);

  const isSuperadmin = currentUser ? hasMinRole(currentUser.role, "superadmin") : false;

  async function handleRoleChange(user: CurrentUser, role: UserRole) {
    setPendingId(user.id);
    try {
      await updateUserRole(user.id, role);
      await adherentCollection.utils.refetch();
      toast.success(`Rôle mis à jour pour ${fullName(user) || user.email}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Échec de la mise à jour du rôle.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-xl leading-none">Rôles</CardTitle>
        <CardDescription className="max-w-lg leading-snug">
          Attribuez le rôle Admin ou Superadmin à un membre. Seul un superadmin peut modifier les rôles ; un superadmin
          ne peut pas se retirer lui-même le rôle s'il est le dernier.
        </CardDescription>
      </CardHeader>
      <CardContent className="divide-y p-0">
        {users.map((user) => (
          <div key={user.id} className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar size="lg">
                <AvatarFallback>{getInitials(fullName(user) || user.email)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="truncate font-medium text-foreground text-sm">{fullName(user) || "—"}</div>
                <div className="truncate text-muted-foreground text-sm">{user.email}</div>
              </div>
            </div>
            {isSuperadmin ? (
              <Select
                value={user.role}
                disabled={pendingId === user.id}
                onValueChange={(v) => handleRoleChange(user, v as UserRole)}
              >
                <SelectTrigger size="sm" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  {ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role} value={role}>
                      {roleLabels[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="outline">{roleLabels[user.role]}</Badge>
            )}
          </div>
        ))}
        {users.length === 0 && <p className="px-4 py-6 text-center text-muted-foreground text-sm">Aucun membre.</p>}
      </CardContent>
    </Card>
  );
}
