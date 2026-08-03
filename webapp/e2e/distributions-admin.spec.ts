import { expect, test } from "@playwright/test";

// /admin/* routes now check the real authenticated user's role
// (admin/layout.tsx), so the dummy-cookie convention used elsewhere doesn't
// get past it — reuse the real admin session saved by e2e/auth.setup.ts.
test.use({ storageState: "e2e/.auth/admin.json" });

test.describe("Admin distributions — create, publish, edit, delete", () => {
  test("create an event, publish it, edit it, then delete it", async ({ page }) => {
    await page.goto("/admin/distributions");
    await expect(page.getByText("Événements de distribution")).toBeVisible();

    // Create — a créneau is required for canSubmit, species stock is optional.
    await page.getByRole("link", { name: "Créer un événement" }).click();
    await page.locator("#intitule").fill("Test distribution e2e");
    await page.locator("#description").fill("Créée par le test e2e.");
    await page.getByRole("button", { name: "Ajouter un créneau" }).click();
    await page.locator('input[placeholder="ex : Jardin partagé du Fort"]').fill("Lieu de test e2e");
    await page.locator('input[type="date"]').fill("2027-05-01");
    const timeInputs = page.locator('input[type="time"]');
    await timeInputs.nth(0).fill("09:00");
    await timeInputs.nth(1).fill("11:00");
    await page.getByRole("button", { name: "Créer l'événement" }).click();

    // Redirects to the detail page in Brouillon.
    await expect(page.getByRole("heading", { name: "Test distribution e2e" })).toBeVisible();
    await expect(page.getByText("Brouillon")).toBeVisible();

    // Publish from the detail page.
    await page.getByRole("button", { name: "Publier" }).click();
    await expect(page.getByText("Publié")).toBeVisible();

    // Edit — change the title, confirm it's reflected back on detail.
    await page.getByRole("link", { name: "Modifier" }).click();
    await page.locator("#intitule").fill("Test distribution e2e (modifiée)");
    await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
    await expect(page.getByRole("heading", { name: "Test distribution e2e (modifiée)" })).toBeVisible();

    // Back to the list, confirm the row is there, then delete it.
    await page.getByRole("link", { name: "Retour à la liste des distributions" }).click();
    await expect(page.getByText("Test distribution e2e (modifiée)")).toBeVisible();

    const row = page.locator("tr", { hasText: "Test distribution e2e (modifiée)" });
    await row.getByRole("button", { name: /Actions/ }).click();
    await page.getByRole("menuitem", { name: "Supprimer" }).click();
    await page.getByRole("button", { name: "Supprimer définitivement" }).click();
    await expect(page.getByText("Test distribution e2e (modifiée)")).not.toBeVisible();
  });
});
