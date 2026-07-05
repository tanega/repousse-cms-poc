defmodule Repousse.ProjectsTest do
  use Repousse.DataCase, async: true

  import Repousse.Factory
  import Swoosh.TestAssertions

  alias Repousse.Projects
  alias Repousse.Projects.Project

  describe "list_projects/1" do
    test "public_only lists public projects regardless of membership" do
      user = insert(:user)
      public = insert(:project, publication_status: :public)
      insert(:project, publication_status: :private)

      results = Projects.list_projects(user_id: user.id, public_only: true)

      assert Enum.map(results, & &1.id) == [public.id]
    end

    test "public_only never leaks a member's own private project" do
      user = insert(:user)
      private_project = insert(:project, publication_status: :private)
      insert(:project_member, project: private_project, user: user, role: :admin)

      results = Projects.list_projects(user_id: user.id, public_only: true)

      assert results == []
    end

    test "without public_only, lists only projects the user is a member of" do
      user = insert(:user)
      mine = insert(:project, publication_status: :private)
      insert(:project_member, project: mine, user: user, role: :admin)
      insert(:project, publication_status: :public)

      results = Projects.list_projects(user_id: user.id)

      assert Enum.map(results, & &1.id) == [mine.id]
    end
  end

  describe "list_all_projects/1" do
    test "platform admin listing can filter by status and owner" do
      owner = insert(:user)
      target = insert(:project, publication_status: :public, owner_id: owner.id)
      insert(:project, publication_status: :private, owner_id: owner.id)
      insert(:project, publication_status: :public)

      results = Projects.list_all_projects(%{"status" => "public", "owner_id" => owner.id})

      assert Enum.map(results, & &1.id) == [target.id]
    end
  end

  describe "can_create_project?/1" do
    test "platform admin can always create a project" do
      admin = insert(:admin_user)
      assert Projects.can_create_project?(admin)
    end

    test "a user with an adoptant profile can create a project" do
      user = insert(:user)
      insert(:user_profile, user: user, profile_type: :adoptant)

      assert Projects.can_create_project?(user)
    end

    test "a plain member without an adoptant profile cannot create a project" do
      user = insert(:user)
      refute Projects.can_create_project?(user)
    end
  end

  describe "create_project/2" do
    test "sets the owner and makes them a project admin (US-PROJET-01)" do
      user = insert(:user)

      assert {:ok, project} = Projects.create_project(%{"name" => "Verger partagé"}, user.id)
      assert project.owner_id == user.id
      assert Projects.get_member_role(project.id, user.id) == :admin
    end

    test "rejects a client-supplied unpublished status at creation time" do
      user = insert(:user)

      assert {:ok, project} =
               Projects.create_project(
                 %{"name" => "Verger", "publication_status" => "unpublished"},
                 user.id
               )

      assert project.publication_status == :private
    end

    test "requires a name" do
      user = insert(:user)
      assert {:error, changeset} = Projects.create_project(%{}, user.id)
      assert "can't be blank" in errors_on(changeset).name
    end
  end

  describe "update_project/2" do
    test "an editor/admin can update regular fields" do
      project = insert(:project, name: "Old name")

      assert {:ok, updated} = Projects.update_project(project, %{"name" => "New name"})
      assert updated.name == "New name"
    end

    test "silently strips an attempt to set publication_status to unpublished" do
      project = insert(:project, publication_status: :private)

      assert {:ok, updated} =
               Projects.update_project(project, %{"publication_status" => "unpublished"})

      assert updated.publication_status == :private
    end

    test "still allows toggling between private and public" do
      project = insert(:project, publication_status: :private)

      assert {:ok, updated} =
               Projects.update_project(project, %{"publication_status" => "public"})

      assert updated.publication_status == :public
    end
  end

  describe "moderate_unpublish_project/2 and moderate_delete_project/2" do
    test "unpublish requires a reason and emails the project's admins" do
      project = insert(:project, publication_status: :public)
      admin = insert(:user)
      insert(:project_member, project: project, user: admin, role: :admin)
      editor = insert(:user)
      insert(:project_member, project: project, user: editor, role: :editor)

      assert {:error, _} = Projects.moderate_unpublish_project(project, "")
      assert {:error, _} = Projects.moderate_unpublish_project(project, nil)

      assert {:ok, updated} = Projects.moderate_unpublish_project(project, "Contenu inapproprié")
      assert updated.publication_status == :unpublished

      assert_email_sent(fn email ->
        email.subject =~ ~r/dépublié/ and
          Enum.any?(email.to, fn {_, addr} -> addr == admin.email end)
      end)

      # only the project's admin is notified, not the editor
      refute_email_sent()
    end

    test "republish restores the public status" do
      project = insert(:project, publication_status: :unpublished)

      assert {:ok, updated} = Projects.republish_project(project)
      assert updated.publication_status == :public
      assert updated.published_at
    end

    test "delete requires a reason, emails admins, and removes the project" do
      project = insert(:project)
      admin = insert(:user)
      insert(:project_member, project: project, user: admin, role: :admin)

      assert {:error, _} = Projects.moderate_delete_project(project, "")
      assert {:ok, _deleted} = Projects.moderate_delete_project(project, "Violation grave")

      assert_email_sent(fn email ->
        email.subject =~ ~r/supprimé/ and
          Enum.any?(email.to, fn {_, addr} -> addr == admin.email end)
      end)

      refute Repousse.Repo.get(Project, project.id)
    end
  end

  describe "delete_project/1" do
    test "a project admin can delete their own project" do
      project = insert(:project)
      assert {:ok, _} = Projects.delete_project(project)
      refute Repousse.Repo.get(Project, project.id)
    end
  end

  describe "members" do
    test "list_members/1 returns member identity fields" do
      project = insert(:project)
      user = insert(:user, first_name: "Jean")
      insert(:project_member, project: project, user: user, role: :editor)

      assert [%{role: :editor, first_name: "Jean", user_id: user_id}] =
               Projects.list_members(project.id)

      assert user_id == user.id
    end

    test "update_member_role/2 promotes and demotes" do
      project = insert(:project)
      admin1 = insert(:user)
      admin2 = insert(:user)
      member1 = insert(:project_member, project: project, user: admin1, role: :admin)
      insert(:project_member, project: project, user: admin2, role: :admin)

      assert {:ok, demoted} = Projects.update_member_role(member1, :editor)
      assert demoted.role == :editor
    end

    test "update_member_role/2 refuses to demote the sole remaining admin" do
      project = insert(:project)
      sole_admin = insert(:user)
      member = insert(:project_member, project: project, user: sole_admin, role: :admin)

      assert {:error, _} = Projects.update_member_role(member, :editor)
      assert Projects.get_member_role(project.id, sole_admin.id) == :admin
    end

    test "remove_member/3 refuses self-removal of the sole admin (US-PROJET-07)" do
      project = insert(:project)
      sole_admin = insert(:user)
      insert(:project_member, project: project, user: sole_admin, role: :admin)

      assert {:error, _} =
               Projects.remove_member(project.id, sole_admin.id, actor_id: sole_admin.id)

      assert Projects.get_member_role(project.id, sole_admin.id) == :admin
    end

    test "remove_member/3 allows a co-admin to remove another admin" do
      project = insert(:project)
      admin1 = insert(:user)
      admin2 = insert(:user)
      insert(:project_member, project: project, user: admin1, role: :admin)
      insert(:project_member, project: project, user: admin2, role: :admin)

      assert {:ok, _} = Projects.remove_member(project.id, admin2.id, actor_id: admin1.id)
      assert Projects.count_admins(project.id) == 1
    end

    test "remove_member/3 auto-archives the project when the sole admin is removed by someone else (US-PROJET-08)" do
      project = insert(:project, publication_status: :public)
      sole_admin = insert(:user)
      reader = insert(:user, email: "reader@example.com")
      platform_admin = insert(:admin_user)
      insert(:project_member, project: project, user: sole_admin, role: :admin)
      insert(:project_member, project: project, user: reader, role: :reader)

      assert {:ok, _} =
               Projects.remove_member(project.id, sole_admin.id, actor_id: platform_admin.id)

      archived = Projects.get_project!(project.id)
      assert archived.archived_at

      assert_email_sent(fn email ->
        email.subject =~ ~r/archivé/ and
          Enum.any?(email.to, fn {_, addr} -> addr == reader.email end)
      end)
    end

    test "remove_member/3 returns :not_found for a non-member" do
      project = insert(:project)
      stranger = insert(:user)

      assert {:error, :not_found} =
               Projects.remove_member(project.id, stranger.id, actor_id: stranger.id)
    end
  end

  describe "invitations" do
    test "create_invitation/3 creates a pending invitation with a role" do
      project = insert(:project)
      inviter = insert(:user)

      assert {:ok, invitation} =
               Projects.create_invitation(project.id, inviter.id, %{
                 "email" => "invitee@example.com",
                 "role" => "editor"
               })

      assert invitation.role == :editor
      assert invitation.invited_by_id == inviter.id
      assert Enum.any?(Projects.list_pending_invitations(project.id), &(&1.id == invitation.id))
    end

    test "accept_invitation/2 adds the invitee as a member with the invited role" do
      project = insert(:project)
      invitee = insert(:user)
      invitation = insert(:project_invitation, project: project, role: :editor)

      assert {:ok, member} = Projects.accept_invitation(invitation.token, invitee)
      assert member.role == :editor
      assert Projects.get_member_role(project.id, invitee.id) == :editor
    end

    test "accept_invitation/2 rejects an expired invitation" do
      project = insert(:project)
      invitee = insert(:user)

      invitation =
        insert(:project_invitation,
          project: project,
          expires_at: DateTime.utc_now() |> DateTime.add(-1, :day) |> DateTime.truncate(:second)
        )

      assert {:error, _} = Projects.accept_invitation(invitation.token, invitee)
      assert Projects.get_member_role(project.id, invitee.id) == nil
    end

    test "accept_invitation/2 rejects an already-accepted invitation" do
      project = insert(:project)
      invitee = insert(:user)
      invitation = insert(:project_invitation, project: project)

      assert {:ok, _} = Projects.accept_invitation(invitation.token, invitee)
      other = insert(:user)
      assert {:error, _} = Projects.accept_invitation(invitation.token, other)
    end

    test "accept_invitation/2 returns :not_found for an unknown token" do
      invitee = insert(:user)
      assert {:error, :not_found} = Projects.accept_invitation("bogus-token", invitee)
    end
  end

  describe "journal entries" do
    test "create_journal_entry/3 sets project and author" do
      project = insert(:project)
      author = insert(:user)

      assert {:ok, entry} =
               Projects.create_journal_entry(project.id, author.id, %{"content" => "Arrosage"})

      assert entry.project_id == project.id
      assert entry.author_id == author.id
    end

    test "update_journal_entry/3: only the author may edit (US-PROJET-10)" do
      entry = insert(:journal_entry, content: "Original")
      other_user = insert(:user)

      assert {:error, :forbidden} =
               Projects.update_journal_entry(entry, other_user.id, %{"content" => "Hacked"})

      assert {:ok, updated} =
               Projects.update_journal_entry(entry, entry.author_id, %{"content" => "Edited"})

      assert updated.content == "Edited"
      assert updated.edited_at
    end

    test "delete_journal_entry/1 removes the entry" do
      entry = insert(:journal_entry)
      assert {:ok, _} = Projects.delete_journal_entry(entry)
    end

    test "list_journal_entries/1 orders most recent first with author info" do
      project = insert(:project)
      author = insert(:user, first_name: "Marie")
      older = insert(:journal_entry, project: project, author: author)
      newer = insert(:journal_entry, project: project, author: author)

      # force a deterministic ordering regardless of same-second insert timestamps
      Repousse.Repo.update_all(
        from(j in Repousse.Projects.JournalEntry, where: j.id == ^older.id),
        set: [inserted_at: ~U[2026-01-01 00:00:00Z]]
      )

      Repousse.Repo.update_all(
        from(j in Repousse.Projects.JournalEntry, where: j.id == ^newer.id),
        set: [inserted_at: ~U[2026-02-01 00:00:00Z]]
      )

      assert [%{id: first_id, author_first_name: "Marie"}, %{id: second_id}] =
               Projects.list_journal_entries(project.id)

      assert first_id == newer.id
      assert second_id == older.id
    end
  end

  describe "media" do
    test "add_media/3 stores the uploader and project" do
      project = insert(:project)
      uploader = insert(:user)

      assert {:ok, media} =
               Projects.add_media(project.id, uploader.id, %{
                 "file_type" => "image",
                 "mime_type" => "image/jpeg",
                 "url" => "https://cdn.example.com/a.jpg",
                 "filename" => "a.jpg",
                 "size_bytes" => 100
               })

      assert media.project_id == project.id
      assert media.uploaded_by_id == uploader.id
    end

    test "add_media/3 refuses beyond the 10-file cap with an explicit message (US-PROJET-04)" do
      project = insert(:project)
      uploader = insert(:user)

      for _ <- 1..10 do
        insert(:project_media, project: project, uploaded_by: uploader)
      end

      assert {:error, message} =
               Projects.add_media(project.id, uploader.id, %{
                 "file_type" => "image",
                 "mime_type" => "image/jpeg",
                 "url" => "https://cdn.example.com/overflow.jpg",
                 "filename" => "overflow.jpg",
                 "size_bytes" => 100
               })

      assert message =~ "10"
    end

    test "delete_media/1 removes the media" do
      media = insert(:project_media)
      assert {:ok, _} = Projects.delete_media(media)
    end
  end
end
