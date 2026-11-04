defmodule Repousse.CleDesChamps do
  @moduledoc """
  Plants a host family has handed over at « la clé des champs ».

  Depositing a nursery line moves its quantity out of the nursery and into
  this pool. Coordinators then pour the pool into a distribution's stock.
  """
  import Ecto.Query

  alias Ecto.Multi
  alias Repousse.Accounts
  alias Repousse.Accounts.User
  alias Repousse.CleDesChamps.Deposit
  alias Repousse.Distributions
  alias Repousse.Distributions.Stock
  alias Repousse.Nurseries.Nursery
  alias Repousse.Nurseries.NurseryPlant
  alias Repousse.Repo

  def list_available do
    from(d in Deposit, where: is_nil(d.allocated_at), order_by: [asc: d.deposited_at])
    |> Repo.all()
    |> Repo.preload([:taxon, :user, :nursery])
  end

  def present(%Deposit{} = deposit) do
    %{
      id: deposit.id,
      quantity: deposit.quantity,
      deposited_at: deposit.deposited_at,
      allocated_at: deposit.allocated_at,
      taxon_id: deposit.taxon_id,
      common_name: name_of(deposit.taxon),
      nursery_name: nursery_name(deposit.nursery),
      owner_name: owner_name(deposit.user),
      owner_email: owner_email(deposit.user)
    }
  end

  def list_archive do
    from(d in Deposit, where: not is_nil(d.allocated_at), order_by: [desc: d.allocated_at], limit: 100)
    |> Repo.all()
    |> Repo.preload([:taxon, :user, :nursery])
  end

  def add_direct(%User{} = admin, attrs) do
    attrs = Map.new(attrs, fn {k, v} -> {to_string(k), v} end)

    %Deposit{}
    |> Deposit.changeset(%{
      "quantity" => attrs["quantity"],
      "taxon_id" => attrs["taxon_id"],
      "user_id" => admin.id
    })
    |> Repo.insert()
    |> case do
      {:ok, deposit} -> {:ok, Repo.preload(deposit, :taxon)}
      error -> error
    end
  end

  def update_quantity(%Deposit{allocated_at: nil} = deposit, quantity) when is_integer(quantity) and quantity > 0 do
    deposit |> Ecto.Changeset.change(quantity: quantity) |> Repo.update()
  end

  def update_quantity(%Deposit{allocated_at: nil}, _quantity), do: {:error, :invalid_handover}
  def update_quantity(%Deposit{}, _quantity), do: {:error, :deposit_already_allocated}

  def remove_deposit(%Deposit{allocated_at: nil} = deposit), do: Repo.delete(deposit)
  def remove_deposit(%Deposit{}), do: {:error, :deposit_already_allocated}

  def direct_gift(%User{} = user, %Nursery{} = nursery, plant_id, project_id, quantity) do
    nursery = Repo.preload(nursery, :plants)
    plant = Enum.find(nursery.plants, &(&1.id == plant_id))

    cond do
      nursery.user_id != user.id and not Accounts.admin?(user) ->
        {:error, :unauthorized}

      is_nil(plant) or is_nil(plant.taxon_id) ->
        {:error, :plant_not_depositable}

      not is_integer(quantity) or quantity < 1 or quantity > plant.quantity ->
        {:error, :invalid_handover}

      true ->
        Multi.new()
        |> Multi.insert(:planting, fn _ ->
          Repousse.Impact.ProjectPlanting.changeset(%Repousse.Impact.ProjectPlanting{}, %{
            project_id: project_id,
            taxon_id: plant.taxon_id,
            quantity: quantity,
            source: :direct,
            planted_on: Date.utc_today(),
            recorded_by_id: user.id
          })
        end)
        |> Multi.run(:plant, fn _repo, _ -> adjust_plant(plant, quantity) end)
        |> Repo.transaction()
        |> case do
          {:ok, %{planting: planting}} -> {:ok, planting}
          {:error, _step, reason, _} -> {:error, reason}
        end
    end
  end

  defp adjust_plant(plant, quantity) when plant.quantity == quantity, do: Repo.delete(plant)

  defp adjust_plant(plant, quantity) do
    plant |> Ecto.Changeset.change(quantity: plant.quantity - quantity) |> Repo.update()
  end

  def list_for_user(user_id) do
    from(d in Deposit, where: d.user_id == ^user_id, order_by: [desc: d.deposited_at])
    |> Repo.all()
    |> Repo.preload(:taxon)
  end

  def add_plant(%Nursery{} = nursery, attrs) do
    attrs = Map.new(attrs, fn {k, v} -> {to_string(k), v} end)
    nursery = Repo.preload(nursery, :plants)
    taxon_id = attrs["taxon_id"]
    added = attrs["quantity"] || 0

    case Enum.find(nursery.plants, &(&1.taxon_id == taxon_id)) do
      nil ->
        %NurseryPlant{}
        |> NurseryPlant.changeset(Map.put(attrs, "nursery_id", nursery.id))
        |> Repo.insert()

      %NurseryPlant{} = plant ->
        plant
        |> NurseryPlant.changeset(%{
          "quantity" => plant.quantity + added,
          "nursery_id" => nursery.id,
          "taxon_id" => taxon_id
        })
        |> Repo.update()
    end
  end

  def deposit_plant(%User{} = user, %Nursery{} = nursery, plant_id) do
    nursery = Repo.preload(nursery, :plants)
    plant = Enum.find(nursery.plants, &(&1.id == plant_id))

    cond do
      nursery.user_id != user.id and not Accounts.admin?(user) ->
        {:error, :unauthorized}

      is_nil(plant) ->
        {:error, :not_found}

      is_nil(plant.taxon_id) or plant.quantity < 1 ->
        {:error, :plant_not_depositable}

      true ->
        Multi.new()
        |> Multi.insert(:deposit, Deposit.changeset(%Deposit{}, %{
          quantity: plant.quantity,
          user_id: nursery.user_id,
          nursery_id: nursery.id,
          taxon_id: plant.taxon_id
        }))
        |> Multi.delete(:plant, plant)
        |> Repo.transaction()
        |> case do
          {:ok, %{deposit: deposit}} -> {:ok, Repo.preload(deposit, :taxon)}
          {:error, _step, reason, _} -> {:error, reason}
        end
    end
  end

  def remove_plant(%User{} = user, %Nursery{} = nursery, plant_id) do
    plant = Repo.get(NurseryPlant, plant_id)

    cond do
      nursery.user_id != user.id and not Accounts.admin?(user) ->
        {:error, :unauthorized}

      is_nil(plant) or plant.nursery_id != nursery.id ->
        {:error, :not_found}

      true ->
        Repo.delete(plant)
    end
  end

  @doc """
  Adds each still-available deposit to the distribution event's stock and
  marks it allocated, so it leaves the « dispo » tab.
  """
  def allocate_to_event(event_id, deposit_ids) when is_list(deposit_ids) do
    deposits =
      from(d in Deposit, where: d.id in ^deposit_ids and is_nil(d.allocated_at))
      |> Repo.all()

    if deposits == [] do
      {:error, :not_found}
    else
      now = DateTime.utc_now() |> DateTime.truncate(:second)
      ids = Enum.map(deposits, & &1.id)

      Multi.new()
      |> Multi.run(:stocks, fn _repo, _changes ->
        Enum.reduce_while(deposits, {:ok, []}, fn deposit, {:ok, acc} ->
          case add_to_event_stock(event_id, deposit.taxon_id, deposit.quantity) do
            {:ok, stock} -> {:cont, {:ok, [stock | acc]}}
            error -> {:halt, error}
          end
        end)
      end)
      |> Multi.update_all(
        :allocated,
        from(d in Deposit, where: d.id in ^ids),
        set: [allocated_at: now, event_id: event_id, updated_at: now]
      )
      |> Repo.transaction()
      |> case do
        {:ok, %{stocks: stocks}} -> {:ok, stocks}
        {:error, _step, reason, _} -> {:error, reason}
      end
    end
  end

  defp name_of(%{common_name: name}), do: name
  defp name_of(_), do: nil

  defp nursery_name(%Repousse.Nurseries.Nursery{name: name}), do: name
  defp nursery_name(_), do: nil

  defp owner_name(%User{first_name: first, last_name: last}) do
    [first, last] |> Enum.filter(&is_binary/1) |> Enum.join(" ")
  end

  defp owner_name(_), do: nil

  defp owner_email(%User{email: email}), do: email
  defp owner_email(_), do: nil

  defp add_to_event_stock(event_id, taxon_id, qty) do
    case Repo.get_by(Stock, event_id: event_id, taxon_id: taxon_id) do
      nil ->
        Distributions.create_stock(%{"event_id" => event_id, "taxon_id" => taxon_id, "quantity" => qty})

      %Stock{quantity_unknown: true} = stock ->
        Distributions.update_stock(stock, %{"quantity_unknown" => false, "quantity" => qty})

      %Stock{quantity: current} = stock ->
        Distributions.update_stock(stock, %{"quantity" => (current || 0) + qty})
    end
  end
end
