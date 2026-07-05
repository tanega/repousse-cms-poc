defmodule RepousseWeb.ReservationControllerTest do
  use RepousseWeb.ConnCase, async: true

  import Repousse.Factory

  alias Repousse.Distributions
  alias RepousseWeb.ReservationController

  setup do
    event = insert(:distribution_event, status: :published)
    slot = insert(:distribution_slot, event: event)
    taxon = insert(:taxon)

    stock =
      insert(:distribution_stock, event: event, taxon: taxon, quantity: 5, reserved_quantity: 0)

    project = insert(:project)

    %{event: event, slot: slot, taxon: taxon, stock: stock, project: project}
  end

  defp reservation_params(%{
         event: event,
         slot: slot,
         taxon: taxon,
         stock: stock,
         project: project
       }) do
    %{
      "reservation" => %{
        "event_id" => event.id,
        "slot_id" => slot.id,
        "project_id" => project.id,
        "items" => [%{"stock_id" => stock.id, "taxon_id" => taxon.id, "qty" => 1}]
      }
    }
  end

  describe "create/2 — US-AUTH-04 gating via Distributions.Policy :reserve" do
    test "an adherent with active, current-year adhesion can reserve", %{conn: conn} = context do
      user = insert(:user, status: :active, adhesion_active: true)
      conn = assign(conn, :current_user, user)

      result = ReservationController.create(conn, reservation_params(context))

      assert %Plug.Conn{status: 201} = result
      assert json_response(result, 201)["data"]["id"]
    end

    test "a suspended member cannot reserve", %{conn: conn} = context do
      user = insert(:user, status: :suspended, adhesion_active: true)
      conn = assign(conn, :current_user, user)

      assert {:error, :unauthorized} =
               ReservationController.create(conn, reservation_params(context))
    end

    test "a member without an active (current-year) adhesion cannot reserve",
         %{conn: conn} = context do
      user = insert(:user, status: :active, adhesion_active: false)
      conn = assign(conn, :current_user, user)

      assert {:error, :unauthorized} =
               ReservationController.create(conn, reservation_params(context))
    end
  end

  describe "cancel/2" do
    test "the owner can cancel their own reservation", %{conn: conn} = context do
      user = insert(:user, status: :active, adhesion_active: true)

      {:ok, %{reservation: reservation}} =
        Distributions.create_reservation(
          user,
          context.slot,
          context.event,
          context.project,
          [%{stock_id: context.stock.id, qty: 1, taxon_id: context.taxon.id}]
        )

      conn = assign(conn, :current_user, user)
      result = ReservationController.cancel(conn, %{"id" => reservation.id})

      assert json_response(result, 200)["data"]["status"] == "cancelled"
    end

    test "another member cannot cancel someone else's reservation", %{conn: conn} = context do
      owner = insert(:user, status: :active, adhesion_active: true)
      intruder = insert(:user, status: :active, adhesion_active: true)

      {:ok, %{reservation: reservation}} =
        Distributions.create_reservation(
          owner,
          context.slot,
          context.event,
          context.project,
          [%{stock_id: context.stock.id, qty: 1, taxon_id: context.taxon.id}]
        )

      conn = assign(conn, :current_user, intruder)
      assert {:error, :forbidden} = ReservationController.cancel(conn, %{"id" => reservation.id})
    end
  end
end
