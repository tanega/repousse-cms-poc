defmodule Repousse.Taxa.Requests do
  @moduledoc """
  Members can ask for a plant that is missing from the reference list. The
  request waits for a taxon manager (admin, superadmin or `taxon_editor`):

    * approve — creates the taxon (or links an existing one), attaches every
      pending nursery line to it, and notifies the people who asked;
    * reject — drops the pending nursery lines and notifies them with the reason.

  Two members asking for the same name share one open request (matched on the
  trimmed, case-insensitive names), so managers decide once and everyone who
  asked is notified.
  """
  import Ecto.Query

  alias Ecto.Multi
  alias Repousse.Accounts.User
  alias Repousse.Notifications
  alias Repousse.Nurseries.NurseryPlant
  alias Repousse.Repo
  alias Repousse.Taxa
  alias Repousse.Taxa.{Taxon, TaxonRequest}

  def list_mine(%User{id: user_id}) do
    from(r in TaxonRequest, where: r.requested_by_id == ^user_id, order_by: [desc: r.inserted_at])
    |> Repo.all()
  end

  @doc "Requests for managers. `status` defaults to `:pending`, oldest first."
  def list(status \\ :pending) do
    order = if status == :pending, do: [asc: :inserted_at], else: [desc: :decided_at]

    from(r in TaxonRequest, where: r.status == ^status, order_by: ^order, preload: [:requested_by, :category])
    |> Repo.all()
  end

  def count_pending, do: Repo.aggregate(from(r in TaxonRequest, where: r.status == :pending), :count)

  def get(id), do: Repo.get(TaxonRequest, id) |> Repo.preload([:requested_by, :category])

  @doc """
  Files a request. Returns `{:ok, request}`; when an open request already
  exists for the same name it is returned instead of creating a duplicate.
  """
  def create(%User{} = user, attrs) do
    attrs = Map.new(attrs, fn {k, v} -> {to_string(k), v} end) |> Map.put("requested_by_id", user.id)
    changeset = TaxonRequest.create_changeset(%TaxonRequest{}, attrs)

    with true <- changeset.valid?,
         nil <- find_open_duplicate(changeset) do
      with {:ok, request} <- Repo.insert(changeset) do
        Notifications.notify_taxon_managers(
          %{
            type: "taxon_request.created",
            title: "Nouvelle demande d'ajout de plante",
            body: "#{display_name(user)} demande l'ajout de « #{label(request)} ».",
            link: "/admin/especes-vegetales?tab=demandes",
            payload: %{taxon_request_id: request.id}
          },
          except: [user.id]
        )

        {:ok, request}
      end
    else
      false -> {:error, changeset}
      %TaxonRequest{} = existing -> {:ok, existing}
    end
  end

  @doc """
  Approves `request`. `opts` takes either `taxon: attrs` (create the taxon) or
  `taxon_id: id` (it already exists, e.g. under another spelling).
  """
  def approve(%TaxonRequest{status: :pending} = request, %User{} = manager, opts) do
    asker_ids = asker_ids(request)

    Multi.new()
    |> Multi.run(:taxon, fn _repo, _ -> resolve_taxon(opts, manager) end)
    |> Multi.run(:attach, fn _repo, %{taxon: taxon} -> attach_nursery_lines(request, taxon) end)
    |> Multi.update(:request, fn %{taxon: taxon} ->
      TaxonRequest.decision_changeset(request, :approved, manager.id, taxon_id: taxon.id)
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{request: updated, taxon: taxon}} ->
        notify_askers(asker_ids, %{
          type: "taxon_request.approved",
          title: "Plante ajoutée : #{taxon_label(taxon)}",
          body:
            "Votre demande a été acceptée : « #{taxon_label(taxon)} » fait désormais partie de la liste de référence" <>
              " et a été ajoutée à vos nurseries.",
          link: "/mes-nurseries",
          payload: %{taxon_request_id: request.id, taxon_id: taxon.id}
        })

        {:ok, Repo.preload(updated, [:requested_by, :category])}

      {:error, _step, reason, _} ->
        {:error, reason}
    end
  end

  def approve(_request, _manager, _opts), do: {:error, :taxon_request_not_pending}

  def reject(%TaxonRequest{status: :pending} = request, %User{} = manager, reason) do
    reason = blank_to_nil(reason)
    asker_ids = asker_ids(request)

    Multi.new()
    |> Multi.delete_all(:lines, from(p in NurseryPlant, where: p.taxon_request_id == ^request.id))
    |> Multi.update(:request, TaxonRequest.decision_changeset(request, :rejected, manager.id, reason: reason))
    |> Repo.transaction()
    |> case do
      {:ok, %{request: updated}} ->
        notify_askers(asker_ids, %{
          type: "taxon_request.rejected",
          title: "Demande de plante refusée : #{label(request)}",
          body:
            "Votre demande d'ajout de « #{label(request)} » n'a pas été retenue." <>
              if(reason, do: " Motif : #{reason}.", else: "") <>
              " La plante a été retirée de vos nurseries.",
          link: "/mes-nurseries",
          payload: %{taxon_request_id: request.id, reason: reason}
        })

        {:ok, Repo.preload(updated, [:requested_by, :category])}

      {:error, _step, reason, _} ->
        {:error, reason}
    end
  end

  def reject(_request, _manager, _reason), do: {:error, :taxon_request_not_pending}

  # ── private ───────────────────────────────────────────────────────────────

  defp resolve_taxon(opts, manager) do
    case opts do
      %{taxon_id: id} when is_binary(id) ->
        case Repo.get(Taxon, id) do
          nil -> {:error, :taxon_not_found}
          taxon -> {:ok, taxon}
        end

      %{taxon: attrs} when is_map(attrs) ->
        with {:ok, taxon} <- Taxa.create_taxon(attrs, manager), do: {:ok, taxon}

      _ ->
        {:error, :taxon_required}
    end
  end

  # Each pending line becomes a regular line of the taxon. If the nursery
  # already stocks that taxon, quantities are merged rather than violating the
  # one-line-per-taxon rule.
  defp attach_nursery_lines(request, taxon) do
    lines = Repo.all(from p in NurseryPlant, where: p.taxon_request_id == ^request.id)

    Enum.each(lines, fn line ->
      existing =
        Repo.get_by(NurseryPlant, nursery_id: line.nursery_id, taxon_id: taxon.id)

      if existing do
        existing |> Ecto.Changeset.change(quantity: existing.quantity + line.quantity) |> Repo.update!()
        Repo.delete!(line)
      else
        line |> Ecto.Changeset.change(taxon_id: taxon.id, taxon_request_id: nil) |> Repo.update!()
      end
    end)

    {:ok, length(lines)}
  end

  defp find_open_duplicate(changeset) do
    names =
      [Ecto.Changeset.get_field(changeset, :scientific_name), Ecto.Changeset.get_field(changeset, :common_name)]
      |> Enum.reject(&is_nil/1)
      |> Enum.map(&String.downcase/1)

    from(r in TaxonRequest,
      where:
        r.status == :pending and
          (fragment("lower(?)", r.scientific_name) in ^names or fragment("lower(?)", r.common_name) in ^names),
      limit: 1
    )
    |> Repo.one()
  end

  # Everyone who asked: the requester plus owners of nursery lines waiting on
  # it. Read before deciding — approving or rejecting rewrites those lines.
  defp asker_ids(request) do
    owner_ids =
      from(p in NurseryPlant,
        join: n in assoc(p, :nursery),
        where: p.taxon_request_id == ^request.id,
        select: n.user_id
      )
      |> Repo.all()

    Enum.uniq([request.requested_by_id | owner_ids])
  end

  defp notify_askers(ids, attrs) do
    from(u in User, where: u.id in ^ids)
    |> Repo.all()
    |> Enum.each(&Notifications.notify(&1, attrs))
  end

  defp label(%TaxonRequest{common_name: c, scientific_name: s}), do: c || s
  defp taxon_label(%Taxon{common_name: c, scientific_name: s}), do: c || s

  defp display_name(%User{first_name: f, last_name: l, email: email}) do
    case [f, l] |> Enum.reject(&(&1 in [nil, ""])) |> Enum.join(" ") do
      "" -> email
      name -> name
    end
  end

  defp blank_to_nil(nil), do: nil

  defp blank_to_nil(reason) when is_binary(reason) do
    case String.trim(reason) do
      "" -> nil
      trimmed -> trimmed
    end
  end
end
