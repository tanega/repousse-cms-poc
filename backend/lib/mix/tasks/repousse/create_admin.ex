defmodule Mix.Tasks.Repousse.CreateAdmin do
  use Mix.Task

  @shortdoc "Creates a superadmin user in Hanko and Repousse DB"

  @moduledoc """
  Creates a superadmin user.

      mix repousse.create_admin user@example.com

  Steps:
    1. Creates (or looks up) the user in Hanko via Admin API (:8001)
    2. Upserts the user in the Repousse DB
    3. Assigns the :superadmin role

  Environment variables:
    HANKO_ADMIN_URL  — defaults to http://localhost:8001
    DATABASE_URL     — used in prod; falls back to dev.exs config
  """

  @requirements ["app.start"]

  def run([email]) do
    IO.puts("\n→ Creating Hanko user for #{email}...")

    hanko_id =
      case Repousse.Auth.HankoAdmin.create_or_find_user(email, is_verified: true) do
        {:ok, id} ->
          IO.puts("  ✓ Hanko user ready (id: #{id})")
          id

        {:error, reason} ->
          Mix.raise("Failed to create Hanko user: #{reason}")
      end

    IO.puts("→ Upserting user in Repousse DB...")
    user = Repousse.Accounts.find_or_create_by_hanko_id!(hanko_id, email)
    IO.puts("  ✓ User in DB (id: #{user.id})")

    IO.puts("→ Assigning superadmin role...")

    if user.role == :superadmin do
      IO.puts("  ℹ Already superadmin")
    else
      case Repousse.Accounts.assign_role(user, :superadmin) do
        {:ok, _} -> IO.puts("  ✓ Superadmin role assigned")
        {:error, reason} -> Mix.raise("Failed to assign superadmin role: #{inspect(reason)}")
      end
    end

    IO.puts("\nDone. #{email} is now a superadmin.\n")
  end

  def run(_) do
    Mix.raise("Usage: mix repousse.create_admin <email>")
  end
end
