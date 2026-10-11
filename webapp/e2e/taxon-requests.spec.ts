import { expect, test } from "@playwright/test";

const STAMP = Date.now();
const NURSERY_NAME = `Serre plante e2e ${STAMP}`;
const PLANT_NAME = `Poirier e2e ${STAMP}`;

// Needs the seeded member to be an active Famille d'accueil (see nurseries.spec.ts,
// which leaves it so). Serial: member asks → coordinator decides → member sees
// the result, across three sessions.
test.describe.configure({ mode: "serial" });

test.describe("Demande d'ajout d'une plante manquante", () => {
  test.describe("en tant que membre", () => {
    test.use({ storageState: "e2e/.auth/member.json" });

    test("asks for a missing plant from the nursery form", async ({ page }) => {
      await page.goto("/mes-nurseries");
      await page.getByRole("button", { name: "Nouvelle nurserie" }).click();
      await page.locator("#name").fill(NURSERY_NAME);

      await page.getByRole("combobox").filter({ hasText: "Ajouter une espèce" }).click();
      await page.getByPlaceholder("Rechercher une plante…").fill(PLANT_NAME);
      await expect(page.getByText("Aucune plante ne correspond.")).toBeVisible();

      await page.getByRole("button", { name: "Demander l'ajout d'une plante" }).click();
      // The typed name is carried over to the request form.
      await expect(page.locator("#request-common-name")).toHaveValue(PLANT_NAME);
      await page.locator("#request-scientific-name").fill("Pyrus e2e");
      await page.getByRole("button", { name: "Envoyer la demande" }).click();
      await expect(page.getByText("Demande envoyée aux administrateurs.")).toBeVisible();

      // The plant is on the nursery, flagged as pending.
      await expect(page.getByText("En attente de validation")).toBeVisible();
      await page.getByRole("spinbutton", { name: /Quantité pour/ }).fill("7");
      await page.getByRole("button", { name: "Enregistrer" }).click();
      await expect(page.getByText("Nurserie créée.")).toBeVisible();
    });
  });

  test.describe("en tant que coordinateur", () => {
    test.use({ storageState: "e2e/.auth/admin.json" });

    test("accepts the request by creating the species", async ({ page }) => {
      await page.goto("/admin/especes-vegetales?tab=demandes");

      const row = page.getByTestId("taxon-request-row").filter({ hasText: PLANT_NAME });
      await expect(row).toBeVisible();
      await row.getByRole("button", { name: "Accepter" }).click();
      await page.getByRole("button", { name: "Accepter la demande" }).click();
      await expect(page.getByText("Plante ajoutée à la liste, le demandeur est notifié.")).toBeVisible();
      await expect(row).toHaveCount(0);
    });
  });

  test.describe("en tant que membre (après décision)", () => {
    test.use({ storageState: "e2e/.auth/member.json" });

    test("is notified and the plant is now a regular species", async ({ page }) => {
      await page.goto("/mes-nurseries");
      await page.locator('button[aria-label="Notifications"]').click();
      await expect(page.getByText(`Plante ajoutée : ${PLANT_NAME}`).first()).toBeVisible();
      await page.keyboard.press("Escape");

      await expect(page.getByText(NURSERY_NAME)).toBeVisible();
      await expect(page.getByText("En attente de validation")).toHaveCount(0);

      // Clean up so reruns start from a clean slate.
      await page.getByRole("button", { name: `Archiver ${NURSERY_NAME}` }).click();
      await page.getByRole("button", { name: "Archiver", exact: true }).click();
      await expect(page.getByText(NURSERY_NAME)).toHaveCount(0);
    });
  });
});
