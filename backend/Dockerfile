FROM elixir:1.17-otp-27-alpine AS build

RUN apk add --no-cache build-base git

WORKDIR /app

ENV MIX_ENV=prod

RUN mix local.hex --force && mix local.rebar --force

COPY mix.exs mix.lock ./
RUN mix deps.get --only prod
RUN mix deps.compile

COPY config/config.exs config/prod.exs config/runtime.exs config/

COPY lib/ lib/
COPY priv/ priv/

RUN mix compile
RUN mix release

# ── Runtime image ──────────────────────────────────────────────────────────
FROM alpine:3.22 AS runtime

RUN apk add --no-cache openssl libstdc++ ncurses curl

WORKDIR /app

COPY --from=build /app/_build/prod/rel/repousse ./
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENV PHX_HOST=localhost
ENV PORT=4000
ENV MIX_ENV=prod

EXPOSE 4000

ENTRYPOINT ["/docker-entrypoint.sh"]
