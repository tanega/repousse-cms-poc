import { expect, test } from "@playwright/test";

const NURSERY_NAME = `Serre e2e ${Date.now()}`;
const MEMBER_EMAIL = "lecteur@repousse.local";

// Serial: the member creates the nursery, the coordinator checks they can see
// it on a *private* profile, then the member cleans up. Splitting the flow
// across two sessions is the whole point — the visibility rule only means
// anything when a second account looks at it.
test.describe.configure({ mode: "serial" });

test.describe("Famille d'accueil — profil d'engagement et nurseries", () => {
  test.describe("en tant que membre", () => {
    test.use({ storageState: "e2e/.auth/member.json" });

    test("activate the profile, fill hosting details and create a nursery", async ({ page }) => {
      await page.goto("/membres/me/settings");

      // Profile defaults to private — that's what makes the coordinator check below meaningful.
      await page.getByRole("button", { name: "Profil", exact: true }).click();
      await expect(page.getByRole("switch", { name: "Profil public" })).not.toBeChecked();

      await page.getByRole("button", { name: "Profils d'engagement" }).click();
      const activate = page.getByRole("button", { name: "Activer" }).last();
      if (await activate.isVisible().catch(() => false)) {
        await activate.click();
      }
      await expect(page.getByRole("button", { name: "Désactiver" }).last()).toBeVisible();

      // The hosting-details form only renders once the profile is active.
      await expect(page.getByText("Mes capacités d'accueil", { exact: true })).toBeVisible();
      await page.locator("#hosting_capacity").fill("120");
      await page.getByRole("button", { name: "Enregistrer mes capacités d'accueil" }).click();
      await expect(page.getByText("Informations d'accueil enregistrées.")).toBeVisible();

      // The sidebar entry is gated on the profile being active.
      const nurseriesLink = page.getByRole("link", { name: "Mes nurseries" });
      await expect(nurseriesLink).toBeVisible();
      await nurseriesLink.click();
      await expect(page).toHaveURL(/\/mes-nurseries/);

      await page.getByRole("button", { name: "Nouvelle nurserie" }).click();
      await page.locator("#name").fill(NURSERY_NAME);
      await page.locator("#notes").fill("Exposition sud, arrosage manuel.");

      await page.getByRole("combobox").filter({ hasText: "Ajouter une espèce" }).click();
      await page.getByRole("option").first().click();
      await page.getByRole("spinbutton", { name: /Quantité pour/ }).fill("24");

      await page.getByRole("button", { name: "Enregistrer" }).click();
      await expect(page.getByText("Nurserie créée.")).toBeVisible();
      await expect(page.getByText(NURSERY_NAME)).toBeVisible();
      await expect(page.getByText("24 plants")).toBeVisible();

      // And on the member's own profile page.
      await page.goto("/membres/me");
      await page.getByRole("tab", { name: "Nurseries" }).click();
      await expect(page.getByText(NURSERY_NAME)).toBeVisible();
    });
  });

  test.describe("en tant que coordinateur", () => {
    test.use({ storageState: "e2e/.auth/admin.json" });

    test("sees the nurseries of a member whose profile is private", async ({ page }) => {
      await page.goto("/admin/adherents");

      const row = page.locator("tr", { hasText: MEMBER_EMAIL });
      await row.getByRole("button", { name: /Actions/ }).click();
      await page.getByRole("menuitem", { name: "Voir le profil" }).click();

      await expect(page.getByText("Profil privé")).toBeVisible();
      await expect(page.getByText("120 plants")).toBeVisible();

      await page.getByRole("tab", { name: "Nurseries" }).click();
      await expect(page.getByText(NURSERY_NAME)).toBeVisible();
    });
  });

  test.describe("nettoyage", () => {
    test.use({ storageState: "e2e/.auth/member.json" });

    test("archives the nursery so reruns start clean", async ({ page }) => {
      await page.goto("/mes-nurseries");
      await page.getByRole("button", { name: `Archiver ${NURSERY_NAME}` }).click();
      await page.getByRole("button", { name: "Archiver", exact: true }).click();
      await expect(page.getByText(NURSERY_NAME)).toHaveCount(0);
    });
  });
});
