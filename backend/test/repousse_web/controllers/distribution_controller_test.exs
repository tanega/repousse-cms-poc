defmodule RepousseWeb.DistributionControllerTest do
  use RepousseWeb.ConnCase, async: false

  import Repousse.Factory

  alias Repousse.AuthHelper

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

  describe "GET /distributions" do
    test "lists distribution events", %{conn: conn, private_map: pm} do
      user = insert(:user)
      insert(:distribution_event, title: "Distribution A")

      conn = conn |> authed(user, pm) |> get(~p"/api/v1/distributions")

      assert %{"data" => events} = json_response(conn, 200)
      assert Enum.any?(events, &(&1["title"] == "Distribution A"))
    end
  end

  describe "GET /distributions/:id" do
    test "gets a distribution event", %{conn: conn, private_map: pm} do
      user = insert(:user)
      event = insert(:distribution_event)

      conn = conn |> authed(user, pm) |> get(~p"/api/v1/distributions/#{event.id}")

      assert %{"data" => %{"id" => id}} = json_response(conn, 200)
      assert id == event.id
    end
  end

  describe "GET /distributions/:id/slots" do
    test "lists slots for the event", %{conn: conn, private_map: pm} do
      user = insert(:user)
      event = insert(:distribution_event)
      slot = insert(:slot, event: event)

      conn = conn |> authed(user, pm) |> get(~p"/api/v1/distributions/#{event.id}/slots")

      assert %{"data" => [%{"id" => id}]} = json_response(conn, 200)
      assert id == slot.id
    end
  end

  describe "GET /distributions/:id/stocks" do
    test "lists species stock for the event", %{conn: conn, private_map: pm} do
      user = insert(:user)
      event = insert(:distribution_event)
      stock = insert(:stock, event: event)

      conn = conn |> authed(user, pm) |> get(~p"/api/v1/distributions/#{event.id}/stocks")

      assert %{"data" => [%{"id" => id}]} = json_response(conn, 200)
      assert id == stock.id
    end
  end
end
