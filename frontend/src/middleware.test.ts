import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { middleware } from "./middleware";

function requestTo(path: string, cookie?: string) {
  const headers = cookie ? { cookie: `hanko=${cookie}` } : undefined;
  return new NextRequest(new URL(path, "http://localhost:3000"), { headers });
}

describe("middleware", () => {
  it.each(["/", "/auth/login", "/auth/register", "/api/webhooks/helloasso"])(
    "lets public path %s through without a cookie",
    (path) => {
      const response = middleware(requestTo(path));

      expect(response.headers.get("location")).toBeNull();
    },
  );

  it("redirects to /auth/login when no hanko cookie is present on a protected path", () => {
    const response = middleware(requestTo("/dashboard"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/auth/login");
  });

  it("does not treat a protected path as public just because it starts with /", () => {
    // Regression check: PUBLIC_PATHS includes "/", which used to match every
    // path via `pathname.startsWith(p)`, disabling the auth gate entirely.
    const response = middleware(requestTo("/projects"));

    expect(response.status).toBe(307);
  });

  it("lets the request through when the hanko cookie is present (fast-path only, no JWT validation here)", () => {
    const response = middleware(requestTo("/dashboard", "some-token"));

    expect(response.headers.get("location")).toBeNull();
  });
});
