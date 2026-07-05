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

  describe "parse_role/1" do
    test "accepts known atoms and strings" do
      assert {:ok, :admin} = Accounts.parse_role(:admin)
      assert {:ok, :admin} = Accounts.parse_role("admin")
      assert {:ok, :superadmin} = Accounts.parse_role("superadmin")
      assert {:ok, :member} = Accounts.parse_role("member")
    end

    test "rejects unknown roles" do
      assert :error = Accounts.parse_role("owner")
      assert :error = Accounts.parse_role(:owner)
      assert :error = Accounts.parse_role(nil)
    end
  end

  describe "assign_role/3 — audit trail" do
    # epic-02 US-AUTH-11: "Historique des attributions/révocations tracé"
    test "records the previous role, new role, and granting superadmin" do
      superadmin = insert(:user, role: :superadmin)
      user = insert(:user, role: :member)

      assert {:ok, updated} = Accounts.assign_role(user, :admin, superadmin.id)
      assert updated.role == :admin

      assert [log] = Accounts.list_role_audit_logs(user.id)
      assert log.previous_role == :member
      assert log.new_role == :admin
      assert log.granted_by_id == superadmin.id
    end

    test "defaults granted_by to nil when not provided (arity-2 backward compatibility)" do
      user = insert(:user, role: :member)

      assert {:ok, _updated} = Accounts.assign_role(user, :admin)
      assert [log] = Accounts.list_role_audit_logs(user.id)
      assert is_nil(log.granted_by_id)
    end

    test "does not write an audit log when refusing to demote the last superadmin" do
      last_superadmin = insert(:user, role: :superadmin)
      assert {:error, :last_superadmin} = Accounts.assign_role(last_superadmin, :admin)
      assert Accounts.list_role_audit_logs(last_superadmin.id) == []
    end

    test "revocation (demotion back to member) is also tracked" do
      _other_superadmin = insert(:user, role: :superadmin)
      admin = insert(:user, role: :admin)
      granter = insert(:user, role: :superadmin)

      assert {:ok, updated} = Accounts.assign_role(admin, :member, granter.id)
      assert updated.role == :member

      assert [log] = Accounts.list_role_audit_logs(admin.id)
      assert log.previous_role == :admin
      assert log.new_role == :member
      assert log.granted_by_id == granter.id
    end
  end

  describe "increment_activation_reminder_count/1" do
    test "bumps activation_sent_count without touching other fields" do
      user = insert(:user, activation_sent_count: 0)

      assert {:ok, updated} = Accounts.increment_activation_reminder_count(user)
      assert updated.activation_sent_count == 1

      assert {:ok, updated} = Accounts.increment_activation_reminder_count(updated)
      assert updated.activation_sent_count == 2
    end
  end

  describe "set_profiles/2" do
    # epic-02 US-AUTH-09 / epic-03 US-PROFIL-04: "Au moins un profil requis"
    test "requires at least one profile" do
      user = insert(:user)
      assert {:error, :at_least_one_profile_required} = Accounts.set_profiles(user, [])
    end

    test "rejects profile types outside the 3-value self-selectable list" do
      user = insert(:user)
      assert {:error, :invalid_profile_type} = Accounts.set_profiles(user, ["admin"])
      assert {:error, :invalid_profile_type} = Accounts.set_profiles(user, ["superadmin"])
      assert {:error, :invalid_profile_type} = Accounts.set_profiles(user, ["not_a_profile"])
    end

    test "accepts volunteer, adoptant, host_family as strings or atoms" do
      user = insert(:user)

      assert {:ok, profiles} = Accounts.set_profiles(user, ["volunteer", "adoptant"])
      assert Enum.map(profiles, & &1.profile_type) |> Enum.sort() == [:adoptant, :volunteer]

      assert {:ok, profiles} = Accounts.set_profiles(user, [:host_family])
      assert Enum.map(profiles, & &1.profile_type) == [:host_family]
    end

    test "replaces the previous profile set rather than appending to it" do
      user = insert(:user)
      assert {:ok, _} = Accounts.set_profiles(user, [:volunteer, :adoptant])
      assert {:ok, profiles} = Accounts.set_profiles(user, [:host_family])

      assert Enum.map(profiles, & &1.profile_type) == [:host_family]
      assert length(Accounts.list_profiles(user)) == 1
    end
  end
end
