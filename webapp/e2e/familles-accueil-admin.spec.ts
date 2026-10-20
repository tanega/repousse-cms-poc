import { type APIRequestContext, expect, request as playwrightRequest, test } from "@playwright/test";

import fs from "node:fs";

const API_URL = "http://localhost:4000";
const ADMIN_AUTH_FILE = "e2e/.auth/admin.json";
const MEMBER_AUTH_FILE = "e2e/.auth/member.json";
const MEMBER_EMAIL = "lecteur@repousse.local";

test.use({ storageState: ADMIN_AUTH_FILE });

function hankoTokenFrom(storageStatePath: string): string {
  const state = JSON.parse(fs.readFileSync(storageStatePath, "utf-8"));
  const cookie = (state.cookies as { name: string; value: string }[]).find((c) => c.name === "hanko");
  if (!cookie) throw new Error(`No "hanko" cookie found in ${storageStatePath}`);
  return cookie.value;
}

function api(storageStatePath: string): Promise<APIRequestContext> {
  return playwrightRequest.newContext({
    baseURL: API_URL,
    extraHTTPHeaders: { Authorization: `Bearer ${hankoTokenFrom(storageStatePath)}` },
  });
}

async function json<T>(res: { ok(): boolean; status(): number; text(): Promise<string> }): Promise<T> {
  if (!res.ok()) throw new Error(`API ${res.status()}: ${await res.text()}`);
  return JSON.parse(await res.text()).data;
}

/** The seeded member needs an *active* Famille d'accueil profile to own a nursery. */
async function ensureHostFamily(member: APIRequestContext, admin: APIRequestContext) {
  const profiles = await json<{ id: string; profile_type: string; status: string }[]>(
    await member.get("/api/v1/me/profiles"),
  );
  let profile = profiles.find((p) => p.profile_type === "host_family");
  if (profile?.status === "active") return;
  if (profile?.status !== "pending") {
    profile = await json(
      await member.post("/api/v1/me/profiles/host_family/request", {
        data: { profile: { hosting_capacity: 120, hosting_address: "12 rue des Lilas, 75020 Paris" } },
      }),
    );
  }
  await json(await admin.post(`/api/v1/admin/profile_requests/${profile?.id}/approve`));
}

test.describe("Admin — Familles d'accueil & nurseries", () => {
  const suffix = Date.now();
  const genusName = `Genre e2e ${suffix}`;
  const speciesName = `Espèce e2e ${suffix}`;
  const nurseryName = `Serre stock e2e ${suffix}`;
  let nurseryId: string | null = null;

  test.beforeAll(async () => {
    const admin = await api(ADMIN_AUTH_FILE);
    const member = await api(MEMBER_AUTH_FILE);
    await ensureHostFamily(member, admin);
    await json(
      await member.put("/api/v1/me/profiles/host_family", { data: { profile: { hosting_phone: "06 12 34 56 78" } } }),
    );

    const genus = await json<{ id: string }>(
      await admin.post("/api/v1/admin/taxa", {
        data: { taxon: { common_name: genusName, scientific_name: `Genuse2e${suffix}`, taxonomic_level: "genus" } },
      }),
    );
    const species = await json<{ id: string }>(
      await admin.post("/api/v1/admin/taxa", {
        data: {
          taxon: {
            common_name: speciesName,
            scientific_name: `Genuse2e${suffix} robur`,
            taxonomic_level: "species",
            parent_id: genus.id,
          },
        },
      }),
    );

    const nursery = await json<{ id: string }>(
      await member.post("/api/v1/me/nurseries", {
        data: {
          nursery: {
            name: nurseryName,
            address: "12 rue des Lilas, 75020 Paris",
            lat: 48.8674,
            lng: 2.3987,
            // 5 only identified down to the genus + 37 of the species = 42 at genus level.
            plants: [
              { taxon_id: genus.id, quantity: 5 },
              { taxon_id: species.id, quantity: 37 },
            ],
          },
        },
      }),
    );
    nurseryId = nursery.id;
  });

  test.afterAll(async () => {
    if (!nurseryId) return;
    const member = await api(MEMBER_AUTH_FILE);
    await member.delete(`/api/v1/me/nurseries/${nurseryId}`);
  });

  test("aggregates stock by taxon tree and lists the nurseries holding it, with contacts", async ({ page }) => {
    await page.goto("/admin/familles-accueil");
    await expect(page.getByRole("heading", { name: "Familles d'accueil & nurseries" })).toBeVisible();
    await expect(page.getByTestId("kpi-card").filter({ hasText: "Plants disponibles" })).toBeVisible();

    // Genus row cumulates its own plants and the species' ones.
    await page.getByPlaceholder("Rechercher un taxon…").fill(genusName);
    const genusRow = page.getByTestId("stock-row").filter({ hasText: genusName });
    await expect(genusRow).toContainText("42");
    await expect(genusRow).toContainText("dont 5 sans précision");
    // Searching expanded the tree; once cleared, the species shows under its genus.
    await page.getByPlaceholder("Rechercher un taxon…").fill("");
    await expect(page.getByTestId("stock-row").filter({ hasText: speciesName })).toContainText("37");

    // Selecting the taxon narrows the nursery list to the ones holding it.
    await genusRow.click();
    await expect(page.getByTestId("selected-taxon")).toContainText(genusName);
    const rows = page.getByTestId("nursery-row");
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText(nurseryName);
    await expect(rows.first()).toContainText(MEMBER_EMAIL);
    await expect(rows.first()).toContainText("06 12 34 56 78");
    await expect(rows.first()).toContainText("42");

    // Picking the nursery opens its card on the map.
    await rows.first().click();
    const popup = page.locator(".maplibregl-popup");
    await expect(popup).toContainText(nurseryName);
    await expect(popup).toContainText("06 12 34 56 78");

    // The detail export follows the filter and carries the contacts.
    await page.getByRole("button", { name: "Exporter" }).click();
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("menuitem", { name: /Détail par nurserie/ }).click();
    const download = await downloadPromise;
    const csv = fs.readFileSync((await download.path()) as string, "utf-8");
    const lines = csv.trim().split(/\r\n/);
    expect(lines[0]).toContain("Téléphone");
    expect(lines).toHaveLength(3);
    expect(csv).toContain(nurseryName);
    expect(csv).toContain("06 12 34 56 78");
    expect(csv).toContain(speciesName);
  });
});
