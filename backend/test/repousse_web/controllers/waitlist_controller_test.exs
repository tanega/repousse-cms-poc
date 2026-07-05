defmodule RepousseWeb.WaitlistControllerTest do
  use RepousseWeb.ConnCase, async: true

  import Repousse.Factory

  alias RepousseWeb.WaitlistController

  setup do
    event = insert(:distribution_event, status: :published)
    taxon = insert(:taxon)

    %{event: event, taxon: taxon}
  end

  describe "join/2 — US-AUTH-04 gating via Distributions.Policy :join_waitlist" do
    test "an adherent with active, current-year adhesion can join the waitlist", %{
      conn: conn,
      event: event,
      taxon: taxon
    } do
      user = insert(:user, status: :active, adhesion_active: true)
      conn = assign(conn, :current_user, user)

      result = WaitlistController.join(conn, %{"id" => event.id, "taxon_id" => taxon.id})

      assert json_response(result, 201)["data"]["id"]
    end

    test "a suspended member cannot join the waitlist", %{conn: conn, event: event, taxon: taxon} do
      user = insert(:user, status: :suspended, adhesion_active: true)
      conn = assign(conn, :current_user, user)

      assert {:error, :unauthorized} =
               WaitlistController.join(conn, %{"id" => event.id, "taxon_id" => taxon.id})
    end

    test "a member without an active adhesion cannot join the waitlist", %{
      conn: conn,
      event: event,
      taxon: taxon
    } do
      user = insert(:user, status: :active, adhesion_active: false)
      conn = assign(conn, :current_user, user)

      assert {:error, :unauthorized} =
               WaitlistController.join(conn, %{"id" => event.id, "taxon_id" => taxon.id})
    end
  end

  describe "leave/2" do
    test "a member can leave a waitlist they joined", %{conn: conn, event: event, taxon: taxon} do
      user = insert(:user, status: :active, adhesion_active: true)
      insert(:waitlist_entry, user: user, event: event, taxon: taxon)

      conn = assign(conn, :current_user, user)
      result = WaitlistController.leave(conn, %{"id" => event.id, "taxon_id" => taxon.id})

      assert result.status == 204
    end
  end
end
