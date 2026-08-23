defmodule RepousseWeb.ProjectControllerTest do
  use RepousseWeb.ConnCase, async: false

  import Repousse.Factory

  alias Repousse.AuthHelper
  alias Repousse.Projects

  @table :hanko_jwks

  setup %{conn: conn} do
    {private_map, public_map} = AuthHelper.generate_jwk()
    :ets.insert(@table, {:keys, [public_map]})
    on_exit(fn -> :ets.delete_all_objects(@table) end)

    %{conn: conn, private_map: private_map}
  end

  defp authed(conn, user, private_map) do
    Plug.Conn.put_req_header(conn, "authorization", "Bearer #{AuthHelper.sign(user, private_map)}")
  end

  describe "POST /projects" do
    test "creates a project with preferred species", %{conn: conn, private_map: pm} do
      user = insert(:user)
      taxon = insert(:taxon)

      conn =
        conn
        |> authed(user, pm)
        |> post(~p"/api/v1/projects", %{
          "project" => %{
            "name" => "Verger du parc",
            "preferred_species" => [%{"taxon_id" => taxon.id}]
          }
        })

      assert %{"data" => %{"name" => "Verger du parc", "preferred_species" => [species]}} =
               json_response(conn, 201)

      assert species["taxon_id"] == taxon.id
    end
  end

  describe "PUT /projects/:id" do
    test "replaces preferred species on update", %{conn: conn, private_map: pm} do
      user = insert(:user)
      taxon_a = insert(:taxon)
      taxon_b = insert(:taxon)
      authed_conn = authed(conn, user, pm)

      create_conn =
        post(authed_conn, ~p"/api/v1/projects", %{
          "project" => %{"name" => "Verger", "preferred_species" => [%{"taxon_id" => taxon_a.id}]}
        })

      assert %{"data" => %{"id" => project_id}} = json_response(create_conn, 201)

      update_conn =
        put(authed_conn, ~p"/api/v1/projects/#{project_id}", %{
          "project" => %{"preferred_species" => [%{"taxon_id" => taxon_b.id}]}
        })

      assert %{"data" => %{"preferred_species" => [species]}} = json_response(update_conn, 200)
      assert species["taxon_id"] == taxon_b.id
    end
  end

  describe "GET /projects" do
    test "excludes archived projects", %{conn: conn, private_map: pm} do
      user = insert(:user)
      active = insert(:project)
      archived = insert(:project)
      insert(:project_member, project: active, user: user, role: :admin)
      insert(:project_member, project: archived, user: user, role: :admin)
      {:ok, _} = Projects.archive_project(archived)

      conn = conn |> authed(user, pm) |> get(~p"/api/v1/projects")

      assert %{"data" => projects} = json_response(conn, 200)
      assert [%{"id" => id}] = projects
      assert id == active.id
    end
  end

  describe "DELETE /projects/:id (archive)" do
    test "archives the project", %{conn: conn, private_map: pm} do
      user = insert(:user)
      project = insert(:project)
      insert(:project_member, project: project, user: user, role: :admin)

      conn = conn |> authed(user, pm) |> delete(~p"/api/v1/projects/#{project.id}")

      assert %{"data" => %{"archived_at" => archived_at}} = json_response(conn, 200)
      refute is_nil(archived_at)
    end
  end

  describe "GET /projects/:id/members" do
    test "a member can list the project's members", %{conn: conn, private_map: pm} do
      user = insert(:user)
      other = insert(:user)
      project = insert(:project, publication_status: :private)
      insert(:project_member, project: project, user: user, role: :reader)
      insert(:project_member, project: project, user: other, role: :admin)

      conn = conn |> authed(user, pm) |> get(~p"/api/v1/projects/#{project.id}/members")

      assert %{"data" => members} = json_response(conn, 200)
      assert length(members) == 2
    end

    test "an outsider cannot list members of a private project", %{conn: conn, private_map: pm} do
      outsider = insert(:user)
      project = insert(:project, publication_status: :private)

      conn = conn |> authed(outsider, pm) |> get(~p"/api/v1/projects/#{project.id}/members")

      assert json_response(conn, 401)
    end
  end

  describe "POST /projects/:id/invitations" do
    test "an admin member can invite by email", %{conn: conn, private_map: pm} do
      admin = insert(:user)
      project = insert(:project)
      insert(:project_member, project: project, user: admin, role: :admin)

      conn =
        conn
        |> authed(admin, pm)
        |> post(~p"/api/v1/projects/#{project.id}/invitations", %{
          "invitation" => %{"email" => "invitee@example.com", "role" => "editor"}
        })

      assert %{"data" => %{"email" => "invitee@example.com", "role" => "editor"}} =
               json_response(conn, 201)
    end

    test "a reader cannot invite", %{conn: conn, private_map: pm} do
      reader = insert(:user)
      project = insert(:project)
      insert(:project_member, project: project, user: reader, role: :reader)

      conn =
        conn
        |> authed(reader, pm)
        |> post(~p"/api/v1/projects/#{project.id}/invitations", %{
          "invitation" => %{"email" => "invitee@example.com"}
        })

      assert json_response(conn, 401)
    end
  end

  describe "PUT /projects/:id/members/:user_id" do
    test "an admin can change a member's role", %{conn: conn, private_map: pm} do
      admin = insert(:user)
      member = insert(:user)
      project = insert(:project)
      insert(:project_member, project: project, user: admin, role: :admin)
      insert(:project_member, project: project, user: member, role: :reader)

      conn =
        conn
        |> authed(admin, pm)
        |> put(~p"/api/v1/projects/#{project.id}/members/#{member.id}", %{
          "member" => %{"role" => "editor"}
        })

      assert %{"data" => %{"role" => "editor"}} = json_response(conn, 200)
    end

    test "an editor cannot change a member's role", %{conn: conn, private_map: pm} do
      editor = insert(:user)
      member = insert(:user)
      project = insert(:project)
      insert(:project_member, project: project, user: editor, role: :editor)
      insert(:project_member, project: project, user: member, role: :reader)

      conn =
        conn
        |> authed(editor, pm)
        |> put(~p"/api/v1/projects/#{project.id}/members/#{member.id}", %{
          "member" => %{"role" => "editor"}
        })

      assert json_response(conn, 401)
    end
  end

  describe "DELETE /projects/:id/members/:user_id" do
    test "an admin can remove a member", %{conn: conn, private_map: pm} do
      admin = insert(:user)
      member = insert(:user)
      project = insert(:project)
      insert(:project_member, project: project, user: admin, role: :admin)
      insert(:project_member, project: project, user: member, role: :reader)

      conn =
        conn
        |> authed(admin, pm)
        |> delete(~p"/api/v1/projects/#{project.id}/members/#{member.id}")

      assert response(conn, 204)
      assert Projects.get_member_role(project.id, member.id) == nil
    end
  end

  describe "POST /projects/:id/media" do
    test "an editor can add media", %{conn: conn, private_map: pm} do
      editor = insert(:user)
      project = insert(:project)
      insert(:project_member, project: project, user: editor, role: :editor)

      conn =
        conn
        |> authed(editor, pm)
        |> post(~p"/api/v1/projects/#{project.id}/media", %{
          "media" => %{
            "file_type" => "photo",
            "mime_type" => "image/jpeg",
            "url" => "https://example.com/photo.jpg",
            "filename" => "photo.jpg",
            "size_bytes" => 1024
          }
        })

      assert %{"data" => %{"filename" => "photo.jpg"}} = json_response(conn, 201)
    end

    test "a reader cannot add media", %{conn: conn, private_map: pm} do
      reader = insert(:user)
      project = insert(:project)
      insert(:project_member, project: project, user: reader, role: :reader)

      conn =
        conn
        |> authed(reader, pm)
        |> post(~p"/api/v1/projects/#{project.id}/media", %{
          "media" => %{
            "file_type" => "photo",
            "mime_type" => "image/jpeg",
            "url" => "https://example.com/photo.jpg",
            "filename" => "photo.jpg",
            "size_bytes" => 1024
          }
        })

      assert json_response(conn, 401)
    end
  end

  describe "DELETE /projects/:id/media/:media_id" do
    test "an admin can delete media", %{conn: conn, private_map: pm} do
      admin = insert(:user)
      project = insert(:project)
      insert(:project_member, project: project, user: admin, role: :admin)

      {:ok, media} =
        Projects.add_media(project.id, admin.id, %{
          "file_type" => "photo",
          "mime_type" => "image/jpeg",
          "url" => "https://example.com/photo.jpg",
          "filename" => "photo.jpg",
          "size_bytes" => 1024
        })

      conn =
        conn
        |> authed(admin, pm)
        |> delete(~p"/api/v1/projects/#{project.id}/media/#{media.id}")

      assert response(conn, 204)
    end
  end

  describe "GET /projects/:id/distribution_reservations" do
    test "a member can list confirmed distribution reservations for the project", %{conn: conn, private_map: pm} do
      member = insert(:user)
      project = insert(:project)
      insert(:project_member, project: project, user: member, role: :reader)
      insert(:reservation, project: project, status: :confirmed)
      insert(:reservation, project: project, status: :cancelled)

      conn = conn |> authed(member, pm) |> get(~p"/api/v1/projects/#{project.id}/distribution_reservations")

      assert %{"data" => [%{"status" => "confirmed"}]} = json_response(conn, 200)
    end
  end

  describe "GET /projects/:id/journal" do
    test "a member can list journal entries", %{conn: conn, private_map: pm} do
      member = insert(:user)
      project = insert(:project)
      insert(:project_member, project: project, user: member, role: :reader)
      {:ok, _} = Projects.create_journal_entry(project.id, member.id, %{"content" => "Entry one"})

      conn = conn |> authed(member, pm) |> get(~p"/api/v1/projects/#{project.id}/journal")

      assert %{"data" => [%{"content" => "Entry one"}]} = json_response(conn, 200)
    end
  end

  describe "POST /projects/:id/journal" do
    test "an editor can add a journal entry", %{conn: conn, private_map: pm} do
      editor = insert(:user)
      project = insert(:project)
      insert(:project_member, project: project, user: editor, role: :editor)

      conn =
        conn
        |> authed(editor, pm)
        |> post(~p"/api/v1/projects/#{project.id}/journal", %{
          "journal_entry" => %{"content" => "Planted new seeds"}
        })

      assert %{"data" => %{"content" => "Planted new seeds"}} = json_response(conn, 201)
    end

    test "a reader cannot add a journal entry", %{conn: conn, private_map: pm} do
      reader = insert(:user)
      project = insert(:project)
      insert(:project_member, project: project, user: reader, role: :reader)

      conn =
        conn
        |> authed(reader, pm)
        |> post(~p"/api/v1/projects/#{project.id}/journal", %{
          "journal_entry" => %{"content" => "Planted new seeds"}
        })

      assert json_response(conn, 401)
    end
  end

  describe "PUT /projects/:project_id/journal/:entry_id" do
    test "the author can update their own entry", %{conn: conn, private_map: pm} do
      author = insert(:user)
      project = insert(:project)
      insert(:project_member, project: project, user: author, role: :editor)
      {:ok, entry} = Projects.create_journal_entry(project.id, author.id, %{"content" => "Original"})

      conn =
        conn
        |> authed(author, pm)
        |> put(~p"/api/v1/projects/#{project.id}/journal/#{entry.id}", %{
          "journal_entry" => %{"content" => "Updated"}
        })

      assert %{"data" => %{"content" => "Updated"}} = json_response(conn, 200)
    end

    test "another member cannot update someone else's entry", %{conn: conn, private_map: pm} do
      author = insert(:user)
      other = insert(:user)
      project = insert(:project)
      insert(:project_member, project: project, user: author, role: :editor)
      insert(:project_member, project: project, user: other, role: :admin)
      {:ok, entry} = Projects.create_journal_entry(project.id, author.id, %{"content" => "Original"})

      conn =
        conn
        |> authed(other, pm)
        |> put(~p"/api/v1/projects/#{project.id}/journal/#{entry.id}", %{
          "journal_entry" => %{"content" => "Hijacked"}
        })

      assert json_response(conn, 403)
    end
  end

  describe "DELETE /projects/:project_id/journal/:entry_id" do
    test "the author can delete their own entry", %{conn: conn, private_map: pm} do
      author = insert(:user)
      project = insert(:project)
      insert(:project_member, project: project, user: author, role: :editor)
      {:ok, entry} = Projects.create_journal_entry(project.id, author.id, %{"content" => "Original"})

      conn =
        conn
        |> authed(author, pm)
        |> delete(~p"/api/v1/projects/#{project.id}/journal/#{entry.id}")

      assert response(conn, 204)
    end
  end
end
