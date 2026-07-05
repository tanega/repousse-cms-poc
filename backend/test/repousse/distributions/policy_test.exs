defmodule Repousse.Distributions.PolicyTest do
  use Repousse.DataCase, async: true

  import Repousse.Factory

  alias Repousse.Distributions.Policy

  describe ":manage_event / :validate_reservation" do
    test "only platform admin can manage events or validate reservations" do
      member = build(:user, role: :member)
      admin = build(:user, role: :admin)

      assert {:error, :unauthorized} = Bodyguard.permit(Policy, :manage_event, member, %{})
      assert :ok = Bodyguard.permit(Policy, :manage_event, admin, %{})

      assert {:error, :unauthorized} =
               Bodyguard.permit(Policy, :validate_reservation, member, %{})

      assert :ok = Bodyguard.permit(Policy, :validate_reservation, admin, %{})
    end
  end

  describe ":reserve / :join_waitlist" do
    # epic-02 US-AUTH-04: suspended/lapsed membership is read-only —
    # reservations and waitlist joins are blocked.
    test "a user with an active, current-year adhesion can reserve and join waitlists" do
      user = build(:user, status: :active, adhesion_active: true)

      assert :ok = Bodyguard.permit(Policy, :reserve, user, %{})
      assert :ok = Bodyguard.permit(Policy, :join_waitlist, user, %{})
    end

    test "a user without an active adhesion cannot reserve or join waitlists" do
      user = build(:user, status: :active, adhesion_active: false)

      assert {:error, :unauthorized} = Bodyguard.permit(Policy, :reserve, user, %{})
      assert {:error, :unauthorized} = Bodyguard.permit(Policy, :join_waitlist, user, %{})
    end

    test "a suspended user cannot reserve or join waitlists even with adhesion_active true" do
      user = build(:user, status: :suspended, adhesion_active: true)

      assert {:error, :unauthorized} = Bodyguard.permit(Policy, :reserve, user, %{})
      assert {:error, :unauthorized} = Bodyguard.permit(Policy, :join_waitlist, user, %{})
    end
  end
end
