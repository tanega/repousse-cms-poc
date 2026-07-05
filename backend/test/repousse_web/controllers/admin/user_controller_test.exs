defmodule RepousseWeb.Admin.UserControllerTest do
  use RepousseWeb.ConnCase, async: true

  import Repousse.Factory

  alias Repousse.Accounts
  alias RepousseWeb.Admin.UserController

  setup do
    Application.put_env(:repousse, :hanko_admin_module, Repousse.Test.FakeHankoAdmin)
    on_exit(fn -> Application.delete_env(:repousse, :hanko_admin_module) end)
    :ok
  end

  # Controllers are gated first by `RequireRolePlug` (role: :admin) at the
  # router level, then by `Bodyguard.permit(Accounts.Policy, ...)` inside the
  # action itself for the finer-grained superadmin-only checks. These tests
  # exercise the controller directly (bypassing the Hanko JWT pipeline, same
  # pattern as `RequireRolePlugTest`) to cover that inner Bodyguard gate.
  defp dispatch(action, user, params \\ %{}) do
    build_conn()
    |> Plug.Conn.assign(:current_user, user)
    |> Map.put(:params, params)
    |> UserController.call(action)
  end

  describe "index/2" do
    test "member is rejected" do
      member = insert(:user, role: :member)
      conn = dispatch(:index, member)
      assert conn.status == 401
    end

    test "admin can list users" do
      admin = insert(:user, role: :admin)
      conn = dispatch(:index, admin)
      assert conn.status == 200
    end

    test "superadmin can list users" do
      superadmin = insert(:user, role: :superadmin)
      conn = dispatch(:index, superadmin)
      assert conn.status == 200
    end
  end

  describe "show/2" do
    test "member is rejected" do
      member = insert(:user, role: :member)
      target = insert(:user)
      conn = dispatch(:show, member, %{"id" => target.id})
      assert conn.status == 401
    end

    test "admin can show a user" do
      admin = insert(:user, role: :admin)
      target = insert(:user)
      conn = dispatch(:show, admin, %{"id" => target.id})
      assert conn.status == 200
    end
  end

  describe "create/2 — epic-02 US-AUTH-10" do
    test "member cannot create a user" do
      member = insert(:user, role: :member)
      conn = dispatch(:create, member, %{"user" => %{"email" => "new@example.com"}})
      assert conn.status == 401
    end

    test "admin can create a plain member account" do
      admin = insert(:user, role: :admin)
      conn = dispatch(:create, admin, %{"user" => %{"email" => "new-member@example.com"}})

      assert conn.status == 201
      created = Accounts.get_user_by_email("new-member@example.com")
      assert created.role == :member
    end

    # "Un Admin ne peut pas créer un compte superadmin ni admin"
    test "admin cannot create an admin account" do
      admin = insert(:user, role: :admin)

      conn =
        dispatch(:create, admin, %{
          "user" => %{"email" => "wannabe-admin@example.com", "role" => "admin"}
        })

      assert conn.status == 401
      refute Accounts.get_user_by_email("wannabe-admin@example.com")
    end

    test "admin cannot create a superadmin account" do
      admin = insert(:user, role: :admin)

      conn =
        dispatch(:create, admin, %{
          "user" => %{"email" => "wannabe-superadmin@example.com", "role" => "superadmin"}
        })

      assert conn.status == 401
      refute Accounts.get_user_by_email("wannabe-superadmin@example.com")
    end

    test "superadmin can create an admin account, and the role is applied" do
      superadmin = insert(:user, role: :superadmin)

      conn =
        dispatch(:create, superadmin, %{
          "user" => %{"email" => "new-admin@example.com", "role" => "admin"}
        })

      assert conn.status == 201
      created = Accounts.get_user_by_email("new-admin@example.com")
      assert created.role == :admin

      assert [log] = Accounts.list_role_audit_logs(created.id)
      assert log.granted_by_id == superadmin.id
      assert log.new_role == :admin
    end

    test "creating a user never sets role through generic attrs (only via the explicit escalation path)" do
      admin = insert(:user, role: :admin)

      conn =
        dispatch(:create, admin, %{
          "user" => %{"email" => "sneaky@example.com", "role" => "not-a-real-role"}
        })

      # Unparseable role string => treated as no elevation requested, plain
      # member account created (User.changeset/2 never casts :role anyway).
      assert conn.status == 201
      created = Accounts.get_user_by_email("sneaky@example.com")
      assert created.role == :member
    end
  end

  describe "update/2" do
    test "member is rejected" do
      member = insert(:user, role: :member)
      target = insert(:user)
      conn = dispatch(:update, member, %{"id" => target.id, "user" => %{"first_name" => "New"}})
      assert conn.status == 401
    end

    test "admin can update a user but cannot escalate role via generic attrs" do
      admin = insert(:user, role: :admin)
      target = insert(:user, role: :member)

      conn =
        dispatch(:update, admin, %{
          "id" => target.id,
          "user" => %{"first_name" => "New", "role" => "superadmin"}
        })

      assert conn.status == 200
      updated = Accounts.get_user!(target.id)
      assert updated.first_name == "New"
      assert updated.role == :member
    end
  end

  describe "delete/2" do
    test "member is rejected" do
      member = insert(:user, role: :member)
      target = insert(:user)
      conn = dispatch(:delete, member, %{"id" => target.id})
      assert conn.status == 401
    end

    test "admin can delete a user" do
      admin = insert(:user, role: :admin)
      target = insert(:user)
      conn = dispatch(:delete, admin, %{"id" => target.id})
      assert conn.status == 204
    end
  end

  describe "suspend/2 and activate/2" do
    test "member is rejected from suspending" do
      member = insert(:user, role: :member)
      target = insert(:user)
      conn = dispatch(:suspend, member, %{"id" => target.id})
      assert conn.status == 401
    end

    test "admin can suspend and reactivate a user" do
      admin = insert(:user, role: :admin)
      target = insert(:user, status: :active)

      conn = dispatch(:suspend, admin, %{"id" => target.id})
      assert conn.status == 200
      assert Accounts.get_user!(target.id).status == :suspended

      conn = dispatch(:activate, admin, %{"id" => target.id})
      assert conn.status == 200
      assert Accounts.get_user!(target.id).status == :active
    end
  end

  describe "assign_role/2 — epic-02 US-AUTH-11" do
    test "member cannot assign roles" do
      member = insert(:user, role: :member)
      target = insert(:user)
      conn = dispatch(:assign_role, member, %{"id" => target.id, "role" => "admin"})
      assert conn.status == 401
    end

    test "admin (non-superadmin) cannot assign roles" do
      admin = insert(:user, role: :admin)
      target = insert(:user)
      conn = dispatch(:assign_role, admin, %{"id" => target.id, "role" => "admin"})
      assert conn.status == 401
    end

    test "superadmin can promote a member to admin" do
      superadmin = insert(:user, role: :superadmin)
      target = insert(:user, role: :member)

      conn = dispatch(:assign_role, superadmin, %{"id" => target.id, "role" => "admin"})
      assert conn.status == 200
      assert Accounts.get_user!(target.id).role == :admin

      assert [log] = Accounts.list_role_audit_logs(target.id)
      assert log.granted_by_id == superadmin.id
    end

    test "superadmin can revoke back to member" do
      superadmin = insert(:user, role: :superadmin)
      target = insert(:user, role: :admin)

      conn = dispatch(:assign_role, superadmin, %{"id" => target.id, "role" => "member"})
      assert conn.status == 200
      assert Accounts.get_user!(target.id).role == :member
    end

    test "rejects an unknown role with 422" do
      superadmin = insert(:user, role: :superadmin)
      target = insert(:user)

      conn = dispatch(:assign_role, superadmin, %{"id" => target.id, "role" => "owner"})
      assert conn.status == 422
    end

    # "Un superadmin ne peut pas se révoquer lui-même (au moins un superadmin actif requis)"
    test "refuses to demote the last superadmin, returns 409" do
      last_superadmin = insert(:user, role: :superadmin)

      conn =
        dispatch(:assign_role, last_superadmin, %{"id" => last_superadmin.id, "role" => "admin"})

      assert conn.status == 409
      assert Accounts.get_user!(last_superadmin.id).role == :superadmin
    end
  end
end
