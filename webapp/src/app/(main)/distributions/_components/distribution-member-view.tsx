"use client";

import { useState } from "react";

import Link from "next/link";
import { notFound } from "next/navigation";

import { useLiveQuery } from "@tanstack/react-db";
import { CalendarDays, CheckCircle2, Clock, Mail, MapPin, UserRound } from "lucide-react";

import { type GuestIdentity, GuestIdentityStep } from "@/components/guest-account/guest-identity-step";
import { StepperHeader, type StepperStep } from "@/components/guest-account/stepper-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useHankoSession } from "@/lib/auth/use-hanko-session";
import { cn } from "@/lib/utils";

import { distributionEventCollection } from "../../admin/distributions/_components/collection";
import { STATUT_COLORS } from "../../admin/distributions/_components/data";
import { taxons } from "../../admin/especes-vegetales/_components/data";
import { currentMember } from "./current-member";
import { reservationsCollection } from "./reservations-collection";
import { canCancel, findActiveReservation, type Reservation } from "./reservations-data";

const STEPPER_STEPS: StepperStep[] = [
  {
    id: "reservation",
    label: "Réservation",
    description: "Créneau et quantités",
    icon: <CalendarDays className="size-4" />,
  },
  { id: "identite", label: "Coordonnées", description: "E-mail et compte", icon: <UserRound className="size-4" /> },
];

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function taxonName(taxonId: string) {
  return taxons.find((t) => t.id === taxonId)?.nomCommun ?? taxonId;
}

