defmodule Repousse.AccountsTest do
  use Repousse.DataCase, async: true

  import Repousse.Factory

  alias Repousse.Accounts

  describe "find_or_create_by_hanko_id!/2" do
    test "claims an existing ghost user (no hanko_id) by email instead of crashing" do
      ghost = insert(:user, hanko_id: nil, email: "ghost@example.com")

      user = Accounts.find_or_create_by_hanko_id!("new-hanko-id", "ghost@example.com")

      assert user.id == ghost.id
      assert user.hanko_id == "new-hanko-id"
    end

    test "creates a brand new user when neither hanko_id nor email match" do
      user = Accounts.find_or_create_by_hanko_id!("fresh-hanko-id", "brand-new@example.com")

      assert user.hanko_id == "fresh-hanko-id"
      assert user.email == "brand-new@example.com"
    end

    test "updates last_seen_at when the hanko_id already matches a user" do
      existing = insert(:user, hanko_id: "known-hanko-id", last_seen_at: nil)

      user = Accounts.find_or_create_by_hanko_id!("known-hanko-id", existing.email)

      assert user.id == existing.id
      assert user.last_seen_at != nil
    end

    test "raises if the email is already linked to a different hanko_id" do
      insert(:user, hanko_id: "other-hanko-id", email: "taken@example.com")

      assert_raise RuntimeError, ~r/already linked to a different hanko_id/, fn ->
        Accounts.find_or_create_by_hanko_id!("new-hanko-id", "taken@example.com")
      end
    end
  end

  describe "has_role?/2" do
    test "superadmin satisfies both :admin and :superadmin checks" do
      user = build(:user, role: :superadmin)
      assert Accounts.has_role?(user, :admin)
      assert Accounts.has_role?(user, :superadmin)
    end

    test "admin satisfies :admin but not :superadmin" do
      user = build(:user, role: :admin)
      assert Accounts.has_role?(user, :admin)
      refute Accounts.has_role?(user, :superadmin)
    end

    test "member satisfies neither" do
      user = build(:user, role: :member)
      refute Accounts.has_role?(user, :admin)
      refute Accounts.has_role?(user, :superadmin)
    end
  end

  describe "assign_role/2" do
    test "promotes a member to admin" do
      user = insert(:user, role: :member)
      assert {:ok, updated} = Accounts.assign_role(user, :admin)
      assert updated.role == :admin
    end

    # epic-02 US-AUTH-11: "Un superadmin ne peut pas se révoquer lui-même
    # (au moins un superadmin actif requis)"
    test "refuses to demote the last remaining superadmin" do
      last_superadmin = insert(:user, role: :superadmin)
      assert {:error, :last_superadmin} = Accounts.assign_role(last_superadmin, :admin)
      assert Accounts.get_user!(last_superadmin.id).role == :superadmin
    end

    test "allows demoting a superadmin when another superadmin remains" do
      _other_superadmin = insert(:user, role: :superadmin)
      user = insert(:user, role: :superadmin)

      assert {:ok, updated} = Accounts.assign_role(user, :admin)
      assert updated.role == :admin
    end
  end

  describe "update_own_profile/2" do
    test "updates first_name and last_name" do
      user = insert(:user, first_name: "Alice", last_name: "Dupont")

      assert {:ok, updated} =
               Accounts.update_own_profile(user, %{"first_name" => "Alicia", "last_name" => "Durand"})

      assert updated.first_name == "Alicia"
      assert updated.last_name == "Durand"
    end

    test "ignores role, status, email and adhesion_active in the attrs" do
      user = insert(:user, role: :member, status: :active, adhesion_active: false)

      assert {:ok, updated} =
               Accounts.update_own_profile(user, %{
                 "first_name" => "Alicia",
                 "role" => "superadmin",
                 "status" => "suspended",
                 "email" => "hijacked@example.com",
                 "adhesion_active" => true
               })

      assert updated.first_name == "Alicia"
      assert updated.role == :member
      assert updated.status == :active
      assert updated.email == user.email
      refute updated.adhesion_active
    end
  end

  describe "set_taxon_editor/2" do
    test "grants and revokes the taxon_editor flag" do
      user = insert(:user, taxon_editor: false)
      assert {:ok, updated} = Accounts.set_taxon_editor(user, true)
      assert updated.taxon_editor

      assert {:ok, updated} = Accounts.set_taxon_editor(updated, false)
      refute updated.taxon_editor
    end
  end
end
