import Link from "next/link";

import { ArrowLeft, CheckCircle2, Clock, RefreshCw, TriangleAlert, XCircle, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type ImportJobStatus = "Réussi" | "En cours" | "Partiel" | "Échoué";

type ImportJob = {
  id: string;
  runAt: string;
  status: ImportJobStatus;
  source: "HelloAsso API" | "CSV manuel";
  usersCreated: number;
  usersUpdated: number;
  errors: number;
  durationSec: number;
  triggeredBy: string;
};

const statusMeta: Record<ImportJobStatus, { badgeClass: string; icon: React.ElementType }> = {
  Réussi: {
    badgeClass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  "En cours": {
    badgeClass: "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400",
    icon: Clock,
  },
  Partiel: {
    badgeClass: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    icon: TriangleAlert,
  },
  Échoué: {
    badgeClass: "border-destructive/20 bg-destructive/10 text-destructive",
    icon: XCircle,
  },
};

const jobs: ImportJob[] = [
  {
    id: "job-001",
    runAt: "02 Jul 2026, 06:00",
    status: "Réussi",
    source: "HelloAsso API",
    usersCreated: 3,
    usersUpdated: 12,
    errors: 0,
    durationSec: 8,
    triggeredBy: "Planifié",
  },
  {
    id: "job-002",
    runAt: "01 Jul 2026, 06:00",
    status: "Réussi",
    source: "HelloAsso API",
    usersCreated: 1,
    usersUpdated: 5,
    errors: 0,
    durationSec: 6,
    triggeredBy: "Planifié",
  },
  {
    id: "job-003",
    runAt: "30 Jun 2026, 14:22",
    status: "Partiel",
    source: "CSV manuel",
    usersCreated: 8,
    usersUpdated: 0,
    errors: 2,
    durationSec: 3,
    triggeredBy: "Marie Dupont",
  },
  {
    id: "job-004",
    runAt: "28 Jun 2026, 06:00",
    status: "Réussi",
    source: "HelloAsso API",
    usersCreated: 0,
    usersUpdated: 2,
    errors: 0,
    durationSec: 5,
    triggeredBy: "Planifié",
  },
  {
    id: "job-005",
    runAt: "25 Jun 2026, 06:00",
    status: "Échoué",
    source: "HelloAsso API",
    usersCreated: 0,
    usersUpdated: 0,
    errors: 1,
    durationSec: 12,
    triggeredBy: "Planifié",
  },
  {
    id: "job-006",
    runAt: "20 Jun 2026, 09:45",
    status: "Réussi",
    source: "CSV manuel",
    usersCreated: 15,
    usersUpdated: 3,
    errors: 0,
    durationSec: 4,
    triggeredBy: "Jean-Pierre Martin",
  },
  {
    id: "job-007",
    runAt: "15 Jun 2026, 06:00",
    status: "Réussi",
    source: "HelloAsso API",
    usersCreated: 4,
    usersUpdated: 9,
    errors: 0,
    durationSec: 7,
    triggeredBy: "Planifié",
  },
  {
    id: "job-008",
    runAt: "10 Jun 2026, 06:00",
    status: "Partiel",
    source: "HelloAsso API",
    usersCreated: 2,
    usersUpdated: 7,
    errors: 3,
    durationSec: 14,
    triggeredBy: "Planifié",
  },
];

function StatusBadge({ status }: { status: ImportJobStatus }) {
  const meta = statusMeta[status];
  const Icon = meta.icon;
  return (
    <Badge className={cn("gap-1.5 border px-2 py-1 font-medium", meta.badgeClass)} variant="outline">
      <Icon className="size-3" />
      {status}
    </Badge>
  );
}

function formatDuration(sec: number) {
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

export default function AutomatisationsPage() {
  const lastSuccess = jobs.find((j) => j.status === "Réussi");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-2">
            <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
              <Link href="/admin/adherents">
                <ArrowLeft className="size-4" />
                Adhérents
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl font-semibold">Automatisations</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Historique des imports de données HelloAsso et statut d'exécution.
          </p>
        </div>
        <Button className="shrink-0">
          <RefreshCw className="size-4" />
          Lancer un import
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Dernier import", value: lastSuccess?.runAt.split(",")[0] ?? "—" },
          {
            label: "Créés ce mois",
            value: String(jobs.filter((j) => j.status !== "Échoué").reduce((s, j) => s + j.usersCreated, 0)),
          },
          {
            label: "Mis à jour ce mois",
            value: String(jobs.filter((j) => j.status !== "Échoué").reduce((s, j) => s + j.usersUpdated, 0)),
          },
          {
            label: "Taux de succès",
            value: `${Math.round((jobs.filter((j) => j.status === "Réussi").length / jobs.length) * 100)}%`,
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-5">
              <p className="text-muted-foreground text-xs">{stat.label}</p>
              <p className="mt-1 text-2xl font-semibold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Jobs table */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="size-4 text-primary" />
            Historique des imports
          </CardTitle>
          <CardDescription>
            {jobs.length} exécutions enregistrées.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table className="**:data-[slot='table-cell']:px-4 **:data-[slot='table-head']:px-4">
            <TableHeader className="[&_tr]:border-t">
              <TableRow>
                <TableHead className="py-3 font-normal">Date d'exécution</TableHead>
                <TableHead className="py-3 font-normal">Source</TableHead>
                <TableHead className="py-3 font-normal">Statut</TableHead>
                <TableHead className="py-3 font-normal text-right">Créés</TableHead>
                <TableHead className="py-3 font-normal text-right">Mis à jour</TableHead>
                <TableHead className="py-3 font-normal text-right">Erreurs</TableHead>
                <TableHead className="py-3 font-normal text-right">Durée</TableHead>
                <TableHead className="py-3 font-normal">Déclenché par</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id} className="border-border/60 hover:bg-white/2.5">
                  <TableCell className="py-3 font-medium text-sm">{job.runAt}</TableCell>
                  <TableCell className="py-3 text-sm">{job.source}</TableCell>
                  <TableCell className="py-3">
                    <StatusBadge status={job.status} />
                  </TableCell>
                  <TableCell className="py-3 text-right tabular-nums text-sm">
                    {job.usersCreated > 0 ? (
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">+{job.usersCreated}</span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3 text-right tabular-nums text-sm">
                    {job.usersUpdated > 0 ? job.usersUpdated : <span className="text-muted-foreground">0</span>}
                  </TableCell>
                  <TableCell className="py-3 text-right tabular-nums text-sm">
                    {job.errors > 0 ? (
                      <span className="font-medium text-destructive">{job.errors}</span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3 text-right text-muted-foreground text-sm">
                    {formatDuration(job.durationSec)}
                  </TableCell>
                  <TableCell className="py-3 text-muted-foreground text-sm">{job.triggeredBy}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Separator />
        </CardContent>
      </Card>
    </div>
  );
}
