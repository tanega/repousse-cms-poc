"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { notFound } from "next/navigation";

import { useLiveQuery } from "@tanstack/react-db";
import { CalendarDays, CheckCircle2, Clock, Mail, MapPin, Sprout, UserRound } from "lucide-react";
import { toast } from "sonner";

import { type GuestIdentity, GuestIdentityStep } from "@/components/guest-account/guest-identity-step";
import { StepperHeader, type StepperStep } from "@/components/guest-account/stepper-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  cancelReservation,
  createReservation,
  fetchMyReservation,
  fetchMyWaitlistEntries,
  joinWaitlist,
} from "@/lib/api/reservations";
import { fetchPublicTaxa } from "@/lib/api/taxa";
import { useHankoSession } from "@/lib/auth/use-hanko-session";
import { cn } from "@/lib/utils";
import { EVENT_STATUS_COLORS, EVENT_STATUS_LABELS } from "@/types/distribution";
import type { Reservation } from "@/types/reservation";
import type { Taxon } from "@/types/taxon";

import { projectCollection } from "../../admin/projets-plantation/_components/project-collection";
import {
  createPublicSlotCollection,
  createPublicStockCollection,
  distributionEventCollection,
  queryClient,
} from "./collection";
import { ProjectSelectOrCreate } from "./project-select-or-create";

type GuestStep = "identite" | "confirmation" | "projet" | "reservation";

const STEPPER_STEPS: StepperStep[] = [
  { id: "identite", label: "Coordonnées", description: "E-mail et compte", icon: <UserRound className="size-4" /> },
  { id: "projet", label: "Projet", description: "Sélection ou création", icon: <Sprout className="size-4" /> },
  {
    id: "reservation",
    label: "Réservation",
    description: "Créneau et quantités",
    icon: <CalendarDays className="size-4" />,
  },
];

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const CANCEL_DEADLINE_HOURS = 48;

function canCancelSlot(date: string, startTime: string, now: Date = new Date()): boolean {
  const slotStart = new Date(`${date}T${startTime}`);
  const deadline = new Date(slotStart.getTime() - CANCEL_DEADLINE_HOURS * 60 * 60 * 1000);
  return now < deadline;
}

