defmodule Repousse.Accounts do
  import Ecto.Query
  alias Repousse.Auth.HankoAdmin
  alias Repousse.Integrations.Emails
  alias Repousse.Repo
  alias Repousse.Accounts.{User, UserProfile}

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
      nil -> claim_or_create_by_email!(hanko_id, email)
      user -> touch_last_seen!(user)
    end
  end

  # A ghost user (imported with no hanko_id) claims their real identity the
  # first time they log in: without this, inserting a fresh row here would
  # hit the email unique_constraint and crash on every request from them.
  defp claim_or_create_by_email!(hanko_id, email) do
    case get_user_by_email(email) do
      nil ->
        {:ok, user} =
          %User{}
          |> User.changeset(%{email: email, hanko_id: hanko_id})
          |> Repo.insert()

        user

      %User{hanko_id: nil} = ghost ->
        {:ok, user} = ghost |> User.changeset(%{hanko_id: hanko_id}) |> Repo.update()
        touch_last_seen!(user)

      %User{} = user ->
        raise "email #{email} already linked to a different hanko_id (existing=#{user.hanko_id}, incoming=#{hanko_id})"
    end
  end

  defp touch_last_seen!(user) do
    Repo.update!(
      User.changeset(user, %{last_seen_at: DateTime.utc_now() |> DateTime.truncate(:second)})
    )
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

    with {:ok, hanko_id} <- HankoAdmin.create_or_find_user(email, opts),
         {:ok, user} <- create_user(Map.put(attrs, "hanko_id", hanko_id)) do
      {:ok, user}
    end
  end

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

  def has_role?(%User{role: role}, :superadmin), do: role == :superadmin
  def has_role?(%User{role: role}, :admin), do: role in [:admin, :superadmin]
  def has_role?(_, _), do: false

  def admin?(%User{} = user), do: has_role?(user, :admin)
  def superadmin?(%User{} = user), do: has_role?(user, :superadmin)

  def count_superadmins, do: Repo.aggregate(from(u in User, where: u.role == :superadmin), :count)

  @doc """
  Superadmin-only role grant/revoke. Refuses to demote the last remaining
  superadmin (epic-02 US-AUTH-11: "un superadmin ne peut pas se révoquer
  lui-même" / at least one superadmin must remain active).
  """
  def assign_role(%User{} = user, role) when role in [:member, :admin, :superadmin] do
    if user.role == :superadmin and role != :superadmin and count_superadmins() <= 1 do
      {:error, :last_superadmin}
    else
      user |> User.role_changeset(role) |> Repo.update()
    end
  end

  def set_taxon_editor(%User{} = user, taxon_editor?) when is_boolean(taxon_editor?) do
    user |> User.taxon_editor_changeset(taxon_editor?) |> Repo.update()
  end

  # ── Private helpers ────────────────────────────────────────────────────────

  defp maybe_filter_status(query, nil), do: query
  defp maybe_filter_status(query, status), do: where(query, [u], u.status == ^status)

  defp maybe_filter_membership_year(query, nil), do: query

  defp maybe_filter_membership_year(query, year),
    do: where(query, [u], u.membership_year == ^year)
end
