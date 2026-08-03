import { expect, test } from "@playwright/test";

// /admin/* routes now check the real authenticated user's role
// (admin/layout.tsx), so the dummy-cookie convention used elsewhere doesn't
// get past it — reuse the real admin session saved by e2e/auth.setup.ts.
test.use({ storageState: "e2e/.auth/admin.json" });

test.describe("Espèces végétales — TanStack DB CRUD demo", () => {
  test("create, edit and delete a taxon end-to-end", async ({ page }) => {
    await page.goto("/admin/especes-vegetales");
    await expect(page.getByText("Catalogue des espèces végétales")).toBeVisible();

    // Create
    await page.getByRole("link", { name: "Ajouter" }).click();
    await page.locator("#nomCommun").fill("Test Saule");
    await page.locator("#nomScientifique").fill("Salix testus");
    await page.getByRole("button", { name: "Créer le taxon" }).click();
    await expect(page.getByText("Test Saule")).toBeVisible();

    // Edit — open an existing nested taxon, check the form is pre-filled,
    // then save a change and confirm it's reflected in the list.
    await page.getByRole("button", { name: "Développer tout" }).click();
    await page.getByRole("link", { name: "Chêne pédonculé" }).click();
    await page.getByRole("link", { name: "Modifier ce taxon" }).click();
    await expect(page.locator("#nomCommun")).toHaveValue("Chêne pédonculé");
    await expect(page.locator("#nomScientifique")).toHaveValue("Quercus robur");

    await page.locator("#nomCommun").fill("Chêne pédonculé (modifié)");
    await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
    await expect(page.getByText("Catalogue des espèces végétales")).toBeVisible();
    await page.getByRole("button", { name: "Développer tout" }).click();
    await expect(page.getByText("Chêne pédonculé (modifié)")).toBeVisible();

    // Delete the taxon created above (root row, visible collapsed too).
    await page.getByRole("button", { name: "Réduire tout" }).click();
    const row = page.locator("tr", { hasText: "Test Saule" });
    await row.getByRole("button", { name: /Actions/ }).click();
    await page.getByRole("menuitem", { name: "Supprimer" }).click();
    await page.getByRole("button", { name: "Supprimer définitivement" }).click();
    await expect(page.getByText("Test Saule")).not.toBeVisible();
  });
});
