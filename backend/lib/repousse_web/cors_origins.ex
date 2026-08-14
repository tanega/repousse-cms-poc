defmodule RepousseWeb.CorsOrigins do
  @moduledoc """
  `CORSPlug.init/1` runs once at router *compile* time — it bakes whatever
  `Application.get_all_env(:cors_plug)` returns at that moment into the
  compiled pipeline, so config set from `config/runtime.exs` (which only
  runs at *boot*, after compilation) never actually reaches it. Passing a
  captured function as the `:origin` option defers evaluation to request
  time instead: the function reference is itself compile-time-safe, but
  its body re-reads the application env on every call.
  """

  def list, do: Application.get_env(:repousse, :cors_allowed_origins, [])
end
