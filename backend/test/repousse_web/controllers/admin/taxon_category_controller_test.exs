defmodule RepousseWeb.Admin.TaxonCategoryControllerTest do
  use RepousseWeb.ConnCase, async: true

  import Repousse.Factory

  alias RepousseWeb.Admin.TaxonCategoryController, as: Controller

  # These tests call the controller's `call/2` plug entry point directly
  # (same technique as `RequireRolePlugTest`) with `current_user` pre-assigned,
  # so they exercise the real `action_fallback`/Bodyguard wiring without
  # needing to simulate a signed Hanko JWT through the full router pipeline.
  # NOTE: in the *real* router, every one of these actions also sits behind
  # `pipe_through :admin` (`RequireRolePlug role: :admin`) — see
  # `taxon_editor_blocked_by_router_test.exs` for what that means in practice.
  defp call(conn, user, action, params \\ %{}) do
    conn
    |> Plug.Conn.assign(:current_user, user)
    |> Map.put(:params, params)
    |> Controller.call(action)
  end

  describe "index" do
    test "lists categories regardless of role (read-only, no Bodyguard gate)" do
      member = build(:user, role: :member, taxon_editor: false)
      category = insert(:taxon_category)

      conn = call(build_conn(), member, :index)

      assert %{"data" => data} = json_response(conn, 200)
      assert Enum.any?(data, &(&1["id"] == category.id))
    end
  end

  describe "create (US-TAX-01)" do
    test "plain member is denied" do
      member = build(:user, role: :member, taxon_editor: false)
      conn = call(build_conn(), member, :create, %{"taxon_category" => %{"name" => "Arbuste"}})

      assert json_response(conn, 401)
    end

    test "a member granted taxon_editor is allowed" do
      editor = build(:user, role: :member, taxon_editor: true)
      conn = call(build_conn(), editor, :create, %{"taxon_category" => %{"name" => "Arbuste"}})

      assert %{"data" => %{"name" => "Arbuste"}} = json_response(conn, 201)
    end

    test "platform admin is allowed" do
      admin = insert(:admin_user)
      conn = call(build_conn(), admin, :create, %{"taxon_category" => %{"name" => "Fruitier"}})

      assert %{"data" => %{"name" => "Fruitier"}} = json_response(conn, 201)
    end
  end

  describe "update (US-TAX-01)" do
    test "plain member is denied" do
      member = build(:user, role: :member, taxon_editor: false)
      category = insert(:taxon_category, name: "Ancien")

      conn =
        call(build_conn(), member, :update, %{
          "id" => category.id,
          "taxon_category" => %{"name" => "Nouveau"}
        })

      assert json_response(conn, 401)
    end

    test "platform admin is allowed" do
      admin = insert(:admin_user)
      category = insert(:taxon_category, name: "Ancien")

      conn =
        call(build_conn(), admin, :update, %{
          "id" => category.id,
          "taxon_category" => %{"name" => "Nouveau"}
        })

      assert %{"data" => %{"name" => "Nouveau"}} = json_response(conn, 200)
    end
  end

  describe "delete (US-TAX-01)" do
    test "plain member is denied" do
      member = build(:user, role: :member, taxon_editor: false)
      category = insert(:taxon_category)

      conn = call(build_conn(), member, :delete, %{"id" => category.id})

      assert json_response(conn, 401)
    end

    test "platform admin can delete an unused category" do
      admin = insert(:admin_user)
      category = insert(:taxon_category)

      conn = call(build_conn(), admin, :delete, %{"id" => category.id})

      assert conn.status == 204
    end

    test "platform admin cannot delete a category still used by a taxon" do
      admin = insert(:admin_user)
      category = insert(:taxon_category)
      insert(:taxon, category: category)

      conn = call(build_conn(), admin, :delete, %{"id" => category.id})

      assert %{"error" => message} = json_response(conn, 400)
      assert message =~ "taxons"
    end
  end
end
