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

    test("asks to join the Famille d'accueil profile and waits for validation", async ({ page }) => {
      await page.goto("/membres/me/settings");

      // Profile defaults to private — that's what makes the coordinator check below meaningful.
      await page.getByRole("button", { name: "Profil", exact: true }).click();
      await expect(page.getByRole("switch", { name: "Profil public" })).not.toBeChecked();

      await page.getByRole("button", { name: "Profils d'engagement" }).click();
      const card = page.locator('[data-slot="card"]').filter({ hasText: "Famille d'accueil" }).last();

      // Start from "not a host family" so the request flow is actually exercised
      // (the dev seed may already have the profile active).
      const deactivate = card.getByRole("button", { name: "Désactiver" });
      if (await deactivate.isVisible().catch(() => false)) {
        await deactivate.click();
      }

      await card.getByRole("button", { name: "Rejoindre" }).click();
      await expect(page.getByText("Demande envoyée aux administrateurs.")).toBeVisible();
      await expect(card.getByRole("button", { name: "En attente de validation" })).toBeDisabled();
    });
  });

  test.describe("validation par un administrateur", () => {
    test.use({ storageState: "e2e/.auth/admin.json" });

    test("approves the pending request", async ({ page }) => {
      await page.goto("/admin/demandes-parcours");

      const row = page
        .getByTestId("profile-request-row")
        .filter({ hasText: MEMBER_EMAIL })
        .filter({ hasText: "Famille d'accueil" });
      await row.first().getByRole("button", { name: "Accepter" }).click();
      await expect(page.getByText("Demande acceptée, le membre est notifié.")).toBeVisible();
    });
  });

  test.describe("en tant que membre (après validation)", () => {
    test.use({ storageState: "e2e/.auth/member.json" });

    test("is notified, fills hosting details and creates a nursery", async ({ page }) => {
      await page.goto("/membres/me/settings");

      // The decision shows up in the notification bell.
      await page.locator('button[aria-label="Notifications"]').click();
      await expect(page.getByText(/Votre demande est acceptée : Famille d'accueil/).first()).toBeVisible();
      await page.keyboard.press("Escape");

      await page.getByRole("button", { name: "Profils d'engagement" }).click();
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
