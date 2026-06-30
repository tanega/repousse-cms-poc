defmodule Repousse.Repo do
  use Ecto.Repo,
    otp_app: :repousse,
    adapter: Ecto.Adapters.Postgres
end
