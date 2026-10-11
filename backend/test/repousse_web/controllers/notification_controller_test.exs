defmodule RepousseWeb.NotificationControllerTest do
  use RepousseWeb.ConnCase, async: false

  import Repousse.Factory

  alias Repousse.AuthHelper
  alias Repousse.Notifications

  @table :hanko_jwks

  setup %{conn: conn} do
    {private_map, public_map} = AuthHelper.generate_jwk()
    :ets.insert(@table, {:keys, [public_map]})
    on_exit(fn -> :ets.delete_all_objects(@table) end)
    %{conn: conn, private_map: private_map}
  end

  defp authed(conn, user, pm),
    do: Plug.Conn.put_req_header(conn, "authorization", "Bearer #{AuthHelper.sign(user, pm)}")

  defp notify(user, title) do
    {:ok, n} = Notifications.notify(user, %{type: "t", title: title}, email: false)
    n
  end

  test "lists own notifications with unread count", %{conn: conn, private_map: pm} do
    user = insert(:user)
    notify(user, "Mine")
    notify(insert(:user), "Not mine")

    conn = conn |> authed(user, pm) |> get(~p"/api/v1/me/notifications")
    assert %{"data" => [%{"title" => "Mine"}], "meta" => %{"unread_count" => 1}} = json_response(conn, 200)
  end

  test "marks one and all as read", %{conn: conn, private_map: pm} do
    user = insert(:user)
    n = notify(user, "A")
    notify(user, "B")

    conn1 = conn |> authed(user, pm) |> post(~p"/api/v1/me/notifications/#{n.id}/read")
    assert %{"data" => %{"read_at" => read_at}} = json_response(conn1, 200)
    assert read_at

    conn2 = build_conn() |> authed(user, pm) |> get(~p"/api/v1/me/notifications/unread_count")
    assert %{"data" => %{"unread_count" => 1}} = json_response(conn2, 200)

    conn3 = build_conn() |> authed(user, pm) |> post(~p"/api/v1/me/notifications/read_all")
    assert %{"data" => %{"updated" => 1}} = json_response(conn3, 200)
  end

  test "cannot read someone else's notification", %{conn: conn, private_map: pm} do
    n = notify(insert(:user), "Private")
    conn = conn |> authed(insert(:user), pm) |> post(~p"/api/v1/me/notifications/#{n.id}/read")
    assert json_response(conn, 404)
  end
end
