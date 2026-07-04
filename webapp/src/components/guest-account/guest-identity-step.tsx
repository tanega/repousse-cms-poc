"use client";

import { useState } from "react";

import { Mail } from "lucide-react";

import { HankoAuth } from "@/app/(main)/auth/_components/hanko-auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createOrCheckPublicAccount } from "@/lib/api/public-accounts";

export interface GuestIdentity {
  id: string;
  nom: string;
  email: string;
  /** True when this identity comes from a just-completed Hanko login (a real session now exists), as opposed to a brand-new silent account creation. */
  viaLogin?: boolean;
}

export interface GuestIdentityStepProps {
  /** Shown under the "Vos coordonnées" heading, explains why the e-mail is needed. */
  description: string;
  /** Label of the submit button (e.g. "Valider ma réservation", "Créer mon projet"). */
  submitLabel: string;
  onIdentityReady: (identity: GuestIdentity) => void;
}

/**
 * Shared guest signup/login step for public forms (distribution reservation,
 * planting project creation, …): collects an e-mail (+ optional name), calls
 * the public account endpoint, and either confirms account creation or
 * switches to an inline Hanko login when the e-mail already has an account.
 */
export function GuestIdentityStep({ description, submitLabel, onIdentityReady }: GuestIdentityStepProps) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "existing" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  async function handleSubmit() {
    if (!email) return;
    setStatus("submitting");
    setError(null);

    try {
      const result = await createOrCheckPublicAccount({ email, firstName, lastName });

      if (result.status === "existing") {
        setStatus("existing");
        return;
      }

      onIdentityReady({ id: result.id, nom: fullName || email, email: result.email });
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    }
  }

  if (status === "existing") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Se connecter</CardTitle>
          <CardDescription className="text-xs">
            Un compte existe déjà avec l'adresse {email}. Connectez-vous pour continuer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HankoAuth
            onSessionCreated={() => onIdentityReady({ id: email, nom: fullName || email, email, viaLogin: true })}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Vos coordonnées</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="guest-email">
            E-mail
            <span className="ml-1 text-destructive">*</span>
          </Label>
          <div className="relative">
            <Mail className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
            <Input
              id="guest-email"
              type="email"
              required
              className="pl-9"
              placeholder="vous@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="guest-first-name">Prénom</Label>
            <Input id="guest-first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guest-last-name">Nom</Label>
            <Input id="guest-last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>

        {status === "error" && (
          <Alert variant="destructive">
            <AlertTitle>Impossible de valider votre e-mail</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button className="w-full" disabled={!email || status === "submitting"} onClick={handleSubmit}>
          {status === "submitting" ? "Vérification…" : submitLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
