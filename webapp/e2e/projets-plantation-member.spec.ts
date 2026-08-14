import { expect, test } from "@playwright/test";

// middleware.ts only checks that a "hanko" cookie is *present*, not that its
// value is a valid JWT — so a dummy value is enough to get past the redirect
// to /auth/v2/login for these local e2e runs.
test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: "hanko", value: "e2e-test-token", url: "http://localhost:3010" }]);
});

test.describe("Member projets de plantation — browse and dashboard (US-PROJET-11/12)", () => {
  test("browse only lists public projects, filterable by search", async ({ page }) => {
    await page.goto("/projets-plantation");
    await expect(page.getByRole("heading", { name: "Projets de plantation" })).toBeVisible();
    await expect(page.getByText("Verger partagé des Coteaux")).toBeVisible();
    await expect(page.getByText("Haie champêtre du Jardin du Fort")).toBeVisible();
    // The seeded Privé project must never appear in the public browse.
    await expect(page.getByText("Petit verger d'Amir")).not.toBeVisible();

    await page.getByPlaceholder("Rechercher un projet…").fill("Haie");
    await expect(page.getByText("Verger partagé des Coteaux")).not.toBeVisible();
    await expect(page.getByText("Haie champêtre du Jardin du Fort")).toBeVisible();
  });

  test("Éditeur can post a journal note but cannot manage members", async ({ page }) => {
    // Camille Bernard is an Éditeur on this project (see current-user.ts / data.ts seed).
    await page.goto("/projets-plantation/verger-partage-coteaux");
    await expect(page.getByText("Vous : Éditeur")).toBeVisible();

    await page.getByPlaceholder("Consigner une action, une observation…").fill("Note membre e2e.");
    await page.getByRole("button", { name: "Publier la note" }).click();
    await expect(page.getByText("Note membre e2e.")).toBeVisible();

    await expect(page.getByPlaceholder("email@exemple.org")).not.toBeVisible();
  });

  test("Administrateur can manage members on their own project", async ({ page }) => {
    // Camille Bernard is the Administrateur of this project.
    await page.goto("/projets-plantation/haie-champetre-jardin-fort");
    await expect(page.getByText("Vous : Administrateur")).toBeVisible();
    await expect(page.getByPlaceholder("email@exemple.org")).toBeVisible();
  });

  test("a private project the member doesn't belong to is not accessible", async ({ page }) => {
    await page.goto("/projets-plantation/arbres-fruitiers-jardin-camille");
    await expect(page.getByRole("heading", { name: "Page not found." })).toBeVisible();
  });
});
