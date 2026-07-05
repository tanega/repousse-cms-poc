defmodule RepousseWeb.Admin.TaxonControllerTest do
  use RepousseWeb.ConnCase, async: true

  import Repousse.Factory

  alias Repousse.Taxa
  alias RepousseWeb.Admin.TaxonController, as: Controller

  # Same technique as `Admin.TaxonCategoryControllerTest`: call the plug
  # entry point directly with `current_user` pre-assigned to exercise
  # action_fallback/Bodyguard without simulating the full auth pipeline.
  defp call(conn, user, action, params \\ %{}) do
    conn
    |> Plug.Conn.assign(:current_user, user)
    |> Map.put(:params, params)
    |> Controller.call(action)
  end

  describe "index/show (read, no Bodyguard gate)" do
    test "any authenticated user can list and show taxa" do
      member = build(:user, role: :member, taxon_editor: false)
      taxon = insert(:taxon)

      index_conn = call(build_conn(), member, :index)
      assert %{"data" => data} = json_response(index_conn, 200)
      assert Enum.any?(data, &(&1["id"] == taxon.id))

      show_conn = call(build_conn(), member, :show, %{"id" => taxon.id})
      assert %{"data" => %{"id" => id}} = json_response(show_conn, 200)
      assert id == taxon.id
    end
  end

  describe "create (US-TAX-02)" do
    test "plain member is denied" do
      category = insert(:taxon_category)
      member = build(:user, role: :member, taxon_editor: false)

      params = %{
        "taxon" => %{
          "scientific_name" => "Quercus robur",
          "common_name" => "Chêne pédonculé",
          "taxonomic_level" => "species",
          "category_id" => category.id
        }
      }

      conn = call(build_conn(), member, :create, params)
      assert json_response(conn, 401)
    end

    test "a member granted taxon_editor can create a taxon" do
      category = insert(:taxon_category)
      editor = build(:user, role: :member, taxon_editor: true)

      params = %{
        "taxon" => %{
          "scientific_name" => "Quercus robur",
          "common_name" => "Chêne pédonculé",
          "taxonomic_level" => "species",
          "category_id" => category.id
        }
      }

      conn = call(build_conn(), editor, :create, params)
      assert %{"data" => %{"common_name" => "Chêne pédonculé"}} = json_response(conn, 201)
    end

    test "platform admin can create a non-taxonomic entry without a scientific name" do
      category = insert(:taxon_category)
      admin = insert(:admin_user)

      params = %{
        "taxon" => %{
          "common_name" => "Plante grimpante non identifiée",
          "is_non_taxonomic" => true,
          "category_id" => category.id
        }
      }

      conn = call(build_conn(), admin, :create, params)
      assert %{"data" => %{"is_non_taxonomic" => true}} = json_response(conn, 201)
    end

    test "validation errors surface as 422" do
      admin = insert(:admin_user)

      conn = call(build_conn(), admin, :create, %{"taxon" => %{"common_name" => ""}})
      assert %{"error" => "Validation failed"} = json_response(conn, 422)
    end
  end

  describe "update (US-TAX-04)" do
    test "plain member is denied" do
      taxon = insert(:taxon)
      member = build(:user, role: :member, taxon_editor: false)

      conn =
        call(build_conn(), member, :update, %{
          "id" => taxon.id,
          "taxon" => %{"common_name" => "X"}
        })

      assert json_response(conn, 401)
    end

    test "a member granted taxon_editor can update and it is versioned" do
      taxon = insert(:taxon, common_name: "Ancien nom")
      editor = build(:user, role: :member, taxon_editor: true) |> persist_user()

      conn =
        call(build_conn(), editor, :update, %{
          "id" => taxon.id,
          "taxon" => %{"common_name" => "Nouveau nom"}
        })

      assert %{"data" => %{"common_name" => "Nouveau nom"}} = json_response(conn, 200)
      assert [%{snapshot: %{"common_name" => "Ancien nom"}}] = Taxa.list_taxon_versions(taxon.id)
    end
  end

  describe "delete (US-TAX-03, US-TAX-06)" do
    test "plain member is denied" do
      taxon = insert(:taxon)
      member = build(:user, role: :member, taxon_editor: false)

      conn = call(build_conn(), member, :delete, %{"id" => taxon.id})
      assert json_response(conn, 401)
    end

    test "platform admin can delete a taxon with no dependents" do
      taxon = insert(:taxon)
      admin = insert(:admin_user)

      conn = call(build_conn(), admin, :delete, %{"id" => taxon.id})
      assert conn.status == 204
      refute Taxa.get_taxon(taxon.id)
    end

    test "platform admin cannot delete a taxon that has children" do
      parent = insert(:taxon)
      insert(:taxon, parent: parent)
      admin = insert(:admin_user)

      conn = call(build_conn(), admin, :delete, %{"id" => parent.id})
      assert %{"error" => message} = json_response(conn, 400)
      assert message =~ "enfants"
    end
  end

  describe "versions + restore (US-TAX-05)" do
    test "versions lists the history for any allowed caller" do
      taxon = insert(:taxon, common_name: "V1")
      user = insert(:user)
      {:ok, _} = Taxa.update_taxon(taxon, %{common_name: "V2"}, user)

      admin = insert(:admin_user)
      conn = call(build_conn(), admin, :versions, %{"id" => taxon.id})

      assert %{"data" => [%{"snapshot" => %{"common_name" => "V1"}}]} = json_response(conn, 200)
    end

    test "restore is denied for a plain member" do
      taxon = insert(:taxon, common_name: "V1")
      user = insert(:user)
      {:ok, _} = Taxa.update_taxon(taxon, %{common_name: "V2"}, user)
      [version] = Taxa.list_taxon_versions(taxon.id)

      member = build(:user, role: :member, taxon_editor: false)
      conn = call(build_conn(), member, :restore, %{"id" => taxon.id, "version_id" => version.id})

      assert json_response(conn, 401)
    end

    test "a member granted taxon_editor can restore a prior version, creating a new version rather than overwriting" do
      taxon = insert(:taxon, common_name: "V1")
      user = insert(:user)
      {:ok, _} = Taxa.update_taxon(taxon, %{common_name: "V2"}, user)
      [version_to_restore] = Taxa.list_taxon_versions(taxon.id)

      editor = build(:user, role: :member, taxon_editor: true) |> persist_user()

      conn =
        call(build_conn(), editor, :restore, %{
          "id" => taxon.id,
          "version_id" => version_to_restore.id
        })

      assert %{"data" => %{"common_name" => "V1"}} = json_response(conn, 200)
      assert length(Taxa.list_taxon_versions(taxon.id)) == 2
    end
  end

  # `Taxa.update_taxon/3` needs a persisted `changed_by_id`, so this helper
  # inserts the freshly-built factory user (as opposed to the read-only
  # authorization tests above, where an in-memory `build/2` struct is enough
  # since `Repousse.Taxa.Policy` only reads `role`/`taxon_editor`).
  defp persist_user(user), do: Repousse.Repo.insert!(user)
end
