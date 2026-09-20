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

  describe "PUT /api/v1/me/visibility" do
    test "switches the profile to public", %{conn: conn, private_map: pm} do
      user = insert(:user, profile_visibility: :private)

      conn =
        conn
        |> authed(user, pm)
        |> put(~p"/api/v1/me/visibility", %{"profile_visibility" => "public"})

      assert %{"data" => %{"profile_visibility" => "public"}} = json_response(conn, 200)
    end

    test "rejects an unknown visibility", %{conn: conn, private_map: pm} do
      conn =
        conn
        |> authed(insert(:user), pm)
        |> put(~p"/api/v1/me/visibility", %{"profile_visibility" => "semi-public"})

      assert json_response(conn, 422)
    end
  end

  describe "PUT /api/v1/me/profiles" do
    test "adds the missing profiles and removes the extra ones", %{conn: conn, private_map: pm} do
      user = insert(:user)
      insert(:user_profile, user: user, profile_type: :volunteer)
      insert(:user_profile, user: user, profile_type: :adoptant)

      conn =
        conn
        |> authed(user, pm)
        |> put(~p"/api/v1/me/profiles", %{"profiles" => ["volunteer", "host_family"]})

      assert %{"data" => data} = json_response(conn, 200)
      types = data |> Enum.map(& &1["profile_type"]) |> Enum.sort()
      assert types == ["host_family", "volunteer"]
    end

    test "leaves an already-active profile untouched", %{conn: conn, private_map: pm} do
      user = insert(:user)

      profile =
        insert(:user_profile, user: user, profile_type: :host_family, hosting_capacity: 80)

      conn =
        conn
        |> authed(user, pm)
        |> put(~p"/api/v1/me/profiles", %{"profiles" => ["host_family", "volunteer"]})

      assert %{"data" => data} = json_response(conn, 200)
      kept = Enum.find(data, &(&1["profile_type"] == "host_family"))
      assert kept["id"] == profile.id
      assert kept["hosting_capacity"] == 80
    end

    test "refuses an empty list", %{conn: conn, private_map: pm} do
      user = insert(:user)
      insert(:user_profile, user: user, profile_type: :volunteer)

      conn = conn |> authed(user, pm) |> put(~p"/api/v1/me/profiles", %{"profiles" => []})

      assert %{"error" => error} = json_response(conn, 422)
      assert error =~ "Au moins un profil"
    end

    test "refuses an unknown profile type", %{conn: conn, private_map: pm} do
      conn =
        conn
        |> authed(insert(:user), pm)
        |> put(~p"/api/v1/me/profiles", %{"profiles" => ["coordinateur"]})

      assert json_response(conn, 422)
    end

    test "refuses to drop host_family while nurseries remain", %{conn: conn, private_map: pm} do
      user = insert(:user)
      insert(:user_profile, user: user, profile_type: :volunteer)
      insert(:user_profile, user: user, profile_type: :host_family)
      insert(:nursery, user: user)

      conn =
        conn
        |> authed(user, pm)
        |> put(~p"/api/v1/me/profiles", %{"profiles" => ["volunteer"]})

      assert %{"error" => error, "details" => %{"nurseries_remaining" => 1}} =
               json_response(conn, 422)

      assert error =~ "Famille d'accueil"
      assert Repousse.Accounts.get_profile(user.id, :host_family)
    end

    test "allows dropping host_family once the nurseries are archived", %{
      conn: conn,
      private_map: pm
    } do
      user = insert(:user)
      insert(:user_profile, user: user, profile_type: :volunteer)
      insert(:user_profile, user: user, profile_type: :host_family)
      insert(:nursery, user: user, archived_at: DateTime.utc_now(:second))

      conn =
        conn
        |> authed(user, pm)
        |> put(~p"/api/v1/me/profiles", %{"profiles" => ["volunteer"]})

      assert %{"data" => [%{"profile_type" => "volunteer"}]} = json_response(conn, 200)
    end
  end

  describe "PUT /api/v1/me/profiles/:profile_type" do
    test "persists the host family hosting details", %{conn: conn, private_map: pm} do
      user = insert(:user)
      insert(:user_profile, user: user, profile_type: :host_family)
      taxon = insert(:taxon)

      conn =
        conn
        |> authed(user, pm)
        |> put(~p"/api/v1/me/profiles/host_family", %{
          "profile" => %{
            "hosting_capacity" => 150,
            "hosting_surface_m2" => 42.5,
            "hosting_address" => "3 impasse du Verger",
            "hosting_availability" => "Toute l'année",
            "hosting_equipment" => ["greenhouse", "auto_watering"],
            "hosted_species" => [%{"taxon_id" => taxon.id}]
          }
        })

      assert %{"data" => data} = json_response(conn, 200)
      assert data["hosting_capacity"] == 150
      assert data["hosting_surface_m2"] == 42.5
      assert data["hosting_equipment"] == ["greenhouse", "auto_watering"]
      assert [%{"taxon_id" => taxon_id}] = data["hosted_species"]
      assert taxon_id == taxon.id
    end

    test "rejects unknown equipment", %{conn: conn, private_map: pm} do
      user = insert(:user)
      insert(:user_profile, user: user, profile_type: :host_family)

      conn =
        conn
        |> authed(user, pm)
        |> put(~p"/api/v1/me/profiles/host_family", %{
          "profile" => %{"hosting_equipment" => ["piscine"]}
        })

      assert json_response(conn, 422)
    end

    test "422s when the profile isn't active", %{conn: conn, private_map: pm} do
      conn =
        conn
        |> authed(insert(:user), pm)
        |> put(~p"/api/v1/me/profiles/host_family", %{"profile" => %{"hosting_capacity" => 10}})

      assert json_response(conn, 422)
    end
  end
end
