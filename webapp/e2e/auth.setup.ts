import { expect, test as setup } from "@playwright/test";

// Runs once before the admin-page specs. The admin role gate
// (admin/layout.tsx) now calls the real backend GET /api/v1/me — a dummy
// "hanko" cookie value (the old convention used elsewhere, see
// especes-vegetales.spec.ts) gets a 401 and redirects to /unauthorized. This
// does a real passcode login as the seeded superadmin and saves the session
// so admin specs can reuse it via `test.use({ storageState: ADMIN_AUTH_FILE })`.
const ADMIN_AUTH_FILE = "e2e/.auth/admin.json";
const EMAIL = "superadmin@repousse.local";

async function getLatestOtp(email: string): Promise<string | null> {
  const res = await fetch("http://localhost:8025/api/v1/messages?limit=20");
  const data = await res.json();
  const msg = data.messages.find((m: { To: { Address: string }[] }) => m.To[0]?.Address === email);
  if (!msg) return null;
  const full = await fetch(`http://localhost:8025/api/v1/message/${msg.ID}`).then((r) => r.json());
  const match = full.Text.match(/(\d{6})/);
  return match ? match[1] : null;
}

setup("authenticate as admin", async ({ page }) => {
  await page.goto("/auth/v2/login");
  const hankoAuth = page.locator("hanko-auth");

  await hankoAuth.locator("input[type='email']").first().fill(EMAIL);
  await hankoAuth
    .locator("button[type='submit'], button")
    .filter({ hasText: /continuer|continue/i })
    .first()
    .click();

  const codeMethod = hankoAuth.getByText("Code d'accès", { exact: true });
  if ((await codeMethod.count()) > 0) {
    await codeMethod.click();
  }

  const firstDigit = hankoAuth.getByRole("textbox", { name: "passcode-digit-1" });
  await firstDigit.waitFor({ state: "visible", timeout: 10_000 });

  let code: string | null = null;
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(500);
    code = await getLatestOtp(EMAIL);
    if (code) break;
  }
  expect(code, "OTP email never arrived at Mailpit").not.toBeNull();

  await firstDigit.click();
  await page.keyboard.type(code!, { delay: 50 });

  const continueButton = hankoAuth.locator("button[type='submit'], button").filter({ hasText: /continuer|continue/i });
  if ((await continueButton.count()) > 0 && (await continueButton.first().isVisible())) {
    await continueButton.first().click().catch(() => {});
  }

  for (let i = 0; i < 10; i++) {
    if (/\/dashboard/.test(page.url())) break;
    await page.waitForTimeout(1000);
    const passer = hankoAuth.getByText("Passer", { exact: true });
    if ((await passer.count()) > 0) {
      await passer.click({ force: true }).catch(() => {});
    }
  }

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  await page.context().storageState({ path: ADMIN_AUTH_FILE });
});
