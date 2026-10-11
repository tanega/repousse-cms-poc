defmodule RepousseWeb.Admin.ProfileRequestControllerTest do
  use RepousseWeb.ConnCase, async: false

  import Repousse.Factory

  alias Repousse.Accounts
  alias Repousse.AuthHelper

  @table :hanko_jwks

  setup %{conn: conn} do
    {private_map, public_map} = AuthHelper.generate_jwk()
    :ets.insert(@table, {:keys, [public_map]})
    on_exit(fn -> :ets.delete_all_objects(@table) end)
    %{conn: conn, private_map: private_map}
  end

  defp authed(conn, user, pm),
    do: Plug.Conn.put_req_header(conn, "authorization", "Bearer #{AuthHelper.sign(user, pm)}")

  test "member requests a profile through the API", %{conn: conn, private_map: pm} do
    user = insert(:user)
    admin = insert(:admin_user)

    conn = conn |> authed(user, pm) |> post(~p"/api/v1/me/profiles/host_family/request", %{"profile" => %{"hosting_capacity" => 80, "hosting_address" => "Paris"}})
    assert %{"data" => %{"status" => "pending", "profile_type" => "host_family"}} = json_response(conn, 201)
    assert Accounts.count_pending_profile_requests() == 1
    assert [_] = Repousse.Notifications.list_for_user(admin)
  end

  test "a Famille d'accueil request without hosting details is refused", %{conn: conn, private_map: pm} do
    conn = conn |> authed(insert(:user), pm) |> post(~p"/api/v1/me/profiles/host_family/request")
    assert %{"details" => %{"hosting_capacity" => _}} = json_response(conn, 422)
  end

  test "PUT /me/profiles refuses to add a gated profile", %{conn: conn, private_map: pm} do
    user = insert(:user)
    insert(:user_profile, user: user, profile_type: :volunteer)

    conn = conn |> authed(user, pm) |> put(~p"/api/v1/me/profiles", %{"profiles" => ["volunteer", "adoptant"]})
    assert json_response(conn, 422)
  end

  test "admin lists, approves and rejects", %{conn: conn, private_map: pm} do
    admin = insert(:admin_user)
    u1 = insert(:user)
    u2 = insert(:user)
    {:ok, p1} = Accounts.request_profile(u1, "adoptant")
    {:ok, p2} = Accounts.request_profile(u2, "host_family", %{"hosting_capacity" => 40, "hosting_address" => "Lyon"})

    list = conn |> authed(admin, pm) |> get(~p"/api/v1/admin/profile_requests")
    assert %{"data" => data, "meta" => %{"pending_count" => 2}} = json_response(list, 200)
    assert [%{"user" => %{"email" => _}, "details" => nil}, %{"details" => %{"hosting_capacity" => 40, "hosting_address" => "Lyon"}}] = data

    ok = build_conn() |> authed(admin, pm) |> post(~p"/api/v1/admin/profile_requests/#{p1.id}/approve")
    assert %{"data" => %{"status" => "active"}} = json_response(ok, 200)

    ko =
      build_conn()
      |> authed(admin, pm)
      |> post(~p"/api/v1/admin/profile_requests/#{p2.id}/reject", %{"reason" => "Pas de local"})

    assert %{"data" => %{"status" => "rejected", "rejection_reason" => "Pas de local"}} = json_response(ko, 200)

    again = build_conn() |> authed(admin, pm) |> post(~p"/api/v1/admin/profile_requests/#{p1.id}/approve")
    assert json_response(again, 409)

    count = build_conn() |> authed(admin, pm) |> get(~p"/api/v1/admin/profile_requests/count")
    assert %{"data" => %{"pending_count" => 0}} = json_response(count, 200)
  end

  test "non-admins are refused", %{conn: conn, private_map: pm} do
    conn = conn |> authed(insert(:user), pm) |> get(~p"/api/v1/admin/profile_requests")
    assert json_response(conn, 403)
  end
end
