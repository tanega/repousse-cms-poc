defmodule RepousseWeb.Admin.UserControllerTest do
  use RepousseWeb.ConnCase, async: false

  import Repousse.Factory
  import Swoosh.TestAssertions

  alias Repousse.AuthHelper
  alias Repousse.Accounts

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

  describe "GET /admin/users" do
    test "admin lists users", %{conn: conn, private_map: pm} do
      admin = insert(:admin_user)
      insert(:user)

      conn = conn |> authed(admin, pm) |> get(~p"/api/v1/admin/users")

      assert %{"data" => [_ | _]} = json_response(conn, 200)
    end

    test "a non-admin gets forbidden by the pipeline", %{conn: conn, private_map: pm} do
      user = insert(:user)

      conn = conn |> authed(user, pm) |> get(~p"/api/v1/admin/users")

      assert json_response(conn, 403)
    end
  end

  describe "POST /admin/users" do
    test "superadmin creates a member: gets a hanko_id and a welcome email", %{conn: conn, private_map: pm} do
      superadmin = insert(:superadmin_user)
      email = "welcome-#{System.unique_integer([:positive])}@example.com"

      conn =
        conn
        |> authed(superadmin, pm)
        |> post(~p"/api/v1/admin/users", %{"user" => %{"email" => email, "first_name" => "Nouveau"}})

      assert %{"data" => %{"email" => ^email, "role" => "member"}} = json_response(conn, 201)
      assert Accounts.get_user_by_email(email).hanko_id

      assert_email_sent(subject: "Bienvenue chez Repousse !", to: {"Nouveau", email})
    end
  end

  describe "POST /admin/users (authorization)" do
    test "admin creating an admin account is unauthorized", %{conn: conn, private_map: pm} do
      admin = insert(:admin_user)

      conn =
        conn
        |> authed(admin, pm)
        |> post(~p"/api/v1/admin/users", %{"user" => %{"email" => "new@example.com", "role" => "admin"}})

      assert json_response(conn, 401)
    end

    test "admin creating a superadmin account is unauthorized", %{conn: conn, private_map: pm} do
      admin = insert(:admin_user)

      conn =
        conn
        |> authed(admin, pm)
        |> post(~p"/api/v1/admin/users", %{"user" => %{"email" => "new2@example.com", "role" => "superadmin"}})

      assert json_response(conn, 401)
    end
  end

  describe "PUT /admin/users/:id" do
    test "admin updates a user's name", %{conn: conn, private_map: pm} do
      admin = insert(:admin_user)
      target = insert(:user)

      conn =
        conn
        |> authed(admin, pm)
        |> put(~p"/api/v1/admin/users/#{target.id}", %{"user" => %{"first_name" => "Nouveau"}})

      assert %{"data" => %{"first_name" => "Nouveau"}} = json_response(conn, 200)
    end

    test "updating a user cannot smuggle a role change", %{conn: conn, private_map: pm} do
      admin = insert(:admin_user)
      target = insert(:user)

      conn =
        conn
        |> authed(admin, pm)
        |> put(~p"/api/v1/admin/users/#{target.id}", %{"user" => %{"role" => "superadmin"}})

      assert %{"data" => %{"role" => "member"}} = json_response(conn, 200)
    end
  end

  describe "POST /admin/users/:id/suspend and /activate" do
    test "admin suspends then activates a user", %{conn: conn, private_map: pm} do
      admin = insert(:admin_user)
      target = insert(:user)

      conn1 = conn |> authed(admin, pm) |> post(~p"/api/v1/admin/users/#{target.id}/suspend")
      assert %{"data" => %{"status" => "suspended"}} = json_response(conn1, 200)

      conn2 = build_conn() |> authed(admin, pm) |> post(~p"/api/v1/admin/users/#{target.id}/activate")
      assert %{"data" => %{"status" => "active"}} = json_response(conn2, 200)
    end
  end

  describe "PATCH /admin/users/:id/role" do
    test "superadmin promotes a member to admin", %{conn: conn, private_map: pm} do
      superadmin = insert(:superadmin_user)
      target = insert(:user)

      conn =
        conn
        |> authed(superadmin, pm)
        |> patch(~p"/api/v1/admin/users/#{target.id}/role", %{"role" => "admin"})

      assert %{"data" => %{"role" => "admin"}} = json_response(conn, 200)
    end

    test "admin cannot assign roles", %{conn: conn, private_map: pm} do
      admin = insert(:admin_user)
      target = insert(:user)

      conn =
        conn
        |> authed(admin, pm)
        |> patch(~p"/api/v1/admin/users/#{target.id}/role", %{"role" => "admin"})

      assert json_response(conn, 401)
    end

    test "cannot demote the last remaining superadmin", %{conn: conn, private_map: pm} do
      superadmin = insert(:superadmin_user)

      conn =
        conn
        |> authed(superadmin, pm)
        |> patch(~p"/api/v1/admin/users/#{superadmin.id}/role", %{"role" => "member"})

      assert %{"error" => _} = json_response(conn, 422)
      assert Accounts.get_user!(superadmin.id).role == :superadmin
    end
  end
end
