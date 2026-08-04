defmodule RepousseWeb.AccountsControllerTest do
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

  describe "GET /api/v1/me" do
    test "returns the current user with profiles preloaded", %{conn: conn, private_map: pm} do
      user = insert(:user, first_name: "Alice", last_name: "Dupont")
      insert(:user_profile, user: user, profile_type: :adoptant)

      conn = conn |> authed(user, pm) |> get(~p"/api/v1/me")

      assert %{"data" => data} = json_response(conn, 200)
      assert data["id"] == user.id
      assert data["email"] == user.email
      assert length(data["profiles"]) == 1
    end

    test "401s when unauthenticated", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/me")
      assert json_response(conn, 401)
    end
  end

  describe "PUT /api/v1/me" do
    test "persists a name change", %{conn: conn, private_map: pm} do
      user = insert(:user, first_name: "Alice", last_name: "Dupont")

      conn =
        conn
        |> authed(user, pm)
        |> put(~p"/api/v1/me", %{"user" => %{"first_name" => "Alicia"}})

      assert %{"data" => data} = json_response(conn, 200)
      assert data["first_name"] == "Alicia"
    end

    test "ignores a smuggled role/status change", %{conn: conn, private_map: pm} do
      user = insert(:user, role: :member, status: :active)

      conn =
        conn
        |> authed(user, pm)
        |> put(~p"/api/v1/me", %{
          "user" => %{"first_name" => "Alicia", "role" => "superadmin", "status" => "suspended"}
        })

      assert %{"data" => data} = json_response(conn, 200)
      assert data["first_name"] == "Alicia"
      assert data["role"] == "member"
      assert data["status"] == "active"
    end

    test "401s when unauthenticated", %{conn: conn} do
      conn = put(conn, ~p"/api/v1/me", %{"user" => %{"first_name" => "Alicia"}})
      assert json_response(conn, 401)
    end
  end

  describe "PUT /api/v1/me/avatar" do
    test "400s when no file is sent", %{conn: conn, private_map: pm} do
      user = insert(:user)

      conn = conn |> authed(user, pm) |> put(~p"/api/v1/me/avatar", %{})

      assert json_response(conn, 400)
    end

    test "401s when unauthenticated", %{conn: conn} do
      conn = put(conn, ~p"/api/v1/me/avatar", %{})
      assert json_response(conn, 401)
    end
  end
end
