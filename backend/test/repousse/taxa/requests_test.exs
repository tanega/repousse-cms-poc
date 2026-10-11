defmodule Repousse.Taxa.RequestsTest do
  use Repousse.DataCase, async: true

  import Repousse.Factory

  alias Repousse.Notifications
  alias Repousse.Nurseries
  alias Repousse.Taxa.Requests

  defp host_family do
    user = insert(:user)
    insert(:user_profile, user: user, profile_type: :host_family)
    user
  end

  describe "create/2" do
    test "stores the request and notifies admins, superadmins and taxon editors, not the asker" do
      asker = insert(:admin_user)
      admin = insert(:admin_user)
      editor = insert(:user, taxon_editor: true)
      member = insert(:user)

      assert {:ok, request} = Requests.create(asker, %{"common_name" => "  Poirier sauvage ", "comment" => "x"})
      assert request.status == :pending
      assert request.common_name == "Poirier sauvage"

      assert [%{type: "taxon_request.created"}] = Notifications.list_for_user(admin)
      assert [%{type: "taxon_request.created"}] = Notifications.list_for_user(editor)
      assert [] = Notifications.list_for_user(member)
      assert [] = Notifications.list_for_user(asker)
    end

    test "needs at least one name" do
      assert {:error, changeset} = Requests.create(insert(:user), %{"comment" => "no name"})
      assert %{common_name: [_]} = errors_on(changeset)
    end

    test "an open request with the same name is shared, whatever the case" do
      {:ok, first} = Requests.create(insert(:user), %{"scientific_name" => "Pyrus pyraster"})
      {:ok, second} = Requests.create(insert(:user), %{"scientific_name" => "pyrus PYRASTER"})
      assert first.id == second.id
      assert Requests.count_pending() == 1
    end
  end

  describe "nursery lines waiting on a request" do
    test "a nursery can hold a pending line, hidden from taxon search" do
      owner = host_family()
      {:ok, request} = Requests.create(owner, %{"common_name" => "Poirier"})

      assert {:ok, nursery} =
               Nurseries.create_nursery(owner, %{
                 "name" => "Serre",
                 "plants" => [%{"taxon_request_id" => request.id, "quantity" => 5}]
               })

      assert [%{taxon_id: nil, taxon_request_id: rid}] = nursery.plants
      assert rid == request.id
      assert Nurseries.list_all_nurseries(taxon_id: Ecto.UUID.generate()) == []
    end

    test "a decided request cannot receive new lines" do
      owner = host_family()
      {:ok, request} = Requests.create(owner, %{"common_name" => "Poirier"})
      {:ok, _} = Requests.reject(request, insert(:admin_user), nil)

      assert {:error, :taxon_request_not_pending} =
               Nurseries.create_nursery(owner, %{
                 "name" => "Serre",
                 "plants" => [%{"taxon_request_id" => request.id, "quantity" => 1}]
               })
    end
  end

  describe "approve/3" do
    setup do
      owner = host_family()
      other = host_family()
      {:ok, request} = Requests.create(owner, %{"common_name" => "Poirier"})
      {:ok, shared} = Requests.create(other, %{"common_name" => "poirier"})
      assert shared.id == request.id

      {:ok, n1} =
        Nurseries.create_nursery(owner, %{"name" => "Serre A", "plants" => [%{"taxon_request_id" => request.id, "quantity" => 5}]})

      {:ok, n2} =
        Nurseries.create_nursery(other, %{"name" => "Serre B", "plants" => [%{"taxon_request_id" => request.id, "quantity" => 2}]})

      %{owner: owner, other: other, request: Requests.get(request.id), n1: n1, n2: n2, admin: insert(:admin_user)}
    end

    test "creates the taxon, attaches pending lines and notifies everyone who asked", ctx do
      assert {:ok, approved} =
               Requests.approve(ctx.request, ctx.admin, %{
                 taxon: %{"common_name" => "Poirier", "scientific_name" => "Pyrus communis", "taxonomic_level" => "species"}
               })

      assert approved.status == :approved
      assert approved.taxon_id

      assert [%{taxon_id: tid, taxon_request_id: nil, quantity: 5}] = Nurseries.get_nursery(ctx.n1.id).plants
      assert tid == approved.taxon_id
      assert [%{taxon_id: ^tid}] = Nurseries.get_nursery(ctx.n2.id).plants

      assert [%{type: "taxon_request.approved"}] = Notifications.list_for_user(ctx.owner)
      assert [%{type: "taxon_request.approved"}] = Notifications.list_for_user(ctx.other)
    end

    test "links an existing taxon and merges with a line the nursery already has", ctx do
      existing = insert(:taxon)
      insert(:nursery_plant, nursery: ctx.n1, taxon: existing, quantity: 10)

      assert {:ok, _} = Requests.approve(ctx.request, ctx.admin, %{taxon_id: existing.id})

      assert [%{quantity: 15, taxon_id: tid}] = Nurseries.get_nursery(ctx.n1.id).plants
      assert tid == existing.id
    end

    test "needs a taxon, and cannot be decided twice", ctx do
      assert {:error, :taxon_required} = Requests.approve(ctx.request, ctx.admin, %{})
      assert {:error, :taxon_not_found} = Requests.approve(ctx.request, ctx.admin, %{taxon_id: Ecto.UUID.generate()})

      {:ok, rejected} = Requests.reject(ctx.request, ctx.admin, "doublon")
      assert {:error, :taxon_request_not_pending} = Requests.approve(rejected, ctx.admin, %{taxon_id: insert(:taxon).id})
    end
  end

  describe "reject/3" do
    test "removes the pending lines and notifies the asker with the reason" do
      owner = host_family()
      admin = insert(:admin_user)
      {:ok, request} = Requests.create(owner, %{"common_name" => "Poirier"})

      {:ok, nursery} =
        Nurseries.create_nursery(owner, %{"name" => "Serre A", "plants" => [%{"taxon_request_id" => request.id, "quantity" => 5}]})

      assert {:ok, rejected} = Requests.reject(Requests.get(request.id), admin, " Hors liste ")
      assert rejected.status == :rejected
      assert rejected.rejection_reason == "Hors liste"
      assert Nurseries.get_nursery(nursery.id).plants == []

      assert [%{type: "taxon_request.rejected", body: body}] = Notifications.list_for_user(owner)
      assert body =~ "Hors liste"
    end
  end
end
