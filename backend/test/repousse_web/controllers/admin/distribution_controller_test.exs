defmodule RepousseWeb.Admin.DistributionControllerTest do
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

  describe "GET /admin/distributions" do
    test "admin lists distribution events", %{conn: conn, private_map: pm} do
      admin = insert(:admin_user)
      insert(:distribution_event)

      conn = conn |> authed(admin, pm) |> get(~p"/api/v1/admin/distributions")

      assert %{"data" => [_ | _]} = json_response(conn, 200)
    end

    test "a non-admin gets forbidden", %{conn: conn, private_map: pm} do
      user = insert(:user)

      conn = conn |> authed(user, pm) |> get(~p"/api/v1/admin/distributions")

      assert json_response(conn, 403)
    end
  end

  describe "POST /admin/distributions" do
    test "admin creates a distribution event", %{conn: conn, private_map: pm} do
      admin = insert(:admin_user)

      conn =
        conn
        |> authed(admin, pm)
        |> post(~p"/api/v1/admin/distributions", %{"distribution" => %{"title" => "Nouvelle distribution"}})

      assert %{"data" => %{"title" => "Nouvelle distribution", "status" => "draft"}} =
               json_response(conn, 201)
    end
  end

  describe "PUT /admin/distributions/:id" do
    test "admin updates a distribution event", %{conn: conn, private_map: pm} do
      admin = insert(:admin_user)
      event = insert(:distribution_event)

      conn =
        conn
        |> authed(admin, pm)
        |> put(~p"/api/v1/admin/distributions/#{event.id}", %{"distribution" => %{"title" => "Titre modifié"}})

      assert %{"data" => %{"title" => "Titre modifié"}} = json_response(conn, 200)
    end
  end

  describe "POST /admin/distributions/:id/publish and /close" do
    test "admin publishes then closes an event", %{conn: conn, private_map: pm} do
      admin = insert(:admin_user)
      event = insert(:distribution_event, status: :draft)

      conn1 = conn |> authed(admin, pm) |> post(~p"/api/v1/admin/distributions/#{event.id}/publish")
      assert %{"data" => %{"status" => "published"}} = json_response(conn1, 200)

      conn2 =
        build_conn() |> authed(admin, pm) |> post(~p"/api/v1/admin/distributions/#{event.id}/close")

      assert %{"data" => %{"status" => "closed"}} = json_response(conn2, 200)
    end
  end

  describe "DELETE /admin/distributions/:id" do
    test "admin deletes a distribution event", %{conn: conn, private_map: pm} do
      admin = insert(:admin_user)
      event = insert(:distribution_event)

      conn = conn |> authed(admin, pm) |> delete(~p"/api/v1/admin/distributions/#{event.id}")

      assert response(conn, 204)
      assert Distributions.get_event(event.id) == nil
    end
  end

  describe "GET /admin/distributions/:distribution_id/attendees" do
    test "admin lists attendees for an event", %{conn: conn, private_map: pm} do
      admin = insert(:admin_user)
      event = insert(:distribution_event)
      reservation = insert(:reservation, event: event)

      conn =
        conn
        |> authed(admin, pm)
        |> get(~p"/api/v1/admin/distributions/#{event.id}/attendees")

      assert %{"data" => reservations} = json_response(conn, 200)
      assert Enum.any?(reservations, &(&1["id"] == reservation.id))
    end
  end
end
