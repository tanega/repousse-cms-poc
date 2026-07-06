defmodule RepousseWeb.ReservationControllerTest do
  use RepousseWeb.ConnCase, async: false

  import Repousse.Factory

  alias Repousse.AuthHelper
  alias Repousse.Distributions

  @table :hanko_jwks

  setup %{conn: conn} do
    {private_map, public_map} = AuthHelper.generate_jwk()
    :ets.insert(@table, {:keys, [public_map]})
    on_exit(fn -> :ets.delete_all_objects(@table) end)

    %{conn: conn, private_map: private_map}
  end

  defp authed(conn, user, private_map) do
    Plug.Conn.put_req_header(conn, "authorization", "Bearer #{AuthHelper.sign(user, private_map)}")
  end

  describe "POST /distributions/:id/reservations" do
    test "reserves items at a slot", %{conn: conn, private_map: pm} do
      user = insert(:user)
      event = insert(:distribution_event)
      slot = insert(:slot, event: event)
      taxon = insert(:taxon)
      stock = insert(:stock, event: event, taxon: taxon, quantity: 10)
      project = insert(:project)

      conn =
        conn
        |> authed(user, pm)
        |> post(~p"/api/v1/distributions/#{event.id}/reservations", %{
          "reservation" => %{
            "slot_id" => slot.id,
            "event_id" => event.id,
            "project_id" => project.id,
            "items" => [%{"stock_id" => stock.id, "qty" => 2, "taxon_id" => taxon.id}]
          }
        })

      assert %{"data" => %{"status" => "confirmed"}} = json_response(conn, 201)
    end
  end

  describe "GET /distributions/:id/reservations/mine" do
    test "gets the current user's reservation for an event", %{conn: conn, private_map: pm} do
      user = insert(:user)
      event = insert(:distribution_event)
      reservation = insert(:reservation, user: user, event: event)

      conn =
        conn
        |> authed(user, pm)
        |> get(~p"/api/v1/distributions/#{event.id}/reservations/mine")

      assert %{"data" => %{"id" => id}} = json_response(conn, 200)
      assert id == reservation.id
    end
  end

  describe "DELETE /distributions/:distribution_id/reservations/:id" do
    test "the owner can cancel their reservation", %{conn: conn, private_map: pm} do
      user = insert(:user)
      event = insert(:distribution_event)
      reservation = insert(:reservation, user: user, event: event)

      conn =
        conn
        |> authed(user, pm)
        |> delete(~p"/api/v1/distributions/#{event.id}/reservations/#{reservation.id}")

      assert %{"data" => %{"status" => "cancelled"}} = json_response(conn, 200)
      assert Distributions.get_reservation!(reservation.id).status == :cancelled
    end

    test "another user cannot cancel someone else's reservation", %{conn: conn, private_map: pm} do
      owner = insert(:user)
      other = insert(:user)
      event = insert(:distribution_event)
      reservation = insert(:reservation, user: owner, event: event)

      conn =
        conn
        |> authed(other, pm)
        |> delete(~p"/api/v1/distributions/#{event.id}/reservations/#{reservation.id}")

      assert json_response(conn, 403)
    end
  end
end