export function DistributionMemberView({ slug }: { slug: string }) {
  const { data: events, isLoading: eventsLoading } = useLiveQuery(distributionEventCollection);
  const [taxa, setTaxa] = useState<Taxon[]>([]);
  useEffect(() => {
    void fetchPublicTaxa().then(setTaxa);
  }, []);
  const { data: projects } = useLiveQuery(projectCollection);

  const event = (events ?? []).find((e) => e.slug === slug && e.status !== "draft");

  const eventId = event?.id ?? "";
  const slotCollection = useMemo(() => createPublicSlotCollection(eventId), [eventId]);
  const stockCollection = useMemo(() => createPublicStockCollection(eventId), [eventId]);
  const { data: slots } = useLiveQuery(slotCollection);
  const { data: stocks } = useLiveQuery(stockCollection);

  const { isAuthenticated } = useHankoSession();
  const [justAuthenticated, setJustAuthenticated] = useState(false);
  const authed = isAuthenticated === true || justAuthenticated;
  // Guests go through a 3-step wizard (identité → projet → réservation);
  // signed-in members (and the not-yet-resolved null state) keep the
  // single-page form with the project field inline, per the e2e contract.
  const showWizard = isAuthenticated === false && !justAuthenticated;

  const [step, setStep] = useState<GuestStep>("reservation");
  const [guestIdentity, setGuestIdentity] = useState<GuestIdentity | null>(null);
  const [slotId, setSlotId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  const [reservation, setReservation] = useState<Reservation | null | undefined>(undefined);
  const [waitlistTaxonIds, setWaitlistTaxonIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isAuthenticated === false) setStep("identite");
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authed || !eventId) return;
    void fetchMyReservation(eventId).then(setReservation);
    void fetchMyWaitlistEntries(eventId).then((entries) =>
      setWaitlistTaxonIds(new Set(entries.map((e) => e.taxon_id))),
    );
  }, [authed, eventId]);

  function handleIdentityReady(identity: GuestIdentity) {
    setGuestIdentity(identity);
    if (identity.viaLogin) {
      setJustAuthenticated(true);
      setProjectId("");
      setStep("projet");
    } else {
      // Brand-new guest account: no real session exists yet (an activation
      // e-mail was just sent). Authenticated calls (project, reservation,
      // waitlist) would 401 until they log in — mirrors the same
      // "check your e-mail" confirmation used by the public project form.
      setStep("confirmation");
    }
  }

  function taxonName(taxonId: string) {
    return (taxa ?? []).find((t) => t.id === taxonId)?.common_name ?? taxonId;
  }

  function projectName(id: string) {
    return (projects ?? []).find((p) => p.id === id)?.name ?? id;
  }

  function availableQty(stock: { quantity: number | null; quantity_unknown: boolean; reserved_quantity: number }) {
    if (stock.quantity_unknown) return null;
    return Math.max(0, (stock.quantity ?? 0) - stock.reserved_quantity);
  }

  function setQuantity(stockId: string, value: number, max: number | null) {
    const clamped = max === null ? Math.max(0, value) : Math.min(Math.max(0, value), max);
    setQuantities((prev) => ({ ...prev, [stockId]: clamped }));
  }

  if (eventsLoading) return null;
  if (!event) notFound();

  const isClosed = event.status === "closed";
  const isActive = reservation && (reservation.status === "confirmed" || reservation.status === "validated");
  const reservedSlot = reservation ? (slots ?? []).find((s) => s.id === reservation.slot_id) : null;
  const canCancelActive = reservedSlot ? canCancelSlot(reservedSlot.date, reservedSlot.start_time) : true;

  const selectedLines = Object.entries(quantities).filter(([, qty]) => qty > 0);
  const canReserve = !isClosed && !!slotId && !!projectId && selectedLines.length > 0 && !submitting;

  let reserveButtonLabel = "Réserver";
  if (submitting) reserveButtonLabel = "Réservation…";
  else if (showWizard) reserveButtonLabel = "Valider ma réservation";

  async function handleReserve() {
    if (!canReserve) return;
    setSubmitting(true);
    try {
      const items = selectedLines.map(([stockId, qty]) => {
        const stock = (stocks ?? []).find((s) => s.id === stockId);
        return { stock_id: stockId, qty, taxon_id: stock?.taxon_id ?? "" };
      });
      await createReservation(eventId, { slot_id: slotId, project_id: projectId, items });
      toast.success("Réservation confirmée.");
      setReservation(await fetchMyReservation(eventId));
      await queryClient.invalidateQueries({ queryKey: ["public-distribution-stocks", eventId] });
      setQuantities({});
      setSlotId("");
      setStep("reservation");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de la réservation.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    if (!reservation) return;
    try {
      setReservation(await cancelReservation(eventId, reservation.id));
      toast.success("Réservation annulée.");
      await queryClient.invalidateQueries({ queryKey: ["public-distribution-stocks", eventId] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'annulation.");
    }
  }

  async function handleJoinWaitlist(taxonId: string) {
    try {
      await joinWaitlist(eventId, taxonId);
      setWaitlistTaxonIds((prev) => new Set(prev).add(taxonId));
      toast.success("Ajouté·e à la liste d'attente.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'inscription à la liste d'attente.");
    }
  }

  const availableSpecies = (stocks ?? []).filter((s) => {
    const qty = availableQty(s);
    return qty === null || qty > 0;
  });
  const exhaustedSpecies = (stocks ?? []).filter((s) => availableQty(s) === 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-semibold text-2xl">{event.title}</h1>
          <Badge
            variant="outline"
            className={cn("border-0 px-2 py-0.5 font-normal text-xs", EVENT_STATUS_COLORS[event.status])}
          >
            {EVENT_STATUS_LABELS[event.status]}
          </Badge>
        </div>
        {event.description && <p className="mt-2 text-muted-foreground text-sm">{event.description}</p>}
        {event.general_contact && (
          <div className="mt-2 flex items-center gap-1.5 text-muted-foreground text-sm">
            <Mail className="size-3.5" />
            {event.general_contact}
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

      {reservation?.status === "cancelled" && (
        <Alert>
          <AlertTitle>Réservation annulée</AlertTitle>
          <AlertDescription>
            Vous avez annulé votre réservation pour cet événement. Une seule réservation est possible par événement,
            même après annulation.
          </AlertDescription>
        </Alert>
      )}

      {isActive && reservation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="size-4 text-green-600" />
              Ma réservation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {reservedSlot && (
              <div className="flex items-start gap-2">
                <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <div className="font-medium capitalize">{dateFormatter.format(new Date(reservedSlot.date))}</div>
                  <div className="text-muted-foreground text-xs">
                    {reservedSlot.start_time} – {reservedSlot.end_time} · {reservedSlot.location_name}
                  </div>
                </div>
              </div>
            )}
            <Separator />
            <div className="space-y-1">
              {reservation.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <span>{taxonName(item.taxon_id)}</span>
                  <span className="font-medium tabular-nums">{item.reserved_qty}</span>
                </div>
              ))}
            </div>
            <Separator />
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Projet de plantation</span>
              <span className="font-medium text-foreground">{projectName(reservation.project_id)}</span>
            </div>
            {reservation.status === "confirmed" && (
              <>
                <Separator />
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  disabled={!canCancelActive}
                  onClick={handleCancel}
                >
                  Annuler ma réservation
                </Button>
                {!canCancelActive && (
                  <p className="text-center text-muted-foreground text-xs">
                    Annulation possible jusqu'à 48h avant le créneau réservé.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {!isActive && !isClosed && reservation?.status !== "cancelled" && showWizard && (
        <StepperHeader steps={STEPPER_STEPS} activeId={step} />
      )}

      {!isActive && !isClosed && reservation?.status !== "cancelled" && showWizard && step === "identite" && (
        <GuestIdentityStep
          description="L'adresse e-mail est nécessaire pour votre réservation. Un compte Repousse est créé automatiquement — vous recevrez un e-mail avec la marche à suivre pour vous connecter la prochaine fois. Vous pouvez aussi vous connecter directement si vous avez déjà un compte."
          submitLabel="Continuer"
          onIdentityReady={handleIdentityReady}
        />
      )}

      {!isActive && !isClosed && showWizard && step === "confirmation" && guestIdentity && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="size-4 text-green-600" />
              Vérifiez votre e-mail
            </CardTitle>
            <CardDescription className="text-xs">
              Un compte Repousse a été créé pour {guestIdentity.email}. Connectez-vous depuis le lien reçu par e-mail
              pour finaliser votre réservation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/auth/v2/login">Aller à la connexion</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!isActive && !isClosed && reservation?.status !== "cancelled" && showWizard && step === "projet" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Projet de plantation</CardTitle>
            <CardDescription className="text-xs">
              Sélectionnez un de vos projets, ou créez-en un nouveau pour cette réservation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProjectSelectOrCreate value={projectId} onChange={setProjectId} />
            <div className="flex items-center gap-2">
              <Button size="sm" className="ml-auto" disabled={!projectId} onClick={() => setStep("reservation")}>
                Continuer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!isActive && !isClosed && reservation?.status !== "cancelled" && (!showWizard || step === "reservation") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Réserver un créneau</CardTitle>
            <CardDescription className="text-xs">
              Choisissez un créneau{!showWizard && ", un projet de plantation,"} et les quantités souhaitées.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Créneau</Label>
              <RadioGroup value={slotId} onValueChange={setSlotId}>
                {(slots ?? []).map((s) => (
                  <label
                    key={s.id}
                    htmlFor={`slot-${s.id}`}
                    className="flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm has-[[data-state=checked]]:border-primary"
                  >
                    <RadioGroupItem value={s.id} id={`slot-${s.id}`} className="mt-0.5" />
                    <div>
                      <div className="font-medium capitalize">{dateFormatter.format(new Date(s.date))}</div>
                      <div className="flex items-center gap-1 text-muted-foreground text-xs">
                        <Clock className="size-3" />
                        {s.start_time} – {s.end_time}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground text-xs">
                        <MapPin className="size-3" />
                        {s.location_name}
                      </div>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>

            {showWizard ? (
              <div className="flex items-center justify-between rounded-md border p-3 text-sm">
                <div>
                  <div className="text-muted-foreground text-xs">Projet de plantation</div>
                  <div className="font-medium">{projectId ? projectName(projectId) : "Aucun projet sélectionné"}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep("projet")}>
                  Modifier
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="projet">
                  Projet de plantation
                  <span className="ml-1 text-destructive">*</span>
                </Label>
                <ProjectSelectOrCreate value={projectId} onChange={setProjectId} />
              </div>
            )}

            {availableSpecies.length > 0 && (
              <div className="space-y-2">
                <Label>Quantités souhaitées</Label>
                {availableSpecies.map((s) => {
                  const qty = availableQty(s);
                  return (
                    <div key={s.id} className="flex items-center justify-between gap-3 text-sm">
                      <span>{taxonName(s.taxon_id)}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs">
                          {qty === null ? "quantité illimitée" : `${qty} disponibles`}
                        </span>
                        <Input
                          type="number"
                          min={0}
                          max={qty ?? undefined}
                          className="w-20"
                          value={quantities[s.id] ?? ""}
                          onChange={(e) => setQuantity(s.id, Number(e.target.value) || 0, qty)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <Button className="w-full" disabled={!canReserve} onClick={handleReserve}>
              {reserveButtonLabel}
            </Button>
          </CardContent>
        </Card>
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
              const onWaitlist = waitlistTaxonIds.has(s.taxon_id);
              return (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <span>{taxonName(s.taxon_id)}</span>
                  {onWaitlist ? (
                    <Badge variant="outline" className="font-normal">
                      En liste d'attente
                    </Badge>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isClosed || !authed}
                      onClick={() => handleJoinWaitlist(s.taxon_id)}
                    >
                      Rejoindre la liste d'attente
                    </Button>
                  )}
                </div>
              );
            })}
            {!authed && !isClosed && (
              <p className="text-muted-foreground text-xs">Connectez-vous pour rejoindre une liste d'attente.</p>
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
