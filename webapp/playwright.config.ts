import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3010",
    trace: "on-first-retry",
  },
  projects: [
    // Real passcode login for admin-page specs — see e2e/auth.setup.ts.
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    { name: "chromium", use: { ...devices["Desktop Chrome"] }, dependencies: ["setup"] },
  ],
  webServer: {
    // A dedicated built (non-HMR) server on its own port, not the shared
    // `next dev` on :3000. next dev's Fast Refresh remounts the hanko-auth
    // web component on any source file change (from this run or a concurrent
    // one) — mid passcode login that wipes its in-memory flow state, so the
    // server-side flow advances but the widget silently resets to the email
    // step. :3010 is already in hanko/config.yaml's CORS/webauthn origins.
    // next.config sets `output: "standalone"`, which `next start` doesn't
    // support (it warns and falls back to a slower, non-standalone launch)
    // — mirror the Dockerfile's own standalone launch instead.
    command:
      "npm run build && cp -r public .next/standalone/public && cp -r .next/static .next/standalone/.next/static && PORT=3010 node .next/standalone/server.js",
    url: "http://localhost:3010",
    reuseExistingServer: !process.env.CI,
    // Build time varies a lot on this shared dev machine (seen 56s–143s
    // depending on concurrent load); paid once, then reused across reruns.
    timeout: 240_000,
  },
});
