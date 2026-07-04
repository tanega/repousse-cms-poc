import Config

# config/runtime.exs is executed for all environments, including
# during releases. It is executed after compilation and before the
# system starts, so it is typically used to load production configuration
# and secrets from environment variables or elsewhere. Do not define
# any compile-time configuration in here, as it won't be applied.
# The block below contains prod specific runtime configuration.

# ## Using releases
#
# If you use `mix release`, you need to explicitly enable the server
# by passing the PHX_SERVER=true when you start it:
#
#     PHX_SERVER=true bin/repousse start
#
# Alternatively, you can use `mix phx.gen.release` to generate a `bin/server`
# script that automatically sets the env var above.
if System.get_env("PHX_SERVER") do
  config :repousse, RepousseWeb.Endpoint, server: true
end

config :repousse, RepousseWeb.Endpoint,
  http: [port: String.to_integer(System.get_env("PORT", "4000"))]

hanko_api_url = System.get_env("HANKO_API_URL", "http://auth.localhost")

config :repousse, :hanko,
  api_url: hanko_api_url,
  admin_url: System.get_env("HANKO_ADMIN_URL", "http://localhost:8001"),
  jwks_url: hanko_api_url <> "/.well-known/jwks.json"

# CORS_ORIGIN is already passed to the backend container in docker-compose
# but was never actually read anywhere — comma-separate multiple origins
# (e.g. the webapp reached via Traefik's www.localhost alongside its native
# `npm run dev` port and its docker-compose direct-access port).
if cors_origin = System.get_env("CORS_ORIGIN") do
  config :cors_plug, origin: String.split(cors_origin, ",", trim: true)
end

# Gated on MAILPIT_SMTP_HOST rather than `config_env() == :dev`: the
# docker-compose stack builds the backend with MIX_ENV=prod even for local
# dev (see Dockerfile), so `config_env()` is never `:dev` there — but
# MAILPIT_SMTP_HOST is only ever set for this local/dev stack, never in a
# real production deployment.
if mailpit_host = System.get_env("MAILPIT_SMTP_HOST") do
  config :repousse, Repousse.Mailer,
    adapter: Swoosh.Adapters.SMTP,
    relay: mailpit_host,
    port: String.to_integer(System.get_env("MAILPIT_SMTP_PORT", "1025")),
    ssl: false,
    tls: :never,
    auth: :never,
    retries: 1,
    no_mx_lookups: true
end

config :repousse, :webapp_url, System.get_env("WEBAPP_URL", "http://www.localhost")

if config_env() == :prod do
  database_url =
    System.get_env("DATABASE_URL") ||
      raise """
      environment variable DATABASE_URL is missing.
      For example: ecto://USER:PASS@HOST/DATABASE
      """

  maybe_ipv6 = if System.get_env("ECTO_IPV6") in ~w(true 1), do: [:inet6], else: []

  config :repousse, Repousse.Repo,
    # ssl: true,
    url: database_url,
    pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10"),
    # For machines with several cores, consider starting multiple pools of `pool_size`
    # pool_count: 4,
    socket_options: maybe_ipv6

  # The secret key base is used to sign/encrypt cookies and other secrets.
  # A default value is used in config/dev.exs and config/test.exs but you
  # want to use a different value for prod and you most likely don't want
  # to check this value into version control, so we use an environment
  # variable instead.
  secret_key_base =
    System.get_env("SECRET_KEY_BASE") ||
      raise """
      environment variable SECRET_KEY_BASE is missing.
      You can generate one by calling: mix phx.gen.secret
      """

  host = System.get_env("PHX_HOST") || "example.com"

  config :repousse, :dns_cluster_query, System.get_env("DNS_CLUSTER_QUERY")

  config :repousse, RepousseWeb.Endpoint,
    url: [host: host, port: 443, scheme: "https"],
    http: [
      # Enable IPv6 and bind on all interfaces.
      # Set it to  {0, 0, 0, 0, 0, 0, 0, 1} for local network only access.
      # See the documentation on https://bandit.hexdocs.pm/Bandit.html#t:options/0
      # for details about using IPv6 vs IPv4 and loopback vs public addresses.
      ip: {0, 0, 0, 0, 0, 0, 0, 0}
    ],
    secret_key_base: secret_key_base

  # ## SSL Support
  #
  # To get SSL working, you will need to add the `https` key
  # to your endpoint configuration:
  #
  #     config :repousse, RepousseWeb.Endpoint,
  #       https: [
  #         ...,
  #         port: 443,
  #         cipher_suite: :strong,
  #         keyfile: System.get_env("SOME_APP_SSL_KEY_PATH"),
  #         certfile: System.get_env("SOME_APP_SSL_CERT_PATH")
  #       ]
  #
  # The `cipher_suite` is set to `:strong` to support only the
  # latest and more secure SSL ciphers. This means old browsers
  # and clients may not be supported. You can set it to
  # `:compatible` for wider support.
  #
  # `:keyfile` and `:certfile` expect an absolute path to the key
  # and cert in disk or a relative path inside priv, for example
  # "priv/ssl/server.key". For all supported SSL configuration
  # options, see https://plug.hexdocs.pm/Plug.SSL.html#configure/1
  #
  # We also recommend setting `force_ssl` in your config/prod.exs,
  # ensuring no data is ever sent via http, always redirecting to https:
  #
  #     config :repousse, RepousseWeb.Endpoint,
  #       force_ssl: [hsts: true]
  #
  # Check `Plug.SSL` for all available options in `force_ssl`.

  # ## Configuring the mailer
  #
  # In production you need to configure the mailer to use a different adapter.
  # Here is an example configuration for Mailgun:
  #
  #     config :repousse, Repousse.Mailer,
  #       adapter: Swoosh.Adapters.Mailgun,
  #       api_key: System.get_env("MAILGUN_API_KEY"),
  #       domain: System.get_env("MAILGUN_DOMAIN")
  #
  # Most non-SMTP adapters require an API client. Swoosh supports Req, Hackney,
  # and Finch out-of-the-box. This configuration is typically done at
  # compile-time in your config/prod.exs:
  #
  #     config :swoosh, :api_client, Swoosh.ApiClient.Req
  #
  # See https://swoosh.hexdocs.pm/Swoosh.html#module-installation for details.
end
