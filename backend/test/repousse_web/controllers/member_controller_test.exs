defmodule RepousseWeb.MemberControllerTest do
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

  defp host_family_owner(visibility) do
    owner = insert(:user, profile_visibility: visibility)

    insert(:user_profile,
      user: owner,
      profile_type: :host_family,
      hosting_address: "3 impasse du Verger",
      hosting_capacity: 120
    )

    insert(:nursery, user: owner, name: "Serre du jardin")
    owner
  end

  describe "GET /api/v1/members/:id" do
    test "a public profile exposes its nurseries to any member", %{conn: conn, private_map: pm} do
      owner = host_family_owner(:public)

      conn = conn |> authed(insert(:user), pm) |> get(~p"/api/v1/members/#{owner.id}")

      assert %{"data" => data} = json_response(conn, 200)
      assert data["visible"] == true
      assert [%{"name" => "Serre du jardin"}] = data["nurseries"]
      assert [%{"hosting_address" => "3 impasse du Verger"}] = data["profiles"]
    end

    test "a private profile hides nurseries and hosting address", %{conn: conn, private_map: pm} do
      owner = host_family_owner(:private)

      conn = conn |> authed(insert(:user), pm) |> get(~p"/api/v1/members/#{owner.id}")

      assert %{"data" => data} = json_response(conn, 200)
      assert data["visible"] == false
      assert data["nurseries"] == []
      assert [%{"hosting_address" => nil, "profile_type" => "host_family"}] = data["profiles"]
    end

    test "a coordinator sees a private profile in full", %{conn: conn, private_map: pm} do
      owner = host_family_owner(:private)

      conn = conn |> authed(insert(:admin_user), pm) |> get(~p"/api/v1/members/#{owner.id}")

      assert %{"data" => data} = json_response(conn, 200)
      assert data["visible"] == true
      assert [%{"name" => "Serre du jardin"}] = data["nurseries"]
    end

    test "the owner sees their own private profile in full", %{conn: conn, private_map: pm} do
      owner = host_family_owner(:private)

      conn = conn |> authed(owner, pm) |> get(~p"/api/v1/members/#{owner.id}")

      assert %{"data" => %{"visible" => true, "nurseries" => [_]}} = json_response(conn, 200)
    end

    test "`me` resolves to the current user", %{conn: conn, private_map: pm} do
      owner = host_family_owner(:private)

      conn = conn |> authed(owner, pm) |> get(~p"/api/v1/members/me")

      assert %{"data" => %{"user" => %{"id" => id}}} = json_response(conn, 200)
      assert id == owner.id
    end

    test "never leaks the member's email", %{conn: conn, private_map: pm} do
      owner = host_family_owner(:public)

      conn = conn |> authed(insert(:user), pm) |> get(~p"/api/v1/members/#{owner.id}")

      assert %{"data" => %{"user" => user}} = json_response(conn, 200)
      refute Map.has_key?(user, "email")
    end

    test "404s on an unknown member", %{conn: conn, private_map: pm} do
      conn = conn |> authed(insert(:user), pm) |> get(~p"/api/v1/members/#{Ecto.UUID.generate()}")

      assert json_response(conn, 404)
    end
  end
end
