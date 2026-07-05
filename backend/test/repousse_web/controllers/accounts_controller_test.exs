defmodule RepousseWeb.AccountsControllerTest do
  use RepousseWeb.ConnCase, async: true

  import Repousse.Factory

  alias Repousse.Accounts
  alias RepousseWeb.AccountsController

  defp dispatch(action, user, params \\ %{}) do
    build_conn()
    |> Plug.Conn.assign(:current_user, user)
    |> Map.put(:params, params)
    |> AccountsController.call(action)
  end

  describe "update_profiles/2 — epic-02 US-AUTH-09 / epic-03 US-PROFIL-04" do
    test "selects volunteer (default proposed profile)" do
      user = insert(:user)
      conn = dispatch(:update_profiles, user, %{"profiles" => ["volunteer"]})

      assert conn.status == 200
      assert Enum.map(Accounts.list_profiles(user), & &1.profile_type) == [:volunteer]
    end

    test "allows selecting multiple profiles at once" do
      user = insert(:user)
      conn = dispatch(:update_profiles, user, %{"profiles" => ["volunteer", "adoptant"]})

      assert conn.status == 200
      types = Accounts.list_profiles(user) |> Enum.map(& &1.profile_type) |> Enum.sort()
      assert types == [:adoptant, :volunteer]
    end

    test "rejects an empty profile list — at least one profile required" do
      user = insert(:user)
      conn = dispatch(:update_profiles, user, %{"profiles" => []})

      assert conn.status == 422
    end

    # "Le profil Administrateur n'est pas proposé à l'auto-sélection dans cette version"
    test "rejects the admin profile — not self-selectable" do
      user = insert(:user)
      conn = dispatch(:update_profiles, user, %{"profiles" => ["admin"]})

      assert conn.status == 422
      assert Accounts.list_profiles(user) == []
    end

    test "rejects an unknown profile type" do
      user = insert(:user)
      conn = dispatch(:update_profiles, user, %{"profiles" => ["not_a_profile"]})

      assert conn.status == 422
    end
  end
end
