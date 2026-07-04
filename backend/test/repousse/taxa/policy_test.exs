defmodule Repousse.Taxa.PolicyTest do
  use Repousse.DataCase, async: true

  import Repousse.Factory

  alias Repousse.Taxa.Policy

  describe ":manage_taxa" do
    test "plain member cannot manage taxa" do
      member = build(:user, role: :member, taxon_editor: false)
      assert {:error, :unauthorized} = Bodyguard.permit(Policy, :manage_taxa, member, %{})
    end

    test "platform admin can manage taxa" do
      admin = build(:user, role: :admin)
      assert :ok = Bodyguard.permit(Policy, :manage_taxa, admin, %{})
    end

    # epic-05: "Rôle Éditeur taxons distinct des autres rôles éditeurs —
    # attribué explicitement par un Admin"
    test "a member granted the taxon_editor flag can manage taxa without being platform admin" do
      editor = build(:user, role: :member, taxon_editor: true)
      assert :ok = Bodyguard.permit(Policy, :manage_taxa, editor, %{})
    end
  end
end
