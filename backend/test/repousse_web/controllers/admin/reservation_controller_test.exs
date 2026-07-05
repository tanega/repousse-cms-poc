defmodule RepousseWeb.Admin.ReservationControllerTest do
  use RepousseWeb.ConnCase, async: true

  import Repousse.Factory

  alias Repousse.Distributions
  alias RepousseWeb.Admin.ReservationController

  setup do
    event = insert(:distribution_event, status: :published)
    slot = insert(:distribution_slot, event: event)
    taxon = insert(:taxon)

    stock =
      insert(:distribution_stock, event: event, taxon: taxon, quantity: 5, reserved_quantity: 0)

    project = insert(:project)
    user = insert(:user, status: :active, adhesion_active: true)

    {:ok, %{reservation: reservation, items: [item]}} =
      Distributions.create_reservation(user, slot, event, project, [
        %{stock_id: stock.id, qty: 3, taxon_id: taxon.id}
      ])

    %{reservation: reservation, item: item}
  end

  describe "validate/2 — Distributions.Policy :validate_reservation (US-DIST-11)" do
    test "a plain member cannot validate a reservation", %{conn: conn, reservation: reservation} do
      member = insert(:user, role: :member)
      conn = assign(conn, :current_user, member)

      assert {:error, :unauthorized} =
               ReservationController.validate(conn, %{"reservation_id" => reservation.id})
    end

    test "an admin can override the distributed quantity for an item", %{
      conn: conn,
      reservation: reservation,
      item: item
    } do
      admin = insert(:user, role: :admin)
      conn = assign(conn, :current_user, admin)

      result =
        ReservationController.validate(conn, %{
          "reservation_id" => reservation.id,
          "items" => [%{"item_id" => item.id, "distributed_qty" => 2}]
        })

      data = json_response(result, 200)["data"]
      assert data["status"] == "validated"
    end

    test "an admin can mark an adoptant as a no-show", %{conn: conn, reservation: reservation} do
      admin = insert(:user, role: :admin)
      conn = assign(conn, :current_user, admin)

      result =
        ReservationController.validate(conn, %{
          "reservation_id" => reservation.id,
          "no_show" => true
        })

      assert json_response(result, 200)["data"]["status"] == "no_show"
    end
  end
end
