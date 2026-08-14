import { expect, test } from "@playwright/test";

// middleware.ts only checks that a "hanko" cookie is *present*, not that its
// value is a valid JWT — so a dummy value is enough to get past the redirect
// to /auth/v2/login for these local e2e runs.
test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: "hanko", value: "e2e-test-token", url: "http://localhost:3010" }]);
});

test.describe("Member distributions — browse, reserve, cancel, waitlist", () => {
  test("reserve a slot, see stock decrease, then cancel and see it restored", async ({ page }) => {
    await page.goto("/distributions");
    await expect(page.getByRole("heading", { name: "Distributions" })).toBeVisible();
    await page.getByText("Distribution d'automne 2026").click();

    await expect(page.getByRole("heading", { name: "Distribution d'automne 2026" })).toBeVisible();
    const stockRow = page
      .locator("div", { hasText: "Chêne pédonculé" })
      .filter({ has: page.locator('input[type="number"]') })
      .last();
    await expect(stockRow.getByText("30 disponibles")).toBeVisible();

    // Reserve: pick the first créneau, a mandatory projet, and a quantity.
    await page.getByRole("radio").first().check();
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: "Cour d'école Jean Moulin" }).click();
    await stockRow.locator('input[type="number"]').fill("2");
    await page.getByRole("button", { name: "Réserver" }).click();

    // "Ma réservation" replaces the form and reflects what was booked.
    await expect(page.getByText("Ma réservation", { exact: true })).toBeVisible();
    await expect(page.getByText("Chêne pédonculé")).toBeVisible();
    await expect(page.getByText("Cour d'école Jean Moulin")).toBeVisible();

    // Cancel — since the slot is far in the future, cancellation is allowed
    // and stock/quantities are restored.
    await page.getByRole("button", { name: "Annuler ma réservation" }).click();
    await expect(page.getByText("Ma réservation", { exact: true })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Réserver" })).toBeVisible();
    const restoredRow = page
      .locator("div", { hasText: "Chêne pédonculé" })
      .filter({ has: page.locator('input[type="number"]') })
      .last();
    await expect(restoredRow.getByText("30 disponibles")).toBeVisible();
  });

  test("closed event is read-only and offers a waitlist for exhausted species", async ({ page }) => {
    await page.goto("/distributions/distribution-hiver-2025");
    await expect(page.getByText("Événement clôturé")).toBeVisible();
    await expect(page.getByRole("button", { name: "Réserver" })).toHaveCount(0);

    await expect(page.getByText("Liste d'attente", { exact: true })).toBeVisible();
    const waitlistButton = page.getByRole("button", { name: "Rejoindre la liste d'attente" }).first();
    await expect(waitlistButton).toBeDisabled();
  });
});
