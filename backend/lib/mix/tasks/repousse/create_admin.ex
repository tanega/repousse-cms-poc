defmodule Mix.Tasks.Repousse.CreateAdmin do
  use Mix.Task

  @shortdoc "Creates a superadmin user in Hanko and Repousse DB"

  @moduledoc """
  Creates a superadmin user.

      mix repousse.create_admin user@example.com

  Steps:
    1. Creates (or looks up) the user in Hanko via Admin API (:8001)
    2. Upserts the user in the Repousse DB
    3. Assigns the :admin profile type

  Environment variables:
    HANKO_ADMIN_URL  — defaults to http://localhost:8001
    DATABASE_URL     — used in prod; falls back to dev.exs config
  """

  @requirements ["app.start"]

  def run([email]) do
    hanko_admin_url = System.get_env("HANKO_ADMIN_URL", "http://localhost:8001")

    IO.puts("\n→ Creating Hanko user for #{email}...")

    hanko_id =
      case create_hanko_user(hanko_admin_url, email) do
        {:ok, id} ->
          IO.puts("  ✓ Hanko user created (id: #{id})")
          id

        {:exists, id} ->
          IO.puts("  ℹ Hanko user already exists (id: #{id})")
          id

        {:error, reason} ->
          Mix.raise("Failed to create Hanko user: #{reason}")
      end

    IO.puts("→ Upserting user in Repousse DB...")
    user = Repousse.Accounts.find_or_create_by_hanko_id!(hanko_id, email)
    IO.puts("  ✓ User in DB (id: #{user.id})")

    IO.puts("→ Adding admin profile...")

    case Repousse.Accounts.get_profile(user.id, :admin) do
      nil ->
        case Repousse.Accounts.add_profile(user, :admin) do
          {:ok, _} -> IO.puts("  ✓ Admin profile assigned")
          {:error, cs} -> Mix.raise("Failed to assign admin profile: #{inspect(cs.errors)}")
        end

      _existing ->
        IO.puts("  ℹ Admin profile already exists")
    end

    IO.puts("\nDone. #{email} is now a superadmin.\n")
  end

  def run(_) do
    Mix.raise("Usage: mix repousse.create_admin <email>")
  end

  defp create_hanko_user(base_url, email) do
    payload = %{
      emails: [%{address: email, is_primary: true, is_verified: true}]
    }

    case Req.post("#{base_url}/users", json: payload) do
      {:ok, %{status: status, body: body}} when status in [200, 201] ->
        {:ok, body["id"]}

      {:ok, %{status: 409}} ->
        case find_hanko_user_by_email(base_url, email) do
          {:ok, id} -> {:exists, id}
          error -> error
        end

      {:ok, %{status: status, body: body}} ->
        {:error, "HTTP #{status}: #{inspect(body)}"}

      {:error, %{reason: reason}} ->
        {:error, "Connection error — is Hanko running at #{base_url}? (#{inspect(reason)})"}
    end
  end

  defp find_hanko_user_by_email(base_url, email) do
    case Req.get("#{base_url}/users", params: [email: email, page_size: 1]) do
      {:ok, %{status: 200, body: [%{"id" => id} | _]}} ->
        {:ok, id}

      {:ok, %{status: 200, body: %{"id" => id}}} ->
        {:ok, id}

      {:ok, %{status: 200, body: body}} ->
        {:error, "User not found after 409: #{inspect(body)}"}

      {:ok, %{status: status, body: body}} ->
        {:error, "Lookup failed HTTP #{status}: #{inspect(body)}"}

      {:error, reason} ->
        {:error, inspect(reason)}
    end
  end
end
