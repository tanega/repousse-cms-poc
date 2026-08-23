import { type Page, expect, test as setup } from "@playwright/test";

// Runs once before specs that need a real backend session. Role gates
// (admin/layout.tsx) and authenticated-only API calls now hit the real
// backend GET /api/v1/me — a dummy "hanko" cookie value (the old convention
// used elsewhere, see especes-vegetales.spec.ts) gets a 401. This does a
// real passcode login as a seeded user and saves the session so specs can
// reuse it via `test.use({ storageState: ... })`.
const ADMIN_AUTH_FILE = "e2e/.auth/admin.json";
const MEMBER_AUTH_FILE = "e2e/.auth/member.json";
const ADMIN_EMAIL = "superadmin@repousse.local";
// Seeded role: :member (see backend/priv/repo/seeds.exs) — a real non-admin
// account for member-facing specs (distributions reservations, etc.).
const MEMBER_EMAIL = "lecteur@repousse.local";

async function getLatestOtp(email: string): Promise<string | null> {
  const res = await fetch("http://localhost:8025/api/v1/messages?limit=20");
  const data = await res.json();
  const msg = data.messages.find((m: { To: { Address: string }[] }) => m.To[0]?.Address === email);
  if (!msg) return null;
  const full = await fetch(`http://localhost:8025/api/v1/message/${msg.ID}`).then((r) => r.json());
  const match = full.Text.match(/(\d{6})/);
  return match ? match[1] : null;
}

async function loginWithPasscode(page: Page, email: string): Promise<void> {
  await page.goto("/auth/v2/login");
  const hankoAuth = page.locator("hanko-auth");

  await hankoAuth.locator("input[type='email']").first().fill(email);

  const continueButton = hankoAuth
    .locator("button[type='submit'], button")
    .filter({ hasText: /continuer|continue/i })
    .first();
  await continueButton.waitFor({ state: "visible" });
  // hanko-elements races its own `register_client_capabilities` call against
  // whatever the next click triggers — clicking immediately (as Playwright
  // does, much faster than a human) can win that race and land the widget in
  // a broken transient error state that never recovers on its own. A short
  // settle delay avoids it.
  await page.waitForTimeout(500);
  await continueButton.click();

  // The method-selection step ("Code d'accès" / "Mot de passe" / "Clé
  // d'identification") only renders when the account has more than one
  // login method, and can transition to the passcode step on its own —
  // poll and re-query fresh each iteration rather than awaiting a single
  // .click() on a locator that may detach mid-wait.
  const firstDigit = hankoAuth.getByRole("textbox", { name: "passcode-digit-1" });
  for (let i = 0; i < 20; i++) {
    if (await firstDigit.isVisible().catch(() => false)) break;
    const codeMethod = hankoAuth.getByText("Code d'accès", { exact: true });
    if (await codeMethod.isVisible().catch(() => false)) {
      await codeMethod.click().catch(() => {});
    }
    await page.waitForTimeout(500);
  }

  await firstDigit.waitFor({ state: "visible", timeout: 10_000 });

  let code: string | null = null;
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(500);
    code = await getLatestOtp(email);
    if (code) break;
  }
  expect(code, "OTP email never arrived at Mailpit").not.toBeNull();

  await firstDigit.click();
  await page.keyboard.type(code!, { delay: 50 });

  const submitOtpButton = hankoAuth
    .locator("button[type='submit'], button")
    .filter({ hasText: /continuer|continue/i });
  if ((await submitOtpButton.count()) > 0 && (await submitOtpButton.first().isVisible())) {
    await submitOtpButton.first().click().catch(() => {});
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
}

setup("authenticate as admin", async ({ page }) => {
  await loginWithPasscode(page, ADMIN_EMAIL);
  await page.context().storageState({ path: ADMIN_AUTH_FILE });
});

setup("authenticate as member", async ({ page }) => {
  await loginWithPasscode(page, MEMBER_EMAIL);
  await page.context().storageState({ path: MEMBER_AUTH_FILE });
});
