"use client";

import { useEffect, useState } from "react";

import { toast } from "sonner";

import { AdresseSearchBox } from "@/app/(main)/admin/projets-plantation/_components/adresse-search-box";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requestProfile } from "@/lib/api/me";
import {
  createProject,
  createTreeReport,
  fetchProjectPlantings,
  fetchProjects,
  fetchTreeReports,
  type ProjectPlanting,
  type TreeReport,
} from "@/lib/api/projects";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import type { Project } from "@/types/project";

const STATUS_LABELS: Record<TreeReport["status"], string> = {
  thriving: "Ils vont bien",
  struggling: "Ils ont du mal",
  dead: "Ils sont morts",
};

const DEATH_REASONS = [
  "Sangliers et attaques de la faune",
  "Maladie",
  "Trop d’arrosage",
  "Manque d’arrosage",
  "Mauvais choix du type de sol",
  "Mauvais choix par rapport à l’exposition",
  "Canicule",
  "Tempête",
  "Gel",
  "Vandalisme",
  "Racinaire abimé",
  "Finalement on a dû l’enlever",
  "Finalement je n’ai pas eu le temps de le planter",
  "N’a pas supporté la mise en jauge",
  "Il a été mal planté",
  "Aucune idée",
  "Autre",
];

const PLACE_KINDS = [
  ["farmer", "Une exploitation agricole"],
  ["collective", "Un jardin ou une forêt comestible partagée"],
  ["condominium", "Un jardin de copropriété"],
  ["individual", "Un jardin de particulier"],
  ["school", "Un jardin ou une ferme pédagogique, une école"],
  ["public_space", "Un espace public, une entreprise ou un tiers-lieu"],
];

export default function MesProjetsPage() {
  const { user } = useCurrentUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [planterLevel, setPlanterLevel] = useState("debutant");
  const [mulch, setMulch] = useState("paille");
  const [placeKind, setPlaceKind] = useState("individual");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const adoptant = user?.profiles.find((profile) => profile.profile_type === "adoptant");

  async function load() {
    setProjects(await fetchProjects());
  }

  useEffect(() => {
    load().catch((err) => toast.error(err instanceof Error ? err.message : "Impossible de charger vos projets."));
  }, []);

  async function submit() {
    if (name.trim().length < 2) {
      toast.error("Donnez un nom à votre projet.");
      return;
    }
    setBusy(true);
    try {
      if (!adoptant || adoptant.status === "rejected") {
        try {
          await requestProfile("adoptant");
        } catch (err) {
          const message = err instanceof Error ? err.message : "";
          if (!message.includes("déjà")) throw err;
        }
      }
      await createProject({
        name: name.trim(),
        address: address.trim() || null,
        lat,
        lng,
        management_type: placeKind === "farmer" ? "farmer" : placeKind === "school" ? "school" : placeKind === "condominium" ? "condominium" : placeKind === "collective" ? "collective" : placeKind === "public_space" ? "public_space" : "individual",
        planter_level: planterLevel,
        mulch,
        place_kind: placeKind,
      });
      setName("");
      setAddress("");
      toast.success("Projet créé. S'il fallait un parcours adoptant, la demande est partie.");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de la création.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="@container/main flex flex-col gap-6">
      <div>
        <h1 className="font-semibold text-2xl">Mes projets de plantation</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          {adoptant?.status === "pending"
            ? "Votre parcours adoptant est en attente de validation. Vous pouvez déjà décrire vos projets."
            : "Un nom et une adresse suffisent pour ouvrir un projet."}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nouveau projet</CardTitle>
          <CardDescription>Le parcours adoptant est demandé en même temps, s'il ne l'est pas déjà.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="projet-nom">Nom du projet</Label>
            <Input id="projet-nom" value={name} onChange={(event) => setName(event.target.value)} placeholder="Haie du jardin" />
          </div>
          <div>
            <Label htmlFor="projet-adresse">Adresse</Label>
            <AdresseSearchBox
              id="projet-adresse"
              value={address}
              placeholder="12 rue des Lilas, Nantes"
              onInputChange={(value) => {
                setAddress(value);
                setLat(null);
                setLng(null);
              }}
              onSelect={(suggestion) => {
                setAddress(suggestion.label);
                setLat(suggestion.lat);
                setLng(suggestion.lng);
              }}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Niveau</Label>
              <Select value={planterLevel} onValueChange={setPlanterLevel}>
                <SelectTrigger aria-label="Niveau du planteur"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="debutant">Débutant·e</SelectItem>
                  <SelectItem value="experimente">Expérimenté·e</SelectItem>
                  <SelectItem value="professionnel">Professionnel·le</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Paillage</Label>
              <Select value={mulch} onValueChange={setMulch}>
                <SelectTrigger aria-label="Paillage"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paille">Paille</SelectItem>
                  <SelectItem value="brf">BRF</SelectItem>
                  <SelectItem value="aucun">Pas encore</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type de lieu</Label>
              <Select value={placeKind} onValueChange={setPlaceKind}>
                <SelectTrigger aria-label="Type de lieu"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLACE_KINDS.map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button disabled={busy} onClick={submit}>
            {busy ? "Création…" : "Créer mon projet"}
          </Button>
        </CardContent>
      </Card>

      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const [plantings, setPlantings] = useState<ProjectPlanting[]>([]);
  const [reports, setReports] = useState<TreeReport[]>([]);
  const [note, setNote] = useState("");
  const [reason, setReason] = useState(DEATH_REASONS[0]);

  useEffect(() => {
    fetchProjectPlantings(project.id).then(setPlantings).catch(() => setPlantings([]));
    fetchTreeReports(project.id).then(setReports).catch(() => setReports([]));
  }, [project.id]);

  async function report(status: TreeReport["status"]) {
    try {
      const created = await createTreeReport(project.id, {
        status,
        note: note.trim() || undefined,
        reason: status === "dead" ? reason : undefined,
      });
      setReports((current) => [created, ...current]);
      setNote("");
      toast.success("Merci, c'est enregistré.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'envoi.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{project.name}</CardTitle>
        <CardDescription>{project.address || "Adresse non renseignée"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="font-medium text-sm">Arbres reçus</p>
          {plantings.length === 0 && <p className="text-muted-foreground text-sm">Aucun arbre rattaché pour l'instant.</p>}
          {plantings.map((planting) => (
            <p key={planting.id} className="text-sm">
              {planting.quantity} {planting.common_name ?? "arbres"}
            </p>
          ))}
        </div>
        <div className="space-y-2">
          <p className="font-medium text-sm">Comment vont vos arbres ?</p>
          <Textarea value={note} rows={2} placeholder="Quelques mots, si vous voulez" onChange={(event) => setNote(event.target.value)} />
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger aria-label="Pourquoi cet arbre est mort"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DEATH_REASONS.map((item) => (
                <SelectItem key={item} value={item}>{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(STATUS_LABELS) as TreeReport["status"][]).map((status) => (
              <Button key={status} variant="outline" size="sm" onClick={() => report(status)}>
                {STATUS_LABELS[status]}
              </Button>
            ))}
          </div>
          {reports[0] && (
            <p className="text-muted-foreground text-xs">Dernière nouvelle : {STATUS_LABELS[reports[0].status]}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