export function DistributionMemberView({ slug }: { slug: string }) {
  const { data: events } = useLiveQuery(distributionEventCollection);
  const { data: allReservations } = useLiveQuery(reservationsCollection);

  const event = (events ?? []).find((e) => e.lienPermanent === slug && e.statut !== "Brouillon");
  if (!event) notFound();
  const eventId = event.id;

  const myReservations = (allReservations ?? []).filter(
    (r) => r.eventId === eventId && r.adoptantId === currentMember.id && r.statut !== "Annulée",
  );
  const activeReservation = findActiveReservation(eventId, currentMember.id, allReservations ?? []);
  const myWaitlistTaxonIds = new Set(
    myReservations.filter((r) => r.statut === "ListeAttente").flatMap((r) => r.lignes.map((l) => l.taxonId)),
  );

  const isClosed = event.statut === "Clôturé";
  const { isAuthenticated } = useHankoSession();

  const [step, setStep] = useState<"reservation" | "identite">("reservation");
  const [creneauId, setCreneauId] = useState("");
  const [projetId, setProjetId] = useState("");
  const [quantites, setQuantites] = useState<Record<string, number>>({});

  function setQuantite(taxonId: string, value: number, max: number | null) {
    const clamped = max === null ? Math.max(0, value) : Math.min(Math.max(0, value), max);
    setQuantites((prev) => ({ ...prev, [taxonId]: clamped }));
  }

  const selectedLines = Object.entries(quantites).filter(([, qty]) => qty > 0);
  const canReserve = !isClosed && !!creneauId && !!projetId && selectedLines.length > 0;

  function handleReserve(identity: { nom: string } = currentMember) {
    if (!canReserve) return;
    reservationsCollection.insert({
      id: crypto.randomUUID(),
      eventId,
      creneauId,
      adoptantId: currentMember.id,
      adoptantNom: identity.nom,
      projetPlantationId: projetId,
      lignes: selectedLines.map(([taxonId, quantite]) => ({ taxonId, quantite })),
      statut: "Confirmée",
      createdAt: new Date().toISOString(),
    });
    setStep("reservation");
    distributionEventCollection.update(eventId, (draft) => {
      draft.nbInscrits += 1;
      for (const [taxonId, qty] of selectedLines) {
        const line = draft.stock.find((s) => s.taxonId === taxonId);
        if (line && line.quantite !== null) line.quantite = Math.max(0, line.quantite - qty);
      }
    });
    setQuantites({});
    setCreneauId("");
  }

  function handleCancel(reservation: Reservation) {
    if (reservation.statut === "Confirmée") {
      distributionEventCollection.update(eventId, (draft) => {
        draft.nbInscrits = Math.max(0, draft.nbInscrits - 1);
        for (const ligne of reservation.lignes) {
          const line = draft.stock.find((s) => s.taxonId === ligne.taxonId);
          if (line && line.quantite !== null) line.quantite += ligne.quantite;
        }
      });
    }
    reservationsCollection.update(reservation.id, (draft) => {
      draft.statut = "Annulée";
    });
  }

  function handleJoinWaitlist(taxonId: string) {
    if (!projetId) return;
    reservationsCollection.insert({
      id: crypto.randomUUID(),
      eventId,
      creneauId: creneauId || "",
      adoptantId: currentMember.id,
      adoptantNom: currentMember.nom,
      projetPlantationId: projetId,
      lignes: [{ taxonId, quantite: 1 }],
      statut: "ListeAttente",
      createdAt: new Date().toISOString(),
    });
  }

  const reservedCreneau = activeReservation ? event.creneaux.find((c) => c.id === activeReservation.creneauId) : null;
  const canCancelActive = reservedCreneau ? canCancel(reservedCreneau.date, reservedCreneau.heureDebut) : true;

  const availableSpecies = event.stock.filter((s) => s.quantite === null || s.quantite > 0);
  const exhaustedSpecies = event.stock.filter((s) => s.quantite === 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-semibold text-2xl">{event.intitule}</h1>
          <Badge
            variant="outline"
            className={cn("border-0 px-2 py-0.5 font-normal text-xs", STATUT_COLORS[event.statut])}
          >
            {event.statut}
          </Badge>
        </div>
        {event.description && <p className="mt-2 text-muted-foreground text-sm">{event.description}</p>}
        {event.contactGeneral && (
          <div className="mt-2 flex items-center gap-1.5 text-muted-foreground text-sm">
            <Mail className="size-3.5" />
            {event.contactGeneral}
          </div>
        )}
      </div>

      {isClosed && (
        <Alert>
          <AlertTitle>Événement clôturé</AlertTitle>
          <AlertDescription>
            Cet événement est clôturé : les réservations et annulations ne sont plus possibles. Vous consultez cette
            page en lecture seule.
          </AlertDescription>
        </Alert>
      )}

      {activeReservation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="size-4 text-green-600" />
              Ma réservation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {reservedCreneau && (
              <div className="flex items-start gap-2">
                <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <div className="font-medium capitalize">{dateFormatter.format(new Date(reservedCreneau.date))}</div>
                  <div className="text-muted-foreground text-xs">
                    {reservedCreneau.heureDebut} – {reservedCreneau.heureFin} · {reservedCreneau.lieu}
                  </div>
                </div>
              </div>
            )}
            <Separator />
            <div className="space-y-1">
              {activeReservation.lignes.map((l) => (
                <div key={l.taxonId} className="flex items-center justify-between">
                  <span>{taxonName(l.taxonId)}</span>
                  <span className="font-medium tabular-nums">{l.quantite}</span>
                </div>
              ))}
            </div>
            <Separator />
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Projet de plantation</span>
              <span className="font-medium text-foreground">
                {currentMember.projetsPlantation.find((p) => p.id === activeReservation.projetPlantationId)?.nom ??
                  activeReservation.projetPlantationId}
              </span>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              disabled={!canCancelActive}
              onClick={() => handleCancel(activeReservation)}
            >
              Annuler ma réservation
            </Button>
            {!canCancelActive && (
              <p className="text-center text-muted-foreground text-xs">
                Annulation possible jusqu'à 48h avant le créneau réservé.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {!activeReservation && !isClosed && isAuthenticated === false && (
        <StepperHeader steps={STEPPER_STEPS} activeId={step} />
      )}

      {!activeReservation && !isClosed && step === "reservation" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Réserver un créneau</CardTitle>
            <CardDescription className="text-xs">
              Choisissez un créneau, un projet de plantation, et les quantités souhaitées.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Créneau</Label>
              <RadioGroup value={creneauId} onValueChange={setCreneauId}>
                {event.creneaux.map((c) => (
                  <label
                    key={c.id}
                    htmlFor={`creneau-${c.id}`}
                    className="flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm has-[[data-state=checked]]:border-primary"
                  >
                    <RadioGroupItem value={c.id} id={`creneau-${c.id}`} className="mt-0.5" />
                    <div>
                      <div className="font-medium capitalize">{dateFormatter.format(new Date(c.date))}</div>
                      <div className="flex items-center gap-1 text-muted-foreground text-xs">
                        <Clock className="size-3" />
                        {c.heureDebut} – {c.heureFin}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground text-xs">
                        <MapPin className="size-3" />
                        {c.lieu}
                      </div>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="projet">
                Projet de plantation
                <span className="ml-1 text-destructive">*</span>
              </Label>
              <Select value={projetId} onValueChange={setProjetId}>
                <SelectTrigger id="projet" className="w-full">
                  <SelectValue placeholder="Sélectionnez un projet" />
                </SelectTrigger>
                <SelectContent>
                  {currentMember.projetsPlantation.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {availableSpecies.length > 0 && (
              <div className="space-y-2">
                <Label>Quantités souhaitées</Label>
                {availableSpecies.map((s) => (
                  <div key={s.taxonId} className="flex items-center justify-between gap-3 text-sm">
                    <span>{taxonName(s.taxonId)}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs">
                        {s.quantite === null ? "quantité illimitée" : `${s.quantite} disponibles`}
                      </span>
                      <Input
                        type="number"
                        min={0}
                        max={s.quantite ?? undefined}
                        className="w-20"
                        value={quantites[s.taxonId] ?? ""}
                        onChange={(e) => setQuantite(s.taxonId, Number(e.target.value) || 0, s.quantite)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button
              className="w-full"
              disabled={!canReserve}
              onClick={() => (isAuthenticated === false ? setStep("identite") : handleReserve())}
            >
              {isAuthenticated === false ? "Continuer" : "Réserver"}
            </Button>
          </CardContent>
        </Card>
      )}

      {!activeReservation && !isClosed && step === "identite" && isAuthenticated === false && (
        <div className="space-y-3">
          <GuestIdentityStep
            description="L'adresse e-mail est nécessaire pour confirmer votre réservation. Un compte Repousse est créé automatiquement — vous recevrez un e-mail avec la marche à suivre pour vous connecter la prochaine fois."
            submitLabel="Valider ma réservation"
            onIdentityReady={(identity: GuestIdentity) => handleReserve(identity)}
          />
          <Button variant="ghost" size="sm" onClick={() => setStep("reservation")}>
            ← Modifier ma réservation
          </Button>
        </div>
      )}

      {exhaustedSpecies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Liste d'attente</CardTitle>
            <CardDescription className="text-xs">
              Ces espèces sont épuisées. Rejoignez la liste d'attente pour être averti·e si des plants se libèrent.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {exhaustedSpecies.map((s) => {
              const onWaitlist = myWaitlistTaxonIds.has(s.taxonId);
              return (
                <div key={s.taxonId} className="flex items-center justify-between text-sm">
                  <span>{taxonName(s.taxonId)}</span>
                  {onWaitlist ? (
                    <Badge variant="outline" className="font-normal">
                      En liste d'attente
                    </Badge>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isClosed || !projetId}
                      onClick={() => handleJoinWaitlist(s.taxonId)}
                    >
                      Rejoindre la liste d'attente
                    </Button>
                  )}
                </div>
              );
            })}
            {!projetId && !isClosed && (
              <p className="text-muted-foreground text-xs">
                Sélectionnez un projet de plantation ci-dessus pour rejoindre une liste d'attente.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Button variant="ghost" size="sm" asChild>
        <Link href="/distributions">← Retour aux distributions</Link>
      </Button>
    </div>
  );
}
