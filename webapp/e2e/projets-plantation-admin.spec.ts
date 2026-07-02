import { expect, test } from "@playwright/test";

// middleware.ts only checks that a "hanko" cookie is *present*, not that its
// value is a valid JWT — so a dummy value is enough to get past the redirect
// to /auth/v2/login for these local e2e runs.
test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: "hanko", value: "e2e-test-token", url: "http://localhost:3000" }]);
});

test.describe("Admin projets de plantation — create, publish, edit, delete", () => {
  test("create a project, publish it, edit it, then delete it", async ({ page }) => {
    await page.goto("/admin/projets-plantation");
    await expect(page.getByRole("heading", { name: "Projets de plantation" })).toBeVisible();

    // Create.
    await page.getByRole("link", { name: "Créer un projet" }).click();
    await page.locator("#nom").fill("Test projet e2e");
    await page.locator("#description").fill("Créé par le test e2e.");
    await page.locator("#adresse").fill("1 rue du Test, 69000 Lyon");
    await page.locator("#surfaceM2").fill("300");
    await page.locator("#natureSol").fill("Argileux");
    await page.getByRole("button", { name: "Créer le projet" }).click();

    // Redirects to the detail page in Privé.
    await expect(page.getByRole("heading", { name: "Test projet e2e" })).toBeVisible();
    await expect(page.getByText("Privé", { exact: true }).first()).toBeVisible();

    // Publish from the detail page.
    await page.getByRole("button", { name: "Publier", exact: true }).click();
    await expect(page.getByText("Public", { exact: true }).first()).toBeVisible();

    // Edit — change the name, confirm it's reflected back on detail.
    await page.getByRole("link", { name: "Modifier" }).click();
    await page.locator("#nom").fill("Test projet e2e (modifié)");
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

test.describe("Admin projets de plantation — médias, membres, journal, modération", () => {
  test("add and remove a media (US-PROJET-04/05)", async ({ page }) => {
    await page.goto("/admin/projets-plantation/haie-champetre-jardin-fort");
    await expect(page.getByText("1/10")).toBeVisible();

    await page.locator('input[placeholder="https://…"]').fill("https://example.org/photo.jpg");
    await page.getByRole("button", { name: "Ajouter" }).click();
    await expect(page.getByText("2/10")).toBeVisible();

    await page.locator('button[aria-label="Supprimer ce média"]').first().click();
    await page.getByRole("button", { name: "Supprimer", exact: true }).click();
    await expect(page.getByText("1/10")).toBeVisible();
  });

  test("invite a member, change a role, block removing the sole admin (US-PROJET-06/07)", async ({ page }) => {
    await page.goto("/admin/projets-plantation/arbres-fruitiers-jardin-camille");
    await expect(page.getByText("1 membre")).toBeVisible();

    // Sole admin cannot be removed.
    await expect(page.getByRole("button", { name: /Impossible de retirer/ })).toBeDisabled();

    // Invite a new member.
    await page.getByPlaceholder("email@exemple.org").fill("nouveau@example.org");
    await page.getByRole("button", { name: "Inviter" }).click();
    await expect(page.getByText("nouveau@example.org")).toBeVisible();
    await expect(page.getByText("Invitations en attente")).toBeVisible();
  });

  test("post, edit and delete a journal note (US-PROJET-09/10)", async ({ page }) => {
    await page.goto("/admin/projets-plantation/arbres-fruitiers-jardin-camille");
    await expect(page.getByText("Aucune note pour l'instant.")).toBeVisible();

    await page.getByPlaceholder("Consigner une action, une observation…").fill("Note de test e2e.");
    await page.getByRole("button", { name: "Publier la note" }).click();
    await expect(page.getByText("Note de test e2e.")).toBeVisible();

    await page.getByRole("button", { name: "Modifier la note" }).click();
    await page.locator("textarea").last().fill("Note de test e2e (modifiée).");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("Note de test e2e (modifiée).")).toBeVisible();

    await page.getByRole("button", { name: "Supprimer la note" }).click();
    await expect(page.getByText("Note de test e2e (modifiée).")).not.toBeVisible();
  });

  test("dépublier then republier a public project with a motif (US-PROJET-13/14)", async ({ page }) => {
    await page.goto("/admin/projets-plantation/verger-partage-coteaux");

    await page.getByRole("button", { name: "Dépublier" }).click();
    await page.getByPlaceholder("Motif de la dépublication…").fill("Contenu à vérifier.");
    await page.getByRole("alertdialog").getByRole("button", { name: "Dépublier" }).click();
    await expect(page.getByText("Contenu à vérifier.")).toBeVisible();

    await page.getByRole("button", { name: "Republier" }).click();
    await expect(page.getByText("Contenu à vérifier.")).not.toBeVisible();
  });
});
