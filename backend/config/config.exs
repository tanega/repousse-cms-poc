# This file is responsible for configuring your application
# and its dependencies with the aid of the Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.

# General application configuration
import Config

config :repousse,
  ecto_repos: [Repousse.Repo],
  generators: [timestamp_type: :utc_datetime, binary_id: true]

config :repousse, :hanko,
  api_url: System.get_env("HANKO_API_URL", "http://localhost:8000"),
  admin_url: System.get_env("HANKO_ADMIN_URL", "http://localhost:8001"),
  jwks_url: System.get_env("HANKO_API_URL", "http://localhost:8000") <> "/.well-known/jwks.json"

config :repousse, Oban,
  repo: Repousse.Repo,
  plugins: [Oban.Plugins.Pruner],
  queues: [default: 10, helloasso: 2, email: 5]

config :cors_plug, CORSPlug,
  origin: ["http://localhost:3000"],
  max_age: 86400,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  headers: ["Authorization", "Content-Type", "Accept"]

# Configure the endpoint
config :repousse, RepousseWeb.Endpoint,
  url: [host: "localhost"],
  adapter: Bandit.PhoenixAdapter,
  render_errors: [
    formats: [json: RepousseWeb.ErrorJSON],
    layout: false
  ],
  pubsub_server: Repousse.PubSub,
  live_view: [signing_salt: "aNgOBwAV"]

# Configure the mailer
#
# By default it uses the "Local" adapter which stores the emails
# locally. You can see the emails in your browser, at "/dev/mailbox".
#
# For production it's recommended to configure a different adapter
# at the `config/runtime.exs`.
config :repousse, Repousse.Mailer, adapter: Swoosh.Adapters.Local

# Configure Elixir's Logger
config :logger, :default_formatter,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{config_env()}.exs"
