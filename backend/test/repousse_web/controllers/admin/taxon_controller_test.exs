defmodule RepousseWeb.Admin.TaxonControllerTest do
  use RepousseWeb.ConnCase, async: false

  import Repousse.Factory

  alias Repousse.AuthHelper
  alias Repousse.Taxa

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

  describe "POST /admin/taxa" do
    test "admin creates a taxon", %{conn: conn, private_map: pm} do
      admin = insert(:admin_user)

      conn =
        conn
        |> authed(admin, pm)
        |> post(~p"/api/v1/admin/taxa", %{
          "taxon" => %{
            "common_name" => "Noisetier",
            "scientific_name" => "Corylus avellana",
            "taxonomic_level" => "species"
          }
        })

      assert %{"data" => %{"common_name" => "Noisetier"}} = json_response(conn, 201)
    end

    test "a non-admin gets forbidden", %{conn: conn, private_map: pm} do
      user = insert(:user)

      conn =
        conn
        |> authed(user, pm)
        |> post(~p"/api/v1/admin/taxa", %{"taxon" => %{"common_name" => "Noisetier"}})

      assert json_response(conn, 403)
    end
  end

  describe "PUT /admin/taxa/:id" do
    test "admin updates a taxon and records a version", %{conn: conn, private_map: pm} do
      admin = insert(:admin_user)
      taxon = insert(:taxon, common_name: "Merisier")

      conn =
        conn
        |> authed(admin, pm)
        |> put(~p"/api/v1/admin/taxa/#{taxon.id}", %{"taxon" => %{"common_name" => "Merisier sauvage"}})

      assert %{"data" => %{"common_name" => "Merisier sauvage"}} = json_response(conn, 200)
      assert [_version] = Taxa.list_taxon_versions(taxon.id)
    end
  end

  describe "DELETE /admin/taxa/:id" do
    test "admin deletes a taxon with no dependents", %{conn: conn, private_map: pm} do
      admin = insert(:admin_user)
      taxon = insert(:taxon)

      conn = conn |> authed(admin, pm) |> delete(~p"/api/v1/admin/taxa/#{taxon.id}")

      assert response(conn, 204)
      assert Taxa.get_taxon(taxon.id) == nil
    end
  end

  describe "GET /admin/taxa/:id/versions" do
    test "admin lists a taxon's version history", %{conn: conn, private_map: pm} do
      admin = insert(:admin_user)
      taxon = insert(:taxon)
      insert(:taxon_version, taxon: taxon, changed_by: admin)

      conn = conn |> authed(admin, pm) |> get(~p"/api/v1/admin/taxa/#{taxon.id}/versions")

      assert %{"data" => [_ | _]} = json_response(conn, 200)
    end
  end

  describe "POST /admin/taxa/:id/restore/:version_id" do
    test "admin restores a taxon to a previous version", %{conn: conn, private_map: pm} do
      admin = insert(:admin_user)
      taxon = insert(:taxon, common_name: "Nom actuel")

      version =
        insert(:taxon_version,
          taxon: taxon,
          changed_by: admin,
          snapshot: %{"common_name" => "Nom original"}
        )

      conn =
        conn
        |> authed(admin, pm)
        |> post(~p"/api/v1/admin/taxa/#{taxon.id}/restore/#{version.id}")

      assert %{"data" => %{"common_name" => "Nom original"}} = json_response(conn, 200)
    end
  end
end
