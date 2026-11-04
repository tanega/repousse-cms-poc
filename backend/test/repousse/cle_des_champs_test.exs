defmodule Repousse.CleDesChampsTest do
  use Repousse.DataCase, async: true

  import Repousse.Factory

  alias Repousse.CleDesChamps
  alias Repousse.Distributions
  alias Repousse.Impact
  alias Repousse.Nurseries

  defp host do
    user = insert(:user)
    insert(:user_profile, user: user, profile_type: :host_family)
    user
  end

  test "depositing a line moves it into the clé des champs pool" do
    user = host()
    taxon = insert(:taxon)
    nursery = insert(:nursery, user: user)
    plant = insert(:nursery_plant, nursery: nursery, taxon: taxon, quantity: 8)

    assert {:ok, deposit} = CleDesChamps.deposit_plant(user, nursery, plant.id)
    assert deposit.quantity == 8
    assert deposit.taxon_id == taxon.id
    assert is_nil(deposit.allocated_at)
    assert Nurseries.get_nursery!(nursery.id).plants == []
    assert [available] = CleDesChamps.list_available()
    assert available.id == deposit.id
  end

  test "a pending species cannot be deposited" do
    user = host()
    nursery = insert(:nursery, user: user)
    {:ok, request} = Repousse.Taxa.Requests.create(user, %{"common_name" => "Arbuste inconnu"})

    {:ok, plant} =
      %Repousse.Nurseries.NurseryPlant{}
      |> Repousse.Nurseries.NurseryPlant.changeset(%{
        "nursery_id" => nursery.id,
        "taxon_request_id" => request.id,
        "quantity" => 3
      })
      |> Repousse.Repo.insert()

    assert {:error, :plant_not_depositable} = CleDesChamps.deposit_plant(user, nursery, plant.id)
  end

  test "allocating deposits adds them to a distribution stock" do
    user = host()
    taxon = insert(:taxon)
    nursery = insert(:nursery, user: user)
    plant = insert(:nursery_plant, nursery: nursery, taxon: taxon, quantity: 5)
    event = insert(:distribution_event)
    {:ok, deposit} = CleDesChamps.deposit_plant(user, nursery, plant.id)

    assert {:ok, [stock]} = CleDesChamps.allocate_to_event(event.id, [deposit.id])
    assert stock.taxon_id == taxon.id
    assert stock.quantity == 5
    assert CleDesChamps.list_available() == []
  end

  test "a volunteer handover attaches the picked-up trees to the planting project" do
    adoptant = insert(:user, adhesion_active: true)
    volunteer = insert(:user)
    insert(:user_profile, user: volunteer, profile_type: :volunteer)
    taxon = insert(:taxon, common_name: "Troène")
    event = insert(:distribution_event)
    slot = insert(:slot, event: event)
    stock = insert(:stock, event: event, taxon: taxon, quantity: 20)
    project = insert(:project, owner: adoptant)

    reservation =
      insert(:reservation, user: adoptant, event: event, slot: slot, project: project)

    insert(:reservation_item, reservation: reservation, stock: stock, taxon: taxon, reserved_qty: 4)

    assert {:ok, validated} =
             Distributions.record_handover(reservation, [%{taxon_id: taxon.id, quantity: 10}], volunteer)

    assert validated.status == :validated
    assert [%{distributed_qty: 10}] = validated.items
    assert [%{quantity: 10, source: :distribution, project_id: project_id}] = Impact.list_plantings(project.id)
    assert project_id == project.id
  end
end
