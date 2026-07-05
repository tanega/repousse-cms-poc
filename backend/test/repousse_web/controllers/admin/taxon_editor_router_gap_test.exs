defmodule RepousseWeb.Admin.TaxonEditorRouterGapTest do
  @moduledoc """
  End-to-end (real router + real signed JWT) regression test for epic-05
  US-TAX-08/09: a member with `taxon_editor: true` (but no platform admin
  role) must be able to reach `/admin/taxa*` mutation routes. This used to
  be blocked by the router: those routes were declared under
  `pipe_through :admin` (`RequireRolePlug role: :admin`), which only checks
  the platform-wide `User.role` field and 403'd before the controller (and
  therefore `Repousse.Taxa.Policy`, which does allow `taxon_editor`) ever
  ran. Fixed by dropping the `:admin` pipe from this scope and relying on
  each action's own `Bodyguard.permit(Taxa.Policy, :manage_taxa, ...)` check.
  """
  use RepousseWeb.ConnCase, async: false

  import Repousse.Factory

  alias Repousse.TaxaAuthHelper

  test "a taxon_editor who is not a platform admin reaches the controller through the router" do
    editor = insert(:user, role: :member, taxon_editor: true)

    conn =
      build_conn()
      |> TaxaAuthHelper.put_jwt(editor)
      |> Plug.Conn.put_req_header("content-type", "application/json")
      |> post("/api/v1/admin/taxa/categories", %{"taxon_category" => %{"name" => "Grimpante"}})

    assert conn.status == 201
  end

  test "a plain member (no taxon_editor, no admin) is still rejected by Bodyguard" do
    member = insert(:user, role: :member, taxon_editor: false)

    conn =
      build_conn()
      |> TaxaAuthHelper.put_jwt(member)
      |> Plug.Conn.put_req_header("content-type", "application/json")
      |> post("/api/v1/admin/taxa/categories", %{"taxon_category" => %{"name" => "Grimpante"}})

    assert conn.status == 401
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
