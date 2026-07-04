"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { adherentCollection } from "./collection";
import {
  type AdherentProfileType,
  type AdherentSource,
  type AdherentStatus,
  filters,
  isAdhesionActive,
  profileTypeMeta,
} from "./data";

const profileDescriptions: Record<AdherentProfileType, string> = {
  Bénévole: "Participe aux ateliers et activités de l'association.",
  Adoptant: "Réserve des plants et gère des projets de plantation.",
  "Famille d'accueil": "Héberge de jeunes plants avant leur distribution.",
  Coordinateur: "Organise et coordonne les activités sur le terrain.",
  Administrateur: "Gère l'association et a accès à l'espace d'administration.",
};

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profileTypes: AdherentProfileType[];
  status: AdherentStatus;
  source: AdherentSource;
  memberSince: string;
  notes: string;
};

type AdherentFormProps = {
  mode: "create" | "edit";
  defaultValues?: Partial<FormValues>;
  /** Email identifying the member being edited (immutable collection key). */
  adherentEmail?: string;
};

const today = new Date().toISOString().split("T")[0];

export function AdherentForm({ mode, defaultValues, adherentEmail }: AdherentFormProps) {
  const isEdit = mode === "edit";
  const router = useRouter();

  const [values, setValues] = useState<FormValues>({
    firstName: defaultValues?.firstName ?? "",
    lastName: defaultValues?.lastName ?? "",
    email: defaultValues?.email ?? "",
    phone: defaultValues?.phone ?? "",
    profileTypes: defaultValues?.profileTypes ?? ["Bénévole"],
    status: defaultValues?.status ?? "En attente",
    source: defaultValues?.source ?? "Manuel",
    memberSince: defaultValues?.memberSince ?? today,
    notes: defaultValues?.notes ?? "",
  });

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function toggleProfile(profile: AdherentProfileType) {
    setValues((prev) => ({
      ...prev,
      profileTypes: prev.profileTypes.includes(profile)
        ? prev.profileTypes.filter((p) => p !== profile)
        : [...prev.profileTypes, profile],
    }));
  }

  const profileOrder: AdherentProfileType[] = [
    "Bénévole",
    "Adoptant",
    "Famille d'accueil",
    "Coordinateur",
    "Administrateur",
  ];

  const canSubmit =
    values.firstName.trim().length > 0 && values.lastName.trim().length > 0 && values.profileTypes.length > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    const record = {
      name: `${values.firstName.trim()} ${values.lastName.trim()}`.trim(),
      phone: values.phone.trim() || undefined,
      profileTypes: values.profileTypes,
      source: values.source,
      status: values.status,
      memberSince: format(new Date(`${values.memberSince}T09:00:00`), "dd MMM yyyy, h:mm a"),
      notes: values.notes.trim() || undefined,
    };
    if (isEdit && adherentEmail) {
      adherentCollection.update(adherentEmail, (draft) => Object.assign(draft, record));
    } else {
      adherentCollection.insert({
        ...record,
        email: values.email.trim(),
        lastLoginAt: 0,
        loginCount: 0,
        projectCount: 0,
      });
    }
    router.push("/admin/adherents");
  }

  function handleDeactivate() {
    if (!adherentEmail) return;
    adherentCollection.update(adherentEmail, (draft) => {
      draft.status = "Suspendu";
    });
    router.push("/admin/adherents");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
        {/* ── Left column ── */}
        <div className="space-y-6 lg:col-span-2">
          {/* Informations personnelles */}
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
                {isEdit && (
                  <p className="text-muted-foreground text-xs">
                    L'adresse email identifie le compte et ne peut pas être modifiée.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Téléphone
                  <span className="ml-1.5 text-muted-foreground text-xs font-normal">(facultatif)</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+33 6 00 00 00 00"
                  value={values.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Profils d'engagement */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profils d'engagement</CardTitle>
              <CardDescription className="text-xs">
                Sélectionnez les profils correspondant à l'engagement du membre. Au moins un profil est requis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {profileOrder.map((profile) => {
                const meta = profileTypeMeta[profile];
                const Icon = meta.icon;
                const checked = values.profileTypes.includes(profile);
                return (
                  <label
                    key={profile}
                    htmlFor={`profile-${profile}`}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                      checked ? "border-primary/20 bg-primary/5" : "border-transparent hover:bg-muted/50",
                    )}
                  >
                    <Checkbox
                      id={`profile-${profile}`}
                      checked={checked}
                      onCheckedChange={() => toggleProfile(profile)}
                    />
                    <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-md bg-muted/60")}>
                      <Icon className={cn("size-3.5", meta.className)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm leading-none">{profile}</p>
                      <p className="mt-0.5 text-muted-foreground text-xs leading-snug">
                        {profileDescriptions[profile]}
                      </p>
                    </div>
                  </label>
                );
              })}
            </CardContent>
          </Card>

          {/* Notes internes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes internes</CardTitle>
              <CardDescription className="text-xs">Visibles uniquement par les administrateurs.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Contexte d'adhésion, remarques, informations particulières…"
                rows={4}
                value={values.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-6">
          {/* Adhésion */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Adhésion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select value={values.status} onValueChange={(v) => set("status", v as AdherentStatus)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {filters.status
                      .filter((s) => s !== "Tous")
                      .map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">
                  {isAdhesionActive({ status: values.status })
                    ? "Adhésion active pour l'année en cours."
                    : "Adhésion inactive pour l'année en cours — le compte reste utilisable, seule l'adhésion payante n'est pas à jour."}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Select value={values.source} onValueChange={(v) => set("source", v as AdherentSource)}>
                  <SelectTrigger id="source">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {filters.source
                      .filter((s) => s !== "Tous")
                      .map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date d'adhésion</Label>
                <DatePicker value={values.memberSince} onChange={(v) => set("memberSince", v)} />
              </div>
            </CardContent>
          </Card>

          {isEdit && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Activité</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Connexions</span>
                  <span className="font-medium text-foreground tabular-nums">—</span>
                </div>
                <Separator />
                <div className="flex justify-between text-muted-foreground">
                  <span>Projets</span>
                  <span className="font-medium text-foreground tabular-nums">—</span>
                </div>
                <Separator />
                <div className="flex justify-between text-muted-foreground">
                  <span>Dernière connexion</span>
                  <span className="font-medium text-foreground">—</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button className="w-full" disabled={!canSubmit} onClick={handleSubmit}>
              {isEdit ? "Enregistrer les modifications" : "Créer le membre"}
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/admin/adherents">Annuler</Link>
            </Button>
            {isEdit && (
              <>
                <Separator />
                <Button variant="destructive" className="w-full" onClick={handleDeactivate}>
                  Désactiver le compte
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
