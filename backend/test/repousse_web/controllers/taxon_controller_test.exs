defmodule RepousseWeb.TaxonControllerTest do
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

  describe "GET /taxa" do
    test "lists taxa", %{conn: conn, private_map: pm} do
      user = insert(:user)
      insert(:taxon, common_name: "Merisier")

      conn = conn |> authed(user, pm) |> get(~p"/api/v1/taxa")

      assert %{"data" => taxa} = json_response(conn, 200)
      assert Enum.any?(taxa, &(&1["common_name"] == "Merisier"))
    end

    test "searches taxa with ?q=", %{conn: conn, private_map: pm} do
      user = insert(:user)
      insert(:taxon, common_name: "Merisier")
      insert(:taxon, common_name: "Chêne")

      conn = conn |> authed(user, pm) |> get(~p"/api/v1/taxa?q=Meri")

      assert %{"data" => [%{"common_name" => "Merisier"}]} = json_response(conn, 200)
    end
  end

  describe "GET /taxa/:id" do
    test "gets a taxon", %{conn: conn, private_map: pm} do
      user = insert(:user)
      taxon = insert(:taxon)

      conn = conn |> authed(user, pm) |> get(~p"/api/v1/taxa/#{taxon.id}")

      assert %{"data" => %{"id" => id}} = json_response(conn, 200)
      assert id == taxon.id
    end
  end
end
