defmodule RepousseWeb.NurseryControllerTest do
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

  defp host_family_user do
    user = insert(:user)
    insert(:user_profile, user: user, profile_type: :host_family)
    user
  end

  describe "POST /api/v1/me/nurseries" do
    test "creates a nursery with its plant lines", %{conn: conn, private_map: pm} do
      user = host_family_user()
      taxon = insert(:taxon)

      conn =
        conn
        |> authed(user, pm)
        |> post(~p"/api/v1/me/nurseries", %{
          "nursery" => %{
            "name" => "Serre du jardin",
            "notes" => "Exposition sud",
            "address" => "12 rue des Lilas, 75020 Paris",
            "lat" => 48.8674,
            "lng" => 2.3987,
            "plants" => [%{"taxon_id" => taxon.id, "quantity" => 24, "note" => "Semis 2025"}]
          }
        })

      assert %{"data" => data} = json_response(conn, 201)
      assert data["name"] == "Serre du jardin"
      assert [%{"taxon_id" => taxon_id, "quantity" => 24}] = data["plants"]
      assert taxon_id == taxon.id
    end

    test "refuses creation without the host_family profile", %{conn: conn, private_map: pm} do
      user = insert(:user)
      insert(:user_profile, user: user, profile_type: :adoptant)

      conn =
        conn
        |> authed(user, pm)
        |> post(~p"/api/v1/me/nurseries", %{"nursery" => %{"name" => "Serre"}})

      assert %{"error" => error} = json_response(conn, 422)
      assert error =~ "Famille d'accueil"
    end

    test "rejects a negative quantity", %{conn: conn, private_map: pm} do
      user = host_family_user()
      taxon = insert(:taxon)

      conn =
        conn
        |> authed(user, pm)
        |> post(~p"/api/v1/me/nurseries", %{
          "nursery" => %{
            "name" => "Serre",
            "plants" => [%{"taxon_id" => taxon.id, "quantity" => -3}]
          }
        })

      assert json_response(conn, 422)
    end
  end

  describe "GET /api/v1/me/nurseries" do
    test "lists own non-archived nurseries only", %{conn: conn, private_map: pm} do
      user = host_family_user()
      insert(:nursery, user: user, name: "Active")
      insert(:nursery, user: user, name: "Archivée", archived_at: DateTime.utc_now(:second))
      insert(:nursery, user: insert(:user), name: "Chez quelqu'un d'autre")

      conn = conn |> authed(user, pm) |> get(~p"/api/v1/me/nurseries")

      assert %{"data" => [%{"name" => "Active"}]} = json_response(conn, 200)
    end
  end

  describe "PUT /api/v1/me/nurseries/:id" do
    test "replaces the whole plant list", %{conn: conn, private_map: pm} do
      user = host_family_user()
      nursery = insert(:nursery, user: user)
      insert(:nursery_plant, nursery: nursery, taxon: insert(:taxon), quantity: 5)
      replacement = insert(:taxon)

      conn =
        conn
        |> authed(user, pm)
        |> put(~p"/api/v1/me/nurseries/#{nursery.id}", %{
          "nursery" => %{
            "name" => nursery.name,
            "plants" => [%{"taxon_id" => replacement.id, "quantity" => 40}]
          }
        })

      assert %{"data" => %{"plants" => plants}} = json_response(conn, 200)
      assert [%{"taxon_id" => taxon_id, "quantity" => 40}] = plants
      assert taxon_id == replacement.id
    end

    test "another member cannot update someone else's nursery", %{conn: conn, private_map: pm} do
      nursery = insert(:nursery, user: host_family_user())

      conn =
        conn
        |> authed(insert(:user), pm)
        |> put(~p"/api/v1/me/nurseries/#{nursery.id}", %{"nursery" => %{"name" => "Détournée"}})

      assert json_response(conn, 401)
    end
  end

  describe "DELETE /api/v1/me/nurseries/:id" do
    test "archives rather than deletes", %{conn: conn, private_map: pm} do
      user = host_family_user()
      nursery = insert(:nursery, user: user)

      conn = conn |> authed(user, pm) |> delete(~p"/api/v1/me/nurseries/#{nursery.id}")

      assert %{"data" => %{"archived_at" => archived_at}} = json_response(conn, 200)
      assert archived_at
      assert Repousse.Repo.get(Repousse.Nurseries.Nursery, nursery.id)
    end
  end

  describe "GET /api/v1/admin/nurseries" do
    test "a coordinator sees nurseries of private profiles", %{conn: conn, private_map: pm} do
      owner = insert(:user, profile_visibility: :private)
      insert(:nursery, user: owner, name: "Réserve discrète")

      conn = conn |> authed(insert(:admin_user), pm) |> get(~p"/api/v1/admin/nurseries")

      assert %{"data" => [%{"name" => "Réserve discrète"}]} = json_response(conn, 200)
    end

    test "filters by taxon", %{conn: conn, private_map: pm} do
      wanted = insert(:taxon)
      matching = insert(:nursery, name: "Avec le taxon")
      insert(:nursery_plant, nursery: matching, taxon: wanted, quantity: 3)
      other = insert(:nursery, name: "Sans le taxon")
      insert(:nursery_plant, nursery: other, taxon: insert(:taxon), quantity: 3)

      conn =
        conn
        |> authed(insert(:admin_user), pm)
        |> get(~p"/api/v1/admin/nurseries?taxon_id=#{wanted.id}")

      assert %{"data" => [%{"name" => "Avec le taxon"}]} = json_response(conn, 200)
    end

    test "a plain member is refused", %{conn: conn, private_map: pm} do
      conn = conn |> authed(insert(:user), pm) |> get(~p"/api/v1/admin/nurseries")

      assert json_response(conn, 403)
    end
  end
end
