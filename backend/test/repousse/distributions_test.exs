defmodule Repousse.DistributionsTest do
  use Repousse.DataCase, async: true

  import Repousse.Factory

  alias Repousse.Distributions
  alias Repousse.Distributions.{ReservationItem, Slot, WaitlistEntry}

  describe "create_reservation/5" do
    setup [:published_event_with_stock]

    test "creates a reservation and decrements the shared stock", %{
      event: event,
      slot: slot,
      taxon: taxon,
      stock: stock,
      project: project
    } do
      user = insert(:user, status: :active, adhesion_active: true)

      assert {:ok, %{reservation: reservation, items: [item]}} =
               Distributions.create_reservation(user, slot, event, project, [
                 %{stock_id: stock.id, qty: 2, taxon_id: taxon.id}
               ])

      assert reservation.status == :confirmed
      assert item.reserved_qty == 2

      updated_stock = Distributions.get_stock!(stock.id)
      assert updated_stock.reserved_quantity == 2
    end

    test "rejects reservation when the event is not published (US-DIST-07)", %{
      slot: slot,
      taxon: taxon,
      stock: stock,
      project: project
    } do
      draft_event = insert(:distribution_event, status: :draft)
      user = insert(:user, status: :active, adhesion_active: true)

      assert {:error, :event_not_open_for_reservations} =
               Distributions.create_reservation(user, slot, draft_event, project, [
                 %{stock_id: stock.id, qty: 1, taxon_id: taxon.id}
               ])
    end

    test "rejects reservation when the requested quantity exceeds available stock", %{
      event: event,
      slot: slot,
      taxon: taxon,
      stock: stock,
      project: project
    } do
      user = insert(:user, status: :active, adhesion_active: true)

      assert {:error, :items, :insufficient_stock, _changes} =
               Distributions.create_reservation(user, slot, event, project, [
                 %{stock_id: stock.id, qty: stock.quantity + 1, taxon_id: taxon.id}
               ])
    end
  end

  describe "cancel_reservation/1 (US-DIST-09)" do
    setup [:published_event_with_stock]

    test "cancels and restores stock when more than 48h remain before the slot", %{
      event: event,
      slot: slot,
      taxon: taxon,
      stock: stock,
      project: project
    } do
      user = insert(:user, status: :active, adhesion_active: true)

      {:ok, %{reservation: reservation}} =
        Distributions.create_reservation(user, slot, event, project, [
          %{stock_id: stock.id, qty: 2, taxon_id: taxon.id}
        ])

      assert {:ok, %{reservation: cancelled}} = Distributions.cancel_reservation(reservation)
      assert cancelled.status == :cancelled
      assert cancelled.cancelled_at

      assert Distributions.get_stock!(stock.id).reserved_quantity == 0
    end

    test "blocks cancellation less than 48h before the reserved slot", %{
      event: event,
      taxon: taxon,
      stock: stock,
      project: project
    } do
      user = insert(:user, status: :active, adhesion_active: true)
      near = DateTime.add(DateTime.utc_now(), 10 * 3600, :second)

      near_slot =
        insert(:distribution_slot,
          event: event,
          date: DateTime.to_date(near),
          start_time: DateTime.to_time(near) |> Time.truncate(:second),
          end_time: DateTime.to_time(DateTime.add(near, 3600, :second)) |> Time.truncate(:second)
        )

      {:ok, %{reservation: reservation}} =
        Distributions.create_reservation(user, near_slot, event, project, [
          %{stock_id: stock.id, qty: 1, taxon_id: taxon.id}
        ])

      assert {:error, :cancellation_window_closed} = Distributions.cancel_reservation(reservation)
      assert Distributions.get_stock!(stock.id).reserved_quantity == 1
    end

    test "blocks cancellation once the event is closed", %{
      event: event,
      slot: slot,
      taxon: taxon,
      stock: stock,
      project: project
    } do
      user = insert(:user, status: :active, adhesion_active: true)

      {:ok, %{reservation: reservation}} =
        Distributions.create_reservation(user, slot, event, project, [
          %{stock_id: stock.id, qty: 1, taxon_id: taxon.id}
        ])

      {:ok, _} = Distributions.close_event(event)

      assert {:error, :event_closed} = Distributions.cancel_reservation(reservation)
    end

    test "notifies the longest-waiting adoptant for the freed taxon (US-DIST-08)", %{
      event: event,
      slot: slot,
      taxon: taxon,
      stock: stock,
      project: project
    } do
      user = insert(:user, status: :active, adhesion_active: true)

      {:ok, %{reservation: reservation}} =
        Distributions.create_reservation(user, slot, event, project, [
          %{stock_id: stock.id, qty: 1, taxon_id: taxon.id}
        ])

      first_in_line = insert(:waitlist_entry, event: event, taxon: taxon, position: 1)
      second_in_line = insert(:waitlist_entry, event: event, taxon: taxon, position: 2)

      assert {:ok, _} = Distributions.cancel_reservation(reservation)

      first_in_line = Repo.get!(WaitlistEntry, first_in_line.id)
      second_in_line = Repo.get!(WaitlistEntry, second_in_line.id)

      assert first_in_line.status == :notified
      assert first_in_line.notified_at
      assert first_in_line.notification_expires_at

      assert second_in_line.status == :waiting
      refute second_in_line.notified_at
    end

    test "does nothing when nobody is on the waitlist for the freed taxon", %{
      event: event,
      slot: slot,
      taxon: taxon,
      stock: stock,
      project: project
    } do
      user = insert(:user, status: :active, adhesion_active: true)

      {:ok, %{reservation: reservation}} =
        Distributions.create_reservation(user, slot, event, project, [
          %{stock_id: stock.id, qty: 1, taxon_id: taxon.id}
        ])

      assert {:ok, _} = Distributions.cancel_reservation(reservation)
    end
  end

  describe "slot management (US-DIST-02)" do
    test "deletes a slot with no active reservations" do
      event = insert(:distribution_event, status: :published)
      slot = insert(:distribution_slot, event: event)

      assert {:ok, _} = Distributions.delete_slot(slot)
      refute Repo.get(Slot, slot.id)
    end

    test "blocks slot deletion while it has active (confirmed) reservations" do
      %{event: event, slot: slot, taxon: taxon, stock: stock, project: project} =
        published_event_with_stock(%{})

      user = insert(:user, status: :active, adhesion_active: true)

      {:ok, _} =
        Distributions.create_reservation(user, slot, event, project, [
          %{stock_id: stock.id, qty: 1, taxon_id: taxon.id}
        ])

      assert {:error, :slot_has_active_reservations} = Distributions.delete_slot(slot)
      assert Repo.get(Slot, slot.id)
    end

    test "blocks add/edit/delete of slots once the event is Closed" do
      event = insert(:distribution_event, status: :closed)
      slot = insert(:distribution_slot, event: event)

      assert {:error, :event_closed} =
               Distributions.create_slot(%{
                 "event_id" => event.id,
                 "location_name" => "Nouveau lieu",
                 "date" => Date.utc_today() |> Date.add(1),
                 "start_time" => ~T[09:00:00],
                 "end_time" => ~T[10:00:00]
               })

      assert {:error, :event_closed} =
               Distributions.update_slot(slot, %{"location_name" => "Nouveau nom"})

      assert {:error, :event_closed} = Distributions.delete_slot(slot)
    end
  end

  describe "list_reservations_for_event/1 and list_slot_reservations/1 (US-DIST-10)" do
    test "exclude cancelled reservations and preload the planting project" do
      %{event: event, slot: slot, taxon: taxon, stock: stock, project: project} =
        published_event_with_stock(%{})

      keeper = insert(:user, status: :active, adhesion_active: true)
      canceller = insert(:user, status: :active, adhesion_active: true)

      {:ok, %{reservation: kept}} =
        Distributions.create_reservation(keeper, slot, event, project, [
          %{stock_id: stock.id, qty: 1, taxon_id: taxon.id}
        ])

      {:ok, %{reservation: to_cancel}} =
        Distributions.create_reservation(canceller, slot, event, project, [
          %{stock_id: stock.id, qty: 1, taxon_id: taxon.id}
        ])

      {:ok, _} = Distributions.cancel_reservation(to_cancel)

      event_results = Distributions.list_reservations_for_event(event.id)
      assert [only] = event_results
      assert only.id == kept.id
      assert only.project.id == project.id

      slot_results = Distributions.list_slot_reservations(slot.id)
      assert [only_slot] = slot_results
      assert only_slot.id == kept.id
      assert only_slot.project.id == project.id
    end
  end

  describe "validate_reservation/2 and mark_no_show/1 (US-DIST-11)" do
    test "overrides the distributed quantity per item and validates the reservation" do
      %{event: event, slot: slot, taxon: taxon, stock: stock, project: project} =
        published_event_with_stock(%{})

      user = insert(:user, status: :active, adhesion_active: true)

      {:ok, %{reservation: reservation, items: [item]}} =
        Distributions.create_reservation(user, slot, event, project, [
          %{stock_id: stock.id, qty: 3, taxon_id: taxon.id}
        ])

      assert {:ok, %{reservation: validated}} =
               Distributions.validate_reservation(reservation, %{
                 "coordinator_note" => "RAS",
                 "items" => [%{"item_id" => item.id, "distributed_qty" => 2}]
               })

      assert validated.status == :validated
      assert validated.validated_at
      assert validated.coordinator_note == "RAS"

      assert Repo.get!(ReservationItem, item.id).distributed_qty == 2
    end

    test "marks a reservation as non venu (no-show)" do
      %{event: event, slot: slot, taxon: taxon, stock: stock, project: project} =
        published_event_with_stock(%{})

      user = insert(:user, status: :active, adhesion_active: true)

      {:ok, %{reservation: reservation}} =
        Distributions.create_reservation(user, slot, event, project, [
          %{stock_id: stock.id, qty: 1, taxon_id: taxon.id}
        ])

      assert {:ok, no_show} = Distributions.mark_no_show(reservation)
      assert no_show.status == :no_show
    end
  end

  defp published_event_with_stock(_context) do
    event = insert(:distribution_event, status: :published)
    slot = insert(:distribution_slot, event: event)
    taxon = insert(:taxon)

    stock =
      insert(:distribution_stock, event: event, taxon: taxon, quantity: 5, reserved_quantity: 0)

    project = insert(:project)

    %{event: event, slot: slot, taxon: taxon, stock: stock, project: project}
  end
end
