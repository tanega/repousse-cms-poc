defmodule Repousse.Accounts do
  import Ecto.Query
  alias Repousse.Auth.HankoAdmin
  alias Repousse.Integrations.Emails
  alias Repousse.Repo
  alias Repousse.Accounts.{User, UserProfile, RoleAuditLog}

  # ── User queries ──────────────────────────────────────────────────────────

  def get_user(id), do: Repo.get(User, id)
  def get_user!(id), do: Repo.get!(User, id)
  def get_user_by_email(email), do: Repo.get_by(User, email: email)
  def get_user_by_hanko_id(hanko_id), do: Repo.get_by(User, hanko_id: hanko_id)

  def list_users(opts \\ []) do
    User
    |> maybe_filter_status(opts[:status])
    |> maybe_filter_membership_year(opts[:year])
    |> Repo.all()
  end

  def find_or_create_by_hanko_id!(hanko_id, email) do
    case get_user_by_hanko_id(hanko_id) do
      nil ->
        {:ok, user} =
          %User{}
          |> User.changeset(%{email: email, hanko_id: hanko_id})
          |> Repo.insert()

        user

      user ->
        Repo.update!(
          User.changeset(user, %{last_seen_at: DateTime.utc_now() |> DateTime.truncate(:second)})
        )
    end
  end

  def create_user(attrs) do
    %User{} |> User.changeset(attrs) |> Repo.insert()
  end

  def update_user(%User{} = user, attrs) do
    user |> User.changeset(attrs) |> Repo.update()
  end

  def delete_user(%User{} = user) do
    if user.hanko_id, do: HankoAdmin.delete_user(user.hanko_id)
    Repo.delete(user)
  end

  @doc """
  Creates a user backed by a Hanko identity: finds/creates the Hanko user
  first, then upserts the Postgres row with the resulting `hanko_id`. Used
  both by admin-created accounts and by the public guest signup flow.
  """
  def create_user_with_hanko(attrs, opts \\ []) do
    email = attrs["email"] || attrs[:email]

    with {:ok, hanko_id} <- hanko_admin().create_or_find_user(email, opts),
         {:ok, user} <- create_user(Map.put(attrs, "hanko_id", hanko_id)) do
      {:ok, user}
    end
  end

  # Indirection seam so tests can swap in a fake Hanko admin client (avoids
  # real HTTP calls to the Hanko admin API from unit/controller tests) via
  # `Application.put_env(:repousse, :hanko_admin_module, MyFake)`. Defaults to
  # the real `Repousse.Auth.HankoAdmin` client everywhere else.
  defp hanko_admin, do: Application.get_env(:repousse, :hanko_admin_module, HankoAdmin)

  @doc """
  Guest signup entry point (public distribution form): if the email is
  already tied to an account, returns `{:existing, user}` so the caller can
  offer to log in instead of creating a duplicate. Otherwise creates the
  account (Postgres + Hanko) and sends the confirmation email.
  """
  def find_or_create_guest_by_email(email, attrs \\ %{}) do
    case get_user_by_email(email) do
      nil ->
        with {:ok, user} <-
               create_user_with_hanko(Map.put(attrs, "email", email), is_verified: false) do
          Emails.send_activation_email(user)
          {:created, user}
        end

      user ->
        {:existing, user}
    end
  end

  # ── Membership & suspension ────────────────────────────────────────────────

  def sync_member(attrs) do
    case get_user_by_email(attrs.email) do
      nil ->
        case %User{} |> User.sync_changeset(attrs) |> Repo.insert() do
          {:ok, user} -> {:ok, :created, user}
          error -> error
        end

      user ->
        case user |> User.sync_changeset(attrs) |> Repo.update() do
          {:ok, user} -> {:ok, :updated, user}
          error -> error
        end
    end
  end

  def suspend_members_without_current_year_membership(year) do
    {count, _} =
      from(u in User,
        where: u.membership_year != ^year and u.adhesion_active == true
      )
      |> Repo.update_all(set: [adhesion_active: false])

    count
  end

  def suspend_user(%User{} = user), do: user |> User.suspension_changeset(true) |> Repo.update()
  def activate_user(%User{} = user), do: user |> User.suspension_changeset(false) |> Repo.update()

  # ── Profiles ──────────────────────────────────────────────────────────────

  def list_profiles(%User{} = user), do: Repo.preload(user, :profiles).profiles

  def get_profile(user_id, profile_type) do
    Repo.get_by(UserProfile, user_id: user_id, profile_type: profile_type)
  end

  def add_profile(%User{} = user, profile_type) do
    %UserProfile{}
    |> UserProfile.changeset(%{user_id: user.id, profile_type: profile_type})
    |> Repo.insert()
  end

  def remove_profile(%User{} = user, profile_type) do
    case get_profile(user.id, profile_type) do
      nil -> {:error, :not_found}
      profile -> Repo.delete(profile)
    end
  end

  def update_profile(%UserProfile{} = profile, attrs) do
    profile |> UserProfile.changeset(attrs) |> Repo.update()
  end

  @doc """
  Self-service / admin profile selection (epic-02 US-AUTH-09, epic-03
  US-PROFIL-04): replaces the user's active profile set with `profile_types`
  (a list of atoms or strings). Enforces the 3-value self-selectable list
  (`volunteer`/`adoptant`/`host_family` — `UserProfile.profile_types/0`; the
  `Administrateur` persona is the platform `role`, never a self-selectable
  profile) and that at least one profile remains.
  """
  def set_profiles(%User{} = user, profile_types) when is_list(profile_types) do
    case parse_profile_types(profile_types) do
      :error ->
        {:error, :invalid_profile_type}

      {:ok, []} ->
        {:error, :at_least_one_profile_required}

      {:ok, types} ->
        Ecto.Multi.new()
        |> Ecto.Multi.delete_all(:removed, from(p in UserProfile, where: p.user_id == ^user.id))
        |> Ecto.Multi.run(:inserted, fn repo, _changes -> insert_profiles(repo, user, types) end)
        |> Repo.transaction()
        |> case do
          {:ok, %{inserted: profiles}} -> {:ok, Enum.reverse(profiles)}
          {:error, :inserted, changeset, _changes} -> {:error, changeset}
        end
    end
  end

  def has_role?(%User{role: role}, :superadmin), do: role == :superadmin
  def has_role?(%User{role: role}, :admin), do: role in [:admin, :superadmin]
  def has_role?(_, _), do: false

  def admin?(%User{} = user), do: has_role?(user, :admin)
  def superadmin?(%User{} = user), do: has_role?(user, :superadmin)

  def count_superadmins, do: Repo.aggregate(from(u in User, where: u.role == :superadmin), :count)

  @doc """
  Parses a role given as an atom or string against `User.roles/0`. Used to
  validate role params coming in from controllers before they ever reach
  `assign_role/3` or `Accounts.Policy`.
  """
  def parse_role(role) when is_atom(role) do
    if role in User.roles(), do: {:ok, role}, else: :error
  end

  def parse_role(role) when is_binary(role) do
    case Enum.find(User.roles(), &(Atom.to_string(&1) == role)) do
      nil -> :error
      role -> {:ok, role}
    end
  end

  def parse_role(_role), do: :error

  @doc """
  Superadmin-only role grant/revoke. Refuses to demote the last remaining
  superadmin (epic-02 US-AUTH-11: "un superadmin ne peut pas se révoquer
  lui-même" / at least one superadmin must remain active).

  Every grant/revocation is written to `RoleAuditLog` in the same transaction
  as the role change (US-AUTH-11: "Historique des attributions/révocations
  tracé"). `granted_by_id` is the id of the superadmin performing the change
  (or `nil`, e.g. for system/seed-driven role changes).
  """
  def assign_role(%User{} = user, role, granted_by_id \\ nil)
      when role in [:member, :admin, :superadmin] do
    if user.role == :superadmin and role != :superadmin and count_superadmins() <= 1 do
      {:error, :last_superadmin}
    else
      previous_role = user.role

      Ecto.Multi.new()
      |> Ecto.Multi.update(:user, User.role_changeset(user, role))
      |> Ecto.Multi.insert(:audit_log, fn %{user: updated} ->
        RoleAuditLog.changeset(%RoleAuditLog{}, %{
          user_id: updated.id,
          granted_by_id: granted_by_id,
          previous_role: previous_role,
          new_role: role
        })
      end)
      |> Repo.transaction()
      |> case do
        {:ok, %{user: updated}} -> {:ok, updated}
        {:error, :user, changeset, _changes} -> {:error, changeset}
        {:error, :audit_log, changeset, _changes} -> {:error, changeset}
      end
    end
  end

  @doc "Role grant/revocation history for a user, most recent first."
  def list_role_audit_logs(user_id) do
    from(l in RoleAuditLog, where: l.user_id == ^user_id, order_by: [desc: l.inserted_at])
    |> Repo.all()
  end

  def set_taxon_editor(%User{} = user, taxon_editor?) when is_boolean(taxon_editor?) do
    user |> User.taxon_editor_changeset(taxon_editor?) |> Repo.update()
  end

  @doc """
  Bumps `activation_sent_count` (epic-02 US-AUTH-06: "Nombre de relances
  envoyées tracé"). Uses a bare `Ecto.Changeset.change/2` rather than
  `User.changeset/2` since the generic changeset deliberately doesn't cast
  this field.
  """
  def increment_activation_reminder_count(%User{} = user) do
    user
    |> Ecto.Changeset.change(activation_sent_count: user.activation_sent_count + 1)
    |> Repo.update()
  end

  # ── Private helpers ────────────────────────────────────────────────────────

  defp maybe_filter_status(query, nil), do: query
  defp maybe_filter_status(query, status), do: where(query, [u], u.status == ^status)

  defp maybe_filter_membership_year(query, nil), do: query

  defp maybe_filter_membership_year(query, year),
    do: where(query, [u], u.membership_year == ^year)

  defp parse_profile_types(profile_types) do
    profile_types
    |> Enum.reduce_while({:ok, []}, fn type, {:ok, acc} ->
      case parse_profile_type(type) do
        {:ok, atom} -> {:cont, {:ok, [atom | acc]}}
        :error -> {:halt, :error}
      end
    end)
    |> case do
      {:ok, acc} -> {:ok, acc |> Enum.reverse() |> Enum.uniq()}
      :error -> :error
    end
  end

  defp parse_profile_type(type) when is_atom(type) do
    if type in UserProfile.profile_types(), do: {:ok, type}, else: :error
  end

  defp parse_profile_type(type) when is_binary(type) do
    case Enum.find(UserProfile.profile_types(), &(Atom.to_string(&1) == type)) do
      nil -> :error
      atom -> {:ok, atom}
    end
  end

  defp parse_profile_type(_type), do: :error

  defp insert_profiles(repo, %User{} = user, types) do
    Enum.reduce_while(types, {:ok, []}, fn type, {:ok, acc} ->
      %UserProfile{}
      |> UserProfile.changeset(%{user_id: user.id, profile_type: type})
      |> repo.insert()
      |> case do
        {:ok, profile} -> {:cont, {:ok, [profile | acc]}}
        {:error, changeset} -> {:halt, {:error, changeset}}
      end
    end)
  end
end
