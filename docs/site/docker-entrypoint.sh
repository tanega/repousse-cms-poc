#!/bin/sh
set -e

# starlight-openapi fetches OPENAPI_SCHEMA_URL while astro.config.mjs loads
# (i.e. at `astro build` time), so the build must run here, at container
# start, once the backend is reachable over the Compose network — not during
# `docker build`, which has no access to sibling containers. Retry the build
# itself rather than pre-checking with curl: curl hardcodes any *.localhost
# host to 127.0.0.1 (RFC 6761), which defeats the Traefik network alias this
# setup relies on (see docker-compose.yml) — Node's own fetch has no such
# special-casing and resolves it correctly.
attempt=0
until npm run build; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 15 ]; then
    echo "astro build failed after ${attempt} attempts, giving up." >&2
    exit 1
  fi
  echo "Build failed (backend not ready yet?), retrying in 3s... (attempt ${attempt})"
  sleep 3
done

exec npx astro preview --host 0.0.0.0 --port 4321
