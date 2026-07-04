defmodule Repousse.Accounts.PolicyTest do
  use Repousse.DataCase, async: true

  import Repousse.Factory

  alias Repousse.Accounts.Policy

  describe ":create_user" do
    test "member cannot create any user" do
      member = build(:user, role: :member)
      assert {:error, :unauthorized} = Bodyguard.permit(Policy, :create_user, member, %{})
    end

    test "admin can create a member" do
      admin = build(:user, role: :admin)
      assert :ok = Bodyguard.permit(Policy, :create_user, admin, %{})
    end

    # epic-02 US-AUTH-10: "Un Admin ne peut pas créer un compte superadmin ni admin"
    test "admin cannot create an admin or superadmin account" do
      admin = build(:user, role: :admin)

      assert {:error, :unauthorized} =
               Bodyguard.permit(Policy, :create_user, admin, %{role: :admin})

      assert {:error, :unauthorized} =
               Bodyguard.permit(Policy, :create_user, admin, %{role: :superadmin})
    end

    test "superadmin can create an admin or superadmin account" do
      superadmin = build(:user, role: :superadmin)
      assert :ok = Bodyguard.permit(Policy, :create_user, superadmin, %{role: :admin})
      assert :ok = Bodyguard.permit(Policy, :create_user, superadmin, %{role: :superadmin})
    end
  end

  describe ":assign_role" do
    test "only superadmin may assign roles" do
      member = build(:user, role: :member)
      admin = build(:user, role: :admin)
      superadmin = build(:user, role: :superadmin)

      assert {:error, :unauthorized} = Bodyguard.permit(Policy, :assign_role, member, %{})
      assert {:error, :unauthorized} = Bodyguard.permit(Policy, :assign_role, admin, %{})
      assert :ok = Bodyguard.permit(Policy, :assign_role, superadmin, %{})
    end
  end

  describe ":manage_users / :suspend_user" do
    test "admin and superadmin can manage/suspend users, member cannot" do
      member = build(:user, role: :member)
      admin = build(:user, role: :admin)

      assert {:error, :unauthorized} = Bodyguard.permit(Policy, :manage_users, member, %{})
      assert :ok = Bodyguard.permit(Policy, :manage_users, admin, %{})
      assert :ok = Bodyguard.permit(Policy, :suspend_user, admin, %{})
    end
  end
end
