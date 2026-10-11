import { expect, test } from "@playwright/test";

// The Coordination / Pages / Legacy sidebar sections and the GitHub link and
// theme settings of the top bar are template leftovers: only the superadmin
// account keeps them.
const LEFTOVER_SECTIONS = ["Coordination", "Pages", "Legacy"];

test.describe("administrateur (non superadmin)", () => {
  test.use({ storageState: "e2e/.auth/plain-admin.json" });

  test("does not see the template sections nor the GitHub / theme settings controls", async ({ page }) => {
    await page.goto("/dashboard/vie-associative");

    // The admin sections are still there…
    await expect(page.getByRole("link", { name: "Membres" })).toBeVisible();
    for (const label of LEFTOVER_SECTIONS) {
      await expect(page.getByText(label, { exact: true })).toHaveCount(0);
    }

    // …and the top bar keeps only the light/dark switch and the account menu.
    await expect(page.getByRole("button", { name: /Current theme/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open GitHub repository" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Theme settings" })).toHaveCount(0);
  });

  test("cannot open the leftover pages directly", async ({ page }) => {
    for (const path of [
      "/dashboard/tasks",
      "/dashboard/calendar",
      "/admin/kanban",
      "/dashboard/chat",
      "/dashboard/finance",
    ]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/non-autorise/);
    }
  });

  test("the command palette does not offer them either", async ({ page }) => {
    await page.goto("/dashboard/vie-associative");
    await page.keyboard.press("Control+j");
    await page.getByPlaceholder(/Search|Rechercher/i).fill("Kanban");
    await expect(page.getByRole("option", { name: /Kanban/ })).toHaveCount(0);
  });
});

test.describe("superadmin", () => {
  test.use({ storageState: "e2e/.auth/admin.json" });

  test("keeps the template sections and the top bar controls", async ({ page }) => {
    await page.goto("/dashboard/vie-associative");

    for (const label of LEFTOVER_SECTIONS) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
    }
    await expect(page.getByRole("link", { name: "Open GitHub repository" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Theme settings" })).toBeVisible();

    await page.goto("/dashboard/tasks");
    await expect(page).toHaveURL(/\/dashboard\/tasks/);
  });
});

test.describe("membre", () => {
  test.use({ storageState: "e2e/.auth/member.json" });

  test("does not see the top bar extras", async ({ page }) => {
    await page.goto("/dashboard/me");
    await expect(page.getByRole("button", { name: /Current theme/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open GitHub repository" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Theme settings" })).toHaveCount(0);
  });
});
