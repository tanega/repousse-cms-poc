defmodule Repousse.Accounts do
  import Ecto.Query
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
      nil ->
        {:ok, user} =
          %User{}
          |> User.changeset(%{email: email, hanko_id: hanko_id})
          |> Repo.insert()

        user

      user ->
        Repo.update!(User.changeset(user, %{last_seen_at: DateTime.utc_now() |> DateTime.truncate(:second)}))
    end
  end

  def create_user(attrs) do
    %User{} |> User.changeset(attrs) |> Repo.insert()
  end

  def update_user(%User{} = user, attrs) do
    user |> User.changeset(attrs) |> Repo.update()
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
        where: u.membership_year != ^year and u.status == :active
      )
      |> Repo.update_all(set: [status: :suspended])

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

  def has_role?(%User{} = user, :admin) do
    user = Repo.preload(user, :profiles)
    Enum.any?(user.profiles, &(&1.profile_type == :admin))
  end

  def has_role?(_, _), do: false

  # ── Private helpers ────────────────────────────────────────────────────────

  defp maybe_filter_status(query, nil), do: query
  defp maybe_filter_status(query, status), do: where(query, [u], u.status == ^status)

  defp maybe_filter_membership_year(query, nil), do: query
  defp maybe_filter_membership_year(query, year), do: where(query, [u], u.membership_year == ^year)
end
