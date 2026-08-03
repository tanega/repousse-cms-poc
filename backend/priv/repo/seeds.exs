# Script for populating the database. You can run it as:
#
#     mix run priv/repo/seeds.exs
#
# Also runs automatically via `mix setup` / `mix ecto.setup`.
#
# Seeds one dev user per app role, each backed by a real Hanko identity
# (passcode login via Mailpit at http://mail.localhost). Re-runnable: Hanko
# lookup falls back to the existing user on 409, and the DB upsert keys off
# hanko_id — running this twice just refreshes the four accounts.

alias Repousse.Accounts
alias Repousse.Auth.HankoAdmin

seed_users = [
  %{
    email: "superadmin@repousse.local",
    first_name: "Super",
    last_name: "Admin",
    role: :superadmin,
    taxon_editor: false
  },
  %{
    email: "admin@repousse.local",
    first_name: "Admin",
    last_name: "Repousse",
    role: :admin,
    taxon_editor: false
  },
  %{
    email: "editeur@repousse.local",
    first_name: "Editeur",
    last_name: "Repousse",
    role: :member,
    taxon_editor: true
  },
  %{
    email: "lecteur@repousse.local",
    first_name: "Lecteur",
    last_name: "Repousse",
    role: :member,
    taxon_editor: false
  }
]

for attrs <- seed_users do
  IO.puts("→ Seeding #{attrs.email} (role=#{attrs.role}, taxon_editor=#{attrs.taxon_editor})...")

  hanko_id =
    case HankoAdmin.create_or_find_user(attrs.email, is_verified: true) do
      {:ok, id} -> id
      {:error, reason} -> raise "Failed to create Hanko user for #{attrs.email}: #{reason}"
    end

  user = Accounts.find_or_create_by_hanko_id!(hanko_id, attrs.email)

  {:ok, user} =
    Accounts.update_user(user, %{
      "first_name" => attrs.first_name,
      "last_name" => attrs.last_name
    })

  {:ok, user} =
    case Accounts.assign_role(user, attrs.role) do
      {:ok, user} -> {:ok, user}
      {:error, :last_superadmin} -> {:ok, user}
    end

  {:ok, user} = Accounts.set_taxon_editor(user, attrs.taxon_editor)

  IO.puts("  ✓ #{attrs.email} ready (id: #{user.id}, role: #{user.role})")
end

IO.puts("\nDone. Log in at http://mail.localhost (Mailpit) to fetch each passcode.\n")
