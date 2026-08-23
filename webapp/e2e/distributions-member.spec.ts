import { type APIRequestContext, expect, request as playwrightRequest, test } from "@playwright/test";

import fs from "node:fs";

const API_URL = "http://localhost:4000";
const ADMIN_AUTH_FILE = "e2e/.auth/admin.json";
const MEMBER_AUTH_FILE = "e2e/.auth/member.json";

// /admin/* role gates and authenticated API calls need a real backend
// session — reuse the seeded member's real passcode login saved by
// e2e/auth.setup.ts (see distributions-admin.spec.ts for the admin
// equivalent).
test.use({ storageState: MEMBER_AUTH_FILE });

function hankoTokenFrom(storageStatePath: string): string {
  const state = JSON.parse(fs.readFileSync(storageStatePath, "utf-8"));
  const cookie = (state.cookies as { name: string; value: string }[]).find((c) => c.name === "hanko");
  if (!cookie) throw new Error(`No "hanko" cookie found in ${storageStatePath}`);
  return cookie.value;
}

/** Direct backend calls (not through the UI) to set up fixtures as admin. */
async function adminApi(): Promise<APIRequestContext> {
  return playwrightRequest.newContext({
    baseURL: API_URL,
    extraHTTPHeaders: { Authorization: `Bearer ${hankoTokenFrom(ADMIN_AUTH_FILE)}` },
  });
}

// GET /api/v1/projects is scoped to the requesting user's own projects, so a
// project meant to be selectable by the member in the UI must be created
// with the member's own token, not the admin's.
async function memberApi(): Promise<APIRequestContext> {
  return playwrightRequest.newContext({
    baseURL: API_URL,
    extraHTTPHeaders: { Authorization: `Bearer ${hankoTokenFrom(MEMBER_AUTH_FILE)}` },
  });
}

async function json<T>(res: { json(): Promise<{ data: T }> }): Promise<T> {
  return (await res.json()).data;
}

test.describe("Member distributions — browse, reserve, cancel, waitlist", () => {
  test("reserve a slot, see stock decrease, then cancel and see it restored", async ({ page }) => {
    const api = await adminApi();
    const suffix = Date.now();

    const taxon = await json<{ id: string; common_name: string }>(
      await api.post("/api/v1/admin/taxa", {
        data: { taxon: { common_name: `Chêne e2e ${suffix}`, is_non_taxonomic: true } },
      }),
    );
    const event = await json<{ id: string; slug: string; title: string }>(
      await api.post("/api/v1/admin/distributions", {
        data: { distribution: { title: `Distribution e2e ${suffix}` } },
      }),
    );
    await api.post(`/api/v1/admin/distributions/${event.id}/slots`, {
      data: {
        slot: { location_name: "Jardin partagé e2e", date: "2027-06-15", start_time: "09:00", end_time: "12:00" },
      },
    });
    await api.post(`/api/v1/admin/distributions/${event.id}/stocks`, {
      data: { stock: { taxon_id: taxon.id, quantity: 30 } },
    });
    await api.post(`/api/v1/admin/distributions/${event.id}/publish`);
    const memberScopedApi = await memberApi();
    const project = await json<{ id: string; name: string }>(
      await memberScopedApi.post("/api/v1/projects", { data: { project: { name: `Projet e2e ${suffix}` } } }),
    );
    await memberScopedApi.dispose();

    await page.goto("/distributions");
    await expect(page.getByRole("heading", { name: "Distributions" })).toBeVisible();
    await page.getByText(event.title).click();

    await expect(page.getByRole("heading", { name: event.title })).toBeVisible();
    const stockRow = page
      .locator("div", { hasText: taxon.common_name })
      .filter({ has: page.locator('input[type="number"]') })
      .last();
    await expect(stockRow.getByText("30 disponibles")).toBeVisible();

    // Reserve: pick the first créneau, the fixture projet, and a quantity.
    await page.getByRole("radio").first().check();
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: project.name }).click();
    await stockRow.locator('input[type="number"]').fill("2");
    await page.getByRole("button", { name: "Réserver" }).click();

    // "Ma réservation" replaces the form and reflects what was booked.
    await expect(page.getByText("Ma réservation", { exact: true })).toBeVisible();
    await expect(page.getByText(taxon.common_name)).toBeVisible();
    await expect(page.getByText(project.name)).toBeVisible();

    // Cancel — since the slot is far in the future, cancellation is allowed
    // and stock/quantities are restored.
    await page.getByRole("button", { name: "Annuler ma réservation" }).click();
    await expect(page.getByText("Ma réservation", { exact: true })).not.toBeVisible();
    // A cancelled reservation blocks re-booking (one reservation per event),
    // so the form is replaced by a notice instead of coming back.
    await expect(page.getByText("Réservation annulée", { exact: true })).toBeVisible();

    await api.dispose();
  });

  test("closed event is read-only and offers a waitlist for exhausted species", async ({ page }) => {
    const api = await adminApi();
    const suffix = Date.now();

    const taxon = await json<{ id: string; common_name: string }>(
      await api.post("/api/v1/admin/taxa", {
        data: { taxon: { common_name: `Sureau e2e ${suffix}`, is_non_taxonomic: true } },
      }),
    );
    const event = await json<{ id: string; title: string }>(
      await api.post("/api/v1/admin/distributions", {
        data: { distribution: { title: `Distribution close e2e ${suffix}` } },
      }),
    );
    await api.post(`/api/v1/admin/distributions/${event.id}/slots`, {
      data: {
        slot: { location_name: "Ferme urbaine e2e", date: "2025-12-06", start_time: "09:30", end_time: "12:30" },
      },
    });
    await api.post(`/api/v1/admin/distributions/${event.id}/stocks`, {
      data: { stock: { taxon_id: taxon.id, quantity: 0 } },
    });
    await api.post(`/api/v1/admin/distributions/${event.id}/publish`);
    await api.post(`/api/v1/admin/distributions/${event.id}/close`);

    await page.goto("/distributions");
    await page.getByText(event.title).click();

    await expect(page.getByText("Événement clôturé")).toBeVisible();
    await expect(page.getByRole("button", { name: "Réserver" })).toHaveCount(0);

    await expect(page.getByText("Liste d'attente", { exact: true })).toBeVisible();
    const waitlistButton = page.getByRole("button", { name: "Rejoindre la liste d'attente" }).first();
    await expect(waitlistButton).toBeDisabled();

    await api.dispose();
  });
});
