defmodule Repousse.Accounts.ProfileRequestsTest do
  use Repousse.DataCase, async: true

  import Repousse.Factory
  import Swoosh.TestAssertions

  alias Repousse.Accounts
  alias Repousse.Notifications

  describe "request_profile/2" do
    test "gated profile becomes pending and notifies every admin" do
      user = insert(:user)
      admin = insert(:admin_user)
      superadmin = insert(:superadmin_user)

      assert {:ok, profile} = Accounts.request_profile(user, "host_family")
      assert profile.status == :pending
      assert profile.requested_at

      assert [%{type: "profile_request.created"}] = Notifications.list_for_user(admin)
      assert [%{type: "profile_request.created"}] = Notifications.list_for_user(superadmin)
      assert [] = Notifications.list_for_user(user)
      assert_email_sent(to: {"Alice Dupont", admin.email})
    end

    test "volunteer is activated immediately without notifying admins" do
      user = insert(:user)
      admin = insert(:admin_user)

      assert {:ok, %{status: :active}} = Accounts.request_profile(user, :volunteer)
      assert [] = Notifications.list_for_user(admin)
    end

    test "cannot request twice while pending, or once active" do
      user = insert(:user)
      assert {:ok, _} = Accounts.request_profile(user, "adoptant")
      assert {:error, :profile_already_requested} = Accounts.request_profile(user, "adoptant")

      insert(:user_profile, user: user, profile_type: :host_family)
      assert {:error, :profile_already_requested} = Accounts.request_profile(user, "host_family")
    end

    test "rejects unknown profile types" do
      assert {:error, :invalid_profile_type} = Accounts.request_profile(insert(:user), "wizard")
    end
  end

  describe "approve / reject" do
    setup do
      user = insert(:user)
      admin = insert(:admin_user)
      {:ok, profile} = Accounts.request_profile(user, "host_family")
      %{user: user, admin: admin, profile: Accounts.get_profile_request(profile.id)}
    end

    test "approve activates the profile and notifies the member", %{user: user, admin: admin, profile: profile} do
      assert {:ok, approved} = Accounts.approve_profile_request(profile, admin)
      assert approved.status == :active
      assert approved.decided_by_id == admin.id
      assert Accounts.get_active_profile(user.id, :host_family)

      assert [%{type: "profile_request.approved"}] = Notifications.list_for_user(user)
    end

    test "reject keeps the reason, notifies the member and allows a new request",
         %{user: user, admin: admin, profile: profile} do
      assert {:ok, rejected} = Accounts.reject_profile_request(profile, admin, "  Dossier incomplet ")
      assert rejected.status == :rejected
      assert rejected.rejection_reason == "Dossier incomplet"
      refute Accounts.get_active_profile(user.id, :host_family)

      assert [%{type: "profile_request.rejected", body: body}] = Notifications.list_for_user(user)
      assert body =~ "Dossier incomplet"

      assert {:ok, again} = Accounts.request_profile(user, "host_family")
      assert again.status == :pending
      assert again.rejection_reason == nil
    end

    test "an already-decided request cannot be decided again", %{admin: admin, profile: profile} do
      {:ok, approved} = Accounts.approve_profile_request(profile, admin)
      assert {:error, :profile_request_not_pending} = Accounts.approve_profile_request(approved, admin)
      assert {:error, :profile_request_not_pending} = Accounts.reject_profile_request(approved, admin, nil)
    end
  end

  describe "set_profiles/2" do
    test "cannot self-add a gated profile" do
      user = insert(:user)
      insert(:user_profile, user: user, profile_type: :volunteer)

      assert {:error, :profile_requires_approval} = Accounts.set_profiles(user, [:volunteer, :adoptant])
    end

    test "can cancel a pending request by dropping it" do
      user = insert(:user)
      insert(:user_profile, user: user, profile_type: :volunteer)
      {:ok, _} = Accounts.request_profile(user, "adoptant")

      assert {:ok, profiles} = Accounts.set_profiles(user, [:volunteer])
      assert Enum.map(profiles, & &1.profile_type) == [:volunteer]
    end
  end

  test "pending host_family cannot create nurseries nor edit hosting details" do
    user = insert(:user)
    {:ok, _} = Accounts.request_profile(user, "host_family")

    assert {:error, :host_family_profile_required} = Repousse.Nurseries.create_nursery(user, %{"name" => "X"})
    assert {:error, :profile_not_active} = Accounts.update_profile_details(user, "host_family", %{})
  end
end
