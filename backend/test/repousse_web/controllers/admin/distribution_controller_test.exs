defmodule RepousseWeb.Admin.DistributionControllerTest do
  use RepousseWeb.ConnCase, async: true

  import Repousse.Factory

  alias Repousse.Distributions
  alias RepousseWeb.Admin.DistributionController

  describe "authorization — Distributions.Policy :manage_event" do
    test "a plain member cannot manage distribution events", %{conn: conn} do
      event = insert(:distribution_event)
      member = insert(:user, role: :member)
      conn = assign(conn, :current_user, member)

      assert {:error, :unauthorized} = DistributionController.index(conn, %{})
      assert {:error, :unauthorized} = DistributionController.show(conn, %{"id" => event.id})

      assert {:error, :unauthorized} =
               DistributionController.create(conn, %{"distribution" => %{"title" => "Foo"}})

      assert {:error, :unauthorized} = DistributionController.publish(conn, %{"id" => event.id})
      assert {:error, :unauthorized} = DistributionController.close(conn, %{"id" => event.id})

      assert {:error, :unauthorized} =
               DistributionController.attendees(conn, %{"distribution_id" => event.id})
    end

    test "an admin can manage distribution events", %{conn: conn} do
      admin = insert(:user, role: :admin)
      conn = assign(conn, :current_user, admin)

      result =
        DistributionController.create(conn, %{
          "distribution" => %{"title" => "Distribution de printemps"}
        })

      assert %Plug.Conn{status: 201} = result
      event_id = json_response(result, 201)["data"]["id"]

      assert %Plug.Conn{status: 200} =
               DistributionController.publish(conn, %{"id" => event_id})
    end
  end

  describe "attendees/2 (US-DIST-10)" do
    setup %{conn: conn} do
      admin = insert(:user, role: :admin)
      conn = assign(conn, :current_user, admin)

      event = insert(:distribution_event, status: :published)
      slot_a = insert(:distribution_slot, event: event)
      slot_b = insert(:distribution_slot, event: event)
      taxon = insert(:taxon)
      stock = insert(:distribution_stock, event: event, taxon: taxon, quantity: 5)
      project = insert(:project)

      %{
        conn: conn,
        event: event,
        slot_a: slot_a,
        slot_b: slot_b,
        taxon: taxon,
        stock: stock,
        project: project
      }
    end

    test "lists every non-cancelled reservation across the event, with the planting project", %{
      conn: conn,
      event: event,
      slot_a: slot_a,
      taxon: taxon,
      stock: stock,
      project: project
    } do
      user = insert(:user, status: :active, adhesion_active: true)

      {:ok, %{reservation: reservation}} =
        Distributions.create_reservation(user, slot_a, event, project, [
          %{stock_id: stock.id, qty: 1, taxon_id: taxon.id}
        ])

      result = DistributionController.attendees(conn, %{"distribution_id" => event.id})

      data = json_response(result, 200)["data"]
      assert [attendee] = data
      assert attendee["id"] == reservation.id
      # The planting project's own id is exposed; the nested project object
      # isn't serialized yet because `Repousse.Projects.Project` doesn't
      # derive `Jason.Encoder` (owned by a different track). The context
      # function itself (`Distributions.list_reservations_for_event/1`,
      # covered in distributions_test.exs) does preload `:project` in full.
      assert attendee["project_id"] == project.id
    end

    test "scopes the list to a single slot when slot_id is given", %{
      conn: conn,
      event: event,
      slot_a: slot_a,
      slot_b: slot_b,
      taxon: taxon,
      stock: stock,
      project: project
    } do
      user_a = insert(:user, status: :active, adhesion_active: true)
      user_b = insert(:user, status: :active, adhesion_active: true)

      {:ok, %{reservation: reservation_a}} =
        Distributions.create_reservation(user_a, slot_a, event, project, [
          %{stock_id: stock.id, qty: 1, taxon_id: taxon.id}
        ])

      {:ok, _} =
        Distributions.create_reservation(user_b, slot_b, event, project, [
          %{stock_id: stock.id, qty: 1, taxon_id: taxon.id}
        ])

      result =
        DistributionController.attendees(conn, %{
          "distribution_id" => event.id,
          "slot_id" => slot_a.id
        })

      data = json_response(result, 200)["data"]
      assert [attendee] = data
      assert attendee["id"] == reservation_a.id
    end
  end
end
