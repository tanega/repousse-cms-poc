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

  @preloads [plants: :taxon_request]

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
    if visible_to?(owner, viewer) do
      nurseries = list_user_nurseries(owner.id)
      if owner.id == viewer.id or Accounts.admin?(viewer), do: nurseries, else: Enum.map(nurseries, &without_pending_plants/1)
    else
      []
    end
  end

  # Plants still waiting on a taxon request aren't part of the reference list
  # yet: only their owner and coordinators get to see them.
  defp without_pending_plants(%Nursery{} = nursery) do
    %{nursery | plants: Enum.reject(nursery.plants, &is_nil(&1.taxon_id))}
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
  Contact details of the given nursery owners, keyed by user id — the
  coordinator view (epic-03 US-PROFIL-15/16) shows who to call for a given
  stock. `phone` comes from the owner's Famille d'accueil profile.
  """
  def owner_contacts(user_ids) do
    from(u in User,
      left_join: p in Accounts.UserProfile,
      on: p.user_id == u.id and p.profile_type == :host_family,
      where: u.id in ^Enum.uniq(user_ids),
      select:
        {u.id,
         %{
           id: u.id,
           first_name: u.first_name,
           last_name: u.last_name,
           email: u.email,
           phone: p.hosting_phone
         }}
    )
    |> Repo.all()
    |> Map.new()
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
    attrs = stringify(attrs)

    cond do
      is_nil(Accounts.get_active_profile(user.id, :host_family)) ->
        {:error, :host_family_profile_required}

      not pending_requests_only?(attrs) ->
        {:error, :taxon_request_not_pending}

      true ->
        %Nursery{}
        |> Nursery.changeset(Map.put(attrs, "user_id", user.id))
        |> Repo.insert()
        |> preload_result()
    end
  end

  def update_nursery(%Nursery{} = nursery, attrs) do
    attrs = stringify(attrs)

    if pending_requests_only?(attrs) do
      nursery
      |> Repo.preload(@preloads)
      |> Nursery.changeset(attrs)
      |> Repo.update()
      |> preload_result()
    else
      {:error, :taxon_request_not_pending}
    end
  end

  # A plant line may wait on a taxon request (`taxon_request_id`), but only
  # while that request is still open — once decided, its lines were already
  # attached or removed, and a new one would never be resolved.
  defp pending_requests_only?(attrs) do
    ids =
      attrs
      |> Map.get("plants", [])
      |> List.wrap()
      |> Enum.map(&(&1["taxon_request_id"] || &1[:taxon_request_id]))
      |> Enum.reject(&is_nil/1)

    ids == [] or
      Repo.aggregate(
        from(r in Repousse.Taxa.TaxonRequest, where: r.id in ^ids and r.status == :pending),
        :count
      ) == length(Enum.uniq(ids))
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
