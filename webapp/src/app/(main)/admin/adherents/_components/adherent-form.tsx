"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { UserStatus } from "@/types/user";

import { adherentCollection } from "./collection";
import { isAdhesionActive, statusLabels } from "./data";

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  status: UserStatus;
  membershipYear: string;
  adhesionActive: boolean;
};

type AdherentFormProps = {
  mode: "create" | "edit";
  defaultValues?: Partial<FormValues>;
  /** id of the member being edited (immutable collection key). */
  adherentId?: string;
};

export function AdherentForm({ mode, defaultValues, adherentId }: AdherentFormProps) {
  const isEdit = mode === "edit";
  const router = useRouter();

  const [values, setValues] = useState<FormValues>({
    firstName: defaultValues?.firstName ?? "",
    lastName: defaultValues?.lastName ?? "",
    email: defaultValues?.email ?? "",
    status: defaultValues?.status ?? "active",
    membershipYear: defaultValues?.membershipYear ?? `${new Date().getFullYear()}`,
    adhesionActive: defaultValues?.adhesionActive ?? false,
  });

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  const canSubmit =
    values.firstName.trim().length > 0 &&
    values.lastName.trim().length > 0 &&
    (isEdit || values.email.trim().length > 0);

  function handleSubmit() {
    if (!canSubmit) return;
    const membershipYear = Number.parseInt(values.membershipYear, 10);
    const record = {
      first_name: values.firstName.trim(),
      last_name: values.lastName.trim(),
      status: values.status,
      membership_year: Number.isNaN(membershipYear) ? null : membershipYear,
      adhesion_active: values.adhesionActive,
    };
    if (isEdit && adherentId) {
      adherentCollection.update(adherentId, (draft) => Object.assign(draft, record));
    } else {
      const id = crypto.randomUUID();
      adherentCollection.insert({
        ...record,
        id,
        email: values.email.trim(),
        role: "member",
        taxon_editor: false,
        avatar_url: null,
        last_seen_at: null,
        profiles: [],
      });
    }
    router.push("/admin/adherents");
  }

  function handleDeactivate() {
    if (!adherentId) return;
    adherentCollection.update(adherentId, (draft) => {
      draft.status = "suspended";
    });
    router.push("/admin/adherents");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/admin/adherents">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{isEdit ? "Modifier le membre" : "Ajouter un membre"}</h1>
          <p className="text-muted-foreground text-sm">
            {isEdit
              ? "Modifiez les informations du compte membre."
              : "Créez un nouveau compte membre pour l'association."}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informations personnelles</CardTitle>
              <CardDescription className="text-xs">Identité et coordonnées du membre.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    placeholder="Prénom"
                    value={values.firstName}
                    onChange={(e) => set("firstName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    placeholder="Nom de famille"
                    value={values.lastName}
                    onChange={(e) => set("lastName", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Adresse email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="prenom.nom@email.fr"
                  value={values.email}
                  disabled={isEdit}
                  onChange={(e) => set("email", e.target.value)}
                />
                {isEdit ? (
                  <p className="text-muted-foreground text-xs">
                    L'adresse email identifie le compte et ne peut pas être modifiée.
                  </p>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    Le compte est créé avec le rôle Membre — utilisez la page Rôles pour le promouvoir Admin.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Adhésion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Statut du compte</Label>
                <Select value={values.status} onValueChange={(v) => set("status", v as UserStatus)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(statusLabels) as UserStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {statusLabels[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="membershipYear">Année d'adhésion</Label>
                <Input
                  id="membershipYear"
                  type="number"
                  value={values.membershipYear}
                  onChange={(e) => set("membershipYear", e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium text-sm">Adhésion à jour</p>
                  <p className="text-muted-foreground text-xs leading-snug">
                    {isAdhesionActive({ adhesion_active: values.adhesionActive })
                      ? "Adhésion active pour l'année en cours."
                      : "Le compte reste utilisable, seule l'adhésion payante n'est pas à jour."}
                  </p>
                </div>
                <Switch checked={values.adhesionActive} onCheckedChange={(checked) => set("adhesionActive", checked)} />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            <Button className="w-full" disabled={!canSubmit} onClick={handleSubmit}>
              {isEdit ? "Enregistrer les modifications" : "Créer le membre"}
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/admin/adherents">Annuler</Link>
            </Button>
            {isEdit && (
              <Button
                variant="destructive"
                className="w-full"
                disabled={values.status === "suspended"}
                onClick={handleDeactivate}
              >
                Désactiver le compte
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
