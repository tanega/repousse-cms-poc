"use client";

import { useEffect, useState } from "react";

import { useForm } from "@tanstack/react-form";
import { Bell, CircleUser, Home, Layers, Settings2, TreePine, Users } from "lucide-react";
import { toast } from "sonner";
import * as z from "zod";

import { updateCurrentUser } from "@/lib/api/me";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { useEngagementProfiles } from "@/lib/engagement/use-engagement-profiles";
import type { EngagementProfileId } from "@/lib/engagement/use-engagement-profiles";
import { useCurrentUserStore } from "@/stores/current-user/current-user-store";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const accountFormSchema = z.object({
  first_name: z.string().trim().min(1, "Le prénom est requis"),
  last_name: z.string().trim().min(1, "Le nom est requis"),
});

type SettingsTab = "account" | "profile" | "engagements" | "notifications";

const navItems: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: "account", label: "Compte", icon: <Settings2 className="size-4" /> },
  { id: "profile", label: "Profil", icon: <CircleUser className="size-4" /> },
  { id: "engagements", label: "Profils d'engagement", icon: <Layers className="size-4" /> },
  { id: "notifications", label: "Notifications", icon: <Bell className="size-4" /> },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");

  return (
    <div className="max-w-4xl space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-semibold">Paramètres</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Gérez les paramètres de votre compte et vos préférences de notification.
        </p>
      </div>
      <Separator />

      <div className="flex flex-col gap-8 sm:flex-row">
        {/* Left nav */}
        <nav className="flex shrink-0 flex-col gap-1 sm:w-48">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                activeTab === item.id
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === "account" && <AccountSection />}
          {activeTab === "profile" && <ProfileSection />}
          {activeTab === "engagements" && <EngagementsSection />}
          {activeTab === "notifications" && <NotificationsSection />}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-muted-foreground text-sm">{description}</p>
      <Separator className="mt-4" />
    </div>
  );
}

function AccountSection() {
  const { user, isLoading } = useCurrentUser();

  const form = useForm({
    defaultValues: { first_name: "", last_name: "" },
    validators: { onChange: accountFormSchema },
    onSubmit: async ({ value }) => {
      try {
        const updated = await updateCurrentUser(value);
        useCurrentUserStore.getState().setUser(updated);
        toast.success("Profil mis à jour.");
      } catch {
        toast.error("Échec de l'enregistrement.");
      }
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({ first_name: user.first_name ?? "", last_name: user.last_name ?? "" });
    }
  }, [user, form.reset]);

  return (
    <div>
      <SectionHeader
        title="Compte"
        description="Mettez à jour les paramètres de votre compte."
      />
      <form
        className="space-y-5 max-w-lg"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.Field name="first_name">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Prénom</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    placeholder="Votre prénom"
                    value={field.state.value}
                    disabled={isLoading}
                    aria-invalid={isInvalid}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
          <form.Field name="last_name">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Nom</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    placeholder="Votre nom"
                    value={field.state.value}
                    disabled={isLoading}
                    aria-invalid={isInvalid}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  <p className="text-muted-foreground text-xs">
                    Ce nom sera affiché sur votre profil et dans les communications.
                  </p>
                </Field>
              );
            }}
          </form.Field>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" type="email" value={user?.email ?? ""} disabled />
            <p className="text-muted-foreground text-xs">
              Contactez un administrateur pour modifier votre email.
            </p>
          </Field>
        </FieldGroup>
        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={isLoading || !canSubmit || isSubmitting}>
              {isSubmitting ? "Enregistrement…" : "Mettre à jour le compte"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}

function ProfileSection() {
  return (
    <div>
      <SectionHeader
        title="Profil"
        description="Ces informations seront visibles sur votre profil public."
      />
      <div className="space-y-5 max-w-lg">
        <div className="space-y-2">
          <Label htmlFor="display-name">Nom affiché</Label>
          <Input id="display-name" placeholder="Nom public" defaultValue="Association Repousse" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            placeholder="Décrivez votre association..."
            rows={4}
            defaultValue="Association loi 1901 dédiée à la plantation d'arbres et à la reforestation urbaine en Île-de-France."
          />
          <p className="text-muted-foreground text-xs">Max 200 caractères.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Localisation</Label>
          <Input id="location" placeholder="Ville, Région" defaultValue="Île-de-France, France" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Site web</Label>
          <Input id="website" placeholder="https://..." defaultValue="https://repousse.org" />
        </div>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium text-sm">Profil public</p>
            <p className="text-muted-foreground text-xs">
              Permettre aux autres membres de voir votre profil.
            </p>
          </div>
          <Switch defaultChecked />
        </div>
        <Button>Mettre à jour le profil</Button>
      </div>
    </div>
  );
}

type EngagementProfile = {
  id: EngagementProfileId;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  description: string;
  unlocks: string[];
  steps: string[];
  isDefault: boolean;
};

