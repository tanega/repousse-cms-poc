defmodule RepousseWeb.WaitlistControllerTest do
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

  describe "POST /distributions/:id/waitlist" do
    test "joins the waitlist for a taxon", %{conn: conn, private_map: pm} do
      user = insert(:user)
      event = insert(:distribution_event)
      taxon = insert(:taxon)

      conn =
        conn
        |> authed(user, pm)
        |> post(~p"/api/v1/distributions/#{event.id}/waitlist?taxon_id=#{taxon.id}")

      assert %{"data" => %{"status" => "waiting", "position" => 1}} = json_response(conn, 201)
    end
  end

  describe "DELETE /distributions/:id/waitlist" do
    test "leaves the waitlist for a taxon", %{conn: conn, private_map: pm} do
      user = insert(:user)
      event = insert(:distribution_event)
      taxon = insert(:taxon)
      insert(:waitlist_entry, user: user, event: event, taxon: taxon)

      conn =
        conn
        |> authed(user, pm)
        |> delete(~p"/api/v1/distributions/#{event.id}/waitlist?taxon_id=#{taxon.id}")

      assert response(conn, 204)
      assert Distributions.leave_waitlist(user.id, event.id, taxon.id) == {:error, :not_found}
    end
  end
end
