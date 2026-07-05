defmodule RepousseWeb.Admin.TaxonEditorRouterGapTest do
  @moduledoc """
  End-to-end (real router + real signed JWT) regression test documenting a
  known architecture gap for epic-05: `Repousse.Taxa.Policy` allows a member
  with `taxon_editor: true` to perform `:manage_taxa` actions, but every
  `/admin/taxa*` route is declared under `pipe_through :admin`
  (`RequireRolePlug role: :admin`), which only checks the platform-wide
  `User.role` field and 403s *before* the controller (and therefore
  Bodyguard) ever runs. A `taxon_editor` who isn't also a platform admin
  currently cannot reach any taxa endpoint at all — including the ones
  US-TAX-08/US-TAX-09 say they should be able to use (external links,
  community resources). Fixing this needs a router change (splitting those
  actions out from under the admin-only pipe, or relaxing
  `RequireRolePlug`), which is out of scope here — see the final report.
  """
  use RepousseWeb.ConnCase, async: false

  import Repousse.Factory

  alias Repousse.TaxaAuthHelper

  test "a taxon_editor who is not a platform admin is 403'd by the router before reaching Bodyguard" do
    editor = insert(:user, role: :member, taxon_editor: true)

    conn =
      build_conn()
      |> TaxaAuthHelper.put_jwt(editor)
      |> Plug.Conn.put_req_header("content-type", "application/json")
      |> post("/api/v1/admin/taxa/categories", %{"taxon_category" => %{"name" => "Grimpante"}})

    assert conn.status == 403
  end

  test "a platform admin reaches the controller through the same route" do
    admin = insert(:admin_user)

    conn =
      build_conn()
      |> TaxaAuthHelper.put_jwt(admin)
      |> Plug.Conn.put_req_header("content-type", "application/json")
      |> post("/api/v1/admin/taxa/categories", %{"taxon_category" => %{"name" => "Grimpante"}})

    assert conn.status == 201
  end
end
