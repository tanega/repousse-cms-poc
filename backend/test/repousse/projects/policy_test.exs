defmodule Repousse.Projects.PolicyTest do
  use Repousse.DataCase, async: true

  import Repousse.Factory

  alias Repousse.Projects.Policy

  describe ":read_project" do
    test "anyone can read a public project" do
      project = insert(:project, publication_status: :public)
      outsider = insert(:user)

      assert :ok = Bodyguard.permit(Policy, :read_project, outsider, %{project: project})
    end

    test "non-member cannot read a private project" do
      project = insert(:project, publication_status: :private)
      outsider = insert(:user)

      assert {:error, :unauthorized} =
               Bodyguard.permit(Policy, :read_project, outsider, %{project: project})
    end

    test "a reader member can read a private project" do
      project = insert(:project, publication_status: :private)
      user = insert(:user)
      insert(:project_member, project: project, user: user, role: :reader)

      assert :ok = Bodyguard.permit(Policy, :read_project, user, %{project: project})
    end

    test "platform admin can read any private project" do
      project = insert(:project, publication_status: :private)
      admin = insert(:user, role: :admin)

      assert :ok = Bodyguard.permit(Policy, :read_project, admin, %{project: project})
    end
  end

  describe ":edit_project / :post_journal / :manage_media" do
    # epic-04: "Un Lecteur ne peut pas modifier le contenu"
    test "a reader cannot edit, post journal entries, or manage media" do
      project = insert(:project)
      user = insert(:user)
      insert(:project_member, project: project, user: user, role: :reader)

      for action <- [:edit_project, :post_journal, :manage_media] do
        assert {:error, :unauthorized} =
                 Bodyguard.permit(Policy, action, user, %{project: project})
      end
    end

    test "an editor can edit, post journal entries, and manage media" do
      project = insert(:project)
      user = insert(:user)
      insert(:project_member, project: project, user: user, role: :editor)

      for action <- [:edit_project, :post_journal, :manage_media] do
        assert :ok = Bodyguard.permit(Policy, action, user, %{project: project})
      end
    end
  end

  describe ":manage_members" do
    test "project editor cannot manage members, only project admin can" do
      project = insert(:project)
      editor = insert(:user)
      admin_member = insert(:user)
      insert(:project_member, project: project, user: editor, role: :editor)
      insert(:project_member, project: project, user: admin_member, role: :admin)

      assert {:error, :unauthorized} =
               Bodyguard.permit(Policy, :manage_members, editor, %{project: project})

      assert :ok = Bodyguard.permit(Policy, :manage_members, admin_member, %{project: project})
    end
  end

  describe ":moderate" do
    # epic-04 US-PROJET-13/14/15: platform-admin-only moderation
    test "only platform admin can moderate (unpublish/delete) a project, project-admin member cannot" do
      project = insert(:project)
      project_admin = insert(:user)
      insert(:project_member, project: project, user: project_admin, role: :admin)
      platform_admin = insert(:user, role: :admin)

      assert {:error, :unauthorized} =
               Bodyguard.permit(Policy, :moderate, project_admin, %{project: project})

      assert :ok = Bodyguard.permit(Policy, :moderate, platform_admin, %{project: project})
    end
  end
end
