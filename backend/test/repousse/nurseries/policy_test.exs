defmodule Repousse.Nurseries.PolicyTest do
  use Repousse.DataCase, async: true

  import Repousse.Factory

  alias Repousse.Nurseries.Policy

  describe ":read_nursery" do
    test "any member can read the nurseries of a public profile" do
      owner = insert(:user, profile_visibility: :public)
      nursery = insert(:nursery, user: owner)

      assert :ok = Bodyguard.permit(Policy, :read_nursery, insert(:user), %{nursery: nursery})
    end

    test "a member cannot read the nurseries of a private profile" do
      owner = insert(:user, profile_visibility: :private)
      nursery = insert(:nursery, user: owner)

      assert {:error, :unauthorized} =
               Bodyguard.permit(Policy, :read_nursery, insert(:user), %{nursery: nursery})
    end

    test "the owner reads their own nurseries even when private" do
      owner = insert(:user, profile_visibility: :private)
      nursery = insert(:nursery, user: owner)

      assert :ok = Bodyguard.permit(Policy, :read_nursery, owner, %{nursery: nursery})
    end

    test "a coordinator reads the nurseries of a private profile" do
      owner = insert(:user, profile_visibility: :private)
      nursery = insert(:nursery, user: owner)

      assert :ok = Bodyguard.permit(Policy, :read_nursery, insert(:admin_user), %{nursery: nursery})
    end
  end

  describe ":manage_nursery" do
    test "the owner can manage their nursery" do
      owner = insert(:user)
      nursery = insert(:nursery, user: owner)

      assert :ok = Bodyguard.permit(Policy, :manage_nursery, owner, %{nursery: nursery})
    end

    test "another member cannot manage it, even on a public profile" do
      owner = insert(:user, profile_visibility: :public)
      nursery = insert(:nursery, user: owner)

      assert {:error, :unauthorized} =
               Bodyguard.permit(Policy, :manage_nursery, insert(:user), %{nursery: nursery})
    end

    test "a coordinator can manage it for moderation" do
      nursery = insert(:nursery, user: insert(:user))

      assert :ok =
               Bodyguard.permit(Policy, :manage_nursery, insert(:admin_user), %{nursery: nursery})
    end
  end

  describe ":list_all" do
    test "coordinators only" do
      assert :ok = Bodyguard.permit(Policy, :list_all, insert(:admin_user), %{})
      assert {:error, :unauthorized} = Bodyguard.permit(Policy, :list_all, insert(:user), %{})
    end
  end
end
