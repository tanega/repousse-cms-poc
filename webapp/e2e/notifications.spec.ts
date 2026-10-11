import { expect, test } from "@playwright/test";

test.use({ storageState: "e2e/.auth/admin.json", viewport: { width: 390, height: 800 } });

test("a long notification list scrolls inside the popover instead of overflowing the page", async ({ page }) => {
  await page.goto("/dashboard/vie-associative");
  await page.locator('button[aria-label="Notifications"]').click();

  const popover = page.locator('[data-slot="popover-content"]');
  await expect(popover).toBeVisible();
  const list = popover.locator("ul").locator("..");
  // Needs enough notifications to overflow (the dev superadmin accumulates them from the request flows).
  test.skip((await popover.locator("li").count()) < 8, "not enough notifications to overflow");

  const box = await popover.boundingBox();
  expect(box?.height ?? 0).toBeLessThanOrEqual(800 * 0.9);
  expect(await list.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  expect(await list.evaluate((el) => getComputedStyle(el).overflowY)).toBe("auto");
});
