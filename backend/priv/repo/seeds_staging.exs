# Staging-only seed: creates the superadmin account, backed by a real Hanko
# identity (passcode login — no dev Mailpit here, a real email goes out via
# whatever SMTP relay is configured). Unlike `seeds.exs`, this does NOT seed
# the mock espèces végétales catalogue — staging gets real data separately.
#
# Idempotent: Hanko lookup falls back to the existing user on 409, and the DB
# upsert keys off hanko_id — safe to re-run.
#
# Local/dev (app already running, mix auto-starts it):
#     mix run priv/repo/seeds_staging.exs
#
# Staging/prod release (nothing running yet — `with_repo` below starts just
# the repo, same trick as `Repousse.Release.migrate/0`; resolved via
# `:code.priv_dir/1` since the exact release path is version-suffixed):
#     bin/repousse eval 'Code.eval_file(Path.join(:code.priv_dir(:repousse), "repo/seeds_staging.exs"))'
#
# Requires `HANKO_ADMIN_URL` to actually resolve from wherever this runs —
# see [[deployment_staging]] memory for the Coolify internal-networking
# gotcha (Application-resource container names aren't stable across
# redeploys unless a fixed Container Name is set on the resource).

alias Repousse.Accounts
alias Repousse.Auth.HankoAdmin

superadmin = %{
  email: "repousse-admin@datae.earth",
  first_name: "Super",
  last_name: "Admin"
}

{:ok, _} = Application.ensure_all_started(:req)

IO.puts("→ Seeding #{superadmin.email} (role=superadmin)...")

hanko_id =
  case HankoAdmin.create_or_find_user(superadmin.email, is_verified: true) do
    {:ok, id} -> id
    {:error, reason} -> raise "Failed to create Hanko user for #{superadmin.email}: #{reason}"
  end

Ecto.Migrator.with_repo(Repousse.Repo, fn _repo ->
  user = Accounts.find_or_create_by_hanko_id!(hanko_id, superadmin.email)

  {:ok, user} =
    Accounts.update_user(user, %{
      "first_name" => superadmin.first_name,
      "last_name" => superadmin.last_name
    })

  {:ok, user} =
    case Accounts.assign_role(user, :superadmin) do
      {:ok, user} -> {:ok, user}
      {:error, :last_superadmin} -> {:ok, user}
    end

  IO.puts("  ✓ #{superadmin.email} ready (id: #{user.id}, role: #{user.role})")
end)
