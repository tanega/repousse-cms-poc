#!/usr/bin/env bash
# Generates/updates a worktree-local .env so its docker-compose stack
# (postgres, redis, mailpit, hanko, backend, frontend) can run alongside the
# main checkout's stack without port or volume collisions.
#
# Run from the root of a worktree (not the main checkout):
#   ../../scripts/worktree-env.sh [name]
#
# `name` defaults to the current directory's basename. Ports are derived
# deterministically from `name`, so re-running is idempotent.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

name="${1:-$(basename "$PWD")}"
# +1 before scaling so the offset is never 0 (0 would collide with the main
# checkout's default ports).
offset=$(( ((16#$(echo -n "$name" | cksum | cut -d' ' -f1 | xargs printf '%x') % 19) + 1) * 10 ))

postgres_port=$((5432 + offset))
redis_port=$((6379 + offset))
mailpit_smtp_port=$((1025 + offset))
mailpit_ui_port=$((8025 + offset))
hanko_public_port=$((8000 + offset))
hanko_admin_port=$((8001 + offset))
backend_port=$((4000 + offset))
frontend_port=$((3000 + offset))

env_file=".env"
if [ ! -f "$env_file" ]; then
  echo "No .env found in $(pwd) — copying .env.example as a starting point."
  echo "Fill in SECRET_KEY_BASE and any other secrets before starting the stack."
  cp .env.example "$env_file"
fi

set_kv() {
  local key="$1" value="$2"
  if grep -q "^${key}=" "$env_file"; then
    sed -i.bak "s|^${key}=.*|${key}=${value}|" "$env_file" && rm -f "${env_file}.bak"
  else
    echo "${key}=${value}" >> "$env_file"
  fi
}

set_kv COMPOSE_PROJECT_NAME "repousse-${name}"
set_kv POSTGRES_PORT "$postgres_port"
set_kv REDIS_PORT "$redis_port"
set_kv MAILPIT_SMTP_PORT "$mailpit_smtp_port"
set_kv MAILPIT_UI_PORT "$mailpit_ui_port"
set_kv HANKO_PUBLIC_PORT "$hanko_public_port"
set_kv HANKO_ADMIN_PORT "$hanko_admin_port"
set_kv BACKEND_PORT "$backend_port"
set_kv FRONTEND_PORT "$frontend_port"
set_kv PHX_HOST "localhost"
set_kv NEXT_PUBLIC_API_URL "http://localhost:${backend_port}"
set_kv NEXT_PUBLIC_HANKO_API_URL "http://localhost:${hanko_public_port}"
set_kv CORS_ORIGIN "http://localhost:${frontend_port}"

cat <<EOF

Worktree '${name}' stack configured in ${env_file}:
  compose project : repousse-${name}
  frontend        : http://localhost:${frontend_port}
  backend api     : http://localhost:${backend_port}
  hanko           : http://localhost:${hanko_public_port}
  postgres        : localhost:${postgres_port}
  redis           : localhost:${redis_port}
  mailpit ui      : http://localhost:${mailpit_ui_port}

Start it with:
  docker compose up
EOF
