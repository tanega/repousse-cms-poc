.PHONY: help setup dev stop reset migrate seed deps test create-admin

help:
	@echo "Repousse — Dev commands"
	@echo ""
	@echo "  make setup                   First-time setup (deps + DB)"
	@echo "  make dev                     Start all services (Docker)"
	@echo "  make stop                    Stop all services"
	@echo "  make reset                   Wipe DB and restart"
	@echo "  make migrate                 Run Ecto migrations"
	@echo "  make seed                    Run seeds"
	@echo "  make deps                    Fetch Elixir deps"
	@echo "  make test                    Run backend tests"
	@echo "  make create-admin EMAIL=...  Create first superadmin user"

setup: deps
	cp -n .env.example .env || true
	docker compose up -d postgres
	@echo "Waiting for postgres..."
	@until docker compose exec postgres pg_isready -U $${DB_USER:-postgres} > /dev/null 2>&1; do sleep 1; done
	cd backend && mix ecto.setup
	docker run --rm --network repousse-poc-cms_default \
		-v $(PWD)/hanko/config.yaml:/etc/hanko/config.yaml:ro \
		ghcr.io/teamhanko/hanko:latest migrate up --config /etc/hanko/config.yaml

dev:
	docker compose up --build

dev-bg:
	docker compose up --build -d

stop:
	docker compose down

reset:
	docker compose down -v
	docker compose up --build -d
	@sleep 5
	cd backend && mix ecto.setup

migrate:
	cd backend && mix ecto.migrate

seed:
	cd backend && mix run priv/repo/seeds.exs

deps:
	cd backend && mix deps.get
	cd frontend && npm install

test:
	cd backend && mix test

test-watch:
	cd backend && mix test.watch

format:
	cd backend && mix format
	cd frontend && npm run format

lint:
	cd frontend && npm run check

create-admin:
	@test -n "$(EMAIL)" || (echo "Usage: make create-admin EMAIL=user@example.com" && exit 1)
	cd backend && mix repousse.create_admin $(EMAIL)
