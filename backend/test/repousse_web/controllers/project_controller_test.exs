defmodule RepousseWeb.ProjectControllerTest do
  use RepousseWeb.ConnCase, async: true

  import Repousse.Factory

  alias RepousseWeb.ProjectController

  defp conn_as(user, params \\ %{}) do
    Phoenix.ConnTest.build_conn()
    |> Plug.Conn.assign(:current_user, user)
    |> Map.put(:params, params)
  end

  defp call(user, action, params) do
    ProjectController.call(conn_as(user, params), action)
  end

  describe "show/2 (:read_project)" do
    test "anyone can read a public project" do
      project = insert(:project, publication_status: :public)
      outsider = insert(:user)

      conn = call(outsider, :show, %{"id" => project.id})
      assert %{"data" => data} = json_response(conn, 200)
      assert data["id"] == project.id
    end

    test "an outsider cannot read a private project" do
      project = insert(:project, publication_status: :private)
      outsider = insert(:user)

      conn = call(outsider, :show, %{"id" => project.id})
      assert json_response(conn, 401)
    end

    test "a project member can read a private project" do
      project = insert(:project, publication_status: :private)
      user = insert(:user)
      insert(:project_member, project: project, user: user, role: :reader)

      conn = call(user, :show, %{"id" => project.id})
      assert json_response(conn, 200)
    end

    test "a platform admin can read any private project" do
      project = insert(:project, publication_status: :private)
      admin = insert(:admin_user)

      conn = call(admin, :show, %{"id" => project.id})
      assert json_response(conn, 200)
    end
  end

  describe "create/2" do
    test "an adoptant can create a project and becomes its admin" do
      user = insert(:user)
      insert(:user_profile, user: user, profile_type: :adoptant)

      conn = call(user, :create, %{"project" => %{"name" => "Mon verger"}})

      assert %{"data" => data} = json_response(conn, 201)
      assert data["owner_id"] == user.id
      assert Repousse.Projects.get_member_role(data["id"], user.id) == :admin
    end

    test "a platform admin can always create a project" do
      admin = insert(:admin_user)
      conn = call(admin, :create, %{"project" => %{"name" => "Verger admin"}})
      assert json_response(conn, 201)
    end

    test "a member without an adoptant profile cannot create a project" do
      user = insert(:user)
      conn = call(user, :create, %{"project" => %{"name" => "Verger interdit"}})
      assert json_response(conn, 401)
    end
  end

  describe "update/2 (:edit_project)" do
    test "a project editor can edit content" do
      project = insert(:project, name: "Old")
      user = insert(:user)
      insert(:project_member, project: project, user: user, role: :editor)

      conn = call(user, :update, %{"id" => project.id, "project" => %{"name" => "New"}})
      assert %{"data" => %{"name" => "New"}} = json_response(conn, 200)
    end

    test "a reader cannot edit content (epic-04: Un Lecteur ne peut pas modifier le contenu)" do
      project = insert(:project)
      user = insert(:user)
      insert(:project_member, project: project, user: user, role: :reader)

      conn = call(user, :update, %{"id" => project.id, "project" => %{"name" => "Hacked"}})
      assert json_response(conn, 401)
    end

    test "a project admin cannot self-unpublish; only a platform admin can moderate-unpublish (US-PROJET-14)" do
      project = insert(:project, publication_status: :public)
      project_admin = insert(:user)
      insert(:project_member, project: project, user: project_admin, role: :admin)

      conn =
        call(project_admin, :update, %{
          "id" => project.id,
          "project" => %{"publication_status" => "unpublished", "reason" => "test"}
        })

      assert json_response(conn, 401)

      platform_admin = insert(:admin_user)

      conn =
        call(platform_admin, :update, %{
          "id" => project.id,
          "project" => %{"publication_status" => "unpublished", "reason" => "Contenu inapproprié"}
        })

      assert %{"data" => %{"publication_status" => "unpublished"}} = json_response(conn, 200)
    end

    test "platform admin unpublish without a reason is rejected" do
      project = insert(:project, publication_status: :public)
      platform_admin = insert(:admin_user)

      conn =
        call(platform_admin, :update, %{
          "id" => project.id,
          "project" => %{"publication_status" => "unpublished"}
        })

      assert json_response(conn, 400)
    end

    test "platform admin can republish an unpublished project" do
      project = insert(:project, publication_status: :unpublished)
      platform_admin = insert(:admin_user)

      conn =
        call(platform_admin, :update, %{
          "id" => project.id,
          "project" => %{"publication_status" => "public"}
        })

      assert %{"data" => %{"publication_status" => "public"}} = json_response(conn, 200)
    end
  end

  describe "delete/2" do
    test "a project admin can delete their own project (US-PROJET-03)" do
      project = insert(:project)
      user = insert(:user)
      insert(:project_member, project: project, user: user, role: :admin)

      conn = call(user, :delete, %{"id" => project.id})
      assert response(conn, 204)
    end

    test "a project editor cannot delete the project" do
      project = insert(:project)
      user = insert(:user)
      insert(:project_member, project: project, user: user, role: :editor)

      conn = call(user, :delete, %{"id" => project.id})
      assert json_response(conn, 401)
    end

    test "a platform admin can moderation-delete any project with a reason (US-PROJET-15)" do
      project = insert(:project)
      admin_member = insert(:user)
      insert(:project_member, project: project, user: admin_member, role: :admin)
      platform_admin = insert(:admin_user)

      conn = call(platform_admin, :delete, %{"id" => project.id, "reason" => "Violation grave"})
      assert response(conn, 204)
    end
  end

  describe "members/2 and invite/2 (:manage_members)" do
    test "a project member can list members" do
      project = insert(:project)
      user = insert(:user)
      insert(:project_member, project: project, user: user, role: :reader)

      conn = call(user, :members, %{"id" => project.id})
      assert %{"data" => data} = json_response(conn, 200)
      assert length(data) == 1
    end

    test "a project admin can invite a new member" do
      project = insert(:project)
      admin = insert(:user)
      insert(:project_member, project: project, user: admin, role: :admin)

      conn =
        call(admin, :invite, %{
          "id" => project.id,
          "invitation" => %{"email" => "invitee@example.com", "role" => "editor"}
        })

      assert %{"data" => %{"role" => "editor"}} = json_response(conn, 201)
    end

    test "a project editor cannot invite a member" do
      project = insert(:project)
      editor = insert(:user)
      insert(:project_member, project: project, user: editor, role: :editor)

      conn =
        call(editor, :invite, %{
          "id" => project.id,
          "invitation" => %{"email" => "invitee@example.com", "role" => "reader"}
        })

      assert json_response(conn, 401)
    end
  end

  describe "update_member/2 and remove_member/2" do
    test "a project admin can promote a reader to editor" do
      project = insert(:project)
      admin = insert(:user)
      reader = insert(:user)
      insert(:project_member, project: project, user: admin, role: :admin)
      insert(:project_member, project: project, user: reader, role: :reader)

      conn =
        call(admin, :update_member, %{
          "id" => project.id,
          "user_id" => reader.id,
          "member" => %{"role" => "editor"}
        })

      assert %{"data" => %{"role" => "editor"}} = json_response(conn, 200)
    end

    test "an editor cannot change member roles" do
      project = insert(:project)
      editor = insert(:user)
      reader = insert(:user)
      insert(:project_member, project: project, user: editor, role: :editor)
      insert(:project_member, project: project, user: reader, role: :reader)

      conn =
        call(editor, :update_member, %{
          "id" => project.id,
          "user_id" => reader.id,
          "member" => %{"role" => "editor"}
        })

      assert json_response(conn, 401)
    end

    test "the sole admin cannot remove themselves (US-PROJET-07)" do
      project = insert(:project)
      sole_admin = insert(:user)
      insert(:project_member, project: project, user: sole_admin, role: :admin)

      conn = call(sole_admin, :remove_member, %{"id" => project.id, "user_id" => sole_admin.id})
      assert json_response(conn, 400)
    end

    test "a platform admin removing the sole admin auto-archives the project (US-PROJET-08)" do
      project = insert(:project, publication_status: :public)
      sole_admin = insert(:user)
      platform_admin = insert(:admin_user)
      insert(:project_member, project: project, user: sole_admin, role: :admin)

      conn =
        call(platform_admin, :remove_member, %{"id" => project.id, "user_id" => sole_admin.id})

      assert response(conn, 204)

      archived = Repousse.Projects.get_project!(project.id)
      assert archived.archived_at
    end
  end

  describe "upload_media/2 and delete_media/2 (:manage_media)" do
    test "an editor can upload media" do
      project = insert(:project)
      editor = insert(:user)
      insert(:project_member, project: project, user: editor, role: :editor)

      conn =
        call(editor, :upload_media, %{
          "id" => project.id,
          "media" => %{
            "file_type" => "image",
            "mime_type" => "image/jpeg",
            "url" => "https://cdn.example.com/a.jpg",
            "filename" => "a.jpg",
            "size_bytes" => 100
          }
        })

      assert json_response(conn, 201)
    end

    test "a reader cannot upload media" do
      project = insert(:project)
      reader = insert(:user)
      insert(:project_member, project: project, user: reader, role: :reader)

      conn =
        call(reader, :upload_media, %{
          "id" => project.id,
          "media" => %{
            "file_type" => "image",
            "mime_type" => "image/jpeg",
            "url" => "https://cdn.example.com/a.jpg",
            "filename" => "a.jpg",
            "size_bytes" => 100
          }
        })

      assert json_response(conn, 401)
    end

    test "an editor can delete media" do
      project = insert(:project)
      editor = insert(:user)
      insert(:project_member, project: project, user: editor, role: :editor)
      media = insert(:project_media, project: project)

      conn = call(editor, :delete_media, %{"id" => project.id, "media_id" => media.id})
      assert response(conn, 204)
    end
  end

  describe "journal actions (:post_journal + author-only edit)" do
    test "a reader can view the journal but not post" do
      project = insert(:project)
      reader = insert(:user)
      insert(:project_member, project: project, user: reader, role: :reader)

      assert json_response(call(reader, :journal, %{"id" => project.id}), 200)

      conn =
        call(reader, :add_journal_entry, %{
          "id" => project.id,
          "journal_entry" => %{"content" => "Note"}
        })

      assert json_response(conn, 401)
    end

    test "an editor can post a journal entry" do
      project = insert(:project)
      editor = insert(:user)
      insert(:project_member, project: project, user: editor, role: :editor)

      conn =
        call(editor, :add_journal_entry, %{
          "id" => project.id,
          "journal_entry" => %{"content" => "Note"}
        })

      assert json_response(conn, 201)
    end

    test "only the entry's author can edit it (US-PROJET-10)" do
      project = insert(:project)
      author = insert(:user)
      other_editor = insert(:user)
      insert(:project_member, project: project, user: author, role: :editor)
      insert(:project_member, project: project, user: other_editor, role: :editor)
      entry = insert(:journal_entry, project: project, author: author)

      conn =
        call(other_editor, :update_journal_entry, %{
          "project_id" => project.id,
          "entry_id" => entry.id,
          "journal_entry" => %{"content" => "Hacked"}
        })

      assert json_response(conn, 403)

      conn =
        call(author, :update_journal_entry, %{
          "project_id" => project.id,
          "entry_id" => entry.id,
          "journal_entry" => %{"content" => "Fixed"}
        })

      assert %{"data" => %{"content" => "Fixed"}} = json_response(conn, 200)
    end

    test "a project admin can delete any journal entry (modération interne)" do
      project = insert(:project)
      author = insert(:user)
      project_admin = insert(:user)
      insert(:project_member, project: project, user: author, role: :editor)
      insert(:project_member, project: project, user: project_admin, role: :admin)
      entry = insert(:journal_entry, project: project, author: author)

      conn =
        call(project_admin, :delete_journal_entry, %{
          "project_id" => project.id,
          "entry_id" => entry.id
        })

      assert response(conn, 204)
    end

    test "a plain editor cannot delete another author's journal entry" do
      project = insert(:project)
      author = insert(:user)
      other_editor = insert(:user)
      insert(:project_member, project: project, user: author, role: :editor)
      insert(:project_member, project: project, user: other_editor, role: :editor)
      entry = insert(:journal_entry, project: project, author: author)

      conn =
        call(other_editor, :delete_journal_entry, %{
          "project_id" => project.id,
          "entry_id" => entry.id
        })

      assert json_response(conn, 401)
    end
  end
end
