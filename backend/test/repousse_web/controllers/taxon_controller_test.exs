defmodule RepousseWeb.TaxonControllerTest do
  use RepousseWeb.ConnCase, async: true

  import Repousse.Factory

  alias RepousseWeb.TaxonController, as: Controller

  # US-TAX-10/US-TAX-11: read-only, no Bodyguard gate — any authenticated
  # user (any role, no taxon_editor flag needed) can browse/search/consult.
  defp call(conn, user, action, params \\ %{}) do
    conn
    |> Plug.Conn.assign(:current_user, user)
    |> Map.put(:params, params)
    |> Controller.call(action)
  end

  test "index lists taxa for a plain member" do
    member = build(:user, role: :member, taxon_editor: false)
    taxon = insert(:taxon)

    conn = call(build_conn(), member, :index)

    assert %{"data" => data} = json_response(conn, 200)
    assert Enum.any?(data, &(&1["id"] == taxon.id))
  end

  test "index with `q` searches scientific and common name" do
    member = build(:user, role: :member, taxon_editor: false)
    insert(:taxon, scientific_name: "Prunus avium", common_name: "Merisier")
    insert(:taxon, scientific_name: "Pyrus communis", common_name: "Poirier")

    conn = call(build_conn(), member, :index, %{"q" => "avium"})

    assert %{"data" => [%{"common_name" => "Merisier"}]} = json_response(conn, 200)
  end

  test "show returns a taxon's detail" do
    member = build(:user, role: :member, taxon_editor: false)
    taxon = insert(:taxon)

    conn = call(build_conn(), member, :show, %{"id" => taxon.id})

    assert %{"data" => %{"id" => id}} = json_response(conn, 200)
    assert id == taxon.id
  end
end
