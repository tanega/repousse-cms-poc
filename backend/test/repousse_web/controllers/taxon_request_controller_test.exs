defmodule RepousseWeb.TaxonRequestControllerTest do
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

  defp authed(conn, user, pm),
    do: Plug.Conn.put_req_header(conn, "authorization", "Bearer #{AuthHelper.sign(user, pm)}")

  test "member files a request and lists it", %{conn: conn, private_map: pm} do
    member = insert(:user)

    c1 = conn |> authed(member, pm) |> post(~p"/api/v1/me/taxon_requests", %{"taxon_request" => %{"common_name" => "Poirier"}})
    assert %{"data" => %{"status" => "pending", "common_name" => "Poirier"}} = json_response(c1, 201)

    c2 = build_conn() |> authed(member, pm) |> get(~p"/api/v1/me/taxon_requests")
    assert %{"data" => [%{"common_name" => "Poirier"}]} = json_response(c2, 200)
  end

  test "rejects a request without any name", %{conn: conn, private_map: pm} do
    c = conn |> authed(insert(:user), pm) |> post(~p"/api/v1/me/taxon_requests", %{"taxon_request" => %{"comment" => "?"}})
    assert json_response(c, 422)
  end

  test "managers list, approve and reject; plain members are refused", %{conn: conn, private_map: pm} do
    member = insert(:user)
    editor = insert(:user, taxon_editor: true)
    admin = insert(:admin_user)

    {:ok, r1} = Repousse.Taxa.Requests.create(member, %{"common_name" => "Poirier"})
    {:ok, r2} = Repousse.Taxa.Requests.create(member, %{"common_name" => "Pommier"})

    denied = conn |> authed(member, pm) |> get(~p"/api/v1/admin/taxon_requests")
    assert json_response(denied, 401)

    list = build_conn() |> authed(editor, pm) |> get(~p"/api/v1/admin/taxon_requests")
    assert %{"data" => [_, _], "meta" => %{"pending_count" => 2}} = json_response(list, 200)

    ok =
      build_conn()
      |> authed(admin, pm)
      |> post(~p"/api/v1/admin/taxon_requests/#{r1.id}/approve", %{
        "taxon" => %{"common_name" => "Poirier", "scientific_name" => "Pyrus communis", "taxonomic_level" => "species"}
      })

    assert %{"data" => %{"status" => "approved", "taxon_id" => tid}} = json_response(ok, 200)
    assert tid

    ko =
      build_conn()
      |> authed(editor, pm)
      |> post(~p"/api/v1/admin/taxon_requests/#{r2.id}/reject", %{"reason" => "Hors liste"})

    assert %{"data" => %{"status" => "rejected", "rejection_reason" => "Hors liste"}} = json_response(ko, 200)

    again = build_conn() |> authed(admin, pm) |> post(~p"/api/v1/admin/taxon_requests/#{r1.id}/reject")
    assert json_response(again, 409)
  end
end
