import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

// Unlike the other specs, this one needs a *real* Hanko session — /api/v1/me
// requires a backend-verifiable JWT, so the dummy-cookie trick used
// elsewhere (see especes-vegetales.spec.ts) won't get past the API. This
// logs in via the real passcode flow, pulling the OTP from Mailpit's REST
// API. Slower than the other specs (real OTP round-trip, ~10-15s), so it
// stays isolated in its own file.

async function getLatestOtp(email: string): Promise<string | null> {
  const res = await fetch("http://localhost:8025/api/v1/messages?limit=20");
  const data = await res.json();
  const msg = data.messages.find((m: { To: { Address: string }[] }) => m.To[0]?.Address === email);
  if (!msg) return null;
  const full = await fetch(`http://localhost:8025/api/v1/message/${msg.ID}`).then((r) => r.json());
  const match = full.Text.match(/(\d{6})/);
  return match ? match[1] : null;
}

async function loginViaPasscode(page: Page, email: string) {
  await page.goto("/auth/v2/login");
  const hankoAuth = page.locator("hanko-auth");

  await hankoAuth.locator("input[type='email']").first().fill(email);
  await hankoAuth
    .locator("button[type='submit'], button")
    .filter({ hasText: /continuer|continue/i })
    .first()
    .click();

  // Existing accounts get a method picker (passcode vs password vs passkey).
  const codeMethod = hankoAuth.getByText("Code d'accès", { exact: true });
  if ((await codeMethod.count()) > 0) {
    await codeMethod.click();
  }

  // Wait for the passcode digit-box screen to actually mount before typing —
  // right after submission there's a brief transition where the old email
  // input can still be the "first input" match, causing keystrokes to land
  // in the wrong field.
  const firstDigit = hankoAuth.getByRole("textbox", { name: "passcode-digit-1" });
  await firstDigit.waitFor({ state: "visible", timeout: 10_000 });

  let code: string | null = null;
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(500);
    code = await getLatestOtp(email);
    if (code) break;
  }
  expect(code, "OTP email never arrived at Mailpit").not.toBeNull();
  if (!code) throw new Error("unreachable — asserted above");

  // Real keystrokes (not .fill()) so the digit-box component's own
  // paste/auto-advance handling places each character correctly.
  await firstDigit.click();
  await page.keyboard.type(code, { delay: 50 });

  // Some flows auto-submit on the 6th digit, others need an explicit click.
  const continueButton = hankoAuth.locator("button[type='submit'], button").filter({ hasText: /continuer|continue/i });
  if ((await continueButton.count()) > 0 && (await continueButton.first().isVisible())) {
    // Some flows have already auto-submitted by the time we get here.
    await continueButton.first().click().catch(() => undefined);
  }

  // An optional onboarding step (e.g. "add a passkey") may appear before the
  // session is actually created — skip it if present.
  for (let i = 0; i < 10; i++) {
    if (/\/dashboard/.test(page.url())) break;
    await page.waitForTimeout(1000);
    const passer = hankoAuth.getByText("Passer", { exact: true });
    if ((await passer.count()) > 0) {
      // The button can detach mid-click if the session finishes right then.
      await passer.click({ force: true }).catch(() => undefined);
    }
  }

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
}

test.describe("Real authenticated user — profile display and edit", () => {
  // Two concurrent real-login flows collide (Hanko passcode rate limiting /
  // dev-server contention under Turbopack) — keep this file's tests serial.
  test.describe.configure({ mode: "serial" });

  test("login shows real user data and name edits persist", async ({ page }) => {
    await loginViaPasscode(page, "superadmin@repousse.local");

    // Sidebar shows the real seeded identity, not the old "Association Repousse" mock.
    await expect(page.getByText("Super Admin")).toBeVisible();

    // Profile page sources its heading from the real user too.
    await page.goto("/membres/me");
    await expect(page.getByRole("heading", { name: "Super Admin" })).toBeVisible();

    // Settings: edit the first name, save, reload, confirm it persisted server-side.
    await page.goto("/membres/me/settings");
    const firstNameInput = page.locator("#first_name");
    await expect(firstNameInput).toHaveValue("Super");

    await firstNameInput.fill("SuperE2E");
    await page.getByRole("button", { name: "Mettre à jour le compte" }).click();
    await expect(page.getByText("Profil mis à jour.")).toBeVisible();

    // Sidebar and header must reflect the new name immediately — no reload —
    // this is the regression check for the cross-component desync bug.
    await expect(page.getByText("SuperE2E Admin")).toBeVisible();

    await page.reload();
    await expect(page.locator("#first_name")).toHaveValue("SuperE2E");

    // Restore the seed value so re-runs stay idempotent.
    await page.locator("#first_name").fill("Super");
    await page.getByRole("button", { name: "Mettre à jour le compte" }).click();
    await expect(page.getByText("Profil mis à jour.")).toBeVisible();
  });

  test("non-admin member is redirected away from /admin", async ({ page }) => {
    await loginViaPasscode(page, "lecteur@repousse.local");

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/non-autorise/);
  });
});
