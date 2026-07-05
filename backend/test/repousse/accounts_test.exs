defmodule Repousse.AccountsTest do
  use Repousse.DataCase, async: true

  import Repousse.Factory

  alias Repousse.Accounts

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
