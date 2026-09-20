defmodule Repousse.Nurseries do
  @moduledoc """
  Nurseries ("Mes nurseries", epic-03 US-PROFIL-11) — the plant reserves a
  Famille d'accueil member keeps between distributions. Each nursery is a
  located place holding a list of `{taxon, quantity}` lines plus free-form
  notes.

  Visibility follows the owner's `profile_visibility`: a public profile exposes
  its nurseries to every member, a private one only to coordinators
  (`admin`/`superadmin`). See `Repousse.Nurseries.Policy`.
  """
  import Ecto.Query

  alias Repousse.Accounts
  alias Repousse.Accounts.User
  alias Repousse.Nurseries.Nursery
  alias Repousse.Repo

  @preloads [:plants]

  def list_user_nurseries(user_id) do
    from(n in Nursery,
      where: n.user_id == ^user_id and is_nil(n.archived_at),
      order_by: [asc: n.name]
    )
    |> Repo.all()
    |> Repo.preload(@preloads)
  end

  @doc """
  Nurseries of `owner` as `viewer` is allowed to see them: the full list when
  the owner's profile is public, or when the viewer is the owner or a
  coordinator; an empty list otherwise.
  """
  def list_visible_nurseries(%User{} = owner, viewer) do
    if visible_to?(owner, viewer), do: list_user_nurseries(owner.id), else: []
  end

  def visible_to?(%User{} = owner, %User{} = viewer) do
    owner.profile_visibility == :public or owner.id == viewer.id or Accounts.admin?(viewer)
  end

  @doc """
  Every non-archived nursery across all members — coordinator view. `taxon_id`
  narrows it to the nurseries declaring stock for that taxon ("who has
  Quercus robur available?").
  """
  def list_all_nurseries(opts \\ []) do
    query = from(n in Nursery, where: is_nil(n.archived_at), order_by: [asc: n.name])

    query =
      case Keyword.get(opts, :taxon_id) do
        nil ->
          query

        taxon_id ->
          from n in query,
            join: p in assoc(n, :plants),
            on: p.taxon_id == ^taxon_id,
            distinct: true
      end

    query |> Repo.all() |> Repo.preload(@preloads)
  end

  @doc """
  Non-archived nurseries with coordinates, for the map layer. Restricted to
  public profiles unless the viewer is a coordinator.
  """
  def list_map_nurseries(%User{} = viewer) do
    query =
      from n in Nursery,
        join: u in assoc(n, :user),
        where: is_nil(n.archived_at) and not is_nil(n.lat) and not is_nil(n.lng),
        select: %{
          id: n.id,
          name: n.name,
          address: n.address,
          lat: n.lat,
          lng: n.lng,
          user_id: n.user_id,
          owner_first_name: u.first_name,
          owner_last_name: u.last_name
        }

    query =
      if Accounts.admin?(viewer),
        do: query,
        else: from([n, u] in query, where: u.profile_visibility == :public)

    Repo.all(query)
  end

  def get_nursery(id) do
    case Repo.get(Nursery, id) do
      nil -> nil
      nursery -> Repo.preload(nursery, @preloads)
    end
  end

  def get_nursery!(id), do: Repo.get!(Nursery, id) |> Repo.preload(@preloads)

  @doc """
  Creates a nursery for `user`. Refuses unless the `host_family` profile is
  active — nurseries are the Famille d'accueil profile's resource, and letting
  them exist without it would strand them on profile removal.
  """
  def create_nursery(%User{} = user, attrs) do
    if Accounts.get_profile(user.id, :host_family) do
      %Nursery{}
      |> Nursery.changeset(Map.put(stringify(attrs), "user_id", user.id))
      |> Repo.insert()
      |> preload_result()
    else
      {:error, :host_family_profile_required}
    end
  end

  def update_nursery(%Nursery{} = nursery, attrs) do
    nursery
    |> Repo.preload(@preloads)
    |> Nursery.changeset(stringify(attrs))
    |> Repo.update()
    |> preload_result()
  end

  def archive_nursery(%Nursery{} = nursery) do
    nursery |> Nursery.archive_changeset() |> Repo.update() |> preload_result()
  end

  def count_active_nurseries(user_id) do
    Repo.aggregate(from(n in Nursery, where: n.user_id == ^user_id and is_nil(n.archived_at)), :count)
  end

  defp preload_result({:ok, nursery}), do: {:ok, Repo.preload(nursery, @preloads, force: true)}
  defp preload_result(error), do: error

  # Controllers hand us string-keyed params; tests and seeds use atoms. The
  # `user_id` merge below has to agree with whichever the caller used.
  defp stringify(attrs) do
    Map.new(attrs, fn {k, v} -> {to_string(k), v} end)
  end
end
