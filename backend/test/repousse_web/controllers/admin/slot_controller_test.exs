defmodule RepousseWeb.Admin.SlotControllerTest do
  use RepousseWeb.ConnCase, async: true

  import Repousse.Factory

  alias Repousse.Distributions
  alias RepousseWeb.Admin.SlotController

  describe "authorization — Distributions.Policy :manage_event" do
    test "a plain member cannot manage slots", %{conn: conn} do
      event = insert(:distribution_event, status: :published)
      slot = insert(:distribution_slot, event: event)
      member = insert(:user, role: :member)
      conn = assign(conn, :current_user, member)

      assert {:error, :unauthorized} =
               SlotController.index(conn, %{"distribution_id" => event.id})

      assert {:error, :unauthorized} = SlotController.show(conn, %{"id" => slot.id})

      assert {:error, :unauthorized} =
               SlotController.create(conn, %{
                 "distribution_id" => event.id,
                 "slot" => %{
                   "location_name" => "L",
                   "date" => ~D[2030-01-01],
                   "start_time" => ~T[09:00:00],
                   "end_time" => ~T[10:00:00]
                 }
               })

      assert {:error, :unauthorized} =
               SlotController.update(conn, %{
                 "id" => slot.id,
                 "slot" => %{"location_name" => "L2"}
               })

      assert {:error, :unauthorized} = SlotController.delete(conn, %{"id" => slot.id})
    end

    test "an admin can manage slots", %{conn: conn} do
      admin = insert(:user, role: :admin)
      conn = assign(conn, :current_user, admin)
      event = insert(:distribution_event, status: :published)

      result =
        SlotController.create(conn, %{
          "distribution_id" => event.id,
          "slot" => %{
            "location_name" => "Jardin partagé",
            "date" => ~D[2030-01-01],
            "start_time" => ~T[09:00:00],
            "end_time" => ~T[10:00:00]
          }
        })

      assert %Plug.Conn{status: 201} = result
    end
  end

  describe "delete/2 (US-DIST-02)" do
    setup %{conn: conn} do
      admin = insert(:user, role: :admin)
      %{conn: assign(conn, :current_user, admin)}
    end

    test "is blocked while the slot has active reservations", %{conn: conn} do
      event = insert(:distribution_event, status: :published)
      slot = insert(:distribution_slot, event: event)
      taxon = insert(:taxon)
      stock = insert(:distribution_stock, event: event, taxon: taxon, quantity: 5)
      project = insert(:project)
      user = insert(:user, status: :active, adhesion_active: true)

      {:ok, _} =
        Distributions.create_reservation(user, slot, event, project, [
          %{stock_id: stock.id, qty: 1, taxon_id: taxon.id}
        ])

      result = SlotController.delete(conn, %{"id" => slot.id})

      assert {:error, "slot_has_active_reservations"} = result
    end

    test "is blocked once the event is Closed", %{conn: conn} do
      event = insert(:distribution_event, status: :closed)
      slot = insert(:distribution_slot, event: event)

      result = SlotController.delete(conn, %{"id" => slot.id})

      assert {:error, "event_closed"} = result
    end
  end
end