const engagementProfiles: EngagementProfile[] = [
  {
    id: "Bénévole",
    icon: Users,
    colorClass: "text-muted-foreground",
    bgClass: "bg-muted/60",
    borderClass: "border-border",
    description: "Profil par défaut. Vous participez aux ateliers, suivez les activités et restez informé·e de la vie de l'association.",
    unlocks: ["Calendrier des ateliers", "Actualités de l'association", "Espace membre", "Tableau de bord personnel"],
    steps: ["Inscription", "Activation du compte", "Onboarding guidé", "Accès à l'espace membre"],
    isDefault: true,
  },
  {
    id: "Adoptant",
    icon: TreePine,
    colorClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-500/8",
    borderClass: "border-emerald-500/20",
    description: "Réservez des plants lors des distributions et créez vos projets de plantation personnels ou collectifs.",
    unlocks: ["Réservation de plants", "Création de projets de plantation", "Suivi des plantations", "Page profil publique"],
    steps: ["Activation du profil", "Complétion des infos (localisation, espèces)", "Accès aux distributions", "Cycle plantation → suivi → rapport"],
    isDefault: false,
  },
  {
    id: "Famille d'accueil",
    icon: Home,
    colorClass: "text-violet-600 dark:text-violet-400",
    bgClass: "bg-violet-500/8",
    borderClass: "border-violet-500/20",
    description: "Hébergez et prenez soin de jeunes plants avant leur distribution. Rôle logistique clé pour la conservation des espèces.",
    unlocks: ["Assignation de lots de plants", "Fiche d'hébergement", "Contact direct coordinateurs", "Historique d'accueil"],
    steps: ["Activation du profil", "Renseignement des capacités d'accueil", "Visibilité des coordinateurs", "Accueil → suivi → remise"],
    isDefault: false,
  },
];

function EngagementsSection() {
  const { isActive, activate, deactivate } = useEngagementProfiles();

  return (
    <div>
      <SectionHeader
        title="Profils d'engagement"
        description="Choisissez vos profils pour adapter votre expérience à votre engagement au sein de l'association."
      />
      <div className="space-y-4">
        {engagementProfiles.map((profile) => {
          const Icon = profile.icon;
          const active = isActive(profile.id);
          return (
            <Card key={profile.id} className={cn("border transition-colors", active ? profile.borderClass : "border-border")}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", active ? profile.bgClass : "bg-muted/40")}>
                      <Icon className={cn("size-4", active ? profile.colorClass : "text-muted-foreground")} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm">{profile.id}</CardTitle>
                        {active ? (
                          <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600 text-[10px] dark:text-emerald-400">
                            Actif
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            Inactif
                          </Badge>
                        )}
                        {profile.isDefault && (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            Par défaut
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="mt-0.5 text-xs leading-snug">
                        {profile.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={active ? "outline" : "default"}
                    disabled={profile.isDefault}
                    onClick={() => active ? deactivate(profile.id) : activate(profile.id)}
                    className="shrink-0"
                  >
                    {profile.isDefault ? "Profil par défaut" : active ? "Désactiver" : "Activer"}
                  </Button>
                </div>
              </CardHeader>
              {active && (
                <CardContent className="pt-0">
                  <Separator className="mb-4" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-2 font-medium text-xs uppercase tracking-wide text-muted-foreground">Ce profil débloque</p>
                      <ul className="space-y-1">
                        {profile.unlocks.map((item) => (
                          <li key={item} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className={cn("size-1.5 shrink-0 rounded-full", active ? profile.colorClass.replace("text-", "bg-").replace("dark:text-", "dark:bg-") : "bg-muted-foreground")} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="mb-2 font-medium text-xs uppercase tracking-wide text-muted-foreground">Parcours</p>
                      <ol className="space-y-1">
                        {profile.steps.map((step, i) => (
                          <li key={step} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className={cn("flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold", active ? profile.bgClass : "bg-muted/60", active ? profile.colorClass : "text-muted-foreground")}>
                              {i + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function NotificationsSection() {
  return (
    <div>
      <SectionHeader
        title="Notifications"
        description="Choisissez les notifications que vous souhaitez recevoir."
      />
      <div className="space-y-4 max-w-lg">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Notifications par email</CardTitle>
            <CardDescription className="text-xs">
              Recevez des mises à jour par email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { id: "notif-members", label: "Nouveaux membres", description: "Quand un membre rejoint l'association." },
              { id: "notif-projects", label: "Mises à jour des projets", description: "Avancement et nouvelles tâches." },
              { id: "notif-events", label: "Événements", description: "Rappels d'événements et de plantations." },
              { id: "notif-digest", label: "Résumé hebdomadaire", description: "Récapitulatif de l'activité de la semaine." },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="text-muted-foreground text-xs">{item.description}</p>
                </div>
                <Switch defaultChecked={item.id !== "notif-digest"} />
              </div>
            ))}
          </CardContent>
        </Card>
        <Button>Enregistrer les préférences</Button>
      </div>
    </div>
  );
}
