import { expect, test } from "@playwright/test";

// /admin/* routes now check the real authenticated user's role
// (admin/layout.tsx), so the dummy-cookie convention used elsewhere doesn't
// get past it — reuse the real admin session saved by e2e/auth.setup.ts.
test.use({ storageState: "e2e/.auth/admin.json" });

test.describe("Admin projets de plantation — create, publish, edit, delete", () => {
  test("create a project, publish it, edit it, then delete it", async ({ page }) => {
    await page.goto("/admin/projets-plantation");
    await expect(page.getByRole("heading", { name: "Projets de plantation" })).toBeVisible();

    // Create.
    await page.getByRole("link", { name: "Créer un projet" }).click();
    await page.locator("#name").fill("Test projet e2e");
    await page.locator("#description").fill("Créé par le test e2e.");
    await page.locator("#address").fill("1 rue du Test, 69000 Lyon");
    await page.locator("#surface_m2").fill("300");
    await page.locator("#soil_type").fill("Argileux");
    await page.getByRole("button", { name: "Créer le projet" }).click();

    // Redirects to the list (the backend assigns the real id, so we can't
    // deep-link straight to the detail page from the client-side draft id).
    await expect(page.getByRole("heading", { name: "Projets de plantation" })).toBeVisible();
    await expect(page.getByText("Test projet e2e")).toBeVisible();
    await page.getByRole("link", { name: "Test projet e2e" }).click();

    // Detail page, created in Privé.
    await expect(page.getByRole("heading", { name: "Test projet e2e" })).toBeVisible();
    await expect(page.getByText("Privé", { exact: true }).first()).toBeVisible();

    // Publish from the detail page.
    await page.getByRole("button", { name: "Publier", exact: true }).click();
    await expect(page.getByText("Public", { exact: true }).first()).toBeVisible();

    // Edit — change the name, confirm it's reflected back on detail.
    await page.getByRole("link", { name: "Modifier" }).click();
    await page.locator("#name").fill("Test projet e2e (modifié)");
    await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
    await expect(page.getByRole("heading", { name: "Test projet e2e (modifié)" })).toBeVisible();

    // Back to the list, confirm the row is there, then delete it.
    await page.getByRole("link", { name: "Retour à la liste des projets" }).click();
    await expect(page.getByText("Test projet e2e (modifié)")).toBeVisible();

    const row = page.locator("tr", { hasText: "Test projet e2e (modifié)" });
    await row.getByRole("button", { name: /Actions/ }).click();
    await page.getByRole("menuitem", { name: "Supprimer" }).click();
    await page.getByRole("button", { name: "Supprimer définitivement" }).click();
    await expect(page.getByText("Test projet e2e (modifié)")).not.toBeVisible();
  });
});

// Médias/membres/journal/modération (US-PROJET-04/05/06/07/09/10/13/14) ran
// against the old mock's hardcoded slugs and cards. The admin detail page now
// sources real data from /api/v1/projects; those subresource cards are
// deferred to a later pass (see especes-vegetales for the real-data pattern)
// and no longer render here, so their tests were removed rather than left
// permanently failing. Reinstate once members/media/journal are wired.
